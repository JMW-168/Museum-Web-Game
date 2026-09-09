const CradleStationGame = {
    container: null,
    state: null,
    animationId: null,
    audioContext: null,
    audioTimer: null,
    listeners: [],
    cycleMs: 2400,
    targetSeconds: 10,
    assistAfterMs: 25000,
    mode: 'standalone',
    guideShown: false,
    onComplete: null,
    onExit: null,

    tr(key, tokens) {
        return typeof window.t === 'function' ? window.t(key, tokens) : key;
    },

    start(options = {}) {
        this.stop();
        this.mode = options.mode || 'standalone';
        this.onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;
        this.onExit = typeof options.onExit === 'function' ? options.onExit : null;
        if (window.StationDemoGame) window.StationDemoGame.stop();
        showScene('game-container');
        if (window.AudioManager) AudioManager.stopBGM();
        this.createShell();
        // 進入引導對話由 Station34CombinedGame（orchestrator）在呼叫本 start 之前播完；
        // 這裡直接進遊戲。prepareAudio 在使用者手勢鏈內（對話 CTA → onComplete → start）。
        this.prepareAudio();
        this.startGame();
    },

    createShell() {
        const parent = document.getElementById('game-wrapper') || document.body;
        this.container = document.createElement('div');
        this.container.className = 'station-demo station-demo-cradle';
        parent.appendChild(this.container);
    },

    startGame() {
        if (!this.container) return;
        this.removeListeners();
        this.clearAudioTimer();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        const now = performance.now();
        this.state = {
            startedAt: now,
            lastFrameAt: now,
            guidePosition: 0.5,
            playerPosition: 0.5,
            stableSeconds: 0,
            tolerance: 0.14,
            assisted: false,
            pointerActive: false,
            activePointerId: null,
            keys: { left: false, right: false },
            lastInputAt: 0,
            feedbackStage: 'crying',
            finished: false
        };
        this.container.innerHTML = `
            <div class="station-play cradle-play">
                <button type="button" class="station-secondary station-corner-exit" data-exit>${this.tr('story.action.leave')}</button>
                <div class="station-hud cradle-hud">
                    <span>${this.tr('station.cradle.title')}</span>
                    <span>${this.tr('station.cradle.stability', { percent: '<b data-progress-text>0</b>' })}</span>
                    <span data-assist>${this.tr('station.cradle.follow')}</span>
                </div>
                <p class="cradle-instruction">${this.tr('station.cradle.instruction')}</p>
                <div class="cradle-scene" data-control tabindex="0" role="slider" aria-label="${this.tr('station.cradle.position')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
                    <div class="cradle-guide-track" aria-hidden="true">
                        <span class="cradle-guide-dot" data-guide style="left:50%"></span>
                    </div>
                    <div class="cradle-rope cradle-rope-left" data-rope-left></div>
                    <div class="cradle-rope cradle-rope-right" data-rope-right></div>
                    <div class="cradle-sling" data-player>
                        <span class="cradle-knot"></span>
                        <span class="cradle-baby" data-baby>😢</span>
                    </div>
                    <span class="cradle-hand-hint" data-hand-hint>${this.tr('station.cradle.drag')}</span>
                </div>
                <div class="cradle-progress" aria-label="${this.tr('station.cradle.progress')}">
                    <span data-progress></span>
                </div>
                <div class="station-feedback cradle-feedback" data-feedback aria-live="polite">${this.tr('station.cradle.crying')}</div>
            </div>
        `;
        const control = this.container.querySelector('[data-control]');
        this.listen(this.container.querySelector('[data-exit]'), 'click', () => this.close());
        this.listen(control, 'pointerdown', (event) => this.handlePointerDown(event));
        this.listen(control, 'pointermove', (event) => this.handlePointerMove(event));
        this.listen(control, 'pointerup', (event) => this.handlePointerEnd(event));
        this.listen(control, 'pointercancel', (event) => this.handlePointerEnd(event));
        this.listen(window, 'keydown', (event) => this.handleKey(event, true));
        this.listen(window, 'keyup', (event) => this.handleKey(event, false));
        control.focus({ preventScroll: true });
        this.updateAudioStage('crying');
        this.showGuide(control);
    },

    showGuide(control) {
        const play = this.container?.querySelector('.cradle-play');
        const begin = () => {
            if (!this.state || this.state.finished) return;
            const now = performance.now();
            this.state.startedAt = now;
            this.state.lastFrameAt = now;
            this.state.lastInputAt = 0;
            control?.focus({ preventScroll: true });
            this.animationId = requestAnimationFrame((time) => this.tick(time));
        };
        if (this.guideShown || !play || typeof StationIntroGuide === 'undefined') {
            begin();
            return;
        }
        this.guideShown = true;
        StationIntroGuide.start({
            host: play,
            steps: [
                { selector: '[data-guide]', textKey: 'station.cradle.guide.rhythm' },
                { selector: '[data-player]', textKey: 'station.cradle.guide.follow' }
            ],
            onFinish: begin
        });
    },

    listen(target, type, handler, options) {
        if (!target) return;
        target.addEventListener(type, handler, options);
        this.listeners.push({ target, type, handler, options });
    },

    removeListeners() {
        this.listeners.forEach(({ target, type, handler, options }) => {
            target.removeEventListener(type, handler, options);
        });
        this.listeners = [];
    },

    handlePointerDown(event) {
        if (!this.state || this.state.finished || !event.isPrimary) return;
        event.preventDefault();
        this.state.pointerActive = true;
        this.state.activePointerId = event.pointerId;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        this.updatePlayerFromPointer(event);
        const hint = this.container?.querySelector('[data-hand-hint]');
        if (hint) hint.hidden = true;
    },

    handlePointerMove(event) {
        if (!this.state || !this.state.pointerActive || event.pointerId !== this.state.activePointerId) return;
        event.preventDefault();
        this.updatePlayerFromPointer(event);
    },

    handlePointerEnd(event) {
        if (!this.state || event.pointerId !== this.state.activePointerId) return;
        this.updatePlayerFromPointer(event);
        this.state.pointerActive = false;
        this.state.activePointerId = null;
    },

    updatePlayerFromPointer(event) {
        const control = this.container?.querySelector('[data-control]');
        if (!control || !this.state) return;
        const bounds = control.getBoundingClientRect();
        const padding = Math.min(bounds.width * 0.16, 90);
        const usableWidth = Math.max(1, bounds.width - padding * 2);
        this.state.playerPosition = Math.max(0, Math.min(1, (event.clientX - bounds.left - padding) / usableWidth));
        this.state.lastInputAt = performance.now();
    },

    handleKey(event, isDown) {
        if (!this.state || this.state.finished || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
        event.preventDefault();
        const key = event.key === 'ArrowLeft' ? 'left' : 'right';
        this.state.keys[key] = isDown;
        if (isDown) {
            const direction = key === 'left' ? -1 : 1;
            if (!event.repeat) {
                this.state.playerPosition = Math.max(0, Math.min(1, this.state.playerPosition + direction * 0.055));
            }
            this.state.lastInputAt = performance.now();
        }
    },

    tick(time) {
        if (!this.state || this.state.finished || !this.container) return;
        const deltaSeconds = Math.min(0.05, Math.max(0, (time - this.state.lastFrameAt) / 1000));
        this.state.lastFrameAt = time;
        const elapsed = time - this.state.startedAt;
        const wave = Math.sin((elapsed / this.cycleMs) * Math.PI * 2 - Math.PI / 2);
        this.state.guidePosition = 0.5 + wave * 0.42;
        if (!this.state.assisted && elapsed >= this.assistAfterMs) {
            this.state.assisted = true;
            this.state.tolerance = 0.20;
        }

        const direction = Number(this.state.keys.right) - Number(this.state.keys.left);
        if (direction !== 0) {
            this.state.playerPosition = Math.max(0, Math.min(1, this.state.playerPosition + direction * deltaSeconds * 1.4));
            this.state.lastInputAt = time;
        }
        const operating = this.state.pointerActive || direction !== 0 || time - this.state.lastInputAt <= 180;
        const gap = Math.abs(this.state.playerPosition - this.state.guidePosition);
        if (operating && gap <= this.state.tolerance) {
            this.state.stableSeconds = Math.min(this.targetSeconds, this.state.stableSeconds + deltaSeconds);
        } else if (operating && gap > this.state.tolerance) {
            this.state.stableSeconds = Math.max(0, this.state.stableSeconds - deltaSeconds * 0.22);
        }

        this.renderGame(gap, operating);
        if (this.state.stableSeconds >= this.targetSeconds) {
            this.finishGame();
            return;
        }
        this.animationId = requestAnimationFrame((nextTime) => this.tick(nextTime));
    },

    renderGame(gap, operating) {
        if (!this.state || !this.container) return;
        const guide = this.container.querySelector('[data-guide]');
        const player = this.container.querySelector('[data-player]');
        const progress = this.container.querySelector('[data-progress]');
        const progressText = this.container.querySelector('[data-progress-text]');
        const feedback = this.container.querySelector('[data-feedback]');
        const assist = this.container.querySelector('[data-assist]');
        const control = this.container.querySelector('[data-control]');
        const leftRope = this.container.querySelector('[data-rope-left]');
        const rightRope = this.container.querySelector('[data-rope-right]');
        const baby = this.container.querySelector('[data-baby]');
        const percent = Math.round(this.state.stableSeconds / this.targetSeconds * 100);
        const playerPercent = 14 + this.state.playerPosition * 72;
        const angle = (this.state.playerPosition - 0.5) * 12;
        if (guide) guide.style.left = `${14 + this.state.guidePosition * 72}%`;
        if (player) {
            player.style.left = `${playerPercent}%`;
            player.style.transform = `translateX(-50%) rotate(${angle}deg)`;
            player.classList.toggle('is-matching', operating && gap <= this.state.tolerance);
        }
        if (leftRope) {
            leftRope.style.left = `${playerPercent - 11}%`;
            leftRope.style.transform = `rotate(${angle * 0.42}deg)`;
        }
        if (rightRope) {
            rightRope.style.left = `${playerPercent + 11}%`;
            rightRope.style.right = 'auto';
            rightRope.style.transform = `rotate(${angle * 0.42}deg)`;
        }
        if (progress) progress.style.width = `${percent}%`;
        if (progressText) progressText.textContent = String(percent);
        if (control) control.setAttribute('aria-valuenow', String(Math.round(this.state.playerPosition * 100)));
        if (assist) assist.textContent = this.tr(this.state.assisted ? 'station.cradle.assisted' : 'station.cradle.follow');

        const nextStage = percent >= 100 ? 'asleep' : percent >= 35 ? 'calming' : 'crying';
        if (nextStage !== this.state.feedbackStage) this.updateAudioStage(nextStage);
        if (baby) baby.textContent = nextStage === 'calming' ? '😌' : '😢';
        if (feedback) {
            if (!operating) feedback.textContent = this.tr('station.cradle.idle');
            else if (gap <= this.state.tolerance && nextStage === 'calming') feedback.textContent = this.tr('station.cradle.calming');
            else if (gap <= this.state.tolerance) feedback.textContent = this.tr('station.cradle.following');
            else feedback.textContent = this.tr('station.cradle.offGuide');
        }
        this.container.classList.toggle('cradle-assisted', this.state.assisted);
    },

    finishGame() {
        if (!this.state || this.state.finished) return;
        this.state.finished = true;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.updateAudioStage('asleep');
        const assisted = this.state.assisted;
        this.removeListeners();
        const result = { assisted };
        window.dispatchEvent(new CustomEvent('cradle-station-complete', { detail: result }));
        if (this.onComplete) {
            this.onComplete(result);
            return;
        }
        this.container.innerHTML = `
            <section class="station-panel station-result-panel cradle-result-panel has-guide">
                <div class="station-kicker-line">${this.tr('station.cradle.kicker')}</div>
                <h1>${this.tr('station.cradle.result.title')}</h1>
                <div class="cradle-result-baby" aria-hidden="true">😴</div>
                <p class="station-copy">${this.tr('station.cradle.result.copy')}</p>
                ${assisted ? `<p class="cradle-assisted-note">${this.tr('station.cradle.result.assisted')}</p>` : `<p class="cradle-perfect-note">${this.tr('station.cradle.result.perfect')}</p>`}
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry>${this.tr('game.retry')}</button>
                    <button type="button" class="station-secondary" data-back>${this.tr('game.backToEntrance')}</button>
                </div>
                <img class="station-guide station-guide-result" src="assets/images/characters/grandma.png" alt="${this.tr('story.speaker.grandma')}">
            </section>
        `;
        this.listen(this.container.querySelector('[data-retry]'), 'click', () => {
            this.playClick();
            this.startGame();
        });
        this.listen(this.container.querySelector('[data-back]'), 'click', () => this.close());
    },

    prepareAudio() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!this.audioContext || this.audioContext.state === 'closed') this.audioContext = new AudioContextClass();
        if (this.audioContext.state === 'suspended') this.audioContext.resume().catch(() => {});
    },

    updateAudioStage(stage) {
        if (!this.state) return;
        this.state.feedbackStage = stage;
        this.clearAudioTimer();
        if (!this.audioContext || this.audioContext.state !== 'running') return;
        if (stage === 'asleep') {
            this.playTone([523, 659, 784], 0.7, 0.055);
            return;
        }
        const playFeedback = () => {
            if (!this.state || this.state.finished) return;
            if (stage === 'crying') this.playTone([520, 390, 480], 0.34, 0.026);
            else this.playTone([330, 392], 0.28, 0.012);
            this.audioTimer = setTimeout(playFeedback, stage === 'crying' ? 1800 : 3200);
        };
        playFeedback();
    },

    playTone(frequencies, duration, volume) {
        if (!this.audioContext || this.audioContext.state !== 'running') return;
        const startAt = this.audioContext.currentTime;
        frequencies.forEach((frequency, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const noteStart = startAt + index * duration * 0.23;
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, noteStart);
            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.exponentialRampToValueAtTime(volume, noteStart + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);
            oscillator.connect(gain).connect(this.audioContext.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteStart + duration + 0.02);
        });
    },

    clearAudioTimer() {
        if (this.audioTimer) clearTimeout(this.audioTimer);
        this.audioTimer = null;
    },

    playClick() {
        if (window.AudioManager) AudioManager.playSFX('assets/sounds/click.mp3');
    },

    close() {
        const onExit = this.onExit;
        this.stop();
        if (onExit) onExit();
        else showScene('level-select');
    },

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.clearAudioTimer();
        if (typeof StationIntroGuide !== 'undefined') StationIntroGuide.stop();
        this.guideShown = false;
        this.removeListeners();
        if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
        }
        if (this.container?.parentNode) this.container.remove();
        this.container = null;
        this.state = null;
        this.mode = 'standalone';
        this.onComplete = null;
        this.onExit = null;
    }
};

window.CradleStationGame = CradleStationGame;
