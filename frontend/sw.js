const CACHE_NAME = 'keepinfit-v1.1.2-beta';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'css/global.css',
  'css/dieta.css',
  'css/treino.css',
  'css/evolucao.css',
  'js/navigation.js',
  'js/utils/storage.js',
  'js/utils/calculos.js',
  'js/utils/syncOffline.js',
  'js/services/authService.js',
  'js/services/geminiService.js',
  'js/services/sheetsService.js',
  'js/views/onboardingView.js',
  'js/views/dietaView.js',
  'js/views/treinoView.js',
  'js/views/evolucaoView.js',
  'js/views/configView.js',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// Instalação do Service Worker e pré-carregamento dos ficheiros
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativação e remoção automática de caches antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceção de pedidos de rede com suporte a offline
self.addEventListener('fetch', (event) => {
  // Ignora chamadas diretas às APIs externas do Google e Gemini
  if (
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('generativelanguage') ||
    event.request.url.includes('accounts.google.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});