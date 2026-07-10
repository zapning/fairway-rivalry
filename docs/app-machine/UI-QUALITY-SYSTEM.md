# Fairway Rivalry — UI quality system

Denne filen definerer den langsiktige app-maskinen som skal hindre at en teknisk «bestått» endring fortsatt er visuelt feil.

## 1. Problemet systemet skal løse

Følgende feil kan passere en enkel overflow-test:

- hele dashboardet er skalert ned til uleselig størrelse
- feil header er bygget, men holder seg innenfor viewport
- komponentrekkefølge eller spacing er feil
- to like bannere vises samtidig
- referansebilder er brukt med feil proporsjon
- alt innhold presses inn over bretten selv om siden skulle scrolle vertikalt
- typografi og ikoner avviker kraftig fra godkjent design
- en screenshot-fil finnes, men ingen har faktisk sammenlignet den med referansen

Derfor skal kvalitet avgjøres av flere uavhengige lag, ikke av én måling eller én agent.

## 2. Prinsipp: AI foreslår, maskinen avgjør

- `CLAUDE.md`, rules, skills og agents styrer arbeidsmåte og vurdering.
- Deterministiske scripts, Playwright, CI og release-gate avgjør om en build kan pakkes/deployes.
- Agentens egen tekstlige påstand har ingen release-verdi.
- Implementerende agent kan ikke oppdatere godkjent visuell baseline som del av samme oppgave.

## 3. Kildene til visuell sannhet

For hver skjerm skal følgende eksistere:

```text
design/
  reference/
    clubhouse/
      approved-clubhouse-390x844.png
      approved-header-390x844.png
      approved-card-grid-390x844.png
  contracts/
    clubhouse.contract.json
  tokens/
    fairway.tokens.json
```

### Godkjent referanse

- Referansen er fasit for helhetsuttrykk og proporsjoner.
- Referansen skal være eksplisitt merket `approved`.
- En mockup som kun er inspirasjon skal merkes `concept`, ikke brukes som golden baseline.
- Referanser skal ha kjent viewport, crop og tilstand.

### Screen contract

Kontrakten oversetter bildet til testbare krav, slik at agenten ikke må gjette.

### Design tokens

Tokens skal definere blant annet:

- app-shell max-width
- sidegutter per viewportgruppe
- headerhøyde og intern spacing
- radius, gullfarger og transparens
- typografisk skala
- minimum touch target
- standard grid-gap

## 4. UI-task lifecycle

### Fase A — forstå og kontrakt

1. Product Director analyserer brukerens mål.
2. Eksisterende route, kode, screenshots og referanser inspiseres.
3. Scroll-policy fastsettes.
4. Screen contract opprettes eller oppdateres.
5. Akseptansekriterier genereres i både menneskelig og maskinlesbar form.
6. Ved vesentlig designendring godkjenner Mathias retningen før kode endres.

### Fase B — implementering

1. Lag Git-branch/worktree eller commit baseline.
2. Implementer med eksisterende design tokens og delte komponenter.
3. Ikke bruk global scaling, zoom eller overflow-hiding som workaround.
4. Bruk deterministiske testdata.
5. Kjør fast feedback-test etter relevante filer er endret.

### Fase C — automatisert kontroll

Kjør gates 1–8 nedenfor.

### Fase D — uavhengig kontroll

Design Fidelity Reviewer og Mobile QA Reviewer kontrollerer resultatene uten å redigere koden eller baseline.

### Fase E — gated release

Release Gate verifiserer at alle bevis gjelder samme kildekode-hash og tillater først da build/zip.

## 5. Gate 1 — fil- og kodeintegritet

Må bestå:

- Git working tree/baseline er kjent.
- Store filer er ikke trunkert.
- `node --check app.js` ved JS-endring.
- Lint/typecheck/build etter prosjektets scripts.
- Ingen NUL-bytes eller uventet filstørrelsesfall.
- Asset-stier finnes og bilder kan dekodes.

## 6. Gate 2 — strukturell DOM-kontrakt

Test det som kan være riktig selv om pikslene varierer:

- nøyaktig én header
- nøyaktig én aktiv navigasjonsfane
- korrekt nav-rekkefølge
- korrekt route/selected state
- nøyaktig antall hovedbokser
- korrekt komponentrekkefølge
- ingen duplikate «resume/round in progress»-komponenter med mindre kontrakten krever det
- dynamiske verdier ligger som DOM-tekst, ikke bakt inn i bilde
- obligatoriske landmarks/ARIA-navn finnes

Testene skal bruke stabile `data-testid` eller semantiske locators, ikke skjøre CSS-selektorer.

## 7. Gate 3 — layout invariants

For hver viewport og relevant komponent måles bounding boxes.

Eksempler:

- documentets `scrollWidth <= clientWidth + 1`, unntatt navngitte horisontale komponenter
- app shell begynner og slutter innenfor viewport
- header fyller kontraktens bredde og har riktig høydeintervall
- hovedinnhold har sidegutter innenfor definert toleranse
- ingen elementer overlapper uten at kontrakten sier det
- ingen tekst klippes
- ingen root/app/dashboard har `transform` med scale eller CSS `zoom != 1`
- fontstørrelser er over kontraktens minimum
- touch targets følger kontraktens minimum
- bilder har korrekt aspect ratio og `object-fit`
- fixed/sticky-elementer dekker ikke innhold eller safe area

### Scroll-policy assertions

`vertical-content`:

- vertikal scrolling er tillatt og forventet når innholdet er høyere enn viewport
- innholdet skal beholde lesbar størrelse
- ingen root scaling
- sticky header/nav skal ikke skjule første eller siste innhold

`single-screen`:

- nødvendig innhold passer i tilgjengelig `dvh`
- ingen vertikal dokument-scroll
- dette oppnås gjennom responsiv layout, ikke global scaling eller uleselig typografi

`component-horizontal`:

- bare navngitt komponent kan ha `scrollWidth > clientWidth`
- `html`, `body` og app-shell må fortsatt holde seg innenfor viewport

## 8. Gate 4 — komponentbasert visuell regresjon

Fullside-screenshot er ikke nok. Test separat:

- header
- aktiv navigasjonsfane
- hero/record-card
- challenge/resume-bar
- hver card-type eller representativ card-grid
- bottom navigation dersom den finnes

Bruk `expect(locator).toHaveScreenshot()` eller tilsvarende.

Krav:

- animasjoner og transitions deaktiveres under screenshot
- caret skjules
- tid, dato, tilfeldig innhold og nettverksdata fryses eller fixtures brukes
- fonts og bilder er ferdig lastet
- volatile data maskeres bare dersom det ikke påvirker layout
- spacing, størrelse, typografi, ikoner og bakgrunn skal aldri maskeres
- diff-toleranse skal være streng og begrunnet per komponent

Headeren skal ha en egen golden snapshot. En fullside-diff kan ellers undervurdere en stor headerfeil fordi headeren utgjør få prosent av hele siden.

## 9. Gate 5 — fullside visuell regresjon

For hver godkjent state og hovedviewport:

- ta expected/actual/diff
- bruk samme OS/container, browser-versjon, fonts og screenshot-scale som baseline
- skill snapshots per Playwright-project/browser
- test både toppen av siden og fullPage for vertikale innholdssider
- test viewport screenshot for single-screen-sider

For lange sider skal minst disse snapshots finnes:

1. viewport top
2. viewport midt eller kritisk section
3. viewport bottom
4. fullPage som sekundær oversikt

Dette hindrer at hele dashboardet miniatyriseres og likevel ser «komplett» ut i et fullPage-bilde.

## 10. Gate 6 — browser- og mobilmatrise

Fast matrise:

- Chromium: 320×568, 360×800, 390×844, 412×915, 430×932
- WebKit: 375×667, 390×844, 430×932

I tillegg:

- minst én PWA/standalone-test
- minst én browser-mode-test med dynamisk adresse-/verktøylinje
- light/dark bare dersom appen støtter begge
- touch enabled
- device scale factor og user agent fra relevante Playwright device profiles der det gir verdi

Det er ikke nødvendig å visual-regression-teste alle kombinasjoner mot samme pixelbaseline. Bruk:

- et mindre antall autoritative golden projects
- full invariant/functional matrix på alle prosjekter
- representative screenshots fra alle prosjekter

## 11. Gate 7 — data- og tilstandsmatrise

Minst disse tilstandene skal vurderes per relevant skjerm:

- normal data
- ingen data
- lange navn
- store og små tall
- manglende bilde
- loading
- nettverksfeil
- offline/PWA dersom relevant
- aktiv runde
- ingen aktiv runde
- én rival
- mange rivaler
- tastatur åpent på skjema

Fixtures skal være deterministiske og navngitte.

## 12. Gate 8 — tilgjengelighet og interaksjon

Kontroller:

- tastatur-/fokusflyt der relevant
- semantiske knapper og lenker
- labels og accessible names
- kontrast for kritisk tekst og handlinger
- touch targets
- reduced motion
- dialoger og menyer holder fokus riktig
- back navigation og refresh bevarer forventet state

Tilgjengelighetstester erstatter ikke visuell kontroll, men inngår i samme releasebevis.

## 13. Uavhengige agents

### Product Director

Ansvar:

- identifisere målet bak forespørselen
- utfordre svak løsning
- velge én anbefalt retning
- skrive akseptansekriterier

Rettigheter:

- read-only i kodefasen
- kan opprette/foreslå screen contract
- kan ikke erklære release PASS

### Implementer

Ansvar:

- implementere godkjent contract
- skrive/oppdatere tester
- produsere candidate screenshots

Begrensning:

- kan ikke endre approved references eller golden snapshots
- kan ikke godkjenne eget arbeid

### Design Fidelity Reviewer

Ansvar:

- sammenligne approved reference, contract og actual screenshots
- vurdere header, hierarki, proporsjoner, spacing, typografi, transparens og bilder
- rapportere konkrete avvik rangert etter alvorlighet

Begrensning:

- read-only
- ingen kodeendringer
- ingen baselineoppdatering

### Mobile QA Reviewer

Ansvar:

- bryte layouten med viewport- og datatilstander
- kontrollere scroll-policy, overflow, safe areas, tastatur og PWA-state
- validere at tester faktisk ville fanget feilen

Begrensning:

- read-only under godkjenningsfasen

### Growth/End-user Reviewer

Ansvar:

- vurdere forståelse, prioritering, motivasjon og unødvendig friksjon
- sikre at skjermen fungerer som produkt, ikke bare som bilde

Brukes ved nye eller vesentlig endrede flows, ikke nødvendigvis ved små CSS-fikser.

### Release Gate

Ansvar:

- lese maskinresultater og review-rapporter
- kontrollere kildekode-hash
- avvise hvis noe mangler

Begrensning:

- skal ikke reparere kode
- skal ikke tolke rødt som «nesten godt nok»

## 14. Skills

Følgende skills skal bygges:

### `product-decision`

Trigger: ny funksjon, større UI-endring eller uklar produktretning.

Resultat:

- goal
- strongest recommendation
- rejected alternatives
- risks
- acceptance criteria

### `screen-contract`

Trigger: enhver ny eller vesentlig endret skjerm.

Resultat:

- ferdig contract basert på template
- referanser og teststates
- maskinlesbare invariants

### `implement-ui-contract`

Trigger: godkjent screen contract.

Resultat:

- implementering uten baselineendring
- tests
- candidate screenshots

### `visual-fidelity-review`

Trigger: candidate screenshots finnes.

Resultat:

- read-only diff-review
- PASS/FAIL per komponent
- ingen kodeendringer

### `mobile-adversarial-qa`

Trigger: UI-kandidat før release.

Resultat:

- matrix results
- edge-case failures
- regression risks

### `release-gate`

Trigger: oppgaven hevdes ferdig eller deploypakke skal bygges.

Resultat:

- maskinlesbar gate status
- artifact index
- source hash
- eksplisitt PASS eller FAIL

## 15. Hooks og eksterne sperrer

Instruksjoner er rådgivende. Kritiske regler må håndheves utenfor modellen.

### SessionStart / InstructionsLoaded

Kontroller:

- at root `CLAUDE.md` og imports er lastet
- at prosjektrot er korrekt
- at nødvendig Node/Playwright-versjon finnes
- at aktuell route har screen contract ved UI-oppgave

### PostToolUse etter UI-filendring

- sett `UI_DIRTY=1` eller skriv en dirty-marker
- kjør raske syntax-/lint-/contract-tester
- ikke kjør hele visuell suite etter hvert tastetrykk

### PreToolUse for baselinefiler

Blokker direkte endring av:

- `design/reference/**/approved-*`
- Playwright golden snapshots
- release PASS-filer

Unntak krever en separat eksplisitt baseline-approval-workflow.

### Stop hook

Når UI er dirty:

- kontroller om gyldig gatebevis finnes for gjeldende hash
- dersom ikke, gi Claude tydelig beskjed om manglende steg
- bruk guard mot gjentatte stop-loop

Stop hook alene er ikke nok, fordi den kjører ved hver respons. Den viktigste sperren skal ligge i build/deployscriptet.

### Gated build/deploy

`build-dist.sh` eller ny `release.mjs` skal nekte å lage final zip uten:

- `test/evidence/<SOURCE_HASH>/gate.json`
- `status: PASS`
- identisk current source hash
- alle obligatoriske artifacts listet og eksisterende

## 16. Bevispakke

For hver releasekandidat:

```text
test/evidence/<source-hash>/
  gate.json
  summary.md
  contracts-used.json
  expected/
  actual/
  diff/
  traces/
  reports/
  reviewers/
    design-fidelity.md
    mobile-qa.md
```

`gate.json` skal minst inneholde:

- source hash
- build id
- timestamp
- routes/states testet
- browsers/viewports testet
- functional status
- layout status
- visual status
- reviewer status
- missing checks
- final PASS/FAIL

## 17. CI

GitHub Actions eller tilsvarende skal være den autoritative testmaskinen:

- låst Node-versjon
- låst Playwright-versjon
- installerte browser binaries/dependencies
- `workers: 1` for stabil visuell kjøring
- samme container/OS for baselines
- artifact upload av report, actual og diff ved både pass og fail
- ingen automatisk snapshot update i CI
- pull request/check må være grønn før releasepakke kan godkjennes

Lokale tester er rask feedback. CI er autoritativt releasebevis.

## 18. Produksjonsverifisering

Etter faktisk deploy:

1. Åpne cache-bustet URL.
2. Verifiser build-ID og asset-stempel.
3. Verifiser route/state med deterministic testkonto eller testmode.
4. Ta actual screenshots på produksjon.
5. Kjør et begrenset production smoke-sett.
6. Sammenlign kritiske komponenter, spesielt header og første viewport.
7. Rapporter eventuelle forskjeller mellom lokal/CI og produksjon.

Produksjonsverifisering skal ikke brukes til å oppdage grunnleggende layoutfeil som kunne vært stoppet før deploy.

## 19. Reelle enheter

Emulering er nødvendig, men ikke tilstrekkelig for topp kvalitet.

For større UI-releaser:

- Android Chrome på Mathias’ Samsung i browser og installert PWA
- iOS Safari/PWA på iPhone 13 Pro eller tilgjengelig iPhone
- kontroller dynamisk browser chrome, safe areas, font rendering, touch og tastatur

Automatisering via real-device cloud kan innføres senere. Inntil da skal en kort manuell device-smoke være eksplisitt gate for større UI-releaser.

## 20. Baselineoppdatering

Snapshots/referanser kan oppdateres bare når:

1. endringen er tilsiktet
2. Product Director har dokumentert hvorfor
3. candidate/diff er presentert
4. Mathias eller autorisert designreviewer har godkjent
5. baselineoppdateringen skjer i en separat commit fra implementeringen

Kommandoen `--update-snapshots` skal aldri kjøres som automatisk «fix» for en rød test.

## 21. Hva som aldri er godt nok

Følgende formuleringer er ikke bevis:

- «Ser bra ut»
- «Ingen overflow»
- «Testen passerte» uten rapport
- «Mobiltilpasset» uten matrisen
- «Matcher referansen» uten expected/actual/diff
- «Ferdig» uten samme source hash i gate og build
- «Bare cache» uten build-ID-verifisering


## 22. Globale app-invarianter (gjelder ALLE sider — permanente regler)

Disse er permanente og gjelder hele appen, ikke bare Clubhouse. En enkelt side skal aldri definere disse for hele appen.

- **Header:** testes separat mot godkjent header-referanse på hver side (egen golden snapshot), ikke bare som del av et fullside-bilde. Aktiv fane i gull + gull-understrek; ingen grønn aktiv-markering; header transparent når referansen krever det.
- **Mobilbredde (permanent global regel):** appen skal ALLTID passe tilgjengelig mobilbredde uten horisontal scroll. **Eksakt app-shell maks-bredde er IKKE fastsatt permanent** — dagens `min(100vw, 430px)` er merket *existing implementation / provisional / pending product approval* (se `design/tokens/fairway.tokens.json` → `appShell.maxWidth_css_px`). Fremtidige sider skal ikke låses til 430 px.
- **Safe-area + dynamisk viewport:** bruk `env(safe-area-inset-*)` og `dvh` (ikke `vh`). Nettleserens adresselinje, systemfelt eller notch skal ALDRI kutte innhold eller skape overlapp.
- **Horisontal scroll er ALDRI tillatt** på noen side: `document.scrollWidth <= clientWidth + 1`, og ingen enkeltelement stikker utenfor viewport-bredden. Bevisst horisontal scroll er kun tillatt inne i en navngitt komponent (karusell) når en testprofil sier det eksplisitt.
- **Ingen helsideskalering:** `transform: scale(...)`, `zoom` eller global CSS-transform på root/app/side/dashboard er forbudt for å «presse inn» layout.
- **Visuell testing er påkrevd** for hver side: komponent-snapshots (minst header) + fullside/viewport-snapshots, i tillegg til strukturelle og layout-invariante tester. En grønn overflow-test alene godkjenner aldri en side.
- **Sidespesifikke krav** dokumenteres som korte **testprofiler** i `docs/app-machine/PAGE-TEST-PROFILES.md` — ikke som ferdige produkt-/designkontrakter. En full screen contract (mal + godkjent referanse) kreves bare når en side skal gjennom en vesentlig designendring.

> **PÅKREVD LESING:** ved enhver UI-, test- eller release-oppgave skal `docs/app-machine/PAGE-TEST-PROFILES.md` leses sammen med denne fila. Den er en obligatorisk del av lesekjeden (jf. `CLAUDE.md` §0).
