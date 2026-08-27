// sw.js - Service Worker
// 快取名稱（更新版本時記得修改）
const CACHE_NAME = 'museum-web-game-v8';

// 需要快取的檔案列表（您的遊戲所有核心檔案）
const urlsToCache = [
  './',
  'index.html',
  'style.css',
  'css/defense-game.css',
  'css/memory-game.css',
  'css/catch-game.css',
  'css/station-demo-game.css',
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
  'js/minigames/DefenseLevels.js',
  'js/minigames/DefenseGameV2.js',
  'js/minigames/MemoryGameV2.js',
  'js/minigames/CatchGame.js',
  'js/minigames/StationDemoGame.js',

  // Catch game assets
  'assets/images/market.jpg',
  'assets/images/items/豆花.png',
  'assets/images/ch3/game/thin_mushroom.png',
  'assets/images/ch3/game/star_anise.png',
  'assets/images/ch3/game/white_pepper.png',
  'assets/images/ch3/game/black_pepper.png',
  'assets/images/ch3/game/broken_mushroom.png',

  // 如果有圖片資源（可選）
  'assets/images/title2.png',
  'assets/images/intro/封面.jpg',
  'assets/images/demo/entry-bg.png',
  'assets/images/station-fire/stove.png',
  'assets/images/station-fire/fire-small.png',
  'assets/images/station-fire/fire-large.png',
  'assets/images/station-fire/wood-small.png',
  'assets/images/station-fire/wood-large.png',
  'assets/images/ch1/background.png',
  'assets/images/characters/阿斗仔.png',
  'assets/images/ch2/background.png',
  'assets/images/ch2/bg.png',
  'assets/images/ch2/面板.png',
  'assets/images/ch2/資訊欄.png',
  'assets/images/ch2/卡背.png',

  // Level 1 需要的圖片
'assets/images/defense/level1/bg.png',
'assets/images/defense/level1/player.png',
'assets/images/defense/level1/enemy.png',
'assets/images/defense/level1/stone.png',
'assets/images/defense/level1/projectile.png',
'assets/images/defense/level1/projectile_hit.png',
'assets/images/defense/level1/shield.png',
'assets/images/defense/level1/aoe_line.png',

// Level 2 需要的圖片
'assets/images/defense/level2/bg.png',
'assets/images/defense/level2/player.png',
'assets/images/defense/level2/enemy.png',
'assets/images/defense/level2/stone.png',
'assets/images/defense/level2/projectile.png',
'assets/images/defense/level2/projectile_hit.png',
'assets/images/defense/level2/shield.png',
'assets/images/defense/level2/aoe_line.png',

// Level 3 需要的圖片
'assets/images/defense/level3/bg.png',
'assets/images/defense/level3/player.png',
'assets/images/defense/level3/enemy.png',
'assets/images/defense/level3/stone.png',
'assets/images/defense/level3/projectile.png',
'assets/images/defense/level3/projectile_hit.png',
'assets/images/defense/level3/shield.png',
'assets/images/defense/level3/aoe_line.png',
'assets/images/defense/level3/heavy_enemy.png',
  
  // chapter2 - 記憶遊戲需要的圖片
  'assets/images/memory/詹永豐米店.png',
  'assets/images/memory/其實豆製所.png',
  'assets/images/memory/彰化北斗肉圓.png',
  'assets/images/memory/正老店阿美.png',
  'assets/images/memory/阿在伯炸彈蔥油餅.png',
  'assets/images/memory/奠安宮楊記炸物.png',
  'assets/images/memory/碗粿.png',

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
