 const filesToCache = [
  '/',
  '/images/icon-152.png',
  '/index.html',
  '/registar.html',
  '/css/style.css',
  '/js/main.js',
  '/js/jquery.js',
  '/manifest.json'
];
const staticCacheName = 'letmefix-app';
self.addEventListener('install', event => {
  console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll(filesToCache);
    })
  );
});

 
/* Serve cached content when offline */
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
}); 