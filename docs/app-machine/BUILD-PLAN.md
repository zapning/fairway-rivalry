# Fairway Rivalry — byggeplan for app-maskinen

Dette er anbefalt rekkefølge. Ikke hopp direkte til mange agents før test- og kontraktsgrunnlaget finnes. Flere agents uten objektive kvalitetsporter gir bare flere meninger, ikke høyere sikkerhet.

## Målarkitektur

```text
Brukerønske
  ↓
Product decision
  ↓
Approved screen contract + references
  ↓
Implementer
  ↓
Fast tests
  ↓
Functional + layout matrix
  ↓
Component + full visual regression
  ↓
Independent design/mobile review
  ↓
Hash-bound release gate
  ↓
Deploy package
  ↓
Production smoke + real-device smoke
```

## Prinsipp for rekkefølge

Den beste rekkefølgen er:

1. Kilde til sannhet
2. Maskinlesbare kontrakter
3. Deterministiske tester
4. Release-sperre
5. Skills
6. Agents
7. Plugin/pakking
8. Real-device automation

Å starte med agents eller store prompts alene vil ikke hindre samme feil på nytt.

## Trinn 1 — installer MD-strukturen

Plasser:

```text
CLAUDE.md
docs/app-machine/PROJECT-FACTS.md
docs/app-machine/UI-QUALITY-SYSTEM.md
docs/app-machine/SCREEN-CONTRACT-TEMPLATE.md
docs/app-machine/BUILD-PLAN.md
```

Kontroller i Claude Code med `/memory` eller tilsvarende at rootfilen og imports faktisk lastes.

Ferdig når:

- alle filer er i Git
- imports virker
- ingen gammel konfliktende CLAUDE.md er aktiv

## Trinn 2 — opprett design source of truth

Opprett:

```text
design/reference/
design/contracts/
design/tokens/
design/candidates/
```

For Clubhouse og header:

- legg inn de faktisk godkjente referansebildene
- navngi viewport og state
- skill `approved` fra `concept`
- opprett første screen contract

Ferdig når en annen utvikler kan forklare header og layout uten å gjette fra en chatmelding.

## Trinn 3 — refaktorer testkonfigurasjonen

Opprett/oppdater:

```text
playwright.config.ts
tests/ui/contracts/
tests/ui/layout/
tests/ui/visual/
tests/ui/fixtures/
tests/ui/helpers/
```

Krav:

- `webServer` starter lokal `dist/`
- projects for Chromium/WebKit og representative devices
- låste testdata
- screenshot stability: fonts/images ready, animations disabled
- trace on first retry/failure
- workers 1 i CI
- HTML/JSON reporter

Ferdig når samme commit gir samme resultat på gjentatte CI-kjøringer.

## Trinn 4 — bygg strukturelle contract-tests

Start med header og Clubhouse:

- én header
- korrekt nav-rekkefølge
- korrekt aktiv fane
- korrekt antall og rekkefølge på dashboardkomponenter
- ingen dupliserte resume/challenge-slots
- dynamiske verdier er DOM-innhold

Ferdig når en feil headerstruktur eller duplikatkomponent gir rød test før screenshot review.

## Trinn 5 — bygg layout-invariant-tests

Test:

- no document horizontal overflow
- scroll-policy per route
- no `scale()`/`zoom` på root/app/dashboard
- gutters, header bounds, card width og gaps
- overlap og clipping
- font- og touch-minimum
- image aspect ratio

Ferdig når «hele dashboardet ble presset inn på skjermen» gir rød test selv uten visual diff.

## Trinn 6 — bygg visual regression

Start med autoritative baselines for:

- header component ved 390×844 Chromium og WebKit
- Clubhouse first viewport ved 390×844
- hero/record card
- challenge/resume slot
- card grid

Deretter legg til 320 og 430 for kritiske komponenter.

Regler:

- implementer kan ikke oppdatere snapshots
- expected/actual/diff lagres
- baseline genereres i CI-miljø
- ingen bred maskering

Ferdig når feil header eller kraftig miniatyrisering produserer tydelig diff og FAIL.

## Trinn 7 — bygg hash-bound release gate

Lag for eksempel:

```text
scripts/source-hash.mjs
scripts/run-release-gate.mjs
scripts/build-release.mjs
```

`run-release-gate.mjs`:

1. beregner source hash
2. kjører alle obligatoriske gates
3. samler artifacts
4. skriver `test/evidence/<hash>/gate.json`

`build-release.mjs`:

1. beregner source hash på nytt
2. leser gate.json
3. avviser ved hash mismatch eller FAIL
4. bygger/cache-buster
5. lager final zip

Ferdig når det ikke går an å lage en gyldig deploypakke etter en utestet CSS/JS-endring.

## Trinn 8 — CI som autoritet

Oppdater GitHub Actions:

- npm ci
- Playwright install with deps
- tests med workers 1
- upload report/evidence/diffs
- branch protection/check required
- ingen automatic snapshot update

Ferdig når lokal «det fungerer hos meg» ikke kan overstyre rød CI.

## Trinn 9 — bygg skills

Opprett:

```text
.claude/skills/product-decision/SKILL.md
.claude/skills/screen-contract/SKILL.md
.claude/skills/implement-ui-contract/SKILL.md
.claude/skills/visual-fidelity-review/SKILL.md
.claude/skills/mobile-adversarial-qa/SKILL.md
.claude/skills/release-gate/SKILL.md
```

Skills skal være korte, ha presis triggerbeskrivelse og peke til scripts/templates fremfor å duplisere hele systemet.

Ferdig når samme type oppgave følger samme workflow uten at Mathias limer inn instrukser på nytt.

## Trinn 10 — bygg read-only agents

Opprett:

```text
.claude/agents/product-director.md
.claude/agents/design-fidelity-reviewer.md
.claude/agents/mobile-qa-reviewer.md
.claude/agents/end-user-growth-reviewer.md
.claude/agents/release-gate.md
```

Implementer kan bruke normale kodeverktøy. Reviewers skal være read-only og få referanser, contract og evidence som input.

Ferdig når implementerens egen vurdering ikke er eneste godkjenning.

## Trinn 11 — hooks

Opprett `.claude/settings.json` og scripts for:

- instructions loaded check
- UI dirty marker
- fast validation after edits
- block writes to approved references/golden snapshots
- stop-time evidence check med loop guard
- block ungated build/deploy

Viktig: build/deploy-sperren er viktigere enn Stop hook.

Ferdig når modellen ikke kan omgå kritiske regler ved å «glemme» MD-en.

## Trinn 12 — Cowork plugin

Når workflows, skills og agents er stabile, pakk dem i én Fairway Rivalry-plugin for Cowork.

Pluginen bør inneholde:

- skills
- subagents
- eventuelle connectors
- templates/resources

Deterministiske testscripts og CI blir fortsatt liggende i repository. Pluginen er distribusjon og arbeidsflyt, ikke release-gate.

Ferdig når en ny Cowork-session får samme roller og workflows etter installasjon.

## Trinn 13 — real-device gate

Først manuell sjekkliste på:

- Samsung Android Chrome browser
- Samsung installert PWA
- iPhone Safari
- iPhone installert PWA

Senere kan dette automatiseres med en real-device-tjeneste dersom kostnad og behov forsvarer det.

Ferdig når større UI-releaser ikke godkjennes utelukkende fra headless emulering.

## Trinn 14 — evaluer selve app-maskinen

Lag regresjonsoppgaver som med vilje introduserer:

- feil headerasset
- grønn aktiv markering
- root `transform:scale(.8)`
- duplikat resume-banner
- feil card-rekkefølge
- horisontal overflow
- uleselig 8 px tekst

Kjør systemet og bekreft at riktig gate fanger hver feil.

Ferdig når app-maskinen er testet mot feilene den er laget for å stoppe.

## Første anbefalte implementeringsoppgave

Start ikke med agents. Start med:

1. godkjent Clubhouse/header-referanse i `design/reference/`
2. Clubhouse screen contract
3. strukturelle og layout-invariant-tests for header + Clubhouse
4. først deretter visual regression

Dette gir størst reduksjon i feil per arbeidstime og ville ha fanget både feil header og miniatyrisert dashboard.

