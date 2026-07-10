/*
 * Stabilize a page for deterministic assertions/screenshots.
 * Waits for a VERIFIED app-ready state (not networkidle alone):
 *   - window.activateTab is a function, window.__frErrors is defined (from app.js)
 *   - .app and #tabs are in the DOM
 * Then disables animations/transitions, waits for fonts and visible images.
 */
import type { Page } from '@playwright/test';

export async function waitAppReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const w = window as any;
    return typeof w.activateTab === 'function'
      && typeof w.__frErrors !== 'undefined'
      && !!document.querySelector('.app')
      && !!document.querySelector('#tabs');
  }, undefined, { timeout: 20_000 });
}

export async function stabilize(page: Page): Promise<void> {
  await waitAppReady(page);
  // Freeze animations, transitions, smooth scroll and caret.
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important;caret-color:transparent!important;}`,
  });
  // Fonts ready.
  await page.evaluate(async () => { const d: any = document; if (d.fonts && d.fonts.ready) { await d.fonts.ready; } });
  // Visible images loaded/decoded.
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      if (img.decode) return img.decode().catch(() => {});
      return new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); });
    }));
  });
}
