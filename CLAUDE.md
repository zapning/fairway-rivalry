# Fairway Golf League / Fairway Rivalry — prosjekt-brief

**Les denne først ved oppstart av ny chat.** Den gir deg konteksten du trenger på 1 minutt.

## Hva er dette
En single-file HTML PWA for å logge golfrunder og bygge 1-mot-1 rivalisering mellom kompiser. Hovedfilen er `Golf Dashboard.html` (~925 KB, 17k+ linjer). Distribueres som statisk site via Cloudflare Pages på `https://fairwayrivalry.com` (custom domain) og `https://clubhouse-395.pages.dev` (backup).

Brukeren heter **Mathias**. Norsk. Eier domenet, har Supabase-konto, deployer via Cloudflare Pages.

## Filstruktur

| Fil | Hva |
|---|---|
| `Golf Dashboard.html` | **Hovedfil** — all HTML, CSS, JS i én fil. Editer her. |
| `supabase-bridge.js` | Sky-bridge til Supabase (auth, profiler, runder, friends, leagues). Laster som ES module. |
| `supabase-schema.sql` | SQL schema for Supabase (kjøres i Supabase SQL Editor) |
| `sw.js` | Service worker for PWA (offline-cache) |
| `manifest.json` | PWA manifest |
| `dist/` | Build-output for deploy. Lages av `build-dist.sh`. |
| `build-dist.sh` | Bash-script som kopierer alt til `dist/` |
| `FR NY.png` | Nåværende brand-logo (gull FR-monogram, svart bakgrunn → må gjøres transparent ved konvertering) |
| `FGL ny.png` | Forrige brand-logo (gull FGL-sirkel) — backup |
| `Header-bakgrunn.png`, `header-bg.jpg` | Header bakgrunn |
| `logo-header.png`, `icon-*.png`, `apple-touch-icon.png` | Genereres fra `FR NY.png` med Pillow (script under) |
| `fairway-email-template.html` | Magic-link epost-template (Supabase Auth → Email Templates) |
| `FGL-backend-deploy.md` | Steg-for-steg deploy-guide for Supabase backend |
| `FGL-status-og-retning.md` | **Hva som er gjort sist, hva som virker, hva som er neste.** Les denne også. |

## Hvordan bygge og deploye

1. Editer `Golf Dashboard.html` direkte
2. Kjør `bash build-dist.sh` → kopierer til `dist/`
3. Zip `dist/`-innholdet (flat, ikke selve mappen): `cd dist && zip -r ../deploy.zip .`
4. Last opp `deploy.zip` til Cloudflare Pages → `clubhouse` project → Create deployment

## Viktige tekniske ting

- **Branding nå:** "Fairway Golf League" / "Where rivalries play out" (rullet tilbake etter at "Fairway Rivalry" gikk feil vei)
- **Logo:** FR-monogram fra `FR NY.png` — har svart bakgrunn. Når du genererer PNG, gjør pixels med RGB-sum < 60 transparent.
- **JS-validering:** Etter hver endring, kjør `node --check` på en awk-extracted versjon for å bekrefte JS er gyldig.
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

## Brukerens preferanser

- **Tone:** Direkte, konsis, norsk når mulig. Vis filer som klikkbare lenker så bruker kan åpne dem.
- **Endringer skal være visuelle og merkbare** — han tester på `fairwayrivalry.com` etter hver endring.
- **IKKE skift retning uten å spørre.** Gjentatte ganger har store retningsendringer (Bolk 37-41) gått feil vei og måttet rulles tilbake. Spør alltid før store omveltninger.
- **Han har OneDrive-lock-problemer** på filer i `C:\Users\malags\OneDrive...` — derfor er prosjektet flyttet til `C:\Users\malags\Dev\fgl`. IKKE skriv tilbake til OneDrive-mappa.

## Supabase

- Project ID: `rrsiscdnyprcwcmfnsrg`
- Dashboard: https://supabase.com/dashboard/project/rrsiscdnyprcwcmfnsrg
- Magic-link er den primære innloggingsmetoden
- Site URL og Redirect URLs må inkludere `https://fairwayrivalry.com` for at magic-link skal funke

## Deploy URLs

- **Live:** https://fairwayrivalry.com (custom domain, primær)
- **Backup:** https://clubhouse-395.pages.dev
- **Cloudflare project:** `clubhouse` (Pages)
- **Production branch:** `main`

## Hvis noe ser feil ut

1. Sjekk JS-syntaks: extract scripts og kjør gjennom acorn eller `node --check`
2. Sjekk om filen er truncert: `wc -l "Golf Dashboard.html"` skal være ~16,400+ linjer
3. Sjekk at `</script></body></html>` er på siste linje (`tail -3 "Golf Dashboard.html"`)
4. Hvis trunkert: be Mathias laste ned fra `fairwayrivalry.com` (Ctrl+S i nettleseren) og lagre tilbake
