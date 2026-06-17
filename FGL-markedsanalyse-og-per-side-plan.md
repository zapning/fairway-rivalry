# Fairway Golf League — markedsanalyse & per-side forbedringsplan

To deler: hvor FGL står i markedet og hvilken vinkel som faktisk kan vinne, og deretter en konkret, side-for-side plan for hva som kan gjøres bedre.

---

## DEL 1 — Markedsanalyse

### Landskapet

Golfapp-markedet er modent og dominert av noen få store:

- **18Birdies** — markedslederen (2M+ månedlige brukere). Alt-i-ett: GPS, handicap, scorekort, sosialt, 43 000+ baner. Bred, men «generalist».
- **TheGrint** — handicap-først, USGA-lisensiert offisiell handicap (~$5/mnd) uten klubbmedlemskap.
- **Golf GameBook** — gratis digitalt scorekort med live-leaderboards og sterk sosial/konkurranse-vinkel.
- **Arccos / Shot Scope** — data-tunge, sensorbaserte shot-tracking-systemer (strokes gained), for de seriøse.
- **Golfshot / WhyGolf** — GPS + stats + coaching.

### Hvor er hullet i markedet?

De store gjør GPS, handicap og generell stat-sporing godt. **Det ingen eier ordentlig er den private, sesonglange ligaen mellom kompiser** — der det handler om *rivalisering, identitet og historie*, ikke bare tall. GameBook har konkurranser, men de er turnerings-/event-baserte og upersonlige. 18Birdies har «compete with friends», men det er en bifunksjon, ikke selve produktet.

**FGLs vinkel:** «Din private golfliga.» Ikke nok et handicap-verktøy, men stedet hvor gjengen din finner ut hvem som faktisk eier banen — over en hel sesong, med rivaliseringer, arketyper og en levende tabell. Det er en *retensjons-* og *sosial*-vinkel, ikke en verktøy-vinkel.

### Hvorfor det kan vinne

- **Sosial innlåsing:** når 4–8 kompiser er i samme FGL-sesong, blir det dyrt å forlate (du mister tabellen din). De store appene har svak gruppe-innlåsing.
- **Retensjon innebygd:** sesong + rivalisering + Ryder Cup gir en grunn til å komme tilbake hver uke — golfapper sliter typisk med nettopp dette.
- **Identitet/historie:** arketyper, narrativer og Caddie gjør tall til en fortelling. Det er emosjonelt klebrig på en måte rene stat-apper ikke er.
- **Premium uttrykk:** den visuelle kvaliteten (gull/sølv, kinematisk rivalry) ligger over typiske hobby-apper.

### Realistiske svakheter vs. de store

- **Banedata & GPS:** de store har avtaler og GPS på selve hullet. FGL har ~30k baner via gratis-API, men ikke live-GPS-avstander under spill. *Ikke prøv å vinne på GPS* — det er deres hjemmebane.
- **Offisiell handicap:** TheGrint har USGA-lisens. FGL bør være tydelig på at det er en *WHS-stil* index for moro/tracking, ikke offisiell.
- **Nettverkseffekt:** verdien avhenger av at vennene dine er med. Onboarding må gjøre det superenkelt å dra inn gjengen.

### Strategi i én setning

Ikke konkurrer med 18Birdies på bredde. **Vær den beste appen i verden for én ting: den private ligaen og rivaliseringen mellom en fast gjeng.** Alt annet (GPS, stats) er «godt nok»-støtte rundt den kjernen.

### Monetisering (når tiden er inne)

- **Gratis kjerne** (logg runder, én aktiv rivalisering, FGL-sesong) for å bygge nettverkseffekt.
- **Premium pr. liga/gruppe** heller enn pr. bruker: én betaler for «proff-ligaen» (ubegrensede rivaliseringer, Ryder Cup-historikk, sesongtrofeer, custom-merke) — lav friksjon, høy verdi for gruppen.
- Unngå annonser; det dreper det premium uttrykket.

---

## DEL 2 — Per-side forbedringsplan

For hver flate: hva den gjør i dag, og det konkrete neste steget.

### Landing / velkomst
I dag: full-screen, premium, fire pilarer, transparent logo. Bra førsteinntrykk.
Forbedre: på mobil, led til **én** CTA («Logg din første runde») — utsett resten. Legg til en liten «Se demoen»-snarvei som lar folk oppleve en rivalisering før de registrerer seg (utsatt signup løfter aktivering 10–30 %).

### Clubhouse (tidl. Dashboard)
I dag: adaptiv hero (3 moduser), Current Form, Next Milestone, Recent Moments, «What FGL builds».
Forbedre: legg til et **ukentlig sammendrag** øverst når man har data («Uke 22: du klatret til #2, vant mot Lars»). Det er den enkeltkomponenten som mest sannsynlig drar folk tilbake. Gjør hero kortere på mobil (gjort delvis) og sett FGL-rang + neste handling «above the fold».

### FGL (sesong)
I dag: podium, tabell, breakdown, forklaring. Sterkt.
Forbedre: legg til **delbar sesong-tabell** (samme virale mekanikk som rivalry-kortet) og en «sesong-slutt»-oppsummering med vinner-seremoni. Vis «X runder igjen / Y poeng bak #1» for å skape jag.

### Rivalry
I dag: liste, kinematisk detalj, Ryder Cup, head-to-head.
Forbedre: **push-varsel** når en rival logger en runde («Lars slo 82 — du er nå #2»). Legg til en «utfordre»-knapp som sender en delbar invitasjon. Vis nedtelling når en rivalisering nærmer seg slutt.

### New round (Ny runde)
I dag: spilltype-valg, vær-autofyll, hull-for-hull, stableford, motstanderscore.
Forbedre: gjør det enda raskere — **husk siste bane/tee** og foreslå dem først (delvis gjort). Ett-taps «samme oppsett som sist». Mål: under 30 sekunder å logge.

### Rounds (alle runder)
I dag: tabell + detalj-modal.
Forbedre: legg til **filtre** (bane, periode, spilltype) og en liten trendgraf på toppen. Gjør radene tappbare på mobil med større touch-mål.

### Insights
I dag: premium tom-tilstand, KPI-er etter hvert som data kommer.
Forbedre: koble innsikt til **handling** — «Du scorer 3 slag dårligere i vind > 8 m/s → øv på lave wedge-shots» (Caddie kan levere dette). Innsikt uten neste steg blir bare tall.

### Trophies
I dag: tiered trofésystem, personlige rekorder.
Forbedre: vis **«nesten der»**-trofeer prominent (du er 1 runde unna) — det driver «én runde til». Del-kort for nylig opplåste trofeer.

### Courses
I dag: lokalt søk, online-søk, **import** (ny), community-bidrag.
Forbedre: forhåndslast flere norske klubber via import-formatet. Vis «nylig spilte» øverst. Vurder golfapi.io hvis full scorekort-dekning blir viktig.

### Friends
I dag: liste, invitasjoner.
Forbedre: gjør invitasjon til **hovedhandlingen** med delbar lenke/QR — nettverkseffekten er hele forretningsmodellen. Vis «vennen din har logget 3 runder denne uka» for å trigge konkurranse.

### Stats
I dag: standings-paneler, minigame-regnskap.
Forbedre: introduser en forenklet **strokes-gained-light** (basert på hull-data der det finnes) og sammenlign mot venner, ikke bare deg selv.

### Profile
I dag: atlet-identitetskort, arketype, karriere-rekord.
Forbedre: gjør det **delbart** (et «spillerkort» som kan postes). Det er gratis markedsføring.

### Settings
I dag: API, eksport/import, språk.
Forbedre: rydd og grupper; flytt avanserte API/proxy-felt bak «Avansert». Legg til et tydelig **«Inviter gjengen»**-kort.

### The Caddie (ny, utvidet)
I dag: 110+ emner (handicap, kølledistanser, PGA-stats, regler, strategi, utstyr) + dine egne data.
Forbedre: legg inn **proaktive** prompts på Clubhouse («Spør Caddie: hvorfor faller scoren min i vind?»). Senere: oppgrader til ekte AI via Supabase Edge Function for fri-tekst-spørsmål utenfor banken.

### På tvers (teknisk)
- **Sikre filen mot OneDrive-trunkering** — flytt prosjektet ut av synket mappe + Git. (Filen ble kuttet flere ganger i dag; dette er viktigst.)
- **Web-push** — den største enkeltspaken for ukentlig retensjon.
- **Mål aktivering** — tid til første runde, D1/D7. Uten måling gjetter man.

---

## Prioritert rekkefølge (forretningsmessig effekt)

1. **Inviter-gjengen-flyt + push** — nettverkseffekt og retensjon er hele vinkelen.
2. **Ukentlig sammendrag på Clubhouse + delbar FGL-tabell** — gir grunn til å komme tilbake og sprer appen.
3. **Sikre filen (OneDrive/Git)** — beskytt det du har bygget.
4. **Rask runde-logging (< 30 sek)** — kjernehandlingen må være friksjonsfri.
5. **Premium pr.-liga-monetisering** når en fast gjeng er aktiv.

Kort sagt: FGL trenger ikke bli en bredere app. Den trenger å bli den **udiskutabelt beste private golfligaen** for en fast gjeng — og så gjøre det trivielt å dra inn gjengen og komme tilbake hver uke.
