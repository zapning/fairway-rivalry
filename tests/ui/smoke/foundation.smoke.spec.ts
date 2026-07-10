/*
 * FOUNDATION SMOKE (BUILD-PLAN trinn 3) — proves the test foundation works.
 * It does NOT create or approve visual baselines (golden snapshots belong to trinn 6).
 * Runs across chromium-390, chromium-412, webkit-390, webkit-412 (see playwright.config.ts).
 *
 * Verified entry: `/` boots the app shell with the dashboard (Clubhouse) tab active
 * (landing is disabled in app.js). No assumption about `/clubhouse`.
 */
import { test, expect } from '../helpers/test';
import { stabilize } from '../helpers/stabilize';

test('foundation: builds, serves, boots app-root, no horizontal overflow, SW blocked', async ({ page }) => {
  await page.goto('/');
  await stabilize(page);

  // Actual app-root is visible.
  await expect(page.locator('.app')).toBeVisible();
  await expect(page.locator('#tabs')).toBeVisible();

  // Clubhouse is the default active tab (verified from shell markup).
  await expect(page.locator('nav.tabs button[data-tab="dashboard"]')).toHaveClass(/active/);

  // Service workers are blocked (no PWA cache influence).
  const swController = await page.evaluate(
    () => ('serviceWorker' in navigator) ? navigator.serviceWorker.controller : 'no-sw-api'
  );
  expect(swController).toBeNull();

  // No horizontal overflow at the locked viewport.
  const m = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    innerW: window.innerWidth,
  }));
  expect.soft(m.scrollW, JSON.stringify(m)).toBeLessThanOrEqual(m.clientW + 1);
  expect(m.scrollW).toBeLessThanOrEqual(m.innerW + 1);
});
