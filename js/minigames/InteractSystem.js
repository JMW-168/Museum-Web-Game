// js/minigames/InteractSystem.js
// 通用互動系統 - 支援比對、排序、分類三種模式

const InteractSystem = {
    // 狀態
    isActive: false,
    _isCompleting: false,
    currentMode: 'matching',
    currentGameMode: 'adult',  // 儲存當前模式
    currentShop: null,
    onComplete: null,
    
    // DOM 元素
    container: null,
    panel: null,
    gameArea: null,
    dropZonesContainer: null,
    progressFill: null,
    messageArea: null,
    titleEl: null,
    
    // 遊戲數據
    items: [],
    zones: [],
    matchedItems: [],
    totalMatches: 0,
    progress: 0,
    
    // 拖拉狀態
    draggingItem: null,
    draggingElement: null,
    isDragging: false,
    dragStartLocalX: 0,
    dragStartLocalY: 0,
    elementStartLeft: 0,
    elementStartTop: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    
    // 拖曳時的文字標籤
    dragLabel: null,
    
    // 層級管理
    currentMaxZIndex: 1000,
    
    // 縮放相關
    currentScale: 1,
    baseWidth: 1280,
    baseHeight: 720,
    
    // 模式特定屬性
    sortingOrder: [],
    
    // 統一配置：物件大小、間距、邊距
    layoutConfig: {
        itemWidth: 230,
        itemHeight: 230,
        itemGapX: 20,
        itemGapY: 20,
        startX: 20,
        startY: 20,
        placedWidth: 110,
        placedHeight: 110,
        zoneMinWidth: 160,
        zoneMinHeight: 120,
    },
    
    // 儲存每個物件的初始位置
    initialPositions: new Map(),

    // ✅ 新增：知識卡是否開啟中
    isKnowledgeCardOpen: false,
    
    // 初始化
    init: function() {
        console.log('🔧 InteractSystem 初始化');
    },
    
    // 開始遊戲
    start: function(config, onComplete) {
        // ✅ 處理兩種呼叫方式：
        // 方式1: start(config, onComplete)
        // 方式2: start({ ...config, onComplete: fn })
        let finalConfig = config;
        let finalOnComplete = onComplete;
        
        // 如果第一個參數是物件且包含 onComplete 屬性，則從中提取
        if (config && typeof config === 'object' && config.onComplete) {
            finalOnComplete = config.onComplete;
            finalConfig = { ...config };
            delete finalConfig.onComplete;
            console.log('📦 從 config 物件中提取 onComplete');
        }
        
        console.log('🎮 啟動互動系統:', finalConfig);
        console.log('🎮 onComplete 是否存在:', typeof finalOnComplete === 'function');
        
        this.currentGameMode = window.gameMode || 'adult';
        this.currentMode = finalConfig.mode;
        this.currentShop = finalConfig.shopName;
        this.onComplete = finalOnComplete;
        this.isActive = true;
        this.matchedItems = [];
        this.progress = 0;
        this.currentMaxZIndex = 1000;
        this._isCompleting = false;
        
        this.items = finalConfig.items || [];
        this.zones = finalConfig.zones || [];
        this.totalMatches = finalConfig.totalMatches || this.items.length;
        
        if (this.currentMode === 'sorting') {
            this.sortingOrder = finalConfig.correctOrder || [];
            console.log('📋 排序模式正確順序:', this.sortingOrder);
        }
        
        this.createUI(finalConfig);
        this.createDragItems();
        this.createDropZones();
        this.showHint(finalConfig.hint);
        
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
        
        console.log('✅ InteractSystem 啟動完成');
    },
    
    // 處理視窗縮放
    handleResize: function() {
        if (!this.container) return;
        
        const wrapper = document.getElementById('game-wrapper');
        if (!wrapper) return;
        
        const wrapperRect = wrapper.getBoundingClientRect();
        this.currentScale = wrapperRect.width / this.baseWidth;
        
        if (this.panel) {
            this.panel.style.transform = `scale(${this.currentScale})`;
            this.panel.style.transformOrigin = 'top left';
            const scaledWidth = this.baseWidth * this.currentScale;
            const scaledHeight = this.baseHeight * this.currentScale;
            this.panel.style.left = `${(wrapperRect.width - scaledWidth) / 2}px`;
            this.panel.style.top = `${(wrapperRect.height - scaledHeight) / 2}px`;
            this.panel.style.position = 'absolute';
        }
        
        // 調整文字大小
        if (this.titleEl) {
            this.titleEl.style.fontSize = `${Math.max(24, Math.min(48, 36 * this.currentScale))}px`;
        }
        
        if (this.messageArea) {
            this.messageArea.style.fontSize = `${Math.max(14, Math.min(24, 18 * this.currentScale))}px`;
        }
        
        const zoneTitles = document.querySelectorAll('.interact-zone-title');
        zoneTitles.forEach(title => {
            title.style.fontSize = `${Math.max(28, Math.min(36, 32 * this.currentScale))}px`;
        });
        
        const zoneHints = document.querySelectorAll('.interact-zone-hint');
        zoneHints.forEach(hint => {
            hint.style.fontSize = `${Math.max(22, Math.min(28, 24 * this.currentScale))}px`;
        });
        
        this.updateBounds();
    },
    
    // 建立 UI
    createUI: function(config) {
        if (this.container) {
            this.container.remove();
        }
        
        const gameWrapper = document.getElementById('game-wrapper');
        if (!gameWrapper) {
            console.error('❌ 找不到 #game-wrapper');
            return;
        }
        
        this.container = document.createElement('div');
        this.container.className = 'interact-container';
        
        this.panel = document.createElement('div');
        this.panel.className = 'interact-panel';
        
        this.titleEl = document.createElement('div');
        this.titleEl.className = 'interact-title';
        this.titleEl.textContent = config.title || '互動小遊戲';
        
        this.gameArea = document.createElement('div');
        this.gameArea.id = 'interact-game-area';
        this.gameArea.className = 'interact-game-area';
        
        this.dropZonesContainer = document.createElement('div');
        this.dropZonesContainer.id = 'interact-drop-zones';
        this.dropZonesContainer.className = 'interact-drop-zones';
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'interact-progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'interact-progress-bar';
        
        this.progressFill = document.createElement('div');
        this.progressFill.className = 'interact-progress-fill';
        progressBar.appendChild(this.progressFill);
        
        this.messageArea = document.createElement('div');
        this.messageArea.className = 'interact-message';
        
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(this.messageArea);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'interact-close-btn';
        closeBtn.textContent = '✕ 關閉遊戲';
        closeBtn.onclick = () => {
            if (confirm('確定要離開嗎？進度不會儲存。')) {
                this.close();
                if (this.onComplete) this.onComplete(false);
            }
        };
        
        this.panel.appendChild(this.titleEl);
        this.panel.appendChild(this.gameArea);
        this.panel.appendChild(this.dropZonesContainer);
        this.panel.appendChild(progressContainer);
        this.panel.appendChild(closeBtn);
        this.container.appendChild(this.panel);
        
        gameWrapper.appendChild(this.container);
        
        this.updateBounds();
    },
    
    updateBounds: function() {
        if (this.gameArea) {
            const rect = this.gameArea.getBoundingClientRect();
            this.gameAreaBounds = {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height
            };
        }
    },
    
    // 將螢幕座標轉換為面板內邏輯座標
    screenToPanelLocal: function(screenX, screenY) {
        if (!this.panel) return { x: screenX, y: screenY };
        const panelRect = this.panel.getBoundingClientRect();
        return {
            x: (screenX - panelRect.left) / this.currentScale,
            y: (screenY - panelRect.top) / this.currentScale
        };
    },
    
    // 計算物件在 gameArea 中的排列位置
    calculateItemPosition: function(index, totalItems, areaWidth, areaHeight) {
        const cfg = this.layoutConfig;
        const cols = Math.max(1, Math.floor(areaWidth / (cfg.itemWidth + cfg.itemGapX)));
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        let posX = cfg.startX + col * (cfg.itemWidth + cfg.itemGapX);
        let posY = cfg.startY + row * (cfg.itemHeight + cfg.itemGapY);
        
        const maxX = areaWidth - cfg.itemWidth;
        if (posX > maxX) posX = maxX;
        
        const maxY = areaHeight - cfg.itemHeight;
        if (posY > maxY) posY = maxY;
        
        return { x: posX, y: posY };
    },
    
    // 建立可拖曳物件（順序隨機）
    createDragItems: function() {
        if (!this.gameArea) return;
        this.gameArea.innerHTML = '';
        this.initialPositions.clear();
        
        const areaWidth = this.gameArea.clientWidth;
        const areaHeight = this.gameArea.clientHeight;
        
        // ✅ 複製一份 items 陣列並打亂順序
        const shuffledItems = [...this.items];
        for (let i = shuffledItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
        }
        
        // 使用打亂後的順序建立物件
        shuffledItems.forEach((item, index) => {
            const { x: posX, y: posY } = this.calculateItemPosition(index, this.items.length, areaWidth, areaHeight);
            const dragEl = this.createDraggableItem(item, index, posX, posY);
            this.gameArea.appendChild(dragEl);
            
            this.initialPositions.set(dragEl, { x: posX, y: posY });
            dragEl.setAttribute('data-original-left', posX);
            dragEl.setAttribute('data-original-top', posY);
            
            dragEl.style.zIndex = 100 + index * 10;
            this.currentMaxZIndex = Math.max(this.currentMaxZIndex, 100 + index * 10);
        });
    },
    
    createDraggableItem: function(item, index, posX, posY) {
        const cfg = this.layoutConfig;
        const dragEl = document.createElement('div');
        
        dragEl.className = 'interact-drag-item';
        dragEl.setAttribute('data-id', item.id);
        dragEl.setAttribute('data-name', item.name);
        dragEl.setAttribute('data-correct-zone', item.correctZone || '');
        dragEl.setAttribute('data-matched', 'false');
        
        const randomRotate = (Math.random() * 16) - 8;
        dragEl.setAttribute('data-rotate', randomRotate);
        
        dragEl.style.width = `${cfg.itemWidth}px`;
        dragEl.style.height = `${cfg.itemHeight}px`;
        dragEl.style.left = `${posX}px`;
        dragEl.style.top = `${posY}px`;
        dragEl.style.transform = `rotate(${randomRotate}deg)`;
        
        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.pointerEvents = 'none';
            dragEl.appendChild(img);
        } else {
            dragEl.style.background = 'linear-gradient(145deg, #5a4738, #3a2a1f)';
            const defaultIcon = document.createElement('span');
            defaultIcon.textContent = '📦';
            defaultIcon.style.fontSize = '70px';
            defaultIcon.style.pointerEvents = 'none';
            dragEl.appendChild(defaultIcon);
        }
        
        // ✅ 使用 click 事件替代 dblclick（更可靠）
        dragEl.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('點擊:', item.name);
            this.showKnowledgeCard(item);
        });
        
        dragEl.addEventListener('dragstart', (e) => e.preventDefault());
        this.makeDraggable(dragEl, item);
        
        return dragEl;
    },

    // 顯示知識卡彈窗（圖片左，文字右，限制高度）- 支援兒童模式字體
    showKnowledgeCard: function(item) {
        console.log('📖 顯示知識卡:', item.name);
        
        if (!item.knowledgeCard) {
            console.warn('沒有知識卡內容:', item.name);
            return;
        }
        
        // ✅ 標記知識卡開啟，禁用背景拖曳
        this.isKnowledgeCardOpen = true;

        // ✅ 獲取當前模式，決定字體
        const isChildMode = (window.gameMode === 'child');
        const titleFontFamily = isChildMode ? "'BpmfZihiKai', 'LXGW WenKai TC', '標楷體', sans-serif" : "'LXGW WenKai TC', 'DFKai-SB', 'Kaiti TC', '標楷體', sans-serif";
        const textFontFamily = isChildMode ? "'BpmfZihiKai', 'LXGW WenKai TC', '標楷體', sans-serif" : "'LXGW WenKai TC', 'DFKai-SB', 'Kaiti TC', '標楷體', sans-serif";
        
        // 建立遮罩層
        const overlay = document.createElement('div');
        overlay.className = 'knowledge-card-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 20000;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        `;
        
        // 建立知識卡容器 - 左右並排
        const card = document.createElement('div');
        card.className = 'knowledge-card';
        card.style.cssText = `
            width: 500px;
            max-width: 90%;
            max-height: 80vh;
            background: linear-gradient(145deg, #fef9e8, #f5ecd8);
            border: 3px solid #e67e22;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            animation: knowledgeCardAppear 0.3s ease-out;
            position: relative;
            display: flex;
            flex-direction: row;
            overflow: hidden;
        `;
        
        // 關閉按鈕
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 12px;
            right: 16px;
            background: rgba(0,0,0,0.5);
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: white;
            transition: all 0.2s;
            padding: 0;
            margin: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            z-index: 10;
        `;
        closeBtn.onmouseenter = () => {
            closeBtn.style.background = '#e67e22';
        };
        closeBtn.onmouseleave = () => {
            closeBtn.style.background = 'rgba(0,0,0,0.5)';
        };
        closeBtn.onclick = () => {
            this.isKnowledgeCardOpen = false;
            overlay.remove();
        };
        
        // ========== 左側：圖片區 ==========
        const leftArea = document.createElement('div');
        leftArea.style.cssText = `
            width: 180px;
            flex-shrink: 0;
            background: rgba(230, 126, 34, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.style.cssText = `
                width: 100%;
                height: auto;
                max-height: 180px;
                object-fit: contain;
                border-radius: 16px;
                border: 2px solid #e67e22;
                background: white;
                padding: 8px;
                box-sizing: border-box;
            `;
            leftArea.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.textContent = '📦';
            placeholder.style.cssText = `
                font-size: 80px;
                text-align: center;
            `;
            leftArea.appendChild(placeholder);
        }
        
        // ========== 右側：文字區（可滾動） ==========
        const rightArea = document.createElement('div');
        rightArea.style.cssText = `
            flex: 1;
            padding: 20px 20px 20px 0;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            max-height: 80vh;
        `;
        
        // ✅ 標題 - 使用兒童模式字體
        const title = document.createElement('h3');
        title.textContent = item.knowledgeCard.title || item.name;
        title.style.cssText = `
            color: #5c4a2a;
            font-size: 22px;
            margin: 0 0 8px 0;
            font-weight: bold;
            padding-right: 30px;
            font-family: ${titleFontFamily};
            letter-spacing: ${isChildMode ? '2px' : 'normal'};
        `;
        
        // ✅ 描述/特徵 - 使用兒童模式字體
        const desc = document.createElement('p');
        desc.textContent = item.knowledgeCard.description || '';
        desc.style.cssText = `
            color: #8b7355;
            font-size: 14px;
            margin-bottom: 16px;
            font-style: italic;
            line-height: 1.5;
            font-family: ${textFontFamily};
        `;
        
        // 分隔線
        const divider = document.createElement('hr');
        divider.style.cssText = `
            border: none;
            height: 1px;
            background: linear-gradient(90deg, transparent, #e67e22, transparent);
            margin: 12px 0;
        `;
        
        // ✅ 詳細說明 - 使用兒童模式字體
        const detail = document.createElement('p');
        detail.textContent = item.knowledgeCard.detail || '';
        detail.style.cssText = `
            color: #5c4a2a;
            font-size: 14px;
            line-height: 1.7;
            margin: 0;
            font-family: ${textFontFamily};
        `;
        
        rightArea.appendChild(title);
        rightArea.appendChild(desc);
        rightArea.appendChild(divider);
        rightArea.appendChild(detail);
        
        // 組合卡片
        card.appendChild(closeBtn);
        card.appendChild(leftArea);
        card.appendChild(rightArea);
        overlay.appendChild(card);
        
        document.body.appendChild(overlay);
        
        // 點擊遮罩關閉
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.isKnowledgeCardOpen = false;
                overlay.remove();
            }
        });
    },
    
    // 建立拖曳時的文字標籤
    createDragLabel: function(name, mouseX, mouseY) {
        const label = document.createElement('div');
        label.className = 'interact-drag-label';
        label.textContent = name;
        
        const fontSize = Math.max(14, Math.min(32, 20 * this.currentScale));
        const paddingV = Math.max(6, Math.min(12, 8 * this.currentScale));
        const paddingH = Math.max(12, Math.min(24, 18 * this.currentScale));
        const borderRadius = Math.max(20, Math.min(40, 30 * this.currentScale));
        const borderWidth = Math.max(1, Math.min(3, 2 * this.currentScale));
        const offset = 15 * this.currentScale;
        
        label.style.cssText = `
            position: fixed;
            left: ${mouseX + offset}px;
            top: ${mouseY + offset}px;
            padding: ${paddingV}px ${paddingH}px;
            border-radius: ${borderRadius}px;
            font-size: ${fontSize}px;
            border-width: ${borderWidth}px;
        `;
        document.body.appendChild(label);
        return label;
    },
    
    updateDragLabelPosition: function(label, mouseX, mouseY) {
        if (label) {
            const offset = 15 * this.currentScale;
            label.style.left = `${mouseX + offset}px`;
            label.style.top = `${mouseY + offset}px`;
        }
    },
    
    removeDragLabel: function() {
        if (this.dragLabel && this.dragLabel.remove) {
            this.dragLabel.remove();
        }
        this.dragLabel = null;

        const allLabels = document.querySelectorAll('.interact-drag-label');
        allLabels.forEach(label => label.remove());
    },
    
    bringToFront: function(element) {
        this.currentMaxZIndex++;
        element.style.zIndex = this.currentMaxZIndex;
    },
    
    isPointInDropZone: function(x, y) {
        const zones = document.querySelectorAll('.interact-drop-zone');
        for (const zone of zones) {
            const rect = zone.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return zone;
            }
        }
        return null;
    },
    
    isPointInGameArea: function(x, y) {
        if (!this.gameAreaBounds) return false;
        return x >= this.gameAreaBounds.left && x <= this.gameAreaBounds.right &&
               y >= this.gameAreaBounds.top && y <= this.gameAreaBounds.bottom;
    },
    
    // 拖曳邏輯 - 檢查是否已配對或知識卡開啟中
    makeDraggable: function(element, itemData) {
        let startMouseX = 0, startMouseY = 0;
        let startLeft = 0, startTop = 0;
        let isDraggingLocal = false;
        
        const onPointerMove = (e) => {
            if (!isDraggingLocal) return;
            e.preventDefault();
            
            const deltaX = e.clientX - startMouseX;
            const deltaY = e.clientY - startMouseY;
            
            const deltaLocalX = deltaX / this.currentScale;
            const deltaLocalY = deltaY / this.currentScale;
            
            const newLeft = startLeft + deltaLocalX;
            const newTop = startTop + deltaLocalY;
            
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
            element.style.transform = 'scale(1.05) rotate(0deg)';
            element.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
            element.style.filter = 'brightness(1.1)';
            element.style.cursor = 'grabbing';
            
            this.updateDragLabelPosition(this.dragLabel, e.clientX, e.clientY);
            this.highlightDropZones(e.clientX, e.clientY);
        };
        
        const onPointerUp = (e) => {
            if (!isDraggingLocal) return;
            
            const targetZone = this.isPointInDropZone(e.clientX, e.clientY);
            const isCorrect = this.checkCorrectDrop(targetZone, element, itemData);
            
            if (targetZone && isCorrect && element.getAttribute('data-matched') !== 'true') {
                this.onCorrectDrop(targetZone, element, itemData);
            } else if (targetZone && !isCorrect) {
                this.showMessage('這個位置不對喔！', '#ffaa00');
                this.resetToGameArea(element);
            } else {
                const gameAreaRect = this.gameArea.getBoundingClientRect();
                const isInGameArea = e.clientX >= gameAreaRect.left && e.clientX <= gameAreaRect.right &&
                                    e.clientY >= gameAreaRect.top && e.clientY <= gameAreaRect.bottom;
                
                if (isInGameArea) {
                    if (element.parentNode !== this.gameArea) {
                        this.gameArea.appendChild(element);
                    }
                } else {
                    this.resetToGameArea(element);
                }
            }
            
            element.style.transform = `rotate(${element.getAttribute('data-rotate') || 0}deg)`;
            element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            element.style.filter = '';
            element.style.cursor = 'grab';
            
            this.removeDragLabel();
            
            isDraggingLocal = false;
            this.draggingItem = null;
            this.draggingElement = null;
            
            this.clearDropZonesHighlight();
            document.body.style.userSelect = '';
            
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };
        
        element.addEventListener('pointerdown', (e) => {
            // ✅ 如果已經配對成功，不能拖曳
            if (element.getAttribute('data-matched') === 'true') {
                console.log('已配對，不能拖曳');
                return;
            }
            
            // ✅ 如果知識卡開啟中，不能拖曳
            if (this.isKnowledgeCardOpen) {
                console.log('知識卡開啟中，不能拖曳');
                return;
            }
            
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            
            startMouseX = e.clientX;
            startMouseY = e.clientY;
            startLeft = parseFloat(element.style.left) || 0;
            startTop = parseFloat(element.style.top) || 0;
            
            this.dragLabel = this.createDragLabel(itemData.name, e.clientX, e.clientY);
            this.bringToFront(element);
            
            isDraggingLocal = true;
            this.draggingItem = itemData;
            this.draggingElement = element;
            
            document.body.style.userSelect = 'none';
            
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        });
        
        element.style.cursor = 'grab';
    },
    
    checkCorrectDrop: function(zoneEl, element, itemData) {
        if (!zoneEl) return false;
        const zoneId = zoneEl.getAttribute('data-zone-id');
        
        switch (this.currentMode) {
            case 'matching':
                return itemData.correctZone === zoneId;
            case 'sorting':
                const sortPosition = parseInt(zoneEl.getAttribute('data-sort-position'));
                return itemData.id === this.sortingOrder[sortPosition];
            case 'classifying':
                const expectedItem = zoneEl.getAttribute('data-expected-item');
                return itemData.correctZone === zoneId || itemData.id === expectedItem;
            default:
                return itemData.correctZone === zoneId;
        }
    },
    
    // 重置到 gameArea 內的初始位置
    resetToGameArea: function(element) {
        this.removeDragLabel();
        if (!this.gameAreaBounds) return;
        
        const sortedUnmatched = [];
        this.items.forEach(item => {
            const el = this.gameArea.querySelector(`.interact-drag-item[data-id="${item.id}"][data-matched="false"]`);
            if (el) {
                sortedUnmatched.push(el);
            }
        });
        
        sortedUnmatched.forEach((item, idx) => {
            const originalPos = this.initialPositions.get(item);
            
            if (originalPos) {
                item.style.transition = 'all 0.3s ease-out';
                item.style.position = 'absolute';
                item.style.left = `${originalPos.x}px`;
                item.style.top = `${originalPos.y}px`;
            } else {
                const { x: posX, y: posY } = this.calculateItemPosition(idx, sortedUnmatched.length, this.gameAreaBounds.width, this.gameAreaBounds.height);
                item.style.left = `${posX}px`;
                item.style.top = `${posY}px`;
            }
            
            const rotate = item.getAttribute('data-rotate') || (Math.random() * 16) - 8;
            item.style.transform = `rotate(${rotate}deg)`;
            
            setTimeout(() => {
                item.style.transition = '';
            }, 300);
        });
    },
    
    onCorrectDrop: function(zoneEl, element, itemData) {
        this.removeDragLabel();
        const cfg = this.layoutConfig;
        const zoneId = zoneEl.getAttribute('data-zone-id');
        
        element.setAttribute('data-matched', 'true');
        element.style.cursor = 'default';
        element.style.opacity = '0.85';
        
        const placedContainer = zoneEl.querySelector(`.zone-placed-${zoneId}`);
        if (placedContainer) {
            const randomRotate = (Math.random() * 12) - 6;
            const randomX = (Math.random() * 15) - 7.5;
            const randomY = (Math.random() * 15) - 7.5;
            
            element.style.position = 'relative';
            element.style.left = '0';
            element.style.top = '0';
            element.style.transform = `rotate(${randomRotate}deg) translate(${randomX}px, ${randomY}px)`;
            element.style.display = 'inline-flex';
            element.style.width = `${cfg.placedWidth}px`;
            element.style.height = `${cfg.placedHeight}px`;
            
            placedContainer.appendChild(element);
        }
        
        this.matchedItems.push(itemData.id);
        this.progress = (this.matchedItems.length / this.totalMatches) * 100;
        this.updateProgress();
        
        this.showMessage('✓ 正確！', '#00ff88');
        
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playSFX('assets/sounds/success.mp3', 0.3);
        }
        
        if (this.matchedItems.length >= this.totalMatches) {
            this.completeGame();
        }
    },
    
    highlightDropZones: function(x, y) {
        const zones = document.querySelectorAll('.interact-drop-zone');
        zones.forEach(zone => {
            const rect = zone.getBoundingClientRect();
            const isOver = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
            
            if (isOver) {
                zone.classList.add('highlight');
            } else {
                zone.classList.remove('highlight');
            }
        });
    },
    
    clearDropZonesHighlight: function() {
        const zones = document.querySelectorAll('.interact-drop-zone');
        zones.forEach(zone => {
            zone.classList.remove('highlight');
        });
    },
    
    // 建立放置區域
    createDropZones: function() {
        if (!this.dropZonesContainer) return;
        this.dropZonesContainer.innerHTML = '';
        
        const cfg = this.layoutConfig;
        
        this.zones.forEach((zone, index) => {
            const zoneEl = document.createElement('div');
            zoneEl.className = 'interact-drop-zone';
            zoneEl.setAttribute('data-zone-id', zone.id);
            zoneEl.setAttribute('data-expected-item', zone.expectedItem || '');
            zoneEl.setAttribute('data-sort-position', zone.sortPosition !== undefined ? zone.sortPosition : index);
            
            zoneEl.style.minWidth = `${cfg.zoneMinWidth}px`;
            zoneEl.style.minHeight = `${cfg.zoneMinHeight}px`;
            
            const title = document.createElement('div');
            title.className = 'interact-zone-title';
            title.textContent = zone.name;
            zoneEl.appendChild(title);
            
            const hint = document.createElement('div');
            hint.className = 'interact-zone-hint';
            hint.textContent = zone.hint || '⬅️ 拖曳至此';
            zoneEl.appendChild(hint);
            
            const placedContainer = document.createElement('div');
            placedContainer.className = `zone-placed-${zone.id}`;
            placedContainer.style.marginTop = '10px';
            placedContainer.style.display = 'flex';
            placedContainer.style.flexWrap = 'wrap';
            placedContainer.style.gap = '8px';
            placedContainer.style.justifyContent = 'center';
            placedContainer.style.minHeight = '80px';
            zoneEl.appendChild(placedContainer);
            
            this.dropZonesContainer.appendChild(zoneEl);
        });
    },
    
    updateProgress: function() {
        if (this.progressFill) {
            this.progressFill.style.width = `${this.progress}%`;
        }
    },
    
    showMessage: function(msg, color) {
        if (this.messageArea) {
            this.messageArea.innerHTML = msg;
            this.messageArea.style.color = color;
            setTimeout(() => {
                if (this.messageArea) {
                    this.messageArea.innerHTML = '';
                }
            }, 1500);
        }
    },
    
    // 顯示提示（修正：允許換行，根據畫面縮放）
    showHint: function(hint) {
        if (!hint) return;
        
        const hintDiv = document.createElement('div');
        hintDiv.textContent = hint;
        hintDiv.style.cssText = `
            position: absolute;
            bottom: 5%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #ffd700;
            padding: 10px 20px;
            border-radius: 30px;
            font-size: ${Math.max(12, Math.min(18, 16 * this.currentScale))}px;
            z-index: 4010;
            animation: fadeOut 4s forwards;
            max-width: 85%;
            text-align: center;
            line-height: 1.4;
            white-space: normal;
            word-wrap: break-word;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            border: 1px solid #e67e22;
            pointer-events: none;
        `;
        this.container.appendChild(hintDiv);
        setTimeout(() => hintDiv.remove(), 4000);
    },
    
    // 完成遊戲
    completeGame: function() {
        console.log('🎉 遊戲完成！');
        this.isActive = false;
        
        // 防止重複呼叫
        if (this._isCompleting) return;
        this._isCompleting = true;
        
        // 顯示完成訊息
        const completeMsg = document.createElement('div');
        completeMsg.textContent = '✨ 任務完成！ ✨';
        completeMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: #ffd700;
            padding: 20px 40px;
            border-radius: 30px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            border: 3px solid #e67e22;
            animation: popupAppear 0.3s ease-out;
            cursor: pointer;
            text-align: center;
            white-space: nowrap;
        `;
        document.body.appendChild(completeMsg);
        
        const finishGame = () => {
            if (completeMsg && completeMsg.parentNode) completeMsg.remove();
            this.close();
            if (this.onComplete) {
                console.log('📞 呼叫 onComplete(true)');
                this.onComplete(true);
            }
            this._isCompleting = false;
        };
        
        completeMsg.onclick = finishGame;
        
        // 2秒後自動關閉
        setTimeout(() => {
            if (completeMsg && completeMsg.parentNode) {
                console.log('⏰ 自動關閉');
                finishGame();
            }
        }, 2000);
    },
    
    // 關閉遊戲（修正：移除錯誤的方法呼叫）
    close: function() {
        console.log('🗺️ 關閉遊戲模式');
        
        this.isActive = false;
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    },
};

window.InteractSystem = InteractSystem;