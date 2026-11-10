
const CACHE_NAME = 'aircraft-calc-v4';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

// INSTALL
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // الصفحة الرئيسية ضرورية
    await cache.add('./index.html');

    // الملفات الإضافية
    await Promise.allSettled(
      ASSETS
        .filter(file => file !== './index.html')
        .map(file => cache.add(file))
    );

    await self.skipWaiting();
  })());
});

// ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith('aircraft-calc-') &&
          key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

// FETCH
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);

        if (response.ok) {
          await cache.put('./index.html', response.clone());
        }

        return response;
      } catch {
        return await cache.match(request) ||
               await cache.match('./index.html');
      }
    }

    const cached = await cache.match(request);

    if (cached) return cached;

    try {
      return await fetch(request);
    } catch {
      return new Response('', { status: 503 });
    }
  })());
});
