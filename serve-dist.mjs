/* Static server for the Playwright mobile suite — serves dist/ on :3000 with SPA fallback,
   so path routes like /clubhouse and /tee-off resolve to index.html. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
// Served dir: SERVE_DIR / DIST_OUT env when set (e.g. .playwright-dist for tests),
// else dist/ (production default). Keeps tests off the tracked dist/ tree.
const SERVE = process.env.SERVE_DIR || process.env.DIST_OUT;
const DIST = SERVE ? path.resolve(SERVE) : path.join(__dir, 'dist');
const PORT = process.env.PORT ? +process.env.PORT : (process.argv[2] ? +process.argv[2] : 3000);
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let f = decodeURIComponent((req.url || '/').split('?')[0]);
  if (f === '/') f = '/index.html';
  let fp = path.join(DIST, f);
  fs.readFile(fp, (err, data) => {
    if (err) {
      // SPA fallback: unknown route -> index.html (so /clubhouse, /tee-off, etc. work)
      fs.readFile(path.join(DIST, 'index.html'), (e2, d2) => {
        if (e2) { res.statusCode = 404; return res.end('not found'); }
        res.setHeader('content-type', 'text/html'); res.end(d2);
      });
      return;
    }
    res.setHeader('content-type', TYPES[path.extname(fp)] || 'application/octet-stream');
    res.end(data);
  });
}).listen(PORT, () => console.log('dist served on http://localhost:' + PORT));
