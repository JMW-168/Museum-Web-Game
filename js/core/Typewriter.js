// js/core/Typewriter.js
const Typewriter = {
    // 顯示打字機效果的對話框
    dialogueBox: null,
    dialogueText: null,
    npcName: null,
    optionsContainer: null,
    typingSpeed: 40, // 每個字元的延遲時間（毫秒）
    
    // 初始化
    init: function() {
        this.dialogueBox = document.getElementById('dialog-box');
        this.npcName = document.getElementById('npc-name');
        this.dialogueText = document.getElementById('dialogue-text');
        this.optionsContainer = document.getElementById('options-container');
        
        // 預設隱藏
        if (this.dialogueBox) this.dialogueBox.style.display = 'none';
        if (this.optionsContainer) this.optionsContainer.style.display = 'none';
        
        // 加入動畫樣式（只加一次）
        if (!document.getElementById('typing-indicator-style')) {
            const style = document.createElement('style');
            style.id = 'typing-indicator-style';
            style.textContent = `
                @keyframes pulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // 顯示對話（打字機效果）
    showDialogue: function(name, text, characterImage = null, voice = null, namePosition = 'left', textClass = '') {
        return new Promise((resolve) => {
            console.log('📢 Typewriter 顯示對話:', { name, namePosition, textClass });
            
            // ✅ 新增：處理函數類型的 text
            let finalText = text;
            if (typeof finalText === 'function') {
                finalText = finalText();
                console.log('✅ text 是函數，執行後得到:', finalText);
            }
            
            // ✅ 新增：處理函數類型的 name
            let finalName = name;
            if (typeof finalName === 'function') {
                finalName = finalName();
                console.log('✅ name 是函數，執行後得到:', finalName);
            }
            
            // 確保是字串
            finalText = finalText || '';
            finalName = finalName || '';

            // 清除舊的完成指示器
            const oldIndicator = document.getElementById('typing-complete-indicator');
            if (oldIndicator) oldIndicator.remove();
            
            // 顯示對話框
            this.dialogueBox.style.display = 'block';
            
            // 設定角色名稱和位置
            if (this.npcName) {
                this.npcName.innerText = name || '';
                this.npcName.style.display = 'block';
                this.npcName.style.opacity = '1';
                
                // 移除所有位置 class
                this.npcName.classList.remove('position-left', 'position-center', 'position-right');
                
                // 根據參數加入對應的位置 class
                switch(namePosition) {
                    case 'center':
                        this.npcName.classList.add('position-center');
                        break;
                    case 'right':
                        this.npcName.classList.add('position-right');
                        break;
                    case 'left':
                    default:
                        this.npcName.classList.add('position-left');
                        break;
                }
            }

            // ==== 修改這裡：加入除錯 ====
            if (this.dialogueText) {
                // 先移除所有可能的樣式類別
                this.dialogueText.classList.remove('child-mode-text');
                
                if (textClass) {
                    this.dialogueText.classList.add(textClass);
                    console.log('✅ Typewriter 已加入 class:', textClass);
                    console.log('目前的 classList:', this.dialogueText.classList);
                } else {
                    console.log('ℹ️ Typewriter 沒有收到 textClass');
                }
            }
            
            // 角色圖片顯示
            const charImg = document.getElementById('character-image');
            const charContainer = document.getElementById('character-container');
            
            if (charImg && charContainer) {
                if (characterImage) {
                    charImg.src = characterImage;
                    charImg.onload = () => {
                        console.log('角色圖片載入完成');
                    };
                    charImg.style.display = 'block';
                    charContainer.style.display = 'flex';
                } else {
                    charImg.style.display = 'none';
                    charContainer.style.display = 'none';
                }
            }
            
            // 播放語音
            if (voice && typeof AudioManager !== 'undefined') {
                AudioManager.playSFX(voice, 0.5);
            }
            
            // 開始打字效果
            this.typeText(text, resolve);
        });
    },
    
    // 打字機效果核心函數
    typeText: function(fullText, onComplete) {
        // 清空
        this.dialogueText.textContent = '';

        // 清除舊指示器
        const oldIndicator = document.getElementById('typing-complete-indicator');
        if (oldIndicator) oldIndicator.remove();

        // ✅ 1. 建立「乾淨字串」（移除 IVS）
        const cleanText = fullText.replace(/[\u{E0000}-\u{E0FFF}]/gu, '');

        let index = 0;
        let displayText = '';

        const typingInterval = setInterval(() => {
            if (index < cleanText.length) {
                displayText += cleanText[index];
                this.dialogueText.textContent = displayText;

                // 音效（每3字一次）
                if (index % 3 === 0) {
                    if (typeof AudioManager !== 'undefined') {
                        AudioManager.playSFX('assets/sounds/sfx-blipmale.wav', 0.1);
                    }
                }

                index++;
            } else {
                clearInterval(typingInterval);

                // ✅ 2. 最後一次才放「完整字串」（含 IVS）
                this.dialogueText.textContent = fullText;

                this.showCompletionIndicator();
                if (onComplete) onComplete();
            }
        }, this.typingSpeed);
    },
    
    // 顯示完成標誌
    showCompletionIndicator: function() {
        // 先移除舊的指示器
        const oldIndicator = document.getElementById('typing-complete-indicator');
        if (oldIndicator) oldIndicator.remove();
        
        // 在對話框右下角顯示三角形
        const indicator = document.createElement('div');
        indicator.id = 'typing-complete-indicator';
        indicator.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 20px;
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 15px solid #ffd700;
            transform: rotate(180deg);
            animation: pulse 1s infinite;
            z-index: 1000;
        `;
        
        this.dialogueBox.appendChild(indicator);
    },
    
    // 顯示選項
    showOptions: function(options) {
        return new Promise((resolve) => {
            this.optionsContainer.innerHTML = '';
            this.optionsContainer.style.display = 'flex';
            
            options.forEach((opt, index) => {
                const btn = document.createElement('button');
                btn.innerText = opt.text;
                
                // 添加動畫效果
                btn.style.animation = `fadeIn 0.3s ease ${index * 0.1}s forwards`;
                btn.style.opacity = '0';
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    
                    // 播放點擊音效
                    if (typeof AudioManager !== 'undefined') {
                        AudioManager.playSFX('assets/sounds/click.mp3');
                    }
                    
                    // 清除選項
                    this.optionsContainer.innerHTML = '';
                    this.optionsContainer.style.display = 'none';
                    
                    // 移除完成指示器
                    const indicator = document.getElementById('typing-complete-indicator');
                    if (indicator) indicator.remove();
                    
                    // 回傳選擇的選項
                    resolve(opt);
                };
                
                this.optionsContainer.appendChild(btn);
            });
        });
    },
    
    // 清除對話框
    clear: function() {
        this.dialogueBox.style.display = 'none';
        this.npcName.innerText = '';
        this.dialogueText.innerText = '';
        this.optionsContainer.innerHTML = '';
        this.optionsContainer.style.display = 'none';
        
        // 清除完成指示器
        const indicator = document.getElementById('typing-complete-indicator');
        if (indicator) indicator.remove();
        
        const charImg = document.getElementById('character-image');
        if (charImg) charImg.style.display = 'none';
    }
};

// 確保全域可用
window.Typewriter = Typewriter;