# Sidespesifikke testprofiler

Korte, maskin-testbare profiler per hovedside. **Dette er ikke** ferdige produkt- eller designkontrakter
(en full screen contract lages kun ved vesentlig designendring, jf. `SCREEN-CONTRACT-TEMPLATE.md`).
Globale regler (header, mobilbredde, safe-area, ingen horisontal scroll, visuell testing) gjelder ALLE
sider og står i `UI-QUALITY-SYSTEM.md` §22 — de gjentas ikke her.

Scroll-policy-verdier: `single-screen` | `vertical-content` | `component-horizontal` (adaptiv der angitt).

> **Omfang:** dette er KUN testprofiler + produktfakta. De skal **ikke** føre til at sider bygges, redesignes eller får antatt funksjonalitet.
>
> **Obligatorisk lesing:** denne fila er en fast del av lesekjeden — skal leses ved enhver UI-, test- eller release-oppgave (jf. `CLAUDE.md` §0 og `UI-QUALITY-SYSTEM.md` §22).

---

## Clubhouse (`/clubhouse`)
- **Rolle:** én av flere hovedsider — definerer IKKE reglene for hele appen.
- **Egen kontrakt beholdes separat:** `design/contracts/clubhouse-default.md` (DRAFT).
- **Scroll-policy:** adaptiv (RESOLVED beslutning #1) — `single-screen` som mål på 390×844/412×915/PWA uten skalering, ellers `vertical-content`.
- **Test:** dekkes av egen kontrakt; ikke dupliser her.

## Tee Off (`/tee-off`)
Flyt i tre steg. Testes per steg:
- **Set up:** `single-screen` — alt nødvendig innhold i tilgjengelig `dvh` uten vertikal dokument-scroll.
- **Course:** `single-screen` — samme.
- **Scorecard:** `vertical-content` — vertikal scroll tillatt, men **skal ALLTID passe i bredden uten horisontal scroll**.
- **Adaptiv 1–4 spillere:** layout, spillerkolonner, navn, tekst og scorefelt skal tilpasse seg antall spillere.
  - 1 spiller: større og luftigere.
  - 4 spillere: mer kompakt, men fortsatt lesbart (≥ tokens min) og trykkbart (≥ 44 px touch target).
- **Slik testes det senere:**
  - **Set up og Course: single-screen, testes minst på 390×844 OG 412×915.** Godkjenning krever ALLE:
    - ingen nødvendig vertikal scroll (`scrollHeight <= clientHeight`),
    - ingen kuttet tekst eller kontroller,
    - ingen overlap mellom elementer,
    - riktig safe-area (`env(...)`, `dvh`; systemfelt/adresselinje kutter ikke innhold),
    - **visuelt screenshot-bevis** (expected/actual) per viewport.
    - `scrollHeight <= clientHeight` ALENE er IKKE tilstrekkelig — de øvrige kravene + screenshot må også bestå. Ingen root-skalering.
  - Scorecard: `scrollWidth <= clientWidth + 1` for ALLE spillerantall 1/2/3/4 (fixtures per antall); komponent-snapshot per spillerantall; verifiser at fontstørrelse ≥ min og touch target ≥ 44 px ved 4 spillere.

## Rivalry (`/rivalry`)
- **Scroll-policy:** `vertical-content` — vertikal scroll tillatt, horisontal **forbudt**.
- **Bakgrunn bak boksene skal være HELT transparent** — ingen svarte/mørke overlay-lag.
- **Slik testes det senere:**
  - `scrollWidth <= clientWidth + 1`.
  - For rivalry-kortene + deres foreldreelementer + `::before`/`::after`: hent `background-color`/`background-image` via `getComputedStyle` og assert at det ikke finnes ugjennomsiktige svarte/mørke fyll-lag bak boksene (alpha ≈ 0 / `transparent`).
  - Fullside + komponent-snapshot.

## FGL (`/fgl`)
- **Status:** foreløpig kun bilde/placeholder — **ikke bygg mer funksjonalitet**.
- **Test kun:** skalering, proporsjoner, bredde, header, safe-area og fravær av horisontal scroll.
- **Slik testes det senere:**
  - `scrollWidth <= clientWidth + 1`; bildet holder proporsjoner (`object-fit`/aspect), ingen strekk/forvrengning; header + safe-area korrekt; ingen funksjonelle assertions kreves ennå.
