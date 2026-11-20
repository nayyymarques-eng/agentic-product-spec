// Prints the part of the spec one feature needs, and nothing else: its flows, its screens with every state,
// and only the rules, decisions, open questions, goals, roles, persona sheets and external rules they cite
// or that name them. The glossary comes whole, because a word means the same thing everywhere.
// Usage: npm run context <flow or screen>, such as: npm run context answer-a-request
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureHash, list, ruleLevel, structureHash, PRODUCT, readSpec, root } from './spec.mjs';

const spec = readSpec();
const want = process.argv[2];
const names = [...spec.flows.map(f => f.name), ...spec.screens.map(s => s.name)];
if (!want || !names.includes(want)) {
  console.error(`Name a flow or a screen: ${names.join(', ')}`);
  process.exit(1);
}

// The feature: a flow and the screens its steps land on, or a screen and the flows that land on it.
const flows = spec.flows.filter(f => f.name === want || f.steps.some(x => x.screen === want));
const screenNames = new Set(spec.screens.some(s => s.name === want) ? [want] : flows.flatMap(f => f.steps.map(x => x.screen).filter(Boolean)));
const screens = spec.screens.filter(s => screenNames.has(s.name));
const here = new Set([...flows.map(f => f.name), ...screens.map(s => s.name)]);

// The rules that hold here without being cited: every product rule, and the feature rules of these flows.
const inherited = spec.rules.filter(r => {
  const lv = ruleLevel(r);
  return lv.level === PRODUCT || (lv.level === 'feature' && flows.some(f => f.name === lv.flow));
});
const inheritedIds = new Set(inherited.map(r => r.ID));

// What the feature cites, then what those cite in turn, until nothing new turns up.
const ids = new Set([
  ...inheritedIds,
  ...flows.flatMap(f => [...f.roles, ...f.goals]),
  ...screens.flatMap(s => [...s.roles, ...s.goals, ...[...s.states, ...s.dialogs].flatMap(st => [...st.rules, ...st.goals])]),
  ...[...spec.decisions, ...spec.questions].filter(d => list(d['Applies to']).some(w => here.has(w) || w === 'product')).map(d => d.ID),
  ...spec.rules.filter(r => list(r.Where).some(w => here.has(w))).map(r => r.ID),
]);
const all = [...spec.goals, ...spec.roles, ...spec.rules, ...spec.decisions, ...spec.questions, ...spec.sources];
const cites = row => Object.values(row).join(' ').match(/\b(?:BR|D|Q|G|R|PRIV)-\d{2,3}\b/g) ?? [];
for (let grew = true; grew;) {
  grew = false;
  for (const row of all) if (ids.has(row.ID)) for (const id of cites(row)) if (!ids.has(id)) { ids.add(id); grew = true; }
}

const read = file => readFileSync(join(root, file), 'utf8').trim();
function rows(title, file, list, note = '') {
  const picked = list.filter(r => ids.has(r.ID));
  if (!picked.length) return '';
  const head = Object.keys(picked[0]).filter(k => k !== 'file');
  const line = c => `| ${c.join(' | ')} |`;
  return `## ${title} (from ${file})\n\n${note ? `${note}\n\n` : ''}${line(head)}\n${line(head.map(() => '---'))}\n${picked.map(r => line(head.map(h => r[h] ?? ''))).join('\n')}`;
}
function replacedRows() {
  const picked = spec.replaced.filter(r => list(r['Applies to']).some(w => here.has(w)) || ids.has(r['Replaced by']));
  if (!picked.length) return '';
  const head = Object.keys(picked[0]);
  const line = c => `| ${c.join(' | ')} |`;
  return `## Replaced decisions (from spec/decisions-replaced.md)\n\nNo longer true. Do not cite them, and do not bring one back unless you name what is new since.\n\n${line(head)}\n${line(head.map(() => '---'))}\n${picked.map(r => line(head.map(h => r[h]))).join('\n')}`;
}
const personas = spec.roles.filter(r => ids.has(r.ID)).map(r => r['Persona sheet'].replaceAll('`', '')).filter(Boolean);

const out = [
  `# Context for ${want}`,
  `Made by \`npm run context ${want}\` from the spec, which stays the only source. Read this before you build, review or test this feature. If what you need is not here, it is not decided: write the question in \`spec/questions.md\`.`,
  rows('Rules that hold here', 'spec/rules.md', inherited, 'Product rules hold on every screen, and feature rules on every screen of their flow. A screen does not repeat them, and one that does not cite them still follows them.'),
  ...flows.map(f => read(f.file)),
  ...screens.map(s => read(s.file)),
  rows('Business rules', 'spec/rules.md', spec.rules.filter(r => !inheritedIds.has(r.ID))),
  rows('Product decisions', 'spec/decisions.md', spec.decisions.filter(d => d.file === 'spec/decisions.md')),
  // Replaced decisions this feature followed, with what was learned, so an option already dropped does not come back.
  replacedRows(),
  rows('Open questions', 'spec/questions.md', spec.questions),
  rows('External rules', 'spec/sources/', spec.sources),
  rows('Goals', 'spec/goals.md', spec.goals),
  rows('Roles', 'spec/roles.md', spec.roles),
  ...personas.map(p => read(join('spec', p))),
  read('spec/glossary.md'),
  ...flows.map(f => `For a spec review report of ${f.name}:\n\nSpec hash: ${featureHash(f)}\nStructure hash: ${structureHash(spec, f)}`),
].filter(Boolean);
console.log(out.join('\n\n'));
