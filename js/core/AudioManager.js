// js/core/AudioManager.js
const AudioManager = {
    bgMusic: null,
    sfxPlayer: null,
    
    init: function() {
        console.log('🔧 AudioManager 初始化');
        
        // 直接獲取元素，不依賴 DOMContentLoaded
        this._initElements();
    },
    
    _initElements: function() {
        console.log('📋 AudioManager 獲取 DOM 元素');
        
        this.bgMusic = document.getElementById('bg-music');
        this.sfxPlayer = document.getElementById('sfx-player');
        
        console.log('📋 音效元素檢查:', {
            bgMusic: this.bgMusic,
            sfxPlayer: this.sfxPlayer,
            bgMusicExists: !!this.bgMusic,
            sfxPlayerExists: !!this.sfxPlayer
        });
        
        // 如果找不到元素，立即創建
        if (!this.bgMusic) {
            console.warn('⚠️ 找不到 bg-music 元素，立即創建');
            this.bgMusic = document.createElement('audio');
            this.bgMusic.id = 'bg-music';
            this.bgMusic.loop = true;
            document.body.appendChild(this.bgMusic);
            console.log('✅ bg-music 創建完成');
        }
        
        if (!this.sfxPlayer) {
            console.warn('⚠️ 找不到 sfx-player 元素，立即創建');
            this.sfxPlayer = document.createElement('audio');
            this.sfxPlayer.id = 'sfx-player';
            document.body.appendChild(this.sfxPlayer);
            console.log('✅ sfx-player 創建完成');
        }
        
        // 設定預設音量
        if (this.bgMusic) {
            this.bgMusic.volume = 0.5;
            console.log('✅ bgMusic 音量設定為 0.5');
        }
        
        if (this.sfxPlayer) {
            this.sfxPlayer.volume = 0.7;
            console.log('✅ sfxPlayer 音量設定為 0.7');
        }
        
        console.log('✅ AudioManager 初始化完成', {
            bgMusic: this.bgMusic,
            sfxPlayer: this.sfxPlayer
        });
    },
    
    playBGM: function(src, loop = true) {
        console.log('🎵 播放背景音樂:', src);
        
        if (!this.bgMusic) {
            console.error('❌ bgMusic 未初始化，嘗試重新獲取');
            this._initElements();
            if (!this.bgMusic) {
                console.error('❌ 仍然無法獲取 bgMusic');
                return;
            }
        }
        
        try {
            this.bgMusic.src = src;
            this.bgMusic.loop = loop;
            this.bgMusic.volume = 0.5;
            
            const playPromise = this.bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('⚠️ 背景音樂播放失敗（需要用戶互動）:', error);
                });
            }
        } catch (error) {
            console.error('❌ 播放背景音樂時發生錯誤:', error);
        }
    },
    
    stopBGM: function() {
        console.log('⏹️ 停止背景音樂');
        if (!this.bgMusic) return;
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
    },
    
    playSFX: function(src, volume = 0.7) {
        console.log('🔊 播放音效:', src);

        if (!this.sfxPlayer) {
            console.error('❌ sfxPlayer 未初始化，嘗試重新獲取');
            this._initElements();
            if (!this.sfxPlayer) return;
        }

        // 儲存當前 sfxPlayer 的引用，避免非同步期間被改變
        const player = this.sfxPlayer;

        // --- 關鍵修改：處理播放 Promise ---
        // 先暫停當前的播放（這本身是同步的）
        player.pause();
        
        // 設定新的音效來源
        player.src = src;
        player.volume = volume;

        // 嘗試播放並處理回傳的 Promise
        const playPromise = player.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // 播放成功開始
                    // console.log('音效播放成功開始');
                })
                .catch(error => {
                    // 播放失敗（例如被中斷、自動播放政策阻擋等）
                    // 這裡只記錄錯誤，但不讓它顯示在控制台，除非是真正需要關注的錯誤
                    if (error.name !== 'AbortError') {
                        // 如果不是因為中斷導致的錯誤，才記錄下來
                        console.warn('音效播放錯誤:', error);
                    }
                    // 如果是 AbortError，通常是被新的 play() 呼叫中斷，這是預期行為，所以靜默處理
                });
        }
    },
    
    setBGMVolume: function(vol) {
        if (!this.bgMusic) return;
        this.bgMusic.volume = Math.max(0, Math.min(1, vol));
    },
    
    setSFXVolume: function(vol) {
        if (!this.sfxPlayer) return;
        this.sfxPlayer.volume = Math.max(0, Math.min(1, vol));
    }
};

// 立即初始化，不等待 DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📌 DOMContentLoaded 時初始化 AudioManager');
        AudioManager.init();
    });
} else {
    console.log('📌 DOM 已載完，立即初始化 AudioManager');
    AudioManager.init();
}

// 確保全域可用
window.AudioManager = AudioManager;