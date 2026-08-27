// js/core/LoadingManager.js
const LoadingManager = {
    loadingScreen: null,
    progressText: null,
    
    init: function() {
        if (window.Logger) window.Logger.info('🔧 LoadingManager 初始化');
        
        // 獲取元素並檢查是否存在
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressText = document.getElementById('loading-progress');
        
        // ==== 加入安全檢查 ====
        if (!this.loadingScreen) {
            if (window.Logger) window.Logger.error('❌ 找不到 loading-screen 元素！請確認 HTML 中有加入');
            // 如果找不到，建立一個備用的（可選）
            this.createFallbackLoadingScreen();
        } else {
            if (window.Logger) window.Logger.info('✅ 找到 loading-screen');
        }
        
        if (!this.progressText) {
            if (window.Logger) window.Logger.error('❌ 找不到 loading-progress 元素');
        }
    },
    
    // 建立備用 Loading 畫面（如果 HTML 中忘記加）
    createFallbackLoadingScreen: function() {
        const wrapper = document.getElementById('game-wrapper');
        if (!wrapper) return;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-screen';
        loadingDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            display: none;
            justify-content: center;
            align-items: center;
            color: #e67e22;
        `;
        
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="spinner" style="width:50px;height:50px;border:5px solid #333;border-top:5px solid #e67e22;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 15px;"></div>
                <p>資源加載中... <span id="loading-progress">0</span>%</p>
            </div>
            <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
        `;
        
        wrapper.appendChild(loadingDiv);
        this.loadingScreen = loadingDiv;
        this.progressText = document.getElementById('loading-progress');
        if (window.Logger) window.Logger.info('✅ 已建立備用 Loading 畫面');
    },
    
    // 顯示 Loading 並載入資源
    showAndLoad: function(assets, onComplete) {
        if (!this.loadingScreen) {
            if (window.Logger) window.Logger.error('❌ loadingScreen 不存在');
            if (onComplete) onComplete();
            return;
        }
        
        this.loadingScreen.style.display = 'flex';
        this.updateProgress(0);
        
        let loadedCount = 0;
        const totalCount = assets.length;
        
        if (totalCount === 0) {
            this.finish(onComplete);
            return;
        }
        
        assets.forEach(src => {
            // 判斷字型檔案
            if (src.match(/\.(ttf|otf|woff|woff2)$/i)) {
                this.loadFont('BpmfZihiKai', src, () => {
                    loadedCount++;
                    this.updateProgress(Math.floor((loadedCount / totalCount) * 100));
                    if (loadedCount === totalCount) {
                        setTimeout(() => this.finish(onComplete), 300);
                    }
                });
            } 
            // 判斷圖片
            else if (src.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                this.loadImage(src, () => {
                    loadedCount++;
                    this.updateProgress(Math.floor((loadedCount / totalCount) * 100));
                    if (loadedCount === totalCount) {
                        setTimeout(() => this.finish(onComplete), 300);
                    }
                });
            } 
            // 判斷影片
            else if (src.match(/\.(mp4|webm|ogg)$/i)) {
                this.loadVideo(src, () => {
                    loadedCount++;
                    this.updateProgress(Math.floor((loadedCount / totalCount) * 100));
                    if (loadedCount === totalCount) {
                        setTimeout(() => this.finish(onComplete), 300);
                    }
                });
            } 
            // 其他資源
            else {
                loadedCount++;
                this.updateProgress(Math.floor((loadedCount / totalCount) * 100));
                if (loadedCount === totalCount) {
                    setTimeout(() => this.finish(onComplete), 300);
                }
            }
        });
    },
    
    loadImage: function(src, callback) {
        const img = new Image();
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            clearTimeout(timeoutId);
            callback();
        };
        const timeoutId = setTimeout(() => {
            if (window.Logger) window.Logger.warn('⚠️ 圖片載入逾時，略過:', src);
            finish();
        }, 10000);
        img.onload = finish;
        img.onerror = () => {
            if (window.Logger) window.Logger.warn('⚠️ 圖片載入失敗:', src);
            finish(); // 即使失敗也繼續
        };
        img.src = src;
    },
    
    loadVideo: function(src, callback) {
        const video = document.createElement('video');
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            clearTimeout(timeoutId);
            callback();
        };
        const timeoutId = setTimeout(() => {
            if (window.Logger) window.Logger.warn('⚠️ 影片預載逾時，先進入遊戲:', src);
            finish();
        }, 8000);
        video.preload = 'metadata';
        video.onloadeddata = finish;
        video.oncanplaythrough = finish;
        video.onerror = () => {
            if (window.Logger) window.Logger.warn('⚠️ 影片載入失敗:', src);
            finish();
        };
        video.src = src;
        video.load();
    },

    // 在 LoadingManager 中加入字型載入方法
    loadFont: function(family, url, callback) {
        // 使用 CSS Font Loading API
        if (document.fonts && document.fonts.load) {
            const font = new FontFace(family, `url(${url})`);
            font.load().then(() => {
                document.fonts.add(font);
                if (window.Logger) window.Logger.info(`✅ 字型載入完成: ${family}`);
                callback();
            }).catch(err => {
                if (window.Logger) window.Logger.warn(`⚠️ 字型載入失敗: ${family}`, err);
                callback(); // 失敗也繼續
            });
        } else {
            // 降級方案：使用預先定義的 link 或 style
            const style = document.createElement('style');
            style.textContent = `
                @font-face {
                    font-family: '${family}';
                    src: url('${url}') format('truetype');
                    font-display: swap;
                }
            `;
            document.head.appendChild(style);
            
            // 等待一段時間假裝載入完成
            setTimeout(callback, 500);
        }
    },
    
    updateProgress: function(percent) {
        if (this.progressText) {
            this.progressText.innerText = percent;
        }
    },
    
    finish: function(onComplete) {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
        if (onComplete) onComplete();
    }
};

window.LoadingManager = LoadingManager;
