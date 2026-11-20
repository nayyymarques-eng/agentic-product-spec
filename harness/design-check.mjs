// Optional: checks a design file's frame titles against the spec, so a design change that never reached the spec shows up.
// Usage: npm run design   (reads design/frames.json)
//
// The design tool is each team's choice. Export the titles of the frames (Figma, a canvas, slides, anything) to a JSON
// list: [{ "title": "request · ST-03", "page": "Answer a request" }, ...]. "page" is optional and only used in the report.
//
// A frame's title says what it draws:
//   "<screen> · ST-03"            a state of that screen in the spec (several: "<screen> · ST-03, DL-01")
//   "Explore · <anything>"        an option nobody has picked yet; it may go against the spec
//   "Reference · <anything>"      an explanation, such as a map of a flow; it draws no state
//
// The design log, design/log.md, is optional: one row per design change, written by whoever makes it (from, to, why),
// and the decision that brought it into the spec, or "not yet".
//
// What it does not check: that the drawing matches the state's text. A frame can name ST-03 and draw something else.
// The log says what changed and why; the drawing review in .claude/agents/design-sync.md looks for what nobody logged.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readSpec, root, tables } from './spec.mjs';

// One fixed place, so no path comes from outside: each team's export writes here.
const path = join(root, 'design', 'frames.json');
if (!existsSync(path)) {
  console.log('No frame list at design/frames.json. Export your design file\'s frame titles there first (see README, "Keep the design in step").');
  process.exit(1);
}
let frames;
try {
  frames = JSON.parse(readFileSync(path, 'utf8'));
} catch {
  console.log('design/frames.json is not valid JSON. It must be a list: [{ "title": "…" }, …].');
  process.exit(1);
}
if (!Array.isArray(frames)) {
  console.log('The frame list must be a JSON list: [{ "title": "…" }, …].');
  process.exit(1);
}
const spec = readSpec();
const screens = new Map(spec.screens.map(s => [s.name, s]));
const fails = [];
const notes = [];
const fail = (id, what, frame) => fails.push(`${id} (${what})  ← "${frame?.title ?? ''}"${frame?.page ? `, page ${frame.page}` : ''}`);
const drawn = new Set();
const OTHER = /^(Explore|Reference)\s*·/i;

for (const frame of frames) {
  const title = String(frame?.title ?? '').trim();
  if (OTHER.test(title)) continue;
  const [name, ids = ''] = title.split('·').map(x => x.trim());
  const cited = ids.match(/\b(ST|DL)-\d{2,3}\b/g) ?? [];
  // DESIGN-01: a frame says what it draws.
  if (!ids || !cited.length) { fail('DESIGN-01', 'names no state; title it "<screen> · ST-nn", "Explore · …" or "Reference · …"', frame); continue; }
  // DESIGN-02: the screen it names is in the spec.
  const screen = screens.get(name);
  if (!screen) { fail('DESIGN-02', `"${name}" is not a screen in spec/screens/`, frame); continue; }
  // DESIGN-03: every state and dialog it names is on that screen.
  const known = new Set([...screen.states, ...screen.dialogs].map(x => x.id));
  for (const id of cited) {
    if (known.has(id)) drawn.add(`${name} ${id}`);
    else fail('DESIGN-03', `${name} has no ${id}`, frame);
  }
  // DESIGN-03: a dialog is drawn over a state it opens over.
  const states = cited.filter(id => id.startsWith('ST-'));
  for (const d of screen.dialogs.filter(x => cited.includes(x.id))) {
    for (const st of states) if (!d.over.includes(st)) fail('DESIGN-03', `${d.id} does not open over ${st}`, frame);
  }
}

// DESIGN-04, a note only: a state of the spec that no frame draws. Some teams draw every state, some only the hard ones.
for (const s of spec.screens) for (const x of [...s.states, ...s.dialogs]) {
  if (!drawn.has(`${s.name} ${x.id}`)) notes.push(`${s.name} ${x.id}`);
}

// The design log, if the team keeps one. One fixed place too.
const logPath = join(root, 'design', 'log.md');
const waiting = [];
const replaced = [];
let logged = 0;
if (existsSync(logPath)) {
  const decisions = new Set(spec.decisions.map(d => d.ID));
  const replacedBy = new Map(spec.replaced.map(d => [d.ID, d['Replaced by']]));
  for (const row of tables(readFileSync(logPath, 'utf8')).flat()) {
    logged++;
    const where = `design log, ${row.Date || 'no date'}, "${row.Frame || 'no frame'}"`;
    // DESIGN-05: a row says what it was, what it is now, and why.
    const empty = ['Frame', 'From', 'To', 'Why'].filter(k => !(row[k] ?? '').trim() || row[k].trim() === '-');
    if (empty.length) fails.push(`DESIGN-05 (${where}: no ${empty.join(', ').toLowerCase()})`);
    // DESIGN-06: the change is in the spec, as a decision the spec has, or it waits for the owner of the round.
    const cited = (row.Spec ?? '').match(/\bD-\d{2,}\b/g) ?? [];
    if (!cited.length) waiting.push(where);
    for (const id of cited) {
      // A decision that was replaced later keeps its log row: the row is history, and says what replaced it.
      if (replacedBy.has(id)) replaced.push(`${where}: ${id}, replaced by ${replacedBy.get(id) || 'no one named'}`);
      else if (!decisions.has(id)) fails.push(`DESIGN-06 (${where}: the spec has no ${id})`);
    }
  }
}

const other = frames.filter(f => OTHER.test(String(f?.title ?? ''))).length;
console.log(`Design: ${frames.length} ${frames.length === 1 ? 'frame' : 'frames'}, ${other} explore or reference.`);
if (notes.length) console.log(`DESIGN-04, a note: no frame draws ${notes.join(', ')}`);
if (logged) console.log(`Design log: ${logged} ${logged === 1 ? 'change' : 'changes'}, ${waiting.length} not in the spec yet.`);
if (replaced.length) console.log(`Logged changes whose decision was replaced since (kept as history):\n  ${replaced.join('\n  ')}`);
if (waiting.length) console.log(`Waiting for the spec (write the decision, the state and its eval today):\n  ${waiting.join('\n  ')}`);
if (fails.length) {
  console.log(fails.join('\n'));
  console.log(`FAIL: ${fails.length}. A frame the spec does not have is a design change not in the spec yet: write the decision, the state and its eval, or retitle the frame "Explore · …". A log row needs its from, to and why, and a decision the spec has.`);
  process.exit(1);
}
console.log('PASS: DESIGN-01 to DESIGN-03, DESIGN-05, DESIGN-06. This checks that every frame names a state the spec has and every logged change says why, not that the drawing matches the spec.');
