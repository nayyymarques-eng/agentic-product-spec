// Gate 1, on the spec itself (the flows and the screens): run on every change to spec/. Each failure names the check, what broke and where.
// Usage: npm run spec
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { dialogShown, dsDir, featureHash, list, ruleLevel, structureHash, PRODUCT, readSpec, root } from './spec.mjs';

const ds = join(dsDir, 'contracts');
const spec = readSpec();
const fails = [];
const fail = (id, what, where) => fails.push(`${id} (${what})  ← ${where}`);

// SPEC-01: every ID is well formed and used once.
const kinds = { 'G-': spec.goals, 'R-': spec.roles, 'BR-': spec.rules, 'D-': [...spec.decisions, ...spec.replaced], 'Q-': spec.questions };
const known = new Set(spec.sources.map(r => r.ID));
for (const [prefix, rows] of Object.entries(kinds)) {
  for (const r of rows) {
    if (!new RegExp(`^${prefix}\\d{2,3}$`).test(r.ID)) fail('SPEC-01', `"${r.ID}" is not ${prefix}NN`, 'spec/');
    if (known.has(r.ID)) fail('SPEC-01', `${r.ID} is used twice`, 'spec/');
    known.add(r.ID);
  }
}
for (const s of spec.screens) for (const x of [...s.states, ...s.dialogs]) {
  if (!/^(ST|DL)-\d{2,3}$/.test(x.id)) fail('SPEC-01', `"${x.id}" is not ST-NN or DL-NN`, s.file);
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
  // A Level is product, feature: <flow>, or empty.
  const lv = ruleLevel(r);
  if (lv.level === 'unknown') fail('SPEC-02', `${r.ID} has the Level "${lv.text}"; write product, feature: <flow>, or leave it empty`, 'spec/rules.md');
  if (lv.level === 'feature' && !spec.flows.some(f => f.name === lv.flow)) fail('SPEC-02', `${r.ID} is a feature rule of "${lv.flow}", which is not a flow`, 'spec/rules.md');
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

// SPEC-03: every rule is applied by a state or a dialog of each screen it names. A product or feature rule holds on
// screens it does not name too, and a screen that does not repeat it fails nothing.
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
    if (!/^F-\d{2,3}$/.test(x.id)) fail('SPEC-08', `"${x.id}" is not F-NN`, f.file);
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

// SPEC-16: a decision is decided before it merges. A Status column is optional; when a decision has one, it is
// "decided", or "proposed" until the person in Decided by approves it. A proposed decision still stops the merge,
// but it is listed apart from the errors: it is waiting for a person, not wrong.
const waitingApproval = [];
for (const d of spec.decisions) {
  const status = (d.Status ?? 'decided').trim().toLowerCase();
  if (status === 'proposed') waitingApproval.push(`SPEC-16 (${d.ID} is proposed: it merges once the person in Decided by (${d['Decided by'] || 'nobody named'}) sets its Status to decided)  ← ${d.file}`);
  else if (status !== 'decided') fail('SPEC-16', `${d.ID} has Status "${d.Status}"; it is either proposed or decided`, d.file);
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
for (const [row, file] of citing) for (const id of Object.values(row).join(' ').match(/\bD-\d{2,3}\b/g) ?? []) {
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

// SPEC-17: a screen with a decision table has a state for every situation, no row that never wins, an eval for
// every situation where two states match, and evals that land where the table says. Optional: a screen without
// "## Conditions" keeps a "When:" line on each state, and this check does not run on it.
for (const s of spec.screens.filter(x => x.conditions.length)) {
  const where = s.file;
  for (const c of s.conditions) for (const v of c.values) if (!v.test) fail('SPEC-17', `${c.name} ${v.value}: "${v.facts}" cannot be read; write it as "Column is set", "is -", "is after Column", "is on or before Column", "is more than N days before Column" or "is N to M days before Column"`, where);
  const ids = s.states.map(st => st.id);
  for (const id of ids) if (!s.decision.some(r => r.state === id)) fail('SPEC-17', `${id} has no row in the decision table`, where);
  for (const r of s.decision) {
    if (!ids.includes(r.state)) fail('SPEC-17', `the decision table has a row for ${r.state}, which is not a state`, where);
    for (const c of s.conditions) {
      const cell = r.cells[c.name];
      if (cell === undefined) fail('SPEC-17', `the decision table has no column for ${c.name}`, where);
      else for (const v of cell ?? []) if (!c.values.some(x => x.value === v)) fail('SPEC-17', `${r.state}: "${v}" is not a value of ${c.name}`, where);
    }
  }
  if (fails.some(f => f.startsWith('SPEC-17'))) continue;
  // Every situation: one value of each condition. The first row that matches wins.
  const matches = (r, sit) => s.conditions.every(c => !r.cells[c.name] || r.cells[c.name].includes(sit[c.name]));
  let situations = [{}];
  for (const c of s.conditions) situations = situations.flatMap(sit => c.values.map(v => ({ ...sit, [c.name]: v.value })));
  const words = sit => s.conditions.map(c => `${c.name} ${sit[c.name]}`).join(', ');
  const won = new Set(), pairs = new Map();
  for (const sit of situations) {
    const hit = s.decision.filter(r => matches(r, sit)).map(r => r.state);
    if (!hit.length) { fail('SPEC-17', `no state for: ${words(sit)}`, where); continue; }
    won.add(hit[0]);
    for (const other of hit.slice(1)) { const k = `${hit[0]} + ${other}`; if (!pairs.has(k)) pairs.set(k, sit); }
  }
  for (const r of s.decision) if (!won.has(r.state)) fail('SPEC-17', `${r.state} never wins: a row above it always matches first`, where);
  // Each eval: its facts set one value of each condition, and the table's state is the eval's state.
  const situationOf = e => {
    const sit = {};
    for (const c of s.conditions) {
      const missing = c.values.flatMap(v => v.test.columns).find(col => !(col in e));
      if (missing) { fail('SPEC-17', `${e.Eval}: the evals have no "${missing}" column, which ${c.name} reads`, where); return null; }
      const set = c.values.filter(v => v.test(e)).map(v => v.value);
      if (set.length !== 1) { fail('SPEC-17', `${e.Eval} sets ${set.length ? set.join(' and ') : 'no value'} of ${c.name}; its facts must set exactly one`, where); return null; }
      sit[c.name] = set[0];
    }
    return sit;
  };
  const evalSits = s.evals.map(e => [e, situationOf(e)]).filter(([, sit]) => sit);
  for (const [e, sit] of evalSits) {
    const first = s.decision.find(r => matches(r, sit))?.state ?? 'no state';
    if (first !== e.State) fail('SPEC-17', `${e.Eval}: the decision table gives ${first}, the eval says ${e.State}`, where);
  }
  for (const [k, sit] of pairs) {
    const [a, b] = k.split(' + ');
    const both = sit2 => [a, b].every(id => matches(s.decision.find(r => r.state === id), sit2));
    if (!evalSits.some(([, sit2]) => both(sit2))) fail('SPEC-17', `${a} and ${b} both match, and no eval says which wins; e.g. ${words(sit)}`, where);
  }
}

// SPEC-18: a step says where the request goes when time moves it on. A condition read from Today takes its
// values in the order the table lists them, as days pass. Each state a step lands on can move that way to
// another state; the step, or a step its Next names, lands there. Otherwise the flow has a missing step: the
// kind a review by a model tends to miss, because nothing written is wrong (reviews/misses.md).
for (const f of spec.flows) for (const x of f.steps) {
  const s = spec.screens.find(y => y.name === x.screen);
  if (!s || !s.conditions.length || !x.states.length) continue;
  const timed = s.conditions.filter(c => c.values.some(v => v.test?.columns.includes('Today')));
  if (!timed.length) continue;
  const matches = (r, sit) => s.conditions.every(c => !r.cells[c.name] || r.cells[c.name].includes(sit[c.name]));
  const first = sit => s.decision.find(r => matches(r, sit))?.state;
  let situations = [{}];
  for (const c of s.conditions) situations = situations.flatMap(sit => c.values.map(v => ({ ...sit, [c.name]: v.value })));
  const covered = new Set([...x.states, ...f.steps.filter(y => x.to.includes(y.id) && y.screen === x.screen).flatMap(y => y.states)]);
  const told = new Set();
  for (const sit of situations) {
    const from = first(sit);
    if (!x.states.includes(from)) continue;
    for (const c of timed) {
      const at = c.values.findIndex(v => v.value === sit[c.name]);
      for (const v of c.values.slice(at + 1)) {
        const to = first({ ...sit, [c.name]: v.value });
        if (!to || covered.has(to) || told.has(to)) continue;
        told.add(to);
        fail('SPEC-18', `${x.id} lands on ${from}; as days pass it becomes ${to} (${c.name} ${v.value}), and neither ${x.id} nor a step in its Next lands on ${to}`, f.file);
      }
    }
  }
}

// SPEC-14: every feature has a spec review of its current version. A review report in reviews/ names the feature's
// spec hash (npm run context prints it); a change to the flow or its screens changes the hash, so the review runs again.
// A light review, one run for a change that only rewords, counts only when the structure hash it names is the one of
// the current version and of a full review: so a light review can never stand in for a change to what the feature does.
const reports = existsSync(join(root, 'reviews')) ? readdirSync(join(root, 'reviews')).filter(f => f.endsWith('.md')).map(f => readFileSync(join(root, 'reviews', f), 'utf8')) : [];
const light = r => /^Review: light\b/m.test(r);
for (const f of spec.flows) {
  const hash = featureHash(f), shape = structureHash(spec, f);
  const named = reports.filter(r => r.includes(`Spec hash: ${hash}`));
  if (!named.length) fail('SPEC-14', `${f.name} has no spec review of this version (spec hash ${hash}); run the review and save its report in reviews/`, f.file);
  else if (named.every(light) && !(named.some(r => r.includes(`Structure hash: ${shape}`)) && reports.some(r => !light(r) && r.includes(`Structure hash: ${shape}`))))
    fail('SPEC-14', `${f.name} has only a light review of this version, but this change does more than reword (structure hash ${shape} has no full review); run the full review, three times`, f.file);
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
if (waitingApproval.length) console.log(`Waiting for approval, not an error. The check stays red until a person approves:\n${waitingApproval.join('\n')}`);
if (fails.length) { console.log(fails.join('\n')); console.log(`FAIL: ${fails.length}${waitingApproval.length ? `, and ${waitingApproval.length} waiting for approval` : ''}`); process.exit(1); }
if (waitingApproval.length) { console.log(`WAITING: no errors; ${waitingApproval.length} ${waitingApproval.length === 1 ? 'decision waits' : 'decisions wait'} for approval before this can merge.`); process.exit(1); }
console.log('PASS: SPEC-01 to SPEC-06, SPEC-08 to SPEC-18');
