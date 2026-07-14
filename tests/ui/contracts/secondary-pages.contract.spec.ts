/*
 * TRINN 4B-2 — MINIMUM STRUCTURAL CONTRACT FOR SECONDARY PAGES + SECONDARY SURFACES.
 *
 * Activation is always a REAL, visible user interaction, selected by role + accessible name
 * (getByRole). Never inline onclick, never window.activateTab, never a V3-specific class name.
 *
 * 6 tests: Rounds, Rivals, Trophies, Approvals (V3 icon buttons) + Insights-modal,
 * Handicap-modal (secondary surfaces, NOT pages).
 *
 * NOT contracted here (see manifest): Profile/Settings (cloud-gated, finding R — logged-out the
 * profile chip opens the auth flow, and the native menu buttons only exist for a logged-in user)
 * and Stats (#tab-stats orphaned, finding S — renderDashboard returns before the "Full stats"
 * entry is ever created). Orphaned/legacy #tab-insights and #tab-courses get NO page contract
 * either. Product finding Q (shared modal a11y) is documented, NOT solved in 4B-2.
 */
import { test, expect } from '../helpers/test';
import { stabilize } from '../helpers/stabilize';
import { ICON_PAGES, MODAL_BUTTONS, MODAL } from '../fixtures/secondary-pages';

async function bootDashboard(page: any) {
  await page.goto('/');
  await stabilize(page);
  // Landing disabled -> Clubhouse (dashboard) is the active tab on boot.
  await expect(page.locator('#tab-dashboard')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.tab)).toBe('dashboard');
}

async function assertActivePage(page: any, key: string, root: string) {
  await expect(page.locator(root), key + ': section visible').toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.tab), key + ': body[data-tab]').toBe(key);
  // Exactly one page section visible = the one we opened.
  const shown = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('section[id^="tab-"]'))
      .filter(el => getComputedStyle(el).display !== 'none').map(el => el.id.replace(/^tab-/, '')));
  expect(shown, key + ': exactly the target section is visible: ' + JSON.stringify(shown)).toEqual([key]);
}

/* ---------- 4 V3-icon secondary pages ---------- */
for (const p of ICON_PAGES) {
  test('4B-2: "' + p.name + '" opens via its Clubhouse icon button (' + p.activation + ')', async ({ page }) => {
    await bootDashboard(page);
    const btn = page.getByRole('button', { name: p.name, exact: true });
    await expect(btn, p.name + ': icon button is visible with an accessible name').toBeVisible();

    if (p.activation === 'enter') {
      await btn.focus();
      await page.keyboard.press('Enter');
    } else if (p.activation === 'space') {
      await btn.focus();
      await page.keyboard.press('Space');
    } else {
      await btn.click();
    }
    await assertActivePage(page, p.key, p.root);
  });
}

/* ---------- 2 secondary surfaces: shared modal, NOT a page ---------- */
for (const m of MODAL_BUTTONS) {
  test('4B-2: "' + m.name + '" opens the shared modal surface without navigating', async ({ page }) => {
    await bootDashboard(page);
    const btn = page.getByRole('button', { name: m.name, exact: true });
    await expect(btn, m.name + ': surface button visible with accessible name').toBeVisible();
    await btn.click();

    // The shared modal backdrop becomes visible and its content container is non-empty.
    await expect(page.locator(MODAL.backdrop), m.name + ': modal backdrop visible').toBeVisible();
    const contentLen = await page.locator(MODAL.content).evaluate((el: Element) => (el.textContent || '').trim().length);
    expect(contentLen, m.name + ': modal content is non-empty').toBeGreaterThan(0);

    // Crucially: this is a SURFACE, not a page. Dashboard stays active, nothing else opens.
    expect(await page.evaluate(() => document.body.dataset.tab), m.name + ': dashboard stays active').toBe('dashboard');
    await expect(page.locator('#tab-insights'), m.name + ': orphaned #tab-insights stays hidden').toBeHidden();
    const shown = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('section[id^="tab-"]'))
        .filter(el => getComputedStyle(el).display !== 'none').map(el => el.id));
    expect(shown, m.name + ': only #tab-dashboard is the visible section').toEqual(['tab-dashboard']);
    // Orphaned #tab-courses also stays out of the visible page set.
    await expect(page.locator('#tab-courses'), m.name + ': orphaned #tab-courses stays hidden').toBeHidden();
  });
}
