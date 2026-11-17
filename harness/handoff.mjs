// Writes the engineering handoff for each screen, from the spec alone: handoff/<screen>.md.
// Nobody edits a handoff by hand. A change goes into the spec, and the handoff is written again.
// Usage: npm run handoff
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dialogShown, list, readSpec, root } from './spec.mjs';

const spec = readSpec();
const byId = new Map([...spec.goals, ...spec.roles, ...spec.rules, ...spec.decisions, ...spec.questions, ...spec.sources].map(r => [r.ID, r]));
const roleName = id => byId.get(id)?.Role ?? id;
const day = d => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
// The external rules still "to confirm" behind a list of business rules: a test built on them may change.
const toConfirm = ids => [...new Set(ids.flatMap(id => (byId.get(id)?.Sources ?? '').split(',').map(x => x.trim())))]
  .filter(id => /to confirm/i.test(byId.get(id)?.Mark ?? '')).sort();
// The facts of an eval row: every column except the ID, who looks, the day, an open dialog and what the screen must show.
const notFacts = new Set(['Eval', 'Viewer', 'Today', 'Dialog', 'Written', 'Due', 'State', 'Actions']);

function given(row, screen) {
  const parts = Object.keys(row).filter(f => !notFacts.has(f)).filter(f => row[f] && row[f] !== '-').map(f => `${f.toLowerCase()} ${day(row[f])}`);
  const d = screen.dialogs.find(x => x.id === row.Dialog);
  const dialog = d ? `, with the ${d.id} ${d.name} dialog opened and ${(row.Written ?? '-') !== '-' ? 'something written in it' : 'nothing written in it yet'}` : '';
  return `a request ${parts.join(', ')}, opened by the ${roleName(row.Viewer).toLowerCase()} on ${day(row.Today)}${dialog}`;
}

// The flow as a Mermaid flowchart, drawn from the steps table: GitHub shows it as a diagram.
const label = t => t.replaceAll('"', "'");
const node = id => id.replace('-', '');
function mermaid(f) {
  const out = ['```mermaid', 'flowchart TD', `  T(["${label(f.trigger)}"])`, `  T --> ${node(f.steps[0].id)}`];
  for (const x of f.steps) {
    const text = `${x.id} ${label(x.what)}${x.states.length || x.dialog ? `<br/>${[x.dialog, ...x.states].filter(Boolean).join(', ')}` : ''}`;
    out.push(x.screen ? `  ${node(x.id)}["${text}"]` : `  ${node(x.id)}{"${text}"}`);
  }
  for (const x of f.steps) {
    for (const part of x.next.split(/;|, or /).map(p => p.trim())) {
      const to = part.match(/F-\d{2}/)?.[0];
      if (!to) continue;
      const why = part.replace(to, '').replace(':', '').trim();
      out.push(why ? `  ${node(x.id)} -- "${label(why)}" --> ${node(to)}` : `  ${node(x.id)} --> ${node(to)}`);
    }
    if (x.ends) out.push(`  ${node(x.id)} --> E(["${label(f.ends)}"])`);
  }
  out.push('```');
  return out;
}

mkdirSync(join(root, 'handoff'), { recursive: true });
for (const s of spec.screens) {
  const flowsHere = spec.flows.filter(f => f.steps.some(x => x.screen === s.name));
  const rules = [...new Set([...s.states.flatMap(st => st.rules), ...s.dialogs.flatMap(d => d.rules), ...flowsHere.flatMap(f => f.evals.flatMap(e => e.rules))])].sort().map(id => byId.get(id));
  const cited = new Set(rules.flatMap(r => r.Sources.split(',').map(x => x.trim())));
  const lines = [
    `# Handoff: ${s.title}`,
    '',
    `Written by \`npm run handoff\` from \`${s.file}\` and the files it cites. Do not edit it: change the spec and run it again.`,
    '',
    '## The screen',
    '',
    `- Template: ${s.template} (ai-ready-design-system, \`contracts/${s.template}.md\`)`,
    `- Used by: ${s.roles.map(r => `${roleName(r)} (${r})`).join(', ')}`,
    `- Goals: ${s.goals.map(g => `${byId.get(g).Goal} (${g})`).join('; ')}`,
    `- Never shows: ${s.never.join(', ')}`,
    ...(s.notBuilt ? ['- Not built yet: the screen is in the spec, and nobody has built it.'] : s.states.some(st => st.notBuilt) ? [`- Not built yet: ${s.states.filter(st => st.notBuilt).map(st => st.id).join(', ')}. The backend can build them now; the screen comes later.`] : []),
    '',
    ...spec.flows.filter(f => f.steps.some(x => x.screen === s.name)).flatMap(f => [
      `## Flow: ${f.title}`,
      '',
      `From \`${f.file}\`. Starts when ${f.trigger}. Each box names the states of this screen it lands on.`,
      '',
      ...mermaid(f),
      '',
    ]),
    '## Rules',
    '',
    'Each rule is a requirement. Its sources say why, so a change upstream finds this screen.',
    '',
    '| ID | Rule | Sources |',
    '|---|---|---|',
    ...rules.map(r => `| ${r.ID} | ${r.Rule} | ${r.Sources} |`),
    '',
    '## States',
    '',
    'When two states could apply, the first one wins.',
    '',
    '| ID | State | When | Status | Actions |',
    '|---|---|---|---|---|',
    ...s.states.map(st => `| ${st.id} | ${st.name}${st.notBuilt ? ' (not built yet)' : ''} | ${st.when} | ${st.status ? `${st.status.tone}: "${st.status.text}"` : 'none'} | ${st.actions.length ? st.actions.map(a => `${a.label} (${a.variant}${a.disabled ? ', disabled' : ''})${a.condition ? ` ${a.condition}` : ''}`).join(', ') : 'none'} |`),
    '',
    '## Dialogs',
    '',
    'A dialog opens over a state, which keeps its status and banner. It shows only over the states it lists, and closes when the request moves to another.',
    '',
    '| ID | Dialog | Opens from | Over | Asks | Actions | Closes when |',
    '|---|---|---|---|---|---|---|',
    ...s.dialogs.map(d => `| ${d.id} | ${d.title} | ${d.opensFrom} | ${d.over.join(', ')} | ${d.asks.join('; ')} | ${d.actions.map(a => `${a.label} (${a.variant}${a.untilWritten ? ', disabled until written' : a.disabled ? ', disabled' : ''})`).join(', ')} | ${d.closes} |`),
    '',
    '## Acceptance tests',
    '',
    `One per eval in the spec. \`npm run behaviour\` runs the screen's evals against the built screen.`,
    '',
    ...s.evals.flatMap(e => {
      const st = s.states.find(x => x.id === e.State);
      const acts = list(e.Actions);
      const unsure = toConfirm(st?.rules ?? []);
      const d = dialogShown(s, e);
      const opened = s.dialogs.find(x => x.id === e.Dialog);
      const shown = d ? `, the ${d.id} dialog shows over it` : opened ? `, the ${opened.id} dialog has closed` : '';
      return [`- **${e.Eval}.** Given ${given(e, s)}. Then the due date is ${day(e.Due)}, the screen is in ${e.State} ${st?.name ?? ''}${shown}, and it offers ${acts.length ? acts.join(', ') : 'no action'}.${unsure.length ? ` Rests on external rules still to confirm: ${unsure.join(', ')}.` : ''}`];
    }),
    ...spec.flows.filter(f => f.steps.some(x => x.screen === s.name) && f.evals.length).flatMap(f => [
      '',
      `From the flow ${f.title}, for what no screen shows. The backend's own tests run these.`,
      '',
      ...f.evals.map(e => { const unsure = toConfirm(e.rules); return `- **${e.Eval}.** Given ${e.Given.charAt(0).toLowerCase()}${e.Given.slice(1)}. Then ${e.Then.charAt(0).toLowerCase()}${e.Then.slice(1)}. (${e.rules.join(', ')})${unsure.length ? ` Rests on external rules still to confirm: ${unsure.join(', ')}.` : ''}`; }),
    ]),
    '',
    '## Decisions behind it',
    '',
    ...[...cited].filter(id => id.startsWith('D-')).sort().map(id => `- **${id}.** ${byId.get(id).Decision}`),
    '',
    '## Open questions',
    '',
    'Built as "meanwhile" says. When the answer comes, the spec changes in one place, and this handoff with it.',
    '',
    ...[...cited].filter(id => id.startsWith('Q-')).sort().map(id => `- **${id}.** ${byId.get(id).Question} Meanwhile, ${byId.get(id).Meanwhile.charAt(0).toLowerCase()}${byId.get(id).Meanwhile.slice(1)}.`),
    '',
    '## External rules',
    '',
    ...[...cited].filter(id => byId.get(id)?.file).sort().map(id => `- **${id}** (${byId.get(id).Source}, ${byId.get(id).Mark}): ${byId.get(id).Rule}`),
    '',
  ];
  writeFileSync(join(root, 'handoff', `${s.name}.md`), lines.join('\n'));
  console.log(`handoff/${s.name}.md`);
}
