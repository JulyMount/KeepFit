const CACHE_NAME = 'fitapp-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/global.css',
  '/css/dieta.css',
  '/css/treino.css',
  '/css/evolucao.css',
  '/js/navigation.js',
  '/js/utils/storage.js',
  '/js/utils/calculos.js',
  '/js/utils/syncOffline.js',
  '/js/services/authService.js',
  '/js/services/geminiService.js',
  '/js/services/sheetsService.js',
  '/js/views/dietaView.js',
  '/js/views/treinoView.js',
  '/js/views/evolucaoView.js',
  '/js/views/configView.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});