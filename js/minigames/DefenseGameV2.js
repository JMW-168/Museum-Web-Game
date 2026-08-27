// js/minigames/DefenseGameV2.js
// 防禦遊戲 V2 - 支援年齡模式雙版本

const DefenseGameV2 = {
    // ========== 狀態定義 ==========
    states: {
        IDLE: 'IDLE',
        PREPARING: 'PREPARING',
        NORMAL: 'NORMAL',
        MULTI: 'MULTI',
        MULTI_MIXED: 'MULTI_MIXED',  // ✅ 新增：混合多重攻擊
        HEAVY_CHARGING: 'HEAVY_CHARGING',
        HEAVY_FLYING: 'HEAVY_FLYING',
        AOE_ACTIVE: 'AOE_ACTIVE',
        DECOY: 'DECOY',               // ✅ 新增：陷阱
        RESULT: 'RESULT'
    },
    
    state: 'IDLE',
    
    // 遊戲狀態
    gameActive: false,
    heavyBlockReady: false,     // 重擊是否準備好可以被格擋（方塊飛行中）
    isShieldActive: false,      // 盾牌是否正在開啟中（任何方向）   
    shieldEndTime: 0,           // 盾牌結束時間（毫秒時間戳）
    onCompleteCallback: null,
    
    // DOM 元素
    container: null,
    stage: null,
    player: null,
    
    // 關卡設定（從外部檔案載入）
    levels: window.DefenseLevels || {},
    
    // 遊戲數據
    combo: 0,
    score: 0,
    maxScore: 0,
    mistakes: 0,
    currentAttack: null,
    attackQueue: [],
    
    // 物件追蹤
    enemies: [],
    projectiles: [],
    multiProjectiles: [],
    heavySequence: [],
    heavyProjectiles: [],
    
    // 觸控相關
    touchStart: { x: 0, y: 0 },
    lastSwipeTime: 0,
    
    // 旋轉相關
    rotationAccumulator: { totalAngle: 0, lastAngle: 0 },
    
    // 計時器
    timers: [],
    aoeTimers: [],  // AOE 專用計時器
    lightIntervals: { up: null, down: null, left: null, right: null },
    
    // AOE 相關
    aoeLines: ['up', 'down', 'left', 'right'],
    
    // 螢幕縮放比例
    scale: 1,
    
    // 固定座標
    basePositions: {
        up: { x: 0, y: -430 },
        down: { x: 0, y: 430 },
        left: { x: -465, y: 0 },
        right: { x: 465, y: 0 }
    },
    
    // 尺寸設定
    baseSizes: {
        player: 250,
        enemy: 150,
        projectile: 80,
        heavySequence: 80,
        heavyHorizontal: { width: 800, height: 100 },
        heavyVertical: { width: 100, height: 800 },
        aoeLine: { 
            horizontal: 135,    // 上下線條的高度
            vertical: 135       // 左右線條的寬度（旋轉後）
        },
        shieldHorizontal: { width: 632, height: 175 },
        shieldVertical: { width: 175, height: 632 }
    },
    
    // 分數（與節奏分離，方便調平衡）
    scoreTable: {
        NORMAL: 100,
        MULTI: 50,
        HEAVY: 150,
        AOE: 200,
        DECOY_SUCCESS: 50,
        DECOY_FAIL: -50,
        DECOY_MISS: -20,
        MIXED_CORRECT: 50,
        MIXED_WRONG: -30,
        MIXED_AVOID: 50,
        TIME_OUT_PENALTY: -10
    },

    // 攻擊節奏／速度曲線
    pace: {
        BASE_GAP: 800,
        MIN_GAP: 300,
        SPEED_SCALE: 0.95,
        SPEED_CHECK_SCORE: 100
    },
    
    // ========== 軌跡特效屬性 ==========
    trailPoints: [],           // 儲存軌跡點
    trailCanvas: null,         // 軌跡畫布
    trailCtx: null,            // 軌跡畫布上下文
    trailInterval: null,       // 軌跡更新循環
    lastTrailX: null,          // 上一個軌跡點 X
    lastTrailY: null,          // 上一個軌跡點 Y
    trailMinDistance: 12,      // 最小距離（像素），每隔這段距離產生一個點
    
    /**
     * 年齡模式：優先本局 options.gameMode（由 GameEngine 注入），其次 window.gameMode
     */
    getGameMode: function () {
        if (this.runtimeGameMode === 'child' || this.runtimeGameMode === 'adult') {
            return this.runtimeGameMode;
        }
        if (typeof window !== 'undefined' && window.gameMode) {
            return window.gameMode;
        }
        return 'adult';
    },
    
    // 根據模式取得關卡設定
    getLevelConfig: function(level) {
        const mode = this.getGameMode();
        const levelData = this.levels[level];
        
        if (!levelData) {
            console.error('找不到關卡:', level);
            return this.levels[1];
        }
        
        // 根據模式選擇對應的設定
        if (mode === 'child') {
            return levelData.child || levelData;
        } else {
            return levelData.adult || levelData;
        }
    },
    
    // ========== 輔助函數 ==========
    setState: function(newState) {
        console.log(`🧠 狀態切換: ${this.state} → ${newState}`);
        this.state = newState;
    },
    
    clearAllTimers: function() {
        this.timers.forEach(t => {
            if (t) clearTimeout(t);
        });
        this.timers = [];
        
        ['up', 'down', 'left', 'right'].forEach(dir => {
            if (this.lightIntervals[dir]) {
                clearInterval(this.lightIntervals[dir]);
                this.lightIntervals[dir] = null;
            }
        });
    },
    
    getScaledValue: function(baseValue) {
        return baseValue * this.scale;
    },
    
    getScaledPos: function(basePos) {
        return {
            x: basePos.x * this.scale,
            y: basePos.y * this.scale
        };
    },

    // 計算當前攻擊間隔（根據分數動態調整）
    getCurrentGap: function() {
        let gap = this.pace.BASE_GAP;

        const speedLevel = Math.floor(this.score / this.pace.SPEED_CHECK_SCORE);
        if (speedLevel > 0) {
            const multiplier = Math.pow(this.pace.SPEED_SCALE, speedLevel);
            gap = Math.max(this.pace.MIN_GAP, gap * multiplier);
        }

        return Math.floor(gap);
    },
    
    // ========== 初始化 ==========
    start: function(options) {
        // ✅ 加入這兩行
        this.sessionId = Date.now();
        const currentSession = this.sessionId;

        // ========== 完整重置 ==========
        if (this.zingRegion && this.container) {
            this.zingRegion.unbind(this.container);
            this.zingRegion = null;
        }
        // 清除所有計時器
        if (this.timers) {
            this.timers.forEach(t => { if (t) clearTimeout(t); });
            this.timers = [];
        }
        
        if (this.aoeTimers) {
            this.aoeTimers.forEach(t => {
                if (t && t.id) clearInterval(t.id);
                if (t && t.id) clearTimeout(t.id);
            });
            this.aoeTimers = [];
        }
        
        // 清除所有間隔
        if (this.lightIntervals) {
            ['up', 'down', 'left', 'right'].forEach(dir => {
                if (this.lightIntervals[dir]) {
                    clearInterval(this.lightIntervals[dir]);
                    this.lightIntervals[dir] = null;
                }
            });
        }
        
        if (this.trailInterval) {
            clearInterval(this.trailInterval);
            this.trailInterval = null;
        }
        
        // 取消動畫
        if (this.currentAnimationId) {
            cancelAnimationFrame(this.currentAnimationId);
            this.currentAnimationId = null;
        }
        
        // 移除 DOM 容器（關鍵！）
        if (this.container && this.container.parentNode) {
            this.container.remove();
            this.container = null;
        }
        
        // 重置所有陣列和狀態
        this.enemies = [];
        this.projectiles = [];
        this.multiProjectiles = [];
        this.heavySequence = [];
        this.heavyProjectiles = [];
        this.attackQueue = [];
        this.currentAttack = null;
        this.gameActive = false;
        this.state = this.states.IDLE;
        this.score = 0;
        this.mistakes = 0;
        this.combo = 0;
        this.heavyBlockReady = false;
        this.isShieldActive = false;
        this.shieldEndTime = 0;
        this.rotationAccumulator = { totalAngle: 0, lastAngle: 0 };
        this.aoePushProgress = 0;
        this.trailPoints = [];
        this.lastTrailX = null;
        this.lastTrailY = null;

        this.runtimeGameMode =
            options && (options.gameMode === 'child' || options.gameMode === 'adult')
                ? options.gameMode
                : typeof window !== 'undefined' && window.gameMode
                  ? window.gameMode
                  : 'adult';
        
        // ========== 正常啟動 ==========
        const mode = this.getGameMode();
        console.log(`🎮 防禦遊戲 V2 開始，關卡: ${options.level || 1}，模式: ${mode === 'child' ? '小朋友版' : '一般版'}`);
        
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        this.scale = Math.min(containerWidth / 1920, containerHeight / 1080);
        
        this.gameActive = true;
        this.onCompleteCallback = options.onComplete;
        this.currentLevel = options.level || 1;
        
        this.shieldCooldown = { up: false, down: false, left: false, right: false };
        
        this.levelConfig = this.getLevelConfig(this.currentLevel);
        
        this.combo = 0;
        this.score = 0;
        this.mistakes = 0;
        this.maxScore = this.calculateMaxScore();
        
        this.createUI();
        this.initEventListeners();
        this.initTrailCanvas();
        
        this.trailInterval = setInterval(() => {
            this.updateTrail();
        }, 16);
        
        this.setState(this.states.IDLE);
        setTimeout(() => this.startAttackSequence(), 1000);
    },

    /**
     * 強制結束並清理 DOM／計時器（切換小遊戲或離開時避免殘留）
     */
    stop: function () {
        this.sessionId = Date.now();
        this.gameActive = false;
        this.runtimeGameMode = null;

        if (this.zingRegion && this.container) {
            try {
                this.zingRegion.unbind(this.container);
            } catch (e) { /* ignore */ }
            this.zingRegion = null;
        }
        if (this.timers) {
            this.timers.forEach((t) => {
                if (t) clearTimeout(t);
            });
            this.timers = [];
        }
        if (this.aoeTimers) {
            this.aoeTimers.forEach((t) => {
                if (t && t.id) clearInterval(t.id);
                if (t && t.id) clearTimeout(t.id);
            });
            this.aoeTimers = [];
        }
        if (this.lightIntervals) {
            ['up', 'down', 'left', 'right'].forEach((dir) => {
                if (this.lightIntervals[dir]) {
                    clearInterval(this.lightIntervals[dir]);
                    this.lightIntervals[dir] = null;
                }
            });
        }
        if (this.trailInterval) {
            clearInterval(this.trailInterval);
            this.trailInterval = null;
        }
        if (this.currentAnimationId) {
            cancelAnimationFrame(this.currentAnimationId);
            this.currentAnimationId = null;
        }
        if (this.container && this.container.parentNode) {
            this.container.remove();
            this.container = null;
        }
    },
    
    calculateMaxScore: function() {
        if (!this.levelConfig || !this.levelConfig.attackPatterns) return 0;
        const patterns = this.levelConfig.attackPatterns;
        let max = 0;
        for (const attack of patterns) {
            switch (attack.type) {
                case 'NORMAL':
                    max += this.scoreTable.NORMAL;
                    break;
                case 'MULTI':
                    max += this.scoreTable.MULTI * attack.dirs.length;
                    break;
                case 'HEAVY':
                    max += this.scoreTable.HEAVY;
                    break;
                case 'AOE':
                    max += this.scoreTable.AOE;
                    break;
                case 'DECOY':
                    // 成功閃避得 DECOY_SUCCESS 分
                    max += this.scoreTable.DECOY_SUCCESS;
                    break;
                case 'MULTI_MIXED':
                    // 正確方向每個 +MIXED_CORRECT，錯誤方向每個成功閃避 +MIXED_AVOID
                    const correctCount = attack.correctDirs?.length || 0;
                    const wrongCount = attack.wrongDirs?.length || 0;
                    max += (correctCount * this.scoreTable.MIXED_CORRECT) + 
                        (wrongCount * this.scoreTable.MIXED_AVOID);
                    break;
                default:
                    console.warn('未知攻擊類型:', attack.type);
                    break;
            }
        }
        return max;
    },
    
    // 原有的 loadLevel 方法改為直接使用 levelConfig
    loadLevel: function(level) {
        // 此方法已整合到 start 中，保留以維持相容性
        this.levelConfig = this.getLevelConfig(level);
        if (!this.levelConfig) {
            console.error('找不到關卡設定:', level);
            this.levelConfig = this.getLevelConfig(1);
        }
    },
    
    createUI: function() {
        const cfg = this.levelConfig;
        const gameCanvas = document.getElementById('gameCanvas');
        
        // 修正：確保有有效的父元素
        let parentElement = gameCanvas?.parentElement;
        if (!parentElement) {
            parentElement = document.getElementById('game-wrapper');
            if (!parentElement) {
                parentElement = document.body;
            }
            console.warn('⚠️ gameCanvas.parentElement 不存在，改用:', parentElement.id || 'body');
        }
        
        const playerSize = this.getScaledValue(this.baseSizes.player);
        const enemySize = this.getScaledValue(this.baseSizes.enemy);
        const projSize = this.getScaledValue(this.baseSizes.projectile);
        const seqSize = this.getScaledValue(this.baseSizes.heavySequence);
        
        const posUp = this.getScaledPos(this.basePositions.up);
        const posDown = this.getScaledPos(this.basePositions.down);
        const posLeft = this.getScaledPos(this.basePositions.left);
        const posRight = this.getScaledPos(this.basePositions.right);
        
        const shieldHor = {
            width: this.getScaledValue(this.baseSizes.shieldHorizontal.width),
            height: this.getScaledValue(this.baseSizes.shieldHorizontal.height)
        };
        const shieldVer = {
            width: this.getScaledValue(this.baseSizes.shieldVertical.width),
            height: this.getScaledValue(this.baseSizes.shieldVertical.height)
        };
        
        // 計算 AOE 尺寸
        const aoeHeight = this.getScaledValue(this.baseSizes.aoeLine.horizontal);  // 上下線條高度
        const aoeWidth = this.getScaledValue(this.baseSizes.aoeLine.vertical);     // 左右線條寬度
        
        const msgFontSize = Math.max(16, Math.min(28, 28 * this.scale));
        const comboFontSize = Math.max(14, Math.min(24, 24 * this.scale));
        const hintFontSize = Math.max(10, Math.min(14, 14 * this.scale));
        const resultTextFontSize = Math.max(28, Math.min(48, 48 * this.scale));
        const resultScoreFontSize = Math.max(18, Math.min(32, 32 * this.scale));
        const resultMistakesFontSize = Math.max(14, Math.min(24, 24 * this.scale));
        const resultBtnFontSize = Math.max(14, Math.min(24, 24 * this.scale));
        
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 1000; background: #000; overflow: hidden;
        `;
        
        this.container.innerHTML = `
            <div id="defense-stage" style="width:100%; height:100%; background:url('${cfg.bgImage}') center/cover; position:relative;">
                <div id="defense-player" style="position:absolute; top:50%; left:50%; width:${playerSize}px; height:${playerSize}px; transform:translate(-50%,-50%); background:url('${cfg.playerImage}') center/contain no-repeat;"></div>
                
                <div id="shield-up" style="position:absolute; left:50%; top:calc(50% - ${-posUp.y}px); width:${shieldHor.width}px; height:${shieldHor.height}px; transform:translate(-50%,-50%); background:url('${cfg.shieldImage}') center/cover; opacity:0; transition:opacity 0.2s;"></div>
                <div id="shield-down" style="position:absolute; left:50%; bottom:calc(50% - ${posDown.y}px); width:${shieldHor.width}px; height:${shieldHor.height}px; transform:translate(-50%,-50%); background:url('${cfg.shieldImage}') center/cover; opacity:0; transition:opacity 0.2s;"></div>
                <div id="shield-left" style="position:absolute; left:10%; top:50%; width:${shieldHor.width}px; height:${shieldHor.height}px; transform: translateY(-50%) rotate(90deg); background:url('${cfg.shieldImage}') center/cover; opacity:0; transition:opacity 0.2s;"></div>
                <div id="shield-right" style="position:absolute; left:57.5%; top:50%; width:${shieldHor.width}px; height:${shieldHor.height}px; transform: translateY(-50%) rotate(-90deg); background:url('${cfg.shieldImage}') center/cover; opacity:0; transition:opacity 0.2s;"></div>

                <div id="aoe-up" style="position:absolute; top:0; left:0; width:100%; height:${aoeHeight}px; background:url('${cfg.aoeLineImage}') center/cover; opacity:0; transform:translateY(0);"></div>
                <div id="aoe-down" style="position:absolute; bottom:0; left:0; width:100%; height:${aoeHeight}px; background:url('${cfg.aoeLineImage}') center/cover; opacity:0; transform:translateY(0);"></div>
                <div id="aoe-left" style="position:absolute; top:50%; left:0; width:100%; height:${aoeWidth}px; transform:translateY(-50%) rotate(90deg); transform-origin:center; background:url('${cfg.aoeLineImage}') center/cover no-repeat; opacity:0;"></div>
                <div id="aoe-right" style="position:absolute; top:50%; right:0; width:100%; height:${aoeWidth}px; transform:translateY(-50%) rotate(-90deg); transform-origin:center; background:url('${cfg.aoeLineImage}') center/cover no-repeat; opacity:0;"></div>
                
                <!-- ✅ 軌跡畫布 -->
                <canvas id="trail-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:15;"></canvas>
                
                <div id="result-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:none; justify-content:center; align-items:center; flex-direction:column; z-index:200; pointer-events:auto;">
                    <div id="result-text" style="font-size:${resultTextFontSize}px; font-weight:bold; text-align:center; margin-bottom:20px;">結果</div>
                    <div id="result-score" style="font-size:${resultScoreFontSize}px; color:#ffd700; margin-bottom:15px;"></div>
                    <div id="result-mistakes" style="font-size:${resultMistakesFontSize}px; color:#ffaa00; margin-bottom:30px;"></div>
                    <button id="result-btn" style="padding:15px 40px; font-size:${resultBtnFontSize}px; background:#e67e22; color:white; border:none; border-radius:10px; cursor:pointer; pointer-events:auto;">繼續</button>
                </div>
            </div>
            <div style="position:absolute; top:2%; left:2%; z-index:110;">
                <div id="defense-msg" style="font-size:${msgFontSize}px; font-weight:bold; color:#ffd700; background:rgba(0,0,0,0.5); display:inline-block; padding:5px 20px; border-radius:30px;">${cfg.name}</div>
            </div>
            <div style="position:absolute; top:2%; right:2%; z-index:110;">
                <div id="defense-combo" style="font-size:${comboFontSize}px; font-weight:bold; color:#00ffaa; background:rgba(0,0,0,0.5); display:inline-block; padding:5px 15px; border-radius:30px;">分數: 0</div>
            </div>
            <div style="position:absolute; bottom:3%; left:0; width:100%; text-align:center; color:#888; font-size:${hintFontSize}px; background:rgba(0,0,0,0.4); padding:5px;">滑動方向發射投射物 · AOE模式需旋轉</div>
        `;
        
        // 修正：確保附加到正確的容器
        if (parentElement) {
            parentElement.appendChild(this.container);
            console.log('✅ 遊戲容器已附加到:', parentElement.id || 'body');
        } else {
            document.body.appendChild(this.container);
            console.log('✅ 遊戲容器已附加到 body');
        }
        
        this.stage = document.getElementById('defense-stage');
        this.player = document.getElementById('defense-player');
        this.msg = document.getElementById('defense-msg');
        this.scoreEl = document.getElementById('defense-combo');
        this.resultOverlay = document.getElementById('result-overlay');
        this.resultText = document.getElementById('result-text');
        this.resultScore = document.getElementById('result-score');
        this.resultMistakes = document.getElementById('result-mistakes');
        this.resultBtn = document.getElementById('result-btn');
        
        const finishGame = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeResultAndComplete(this.gameResult);
        };
        this.resultBtn.addEventListener('click', finishGame);
        this.resultBtn.addEventListener('touchstart', finishGame, { passive: false });
        
        this.scaledSizes = { enemy: enemySize, projectile: projSize, heavySequence: seqSize };
        this.scaledPositions = { up: posUp, down: posDown, left: posLeft, right: posRight };
        
        if (gameCanvas) gameCanvas.style.display = 'none';
        this.updateScoreDisplay();
        
        console.log('✅ 遊戲 UI 創建完成，stage 父元素:', this.stage?.parentElement?.id);
    },

    // ========== 普通/多重/誤導攻擊 ==========
    spawnEnemy: function(dir, isDecoy = false, isWrong = false) {
        const cfg = this.levelConfig;
        const pos = this.scaledPositions[dir];
        const size = this.scaledSizes.enemy;
        const enemy = document.createElement('div');
        
        // ✅ 根據類型選擇圖片
        let imageUrl = cfg.enemyImage;
        if (isDecoy) {
            // DECOY 陷阱（石頭）
            imageUrl = cfg.decoyImage || cfg.enemyImage;
        } else if (isWrong) {
            // MULTI_MIXED 錯誤方向（石頭）
            imageUrl = cfg.wrongEnemyImage || cfg.enemyImage;
        }
        
        enemy.style.cssText = `
            position: absolute; width: ${size}px; height: ${size}px; transform: translate(-50%, -50%);
            background: url('${imageUrl}') center/contain no-repeat;
            left: calc(50% + ${pos.x}px); top: calc(50% + ${pos.y}px);
            z-index: 100;
        `;
        this.stage.appendChild(enemy);
        
        const enemyObj = { 
            element: enemy, 
            dir: dir,
            animationId: null,
            isAnimating: true,
            isDecoy: isDecoy,
            isWrong: isWrong
        };
        
        this.startEnemyBounce(enemyObj);
        this.enemies.push(enemyObj);
    },

    // ✅ 新增：敵人跳動動畫
    startEnemyBounce: function(enemyObj) {
        if (!enemyObj.isAnimating) return;
        
        let step = 0;
        // 跳動模式: 跳...跳跳...跳...跳跳
        // 使用 setInterval 控制節奏
        const bouncePattern = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0]; // 1=跳, 0=停
        let patternIndex = 0;
        
        const bounceInterval = setInterval(() => {
            if (!enemyObj.isAnimating || !enemyObj.element || !enemyObj.element.parentNode) {
                clearInterval(bounceInterval);
                return;
            }
            
            if (bouncePattern[patternIndex] === 1) {
                // 執行一次跳動
                let bounceStep = 0;
                const maxStep = 10;
                const bounceHeight = 20; // 跳動高度（像素）
                
                const animateBounce = () => {
                    if (!enemyObj.isAnimating || !enemyObj.element) {
                        return;
                    }
                    if (bounceStep < maxStep) {
                        const progress = bounceStep / maxStep;
                        const offsetY = Math.sin(progress * Math.PI) * bounceHeight;
                        enemyObj.element.style.transform = `translate(-50%, calc(-50% - ${offsetY}px))`;
                        bounceStep++;
                        requestAnimationFrame(animateBounce);
                    } else {
                        // 恢復原位
                        enemyObj.element.style.transform = `translate(-50%, -50%)`;
                    }
                };
                animateBounce();
            }
            
            patternIndex = (patternIndex + 1) % bouncePattern.length;
        }, 300); // 每 300ms 檢查一次節奏
        
        enemyObj.animationId = bounceInterval;
    },

    // ✅ 新增：停止敵人跳動動畫
    stopEnemyBounce: function(enemyObj) {
        if (enemyObj) {
            enemyObj.isAnimating = false;
            if (enemyObj.animationId) {
                clearInterval(enemyObj.animationId);
                enemyObj.animationId = null;
            }
            // 恢復原始位置
            if (enemyObj.element) {
                enemyObj.element.style.transform = `translate(-50%, -50%)`;
            }
        }
    },

    // ✅ 將敵人變成紅色（被射中時的視覺效果）
    turnEnemyRed: function(enemyObj) {
        if (!enemyObj || !enemyObj.element) return;
        
        // 儲存原始圖片 URL
        if (!enemyObj.originalImage) {
            const bgImage = enemyObj.element.style.backgroundImage;
            const match = bgImage.match(/url\(["']?([^"']*)["']?\)/);
            if (match) {
                enemyObj.originalImage = match[1];
            }
        }
        
        // 使用 filter 添加紅色效果（不改變原圖）
        enemyObj.element.style.filter = 'drop-shadow(0 0 10px red) brightness(1.2)';
        enemyObj.element.style.opacity = '0.8';
        
        // 也可以直接替換成紅色版本圖片（如果有的話）
        // const cfg = this.levelConfig;
        // if (enemyObj.isDecoy || enemyObj.isWrong) {
        //     enemyObj.element.style.backgroundImage = `url('${cfg.stoneHitImage || cfg.projectileHitImage}')`;
        // }
    },

    // ✅ 重擊方塊跳動動畫（修改為有限次數）
    startHeavyBlockBounce: function(seqObj) {
        if (seqObj.isAnimating) return;
        seqObj.isAnimating = true;
        
        let bounceStep = 0;
        const maxStep = 30;  // 跳動次數（來回15次）
        const bounceHeight = 15;
        
        const animateBounce = () => {
            if (!seqObj.element || !seqObj.element.parentNode || !seqObj.isAnimating) {
                return;
            }
            
            // 使用正弦波來回跳動
            const offsetY = Math.sin(bounceStep * 0.4) * bounceHeight;
            seqObj.element.style.transform = `translate(-50%, calc(-50% - ${offsetY}px))`;
            bounceStep++;
            
            if (bounceStep < maxStep) {
                requestAnimationFrame(animateBounce);
            } else {
                // 動畫結束，回到原位並標記為停止
                seqObj.element.style.transform = `translate(-50%, -50%)`;
                seqObj.isAnimating = false;
            }
        };
        
        requestAnimationFrame(animateBounce);
    },

    // ✅ 停止所有重擊方塊的跳動動畫
    stopAllHeavyBlocksBounce: function() {
        this.heavySequence.forEach(seqObj => {
            seqObj.isAnimating = false;
            if (seqObj.element) {
                seqObj.element.style.transform = `translate(-50%, -50%)`;
            }
        });
    },

    // ✅ 新增：停止所有敵人跳動
    stopAllEnemiesBounce: function() {
        this.enemies.forEach(enemy => {
            this.stopEnemyBounce(enemy);
        });
    },
    
    handleSwipe: function(dir) {
        if (!this.gameActive) return;
        
        if (this.state === this.states.AOE_ACTIVE) {
            console.log('AOE 模式，忽略滑動');
            return;
        }
        
        if (Date.now() - this.lastSwipeTime < 200) return;
        this.lastSwipeTime = Date.now();
        
        // ========== 重擊攻擊的特殊處理 ==========
        if (this.currentAttack && this.currentAttack.type === 'HEAVY') {
            const now = Date.now();
            
            // ✅ 檢查盾牌是否已經用過（一次攻擊只能開一次）
            if (this.isShieldActive) {
                console.log(`⚠️ 盾牌已開啟，無法再次開啟`);
                this.showWarning('盾牌已開啟！');
                return;
            }
            
            // ✅ 檢查盾牌 CD 時間
            if (this.shieldEndTime > now) {
                const remaining = ((this.shieldEndTime - now) / 1000).toFixed(1);
                console.log(`⏰ 盾牌冷卻中，剩餘 ${remaining} 秒`);
                this.showWarning(`盾牌冷卻中！`);
                
                // ✅ CD 期間無法開盾，但方塊還在飛行 → 格擋失敗
                if (this.state === this.states.HEAVY_FLYING && this.heavyBlockReady) {
                    console.log(`💥 CD 期間無法開盾，格擋失敗！`);
                    this.heavyBlockFailed('盾牌冷卻中');
                    this.finishAttack();
                }
                return;
            }
            
            // 顯示防護罩
            this.showShield(dir);
            
            // ✅ 設定盾牌為啟用狀態
            this.isShieldActive = true;
            
            // 盾牌持續 0.5 秒後消失
            setTimeout(() => {
                this.isShieldActive = false;
                console.log(`🛡️ 盾牌消失`);
                
                // ✅ 設定盾牌 CD（1.5 秒）
                this.shieldEndTime = Date.now() + 1500;
                console.log(`⏰ 盾牌進入 CD，1.5 秒後可再次使用`);
            }, 500);
            
            // ✅ 判斷格擋是否成功
            if (this.state === this.states.HEAVY_FLYING && this.heavyBlockReady) {
                if (this.currentAttack.dir === dir) {
                    // ✅ 格擋成功
                    console.log(`✨ 重擊格擋成功！方向: ${dir}`);
                    this.addScore(this.currentAttack.points || this.scoreTable.HEAVY);
                    
                    // ✅ 顯示格擋成功文字（使用現有動畫）
                    const successText = document.createElement('div');
                    successText.textContent = '✨ 完美格擋！ ✨';
                    successText.style.cssText = `
                        position: absolute;
                        top: 35%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: #00ff88;
                        font-size: 32px;
                        font-weight: bold;
                        text-shadow: 0 0 15px #00ff88;
                        z-index: 150;
                        white-space: nowrap;
                        animation: defenseSuccessFloat 0.6s ease-out forwards;
                        pointer-events: none;
                    `;
                    this.stage.appendChild(successText);
                    setTimeout(() => successText.remove(), 600);
                    
                    // 清除飛行中的方塊
                    this.heavyProjectiles.forEach(p => p?.remove());
                    this.heavyProjectiles = [];
                    
                    // 清除點亮間隔
                    if (this.lightIntervals && this.lightIntervals[dir]) {
                        clearInterval(this.lightIntervals[dir]);
                        this.lightIntervals[dir] = null;
                    }
                    
                    // 清除重擊序列
                    this.clearHeavySequence();
                    
                    // 結束攻擊
                    this.finishAttack();
                } else {
                    // ❌ 方向錯誤，格擋失敗
                    console.log(`❌ 重擊格擋失敗！方向錯誤: ${dir}，正確方向: ${this.currentAttack.dir}`);
                    this.heavyBlockFailed('方向錯誤');
                    this.finishAttack();
                }
            } else {
                // 在 CHARGING 狀態提前開盾
                console.log(`🛡️ 提前開啟 ${dir} 方向防護罩（等待方塊飛行）`);
                this.showWarning(`提前開啟防護罩！`);
                
                // ✅ 設定一個計時器，檢查方塊飛行時盾牌是否還在
                const checkTimer = setTimeout(() => {
                    if (this.state === this.states.HEAVY_FLYING && this.heavyBlockReady && !this.isShieldActive) {
                        // 方塊開始飛了，但盾牌已經消失 → 格擋失敗
                        console.log(`💥 盾牌太早開啟，已消失，格擋失敗！`);
                        this.heavyBlockFailed('盾牌太早開啟');
                        this.finishAttack();
                    }
                }, 500); // 盾牌持續 0.5 秒，所以 0.5 秒後檢查
                this.timers.push(checkTimer);
            }
            return;
        }
        
        // ========== 其他攻擊類型的處理 ==========
        console.log('處理滑動，當前狀態:', this.state, '方向:', dir);
        
        switch (this.state) {
            case this.states.NORMAL:
                if (!this.currentAttack) {
                    console.log('⚠️ currentAttack 為 null');
                    break;
                }
                if (this.currentAttack.resolved) {
                    console.log('⚠️ 攻擊已經 resolved，忽略滑動');
                    break;
                }
                if (this.currentAttack && !this.currentAttack.resolved) {
                    // ✅ 無論滑對還是滑錯，都射出子彈
                    this.launchProjectile(dir, () => {});
                    
                    // ✅ 檢查滑動方向是否正確
                    if (this.currentAttack.dir === dir) {
                        // ✅ 檢查是否已經加過分
                        if (!this.currentAttack.scored) {
                            // 立即加分
                            this.addScore(this.currentAttack.points || this.scoreTable.NORMAL, dir);
                            console.log('✅ 正確方向，+100分');
                            this.currentAttack.scored = true;  // 標記已加分

                            // 正確方向：標記為等待擊中，不立即結束
                            console.log('✅ 正確方向，等待子彈擊中敵人');
                            this.currentAttack.correctHit = true;
                        } else {
                            console.log('⚠️ 已經加過分，忽略');
                        }
                    } else {
                        // 錯誤方向：不扣分，只顯示提示，不結束攻擊
                        console.log('⚠️ 滑錯方向，不扣分，可以再試');
                        this.showWarning('方向錯誤，再試一次！');
                        
                        // 視覺回饋
                        const wrongEnemy = this.enemies.find(e => e.dir === dir);
                        if (wrongEnemy && wrongEnemy.element) {
                            wrongEnemy.element.style.filter = 'drop-shadow(0 0 5px #ff6666)';
                            setTimeout(() => {
                                if (wrongEnemy.element) wrongEnemy.element.style.filter = '';
                            }, 200);
                        }
                    }
                }
                break;
                
            case this.states.MULTI:
                if (this.currentAttack && !this.currentAttack.resolved) {
                    // ✅ 檢查是否已經滑過這個方向
                    if (!this.currentAttack.swipedDirs.includes(dir)) {
                        const isCorrect = this.currentAttack.dirs.includes(dir);
                        
                        if (isCorrect) {
                            // 正確方向：記錄並加分
                            this.currentAttack.swipedDirs.push(dir);
                            this.currentAttack.hits++;
                            this.addScore(this.currentAttack.points || this.scoreTable.MULTI, dir);
                            
                            // 創建投射物並發射
                            const projectile = this.createProjectileAtPlayer(dir);
                            setTimeout(() => {
                                if (projectile && projectile.parentNode) {
                                    this.launchProjectileFromPosition(dir, projectile, () => {});
                                }
                            }, 500);
                            
                            console.log(`✅ 正確方向: ${dir}`);
                            
                            // 檢查是否所有方向都完成了
                            if (this.currentAttack.swipedDirs.length >= this.currentAttack.totalDirs) {
                                this.currentAttack.resolved = true;
                                if (this.currentAttack.multiTimeout) {
                                    clearTimeout(this.currentAttack.multiTimeout);
                                    this.currentAttack.multiTimeout = null;
                                }
                                setTimeout(() => this.finishAttack(), 600);
                            }
                        } else {
                            // ✅ 錯誤方向：不扣分，不記錄，只顯示提示
                            console.log(`⚠️ 滑錯方向: ${dir}，不扣分，可以再試`);
                            this.showWarning(`❌ 方向 ${dir} 沒有敵人，再試一次！`);
                            
                            // 視覺回饋
                            const wrongEnemy = this.enemies.find(e => e.dir === dir);
                            if (wrongEnemy && wrongEnemy.element) {
                                wrongEnemy.element.style.filter = 'drop-shadow(0 0 5px #ff6666)';
                                setTimeout(() => {
                                    if (wrongEnemy.element) wrongEnemy.element.style.filter = '';
                                }, 200);
                            }
                        }
                    } else {
                        this.showWarning('該方向已經滑過了！');
                    }
                }
                break;
                
            // case this.states.HEAVY_FLYING:
            //     // 檢查防護罩冷卻
            //     if (this.shieldCooldown && this.shieldCooldown[dir]) {
            //         console.log('防護罩冷卻中');
            //         this.showWarning('防護罩冷卻中');
            //         return;
            //     }
                
            //     this.showShield(dir);
                
            //     this.shieldCooldown[dir] = true;
            //     setTimeout(() => { this.shieldCooldown[dir] = false; }, 1500);
                
            //     if (this.currentAttack && this.currentAttack.dir === dir) {
            //         this.addScore(this.currentAttack.points || this.scoreTable.HEAVY);
            //         console.log('✨ 完美格擋！');
            //         // 清除飛行中的方塊
            //         this.heavyProjectiles.forEach(p => p?.remove());
            //         this.heavyProjectiles = [];
            //         this.finishAttack();
            //     } else {
            //         this.wrongDirection();
            //         console.log('❌ 方向錯誤');
            //     }
            //     break;

                case this.states.DECOY:
                    if (this.currentAttack && !this.currentAttack.resolved) {
                        this.currentAttack.resolved = true;
                        
                        // 清除成功計時器
                        if (this.currentAttack.decoyTimeout) {
                            clearTimeout(this.currentAttack.decoyTimeout);
                            this.currentAttack.decoyTimeout = null;
                        }
                        
                        // ✅ 檢查滑動方向是否就是石頭的方向
                        if (dir === this.currentAttack.dir) {
                            // 滑到石頭：扣分
                            this.mistakes++;
                            this.updateScoreDisplay();
                            this.showWarning('💥 那是石頭！不能滑！');
                            // ✅ 使用權重
                            this.addScore(this.scoreTable.DECOY_FAIL, dir);
                            
                            // 像一般攻擊一樣立即射出子彈
                            this.launchProjectile(dir, () => {
                                this.finishAttack();
                            });
                            
                            // 視覺回饋：石頭變紅
                            const targetEnemy = this.enemies.find(e => e.dir === this.currentAttack.dir);
                            if (targetEnemy && targetEnemy.element) {
                                targetEnemy.element.style.filter = 'drop-shadow(0 0 10px red)';
                                targetEnemy.element.style.opacity = '0.5';
                            }
                        } else {
                            // 滑到其他地方：輕微懲罰
                            console.log('⚠️ 滑到空白處，但石頭還在');
                            this.showWarning('⚠️ 滑空了！石頭還在！');
                            this.mistakes++;
                            this.updateScoreDisplay();
                            // ✅ 使用權重
                            this.addScore(this.scoreTable.DECOY_MISS, dir);
                            
                            // 像一般攻擊一樣立即射出子彈
                            this.launchProjectile(dir, () => {
                                this.finishAttack();
                            });
                        }
                    }
                    break;

                case this.states.MULTI_MIXED:
                    if (this.currentAttack && !this.currentAttack.resolved) {
                        if (!this.currentAttack.swipedDirs.includes(dir)) {
                            this.currentAttack.swipedDirs.push(dir);
                            
                            const isCorrect = this.currentAttack.correctDirs.includes(dir);
                            const isWrong = this.currentAttack.wrongDirsList.includes(dir);
                            
                            // ✅ 創建投射物並立即設定 0.5 秒後發射
                            const projectile = this.createProjectileAtPlayer(dir);
                            setTimeout(() => {
                                if (projectile && projectile.parentNode) {
                                    this.launchProjectileFromPosition(dir, projectile, () => {});
                                }
                            }, 500);
                            
                            if (isCorrect) {
                                this.currentAttack.hits++;
                                // ✅ 使用權重：正確方向加分
                                this.addScore(this.scoreTable.MIXED_CORRECT, dir);
                                console.log(`✅ 正確！滑動 ${dir}，+${this.scoreTable.MIXED_CORRECT}分`);
                            } else if (isWrong) {
                                // ❌ 錯誤方向：滑到石頭扣分
                                this.mistakes++;
                                this.updateScoreDisplay();
                                this.showWarning(`❌ 那是石頭！不能滑 ${dir} 方向！`);
                                // ✅ 使用權重：錯誤方向扣分
                                this.addScore(this.scoreTable.MIXED_WRONG, dir);
                                console.log(`❌ 錯誤！滑了 ${dir}，這是石頭！${this.scoreTable.MIXED_WRONG}分`);
                                
                                // 視覺回饋：石頭變紅
                                const targetEnemy = this.enemies.find(e => e.dir === dir);
                                if (targetEnemy && targetEnemy.element) {
                                    targetEnemy.element.style.filter = 'drop-shadow(0 0 10px red)';
                                    targetEnemy.element.style.opacity = '0.5';
                                }
                            }
                            
                            // ✅ 檢查是否所有方向都滑完了
                            if (this.currentAttack.swipedDirs.length >= this.currentAttack.totalDirs) {
                                this.currentAttack.resolved = true;
                                if (this.currentAttack.multiTimeout) {
                                    clearTimeout(this.currentAttack.multiTimeout);
                                    this.currentAttack.multiTimeout = null;
                                }
                                
                                // ✅ 時間還沒到就全部滑完，也要計算未滑到的錯誤方向獎勵
                                const notSwipedWrong = this.currentAttack.wrongDirsList.filter(d => 
                                    !this.currentAttack.swipedDirs.includes(d)
                                );
                                if (notSwipedWrong.length > 0) {
                                    // ✅ 使用權重：成功閃避石頭加分
                                    const bonusScore = notSwipedWrong.length * this.scoreTable.MIXED_AVOID;
                                    this.addScore(bonusScore);  // 沒有特定方向，用隨機位置
                                    console.log(`✨ 提前完成！成功閃避 ${notSwipedWrong.length} 個石頭，獲得 ${bonusScore} 分！`);
                                }
                                
                                // 等待最後一個投射物飛完
                                setTimeout(() => this.finishAttack(), 600);
                            }
                        } else {
                            console.log('該方向已滑動過');
                            this.showWarning('該方向已滑動過');
                        }
                    }
                    break;

            default:
                console.log('當前狀態無法處理滑動:', this.state);
        }
    },
    
    wrongDirection: function() {
        // 只增加錯誤次數和顯示警告
        this.mistakes++;
        this.updateScoreDisplay();
        this.showWarning('方向錯誤');
        
        const warning = document.createElement('div');
        warning.textContent = '❌ 方向錯誤';
        warning.style.cssText = 'position:absolute; top:30%; left:50%; transform:translate(-50%,-50%); color:#ff6666; font-size:24px; z-index:150; text-shadow:0 0 5px #000;';
        this.stage.appendChild(warning);
        setTimeout(() => warning.remove(), 500);
    },

    // ✅ 重擊格擋失敗的統一處理
    heavyBlockFailed: function(reason) {
        console.log(`💥 重擊格擋失敗！原因: ${reason}`);
        
        // 扣分懲罰
        this.addScore(-50);
        
        // 增加錯誤次數
        this.mistakes++;
        this.updateScoreDisplay();
        
        // 觸發紅光特效
        this.showRedFlash();
        
        // 觸發畫面震動
        this.shakeScreen();
        
        // 顯示失敗文字
        const failText = document.createElement('div');
        failText.textContent = '💥 格擋失敗！';
        failText.style.cssText = `
            position: absolute;
            top: 35%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff0000;
            font-size: 32px;
            font-weight: bold;
            text-shadow: 0 0 10px #ff0000;
            z-index: 150;
            white-space: nowrap;
            animation: penaltyFloat 0.6s ease-out forwards;
            pointer-events: none;
        `;
        this.stage.appendChild(failText);
        setTimeout(() => failText.remove(), 600);
    },
    
    missAttack: function(reason) {
        console.log('missAttack:', reason);
        this.mistakes++;
        this.updateScoreDisplay();
        this.showWarning(reason);
    },
    
    addScore: function(points, dir = null) {
        this.score += points;
        this.updateScoreDisplay();
        
        const scorePop = document.createElement('div');
        
        // ✅ 修正顯示邏輯
        if (points > 0) {
            scorePop.textContent = `+${points}`;
        } else if (points < 0) {
            scorePop.textContent = `${points}`;
        } else {
            scorePop.textContent = `+0`;
        }
        
        // ✅ 根據方向決定顯示位置
        let leftPos = '50%';
        let topPos = '30%';
        
        if (dir) {
            // 根據方向偏移位置
            switch(dir) {
                case 'up':
                    leftPos = '50%';
                    topPos = '20%';
                    break;
                case 'down':
                    leftPos = '50%';
                    topPos = '80%';
                    break;
                case 'left':
                    leftPos = '25%';
                    topPos = '35%';
                    break;
                case 'right':
                    leftPos = '75%';
                    topPos = '35%';
                    break;
                default:
                    // 隨機偏移，避免重疊
                    leftPos = (40 + Math.random() * 20) + '%';
                    topPos = (25 + Math.random() * 20) + '%';
            }
        } else {
            // 沒有方向時，隨機偏移
            leftPos = (40 + Math.random() * 20) + '%';
            topPos = (25 + Math.random() * 20) + '%';
        }
        
        scorePop.style.cssText = `
            position: absolute;
            top: ${topPos};
            left: ${leftPos};
            transform: translate(-50%, -50%);
            color: ${points > 0 ? '#00ffaa' : '#ff6666'};
            font-size: 28px;
            font-weight: bold;
            z-index: 150;
            text-shadow: 0 0 5px #000;
            pointer-events: none;
            white-space: nowrap;
            animation: scoreFloat 0.8s ease-out forwards;
        `;
        
        this.stage.appendChild(scorePop);
        
        // 動畫結束後移除
        setTimeout(() => {
            if (scorePop.parentNode) scorePop.remove();
        }, 800);
    },
    
    updateScoreDisplay: function() {
        this.scoreEl.innerText = `分數: ${this.score}`;
    },
    
    showFinalResult: function() {
        this.gameActive = false;
        this.clearAllTimers();
        
        const successRate = this.maxScore > 0 ? (this.score / this.maxScore) * 100 : 100;
        const isSuccess = successRate >= 60;

        // ✅ 儲存結果，供 closeResultAndComplete 使用
        this.gameResult = isSuccess;
        
        if (this.resultOverlay) {
            this.resultOverlay.style.display = 'flex';
            if (isSuccess) {
                this.resultText.textContent = '🎉 通關成功！ 🎉';
                this.resultText.style.color = '#ffd700';
            } else {
                this.resultText.textContent = '💥 遊戲失敗 💥';
                this.resultText.style.color = '#ff6666';
            }
            this.resultScore.textContent = `總分: ${this.score} / ${this.maxScore}`;
            this.resultMistakes.textContent = `錯誤次數: ${this.mistakes}`;
        } else {
            this.closeResultAndComplete(this.gameResult);
        }
    },
    
    launchProjectile: function(dir, onComplete) {
        const currentSession = this.sessionId;  // ✅ 加這行
        const cfg = this.levelConfig;
        const target = this.scaledPositions[dir];
        const size = this.scaledSizes.projectile;

        // ✅ 儲存當前的攻擊引用
        const currentAttackRef = this.currentAttack;
        const currentState = this.state;
        
        // 計算起始位置（玩家邊緣）
        const playerRect = this.player.getBoundingClientRect();
        const stageRect = this.stage.getBoundingClientRect();
        const playerCenterX = playerRect.left + playerRect.width / 2 - stageRect.left;
        const playerCenterY = playerRect.top + playerRect.height / 2 - stageRect.top;
        const playerRadiusX = playerRect.width / 2;
        const playerRadiusY = playerRect.height / 2;
        
        let startX, startY;
        switch(dir) {
            case 'up':
                startX = playerCenterX;
                startY = playerCenterY - playerRadiusY;
                break;
            case 'down':
                startX = playerCenterX;
                startY = playerCenterY + playerRadiusY;
                break;
            case 'left':
                startX = playerCenterX - playerRadiusX;
                startY = playerCenterY;
                break;
            case 'right':
                startX = playerCenterX + playerRadiusX;
                startY = playerCenterY;
                break;
        }
        
        // 找到對應方向的敵人
        const targetEnemy = this.enemies.find(e => e.dir === dir);
        
        const proj = document.createElement('div');
        proj.className = 'defense-projectile';
        proj.style.cssText = `
            position: absolute; width: ${size}px; height: ${size}px;
            background: url('${cfg.projectileImage}') center/contain no-repeat;
            left: ${startX - size/2}px; top: ${startY - size/2}px;
            filter: drop-shadow(0 0 5px #00ffaa);
            z-index: 20;  /* ✅ 統一為 20 */
        `;
        this.stage.appendChild(proj);
        
        const endX = target.x + (stageRect.width / 2);
        const endY = target.y + (stageRect.height / 2);
        const startTime = performance.now();
        const duration = 400;
        
        const animate = (now) => {
            if (this.sessionId !== currentSession) return;
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            const easeOut = 1 - Math.pow(1 - t, 2);
            
            const x = startX + (endX - startX) * easeOut;
            const y = startY + (endY - startY) * easeOut;
            proj.style.left = `${x - size/2}px`;
            proj.style.top = `${y - size/2}px`;
            
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                // 投射物到達目標，移除投射物
                if (proj.parentNode) proj.remove();
                
                // 敵人變成 hit 圖片
                if (targetEnemy && targetEnemy.element) {
                    // ✅ 停止敵人的跳動動畫
                    this.stopEnemyBounce(targetEnemy);

                    // ✅ 判斷是否為石頭（DECOY 或 MULTI_MIXED 錯誤方向）
                    if (targetEnemy.isDecoy || targetEnemy.isWrong) {
                        // ✅ 擊中錯誤敵人：觸發紅光 + 震動特效
                        this.hitWrongEnemyEffect();
                        
                        // 石頭被射中：變成紅色效果
                        this.turnEnemyRed(targetEnemy);
                    } else {
                        // 正常敵人：變成 hit 圖片
                        targetEnemy.element.style.backgroundImage = `url('${cfg.projectileHitImage}')`;
                        targetEnemy.element.style.backgroundSize = 'contain';
                        targetEnemy.element.style.backgroundRepeat = 'no-repeat';
                        targetEnemy.element.style.backgroundPosition = 'center';
                    }

                    // 0.2 秒後移除敵人
                    setTimeout(() => {
                        if (targetEnemy.element && targetEnemy.element.parentNode) {
                            targetEnemy.element.remove();
                        }
                        const idx = this.enemies.findIndex(e => e.dir === dir);
                        if (idx !== -1) this.enemies.splice(idx, 1);
                        
                        // ✅ 使用儲存的引用進行判斷
                        if (currentState === this.states.NORMAL && 
                            currentAttackRef && 
                            currentAttackRef.dir === dir &&
                            !currentAttackRef.resolved) {
                            console.log('🎯 子彈擊中敵人，結束 NORMAL 攻擊');
                            currentAttackRef.resolved = true;
                            this.finishAttack();
                        }

                        if (onComplete) onComplete();
                    }, 200);
                } else {
                    if (onComplete) onComplete();
                }
            }
        };
        
        requestAnimationFrame(animate);
        this.projectiles.push(proj);
    },

    // 新增：在玩家位置創建投射物（不發射）
    createProjectileAtPlayer: function(dir) {
        const cfg = this.levelConfig;
        const size = this.scaledSizes.projectile;
        
        // 獲取玩家實際尺寸
        const playerRect = this.player.getBoundingClientRect();
        const stageRect = this.stage.getBoundingClientRect();
        
        // 玩家相對於 stage 的中心位置（像素）
        const playerCenterX = playerRect.left + playerRect.width / 2 - stageRect.left;
        const playerCenterY = playerRect.top + playerRect.height / 2 - stageRect.top;
        
        // 玩家半徑
        const playerRadiusX = playerRect.width / 2;
        const playerRadiusY = playerRect.height / 2;
        
        // 計算投射物位置（像素，相對於 stage 左上角）
        let leftPx, topPx;
        
        switch(dir) {
            case 'up':
                leftPx = playerCenterX - size / 2;
                topPx = playerCenterY - playerRadiusY - size / 2;
                break;
            case 'down':
                leftPx = playerCenterX - size / 2;
                topPx = playerCenterY + playerRadiusY - size / 2;
                break;
            case 'left':
                leftPx = playerCenterX - playerRadiusX - size / 2;
                topPx = playerCenterY - size / 2;
                break;
            case 'right':
                leftPx = playerCenterX + playerRadiusX - size / 2;
                topPx = playerCenterY - size / 2;
                break;
        }
        
        const proj = document.createElement('div');
        proj.className = 'defense-projectile';
        proj.style.cssText = `
            position: absolute; width: ${size}px; height: ${size}px;
            background: url('${cfg.projectileImage}') center/contain no-repeat;
            left: ${leftPx}px; top: ${topPx}px;
            opacity: 1;
            z-index: 20;  /* ✅ 統一為 20（原本是 35） */
            transition: opacity 0.2s ease;
        `;
        this.stage.appendChild(proj);
        this.multiProjectiles.push(proj);
        
        return proj;
    },

    // 新增：從指定位置發射投射物到目標方向
    launchProjectileFromPosition: function(dir, projectile, onComplete) {
        const currentSession = this.sessionId;  // ✅ 加這行
        const cfg = this.levelConfig;
        const target = this.scaledPositions[dir];
        
        // 找到對應方向的敵人
        const targetEnemy = this.enemies.find(e => e.dir === dir);
        
        // 獲取投射物當前位置
        const rect = projectile.getBoundingClientRect();
        const stageRect = this.stage.getBoundingClientRect();
        
        const startX = rect.left + rect.width/2 - stageRect.left;
        const startY = rect.top + rect.height/2 - stageRect.top;
        const endX = target.x + (stageRect.width / 2);
        const endY = target.y + (stageRect.height / 2);
        
        const startTime = performance.now();
        const duration = 400;
        
        projectile.style.filter = 'drop-shadow(0 0 8px #00ffaa)';
        projectile.style.zIndex = '20';  /* ✅ 統一為 20（原本是 999） */
        
        const animate = (now) => {
            if (this.sessionId !== currentSession) return;  // ✅ 加這行
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            const easeOut = 1 - Math.pow(1 - t, 2);
            
            const x = startX + (endX - startX) * easeOut;
            const y = startY + (endY - startY) * easeOut;
            projectile.style.left = `${x - (this.scaledSizes.projectile / 2)}px`;
            projectile.style.top = `${y - (this.scaledSizes.projectile / 2)}px`;
            
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                // 投射物到達目標，移除投射物
                if (projectile.parentNode) projectile.remove();
                const idx = this.multiProjectiles.indexOf(projectile);
                if (idx !== -1) this.multiProjectiles.splice(idx, 1);
                
                // 敵人變成 hit 圖片
                if (targetEnemy && targetEnemy.element) {
                    // ✅ 停止敵人的跳動動畫
                    this.stopEnemyBounce(targetEnemy);

                    // ✅ 判斷是否為石頭（DECOY 或 MULTI_MIXED 錯誤方向）
                    if (targetEnemy.isDecoy || targetEnemy.isWrong) {
                        // ✅ 擊中錯誤敵人：觸發紅光 + 震動特效
                        this.hitWrongEnemyEffect();

                        // 石頭被射中：變成紅色效果
                        this.turnEnemyRed(targetEnemy);
                    } else {
                        // 正常敵人：變成 hit 圖片
                        targetEnemy.element.style.backgroundImage = `url('${cfg.projectileHitImage}')`;
                        targetEnemy.element.style.backgroundSize = 'contain';
                        targetEnemy.element.style.backgroundRepeat = 'no-repeat';
                        targetEnemy.element.style.backgroundPosition = 'center';
                    }

                    // 0.2 秒後移除敵人
                    setTimeout(() => {
                        if (targetEnemy.element && targetEnemy.element.parentNode) {
                            targetEnemy.element.remove();
                        }
                        const enemyIdx = this.enemies.findIndex(e => e.dir === dir);
                        if (enemyIdx !== -1) this.enemies.splice(enemyIdx, 1);

                        // ✅ 如果是 NORMAL 攻擊且是正確方向，現在才結束攻擊
                        if (this.state === this.states.NORMAL && 
                            this.currentAttack && 
                            this.currentAttack.dir === dir &&
                            !this.currentAttack.resolved) {
                            console.log('🎯 子彈擊中敵人，結束 NORMAL 攻擊');
                            this.currentAttack.resolved = true;
                            this.finishAttack();
                        }

                        if (onComplete) onComplete();
                    }, 200);
                } else {
                    if (onComplete) onComplete();
                }
            }
        };
        
        requestAnimationFrame(animate);
        this.projectiles.push(projectile);
    },
    
    // ========== 重擊 ==========
    spawnHeavySequence: function(dir) {
        // ✅ 重置格擋準備狀態
        this.heavyBlockReady = false;
        if (this.heavyBlockTimeout) {
            clearTimeout(this.heavyBlockTimeout);
            this.heavyBlockTimeout = null;
        }
        
        // ✅ 重置盾牌狀態（新攻擊開始，重置 CD）
        this.isShieldActive = false;
        this.shieldEndTime = 0;

        if (this.lightIntervals[dir]) {
            clearInterval(this.lightIntervals[dir]);
            this.lightIntervals[dir] = null;
        }
        this.heavySequence.forEach(s => { if (s && s.parentNode) s.remove(); });
        this.heavySequence = [];
        this.heavyProjectiles = [];

        console.log('spawnHeavySequence 被呼叫，方向:', dir);
        
        const cfg = this.levelConfig;
        const size = this.scaledSizes.heavySequence;
        const count = 5;
        const targetPos = this.scaledPositions[dir];
        const positions = [];
        
        // 獲取舞台實際尺寸（用於計算相對位置）
        const stageRect = this.stage.getBoundingClientRect();
        const stageWidth = stageRect.width;
        const stageHeight = stageRect.height;
        
        // 基準尺寸（設計稿 1920x1080）
        const BASE_WIDTH = 1920;
        const BASE_HEIGHT = 1080;
        
        // 計算相對於設計稿的比例
        const widthRatio = stageWidth / BASE_WIDTH;
        const heightRatio = stageHeight / BASE_HEIGHT;
        
        if (dir === 'up') {
            // 上方：水平排列，Y 固定在目標位置
            const y = targetPos.y;
            // 使用寬度比例計算範圍（設計稿中範圍是 -180 到 180，共 360px）
            const range = 720 * widthRatio;
            const startX = -range / 2;
            const endX = range / 2;
            for (let i = 0; i < count; i++) {
                const t = i / (count - 1);
                const x = startX + (endX - startX) * t;
                positions.push({ x, y });
                console.log(`上方方塊 ${i}: x=${x}, y=${y}, range=${range}`);
            }
        } 
        else if (dir === 'down') {
            // 下方：水平排列，Y 固定在目標位置
            const y = targetPos.y;
            const range = 720 * widthRatio;
            const startX = -range / 2;
            const endX = range / 2;
            for (let i = 0; i < count; i++) {
                const t = i / (count - 1);
                const x = startX + (endX - startX) * t;
                positions.push({ x, y });
                console.log(`下方方塊 ${i}: x=${x}, y=${y}, range=${range}`);
            }
        }
        else if (dir === 'left') {
            // 左方：垂直排列，X 固定在目標位置
            const x = targetPos.x;
            // 使用高度比例計算範圍（設計稿中範圍是 -150 到 150，共 300px）
            const range = 600 * heightRatio;
            const startY = -range / 2;
            const endY = range / 2;
            for (let i = 0; i < count; i++) {
                const t = i / (count - 1);
                const y = startY + (endY - startY) * t;
                positions.push({ x, y });
                console.log(`左方方塊 ${i}: x=${x}, y=${y}, range=${range}`);
            }
        }
        else if (dir === 'right') {
            // 右方：垂直排列，X 固定在目標位置
            const x = targetPos.x;
            const range = 600 * heightRatio;
            const startY = -range / 2;
            const endY = range / 2;
            for (let i = 0; i < count; i++) {
                const t = i / (count - 1);
                const y = startY + (endY - startY) * t;
                positions.push({ x, y });
                console.log(`右方方塊 ${i}: x=${x}, y=${y}, range=${range}`);
            }
        }
        
        // 創建序列物件
        positions.forEach((pos, index) => {
            const seq = document.createElement('div');
            
            // ✅ 判斷是否有專屬的重擊圖片，沒有就用一般敵人圖片
            const enemyImage = cfg.heavyEnemyImage || cfg.enemyImage;
            
            seq.style.cssText = `
                position: absolute; width: ${size}px; height: ${size}px; transform: translate(-50%, -50%);
                background: url('${enemyImage}') center/contain no-repeat;
                left: calc(50% + ${pos.x}px); top: calc(50% + ${pos.y}px);
                transition: all 0.1s ease;
                opacity: 0.3;
                z-index: 25;
            `;
            seq.dataset.index = index;
            this.stage.appendChild(seq);
            
            // ✅ 儲存方塊資訊，準備加入跳動動畫
            const seqObj = {
                element: seq,
                index: index,
                animationId: null,
                isAnimating: false
            };
            this.heavySequence.push(seqObj);
        });
        
        // 依序點亮
        let idx = 0;
        console.log(`開始點亮 ${dir} 方向的重擊，共 ${this.heavySequence.length} 個方塊`);
        
        this.lightIntervals[dir] = setInterval(() => {
            if (!this.gameActive || this.state !== this.states.HEAVY_CHARGING) {
                if (this.lightIntervals[dir]) {
                    clearInterval(this.lightIntervals[dir]);
                    this.lightIntervals[dir] = null;
                }
                return;
            }
            if (idx < this.heavySequence.length) {
                console.log(`點亮 ${dir} 方向方塊 ${idx + 1}/${this.heavySequence.length}`);
                
                const currentSeq = this.heavySequence[idx];
                currentSeq.element.style.opacity = '1';
                currentSeq.element.style.filter = 'drop-shadow(0 0 15px #ff6600)';
                currentSeq.element.style.transform = 'translate(-50%, -50%) scale(1.1)';
                
                // ✅ 點亮後啟動跳動動畫
                this.startHeavyBlockBounce(currentSeq);
                
                idx++;
                
                if (idx === this.heavySequence.length) {
                    if (this.lightIntervals[dir]) {
                        clearInterval(this.lightIntervals[dir]);
                        this.lightIntervals[dir] = null;
                    }
                    console.log(`最後一個點亮，觸發 ${dir} 方向衝向玩家`);
                    
                    // ✅ 最後一個點亮後，停止所有方塊的跳動動畫
                    this.stopAllHeavyBlocksBounce();
                    
                    if (this.state === this.states.HEAVY_CHARGING) {
                        this.setState(this.states.HEAVY_FLYING);
                        this.launchHeavyProjectile(dir);
                    }
                }
            }
        }, 400);
    },
    
    launchHeavyProjectile: function(dir) {
        console.log('launchHeavyProjectile 執行，方向:', dir);

        // ✅ 加入這行！定義 currentSession
        const currentSession = this.sessionId;

        // ✅ 設定格擋準備狀態
        this.heavyBlockReady = true;
        
        // ✅ 設定超時：如果一段時間沒格擋，自動失敗
        this.heavyBlockTimeout = setTimeout(() => {
            if (this.heavyBlockReady && this.state === this.states.HEAVY_FLYING && !this.currentAttack?.resolved) {
                console.log('⏰ 重擊格擋超時！完全沒有格擋');
                this.heavyBlockFailed('未及時格擋');
                this.finishAttack();
            }
        }, 1000);

        // ✅ 先停止所有跳動動畫
        this.stopAllHeavyBlocksBounce();
        
        // ✅ 從 heavySequence 中取出實際的 DOM 元素
        const blocks = [];
        this.heavySequence.forEach(seqObj => {
            if (seqObj.element) {
                blocks.push(seqObj.element);
            }
        });
        
        if (blocks.length === 0) {
            console.log('沒有方塊可飛');
            this.finishAttack();
            return;
        }
        
        console.log('開始飛行，方塊數量:', blocks.length);
        this.heavySequence = [];
        
        let completedCount = 0;
        const totalBlocks = blocks.length;
        
        blocks.forEach((block, idx) => {
            const rect = block.getBoundingClientRect();
            const stageRect = this.stage.getBoundingClientRect();
            
            const startX = rect.left + rect.width/2 - (stageRect.left + stageRect.width/2);
            const startY = rect.top + rect.height/2 - (stageRect.top + stageRect.height/2);
            
            const endX = 0;
            const endY = 0;
            
            block.style.transition = 'none';
            block.style.position = 'absolute';
            block.style.zIndex = '35';
            this.heavyProjectiles.push(block);
            
            const startTime = performance.now();
            const duration = 400;
            
            const animate = (now) => {
                if (this.sessionId !== currentSession) return;  // ✅ 加這行
                const elapsed = now - startTime;
                const t = Math.min(1, elapsed / duration);
                
                const x = startX + (endX - startX) * t;
                const y = startY + (endY - startY) * t;
                block.style.left = `calc(50% + ${x}px)`;
                block.style.top = `calc(50% + ${y}px)`;
                block.style.opacity = `${1 - t * 0.5}`;
                
                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    block.remove();
                    const index = this.heavyProjectiles.indexOf(block);
                    if (index !== -1) this.heavyProjectiles.splice(index, 1);
                    completedCount++;
                    
                    if (completedCount === totalBlocks) {
                        console.log('所有方塊飛行完成');
                        if (this.state === this.states.HEAVY_FLYING && !this.currentAttack?.resolved) {
                            // 方塊飛完了還沒被格擋 → 失敗
                            console.log('💥 方塊擊中玩家！未格擋');
                            this.heavyBlockFailed('被方塊擊中');
                            this.finishAttack();
                        }
                    }
                }
            };
            requestAnimationFrame(animate);
        });
    },
    
    // ========== AOE ==========
    startAOE: function(wait) {
        console.log('startAOE 開始，等待時間:', wait);
        
        if (!wait || wait <= 0) {
            console.error('AOE 等待時間無效:', wait);
            this.finishAttack();
            return;
        }

        // ✅ 先隱藏所有 AOE 線條，防止瞬間碰撞
        const aoeUp = document.getElementById('aoe-up');
        const aoeDown = document.getElementById('aoe-down');
        const aoeLeft = document.getElementById('aoe-left');
        const aoeRight = document.getElementById('aoe-right');
        
        // 先全部隱藏
        [aoeUp, aoeDown, aoeLeft, aoeRight].forEach(line => {
            if (line) {
                line.style.opacity = '0';
                line.style.display = 'none';
            }
        });
        
        // ✅ 延遲一點點再開始，讓 DOM 更新
        setTimeout(() => {
            this._startAOEMovement(wait);
        }, 50);
    },

    // ✅ 新增：真正開始 AOE 動畫的方法
    _startAOEMovement: function(wait) {
        const aoeUp = document.getElementById('aoe-up');
        const aoeDown = document.getElementById('aoe-down');
        const aoeLeft = document.getElementById('aoe-left');
        const aoeRight = document.getElementById('aoe-right');
        
        const stageHeight = this.stage.clientHeight;
        const stageWidth = this.stage.clientWidth;
        const aoeHeight = this.getScaledValue(this.baseSizes.aoeLine.horizontal);
        const aoeWidth = this.getScaledValue(this.baseSizes.aoeLine.vertical);
        
        // 計算最大移動距離
        const maxUpMove = stageHeight / 2 - aoeHeight / 2;
        const maxDownMove = stageHeight / 2 - aoeHeight / 2;
        const maxLeftMove = stageWidth / 2;
        const maxRightMove = stageWidth / 2;
        
        // ✅ 設置初始位置並顯示
        if (aoeUp) {
            aoeUp.style.transform = `translateY(0)`;
            aoeUp.style.opacity = '0.7';
            aoeUp.style.display = 'block';
        }
        if (aoeDown) {
            aoeDown.style.transform = `translateY(0)`;
            aoeDown.style.opacity = '0.7';
            aoeDown.style.display = 'block';
        }
        if (aoeLeft) {
            aoeLeft.style.transform = `translateX(-${stageWidth / 2}px) translateY(-50%) rotate(90deg)`;
            aoeLeft.style.opacity = '0.7';
            aoeLeft.style.display = 'block';
        }
        if (aoeRight) {
            aoeRight.style.transform = `translateX(${stageWidth / 2}px) translateY(-50%) rotate(-90deg)`;
            aoeRight.style.opacity = '0.7';
            aoeRight.style.display = 'block';
        }
        
        // 儲存 AOE 時間資訊
        this.aoeStartTime = Date.now();
        this.aoeDuration = wait;
        this.aoePushProgress = 0;
        
        let finished = false;
        let animationId = null;
        const startTime = Date.now();
        const duration = wait;
        
        const success = () => {
            if (finished) return;
            finished = true;
            if (animationId) cancelAnimationFrame(animationId);
            console.log('✨ AOE 防禦成功！');
            if (this.state === this.states.AOE_ACTIVE) {
                this.addScore(this.scoreTable.AOE);
                this.finishAttack();
            }
        };
        
        const fail = () => {
            if (finished) return;
            finished = true;
            if (animationId) cancelAnimationFrame(animationId);
            console.log('💥 AOE 攻擊命中！');
            if (this.state === this.states.AOE_ACTIVE) {
                this.mistakes++;
                this.updateScoreDisplay();
                this.showWarning('AOE 攻擊命中！');
                this.finishAttack();
            }
        };
        
        let smoothProgress = 0;
        
        const animate = () => {
            if (finished || this.state !== this.states.AOE_ACTIVE) {
                return;
            }
            
            const elapsed = Date.now() - startTime;
            const actualProgress = Math.min(1, elapsed / duration);
            
            const now = Date.now();
            const timeSinceLastRotate = now - (this.lastRotateTime || 0);
            const isRotating = timeSinceLastRotate < 300;
            
            let targetProgress;
            
            if (isRotating) {
                const pushDelay = (this.aoePushProgress || 0) * 200;
                const adjustedElapsed = Math.max(0, elapsed - pushDelay);
                targetProgress = Math.min(1, adjustedElapsed / duration);
                smoothProgress = targetProgress;
            } else {
                const catchUpSpeed = 0.015;
                if (smoothProgress < actualProgress) {
                    smoothProgress = Math.min(actualProgress, smoothProgress + catchUpSpeed);
                } else {
                    smoothProgress = actualProgress;
                }
                targetProgress = smoothProgress;
            }
            
            const easeProgress = 1 - Math.pow(1 - targetProgress, 2);
            
            const upMove = maxUpMove * easeProgress;
            const downMove = -maxDownMove * easeProgress;
            const leftMove = -maxLeftMove + (maxLeftMove * easeProgress);
            const rightMove = maxRightMove - (maxRightMove * easeProgress);
            
            if (aoeUp) aoeUp.style.transform = `translateY(${upMove}px)`;
            if (aoeDown) aoeDown.style.transform = `translateY(${downMove}px)`;
            if (aoeLeft) aoeLeft.style.transform = `translateX(${leftMove}px) translateY(-50%) rotate(90deg)`;
            if (aoeRight) aoeRight.style.transform = `translateX(${rightMove}px) translateY(-50%) rotate(-90deg)`;
            
            animationId = requestAnimationFrame(animate);
        };
        
        animationId = requestAnimationFrame(animate);
        
        // ✅ 延遲 100ms 再開始碰撞檢測，避免在動畫開始前就碰撞
        const collisionCheck = setInterval(() => {
            if (finished || this.state !== this.states.AOE_ACTIVE) {
                clearInterval(collisionCheck);
                return;
            }
            
            const playerRect = this.player.getBoundingClientRect();
            const stageRect = this.stage.getBoundingClientRect();
            
            const playerCenterX = playerRect.left + playerRect.width / 2 - stageRect.left;
            const playerCenterY = playerRect.top + playerRect.height / 2 - stageRect.top;
            
            const playerLeft = playerCenterX - 60;
            const playerRight = playerCenterX + 60;
            const playerTop = playerCenterY - 60;
            const playerBottom = playerCenterY + 60;
            
            let collided = false;
            
            if (aoeUp) {
                const upRect = aoeUp.getBoundingClientRect();
                const upBottom = upRect.bottom - stageRect.top;
                if (upBottom >= playerTop) collided = true;
            }
            
            if (aoeDown) {
                const downRect = aoeDown.getBoundingClientRect();
                const downTop = downRect.top - stageRect.top;
                if (downTop <= playerBottom) collided = true;
            }
            
            if (aoeLeft) {
                const leftRect = aoeLeft.getBoundingClientRect();
                const leftRight = leftRect.right - stageRect.left;
                if (leftRight >= playerLeft) collided = true;
            }
            
            if (aoeRight) {
                const rightRect = aoeRight.getBoundingClientRect();
                const rightLeft = rightRect.left - stageRect.left;
                if (rightLeft <= playerRight) collided = true;
            }
            
            if (collided) {
                clearInterval(collisionCheck);
                cancelAnimationFrame(animationId);
                fail();
            }
        }, 100);  // ✅ 延遲 100ms
        
        const successTimer = setTimeout(() => {
            if (!finished && this.state === this.states.AOE_ACTIVE) {
                clearInterval(collisionCheck);
                success();
            }
        }, duration);
        
        this.aoeTimers.push({ type: 'interval', id: collisionCheck });
        this.aoeTimers.push({ type: 'timeout', id: successTimer });
        this.currentAnimationId = animationId;
    },

    handleRotate: function(e) {
        if (this.state !== this.states.AOE_ACTIVE) return;
        
        // ✅ 記錄最後旋轉時間
        this.lastRotateTime = Date.now();
        
        let angle = 0;
        if (e.detail) {
            angle = e.detail.angle || 0;
        } else if (e.angle) {
            angle = e.angle;
        }
        
        if (this.rotationAccumulator.lastAngle === undefined) {
            this.rotationAccumulator.lastAngle = angle;
            return;
        }
        
        let delta = angle - this.rotationAccumulator.lastAngle;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        
        this.rotationAccumulator.lastAngle = angle;
        
        if (Math.abs(delta) > 2) {
            this.rotationAccumulator.totalAngle = (this.rotationAccumulator.totalAngle || 0) + Math.abs(delta);
            
            if (this.rotationAccumulator.totalAngle >= 20) {
                this.rotationAccumulator.totalAngle = 0;
                
                // 計算當前時間進度
                let timeProgress = 0;
                if (this.aoeStartTime) {
                    const elapsed = Date.now() - this.aoeStartTime;
                    timeProgress = Math.min(1, elapsed / this.aoeDuration);
                }
                
                // 根據時間進度動態調整回推量
                let pushAmount = 0.17 - (timeProgress * 0.1);
                pushAmount = Math.max(0.07, Math.min(0.17, pushAmount));
                
                this.aoePushProgress = (this.aoePushProgress || 0) + pushAmount;
                
                console.log('🔄 旋轉回推！', {
                    時間進度: (timeProgress * 100).toFixed(0) + '%',
                    回推量: pushAmount.toFixed(3),
                    總回推: this.aoePushProgress.toFixed(3)
                });
                
                // 視覺回饋
                const aoeLines = ['aoe-up', 'aoe-down', 'aoe-left', 'aoe-right'];
                aoeLines.forEach(id => {
                    const line = document.getElementById(id);
                    if (line) {
                        line.style.filter = 'drop-shadow(0 0 10px #ffaa00)';
                        setTimeout(() => {
                            if (line) line.style.filter = '';
                        }, 150);
                    }
                });
            }
        }
    },
    
    // ========== 輔助函數 ==========
    showShield: function(dir) {
        const shield = document.getElementById(`shield-${dir}`);
        if (shield) {
            shield.style.opacity = '0.8';
            setTimeout(() => { shield.style.opacity = '0'; }, 500);
        }
    },
    
    showWarning: function(text) {
        this.msg.style.color = '#ff6666';
        setTimeout(() => { this.msg.style.color = '#ffd700'; }, 500);
    },

    // 顯示紅光特效（擊中錯誤敵人時）
    showRedFlash: function() {
        // 創建或取得紅光覆蓋層
        let flashLayer = document.getElementById('defense-red-flash');
        if (!flashLayer) {
            flashLayer = document.createElement('div');
            flashLayer.id = 'defense-red-flash';
            flashLayer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 0, 0, 0.5);
                pointer-events: none;
                z-index: 500;
                opacity: 0;
                transition: opacity 0.05s;
            `;
            this.stage.appendChild(flashLayer);
        }
        
        // 顯示紅光
        flashLayer.style.opacity = '1';
        
        // 0.1 秒後淡出
        setTimeout(() => {
            flashLayer.style.opacity = '0';
        }, 100);
    },

    // 畫面震動效果（更強制）
    shakeScreen: function() {
        const el = this.container;  // 改用 container 而不是 stage
        if (!el) return;
        
        // 記錄原始 transform
        const originalTransform = el.style.transform;
        
        // 震動序列
        const shakes = [
            'translate(10px, 0)',
            'translate(-10px, 0)',
            'translate(6px, 0)',
            'translate(-6px, 0)',
            'translate(3px, 0)',
            'translate(-3px, 0)',
            'translate(0, 0)'
        ];
        
        let i = 0;
        const shakeInterval = setInterval(() => {
            el.style.transform = shakes[i];
            i++;
            if (i >= shakes.length) {
                clearInterval(shakeInterval);
                el.style.transform = originalTransform;
            }
        }, 50);
    },

    // 擊中錯誤敵人的特效（紅光 + 畫面震動）
    hitWrongEnemyEffect: function() {
        console.log('🔥 hitWrongEnemyEffect 被呼叫！');  // 加入這行
        this.showRedFlash();
        this.shakeScreen();  // 取代原本的 triggerVibration
    },
    
    // 在 DefenseGameV2.js 中修改 closeResultAndComplete 方法
    closeResultAndComplete: function(result) {
        console.log('🎮 closeResultAndComplete 被呼叫，結果:', result);
        
        // ✅ 清理軌跡更新循環
        if (this.trailInterval) {
            clearInterval(this.trailInterval);
            this.trailInterval = null;
        }
        
        // ✅ 清理所有計時器
        this.clearAllTimers();
        
        // ✅ 清理所有 AOE 計時器
        if (this.aoeTimers) {
            this.aoeTimers.forEach(t => {
                if (t && t.id) clearInterval(t.id);
                if (t && t.id) clearTimeout(t.id);
            });
            this.aoeTimers = [];
        }
        
        // ✅ 清理所有動畫
        if (this.currentAnimationId) {
            cancelAnimationFrame(this.currentAnimationId);
            this.currentAnimationId = null;
        }
        
        // ✅ 清理所有敵人、投射物等
        this.clearAll();
        
        // ✅ 移除容器
        if (this.container && this.container.parentNode) {
            this.container.remove();
        }
        
        // ✅ 顯示原本的 gameCanvas
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.style.display = 'block';
        }
        
        // ✅ 重置遊戲狀態（重要！）
        this.gameActive = false;
        this.state = this.states.IDLE;
        this.currentAttack = null;
        this.attackQueue = [];
        this.score = 0;
        this.mistakes = 0;
        this.combo = 0;
        
        // ✅ 重置所有特殊狀態
        this.heavyBlockReady = false;
        this.isShieldActive = false;
        this.shieldEndTime = 0;
        this.rotationAccumulator = { totalAngle: 0, lastAngle: 0 };
        this.aoePushProgress = 0;
        
        // ✅ 清理 lightIntervals
        ['up', 'down', 'left', 'right'].forEach(dir => {
            if (this.lightIntervals[dir]) {
                clearInterval(this.lightIntervals[dir]);
                this.lightIntervals[dir] = null;
            }
        });

        // ✅ 確保 result 有正確的值
        let finalResult = result;
        if (finalResult === undefined) {
            // 如果沒有傳入，使用儲存的 gameResult
            finalResult = this.gameResult === true;
        }
        // 確保是布林值
        finalResult = finalResult === true;
        
        // ✅ 回調傳遞結果（讓劇情管理器決定下一步）
        if (this.onCompleteCallback) {
            console.log('📤 傳遞遊戲結果給回調:', result);
            this.onCompleteCallback(result);
        }
    },
    
    // 關卡設定（從外部檔案載入）
    levels: DefenseLevels,

    // 清理函數
    clearEnemies: function() { 
        // ✅ 先停止所有敵人的跳動動畫
        this.enemies.forEach(e => {
            if (e.animationId) clearInterval(e.animationId);
        });
        this.enemies.forEach(e => e.element?.remove()); 
        this.enemies = []; 
    },
    removeEnemyByDir: function(dir) { 
        const idx = this.enemies.findIndex(e => e.dir === dir); 
        if (idx !== -1) { 
            this.enemies[idx].element?.remove(); 
            this.enemies.splice(idx, 1); 
        } 
    },
    clearProjectiles: function() { this.projectiles.forEach(p => p?.remove()); this.projectiles = []; },
    clearHeavySequence: function() { 
        // ✅ 先停止所有重擊方塊的跳動動畫
        this.stopAllHeavyBlocksBounce();
        
        this.heavySequence.forEach(s => { 
            if (s && s.element && s.element.parentNode) s.element.remove(); 
        });
        this.heavySequence = []; 
    },   
    clearHeavyProjectiles: function() { 
        this.heavyProjectiles.forEach(p => { if (p && p.parentNode) p.remove(); });
        this.heavyProjectiles = []; 
    },
    // 清理函數
    clearAll: function() { 
        this.clearTrail();  // ✅ 清除軌跡
        
        this.clearEnemies(); 
        this.clearProjectiles(); 
        this.clearHeavySequence(); 
        this.clearHeavyProjectiles();
        
        // 清理多重攻擊的投射物
        if (this.multiProjectiles) {
            this.multiProjectiles.forEach(p => {
                if (p && p.parentNode) p.remove();
            });
            this.multiProjectiles = [];
        }

        // ✅ 新增：清理 AOE 線條
        ['up', 'down', 'left', 'right'].forEach(dir => {
            const line = document.getElementById(`aoe-${dir}`);
            if (line) {
                line.style.opacity = '0';
                line.style.display = 'none';
                line.style.pointerEvents = 'none';
                line.style.transform = 'translate(0,0)';
            }
        });
        
        // 清理當前攻擊的計時器
        if (this.currentAttack && this.currentAttack.timer) {
            clearTimeout(this.currentAttack.timer);
            this.currentAttack.timer = null;
        }
        
        // 清理點亮間隔
        if (this.currentLightInterval) {
            clearInterval(this.currentLightInterval);
            this.currentLightInterval = null;
        }
        
        // 清理各方向的點亮間隔
        if (this.lightIntervals) {
            ['up', 'down', 'left', 'right'].forEach(dir => {
                if (this.lightIntervals[dir]) {
                    clearInterval(this.lightIntervals[dir]);
                    this.lightIntervals[dir] = null;
                }
            });
        }
        
        this.isLaunching = false;
        this.isProcessing = false;
    }
};

Object.assign(
    DefenseGameV2,
    window.DefenseTrailMixin || {},
    window.DefenseInputMixin || {},
    window.DefenseAttackRunnerMixin || {}
);

window.DefenseGameV2 = DefenseGameV2;