// Service Worker SymbioNexus — cache "app shell" léger pour l'installabilité PWA + mode hors-ligne basique
const CACHE = 'symbionexus-v1';
const APP_SHELL = ['/', '/dashboard', '/login', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // On ne touche pas aux appels API (toujours réseau)
  if (request.method !== 'GET' || request.url.includes('/api/')) return;

  // Navigations : réseau d'abord, repli sur le cache (offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match('/dashboard')))
    );
    return;
  }

  // Autres GET : cache d'abord, sinon réseau (puis on met en cache)
  event.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return resp;
      }).catch(() => cached)
    )
  );
});
