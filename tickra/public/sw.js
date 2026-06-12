// TICKRA-PHASE-6: lightweight service worker.
// Strategy:
//  - HTML pages → network-first (always serve latest when online), fall back
//    to the cached copy if offline so previously visited lessons still open.
//  - Static assets (Next chunks, fonts, images) → cache-first with revalidate.
//  - API routes → never cached (always network, never break entitlement).
//
// Cache name bumps invalidate the previous SW cache on next install.

const CACHE = 'tickra-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(['/', '/fr', '/en', '/manifest.webmanifest', '/favicon.svg']),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

function isApi(url) {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.webp')
  );
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (isApi(url)) return; // hands it back to default network handling
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    // cache-first
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return res;
        });
      }),
    );
    return;
  }

  // HTML / data — network-first, offline fallback to cache.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && res.headers.get('content-type')?.includes('text/html')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached ?? caches.match('/')),
      ),
  );
});
