# Fairway Golf League / Fairway Rivalry — prosjekt-brief

**Les denne først ved oppstart av ny chat.** Den gir deg konteksten du trenger på 1 minutt.

## Hva er dette
En single-file HTML PWA for å logge golfrunder og bygge 1-mot-1 rivalisering mellom kompiser. Hovedfilen er `Golf Dashboard.html` (~925 KB, 17k+ linjer). Distribueres som statisk site via Cloudflare Pages på `https://fairwayrivalry.com` (custom domain) og `https://clubhouse-395.pages.dev` (backup).

Brukeren heter **Mathias**. Norsk. Eier domenet, har Supabase-konto, deployer via Cloudflare Pages.

## Filstruktur

| Fil | Hva |
|---|---|
| `Golf Dashboard.html` | **Shell** (struktur) — lenker til `styles.css` + `app.js`. Splittet 17. juni for å unngå mount-trunkering. |
| `styles.css` | All CSS (~179 KB). Editer CSS her. |
| `app.js` | All JS (~680 KB). Editer JS her. Valider med `node --check app.js`. |
| `supabase-bridge.js` | Sky-bridge til Supabase (auth, profiler, runder, friends, leagues). Laster som ES module. |
| `supabase-schema.sql` | SQL schema for Supabase (kjøres i Supabase SQL Editor) |
| `sw.js` | Service worker for PWA (offline-cache) |
| `manifest.json` | PWA manifest |
| `dist/` | Build-output for deploy. Lages av `build-dist.sh`. |
| `build-dist.sh` | Bash-script som kopierer alt til `dist/` |
| `FR NY 17.06.png` | Nåværende brand-logo (gull FR-monogram, svart bakgrunn → må gjøres transparent ved konvertering). Komplett fil — erstattet en trunkert `FR NY.png` 17. juni. |
| `FGL ny.png` | Forrige brand-logo (gull FGL-sirkel) — backup |
| `Header-bakgrunn.png`, `header-bg.jpg` | Header bakgrunn |
| `logo-header.png`, `icon-*.png`, `apple-touch-icon.png` | Genereres fra `FR NY.png` med Pillow (script under) |
| `fairway-email-template.html` | Magic-link epost-template (Supabase Auth → Email Templates) |
| `FGL-backend-deploy.md` | Steg-for-steg deploy-guide for Supabase backend |
| `FGL-status-og-retning.md` | **Hva som er gjort sist, hva som virker, hva som er neste.** Les denne også. |

## Hvordan bygge og deploye

1. Editer `styles.css` (CSS), `app.js` (JS), eller `Golf Dashboard.html` (struktur). Build kopierer alle tre + supabase-bridge.js til `dist/`.
2. Kjør `bash build-dist.sh` → kopierer til `dist/` OG lager zip i `deploys/`
3. Last opp `deploys/fairway-deploy-LATEST.zip` til Cloudflare Pages → `clubhouse` project → Create deployment → Direct upload

`deploys/` har timestampede backups av siste 5 deploys. `fairway-deploy-LATEST.zip` peker alltid til den nyeste.

**ALT skal ligge i `C:\Users\malags\Dev\fgl\` — IKKE i outputs eller andre steder.**

## Viktige tekniske ting

- **Branding nå:** "Fairway Rivalry" / "Every rivalry starts with one round" (Mathias bekreftet full rebrand 17. juni 2026 — dette er gjeldende baseline). Kortnavn/monogram: **FR**.
- **Logo:** FR-monogram fra `FR NY.png` — har svart bakgrunn. Når du genererer PNG, gjør pixels med RGB-sum < 60 transparent.
- **JS-validering:** Etter hver endring i `app.js`, kjør `node --check app.js` direkte.
- **Skriving (VIKTIG):** Mount-en trunkerer store skrivinger av og til. Skriv ALLTID via Python med `f.flush(); os.fsync()` + en verifiserings-loop som leser tilbake og sjekker slutt + ingen NUL-bytes, og prøver på nytt. Snapshots ligger i `backups/`.
- **Filen kan trunkeres:** Skriv ALDRI hele filen med Write. Bruk Edit eller Python heredoc med `replace()` på spesifikke strenger. Hvis filen blir truncert, kan den hentes fra `https://fairwayrivalry.com/index.html` (men WebFetch er blokkert i sandboxen — be brukeren laste ned).
- **Git:** Hvis ikke initialisert ennå, foreslå å sette opp `git init && git add . && git commit -m "..."` så vi har sikkerhetsnett.

## Hvordan generere ikoner fra FR NY.png

```python
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
import numpy as np

img = Image.open("FR NY.png").convert("RGBA")
img.load()
arr = np.array(img)
# Svart bakgrunn → transparent (RGB-sum < 60)
darkness = arr[:,:,0].astype(int) + arr[:,:,1].astype(int) + arr[:,:,2].astype(int)
arr[:,:,3] = np.where(darkness < 60, 0, 255)
img = Image.fromarray(arr, "RGBA").crop(Image.fromarray(arr, "RGBA").getbbox())

sizes = {
    "logo-header.png": (320, 320),
    "icon-192.png": (192, 192),
    "icon-512.png": (512, 512),
    "icon-maskable-512.png": (512, 512),  # bruk 80% safe-area padding
    "apple-touch-icon.png": (180, 180),
}
for fname, (w, h) in sizes.items():
    out = img.copy()
    out.thumbnail((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(out, ((w - out.width) // 2, (h - out.height) // 2), out)
    canvas.save(fname, "PNG", optimize=True)
```

## Egne emojis & ikoner — ALLTID house-stil

**Når brukeren ber om en emoji, et ikon, et trofé, et badge eller en avatar: lag det ALLTID selv som SVG i Fairway house-stil. Aldri bruk Unicode-emoji (⛳🏆🎯) i ny UI.** Full spec ligger i `fairway-icon-style.md` — les den først.

Kort: gull-medaljong (gradient `#e4c97a→#c9a961→#8a7340` + hvit shine, `viewBox 0 0 100 100`) for trofeer/achievements/avatarer; gull line-art (`stroke="currentColor"` stroke-width 1.5, `viewBox 0 0 24 24`) for UI-ikoner. Palett: `--gold #c9a961`, `--gold-bright #e1c47e`, `--gold-dim #7a6740`, accent `#7eb59a`. Lagre gjenbrukbare ikoner som `ICON_NAVN` / `ICON_NAVN_SMALL`-konstanter, slik `ICON_RIVALRY`/`ICON_TROPHY` allerede gjøres. Bruk unik gradient-`id` per ikon. Preview-galleri: `fairway-emoji-pack.html`.

## Arbeidsmåte (VIKTIG)

- **Når Mathias ber om at en hel liste/oppgave skal gjøres ("kjør alt", "bli ferdig med lista", "ta hele listen"): IKKE stopp for å spørre om lov til å gå videre til neste punkt.** Jobb gjennom HELE lista i puljer (bygg → valider `node --check app.js` → cache-bustende deploy) uten å pause for bekreftelse. Bygg deretter videre på neste punkt automatisk. Eneste grunn til å stoppe og spørre er hvis du faktisk trenger input fra ham for å fullføre selve oppgaven (f.eks. et designvalg som ikke kan utledes, eller et steg bare han kan gjøre i Supabase). Rapportér når lista er ferdig, eller når du er reelt blokkert — ikke ved hvert delpunkt.
- **Cache-busting ved hver build:** versjoner asset-URL-ene (`app.js?v=STAMP`, `styles.css?v=STAMP`) i `dist/index.html` og bump `VERSION` i `dist/sw.js`, ellers serveres gammel cache (skjedde gjentatte ganger). Bygg-snippet ligger i tidligere deploys.
- **RAPPORTERING (PÅKREVD):** Hver gang du har gjort noe, skriv nøyaktig HVA du gjorde OG RESULTATET av hvert enkelt punkt. Punkt for punkt. Ikke bare «ferdig» — si hva som ble endret og hva sluttresultatet ble (verifisert / antatt / blokkert).
- **TEST ALLTID ETTER DEPLOY (PÅKREVD):** Etter hver deploy skal du selv teste på `https://fairwayrivalry.com` (Chrome-verktøy: sjekk `app.js?v=`-versjon, og verifiser at endringen faktisk rendrer — f.eks. kjør funksjonen/inspiser DOM/computed styles). Rapportér hva du så. IKKE påstå at noe er gjort uten å ha verifisert det live. Mathias opplever ofte at ting ikke ble gjennomført — verifiser derfor alltid.
- **Cache på enheten:** live-deploy kan være korrekt selv om Mathias ser gammelt (PWA/browser-cache på mobilen). Hvis du har verifisert live at koden er riktig, si det tydelig og hjelp med å tvinge oppdatering (service worker skipWaiting + reload, evt. avinstaller/legg til PWA på nytt). Vis gjerne byggversjon i UI så det er lett å bekrefte hvilken build som kjører.

## OBLIGATORISK arbeidsflyt for HVER UI-endring (før OG etter deploy)

Denne appen er **mobile-first**. Ingen UI-endring er «ferdig» før mobiltestene passerer. Følg denne rekkefølgen HVER gang:

1. **Editer** `app.js` / `styles.css` / `Golf Dashboard.html` (via Python/Edit, aldri Write på app.js).
2. **Valider JS:** `node --check app.js`.
3. **Kopier til dist:** `cp -f app.js styles.css dist/` (+ evt. index.html/assets).
4. **KJØR MOBILTESTEN (påkrevd, før deploy):** `node test/mobile-check.mjs`
   - Kjører de 6 påkrevde størrelsene (320×568, 360×800, 375×667, 390×844, 412×915, 430×932) i ekte headless Chromium mot lokal `dist/`.
   - Måler **horisontal** overflow (skal ALLTID være 0) og **vertikal** overflow på én-skjermsidene Clubhouse + Tee Off (skal være 0).
   - Skriver `test/MOBILE-REPORT.md` + skjermbilder `test/shots/m-*.png`. Exit-kode ≠ 0 = FAIL → **ikke deploy**, fiks først.
   - Hvert format kjøres i egen child-prosess (unngår OOM). Full kjøring ~90s → i sandkassen kan du kjøre `node test/mobsize.mjs <W> <H> <label>` per format (parallelt over flere bash-kall) hvis du treffer 45s-grensen.
5. **Cache-bust + zip:** versjonér `app.js?v=STAMP`, `styles.css?v=STAMP` i `dist/index.html`, bump `VERSION` i `dist/sw.js` (`fairway-STAMP`), zip `dist/` → `deploys/fairway-deploy-LATEST.zip` (ekskluder `clubhouse-cards/*.png` + `clubhouse-cards/clubhouse-cards/*`). STAMP=`date +%y%m%d%H%M`.
6. **Deploy:** be Mathias laste opp `deploys/fairway-deploy-LATEST.zip` til Cloudflare Pages (kan ikk