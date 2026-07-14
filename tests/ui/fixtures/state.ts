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
 * Runs as an init script (before app.js boots) so localStorage/sessionStorage start clean.
 */
export async function seedEmptyState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) { /* storage may be unavailable in some contexts */ }
  });
}
