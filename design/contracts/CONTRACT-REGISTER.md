# Kontraktregister — Fairway Rivalry

Produkt-/kontraktregister for alle sider, aktive tilstander og flytsteg (BUILD-PLAN v3 trinn 2 og 4).
Registeret gjør **udekket område synlig**. Det er ikke en kontrakt i seg selv.

Alle fakta under er **verifisert mot faktisk DOM** i `Golf Dashboard.html` og `app.js` — ikke antatt.

## Verifiserte strukturfakta

- Alle `#tab-*`-seksjoner ligger **statisk i HTML** og veksles kun via `style.display`. Ingen seksjon
  opprettes eller fjernes fra DOM (`createElement('section')` forekommer 0 ganger i `app.js`).
  Derfor er alle `always-mounted` — aldri `conditionally-mounted`.
- Aktiv tilstand er maskinlesbar via **`document.body[data-tab]`** og `.active` på `nav#tabs button[data-tab]`.
- `#rwz-step-1/2/3` ligger også statisk i HTML inne i `#tab-round`.
- Landing er kodegated av (`app.js`: `const show = false`) og er **ikke montert**.

## Register

| Navn | Nøkkel | Type | Aktiveringsmåte | Root-selector | Mount-policy | Visibility-policy | Implementasjon | Kontrakt | Strukturell test |
|---|---|---|---|---|---|---|---|---|---|
| Clubhouse | `dashboard` | primary-tab | synlig hovedfane | `#tab-dashboard` | always-mounted | default-visible | live | **draft** | partial |
| Tee Off | `round` | primary-tab | synlig hovedfane | `#tab-round` | always-mounted | default-hidden | live | missing | partial |
| Rivalry | `rivalry` | primary-tab | synlig hovedfane | `#tab-rivalry` | always-mounted | default-hidden | live | missing | partial |
| Feed | `feed` | primary-tab | synlig hovedfane | `#tab-feed` | always-mounted | default-hidden | live | missing | partial |
| FGL | `fgl` | primary-tab | synlig hovedfane | `#tab-fgl` | always-mounted | default-hidden | placeholder | missing | partial |
| Profile | `profile` | secondary-page | skjult intern knapp + meny | `#tab-profile` | always-mounted | default-hidden | live | missing | partial |
| Settings | `settings` | secondary-page | skjult intern knapp + meny | `#tab-settings` | always-mounted | default-hidden | live | missing | partial |
| Insights | `insights` | secondary-page | skjult intern knapp + kort/CTA | `#tab-insights` | always-mounted | default-hidden | live | missing | partial |
| Trophies | `trophies` | secondary-page | skjult intern knapp + kort/CTA | `#tab-trophies` | always-mounted | default-hidden | live | missing | partial |
| Rounds | `rounds` | secondary-page | skjult intern knapp + kort/CTA | `#tab-rounds` | always-mounted | default-hidden | live | missing | partial |
| Courses | `courses` | secondary-page | skjult intern knapp + kort/CTA | `#tab-courses` | always-mounted | default-hidden | live | missing | partial |
| Approvals | `approvals` | secondary-page | kort/CTA (ingen nav-knapp) | `#tab-approvals` | always-mounted | default-hidden | live | missing | partial |
| Friends | `friends` | secondary-page | skjult intern knapp + kort/CTA | `#tab-friends` | always-mounted | default-hidden | live | missing | partial |
| Stats | `stats` | secondary-page | skjult intern knapp + kort/CTA | `#tab-stats` | always-mounted | default-hidden | live | missing | partial |
| Scorecard | `scorecard` | flow-step (under Tee Off) | funksjonsflyt (steg 3) | `#rwz-step-3` | always-mounted | conditionally-visible | live | missing | partial |
| Landing | `landing` | disabled-entry | ikke montert | — | not-mounted | not-applicable | disabled | missing | partial |

## Presisering av dekningsgrad

`partial` etter trinn 4A betyr **kun** det testene faktisk beviser:

- **Primary tabs:** root-eksistens, tilstedeværelse i navigasjon, korrekt nav-rekkefølge, at sidebytte
  aktiverer riktig seksjon og riktig nav-element, og at aktiv tilstand er maskinlesbar og entydig.
- **Secondary pages:** root-eksistens er testet (4A-5). Aktivering via meny/kort/CTA er **ikke** testet.
- **Scorecard (flow-step):** root-eksistens er testet (4A-5). Flyten steg 1 → 2 → 3 er **ikke** testet.
- **Landing (disabled-entry):** at den **ikke** er montert er testet (4A-5). Ingenting annet.

Ingen side har `covered`. Dyp kontraktdekning krever trinn 4C (Clubhouse-pilot) og påfølgende sidekontrakter.

## Clubhouse-kontraktstatus: `draft` — grunnlag

`design/contracts/clubhouse-default.md` sier eksplisitt `Status: DRAFT`, med begrunnelsen at
scroll-policy er RESOLVED, men at **typografisk token-kontroll gjenstår**. `Approved by:` og
`Approved date:` er begge tomme. Statusen er derfor utledet fra dokumentet, ikke antatt.
