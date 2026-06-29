const CACHE_NAME = 'minekakeibo-v20260629-05';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/category-icons/food.png',
  './assets/category-icons/breakfast.png',
  './assets/category-icons/lunch.png',
  './assets/category-icons/dinner.png',
  './assets/category-icons/snack.png',
  './assets/category-icons/drink.png',
  './assets/category-icons/alcohol.png',
  './assets/category-icons/fruit.png',
  './assets/category-icons/lottery.png',
  './assets/category-icons/withdraw.png',
  './assets/category-icons/deposit.png',
  './assets/category-icons/receive.png',
  './assets/category-icons/investment.png',
  './assets/category-icons/interest.png',
  './assets/category-icons/salary.png',
  './assets/category-icons/repayment.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => response)
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});
