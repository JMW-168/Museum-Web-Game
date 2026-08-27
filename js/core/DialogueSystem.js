// js/core/DialogueSystem.js
const DialogueSystem = {
    currentDialogue: [],
    currentIndex: 0,
    currentChapter: null,
    returnToNode: null,
    
    // 儲存 DOM 元素
    dialogBox: null,
    npcName: null,
    dialogueText: null,
    optionsContainer: null,
    characterImage: null,
    gameContainer: null,
    gameCanvas: null,
    gameBackground: null,

    // ✅ 旁白打字計時器
    narrationTimer: null,
    narrationContainer: null,
    narrationText: null,
    
    init: function() {
        if (window.Logger) window.Logger.info('🔧 DialogueSystem 初始化');
        
        // 獲取所有需要的 DOM 元素
        this.dialogBox = document.getElementById('dialog-box');
        this.npcName = document.getElementById('npc-name');
        this.dialogueText = document.getElementById('dialogue-text');
        this.optionsContainer = document.getElementById('options-container');
        this.characterImage = document.getElementById('character-image');
        this.gameContainer = document.getElementById('game-container');
        this.gameCanvas = document.getElementById('gameCanvas');
        this.gameBackground = document.getElementById('game-background');
        
        // 檢查是否成功獲取
        if (window.Logger) window.Logger.debug('📋 DOM 元素檢查:', {
            dialogBox: !!this.dialogBox,
            npcName: !!this.npcName,
            dialogueText: !!this.dialogueText,
            optionsContainer: !!this.optionsContainer,
            characterImage: !!this.characterImage,
            gameContainer: !!this.gameContainer,
            gameCanvas: !!this.gameCanvas,
            gameBackground: !!this.gameBackground
        });
        
        // 如果缺少必要元素，顯示錯誤
        if (!this.optionsContainer) {
            if (window.Logger) window.Logger.error('❌ 找不到 options-container 元素！');
        }
        
        if (!this.dialogBox) {
            if (window.Logger) window.Logger.error('❌ 找不到 dialog-box 元素！');
        }
        
        // 設定 Typewriter
        this.typewriter = Typewriter;
    },
    
    loadChapter: function(chapterData) {
        if (window.Logger) window.Logger.info('📖 載入章節:', chapterData?.id || chapterData);

        // ✅ 重置旁白相關變數
        if (this.narrationTimer) {
            clearTimeout(this.narrationTimer);
            this.narrationTimer = null;
        }
        if (this.narrationContainer) {
            if (this.narrationText) {
                this.narrationText.textContent = '';
            }
            this.narrationContainer.style.display = 'none';
        }
        
        if (!chapterData) {
            if (window.Logger) window.Logger.error('❌ 章節資料為空');
            return;
        }
        
        if (!chapterData.dialogue) {
            if (window.Logger) window.Logger.error('❌ 章節資料缺少 dialogue 屬性:', chapterData);
            return;
        }
        
        this.currentChapter = chapterData;
        this.currentDialogue = chapterData.dialogue;
        this.currentIndex = 0;
        this.returnToNode = null;
        
        if (window.Logger) window.Logger.info('✅ 已載入對話數量:', this.currentDialogue.length);
        
        // 設定背景音樂
        if (chapterData.bgm && AudioManager) {
            AudioManager.playBGM(chapterData.bgm);
        }
        
        // 設定背景圖片
        if (chapterData.background && this.gameBackground) {
            this.gameBackground.style.backgroundImage = `url('${chapterData.background}')`;
            this.gameBackground.style.backgroundSize = 'cover';
            this.gameBackground.style.backgroundPosition = 'center';
        }
        
        // ✅ 新增：預載所有對話中的背景圖片
        this.preloadDialogueBackgrounds(chapterData.dialogue);
        
        this.showDialogue();
    },

    // ✅ 新增方法：預載對話中的背景圖片
    preloadDialogueBackgrounds: function(dialogueArray) {
        const backgroundsToPreload = new Set();
        
        // 遍歷所有對話，收集 background 圖片
        dialogueArray.forEach(line => {
            if (line.background) {
                backgroundsToPreload.add(line.background);
            }
            // 如果有選項，也要檢查選項中的 gallery 等（但背景主要還是在 line 層級）
            if (line.options) {
                line.options.forEach(opt => {
                    if (opt.background) {
                        backgroundsToPreload.add(opt.background);
                    }
                });
            }
        });
        
        // 如果有需要預載的背景圖片
        if (backgroundsToPreload.size > 0) {
            const bgArray = Array.from(backgroundsToPreload);
            console.log(`📦 預載章節背景圖片: ${bgArray.length} 張`, bgArray);
            
            bgArray.forEach(src => {
                const img = new Image();
                img.src = src;
            });
        }
    },
    
    showDialogue: async function() {
        if (window.Logger) window.Logger.debug('💬 顯示對話，索引:', this.currentIndex, '總長度:', this.currentDialogue.length);
        
        // 檢查對話陣列
        if (!this.currentDialogue || this.currentDialogue.length === 0) {
            if (window.Logger) window.Logger.error('❌ currentDialogue 為空');
            return;
        }
        
        if (this.currentIndex >= this.currentDialogue.length) {
            this.endDialogue(false);  // ✅ 自然結束，不是手動退出
            return;
        }
        
        const line = this.currentDialogue[this.currentIndex];
        console.log('📝 當前對話行:', line);

        // ✅ 新增：如果對話有指定背景，就更換背景
        if (line.background && this.gameBackground) {
            this.gameBackground.style.backgroundImage = `url('${line.background}')`;
            this.gameBackground.style.backgroundSize = 'cover';
            this.gameBackground.style.backgroundPosition = 'center';
        }
        
        if (!line) {
            console.error('❌ 對話行為空');
            this.currentIndex++;
            this.showDialogue();
            return;
        }
        
        // 清除舊的點擊事件
        if (this.gameContainer) {
            this.gameContainer.onclick = null;
        }
        
        // ========== 命名畫面模式 ==========
        if (line.type === 'naming') {
            console.log('📝 命名畫面模式:', line.title);
            
            // 隱藏對話相關元素
            if (this.dialogBox) this.dialogBox.style.display = 'none';
            if (this.characterImage) this.characterImage.style.display = 'none';
            if (this.npcName) this.npcName.style.display = 'none';
            if (this.optionsContainer) this.optionsContainer.style.display = 'none';
            
            // 隱藏打字完成指示器
            const indicator = document.getElementById('typing-complete-indicator');
            if (indicator) indicator.style.display = 'none';
            
            // ✅ 獲取當前模式，決定字體
            const isChildMode = (window.gameMode === 'child');
            const titleFontFamily = isChildMode ? "'BpmfZihiKai', 'LXGW WenKai TC', '標楷體', sans-serif" : "'LXGW WenKai TC', 'DFKai-SB', 'Kaiti TC', '標楷體', sans-serif";
            const buttonFontFamily = isChildMode ? "'BpmfZihiKai', 'LXGW WenKai TC', '標楷體', sans-serif" : "'LXGW WenKai TC', 'DFKai-SB', 'Kaiti TC', '標楷體', sans-serif";
            
            // 建立命名畫面
            let namingContainer = document.getElementById('naming-container');
            if (!namingContainer) {
                namingContainer = document.createElement('div');
                namingContainer.id = 'naming-container';
                namingContainer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 30;
                    background: rgba(0, 0, 0, 0.85);
                `;
                this.gameContainer.appendChild(namingContainer);
            }
            
            // ✅ 修正：使用 flex 讓內容自動縮放，避免溢出，並加入兒童模式字體
            namingContainer.innerHTML = `
                <div style="
                    background: linear-gradient(145deg, #2c1810, #1a0f0a);
                    border: 3px solid #e67e22;
                    border-radius: 20px;
                    padding: 30px;
                    text-align: center;
                    max-width: 90%;
                    width: 400px;
                    max-height: 90%;
                    overflow-y: auto;
                    box-sizing: border-box;
                ">
                    <div style="
                        color: #ffd700;
                        font-size: 24px;
                        margin-bottom: 15px;
                        font-family: ${titleFontFamily};
                        letter-spacing: ${isChildMode ? '2px' : 'normal'};
                    ">${line.title}</div>
                    <div style="margin-bottom: 15px;">
                        <img src="${line.characterImage || ''}" style="
                            width: ${isChildMode ? '100px' : '80px'};
                            height: ${isChildMode ? '100px' : '80px'};
                            object-fit: contain;
                            border-radius: 50%;
                            display: block;
                            margin: 0 auto;
                        " onerror="this.style.display='none'">
                    </div>
                    <input type="text" id="player-name-input" placeholder="輸入你的名字" maxlength="12" style="
                        width: 100%;
                        padding: 12px;
                        font-size:'16px';
                        background: #3d2a1f;
                        border: 2px solid #e67e22;
                        border-radius: 10px;
                        color: white;
                        text-align: center;
                        margin-bottom: 15px;
                        box-sizing: border-box;
                        font-family: ${titleFontFamily};
                    ">
                    <button id="naming-confirm-btn" style="
                        background: linear-gradient(145deg, #e67e22, #d35400);
                        color: white;
                        border: none;
                        padding: 10px 30px;
                        font-size: ${isChildMode ? '20px' : '16px'};
                        border-radius: 30px;
                        cursor: pointer;
                        font-weight: bold;
                        font-family: ${buttonFontFamily};
                        letter-spacing: ${isChildMode ? '2px' : 'normal'};
                    ">就是我！</button>
                </div>
            `;
            
            namingContainer.style.display = 'flex';
            
            const input = document.getElementById('player-name-input');
            const confirmBtn = document.getElementById('naming-confirm-btn');
            
            const confirmName = () => {
                let playerName = input.value.trim();
                if (playerName === '') {
                    playerName = '小旅人';
                }
                
                // 儲存名稱
                if (this.currentChapter && this.currentChapter.setPlayerName) {
                    this.currentChapter.setPlayerName(playerName);
                }
                
                // 關閉命名畫面
                namingContainer.style.display = 'none';
                
                // 恢復對話框顯示
                if (this.dialogBox) this.dialogBox.style.display = 'block';
                if (this.characterImage && line.nextCharacterImage !== false) {
                    this.characterImage.style.display = 'block';
                }
                
                // 前往下一節點
                if (line.next) {
                    this.goToNode(line.next);
                } else {
                    this.currentIndex++;
                    this.showDialogue();
                }
            };
            
            confirmBtn.onclick = confirmName;
            input.onkeypress = (e) => {
                if (e.key === 'Enter') confirmName();
            };
            
            return;
        }
        // ========== ✅ 新增：旁白模式（無對話框、無角色、文字置中）==========
        if (line.type === 'narration') {
            console.log('📖 旁白模式:', line.text);
            
            // 隱藏對話相關元素
            if (this.dialogBox) this.dialogBox.style.display = 'none';
            if (this.characterImage) this.characterImage.style.display = 'none';
            if (this.npcName) this.npcName.style.display = 'none';
            if (this.optionsContainer) this.optionsContainer.style.display = 'none';
            
            // 隱藏打字完成指示器
            const indicator = document.getElementById('typing-complete-indicator');
            if (indicator) indicator.style.display = 'none';
            
            // 建立或取得旁白容器
            let narrationContainer = document.getElementById('narration-container');
            if (!narrationContainer) {
                narrationContainer = document.createElement('div');
                narrationContainer.id = 'narration-container';
                narrationContainer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 25;
                    pointer-events: auto;
                    background: rgba(0, 0, 0, 0.6);
                `;
                this.gameContainer.appendChild(narrationContainer);
            }

            // 建立或取得旁白文字元素
            let narrationText = document.getElementById('narration-text');
            if (!narrationText) {
                narrationText = document.createElement('div');
                narrationText.id = 'narration-text';
                narrationText.style.cssText = `
                    max-width: 80%;
                    width: 80%;
                    padding: 20px 40px;
                    background: transparent;
                    color: #fff;
                    text-align: center;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                    font-family: inherit;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                `;
                narrationContainer.appendChild(narrationText);
            }

            // ✅ 取得當前模式
            let currentMode = window.gameMode;
            if (currentMode === undefined || currentMode === null) {
                if (document.body.classList.contains('child-mode')) {
                    currentMode = 'child';
                } else {
                    currentMode = 'adult';
                }
            }
            
            // ✅ 只設定字型家族和行高
            if (currentMode === 'child') {
                narrationText.style.fontFamily = 'BpmfZihiKai, 標楷體, 微軟正黑體, sans-serif';
                narrationText.style.lineHeight = '1.6';
                // 兒童模式：8vh = 螢幕高度的 8%，292px * 0.08 = 23px
                narrationText.style.fontSize = 'clamp(20px, 8vh, 36px)';
            } else {
                narrationText.style.fontFamily = 'LXGW WenKai TC, DFKai-SB, Kaiti TC, 標楷體, 微軟正黑體, sans-serif';
                narrationText.style.lineHeight = '1.5';
                // 成人模式：7vh = 螢幕高度的 7%，292px * 0.07 = 20px
                narrationText.style.fontSize = 'clamp(18px, 7vh, 32px)';
            }
            
            // ✅ 刪除這整段手動計算的程式碼
            // const screenHeight = ... 等全部刪掉
            
            narrationContainer.style.display = 'flex';
            
            // 取得打字速度（預設 50ms，可透過 line.speed 調整）
            const typingSpeed = line.speed || 50;

            // ✅ 儲存引用，方便清理
            this.narrationContainer = narrationContainer;
            this.narrationText = narrationText;
            
            // 清除之前的計時器
            if (this.narrationTimer) {
                clearTimeout(this.narrationTimer);
                this.narrationTimer = null;
            }
            
            // 打字機效果
            let charIndex = 0;
            const fullText = line.text;
            narrationText.textContent = '';
            
            const typeNextChar = () => {
                if (charIndex < fullText.length) {
                    narrationText.textContent += fullText[charIndex];
                    charIndex++;
                    this.narrationTimer = setTimeout(typeNextChar, typingSpeed);  // ✅ 儲存
                } else {
                    this.narrationTimer = null;  // ✅ 完成後清除
                    // 打字完成後的處理...
                    if (line.next) {
                        if (this.gameContainer) {
                            this.gameContainer.onclick = () => {
                                narrationContainer.style.display = 'none';
                                if (this.dialogBox) this.dialogBox.style.display = 'block';
                                if (this.characterImage && line.nextCharacterImage !== false) {
                                    this.characterImage.style.display = 'block';
                                }
                                this.goToNode(line.next);
                            };
                        }
                    } else {
                        this.currentIndex++;
                        this.showDialogue();
                    }
                }
            };
            
            typeNextChar();
            return;
        }
        
        // ========== 一般對話模式 ==========
        // 確保對話相關元素顯示
        if (this.dialogBox) this.dialogBox.style.display = 'block';
        if (this.characterImage) this.characterImage.style.display = 'block';
        if (this.npcName) this.npcName.style.display = 'block';
        
        // 隱藏旁白容器
        const narrationContainer = document.getElementById('narration-container');
        if (narrationContainer) narrationContainer.style.display = 'none';
        
        // 顯示打字完成指示器
        const indicator = document.getElementById('typing-complete-indicator');
        if (indicator) indicator.style.display = 'block';
        
        // 確保選項容器存在且清空
        if (this.optionsContainer) {
            this.optionsContainer.innerHTML = '';
            this.optionsContainer.style.display = 'none';
        }
        
        // ===== 修正：直接檢查全域變數，並提供備用方案 =====
        let currentMode = window.gameMode;
        console.log('當前 window.gameMode:', currentMode);
        
        if (currentMode === undefined || currentMode === null) {
            if (document.body.classList.contains('child-mode')) {
                currentMode = 'child';
                console.log('從 body class 判斷為 child');
            } else {
                currentMode = 'adult';
                console.log('預設為 adult');
            }
        }

        // ✅ 獲取顯示文字（支援函數）
        let displayText = line.text || '...';
        if (typeof displayText === 'function') {
            displayText = displayText();
            console.log('✅ displayText 是函數，執行後得到:', displayText);
        }

        // ✅ 獲取名稱（支援函數）
        let lineName = line.name || '未知';
        if (typeof lineName === 'function') {
            lineName = lineName();
            console.log('✅ lineName 是函數，執行後得到:', lineName);
        }
        
        // 直接設定字型
        if (currentMode === 'child') {
            console.log('👶 小朋友模式，直接強制設定字型');
            
            if (line.childText) {
                displayText = line.childText;
            }
            
            const elements = [
                this.dialogueText,
                this.dialogBox,
                this.npcName,
                document.getElementById('dialogue-text'),
                document.getElementById('npc-name'),
                document.getElementById('dialog-box')
            ];
            
            elements.forEach(el => {
                if (el) {
                    el.style.fontFamily = 'BpmfZihiKai, 標楷體, 微軟正黑體, sans-serif';
                    if (el === this.dialogueText || el === document.getElementById('dialogue-text')) {
                        el.style.lineHeight = '1.8';
                    }
                }
            });
            
            console.log('✅ 已設定字型');
        }
        
        // ✅ 顯示對話（使用處理後的 lineName 和 displayText）
        await this.typewriter.showDialogue(
            lineName,
            displayText,
            line.characterImage,
            line.voice,
            line.namePosition || 'left',
            currentMode === 'child' ? 'child-mode-text' : ''
        );
        
        // 對話顯示完成後的處理
        if (line.gallery && line.gallery.length > 0) {
            console.log('🖼️ 發現相簿資料，開啟圖文展示');
            
            if (this.gameContainer) {
                this.gameContainer.onclick = null;
            }
            
            if (typeof GallerySystem !== 'undefined') {
                GallerySystem.open(line.gallery, 0);
                
                const checkGalleryClosed = setInterval(() => {
                    if (!GallerySystem.isActive) {
                        clearInterval(checkGalleryClosed);
                        this.continueAfterGallery(line);
                    }
                }, 200);
            } else {
                console.warn('⚠️ GallerySystem 未載入，跳過相簿');
                this.continueAfterGallery(line);
            }
        } else if (line.options && line.options.length > 0) {
            console.log('🔘 顯示選項:', line.options);
            
            if (!this.optionsContainer) {
                console.error('❌ optionsContainer 不存在，無法顯示選項');
                return;
            }
            
            const selectedOption = await this.typewriter.showOptions(line.options);
            
            if (selectedOption.gallery && selectedOption.gallery.length > 0) {
                console.log('🖼️ 選項帶有相簿，先開啟圖文展示');
                
                if (this.gameContainer) {
                    this.gameContainer.onclick = null;
                }
                
                if (typeof GallerySystem !== 'undefined') {
                    GallerySystem.open(selectedOption.gallery, 0);
                    
                    const checkGalleryClosed = setInterval(() => {
                        if (!GallerySystem.isActive) {
                            clearInterval(checkGalleryClosed);
                            console.log('🖼️ 相簿已關閉，繼續執行選項動作');
                            this.handleOption(selectedOption);
                        }
                    }, 200);
                } else {
                    console.warn('⚠️ GallerySystem 未載入');
                    this.handleOption(selectedOption);
                }
            } else {
                await this.handleOption(selectedOption);
            }
        } else if (line.next) {
            console.log('⏩ 點擊畫面前往:', line.next);
            if (this.gameContainer) {
                this.gameContainer.onclick = () => {
                    this.goToNode(line.next);
                };
            }
        } else {
            console.log('⏩ 點擊畫面到下一句');
            if (this.gameContainer) {
                this.gameContainer.onclick = () => {
                    this.currentIndex++;
                    this.showDialogue();
                };
            }
        }
    },
    
    handleOption: async function(option) {
        console.log('🎯 處理選項:', option);
        
        // 清空選項
        if (this.optionsContainer) {
            this.optionsContainer.innerHTML = '';
            this.optionsContainer.style.display = 'none';
        }
        
        // 根據 action 類型處理
        if (option.action === 'minigame') {
            console.log('🎮 啟動小遊戲:', option.minigame, '關卡:', option.level);
            // ✅ 準備額外選項（過濾掉 action, minigame, returnTo 等）
            const { action, minigame, returnTo, ...extraOptions } = option;
            
            // 傳入 level 和額外選項
            this.startMinigame(option.minigame, option.returnTo, option.level, extraOptions);
        } 
        else if (option.action === 'quiz') {
            console.log('📝 啟動問答測驗');
            
            // 暫停點擊換頁
            if (this.gameContainer) {
                this.gameContainer.onclick = null;
            }
            
            // 在 startQuiz 的 onComplete 回調中，加入儲存分數的邏輯
            this.startQuiz(
                option.questionRange,
                option.questionCount,
                (score) => {
                    console.log(`🎯 問答完成，答對 ${score} 題`);
                    
                    // ✅ 儲存分數到章節資料
                    if (this.currentChapter && this.currentChapter.setQuizScore) {
                        this.currentChapter.setQuizScore(score);
                    }
                    
                    // ✅ 根據 returnTo 跳轉（現在是 quiz_result_menu）
                    if (option.returnTo) {
                        this.goToNode(option.returnTo);
                    } else if (option.scoreTargets && option.scoreTargets[score] !== undefined) {
                        this.goToNode(option.scoreTargets[score]);
                    } else {
                        console.error('❌ 無法決定跳轉節點，score:', score);
                        this.currentIndex++;
                        this.showDialogue();
                    }
                }
            );
        }
        else if (option.action === 'collection') {
            console.log('🗺️ 啟動蒐集模式');
            
            if (this.gameContainer) {
                this.gameContainer.onclick = null;
            }
            
            if (typeof CollectionSystem !== 'undefined') {
                CollectionSystem.open(option.collectionConfig, () => {
                    console.log('✅ 蒐集模式完成');
                    if (option.returnTo) {
                        this.goToNode(option.returnTo);
                    }
                });
            } else {
                console.error('❌ CollectionSystem 未定義');
                if (option.returnTo) {
                    this.goToNode(option.returnTo);
                }
            }
        }
        else if (option.action === 'goto') {
            console.log('➡️ 跳轉到節點:', option.target);
            this.goToNode(option.target);
        }
        else if (option.action === 'recordGameProgress') {
            console.log('📝 記錄遊戲通關，關卡:', option.level);
            if (window.Chapter1_Teen && window.Chapter1_Teen.setLevelCompleted) {
                window.Chapter1_Teen.setLevelCompleted(option.level);
            }
            if (option.next) {
                this.goToNode(option.next);
            }
        }
        else if (option.action === 'checkGameProgress') {
            console.log('🔍 檢查遊戲進度');
            let allCompleted = false;
            if (window.Chapter1_Teen && window.Chapter1_Teen.isAllCompleted) {
                allCompleted = window.Chapter1_Teen.isAllCompleted();
            }
            console.log('三關全通?', allCompleted);
            if (allCompleted) {
                this.goToNode('good_ending');
            } else {
                this.goToNode('normal_ending');
            }
        }
        else if (option.action === 'condition') {
            console.log('❓ 條件分支:', option.condition);
            // 這裡可以加入條件判斷邏輯
            this.goToNode(option.falseTarget || option.target);
        }
        else if (option.next) {
            console.log('➡️ 使用 next 跳轉:', option.next);
            this.goToNode(option.next);
        } else {
            console.log('➡️ 預設：下一句對話');
            this.currentIndex++;
            this.showDialogue();
        }
    },

    // ✅ 在這裡添加 continueAfterGallery 方法
    continueAfterGallery: function(line) {
        console.log('🖼️ 相簿已關閉，繼續對話流程');
        
        // 檢查原本的對話行後續處理
        if (line.options && line.options.length > 0) {
            console.log('🔘 顯示選項:', line.options);
            
            if (!this.optionsContainer) {
                console.error('❌ optionsContainer 不存在，無法顯示選項');
                return;
            }
            
            // 注意：這裡需要用 async/await，但 continueAfterGallery 不是 async
            // 解決方案：使用 Promise 或直接呼叫 typewriter.showOptions
            this.typewriter.showOptions(line.options).then(async (selectedOption) => {
                await this.handleOption(selectedOption);
            });
        } else if (line.next) {
            console.log('⏩ 點擊畫面前往:', line.next);
            if (this.gameContainer) {
                this.gameContainer.onclick = () => {
                    this.goToNode(line.next);
                };
            }
        } else {
            console.log('⏩ 點擊畫面到下一句');
            if (this.gameContainer) {
                this.gameContainer.onclick = () => {
                    this.currentIndex++;
                    this.showDialogue();
                };
            }
        }
    },

    // 問答系統相關屬性
    quizScore: 0,
    currentQuizQuestions: [],
    currentQuizIndex: 0,
    quizCallback: null,

    // 開始問答測驗
    startQuiz: function(questionRange, questionCount, onComplete) {
        console.log('📝 開始問答測驗，範圍:', questionRange, '抽題數:', questionCount);
        
        this.quizScore = 0;
        this.quizCallback = onComplete;
        
        // 從題庫抽題
        this.currentQuizQuestions = QuizQuestions.getRandomQuestions(
            questionRange.start, 
            questionRange.end, 
            questionCount
        );
        
        this.currentQuizIndex = 0;
        
        if (this.currentQuizQuestions.length === 0) {
            console.warn('⚠️ 沒有找到符合範圍的題目');
            if (onComplete) onComplete(0);
            return;
        }
        
        // 開始第一題
        this.showQuizQuestion();
    },

    // 顯示一題問答
    showQuizQuestion: function() {
        if (this.currentQuizIndex >= this.currentQuizQuestions.length) {
            // 所有題目答完
            console.log(`📊 問答完成！答對 ${this.quizScore} / ${this.currentQuizQuestions.length} 題`);
            if (this.quizCallback) {
                this.quizCallback(this.quizScore);
                this.quizCallback = null;
            }
            return;
        }
        
        const question = this.currentQuizQuestions[this.currentQuizIndex];
        console.log(`📝 第 ${this.currentQuizIndex + 1} 題:`, question.text);
        
        // 使用現有的選項系統顯示問題
        const options = question.options.map(opt => ({
            text: opt.text,
            action: 'quiz_answer',
            isCorrect: opt.correct,
            explanation: question.explanation
        }));
        
        // 顯示問題和選項
        this.typewriter.showDialogue(
            '考考你',
            question.text,
            null,
            null,
            'left',
            ''
        ).then(() => {
            this.typewriter.showOptions(options).then(selected => {
                this.handleQuizAnswer(selected);
            });
        });
    },

    // 處理回答
    handleQuizAnswer: function(selectedOption) {
        const question = this.currentQuizQuestions[this.currentQuizIndex];
        const isCorrect = selectedOption.isCorrect === true;
        
        if (isCorrect) {
            this.quizScore++;
            console.log(`✅ 答對！目前累積: ${this.quizScore}`);
            
            // 顯示答對訊息
            this.typewriter.showDialogue(
                '結果',
                '✅ 答對了！\n' + (selectedOption.explanation || ''),
                null,
                null,
                'left',
                ''
            ).then(() => {
                // ✅ 修改：顯示完成後，需要點擊畫面才繼續下一題
                this.waitForClickToContinue();
            });
        } else {
            console.log(`❌ 答錯！正確答案: ${QuizQuestions.getCorrectAnswerText(question)}`);
            
            // 顯示答錯訊息和正確答案
            this.typewriter.showDialogue(
                '結果',
                `❌ 答錯了！正確答案是：${QuizQuestions.getCorrectAnswerText(question)}\n${question.explanation || ''}`,
                null,
                null,
                'left',
                ''
            ).then(() => {
                // ✅ 修改：顯示完成後，需要點擊畫面才繼續下一題
                this.waitForClickToContinue();
            });
        }
    },

    // ✅ 新增方法：等待點擊後繼續下一題
    waitForClickToContinue: function() {
        // 清除舊的點擊事件
        if (this.gameContainer) {
            this.gameContainer.onclick = null;
        }
        
        // 設定點擊事件
        if (this.gameContainer) {
            this.gameContainer.onclick = () => {
                this.gameContainer.onclick = null;
                this.currentQuizIndex++;
                this.showQuizQuestion();
            };
        }
    },
    
    goToNode: function(nodeId) {
        console.log('🎯 前往節點:', nodeId);
        
        const targetIndex = this.findDialogueIndex(nodeId);
        if (targetIndex !== -1) {
            this.currentIndex = targetIndex;
            this.showDialogue();
        } else {
            console.error('❌ 找不到對話節點:', nodeId);
            this.currentIndex++;
            this.showDialogue();
        }
    },
    
    findDialogueIndex: function(nodeId) {
        return this.currentDialogue.findIndex(d => d.id === nodeId);
    },
    
    startMinigame: function(minigameName, returnToConfig, level, extraOptions = {}) {
        console.log('🎮 DialogueSystem 請求啟動小遊戲:', minigameName, '關卡:', level);
        
        // ✅ 儲存關卡編號，用於通關時自動記錄
        this.currentMinigameLevel = level;
        
        // ✅ 儲存完整的 returnTo 配置（可能是字串或物件）
        this.returnToConfig = returnToConfig;
        
        // 清除對話框
        if (this.typewriter) {
            this.typewriter.clear();
        }
        
        // 交給 GameEngine 處理
        if (typeof GameEngine !== 'undefined') {
            GameEngine.startMinigame(minigameName, {
                level: level,
                ...extraOptions,
                onComplete: (success) => {
                    this.onMinigameComplete(success);
                }
            });
        } else {
            console.error('❌ GameEngine 未定義');
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                canvas.style.display = 'block';
                setTimeout(() => {
                    canvas.style.display = 'none';
                    this.onMinigameComplete(true);
                }, 2000);
            }
        }
    },

    // 修改 onMinigameComplete 方法
    onMinigameComplete: function(success) {
        console.log('🏁 小遊戲完成，結果:', success ? '成功' : '失敗');
        
        if (this.gameCanvas) {
            this.gameCanvas.style.display = 'none';
            this.gameCanvas.classList.remove('minigame-active');
        }
        
        // ✅ 從 returnToConfig.success 判斷關卡並記錄
        if (success && this.returnToConfig && this.returnToConfig.success) {
            const successNodeId = this.returnToConfig.success;
            let level = null;
            if (successNodeId === 'level1_complete') level = 1;
            else if (successNodeId === 'level2_complete') level = 2;
            else if (successNodeId === 'level3_complete') level = 3;
            
            if (level) {
                // ✅ 同時支援 Teen 和 Child
                if (window.Chapter1_Teen && window.Chapter1_Teen.setLevelCompleted) {
                    window.Chapter1_Teen.setLevelCompleted(level);
                }
                if (window.Chapter1_Child && window.Chapter1_Child.setLevelCompleted) {
                    window.Chapter1_Child.setLevelCompleted(level);
                }
            }
        }
        
        // ✅ 判斷 returnToConfig 的類型
        let nextNodeId = null;
        
        if (this.returnToConfig) {
            if (typeof this.returnToConfig === 'object' && this.returnToConfig !== null) {
                if (success && this.returnToConfig.success) {
                    nextNodeId = this.returnToConfig.success;
                } else if (!success && this.returnToConfig.fail) {
                    nextNodeId = this.returnToConfig.fail;
                } else if (this.returnToConfig.returnTo) {
                    nextNodeId = this.returnToConfig.returnTo;
                }
            } else if (typeof this.returnToConfig === 'string') {
                if (success) {
                    nextNodeId = this.returnToConfig + '_success';
                } else {
                    nextNodeId = this.returnToConfig + '_fail';
                }
            }
        }
        
        // 跳轉到找到的節點
        if (nextNodeId) {
            const targetIndex = this.findDialogueIndex(nextNodeId);
            if (targetIndex !== -1) {
                this.currentIndex = targetIndex;
            } else {
                console.error('❌ 找不到節點:', nextNodeId);
                this.currentIndex++;
            }
        } else {
            console.warn('⚠️ 沒有定義 returnTo 目標，繼續下一句');
            this.currentIndex++;
        }
        
        // 清空配置
        this.returnToConfig = null;
        
        // 繼續對話
        this.showDialogue();
    },
    
    endDialogue: function(isManualExit = false) {
        console.log('🔚 對話結束, isManualExit:', isManualExit);

        // ✅ 清除旁白打字計時器
        if (this.narrationTimer) {
            clearTimeout(this.narrationTimer);
            this.narrationTimer = null;
        }
        
        // ✅ 清理旁白容器（重建或清空內容）
        if (this.narrationContainer) {
            if (this.narrationText) {
                this.narrationText.textContent = '';  // 清空文字
            }
            // 隱藏容器（下次會重新建立或重用）
            this.narrationContainer.style.display = 'none';
        }
        
        if (this.typewriter) {
            this.typewriter.clear();
        }
        
        if (this.gameContainer) {
            this.gameContainer.onclick = null;
        }
        
        if (this.dialogBox) {
            this.dialogBox.style.display = 'none';
        }
        if (this.optionsContainer) {
            this.optionsContainer.style.display = 'none';
        }
        
        // 檢查是否為開場介紹
        if (this.currentChapter && this.currentChapter.id === 'intro') {
            console.log('🎬 開場介紹結束，前往關卡選擇');
            if (typeof showScene !== 'undefined') {
                showScene('level-select');
            }
        }
        
        // ✅ 修改：只有當不是手動退出時，才觸發完成回調
        if (!isManualExit && this.currentChapter && (this.currentChapter.id === 'chapter1_child' || this.currentChapter.id === 'chapter1_teen' || 
            this.currentChapter.id === 'chapter2_child' || this.currentChapter.id === 'chapter2_teen' ||
            this.currentChapter.id === 'chapter3_child' || this.currentChapter.id === 'chapter3_teen')) {
            
            console.log('🎬 章節對話結束，觸發完成回調');
            
            // 觸發完成回調（這裡才會真正鎖定關卡）
            if (this.onChapterComplete) {
                this.onChapterComplete();
                this.onChapterComplete = null;
            }
            
            // 返回關卡選擇
            if (typeof showScene !== 'undefined') {
                showScene('level-select');
            }
        }
        
        if (this.currentChapter && this.currentChapter.onEnd) {
            this.currentChapter.onEnd();
        }
    }
};

// 確保全域可用
window.DialogueSystem = DialogueSystem;