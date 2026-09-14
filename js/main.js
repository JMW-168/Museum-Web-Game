// 現行入口只保留模式選擇、PWA 安裝、場景切換與六個站點入口。
let gameMode = null;
let deferredInstallPrompt = null;
let waitingServiceWorker = null;
let isApplyingServiceWorkerUpdate = false;
let hasDismissedServiceWorkerUpdate = false;
let stationBackgroundPrefetchStarted = false;

const STATION_BACKGROUND_URLS = [
    'assets/images/station-fire/background.webp',
    'assets/images/station-tea/background.webp',
    'assets/images/station-cradle/background.webp',
    'assets/images/station-cake/background.webp'
];

function prefetchStationBackgrounds() {
    if (stationBackgroundPrefetchStarted || !window.LoadingManager?.prefetchImages) return;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection?.saveData || /(^|-)2g/.test(connection?.effectiveType || '')) return;

    stationBackgroundPrefetchStarted = true;
    const warmCache = () => LoadingManager.prefetchImages(STATION_BACKGROUND_URLS, { timeoutMs: 12000 })
        .catch((error) => window.Logger?.warn('關卡背景暖機失敗，進入關卡時仍會正常載入:', error));

    if ('requestIdleCallback' in window) window.requestIdleCallback(warmCache, { timeout: 800 });
    else setTimeout(warmCache, 200);
}

// ========== 多語系 ==========
// 繁體字型只在首次切到繁體時載入，避免簡體使用者（預設）付出多餘請求。
function ensureLocaleFont(locale) {
    if (locale !== 'zh-Hant' || document.getElementById('font-noto-serif-tc')) return;
    const link = document.createElement('link');
    link.id = 'font-noto-serif-tc';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;700&display=swap';
    document.head.appendChild(link);
}

function applyLocale(locale) {
    document.documentElement.setAttribute('lang', locale);
    ensureLocaleFont(locale);
    if (window.I18n) I18n.applyStatic();
    document.querySelectorAll('.lang-btn[data-lang]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.lang === locale);
        button.setAttribute('aria-pressed', String(button.dataset.lang === locale));
    });
    updateInstallButton();
}

function setupLanguageSwitch() {
    if (!window.I18n) return;
    I18n.onChange(applyLocale);
    document.querySelectorAll('.lang-btn[data-lang]').forEach((button) => {
        button.addEventListener('click', () => {
            window.AudioManager?.playSFX('assets/sounds/click.mp3');
            I18n.setLocale(button.dataset.lang);
        });
    });
    applyLocale(I18n.getLocale());
}

function updateAppViewportHeight() {
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
}

updateAppViewportHeight();
window.addEventListener('resize', updateAppViewportHeight);
window.addEventListener('orientationchange', () => setTimeout(updateAppViewportHeight, 250));
if (window.visualViewport) window.visualViewport.addEventListener('resize', updateAppViewportHeight);

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    updateInstallButton();
});

function isStandaloneDisplay() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIosSafari() {
    const userAgent = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(userAgent)
        || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    return isIosDevice && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(userAgent);
}

function showAgeSelect() {
    return new Promise((resolve) => {
        const dialog = document.getElementById('age-select-dialog');
        const childButton = document.getElementById('age-child');
        const adultButton = document.getElementById('age-adult');
        if (!dialog || !childButton || !adultButton) {
            resolve('adult');
            return;
        }

        dialog.style.display = 'flex';
        const chooseMode = (mode) => {
            window.AudioManager?.playSFX('assets/sounds/click.mp3');
            gameMode = mode;
            window.gameMode = mode;
            document.body.classList.toggle('child-mode', mode === 'child');
            dialog.style.display = 'none';
            resolve(mode);
        };

        childButton.onclick = () => chooseMode('child');
        adultButton.onclick = () => chooseMode('adult');
    });
}

function showScene(sceneId) {
    if (window.Logger) Logger.info('切換場景到:', sceneId);
    const isGameScene = sceneId === 'game-container';
    document.documentElement.classList.toggle('game-input-locked', isGameScene);
    document.body.classList.toggle('game-input-locked', isGameScene);
    if (window.SceneManager?.show) {
        SceneManager.show(sceneId);
    } else {
        document.querySelectorAll('.scene').forEach((scene) => {
            scene.style.display = 'none';
        });
        const target = document.getElementById(sceneId);
        if (target) target.style.display = 'flex';
    }
    if (sceneId === 'level-select') prefetchStationBackgrounds();
    updateServiceWorkerUpdateBanner();
}

function setupGameViewportGestureGuard() {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    const isNativeControl = (target) => target instanceof Element
        && target.closest('button, a, input, select, textarea, [contenteditable="true"]');
    const preventViewportGesture = (event) => event.preventDefault();
    let lastTouchEndAt = 0;

    // Safari 的 touch-action 支援不完整；遊戲畫面中補上非被動監聽，
    // 阻擋雙擊與縮放手勢。原生按鈕維持預設行為，其他遊戲區則不允許捲動。
    gameContainer.addEventListener('touchmove', (event) => {
        if (!isNativeControl(event.target)) event.preventDefault();
    }, { passive: false });
    gameContainer.addEventListener('touchend', (event) => {
        if (isNativeControl(event.target)) {
            lastTouchEndAt = 0;
            return;
        }
        const now = event.timeStamp;
        if (now - lastTouchEndAt < 350) event.preventDefault();
        lastTouchEndAt = now;
    }, { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend', 'dblclick'].forEach((type) => {
        gameContainer.addEventListener(type, preventViewportGesture, { passive: false });
    });
}

function setupInstallButton() {
    const installButton = document.getElementById('install-app-btn');
    const iosGuide = document.getElementById('ios-install-guide');
    if (!installButton) return;
    installButton.addEventListener('click', async () => {
        if (isIosSafari() && !isStandaloneDisplay()) {
            if (iosGuide) iosGuide.hidden = false;
            return;
        }
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        updateInstallButton();
    });
    iosGuide?.querySelector('[data-ios-install-close]')?.addEventListener('click', () => {
        iosGuide.hidden = true;
    });
    updateInstallButton();
}

function updateInstallButton() {
    const installButton = document.getElementById('install-app-btn');
    const iosGuide = document.getElementById('ios-install-guide');
    const shouldShowIosGuide = isIosSafari() && !isStandaloneDisplay();
    if (installButton) {
        installButton.hidden = (!deferredInstallPrompt && !shouldShowIosGuide) || isStandaloneDisplay();
        installButton.textContent = shouldShowIosGuide
            ? (window.t ? t('install.ios.label') : '加入主畫面')
            : (window.t ? t('install.label') : '安裝');
    }
    if (iosGuide) iosGuide.hidden = !shouldShowIosGuide;
}

function isUpdateSafeScene() {
    return ['start-menu', 'level-select'].some((sceneId) => {
        const scene = document.getElementById(sceneId);
        return scene && getComputedStyle(scene).display !== 'none';
    });
}

function updateServiceWorkerUpdateBanner() {
    const banner = document.getElementById('pwa-update-banner');
    if (!banner) return;
    banner.hidden = !waitingServiceWorker || hasDismissedServiceWorkerUpdate || !isUpdateSafeScene();
}

function setWaitingServiceWorker(worker) {
    waitingServiceWorker = worker;
    hasDismissedServiceWorkerUpdate = false;
    updateServiceWorkerUpdateBanner();
}

function setupServiceWorkerUpdate() {
    const updateButton = document.getElementById('pwa-update-now');
    const laterButton = document.getElementById('pwa-update-later');

    updateButton?.addEventListener('click', () => {
        if (!waitingServiceWorker || isApplyingServiceWorkerUpdate) return;
        isApplyingServiceWorkerUpdate = true;
        updateButton.disabled = true;
        waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    });

    laterButton?.addEventListener('click', () => {
        hasDismissedServiceWorkerUpdate = true;
        updateServiceWorkerUpdateBanner();
    });

    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (isApplyingServiceWorkerUpdate) window.location.reload();
    });

    navigator.serviceWorker.register('sw.js?v=127', { updateViaCache: 'none' })
        .then((registration) => {
            const inspectWorker = (worker) => {
                if (!worker) return;
                worker.addEventListener('statechange', () => {
                    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                        setWaitingServiceWorker(worker);
                    }
                });
            };

            if (registration.waiting) setWaitingServiceWorker(registration.waiting);
            inspectWorker(registration.installing);
            registration.addEventListener('updatefound', () => inspectWorker(registration.installing));
        })
        .catch((error) => console.warn('Service Worker 註冊失敗：', error));
}

function bindStationButtons() {
    document.querySelectorAll('[data-station]').forEach((button) => {
        button.addEventListener('click', () => {
            window.AudioManager?.playSFX('assets/sounds/click.mp3');
            if (typeof startStationGame === 'function') {
                startStationGame(button.dataset.station);
                return;
            }
            alert(window.t ? t('common.notLoaded') : '遊戲尚未載入，請重新整理頁面。');
        });
    });
}

function showExitConfirm(callback) {
    const dialog = document.getElementById('exit-confirm-dialog');
    const yesButton = document.getElementById('exit-confirm-yes');
    const noButton = document.getElementById('exit-confirm-no');
    if (!dialog || !yesButton || !noButton) {
        callback?.(confirm(window.t ? t('common.confirmExit') : '確定要離開遊戲嗎？'));
        return;
    }

    dialog.style.display = 'flex';
    const finish = (confirmed) => {
        window.AudioManager?.playSFX('assets/sounds/click.mp3');
        dialog.style.display = 'none';
        callback?.(confirmed);
    };
    yesButton.onclick = () => finish(true);
    noButton.onclick = () => finish(false);
}

document.addEventListener('DOMContentLoaded', async () => {
    updateAppViewportHeight();
    setupGameViewportGestureGuard();
    window.I18n?.init();
    setupLanguageSwitch();
    setupInstallButton();
    setupServiceWorkerUpdate();
    window.AudioManager?.init();
    window.SceneManager?.init();
    window.LoadingManager?.init();

    // 暫時停用進場的「選擇遊戲模式」畫面（小朋友版／一般版），目前用不到。要恢復就取消下面這行註解，並刪掉這行隱藏。
    // await showAgeSelect();
    const ageSelectDialog = document.getElementById('age-select-dialog');
    if (ageSelectDialog) ageSelectDialog.style.display = 'none';

    // 首頁 → 引導說明頁（土樓旁白 → 爺爺奶奶歡迎）→ 選擇遊戲頁
    document.getElementById('startBtn')?.addEventListener('click', () => {
        window.AudioManager?.playSFX('assets/sounds/click.mp3');
        showScene('intro');
    });

    document.getElementById('introNextBtn')?.addEventListener('click', () => {
        window.AudioManager?.playSFX('assets/sounds/click.mp3');
        showScene('intro-welcome');
    });

    document.getElementById('welcomeStartBtn')?.addEventListener('click', () => {
        window.AudioManager?.playSFX('assets/sounds/click.mp3');
        showScene('level-select');
    });

    document.getElementById('exitBtn')?.addEventListener('click', () => {
        showExitConfirm((confirmed) => {
            if (confirmed) window.close();
        });
    });

    bindStationButtons();
});
