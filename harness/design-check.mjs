// Optional: checks a design file's frame titles against the spec, so a design change that never reached the spec shows up.
// Usage: npm run design -- <frames.json>   (default: design/frames.json)
//
// The design tool is each team's choice. Export the titles of the frames (Figma, a canvas, slides, anything) to a JSON
// list: [{ "title": "request · ST-03", "page": "Answer a request" }, ...]. "page" is optional and only used in the report.
//
// A frame's title says what it draws:
//   "<screen> · ST-03"            a state of that screen in the spec (several: "<screen> · ST-03, DL-01")
//   "Explore · <anything>"        an option nobody has picked yet; it may go against the spec
//   "Reference · <anything>"      an explanation, such as a map of a flow; it draws no state
//
// What it does not check: that the drawing matches the state's text. A frame can name ST-03 and draw something else.
// A person compares them, or whoever builds the screen does.
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { readSpec, root } from './spec.mjs';

// The path comes from the command line: accept only a .json file inside this repository.
const path = resolve(root, process.argv[2] ?? 'design/frames.json');
if (!path.startsWith(root + sep) || !path.endsWith('.json') || !existsSync(path)) {
  console.log('No frame list found. Export your design file\'s frame titles to a .json file inside this repository, such as design/frames.json (see README, "Keep the design in step").');
  process.exit(1);
}
const frames = JSON.parse(readFileSync(path, 'utf8'));
if (!Array.isArray(frames)) {
  console.log('The frame list must be a JSON list: [{ "title": "…" }, …].');
  process.exit(1);
}
const spec = readSpec();
const screens = new Map(spec.screens.map(s => [s.name, s]));
const fails = [];
const notes = [];
const fail = (id, what, frame) => fails.push(`${id} (${what})  ← "${frame.title}"${frame.page ? `, page ${frame.page}` : ''}`);
const drawn = new Set();
const OTHER = /^(Explore|Reference)\s*·/i;

for (const frame of frames) {
  const title = (frame.title ?? '').trim();
  if (OTHER.test(title)) continue;
  const [name, ids = ''] = title.split('·').map(x => x.trim());
  const cited = ids.match(/\b(ST|DL)-\d{2}\b/g) ?? [];
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

const other = frames.filter(f => OTHER.test(f.title ?? '')).length;
console.log(`Design: ${frames.length} ${frames.length === 1 ? 'frame' : 'frames'}, ${other} explore or reference.`);
if (notes.length) console.log(`DESIGN-04, a note: no frame draws ${notes.join(', ')}`);
if (fails.length) {
  console.log(fails.join('\n'));
  console.log(`FAIL: ${fails.length}. Each one is a design change the spec does not have yet: write the decision, the state and its eval, or retitle the frame "Explore · …".`);
  process.exit(1);
}
console.log('PASS: DESIGN-01 to DESIGN-03. This checks that every frame names a state the spec has, not that the drawing matches it.');
