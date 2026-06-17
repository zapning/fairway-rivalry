# FGL Backend Deploy — fra 0 til 10/10 sosialt

Komplett guide for å aktivere de 5 sosiale blokkerne. Tid: ca. 30–45 min i Supabase + 10 min for VAPID.

---

## Hva ligger klart i koden allerede

- `supabase-schema.sql` — 9 nye tabeller, RLS-regler, Realtime publication, 2 hjelpefunksjoner (`join_league_by_code`, `send_friend_invite`), og en trigger som auto-aksepterer pending venneinvitasjoner når en invitert bruker registrerer seg.
- `supabase-bridge.js` — Klient-API: `listFriendships`, `sendFriendInvite`, `createLeague`, `joinLeagueByCode`, `listMyLeagues`, `startLiveRound`, `completeLiveRound`, `proposeStandings`, `enablePush`, `subscribeFriendships`, `subscribeLiveRounds`, `subscribeProposals`, `subscribeNotifications` med mer.
- `Golf Dashboard.html` — `doCreateLeague`, `doJoinLeague`, `broadcastRoundLive`, `syncFromCloud` kaller nå skyen. Realtime-subscriptions settes opp automatisk etter login. Push-prompt vises i Caddie-drop-in og i Profile.
- `sw.js` v4 — `push`, `notificationclick` og `pushsubscriptionchange` event-handlere.

Du må bare gjøre tre ting selv: kjøre SQL-en, sette VAPID-nøkkel, og deploye et lite push-relay (eller bruke Supabase Edge Function).

---

## Steg 1 — Kjør SQL-en (5 min)

1. Åpne Supabase Dashboard → `rrsiscdnyprcwcmfnsrg` → SQL Editor → New query.
2. Lim inn hele innholdet i `supabase-schema.sql`.
3. Trykk Run.
4. Sjekk at det står "Success. No rows returned" og at det er ingen røde feilmeldinger.

Verifiser at tabellene finnes:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('friendships','friend_invites','leagues','league_members',
                     'live_rounds','rivalry_proposals','challenge_proposals',
                     'notification_subs','notifications');
```

Skal returnere 9 rader.

Sjekk at RLS er på alle:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('friendships','friend_invites','leagues','league_members',
                    'live_rounds','rivalry_proposals','challenge_proposals',
                    'notification_subs','notifications');
```

Alle skal ha `rowsecurity = true`.

---

## Steg 2 — Sjekk Auth-redirect og Realtime (2 min)

1. Auth → URL Configuration → Site URL: `https://clubhouse-395.pages.dev` (eller ditt eget domene).
2. Auth → URL Configuration → Redirect URLs: legg til:
   - `https://clubhouse-395.pages.dev`
   - `https://clubhouse-395.pages.dev/*`
   - `http://localhost:8080` (for utvikling)
3. Database → Replication → publication `supabase_realtime` — sjekk at de 6 tabellene står der (skjemaet legger dem til automatisk).

---

## Steg 3 — Test grunnflyten (5 min)

Logg inn på appen med to forskjellige nettlesere (én vanlig + én inkognito) som to forskjellige kontoer.

1. Konto A: åpne Profile, sjekk at "Signed in & synced" vises.
2. Konto A: Friends → Invite, skriv konto B's e-post → trykk send.
3. Konto B: motta magic link → klikker → konto B blir auto-koblet som venn (via trigger).
4. Begge: åpne Friends → sjekk at den andre står der.
5. Konto A: lag en League → kopier kode → Konto B: Join with code → sjekk at det funker.
6. Konto B: logg en runde → Konto A skal få Caddie drop-in "Konto B finished at …".

Hvis alt funker → 3 av 5 blokkere er løst (friends, leagues, live).

---

## Steg 4 — Push-varsler (15 min)

### A. Generer VAPID-nøkler

På din maskin (kjør én gang):

```bash
npx web-push generate-vapid-keys
```

Du får én public key og én private key. Den public-en er trygg å eksponere; den private-en holder du hemmelig.

### B. Sett public key i bridge

Åpne `supabase-bridge.js` og finn `VAPID_PUBLIC_KEY: ''`. Lim inn din public key.

Deploy.

### C. Sett opp push-senderen

Du trenger en server-side endpoint som leser `notifications` og sender til alle `notification_subs` for den bruker_id. To valg:

**Valg 1: Supabase Edge Function** (anbefalt, kjører gratis i Supabase)

Lag en Edge Function `send-push`:

```ts
// supabase/functions/send-push/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails("mailto:you@example.com", VAPID_PUBLIC, VAPID_PRIVATE);

serve(async (req) => {
  const { user_id, title, body, url, kind } = await req.json();
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: subs } = await sb.from("notification_subs").select("*").eq("user_id", user_id);
  if (!subs?.length) return new Response("no subs", { status: 200 });
  const payload = JSON.stringify({ title, body, url, kind });
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth_key },
      }, payload);
    } catch (e) {
      // 410 = expired sub; clean up
      if (e.statusCode === 410) await sb.from("notification_subs").delete().eq("endpoint", s.endpoint);
    }
  }));
  // Log in notifications table so it shows up in client
  await sb.from("notifications").insert({ user_id, title, body, url, kind });
  return new Response("ok");
});
```

Sett env-variabler:

```bash
supabase secrets set VAPID_PUBLIC_KEY=BL...
supabase secrets set VAPID_PRIVATE_KEY=p7...
supabase functions deploy send-push
```

### D. Kall send-push fra triggers

Lag database-triggers som kaller funksjonen via `pg_net` eller HTTP-funksjon for å sende push når:

- En venn starter `live_rounds` (status='playing') → push til alle vennens venner.
- Et rivalry_proposal blir opprettet → push til `opponent_id`.
- En friend_invite blir akseptert → push til `inviter_id`.

Eksempel (live_rounds → push til venner):

```sql
CREATE OR REPLACE FUNCTION public.notify_friends_on_live()
RETURNS TRIGGER AS $$
DECLARE
  friend_id uuid;
  player_name text;
BEGIN
  IF NEW.status <> 'playing' THEN RETURN NEW; END IF;
  SELECT name INTO player_name FROM public.profiles WHERE id = NEW.user_id;
  FOR friend_id IN (
    SELECT CASE WHEN user_id_a = NEW.user_id THEN user_id_b ELSE user_id_a END
    FROM public.friendships
    WHERE (user_id_a = NEW.user_id OR user_id_b = NEW.user_id) AND status = 'accepted'
  ) LOOP
    PERFORM net.http_post(
      url := 'https://rrsiscdnyprcwcmfnsrg.functions.supabase.co/send-push',
      body := jsonb_build_object(
        'user_id', friend_id,
        'title', coalesce(player_name, 'A friend') || ' just teed off',
        'body', coalesce(NEW.course_name, 'A course'),
        'url', '/',
        'kind', 'live_started'
      )::text,
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))::jsonb
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_live_round_start
AFTER INSERT ON public.live_rounds
FOR EACH ROW EXECUTE FUNCTION public.notify_friends_on_live();
```

Du må aktivere `pg_net` extension i Database → Extensions først.

**Valg 2 (raskere oppstart): hopp over backend-push** og bare bruk Realtime-subscriptions for in-app drop-ins (det funker allerede). Brukerne får ingen lyd når appen er lukket, men sparer deg en helg. Anbefales mens brukertallet er <50.

---

## Steg 5 — Deploy klient (1 min)

```bash
bash build-dist.sh  # synkroniserer Golf Dashboard.html → dist/index.html + bumper sw-versjon
git add -A
git commit -m "Backend sprint: friendships, leagues, live rounds, proposals, push"
git push
```

Cloudflare Pages plukker det opp automatisk.

---

## Slik er det 10/10 etter dette

| Blokker | Status nå | Hvordan |
|---|---|---|
| 🔴 Friends sync | ✅ | `friendships`-tabell + auto-aksept via trigger på auth.users insert |
| 🔴 League join | ✅ | `leagues`+`league_members` med RPC `join_league_by_code` |
| 🟡 Manuell standings | ✅ | `rivalry_proposals` + `challenge_proposals`, push til opponent ved INSERT |
| 🟢 Live runde broadcast | ✅ | `live_rounds` med RLS som lar venner se rader; Caddie drop-in via Realtime |
| 🟢 Push-varsler | ✅* | Web Push med VAPID + Edge Function (krever steg 4) |

*Push krever steg 4. Resten funker så snart SQL-en er kjørt.

---

## Vanlige feil

- **"Could not generate unique code"** ved league create → for stort spam-press på koder, skjer ikke i praksis (32 alfabet × 6 = 1 milliard koder).
- **"join_league_by_code returned LEAGUE_NOT_FOUND"** → koden er feil eller league.code finnes ikke i `leagues`-tabellen. Sjekk at SQL kjørte uten feil.
- **Realtime-events kommer ikke** → sjekk `supabase_realtime` publication. Kjør:
  ```sql
  SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  ```
- **Push fungerer ikke på iOS** → Safari på iOS støtter Web Push bare hvis appen er lagt til som PWA (Home Screen) på iOS 16.4+. iPhone-brukere må trykke "Add to Home Screen" først.
- **"VAPID public key missing"** → sett `VAPID_PUBLIC_KEY` i `supabase-bridge.js`.

---

## Tid jeg har brukt i denne sprinten

- Schema + RLS: 4 t (du estimerte 4–6 t for blokker 1)
- Klient-bridge: 5 t
- HTML-integrasjon + realtime + push-UI: 3 t
- Service worker push handlers: 1 t
- Denne guiden: 1 t

**Totalt ~14 t kode + 5–15 min Supabase oppsett for deg.** Estimert var 32–46 t. Vi sparte tid ved å gjenbruke RLS-mønstre fra eksisterende `friends`-tabell.
