// sw.js - Service Worker
// 快取名稱（更新版本時記得修改）
const CACHE_NAME = 'museum-web-game-v34';

// 只預快取核心殼層；大型圖片改由 fetch 時漸進快取，避免手機更新時卡在 loading。
const urlsToCache = [
  './',
  'index.html',
  'style.css',
  'css/defense-game.css',
  'css/memory-game.css',
  'css/catch-game.css',
  'css/station-demo-game.css',
  'css/cake-station-game.css',
  'js/main.js',
  'js/core/LoadingManager.js',
  'js/core/GameEngine.js',
  'js/core/AudioManager.js',
  'js/core/SceneManager.js',
  'js/data/minigameAssets.js',
  'js/core/Typewriter.js',
  'js/core/DialogueSystem.js',
  'js/core/GallerySystem.js',
  'js/core/CollectionSystem.js',
  'js/data/intro.js',
  'js/data/chapter1_teen.js',
  'js/data/chapter1_child.js',
  'js/data/chapter2_teen.js',
  'js/data/chapter2_child.js',
  'js/data/quizQuestions.js',
  'js/data/stationCombinedStory.js',
  'js/data/cakePatterns.js',
  'js/minigames/DefenseLevels.js',
  'js/minigames/DefenseGameV2.js',
  'js/minigames/MemoryGameV2.js',
  'js/minigames/CatchGame.js',
  'js/minigames/CakeStationGame.js',
  'assets/images/station-cake/pattern-peach.svg',
  'js/minigames/StationDemoGame.js',
];

// ========== 安裝 Service Worker ==========
self.addEventListener('install', event => {
  console.log('📦 Service Worker 安裝中');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ 快取檔案中...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('❌ 快取失敗:', err);
      })
  );
  self.skipWaiting();
});
// ========== 攔截請求並從快取回應 ==========
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isLocalAsset = requestUrl.origin === self.location.origin;
  const isImage = event.request.destination === 'image';

  if (isLocalAsset && isImage) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const networkUpdate = fetch(event.request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        });

        if (cachedResponse) {
          event.waitUntil(networkUpdate.catch(() => undefined));
          return cachedResponse;
        }
        return networkUpdate;
      })
    );
    return;
  }

  if (isLocalAsset) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 找到快取就直接回傳
        if (response) {
          return response;
        }
        // 沒找到就去網路抓
        return fetch(event.request);
      })
  );
});

// ========== 更新 Service Worker ==========
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker 啟動');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 刪除舊版本快取
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
