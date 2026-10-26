// 現行入口只保留模式選擇、PWA 安裝、場景切換與六個站點入口。
let gameMode = null;
let deferredInstallPrompt = null;
let waitingServiceWorker = null;
let isApplyingServiceWorkerUpdate = false;
let hasDismissedServiceWorkerUpdate = false;

// 僅在業主交付站送出 GA4，開發與測試 Pages 不會污染正式使用數據。
const GA4_MEASUREMENT_ID = 'G-PKVJPFCPDZ';
const GA4_ALLOWED_HOST = 'persatuankebudayaanhakkagame-gif.github.io';
const GA4_LABELS = {
    event: {
        home_start_click: '首頁：開始體驗',
        experience_entry_click: '入口點擊',
        station_started: '關卡開始',
        station_completed: '關卡完成',
        station_abandoned: '中途離開',
        station_retry: '再次遊玩',
        story_started: '完整劇情開始',
        story_completed: '完整劇情完成',
        story_abandoned: '完整劇情中途離開'
    },
    station: {
        fire: '第一關：灶台生火',
        tea: '第二關：擂茶料理',
        cradle: '第三關：搖籃哄睡',
        cake: '第四關：紅粄製作'
    },
    entry: {
        fire: '第一關：灶台生火',
        tea: '第二關：擂茶料理',
        cradle: '第三關：搖籃哄睡',
        cake: '第四關：紅粄製作',
        story: '完整劇情體驗',
        collection: '客家老物件徵集'
    },
    entryType: {
        game: '遊戲入口',
        collection: '徵集活動'
    },
    entrySource: {
        level_select: '選擇遊戲頁',
        ending: '通關畫面'
    },
    playMode: {
        standalone: '單關體驗',
        full_story: '完整劇情體驗',
        combined: '第一二關串連',
        combined34: '第三四關串連'
    },
    exitMethod: {
        completed: '完成關卡',
        leave_button: '主動離開',
        page_hidden: '離開頁面／關閉或重整',
        station_switch: '切換關卡'
    },
    journeyStage: {
        story_intro: '開場對話',
        fire: '第一關：灶台生火',
        after_fire: '第一關成果／前往第二關',
        tea: '第二關：擂茶料理',
        after_tea: '第二關成果／前往第三關',
        cradle: '第三關：搖籃哄睡',
        after_cradle: '第三關成果／前往第四關',
        cake: '第四關：紅粄製作',
        after_cake: '第四關成果／旅程收尾'
    },
    language: {
        'zh-Hant': '繁體中文',
        'zh-Hans': '簡體中文'
    }
};

function ga4Label(group, rawValue) {
    const labels = GA4_LABELS[group];
    return labels && Object.prototype.hasOwnProperty.call(labels, rawValue)
        ? labels[rawValue]
        : rawValue;
}

function isGa4Enabled() {
    return window.location.hostname === GA4_ALLOWED_HOST;
}

function initGa4() {
    if (!isGa4Enabled()) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID);

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);
}

function trackGa4Event(eventName, parameters = {}) {
    if (!isGa4Enabled() || typeof window.gtag !== 'function') return;
    const language = window.I18n?.getLocale?.() || document.documentElement.lang;
    const labels = {
        event_label: ga4Label('event', eventName),
        language_label: ga4Label('language', language)
    };
    if (Object.prototype.hasOwnProperty.call(parameters, 'station_id')) {
        labels.station_label = ga4Label('station', parameters.station_id);
    }
    if (Object.prototype.hasOwnProperty.call(parameters, 'entry_id')) {
        labels.entry_label = ga4Label('entry', parameters.entry_id);
    }
    if (Object.prototype.hasOwnProperty.call(parameters, 'entry_type')) {
        labels.entry_type_label = ga4Label('entryType', parameters.entry_type);
    }
    if (Object.prototype.hasOwnProperty.call(parameters, 'entry_source')) {
        labels.entry_source_label = ga4Label('entrySource', parameters.entry_source);
    }
    if (Object.prototype.hasOwnProperty.call(parameters, 'play_mode')) {
        labels.play_mode_label = ga4Label('playMode', parameters.play_mode);
    }
    if (Object.prototype.hasOwnProperty.call(parameters, 'exit_method')) {
        labels.exit_method_label = ga4Label('exitMethod', parameters.exit_method);
    }
    if (Object.prototype.hasOwnProperty.call(parameters, 'journey_stage')) {
        labels.journey_stage_label = ga4Label('journeyStage', parameters.journey_stage);
    }
    window.gtag('event', eventName, {
        language,
        ...parameters,
        ...labels
    });
}

window.trackGa4Event = trackGa4Event;

// 完整劇情的生命週期獨立於單關計時，才能涵蓋對話、成果頁與關卡之間的離開。
const FullStoryAnalytics = {
    activeJourney: null,

    start() {
        if (!isGa4Enabled()) return;
        if (this.activeJourney) this.abandon('station_switch');
        this.activeJourney = {
            startedAt: performance.now(),
            stage: 'story_intro',
            completedStations: new Set()
        };
        trackGa4Event('story_started', this.payload());
    },

    enterStation(stationId) {
        if (!this.activeJourney) return;
        this.activeJourney.stage = stationId;
    },

    completeStation(stationId) {
        if (!this.activeJourney) return;
        this.activeJourney.completedStations.add(stationId);
        this.activeJourney.stage = `after_${stationId}`;
    },

    complete() {
        if (!this.activeJourney) return;
        trackGa4Event('story_completed', this.payload());
        this.activeJourney = null;
    },

    abandon(exitMethod = 'leave_button') {
        if (!this.activeJourney) return;
        trackGa4Event('story_abandoned', {
            ...this.payload(),
            exit_method: exitMethod
        });
        this.activeJourney = null;
    },

    payload() {
        const journey = this.activeJourney;
        return {
            play_mode: 'full_story',
            journey_stage: journey?.stage || 'story_intro',
            completed_station_count: journey?.completedStations.size || 0,
            journey_duration_seconds: journey
                ? Math.max(0, Math.round((performance.now() - journey.startedAt) / 1000))
                : 0
        };
    }
};

window.FullStoryAnalytics = FullStoryAnalytics;

// 一次實際遊玩只會有一筆結束事件：完成、主動離開與離開頁面都會收尾。
// 重玩次數維持在目前分頁，避免把不同造訪日的同一位玩家誤判為連續重玩。
const GameAnalytics = {
    activeRun: null,
    attemptCounts: new Map(),

    start(stationId, playMode = 'standalone') {
        if (!isGa4Enabled()) return;
        if (this.activeRun) this.end('abandoned', 'station_switch');

        const key = `${stationId}:${playMode}`;
        const attemptNumber = (this.attemptCounts.get(key) || 0) + 1;
        this.attemptCounts.set(key, attemptNumber);
        this.activeRun = { stationId, playMode, attemptNumber, startedAt: performance.now() };
        if (playMode === 'full_story') FullStoryAnalytics.enterStation(stationId);
        trackGa4Event('station_started', {
            station_id: stationId,
            play_mode: playMode,
            attempt_number: attemptNumber
        });
        if (attemptNumber > 1) {
            trackGa4Event('station_retry', {
                station_id: stationId,
                play_mode: playMode,
                attempt_number: attemptNumber
            });
        }
    },

    complete(stationId) {
        const run = this.activeRun;
        this.end('completed', 'completed', stationId);
        if (run && (!stationId || run.stationId === stationId) && run.playMode === 'full_story') {
            FullStoryAnalytics.completeStation(run.stationId);
        }
    },

    abandon(exitMethod = 'leave_button', stationId) {
        this.end('abandoned', exitMethod, stationId);
    },

    end(status, exitMethod, stationId) {
        const run = this.activeRun;
        if (!run || (stationId && run.stationId !== stationId)) return;
        const durationSeconds = Math.max(0, Math.round((performance.now() - run.startedAt) / 1000));
        trackGa4Event(status === 'completed' ? 'station_completed' : 'station_abandoned', {
            station_id: run.stationId,
            play_mode: run.playMode,
            attempt_number: run.attemptNumber,
            duration_seconds: durationSeconds,
            exit_method: exitMethod
        });
        this.activeRun = null;
    }
};

window.GameAnalytics = GameAnalytics;
// 關閉分頁、重新整理或切到別處時，以 pagehide 做最佳努力的中途離開紀錄。
window.addEventListener('pagehide', () => {
    GameAnalytics.abandon('page_hidden');
    FullStoryAnalytics.abandon('page_hidden');
});
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

function resetWelcomeIntro() {
    const welcome = document.getElementById('intro-welcome');
    const hosts = welcome?.querySelector('.intro-hosts');
    const line = welcome?.querySelector('[data-welcome-line]');
    const knock = document.getElementById('welcomeKnockBtn');
    const replies = welcome?.querySelector('[data-welcome-replies]');
    const reply = welcome?.querySelector('[data-welcome-reply]');
    const enterWrap = welcome?.querySelector('[data-welcome-enter-wrap]');
    const enter = document.getElementById('welcomeStartBtn');
    if (!welcome || !line || !knock || !replies || !reply || !enterWrap || !enter) return;

    welcome.classList.remove('is-entering');
    hosts?.classList.add('is-hidden');
    welcome.dataset.conversationStep = '0';
    line.dataset.i18n = 'welcome.arrival';
    line.textContent = window.t ? t('welcome.arrival') : '時光機到站了，這裡是50年前的客家土樓。\n你是來做客的旅人，先敲敲門，看看誰在家吧！';
    reply.dataset.i18n = 'welcome.reply.identity';
    reply.textContent = window.t ? t('welcome.reply.identity') : '你好，我是旅行經過這裡的人，請問這裡是哪裡呢？';
    knock.hidden = false;
    knock.disabled = false;
    replies.hidden = true;
    enterWrap.hidden = true;
    enter.disabled = false;
}

function setupWelcomeIntro() {
    const welcome = document.getElementById('intro-welcome');
    const hosts = welcome?.querySelector('.intro-hosts');
    const line = welcome?.querySelector('[data-welcome-line]');
    const knock = document.getElementById('welcomeKnockBtn');
    const replies = welcome?.querySelector('[data-welcome-replies]');
    const reply = welcome?.querySelector('[data-welcome-reply]');
    const enterWrap = welcome?.querySelector('[data-welcome-enter-wrap]');
    const enter = document.getElementById('welcomeStartBtn');
    if (!welcome || !line || !knock || !replies || !reply || !enterWrap || !enter) return;

    knock.addEventListener('click', () => {
        window.AudioManager?.playSFX('assets/sounds/click.mp3');
        knock.hidden = true;
        hosts?.classList.remove('is-hidden');
        welcome.dataset.conversationStep = '1';
        line.dataset.i18n = 'welcome.question';
        line.textContent = window.t ? t('welcome.question') : '你好～請問你是誰？';
        replies.hidden = false;
    });

    reply.addEventListener('click', () => {
        window.AudioManager?.playSFX('assets/sounds/click.mp3');
        const step = welcome.dataset.conversationStep;
        if (step === '1') {
            line.dataset.i18n = 'welcome.response.identity';
            line.textContent = window.t ? t('welcome.response.identity') : '你好呀！這裡是客家土樓，是我們一家人生活的地方。';
            reply.dataset.i18n = 'welcome.reply.interest';
            reply.textContent = window.t ? t('welcome.reply.interest') : '原來如此，這裡看起來好特別！';
            welcome.dataset.conversationStep = '2';
            return;
        }
        if (step === '2') {
            line.dataset.i18n = 'welcome.response.invite';
            line.textContent = window.t ? t('welcome.response.invite') : '是呀，這裡有好多客家人的生活故事。歡迎你呀～來裡面坐～';
            replies.hidden = true;
            enterWrap.hidden = false;
            welcome.dataset.conversationStep = '3';
        }
    });

    enter.addEventListener('click', () => {
        if (enter.disabled) return;
        window.AudioManager?.playSFX('assets/sounds/click.mp3');
        enter.disabled = true;
        welcome.classList.add('is-entering');
        window.setTimeout(() => showScene('level-select'), 520);
    });
    resetWelcomeIntro();
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

    navigator.serviceWorker.register('sw.js?v=142', { updateViaCache: 'none' })
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
            const stationId = button.dataset.station;
            trackGa4Event('experience_entry_click', {
                entry_id: stationId,
                entry_type: 'game',
                entry_source: 'level_select'
            });
            window.AudioManager?.playSFX('assets/sounds/click.mp3');
            if (typeof startStationGame === 'function') {
                if (stationId === 'story') FullStoryAnalytics.start();
                startStationGame(stationId);
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
    initGa4();
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

    // 首頁 → 抵達土樓並敲門 → 選擇遊戲頁
    document.getElementById('startBtn')?.addEventListener('click', () => {
        trackGa4Event('home_start_click');
        window.AudioManager?.playSFX('assets/sounds/click.mp3');
        resetWelcomeIntro();
        showScene('intro-welcome');
    });

    document.getElementById('station-collect-btn')?.addEventListener('click', () => {
        trackGa4Event('experience_entry_click', {
            entry_id: 'collection',
            entry_type: 'collection',
            entry_source: 'level_select'
        });
    });

    setupWelcomeIntro();

    document.getElementById('exitBtn')?.addEventListener('click', () => {
        showExitConfirm((confirmed) => {
            if (confirmed) window.close();
        });
    });

    bindStationButtons();
});
