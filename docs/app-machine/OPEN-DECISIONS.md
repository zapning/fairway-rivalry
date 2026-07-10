# Åpne prosjektbeslutninger

Register over beslutninger som må tas av Mathias før berørt arbeid kan godkjennes.
Ingen av disse skal «løses» av agenten på egen hånd. De skal ikke presse fram et valg nå.

## #1 — Clubhouse scroll-policy (ÅPEN)

- Registrert: 2026-07-10
- Status: **ÅPEN** — ikke avklart. Ikke be Mathias velge nå; ikke endre Clubhouse-koden.
- Berører: `design/contracts/clubhouse-default.md` (§4), all fremtidig Clubhouse-UI.
- Konflikt:
  - Ny grunnlov (CLAUDE.md §3 + PROJECT-FACTS §12): Clubhouse = `vertical-content` (skal scrolle, aldri miniatyriseres, ingen root-skalering).
  - Dagens kode: `single-screen` contain-fit — hele `.chd` skaleres ned for å passe én skjerm (mønsteret UI-QUALITY-SYSTEM §1/§9 er laget for å stoppe).
- Alternativer (kun for referanse, ikke et spørsmål nå):
  - (A) Behold single-screen → endre grunnlov + dimensjonér bokser responsivt uten global nedskalering, hold lesbar minstestørrelse.
  - (B) Gjør Clubhouse `vertical-content` → boksene beholder lesbar/premium størrelse, siden scroller.
- Konsekvens til beslutning tas: `clubhouse-default.md` forblir DRAFT/BLOCKED; ingen Clubhouse-UI-endring godkjennes.
