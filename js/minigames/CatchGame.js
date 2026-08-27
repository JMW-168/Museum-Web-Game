// js/minigames/CatchGame.js
// A lightweight touch-first catching minigame for the existing GameEngine.

const CatchGame = {
    container: null,
    stage: null,
    basket: null,
    scoreEl: null,
    timeEl: null,
    livesEl: null,
    messageEl: null,
    introOverlay: null,
    resultOverlay: null,
    resultBtn: null,
    onCompleteCallback: null,
    animationId: null,
    spawnTimer: null,
    items: [],
    score: 0,
    lives: 3,
    targetScore: 12,
    duration: 30,
    spawnEvery: 850,
    speedMin: 150,
    speedMax: 260,
    goodChance: 0.78,
    basketX: 0.5,
    gameActive: false,
    startedAt: 0,
    lastFrameAt: 0,

    defaultGoodItems: [
        { name: '豆花', image: 'assets/images/items/豆花.png' },
        { name: '香菇', image: 'assets/images/ch3/game/thin_mushroom.png' },
        { name: '八角', image: 'assets/images/ch3/game/star_anise.png' },
        { name: '白胡椒', image: 'assets/images/ch3/game/white_pepper.png' },
        { name: '黑胡椒', image: 'assets/images/ch3/game/black_pepper.png' }
    ],

    defaultBadItems: [
        { name: '石頭', image: 'assets/images/defense/level1/stone.png' },
        { name: '壞掉的香菇', image: 'assets/images/ch3/game/broken_mushroom.png' }
    ],

    getDefaultAssets: function () {
        return [
            'assets/images/market.jpg',
            ...this.defaultGoodItems.map((item) => item.image),
            ...this.defaultBadItems.map((item) => item.image)
        ];
    },

    start: function (options = {}) {
        this.stop();

        const mode = options.gameMode || window.gameMode || 'adult';
        const isChildMode = mode === 'child';

        this.onCompleteCallback = options.onComplete;
        this.score = 0;
        this.lives = Number.isFinite(options.lives) ? options.lives : (isChildMode ? 5 : 3);
        this.targetScore = Number.isFinite(options.targetScore) ? options.targetScore : (isChildMode ? 8 : 12);
        this.duration = Number.isFinite(options.duration) ? options.duration : (isChildMode ? 35 : 30);
        this.spawnEvery = Number.isFinite(options.spawnEvery) ? options.spawnEvery : (isChildMode ? 1000 : 780);
        this.speedMin = Number.isFinite(options.speedMin) ? options.speedMin : (isChildMode ? 115 : 155);
        this.speedMax = Number.isFinite(options.speedMax) ? options.speedMax : (isChildMode ? 205 : 285);
        this.goodChance = Number.isFinite(options.goodChance) ? options.goodChance : (isChildMode ? 0.84 : 0.76);
        this.goodItems = Array.isArray(options.goodItems) && options.goodItems.length ? options.goodItems : this.defaultGoodItems;
        this.badItems = Array.isArray(options.badItems) && options.badItems.length ? options.badItems : this.defaultBadItems;

        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.display = 'none';
            canvas.classList.remove('minigame-active');
        }

        this.createUI(options.title || '市場接物挑戰');
        this.bindInput();
        this.updateHud();
        this.showIntro();
    },

    beginGame: function () {
        this.gameActive = true;
        this.startedAt = Date.now();
        this.lastFrameAt = performance.now();
        if (this.introOverlay) this.introOverlay.style.display = 'none';
        if (this.messageEl) this.messageEl.textContent = '左右移動籃子，接住好食材';
        this.spawnItem();
        this.spawnTimer = setInterval(() => this.spawnItem(), this.spawnEvery);
        this.animationId = requestAnimationFrame((time) => this.tick(time));
    },

    createUI: function (title) {
        const parent = document.getElementById('game-wrapper') || document.body;
        const goodExamples = this.goodItems.slice(0, 4).map((item) => `
            <div class="catch-guide-item">
                <img src="${item.image}" alt="${item.name}">
                <span>${item.name}</span>
            </div>
        `).join('');
        const badExamples = this.badItems.map((item) => `
            <div class="catch-guide-item bad">
                <img src="${item.image}" alt="${item.name}">
                <span>${item.name}</span>
            </div>
        `).join('');

        this.container = document.createElement('div');
        this.container.className = 'catch-game-container';
        this.container.innerHTML = `
            <div class="catch-stage">
                <div class="catch-hud">
                    <div class="catch-hud-item">分數 <span id="catch-score">0</span>/<span id="catch-target">${this.targetScore}</span></div>
                    <div class="catch-hud-item">時間 <span id="catch-time">${this.duration}</span></div>
                    <div class="catch-hud-item">生命 <span id="catch-lives">${this.lives}</span></div>
                </div>
                <div class="catch-message">${title}</div>
                <div class="catch-basket" aria-hidden="true"></div>
                <button class="catch-close-btn" type="button">離開</button>
                <div class="catch-intro-overlay">
                    <div class="catch-intro-panel">
                        <div class="catch-intro-kicker">紅磚市場臨時任務</div>
                        <div class="catch-intro-title">幫攤販接住今天的好食材</div>
                        <p class="catch-intro-story">
                            市場正忙著備料，攤車上的食材一樣樣滑了下來。請移動竹籃接住能上桌的好食材，
                            但看到紅框標記的壞食材或石頭就要避開。
                        </p>
                        <div class="catch-guide-grid">
                            <div class="catch-guide-section">
                                <div class="catch-guide-title">要接住</div>
                                <div class="catch-guide-items">${goodExamples}</div>
                            </div>
                            <div class="catch-guide-section">
                                <div class="catch-guide-title bad">要避開</div>
                                <div class="catch-guide-items">${badExamples}</div>
                            </div>
                        </div>
                        <div class="catch-intro-rules">
                            <span>接好食材加分</span>
                            <span>漏接或接錯扣生命</span>
                            <span>達到 ${this.targetScore} 分就成功</span>
                        </div>
                        <div class="catch-intro-actions">
                            <button class="catch-start-btn" type="button">開始幫忙</button>
                            <button class="catch-intro-exit-btn" type="button">先不幫忙</button>
                        </div>
                    </div>
                </div>
                <div class="catch-result-overlay">
                    <div class="catch-result-panel">
                        <div class="catch-result-title" id="catch-result-title"></div>
                        <div class="catch-result-score" id="catch-result-score"></div>
                        <button class="catch-result-btn" id="catch-result-btn" type="button">繼續</button>
                    </div>
                </div>
            </div>
        `;

        parent.appendChild(this.container);

        this.stage = this.container.querySelector('.catch-stage');
        this.basket = this.container.querySelector('.catch-basket');
        this.scoreEl = this.container.querySelector('#catch-score');
        this.timeEl = this.container.querySelector('#catch-time');
        this.livesEl = this.container.querySelector('#catch-lives');
        this.messageEl = this.container.querySelector('.catch-message');
        this.introOverlay = this.container.querySelector('.catch-intro-overlay');
        this.resultOverlay = this.container.querySelector('.catch-result-overlay');
        this.resultBtn = this.container.querySelector('#catch-result-btn');

        this.container.querySelector('.catch-close-btn').addEventListener('click', () => this.close(false));
        this.container.querySelector('.catch-start-btn').addEventListener('click', () => this.beginGame());
        this.container.querySelector('.catch-intro-exit-btn').addEventListener('click', () => this.close(false));
        this.resultBtn.addEventListener('click', () => {
            const success = this.score >= this.targetScore;
            this.close(success);
        });

        this.setBasketX(0.5);
    },

    showIntro: function () {
        if (this.introOverlay) this.introOverlay.style.display = 'flex';
        if (this.messageEl) this.messageEl.textContent = '先看清楚任務，再開始接物';
    },

    bindInput: function () {
        this.onPointerMove = (event) => {
            const point = event.touches && event.touches[0] ? event.touches[0] : event;
            const rect = this.stage.getBoundingClientRect();
            this.setBasketX((point.clientX - rect.left) / rect.width);
            event.preventDefault();
        };

        this.onKeyDown = (event) => {
            if (!this.gameActive) return;
            if (event.key === 'ArrowLeft') this.setBasketX(this.basketX - 0.07);
            if (event.key === 'ArrowRight') this.setBasketX(this.basketX + 0.07);
        };

        this.stage.addEventListener('pointerdown', this.onPointerMove);
        this.stage.addEventListener('pointermove', this.onPointerMove);
        this.stage.addEventListener('touchmove', this.onPointerMove, { passive: false });
        window.addEventListener('keydown', this.onKeyDown);
    },

    setBasketX: function (ratio) {
        this.basketX = Math.max(0.08, Math.min(0.92, ratio));
        if (this.basket) {
            this.basket.style.left = `${this.basketX * 100}%`;
        }
    },

    spawnItem: function () {
        if (!this.gameActive || !this.stage) return;

        const isGood = Math.random() < this.goodChance;
        const source = isGood ? this.pick(this.goodItems) : this.pick(this.badItems);
        const rect = this.stage.getBoundingClientRect();
        const el = document.createElement('div');
        const size = Math.max(42, Math.min(84, rect.height * 0.08));
        const x = Math.random() * Math.max(1, rect.width - size);

        el.className = `catch-item${isGood ? '' : ' bad'}`;
        el.style.backgroundImage = `url('${source.image}')`;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.transform = `translate(${x}px, ${-size}px)`;
        this.stage.appendChild(el);

        this.items.push({
            el,
            x,
            y: -size,
            size,
            speed: this.speedMin + Math.random() * (this.speedMax - this.speedMin),
            isGood,
            caught: false
        });
    },

    tick: function (time) {
        if (!this.gameActive) return;

        const delta = Math.min(0.04, (time - this.lastFrameAt) / 1000 || 0);
        this.lastFrameAt = time;
        this.updateTime();
        this.updateItems(delta);

        if (this.score >= this.targetScore) {
            this.finish(true);
            return;
        }

        if (this.lives <= 0) {
            this.finish(false);
            return;
        }

        this.animationId = requestAnimationFrame((nextTime) => this.tick(nextTime));
    },

    updateItems: function (delta) {
        const stageRect = this.stage.getBoundingClientRect();
        const basketRect = this.basket.getBoundingClientRect();
        const nextItems = [];

        this.items.forEach((item) => {
            item.y += item.speed * delta;
            item.el.style.transform = `translate(${item.x}px, ${item.y}px) rotate(${item.y * 0.18}deg)`;

            const itemRect = item.el.getBoundingClientRect();
            if (this.intersects(itemRect, basketRect)) {
                this.handleCatch(item);
                item.el.remove();
                return;
            }

            if (item.y > stageRect.height + item.size) {
                if (item.isGood) {
                    this.lives--;
                    this.showMessage('漏接了！');
                    this.playSfx('assets/sounds/wrong.mp3', 0.35);
                }
                item.el.remove();
                return;
            }

            nextItems.push(item);
        });

        this.items = nextItems;
        this.updateHud();
    },

    handleCatch: function (item) {
        if (item.isGood) {
            this.score++;
            this.showMessage('接到了！');
            this.playSfx('assets/sounds/correct.mp3', 0.35);
        } else {
            this.lives--;
            this.showMessage('這個不能接！');
            this.playSfx('assets/sounds/wrong.mp3', 0.35);
        }
        this.updateHud();
    },

    updateTime: function () {
        const elapsed = (Date.now() - this.startedAt) / 1000;
        const remaining = Math.max(0, Math.ceil(this.duration - elapsed));
        if (this.timeEl) this.timeEl.textContent = remaining;
        if (remaining <= 0) {
            this.finish(this.score >= this.targetScore);
        }
    },

    updateHud: function () {
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.livesEl) this.livesEl.textContent = Math.max(0, this.lives);
    },

    showMessage: function (text) {
        if (!this.messageEl) return;
        this.messageEl.textContent = text;
        clearTimeout(this.messageTimer);
        this.messageTimer = setTimeout(() => {
            if (this.messageEl) this.messageEl.textContent = '左右移動籃子，接住好食材';
        }, 900);
    },

    finish: function (success) {
        if (!this.gameActive) return;

        this.gameActive = false;
        clearInterval(this.spawnTimer);
        this.spawnTimer = null;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;

        const title = this.container.querySelector('#catch-result-title');
        const score = this.container.querySelector('#catch-result-score');
        title.textContent = success ? '挑戰成功' : '挑戰失敗';
        score.textContent = `分數 ${this.score} / ${this.targetScore}`;
        this.resultOverlay.style.display = 'flex';
    },

    close: function (success) {
        const callback = this.onCompleteCallback;
        this.stop();
        if (callback) callback(success);
    },

    stop: function () {
        this.gameActive = false;
        clearTimeout(this.messageTimer);
        clearInterval(this.spawnTimer);
        this.spawnTimer = null;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        if (this.stage && this.onPointerMove) {
            this.stage.removeEventListener('pointerdown', this.onPointerMove);
            this.stage.removeEventListener('pointermove', this.onPointerMove);
            this.stage.removeEventListener('touchmove', this.onPointerMove);
        }
        if (this.onKeyDown) window.removeEventListener('keydown', this.onKeyDown);
        this.items.forEach((item) => item.el?.remove());
        this.items = [];
        if (this.container && this.container.parentNode) this.container.remove();
        this.container = null;
        this.stage = null;
        this.basket = null;
    },

    pick: function (list) {
        return list[Math.floor(Math.random() * list.length)];
    },

    intersects: function (a, b) {
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    },

    playSfx: function (src, volume) {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playSFX(src, volume);
        }
    }
};

window.CatchGame = CatchGame;
