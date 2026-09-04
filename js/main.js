// 現行入口只保留模式選擇、PWA 安裝、場景切換與六個站點入口。
let gameMode = null;
let deferredInstallPrompt = null;

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
            alert('遊戲尚未載入，請重新整理頁面。');
        });
    });
}

function showExitConfirm(callback) {
    const dialog = document.getElementById('exit-confirm-dialog');
    const yesButton = document.getElementById('exit-confirm-yes');
    const noButton = document.getElementById('exit-confirm-no');
    if (!dialog || !yesButton || !noButton) {
        callback?.(confirm('確定要離開遊戲嗎？'));
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
    setupInstallButton();
    window.AudioManager?.init();
    window.SceneManager?.init();
    window.LoadingManager?.init();

    await showAgeSelect();

    document.getElementById('startBtn')?.addEventListener('click', () => {
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
