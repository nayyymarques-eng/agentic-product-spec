// The design system's own check, on every state: renders each eval and runs ai-ready-design-system's harness
// (21 checks: components, tokens, type, spacing, colour, contrast, titles, layout at 375px) on the result.
// Usage: npm run look
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { dsDir, readSpec, notBuiltYet } from './spec.mjs';
import { renderExamples } from './render.mjs';

const ds = dsDir;
const dir = join(ds, '.states');
const json = join(ds, '.states.json');
rmSync(dir, { recursive: true, force: true });
const spec = readSpec();
for (const screen of spec.screens) await renderExamples(screen, dir, '..');
const waiting = notBuiltYet(spec);
if (waiting.length) console.log(`Not built yet, so not checked: ${waiting.join('; ')}.`);
// Paths relative to the design system: its harness refuses any path outside its own folder.
execFileSync(process.execPath, [join(ds, 'harness/score.mjs'), '.states', '--json', '.states.json'], { cwd: ds, stdio: 'ignore' });
const report = JSON.parse(readFileSync(json, 'utf8'));
const fails = report.flatMap(r => Object.entries(r.res).filter(([, v]) => !v.pass).map(([k, v]) => `${k} ${r.screen.replace('.html', '')} (${v.detail})  ← ai-ready-design-system`));
const passed = report.reduce((a, r) => a + r.passed, 0), applied = report.reduce((a, r) => a + r.applied, 0);
console.log(`Design system: ${report.length} states, ${passed} of ${applied} checks passed.`);
if (fails.length) { console.log(fails.join('\n')); console.log(`FAIL: ${fails.length}`); process.exit(1); }
console.log('PASS');
