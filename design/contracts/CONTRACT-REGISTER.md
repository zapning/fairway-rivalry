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
| Clubhouse | `dashboard` | primary-tab | synlig hovedfane | `#tab-dashboard` | always-mounted | default-visible | live | **draft** | partial (4A + 4B-1) |
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
| Scorecard | `scorecard` | flow-step (under Tee Off) | funksjonsflyt (steg 3) | `#rwz-step-3` | always-mounted | conditionally-visible | live | missing | partial |
| Landing | `landing` | disabled-entry | ikke montert | — | not-mounted | not-applicable | disabled | missing | partial |

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

## Produktfunn

Produktfunn fra 4B-1 (død kode, skjult legacy-markup, manglende Feed-tilstander, bildebakte
Clubhouse-titler) er **ikke duplisert her**. Autoritativ kilde:

`docs/app-machine/change-impact/trinn-4b-1.json` → `product_findings`

## Clubhouse-kontraktstatus: `draft` — grunnlag

`design/contracts/clubhouse-default.md` sier eksplisitt `Status: DRAFT`, med begrunnelsen at
scroll-policy er RESOLVED, men at **typografisk token-kontroll gjenstår**. `Approved by:` og
`Approved date:` er begge tomme. Statusen er derfor utledet fra dokumentet, ikke antatt.
