/*
 * Deterministic state fixtures for the UI test foundation.
 * Verified from source (app.js): the app persists its main state under `golfDashboard_v1`,
 * plus `fgl_*` flags. Landing is disabled, so the app boots directly to the dashboard
 * (Clubhouse) tab regardless of stored state.
 *
 * Trinn 3 uses a deterministic EMPTY/default state (clean storage). Rich, per-scenario
 * fixtures (populated profiles, rounds, rivals, 1–4 players) come later (trinn 7).
 */
import type { Page } from '@playwright/test';

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
