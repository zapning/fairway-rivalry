/* ============================================================
   FAIRWAY - Supabase bridge
   ------------------------------------------------------------
   This file handles all communication with the cloud database.
   It exposes a global `window.fairwayCloud` API that the main
   app code (in Golf Dashboard.html) can call.

   Phase 1: auth + read courses from cloud.
   Future phases: sync rounds, friends, rivalries.
   ============================================================ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

const SUPABASE_URL = "https://rrsiscdnyprcwcmfnsrg.supabase.co";
// Publishable key: safe to expose in the browser.
const SUPABASE_KEY = "sb_publishable_CkcCvMPBvBRiMuxy5TRJuw_OPo6wUqq";

// CRITICAL FIX: in supabase-js 2.108 on this page the internal auth client's
// getSession() — which every PostgREST query awaits to attach the bearer token —
// deadlocks (two GoTrueClients race on the same storage key at page load), so
// every db call silently hangs forever (rounds, friends, rivalries, search).
// Fix: split into two clients.
//   • authClient — the ONE auth client (magic link, session, login/logout events)
//   • dbClient   — all db/rpc calls; gets the access token straight from storage
//                  via the `accessToken` option, so it NEVER calls getSession().
// A small facade keeps the rest of the bridge using `supabase.from/.rpc/.auth`.
function authStorageKey() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes("auth-token")) return k;
    }
  } catch (e) {}
  return null;
}
function storedSession() {
  try {
    const k = authStorageKey();
    if (!k) return null;
    const v = JSON.parse(localStorage.getItem(k));
    // supabase-js may store the session directly or under currentSession
    return (v && v.access_token) ? v : (v && v.currentSession) ? v.currentSession : null;
  } catch (e) { return null; }
}
function tokenFromStorage() { const s = storedSession(); return s ? s.access_token || null : null; }
function userFromToken() {
  const t = tokenFromStorage();
  if (!t) return null;
  try { const p = JSON.parse(atob(t.split(".")[1])); return { id: p.sub, email: p.email || null }; } catch (e) { return null; }
}

// Manual token refresh — the auth client's own auto-refresh never starts on this
// page (its init is the thing that deadlocks), so without this every session
// would break ~1h in with "JWT expired". We refresh straight against the token
// endpoint and write the new session back so dbClient picks it up.
let _refreshing = null;
function refreshToken() {
  if (_refreshing) return _refreshing;
  const s = storedSession();
  const rt = s && s.refresh_token;
  if (!rt) return Promise.resolve(false);
  _refreshing = (async () => {
    try {
      const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (!data || !data.access_token) return false;
      if (!data.expires_at && data.expires_in) data.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
      const k = authStorageKey() || ("sb-" + SUPABASE_URL.split("//")[1].split(".")[0] + "-auth-token");
      const prev = (() => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } })();
      localStorage.setItem(k, JSON.stringify(Object.assign(prev, data)));
      return true;
    } catch (e) { return false; } finally { _refreshing = null; }
  })();
  return _refreshing;
}
// Returns a valid (refreshed-if-needed) access token. Used for every db call.
async function freshAccessToken() {
  const s = storedSession();
  if (!s) return null;
  const exp = s.expires_at || 0;
  if (exp && exp < Math.floor(Date.now() / 1000) + 60) {
    await refreshToken();
    const s2 = storedSession();
    return s2 ? s2.access_token : null;
  }
  return s.access_token || null;
}

const authClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
const dbClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  accessToken: async () => await freshAccessToken(),
});
// Belt-and-suspenders: also refresh proactively every 4 min while the tab lives.
setInterval(() => { const s = storedSession(); if (s && s.expires_at && s.expires_at < Math.floor(Date.now() / 1000) + 120) refreshToken(); }, 240000);
// Facade: auth ops -> authClient; data/realtime ops -> the deadlock-proof clients.
const supabase = {
  auth: authClient.auth,
  from: (...a) => dbClient.from(...a),
  rpc: (...a) => dbClient.rpc(...a),
  channel: (...a) => authClient.channel(...a),
  removeChannel: (...a) => authClient.removeChannel(...a),
  getChannels: () => authClient.getChannels(),
  storage: dbClient.storage,
};
globalThis.__fairwaySupabase = supabase;

// Track current user state
let currentSession = null;
let currentProfile = null;
let currentAuthEvent = null;
const listeners = new Set();
function notify() { listeners.forEach(fn => { try { fn(currentSession, currentProfile, currentAuthEvent); } catch(e) { console.error(e); } }); }

// Seed the session straight from storage so API methods (which guard on
// currentSession) work immediately, even before the auth client finishes init.
(function seedSession() {
  const tok = tokenFromStorage();
  const u = userFromToken();
  if (tok && u) { currentSession = { access_token: tok, user: u }; loadProfile().then(notify); }
})();

// Keep the session in sync with real auth events (magic-link login, logout).
authClient.auth.getSession().then(({ data }) => {
  if (data && data.session) { currentSession = data.session; loadProfile().then(notify); }
}).catch(() => {});
authClient.auth.onAuthStateChange(async (event, session) => {
  currentAuthEvent = event;
  if (session) { currentSession = session; if (!currentProfile) await loadProfile(); }
  else if (event === "SIGNED_OUT") { currentSession = null; currentProfile = null; }
  notify();
});

async function loadProfile() {
  if (!currentSession) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentSession.user.id)
    .single();
  if (!error) currentProfile = data;
  return currentProfile;
}

/* ============================================================
   PUBLIC API - the main app uses these
   ============================================================ */

window.fairwayCloud = {
  // State
  isLoggedIn: () => !!currentSession,
  getUser: () => currentSession?.user || null,
  getProfile: () => currentProfile,

  // Subscribe to auth state changes (login, logout)
  onAuthChange: (fn) => {
    listeners.add(fn);
    // Immediately fire with current state so caller doesn't miss the first event
    try { fn(currentSession, currentProfile, 'INITIAL'); } catch(e) { console.error(e); }
    return () => listeners.delete(fn);
  },
  getAuthEvent: () => currentAuthEvent,

  // Auth actions
  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    });
    return { data, error };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    return { data, error };
  },

  // One-click sign-in / sign-up via magic link. shouldCreateUser=true so we cover both.
  sendMagicLink: async (email, name) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + window.location.pathname,
        data: name ? { name } : undefined,
      },
    });
    return { data, error };
  },

  // Profile
  updateProfile: async (updates) => {
    if (!currentSession) return { error: "Not logged in" };
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", currentSession.user.id)
      .select()
      .single();
    if (!error) currentProfile = data;
    return { data, error };
  },

  // Courses (read all, from cloud)
  fetchCourses: async ({ search = "", country = "", limit = 50 } = {}) => {
    // Primary path: locked-down search RPC (returns capped results; no bulk dump).
    try {
      const r = await supabase.rpc("search_courses", { p_query: search || "", p_limit: Math.min(limit || 20, 30) });
      if (!r.error && Array.isArray(r.data)) {
        let data = r.data;
        if (country) data = data.filter(c => (c.country || "") === country);
        return { data, error: null };
      }
    } catch (e) {}
    // Fallback (pre-lockdown): direct table read.
    let q = supabase.from("courses").select("*").limit(limit);
    if (search) q = q.ilike("name", `%${search}%`);
    if (country) q = q.eq("country", country);
    const { data, error } = await q;
    return { data: data || [], error };
  },

  fetchCourseById: async (id) => {
    try {
      const r = await supabase.rpc("get_course", { p_id: String(id) });
      if (!r.error && Array.isArray(r.data) && r.data.length) return { data: r.data[0], error: null };
      if (!r.error && Array.isArray(r.data)) return { data: null, error: null };
    } catch (e) {}
    const { data, error } = await supabase.from("courses").select("*").eq("id", id).single();
    return { data, error };
  },

  // Insert a new course (community contribution)
  addCourse: async (course) => {
    if (!currentSession) return { error: "Not logged in" };
    const payload = {
      ...course,
      contributed_by: currentSession.user.id,
      user_contributed: true,
    };
    const { data, error } = await supabase.from("courses").insert(payload).select().single();
    return { data, error };
  },

  // Set / change the signed-in user's password. No OLD password required — the
  // active session token authorises it (works for magic-link users who never had
  // a password). Hits the auth endpoint directly to avoid the getSession deadlock.
  setPassword: async (password) => {
    const token = await freshAccessToken();
    if (!token) return { error: "Not logged in" };
    try {
      const res = await fetch(SUPABASE_URL + "/auth/v1/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: "Bearer " + token },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: (data && (data.msg || data.error_description || data.message)) || ("Could not set password (" + res.status + ")") };
      return { data, error: null };
    } catch (e) { return { error: (e && e.message) || "Network error" }; }
  },

  /* =============================================================
     USER DATA SYNC - rounds, friends, rivalries, achievements
     ============================================================= */

  // PROFILE
  fetchMyProfile: async () => {
    if (!currentSession) return { error: "Not logged in" };
    return await supabase.from("profiles").select("*").eq("id", currentSession.user.id).single();
  },

  pushProfile: async (profile) => {
    if (!currentSession) return { error: "Not logged in" };
    const payload = {
      id: currentSession.user.id,
      name: profile.name,
      avatar_url: profile.avatar || null,
      home_club: profile.homeClub || null,
      started_year: profile.startedYear || null,
      target_hcp: profile.targetHcp || null,
      manual_hcp: profile.settings?.manualHcp ?? null,
      bio: profile.bio || null,
    };
    return await supabase.from("profiles").upsert(payload).select().single();
  },

  // ROUNDS
  fetchMyRounds: async () => {
    if (!currentSession) return { data: [], error: null };
    return await supabase.from("rounds").select("*").order("date", { ascending: false });
  },

  // Friends' completed rounds (shared feed) — via controlled RPC (accepted friends only)
  fetchFriendsRounds: async () => {
    if (!currentSession) return { data: [], error: null };
    return await supabase.rpc('get_friends_rounds', { p_limit: 80 });
  },

  pushRound: async (round) => {
    if (!currentSession) return { error: "Not logged in" };
    const payload = mapRoundLocalToCloud(round, currentSession.user.id);
    return await supabase.from("rounds").upsert(payload).select().single();
  },

  deleteRound: async (id) => {
    if (!currentSession) return { error: "Not logged in" };
    return await supabase.from("rounds").delete().eq("id", id);
  },

  // FRIENDS
  fetchMyFriends: async () => {
    if (!currentSession) return { data: [], error: null };
    return await supabase.from("friends").select("*").eq("user_id", currentSession.user.id);
  },

  pushFriend: async (friend) => {
    if (!currentSession) return { error: "Not logged in" };
    const payload = {
      id: ensureUuid(friend.id),
      user_id: currentSession.user.id,
      name: friend.name,
      hcp: friend.hcp ?? null,
      email: friend.email || null,
      status: friend.status || 'active',
    };
    return await supabase.from("friends").upsert(payload).select().single();
  },

  deleteFriend: async (id) => {
    if (!currentSession) return { error: "Not logged in" };
    return await supabase.from("friends").delete().eq("id", id);
  },

  // FRIEND INVITES (via email)
  sendFriendInvite: async ({ email, name, message }) => {
    if (!currentSession) return { error: "Not logged in" };
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) return { error: "Email required" };
    const { data: invite, error: inviteErr } = await supabase
      .from("friend_invites")
      .insert({
        sender_id: currentSession.user.id,
        invitee_email: cleanEmail,
        invitee_name: name || null,
        message: message || null,
      })
      .select()
      .single();
    if (inviteErr) return { error: inviteErr.message };
    // Local pending friend row (UI shows immediately, will get auto-linked when invitee registers)
    await supabase.from("friends").insert({
      user_id: currentSession.user.id,
      name: name || cleanEmail,
      email: cleanEmail,
      status: 'pending',
    });
    // Fire the magic-link email via Supabase Auth
    try {
      await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin + window.location.pathname,
          data: { invited_by: currentSession.user.id, invited_by_name: currentProfile?.name },
        },
      });
    } catch (e) {
      console.warn("[Fairway] OTP email may not have been sent:", e?.message);
    }
    return { data: invite, error: null };
  },

  listMyInvites: async () => {
    if (!currentSession) return { data: [], error: null };
    return await supabase
      .from("friend_invites")
      .select("*")
      .eq("inviter_id", currentSession.user.id)
      .order("invited_at", { ascending: false });
  },

  cancelInvite: async (inviteId) => {
    if (!currentSession) return { error: "Not logged in" };
    return await supabase.from("friend_invites").delete().eq("id", inviteId);
  },

  // RIVALRIES
  fetchMyRivalries: async () => {
    if (!currentSession) return { data: [], error: null };
    return await supabase.from("rivalries").select("*").eq("owner_id", currentSession.user.id);
  },

  pushRivalry: async (rivalry) => {
    if (!currentSession) return { error: "Not logged in" };
    const payload = {
      id: ensureUuid(rivalry.id),
      owner_id: currentSession.user.id,
      friend_id: rivalry.friendId,
      name: rivalry.name,
      start_date: rivalry.startDate,
      end_date: rivalry.endDate,
      format: rivalry.format,
      status: rivalry.status || 'active',
    };
    return await supabase.from("rivalries").upsert(payload).select().single();
  },

  deleteRivalry: async (id) => {
    if (!currentSession) return { error: "Not logged in" };
    return await supabase.from("rivalries").delete().eq("id", id);
  },

  // ACHIEVEMENTS
  fetchMyAchievements: async () => {
    if (!currentSession) return { data: [], error: null };
    return await supabase.from("achievements").select("*").eq("user_id", currentSession.user.id);
  },

  pushAchievement: async (trophyId) => {
    if (!currentSession) return { error: "Not logged in" };
    return await supabase.from("achievements").upsert({
      user_id: currentSession.user.id,
      trophy_id: trophyId,
    }, { onConflict: "user_id,trophy_id" });
  },

  // Direct client access for advanced needs
  raw: supabase,
};

/* =============================================================
   HELPERS
   ============================================================= */

function ensureUuid(id) {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return id;
  return crypto.randomUUID();
}

function mapRoundLocalToCloud(round, userId) {
  return {
    id: ensureUuid(round.id),
    user_id: userId,
    course_id: round.courseId || null,
    tee_name: round.teeName || null,
    date: round.date,
    tee_time: round.teeTime || null,
    score_type: round.scoreType || 'total',
    total: round.total || null,
    stableford: round.stableford || null,
    holes: round.holes || null,
    notes: round.notes || null,
    weather: round.weather || null,
    temp_cat: round.tempCat || null,
    wind_cat: round.windCat || null,
    sleep: round.sleep || null,
    alcohol: round.alcohol || null,
    warmup: round.warmup || null,
    transport: round.transport || null,
    friends: ((round.friendCloudIds && round.friendCloudIds.length) ? round.friendCloudIds : (round.friends || [])).filter(id => /^[0-9a-f-]{36}$/i.test(id)),
    opponent_score: round.opponentScore || null,
    opponent_differential: round.opponentDifferential || null,
    opponent_stableford: round.opponentStableford || null,
    opponent_holes: round.opponentHoles || null,
    rivalry_id: (round.rivalryId && /^[0-9a-f-]{36}$/i.test(round.rivalryId)) ? round.rivalryId : null,
    differential: round.differential || null,
    match_play: round.matchPlay || false,
    // Minigame / other-game fields
    game_kind: round.gameKind || 'golf',
    game_subtype: round.gameSubtype || null,
    game_label: round.gameLabel || null,
    game_icon: round.gameIcon || null,
    winner: round.winner || null,
    my_score: round.myScore != null ? String(round.myScore) : null,
    opp_score: round.oppScore != null ? String(round.oppScore) : null,
    counts_in_rivalry: round.countsInRivalry !== false, // default true
  };
}

// Expose mapper for the main app to convert cloud-> local
window.fairwayCloud.mapRoundCloudToLocal = function(cloud) {
  return {
    id: cloud.id,
    date: cloud.date,
    teeTime: cloud.tee_time,
    courseId: cloud.course_id,
    teeName: cloud.tee_name,
    scoreType: cloud.score_type,
    total: cloud.total,
    stableford: cloud.stableford,
    holes: cloud.holes,
    notes: cloud.notes,
    weather: cloud.weather,
    tempCat: cloud.temp_cat,
    windCat: cloud.wind_cat,
    sleep: cloud.sleep,
    alcohol: cloud.alcohol,
    warmup: cloud.warmup,
    transport: cloud.transport,
    friends: cloud.friends || [],
    opponentScore: cloud.opponent_score,
    opponentDifferential: cloud.opponent_differential,
    opponentStableford: cloud.opponent_stableford,
    opponentHoles: cloud.opponent_holes,
    rivalryId: cloud.rivalry_id,
    differential: cloud.differential,
    matchPlay: cloud.match_play || false,
    gameKind: cloud.game_kind || 'golf',
    gameSubtype: cloud.game_subtype,
    gameLabel: cloud.game_label,
    gameIcon: cloud.game_icon,
    winner: cloud.winner,
    myScore: cloud.my_score,
    oppScore: cloud.opp_score,
    countsInRivalry: cloud.counts_in_rivalry !== false,
  };
};

window.fairwayCloud.mapFriendCloudToLocal = function(cloud) {
  return {
    id: cloud.id,
    name: cloud.name,
    hcp: cloud.hcp,
    email: cloud.email || null,
    status: cloud.status || 'active',
    linkedProfile: cloud.linked_profile || null,
  };
};
// =====================================================================
// SOCIAL BACKEND v2 — friendships, leagues, live rounds, proposals, push
// Built for the FGL backend sprint (see FGL-backend-deploy.md for setup)
// =====================================================================

const FGL_SOCIAL = {
  _channels: new Map(),
  _subscribers: new Map(),

  // ===================== FRIENDSHIPS =====================
  async listFriendships() {
    if (!currentSession) return { data: [], error: null };
    const me = currentSession.user.id;
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id_a.eq.${me},user_id_b.eq.${me}`)
      .eq('status', 'accepted');
    if (error) return { data: [], error };
    const friends = (data || []).map(f => f.user_id_a === me ? f.user_id_b : f.user_id_a);
    if (!friends.length) return { data: [], error: null };
    const { data: profs } = await supabase.from('profiles').select('id,name,home_club,manual_hcp').in('id', friends);
    return { data: profs || [], error: null };
  },

  // Connect to an existing user by id -> create an accepted friendship (persists for both).
  async addFriendship(friendUserId) {
    if (!currentSession) return { error: 'Not signed in' };
    const me = currentSession.user.id;
    if (!friendUserId || friendUserId === me) return { error: 'Invalid friend' };
    const a = me < friendUserId ? me : friendUserId;
    const bb = me < friendUserId ? friendUserId : me;
    const { data, error } = await supabase.from('friendships')
      .upsert({ user_id_a: a, user_id_b: bb, created_by: me, status: 'accepted', accepted_at: new Date().toISOString() }, { onConflict: 'user_id_a,user_id_b' })
      .select().maybeSingle();
    return { data, error: error?.message };
  },

  async sendFriendInvite({ email, name }) {
    if (!currentSession) return { error: 'Not signed in' };
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return { error: 'Email required' };
    const { data, error } = await supabase.rpc('send_friend_invite', { invite_email: cleanEmail, invite_name: name || null });
    if (error) return { error: error.message };
    // Also send the magic-link signup email so they actually receive something
    try {
      await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin + window.location.pathname,
          data: { invited_by: currentSession.user.id, invited_by_name: currentProfile?.name, name },
        },
      });
    } catch (e) { console.warn('[FGL] friend OTP send failed:', e?.message); }
    return { data, error: null };
  },

  async findPlayer(q) {
    if (!currentSession) return { data: [], error: 'Not signed in' };
    const { data, error } = await supabase.rpc('find_player', { q: String(q || '') });
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  },

  async getMyRivalryNumber() {
    if (!currentSession) return null;
    const { data } = await supabase.from('profiles').select('rivalry_number').eq('id', currentSession.user.id).maybeSingle();
    return data?.rivalry_number ?? null;
  },

  async listPendingInvites() {
    if (!currentSession) return { data: [] };
    const { data } = await supabase.from('friend_invites').select('*').eq('inviter_id', currentSession.user.id).is('accepted_user_id', null);
    return { data: data || [] };
  },

  async deleteFriendship(friendUserId) {
    if (!currentSession) return { error: 'Not signed in' };
    const me = currentSession.user.id;
    const a = me < friendUserId ? me : friendUserId;
    const b = me < friendUserId ? friendUserId : me;
    return await supabase.from('friendships').delete().eq('user_id_a', a).eq('user_id_b', b);
  },

  subscribeFriendships(callback) {
    if (!currentSession) return () => {};
    const ch = supabase.channel('friendships-' + currentSession.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, payload => {
        try { callback(payload); } catch (e) { console.warn('friendships sub', e); }
      })
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch (e) {} };
  },

  // ===================== LEAGUES =====================
  async createLeague({ name, year }) {
    if (!currentSession) return { error: 'Not signed in' };
    // Generate unique code
    const code = await this._uniqueLeagueCode();
    const { data, error } = await supabase
      .from('leagues')
      .insert({ name, year, code, owner_id: currentSession.user.id })
      .select()
      .single();
    if (error) return { error: error.message };
    // Insert self as owner-member
    await supabase.from('league_members').insert({
      league_id: data.id,
      user_id: currentSession.user.id,
      name: currentProfile?.name || currentSession.user.email,
      role: 'owner',
      status: 'active',
    });
    return { data, error: null };
  },

  async _uniqueLeagueCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 20; i++) {
      let code = '';
      for (let j = 0; j < 6; j++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
      const { data } = await supabase.from('leagues').select('id').eq('code', code).maybeSingle();
      if (!data) return code;
    }
    throw new Error('Could not generate unique code');
  },

  async joinLeagueByCode(code) {
    if (!currentSession) return { error: 'Not signed in' };
    const { data, error } = await supabase.rpc('join_league_by_code', { code_in: code.toUpperCase() });
    if (error) return { error: error.message };
    return { data, error: null };
  },

  async listMyLeagues() {
    if (!currentSession) return { data: [] };
    const me = currentSession.user.id;
    const { data: mems } = await supabase.from('league_members').select('league_id, role, status').eq('user_id', me);
    if (!mems || !mems.length) return { data: [] };
    const ids = mems.map(m => m.league_id);
    const { data: lgs } = await supabase.from('leagues').select('*').in('id', ids);
    return { data: lgs || [] };
  },

  async listLeagueMembers(leagueId) {
    if (!currentSession) return { data: [] };
    const { data } = await supabase.from('league_members').select('*').eq('league_id', leagueId);
    return { data: data || [] };
  },

  async updateLeaguePeriod(leagueId, start, end) {
    return await supabase.from('leagues').update({ period_start: start, period_end: end }).eq('id', leagueId);
  },

  async removeLeagueMember(leagueId, userId) {
    return await supabase.from('league_members').delete().eq('league_id', leagueId).eq('user_id', userId);
  },

  async closeLeague(leagueId) {
    return await supabase.from('leagues').update({ closed_at: new Date().toISOString() }).eq('id', leagueId);
  },

  subscribeLeague(leagueId, callback) {
    const ch = supabase.channel('league-' + leagueId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'league_members', filter: `league_id=eq.${leagueId}` }, payload => {
        try { callback(payload); } catch (e) {}
      })
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch (e) {} };
  },

  // ===================== LIVE ROUNDS =====================
  async startLiveRound({ courseId, courseName, par, friends, holes, players, score_type }) {
    if (!currentSession) return { error: 'Not signed in' };
    const { data, error } = await supabase
      .from('live_rounds')
      .insert({
        user_id: currentSession.user.id,
        course_id: courseId,
        course_name: courseName,
        par,
        friends: friends || [],
        holes: holes || null,
        players: players || null,
        score_type: score_type || null,
        status: 'playing',
        current_hole: 1,
        thru: 0,
        rel_to_par: 0,
      })
      .select()
      .single();
    return { data, error: error?.message };
  },

  async updateLiveRound(id, fields) {
    if (!currentSession || !id) return {};
    const payload = { updated_at: new Date().toISOString() };
    ['current_hole','thru','rel_to_par','total','holes','players','score_type'].forEach(k => { if (fields && fields[k] != null) payload[k] = fields[k]; });
    return await supabase.from('live_rounds').update(payload).eq('id', id);
  },

  async abandonLiveRound(id) {
    if (!currentSession || !id) return {};
    return await supabase.from('live_rounds').update({ status: 'abandoned', completed_at: new Date().toISOString() }).eq('id', id);
  },

  async completeLiveRound(liveRoundId, { total, differential }) {
    return await supabase
      .from('live_rounds')
      .update({ status: 'completed', completed_at: new Date().toISOString(), total, differential })
      .eq('id', liveRoundId);
  },

  async listFriendsLiveRounds() {
    if (!currentSession) return { data: [] };
    // RLS allows us to see friends' rounds
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    const { data } = await supabase
      .from('live_rounds')
      .select('*')
      .gte('started_at', since)
      .order('started_at', { ascending: false });
    return { data: data || [] };
  },

  subscribeLiveRounds(callback) {
    if (!currentSession) return () => {};
    const ch = supabase.channel('live-rounds-' + currentSession.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rounds' }, payload => {
        try { callback(payload); } catch (e) {}
      })
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch (e) {} };
  },

  // ===================== RIVALRY PROPOSALS =====================
  async proposeStandings({ rivalryKey, opponentId, myScore, opponentScore }) {
    if (!currentSession) return { error: 'Not signed in' };
    const { data, error } = await supabase
      .from('rivalry_proposals')
      .insert({
        rivalry_key: rivalryKey,
        proposer_id: currentSession.user.id,
        proposer_score: myScore,
        opponent_id: opponentId,
        opponent_score: opponentScore,
      })
      .select()
      .single();
    return { data, error: error?.message };
  },

  // Per-round result sent for opponent approval. kind='round' => ADD to standing.
  async proposeRoundResult({ rivalryKey, opponentId, myDelta, oppDelta, note }) {
    if (!currentSession) return { error: 'Not signed in' };
    const { data, error } = await supabase
      .from('rivalry_proposals')
      .insert({
        rivalry_key: rivalryKey,
        proposer_id: currentSession.user.id,
        proposer_score: myDelta,
        opponent_id: opponentId,
        opponent_score: oppDelta,
        kind: 'round',
        note: note || null,
      })
      .select()
      .single();
    return { data, error: error?.message };
  },

  async resolveStandings(proposalId, resolution) {
    return await supabase
      .from('rivalry_proposals')
      .update({ resolution, resolved_at: new Date().toISOString() })
      .eq('id', proposalId);
  },

  async listPendingProposalsForMe() {
    if (!currentSession) return { data: [] };
    const { data } = await supabase
      .from('rivalry_proposals')
      .select('*')
      .eq('opponent_id', currentSession.user.id)
      .eq('resolution', 'pending');
    return { data: data || [] };
  },

  // Proposals I sent that are still waiting on the other person.
  async listMySentProposals() {
    if (!currentSession) return { data: [] };
    const { data } = await supabase
      .from('rivalry_proposals')
      .select('*')
      .eq('proposer_id', currentSession.user.id)
      .eq('resolution', 'pending');
    return { data: data || [] };
  },

  subscribeProposals(callback) {
    if (!currentSession) return () => {};
    const ch = supabase.channel('proposals-' + currentSession.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rivalry_proposals' }, payload => {
        try { callback(payload); } catch (e) {}
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_proposals' }, payload => {
        try { callback(payload); } catch (e) {}
      })
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch (e) {} };
  },

  // ===================== CHALLENGE PROPOSALS =====================
  async proposeChallengeResult({ rivalryKey, challengeId, challengeName, opponentId, winner, prizePoints }) {
    if (!currentSession) return { error: 'Not signed in' };
    const { data, error } = await supabase
      .from('challenge_proposals')
      .insert({
        rivalry_key: rivalryKey,
        challenge_id: challengeId,
        challenge_name: challengeName,
        proposer_id: currentSession.user.id,
        opponent_id: opponentId,
        proposed_winner: winner,
        prize_points: prizePoints || 1,
      })
      .select()
      .single();
    return { data, error: error?.message };
  },

  async resolveChallenge(proposalId, resolution) {
    return await supabase
      .from('challenge_proposals')
      .update({ resolution, resolved_at: new Date().toISOString() })
      .eq('id', proposalId);
  },

  // ===================== PUSH NOTIFICATIONS =====================
  // The VAPID public key — replace with your own (one-time setup)
  VAPID_PUBLIC_KEY: '', // TODO: set from your push server setup

  async enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { error: 'Push not supported on this browser' };
    }
    if (!this.VAPID_PUBLIC_KEY) {
      return { error: 'VAPID public key missing — see FGL-backend-deploy.md' };
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this._urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY),
        });
      }
      const key = sub.getKey ? btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))) : '';
      const auth = sub.getKey ? btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))) : '';
      await supabase.from('notification_subs').upsert({
        user_id: currentSession.user.id,
        endpoint: sub.endpoint,
        p256dh: key,
        auth_key: auth,
        device_label: navigator.userAgent.slice(0, 100),
      }, { onConflict: 'endpoint' });
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  },

  _urlBase64ToUint8Array(b64) {
    const padding = '='.repeat((4 - b64.length % 4) % 4);
    const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  },

  async listNotifications(limit = 20) {
    if (!currentSession) return { data: [] };
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentSession.user.id)
      .order('sent_at', { ascending: false })
      .limit(limit);
    return { data: data || [] };
  },

  async markNotificationRead(id) {
    return await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
  },

  subscribeNotifications(callback) {
    if (!currentSession) return () => {};
    const ch = supabase.channel('notifs-' + currentSession.user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentSession.user.id}` }, payload => {
        try { callback(payload.new); } catch (e) {}
      })
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch (e) {} };
  },
};

// Expose under fairwayCloud
Object.assign(window.fairwayCloud, FGL_SOCIAL);
// Expose internal helpers the app references
window.fairwayCloud.ensureUuid = ensureUuid;