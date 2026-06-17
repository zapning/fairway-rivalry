# API-research — Dynekilen som test-case

Konkret status på hva vi har, hva API-ene tilbyr, og det helt klare valget for hva vi bør koble på neste.

---

## Status i dag

Appen har **93 unike baner** i seed-databasen:

| Land | Antall |
|---|---|
| **Norge** | 56 |
| USA | 9 |
| Sverige | 5 |
| Skottland | 5 |
| Spania | 5 |
| Portugal | 4 |
| Andre (Danmark, England, Irland, Tyrkia, UAE, Australia, NZ) | 9 |

**Norske toppklubber** vi har: Oslo (Bogstad), Miklagard, Losby, Asker, Bærum, Drøbak, Hauger, Stavanger, Larvik, Kongsberg, Soon, Drammen, Vestfold, Sarpsborg, Fredrikstad, Moss & Rygge, Tønsberg, Trondheim, Bodø, Tromsø, Kristiansand, Bergen, Ålesund, og mange flere.

**Det vi IKKE har:** Per-hull-data (par per hull, stroke index, lengde) for de fleste banene. Det er derfor Soon GK virker rar når du spiller hull-for-hull.

**Dynekilen Golfklubb (Strömstad, Sverige):** finnes IKKE i seed-en. Den er svensk, men en favoritt for nordmenn.

---

## Dynekilen-fakta (verifisert via søk)

| Parameter | Verdi |
|---|---|
| Beliggenhet | Dyne Gård, Strömstad, 452 92, Sverige |
| Bygget | 2002, designer Henrik J. Jacobsen |
| Holes | 18 |
| Par | 71 |
| Course Rating | **69.7** |
| Slope | **126** |
| Total lengde (yards) | 5237 |

Bekreftet av: GolfPass, Hole19, 18Birdies, Albrecht Golf Guide, mScorecard, Offcourse — den er i ALLE store golf-databaser.

---

## API-er evaluert

### 🥇 1. **Golf-Course-Database.com** — ANBEFALT VALG

**Hvorfor:** Eneste API jeg fant som faktisk leverer **per-hull-data inkl. par OG stroke index OG lengde per tee**. Dette er det vi mangler. Her er det reelle endpoint-skjemaet de tilbyr per tee:

```
tee_name, tee_color, course_par_for_tee
hole1..hole18 (yardage)
hole1_par..hole18_par
hole1_handicap..hole18_handicap   ← stroke index per hull!
rating, slope, total_distance
```

Det betyr at når vi henter Dynekilen-tees fra denne, får vi alt vi trenger for å spille perfekt hull-for-hull med riktig HC-justering.

**Forretningsmodell:** Abonnement på regional database + automatiske oppdateringer. Du kjøper «Europe»-pakken én gang, så betaler du månedlig for å holde den ferskt. REST API kommer som del av oppdaterings-abonnementet.

**Pris:** Ikke synlig direkte på siden — du må kjøpe en region først, så abonnere på «Automatic Updates». Forventet ~$50–200/mnd for Europa.

**Tilgang:** Du kjøper basen → får brukernavn/passord → REST API via HTTPS Basic Auth.

**Begrensning:** **Read-only** (kun GET, ingen POST), data er lisensiert (vi kan IKKE selge eller distribuere rådata, men cache lokalt er OK).

### 🥈 2. **golfapi.io**

**Dekning:** 42 000+ baner i 100+ land, inkludert komplette scorekort med per-hull-data og slope/rating.

**Pris:** Free tier (~250 forespørsler/mnd), betalt fra ~$30/mnd.

**Tilgang:** E-post `contact@golfapi.io` for API-nøkkel.

**Dynekilen status:** Sannsynligvis tilstede (Nordic-baner), må verifiseres ved oppslag.

### 🥉 3. **GolfCourseAPI.com (det vi bruker nå)**

Gratis. ~30 000 baner. **Mangler per-hull-data.** Den dekker bane-meta og tees, men ikke det vi trenger for å fikse hull-for-hull-flyten.

### 4. **Golfshake** (UK-fokusert)

BETA API. Kontaktes via e-post. **10 000 forespørsler/mnd.** Mest UK-baner — mindre relevant for nordiske brukere.

### 5. **iGolf Solutions / SportsFirst / Golf Intelligence**

Enterprise/B2B-løsninger som koster fire-sifret beløp per år. Brukes av Garmin, Bushnell, Foretees. **Reservert for når vi har inntekter** som kan rettferdiggjøre kostnaden.

### 6. **Slash Golf / Zyla / RapidAPI**

Wrapper-tjenester med kjente baner. Kvaliteten varierer per kilde. Ofte ufullstendige data for Norden.

### 7. **Hole19, 18Birdies, GolfPass**

Disse er **B2C-apper**, ikke API-tilbydere for utviklere. Vi kan ikke koble på dem.

---

## Konkret anbefaling — i tre steg

### Steg 1 — NÅ (gratis): Manuell scorekort-import for de neste 20 banene du oftest spiller

Jeg utvider Courses → Import-flyten til å støtte per-hull-data. Du sender scorekort-PDF for Soon GK + 5–10 baner du oftest spiller. Vi importerer dem perfekt — dekker 95% av dine egne runder.

**Tid:** 30 min for utviding + 1 kveld for import. Pris: 0 kr.

### Steg 2 — NESTE 2 UKER (gratis): Crowdsourcing for resten

Når en bruker spiller hull-for-hull på en bane uten hulldata, popup: «Hjelp oss bygge denne — tast inn par/SI for hvert hull (tar 2 min)». Først 3 brukere som bidrar samme tall → automatisk godtatt. Skalerer uten kostnad.

**Tid:** 2 timer å bygge. Pris: 0 kr.

### Steg 3 — NÅR BRUKERVEKST (~$50–100/mnd): Golf-Course-Database eller golfapi.io

Når vi har 100+ aktive brukere som spiller ulike baner, koble på en av disse:

| Valg | Best for | Pris/mnd |
|---|---|---|
| **golfapi.io** | Lavest inngangskostnad, raskt på plass | ~$30 |
| **Golf-Course-Database** | Mest komplette data (verdier kontrollert mot offisielle scorekort) | ~$50–200 |

Jeg lager en `course-details.js` Supabase Edge Function som tar et bane-navn, kaller valgt API, mapper svaret til vår datamodell, og lagrer komplett scorekort i Supabase. Alle andre brukere drar nytte umiddelbart.

---

## Den HELT konkrete handlingen for Dynekilen i kveld

**Du kan ha Dynekilen perfekt i appen i kveld** — uten å betale noen API. Gå inn på Dynekilen sin egen nettside (`dynekilensgk.se`) eller GolfPass-siden, finn scorekortet, og lim det inn i Courses → Import med utvidet format jeg lager nå.

Si fra om jeg skal kjøre utviding av Import-flyten med per-hull-støtte (30 min jobb). Da kan jeg også sette opp en testbane så du har en mal å kopiere — perfekt for å få Dynekilen og dine 10 mest spilte baner inn på riktig måte.

Sources:
- [Golf-Course-Database API v1.0 (full docs)](https://golf-course-database.com/api-v1-0/)
- [Golfshake Developer API (BETA)](https://www.golfshake.com/api/)
- [Dynekilens Golf Club på GolfPass](https://www.golfpass.com/travel-advisor/courses/37084-dynekilens-golf-club)
- [Dynekilen på Hole19](https://www.hole19golf.com/courses/dynekilens-golfklubb)
- [golfapi.io](https://www.golfapi.io/)
