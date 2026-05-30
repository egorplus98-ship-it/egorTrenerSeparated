const CACHE_NAME = 'fitness-tracker-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/components.css',
    '/css/mobile.css',
    '/js/config.js',
    '/js/app.js',
    '/js/auth.js',
    '/js/db.js',
    '/js/modules/workouts.js',
    '/js/modules/nutrition.js',
    '/js/modules/charts.js',
    '/js/modules/history.js',
    '/js/modules/ui.js',
    '/js/utils/helpers.js',
    '/js/utils/constants.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});