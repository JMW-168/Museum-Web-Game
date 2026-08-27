const StationDemoGame = {
    container: null,
    station: null,
    state: null,
    animationId: null,
    timers: [],
    keyHandler: null,

    stations: {
        fire: {
            kicker: '關卡一 / 站點 1',
            title: '灶台生火',
            subtitle: '看準節拍添柴，讓火候維持在剛好的溫度。',
            intro: '木柴會沿著節奏軌道移動。當木柴進入灶台火圈時，按「添柴」或空白鍵。小柴升火少，大柴升火多；火候超過綠色區間右側時，按「噴水」少量降火。最多可以失誤 5 次。',
            success: '火候穩了，鍋鏟阿嬤點點頭：勤儉不是省掉一切，是把每一分力氣用在剛好的地方。',
            fail: '火候還不穩。再試一次，抓到節奏後，灶台就會慢慢旺起來。',
        },
        tea: {
            kicker: '關卡二 / 站點 2',
            title: '擂茶研磨',
            subtitle: '依照順序加入材料，研磨出一碗香氣完整的擂茶。',
            intro: '照著提示順序完成：茶葉、芝麻、花生、研磨、盛碗。點錯會扣穩定度，時間內完成就能解鎖擂茶小知識。',
            success: '擂茶小知識：擂茶需要耐心和順序，從材料到力道都會影響香氣。阿公笑著說：「慢慢來，香味才會出來。」',
            fail: '順序有點亂了。重新看一次材料提示，照著節奏慢慢完成。',
        }
    },

    start(stationId) {
        this.stop();
        this.station = this.stations[stationId];
        if (!this.station) return;

        showScene('game-container');
        this.hideLegacyGameUi();
        this.createShell(stationId);
        this.showIntro(stationId);
    },

    hideLegacyGameUi() {
        const canvas = document.getElementById('gameCanvas');
        const dialog = document.getElementById('dialog-box');
        const options = document.getElementById('options-container');
        const character = document.getElementById('character-image');
        const backBtn = document.querySelector('#game-container .back-btn');

        if (canvas) {
            canvas.style.display = 'none';
            canvas.classList.remove('minigame-active');
        }
        if (dialog) dialog.style.display = 'none';
        if (options) options.innerHTML = '';
        if (character) character.style.display = 'none';
        if (backBtn) backBtn.style.display = 'none';

        if (typeof DialogueSystem !== 'undefined') {
            DialogueSystem.endDialogue(true);
        }
        if (typeof AudioManager !== 'undefined') {
            AudioManager.stopBGM();
        }
    },

    createShell(stationId) {
        const parent = document.getElementById('game-wrapper') || document.body;
        this.container = document.createElement('div');
        this.container.className = `station-demo station-demo-${stationId}`;
        parent.appendChild(this.container);
    },

    showIntro(stationId) {
        this.container.innerHTML = `
            <section class="station-panel station-intro-panel">
                <div class="station-kicker-line">${this.station.kicker}</div>
                <h1>${this.station.title}</h1>
                <p class="station-subtitle">${this.station.subtitle}</p>
                <p class="station-copy">${this.station.intro}</p>
                <div class="station-actions">
                    <button type="button" class="station-primary">開始挑戰</button>
                    <button type="button" class="station-secondary">返回入口</button>
                </div>
            </section>
        `;

        this.container.querySelector('.station-primary').addEventListener('click', () => {
            this.playClick();
            if (stationId === 'fire') {
                const fireAssets = window.MinigameAssets && typeof window.MinigameAssets.getStationFirePreloadUrls === 'function'
                    ? window.MinigameAssets.getStationFirePreloadUrls()
                    : [];
                if (fireAssets.length > 0 && typeof LoadingManager !== 'undefined') {
                    LoadingManager.showAndLoad(fireAssets, () => this.startFireGame());
                } else {
                    this.startFireGame();
                }
            }
            if (stationId === 'tea') this.startTeaGame();
        });
        this.container.querySelector('.station-secondary').addEventListener('click', () => this.close());
    },

    startFireGame() {
        this.state = {
            stationId: 'fire',
            score: 0,
            combo: 0,
            fire: 50,
            judged: 0,
            beats: [],
            startedAt: performance.now(),
            nextBeatIndex: 0,
            nextSpawnAt: 0,
            totalBeats: 18,
            idealMin: 45,
            idealMax: 72,
            safeMin: 30,
            safeMax: 88,
            unstableMs: 0,
            maxMistakes: 5,
            mistakesRemaining: 5,
            lastTickAt: performance.now(),
            finished: false,
            lastResult: '等木柴進入灶台火圈再添柴',
        };

        this.container.innerHTML = `
            <div class="station-play">
                <div class="station-hud">
                    <div>${this.station.kicker}</div>
                    <div>分數 <span data-score>0</span></div>
                    <div>火候 <span data-fire>50</span>%</div>
                    <div>還可失誤 <span data-mistakes>5</span> 次</div>
                </div>
                <button type="button" class="station-corner-exit" data-exit aria-label="返回入口">返回</button>
                <div class="fire-help-row">
                    <span>木柴進入灶台火圈：按添柴</span>
                    <span data-water-hint>火候超過 72%：按噴水</span>
                </div>
                <div class="fire-track" aria-label="節奏軌道">
                    <div class="fire-target">
                        <img class="fire-stove-img" src="assets/images/station-fire/stove.png" alt="灶台">
                        <img class="fire-flame-img" data-flame src="assets/images/station-fire/fire-small.png" alt="火焰">
                        <div class="fire-water-burst" data-water-effect aria-hidden="true">
                            <span></span><span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
                <div class="fire-meter">
                    <div class="fire-ideal-zone"></div>
                    <span></span>
                </div>
                <div class="station-feedback">等木柴進入灶台火圈再添柴</div>
                <div class="station-actions compact">
                    <button type="button" class="station-primary" data-hit>添柴</button>
                </div>
                <button type="button" class="station-water station-water-fixed" data-water>噴水</button>
            </div>
        `;

        this.container.querySelector('[data-hit]').addEventListener('click', () => this.hitFireBeat());
        this.container.querySelector('[data-water]').addEventListener('click', () => this.sprayWater());
        this.container.querySelector('[data-exit]').addEventListener('click', () => this.close());
        this.keyHandler = (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.hitFireBeat();
            }
            if (event.key === 'w' || event.key === 'W' || event.key === '水') {
                event.preventDefault();
                this.sprayWater();
            }
        };
        window.addEventListener('keydown', this.keyHandler);

        this.animationId = requestAnimationFrame((time) => this.tickFire(time));
    },

    tickFire(time) {
        if (!this.state || this.state.finished) return;

        const elapsed = time - this.state.startedAt;
        const delta = Math.min(80, time - this.state.lastTickAt);
        this.state.lastTickAt = time;

        while (
            this.state.nextBeatIndex < this.state.totalBeats &&
            elapsed >= this.state.nextSpawnAt
        ) {
            this.spawnFireBeat(time);
            this.state.nextSpawnAt += this.getFireSpawnEvery(this.state.nextBeatIndex);
            this.state.nextBeatIndex++;
        }

        const track = this.container.querySelector('.fire-track');
        const trackWidth = track ? track.clientWidth : 1;
        const targetX = this.getFireTargetX(trackWidth);
        const stillActive = [];

        this.state.beats.forEach((beat) => {
            const progress = (time - beat.spawnedAt) / beat.travelMs;
            const x = trackWidth - (progress * trackWidth);
            beat.el.style.left = `${x}px`;

            if (!beat.hit && x < targetX - 100) {
                beat.hit = true;
                this.applyFireScore('木柴錯過了', -6, -10, true, true);
                beat.el.remove();
                return;
            }

            if (progress <= 1.12 && !beat.hit) stillActive.push(beat);
            else beat.el.remove();
        });

        this.state.beats = stillActive;
        this.updateFireStability(delta);
        this.renderFireHud();

        if (this.state.judged >= this.state.totalBeats && this.state.beats.length === 0) {
            const success = this.state.score >= 720 && this.isFireInSafeRange() && this.state.mistakesRemaining > 0;
            this.showResult(success);
            return;
        }

        this.animationId = requestAnimationFrame((nextTime) => this.tickFire(nextTime));
    },

    spawnFireBeat(time) {
        const track = this.container.querySelector('.fire-track');
        if (!track) return;
        const type = Math.random() < 0.36 ? 'big' : 'small';
        const beat = document.createElement('div');
        beat.className = `fire-beat ${type === 'big' ? 'big' : 'small'}`;
        const woodImage = type === 'big'
            ? 'assets/images/station-fire/wood-large.png'
            : 'assets/images/station-fire/wood-small.png';
        beat.innerHTML = `
            <img src="${woodImage}" alt="${type === 'big' ? '大柴' : '小柴'}">
            <span>${type === 'big' ? '大柴' : '小柴'}</span>
        `;
        track.appendChild(beat);
        this.state.beats.push({
            el: beat,
            type,
            spawnedAt: time,
            travelMs: this.getFireTravelMs(this.state.nextBeatIndex),
            hit: false
        });
    },

    hitFireBeat() {
        if (!this.state || this.state.finished) return;

        const track = this.container.querySelector('.fire-track');
        const trackWidth = track ? track.clientWidth : 1;
        const targetX = this.getFireTargetX(trackWidth);
        let best = null;
        let bestDistance = Infinity;

        this.state.beats.forEach((beat) => {
            if (beat.hit) return;
            const x = parseFloat(beat.el.style.left || '0');
            const distance = Math.abs(x - targetX);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = beat;
            }
        });

        if (!best) {
            this.applyFireScore('太早了，等木柴進火圈', -2, -3, false, true);
            return;
        }

        if (bestDistance > 120) {
            best.hit = true;
            best.el.remove();
            this.applyFireScore('沒對準火圈', -4, -8, true, true);
            return;
        }

        best.hit = true;
        best.el.remove();
        if (bestDistance <= 38) this.applyFireScore(`剛剛好：${best.type === 'big' ? '大柴' : '小柴'}`, 90, best.type === 'big' ? 13 : 7);
        else if (bestDistance <= 82) this.applyFireScore(`有添到：${best.type === 'big' ? '大柴' : '小柴'}`, 60, best.type === 'big' ? 9 : 4);
        else this.applyFireScore('沒對準火圈', -4, -8, true, true);
    },

    applyFireScore(label, points, fireDelta, countJudgement = true, countMistake = false) {
        if (!this.state || this.state.finished) return;
        if (countJudgement) this.state.judged++;
        if (countMistake) this.state.mistakesRemaining = Math.max(0, this.state.mistakesRemaining - 1);
        this.state.score = Math.max(0, this.state.score + points);
        this.state.fire = Math.max(0, Math.min(100, this.state.fire + fireDelta));
        const feedback = countMistake ? `${label}，還可失誤 ${this.state.mistakesRemaining} 次` : label;
        this.state.lastResult = feedback;
        this.container.querySelector('.station-feedback').textContent = feedback;
        this.playClick();
        this.renderFireHud();
        if (this.state.mistakesRemaining <= 0) this.showResult(false);
    },

    sprayWater() {
        if (!this.state || this.state.finished || this.state.stationId !== 'fire') return;
        this.state.fire = Math.max(0, this.state.fire - 5);
        const waterEffect = this.container.querySelector('[data-water-effect]');
        if (waterEffect) {
            waterEffect.classList.remove('active');
            void waterEffect.offsetWidth;
            waterEffect.classList.add('active');
        }
        this.container.querySelector('.station-feedback').textContent = this.state.fire > this.state.idealMax
            ? '噴水降火，再按一次可以更穩'
            : '噴水降火，回到綠色區間就先停';
        this.playClick();
        this.renderFireHud();
    },

    getFireProgress(index) {
        if (!this.state || this.state.totalBeats <= 1) return 0;
        return Math.max(0, Math.min(1, index / (this.state.totalBeats - 1)));
    },

    getFireSpawnEvery(index) {
        const progress = this.getFireProgress(index);
        return 1380 - (progress * 420);
    },

    getFireTravelMs(index) {
        const progress = this.getFireProgress(index);
        return 3100 - (progress * 860);
    },

    getFireTargetX(trackWidth) {
        return trackWidth * 0.24;
    },

    updateFireStability(delta) {
        const inIdeal = this.isFireInIdealRange();
        const drift = this.state.fire > this.state.idealMax ? -0.0008 : -0.0015;
        this.state.fire = Math.max(0, Math.min(100, this.state.fire + (drift * delta)));

        if (inIdeal) {
            this.state.unstableMs = Math.max(0, this.state.unstableMs - delta * 0.4);
        } else {
            this.state.unstableMs += delta;
        }

        if (!this.isFireInSafeRange() && this.state.unstableMs > 3200) {
            this.showResult(false);
        }
    },

    isFireInIdealRange() {
        return this.state.fire >= this.state.idealMin && this.state.fire <= this.state.idealMax;
    },

    isFireInSafeRange() {
        return this.state.fire >= this.state.safeMin && this.state.fire <= this.state.safeMax;
    },

    renderFireHud() {
        const score = this.container.querySelector('[data-score]');
        const fire = this.container.querySelector('[data-fire]');
        const mistakes = this.container.querySelector('[data-mistakes]');
        const meter = this.container.querySelector('.fire-meter span');
        const idealZone = this.container.querySelector('.fire-ideal-zone');
        const waterHint = this.container.querySelector('[data-water-hint]');
        const waterButton = this.container.querySelector('[data-water]');
        const flame = this.container.querySelector('[data-flame]');
        if (score) score.textContent = this.state.score;
        if (fire) fire.textContent = Math.round(this.state.fire);
        if (mistakes) mistakes.textContent = this.state.mistakesRemaining;
        if (meter) meter.style.width = `${this.state.fire}%`;
        if (idealZone) {
            idealZone.style.left = `${this.state.idealMin}%`;
            idealZone.style.width = `${this.state.idealMax - this.state.idealMin}%`;
        }
        const needsWater = this.state.fire > this.state.idealMax;
        if (waterHint) waterHint.classList.toggle('active', needsWater);
        if (waterButton) waterButton.classList.toggle('needs-water', needsWater);
        if (flame) {
            flame.src = this.state.fire > this.state.idealMax
                ? 'assets/images/station-fire/fire-large.png'
                : 'assets/images/station-fire/fire-small.png';
            flame.style.transform = `translateX(-50%) scale(${0.62 + (this.state.fire / 130)})`;
        }
    },

    startTeaGame() {
        this.state = {
            stationId: 'tea',
            sequence: ['茶葉', '芝麻', '花生', '研磨', '盛碗'],
            current: 0,
            stability: 100,
            startedAt: Date.now(),
            duration: 45,
            finished: false,
        };

        this.container.innerHTML = `
            <div class="station-play">
                <div class="station-hud">
                    <div>${this.station.kicker}</div>
                    <div>步驟 <span data-step>1</span>/5</div>
                    <div>穩定度 <span data-stability>100</span>%</div>
                </div>
                <div class="tea-board">
                    <div class="tea-mortar">
                        <div class="tea-pestle"></div>
                        <div class="tea-bowl-text">擂茶石臼</div>
                    </div>
                    <div class="tea-sequence"></div>
                    <div class="tea-buttons"></div>
                </div>
                <div class="station-feedback">照順序完成材料與動作</div>
                <div class="station-actions compact">
                    <button type="button" class="station-secondary" data-exit>返回入口</button>
                </div>
            </div>
        `;

        this.container.querySelector('[data-exit]').addEventListener('click', () => this.close());
        this.renderTeaGame();
    },

    renderTeaGame() {
        const sequenceEl = this.container.querySelector('.tea-sequence');
        const buttonsEl = this.container.querySelector('.tea-buttons');
        const labels = ['茶葉', '芝麻', '花生', '研磨', '盛碗'];

        sequenceEl.innerHTML = this.state.sequence.map((item, index) => `
            <span class="${index < this.state.current ? 'done' : index === this.state.current ? 'current' : ''}">${item}</span>
        `).join('');

        buttonsEl.innerHTML = labels.map((label) => `
            <button type="button" data-tea-action="${label}">${label}</button>
        `).join('');

        buttonsEl.querySelectorAll('button').forEach((button) => {
            button.addEventListener('click', () => this.handleTeaAction(button.dataset.teaAction));
        });

        this.updateTeaHud();
    },

    handleTeaAction(label) {
        if (!this.state || this.state.finished) return;

        const expected = this.state.sequence[this.state.current];
        if (label === expected) {
            this.state.current++;
            this.container.querySelector('.station-feedback').textContent = `${label} 完成`;
            this.container.querySelector('.tea-pestle').classList.add('moving');
            this.playClick();
            this.timers.push(setTimeout(() => {
                const pestle = this.container?.querySelector('.tea-pestle');
                if (pestle) pestle.classList.remove('moving');
            }, 260));
        } else {
            this.state.stability = Math.max(0, this.state.stability - 18);
            this.container.querySelector('.station-feedback').textContent = `順序不對，下一步是 ${expected}`;
            this.playWrong();
        }

        if (this.state.current >= this.state.sequence.length) {
            this.showResult(this.state.stability >= 45);
            return;
        }

        if (this.state.stability <= 0) {
            this.showResult(false);
            return;
        }

        this.renderTeaGame();
    },

    updateTeaHud() {
        const step = this.container.querySelector('[data-step]');
        const stability = this.container.querySelector('[data-stability]');
        if (step) step.textContent = Math.min(this.state.current + 1, this.state.sequence.length);
        if (stability) stability.textContent = this.state.stability;
    },

    showResult(success) {
        if (!this.state) return;
        this.state.finished = true;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;

        const message = success ? this.station.success : this.station.fail;
        this.container.innerHTML = `
            <section class="station-panel station-result-panel">
                <div class="station-kicker-line">${this.station.kicker}</div>
                <h1>${success ? '挑戰成功' : '再試一次'}</h1>
                <p class="station-copy">${message}</p>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry>再玩一次</button>
                    <button type="button" class="station-secondary" data-back>返回入口</button>
                </div>
            </section>
        `;

        this.container.querySelector('[data-retry]').addEventListener('click', () => {
            if (this.state.stationId === 'fire') this.startFireGame();
            if (this.state.stationId === 'tea') this.startTeaGame();
        });
        this.container.querySelector('[data-back]').addEventListener('click', () => this.close());
    },

    close() {
        this.stop();
        showScene('level-select');
    },

    stop() {
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers = [];
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
        if (this.container && this.container.parentNode) this.container.remove();
        this.container = null;
        this.state = null;
    },

    playClick() {
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('assets/sounds/click.mp3');
    },

    playWrong() {
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('assets/sounds/wrong.mp3');
    }
};

function startStationDemo(stationId) {
    StationDemoGame.start(stationId);
}

window.StationDemoGame = StationDemoGame;
window.startStationDemo = startStationDemo;
