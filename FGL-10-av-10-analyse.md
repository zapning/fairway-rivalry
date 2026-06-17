# Fairway Golf League — veien til 10/10

En full gjennomgang av appen med ett mål: gjøre den til en mobil-først golfapp folk åpner hver uke. Analysen er bygget på etablerte prinsipper for app-suksess (aktivering i første økt, D1/D7-retensjon, lav friksjon) og en konkret vurdering av FGL slik den står i dag.

---

## 1. Dommen først

Median for apper på tvers av bransjer er 26 % D1-retensjon og 13 % D7. Apper med god onboarding når 40 %+ D1. FGL har allerede et premium visuelt uttrykk, en ekte differensiator (rivalisering + sesong) og solid datamodell. Det som avgjør om den blir 6/10 eller 10/10 er **de første 60 sekundene på mobil** og **om det finnes en grunn til å komme tilbake neste uke**.

Nåværende vurdering (1–10):

| Dimensjon | I dag | Tak uten endring | Kommentar |
|---|---|---|---|
| Visuell design | 8 | 8 | Allerede sterkt, gull/sølv-språket er proft |
| Posisjonering / idé | 9 | 9 | Rivalisering + FGL-sesong er en ekte vinkel |
| Første økt (aktivering) | 5 | 6 | For mye tekst og for mange valg før verdi |
| Mobil-UX | 6 | 7 | Bedret nå, men noen flater er tette |
| Retensjon (grunn til å returnere) | 5 | 6 | FGL-sesong + Caddie hjelper, trenger varsler |
| Banedata (dekning) | 6 | 6 | ~30k via gratis API, men friksjon i import |
| Teknisk robusthet | 4 | 4 | **OneDrive-trunkering er en reell risiko (se §8)** |

Tre ting flytter mest: **(1)** stram inn første økt til én verdifull handling under 60 sek, **(2)** gi en ukentlig grunn til å komme tilbake (FGL-sesong + push), **(3)** sikre filen mot trunkering.

---

## 2. Den viktigste flaten: de første 60 sekundene

Forskning er entydig: D1-retensjon avgjøres nesten utelukkende av kvaliteten på første økt. De beste appene i 2026 lar deg oppleve kjerneverdien innen 60 sekunder, og «onboarding som ikke føles som onboarding» vinner (Duolingo lar deg gjøre noe ekte med en gang). Hvert ekstra onboarding-steg utover 5 kutter fullføring 10–15 %.

Hva det betyr for FGL:

- **Utsett alt som ikke trengs.** Be om navn, så rett inn i «logg din første runde» eller «se en rivalisering i aksjon» (demoen finnes allerede — bruk den som standard for tomme kontoer).
- **Én handling, ikke fire.** Landingen viser i dag Track / Compete / Build / Create. På mobil bør den lede til **én** knapp: «Logg din første runde». Resten kan komme etter første verdi.
- **Vis verdi før registrering.** «Deferred signup» løfter aktivering 10–30 %. La folk se demo-rivaliseringen og FGL-tabellen før de må opprette noe.
- **Mål det.** Tid til første runde logget, fullføringsrate på onboarding, D1/D7 for onboardede. Uten måling gjetter man.

Konkret mål: fra app åpnes til første runde er logget skal det ta **under 60 sekunder og maks 3 skjermer**.

---

## 3. Design og visuelt system

Det visuelle er appens sterkeste kort. Behold retningen, stram detaljene:

- **Konsistent gull/sølv-aksent.** Den delte logoen og FGL-fargene er et godt «brand-anker». Sørg for at samme gull (`--gold`) brukes på alle primær-CTAer, og at sølv kun er sekundært.
- **Mindre «boks-i-boks».** Premium apper puster. Reduser antall rammer/paneler oppå hverandre, særlig på dashboard og i rivalry-detalj.
- **Ett ikon-språk.** Det egne monoline-settet (FG_ICONS) bør erstatte de gjenværende emoji-ene (⛳🏆⚔ dukker fortsatt opp enkelte steder, f.eks. Caddie-knappen og noen kort). Konsistens her hever det fra «hobby» til «produkt».
- **Tomme tilstander som selger.** De finnes allerede for Insights/Stats — bruk samme nivå på FGL-tabellen og Ryder Cup (gjort nå) og på Friends.

---

## 4. Typografi og copy — hva som står, og hvor

Tekst er der appen «mister momentum på telefonen». Prinsipp: **overskrift kort, kropp kortere, og aldri to setninger der én holder.**

- **Hierarki:** én tydelig H1 per skjerm, så maks to linjer støttetekst. Resten skjules bak «les mer» eller fjernes. (Mobil-passet nå klamper allerede `.section-sub`, `.story-body`, `.wfb-card-body` og kutter `.sc-desc` på telefon.)
- **Aktive verb foran adjektiver:** «Logg runde», «Slå vennen din», «Se hvem som leder» — ikke «Her kan du registrere dine runder slik at du …».
- **Konsekvent språk.** Det ligger fortsatt noen norske strenger i mindre brukte flater (f.eks. toasts som «Kan ikke slette siste profil», «Ingen baner funnet», «Trimmed … cloud courses»). Velg én linje: engelsk som standard med i18n, og oversett de gjenværende.
- **Tall som historie.** Caddie og narrative-motoren gjør dette bra. Fortsett: «Du er #2, 14 poeng bak Lars» slår «Rangering: 2».
- **Font:** dagens system-/serif-miks fungerer. Hvis du vil løfte ett hakk: en strammere grotesk for tall (tabellscore, FGL-rating) gir en mer «sports-broadcast» følelse. Hold det til én display-font + én tekst-font.

---

## 5. Mobil-UX i detalj

- **Tommelsone.** Primær-CTA og fanebytte bør være i nedre halvdel. FAB-ene (logg runde nede til høyre, Caddie nede til venstre) er riktig plassert.
- **Faner.** Det er nå 12 faner i en horisontal strip. På mobil er det mye. Vurder å gruppere sjelden brukte (Courses, Friends, Settings) bak en «Mer»-meny, så de viktige (Dashboard, FGL, Rivalry, Ny runde) alltid er synlige.
- **Touch-mål ≥ 44px.** Sjekk små «pills» og tee-badges.
- **Én skjerm = ett budskap.** Unngå at dashboard krever mye scrolling før første handling.
- **Hastighet.** Som PWA: hold første innlasting rask, cache aggressivt (service worker finnes), og unngå tunge bilder.

---

## 6. Banedata og APIer — hvordan få flere baner

Appen bruker allerede det gratis **GolfCourseAPI** (~30 000 baner). Det er et godt utgangspunkt. Alternativer hvis du vil utvide dekning/kvalitet:

- **GolfCourseAPI.com** — gratis, ~30k baner. Behold som standard.
- **golfapi.io** — 42 000+ baner i 100+ land, full scorekort-data (par, stroke index, tees, slope, rating, koordinater). Freemium/betalt. Beste oppgradering hvis du vil ha komplett scorekort-data.
- **iGolf / SportsFirst / TeeRadar** — lisensiert tee- og scorekort-data (tee-navn, farger, yardage, slope/rating for herre/dame). Mer for kommersiell skala.

Praktiske grep for «flere baner» uten å bytte API:

1. **Bane-import er nå bygget** (Courses → ↧ Import): lim inn `Navn | Land | Hull | Par | Tee,CR,Slope,Par ; …`. Bruk den til å masse-legge norske klubber.
2. **Community-bidrag:** la brukere legge til/rette baner (finnes delvis) og synk de beste til Supabase, så alle får dem.
3. **Cache søk:** når en bane hentes fra API, lagre den lokalt + i Supabase, så den ikke må hentes på nytt.
4. **Forhåndslast norske klubber** ved første kjøring (seed finnes — utvid listen via import-formatet).

---

## 7. Retensjon — grunnen til å komme tilbake

Det bratteste fallet er D1→D7. Onboarding får dem inn; en **vane** holder dem. FGL har nå byggeklossene:

- **FGL-sesong (ny):** en levende tabell skaper «hvor ligger jeg nå?»-trang. Forsterk med en ukentlig oppsummering: «Uke 22: du klatret til #2».
- **Ryder Cup (ny):** perfekt for kompisturer — en delt scoreboard gir flere brukere inn.
- **Caddie (ny):** en grunn til å åpne selv uten å spille — spør om form, regler, neste milepæl.
- **Push/varsler (mangler):** den enkeltfaktoren som flytter D7 mest. «Lars logget en runde — du er nå #3» eller «Din rivalisering utløper om 3 dager». Som PWA kan du bruke web-push (krever oppsett + brukertillatelse).
- **Streak finnes allerede** — koble den til FGL-sesongen så daglig/ukentlig aktivitet gir synlig fremgang.

---

## 8. Teknisk robusthet — kritisk

**OneDrive trunkerer arbeidsfilen under lagring.** Flere ganger i dag ble `Golf Dashboard.html` kuttet midt i en funksjon ved skriving (sync-race). Det er gjenopprettet hver gang, men det er en reell risiko for at en fremtidig endring ødelegger appen uten at det merkes.

Anbefaling, i prioritert rekkefølge:

1. **Flytt prosjektet ut av OneDrive-synket mappe** (f.eks. en lokal `C:\Dev\fgl`-mappe), eller
2. **Pause OneDrive-sync** mens det redigeres, eller sett mappen til «Alltid behold på denne enheten», og
3. **Bruk Git** for versjonskontroll — da er trunkering trivielt å oppdage og rulle tilbake.
4. **Behold `dist/` som deploy-kilde** (det gjør vi) og verifiser linjetall + at filen slutter på `</html>` før hver deploy.

Dette er det viktigste enkeltpunktet for «10/10 på alle måter»: en app som kan ødelegges av en lagring er ikke robust.

---

## 9. Prioritert vei til 10/10

**Nå (størst effekt, lav kostnad)**
1. Sikre filen mot trunkering (§8) — flytt ut av OneDrive + Git.
2. Stram første økt: navn → én CTA → verdi under 60 sek (§2).
3. Rydd gjenværende norsk copy til engelsk (§4).

**Neste (retensjon)**
4. Web-push: «rival logget runde», «sesong-oppdatering» (§7).
5. Ukentlig FGL-sammendrag på dashboard.
6. Grupper sjeldne faner bak «Mer» (§5).

**Senere (dybde)**
7. Vurder golfapi.io for full scorekort-data hvis dekning blir et tema (§6).
8. Ett ikon-språk overalt, fjern siste emoji (§3).
9. A/B-test onboarding og mål D1/D7.

Treffer du de tre «Nå»-punktene og de tre «Neste», er FGL en ekte 9–10/10 mobil-app: vakker, rask, med en grunn til å komme tilbake — og trygg mot å ødelegges.
