# Fairway Rivalry — prosjektfakta og teknisk baseline

Denne filen inneholder prosjektkunnskap som skal bevares. Den beskriver hva prosjektet er, hvor filene ligger, kjente tekniske forhold og gjeldende bygg-/deployprosess. Den skal ikke brukes som erstatning for screen contracts eller visuelle referanser.

## 1. Prosjekt

Fairway Rivalry er en mobile-first PWA for å logge golfrunder og bygge rivalisering mellom venner. Hovedfilen var opprinnelig en single-file HTML-app, men er nå splittet i struktur, CSS og JavaScript.

- Produksjon: `https://fairwayrivalry.com`
- Backup: `https://clubhouse-395.pages.dev`
- Lokal prosjektrot: `C:\Users\malags\Dev\fgl\`
- Mathias er norsk, eier domenet, har Supabase-konto og laster normalt opp deploypakken til Cloudflare Pages.

## 2. Produktidentitet

- Navn: **Fairway Rivalry**
- Slogan: **Every rivalry starts with one round**
- Kortnavn/monogram: **FR**
- Full rebrand ble godkjent 17. juni 2026 og er gjeldende baseline.
- Produktet skal oppleves premium, intuitivt, sosialt, sportslig og konkurransedrevet.
- Hvert visuelt element skal støtte forståelse, handling, progresjon, rivalisering eller identitet.

## 3. Filstruktur

| Fil/mappe | Formål |
|---|---|
| `Golf Dashboard.html` | Shell/struktur; lenker til `styles.css` og `app.js`. Splittet 17. juni for å unngå mount-trunkering. |
| `styles.css` | All CSS, omtrent 179 KB. CSS-endringer gjøres her. |
| `app.js` | All JS, omtrent 680 KB. Valider alltid med `node --check app.js`. |
| `supabase-bridge.js` | ES module bridge for auth, profiler, runder, friends og leagues. |
| `supabase-schema.sql` | Supabase-schema; kjøres i Supabase SQL Editor. |
| `sw.js` | Service worker/offline-cache. |
| `manifest.json` | PWA-manifest. |
| `dist/` | Build-output for deploy. |
| `build-dist.sh` | Kopierer filer til `dist/` og lager deploypakke. |
| `FR NY 17.06.png` | Gjeldende FR-logo; komplett fil som erstattet trunkert `FR NY.png`. |
| `FGL ny.png` | Tidligere FGL-logo; backup. |
| `Header-bakgrunn.png`, `header-bg.jpg` | Headerressurser. |
| `logo-header.png`, `icon-*.png`, `apple-touch-icon.png` | Genererte ikoner fra FR-logoen. |
| `fairway-email-template.html` | Magic-link-mal for Supabase Auth. |
| `FGL-backend-deploy.md` | Backend-/Supabase-deployguide. |
| `FGL-status-og-retning.md` | Gjeldende status, hva som fungerer og neste prioriteringer. |
| `fairway-icon-style.md` | House style for ikoner, trofeer, badges og avatarer. |
| `fairway-emoji-pack.html` | Preview-galleri for custom ikoner. |
| `test/` | Mobiltester, rapporter og screenshots. |
| `deploys/` | Timestampede deploybackups og siste deployzip. |

Alle prosjektfiler og resultater skal ligge under `C:\Users\malags\Dev\fgl\`, ikke i tilfeldige output-mapper.

## 4. Sikker filredigering

- Etter hver endring i `app.js`: kjør `node --check app.js`.
- Store filer kan trunkeres ved skriving. Skriv aldri hele `app.js` med en generell Write-operasjon.
- Bruk målrettet Edit eller Python `replace()` på entydige strenger.
- Ved Python-skriving: bruk `f.flush(); os.fsync()` og verifiser ved å lese tilbake, kontrollere forventet slutt, filstørrelse og fravær av NUL-bytes. Prøv på nytt ved avvik.
- Snapshots/backups ligger i `backups/`.
- Dersom filen trunkeres og lokal backup ikke virker, kan produksjonsversjonen hentes fra `https://fairwayrivalry.com/index.html`; dersom verktøyet ikke kan hente den, må Mathias laste den ned.
- Git skal være initialisert. Bruk commits før og etter større endringer. Ikke overskriv fungerende baseline uten sikkerhetsnett.

## 5. Logo og genererte ikoner

FR-logoen har svart bakgrunn. Ved PNG-generering skal piksler med RGB-sum under 60 gjøres transparente:

```python
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
import numpy as np

img = Image.open("FR NY 17.06.png").convert("RGBA")
img.load()
arr = np.array(img)
darkness = arr[:,:,0].astype(int) + arr[:,:,1].astype(int) + arr[:,:,2].astype(int)
arr[:,:,3] = np.where(darkness < 60, 0, 255)
img = Image.fromarray(arr, "RGBA").crop(Image.fromarray(arr, "RGBA").getbbox())

sizes = {
    "logo-header.png": (320, 320),
    "icon-192.png": (192, 192),
    "icon-512.png": (512, 512),
    "icon-maskable-512.png": (512, 512),
    "apple-touch-icon.png": (180, 180),
}
for fname, (w, h) in sizes.items():
    out = img.copy()
    out.thumbnail((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(out, ((w - out.width) // 2, (h - out.height) // 2), out)
    canvas.save(fname, "PNG", optimize=True)
```

`icon-maskable-512.png` skal bruke omtrent 80 % safe-area padding.

## 6. House style for ikoner

Når det skal lages emoji, ikon, trofé, badge eller avatar, skal det lages som SVG i Fairway house style. Unicode-emoji skal ikke brukes i ny UI.

Les `fairway-icon-style.md` først.

- Trofeer/achievements/avatarer: gullmedaljong med gradient `#e4c97a → #c9a961 → #8a7340`, hvit shine, `viewBox="0 0 100 100"`.
- UI-ikoner: gull line-art, `stroke="currentColor"`, `stroke-width="1.5"`, `viewBox="0 0 24 24"`.
- Palett: `--gold #c9a961`, `--gold-bright #e1c47e`, `--gold-dim #7a6740`, accent `#7eb59a`.
- Lagre gjenbrukbare ikoner som `ICON_NAVN` / `ICON_NAVN_SMALL`.
- Bruk unik gradient-ID per ikon.

## 7. Gjeldende build og deploy

Historisk standardflyt:

1. Editer `styles.css`, `app.js` eller `Golf Dashboard.html`.
2. Kjør `bash build-dist.sh`.
3. Scriptet kopierer filer til `dist/` og lager timestampet zip i `deploys/`.
4. `deploys/fairway-deploy-LATEST.zip` peker på nyeste pakke.
5. Mathias laster zip til Cloudflare Pages → `clubhouse` → Create deployment → Direct upload.

Denne flyten skal erstattes/omsluttes av release-gaten beskrevet i `UI-QUALITY-SYSTEM.md`. Det skal ikke være mulig å lage gyldig final zip uten testbevis for samme kildekode-hash.

## 8. Cache-busting og PWA

Ved hver godkjent build:

- versjoner `app.js?v=STAMP` og `styles.css?v=STAMP` i `dist/index.html`
- bump `VERSION` i `dist/sw.js` til `fairway-STAMP`
- bruk `STAMP=$(date +%y%m%d%H%M)` eller en mer presis unik build-ID

Kjente mekanismer:

- Build-badge viser `build <STAMP>` nederst til høyre.
- `sw.js` skal være network-first for HTML/CSS/JS med `skipWaiting` og `clients.claim`.
- `app.js` har `controllerchange` → reload og en self-healing-sjekk som sammenligner aktiv `app.js?v=` med live `index.html`, tømmer cache og reloader én gang.
- For å kontrollere uten gammel cache: åpne `fairwayrivalry.com/?ny` i privat vindu, eller avinstaller/installer PWA på nytt.

Gammel build på enheten er en mulig cachefeil, men cache skal ikke brukes som standardforklaring før aktiv build-ID og live DOM er verifisert.

## 9. Eksisterende testverktøy

- `test/mobile-check.mjs`: kjører seks størrelser og skriver `test/MOBILE-REPORT.md` samt `test/shots/m-*.png`.
- `test/mobsize.mjs <W> <H> <label>`: kjører én størrelse; nyttig ved 45-sekundersgrense eller feilsøking.
- `playwright.mobile.config.js`, `tests/mobile/*.spec.js`, `serve-dist.mjs`: full suite for Chromium og WebKit.
- Routing: `/clubhouse`, `/tee-off`, `/rivalry`, `/feed`, `/profile` via `FGL_PATH_ROUTER`.
- `dist/_redirects` inneholder `/* /index.html 200` for SPA-fallback.
- Ved OOM: kjør én størrelse per prosess/kommando eller i en fersk økt.

Eksisterende testverktøy er nyttige, men overflow alene er ikke en visuell godkjenningsport. De skal videreutvikles i henhold til `UI-QUALITY-SYSTEM.md`.

## 10. Viewport-baseline

Minste representative matrise:

- 320 × 568
- 360 × 800
- 375 × 667
- 390 × 844
- 412 × 915
- 430 × 932

Test både Chromium og WebKit der mulig. I tillegg skal minst én ekte Android Chrome/PWA og én ekte iOS Safari/PWA inngå i release-smoke for større UI-releaser.

## 11. Responsive tekniske prinsipper

Bruk der det er riktig:

- `width: 100%`
- `max-width`
- Flex/Grid
- `minmax()`
- `clamp()`
- `%`, `rem`, `vw`, `dvh`
- `box-sizing: border-box`
- `min-width: 0` på flex/grid-barn
- `overflow-wrap: anywhere` på dynamisk tekst
- `env(safe-area-inset-*)`

Bruk `100dvh`, ikke `100vh`, når noe skal fylle faktisk synlig mobilhøyde.

Unngå:

- faste høyder på innhold som kan vokse
- absolutt posisjonering som bare virker på én skjerm
- global skalering av side/app/dashboard
- å skjule feil med global `overflow:hidden`
- uleselig liten tekst for å møte en høydegrense

Bakgrunnsimplementasjon må følge screen contract og visuell referanse. Tidligere CSS med `position:fixed`, `width:min(100vw,430px)` og `background-size:contain` er en kjent implementasjon, ikke en universell designregel. Den skal beholdes bare når den faktisk matcher godkjent referanse på hele testmatrisen.

## 12. Scroll-policy

- `vertical-content`: normal vertikal scrolling; innhold beholder lesbar størrelse og naturlig høyde.
- `single-screen`: alt nødvendig innhold skal passe i tilgjengelig viewport uten vertikal scrolling.
- `component-horizontal`: en eksplisitt komponent kan scrolle horisontalt, mens dokumentet ikke gjør det.

Gjeldende produktforståelse:

- Clubhouse: `vertical-content`.
- Tee Off — Set Up: normalt `single-screen`.
- Tee Off — Course and Conditions: normalt `single-screen`.
- Andre sider får policy i sin screen contract.

## 13. Kjente bildeproblemer

- Store bilder kan bli mount-trunkert. Kontroller PNG-slutt med `IEND in raw[-40:]` og at nederste rader ikke er svarte.
- Ved trunkering: be Mathias lage en fersk kopi med helt nytt filnavn.
- Låste filer i `clubhouse-cards/`: skriv til ny undermappe, for eksempel `dist/clubhouse-cards/v2/`, og oppdater referansen i `renderClubhouseDashboard`.
- Ved utdrag fra mockup: detekter gullramme, behold hele linjen, bruk avrundet maske, transparent utside og native oppløsning uten oppskalering.
- Dynamiske tall/tekster skal ikke bygges inn i bakgrunnsbilder.
- Fjern plassholdertekst ved kontrollert bakgrunnspatching, ikke ved å blåse opp eller strekke bildet.

## 14. Header-baseline

Historiske designkrav omfatter:

- aktiv fane i gull
- aktiv tekst omtrent `#F3D879`
- understrek omtrent `#F2B70E`
- inaktive ikoner og tekster hvite
- tittel i gullgradient/Playfair
- header kan være transparent når godkjent referanse krever det
- profilchip kan skjules når designkontrakten krever det

Disse verdiene er ikke nok til å gjenskape en header. Den godkjente headeren skal ha egen komponentkontrakt og egne visuelle snapshots for logo, proporsjoner, ikonrekkefølge, spacing, transparens, valgt-tilstand og plassering.

## 15. Arbeids- og rapporteringspreferanser

- Svar direkte, konsist og helst på norsk.
- Vis genererte filer som klikkbare lenker.
- Når Mathias sier «kjør alt», jobb gjennom hele listen uten å stoppe mellom punktene med mindre det finnes en reell blokkering.
- Rapporter hva som ble gjort og resultatet av hvert punkt.
- Merk status som `VERIFISERT`, `ANTATT` eller `BLOKKERT`.
- Ikke skift stor produkt- eller designretning uten å forklare hvorfor og få godkjenning.
- Endringer skal være visuelle og meningsfulle, men ikke bryte retning bare for å gjøre noe mer synlig.


## 22. Konkrete operative detaljer (bevart fra tidligere CLAUDE.md)

Disse er operative detaljer som skal gjelde inntil release-gaten i `UI-QUALITY-SYSTEM.md` er bygget og overtar.

- **Eksakt cache-bust + deploy-zip** (midlertidig, til `release.mjs` finnes):
  - `STAMP=$(date +%y%m%d%H%M)`
  - `sed` `app.js?v=` og `styles.css?v=` i `dist/index.html`; bump `fairway-<STAMP>` i `dist/sw.js`.
  - `cd dist && zip -rq /tmp/_fb.zip . -x "*.DS_Store" -x "clubhouse-cards/*.png" -x "clubhouse-cards/clubhouse-cards/*"`
  - kopier `/tmp/_fb.zip` → `deploys/fairway-deploy-LATEST.zip`.
  - Merk: dette er *ikke* en gyldig release før hash-bundet gate er på plass (se UI-QUALITY-SYSTEM §8/§15).
- **Boksutdrag fra mockup — gullramme-deteksjon:** `r>85 & r>b+20 & g>b+4 & r<248`; avrundet-rektangel-maske som beholder HELE gullinjen; utenfor transparent; native oppløsning uten oppskalering; fjern plassholdertekst med bakgrunnspatching.
- **Clubhouse-bokser** lastes fra `dist/clubhouse-cards/v3/` via `const IMG` i `renderClubhouseDashboard`. `v2/` er forrige sett. Rot `clubhouse-cards/*.webp` kan være låst («Operation not permitted») — skriv til ny undermappe.
- **Header-accent-historikk:** appens `--accent` er grønn (`#5a9276` / `#7eb59a`). Tidligere aktiv fane + `header::before`/`.tabs-wrap::before`-veil ga grønn header. Godkjent header er gull og transparent: aktiv `#F3D879` tekst + `#F2B70E` understrek, nav-ikon over etikett, profil til høyre, ingen grønn veil.
- **Statusfiler:** `FGL-status-og-retning.md` (siste status/neste steg) og `fairway-icon-style.md` (ikon-stil) skal leses ved relevant arbeid.

## 23. Gjeldende baseline (per 2026-07-10)

- Clubhouse «Dashboard V2» (Bokser V3) er live: 100 % transparent header med nav-ikoner + profil, Bakgrunn som `cover`, bokser med ~20 % transparent interiør (Record helt opak), Today's Challenge viser egen runde / rival-runde / «ingen aktive runder», ingen resume-boks øverst, build-badge kun på Settings-fanen.
- Siste bygde deploy-ID: `build 2607101514`. Auto-oppdatereren avregistrerer service worker + tømmer cache ved versjonsmismatch og laster på nytt.
- Godkjente referanser: `design/reference/clubhouse/approved-clubhouse-fullpage-390.png` (Dashboard V2, 853-bred design-space mockup som representerer 390-målet) og `design/reference/header/approved-header-853x293.png` (Header.png). Screen contract: `design/contracts/clubhouse-default.md`.
- Denne baseline er en *implementasjon*, ikke en ny universell regel. Endres den, må screen contract og godkjent referanse oppdateres i egen commit (UI-QUALITY-SYSTEM §20).

## 24. Sidenes nåværende produktstatus (produktfakta)

Kort faktastatus for hva hovedsidene *er* i dag. Test- og layoutregler ligger i
`PAGE-TEST-PROFILES.md` (sidespesifikt) og `UI-QUALITY-SYSTEM.md` §22 (globalt); dette er kun produktfakta.

- **Clubhouse:** en av flere hovedsider (Dashboard V2 / Bokser V3). Har egen screen contract (`design/contracts/clubhouse-default.md`). Skal ikke definere reglene for hele appen.
- **Tee Off:** tre-stegs rundeflyt — Set up → Course → Scorecard. Scorecard støtter 1–4 spillere (1 = større/luftigere, 4 = mer kompakt).
- **Rivalry:** kort/roster-side; bakgrunnen bak boksene skal være helt transparent (ingen mørke overlay-lag).
- **FGL:** foreløpig kun et bilde/placeholder. Ingen funksjonalitet er bygget ennå og skal ikke bygges nå.
