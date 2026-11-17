// Gate 1, on the spec itself (the flows and the screens): run on every change to spec/. Each failure names the check, what broke and where.
// Usage: npm run spec
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { dialogShown, dsDir, featureHash, list, PRODUCT, readSpec, root } from './spec.mjs';

const ds = join(dsDir, 'contracts');
const spec = readSpec();
const fails = [];
const fail = (id, what, where) => fails.push(`${id} (${what})  ← ${where}`);

// SPEC-01: every ID is well formed and used once.
const kinds = { 'G-': spec.goals, 'R-': spec.roles, 'BR-': spec.rules, 'D-': [...spec.decisions, ...spec.replaced], 'Q-': spec.questions };
const known = new Set(spec.sources.map(r => r.ID));
for (const [prefix, rows] of Object.entries(kinds)) {
  for (const r of rows) {
    if (!new RegExp(`^${prefix}\\d{2}$`).test(r.ID)) fail('SPEC-01', `"${r.ID}" is not ${prefix}NN`, 'spec/');
    if (known.has(r.ID)) fail('SPEC-01', `${r.ID} is used twice`, 'spec/');
    known.add(r.ID);
  }
}
for (const s of spec.screens) for (const x of [...s.states, ...s.dialogs]) {
  if (!/^(ST|DL)-\d{2}$/.test(x.id)) fail('SPEC-01', `"${x.id}" is not ST-NN or DL-NN`, s.file);
  if (known.has(`${s.name}:${x.id}`)) fail('SPEC-01', `${x.id} is used twice`, s.file);
  known.add(`${s.name}:${x.id}`);
}
const evalIds = new Set();
for (const e of [...spec.screens.flatMap(s => s.evals), ...spec.flows.flatMap(f => f.evals)]) {
  if (evalIds.has(e.Eval)) fail('SPEC-01', `${e.Eval} is used twice`, 'spec/');
  evalIds.add(e.Eval);
}

// SPEC-02: every source a rule cites exists, and every rule has one.
for (const r of spec.rules) {
  const cited = r.Sources.split(',').map(x => x.trim()).filter(Boolean);
  if (!cited.length) fail('SPEC-02', `${r.ID} has no source; write it in questions.md first`, 'spec/rules.md');
  for (const c of cited) if (!known.has(c)) fail('SPEC-02', `${r.ID} cites ${c}, which does not exist`, 'spec/rules.md');
}
for (const s of spec.screens) {
  for (const id of [...s.roles, ...s.goals]) if (!known.has(id)) fail('SPEC-02', `${id} does not exist`, s.file);
  for (const st of [...s.states, ...s.dialogs]) for (const id of [...st.rules, ...st.goals]) if (!known.has(id)) fail('SPEC-02', `${st.id} cites ${id}, which does not exist`, s.file);
  for (const d of s.dialogs) for (const id of d.over) if (!s.states.some(st => st.id === id)) fail('SPEC-02', `${d.id} opens over ${id}, which is not a state`, s.file);
}

// SPEC-10: every decision names the flows or screens it applies to, and they exist; every role links a persona sheet that exists.
const parts = new Set([...spec.flows.map(f => f.name), ...spec.screens.map(s => s.name)]);
for (const d of spec.decisions) {
  const where = (d['Applies to'] ?? '').split(',').map(x => x.trim()).filter(Boolean);
  if (!where.length) fail('SPEC-10', `${d.ID} names no flow or screen it applies to`, d.file);
  for (const w of where) if (w !== PRODUCT && !parts.has(w)) fail('SPEC-10', `${d.ID} applies to "${w}", which is not a flow or a screen`, d.file);
}
for (const r of spec.roles) {
  const sheet = (r['Persona sheet'] ?? '').replace(/`/g, '').trim();
  if (!sheet) fail('SPEC-10', `${r.ID} has no persona sheet`, 'spec/roles.md');
  else if (!existsSync(join(root, 'spec', sheet))) fail('SPEC-10', `${r.ID} links ${sheet}, which does not exist`, 'spec/roles.md');
}

// SPEC-03: every rule is applied by a state or a dialog of each screen it names.
for (const r of spec.rules) {
  for (const where of r.Where.split(',').map(x => x.trim()).filter(Boolean)) {
    const s = spec.screens.find(x => x.name === where);
    if (!s) { fail('SPEC-03', `${r.ID} names the screen "${where}", which has no file`, 'spec/rules.md'); continue; }
    if (![...s.states, ...s.dialogs].some(st => st.rules.includes(r.ID))) fail('SPEC-03', `${r.ID} is applied by no state or dialog of ${where}`, s.file);
  }
}

// SPEC-04: every goal is served by at least one state.
for (const g of spec.goals) if (!spec.screens.some(s => s.states.some(st => st.goals.includes(g.ID)))) fail('SPEC-04', `${g.ID} is served by no state`, 'spec/goals.md');

// SPEC-05: every template, component and variant a screen names exists in the design system.
const contract = name => join(ds, `${name}.md`);
const variants = name => {
  const text = readFileSync(contract(name), 'utf8');
  const sec = text.split('## Variants and states')[1]?.split('\n## ')[0] ?? '';
  return new Set([...sec.matchAll(/[a-z]+/g)].map(m => m[0]));
};
for (const s of spec.screens) {
  if (!existsSync(contract(s.template))) fail('SPEC-05', `template "${s.template}" is not in the design system`, s.file);
  const badge = variants('badge'), banner = variants('banner'), button = variants('button');
  for (const st of s.states) {
    if (st.status && !badge.has(st.status.tone)) fail('SPEC-05', `${st.id}: badge "${st.status.tone}" is not a badge variant`, s.file);
    if (st.banner && !banner.has(st.banner.tone)) fail('SPEC-05', `${st.id}: banner "${st.banner.tone}" is not a banner variant`, s.file);
    for (const a of st.actions) if (!button.has(a.variant)) fail('SPEC-05', `${st.id}: button "${a.variant}" is not a button variant`, s.file);
  }
  for (const d of s.dialogs) {
    if (!existsSync(contract('dialog'))) fail('SPEC-05', `${d.id}: the design system has no dialog`, s.file);
    for (const a of d.actions) if (!button.has(a.variant)) fail('SPEC-05', `${d.id}: button "${a.variant}" is not a button variant`, s.file);
  }
}

// SPEC-07: a state the spec needs and the design system does not draw goes to triage. It never blocks: the
// design system owner decides, as in ai-ready-design-system's triage.
const triage = [];
const states = name => readFileSync(contract(name), 'utf8').toLowerCase();
for (const s of spec.screens) for (const st of [...s.states, ...s.dialogs]) for (const a of st.actions) {
  if ((a.disabled || a.untilWritten) && !states('button').includes('disabled')) triage.push(`SPEC-07 ${st.id} ("${a.label}" is disabled; the button contract has no disabled state)  ← ${s.file}, contracts/button.md`);
}

// SPEC-06: every state and every dialog has at least one eval, and every eval names a state and a dialog that exist.
// A dialog needs an eval that shows it, and one where time closes it: a request it no longer opens over.
for (const s of spec.screens) {
  const ids = new Set(s.states.map(st => st.id));
  for (const st of s.states) if (!s.evals.some(e => e.State === st.id)) fail('SPEC-06', `${st.id} has no eval`, s.file);
  for (const e of s.evals) if (!ids.has(e.State)) fail('SPEC-06', `${e.Eval} names ${e.State}, which is not a state`, s.file);
  for (const e of s.evals) if (list(e.Dialog).length && !s.dialogs.some(d => d.id === e.Dialog)) fail('SPEC-06', `${e.Eval} opens ${e.Dialog}, which is not a dialog`, s.file);
  for (const d of s.dialogs) {
    if (!s.evals.some(e => dialogShown(s, e) === d)) fail('SPEC-06', `${d.id} has no eval that shows it`, s.file);
    if (!s.evals.some(e => e.Dialog === d.id && !dialogShown(s, e))) fail('SPEC-06', `${d.id} has no eval where it closes, on a state it does not open over`, s.file);
  }
}

// SPEC-15: a dialog opens from a button that every state under it offers.
for (const s of spec.screens) for (const d of s.dialogs) for (const id of d.over) {
  const st = s.states.find(x => x.id === id);
  if (st && !st.actions.some(a => a.label === d.opensFrom)) fail('SPEC-15', `${d.id} opens from "${d.opensFrom}", which ${id} does not offer`, s.file);
}

// SPEC-08: every flow starts from a trigger and ends; every step is reached, goes somewhere that exists,
// and lands on a screen state that exists.
for (const f of spec.flows) {
  if (!f.trigger) fail('SPEC-08', `${f.title} has no trigger`, f.file);
  for (const id of [...f.roles, ...f.goals]) if (!known.has(id)) fail('SPEC-08', `${id} does not exist`, f.file);
  const ids = new Set(f.steps.map(x => x.id));
  const reached = new Set(f.steps.flatMap(x => x.to));
  if (!f.steps.some(x => x.ends)) fail('SPEC-08', `${f.title} never ends`, f.file);
  f.steps.forEach((x, i) => {
    if (!/^F-\d{2}$/.test(x.id)) fail('SPEC-08', `"${x.id}" is not F-NN`, f.file);
    if (!known.has(x.who)) fail('SPEC-08', `${x.id}: ${x.who} is not a role`, f.file);
    if (i > 0 && !reached.has(x.id)) fail('SPEC-08', `${x.id} is reached by no step`, f.file);
    if (!x.to.length && !x.ends) fail('SPEC-08', `${x.id} goes nowhere`, f.file);
    for (const t of x.to) if (!ids.has(t)) fail('SPEC-08', `${x.id} goes to ${t}, which is not a step`, f.file);
    if (!x.screen) return;
    const s = spec.screens.find(y => y.name === x.screen);
    if (!s) { fail('SPEC-08', `${x.id} lands on "${x.screen}", which has no file`, f.file); return; }
    for (const st of x.states) if (!s.states.some(y => y.id === st)) fail('SPEC-08', `${x.id} lands on ${st}, which ${x.screen} does not have`, f.file);
    if (x.dialog && !s.dialogs.some(y => y.id === x.dialog)) fail('SPEC-08', `${x.id} opens ${x.dialog}, which ${x.screen} does not have`, f.file);
  });
}

// SPEC-09: every state of every screen is reached by a step of a flow. A state no flow reaches is a gap:
// a step is missing, or the state should not exist.
for (const s of spec.screens) for (const st of s.states) {
  if (!spec.flows.some(f => f.steps.some(x => x.screen === s.name && x.states.includes(st.id)))) fail('SPEC-09', `${st.id} is reached by no step of a flow`, s.file);
}
for (const s of spec.screens) for (const d of s.dialogs) {
  if (!spec.flows.some(f => f.steps.some(x => x.screen === s.name && x.dialog === d.id))) fail('SPEC-09', `${d.id} is opened by no step of a flow`, s.file);
}

// SPEC-11: nothing cites a replaced decision. Each replaced decision names the decision that replaces it.
const live = new Set(spec.decisions.map(d => d.ID));
const gone = new Map(spec.replaced.map(d => [d.ID, d]));
for (const d of spec.replaced) if (!live.has(d['Replaced by'])) fail('SPEC-11', `${d.ID} is replaced by "${d['Replaced by']}", which is not a decision`, 'spec/decisions-replaced.md');
const citing = [
  ...spec.rules.map(r => [r, 'spec/rules.md']), ...spec.decisions.filter(r => r.file === 'spec/decisions.md').map(r => [r, r.file]),
  ...spec.questions.map(r => [r, 'spec/questions.md']), ...spec.glossary.map(r => [r, 'spec/glossary.md']),
  ...[...spec.flows, ...spec.screens].map(x => [{ ID: x.name, text: readFileSync(join(root, x.file), 'utf8') }, x.file]),
];
for (const [row, file] of citing) for (const id of Object.values(row).join(' ').match(/\bD-\d{2}\b/g) ?? []) {
  if (gone.has(id)) fail('SPEC-11', `${row.ID} cites ${id}, which was replaced by ${gone.get(id)['Replaced by']}`, file);
}

// SPEC-12: an open question stays inside one feature, a flow and the screens its steps land on. A question that
// reaches further can change other features, so it is answered, as a decision, before the change merges.
const feature = f => new Set([f.name, ...f.steps.map(x => x.screen).filter(Boolean)]);
for (const q of spec.questions) {
  const where = list(q['Applies to']);
  if (!where.length) { fail('SPEC-12', `${q.ID} names no flow or screen it applies to`, 'spec/questions.md'); continue; }
  for (const w of where) if (w !== PRODUCT && !parts.has(w)) fail('SPEC-12', `${q.ID} applies to "${w}", which is not a flow or a screen`, 'spec/questions.md');
  if (where.every(w => w === PRODUCT || parts.has(w)) && !spec.flows.some(f => where.every(w => feature(f).has(w))))
    fail('SPEC-12', `${q.ID} reaches beyond one feature (${where.join(', ')}); answer it, as a decision, before this merges`, 'spec/questions.md');
}

// SPEC-13: every business rule has at least one eval: a screen eval on a state that applies it, or a flow eval
// for what no screen shows. A rule no eval tests is a hole the checks cannot see.
for (const r of spec.rules) {
  const onScreen = spec.screens.some(s => s.states.some(st => st.rules.includes(r.ID) && s.evals.some(e => e.State === st.id))
    || s.dialogs.some(d => d.rules.includes(r.ID) && s.evals.some(e => dialogShown(s, e) === d)));
  const inFlow = spec.flows.some(f => f.evals.some(e => e.rules.includes(r.ID)));
  if (!onScreen && !inFlow) fail('SPEC-13', `${r.ID} has no eval; add an eval on a state that applies it, or a flow eval`, 'spec/rules.md');
}
for (const f of spec.flows) for (const e of f.evals) {
  if (!e.Given || !e.Then) fail('SPEC-13', `${e.Eval} needs both Given and Then`, f.file);
  for (const id of e.rules) if (!spec.rules.some(r => r.ID === id)) fail('SPEC-13', `${e.Eval} cites ${id}, which is not a rule`, f.file);
}

// SPEC-14: every feature has a spec review of its current version. A review report in reviews/ names the feature's
// spec hash (npm run context prints it); a change to the flow or its screens changes the hash, so the review runs again.
const reports = existsSync(join(root, 'reviews')) ? readdirSync(join(root, 'reviews')).filter(f => f.endsWith('.md')).map(f => readFileSync(join(root, 'reviews', f), 'utf8')) : [];
for (const f of spec.flows) {
  const hash = featureHash(f);
  if (!reports.some(r => r.includes(`Spec hash: ${hash}`))) fail('SPEC-14', `${f.name} has no spec review of this version (spec hash ${hash}); run the review and save its report in reviews/`, f.file);
}

// An external rule still "to confirm" after its "Check again on" date is a warning, not a failure: someone reads
// the source text, or moves the date with a reason.
const today = new Date().toISOString().slice(0, 10);
const stale = spec.sources.filter(r => /to confirm/i.test(r.Mark ?? '') && r['Check again on'] && r['Check again on'] < today)
  .map(r => `${r.ID} is still "to confirm", and was due to be checked again on ${r['Check again on']}  ← ${r.file}`);

const counts = spec.screens.map(s => `${s.name}: ${s.states.length} states, ${s.dialogs.length} dialogs, ${s.evals.length} evals`).join('; ');
console.log(`Spec: ${spec.flows.length} flow, ${spec.rules.length} rules, ${spec.goals.length} goals, ${spec.decisions.length} decisions, ${spec.questions.length} open questions, ${spec.flows.reduce((n, f) => n + f.evals.length, 0)} flow evals. ${counts}.`);
if (stale.length) console.log(`External rules to read again:\n${stale.join('\n')}`);
if (triage.length) console.log(`To triage, for the design system owner:\n${[...new Set(triage)].join('\n')}`);
if (fails.length) { console.log(fails.join('\n')); console.log(`FAIL: ${fails.length}`); process.exit(1); }
console.log('PASS: SPEC-01 to SPEC-06, SPEC-08 to SPEC-15');
