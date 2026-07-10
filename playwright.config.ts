import { defineConfig } from '@playwright/test';

/*
 * AUTHORITATIVE Playwright config for the app-machine UI test foundation (BUILD-PLAN trinn 3).
 * - Discovers ONLY tests/ui/**\/*.spec.ts (old/prod suites are never picked up).
 * - One server, one port, one baseURL. A fresh build is written to .playwright-dist/
 *   (NOT the tracked dist/ tree) via DIST_OUT, then served from the same dir.
 * - Service workers blocked so PWA cache can never influence a test.
 * Run:  npm run test:ui   (always via `-c playwright.config.ts`)
 * Legacy configs (playwright.config.js, playwright.mobile.config.js, tests/playwright.config.js)
 * are kept as legacy and must be invoked with their own explicit `-c`.
 */
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/ui',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: 'test-results/ui',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/ui', open: 'never' }],
    ['json', { outputFile: 'test-results/ui/results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    serviceWorkers: 'block',      // PWA / service-worker cache must never affect tests
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  webServer: {
    command: `node build-dist.mjs && node serve-dist.mjs ${PORT}`,
    // Build + serve an isolated test dir so a test run never touches the tracked dist/.
    // Cross-platform (Windows + Linux): env is injected by Playwright, not shell-prefixed.
    env: { DIST_OUT: '.playwright-dist', SERVE_DIR: '.playwright-dist' },
    url: `${BASE_URL}/index.html`,
    reuseExistingServer: !process.env.CI,   // CI never reuses an existing server
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    { name: 'chromium-390', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 3 } },
    { name: 'chromium-412', use: { browserName: 'chromium', viewport: { width: 412, height: 915 }, hasTouch: true, deviceScaleFactor: 2.6 } },
    { name: 'webkit-390',   use: { browserName: 'webkit',   viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 3 } },
    { name: 'webkit-412',   use: { browserName: 'webkit',   viewport: { width: 412, height: 915 }, hasTouch: true, deviceScaleFactor: 2.6 } },
  ],
});
