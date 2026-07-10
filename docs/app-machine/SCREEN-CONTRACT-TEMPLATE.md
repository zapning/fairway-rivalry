# Fairway Rivalry — screen contract template

Kopier denne malen til `design/contracts/<route>-<state>.md` og opprett en tilsvarende maskinlesbar JSON-kontrakt før vesentlige UI-endringer.

---

## 1. Identitet

- Contract ID:
- Route:
- State:
- Version:
- Owner:
- Status: `draft | approved | deprecated`
- Approved by:
- Approved date:

## 2. Produktmål

- Hvilket problem løser skjermen?
- Hvem er hovedbrukeren i denne tilstanden?
- Hva er den viktigste handlingen?
- Hva skal brukeren forstå innen fem sekunder?
- Hva må ikke forstyrre hovedmålet?

## 3. Kilder til sannhet

- Approved full-screen reference:
- Approved header reference:
- Approved component references:
- Design token file:
- Existing production baseline:
- Related functional spec:

Beskriv om referansen er pixel-fasit eller visuell retning. Ikke bland `concept` og `approved`.

## 4. Scroll-policy

Velg én:

- `vertical-content`
- `single-screen`
- `component-horizontal`

Detaljer:

- Skal dokumentet kunne scrolle vertikalt?
- Hvilke komponenter kan eventuelt scrolle horisontalt?
- Er header/nav sticky eller normal?
- Hvilket innhold må være synlig i første viewport?
- Hvilket innhold kan ligge under bretten?

## 5. App-shell og viewport

- Min støttet viewport:
- Maks designviewport:
- App-shell max-width:
- Sidegutter ved 320, 360, 390, 412 og 430 px:
- Safe-area-regler:
- Browser mode/PWA mode:
- Bakgrunnens sizing/position:

## 6. Header contract

- Header component/variant:
- Transparent/opak:
- Høyde eller høydeintervall:
- Logoasset og størrelse:
- Tittel/slogan:
- Nav-rekkefølge:
- Aktiv fane:
- Aktiv markering:
- Profilikon:
- Spacing og alignment:
- Referansesnapshot:
- Forbudte avvik:

Eksempel på forbudte avvik:

- ikke bytt logoasset
- ikke endre ikonrekkefølge
- ikke legg bakgrunnsfarge dersom referansen er transparent
- ikke bruk grønn aktiv markering når referansen er gull

## 7. Komponentrekkefølge

List alle hovedkomponenter i DOM- og visuell rekkefølge:

1.
2.
3.

Definer også hvilke komponenter som er gjensidig eksklusive. Eksempel: bare én av `Today's Challenge` og `Round in progress` kan vises i samme slot dersom det er produktregelen.

## 8. Grid og geometri

For hver seksjon:

- Columns per viewport:
- Gap:
- Aspect ratio:
- Min/max height:
- Internal padding:
- Alignment:
- Radius:
- Border width:

Angi toleranser der målingen skal testes, for eksempel `16 px ± 2 px`.

## 9. Typografi

For hver tekstrolle:

- Font family:
- Weight:
- Size eller `clamp()`-område:
- Line-height:
- Letter-spacing:
- Color:
- Alignment:
- Maks linjer:
- Overflow behavior:

Definer minimum lesbar størrelse. Tekst kan ikke krympes under denne for å møte en layouttest.

## 10. Transparens og visuelle effekter

- Box background alpha:
- Elementer som alltid skal være opake:
- Border/gold treatment:
- Shadow/glow:
- Blur/backdrop-filter:
- Image treatment:

Skill eksplisitt mellom bakgrunnstransparens og opacity på hele komponenten. Ikoner, tekst og bilder skal ikke bli transparente bare fordi boksens bakgrunn er det.

## 11. Statisk og dynamisk innhold

For hvert element:

- Static asset/text:
- Dynamic data:
- Placeholder forbidden:
- Empty state:
- Loading state:
- Error state:

Dynamiske verdier skal ikke være bakt inn i bildeassets.

## 12. Datafixtures

List fixtures:

- default
- empty
- long-name
- max-number
- missing-image
- loading
- error
- active-round
- no-active-round

Angi eksakte deterministiske verdier, slik at screenshot og layout kan repeteres.

## 13. Functional assertions

- Route loads:
- Active tab:
- Tap/click behavior:
- Navigation behavior:
- Back/refresh behavior:
- Conditional components:
- Data binding:
- Accessibility names:

## 14. Layout assertions

- No document horizontal overflow:
- No root/app scaling:
- Header bounds:
- Main content bounds:
- Required first-viewport content:
- Overlap rules:
- Font minimums:
- Touch target minimums:
- Image aspect ratio:
- Scroll-policy assertions:

## 15. Visual snapshots

Required snapshots:

- header component
- first viewport
- critical component(s)
- middle viewport for long page
- bottom viewport for long page
- fullPage overview

For each snapshot:

- project/browser:
- viewport:
- reference path:
- max diff:
- allowed masks:
- forbidden masks:

## 16. Testmatrix

| Project | Viewport | Functional | Layout | Component visual | Full visual |
|---|---:|---|---|---|---|
| Chromium-small | 320×568 | Required | Required | Optional/required | Optional |
| Chromium-standard | 390×844 | Required | Required | Required | Required |
| Chromium-large | 430×932 | Required | Required | Required | Required |
| WebKit-small | 375×667 | Required | Required | Optional/required | Optional |
| WebKit-standard | 390×844 | Required | Required | Required | Required |

Tilpass tabellen etter skjermen, men ikke fjern hele cross-browser-kontrollen.

## 17. Acceptance criteria

Skriv konkrete, binære kriterier. Eksempler:

- Header component screenshot matcher approved header innen avtalt diff.
- Clubhouse beholder vertikal scrolling og har ingen root scaling.
- Første hovedkort har sidegutter `16 px ± 2 px` på 390 px viewport.
- Bare én resume/challenge-slot rendres.
- All dynamisk tekst er DOM-tekst.
- Ingen uventet horisontal document overflow på noen testviewport.

## 18. Baseline change policy

- Krever visuell godkjenning: ja/nei
- Hvem kan godkjenne:
- Hvilke snapshots påvirkes:
- Baselineoppdatering skal være separat commit: ja

