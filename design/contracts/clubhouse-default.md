# Screen contract — Clubhouse (default)

> Utfylt fra `docs/app-machine/SCREEN-CONTRACT-TEMPLATE.md`. Dette er DOKUMENTASJON.
> Ingen Clubhouse-kode er endret som del av å opprette denne kontrakten (jf. oppgavens punkt 10).

## 1. Identitet

- Contract ID: `clubhouse-default`
- Route: `/clubhouse` (tab `dashboard`, `body[data-tab="dashboard"]`)
- State: default innlogget bruker
- Version: 0.1
- Owner: Mathias
- Status: `DRAFT / BLOCKED`  ← IKKE approved. Blokkert av åpen prosjektbeslutning: scroll-policy (se `docs/app-machine/OPEN-DECISIONS.md` #1 og §4). Skal ikke godkjennes mens dette er uavklart.
- Approved by: —
- Approved date: —

## 2. Produktmål

- Problem: gi spilleren et premium «klubbhus» som viser sesongrekord, dagens utfordring/aktive runder, hurtignavigasjon og nøkkelstatistikk, og motiverer til å starte/logge en runde.
- Hovedbruker: innlogget golfer som sjekker status og starter handling.
- Viktigste handling: forstå egen status + gå videre (Tee Off / åpne stat / følge aktiv runde).
- Skal forstås innen 5 sek: sesongrekord (Record This Season) og om det finnes en aktiv runde.
- Skal ikke forstyrre: for mye samtidig gull/tekst; boksene skal lese rolig og premium.

## 3. Kilder til sannhet

- Approved full-screen reference: `design/reference/clubhouse/approved-clubhouse-fullpage-390.png` (Dashboard V2, 853-bred design-space mockup som representerer 390-målet). Merk: dette er en portrett-mockup som er HØYERE enn en telefonskjerm.
- Approved header reference: `design/reference/header/approved-header-853x293.png` (Header.png).
- Approved component references: mangler (bør cuttes ut: header, record-card, challenge-bar, nav-rekke, stat-card, breakscore).
- Design token file: `design/tokens/fairway.tokens.json` — MANGLER, må lages.
- Existing production baseline: build `2607101514` (Bokser V3), se PROJECT-FACTS §23.
- Related functional spec: `renderClubhouseDashboard()` / `renderClubhouseTrophiesPreview()` i `app.js`.

Referansen er visuell retning + proporsjonsfasit for boksene, ikke pixel-fasit for dynamiske verdier.

## 4. Scroll-policy  ← KONFLIKT MÅ AVKLARES

- Ny grunnlov (CLAUDE.md §3 + PROJECT-FACTS §12): **Clubhouse = `vertical-content`**. Den skal aldri miniatyriseres for å få alt inn over bretten, og root/dashboard skal ikke skaleres.
- Nåværende implementasjon: **`single-screen` via contain-fit** — hele `.chd` skaleres ned med `width: min(100%, (100dvh - headerline) * 853/1515)` så alt passer én skjerm uten scroll.
- Dette er nettopp mønsteret det nye kvalitetssystemet er laget for å stoppe («hele dashboardet ble presset inn på skjermen», UI-QUALITY-SYSTEM §1 og §9).

**Beslutning kreves fra Mathias før implementering:**
- (A) Behold Dashboard V2 som ÉN skjerm (single-screen). Da må CLAUDE.md §3/PROJECT-FACTS §12 endres til å tillate at Clubhouse er single-screen, og boksene må dimensjoneres responsivt (ikke via global nedskalering av `.chd`) så tekst holder lesbar minstestørrelse.
- (B) Gjør Clubhouse til `vertical-content`: boksene beholder lesbar/premium størrelse og siden scroller vertikalt. Da matcher den den nye grunnloven, men avviker fra «alt på én skjerm».

Inntil dette er avklart forblir kontrakten `draft`.

## 5. App-shell og viewport

- Min støttet viewport: 320×568. Maks design: 430×932.
- App-shell max-width (mobil): full bredde; bakgrunn `min(100vw, 430px)` sentrert.
- Sidegutter: bokser starter ~3.28 % venstre/høyre av `.chd` (fra Dashboard V2-måling).
- Safe-area: `env(safe-area-inset-*)` skal respekteres (viewport-fit=cover er satt).
- Mode: browser + installert PWA.
- Bakgrunn: `Bakgrunn.png` → `dist/clubhouse-bg.jpg`, `position:fixed`, `background-size:cover`, `100dvh`, sentrert, ingen grønn veil.

## 6. Header contract

- Variant: transparent global header (samme på alle faner).
- Transparent/opak: **100 % transparent** (ingen `header::before`/`.tabs-wrap::before` grønn veil).
- Høyde: auto (innholdsdrevet); proporsjoner som Header.png (853×293 ≈ 2.91:1 i design-space).
- Logoasset: `logo-header.png` (FR-monogram) + tittel «Fairway Rivalry» + slogan «EVERY RIVALRY STARTS WITH ONE ROUND».
- Nav-rekkefølge: Clubhouse, Tee Off, Rivalry, Feed, FGL — ikon over etikett.
- Aktiv fane: gull tekst `#F3D879` + tynn understrek `#F2B70E`. Inaktiv: hvit/`#ECE7DA`.
- Profil: profilbilde/-chip øverst til høyre (vist på Clubhouse).
- Forbudte avvik: ikke grønn aktiv-markering; ikke grønn header-bakgrunn/veil; ikke bytt logoasset; ikke endre ikonrekkefølge; ikke skjul profil på Clubhouse.
- Referansesnapshot: `design/reference/header/approved-header-853x293.png` (golden header-snapshot ved 390×844 må genereres i test).

## 7. Komponentrekkefølge (topp → bunn)

1. Header (logo, nav-ikoner, profil)
2. Record This Season (full bredde, OPAK)
3. Today's Challenge / aktiv-runde-slot (full bredde)
4. Nav-rekke: Rounds, Rivals, Trophies, Insights, Approvals, HC (6 små)
5. Stat-rad 1: Your HC, Rounds Played, Lowest HCP Played, Lowest Round (4)
6. Stat-rad 2: Nemesis, Owned Course, Stronger Nine, Best Trophy (4)
7. Breakscore (full bredde)

Gjensidig eksklusivt: kun ÉN slot for «egen runde i gang / rival spiller nå / ingen aktive runder» (Today's Challenge). Det skal IKKE finnes en separat «Resume your round»-boks øverst i tillegg.

## 8. Grid og geometri (fra Dashboard V2-måling, 853×1515 innholdsområde)

- Record: full bredde, aspect ~800×401.
- Nav-rekke: 6 kolonner, jevn fordeling, aspect ~121×156 per boks.
- Stat-rader: 4 kolonner; venstre boks (Your HC / Nemesis) er smalere (~168) enn de tre andre (~190–193) — bevisst i mockup.
- Breakscore: full bredde, aspect ~799×260.
- Boks-interiør: ~20 % transparent (unntatt Record som er opak). Gullramme, ikoner, illustrasjon, tekst 100 % opak.
- Toleranse for målte verdier: ± 2 % av `.chd`-bredde.

## 9. Typografi

- Titler: bakt inn i boksbildene (Playfair-lignende gull-caps).
- Verdier: `Playfair Display` serif (`.chd-serif`), gull for Record (`.chd-gold`).
- Etiketter/subtekst: `Inter` (`.chd-lab`), hvit ~85 %.
- Minimum lesbar størrelse: må defineres i tokens; verdier/etiketter skal ikke krympes under dette for å passe høyde (relevant for scroll-policy-beslutningen i §4).

## 10. Transparens og effekter

- Box background alpha: ~0.8 (20 % transparent) for alle bokser unntatt Record (opak).
- Alltid opake: ikoner, gullrammer, illustrasjoner, verdier, hvit tekst.
- Gullbehandling: eksisterende gull-gradient-rammer i boksbildene.
- Skill bakgrunnstransparens fra komponent-opacity: kun boksens mørke interiør er transparent.

## 11. Statisk vs. dynamisk

- Statisk (bakt i webp): ramme, illustrasjon, tittel per boks.
- Dynamisk (DOM-overlay): Record W–L, HC, Rounds Played, Lowest HCP/Round, Nemesis-navn, Owned Course, Stronger Nine, Best Trophy, Breakscore-tall, Approvals-badge, Today's Challenge-tekst.
- Plassholder forbudt bakt i bilde. Dynamiske verdier skal være DOM-tekst.

## 12. Datafixtures (må lages deterministisk)

- default, empty (0–0, ingen runder), long-name (nemesis/owned course), max-number, missing-image, loading, error, active-round (egen), no-active-round, rival-active-round, one-rival, many-rivals.

## 13. Functional assertions

- Route `/clubhouse` laster og setter `body[data-tab="dashboard"]`.
- Aktiv fane = Clubhouse.
- Nav-tap → riktig fane; stat-tap → riktig modal (`openStatDetail`).
- Today's Challenge-tap: egen runde → resume; rival aktiv → `openLiveSpectator`; ellers → Tee Off.
- Nøyaktig én Today's Challenge/aktiv-runde-slot; ingen separat resume-boks.

## 14. Layout assertions

- `scrollWidth <= clientWidth + 1` (ingen horisontal side-overflow).
- Ingen `transform: scale()`/`zoom != 1` på root/app/`#tab-dashboard`/`.chd`  ← direkte relevant for §4-konflikten.
- Header innenfor kontraktens bredde/høyde.
- Bokser i riktig antall (17) og rekkefølge.
- Ingen tekst klippes; fontstørrelser over minimum.
- Bilder korrekt aspect + `object-fit`.
- Scroll-policy-assertions per valgt policy i §4.

## 15. Visual snapshots (må genereres)

- header-komponent @ 390×844 (Chromium + WebKit)
- Clubhouse first viewport @ 390×844
- Record-card, Today's Challenge-slot, nav-rekke, stat-card-grid, Breakscore
- ved vertical-content: top + midt + bunn + fullPage
- ved single-screen: viewport-snapshot

## 16. Testmatrix

- Chromium: 320×568, 360×800, 390×844, 412×915, 430×932
- WebKit: 375×667, 390×844, 430×932
- + minst én PWA/standalone og én browser-mode med dynamisk verktøylinje (real-device smoke).

## 17. Acceptance criteria (utkast — låses når §4 er avklart)

- Header-komponent matcher approved header innen avtalt diff.
- Ingen root/dashboard-skalering (`scale`/`zoom`).
- Ingen uventet horisontal overflow på noen testviewport.
- Kun én resume/challenge-slot; all dynamisk tekst er DOM-tekst.
- Record er opak; øvrige bokser ~20 % transparent interiør; ikoner/tekst/rammer opake.
- Nav = gull aktiv + understrek, ingen grønn.

## 18. Baseline change policy

- Krever visuell godkjenning: ja.
- Kan godkjenne: Mathias.
- Påvirkede snapshots: header + Clubhouse-komponenter.
- Baselineoppdatering i egen commit: ja.
