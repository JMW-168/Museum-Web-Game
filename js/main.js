// js/main.js

// 全域變數記錄選擇的年齡模式
let gameMode = null; // 'child' 或 'adult'
let deferredInstallPrompt = null;

function updateAppViewportHeight() {
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
}

updateAppViewportHeight();
window.addEventListener('resize', updateAppViewportHeight);
window.addEventListener('orientationchange', () => setTimeout(updateAppViewportHeight, 250));
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateAppViewportHeight);
}

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

// 顯示年齡選擇視窗
function showAgeSelect() {
    return new Promise((resolve) => {
        const ageDialog = document.getElementById('age-select-dialog');
        const childBtn = document.getElementById('age-child');
        const adultBtn = document.getElementById('age-adult');
        
        // 如果找不到元素，直接 resolve（預防錯誤）
        if (!ageDialog || !childBtn || !adultBtn) {
            resolve('adult');
            return;
        }        
        // 顯示視窗
        ageDialog.style.display = 'flex';
        
        // 小朋友版選擇
        childBtn.onclick = () => {
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playSFX('assets/sounds/click.mp3');
            }
            window.gameMode = 'child';
            gameMode = 'child';
            ageDialog.style.display = 'none';
            
            // 為 body 加上標記
            document.body.classList.add('child-mode');
            
            console.log('✅ 已設定 gameMode = child');
            resolve('child');
        };

        
        // 一般版選擇
        adultBtn.onclick = () => {
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playSFX('assets/sounds/click.mp3');
            }
            window.gameMode = 'adult';
            gameMode = 'adult';
            ageDialog.style.display = 'none';
            
            // 移除小朋友版標記
            document.body.classList.remove('child-mode');
            
            console.log('✅ 已設定 gameMode = adult');
            resolve('adult');
        };
    });
}

// ===== 場景切換函數（全域）=====
function showScene(sceneId) {
    if (window.Logger) window.Logger.info('切換場景到:', sceneId);
    
    if (typeof SceneManager !== 'undefined' && SceneManager.show) {
        SceneManager.show(sceneId);
        return;
    }
    
    const scenes = document.querySelectorAll('.scene');
    scenes.forEach(scene => {
        scene.style.display = 'none';
    });
    
    const target = document.getElementById(sceneId);
    if (target) {
        target.style.display = 'flex';
    } else {
        if (window.Logger) window.Logger.error('找不到場景:', sceneId);
    }
}

// ========== 根據年齡模式取得對應的章節（僅限關卡章節）==========
function getChapterByMode(chapterId) {
    const mode = gameMode || window.gameMode || 'adult';
    const isChildMode = (mode === 'child');
    
    if (window.Logger) window.Logger.info(`📖 根據模式 ${isChildMode ? '小朋友版' : '一般版'} 載入章節:`, chapterId);
    
    // 章節映射表（開場不分版本，只有關卡章節分版本）
    const chapterMapping = {
        // 第一章
        'chapter1': isChildMode ? window.Chapter1_Child : window.Chapter1_Teen,
        
        // 第二章
        'chapter2': isChildMode ? window.Chapter2_Child : window.Chapter2_Teen,
        
        // 第三章
        'chapter3': isChildMode ? (window.Chapter3_Child || window.Chapter3) : (window.Chapter3_Teen || window.Chapter3)
    };
    
    const chapterData = chapterMapping[chapterId];
    
    if (!chapterData) {
        if (window.Logger) window.Logger.error(`❌ 找不到章節: ${chapterId} (模式: ${isChildMode ? 'child' : 'adult'})`);
        return null;
    }
    
    if (window.Logger) window.Logger.info(`✅ 成功載入 ${chapterId} (${isChildMode ? '小朋友版' : '一般版'})`);
    return chapterData;
}

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', async function() {
    if (window.Logger) window.Logger.info('📌 DOM 載入完成');
    updateAppViewportHeight();
    setupInstallButton();

    // ✅ 載入關卡狀態
    loadChapterStatus();

    if (typeof LoadingManager !== 'undefined') {
        LoadingManager.init();
    }
    
    if (typeof AudioManager !== 'undefined') AudioManager.init();
    if (typeof SceneManager !== 'undefined') SceneManager.init();
    if (typeof Typewriter !== 'undefined') Typewriter.init();
    if (typeof DialogueSystem !== 'undefined') DialogueSystem.init();
    if (typeof GallerySystem !== 'undefined') GallerySystem.init();
    
    const selectedMode = await showAgeSelect();
    console.log('選擇的模式:', selectedMode);
    if (window.Logger) window.Logger.info('選擇的模式:', selectedMode);
    
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (window.Logger) window.Logger.info('👉 點擊開始遊戲');
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playSFX('assets/sounds/click.mp3');
            }
            
            showScene('level-select');
        });
    }
    
    const exitBtn = document.getElementById('exitBtn');
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            if (typeof showExitConfirm !== 'undefined') {
                showExitConfirm((confirmed) => {
                    if (confirmed) window.close();
                });
            } else {
                if (confirm('確定要離開遊戲嗎？')) window.close();
            }
        });
    }
    
    if (typeof setupBackButton !== 'undefined') {
        setupBackButton();
    }

    bindStationDemoButtons();
});

function setupInstallButton() {
    const installBtn = document.getElementById('install-app-btn');
    if (!installBtn) return;

    installBtn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;

        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        updateInstallButton();
    });

    updateInstallButton();
}

function updateInstallButton() {
    const installBtn = document.getElementById('install-app-btn');
    if (!installBtn) return;
    installBtn.hidden = !deferredInstallPrompt || isStandaloneDisplay();
}

function bindStationDemoButtons() {
    document.querySelectorAll('[data-station-demo]').forEach((button) => {
        const stationId = button.dataset.stationDemo;
        button.onclick = null;
        button.addEventListener('click', () => {
            if (window.Logger) window.Logger.info('🎮 進入 demo 站點:', stationId);
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playSFX('assets/sounds/click.mp3');
            }
            if (typeof startStationDemo === 'function') {
                startStationDemo(stationId);
            } else {
                alert('Demo 遊戲尚未載入，請重新整理頁面。');
            }
        });
    });
}

// 載入章節（使用動態載入，根據模式選擇版本）
function loadChapter(chapterId) {
    // ✅ 檢查關卡是否開放或已完成
    const status = chapterStatus[chapterId];
    if (status === 'locked') {
        alert('此關卡尚未開放！');
        return;
    }
    if (status === 'completed') {
        alert('你已經完成這個關卡了！');
        return;
    }
    
    const backBtn = document.querySelector('#game-container .back-btn');
    if (backBtn) backBtn.style.display = 'block';

    if (window.Logger) window.Logger.info('📖 載入章節:', chapterId);
    
    if (typeof AudioManager !== 'undefined') {
        AudioManager.playSFX('assets/sounds/click.mp3');
    }
    
    const chapterData = getChapterByMode(chapterId);
    
    if (chapterData) {
        if (window.Logger) window.Logger.info('✅ 找到章節資料');

        const assets = collectChapterAssets(chapterData);
        
        LoadingManager.showAndLoad(assets, () => {
            showScene('game-container');
            
            if (typeof DialogueSystem !== 'undefined') {
                DialogueSystem.isIntro = false;
                DialogueSystem.loadChapter(chapterData);
                
                // ✅ 設定章節完成回調（在整個對話結束後觸發）
                DialogueSystem.onChapterComplete = function() {
                    // ✅ 只有在關卡還是 'open' 狀態時才設定為 'completed'
                    if (chapterStatus[chapterId] === 'open') {
                        setChapterStatus(chapterId, 'completed');
                        console.log(`🎉 完成關卡: ${chapterId}，已鎖定`);
                    }
                };
            }
        });
    } else {
        if (window.Logger) window.Logger.error('❌ 找不到章節資料:', chapterId);
        alert('章節資料載入失敗，請檢查 console');
    }
}

// 收集章節需要的所有圖片資源
function collectChapterAssets(chapterData) {
    const assets = [];
    
    if (chapterData.background) {
        assets.push(chapterData.background);
    }
    
    if (chapterData.dialogue) {
        chapterData.dialogue.forEach(line => {
            if (line.characterImage) {
                assets.push(line.characterImage);
            }
        });
    }
    
    return [...new Set(assets)];
}

// 顯示退出確認彈窗
function showExitConfirm(callback) {
    const dialog = document.getElementById('exit-confirm-dialog');
    const yesBtn = document.getElementById('exit-confirm-yes');
    const noBtn = document.getElementById('exit-confirm-no');
    
    if (!dialog || !yesBtn || !noBtn) {
        if (callback) callback(confirm('確定要離開嗎？'));
        return;
    }
    
    dialog.style.display = 'flex';
    document.getElementById('game-container').style.pointerEvents = 'none';
    
    yesBtn.replaceWith(yesBtn.cloneNode(true));
    noBtn.replaceWith(noBtn.cloneNode(true));
    
    const newYesBtn = document.getElementById('exit-confirm-yes');
    const newNoBtn = document.getElementById('exit-confirm-no');
    
    newYesBtn.onclick = () => {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playSFX('assets/sounds/click.mp3');
        }
        dialog.style.display = 'none';
        document.getElementById('game-container').style.pointerEvents = 'auto';
        if (callback) callback(true);
    };
    
    newNoBtn.onclick = () => {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playSFX('assets/sounds/click.mp3');
        }
        dialog.style.display = 'none';
        document.getElementById('game-container').style.pointerEvents = 'auto';
        if (callback) callback(false);
    };
}

// 修改返回按鈕的事件
function setupBackButton() {
    const backBtn = document.querySelector('#game-container .back-btn');
    if (backBtn) {
        backBtn.removeAttribute('onclick');
        
        backBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playSFX('assets/sounds/click.mp3');
            }
            
            showExitConfirm((confirmed) => {
                if (confirmed) {
                    console.log('確認退出，返回關卡選擇');
                    
                    if (typeof AudioManager !== 'undefined') {
                        AudioManager.stopBGM();
                    }
                    
                    if (typeof DialogueSystem !== 'undefined') {
                        // ✅ 傳入 true 表示是手動退出，不觸發關卡完成
                        DialogueSystem.endDialogue(true);
                    }
                    
                    showScene('level-select');
                } else {
                    console.log('取消退出，繼續遊戲');
                }
            });
        });
    }
}

// ========== 關卡控制系統 ==========
// 關卡狀態：'open' = 開放, 'locked' = 鎖定, 'completed' = 已完成
const chapterStatus = {
    chapter1: 'open',      // 第一章預設開放
    chapter2: 'open'       // 第二章預設開放
};

// 儲存到 localStorage
function saveChapterStatus() {
    localStorage.setItem('chapterStatus', JSON.stringify(chapterStatus));
    if (window.Logger) window.Logger.debug('💾 關卡狀態已儲存:', chapterStatus);
}

// 是否在重整時清除進度（設為 true 則每次重整都重設）
const RESET_ON_RELOAD = true;  // 改為 false 則會保留進度

// 載入儲存的狀態
function loadChapterStatus() {
    if (RESET_ON_RELOAD) {
        // ✅ 每次都重設，不讀取儲存
        chapterStatus.chapter1 = 'open';
        chapterStatus.chapter2 = 'open';
        localStorage.removeItem('chapterStatus');
        if (window.Logger) window.Logger.info('📀 重整模式：關卡狀態已重設為預設值');
    } else {
        // 從 localStorage 讀取
        const saved = localStorage.getItem('chapterStatus');
        if (saved) {
            const loaded = JSON.parse(saved);
            Object.assign(chapterStatus, loaded);
            if (window.Logger) window.Logger.info('📀 載入關卡狀態:', chapterStatus);
        }
    }
    updateChapterButtons();
}

// 更新按鈕外觀
function updateChapterButtons() {
    const chapters = ['chapter1', 'chapter2'];
    chapters.forEach(chapter => {
        const btn = document.getElementById(`${chapter}-btn`);
        if (!btn) return;
        
        const status = chapterStatus[chapter];
        
        if (status === 'locked') {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.innerHTML = btn.innerHTML.replace(/ 🔒| ✅/g, '') + ' 🔒';
        } else if (status === 'completed') {
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
            btn.innerHTML = btn.innerHTML.replace(/ 🔒| ✅/g, '') + ' ✅';
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.innerHTML = btn.innerHTML.replace(/ 🔒| ✅/g, '');
        }
    });
}

// 設定關卡狀態（後台用）
function setChapterStatus(chapterId, status) {
    if (chapterStatus[chapterId] !== undefined) {
        chapterStatus[chapterId] = status;
        saveChapterStatus();
        updateChapterButtons();
        if (window.Logger) window.Logger.info(`🔧 設定 ${chapterId} 狀態為: ${status}`);
    }
}

// 完成關卡（遊玩後鎖定）
function completeChapter(chapterId) {
    if (window.Logger) window.Logger.debug(`🔍 completeChapter 被呼叫: ${chapterId}`);
    if (window.Logger) window.Logger.debug(`🔍 當前狀態: ${chapterStatus[chapterId]}`);
    
    if (chapterStatus[chapterId] === 'open') {
        setChapterStatus(chapterId, 'completed');
        if (window.Logger) window.Logger.info(`🎉 完成關卡: ${chapterId}，已鎖定`);
    } else {
        if (window.Logger) window.Logger.warn(`⚠️ 無法完成 ${chapterId}，當前狀態不是 open: ${chapterStatus[chapterId]}`);
    }
}

// 開放關卡（後台手動開放）
function unlockChapter(chapterId) {
    setChapterStatus(chapterId, 'open');
}

// 鎖定關卡（後台手動鎖定）
function lockChapter(chapterId) {
    setChapterStatus(chapterId, 'locked');
}

// 重設所有關卡（方便測試）
function resetAllChapters() {
    chapterStatus.chapter1 = 'open';
    chapterStatus.chapter2 = 'open';
    saveChapterStatus();
    updateChapterButtons();
    if (window.Logger) window.Logger.info('🔄 所有關卡已重設');
}

function startCatchGameDemo() {
    if (typeof AudioManager !== 'undefined') {
        AudioManager.playSFX('assets/sounds/click.mp3');
    }

    showScene('game-container');

    const backBtn = document.querySelector('#game-container .back-btn');
    if (backBtn) backBtn.style.display = 'none';

    if (typeof DialogueSystem !== 'undefined') {
        DialogueSystem.endDialogue(true);
    }

    if (typeof GameEngine === 'undefined') {
        alert('接物遊戲載入失敗，請稍後再試。');
        showScene('level-select');
        return;
    }

    GameEngine.startMinigame('catch', {
        title: '市場接物挑戰',
        onComplete: () => {
            showScene('level-select');
        }
    });
}
