// js/core/GameEngine.js
const GameEngine = {
    currentMinigame: null,
    
    collectMinigameAssets: function(minigameName, options) {
        if (window.MinigameAssets) {
            if (minigameName === 'memory') {
                return [...new Set(MinigameAssets.getMemoryPreloadUrls())];
            }
            if (minigameName === 'defense') {
                const urls = MinigameAssets.getDefensePreloadUrls();
                if (window.Logger) window.Logger.info(`📦 防禦遊戲預載入 ${urls.length} 張圖片`);
                return [...new Set(urls)];
            }
        }

        if (minigameName === 'catch') {
            const imageUrls = [];

            if (window.CatchGame && typeof window.CatchGame.getDefaultAssets === 'function') {
                imageUrls.push(...window.CatchGame.getDefaultAssets());
            }

            if (options && Array.isArray(options.goodItems)) {
                options.goodItems.forEach(item => {
                    if (item.image) imageUrls.push(item.image);
                });
            }

            if (options && Array.isArray(options.badItems)) {
                options.badItems.forEach(item => {
                    if (item.image) imageUrls.push(item.image);
                });
            }

            return [...new Set(imageUrls)];
        }
        
        // ✅ 為 interact 遊戲收集所有圖片資源
        if (minigameName === 'interact' && options && options.items) {
            const imageUrls = [];
            
            // 收集遊戲物件的圖片
            options.items.forEach(item => {
                if (item.image) {
                    imageUrls.push(item.image);
                }
            });
            
            // 收集放置區的圖片（如果有）
            if (options.zones) {
                options.zones.forEach(zone => {
                    if (zone.image) {
                        imageUrls.push(zone.image);
                    }
                });
            }
            
            if (window.Logger) window.Logger.info(`📦 互動遊戲預載入 ${imageUrls.length} 張圖片`);
            return [...new Set(imageUrls)];
        }
        
        return [];
    },
    
    startMinigame: function(minigameName, options) {
        if (window.Logger) window.Logger.info('🎮 GameEngine 啟動小遊戲:', minigameName);
        
        const assets = this.collectMinigameAssets(minigameName, options);
        
        if (assets.length > 0 && typeof LoadingManager !== 'undefined') {
            if (window.Logger) window.Logger.info(`📦 預載入 ${assets.length} 個小遊戲資源`);
            LoadingManager.showAndLoad(assets, () => {
                this._startMinigameImmediately(minigameName, options);
            });
        } else {
            this._startMinigameImmediately(minigameName, options);
        }
    },
    
    _startMinigameImmediately: function(minigameName, options) {
        // 清理之前的遊戲
        if (window.MemoryGameV2 && typeof window.MemoryGameV2.stop === 'function') {
            window.MemoryGameV2.stop();
        }
        if (window.DefenseGameV2 && typeof window.DefenseGameV2.stop === 'function') {
            window.DefenseGameV2.stop();
        }
        if (window.InteractSystem && typeof window.InteractSystem.close === 'function') {
            window.InteractSystem.close();
        }
        if (window.CatchGame && typeof window.CatchGame.stop === 'function') {
            window.CatchGame.stop();
        }

        const gameMode = typeof window !== 'undefined' && window.gameMode ? window.gameMode : 'adult';

        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.display = 'block';
            canvas.style.zIndex = '10';
            canvas.classList.add('minigame-active');
        }
        
        const minigameMap = {
            'finding': window.FindingGame,
            'puzzle': window.PuzzleGame,
            'defense': window.DefenseGameV2,
            'memory': window.MemoryGameV2,
            'interact': window.InteractSystem,
            'catch': window.CatchGame,
        };
        
        const Minigame = minigameMap[minigameName];
        if (Minigame && Minigame.start) {
            this.currentMinigame = minigameName;
            
            // ✅ 保存 onComplete 回調
            const onCompleteCallback = options.onComplete;
            
            // ✅ 確保 onComplete 被傳入
            const startOptions = {
                ...options,
                gameMode: options && (options.gameMode === 'child' || options.gameMode === 'adult') ? options.gameMode : gameMode,
                onComplete: (success) => {
                    console.log('🎮 GameEngine 內部 onComplete, success:', success);
                    if (canvas) {
                        canvas.style.display = 'none';
                        canvas.classList.remove('minigame-active');
                    }
                    this.currentMinigame = null;
                    
                    // ✅ 呼叫保存的回調
                    if (onCompleteCallback) {
                        console.log('🎮 呼叫外部 onComplete');
                        onCompleteCallback(success);
                    } else {
                        console.log('🎮 警告: 沒有外部 onComplete');
                    }
                },
                level: options.level || 1
            };
            
            console.log('🎮 啟動小遊戲，onComplete 是否存在:', typeof startOptions.onComplete === 'function');
            Minigame.start(startOptions);
        } else {
            if (window.Logger) window.Logger.error('❌ 找不到小遊戲:', minigameName);
            setTimeout(() => {
                if (canvas) {
                    canvas.style.display = 'none';
                    canvas.classList.remove('minigame-active');
                }
                if (options && options.onComplete) {
                    options.onComplete(true);
                }
            }, 500);
        }
    },
    
    showLoading: function(message = '載入中...') {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        canvas.style.display = 'block';
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 1280, 720);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 1280, 720);
        ctx.fillStyle = '#e67e22';
        ctx.font = '36px Arial';
        ctx.fillText(message, 500, 360);
    },
    
    hideLoading: function() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas && !this.currentMinigame) {
            canvas.style.display = 'none';
        }
    },

    loadMinigameCSS: function() {
        if (document.querySelector('link[href="css/minigame.css"]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/minigame.css';
        document.head.appendChild(link);
    }
};

window.GameEngine = GameEngine;
