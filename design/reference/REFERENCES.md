# Designreferanser — register og kontroll

Formål: en utvikler skal kunne forklare header og Clubhouse-layout **uten** å gjette fra en chatmelding
(BUILD-PLAN trinn 2, «Ferdig når»).

## Koordinatsystem og skala (les først)
- **Crop-koordinater er i kildebildets FAKTISKE piksler** (ikke CSS-px, ikke prosent).
- **Kildebredde = 853 px** (design-space mockup).
- **Målviewport = 390 CSS-px** (referanse-telefonmål; live støtter 320–430).
- **Skaleringsfaktor kilde → viewport = 390 / 853 = 0.457** (mot 430 CSS-px: 0.504).
- **Crop-størrelsene er IKKE direkte CSS-piksler.** Prosent-verdiene i `fairway.tokens.json` er skala-uavhengige og foretrukket for layout.
- **«Kildestørrelse» = hele kildebildets størrelse. «Crop-størrelse» = utsnittets størrelse. De to blandes aldri** (kun for Header er de like, fordi utsnittet ER hele kildebildet).

## 1. Full-skjerm referanser (kildebilder) — APPROVED

| Fil | Skjerm | State | Viewport (mål) | Kildestørrelse (px) | Kilde | Godkjenning |
|---|---|---|---|---|---|---|
| `reference/clubhouse/approved-clubhouse-fullpage-390.png` | Clubhouse | default (tom/0–0) | 390 | 853×1844 | Dashboard V2 (Mathias) | **APPROVED source image** |
| `reference/header/approved-header-853x293.png` | Header (global) | aktiv=Clubhouse | 390 | 853×293 | Header.png (Mathias) | **APPROVED source image** |

## 2. Komponentreferanser — APPROVED (proportion/design reference only)

Godkjent av Mathias 2026-07-10 (visuell vurdering av kontaktkopi). Merking (gjelder alle fem):
- **source image: APPROVED**
- **derived crop: APPROVED**
- **reference type: proportion/design reference only**

**Disse fem er IKKE fasit for (gjelder alle):**
- direkte CSS-pikselmål
- dynamiske verdier (tall, navn, bar-lengder — «3-1», «Rounds Played» osv. er kun mockup-eksempler)
- endelig typografiskala
- responsive regler
- scroll-policy

### Kontrolloversikt per crop

> «Kildestørrelse» = hele kildebildet. «Crop-størrelse» = utsnittet. Blandes aldri.

| # | Filnavn | Kildebilde | Kildestørrelse (px) | Crop-koordinater (x0,y0,x1,y1) | Crop-størrelse (kildepx) | ≈ CSS-px @390 (×0.457) | Skjerm | State | Viewport |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `components/approved-header--clubhouse-default--source853--viewport390.png` | Header.png | 853×293 | (0,0,853,293) hele | 853×293 | ~390×134 | header (global) | aktiv=Clubhouse | 390 |
| 2 | `components/approved-navrow--clubhouse-default--source853--viewport390.png` | Dashboard V2 | 853×1844 | (15,823,840,1005) | 825×182 | ~377×83 | Clubhouse | default | 390 |
| 3 | `components/approved-record--clubhouse-default--source853--viewport390.png` | Dashboard V2 | 853×1844 | (15,287,840,709) | 825×422 | ~377×193 | Clubhouse | default | 390 |
| 4 | `components/approved-statbox--clubhouse-default--source853--viewport390.png` | Dashboard V2 | 853×1844 | (220,1008,425,1268) | 205×260 | ~94×119 | Clubhouse | default | 390 |
| 5 | `components/approved-breakscore--clubhouse-default--source853--viewport390.png` | Dashboard V2 | 853×1844 | (15,1542,840,1819) | 825×277 | ~377×127 | Clubhouse | default | 390 |

### Hva hver referanse SKAL være fasit for

| # | Komponent | SKAL være fasit for (proporsjon/design) |
|---|---|---|
| 1 | Header | logo, tagline, faner m/ikon-over-etikett, aktiv gull-markering, profil høyre |
| 2 | Navigasjonsrad | 6-kolonne proporsjon, ikon+etikett, gap-rytme, badge-plassering |
| 3 | Record This Season | proporsjon, opak hero, tittel/verdi/subtekst-plassering |
| 4 | Standard statistikkboks | boks-proporsjon, gullramme, tittel/verdi-soner |
| 5 | Break Score | proporsjon, ball-plassering, bar-rad-layout |

### Feilkutt-kontroll
Alle fem inspisert mot eksakt crop-grense (kontaktkopi, review-materiale). Ingen viktig gullramme, skygge,
spacing, tekst eller nabokomponent er feilkuttet; hel ramme + bevart luft, ingen nabo-bleed.

## 3. Målte layoutverdier (fra Dashboard V2, template-match 0.87–1.00)
Innholdsområde 853×1515 (kildepiksler). Sidegutter 3.28 %; navrad 6 kol/13 px gap; statrad 4 kol
(venstre 168 px, øvrige 190–193 px)/12–14 px gap; vertikal rytme 17–21 px. (×0.457 for CSS-px @390.)
Fulle verdier + klassifisering i `design/tokens/fairway.tokens.json`.

## 4. Status
- **Full-skjerm kildebilder:** APPROVED (2).
- **Komponentreferanser:** APPROVED — proportion/design reference only (5). Ikke fasit for CSS-px, dynamiske verdier, typografiskala, responsive regler eller scroll-policy.
- **Clubhouse screen contract:** `design/contracts/clubhouse-default.md` = **DRAFT** (scroll-policy RESOLVED, beslutning #1). Ikke endelig APPROVED — venter kun på ferdig token-kontroll (typografisk skala).
- **Godkjente kvalitetskrav (tokens):** min touch target 44 CSS-px, brødtekst ≥14, nav/kortetikett ≥12, mikroetikett 11 (kun sekundær/ikke-interaktiv), standard kortradius 10 (@390), hero/Record 12.
- **Provisoriske tokens (pendingApproval):** kun komplett typografisk SKALA (hero-tall, dynamiske overskrifter, responsive fontstørrelser) — egen visuell tokenkontroll gjenstår.
- **Trinn 2 samlet: PARTIAL PASS / BLOCKED** — kan ikke lukkes før Clubhouse-kontrakt, scroll-policy og provisoriske tokens er godkjent.
- **Review-materiale:** `design/candidates/pending-crops-contact-2026-07-10.png` er kontaktkopien brukt til godkjenning (viser filnavn slik de var FØR rename, `pending-*`). Kun review; ikke en referanse.
- **Golden render-snapshots:** ikke laget (trinn 6).
