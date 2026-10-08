/* CESTUS CONTROL offline shell for https://itssoren.github.io/games/CESTUS/ */
const CACHE_VERSION = 'cestus-static-v41';
const CORE_ASSETS = [
  './',
  './index.html',
  './cestus.png',
  './css/style.css',
  './js/config.js',
  './js/content-expansion.js',
  './js/balance.js',
  './js/state.js',
  './js/audio.js',
  './js/directives.js',
  './js/graphics.js',
  './js/responsive.js',
  './js/spatial.js',
  './js/grid.js',
  './js/energy.js',
  './js/camera.js',
  './js/particles.js',
  './js/modules.js',
  './js/enemies.js',
  './js/combat.js',
  './js/waves.js',
  './js/patrol.js',
  './js/renderer.js',
  './js/ui.js',
  './js/input.js',
  './js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('cestus-static-') && key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(cache => cache.match(request, { ignoreSearch: true })).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.open(CACHE_VERSION).then(cache => cache.match(new URL('./index.html', self.registration.scope), { ignoreSearch: true }));
        return Response.error();
      });
    })
  );
});
