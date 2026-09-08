// 現行入口只保留模式選擇、PWA 安裝、場景切換與六個站點入口。
let gameMode = null;
let deferredInstallPrompt = null;

// ========== 多語系 ==========
// 簡體字型只在首次切到簡體時載入，避免繁體使用者付出多餘請求。
function ensureLocaleFont(locale) {
    if (locale !== 'zh-Hans' || document.getElementById('font-noto-serif-sc')) return;
    const link = document.createElement('link');
    link.id = 'font-noto-serif-sc';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&display=swap';
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
    if (window.SceneManager?.show) {
        SceneManager.show(sceneId);
        return;
    }

    document.querySelectorAll('.scene').forEach((scene) => {
        scene.style.display = 'none';
    });
    const target = document.getElementById(sceneId);
    if (target) target.style.display = 'flex';
}

function setupInstallButton() {
    const installButton = document.getElementById('install-app-btn');
    if (!installButton) return;
    installButton.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        updateInstallButton();
    });
    updateInstallButton();
}

function updateInstallButton() {
    const installButton = document.getElementById('install-app-btn');
    if (installButton) installButton.hidden = !deferredInstallPrompt || isStandaloneDisplay();
}

function bindStationButtons() {
    document.querySelectorAll('[data-station-demo]').forEach((button) => {
        button.addEventListener('click', () => {
            window.AudioManager?.playSFX('assets/sounds/click.mp3');
            if (typeof startStationDemo === 'function') {
                startStationDemo(button.dataset.stationDemo);
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
    window.I18n?.init();
    setupLanguageSwitch();
    setupInstallButton();
    window.AudioManager?.init();
    window.SceneManager?.init();
    window.LoadingManager?.init();

    await showAgeSelect();

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
