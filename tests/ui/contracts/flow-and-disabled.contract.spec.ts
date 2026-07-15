/*
 * TRINN 4B-3 — MINIMUM CONTRACT: flow-step (Scorecard) + disabled-entry (Landing).
 *
 * Activation is always a REAL, visible user journey (role + accessible name, or the real
 * search/suggestion widget). No inline click-attribute selectors and no internal tab/render calls.
 *
 * 2 tests:
 *  1. Scorecard — reachable as step 3 of the in-Tee-Off wizard. Contract covers ONLY flow, active
 *     state and basic mounting. It deliberately does NOT lock width/height, column count, player
 *     layout, typography, spacing, internal order, exact scorecard details, or a visual baseline.
 *     Today's Scorecard design is NOT an approved baseline (see manifest — Scorecard status PARTIAL).
 *  2. Landing — disabled-entry. Negative contract: not mounted, not in navigation, does not take
 *     over. Proven only by observing the booted DOM (no internal welcome-wizard or tab calls).
 *
 * Findings T, U, V, W, X are documented in docs/app-machine/change-impact/trinn-4b-3.json.
 */
import { test, expect } from '../helpers/test';
import { stabilize } from '../helpers/stabilize';

/* Candidate score surfaces inside #rwz-step-3. At least one must be visible; which one is NOT locked
   (default hbh mounts #r-hbh-scorecard inside #r-input-hbh). This survives a future scorecard redesign. */
const SCORE_SURFACES = ['#r-hbh-scorecard', '#r-input-hbh', '#rwz-totals-host'];

/* The PWA install banner (#pwa-install-banner, role=dialog) can appear asynchronously (~2.2s after
 * load on mobile viewports - finding Y) and, as a bottom overlay, intercept pointer events on the
 * wizard. It is a separate GLOBAL surface, NOT part of the Scorecard contract. We dismiss it exactly
 * as a real user would - by clicking its visible "Later" button - and only when it is actually
 * visible. Once dismissed it does not reappear (the app sets a session flag). */
async function dismissInstallBannerIfVisible(page: any) {
  const later = page.getByRole('button', { name: 'Later', exact: true });
  if (await later.isVisible().catch(() => false)) {
    await later.click();
    await expect(page.locator('#pwa-install-banner'), 'install banner dismissed').not.toHaveClass(/\bshow\b/);
  }
}

/* Dismiss the banner if present, then click the target. If the banner slips in exactly during the
 * click and intercepts it, dismiss once more and retry. Real clicks only - no force. */
async function clickPastBanner(page: any, target: any) {
  await dismissInstallBannerIfVisible(page);
  try {
    await target.click({ timeout: 5000 });
  } catch {
    await dismissInstallBannerIfVisible(page);
    await target.click();
  }
}

test('4B-3: Scorecard is reachable via a real Tee Off journey (flow + active state + basic mounting)', async ({ page }) => {
  await page.goto('/');
  await stabilize(page);
  await expect(page.locator('#tab-dashboard')).toBeVisible();

  // 1) Open Tee Off from the visible main navigation.
  await page.getByRole('button', { name: 'Tee Off', exact: true }).click();
  await expect(page.locator('#tab-round')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.tab)).toBe('round');

  // 2) Golf Round is a visible kind card (its card image supplies the accessible name). Tapping it is
  //    the real way forward: the card's own handler advances the wizard to step 1 (finding X). This is
  //    a genuine click on a visible control - the test itself makes no internal call.
  await page.getByRole('button', { name: 'Golf Round', exact: true }).click();
  await expect(page.locator('#rwz-step-1'), 'tapping Golf Round advances to wizard step 1').toBeVisible();

  // 3) Next in the VISIBLE step 1 - scoped to the step so the duplicate "Next" in step 2 (finding T)
  //    is never matched. Scoping is by container id (not by any click-attribute selector). The PWA
  //    banner (finding Y) is dismissed via its real "Later" button if it has appeared.
  await clickPastBanner(page, page.locator('#rwz-step-1').getByRole('button', { name: /Next/ }));
  await expect(page.locator('#rwz-step-2')).toBeVisible();

  // 4) Choose the first valid, non-empty course through the REAL search widget. #r-course is a hidden
  //    <select>; the actual control is #r-course-search + a suggestion list (finding W).
  const search = page.locator('#r-course-search');
  await search.click();
  await search.fill('18 Hole');   // matches the seeded "18 Hole Course"
  const firstSuggestion = page.locator('#r-course-suggestions .course-suggestion-item[data-id]').first();
  await expect(firstSuggestion, 'a real course suggestion appears').toBeVisible();
  await firstSuggestion.click();
  // The step 2 -> 3 gate is a non-empty #r-course value.
  await expect
    .poll(async () => await page.locator('#r-course').evaluate((el) => (el as HTMLSelectElement).value))
    .not.toBe('');

  // 5) Next in the VISIBLE step 2 (dismiss the PWA banner via its real "Later" button if present).
  await clickPastBanner(page, page.locator('#rwz-step-2').getByRole('button', { name: /Next/ }));

  // ---- After the journey: flow + active state + basic mounting ONLY ----
  await expect(page.locator('#rwz-step-3'), 'scorecard step visible').toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.tab), 'Tee Off stays the active tab').toBe('round');
  await expect(page.locator('nav#tabs button[data-tab="round"]'), 'Tee Off nav button active').toHaveClass(/\bactive\b/);

  // Previous steps and the kind picker are hidden.
  await expect(page.locator('#rwz-step-1')).toBeHidden();
  await expect(page.locator('#rwz-step-2')).toBeHidden();
  await expect(page.locator('#r-kind-panel')).toBeHidden();

  // Exactly one scorecard step root and exactly one scorecard root — no duplicates.
  await expect(page.locator('#rwz-step-3')).toHaveCount(1);
  await expect(page.locator('#r-hbh-scorecard')).toHaveCount(1);

  // At least one actual score surface is visible (which one is intentionally not locked).
  const visibleSurfaces = await page.evaluate((sels) =>
    sels.filter((s) => {
      const el = document.querySelector(s) as HTMLElement | null;
      return !!el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
    }).length, SCORE_SURFACES);
  expect(visibleSurfaces, 'at least one score surface is visible').toBeGreaterThan(0);

  // No unintended horizontal overflow.
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'no horizontal overflow').toBeLessThanOrEqual(1);
});

test('4B-3: Landing (disabled-entry) is not mounted, not in navigation and does not take over', async ({ page }) => {
  await page.goto('/');
  await stabilize(page);

  // frLandingGate re-runs on timers at 700 / 1600 / 3500 ms. Wait past the last one so the test can
  // never pass before the final scheduled gate has had its chance to (not) mount the overlay.
  await page.waitForTimeout(3800);

  // Not mounted: the welcome/landing overlay is absent from the DOM.
  await expect(page.locator('#wl-overlay')).toHaveCount(0);
  // Body is not in the landing-showing state.
  expect(await page.evaluate(() => document.body.classList.contains('wl-showing'))).toBe(false);
  // No visible landing control in the main navigation.
  await expect(page.locator('nav#tabs button[data-tab="landing"]')).toHaveCount(0);
  // Clubhouse is still the active surface — landing did not take over.
  await expect(page.locator('#tab-dashboard')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.tab)).toBe('dashboard');
});
