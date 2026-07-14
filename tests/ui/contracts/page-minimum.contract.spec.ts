/*
 * TRINN 4B-1 - MINIMUM STRUKTURELL KONTRAKT FOR PRIMARY TABS.
 * Clubhouse, Tee Off, Rivalry, Feed, FGL.
 *
 * - Aktivering via SYNLIG nav-klikk (ikke window.activateTab).
 * - Deterministisk tom fixture (seedEmptyState) + blokkerte service workers.
 *   Ingen produksjonsdata, ingen nettverksavhengighet.
 * - Kontraktene peker mot FAKTISK LIVE-VISNING. Skjult legacy-markup er bevisst utelatt,
 *   slik at senere opprydding ikke blokkeres av testene (se manifestets product_findings).
 * - FGL testes som placeholder, ikke som live-side.
 *
 * Dekker IKKE layout/a11y (trinn 6), visuelt (trinn 7), funksjonelt/data (trinn 5),
 * wizard-stegene (4B-3), Clubhouse-dybde (4C) eller negative mutasjoner (4D).
 */
import { test, expect } from '../helpers/test';
import { stabilize } from '../helpers/stabilize';
import { PRIMARY_TAB_CONTRACTS, LEAK_TOKENS, PageContract } from '../fixtures/page-contracts';

async function activateViaVisibleNav(page: any, key: string) {
  const btn = page.locator('nav#tabs button[data-tab="' + key + '"]');
  await expect(btn, 'nav button for "' + key + '" must be visible (activation via real user click)').toBeVisible();
  await btn.click();
  await expect(page.locator('#tab-' + key), 'section #tab-' + key + ' is visible after nav click').toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.dataset.tab ?? null), { timeout: 5000 })
    .toBe(key);
}

for (const c of PRIMARY_TAB_CONTRACTS as PageContract[]) {
  test('4B-1: "' + c.name + '" satisfies its minimum structural contract', async ({ page }) => {
    await page.goto('/');
    await stabilize(page);
    await activateViaVisibleNav(page, c.key);

    const root = page.locator(c.root);
    await expect(root, c.name + ': root ' + c.root).toHaveCount(1);

    // Async render (Feed): vent til den dokumenterte tilstanden faktisk er i DOM.
    if (c.async && c.asyncAnchor) {
      await expect
        .poll(async () => page.locator(c.root + ' ' + c.asyncAnchor).count(), { timeout: 10000 })
        .toBeGreaterThan(0);
    }

    // 1) Obligatoriske, synlige strukturer (live-visningen).
    for (const sel of c.requiredVisible ?? []) {
      await expect(page.locator(c.root + ' ' + sel).first(), c.name + ': ' + sel + ' must be visible').toBeVisible();
    }

    // 2) Maa finnes, men er lovlig skjult i tom tilstand (data-gatet / inaktiv fase).
    for (const sel of c.requiredPresentButHidden ?? []) {
      await expect(page.locator(c.root + ' ' + sel), c.name + ': ' + sel + ' must exist in DOM').toHaveCount(1);
      await expect(page.locator(c.root + ' ' + sel), c.name + ': ' + sel + ' is legally hidden with an empty fixture').toBeHidden();
    }

    // 3) Slot-unikhet: side-spesifikke selektorer, ikke generell ID-kontroll.
    for (const e of c.exactCounts ?? []) {
      await expect(page.locator(c.root + ' ' + e.selector), c.name + ': exactly ' + e.count + ' x ' + e.selector).toHaveCount(e.count);
    }

    // 4) Minst N SYNLIGE forekomster.
    for (const m of c.minVisible ?? []) {
      const loc = page.locator(m.selector);
      const total = await loc.count();
      let visible = 0;
      for (let i = 0; i < total; i++) if (await loc.nth(i).isVisible()) visible++;
      expect(visible, c.name + ': at least ' + m.min + ' visible x ' + m.selector + ' (found ' + visible + ' of ' + total + ')').toBeGreaterThanOrEqual(m.min);
    }

    // 5) Containere som maa vaere fylt (rendret innhold, ikke tom shell).
    for (const sel of c.filled ?? []) {
      const n = await page.locator(c.root + ' ' + sel).evaluate((el: Element) => el.childElementCount);
      expect(n, c.name + ': ' + sel + ' must be filled (childElementCount > 0)').toBeGreaterThan(0);
    }

    // 6) Skal IKKE finnes i den deterministiske tom-tilstanden.
    for (const sel of c.forbidden ?? []) {
      await expect(page.locator(c.root + ' ' + sel), c.name + ': ' + sel + ' must NOT be present with an empty fixture').toHaveCount(0);
    }

    // 7) Dynamiske verdier ER DOM-innhold:
    //    - minst N treff (requireAtLeast hindrer at testen bestaar med null treff)
    //    - minst M SYNLIGE treff (hindrer at et usynlig skall gir groent)
    //    - ALLE treff har ikke-tom DOM-tekst
    for (const d of c.dynamicText ?? []) {
      const loc = page.locator(c.root + ' ' + d.selector);
      const n = await loc.count();
      expect(n, c.name + ': expected at least ' + d.requireAtLeast + ' x ' + d.selector + ' (found ' + n + ')').toBeGreaterThanOrEqual(d.requireAtLeast);

      if (d.requireVisibleAtLeast != null) {
        let visible = 0;
        for (let i = 0; i < n; i++) if (await loc.nth(i).isVisible()) visible++;
        expect(visible, c.name + ': expected at least ' + d.requireVisibleAtLeast + ' VISIBLE x ' + d.selector + ' (found ' + visible + ' of ' + n + ')').toBeGreaterThanOrEqual(d.requireVisibleAtLeast);
      }

      const texts = await loc.allTextContents();
      const empty = texts.map((t, i) => ({ i, t: (t ?? '').trim() })).filter(x => x.t === '');
      expect(empty, c.name + ': ' + d.selector + ' with empty DOM text at index ' + JSON.stringify(empty.map(x => x.i))).toEqual([]);
    }

    // 8) Generell lekkasjekontroll - i TILLEGG til det side-spesifikke, aldri som erstatning.
    const text = (await root.innerText()) ?? '';
    const leaks = LEAK_TOKENS.filter(t => text.includes(t));
    expect(leaks, c.name + ': leaked placeholder tokens in DOM text: ' + JSON.stringify(leaks)).toEqual([]);
  });
}
