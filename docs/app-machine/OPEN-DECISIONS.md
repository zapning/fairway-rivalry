# Åpne prosjektbeslutninger

Register over beslutninger som må tas av Mathias før berørt arbeid kan godkjennes.

## #1 — Clubhouse scroll-policy — **RESOLVED (2026-07-10, Mathias)**

Erstatter den tidligere uløste konflikten (single-screen vs. vertical-content).
Bindende responsiv policy for Clubhouse:

1. På referanseviewportene **390×844** og **412×915**, i installert PWA / full tilgjengelig viewport, skal Clubhouse **som mål** kunne vises uten nødvendig vertikal sidescroll og visuelt følge den godkjente fullside-referansen.
2. På kortere/mindre skjermer, i nettlesermodus med redusert tilgjengelig høyde, ved stor tekst, eller når safe-area reduserer plassen, skal **naturlig vertikal scroll tillates**.
3. **Lesbarhet, riktige proporsjoner og minimum trykkflater har alltid prioritet** over kravet om én skjerm.
4. **Forbudt:** global `transform: scale(...)`, `zoom` eller annen helsideskalering for å tvinge dashboardet inn på skjermen.
5. **Horisontal scroll er aldri tillatt.**
6. Komponentene skal **reflowe eller bruke naturlig dokumenthøyde** på kompakte skjermer. Header eller innhold skal ikke overlappe hverandre.
7. Bruk dynamisk viewport (`dvh`) og `safe-area` korrekt. Nettleserens adresselinje eller systemfelt skal ikke føre til at innhold blir kuttet.

Begrunnelse: målet «alt på én skjerm» beholdes der plassen finnes (referansetelefoner/PWA), men aldri på bekostning av lesbarhet, proporsjon eller trykkflate; helsideskalering (dagens contain-fit-mønster) er eksplisitt forbudt og skal erstattes av responsiv reflow når Clubhouse implementeres på nytt.

Konsekvens: `design/contracts/clubhouse-default.md` §4 er oppdatert med denne policyen. Kontrakten forblir **DRAFT (ikke endelig APPROVED)** til tokenene er ferdig kontrollert (typografiskala gjenstår).
