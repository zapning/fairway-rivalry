# FGL — Status og retning (oppdatert 17. juni 2026)

## Hvor vi er

**Live deploy:** `fairway-deploy-v43b.zip` lastet opp til Cloudflare Pages, kjører på `fairwayrivalry.com`.

**Lokal kode:** matched til live. `Golf Dashboard.html` er 17,610 linjer og JS-validerer OK.

## Hva som er gjort sist

### Bolk 42: Rull tilbake (vellykket)
Stort sett alle endringer fra Bolk 37–41 var feil retning. Brukeren rullet tilbake Cloudflare til 14:20-deployen og lastet ned `index.html` derfra. Den ble lagt tilbake som `Golf Dashboard.html`.

### Bolk 43–44: Småfix på den stabile baselinen
- **FR-logo overalt** (overtatt fra FGL-logoen)
- Genererte alle ikoner fra `FR NY.png` med svart bakgrunn fjernet (RGB-sum < 60 → transparent)
- **Klubbhus-formet gull-SVG** over panelet i Clubhouse-tab
- **Fjernet "TROPHIES · 0/100"** med låste First Tee / Getting Going / Regular / Quarter Century
- **Inni klubbhuset:** CTA "Register your first round or rival" + demo-stats-wall med fiktive perfekte tall (HCP 8.4, 11–4 season record, best round 73, biggest rival Markus 6–3, latest 3 H2H med W/L-dots, 4 trofeer)
- Beholdt "YOUR GOLF LEGACY / Your story is here" øverst (uberørt)

## Hva som virker

- Logging av runder med scorecard
- Friends/rivaler lokalt
- Profile + handicap-beregning
- Leagues lokalt (men ikke cross-device)
- Magic-link via Supabase **HVIS** redirect URLs er konfigurert riktig
- PWA-installasjon
- Klubbhus-panel med klubbhus-SVG og demo-wall

## Hva som IKKE virker / utestet

- **Magic-link cross-device:** Trenger fortsatt at brukeren bekrefter Redirect URLs i Supabase Dashboard (`Auth → URL Configuration`) inkluderer `https://fairwayrivalry.com/**` og `https://fairwayrivalry.com`.
- **Push-notifikasjoner:** Utsatt på brukerens anbefaling til 50+ brukere
- **Friends-sync mellom enheter:** Krever `supabase-schema.sql` kjørt i Supabase (Bolk 36-arbeidet ligger klart men ikke aktivert)
- **Leagues cross-device:** Samme som over

## Hva som er feil retning (IKKE gjør igjen uten å spørre)

Disse retningene ble forsøkt og rullet tilbake — IKKE gjenta uten å sjekke med Mathias:

- ❌ **"Fairway Rivalry"-rebrand** med "Every rivalry starts with one round"-tagline. Han rullet tilbake til "Fairway Golf League" / "Where rivalries play out".
- ❌ **Stor Clubhouse-restrukturering** med 5-card hub (Rivalry Status / What to Fix / Form / Game Insight / Bragging Rights). Ble opplevd som overkill — han vil ha rolig, tradisjonell layout.
- ❌ **Hide tabs for newcomers** (progressive disclosure). Ble for begrensende.
- ❌ **4-stegs onboarding** med "Start your first rivalry" som flytter folk gjennom forced flow.

## Hvor han er nå med retning

Han ville ha:
- ✅ FR-logo gjennom hele appen (gjort)
- ✅ Velkomstside ved første login (eksisterer fortsatt via `maybeShowProfileSetup` i rolled-back versjon)
- ✅ "YOUR GOLF LEGACY / Your story is here" øverst (beholdt)
- ✅ Fjern trofé-greia på Clubhouse-forsiden (gjort)
- ✅ Klubbhus-formet gull-SVG (gjort)
- ✅ "Registrer din første runde eller rival" + demo-stats-wall (gjort)

## Hva som er åpent / neste

Brukeren skal teste den live deployen og si fra. Sannsynlige neste steg:
1. Verifiser at FR-logoen vises riktig i headeren på `fairwayrivalry.com`
2. Verifiser klubbhus-frame ser ut som klubbhus
3. Eventuelt finjuster: kolonne-spacing, dør-størrelse, posisjon av flagg
4. Mulig at han vil bygge ut "What you'll unlock"-greia mer
5. Mulig at han vil ha live magic-link til å funke — krever Supabase URL Configuration

## Filer å huske

- `fairway-deploy-v43b.zip` ligger i `C:\Users\malags\AppData\Roaming\Claude\local-agent-mode-sessions\...\outputs\` — siste deployerbare zip
- `Golf Dashboard.html` — gjeldende kildefil
- `FR NY.png` — original logo-asset (1.2 MB)
- `FGL ny.png`, `FGL2.png` — gamle logo-assets (backup, kan slettes hvis ønskelig)

## Hvor han testet sist

`fairwayrivalry.com` på desktop. Han laster opp zip via Cloudflare Pages "Create deployment" → "Direct upload".
