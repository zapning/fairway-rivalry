/*
 * Side-spesifikke minimumskontrakter for primary tabs (BUILD-PLAN v3 trinn 4B-1).
 *
 * Alle selektorer peker mot den FAKTISKE LIVE-VISNINGEN, verifisert mot DOM, CSS og renderkjede.
 * Skjult legacy-markup er BEVISST holdt utenfor kontrakten: den skal hverken kreves synlig
 * eller kreves til stede, slik at senere opprydding ikke blokkeres av testene.
 * Legacy-funnene er registrert i docs/app-machine/change-impact/trinn-4b-1.json.
 *
 * Ingen nye markup-hooks. Alle tester kjorer med seedEmptyState (tests/ui/helpers/test.ts)
 * og blokkerte service workers: ingen produksjonsdata, ingen nettverksavhengighet.
 */

/** Tokens som aldri skal lekke ut i DOM-tekst. 'null' er bevisst utelatt (falske treff). */
export const LEAK_TOKENS = ['undefined', 'NaN', '{{', '[object Object]'];

export interface PageContract {
  name: string;
  key: string;
  root: string;
  /** Maa finnes OG vaere synlige. */
  requiredVisible?: string[];
  /** Maa finnes i DOM, men er lovlig skjult i tom tilstand (data-gatet eller inaktiv fase). */
  requiredPresentButHidden?: string[];
  /** Slot-unikhet: noeyaktig N forekomster. */
  exactCounts?: Array<{ selector: string; count: number }>;
  /** Minst N SYNLIGE forekomster. */
  minVisible?: Array<{ selector: string; min: number }>;
  /** Containere som maa vaere fylt (minst ett barneelement). */
  filled?: string[];
  /** Skal IKKE finnes i den deterministiske tom-tilstanden. */
  forbidden?: string[];
  /** Dynamiske verdifelt: minst N treff, minst M SYNLIGE treff, og hvert treff har ikke-tom DOM-tekst. */
  dynamicText?: Array<{ selector: string; requireAtLeast: number; requireVisibleAtLeast?: number }>;
  /** Asynkron rendring -> expect.poll. */
  async?: boolean;
  /** Anker som poll'es paa naar async. */
  asyncAnchor?: string;
}

/* ---------- Clubhouse ----------
 * Autoritativ kjede: nav-klikk -> activateTab('dashboard') -> renderDashboard() [app.js:3689,
 * eneste definisjon] -> renderIdentityHero() + showWhenHasData-gating + #dash-clubhouse-tail.innerHTML
 * = renderClubhouseInsightsPreview() + renderClubhouseTrophiesPreview() -> renderClubhouseDashboard().
 *
 * Hele den LEVENDE Clubhouse-visningen ligger inne i #dash-clubhouse-tail (V3-dashboardet):
 * Record this season, aktiv-runde-linje, ikonrad, 8 stat-bokser og Breakscore.
 *
 * LEGACY - bevisst UTENFOR kontrakten, slik at senere opprydding ikke blokkeres:
 *  - .clubhouse-crest/.clubhouse-sign/.clubhouse-divider: skjult av styles.css:6379 (display:none !important).
 *  - #dash-quick-strip: skjult av styles.css:6256 (display:none !important) - erstattet av V3-ikonraden.
 *  - #identity-hero: TOMT skall. Ingen CSS/JS skjuler den; renderIdentityHero() returnerer tidlig
 *    (`const p = activeProfile(); if (!p) return;`) naar det ikke finnes aktiv profil, saa innerHTML
 *    settes aldri og elementet faar null bounding box.
 *
 * DOED KODE - bevisst UTENFOR kontrakten:
 *  - renderClubhouseTopCard() (app.js:11351) og renderClubhouseQuickNav() kalles ALDRI.
 *    .ch-rc-value / .ch-top-record hoerer kun til denne ubrukte renderveien.
 *  - .ch-wall-num hoerer til renderBetsLedger() (app.js:7242) - en annen side, ikke Clubhouse.
 *
 * LIVE-VERDIENE (renderClubhouseDashboard, app.js:11302-11350) er ekte DOM-tekst lagt OPPAA
 * statiske webp-bilder:
 *  - .chd-tx.chd-gold  = Record this season (f.eks. "0-0")
 *  - .chd-tx.chd-serif = stat-boksenes verdier
 *  - .bs-num           = Breakscore-tellere
 * .chd-tx.chd-lab er bevisst IKKE med: den kan lovlig vaere tom (nineSub/jewelSub -> '').
 * Eksakt antall bokser og breakscore-rader hoerer til 4C (Clubhouse dyp pilot), ikke minimumskontrakten. */
export const CLUBHOUSE: PageContract = {
  name: 'Clubhouse',
  key: 'dashboard',
  root: '#tab-dashboard',
  requiredVisible: ['.clubhouse-frame', '#dash-clubhouse-tail'],
  requiredPresentButHidden: [
    '#dash-recent-moments', '#dash-stakes', '#dash-your-game',
    '#dash-trophy-section', '#dash-rivalries-panel', '#dash-advanced',
  ],
  exactCounts: [
    { selector: '#dash-clubhouse-tail', count: 1 },
    { selector: '#dash-clubhouse-tail .chd', count: 1 },
  ],
  filled: ['#dash-clubhouse-tail'],
  dynamicText: [
    { selector: '#dash-clubhouse-tail .chd-tx.chd-gold', requireAtLeast: 1, requireVisibleAtLeast: 1 },
    { selector: '#dash-clubhouse-tail .chd-tx.chd-serif', requireAtLeast: 1, requireVisibleAtLeast: 1 },
    { selector: '#dash-clubhouse-tail .bs-num', requireAtLeast: 1, requireVisibleAtLeast: 1 },
  ],
};

/* ---------- Tee Off ----------
 * Inngangsvisningen (verifisert): renderRoundForm() -> showRoundKindPicker() viser #r-kind-panel
 * og setter display:none paa r-form-golf / r-form-golfmini / r-form-minigame / r-form-other.
 * Rundetypekortene ligger statisk i #r-kind-panel: .teeoff-cards > .teeoff-card[data-kind] (5 stk),
 * ingen display:none-regel i CSS.
 * Wizard-stegene (#rwz-step-1/2/3) tilhoerer en SENERE fase og er flyttet til 4B-3. */
export const TEE_OFF: PageContract = {
  name: 'Tee Off',
  key: 'round',
  root: '#tab-round',
  requiredVisible: ['#r-kind-panel'],
  requiredPresentButHidden: ['#r-form-golf', '#r-form-golfmini', '#r-form-minigame', '#r-form-other'],
  exactCounts: [{ selector: '#r-kind-panel', count: 1 }],
  minVisible: [{ selector: '#r-kind-panel .teeoff-card', min: 1 }],
};

/* ---------- Rivalry ----------
 * renderRivalry(): friends.length === 0 -> preview: #rivalry-list = .rv-dash + .rv-card2.rv-placeholder.
 * Populert: .rv-dash + .rv-bar + .rv-card2 uten .rv-placeholder. Tom fixture => PREVIEW.
 * LEGACY (ikke i kontrakten): .rivalry-hero/.rivalry-hero-title/.rivalry-hero-sub skjules av
 * styles.css:5613 (display:none !important); .rivalry-hero-bg er full-bleed bakgrunn.
 * PRODUKTFUNN A: renderRivalryHero() leser $("#rivalry-hero"), som ikke finnes i DOM. Doed kode. */
export const RIVALRY: PageContract = {
  name: 'Rivalry',
  key: 'rivalry',
  root: '#tab-rivalry',
  requiredVisible: ['#rivalry-list'],
  requiredPresentButHidden: ['#rivalry-detail-panel'],
  exactCounts: [
    { selector: '#rivalry-list', count: 1 },
    { selector: '.rv-dash', count: 1 },
    { selector: '.rv-card2.rv-placeholder', count: 1 },
  ],
  forbidden: ['.rv-bar'],
  dynamicText: [{ selector: '.rv-dash-v', requireAtLeast: 1, requireVisibleAtLeast: 1 }],
};

/* ---------- Feed ----------
 * async renderFeed(): !events.length -> .feed-empty. Ellers .feed-list. Tom fixture => EMPTY.
 * LEGACY (ikke i kontrakten): #feed-filters tommes og skjules av renderFeed (app.js:17060-17061).
 * PRODUKTFUNN D: ingen eksplisitt loading- eller error-tilstand; feil degraderer stille til .feed-empty. */
export const FEED: PageContract = {
  name: 'Feed',
  key: 'feed',
  root: '#tab-feed',
  requiredVisible: ['#feed-root'],
  exactCounts: [
    { selector: '#feed-root', count: 1 },
    { selector: '.feed-empty', count: 1 },
  ],
  forbidden: ['.feed-list'],
  dynamicText: [
    { selector: '.feed-empty-title', requireAtLeast: 1, requireVisibleAtLeast: 1 },
    { selector: '.feed-empty-sub', requireAtLeast: 1, requireVisibleAtLeast: 1 },
  ],
  async: true,
  asyncAnchor: '.feed-empty',
};

/* ---------- FGL (uendret placeholder-kontrakt) ----------
 * PRODUKTFUNN B: renderFGL() skriver ett <img class="fgl-coming-img"> og gjoer et UBETINGET return.
 * All liga-kode under er doed. FGL testes som placeholder, ikke som live-side. */
export const FGL: PageContract = {
  name: 'FGL',
  key: 'fgl',
  root: '#tab-fgl',
  requiredVisible: ['#fgl-root'],
  exactCounts: [
    { selector: '#fgl-root', count: 1 },
    { selector: 'img.fgl-coming-img', count: 1 },
  ],
  forbidden: ['.fgl-board', '.fgl-podium', '.fgl-row', '.fgl-mega-hero'],
};

export const PRIMARY_TAB_CONTRACTS: PageContract[] = [CLUBHOUSE, TEE_OFF, RIVALRY, FEED, FGL];
