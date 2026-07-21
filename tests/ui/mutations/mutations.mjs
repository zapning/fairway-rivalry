/*
 * TRINN 4D — mutation definitions.
 *
 * Each mutation is applied ONLY to a freshly built, isolated copy under .playwright-mut/<run>/<id>/
 * (never source, never dist/). It re-uses the EXISTING contract spec unmodified and expects that
 * spec to go RED for a stable, mutation-specific reason in all four projects.
 *
 * patch(content) is the single source of truth for a mutation. It GUARDS (exact find must occur
 * exactly once; the marker must be absent for appends), mutates, and VERIFIES the replacement is
 * present. It throws on any guard failure so a drifted string aborts the scenario instead of
 * silently passing.
 *
 * expectFail lists the ONLY contract tests that may fail, each with a stable cause pattern (a custom
 * assertion message we authored, or a stable locator). The harness fails the scenario if any test
 * outside this list fails, or if any listed test fails for the wrong reason, or if the failure is
 * not reproduced in all four projects.
 */

function replaceOnce(content, find, replace, verify) {
  const n = content.split(find).length - 1;
  if (n !== 1) throw new Error(`patch-guard: expected exactly 1 occurrence of find-string, found ${n}`);
  const out = content.replace(find, replace);
  if (!verify(out)) throw new Error('patch-guard: replacement not verified in output');
  return out;
}

function appendOnce(content, marker, appended, verify) {
  if (content.includes(marker)) throw new Error('patch-guard: append marker already present before mutation');
  const out = content + appended;
  if (!verify(out)) throw new Error('patch-guard: appended marker not verified in output');
  return out;
}

const countOf = (s, re) => (s.match(re) || []).length;

export const MUTATIONS = [
  {
    id: 'M1-duplicate-app-header',
    title: 'M1 — duplicated app-header',
    category: 'global-shell',
    targetFile: 'index.html',
    spec: 'global-shell.contract.spec.ts',
    patch: (c) => replaceOnce(
      c,
      '</header>\n\n<div class="tabs-wrap" id="tabs-wrap">',
      '</header>\n<header data-testid="app-header"></header>\n\n<div class="tabs-wrap" id="tabs-wrap">',
      (out) => countOf(out, /data-testid="app-header"/g) === 2 && countOf(out, /<header\b/g) >= 2,
    ),
    // A second app-header trips both the header-uniqueness (4A-C2) and no-duplicate-testid (4A-C7) contracts.
    expectFail: [
      { title: /4A-C2:/, cause: /no extra <header> elements anywhere|exactly one \[data-testid="app-header"\]/ },
      { title: /4A-C7:/, cause: /duplicate data-testid values/ },
    ],
  },
  {
    id: 'M2-wrong-nav-order',
    title: 'M2 — wrong primary-nav order (Tee Off <-> Rivalry)',
    category: 'global-shell',
    targetFile: 'index.html',
    spec: 'global-shell.contract.spec.ts',
    patch: (c) => replaceOnce(
      c,
      '    <button data-tab="round" data-i18n="tab.round">Tee Off</button>\n    <button data-tab="rivalry" data-i18n="tab.rivalry">Rivalry</button>',
      '    <button data-tab="rivalry" data-i18n="tab.rivalry">Rivalry</button>\n    <button data-tab="round" data-i18n="tab.round">Tee Off</button>',
      (out) => out.indexOf('data-tab="rivalry"') < out.indexOf('data-tab="round"'),
    ),
    expectFail: [
      { title: /4A-C4:/, cause: /visible nav order/ },
    ],
  },
  {
    id: 'M3-duplicate-record',
    title: 'M3 — duplicated Record component',
    category: 'clubhouse',
    targetFile: 'app.js',
    spec: 'clubhouse-deep.contract.spec.ts',
    // Inject a second record component immediately before the challenge box (i.e. right after the
    // real Record button), so the canonical sequence and record-count break.
    patch: (c) => replaceOnce(
      c,
      '<div class="chd-box ch-tap chd-tcv3" data-clubhouse-component="challenge"',
      '<button type="button" data-clubhouse-component="record" aria-label="Record this season"></button>\n    <div class="chd-box ch-tap chd-tcv3" data-clubhouse-component="challenge"',
      (out) => countOf(out, /data-clubhouse-component="record"/g) === 2,
    ),
    expectFail: [
      { title: /canonical Clubhouse component structure/, cause: /canonical component sequence/ },
      { title: /challenge\/resume exclusivity/, cause: /data-clubhouse-component="record"/ },
    ],
  },
  {
    id: 'M4-reintroduce-resume-slot',
    title: 'M4 — re-introduced separate Resume slot',
    category: 'clubhouse',
    targetFile: 'app.js',
    spec: 'clubhouse-deep.contract.spec.ts',
    // renderResumeBox() normally REMOVES #ch-resume-round each render. Make it re-create it instead
    // (the exact regression the exclusivity contract guards).
    patch: (c) => replaceOnce(
      c,
      "let host = document.getElementById('ch-resume-round'); if (host) host.remove();",
      "let host = document.getElementById('ch-resume-round'); if (!host) { host = document.createElement('div'); host.id = 'ch-resume-round'; (document.getElementById('dash-clubhouse-tail') || document.body).appendChild(host); }",
      (out) => out.includes("host = document.createElement('div'); host.id = 'ch-resume-round';"),
    ),
    expectFail: [
      { title: /challenge\/resume exclusivity/, cause: /no separate resume box mounted/ },
    ],
  },
  {
    id: 'M5-scale-clubhouse-grid',
    title: 'M5 — transform: scale(.85) on the Clubhouse grid',
    category: 'clubhouse',
    targetFile: 'styles.css',
    spec: 'clubhouse-deep.contract.spec.ts',
    patch: (c) => appendOnce(
      c,
      '#clubhouse-grid{transform:scale',
      '\n/* 4D-M5 mutation (isolated build copy only) */\n#clubhouse-grid{transform:scale(.85) !important}\n',
      (out) => out.includes('#clubhouse-grid{transform:scale(.85) !important}'),
    ),
    expectFail: [
      { title: /challenge\/resume exclusivity/, cause: /no transform: scale\(\) on shell\/dashboard\/grid/ },
    ],
  },
];

/* The union of contract specs the baseline + final green control must run (all must PASS). */
export const BASELINE_SPECS = ['global-shell.contract.spec.ts', 'clubhouse-deep.contract.spec.ts'];

/* Map each targetFile name to the built filename in the served dir. */
export const BUILT_NAME = { 'index.html': 'index.html', 'app.js': 'app.js', 'styles.css': 'styles.css' };
