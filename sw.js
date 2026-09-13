const CACHE_PREFIX = 'museum-web-game';
const RELEASE_VERSION = 'v114';
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${RELEASE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${RELEASE_VERSION}`;

const SHELL_ASSETS = [
  './', 'index.html', 'manifest.json',
  'style.css?v=114', 'css/station-demo-game.css?v=115', 'css/cake-station-game.css?v=71',
  'js/i18n/i18n.js?v=45', 'js/i18n/zh-Hant.js?v=114', 'js/i18n/zh-Hans.js?v=114',
  'js/core/Logger.js?v=114', 'js/core/ErrorReporter.js?v=114',
  'js/core/LoadingManager.js?v=114', 'js/core/AudioManager.js?v=114', 'js/core/SceneManager.js?v=114',
  'js/data/stationCombinedStory.js?v=54', 'js/data/station34CombinedStory.js?v=55',
  'js/data/cakePatterns.js?v=47', 'js/data/combinedStoryPacing.js?v=43',
  'js/minigames/StationIntroGuide.js?v=49', 'js/minigames/EndingScreen.js?v=52',
  'js/minigames/CradleStationGame.js?v=55', 'js/minigames/CakeStationGame.js?v=59',
  'js/minigames/Station34CombinedGame.js?v=61', 'js/minigames/StationDemoGame.js?v=79', 'js/main.js?v=114',
  'assets/icons/icon-16.png', 'assets/icons/icon-32.png', 'assets/icons/icon-64.png',
  'assets/icons/icon-128.png', 'assets/icons/icon-256.png', 'assets/images/title/cover-20260909.webp',
  'assets/images/title/title-20260904.png', 'assets/images/title/title-20260904-simplified.png',
  'assets/images/intro/tulou-20260907.webp', 'assets/images/intro/courtyard-welcome-20260907.webp',
  'assets/images/demo/entry-background.webp', 'assets/images/characters/grandma.png',
  'assets/images/characters/grandpa.png', 'assets/sounds/click.mp3', 'assets/sounds/wrong.mp3',
  'assets/sounds/sfx-blipmale.wav', 'assets/sounds/sfx-blipfemale.wav'
];

const toAppUrl = (asset) => new URL(asset, self.registration.scope).href;
const SHELL_URLS = new Set(SHELL_ASSETS.map(toAppUrl));
const SHELL_INDEX_URL = toAppUrl('index.html');

function isCacheable(response) {
  return response && response.ok && response.status === 200 && response.type !== 'opaque';
}

function isRuntimeAssetRequest(request) {
  return ['image', 'font', 'audio', 'video'].includes(request.destination)
    && !request.headers.has('range');
}

async function cacheFirst(cacheName, request, event) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) event.waitUntil(cache.put(request, response.clone()));
  return response;
}

async function networkWithCacheFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function navigationResponse(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cachedIndex = await cache.match(SHELL_INDEX_URL);
  if (cachedIndex) return cachedIndex;

  try {
    return await fetch(request);
  } catch (error) {
    return new Response('目前無法連線，請在有網路時先開啟遊戲一次。', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => {
    const requests = SHELL_ASSETS.map((asset) => new Request(toAppUrl(asset), { cache: 'reload' }));
    return cache.addAll(requests);
  }));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((cacheNames) => Promise.all(cacheNames
      .filter((cacheName) => cacheName.startsWith(`${CACHE_PREFIX}-`)
        && cacheName !== SHELL_CACHE && cacheName !== RUNTIME_CACHE)
      .map((cacheName) => caches.delete(cacheName))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
  } else if (SHELL_URLS.has(url.href)) {
    event.respondWith(cacheFirst(SHELL_CACHE, request, event));
  } else if (isRuntimeAssetRequest(request)) {
    event.respondWith(cacheFirst(RUNTIME_CACHE, request, event));
  } else {
    event.respondWith(networkWithCacheFallback(request));
  }
});
