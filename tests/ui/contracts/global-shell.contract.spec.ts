/*
 * TRINN 4A — GLOBALE STRUKTURELLE KONTRAKTER (app-shell, header, hovednavigasjon).
 * Produktomfattende: disse invariantene deles av ALLE sider.
 * 7 felles globale kontrakttester + 5 separate sidebyttetester = 12.
 *
 * VERIFISERT DOM-HIERARKI (ikke antatt):
 *   .app > div.header-bg
 *   .app > header[data-testid="app-header"]      <- direkte barn av .app
 *   .app > div#tabs-wrap > nav#tabs              <- nav ligger i #tabs-wrap, IKKE direkte i .app
 *   .app > section#tab-*
 * Kontrakten krever derfor at #tabs-wrap er direkte barn av .app, og at nav#tabs aldri
 * ligger inne i sideinnhold. Markup er IKKE endret for aa passe en test.
 *
 * Dekker IKKE layout, tilgjengelighet, visuelt eller funksjonelt (trinn 5-7),
 * ikke Clubhouse-dybde (4C) og ikke negative mutasjoner (4D).
 */
import { test, expect } from '../helpers/test';
import { stabilize } from '../helpers/stabilize';
import { PRIMARY_TABS, ALL_MOUNTED, LANDING_ROOT_CANDIDATES, SHELL } from '../fixtures/pages';

const NAV_ORDER = PRIMARY_TABS.map(p => p.key); // dashboard, round, rivalry, feed, fgl

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await stabilize(page);
});

/* ---------- 7 felles globale kontrakttester ---------- */

test('4A-C1: exactly one app-shell', async ({ page }) => {
  await expect(page.locator(SHELL.app)).toHaveCount(1);
});

test('4A-C2: exactly one header, direct child of app-shell, never inside page content', async ({ page }) => {
  const r = await page.evaluate((s) => {
    const hooks = Array.from(document.querySelectorAll(s.header));
    const app = document.querySelector(s.app);
    const inSection = Array.from(document.querySelectorAll('section[id^="tab-"]'))
      .filter(sec => sec.querySelector(s.header) || sec.querySelector('header')).map(sec => sec.id);
    return {
      hookCount: hooks.length,
      headerElCount: document.querySelectorAll('header').length,
      isDirectChildOfApp: hooks.length === 1 && hooks[0].parentElement === app,
      inSection,
    };
  }, SHELL);
  expect(r.hookCount, 'exactly one [data-testid="app-header"]').toBe(1);
  expect(r.headerElCount, 'no extra <header> elements anywhere').toBe(1);
  expect(r.isDirectChildOfApp, 'header is a direct child of .app').toBe(true);
  expect(r.inSection, 'no header inside section[id^="tab-"]: ' + JSON.stringify(r.inSection)).toEqual([]);
});

test('4A-C3: exactly one main navigation, mounted as global chrome, never inside page content', async ({ page }) => {
  const r = await page.evaluate((s) => {
    const navs = Array.from(document.querySelectorAll(s.nav));
    const app = document.querySelector(s.app);
    const wraps = Array.from(document.querySelectorAll('#tabs-wrap'));
    const wrap = wraps[0] ?? null;
    const inSection = Array.from(document.querySelectorAll('section[id^="tab-"]'))
      .filter(sec => sec.querySelector('#tabs')).map(sec => sec.id);
    return {
      navCount: navs.length,
      wrapCount: wraps.length,
      wrapIsDirectChildOfApp: !!wrap && wrap.parentElement === app,
      navIsInsideWrap: navs.length === 1 && navs[0].parentElement === wrap,
      navInsideAnySection: navs.length === 1 && navs[0].closest('section[id^="tab-"]') !== null,
      inSection,
    };
  }, SHELL);
  expect(r.wrapCount, 'exactly one #tabs-wrap').toBe(1);
  expect(r.navCount, 'exactly one nav#tabs').toBe(1);
  expect(r.wrapIsDirectChildOfApp, '#tabs-wrap is a direct child of .app').toBe(true);
  expect(r.navIsInsideWrap, 'nav#tabs is mounted in #tabs-wrap (global chrome)').toBe(true);
  expect(r.navInsideAnySection, 'nav#tabs is NOT inside any page section').toBe(false);
  expect(r.inSection, 'no nav#tabs inside page content: ' + JSON.stringify(r.inSection)).toEqual([]);
});

test('4A-C4: navigation exposes exactly the expected visible tabs, in order, with no duplicates', async ({ page }) => {
  const r = await page.evaluate((s) => {
    const btns = Array.from(document.querySelectorAll<HTMLElement>(s.navButtons));
    return {
      visible: btns.filter(b => getComputedStyle(b).display !== 'none').map(b => b.dataset.tab as string),
      all: btns.map(b => b.dataset.tab as string),
    };
  }, SHELL);
  expect(r.visible, 'visible nav order').toEqual(NAV_ORDER);
  expect(new Set(r.visible).size, 'no duplicate visible nav tabs').toBe(r.visible.length);
  expect(new Set(r.all).size, 'no duplicate data-tab values anywhere in nav').toBe(r.all.length);
});

test('4A-C5: active state is machine-readable, unique, and consistent on load', async ({ page }) => {
  const r = await page.evaluate((s) => {
    const active = Array.from(document.querySelectorAll<HTMLElement>(s.navButtons)).filter(b => b.classList.contains('active'));
    const shown = Array.from(document.querySelectorAll<HTMLElement>('section[id^="tab-"]'))
      .filter(el => getComputedStyle(el).display !== 'none').map(el => el.id.replace(/^tab-/, ''));
    return { activeCount: active.length, activeKey: active[0]?.dataset.tab ?? null, bodyTab: document.body.dataset.tab ?? null, shown };
  }, SHELL);
  expect(r.activeCount, 'exactly one active nav button').toBe(1);
  expect(r.bodyTab, 'body[data-tab] is present (machine-readable)').not.toBeNull();
  expect(r.activeKey, 'active nav tab agrees with body[data-tab]').toBe(r.bodyTab);
  expect(r.shown.length, 'exactly one visible page section: ' + JSON.stringify(r.shown)).toBe(1);
  expect(r.shown[0], 'visible section matches active tab').toBe(r.bodyTab);
});

test('4A-C6: every registered page root exists, and the disabled entry is not mounted', async ({ page }) => {
  for (const p of ALL_MOUNTED) {
    await expect(page.locator(p.root as string), p.name + ' root ' + p.root).toHaveCount(1);
  }
  const landingMounted = await page.evaluate((sels) => sels.some(s => document.querySelector(s) !== null), LANDING_ROOT_CANDIDATES);
  expect(landingMounted, 'Landing is a disabled-entry and must not be mounted').toBe(false);
});

test('4A-C7: no duplicate element IDs and no duplicate data-testid values', async ({ page }) => {
  const r = await page.evaluate(() => {
    const count = (nodes: Element[], read: (el: Element) => string | null) => {
      const seen = new Map<string, number>();
      for (const el of nodes) {
        const v = (read(el) ?? '').trim();
        if (v === '') continue;                       // tomme verdier ignoreres
        seen.set(v, (seen.get(v) ?? 0) + 1);
      }
      return Array.from(seen.entries()).filter(([, n]) => n > 1).map(([v, n]) => v + ' x' + n);
    };
    return {
      dupeIds: count(Array.from(document.querySelectorAll('[id]')), el => el.getAttribute('id')),
      dupeTestIds: count(Array.from(document.querySelectorAll('[data-testid]')), el => el.getAttribute('data-testid')),
      testIdTotal: document.querySelectorAll('[data-testid]').length,
    };
  });
  expect(r.dupeIds, 'duplicate element IDs: ' + JSON.stringify(r.dupeIds)).toEqual([]);
  expect(r.dupeTestIds, 'duplicate data-testid values: ' + JSON.stringify(r.dupeTestIds)).toEqual([]);
  expect(r.testIdTotal, 'at least the app-header test hook is present').toBeGreaterThan(0);
});

/* ---------- 5 separate sidebyttetester ---------- */

for (const key of NAV_ORDER) {
  test('4A-S: switching to "' + key + '" activates the correct page and nav element', async ({ page }) => {
    await page.locator('nav#tabs button[data-tab="' + key + '"]').click();

    const r = await page.evaluate((args) => {
      const { s, primaryKeys } = args;
      const btns = Array.from(document.querySelectorAll<HTMLElement>(s.navButtons));
      const active = btns.filter(b => b.classList.contains('active'));
      const visibility: Record<string, boolean> = {};
      for (const k of primaryKeys) {
        const el = document.querySelector<HTMLElement>('#tab-' + k);
        visibility[k] = !!el && getComputedStyle(el).display !== 'none';
      }
      return {
        activeCount: active.length,
        activeKey: active[0]?.dataset.tab ?? null,
        bodyTab: document.body.dataset.tab ?? null,
        visibility,
      };
    }, { s: SHELL, primaryKeys: NAV_ORDER });

    expect(r.activeCount, key + ': exactly one nav button is active').toBe(1);
    expect(r.activeKey, key + ': the correct nav button is active').toBe(key);
    expect(r.bodyTab, key + ': body[data-tab] has the correct value').toBe(key);
    expect(r.visibility[key], key + ': the correct page is visible').toBe(true);

    const othersVisible = NAV_ORDER.filter(k => k !== key && r.visibility[k]);
    expect(othersVisible, key + ': all other primary-tab pages are hidden, but these were visible: ' + JSON.stringify(othersVisible)).toEqual([]);
  });
}
