// Prints the part of the spec one feature needs, and nothing else: its flows, its screens with every state,
// and only the rules, decisions, open questions, goals, roles, persona sheets and external rules they cite
// or that name them. The glossary comes whole, because a word means the same thing everywhere.
// Usage: npm run context <flow or screen>, such as: npm run context answer-a-request
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureHash, list, readSpec, root } from './spec.mjs';

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

// What the feature cites, then what those cite in turn, until nothing new turns up.
const ids = new Set([
  ...flows.flatMap(f => [...f.roles, ...f.goals]),
  ...screens.flatMap(s => [...s.roles, ...s.goals, ...s.states.flatMap(st => [...st.rules, ...st.goals])]),
  ...[...spec.decisions, ...spec.questions].filter(d => list(d['Applies to']).some(w => here.has(w) || w === 'product')).map(d => d.ID),
  ...spec.rules.filter(r => list(r.Where).some(w => here.has(w))).map(r => r.ID),
]);
const all = [...spec.goals, ...spec.roles, ...spec.rules, ...spec.decisions, ...spec.questions, ...spec.sources];
const cites = row => Object.values(row).join(' ').match(/\b(?:BR|D|Q|G|R|PRIV)-\d{2}\b/g) ?? [];
for (let grew = true; grew;) {
  grew = false;
  for (const row of all) if (ids.has(row.ID)) for (const id of cites(row)) if (!ids.has(id)) { ids.add(id); grew = true; }
}

const read = file => readFileSync(join(root, file), 'utf8').trim();
function rows(title, file, list) {
  const picked = list.filter(r => ids.has(r.ID));
  if (!picked.length) return '';
  const head = Object.keys(picked[0]).filter(k => k !== 'file');
  const line = c => `| ${c.join(' | ')} |`;
  return `## ${title} (from ${file})\n\n${line(head)}\n${line(head.map(() => '---'))}\n${picked.map(r => line(head.map(h => r[h]))).join('\n')}`;
}
const personas = spec.roles.filter(r => ids.has(r.ID)).map(r => r['Persona sheet'].replaceAll('`', '')).filter(Boolean);

const out = [
  `# Context for ${want}`,
  `Made by \`npm run context ${want}\` from the spec, which stays the only source. Read this before you build, review or test this feature. If what you need is not here, it is not decided: write the question in \`spec/questions.md\`.`,
  ...flows.map(f => read(f.file)),
  ...screens.map(s => read(s.file)),
  rows('Business rules', 'spec/rules.md', spec.rules),
  rows('Product decisions', 'spec/decisions.md', spec.decisions.filter(d => d.file === 'spec/decisions.md')),
  rows('Open questions', 'spec/questions.md', spec.questions),
  rows('External rules', 'spec/sources/', spec.sources),
  rows('Goals', 'spec/goals.md', spec.goals),
  rows('Roles', 'spec/roles.md', spec.roles),
  ...personas.map(p => read(join('spec', p))),
  read('spec/glossary.md'),
  ...flows.map(f => `Spec hash of ${f.name}, for a spec review report: ${featureHash(f)}`),
].filter(Boolean);
console.log(out.join('\n\n'));
