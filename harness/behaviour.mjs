// Gate 2, on the built screen: run on every pull request that touches a screen or the spec.
// For each eval row in spec/screens/<screen>.md, it builds the screen with those facts, opens it in headless
// Chromium and checks what shows against the state the row names. Each failure names the check, the eval and where.
// Usage: npm run behaviour
import { createRequire } from 'node:module';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { dialogShown, dsPath, list, readSpec, root, notBuiltYet } from './spec.mjs';
import { renderExamples, out } from './render.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const ds = dsPath;

/** Fills the {words} of a screen's text with the words the screen module gives for one eval row. */
const fill = (text, words) => text.replace(/\{([a-z]+)\}/g, (m, w) => words?.[w] ?? m);

function readPage() {
  const text = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
  const root = document.querySelector('[data-state]');
  const dialog = document.querySelector('.dialog-backdrop:not([hidden]) .dialog');
  const badge = document.querySelector('.page-header .badge');
  const banner = document.querySelector('.banner');
  const scope = dialog ?? document.querySelector('.page-header__actions');
  const buttons = scope ? [...scope.querySelectorAll('button.btn')].map(b => ({ label: text(b), variant: [...b.classList].find(c => c.startsWith('btn--'))?.slice(5), disabled: b.disabled })) : [];
  return {
    state: root?.dataset.state ?? null,
    template: document.querySelector('[data-template]')?.dataset.template ?? null,
    badge: badge ? { tone: [...badge.classList].find(c => c.startsWith('badge--'))?.slice(7) ?? 'none', text: text(badge) } : null,
    banner: banner ? { tone: [...banner.classList].find(c => c.startsWith('banner--'))?.slice(8) ?? 'info', text: text(banner) } : null,
    dialog: dialog ? text(dialog.querySelector('.dialog__title')) : null,
    buttons, body: text(document.body),
  };
}

export async function checkBehaviour() {
  const spec = readSpec();
  const fails = [];
  let checked = 0;
  rmSync(out, { recursive: true, force: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const waiting = notBuiltYet(spec);
  for (const screen of spec.screens) {
    if (screen.notBuilt) continue;
    const where = `${screen.file}, screens/${screen.name}.tsx`;
    const fail = (id, ex, what) => fails.push(`${id} ${ex} (${what})  ← ${where}`);
    const pages = await renderExamples(screen, join(out, 'pages'), `../../${ds}`);
    if (!pages) { fails.push(`BEH-01 (no screens/${screen.name}.tsx for the spec)  ← ${screen.file}`); continue; }

    // BEH-08: the code knows only the states the spec has.
    const code = readFileSync(join(root, 'src', `${screen.name}.ts`), 'utf8');
    const inCode = new Set(code.match(/\b(?:ST|DL)-\d{2}\b/g) ?? []);
    const inSpec = new Set([...screen.states, ...screen.dialogs].map(s => s.id));
    for (const id of inCode) if (!inSpec.has(id)) fail('BEH-08', 'code', `the code has ${id}, which the spec does not`);
    // BEH-09: every rule the screen's states apply is named, by ID, where the code applies it. A rule nobody can
    // find in the code cannot be found again when it changes.
    const view = join(root, 'screens', `${screen.name}.tsx`);
    const both = code + (existsSync(view) ? readFileSync(view, 'utf8') : '');
    for (const id of new Set([...screen.states, ...screen.dialogs].flatMap(s => s.rules))) if (!new RegExp(`\\b${id}\\b`).test(both)) fail('BEH-09', 'code', `${id} is applied by a state, and named nowhere in src/${screen.name}.ts or screens/${screen.name}.tsx`);
    // ...and the code names no rule or decision the spec no longer has: a deleted rule, or a replaced decision.
    const live = new Set([...spec.rules.map(r => r.ID), ...spec.decisions.map(d => d.ID)]);
    for (const id of new Set(both.match(/\b(?:BR|D)-\d{2}\b/g) ?? [])) if (!live.has(id)) fail('BEH-09', 'code', `the code names ${id}, which is not a live rule or decision in the spec`);

    for (const { row, file, logic, words } of pages) {
      checked++;
      const ex = row.Eval;
      if (!words) { fail('BEH-06', ex, `screens/${screen.name}.tsx exports no words(), so the spec's {words} cannot be filled`); continue; }
      const want = screen.states.find(s => s.id === row.State);
      // A dialog is a layer: the state under it keeps its status and banner; the buttons are the dialog's.
      const dlg = dialogShown(screen, row);
      const written = (row.Written ?? '-') !== '-';
      // BEH-07: the rules, before anything is drawn: due date, state and actions from the code alone.
      if (logic.due !== row.Due) fail('BEH-07', ex, `due date ${logic.due}, the spec says ${row.Due}`);
      if (logic.state !== row.State) fail('BEH-07', ex, `state ${logic.state}, the spec says ${row.State}`);
      if ((logic.dialog ?? null) !== (dlg?.id ?? null)) fail('BEH-07', ex, `dialog ${logic.dialog ?? 'none'}, the spec says ${dlg?.id ?? 'none'}`);
      const wantLabels = list(row.Actions);
      if (logic.actions.join(', ') !== wantLabels.join(', ')) fail('BEH-07', ex, `actions "${logic.actions.join(', ')}", the spec says "${wantLabels.join(', ')}"`);

      await page.goto(pathToFileURL(file).href);
      const got = await page.evaluate(readPage);
      // BEH-01: the screen shows the state the spec names.
      if (got.state !== row.State) { fail('BEH-01', ex, `the screen is in ${got.state}, the spec says ${row.State}`); continue; }
      // BEH-02: the template.
      if (got.template !== screen.template) fail('BEH-02', ex, `template ${got.template}, the spec says ${screen.template}`);
      // BEH-03: the status.
      if (want.status) {
        const text = fill(want.status.text, words);
        if (!got.badge || got.badge.tone !== want.status.tone || got.badge.text !== text) fail('BEH-03', ex, `status ${got.badge ? `${got.badge.tone} "${got.badge.text}"` : 'none'}, the spec says ${want.status.tone} "${text}"`);
      } else if (got.badge) fail('BEH-03', ex, `status "${got.badge.text}", the spec says none`);
      // BEH-04: the banner.
      if (want.banner) {
        const text = fill(want.banner.text, words);
        if (!got.banner || got.banner.tone !== want.banner.tone || got.banner.text !== text) fail('BEH-04', ex, `banner ${got.banner ? `${got.banner.tone} "${got.banner.text}"` : 'none'}, the spec says ${want.banner.tone} "${text}"`);
      } else if (got.banner) fail('BEH-04', ex, `banner "${got.banner.text}", the spec says none`);
      // BEH-05: the dialog and the buttons, in order, each with its variant, disabled where the spec says.
      if ((dlg?.title ?? null) !== got.dialog) fail('BEH-05', ex, `dialog "${got.dialog ?? 'none'}", the spec says "${dlg?.title ?? 'none'}"`);
      const labels = got.buttons.map(b => b.label);
      if (labels.join(', ') !== wantLabels.join(', ')) fail('BEH-05', ex, `buttons "${labels.join(', ')}", the spec says "${wantLabels.join(', ')}"`);
      for (const b of got.buttons) {
        const a = (dlg ?? want).actions.find(x => x.label === b.label);
        const off = a && (a.disabled || (a.untilWritten && !written));
        if (a && (a.variant !== b.variant || off !== b.disabled)) fail('BEH-05', ex, `"${b.label}" is ${b.variant}${b.disabled ? ', disabled' : ''}, the spec says ${a.variant}${off ? ', disabled' : ''}`);
      }
      // BEH-06: the words that must show, and the ones that never may.
      // A line shown in every state gives way to what a state never shows.
      const always = screen.always.filter(s => !want.never.some(n => s.toLowerCase().includes(n.toLowerCase())));
      for (const s of [...always, ...want.says, ...(dlg?.asks ?? [])]) if (!got.body.includes(fill(s, words))) fail('BEH-06', ex, `"${fill(s, words)}" is missing`);
      for (const n of [...screen.never, ...want.never]) if (got.body.toLowerCase().includes(n.toLowerCase())) fail('BEH-06', ex, `shows "${n}"`);
      // What happened: each line shows once every word in it has a value, unless the state never shows it.
      for (const s of screen.happened) {
        const has = [...s.matchAll(/\{(\w+)\}/g)].every(m => words[m[1]]);
        const head = s.split('{')[0].trim();
        if (has && !want.hidesHappened && !got.body.includes(fill(s, words))) fail('BEH-06', ex, `"${fill(s, words)}" is missing`);
        if ((!has || want.hidesHappened) && head && got.body.includes(head)) fail('BEH-06', ex, `shows "${head}", which has not happened${want.hidesHappened ? ' or this state never shows' : ''}`);
      }
    }
  }
  await browser.close();
  return { fails, checked, waiting };
}

const { fails, checked, waiting } = await checkBehaviour();
console.log(`Behaviour: ${checked} evals checked.`);
if (waiting.length) console.log(`Not built yet, so not checked: ${waiting.join('; ')}. Remove the mark in the pull request that builds it.`);
if (fails.length) { console.log(fails.join('\n')); console.log(`FAIL: ${fails.length}`); process.exit(1); }
console.log('PASS: BEH-01 to BEH-09');
