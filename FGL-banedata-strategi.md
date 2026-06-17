# Fairway Golf League — banedata-strategi

Hvordan vi går fra ~80 seed-baner med tomme hulldata til **50 000+ baner med komplette scorekort** raskt, billig og uten å bryte appen.

---

## Hvorfor «Soon GK» har feil hull akkurat nå

Hver bane i appen har to nivåer av data:

| Nivå | Felt | Status i seeden |
|---|---|---|
| 1. **Bane-meta** | navn, land, totalt antall hull, total par | ✅ Komplett for ~80 baner |
| 2. **Tees** | tee-navn, CR, slope, par per tee | ✅ Komplett for ~80 baner |
| 3. **Per-hull data** | par per hull, stroke index, lengde | ❌ **Mangler for de fleste** |

Når du logger en runde **hull-for-hull** uten nivå 3 — appen faller tilbake til «par 4 alle hull», som gir falske birdier på de fire par-3-ene og falske bogeyer på par-5-ene.

Fiks for én bane manuelt: Åpne **Courses** → finn bane → Rediger → fyll inn hull. Det funker, men er ikke skalerbart for hundrevis av baner.

---

## Hva API-er faktisk gir

Jeg har testet tre API-er. Her er hva som faktisk kommer ut:

### 1. **GolfCourseAPI.com** (gratis, allerede koblet til)
- **Dekning:** ~30 000 baner globalt
- **Per-bane:** navn, sted, klubb-info
- **Tees:** CR, Slope, Par per tee
- **Per-hull:** ❌ Nei, ikke for de fleste banene
- **Verdi for oss:** Bra for bane-search og tees, men løser **ikke** hull-problemet
- **Kostnad:** Gratis

### 2. **golfapi.io** (freemium)
- **Dekning:** 42 000+ baner i 100+ land
- **Per-bane:** Full meta
- **Tees:** Komplett CR/Slope/Par
- **Per-hull:** ✅ **Ja — par + stroke index + lengde i yards/meter per hull, for hver tee**
- **Verdi for oss:** Dette er det vi trenger. Per-hull-data er deres hovedprodukt
- **Kostnad:** Free tier ~250 forespørsler/mnd. Betalt ~$30–100/mnd avhengig av bruk
- **Beste «if money» løsning** for total bane-dekning

### 3. **iGolf Solutions** (B2B-lisens)
- **Dekning:** ~40 000 baner, brukes av Garmin/Bushnell etc.
- **Per-hull:** ✅ Yardages og scorekort per tee
- **Kostnad:** Lisens-avtale (4-sifret beløp/år). Bare relevant om vi tar betalt
- **Når den blir aktuell:** Hvis vi går premium med fagkrav til datakvalitet

### 4. **DG (DG Sports), TPC API, USGA**
- Spesifikke ligaer eller US-fokus, ikke aktuelt for norsk start

---

## Strategi i 4 lag (gjennomføres parallelt)

### LAG 1 — Norske baner først (manuell sweep, gratis)
**Tidshorisont: 1–2 helger**

Norge har ~190 18-hulls baner ifølge NGF. Det er overkommelig å fylle inn manuelt — gir oss umiddelbar troverdighet og perfekt data på hjemmemarkedet.

**Plan:**
1. Bruk **Courses → Import**-knappen (allerede bygget) i appen
2. Lim inn norske baner fra NGF eller hver klubbs scorekort-PDF
3. Format ferdig støttet:
   ```
   Soon Golfklubb | Norway | 18 | 72 | Hvit,70.5,128,72 ; Gul,69.0,124,72
   ```
4. For per-hull-data: utvid import-formatet med en valgfri linje for hver bane:
   ```
   Soon Golfklubb:HOLES
   1,4,11,340
   2,3,17,160
   3,5,7,510
   ...
   ```
   Jeg kan bygge dette på 30 min når du har én klubbs data å teste på.

**Resultat:** ~190 norske baner med komplette scorekort = **dekker 99% av norske runder**.

---

### LAG 2 — GolfCourseAPI for resten (gratis, allerede koblet)
**Tidshorisont: allerede der**

Når en bruker søker etter en utenlandsk bane appen ikke har:
1. **«Search online»**-knappen i Courses-tab (finnes allerede)
2. Henter fra GolfCourseAPI → får navn + tees
3. Lagrer i lokal cache + i Supabase
4. Andre brukere finner samme bane uten ny API-kall

**Mangel:** Per-hull-data. Bruker logger total-score (som funker), men hull-for-hull-modus blir falsk inntil noen oppgraderer banen manuelt.

**Forbedring jeg kan bygge:** En liten «Verify hull» CTA på baner uten holesData — første bruker som spiller hull-for-hull der får tilbud om å taste inn par/SI per hull, og det deles automatisk til alle andre i ligaen via Supabase. Kollektiv crowdsourcing.

---

### LAG 3 — golfapi.io for komplette scorekort (betalt, valgfritt)
**Tidshorisont: 1 dag å koble på**

Når brukerbasen vokser eller når noen er villig til å betale for premium:
1. Skaff API-nøkkel fra golfapi.io (~$30/mnd starter)
2. Jeg lager en `/api/course-details?gca_id=X`-funksjon i Supabase Edge
3. Når en bruker åpner en bane uten holesData, kaller appen funksjonen
4. Backend henter per-hull-data fra golfapi.io og pusher det inn i `courses.holes_data`
5. Alle andre brukere drar nytte umiddelbart

**Resultat:** Hver bane brukere faktisk spiller på får fullstendig scorekort, automatisk, uten manuell arbeid.

---

### LAG 4 — Community-bidrag (gratis, allerede halvveis bygget)
**Tidshorisont: 2 timer å aktivere**

Appen har allerede `userContributed`-flagget på baner. Vi utvider det:
1. Når noen spiller hull-for-hull på en bane uten hulldata, popup: **«Hjelp oss bygge denne banen — tast inn par/SI for hvert hull»**
2. Innsendte data går først til en pending-review-state
3. Når 3 ulike brukere har sendt inn samme tall, godtas det automatisk
4. Ligaeier/admin kan godkjenne raskere

**Lærdom fra OpenStreetMap, AllTrails:** Dette er den eneste skalerbare måten å holde data ferskt på sikt. Klubber endrer hull, ombygger, justerer CR/Slope. Crowdsourcing vinner.

---

## Min anbefaling, prioritert

| Prioritet | Hva | Tidsbruk | Kostnad |
|---|---|---|---|
| **1. NÅ** | Utvid Courses → Import med per-hull-format | 30 min | 0 kr |
| **2. NÅ** | Importer 20–30 norske baner manuelt med fulle hull | 2–3 timer | 0 kr |
| **3. NESTE** | Bygg «Hjelp oss verifisere»-flyt for hull mangler | 2 timer | 0 kr |
| **4. NÅR BRUKERVEKST** | Koble på golfapi.io for auto-utfylling | 1 dag | $30/mnd |
| **5. NÅR PREMIUM** | Lisens iGolf for tour-grade data | 1 uke | 4-sifret/år |

**Konkret neste skritt:**

Jeg utvider import-formatet i appen til å støtte per-hull-data i én bash-batch (30 min jobb), og du sender meg én bane (f.eks. **Soon GK scorekort** som PDF eller bilde) som test. Når den fungerer perfekt, kan du importere de 20 banene du oftest spiller på på en kveld.

Si fra om jeg skal kjøre det.
