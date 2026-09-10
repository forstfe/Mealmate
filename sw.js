const CACHE = 'mealmate-rebuild-1';
const ASSETS = ['./','index.html','styles.css?v=20260910','app.js?v=20260910','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(res => {
    const clone = res.clone();
    caches.open(CACHE).then(c => c.put(event.request, clone));
    return res;
  }).catch(() => caches.match(event.request).then(r => r || caches.match('./'))));
});
