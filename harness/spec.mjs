// Reads the spec folder into one object the checks and the handoff use. Nothing here judges the spec.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const specDir = join(root, 'spec');

/** The design system's folder, from "productSpec.designSystem" in package.json. Any design system with written contracts in contracts/<name>.md works for the spec check; the look check also runs its harness/score.mjs. */
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
export const dsPath = pkg.productSpec?.designSystem ?? 'node_modules/ai-ready-design-system';
export const dsDir = join(root, dsPath);

/** "product" in Applies to: a decision for the whole product, or a question that reaches every feature. */
export const PRODUCT = 'product';

/** Every markdown table in a text, as arrays of rows keyed by the header. */
export function tables(text) {
  const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith('|') || !/^\|[\s|:-]+\|$/.test(lines[i + 1].trim())) continue;
    const head = cells(lines[i]);
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      const c = cells(lines[j]);
      rows.push(Object.fromEntries(head.map((h, k) => [h, c[k] ?? ''])));
    }
    out.push(rows);
    i = j - 1;
  }
  return out;
}

function cells(line) {
  const t = line.trim();
  return t.slice(1, t.endsWith('|') ? -1 : undefined).split('|').map(c => c.trim());
}

/** "A, B, C" into a list; "-", "none" and blanks into an empty list. */
export const list = s => (s ?? '').split(',').map(x => x.trim()).filter(x => x && x !== '-' && x.toLowerCase() !== 'none');

/** Splits on commas that sit outside quotes and brackets. */
function splitTop(s) {
  const out = [];
  let depth = 0, quoted = false, cur = '';
  for (const ch of s) {
    if (ch === '"') quoted = !quoted;
    if (!quoted && ch === '(') depth++;
    if (!quoted && ch === ')') depth--;
    if (ch === ',' && !depth && !quoted) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const quoted = s => [...(s ?? '').matchAll(/"([^"]*)"/g)].map(m => m[1]);

/** "badge critical \"Overdue since {due}\"" → { tone: 'critical', text: 'Overdue since {due}' }; "none" → null */
function part(s) {
  if (!s || s.trim().toLowerCase() === 'none') return null;
  const words = s.trim().split(/\s+/);
  const isBadge = words[0] === 'badge';
  const tone = isBadge ? words[1] : words[0];
  return { tone, text: quoted(s)[0] ?? '' };
}

/** "Extend (primary, disabled), Cancel (tertiary)" → [{ label, variant, disabled, condition }] */
function actions(s) {
  if (!s || s.trim().toLowerCase() === 'none') return [];
  return splitTop(s).map(a => {
    const open = a.indexOf('(');
    const close = a.indexOf(')', open);
    const label = (open >= 0 ? a.slice(0, open) : a).trim();
    const inside = open >= 0 ? a.slice(open + 1, close).split(',').map(x => x.trim()) : [];
    return { label, variant: inside[0] ?? '', disabled: inside.includes('disabled'), condition: close >= 0 ? a.slice(close + 1).trim() : '' };
  });
}

function bullets(block) {
  const out = {};
  for (const line of block.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('- ')) continue;
    const at = t.indexOf(': ');
    if (at > 2) out[t.slice(2, at)] = t.slice(at + 2);
  }
  return out;
}

/** "- Built: not yet" marks a screen or a state the spec has merged and nobody has built yet. */
const notYet = s => /^not yet$/i.test((s ?? '').trim());

function screen(file) {
  const text = readFileSync(join(specDir, 'screens', file), 'utf8');
  const name = file.replace(/\.md$/, '');
  const top = bullets(text.split('\n## ')[0]);
  const statesText = text.split('\n## States')[1]?.split('\n## ')[0] ?? '';
  const states = statesText.split('\n### ').slice(1).map(block => {
    const [heading] = block.split('\n');
    const id = heading.split(' ')[0];
    const b = bullets(block);
    return {
      id, name: heading.slice(id.length).trim(), when: b.When ?? '',
      status: part(b.Status), banner: part(b.Banner), dialog: b.Dialog ? quoted(b.Dialog)[0] : null,
      actions: actions(b.Actions), says: quoted(b.Says), rules: list(b.Rules), goals: list(b.Goals),
      notBuilt: notYet(b.Built),
    };
  });
  const evals = tables(text.split('\n## Evals')[1] ?? '')[0] ?? [];
  return {
    name, file: `spec/screens/${file}`, title: text.split('\n')[0].replace(/^# Screen: /, ''),
    template: top.Template ?? '', roles: list(top.Roles), goals: list(top.Goals), never: list(top['Never shows']),
    notBuilt: notYet(top.Built), states, evals,
  };
}

function flow(file) {
  const text = readFileSync(join(specDir, 'flows', file), 'utf8');
  const top = bullets(text.split('\n## ')[0]);
  const steps = (tables(text.split('\n## Steps')[1] ?? '')[0] ?? []).map(r => ({
    id: r.Step, who: r.Who, what: r['What happens'], screen: r.Screen === '-' ? '' : r.Screen,
    states: list(r.States), next: r.Next, to: [...r.Next.matchAll(/F-\d{2}/g)].map(m => m[0]), ends: /\bend\b/.test(r.Next),
  }));
  // Evals for what the flow does that no screen shows, such as a message the product must never send.
  const evals = (tables(text.split('\n## Evals')[1] ?? '')[0] ?? []).map(r => ({ ...r, rules: list(r.Rules) }));
  // The feature's own decisions: they apply to this flow and the screens its steps land on, and nowhere else.
  const name = file.replace(/\.md$/, '');
  const here = [name, ...new Set(steps.map(x => x.screen).filter(Boolean))].join(', ');
  const decisions = (tables(text.split('\n## Decisions')[1] ?? '')[0] ?? []).map(r => ({ ...r, 'Applies to': here, file: `spec/flows/${file}` }));
  return {
    name: file.replace(/\.md$/, ''), file: `spec/flows/${file}`, title: text.split('\n')[0].replace(/^# Flow: /, ''),
    trigger: top.Trigger ?? '', ends: top.Ends ?? '', roles: list(top.Roles), goals: list(top.Goals), steps, evals, decisions,
  };
}

const table = file => existsSync(join(specDir, file)) ? tables(readFileSync(join(specDir, file), 'utf8'))[0] ?? [] : [];

/** What the spec marks as not built yet, in words: "request (whole screen)" or "request ST-09 (E-20, E-21)". */
export function notBuiltYet(spec) {
  return spec.screens.flatMap(s => s.notBuilt ? [`${s.name} (whole screen)`]
    : s.states.filter(st => st.notBuilt).map(st => `${s.name} ${st.id} (${s.evals.filter(e => e.State === st.id).map(e => e.Eval).join(', ') || 'no eval'})`));
}

/** A short fingerprint of a feature: its flow file and the screen files its steps land on. A spec review report
 * names it, so the spec check knows the review read this version of the feature and not an older one. */
export function featureHash(flow) {
  const files = [flow.file, ...[...new Set(flow.steps.map(x => x.screen).filter(Boolean))].sort().map(s => `spec/screens/${s}.md`)];
  const h = createHash('sha256');
  for (const f of files) if (existsSync(join(root, f))) h.update(readFileSync(join(root, f), 'utf8'));
  return h.digest('hex').slice(0, 12);
}

/** The whole spec. */
export function readSpec() {
  const sources = readdirSync(join(specDir, 'sources')).filter(f => f.endsWith('.md') && f !== 'README.md')
    .flatMap(f => (tables(readFileSync(join(specDir, 'sources', f), 'utf8'))[0] ?? []).map(r => ({ ...r, file: `spec/sources/${f}` })));
  const flows = readdirSync(join(specDir, 'flows')).filter(f => f.endsWith('.md')).sort().map(flow);
  return {
    goals: table('goals.md'), roles: table('roles.md'), rules: table('rules.md'),
    // Product decisions in decisions.md, then each feature's own decisions, from its flow file.
    decisions: [...table('decisions.md').map(r => ({ ...r, file: 'spec/decisions.md' })), ...flows.flatMap(f => f.decisions)],
    replaced: table('decisions-replaced.md'),
    questions: table('questions.md'), glossary: table('glossary.md'), sources,
    flows,
    screens: readdirSync(join(specDir, 'screens')).filter(f => f.endsWith('.md')).sort().map(screen),
  };
}
