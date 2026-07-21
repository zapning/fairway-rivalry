/*
 * TRINN 4D — mutation harness (driver).
 *
 * Proves the 4A–4C contracts go RED when protected structure breaks, WITHOUT touching source,
 * dist/, or the ordinary suite.
 *
 * Cross-platform: Playwright is launched as `process.execPath <node_modules/.../cli.js> ...`
 * (a direct file path). No npx / .cmd / shell. A process that fails to start is reported as
 * PROCESS_START_FAILED. JSON goes through ONE mechanism (PLAYWRIGHT_JSON_OUTPUT_FILE, absolute).
 *
 * Gates (nothing downstream runs until the previous gate passes):
 *   1. --list preflight discovers all four projects (proves config/CLI args, no server needed).
 *   2. diagnostic: one clean build + one contract -> valid JSON, all four projects, exit 0.
 *   3. green baseline: both target specs pass in all four projects.
 *   4. M1–M5 sequentially, then a green final control.
 *
 * Cleanup runs in finally for every exit path; the harness verifies .playwright-mut/ is gone and
 * fails (exit 1) if any temp remains.
 */
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MUTATIONS, BASELINE_SPECS, BUILT_NAME } from './mutations.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const MUT_ROOT = path.join(root, '.playwright-mut');
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const RUN_DIR = path.join(MUT_ROOT, RUN_ID);
const EXPECTED_PROJECTS = ['chromium-390', 'chromium-412', 'webkit-390', 'webkit-412'];
const CONFIG = 'playwright.mutation.config.ts';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findPlaywrightCli() {
  const candidates = [
    path.join(root, 'node_modules', '@playwright', 'test', 'cli.js'),
    path.join(root, 'node_modules', 'playwright', 'cli.js'),
  ];
  for (const c of candidates) { try { if (fs.existsSync(c)) return c; } catch (e) {} }
  return null;
}

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
    s.on('error', rej);
  });
}

function buildTo(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const r = spawnSync(process.execPath, ['build-dist.mjs'], { cwd: root, env: { ...process.env, DIST_OUT: dir }, encoding: 'utf8' });
  if (r.error) throw new Error('build-dist PROCESS_START_FAILED: ' + r.error.code + ' ' + r.error.message);
  if (r.status !== 0) throw new Error('build-dist exit ' + r.status + ':\n' + (r.stderr || r.stdout || ''));
}

function startServe(dir, port) {
  const child = spawn(process.execPath, ['serve-dist.mjs', String(port)], { cwd: root, env: { ...process.env, SERVE_DIR: dir }, stdio: 'ignore' });
  child.on('error', (e) => { console.error(`serve-dist PROCESS_START_FAILED (port ${port}): ${e.code} ${e.message}`); });
  return child;
}

async function killServe(child) {
  if (!child || child.killed) return;
  const done = new Promise((res) => { child.once('exit', res); child.once('close', res); });
  try { child.kill('SIGTERM'); } catch (e) {}
  await Promise.race([done, sleep(2000)]);
  if (child.exitCode === null && !child.killed) { try { child.kill('SIGKILL'); } catch (e) {} await Promise.race([done, sleep(1000)]); }
}

async function waitForServer(port, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise((res) => {
      const req = http.get({ host: 'localhost', port, path: '/index.html' }, (r) => { r.resume(); res((r.statusCode || 0) > 0); });
      req.on('error', () => res(false));
      req.setTimeout(1000, () => { req.destroy(); res(false); });
    });
    if (ok) return true;
    await sleep(250);
  }
  return false;
}

/* --list preflight: prove the four projects are discovered. No server/build needed. */
function preflightList(specs) {
  const cli = findPlaywrightCli();
  if (!cli) return { ok: false, reason: 'PLAYWRIGHT_CLI_NOT_FOUND' };
  const args = [cli, 'test', ...specs, '--config', CONFIG, '--list'];
  const r = spawnSync(process.execPath, args, { cwd: root, env: { ...process.env }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) return { ok: false, reason: 'PROCESS_START_FAILED', cmd: process.execPath, args, cwd: root, code: r.error.code, message: r.error.message, stdout: r.stdout || '', stderr: r.stderr || '' };
  const text = (r.stdout || '') + '\n' + (r.stderr || '');
  const found = new Set();
  for (const m of text.matchAll(/\[([^\]]+)\]/g)) if (EXPECTED_PROJECTS.includes(m[1])) found.add(m[1]);
  return { ok: EXPECTED_PROJECTS.every((p) => found.has(p)), exit: r.status, args, projects: [...found], stdout: r.stdout || '', stderr: r.stderr || '' };
}

/* Launch Playwright test via node + direct CLI path. One JSON mechanism (env, absolute path). */
function runPlaywright(specs, baseURL, jsonPath) {
  const cli = findPlaywrightCli();
  if (!cli) return { startFailed: true, reason: 'PLAYWRIGHT_CLI_NOT_FOUND', exit: null, report: null, stdout: '', stderr: '', args: [] };
  const args = [cli, 'test', ...specs, '--config', CONFIG];
  try { fs.rmSync(jsonPath, { force: true }); } catch (e) {}
  const r = spawnSync(process.execPath, args, {
    cwd: root,
    env: { ...process.env, MUT_BASE_URL: baseURL, PLAYWRIGHT_JSON_OUTPUT_FILE: jsonPath },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) {
    return { startFailed: true, reason: 'PROCESS_START_FAILED', cmd: process.execPath, args, cwd: root, code: r.error.code, message: r.error.message, exit: null, report: null, stdout: r.stdout || '', stderr: r.stderr || '' };
  }
  let report = null;
  if (fs.existsSync(jsonPath)) { try { report = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (e) { report = null; } }
  return { startFailed: false, exit: r.status, report, reportMissing: !report, stdout: r.stdout || '', stderr: r.stderr || '', args, jsonPath };
}

function configProjectNames(report) {
  if (report && report.config && Array.isArray(report.config.projects)) return report.config.projects.map((p) => p.name);
  return [];
}

function flattenTests(report) {
  const idToName = {};
  if (report && report.config && Array.isArray(report.config.projects)) {
    for (const p of report.config.projects) { if (p.id != null) idToName[p.id] = p.name; idToName[p.name] = p.name; }
  }
  const out = [];
  const walk = (suite) => {
    for (const spec of (suite.specs || [])) {
      for (const t of (spec.tests || [])) {
        const results = t.results || [];
        const failed = t.status === 'unexpected' || results.some((r) => ['failed', 'timedOut', 'interrupted'].includes(r.status));
        const passed = !failed && (t.status === 'expected' || results.some((r) => r.status === 'passed'));
        const project = t.projectName || idToName[t.projectId] || t.projectId || '(unknown)';
        const errorText = results.map((r) => [(r.error && r.error.message) || '', ...((r.errors || []).map((e) => e.message || ''))].join('\n')).join('\n');
        out.push({ specTitle: spec.title, project, failed, passed, errorText });
      }
    }
    for (const s of (suite.suites || [])) walk(s);
  };
  if (report) for (const s of (report.suites || [])) walk(s);
  return out;
}

const allFourProjectsHaveTests = (tests) => { const s = new Set(tests.map((t) => t.project)); return EXPECTED_PROJECTS.every((p) => s.has(p)); };

function dumpRunDiagnostics(label, run) {
  console.error(`\n[${label}] FULL DIAGNOSTICS`);
  console.error('  cmd: ' + (run.cmd || process.execPath));
  console.error('  args: ' + JSON.stringify(run.args || []));
  console.error('  cwd: ' + root);
  console.error('  exit: ' + run.exit);
  if (run.code) console.error('  spawn.code: ' + run.code);
  if (run.message) console.error('  spawn.message: ' + run.message);
  const jp = run.jsonPath;
  console.error('  jsonPath: ' + jp);
  const exists = jp ? fs.existsSync(jp) : false;
  console.error('  reportExists: ' + exists);
  console.error('  reportSize: ' + (exists ? fs.statSync(jp).size : 0));
  const rep = run.report;
  console.error('  report.topLevelKeys: ' + (rep ? JSON.stringify(Object.keys(rep)) : 'null'));
  console.error('  report.config.projects: ' + JSON.stringify(configProjectNames(rep)));
  const tests = flattenTests(rep);
  console.error('  recursive test.projectName set: ' + JSON.stringify([...new Set(tests.map((t) => t.project))]));
  console.error('  report.errors: ' + (rep && rep.errors ? JSON.stringify(rep.errors.map((e) => e.message || e)) : 'n/a'));
  const firstFail = tests.find((t) => t.failed);
  console.error('  firstFailure: ' + (firstFail ? `${firstFail.project} :: ${firstFail.specTitle} :: ${firstFail.errorText.slice(0, 500)}` : 'none'));
  console.error('  stdout:\n' + run.stdout);
  console.error('  stderr:\n' + run.stderr);
}

async function diagnose() {
  const dir = path.join(RUN_DIR, 'diagnose');
  const jsonPath = path.join(dir, 'report.json');
  let serve = null;
  const detail = { ok: false, exit: null, projects: [], notes: [] };
  try {
    buildTo(dir);
    const port = await freePort();
    serve = startServe(dir, port);
    if (!(await waitForServer(port))) { detail.notes.push('server did not start'); return detail; }
    const run = runPlaywright([BASELINE_SPECS[0]], `http://localhost:${port}`, jsonPath);
    detail.exit = run.exit;
    if (run.startFailed) { dumpRunDiagnostics('diagnose', run); detail.notes.push(run.reason); return detail; }
    const tests = flattenTests(run.report);
    detail.projects = configProjectNames(run.report).length ? configProjectNames(run.report) : [...new Set(tests.map((t) => t.project))];
    const projOk = allFourProjectsHaveTests(tests);
    const validReport = !run.reportMissing && tests.length > 0;
    detail.ok = run.exit === 0 && projOk && validReport;
    if (!detail.ok) { dumpRunDiagnostics('diagnose', run); if (!validReport) detail.notes.push('invalid/empty JSON report'); if (!projOk) detail.notes.push('not all four projects have results'); if (run.exit !== 0) detail.notes.push('diagnostic exit != 0'); }
  } finally {
    await killServe(serve);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
  return detail;
}

async function greenControl(label) {
  const dir = path.join(RUN_DIR, label);
  const jsonPath = path.join(dir, 'report.json');
  let serve = null;
  const detail = { label, ok: false, exit: null, total: 0, failed: [], notes: [] };
  try {
    buildTo(dir);
    const port = await freePort();
    serve = startServe(dir, port);
    if (!(await waitForServer(port))) { detail.notes.push('server did not start'); return detail; }
    const run = runPlaywright(BASELINE_SPECS, `http://localhost:${port}`, jsonPath);
    detail.exit = run.exit;
    if (run.startFailed) { dumpRunDiagnostics(label, run); detail.notes.push(run.reason); return detail; }
    const tests = flattenTests(run.report);
    const anyFail = tests.filter((t) => t.failed);
    detail.total = tests.length;
    detail.failed = anyFail.map((t) => `${t.project} :: ${t.specTitle}`);
    detail.ok = run.exit === 0 && allFourProjectsHaveTests(tests) && anyFail.length === 0 && tests.length > 0;
    if (!detail.ok) dumpRunDiagnostics(label, run);
  } finally {
    await killServe(serve);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
  return detail;
}

async function runMutation(m) {
  const dir = path.join(RUN_DIR, m.id);
  const jsonPath = path.join(dir, 'report.json');
  let serve = null;
  const detail = { id: m.id, title: m.title, spec: m.spec, ok: false, exit: null, perProject: {}, notes: [] };
  try {
    buildTo(dir);
    const target = path.join(dir, BUILT_NAME[m.targetFile]);
    const before = fs.readFileSync(target, 'utf8');
    let after;
    try { after = m.patch(before); } catch (e) { detail.notes.push('patch-guard: ' + e.message); return detail; }
    if (after === before) { detail.notes.push('patch produced no change'); return detail; }
    fs.writeFileSync(target, after);

    const port = await freePort();
    serve = startServe(dir, port);
    if (!(await waitForServer(port))) { detail.notes.push('server did not start'); return detail; }

    const run = runPlaywright([m.spec], `http://localhost:${port}`, jsonPath);
    detail.exit = run.exit;
    if (run.startFailed) { dumpRunDiagnostics(m.id, run); detail.notes.push(run.reason); return detail; }
    const tests = flattenTests(run.report);
    if (!allFourProjectsHaveTests(tests)) { detail.notes.push('not all four projects have results'); dumpRunDiagnostics(m.id, run); return detail; }
    if (run.exit === 0) detail.notes.push('expected non-zero Playwright exit, got 0');

    let allProjectsOk = true;
    for (const proj of EXPECTED_PROJECTS) {
      const failing = tests.filter((t) => t.project === proj && t.failed);
      const matched = m.expectFail.map((entry) => {
        const hit = failing.find((f) => entry.title.test(f.specTitle) && entry.cause.test(f.errorText));
        const titleOnly = failing.find((f) => entry.title.test(f.specTitle));
        return { title: entry.title.toString(), matched: !!hit, wrongCause: !hit && !!titleOnly };
      });
      const unexpected = failing.filter((f) => !m.expectFail.some((e) => e.title.test(f.specTitle))).map((f) => f.specTitle);
      const projOk = run.exit !== 0 && matched.every((e) => e.matched) && unexpected.length === 0;
      if (!projOk) allProjectsOk = false;
      detail.perProject[proj] = { ok: projOk, failedTitles: [...new Set(failing.map((f) => f.specTitle))], matched, unexpected };
    }
    detail.ok = run.exit !== 0 && allProjectsOk;
  } finally {
    await killServe(serve);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
  return detail;
}

function printSummary(results) {
  const line = '-'.repeat(74);
  console.log('\n' + line + '\n4D MUTATION HARNESS — SUMMARY (run ' + RUN_ID + ')\n' + line);
  const pf = results.preflight;
  console.log(`--list preflight: ${pf.ok ? 'PASS' : 'FAIL'}  exit=${pf.exit}  projects=${JSON.stringify(pf.projects || [])}` + (pf.reason ? '  reason: ' + pf.reason : ''));
  if (results.diagnose) { const d = results.diagnose; console.log(`diagnostic: ${d.ok ? 'PASS' : 'FAIL'}  exit=${d.exit}  projects=${JSON.stringify(d.projects)}` + (d.notes.length ? '  notes: ' + d.notes.join('; ') : '')); }
  if (results.baseline) { const b = results.baseline; console.log(`baseline (green control): ${b.ok ? 'PASS' : 'FAIL'}  exit=${b.exit}  total=${b.total}` + (b.failed.length ? '  failing: ' + JSON.stringify(b.failed) : '') + (b.notes.length ? '  notes: ' + b.notes.join('; ') : '')); }
  for (const m of results.mutations) {
    console.log(`\n${m.id} — ${m.ok ? 'RED as expected (PASS)' : 'FAIL'}  [spec: ${m.spec}, exit: ${m.exit}]`);
    if (m.notes.length) console.log('  notes: ' + m.notes.join('; '));
    for (const proj of EXPECTED_PROJECTS) {
      const p = m.perProject[proj];
      if (!p) { console.log(`  ${proj}: (no data)`); continue; }
      const causes = p.matched.map((e) => (e.matched ? 'ok' : e.wrongCause ? 'WRONG-CAUSE' : 'MISSING')).join(',');
      console.log(`  ${proj}: ${p.ok ? 'ok' : 'FAIL'}  failed=${JSON.stringify(p.failedTitles)}  causes=[${causes}]` + (p.unexpected.length ? `  UNEXPECTED=${JSON.stringify(p.unexpected)}` : ''));
    }
  }
  if (results.final) { const f = results.final; console.log(`\nfinal (green control): ${f.ok ? 'PASS' : 'FAIL'}  exit=${f.exit}  total=${f.total}` + (f.failed.length ? '  failing: ' + JSON.stringify(f.failed) : '') + (f.notes.length ? '  notes: ' + f.notes.join('; ') : '')); }
  console.log(line);
}

async function main() {
  // Controlled pre-clean of any prior .playwright-mut/ (never git clean/reset/stash).
  try { if (fs.existsSync(MUT_ROOT)) fs.rmSync(MUT_ROOT, { recursive: true, force: true }); } catch (e) { console.error('pre-clean of .playwright-mut/ failed: ' + e.message); process.exit(1); }
  fs.mkdirSync(RUN_DIR, { recursive: true });

  const results = { preflight: null, diagnose: null, baseline: null, mutations: [], final: null };
  let aborted = false;
  let cleanupError = null;
  try {
    // Gate 1 — discovery.
    results.preflight = preflightList(BASELINE_SPECS);
    if (!results.preflight.ok) {
      console.error('\n--list PREFLIGHT FAILED — the four projects were not all discovered. Not building/serving.');
      console.error('  args: ' + JSON.stringify(results.preflight.args || []));
      console.error('  exit: ' + results.preflight.exit + (results.preflight.reason ? '  reason: ' + results.preflight.reason : ''));
      console.error('  projectsFound: ' + JSON.stringify(results.preflight.projects || []));
      console.error('  stdout:\n' + (results.preflight.stdout || ''));
      console.error('  stderr:\n' + (results.preflight.stderr || ''));
      aborted = true;
    }
    // Gate 2 — diagnostic.
    if (!aborted) { results.diagnose = await diagnose(); if (!results.diagnose.ok) { console.error('\nDIAGNOSTIC GATE FAILED — not running baseline/mutations.'); aborted = true; } }
    // Gate 3 — green baseline.
    if (!aborted) { results.baseline = await greenControl('baseline'); if (!results.baseline.ok) { console.error('\nGREEN BASELINE GATE FAILED — not running mutations.'); aborted = true; } }
    // Mutations + final.
    if (!aborted) { for (const m of MUTATIONS) results.mutations.push(await runMutation(m)); results.final = await greenControl('final'); }
  } finally {
    try { fs.rmSync(RUN_DIR, { recursive: true, force: true }); } catch (e) { cleanupError = 'RUN_DIR: ' + e.message; }
    try { if (fs.existsSync(MUT_ROOT) && fs.readdirSync(MUT_ROOT).length === 0) fs.rmSync(MUT_ROOT, { recursive: true, force: true }); } catch (e) { cleanupError = (cleanupError ? cleanupError + '; ' : '') + 'MUT_ROOT: ' + e.message; }
  }

  printSummary(results);

  const mutRemains = fs.existsSync(MUT_ROOT);
  if (mutRemains) console.error('\nCLEANUP FAILED: .playwright-mut/ still exists after the harness.');
  if (cleanupError) console.error('CLEANUP ERROR: ' + cleanupError);

  const gatesOk = results.preflight && results.preflight.ok
    && results.diagnose && results.diagnose.ok
    && results.baseline && results.baseline.ok
    && results.final && results.final.ok;
  const mutationsOk = !aborted && results.mutations.length === MUTATIONS.length && results.mutations.every((r) => r.ok);
  const allOk = gatesOk && mutationsOk && !mutRemains && !cleanupError;

  console.log('\n4D RESULT: ' + (allOk ? 'ALL FIVE MUTATIONS PROVEN RED + GREEN CONTROLS PASS' : 'NOT ALL CHECKS PASSED') + '\n');
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => { console.error('harness error:', (e && e.stack) || e); process.exit(1); });
