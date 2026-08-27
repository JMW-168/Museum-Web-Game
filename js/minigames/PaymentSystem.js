// js/minigames/PaymentSystem.js
// 付款系統 - 拖曳銅板付款（左右填滿，錢可堆疊）

const PaymentSystem = {
    // 狀態
    isActive: false,
    amount: 0,
    paidAmount: 0,
    onComplete: null,
    
    // DOM 元素
    container: null,
    panel: null,
    coinsArea: null,
    paymentArea: null,
    amountDisplay: null,
    messageArea: null,
    
    // 銅板列表
    coins: [],
    paidCoins: [],
    
    // 縮放相關
    currentScale: 1,
    baseWidth: 1280,
    baseHeight: 720,
    
    // 拖拉狀態
    draggingCoin: null,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    coinStartLeft: 0,
    coinStartTop: 0,
    coinOriginalParent: null,
    
    // 初始化
    init: function() {
        console.log('💰 PaymentSystem 初始化');
    },
    
    // 開始付款
    start: function(amount, onComplete) {
        console.log(`💰 開始付款，需支付: ${amount} 銅板`);
        
        // 從 Chapter3_Teen 取得實際銅板數量
        let totalCoins = 20;
        if (window.Chapter3_Teen && typeof window.Chapter3_Teen.getMoney === 'function') {
            totalCoins = window.Chapter3_Teen.getMoney();
            console.log(`💰 玩家目前有 ${totalCoins} 枚銅板`);
        }
        
        this.amount = amount;
        this.paidAmount = 0;
        this.totalCoins = totalCoins;
        this.onComplete = onComplete;
        this.isActive = true;
        this.paidCoins = [];
        
        this.createUI();
        this.createCoins();
        this.handleResize();
        
        window.addEventListener('resize', () => this.handleResize());
        
        console.log('✅ PaymentSystem 啟動完成');
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
            this.panel.style.transformOrigin = 'center center';
        }
    },
    
    // 建立 UI（左右填滿）
    createUI: function() {
        if (this.container) {
            this.container.remove();
        }
        
        const gameWrapper = document.getElementById('game-wrapper');
        if (!gameWrapper) {
            console.error('❌ 找不到 #game-wrapper');
            return;
        }
        
        this.container = document.createElement('div');
        this.container.className = 'payment-container';
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 4000;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        `;
        
        // 面板 - 佔滿左右，高度自動
        this.panel = document.createElement('div');
        this.panel.className = 'payment-panel';
        this.panel.style.cssText = `
            width: 90%;
            max-width: 1000px;
            height: auto;
            max-height: 85%;
            background: linear-gradient(145deg, #fef9e8, #f5ecd8);
            border: 3px solid #e67e22;
            border-radius: 24px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            position: relative;
            display: flex;
            flex-direction: column;
        `;
        
        // 標題區
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        `;
        
        const title = document.createElement('div');
        title.textContent = '💰 付款 💰';
        title.style.cssText = `
            font-size: 24px;
            color: #e67e22;
            font-weight: bold;
        `;
        
        // 金額顯示
        this.amountDisplay = document.createElement('div');
        this.amountDisplay.style.cssText = `
            font-size: 20px;
            color: #5c4a2a;
            font-weight: bold;
            background: rgba(230,126,34,0.1);
            padding: 8px 16px;
            border-radius: 30px;
        `;
        this.updateAmountDisplay();
        
        header.appendChild(title);
        header.appendChild(this.amountDisplay);
        
        // 老闆資訊區
        const bossArea = document.createElement('div');
        bossArea.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
            background: rgba(230,126,34,0.1);
            padding: 10px;
            border-radius: 20px;
        `;
        
        const bossIcon = document.createElement('div');
        bossIcon.textContent = '🧑‍🍳';
        bossIcon.style.cssText = `
            font-size: 40px;
            background: rgba(230,126,34,0.2);
            border-radius: 50%;
            padding: 10px;
        `;
        
        const bossText = document.createElement('div');
        bossText.textContent = '老闆：請付款！';
        bossText.style.cssText = `
            color: #5c4a2a;
            font-size: 16px;
            font-weight: bold;
        `;
        
        bossArea.appendChild(bossIcon);
        bossArea.appendChild(bossText);
        
        // 左右內容區（填滿）
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            gap: 20px;
            flex: 1;
            min-height: 250px;
        `;
        
        // 左側：銅板區（玩家的錢）
        this.coinsArea = document.createElement('div');
        this.coinsArea.className = 'payment-coins-area';
        this.coinsArea.style.cssText = `
            flex: 1;
            background: rgba(210,180,140,0.2);
            border-radius: 20px;
            padding: 15px;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
            align-items: flex-start;
            align-content: flex-start;
            overflow-y: auto;
            min-height: 200px;
        `;
        
        // 左側標籤
        const leftLabel = document.createElement('div');
        leftLabel.textContent = '💰 你的錢袋';
        leftLabel.style.cssText = `
            font-size: 14px;
            color: #8b7355;
            margin-bottom: 10px;
            text-align: center;
            width: 100%;
        `;
        this.coinsArea.appendChild(leftLabel);
        
        // 銅板容器
        this.coinsContainer = document.createElement('div');
        this.coinsContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            align-items: center;
            width: 100%;
        `;
        this.coinsArea.appendChild(this.coinsContainer);
        
        // 右側：付款區（老闆收錢的地方）
        this.paymentArea = document.createElement('div');
        this.paymentArea.className = 'payment-payment-area';
        this.paymentArea.style.cssText = `
            flex: 1;
            background: rgba(230,126,34,0.15);
            border: 2px dashed #e67e22;
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 15px;
            min-height: 200px;
        `;
        
        // 右側標籤
        const rightLabel = document.createElement('div');
        rightLabel.textContent = '🧑‍🍳 老闆收款區';
        rightLabel.style.cssText = `
            font-size: 14px;
            color: #e67e22;
            margin-bottom: 10px;
            text-align: center;
            width: 100%;
            font-weight: bold;
        `;
        this.paymentArea.appendChild(rightLabel);
        
        // 已付款銅板容器（堆疊區）
        this.paidCoinsContainer = document.createElement('div');
        this.paidCoinsContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
            align-items: center;
            width: 100%;
            min-height: 100px;
        `;
        this.paymentArea.appendChild(this.paidCoinsContainer);
        
        const paymentHint = document.createElement('div');
        paymentHint.textContent = '⬅️ 將銅板拖曳到此區付款';
        paymentHint.style.cssText = `
            color: #8b7355;
            font-size: 12px;
            margin-top: 10px;
        `;
        this.paymentArea.appendChild(paymentHint);
        
        content.appendChild(this.coinsArea);
        content.appendChild(this.paymentArea);
        
        // 訊息區域
        this.messageArea = document.createElement('div');
        this.messageArea.style.cssText = `
            margin-top: 15px;
            padding: 8px;
            border-radius: 12px;
            font-size: 14px;
            min-height: 45px;
            text-align: center;
        `;
        
        // 按鈕區
        const buttonArea = document.createElement('div');
        buttonArea.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 15px;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '取消';
        closeBtn.style.cssText = `
            background: #95a5a6;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 30px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        `;
        closeBtn.onmouseenter = () => closeBtn.style.background = '#7f8c8d';
        closeBtn.onmouseleave = () => closeBtn.style.background = '#95a5a6';
        closeBtn.onclick = () => {
            if (confirm('確定要取消付款嗎？')) {
                this.close();
                if (this.onComplete) this.onComplete(false);
            }
        };
        
        buttonArea.appendChild(closeBtn);
        
        this.panel.appendChild(header);
        this.panel.appendChild(bossArea);
        this.panel.appendChild(content);
        this.panel.appendChild(this.messageArea);
        this.panel.appendChild(buttonArea);
        this.container.appendChild(this.panel);
        
        gameWrapper.appendChild(this.container);
    },
    
    // 建立銅板
    createCoins: function() {
        if (!this.coinsContainer) return;
        this.coinsContainer.innerHTML = '';
        this.coins = [];
        
        // 顯示所有銅板（最多顯示 20 枚）
        const displayCount = Math.min(this.totalCoins, 20);
        
        for (let i = 0; i < displayCount; i++) {
            const coin = this.createCoin(i);
            this.coinsContainer.appendChild(coin);
            this.coins.push(coin);
        }
    },
    
    // 建立單個銅板
    createCoin: function(index) {
        const coin = document.createElement('div');
        coin.className = 'payment-coin';
        coin.setAttribute('data-index', index);
        coin.setAttribute('data-paid', 'false');
        
        // 隨機旋轉角度，增加堆疊感
        const randomRotate = (Math.random() * 10) - 5;
        
        coin.style.cssText = `
            width: 55px;
            height: 55px;
            background: radial-gradient(circle at 30% 35%, #ffd700, #e6b800);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
            box-shadow: 0 3px 6px rgba(0,0,0,0.2);
            transition: transform 0.1s, box-shadow 0.2s;
            font-size: 24px;
            font-weight: bold;
            color: #b8860b;
            transform: rotate(${randomRotate}deg);
        `;
        coin.textContent = '💰';
        
        // 懸停效果
        coin.addEventListener('mouseenter', () => {
            if (coin.getAttribute('data-paid') !== 'true') {
                coin.style.transform = `scale(1.05) rotate(${randomRotate}deg)`;
                coin.style.boxShadow = '0 5px 12px rgba(0,0,0,0.3)';
            }
        });
        coin.addEventListener('mouseleave', () => {
            if (coin.getAttribute('data-paid') !== 'true') {
                coin.style.transform = `scale(1) rotate(${randomRotate}deg)`;
                coin.style.boxShadow = '0 3px 6px rgba(0,0,0,0.2)';
            }
        });
        
        this.makeDraggable(coin, index);
        
        return coin;
    },
    
    // 使銅板可拖曳（直接移動原元素，不 clone）
    makeDraggable: function(element, index) {
        let startMouseX = 0, startMouseY = 0;
        let startElementX = 0, startElementY = 0;
        let isDraggingLocal = false;
        
        const onPointerMove = (e) => {
            if (!isDraggingLocal) return;
            e.preventDefault();
            
            const deltaX = e.clientX - startMouseX;
            const deltaY = e.clientY - startMouseY;
            
            // 直接移動原元素
            element.style.position = 'fixed';
            element.style.left = `${startElementX + deltaX}px`;
            element.style.top = `${startElementY + deltaY}px`;
            element.style.zIndex = '10000';
            element.style.transform = 'scale(1.05)';
            element.style.cursor = 'grabbing';
            
            // 高亮付款區域
            this.highlightPaymentArea(e.clientX, e.clientY);
        };
        
        const onPointerUp = (e) => {
            if (!isDraggingLocal) return;
            
            // 檢查是否在付款區域內
            const isInPaymentArea = this.isPointInPaymentArea(e.clientX, e.clientY);
            
            if (isInPaymentArea && element.getAttribute('data-paid') !== 'true') {
                this.payCoin(element, index);
            } else if (!isInPaymentArea) {
                // 放回原位
                this.resetCoinPosition(element);
                this.showMessage('要把銅板拖到老闆收款區喔！', '#ffaa00');
            }
            
            // 恢復樣式
            element.style.position = '';
            element.style.left = '';
            element.style.top = '';
            element.style.zIndex = '';
            element.style.transform = '';
            element.style.cursor = 'grab';
            
            isDraggingLocal = false;
            this.draggingCoin = null;
            
            this.clearPaymentAreaHighlight();
            
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };
        
        element.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            
            if (element.getAttribute('data-paid') === 'true') return;
            
            const rect = element.getBoundingClientRect();
            startMouseX = e.clientX;
            startMouseY = e.clientY;
            startElementX = rect.left;
            startElementY = rect.top;
            
            isDraggingLocal = true;
            this.draggingCoin = element;
            
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        });
        
        element.style.cursor = 'grab';
    },
    
    // 重置銅板位置（放回原處）
    resetCoinPosition: function(element) {
        element.style.transition = 'all 0.3s ease-out';
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        setTimeout(() => {
            element.style.transition = '';
        }, 300);
    },
    
    // 檢查點是否在付款區域內
    isPointInPaymentArea: function(x, y) {
        if (!this.paymentArea) return false;
        const rect = this.paymentArea.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    },
    
    // 高亮付款區域
    highlightPaymentArea: function(x, y) {
        if (!this.paymentArea) return;
        const isOver = this.isPointInPaymentArea(x, y);
        
        if (isOver) {
            this.paymentArea.style.background = 'rgba(230,126,34,0.3)';
            this.paymentArea.style.border = '3px solid #ffd700';
        } else {
            this.paymentArea.style.background = 'rgba(230,126,34,0.15)';
            this.paymentArea.style.border = '2px dashed #e67e22';
        }
    },
    
    // 清除高亮
    clearPaymentAreaHighlight: function() {
        if (this.paymentArea) {
            this.paymentArea.style.background = 'rgba(230,126,34,0.15)';
            this.paymentArea.style.border = '2px dashed #e67e22';
        }
    },
    
    // 支付銅板（移動到付款區，堆疊顯示）
    payCoin: function(coin, index) {
        if (coin.getAttribute('data-paid') === 'true') return;
        
        coin.setAttribute('data-paid', 'true');
        coin.style.cursor = 'default';
        coin.style.pointerEvents = 'none';
        coin.style.filter = 'grayscale(0.3)';
        
        // 隨機旋轉和位移，讓堆疊更自然
        const randomRotate = (Math.random() * 15) - 7.5;
        const randomX = (Math.random() * 10) - 5;
        const randomY = (Math.random() * 10) - 5;
        
        coin.style.position = 'relative';
        coin.style.left = '0';
        coin.style.top = '0';
        coin.style.transform = `rotate(${randomRotate}deg) translate(${randomX}px, ${randomY}px)`;
        coin.style.display = 'inline-flex';
        
        // 移動到付款區容器
        this.paidCoinsContainer.appendChild(coin);
        
        this.paidAmount++;
        this.updateAmountDisplay();
        
        // 播放音效
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playSFX('assets/sounds/click.mp3', 0.3);
        }
        
        this.showMessage(`✅ 已支付 ${this.paidAmount} / ${this.amount} 銅板`, '#00aa00');
        
        if (this.paidAmount >= this.amount) {
            this.onPaymentComplete();
        }
    },
    
    // 更新金額顯示
    updateAmountDisplay: function() {
        if (this.amountDisplay) {
            const remaining = this.amount - this.paidAmount;
            this.amountDisplay.innerHTML = `💰 需付 ${this.amount} 枚 | 已付 ${this.paidAmount} 枚 | ${remaining > 0 ? '還需 ' + remaining + ' 枚' : '付款完成！'}`;
        }
    },
    
    // 顯示訊息
    showMessage: function(msg, color) {
        if (this.messageArea) {
            this.messageArea.innerHTML = msg;
            this.messageArea.style.color = color;
            this.messageArea.style.background = 'rgba(0,0,0,0.1)';
            setTimeout(() => {
                if (this.messageArea && this.messageArea.innerHTML === msg) {
                    this.messageArea.innerHTML = '';
                }
            }, 2000);
        }
    },
    
    // 付款完成
    onPaymentComplete: function() {
        console.log('💰 付款完成！');
        this.showMessage('🎉 付款完成！感謝惠顧！ 🎉', '#00aa00');
        
        // 更新 Chapter3_Teen 的銅板數量
        if (window.Chapter3_Teen && typeof window.Chapter3_Teen.deductMoney === 'function') {
            // 已經在 markShopComplete 扣過了，這裡不需要再扣
            // 只觸發畫面更新
            if (typeof window.Chapter3_Teen.triggerMoneyUpdate === 'function') {
                window.Chapter3_Teen.triggerMoneyUpdate();
            }
        }
        
        setTimeout(() => {
            this.close();
            if (this.onComplete) {
                this.onComplete(true);
            }
        }, 1500);
    },
    
    // 關閉付款系統
    close: function() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.isActive = false;
        window.removeEventListener('resize', () => this.handleResize());
    }
};

window.PaymentSystem = PaymentSystem;