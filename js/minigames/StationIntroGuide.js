// StationIntroGuide - 各關卡共用的「聚光燈式」進入操作提示
// 用法：StationIntroGuide.start({ host, steps: [{ selector|target, textKey|text }], onFinish })
// host 需為關卡的遊玩容器；本模組會在其上疊一層遮罩，逐步框亮指定元素並顯示提示框。
const StationIntroGuide = {
    overlay: null,
    host: null,
    hostPositionPatched: false,
    steps: [],
    index: 0,
    finished: false,
    onFinish: null,
    nextKey: 'station.guide.next',
    startKey: 'station.guide.start',
    skipKey: 'station.guide.skip',
    resizeHandler: null,

    tr(key, tokens) {
        return typeof window.t === 'function' ? window.t(key, tokens) : key;
    },

    playClick() {
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('assets/sounds/click.mp3');
    },

    start(options = {}) {
        this.stop();
        const host = options.host;
        const steps = Array.isArray(options.steps) ? options.steps.filter(Boolean) : [];
        const done = typeof options.onFinish === 'function' ? options.onFinish : null;
        if (!host || !steps.length) {
            if (done) done();
            return;
        }

        this.host = host;
        this.steps = steps;
        this.onFinish = done;
        this.index = 0;
        this.finished = false;
        this.nextKey = options.nextLabelKey || 'station.guide.next';
        this.startKey = options.startLabelKey || 'station.guide.start';
        this.skipKey = options.skipLabelKey || 'station.guide.skip';

        if (getComputedStyle(host).position === 'static') {
            host.style.position = 'relative';
            this.hostPositionPatched = true;
        }

        const overlay = document.createElement('div');
        overlay.className = 'station-guide-overlay';
        overlay.innerHTML = `
            <div class="station-guide-spot" data-guide-spot aria-hidden="true"></div>
            <div class="station-guide-hand" data-guide-hand aria-hidden="true">👆</div>
            <div class="station-guide-tip" data-guide-tip role="dialog" aria-live="polite">
                <p class="station-guide-tip-text" data-guide-text></p>
                <div class="station-guide-tip-foot">
                    <span class="station-guide-step" data-guide-step></span>
                    <button type="button" class="station-primary station-guide-next" data-guide-next></button>
                </div>
            </div>
            <button type="button" class="station-guide-skip" data-guide-skip>${this.tr(this.skipKey)}</button>
        `;
        host.appendChild(overlay);
        this.overlay = overlay;

        overlay.addEventListener('click', () => this.advance());
        overlay.querySelector('[data-guide-next]').addEventListener('click', (event) => {
            event.stopPropagation();
            this.playClick();
            this.advance();
        });
        overlay.querySelector('[data-guide-skip]').addEventListener('click', (event) => {
            event.stopPropagation();
            this.playClick();
            this.finish();
        });
        this.resizeHandler = () => this.position();
        window.addEventListener('resize', this.resizeHandler);

        this.render();
    },

    advance() {
        this.index++;
        this.render();
    },

    render() {
        if (!this.overlay) return;
        if (this.index >= this.steps.length) {
            this.finish();
            return;
        }
        const step = this.steps[this.index];
        const text = this.overlay.querySelector('[data-guide-text]');
        const stepLabel = this.overlay.querySelector('[data-guide-step]');
        const next = this.overlay.querySelector('[data-guide-next]');
        if (text) text.textContent = step.text || this.tr(step.textKey);
        if (stepLabel) stepLabel.textContent = this.steps.length > 1 ? `${this.index + 1} / ${this.steps.length}` : '';
        if (next) {
            next.textContent = this.index === this.steps.length - 1
                ? this.tr(this.startKey)
                : this.tr(this.nextKey);
        }
        this.position();
    },

    resolveTarget(step) {
        if (!step) return null;
        if (typeof step.target === 'function') return step.target();
        if (step.target && step.target.nodeType === 1) return step.target;
        if (step.selector) return this.host ? this.host.querySelector(step.selector) : null;
        return null;
    },

    position() {
        const overlay = this.overlay;
        const host = this.host;
        if (!overlay || !host) return;
        const step = this.steps[this.index];
        if (!step) return;
        const spot = overlay.querySelector('[data-guide-spot]');
        const hand = overlay.querySelector('[data-guide-hand]');
        const tip = overlay.querySelector('[data-guide-tip]');
        if (!spot || !hand || !tip) return;

        const hostRect = host.getBoundingClientRect();
        const target = this.resolveTarget(step);

        if (!target) {
            // 沒有可框的元素時，提示框置中、不畫光圈與手指。
            spot.style.opacity = '0';
            hand.style.opacity = '0';
            tip.style.left = `${Math.max(8, (hostRect.width - (tip.offsetWidth || 260)) / 2)}px`;
            tip.style.top = `${Math.max(8, (hostRect.height - (tip.offsetHeight || 100)) / 2)}px`;
            return;
        }
        spot.style.opacity = '';
        hand.style.opacity = '';

        const rect = target.getBoundingClientRect();
        const pad = 8;
        const left = rect.left - hostRect.left - pad;
        const top = rect.top - hostRect.top - pad;
        const width = rect.width + pad * 2;
        const height = rect.height + pad * 2;
        spot.style.left = `${left}px`;
        spot.style.top = `${top}px`;
        spot.style.width = `${width}px`;
        spot.style.height = `${height}px`;

        const centerX = left + width / 2;
        const tipWidth = tip.offsetWidth || 260;
        const tipHeight = tip.offsetHeight || 100;
        const handSize = hand.offsetHeight || 40;
        const handGap = 6;

        // 手指＋提示框：優先放在光圈下方，下方空間不夠時整組移到上方。
        const roomBelow = hostRect.height - (top + height) - 8;
        const placeBelow = roomBelow >= handSize + handGap + tipHeight;
        if (placeBelow) {
            hand.textContent = '👆';
            hand.style.top = `${top + height + handGap}px`;
            tip.style.top = `${top + height + handGap + handSize + handGap}px`;
        } else {
            hand.textContent = '👇';
            hand.style.top = `${Math.max(2, top - handGap - handSize)}px`;
            tip.style.top = `${Math.max(8, top - handGap - handSize - handGap - tipHeight)}px`;
        }
        hand.style.left = `${centerX}px`;

        let tipLeft = centerX - tipWidth / 2;
        tipLeft = Math.min(Math.max(8, tipLeft), Math.max(8, hostRect.width - tipWidth - 8));
        tip.style.left = `${tipLeft}px`;
    },

    finish() {
        const cb = this.finished ? null : this.onFinish;
        this.finished = true;
        this.cleanup();
        if (cb) cb();
    },

    cleanup() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        if (this.overlay && this.overlay.parentNode) this.overlay.remove();
        this.overlay = null;
        if (this.hostPositionPatched && this.host) this.host.style.position = '';
        this.hostPositionPatched = false;
    },

    stop() {
        this.cleanup();
        this.steps = [];
        this.index = 0;
        this.finished = false;
        this.onFinish = null;
        this.host = null;
    }
};

window.StationIntroGuide = StationIntroGuide;
