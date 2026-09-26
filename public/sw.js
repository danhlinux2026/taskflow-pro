/* Service Worker for PWA */
const CACHE_NAME = 'taskflow-pro-v2';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache same-origin GET requests to app shell; skip manifest/icons
  // so the browser's PWA installability check is not intercepted.
  const { request } = event;
  const url = new URL(request.url);
  const isAppShell =
    request.method === 'GET' &&
    url.origin === location.origin &&
    (url.pathname === '/' || url.pathname.endsWith('.html'));

  if (!isAppShell) return; // let the browser handle everything else

  event.respondWith(
    caches.match(request)
      .then((response) => response || fetch(request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
