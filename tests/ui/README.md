# tests/ui — autoritativt UI-testfundament (BUILD-PLAN trinn 3)

Én autoritativ konfig: `playwright.config.ts` (i repo-roten). Den oppdager **kun**
`tests/ui/**/*.spec.ts`. Gamle/produksjonsrettede suiter kjøres aldri herfra.

## Struktur
- `contracts/` — strukturelle DOM-kontraktstester (trinn 4). Tom nå.
- `layout/` — layout-invariant-tester (trinn 5). Tom nå.
- `visual/` — komponent- + fullside-visuell regresjon / golden snapshots (trinn 6). Tom nå.
- `fixtures/` — deterministiske testdata/state (`state.ts`; rike data kommer trinn 7).
- `helpers/` — `stabilize.ts` (ready-signal + frys animasjon + fonts/bilder), `test.ts` (base-test med ren state).
- `smoke/` — `foundation.smoke.spec.ts`: minimal bevis på at fundamentet virker (ingen golden snapshots).

## Kjøring
- Lokalt: `npm run test:ui` (bygger dist via Node-wrapper, serverer, kjører Chromium + WebKit på 390×844 og 412×915).
- Rapport: `npm run test:ui:report`.
- CI: `.github/workflows/mobile-e2e.yml` kjører samme config med `npm ci`, låst Node, Chromium+WebKit, `workers:1`.

## Prinsipper (fra app-maskinen)
- Én server, én port (3100), én baseURL. `dist/` bygges fersk hver kjøring (`node build-dist.mjs`).
- Service workers blokkeres (`serviceWorkers:'block'`) — PWA-cache påvirker aldri en test.
- Fersk context + tom state per test.
- Ingen `transform:scale`/`zoom`; ingen golden snapshots i trinn 3.
- Verifisert inngang: `/` booter dashboard (Clubhouse) aktiv; app-root = `.app` + `#tabs`; ready = `window.activateTab` + `window.__frErrors`.

## Legacy (IKKE slettet ennå)
`playwright.config.js`, `playwright.mobile.config.js`, `tests/playwright.config.js`, `tests-e2e/`,
`tests/mobile/`, `tests/specs/`, `test/*.mjs` er **legacy**. De ryddes først etter at dette
fundamentet har bestått. Kjør dem kun med sin egen eksplisitte `-c`.
