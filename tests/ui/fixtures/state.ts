/*
 * Deterministic state fixtures for the UI test foundation.
 * Verified from source (app.js): the CURRENT persisted key is 'golfDashboard_v2'
 * (loadState reads it first; 'golfDashboard_v1' is only the legacy migration key). Plus `fgl_*` flags.
 * Landing is disabled, so the app boots directly to the dashboard (Clubhouse) tab.
 *
 * The UI foundation uses a deterministic EMPTY/default state (clean storage). A seeded-round
 * fixture is intentionally NOT provided here: the only Clubhouse entry into Stats ("Full stats ->")
 * is dead code in the V3 dashboard (renderDashboard returns before renderYourGame runs), so
 * #tab-stats is orphaned and not contracted in 4B-2 (see change-impact finding S). When Stats
 * gains a real, reachable entry, add the appropriate round fixture then.
 */
import type { Page } from '@playwright/test';

/** Legacy v1 migration key (kept for reference; app.js migrates v1 -> v2 only when v2 is absent). */
export const PRIMARY_STATE_KEY = 'golfDashboard_v1';

/** Storage-key prefixes the app uses (for deterministic clearing). */
export const APP_KEY_PREFIXES = ['golfDashboard_', 'fgl_', 'fairway.', 'fairway_'];

/**
 * Ensure a deterministic EMPTY state before any app script runs.
 * Runs as an init script (before app.js boots) so localStorage/sessionStorage start clean, and
 * neutralizes deferred, NON-contract async surfaces that otherwise fire on a timer/load and
 * intermittently perturb activation in the fastest-booting project (observed reproducibly in
 * chromium-390): the PWA install banner (change-impact finding Y) and the service-worker update
 * toast + its `controllerchange -> location.reload()` path (app.js SW block). These land inside the
 * focus()->Enter window and can stop `activateTab(...)` from taking effect. This is ENVIRONMENT
 * control only — no contract assertion, timeout, retry, or product/contract code is changed.
 */
export async function seedEmptyState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      // App-native suppression of the PWA install banner (installDismissedRecently() reads this).
      sessionStorage.setItem('fairway.pwa.dismissed', '1');
      // Neutralize ONLY the service-worker update/reload path (config already blocks SWs), without
      // otherwise crippling the SW container:
      //  - register() resolves to a minimal, harmless registration mock (no waiting/installing SW ->
      //    no "new version" toast), so nothing hangs asynchronously.
      //  - controllerchange (the mid-test reload trigger) is ignored; every other event type is
      //    forwarded to the original addEventListener.
      try {
        const swc = (navigator as any).serviceWorker;
        if (swc) {
          swc.register = () => Promise.resolve({
            installing: null, waiting: null, active: null, scope: '/',
            update: () => Promise.resolve(),
            unregister: () => Promise.resolve(true),
            addEventListener: () => {}, removeEventListener: () => {},
          });
          const origAdd = swc.addEventListener.bind(swc);
          swc.addEventListener = (type: string, listener: any, options?: any) => {
            if (type === 'controllerchange') return;
            return origAdd(type, listener, options);
          };
        }
      } catch (e) { /* SW container unavailable */ }
    } catch (e) { /* storage may be unavailable in some contexts */ }
  });
}
