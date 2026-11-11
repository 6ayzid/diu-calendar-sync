const CACHE_NAME = 'diu-routine-shell-v5.1';
const PRECACHE_URLS = [
  '/',
  '/docs',
  '/icon.svg',
  '/manifest.json',
  '/api/offline-bundle',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('diu-routine-shell-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. Static Next.js chunks, fonts, and icons: Cache-First with background update
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })
    );
    return;
  }

  // 2. HTML Document Navigations & API JSON requests: Network-First with Cache Fallback
  if (request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
              if (request.mode === 'navigate' && url.pathname === '/') {
                cache.put('/', res.clone());
              }
            });
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const exactMatch = await cache.match(request);
          if (exactMatch) return exactMatch;
          const ignoreSearchMatch = await cache.match(request, { ignoreSearch: true });
          if (ignoreSearchMatch) return ignoreSearchMatch;
          if (request.mode === 'navigate') {
            const rootMatch = await cache.match('/');
            if (rootMatch) return rootMatch;
          }
          return new Response(JSON.stringify({ success: false, offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
  }
});
