/*
 * TRINN 4C — PARTIAL DEEP STRUCTURAL CONTRACT for the Clubhouse (dashboard).
 *
 * Locks the DURABLE component taxonomy of the live Clubhouse via stable, meaningful anchors only:
 * #clubhouse-grid, [data-clubhouse-component], and native roles + accessible names. It NEVER uses
 * nth-child, inline-style / click-attribute selectors, background images, coordinates, .chd class
 * chains, or exact px / percent / container-query / typography values.
 *
 * Approved count-freeze: 17 boxes = record 1, challenge 1, nav 6, stat 8, breakscore 1 (finding AG:
 * "16" was an outdated pre-Challenge count; 17 is canonical). Record + the 8 stat boxes are native
 * buttons with accessible names (finding AH). Typography is BLOCKED/DEFERRED (finding AF:
 * container-query sublabels fall below approved minimums) - there are NO typography assertions here.
 * and visual design are NOT an approved baseline; this contract covers structure, active state,
 * mounting, exclusivity and layout invariants only. See docs/app-machine/change-impact/trinn-4c.json.
 *
 * 3 tests: (1) root/active/mounting, (2) canonical component structure, (3) exclusivity + invariants.
 */
import { test, expect } from '../helpers/test';
import { stabilize } from '../helpers/stabilize';

const GRID = '#clubhouse-grid';

/* Canonical top-to-bottom component sequence (17), by data-clubhouse-component value. */
const CANONICAL_SEQUENCE = [
  'record',
  'challenge',
  'nav', 'nav', 'nav', 'nav', 'nav', 'nav',
  'stat', 'stat', 'stat', 'stat', 'stat', 'stat', 'stat', 'stat',
  'breakscore',
];
const NAV_NAMES = ['Rounds', 'Rivals', 'Trophies', 'Insights', 'Approvals', 'Handicap'];
const STAT_NAMES = ['Your handicap', 'Rounds played', 'Lowest handicap', 'Lowest round', 'Nemesis', 'Owned course', 'Stronger nine', 'Best trophy'];

async function bootDashboard(page: any) {
  await page.goto('/');
  await stabilize(page);
  await expect(page.locator('#tab-dashboard')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.tab)).toBe('dashboard');
}

async function componentSequence(page: any): Promise<string[]> {
  return await page.locator(GRID + ' > [data-clubhouse-component]')
    .evaluateAll((els: Element[]) => els.map(e => e.getAttribute('data-clubhouse-component') || ''));
}

test('4C: Clubhouse root, active page and mounting', async ({ page }) => {
  await bootDashboard(page);

  // Exactly one dashboard section, and it is the active main page.
  await expect(page.locator('#tab-dashboard')).toHaveCount(1);
  expect(await page.evaluate(() => document.body.dataset.tab), 'body[data-tab]').toBe('dashboard');
  await expect(page.locator('nav#tabs button[data-tab="dashboard"]'), 'Clubhouse nav active').toHaveClass(/\bactive\b/);

  // Exactly one live Clubhouse grid, mounted directly inside #dash-clubhouse-tail.
  await expect(page.locator(GRID)).toHaveCount(1);
  await expect(page.locator('#dash-clubhouse-tail > ' + GRID), 'grid mounted in #dash-clubhouse-tail').toHaveCount(1);
  // No duplicate Clubhouse main roots.
  await expect(page.locator('#dash-clubhouse-tail')).toHaveCount(1);
});

test('4C: canonical Clubhouse component structure (1/1/6/8/1 = 17, in order)', async ({ page }) => {
  await bootDashboard(page);

  // Exact top-to-bottom taxonomy via the durable data-clubhouse-component attribute.
  expect(await componentSequence(page), 'canonical component sequence').toEqual(CANONICAL_SEQUENCE);

  // Per-type counts + total.
  await expect(page.locator(GRID + ' [data-clubhouse-component="record"]')).toHaveCount(1);
  await expect(page.locator(GRID + ' [data-clubhouse-component="challenge"]')).toHaveCount(1);
  await expect(page.locator(GRID + ' [data-clubhouse-component="nav"]')).toHaveCount(6);
  await expect(page.locator(GRID + ' [data-clubhouse-component="stat"]')).toHaveCount(8);
  await expect(page.locator(GRID + ' [data-clubhouse-component="breakscore"]')).toHaveCount(1);
  await expect(page.locator(GRID + ' [data-clubhouse-component]'), 'total 17 canonical components').toHaveCount(17);

  const grid = page.locator(GRID);

  // Record: a native button with an accessible name.
  await expect(grid.getByRole('button', { name: 'Record this season', exact: true })).toHaveCount(1);

  // Navigation: 6 native buttons in the already-approved order (accessible names on data=nav boxes).
  const navNames = await page.locator(GRID + ' [data-clubhouse-component="nav"]')
    .evaluateAll((els: Element[]) => els.map(e => e.getAttribute('aria-label') || ''));
  expect(navNames, 'nav order').toEqual(NAV_NAMES);
  for (const name of NAV_NAMES) {
    await expect(grid.getByRole('button', { name, exact: true }), 'nav button: ' + name).toHaveCount(1);
  }

  // Stats: 8 native buttons with meaningful accessible names, in canonical order.
  const statNames = await page.locator(GRID + ' [data-clubhouse-component="stat"]')
    .evaluateAll((els: Element[]) => els.map(e => e.getAttribute('aria-label') || ''));
  expect(statNames, 'stat order').toEqual(STAT_NAMES);
  for (const name of STAT_NAMES) {
    await expect(grid.getByRole('button', { name, exact: true }), 'stat button: ' + name).toHaveCount(1);
  }

  // Breakscore: a non-interactive group with an accessible name (NOT a button).
  await expect(grid.getByRole('group', { name: 'Breakscore', exact: true }), 'breakscore group').toHaveCount(1);
  await expect(grid.getByRole('button', { name: 'Breakscore', exact: true }), 'breakscore is not a button').toHaveCount(0);
});

test('4C: challenge/resume exclusivity and layout invariants', async ({ page }) => {
  await bootDashboard(page);

  // Exactly one challenge/active-round slot; the removed legacy resume box stays unmounted.
  await expect(page.locator(GRID + ' [data-clubhouse-component="challenge"]')).toHaveCount(1);
  await expect(page.locator('#ch-resume-round'), 'no separate resume box mounted').toHaveCount(0);
  expect(await page.evaluate(() => document.body.classList.contains('ch-has-resume')), 'no resume body state').toBe(false);

  // No duplicate singular roots.
  await expect(page.locator(GRID + ' [data-clubhouse-component="record"]')).toHaveCount(1);
  await expect(page.locator(GRID + ' [data-clubhouse-component="breakscore"]')).toHaveCount(1);
  await expect(page.locator(GRID)).toHaveCount(1);

  // No transform: scale() on app-shell, dashboard root or the Clubhouse grid.
  const scaleClean = await page.evaluate(() => {
    const sel = ['.app', '#tab-dashboard', '#clubhouse-grid'];
    const scaleOf = (el: Element | null) => {
      if (!el) return 1;
      const t = getComputedStyle(el as HTMLElement).transform;
      if (!t || t === 'none') return 1;
      const m = t.match(/matrix3?d?\(([^)]+)\)/);
      if (!m) return 1;
      return Math.abs(parseFloat(m[1].split(',')[0]));
    };
    return sel.map(s => document.querySelector(s)).every(el => Math.abs(scaleOf(el) - 1) < 0.01);
  });
  expect(scaleClean, 'no transform: scale() on shell/dashboard/grid').toBe(true);

  // No global zoom other than normal/1.
  const zoomClean = await page.evaluate(() => {
    const els = [document.documentElement, document.body,
      document.querySelector('.app'), document.querySelector('#tab-dashboard'), document.querySelector('#clubhouse-grid')]
      .filter(Boolean) as HTMLElement[];
    return els.every(el => {
      const z = getComputedStyle(el).zoom;
      return z === '' || z === 'normal' || z === '1' || parseFloat(z) === 1;
    });
  });
  expect(zoomClean, 'no global zoom != 1').toBe(true);

  // No unintended horizontal overflow.
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'no horizontal overflow').toBeLessThanOrEqual(1);

  // Same canonical sequence (this test runs across all four projects).
  expect(await componentSequence(page), 'canonical sequence stable per project').toEqual(CANONICAL_SEQUENCE);
});
