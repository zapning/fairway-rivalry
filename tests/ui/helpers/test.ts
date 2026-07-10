/*
 * Authoritative test base for tests/ui/**.
 * Each test gets a fresh Playwright context (empty storage) + service workers blocked
 * (from playwright.config.ts). This fixture additionally seeds a deterministic EMPTY
 * state before app boot, so no leftover/localStorage from a previous build can leak in.
 */
import { test as base, expect } from '@playwright/test';
import { seedEmptyState } from '../fixtures/state';

export const test = base.extend({
  page: async ({ page }, use) => {
    await seedEmptyState(page);
    await use(page);
  },
});

export { expect };
