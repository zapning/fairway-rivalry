/* Platform-independent build: copy source -> output dir (works on Windows + Linux, no bash).
   Mirrors the copy step of build-dist.sh WITHOUT deploy-zipping. Does not modify app content.
   Output dir: DIST_OUT env when set (e.g. .playwright-dist for tests), else dist/ (production default).
   The copied file set is identical regardless of output dir, so functional parity with
   build-dist.sh is preserved for both production and test builds.

   Build contract (verified against production fairwayrivalry.com):
   - MANDATORY runtime files: the entry HTML + the scripts/styles it loads that make the app boot
     and define the readiness contract window.activateTab / window.__frErrors. Production serves
     these as external files and they are byte-identical to the local sources (app.js, styles.css,
     supabase-bridge.js) or identical modulo deploy-time cache-bust stamping (index.html). Missing
     mandatory file => build FAILS with exit 1 and lists them.
   - OPTIONAL assets (icons, images, manifest, service worker, avatars): missing => a WARNING is
     printed (never silently hidden) but the build still succeeds. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = process.env.DIST_OUT ? path.resolve(process.env.DIST_OUT) : path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });

// Sources whose absence must FAIL the build (app cannot boot / readiness contract cannot be met).
const MANDATORY = new Set(['Golf Dashboard.html', 'app.js', 'styles.css', 'supabase-bridge.js']);

// [source, destName] — destName defaults to source basename
const FILES = [
  ['Golf Dashboard.html', 'index.html'],
  ['supabase-bridge.js'], ['styles.css'], ['app.js'], ['manifest.json'],
  ['icon-192.svg'], ['icon-512.svg'], ['icon-192.png'], ['icon-512.png'],
  ['icon-maskable-512.png'], ['apple-touch-icon.png'], ['logo-header.png'], ['sw.js'],
  ['logo-profil.png'], ['header-bg.jpg'], ['the-caddie.png'], ['clubhouse-bg.jpg'],
  ['rivalry-bg.jpg'], ['fgl-coming-soon.jpg'], ['feed-bg.jpg'], ['clubhouse-logo.png'],
  ['teeoff-hero.jpg'], ['teeoff-golf.jpg'], ['teeoff-sim.jpg'], ['teeoff-challenge.jpg'],
  ['teeoff-custom.jpg'], ['avatar.png'],
];
const DIRS = ['clubhouse-cards', 'avatars', 'course-logos'];

let copied = 0;
const missingMandatory = [];
const missingOptional = [];
for (const [src, dst] of FILES) {
  const s = path.join(root, src);
  if (fs.existsSync(s)) { fs.copyFileSync(s, path.join(dist, dst || path.basename(src))); copied++; }
  else (MANDATORY.has(src) ? missingMandatory : missingOptional).push(src);
}
for (const d of DIRS) {
  const s = path.join(root, d);
  if (fs.existsSync(s)) { fs.cpSync(s, path.join(dist, d), { recursive: true }); copied++; }
  else missingOptional.push(d + '/');
}

// Fail loudly if any mandatory runtime file is absent (e.g. a clean checkout missing app.js).
if (missingMandatory.length) {
  console.error('build:dist FAILED - mandatory runtime file(s) missing:');
  for (const m of missingMandatory) console.error('  - ' + m);
  console.error('These must be tracked/present or the app cannot boot. Aborting.');
  process.exit(1);
}
// Report (do not hide) optional assets that were absent.
if (missingOptional.length) {
  console.warn('build:dist WARNING - optional asset(s) missing (build continues):');
  for (const w of missingOptional) console.warn('  - ' + w);
}

// Cloudflare SPA fallback + headers (only if missing) - same as build-dist.sh
const redir = path.join(dist, '_redirects');
if (!fs.existsSync(redir)) fs.writeFileSync(redir, '/*    /index.html   200\n');
const headers = path.join(dist, '_headers');
if (!fs.existsSync(headers)) fs.writeFileSync(headers, '/*\n  Cache-Control: public, max-age=0, must-revalidate\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n');

const outLabel = (path.relative(root, dist) || '.') + '/';
console.log(`build:dist -> ${outLabel} (copied ${copied}, ${missingOptional.length} optional missing)`);
