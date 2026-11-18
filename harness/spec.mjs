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

/** A business rule's Level, from rules.md: "product" holds on every screen of the product, "feature: <flow>" on
 * every screen of that flow, and an empty Level holds only on the screens its Where names. A screen does not
 * repeat an inherited rule: Where names only the screens where the rule shows something of its own. */
export function ruleLevel(rule) {
  const text = (rule.Level ?? '').trim();
  if (!text) return { level: '' };
  if (text === PRODUCT) return { level: PRODUCT };
  const [kind, ...rest] = text.split(':');
  if (kind.trim() === 'feature' && rest.length) return { level: 'feature', flow: rest.join(':').trim() };
  return { level: 'unknown', text };
}

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

/** "Extend (primary, disabled until written), Cancel (tertiary)" → [{ label, variant, disabled, untilWritten, condition }] */
function actions(s) {
  if (!s || s.trim().toLowerCase() === 'none') return [];
  return splitTop(s).map(a => {
    const open = a.indexOf('(');
    const close = a.indexOf(')', open);
    const label = (open >= 0 ? a.slice(0, open) : a).trim();
    const inside = open >= 0 ? a.slice(open + 1, close).split(',').map(x => x.trim()) : [];
    return {
      label, variant: inside[0] ?? '', disabled: inside.includes('disabled'), untilWritten: inside.includes('disabled until written'),
      condition: close >= 0 ? a.slice(close + 1).trim() : '',
    };
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

/** A test on an eval's facts, from words such as "Today is 0 to 7 days before Due" or "Proof asked on is set,
 * Proof received on is -". Clauses joined by commas must all hold. Returns null for words it cannot read. */
const day = d => Date.parse(`${d}T00:00:00Z`) / 86_400_000;
export function factTest(words) {
  const columns = [];
  const use = (...cols) => { columns.push(...cols); return true; };
  const clauses = splitTop(words).map(c => {
    let m;
    if ((m = c.match(/^(.+?) is set$/)) && use(m[1])) return r => r[m[1]] !== '-';
    if ((m = c.match(/^(.+?) is (\d+) to (\d+) days before (.+)$/)) && use(m[1], m[4])) return r => between(day(r[m[4]]) - day(r[m[1]]), +m[2], +m[3]);
    if ((m = c.match(/^(.+?) is more than (\d+) days before (.+)$/)) && use(m[1], m[3])) return r => day(r[m[3]]) - day(r[m[1]]) > +m[2];
    if ((m = c.match(/^(.+?) is on or before (.+)$/)) && use(m[1], m[2])) return r => day(r[m[1]]) <= day(r[m[2]]);
    if ((m = c.match(/^(.+?) is after (.+)$/)) && use(m[1], m[2])) return r => day(r[m[1]]) > day(r[m[2]]);
    if ((m = c.match(/^(.+?) is (.+)$/)) && use(m[1])) return r => r[m[1]] === m[2];
    return null;
  });
  if (!clauses.length || clauses.includes(null)) return null;
  const test = r => clauses.every(t => t(r));
  test.columns = columns;
  return test;
}
const between = (n, lo, hi) => n >= lo && n <= hi;

/** "## Conditions": what decides a screen's state. Each condition has values, and each value says how an eval's
 * facts set it. Optional: a screen without it keeps a "When:" line on each state, and SPEC-17 does not run. */
function conditions(text) {
  const rows = tables(text.split('\n## Conditions')[1]?.split('\n## ')[0] ?? '')[0] ?? [];
  const out = [];
  for (const r of rows) {
    let c = out.find(x => x.name === r.Condition);
    if (!c) out.push(c = { name: r.Condition, values: [] });
    c.values.push({ value: r.Value, facts: r["From the eval's facts"], test: factTest(r["From the eval's facts"] ?? '') });
  }
  return out;
}

function screen(file) {
  const text = readFileSync(join(specDir, 'screens', file), 'utf8');
  const name = file.replace(/\.md$/, '');
  const top = bullets(text.split('\n## ')[0]);
  const statesText = text.split('\n## States')[1]?.split('\n## ')[0] ?? '';
  const conds = conditions(text);
  // The decision table, before the first state: one row per state, in the order the states are tried; the first row
  // that matches wins. A cell holds one value, several separated by commas, or "-" for any value.
  const decision = conds.length ? (tables(statesText.split('\n### ')[0])[0] ?? []).map(r => ({
    state: (r.State ?? '').split(' ')[0],
    cells: Object.fromEntries(conds.map(c => [c.name, r[c.name] === undefined ? undefined : (r[c.name].trim() === '-' ? null : splitTop(r[c.name]))])),
  })) : [];
  const whenOf = id => {
    const row = decision.find(r => r.state === id);
    if (!row) return '';
    const set = Object.entries(row.cells).filter(([, v]) => v).map(([k, v]) => `${k} ${v.join(' or ')}`);
    return set.join(', ') || 'any';
  };
  const states = statesText.split('\n### ').slice(1).map(block => {
    const [heading] = block.split('\n');
    const id = heading.split(' ')[0];
    const b = bullets(block);
    return {
      id, name: heading.slice(id.length).trim(), when: conds.length ? whenOf(id) : (b.When ?? ''),
      status: part(b.Status), banner: part(b.Banner),
      actions: actions(b.Actions), says: quoted(b.Says), rules: list(b.Rules), goals: list(b.Goals),
      // What this state must never show: quoted text, or "what happened" for the screen's history lines.
      never: quoted(b['Never shows']), hidesHappened: /what happened/i.test(b['Never shows'] ?? ''),
      notBuilt: notYet(b.Built),
    };
  });
  // Dialogs are a layer: each opens over some states, which keep their status and banner under it. A dialog
  // shows only over the states it lists; when time moves the request to another state, the dialog closes.
  const dialogsText = text.split('\n## Dialogs')[1]?.split('\n## ')[0] ?? '';
  const dialogs = dialogsText.split('\n### ').slice(1).map(block => {
    const [heading] = block.split('\n');
    const id = heading.split(' ')[0];
    const b = bullets(block);
    return {
      id, name: heading.slice(id.length).trim(), opensFrom: b['Opens from'] ?? '', over: list(b.Over),
      title: quoted(b.Title)[0] ?? '', asks: quoted(b.Asks), actions: actions(b.Actions), closes: b['Closes when'] ?? '',
      rules: list(b.Rules), goals: list(b.Goals),
    };
  });
  const evals = tables(text.split('\n## Evals')[1] ?? '')[0] ?? [];
  return {
    name, file: `spec/screens/${file}`, title: text.split('\n')[0].replace(/^# Screen: /, ''),
    template: top.Template ?? '', roles: list(top.Roles), goals: list(top.Goals), never: list(top['Never shows']),
    always: quoted(top['Shows in every state']), happened: quoted(top['Shows when it happened']), notBuilt: notYet(top.Built), states, dialogs, evals,
    conditions: conds, decision,
  };
}

function flow(file) {
  const text = readFileSync(join(specDir, 'flows', file), 'utf8');
  const top = bullets(text.split('\n## ')[0]);
  const steps = (tables(text.split('\n## Steps')[1] ?? '')[0] ?? []).map(r => ({
    id: r.Step, who: r.Who, what: r['What happens'], screen: r.Screen === '-' ? '' : r.Screen,
    states: list(r.States), dialog: list(r.Dialog)[0] ?? '', next: r.Next, to: [...r.Next.matchAll(/F-\d{2}/g)].map(m => m[0]), ends: /\bend\b/.test(r.Next),
  }));
  // Evals for what the flow does that no screen shows, such as a message the product must never send.
  const evals = (tables(text.split('\n## Evals')[1] ?? '')[0] ?? []).map(r => ({ ...r, rules: list(r.Rules) }));
  // The feature's decisions: every decision made for this feature. Each applies to this flow and the screens its steps
  // land on, and to any other flow or screen its optional "Applies to" column names.
  const name = file.replace(/\.md$/, '');
  const here = [name, ...new Set(steps.map(x => x.screen).filter(Boolean))].join(', ');
  const decisions = (tables(text.split('\n## Decisions')[1] ?? '')[0] ?? []).map(r => ({ ...r, 'Applies to': [here, ...list(r['Applies to'])].join(', '), file: `spec/flows/${file}` }));
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

/** A fingerprint of what a feature does, without its words: each step's landing and next step, each state's and
 * dialog's buttons, citations and when it shows, the decision table's conditions and order, each decision's ID and every eval row. A change that keeps it the
 * same only rewords: the words a screen shows, a step's description, an explanation. Such a change gets a light
 * review, one run instead of three (spec/README.md, "How much review a change needs"). */
export function structureHash(spec, flow) {
  const names = new Set(flow.steps.map(x => x.screen).filter(Boolean));
  const screens = spec.screens.filter(s => names.has(s.name)).sort((a, b) => a.name.localeCompare(b.name));
  const acts = a => a.map(x => [x.label, x.variant, x.disabled, x.untilWritten, x.condition]);
  const shape = {
    steps: flow.steps.map(x => [x.id, x.who, x.screen, x.states, x.dialog, x.to, x.ends]),
    decisions: flow.decisions.map(d => d.ID), flowEvals: flow.evals.map(e => [e.Eval, e.rules]),
    screens: screens.map(s => ({
      name: s.name, roles: s.roles, goals: s.goals,
      conditions: s.conditions.map(c => [c.name, c.values.map(v => [v.value, v.facts])]), order: s.decision.map(r => r.state),
      states: s.states.map(st => [st.id, st.when, st.status?.tone ?? '', st.banner?.tone ?? '', acts(st.actions), st.rules, st.goals, st.never, st.hidesHappened]),
      dialogs: s.dialogs.map(d => [d.id, d.opensFrom, d.over, acts(d.actions), d.rules, d.goals]),
      evals: s.evals,
    })),
  };
  return createHash('sha256').update(JSON.stringify(shape)).digest('hex').slice(0, 12);
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

/** The dialog an eval row must show: the one it opens, while the row's state is one the dialog opens over and that
 * state still offers the button that opens it. When the state offers that button only under a condition ("unless
 * already extended"), the row's Actions say whether it still does: the dialog's buttons, or the state's. */
export function dialogShown(screen, row) {
  const d = screen.dialogs.find(x => x.id === row.Dialog);
  if (!d || !d.over.includes(row.State)) return null;
  const opener = screen.states.find(s => s.id === row.State)?.actions.find(a => a.label === d.opensFrom);
  if (opener?.condition && list(row.Actions).join(', ') !== d.actions.map(a => a.label).join(', ')) return null;
  return d;
}
