import { defineConfig } from '@playwright/test';

/*
 * TRINN 4D — mutation config.
 *
 * Used ONLY by the mutation harness (tests/ui/mutations/run-mutations.mjs). It has NO webServer and
 * NO build step: the harness builds an isolated copy, applies one mutation, and serves it on a
 * dynamic port. This config simply runs the UNCHANGED contract spec against that server (baseURL +
 * JSON report path come from env), across the same four projects as the ordinary suite.
 *
 * It never builds, never serves the tracked dist/, and never touches source. Retries are 0 so an
 * expected-red run is reported deterministically once.
 */
const BASE_URL = process.env.MUT_BASE_URL || 'http://localhost:3100';

export default defineConfig({
  testDir: 'tests/ui/contracts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: false,
  // Single JSON mechanism: the harness sets PLAYWRIGHT_JSON_OUTPUT_FILE (absolute path) per run.
  reporter: [['line'], ['json']],
  use: {
    baseURL: BASE_URL,
    serviceWorkers: 'block',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    { name: 'chromium-390', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 3 } },
    { name: 'chromium-412', use: { browserName: 'chromium', viewport: { width: 412, height: 915 }, hasTouch: true, deviceScaleFactor: 2.6 } },
    { name: 'webkit-390',   use: { browserName: 'webkit',   viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 3 } },
    { name: 'webkit-412',   use: { browserName: 'webkit',   viewport: { width: 412, height: 915 }, hasTouch: true, deviceScaleFactor: 2.6 } },
  ],
});
