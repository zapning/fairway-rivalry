# Fairway Rivalry — byggeplan for app-maskinen (v3)

Dette er den bindende rekkefølgen for hvordan app-maskinen bygges. Planen er produktomfattende:
Clubhouse er første dype pilot, ikke hele systemet.

Fairway Rivalry er i dag i stor grad en SPA. Der planen omtaler «side», menes **side / rute / aktiv
tilstand** — en fane eller visning som aktiveres i app-shellen, uavhengig av om den har en egen URL.

## Målarkitektur

```text
Brukerønske
  ↓
Product decision
  ↓
Approved contract + references
  ↓
Change-impact manifest
  ↓
Implementer
  ↓
Deterministiske tester (struktur, funksjon/data, layout/a11y, visuelt, ikke-funksjonelt)
  ↓
CI som autoritet
  ↓
Real-device- og PWA-bevis
  ↓
Hash-bundet release-gate
  ↓
Deploy
  ↓
Produksjonsverifisering, overvåking, rollback
```

## Prinsipp for rekkefølge

1. Kilde til sannhet
2. Maskinlesbare kontrakter
3. Deterministiske tester
4. CI som autoritet
5. Release-sperre
6. Enforcement hooks
7. Skills
8. Read-only reviewers
9. Produksjonsverifisering og rollback
10. Adversariell evaluering

Å starte med agents eller store prompts alene vil ikke hindre samme feil på nytt.

---

# Tverrgående regler

Disse reglene gjelder i **alle** trinn og går foran den enkelte trinnbeskrivelsen.

## A. Arbeidsmoduser

Hver oppgave merkes med én modus. Modusen bestemmer hvilke porter som gjelder.

**Utforskning.** Idéarbeid, prototyper, alternative retninger. Skal foregå teknisk isolert i **egen
branch**, **egen worktree** eller **`design/candidates/`**.

Utforskning tillater raske kandidater, men **forbyr**:

- endring av approved-baselines
- godkjenning eller oppdatering av snapshots
- bruk av produksjonsdata til skrivetester
- push til beskyttet releasebranch
- deploy
- sammenblanding med en godkjent implementeringscommit

Ingen obligatoriske kvalitetsporter gjelder i utforskning — kun at ingenting godkjent røres.

**Implementering.** Bygging mot en scoped kontrakt. Kun kontrakten og de testsettene som
change-impact manifestet krever, må være grønne. Ikke hele portsettet.

**Release.** Alle obligatoriske porter kjøres for samme kildekode-hash, med full bevispakke,
uavhengig review og produksjonsverifisering.

## B. Change-impact manifest (obligatorisk)

Før enhver **implementerings-** eller **release**oppgave skal det opprettes et maskinlesbart
change-impact manifest. Det skal minst inneholde:

- arbeidsmodus
- endrede filer
- berørte sider/ruter/aktive tilstander
- berørte delte komponenter
- berørte data-/API-kontrakter
- risikonivå
- obligatoriske testsett
- krav til screenshot-, real-device- og reviewer-bevis

**Klassifiseringsregel.** Implementerende Claude kan **ikke uten eksplisitt begrunnelse** klassifisere
en global endring som lokal. Endringer i **app-shell, header, navigasjon, globale design tokens,
delte komponenter, runtime, auth eller datamodell** skal som utgangspunkt klassifiseres som
**produktomfattende**. Nedgradering til «lokal» krever skriftlig begrunnelse i manifestet.

## C. Miljøseparasjon (bindende)

- Skrivetester skal **aldri** kjøres mot produksjons-Supabase.
- Data-/API-, isolasjons-, idempotens- og migrasjonstester skal bruke **separat testprosjekt** eller
  **lokal instans** med egne fixtures.
- Produksjon kan **kun** brukes til eksplisitte **read-only** smoke-kontroller.
- Manglende sikker miljøseparasjon gir **BLOCKED**.
- Testdata skal kunne identifiseres og ryddes **deterministisk**.

## D. Trinnstatuser (kun disse)

- `NOT STARTED`
- `IN PROGRESS`
- `OPERATIONAL PARTIAL` — en avgrenset del gir verdi og kan brukes, men trinnet er ikke endelig ferdig
- `FINAL PASS` — alle ferdigkriterier er oppfylt og bevist
- `BLOCKED`

Ordet «PASS» skal ikke brukes om et trinn dersom ikke alle ferdigkriteriene er oppfylt.

## E. Leveranseform

Hvert trinn leveres i **små, brukbare deler**. Et trinn regnes som `OPERATIONAL PARTIAL` så snart
første del gir reell verdi. Full dybdedekning er aldri et inngangskrav for videre apputvikling.

---

# Trinn

## Trinn 1 — Operativ grunnlov og dokumentstruktur

**Status: FINAL PASS**

CLAUDE.md og `docs/app-machine/` er bindende og lastes.

Ferdig når: alle dokumenter er i Git, imports virker, ingen konkurrerende grunnlov er aktiv.

## Trinn 2 — Produktkart, designkilde og kontraktregister

**Status: OPERATIONAL PARTIAL** (fundament godkjent; registeret kompletteres som inngang til trinn 4)

Kartlegg alle hovedsider/ruter/aktive tilstander: Clubhouse, Tee Off, Rivalry, Feed, FGL,
Profil/Settings, Scorecard, Landing.

Etabler `design/reference/`, `design/tokens/`, `design/contracts/`, `design/candidates/` og et
**kontraktregister** med status per side: `mangler | draft | approved`.

Ferdig når: hver hovedside har kjent kontraktstatus, tokens er versjonert, og Clubhouse har
godkjent kontrakt.

## Trinn 3 — Reproduserbar runtime og testgrunnmur

**Status: FINAL PASS**

Autoritativ `playwright.config.ts`, isolert testbygg (`.playwright-dist/`), blokkerte service workers,
låst dependency-graf, byggeport som feiler med exit 1 ved manglende obligatoriske runtime-filer, og
ren checkout som faktisk representerer den publiserte appen.

Ferdig når: samme commit gir samme resultat lokalt og i CI, og en ren checkout booter appen.

## Trinn 4 — Produktomfattende strukturelle kontrakter

**Status: NOT STARTED**

Leveres i fire uavhengige deler:

- **(a) Globale kontrakter** for app-shell, header og navigasjon: én header, riktig nav-rekkefølge,
  riktig aktiv fane, riktig aktiv-markering.
- **(b) Minimumskontrakt for hver hovedside/rute/aktive tilstand:** visningen laster, riktig aktiv
  fane, ingen duplikate slots, dynamiske verdier er DOM-innhold.
- **(c) Clubhouse som første dype pilot:** full komponentrekkefølge og kontraktdekning.
- **(d) Negative mutasjonstester:** feil headerasset, duplikat resume-slot eller feil kortrekkefølge
  **skal** gi rød test.

Ferdig når: (a) og (b) er grønne for alle hovedsider, (c) er dyp for Clubhouse, og hver mutasjon i
(d) fanges. **Full dybdedekning av alle sider kreves ikke før apputvikling kan fortsette.**

## Trinn 5 — Funksjonelle brukerreiser, tilstander og data-/API-kontrakter

**Status: NOT STARTED**

**Brukerreiser.** Kritiske reiser ende-til-ende: onboarding → legg til rival → start runde → score →
fullfør → resultat i Feed/Rivalry.

**Tilstandsmatrise (deterministisk).** Tom, default, aktiv runde, ingen aktiv runde, langt navn,
maks tall, manglende bilde, loading, feil.

**Data- og API-kontrakter.**

- Supabase-tabeller og forventede felter/typer
- autentisering og autorisasjon
- **bruker- og dataisolasjon** — en bruker skal aldri kunne se eller endre en annens data
- synkronisering sky ↔ lokal
- **dobbeltinnsending** — idempotens ved retry og dobbeltklikk
- **offline/online-overganger**
- **migrasjonssikkerhet** — skjemaendring bryter ikke eksisterende data

**Miljøseparasjon (bindende, jf. tverrgående regel C).**

- Skrivetester må **aldri** kjøres mot produksjons-Supabase.
- Data-/API-, isolasjons-, idempotens- og migrasjonstester bruker separat testprosjekt eller lokal
  instans med egne fixtures.
- Produksjon brukes kun til eksplisitte **read-only** smoke-kontroller.
- Manglende sikker miljøseparasjon gir **BLOCKED**.
- Testdata skal kunne identifiseres og ryddes deterministisk.

Ferdig når: hver kritisk reise og hver tilstand er deterministisk testet, og et brudd på isolasjon,
idempotens eller feltkontrakt gir rød test.

## Trinn 6 — Layout, tilgjengelighet og interaksjonsinvariants

**Status: NOT STARTED**

**Layout.** Ingen utilsiktet horisontal overflow; scroll-policy per rute; forbud mot `scale()`/`zoom`
på root/app/dashboard; gutters, bounds, gaps, overlap, clipping, bilde-aspekt.

**Tilgjengelighet.** Minimum lesbar font; minimum touch-target; fokus-synlighet; tastaturnavigasjon;
tilgjengelige navn på interaktive elementer; kontrast.

**Interaksjon.** Tap/klikk treffer faktisk riktig mål; ingen usynlige overlays som stjeler trykk.

Ferdig når: «hele dashboardet ble presset inn på skjermen» eller uleselig tekst gir rød test — uten
visuell diff.

## Trinn 7 — Visuell regresjon og design fidelity

**Status: NOT STARTED**

Start med **globale komponenter** — header, nav, kort-grid, hero/record — på 390×844 i Chromium og
WebKit. Deretter **risikobasert sidedekning**: sider med høyest endringsfrekvens og visuell risiko
får full-side-baseline. Dekningsvalget per side dokumenteres eksplisitt i kontraktregisteret, slik at
«ikke dekket» er en synlig, godkjent beslutning.

Implementer kan ikke oppdatere snapshots. Expected/actual/diff lagres. Baseline genereres i låst miljø.

Ferdig når: feil header eller kraftig miniatyrisering gir tydelig diff og FAIL.

## Trinn 8 — Ikke-funksjonelle kvalitetsporter

**Status: NOT STARTED**

- **Ytelsesbudsjetter** — bundle-/asset-størrelse, første render, interaksjonsforsinkelse på mobil
- **Sikkerhet og secrets** — ingen private nøkler i repo eller bundle; RLS faktisk aktiv
- **Personvern** — ingen persondata i URL, query eller logg; samtykke håndtert
- **Feil- og nettverkshåndtering** — timeout, 4xx/5xx og tapt tilkobling gir forståelig tilstand, ikke hvit skjerm
- **PWA/offline-robusthet** — service worker kan oppdateres uten å låse brukeren i gammel cache
- **JavaScript-/runtime-feil** — null console-errors og null uncaught exceptions i alle hovedflyter
- **Database- og migrasjonsrisiko** — destruktiv migrasjon blokkeres

Ytelsesbudsjetter innføres først som **rapporterende** terskler, og gjøres blokkerende når målingene
er stabile.

Ferdig når: et budsjettbrudd, en lekket hemmelighet eller en uncaught runtime-feil gir rød port.

## Trinn 9 — CI som autoritet

**Status: NOT STARTED**

`npm ci`, låst Node, Playwright install with deps, workers 1, alle obligatoriske porter, artefakter
lastes opp, required check og branch protection, ingen automatisk snapshot-oppdatering.

Ferdig når: rød CI ikke kan overstyres av «det virker hos meg».

## Trinn 10 — Real-device- og PWA-bevis

**Status: NOT STARTED** (manuell sjekkliste aktiv fra og med trinn 4)

Manuell sjekkliste for enhver **større UI-endring**, aktiv allerede fra trinn 4:

- Samsung Android Chrome
- Samsung installert PWA
- iPhone Safari
- iPhone installert PWA

Dette trinnet formaliserer sjekklisten, krever bevis (skjermbilder/notat) i bevispakken, og vurderer
automatisering via real-device-tjeneste senere dersom kostnad og behov forsvarer det.

Ferdig når: større UI-releaser ikke godkjennes utelukkende fra headless emulering.

## Trinn 11 — Hash-bundet release-gate

**Status: NOT STARTED**

Release-gaten skal:

- beregne hash av relevante kildefiler og assets
- kjøre alle obligatoriske porter
- lagre rapport, screenshots, diffs og traces under en mappe knyttet til samme hash
- skrive en maskinlesbar PASS-fil
- nekte å lage endelig deploypakke ved hash-mismatch, manglende test eller FAIL

Direkte manuell zip av en uprøvd `dist/` er en ugyldig release.

Ferdig når: det ikke går an å lage en gyldig deploypakke etter en utestet endring.

## Trinn 12 — Enforcement hooks og baselinebeskyttelse

**Status: NOT STARTED**

`.claude/settings.json` + scripts for:

- instructions-loaded-check
- UI-dirty-marker
- rask validering etter edits
- **skrivesperre mot godkjente referanser og golden snapshots**
- stop-time bevissjekk med loop guard
- **build/deploy-sperre**

Innføres i denne rekkefølgen: først varsling, så blokkering av baseline-skriving, sist
build/deploy-sperren (viktigst).

Ferdig når: kritiske regler ikke kan omgås ved å «glemme» MD-en, og baselines ikke kan overskrives
av implementerende agent.

## Trinn 13 — Gjenbrukbare skills

**Status: NOT STARTED**

`product-decision`, `screen-contract`, `implement-ui-contract`, `visual-fidelity-review`,
`mobile-adversarial-qa`, `release-gate`. Korte, presise triggere; peker til scripts/templates fremfor
å duplisere systemet.

Ferdig når: samme oppgavetype følger samme workflow uten at Mathias limer inn instrukser på nytt.

## Trinn 14 — Uavhengige read-only reviewers

**Status: NOT STARTED**

Product Director, Design Fidelity Reviewer, Mobile QA Reviewer, End-user/Growth Reviewer,
Release Gate. Reviewers er **read-only** og får referanser, kontrakt og bevis som input.

Ferdig når: implementerens egen vurdering ikke er eneste godkjenning.

## Trinn 15 — Produksjonsverifisering, overvåking og rollback

**Status: NOT STARTED**

**Verifisering.**

- **Build-ID** eksponert i artefakten
- **Smoke etter deploy** mot faktisk produksjon (read-only)
- **Bekreftelse på riktig publisert commit** — hash i bygget = hash i Git
- **Helsesjekk** — appen booter, kritiske avhengigheter svarer
- **Feilrapportering** — runtime-feil fra ekte brukere fanges

**Rollback — app og data behandles separat.**

- **App-rollback** og **database-/migrasjonsberedskap** er to forskjellige planer.
- En tidligere appversjon kan **ikke** automatisk rulles tilbake dersom den er inkompatibel med
  gjeldende databaseskjema.
- Migrasjoner skal være **fremoverkompatible** der det er mulig.
- **Destruktiv automatisk databasesenkning er forbudt.**
- Rollback-planen skal beskrive hvordan **nye data beskyttes** ved tilbakerulling av app.
- Rollback skal være dokumentert og testet minst én gang.

**Observability.** Produksjonslogging og overvåking skal **ikke lekke persondata, tokens eller andre
hemmeligheter**.

Ferdig når: en dårlig deploy oppdages, og app kan rulles tilbake uten gjetting og uten datatap.

## Trinn 16 — Adversariell evaluering av App-maskinen

**Status: NOT STARTED**

Injiser bevisste feil og bekreft at **riktig** gate fanger hver enkelt:

- feil headerasset
- grønn aktiv markering der referansen er gull
- root `transform:scale(.8)`
- duplikat resume-banner
- feil kortrekkefølge
- horisontal overflow
- uleselig 8 px tekst
- manglende obligatorisk runtime-fil i ren checkout
- lekket hemmelighet i bundle
- brutt bruker-/dataisolasjon

Ferdig når: App-maskinen er testet mot feilene den er laget for å stoppe.

---

# Utenfor kvalitetsplanen: Cowork-plugin (valgfri)

Pakking og distribusjon av stabile skills, reviewers, templates og eventuelle connectors.

Dette er **ikke** et nummerert trinn og **ikke** en kvalitetsgate. Kan gjøres når trinn 13 og 14 er
stabile. Deterministiske testscripts, CI og release-gate blir liggende i repositoryet uansett.

Ferdig når: en ny Cowork-session får samme roller og workflows etter installasjon.

---

# Slik unngår planen å forsinke idéarbeid

- **Utforskning krever ingen port.** Prototyper og alternative retninger kan lages fritt, så lenge de
  holdes i egen branch/worktree eller `design/candidates/` og ikke rører approved-baselines eller deploy.
- **Implementering er scoped.** Endrer du Feed, må Feed-kontrakten og de testsettene manifestet krever
  være grønne — ikke hele portsettet for hele appen.
- **Trinn 4 leveres i deler.** Globale kontrakter (a) og minimumskontrakt per side (b) er billige og
  kommer først. Dyp dekning kommer per side etter hvert som sidene faktisk endres.
- **Tunge porter slår først inn i release**, der kostnaden hører hjemme.
