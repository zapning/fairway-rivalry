/*
 * Produkt-/sideregister for strukturelle kontrakter (BUILD-PLAN v3 trinn 4).
 * Single source of truth for tests. Speiler design/contracts/CONTRACT-REGISTER.md.
 * Fakta er verifisert mot faktisk DOM — ikke antatt.
 */
export type PageType = 'primary-tab' | 'secondary-page' | 'flow-step' | 'disabled-entry';
export type MountPolicy = 'always-mounted' | 'conditionally-mounted' | 'not-mounted';
export type VisibilityPolicy = 'default-visible' | 'conditionally-visible' | 'default-hidden' | 'not-applicable';

export interface PageEntry {
  name: string;
  key: string;
  type: PageType;
  root: string | null;
  mount: MountPolicy;
  visibility: VisibilityPolicy;
}

/** Synlige hovedfaner, i eksakt DOM-rekkefølge slik navigasjonen skal rendres. */
export const PRIMARY_TABS: PageEntry[] = [
  { name: 'Clubhouse', key: 'dashboard', type: 'primary-tab', root: '#tab-dashboard', mount: 'always-mounted', visibility: 'default-visible' },
  { name: 'Tee Off',   key: 'round',     type: 'primary-tab', root: '#tab-round',     mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'Rivalry',   key: 'rivalry',   type: 'primary-tab', root: '#tab-rivalry',   mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'Feed',      key: 'feed',      type: 'primary-tab', root: '#tab-feed',      mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'FGL',       key: 'fgl',       type: 'primary-tab', root: '#tab-fgl',       mount: 'always-mounted', visibility: 'default-hidden' },
];

/** Sekundaersider: seksjonen finnes alltid i DOM, men naas via skjult knapp / meny / kort. */
export const SECONDARY_PAGES: PageEntry[] = [
  { name: 'Profile',   key: 'profile',   type: 'secondary-page', root: '#tab-profile',   mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'Settings',  key: 'settings',  type: 'secondary-page', root: '#tab-settings',  mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'Insights',  key: 'insights',  type: 'secondary-page', root: '#tab-insights',  mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'Trophies',  key: 'trophies',  type: 'secondary-page', root: '#tab-trophies',  mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'Rounds',    key: 'rounds',    type: 'secondary-page', root: '#tab-rounds',    mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'Courses',   key: 'courses',   type: 'secondary-page', root: '#tab-courses',   mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'Approvals', key: 'approvals', type: 'secondary-page', root: '#tab-approvals', mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'Friends',   key: 'friends',   type: 'secondary-page', root: '#tab-friends',   mount: 'always-mounted', visibility: 'default-hidden' },
  { name: 'Stats',     key: 'stats',     type: 'secondary-page', root: '#tab-stats',     mount: 'always-mounted', visibility: 'default-hidden' },
];

/** Flytsteg: ligger statisk i HTML inne i Tee Off, vises/skjules i flyten. */
export const FLOW_STEPS: PageEntry[] = [
  { name: 'Scorecard', key: 'scorecard', type: 'flow-step', root: '#rwz-step-3', mount: 'always-mounted', visibility: 'conditionally-visible' },
];

/** Avslaatt inngang: ikke montert i DOM saa lenge app.js har `show = false`. */
export const DISABLED_ENTRIES: PageEntry[] = [
  { name: 'Landing', key: 'landing', type: 'disabled-entry', root: null, mount: 'not-mounted', visibility: 'not-applicable' },
];

/** Alle seksjoner som SKAL finnes i DOM. */
export const ALL_MOUNTED: PageEntry[] = [...PRIMARY_TABS, ...SECONDARY_PAGES, ...FLOW_STEPS];

/** Selektorer som ville indikert at Landing likevel er montert. */
export const LANDING_ROOT_CANDIDATES = ['#landing', '#landing-root', '.landing-root', '[data-page="landing"]'];

/** Globale shell-selektorer. */
export const SHELL = {
  app: '.app',
  header: '[data-testid="app-header"]',
  nav: 'nav#tabs',
  navButtons: 'nav#tabs button[data-tab]',
};
