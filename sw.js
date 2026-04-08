const CACHE = 'naruto-td-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/data/ninjaData.js',
  './src/data/enemyData.js',
  './src/data/levels.js',
  './src/entities/Ninja.js',
  './src/entities/Enemy.js',
  './src/entities/Projectile.js',
  './src/systems/GridSystem.js',
  './src/systems/WaveSystem.js',
  './src/systems/EconomySystem.js',
  './src/scenes/BootScene.js',
  './src/scenes/MenuScene.js',
  './src/scenes/GameScene.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
