# Fairway Golf League — deploy & domene-guide

Hva som faktisk må gjøres for å pushe alle endringene live og koble på et eget domene. Du gjør stegene selv (jeg kan ikke kjøpe ting eller logge inn på dine kontoer), jeg har samlet alt på ett sted.

---

## 1. Deploy alle endringer (dev → prod)

Appen er allerede live på `https://clubhouse-395.pages.dev/` via Cloudflare Pages. Hver gang du vil pushe nye endringer:

### Den enkle veien (drag-and-drop, 30 sek)
1. Åpne `dash.cloudflare.com` → **Workers & Pages** → **clubhouse** (Pages-prosjektet ditt).
2. Klikk **Create deployment**.
3. Dra hele `dist/`-mappen inn i opplastings-vinduet.
4. Vent 30–60 sekunder — den nye versjonen er live.

Pages beholder tidligere deploys, så hvis noe går galt kan du rulle tilbake med ett klikk under **Deployments**.

### Sjekkliste FØR du drar dist/ over
- [ ] `dist/index.html` finnes og slutter på `</html>` (jeg verifiserer dette automatisk)
- [ ] `dist/manifest.json`, `dist/sw.js`, `dist/supabase-bridge.js` ligger ved siden av
- [ ] Alle ikoner (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `logo-header.png`, `header-bg.jpg`) er der
- [ ] Åpne `dist/index.html` lokalt først (dobbeltklikk) for en rask sanity-sjekk
- [ ] Etter deploy: åpne `clubhouse-395.pages.dev` i et inkognito-vindu så du ikke ser cachet versjon

### Hvis du heller vil ha auto-deploy fra Git
Anbefales på sikt, men krever at du flytter prosjektet ut av OneDrive (som uansett løser truncation-problemet). Da kobler du Pages mot et GitHub-repo og hver `git push` deployer automatisk. Si fra om du vil ha en guide til det.

---

## 2. Kjøpe domene

### Mine anbefalinger (i prioritert rekkefølge)

| Domene | Pris/år (ca.) | Hvorfor |
|---|---|---|
| **fairwaygolfleague.com** | 100–150 kr | Førstevalget. Klart, gjenkjennelig, riktig brand. |
| **fairwaygolfleague.app** | 200–300 kr | `.app` signaliserer at det ER en app. Litt dyrere men premium. |
| **fgl.golf** | 350–500 kr | Kort og spesifikt. Dyrt fordi `.golf` er en nisje-TLD. |
| **fglrating.com** | 100–150 kr | Hvis hovedlogoen er FGL-tallet. |
| **playfgl.com** | 100–150 kr | Verb-brand, fungerer godt for CTA («Play FGL»). |

**Min anbefaling:** `fairwaygolfleague.com` — billigst, klarest, og det matcher allerede landing-copyen din. Vurder `.app` hvis du vil signalisere produkt-natur.

### Hvor du kjøper

Tre solide registrarer:

| Registrar | Pris | Når passer den |
|---|---|---|
| **Cloudflare Registrar** | Til kostpris (~100 kr/år for .com) | Beste valget siden Pages allerede er hos Cloudflare. Null margin, ingen tilleggssalg, automatisk DNS-oppsett. |
| **domeneshop.no** | 150 kr/år | Norsk, god kundeservice, betal med Vipps. Hvis du vil ha alt på norsk. |
| **Porkbun** | ~120 kr/år | Veldig god for `.app`-domener, billig fornyelse, ren UI. |

**Cloudflare Registrar er klart enklest** når DNS allerede er hos Cloudflare. Du sparer ett oppsett-steg.

### Sjekkliste for kjøp
- [ ] Søk opp domenet på registrar
- [ ] Slå PÅ **WHOIS privacy / Whois Privacy Guard** — gratis hos Cloudflare og Porkbun, holder hjemmeadressen din skjult
- [ ] Slå PÅ **auto-renew** så du ikke mister det
- [ ] IKKE betal for SSL, e-postpakke eller «website builder» — du trenger ingen av delene
- [ ] Hvis du tar `.app`: HSTS er påkrevd (Cloudflare ordner det automatisk)

---

## 3. Koble domenet til Cloudflare Pages

Dette tar 5 minutter etter at kjøpet er gjort.

### Hvis du kjøpte på Cloudflare Registrar
1. `dash.cloudflare.com` → **Workers & Pages** → **clubhouse**
2. **Custom domains** → **Set up a custom domain**
3. Skriv `fairwaygolfleague.com` (uten `https://`, uten `www`)
4. Cloudflare oppretter de nødvendige CNAME/A-records automatisk
5. Sertifikat er klart innen 1–2 minutter
6. Legg også til `www.fairwaygolfleague.com` og sett opp redirect → root-domenet

### Hvis du kjøpte hos en annen registrar
1. På Cloudflare Pages → **Custom domains** → **Set up a custom domain** → skriv domenet
2. Cloudflare gir deg DNS-records (CNAME-er) som ser slik ut:
   - `@` → `clubhouse-395.pages.dev` (CNAME)
   - `www` → `clubhouse-395.pages.dev` (CNAME)
3. Hos registraren din (domeneshop, Porkbun osv.): gå til DNS-administrasjon og legg til de samme records
4. Vent 10–60 min på DNS-propagering
5. Sertifikat utstedes automatisk

---

## 4. Supabase auth-redirect (VIKTIG etter domene-bytte)

Når du har eget domene må Supabase vite om det, ellers feiler innlogging og e-postbekreftelse.

1. `app.supabase.com` → ditt prosjekt → **Authentication** → **URL Configuration**
2. **Site URL**: `https://fairwaygolfleague.com`
3. **Redirect URLs** — legg til alle disse (én per linje):
   ```
   https://fairwaygolfleague.com
   https://fairwaygolfleague.com/**
   https://www.fairwaygolfleague.com
   https://clubhouse-395.pages.dev/**
   http://localhost:3000/**
   ```
4. Lagre.

---

## 5. PWA-manifestet bør oppdateres når domenet er klart

Etter at `fairwaygolfleague.com` er live, oppdater `manifest.json` og `index.html`:
- `manifest.json` → `"start_url": "https://fairwaygolfleague.com/"`, `"scope": "https://fairwaygolfleague.com/"`
- I `<head>` på `index.html`: `<link rel="canonical" href="https://fairwaygolfleague.com/">`

Si fra når domenet er kjøpt så fikser jeg dette i koden og bygger en ny `dist/`.

---

## Rask sjekkliste — hva du gjør, hva jeg gjør

| Steg | Hvem |
|---|---|
| Kjøp domene hos Cloudflare Registrar | Du |
| Legg domenet til Pages → Custom domains | Du (1 klikk) |
| Supabase Auth URL-config | Du (5 felt å lime inn) |
| Oppdater manifest.json + canonical-tag | Jeg (når du sier domenet) |
| Drag dist/ til Pages for ny deploy | Du |
| Lagre rollback-link hvis noe knekker | Du (deployments-fanen) |

Total tid hvis du tar Cloudflare Registrar + det enkleste valget: **15–20 minutter fra du klikker «Kjøp» til det er live på eget domene**.

Si fra når du har kjøpt — så fikser jeg manifest, canonical og bygger en deploy-klar `dist/`.
