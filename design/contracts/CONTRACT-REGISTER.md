# Kontraktregister — Fairway Rivalry

Produkt-/kontraktregister for alle sider, aktive tilstander og flytsteg (BUILD-PLAN v3 trinn 2 og 4).
Registeret gjør **udekket område synlig**. Det er ikke en kontrakt i seg selv.

Alle fakta under er **verifisert mot faktisk DOM** i `Golf Dashboard.html` og `app.js` — ikke antatt.

## Verifiserte strukturfakta

- Alle `#tab-*`-seksjoner ligger **statisk i HTML** og veksles kun via `style.display`. Ingen seksjon
  opprettes eller fjernes fra DOM (`createElement('section')` forekommer 0 ganger i `app.js`).
  Derfor er alle `always-mounted` — aldri `conditionally-mounted`.
- Aktiv tilstand er maskinlesbar via **`document.body[data-tab]`** og `.active` på `nav#tabs button[data-tab]`.
- `#rwz-step-1/2/3` ligger også statisk i HTML inne i `#tab-round`.
- Landing er kodegated av (`app.js`: `const show = false`) og er **ikke montert**.

## Register

| Navn | Nøkkel | Type | Aktiveringsmåte | Root-selector | Mount-policy | Visibility-policy | Implementasjon | Kontrakt | Strukturell test |
|---|---|---|---|---|---|---|---|---|---|
| Clubhouse | `dashboard` | primary-tab | synlig hovedfane | `#tab-dashboard` | always-mounted | default-visible | live | **draft (struktur PARTIAL/VERIFIED via 4C)** | **partial (4A + 4B-1 + 4C-struktur 1/1/6/8/1=17)** |
| Tee Off | `round` | primary-tab | synlig hovedfane | `#tab-round` | always-mounted | default-hidden | live | missing | partial (4A + 4B-1) |
| Rivalry | `rivalry` | primary-tab | synlig hovedfane | `#tab-rivalry` | always-mounted | default-hidden | live | missing | partial (4A + 4B-1) |
| Feed | `feed` | primary-tab | synlig hovedfane | `#tab-feed` | always-mounted | default-hidden | live | missing | partial (4A + 4B-1) |
| FGL | `fgl` | primary-tab | synlig hovedfane | `#tab-fgl` | always-mounted | default-hidden | placeholder | missing | partial (4A + 4B-1, placeholder) |
| Profile | `profile` | secondary-page | cloud-gated meny (utlogget → auth) | `#tab-profile` | always-mounted | default-hidden | live | missing | BLOCKED 4B-2 (auth → trinn 5) |
| Settings | `settings` | secondary-page | cloud-gated meny (utlogget → auth) | `#tab-settings` | always-mounted | default-hidden | live | missing | BLOCKED 4B-2 (auth → trinn 5) |
| Insights | `insights` | secondary-page | ingen levende inngang (død kode) | `#tab-insights` | always-mounted | default-hidden | live | missing | BLOCKED/orphaned; Insights-**modal** dekket 4B-2 |
| Trophies | `trophies` | secondary-page | synlig V3-ikonknapp (Clubhouse) | `#tab-trophies` | always-mounted | default-hidden | live | missing | **4B-2: dekket (ikon)** |
| Rounds | `rounds` | secondary-page | synlig V3-ikonknapp (Clubhouse) | `#tab-rounds` | always-mounted | default-hidden | live | missing | **4B-2: dekket (ikon, Enter)** |
| Courses | `courses` | secondary-page | ingen levende inngang | `#tab-courses` | always-mounted | default-hidden | live | missing | BLOCKED/orphaned |
| Approvals | `approvals` | secondary-page | synlig V3-ikonknapp (Clubhouse) | `#tab-approvals` | always-mounted | default-hidden | live | missing | **4B-2: dekket (ikon)** |
| Friends | `friends` | secondary-page | synlig V3-ikonknapp «Rivals» (Clubhouse) | `#tab-friends` | always-mounted | default-hidden | live | missing | **4B-2: dekket (ikon, Space)** |
| Stats | `stats` | secondary-page | ingen levende inngang (død kode) | `#tab-stats` | always-mounted | default-hidden | live | missing | BLOCKED/orphaned |
| Scorecard | `scorecard` | flow-step (under Tee Off) | ekte Tee Off-flyt → steg 3 | `#rwz-step-3` | always-mounted | conditionally-visible | live | missing | **4B-3: PARTIAL (flyt + montering)** |
| Landing | `landing` | disabled-entry | ingen synlig inngang (kodegated av) | — | not-mounted | not-applicable | disabled | missing | **4B-3: negativ disabled-entry** |

## Presisering av dekningsgrad

`partial` betyr **kun** det testene faktisk beviser.

### Etter trinn 4A — globale kontrakter (alle sider)

- **Primary tabs:** root-eksistens, tilstedeværelse i navigasjon, korrekt nav-rekkefølge, at sidebytte
  aktiverer riktig seksjon og riktig nav-element, og at aktiv tilstand er maskinlesbar og entydig.
- **Secondary pages:** root-eksistens er testet (4A-C6). Aktivering via meny/kort/CTA er **ikke** testet.
- **Scorecard (flow-step):** root-eksistens er testet (4A-C6). Flyten steg 1 → 2 → 3 er **ikke** testet.
- **Landing (disabled-entry):** at den **ikke** er montert er testet (4A-C6). Ingenting annet.

### Etter trinn 4B-1 — minimumskontrakt for de fem primary tabs

Hva minimumskontraktene dekker: aktivering via **synlig nav-klikk**, at den faktiske live-visningen
rendres, side-spesifikk slot-unikhet, at dokumenterte tilstander (og kun de) er til stede i tom
tilstand, og at dynamiske verdier er **ekte DOM-tekst** — med minst ett treff, minst ett **synlig**
treff, og ikke-tom tekst i alle treff.

Determinisme: `seedEmptyState` og blokkerte service workers. Ingen produksjonsdata, ingen
nettverksavhengighet, ingen Supabase-skriving.

Kontraktene peker mot faktisk live-visning. Skjult legacy-markup er **bevisst holdt utenfor**, slik at
senere opprydding ikke blokkeres av testene.

**Eksakt V3-layout og antall bokser/Breakscore-rader låses ikke** i 4B-1 (alle krav er `requireAtLeast: 1`).
Detaljert Clubhouse-kontrakt — komponentrekkefølge og eksakte antall — hører til **trinn 4C**
(Clubhouse dyp pilot).

**Testbevis:** `tests/ui/contracts/page-minimum.contract.spec.ts` — 5 tester × 4 prosjekter = 20.
Lokalt verifisert: isolert `20 passed`, full suite `72 passed`, full suite med `CI=1` `72 passed`
(chromium-390, chromium-412, webkit-390, webkit-412). Ingen appkode endret.

Ingen side har `covered`. Dyp kontraktdekning krever trinn 4C (Clubhouse-pilot) og påfølgende sidekontrakter.

### Etter trinn 4B-2 — minimumskontrakt for sekundære inngangspunkter

Dekker **reelle, synlige og deterministiske** brukerreiser fra Clubhouse i tom/utlogget tilstand, valgt
via rolle + tilgjengelig navn (`getByRole`) — aldri `onclick`-selektor eller `window.activateTab`:

- **Sekundærsider via V3-ikonknapp** (native `<button type="button">` med korrekt `aria-controls`):
  Rounds (Enter), Rivals/Friends (Space), Trophies (klikk), Approvals (klikk).
- **Sekundærflater (delt modal, ikke side):** Insights- og Handicap-modal via `aria-haspopup="dialog"`
  + `aria-controls="modal-bg"`; verifiserer at Clubhouse forblir aktiv (`body[data-tab]='dashboard'`)
  og at ingen foreldreløs side åpnes. `#modal-bg`/`#modal`-markup er uendret.

Determinisme: `seedEmptyState`, blokkerte service workers. Ingen produksjonsdata, ingen Supabase-skriving.

**BLOCKED i 4B-2 (bevisst ikke gjort kunstig grønne):** Profile og Settings er cloud-gated — utlogget
åpner profilknappen autentiseringsflyten, ikke menyen, og de native Edit profile/Settings-knappene
finnes bare for innlogget bruker; flyttes til **trinn 5** når autentisert fixture etableres. Stats
(`#tab-stats`) og Courses (`#tab-courses`) er foreldreløse (ingen levende inngang), og Insights-**siden**
`#tab-insights` er foreldreløs (den faktiske Insights-**modalen** er dekket). Ingen orphaned-guard er
lagt til for Stats, slik at en senere reparasjon ikke blir en testfeil.

Autoritativ kilde for detaljerte funn (P, Q, L, M, O, R, S) og statusbegrunnelser — **ikke duplisert her**:
`docs/app-machine/change-impact/trinn-4b-2.json`.

**Testbevis:** `tests/ui/contracts/secondary-pages.contract.spec.ts` — 6 tester × 4 prosjekter = 24.
Lokalt verifisert: isolert `24 passed`, full suite `96 passed`, full suite med `CI=1` `96 passed`
(chromium-390, chromium-412, webkit-390, webkit-412), ingen nye dist-endringer. Ingen appkode endret
utover de godkjente 4B-2 button-/CSS-endringene (seks native `button.chd-box` + scopet reset med
`:focus-visible` på `var(--gold)`).

### Etter trinn 4B-3 — flow-step (Scorecard) + disabled-entry (Landing)

Dekker de to gjenstående sidetypene i trinn 4B via **ekte, synlige brukerreiser** (rolle + tilgjengelig
navn / den ekte søke-widgeten) — aldri inline click-attributt-selektor, `window`-tab-funksjon eller
andre interne kall:

- **Scorecard (flow-step, `#rwz-step-3`):** ekte reise fra hovednavigasjonen — Tee Off → klikk synlig
  «Golf Round»-kort (auto-avancerer til steg 1) → Next i synlig steg 1 → velg bane via `#r-course-search`
  + synlig forslag → Next i synlig steg 2. Kontrakten dekker **kun flyt, aktiv tilstand og grunnleggende
  montering:** `#rwz-step-3` synlig, `body[data-tab]=round` + Tee Off-nav aktiv, steg 1/2 + `#r-kind-panel`
  skjult, nøyaktig én `#rwz-step-3` og én scorekort-root, minst én synlig scoreflate, ingen horisontal
  overflow. **Status: PARTIAL produktkontrakt.**
- **Landing (disabled-entry):** negativ kontrakt — etter siste landing-gate (3500 ms) er `#wl-overlay`
  ikke montert, ingen `data-tab="landing"` i navigasjonen, og Clubhouse forblir aktiv. Bevist kun ved å
  observere booted DOM (ingen interne kall).

**Scorecard-kontrakten låser bevisst IKKE:** dimensjoner, kortstørrelser, spillerlayout, kolonneoppsett,
typografi, spacing, intern komponentrekkefølge, scoremodusdetaljer, screenshots eller dagens visuelle
design. Dagens Scorecard-design er **ikke** en godkjent referanse/visuell baseline. En senere redesign
kan erstatte intern DOM og oppdatere kontrakten uten at det regnes som regresjon. Scoremodusene
winner/total/nassau og resume-active-round er **udekket**.

PWA-installasjonsbanneret (finding Y) er en **separat global flate** — det avvises kun gjennom appens
egen synlige «Later»-knapp og er ikke del av Scorecard-kontrakten.

Autoritativ kilde for detaljerte funn (T, U, V, W, X, Y) og statusbegrunnelser — **ikke duplisert her**:
`docs/app-machine/change-impact/trinn-4b-3.json`.

**Testbevis:** `tests/ui/contracts/flow-and-disabled.contract.spec.ts` — 2 tester × 4 prosjekter = 8,
samlet suite 104. Lokalt verifisert: isolert `8 passed`, full suite `104 passed`, full suite med `CI=1`
`104 passed` (chromium-390, chromium-412, webkit-390, webkit-412), ingen nye dist-endringer. Ingen
appkode endret.

### Etter trinn 4C — PARTIAL dyp Clubhouse-strukturkontrakt

Første dype pilot. Låser den **varige komponenttaksonomien** til det live Clubhouse-gridet via stabile
produktsemantiske ankere (`#clubhouse-grid`, `[data-clubhouse-component]`, native roller +
tilgjengelige navn) — aldri `nth-child`, click-attributt-, bakgrunnsbilde-, koordinat- eller interne
`.chd`-klassekjeder, og ingen eksakte px/%/font/typografiverdier eller screenshots.

- **Kanonisk struktur (count-freeze):** `record → challenge → nav×6 → stat×8 → breakscore`, nøyaktig
  **1/1/6/8/1 = 17**. Nav-rekkefølge (Rounds, Rivals, Trophies, Insights, Approvals, Handicap), Record
  og de åtte statboksene som native buttons med tilgjengelige navn, Breakscore som ikke-interaktiv
  `group`. Én `#clubhouse-grid` montert i `#dash-clubhouse-tail`, én challenge-slot uten separat
  Resume-boks, ingen dupliserte roots, ingen `scale()`/global zoom, ingen horisontal overflow, samme
  sekvens i alle fire prosjekter.
- **Godkjent app-endring:** kun semantisk markup i `renderClubhouseDashboard()` — `#clubhouse-grid`,
  `data-clubhouse-component` på alle 17 bokser, Record + 8 stat `<div>` → native `<button>` med
  tilgjengelige navn, Breakscore `role="group"` (funn AH). Ingen CSS/layout/bilde/typografi-endring.

**4C låser bevisst IKKE:** dagens spacing, dimensjoner, responsive fontverdier, intern DOM,
komponentstørrelser, kolonner eller fullskjermdesign. **Typografi er BLOCKED/DEFERRED** (funn AF:
container-query-baserte sublabels under godkjent minimum — lesbarhetsfunn, ikke baseline). **Ingen
godkjent fullskjerm-/visuell baseline** — visuell regresjon hører til trinn 7. Stat-interaksjon
(klikk → detalj, task #121) er **ikke** del av 4C-strukturkjernen og kontraktfestes semantisk senere.

Autoritativ kilde for funn Z–AH — **ikke duplisert her**:
`docs/app-machine/change-impact/trinn-4c.json`.

**Testbevis:** `tests/ui/contracts/clubhouse-deep.contract.spec.ts` — 3 tester × 4 prosjekter = 12,
samlet suite **116** i 6 filer. Lokalt verifisert: isolert `12 passed`, full lokal `116 passed`, lokal
`CI=1` `116 passed` (chromium-390, chromium-412, webkit-390, webkit-412), dist uendret. **4D ikke startet.**

## Produktfunn

Produktfunn fra 4B-1 (død kode, skjult legacy-markup, manglende Feed-tilstander, bildebakte
Clubhouse-titler) er **ikke duplisert her**. Autoritativ kilde:

`docs/app-machine/change-impact/trinn-4b-1.json` → `product_findings`

## Clubhouse-kontraktstatus: `draft` — grunnlag

`design/contracts/clubhouse-default.md` sier eksplisitt `Status: DRAFT`, med begrunnelsen at
scroll-policy er RESOLVED, men at **typografisk token-kontroll gjenstår**. `Approved by:` og
`Approved date:` er begge tomme. Statusen er derfor utledet fra dokumentet, ikke antatt.
