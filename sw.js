/* Fairway service worker - versioned cache with update flow + Web Push */
const VERSION = 'fairway-v4-2026-06-16';
const PRECACHE = VERSION + '-precache';
const RUNTIME = VERSION + '-runtime';

const PRECACHE_URLS = [
  './',
  './index.html',
  './Golf Dashboard.html',
  './supabase-bridge.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './icon-maskable-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
];

// INSTALL — precache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE — clean old caches, take control
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// MESSAGE — page can ask SW to skip waiting (apply update immediately)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// FETCH — strategy by request type
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('golfcourseapi.com') ||
    url.pathname.startsWith('/v1/')
  ) {
    return;
  }

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(RUNTIME).then(c => c.put(req, clone));
        return res;
      }).catch(() =>
        caches.match(req)
          .then(r => r || caches.match('./index.html'))
          .then(r => r || caches.match('./Golf Dashboard.html'))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(RUNTIME).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// =====================================================================
// PUSH NOTIFICATIONS
// =====================================================================
self.addEventListener('push', event => {
  let data = { title: 'Fairway', body: '', url: '/' };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  const title = data.title || 'Fairway Golf League';
  const opts = {
    body: data.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: data.url || '/', kind: data.kind || 'generic', id: data.id || null },
    tag: data.tag || 'fgl-notif',
    renotify: !!data.renotify,
    vibrate: [80, 40, 80],
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Try focusing an existing window first
      for (const c of clients) {
        if ('focus' in c) {
          c.postMessage({ type: 'FGL_NOTIF_CLICK', data: event.notification.data });
          return c.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', event => {
  // Resubscribe automatically when the push subscription expires
  event.waitUntil(
    self.registration.pushManager.getSubscription().then(sub => {
      if (sub) return sub;
      // No way to resubscribe without the VAPID key here — page will handle on next open
    })
  );
});
