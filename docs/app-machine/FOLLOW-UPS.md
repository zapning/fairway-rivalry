# Oppfølgingspunkter (app-maskin)

Ikke-blokkerende punkter som skal håndteres i egen, avgrenset oppgave — ikke blandes inn i pågående trinn.

## F1 — `og-image.png` mangler i produksjonsbygget (`build-dist.sh`)
- Registrert: 2026-07-10 (under BUILD-PLAN trinn 3).
- Funn: `index.html` refererer `og-image.png` i OG-/Twitter-meta, men `build-dist.sh` kopierer den **ikke** til `dist/`. Node-wrapperen `build-dist.mjs` ble midlertidig gitt streng paritet med `build-dist.sh` (og-image fjernet), så trinn 3 ikke samtidig endrer produksjonsbyggets innhold.
- Oppfølging (egen oppgave): legg `og-image.png` inn i den autoritative build-prosessen (både `build-dist.sh` og `build-dist.mjs`), verifiser at OG-forhåndsvisning virker, og oppdater evt. cache-bust. Ikke gjør dette som del av trinn 3.
- Status: **ÅPEN**.
