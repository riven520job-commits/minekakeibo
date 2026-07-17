const CACHE_NAME = 'minekakeibo-v20260718-01';
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
  './assets/category-icons/repayment.png',
  './assets/phosphor/airplane.svg',
  './assets/phosphor/arrow-circle-down.svg',
  './assets/phosphor/arrow-circle-up.svg',
  './assets/phosphor/arrows-clockwise.svg',
  './assets/phosphor/arrows-left-right.svg',
  './assets/phosphor/bank.svg',
  './assets/phosphor/bicycle.svg',
  './assets/phosphor/boat.svg',
  './assets/phosphor/books.svg',
  './assets/phosphor/bread.svg',
  './assets/phosphor/bus.svg',
  './assets/phosphor/calendar.svg',
  './assets/phosphor/car.svg',
  './assets/phosphor/chart-line-up.svg',
  './assets/phosphor/circle.svg',
  './assets/phosphor/clock.svg',
  './assets/phosphor/coffee.svg',
  './assets/phosphor/coins.svg',
  './assets/phosphor/cookie.svg',
  './assets/phosphor/credit-card.svg',
  './assets/phosphor/device-mobile.svg',
  './assets/phosphor/dots-three.svg',
  './assets/phosphor/download-simple.svg',
  './assets/phosphor/drop.svg',
  './assets/phosphor/film-strip.svg',
  './assets/phosphor/first-aid-kit.svg',
  './assets/phosphor/flame.svg',
  './assets/phosphor/folder.svg',
  './assets/phosphor/fork-knife.svg',
  './assets/phosphor/game-controller.svg',
  './assets/phosphor/gas-pump.svg',
  './assets/phosphor/gear.svg',
  './assets/phosphor/gift.svg',
  './assets/phosphor/hamburger.svg',
  './assets/phosphor/hand-coins.svg',
  './assets/phosphor/handbag.svg',
  './assets/phosphor/handshake.svg',
  './assets/phosphor/house.svg',
  './assets/phosphor/laptop.svg',
  './assets/phosphor/leaf.svg',
  './assets/phosphor/lightning.svg',
  './assets/phosphor/martini.svg',
  './assets/phosphor/microphone-stage.svg',
  './assets/phosphor/money.svg',
  './assets/phosphor/motorcycle.svg',
  './assets/phosphor/music-notes.svg',
  './assets/phosphor/orange.svg',
  './assets/phosphor/park.svg',
  './assets/phosphor/paint-brush.svg',
  './assets/phosphor/pencil-simple.svg',
  './assets/phosphor/percent.svg',
  './assets/phosphor/pill.svg',
  './assets/phosphor/pizza.svg',
  './assets/phosphor/shopping-cart.svg',
  './assets/phosphor/sparkle.svg',
  './assets/phosphor/storefront.svg',
  './assets/phosphor/student.svg',
  './assets/phosphor/t-shirt.svg',
  './assets/phosphor/tag.svg',
  './assets/phosphor/ticket.svg',
  './assets/phosphor/tooth.svg',
  './assets/phosphor/train-simple.svg',
  './assets/phosphor/train.svg',
  './assets/phosphor/trash.svg',
  './assets/phosphor/trend-up.svg',
  './assets/phosphor/user.svg',
  './assets/phosphor/users-three.svg',
  './assets/phosphor/wallet.svg',
  './assets/phosphor/wifi-high.svg',
  './assets/phosphor/wine.svg',
  './assets/custom-icons/advance-payment.png',
  './assets/custom-icons/appliance.png',
  './assets/custom-icons/bbq.png',
  './assets/custom-icons/beauty.png',
  './assets/custom-icons/books.png',
  './assets/custom-icons/cleaning.png',
  './assets/custom-icons/clinic.png',
  './assets/custom-icons/course.png',
  './assets/custom-icons/daily-goods.png',
  './assets/custom-icons/daily-necessities.png',
  './assets/custom-icons/dentist.png',
  './assets/custom-icons/dessert.png',
  './assets/custom-icons/dining-party.png',
  './assets/custom-icons/eat-out.png',
  './assets/custom-icons/electricity.png',
  './assets/custom-icons/exam.png',
  './assets/custom-icons/exhibition.png',
  './assets/custom-icons/fitness.png',
  './assets/custom-icons/furniture.png',
  './assets/custom-icons/gas-bill.png',
  './assets/custom-icons/guesthouse.png',
  './assets/custom-icons/health-check.png',
  './assets/custom-icons/hotel.png',
  './assets/custom-icons/insurance.png',
  './assets/custom-icons/internet.png',
  './assets/custom-icons/life.png',
  './assets/custom-icons/medicine.png',
  './assets/custom-icons/metro.png',
  './assets/custom-icons/milk.png',
  './assets/custom-icons/movie.png',
  './assets/custom-icons/music.png',
  './assets/custom-icons/night-club.png',
  './assets/custom-icons/pet.png',
  './assets/custom-icons/rebate.png',
  './assets/custom-icons/rent.png',
  './assets/custom-icons/repair.png',
  './assets/custom-icons/shoes-bags.png',
  './assets/custom-icons/stationery.png',
  './assets/custom-icons/subscription.png',
  './assets/custom-icons/sushi.png',
  './assets/custom-icons/taxi.png',
  './assets/custom-icons/telecom.png',
  './assets/custom-icons/theme-park.png',
  './assets/custom-icons/water-bill.png',
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
