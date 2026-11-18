// rubber-duck service worker: cache-first app shell for full offline use.
//
// RELEASING: bump CACHE_VERSION whenever any file in public/ changes, and add
// any new files to ASSETS. Otherwise installed apps keep serving the old cache.

const CACHE_VERSION = 'v6';
const CACHE_NAME = `rubber-duck-${CACHE_VERSION}`;

// Paths are relative to this file, so the app works under a GitHub Pages sub-path.
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/router.js',
  './js/db.js',
  './js/dates.js',
  './js/moods.js',
  './js/settings.js',
  './js/reminder.js',
  './js/ui.js',
  './js/components.js',
  './js/views/today.js',
  './js/views/entries.js',
  './js/views/entry-detail.js',
  './js/views/settings.js',
  './js/views/calendar.js',
  './js/dev-seed.js',
  './icons/icon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('rubber-duck-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // Navigations (including ones with a query string) get the cached app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => cached || fetch(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => cached || fetch(request))
  );
});
