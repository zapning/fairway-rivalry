# Social-arkitektur — huskelapp

Hvordan FGL faktisk blir sosial. Status nå, hva som funker lokalt vs i sky, og hva som krever Supabase backend før det funker «på ekte» mellom enheter.

---

## Det sosiale spillet — i 4 nivåer

| Nivå | Hva | Hvorfor det betyr noe |
|---|---|---|
| **1. Sololag** | Logge runder, se egen progresjon | Aktivering — grunnen brukeren prøver appen |
| **2. Vennelisten** | Legge til navngitte rivaler, manuell H2H | Aktivering uten venner i appen — gir verdi alene |
| **3. Inviter venner** | Vennen lager konto + dukker opp i din liste | Multiplikator — én bruker drar inn 3–10 |
| **4. Live sosial** | Se hva vennene gjør live, push-varsler, broadcast | Retensjon — grunnen til å åpne appen daglig |

---

## Status nå (juni 2026)

| Funksjon | Lokalt | Sky-sync | Push-varsel | Live |
|---|---|---|---|---|
| Lage egen profil | ✅ | ✅ Supabase | – | – |
| Legge til navngitte rivaler | ✅ | ❌ Lokal kun | – | – |
| Bulk-add via paste | ✅ | ❌ | – | – |
| Magic-link epost-invitasjon | ✅ kodet | ⚠ Krever Supabase URL config riktig | ✅ via Supabase | – |
| SMS-invitasjon via sms: link | ✅ | – | – | – |
| Kopi-lenke-invitasjon | ✅ | – | – | – |
| QR-kode for invitasjon | ✅ | – | – | – |
| H2H-record bygges fra runder | ✅ | ❌ Lokal kun | – | – |
| Manuell standings med to-parts godkjenning | ✅ UI | ❌ Trenger sanntid | – | – |
| Rivalry-utfordringer (challenges) | ✅ UI | ❌ Lokal kun | – | – |
| League med eier + 6-tegns kode | ✅ UI | ❌ Lokal kun (joine andre baner ikke mulig) | – | – |
| **Live runde broadcast** | ⚠ UI-stub | ❌ Krever realtime | – | ❌ |
| **Spectator** | ⚠ UI-stub | ❌ Krever realtime | – | ❌ |

---

## Det som hindrer sømløs sosial flyt — i prioritert rekkefølge

### 🔴 Blokker 1 — Friends/rivaler synkes ikke til skyen

Akkurat nå: hvis Lars og Mathias begge installerer appen, ser de IKKE hverandre. Begge legger til hverandre lokalt med navn → blir to separate H2H-poster.

**Fix:** Når en bruker er logget inn (Supabase), pushe `friends`-arrayet til en `profiles.friends_json` kolonne eller (bedre) en `friendships`-tabell. Mathias sender invite til lars@x.com → Lars klikker linken → Supabase trigger: legg til en gjensidig friendship-record. Begges friends-liste oppdateres i skyen.

**Tid:** 4–6 timer. Krever Supabase tabell + RLS-regler + edge function.

### 🔴 Blokker 2 — League join virker ikke mellom enheter

Akkurat nå: Mathias lager «MyLeague» med kode `K7M3PQ`. Lars skriver `K7M3PQ` → får «League not found locally».

**Fix:** League-objektet må lagres i en `leagues`-tabell i Supabase. Når noen joiner med en kode → backend slår opp koden → returnerer ligaen → legges til i Lars' state. RLS sørger for at bare medlemmer ser interne data.

**Tid:** 6–8 timer. Tabeller + RLS + edge function for join-by-code.

### 🟡 Blokker 3 — Manuell standings + utfordringer er lokale

Mathias sender en «propose adjustment» til Lars → bare Mathias ser den. Lars må selv åpne rivalry-detalj på sin enhet → forslaget er ikke der.

**Fix:** Bruk Supabase Realtime channels per-rivalry. Begge subscribere → endring pushes umiddelbart. Trenger `rivalry_proposals`-tabell.

**Tid:** 8–12 timer. Realtime er kompleks, krever god feilhåndtering.

### 🟢 Blokker 4 — Live runde broadcast (det du nettopp ba om)

Mathias starter «logg ny runde» → ingen vet det. Vennene har ingen idé om at en runde foregår.

**Fix:** Når runde starter (eller når match mode åpnes), pushe en `live_round` record til Supabase med status='playing'. Alle venners enheter subscribere via Realtime → får push: «Mathias spiller akkurat nå på Soon GK». Caddien viser drop-in. Når runden er ferdig (save) → push status='completed' med score.

**Tid:** 6–10 timer. Datamodell + realtime + Caddie-integrasjon.

### 🟢 Blokker 5 — Push-varsler

Når Lars klikker «accept proposal» mens Mathias er offline → Mathias får ingen varsel.

**Fix:** Web Push API + Supabase functions. Krever VAPID-nøkler.

**Tid:** 8–10 timer.

---

## Den «sømløse» drømmen — slik fungerer det når alt er på plass

1. Mathias signer opp med epost → magic-link
2. Mathias inviterer Lars og Petter via epost
3. Lars klikker linken → konto opprettet automatisk → legges til Mathias' venneliste på BEGGE enheter
4. Mathias lager «Vinterligaen 2026» → får kode `K7M3PQ`
5. Lars og Petter joiner med koden → alle tre i samme tabell
6. Mathias starter en runde med Lars → Petters telefon piper: «Mathias og Lars spiller akkurat nå» (push-varsel)
7. Petter åpner appen → ser live-scoreboard, kan kommentere
8. Når runden er ferdig → tabellen oppdateres automatisk hos alle tre

**Det koster:**
- ~30–40 timer backend-arbeid
- Supabase Pro-plan (~$25/mo) for realtime + push
- Eventuelt Twilio for SMS-bekreftelse (~$0.01/SMS)

---

## Det vi gjør NÅ vs. neste sprint

### Kan fikses i appen i kveld (uten backend):

- ✅ Sørge for at vennelisten persisterer skikkelig lokalt (lagres alltid på rundens save)
- ✅ Velkomstskjerm vises IKKE igjen etter at man har laget profil
- ✅ Caddie-broadcast UI som tester upen lokalt (når DU starter runde → DU får drop-in selv, slik at flyten er testbar)
- ✅ Skikkelig epost-validering før magic-link sendes
- ✅ Loading-state på alle social-knapper så bruker vet at noe skjer

### Krever Supabase-backend (egen sprint, ikke i dag):

- ❌ Friends-sync mellom enheter
- ❌ League join på tvers
- ❌ Live runde broadcast til vennenes enheter
- ❌ Push-varsler
- ❌ Manuell standings to-parts confirm på ekte
- ❌ Spectator mode

---

## Forretningsperspektiv

**Den ene tingen som driver vekst i sosiale apper:** når brukeren inviterer 1+ venn som ALLE blir aktive. K-faktor > 1.

Vi har én viktig blokker: **invitasjonen må fungere flytfritt**. Akkurat nå er den 3 steg:
1. Bruker A klikker «invitér Lars»
2. Magic-link sendes
3. Lars klikker → må deretter manuelt si «jeg er Lars»

Det burde være 2 steg når backend er på plass:
1. Bruker A inviterer Lars (epost lars@x.com, navn «Lars»)
2. Lars klikker linken → automatisk Lars-profil opprettet → automatisk koblet som venn

Forskjellen mellom 3 og 2 steg = enorm forskjell i konverteringsrate.

---

## TL;DR — Hva som må gjøres for ekte sosialt

1. **Supabase tabeller:** `friendships`, `leagues`, `league_members`, `live_rounds`, `rivalry_proposals`, `notifications`
2. **Supabase RLS-regler** på hver tabell så bare medlemmer ser interne data
3. **Edge Functions** for: send invite, join league by code, broadcast live round
4. **Realtime channels** per liga + per rivalry for live updates
5. **Web Push** med VAPID for varsler når app er lukket
6. **Klient-kode** i appen som subscribere riktig og oppdaterer UI

Total tid: ~40 timer fokusert backend-arbeid.

**Min anbefaling:** sett av én helg til dette. Jeg kan skrive ALT backend-koden + klient-integrasjonen i en konsentrert sprint. Frem til det fungerer alt lokalt + magic-link signup.
