const CakeStationGame = {
    container: null,
    state: null,
    listeners: [],
    timers: [],
    holdAnimationId: null,
    lastResult: null,

    start() {
        this.stop();
        if (window.StationDemoGame) StationDemoGame.stop();
        showScene('game-container');
        this.hideLegacyGameUi();
        this.createShell();
        this.state = {
            introIndex: 0,
            topOrder: [],
            bottomOrder: [],
            matchedIds: [],
            resolvingMatch: false,
            keyboardEndpoint: null,
            selectedPatternId: null,
            makeStep: 'dough',
            doughPositioned: false,
            moldFaceIndex: 0,
            moldPositioned: false,
            holding: false,
            holdStartedAt: 0
        };
        this.showIntro(0);
    },

    get patterns() {
        return Array.isArray(window.CakePatterns) ? window.CakePatterns : [];
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
        if (window.DialogueSystem) DialogueSystem.endDialogue(true);
        if (window.AudioManager) AudioManager.stopBGM();
    },

    createShell() {
        const parent = document.getElementById('game-wrapper') || document.body;
        document.body.classList.add('cake-station-active');
        this.container = document.createElement('div');
        this.container.className = 'station-demo station-demo-cake';
        parent.appendChild(this.container);
    },

    showIntro(index) {
        const pattern = this.patterns[index];
        if (!this.container || !this.state || !pattern) {
            this.showDataError();
            return;
        }
        this.removeListeners();
        this.state.introIndex = index;
        const isLast = index === this.patterns.length - 1;
        this.container.innerHTML = `
            <section class="cake-card-panel">
                <button type="button" class="station-secondary station-corner-exit" data-exit>離開</button>
                <div class="cake-step-label">花紋介紹 ${index + 1} / ${this.patterns.length}</div>
                <div class="cake-intro-card">
                    <div class="cake-pattern-frame"><img src="${pattern.introImage}" alt="${pattern.name}"></div>
                    <div class="cake-intro-copy">
                        <div class="station-kicker-line">關卡四 / 站點 4</div>
                        <h1>${pattern.name}</h1>
                        <p class="cake-meaning">${pattern.meaning}</p>
                        <p>${pattern.blessing}</p>
                    </div>
                </div>
                <div class="cake-intro-dots" aria-label="介紹進度">
                    ${this.patterns.map((item, itemIndex) => `<span class="${itemIndex <= index ? 'read' : ''}">${item.name}</span>`).join('')}
                </div>
                <div class="station-actions cake-actions">
                    ${index > 0 ? '<button type="button" class="station-secondary" data-prev>上一張</button>' : ''}
                    <button type="button" class="station-primary" data-next>${isLast ? '開始連連看' : '下一張'}</button>
                </div>
            </section>`;
        this.listen(this.container.querySelector('[data-exit]'), 'click', () => this.close());
        this.listen(this.container.querySelector('[data-prev]'), 'click', () => this.showIntro(index - 1));
        this.listen(this.container.querySelector('[data-next]'), 'click', () => {
            this.playClick();
            if (isLast) this.startMatching();
            else this.showIntro(index + 1);
        });
    },

    startMatching() {
        if (!this.state) return;
        const ids = this.patterns.map((pattern) => pattern.id);
        this.state.topOrder = this.shuffle(ids);
        this.state.bottomOrder = this.shuffle(ids);
        this.state.matchedIds = [];
        this.state.resolvingMatch = false;
        this.state.keyboardEndpoint = null;
        this.renderMatching();
    },

    renderMatching() {
        if (!this.container || !this.state) return;
        this.removeListeners();
        const allMatched = this.state.matchedIds.length === this.patterns.length;
        const topCards = this.state.topOrder.map((id) => {
            const pattern = this.getPattern(id);
            const matched = this.state.matchedIds.includes(id);
            return `<div class="cake-match-card cake-match-pattern ${matched ? 'matched' : ''}" data-card-side="top" data-pattern-id="${id}">
                <img src="${pattern.introImage}" alt="${pattern.name}">
                <button type="button" class="cake-connector cake-connector-bottom" data-connector data-side="top" data-pattern-id="${id}" ${matched ? 'disabled' : ''} aria-label="從${pattern.name}開始連線"></button>
            </div>`;
        }).join('');
        const bottomCards = this.state.bottomOrder.map((id) => {
            const pattern = this.getPattern(id);
            const matched = this.state.matchedIds.includes(id);
            return `<div class="cake-match-card cake-match-meaning ${matched ? 'matched' : ''}" data-card-side="bottom" data-pattern-id="${id}">
                <button type="button" class="cake-connector cake-connector-top" data-connector data-side="bottom" data-pattern-id="${id}" ${matched ? 'disabled' : ''} aria-label="連到${pattern.meaning}"></button>
                <strong>${pattern.meaning}</strong>
            </div>`;
        }).join('');
        this.container.innerHTML = `
            <section class="cake-match-panel">
                <button type="button" class="station-secondary station-corner-exit" data-exit>離開</button>
                <div class="cake-heading-row">
                    <div><div class="station-kicker-line">關卡四 / 站點 4</div><h1>花紋連連看</h1></div>
                    <p>從花紋卡拖到正確寓意卡，靠近卡片就會自動吸附。</p>
                </div>
                <div class="cake-match-board" data-match-board>
                    <svg class="cake-match-lines" data-match-lines aria-hidden="true"><path class="cake-live-line" data-live-line></path></svg>
                    <div class="cake-match-row cake-match-top" aria-label="花紋圖像">${topCards}</div>
                    <div class="cake-match-gap" aria-hidden="true"><span>拖曳連線</span></div>
                    <div class="cake-match-row cake-match-bottom" aria-label="寓意字詞">${bottomCards}</div>
                </div>
                <div class="cake-match-feedback" data-match-feedback aria-live="polite">
                    ${allMatched ? '四組都配對完成，可以選擇想做的花紋了！' : `已完成 ${this.state.matchedIds.length} / ${this.patterns.length} 組`}
                </div>
                <div class="station-actions cake-actions"><button type="button" class="station-primary" data-to-select ${allMatched ? '' : 'disabled'}>選擇花紋</button></div>
            </section>`;
        this.listen(this.container.querySelector('[data-exit]'), 'click', () => this.close());
        this.container.querySelectorAll('[data-card-side]').forEach((card) => {
            this.listen(card, 'pointerdown', (event) => this.startMatchDrag(event));
        });
        this.container.querySelectorAll('[data-connector]').forEach((connector) => {
            this.listen(connector, 'keydown', (event) => this.handleMatchKey(event));
        });
        this.listen(this.container.querySelector('[data-to-select]'), 'click', () => {
            this.playClick();
            this.showSelection();
        });
        this.listen(window, 'resize', () => this.positionMatchLines());
        requestAnimationFrame(() => this.positionMatchLines());
    },

    startMatchDrag(event) {
        if (!this.state || this.state.resolvingMatch || !event.isPrimary) return;
        const sourceCard = event.currentTarget.closest('[data-card-side]');
        const source = sourceCard?.querySelector('[data-connector]');
        if (!source || source.disabled) return;
        event.preventDefault();
        const sourceSide = source.dataset.side;
        const sourceId = source.dataset.patternId;
        sourceCard.setPointerCapture?.(event.pointerId);
        sourceCard.classList.add('connecting');
        const draw = (pointerEvent) => this.drawLiveLine(source, pointerEvent.clientX, pointerEvent.clientY);
        const cleanup = () => {
            source.classList.remove('active');
            sourceCard.classList.remove('connecting');
            sourceCard.removeEventListener('pointermove', move);
            sourceCard.removeEventListener('pointerup', finish);
            sourceCard.removeEventListener('pointercancel', cancel);
        };
        const move = (moveEvent) => {
            if (moveEvent.pointerId !== event.pointerId) return;
            source.classList.add('active');
            draw(moveEvent);
        };
        const finish = (finishEvent) => {
            if (finishEvent.pointerId !== event.pointerId) return;
            const target = this.findMatchTarget(finishEvent.clientX, finishEvent.clientY, sourceSide);
            cleanup();
            this.clearLiveLine();
            if (target) {
                this.resolveMatch(sourceId, target.dataset.patternId, source, target);
            } else {
                this.setMatchFeedback('再靠近另一排的卡片一點，就會自動吸附。');
            }
        };
        const cancel = (cancelEvent) => {
            if (cancelEvent.pointerId !== event.pointerId) return;
            cleanup();
            this.clearLiveLine();
        };
        sourceCard.addEventListener('pointermove', move);
        sourceCard.addEventListener('pointerup', finish);
        sourceCard.addEventListener('pointercancel', cancel);
        draw(event);
    },

    findMatchTarget(clientX, clientY, sourceSide) {
        const hitCard = document.elementFromPoint(clientX, clientY)?.closest('[data-card-side]');
        const directTarget = hitCard?.querySelector('[data-connector]');
        if (directTarget && !directTarget.disabled && directTarget.dataset.side !== sourceSide) return directTarget;

        let nearest = null;
        let nearestDistance = 64;
        this.container?.querySelectorAll(`[data-connector]:not(:disabled)`).forEach((connector) => {
            if (connector.dataset.side === sourceSide) return;
            const rect = connector.getBoundingClientRect();
            const distance = Math.hypot(clientX - (rect.left + rect.width / 2), clientY - (rect.top + rect.height / 2));
            if (distance <= nearestDistance) {
                nearest = connector;
                nearestDistance = distance;
            }
        });
        return nearest;
    },

    handleMatchKey(event) {
        if ((event.key !== 'Enter' && event.key !== ' ') || !this.state || this.state.resolvingMatch) return;
        event.preventDefault();
        const endpoint = { side: event.currentTarget.dataset.side, id: event.currentTarget.dataset.patternId };
        if (!this.state.keyboardEndpoint || this.state.keyboardEndpoint.side === endpoint.side) {
            this.state.keyboardEndpoint = endpoint;
            this.container.querySelectorAll('.cake-match-card.keyboard-selected').forEach((card) => card.classList.remove('keyboard-selected'));
            event.currentTarget.closest('.cake-match-card')?.classList.add('keyboard-selected');
            this.setMatchFeedback('已選第一個端點，再選另一排的小點。');
            return;
        }
        const source = this.state.keyboardEndpoint;
        this.state.keyboardEndpoint = null;
        this.resolveMatch(source.id, endpoint.id);
    },

    resolveMatch(sourceId, targetId, sourceConnector, targetConnector) {
        if (!this.state || this.state.resolvingMatch) return;
        if (sourceId === targetId) {
            if (!this.state.matchedIds.includes(sourceId)) this.state.matchedIds.push(sourceId);
            this.playClick();
            this.renderMatching();
            return;
        }
        this.state.resolvingMatch = true;
        [sourceConnector, targetConnector].forEach((connector) => connector?.closest('.cake-match-card')?.classList.add('wrong'));
        this.setMatchFeedback('這兩個不相配，紅線消失後再試一次。');
        this.playWrong();
        this.timers.push(setTimeout(() => {
            if (!this.state) return;
            this.state.resolvingMatch = false;
            this.renderMatching();
        }, 650));
    },

    drawLiveLine(source, clientX, clientY) {
        const board = this.container?.querySelector('[data-match-board]');
        const line = this.container?.querySelector('[data-live-line]');
        if (!board || !line) return;
        const boardRect = board.getBoundingClientRect();
        const sourceRect = source.getBoundingClientRect();
        const x1 = sourceRect.left + sourceRect.width / 2 - boardRect.left;
        const y1 = sourceRect.top + sourceRect.height / 2 - boardRect.top;
        const x2 = clientX - boardRect.left;
        const y2 = clientY - boardRect.top;
        line.setAttribute('d', this.connectionPath(x1, y1, x2, y2));
        line.classList.add('visible');
    },

    clearLiveLine() {
        const line = this.container?.querySelector('[data-live-line]');
        if (!line) return;
        line.removeAttribute('d');
        line.classList.remove('visible');
    },

    positionMatchLines() {
        const board = this.container?.querySelector('[data-match-board]');
        const svg = this.container?.querySelector('[data-match-lines]');
        if (!board || !svg || !this.state) return;
        const boardRect = board.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);
        svg.querySelectorAll('.cake-fixed-line').forEach((line) => line.remove());
        this.state.matchedIds.forEach((id) => {
            const top = board.querySelector(`[data-connector][data-side="top"][data-pattern-id="${id}"]`);
            const bottom = board.querySelector(`[data-connector][data-side="bottom"][data-pattern-id="${id}"]`);
            if (!top || !bottom) return;
            const topRect = top.getBoundingClientRect();
            const bottomRect = bottom.getBoundingClientRect();
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('class', 'cake-fixed-line');
            line.setAttribute('d', this.connectionPath(
                topRect.left + topRect.width / 2 - boardRect.left,
                topRect.top + topRect.height / 2 - boardRect.top,
                bottomRect.left + bottomRect.width / 2 - boardRect.left,
                bottomRect.top + bottomRect.height / 2 - boardRect.top
            ));
            svg.insertBefore(line, svg.firstChild);
        });
    },

    connectionPath(x1, y1, x2, y2) {
        const middleY = (y1 + y2) / 2;
        return `M ${x1} ${y1} C ${x1} ${middleY}, ${x2} ${middleY}, ${x2} ${y2}`;
    },

    setMatchFeedback(message) {
        const feedback = this.container?.querySelector('[data-match-feedback]');
        if (feedback) feedback.textContent = message;
    },

    showSelection() {
        if (!this.container || !this.state) return;
        this.removeListeners();
        this.state.selectedPatternId = null;
        this.container.innerHTML = `
            <section class="cake-select-panel">
                <button type="button" class="station-secondary station-corner-exit" data-exit>離開</button>
                <div class="station-kicker-line">關卡四 / 站點 4</div>
                <h1>選一個祝福花紋</h1>
                <p class="cake-select-help">等等要旋轉粿印棒，找出你選的這一面。</p>
                <div class="cake-pattern-options">
                    ${this.patterns.map((pattern) => `<button type="button" class="cake-pattern-option" data-select-pattern="${pattern.id}">
                        <span class="cake-option-image"><img src="${pattern.introImage}" alt=""></span>
                        <strong>${pattern.name}</strong><span>${pattern.meaning}</span>
                    </button>`).join('')}
                </div>
                <div class="station-actions cake-actions"><button type="button" class="station-primary" data-confirm-pattern disabled>開始製作</button></div>
            </section>`;
        this.listen(this.container.querySelector('[data-exit]'), 'click', () => this.close());
        this.container.querySelectorAll('[data-select-pattern]').forEach((button) => {
            this.listen(button, 'click', () => {
                this.state.selectedPatternId = button.dataset.selectPattern;
                this.container.querySelectorAll('[data-select-pattern]').forEach((option) => option.classList.toggle('selected', option === button));
                this.container.querySelector('[data-confirm-pattern]').disabled = false;
                this.playClick();
            });
        });
        this.listen(this.container.querySelector('[data-confirm-pattern]'), 'click', () => {
            const targetIndex = this.patterns.findIndex((item) => item.id === this.state.selectedPatternId);
            if (targetIndex < 0) return;
            this.state.makeStep = 'dough';
            this.state.doughPositioned = false;
            this.state.moldPositioned = false;
            this.state.moldFaceIndex = (targetIndex + 1) % this.patterns.length;
            this.showMaking();
        });
    },

    showMaking() {
        const target = this.getPattern(this.state?.selectedPatternId);
        const face = this.patterns[this.state?.moldFaceIndex];
        if (!this.container || !this.state || !target || !face) return;
        this.removeListeners();
        this.cancelHold(true);
        const step = this.state.makeStep;
        const prompt = {
            dough: '先把左邊的米糰拖到中央圓盤。',
            rotate: `左右旋轉粿印棒，找到「${target.name}」。`,
            move: '圖案正確！把右邊的粿印棒拖到中央。',
            press: '模具已對準，按住粿印棒 1 秒完成壓印。'
        }[step];
        const stepIndex = ['dough', 'rotate', 'move', 'press'].indexOf(step);
        this.container.innerHTML = `
            <section class="cake-making-panel" data-make-step="${step}">
                <button type="button" class="station-secondary station-corner-exit" data-exit>離開</button>
                <div class="cake-making-header">
                    <div><span class="station-kicker-line">製作紅粿</span><strong>目標：${target.name}</strong></div>
                    <div class="cake-target-chip"><img src="${target.introImage}" alt=""><span>${target.meaning}</span></div>
                </div>
                <ol class="cake-step-track" aria-label="製作步驟">
                    ${['放米糰', '轉到對的花紋', '移動粿印棒', '長按壓印'].map((label, index) => `<li class="${index < stepIndex ? 'done' : index === stepIndex ? 'current' : ''}"><span>${index < stepIndex ? '✓' : index + 1}</span>${label}</li>`).join('')}
                </ol>
                <div class="cake-guidance" data-making-feedback aria-live="polite"><span class="cake-hand-hint">☝</span><strong>${prompt}</strong></div>
                <div class="cake-workbench" data-workbench>
                    <div class="cake-zone-label cake-left-label">米糰</div>
                    <div class="cake-zone-label cake-center-label">壓印區</div>
                    <div class="cake-zone-label cake-right-label">粿印棒</div>
                    <div class="cake-dough-tray" aria-hidden="true"></div>
                    <div class="cake-work-zone ${this.state.doughPositioned ? 'has-dough' : ''}" data-work-zone><span>${this.state.doughPositioned ? '米糰已就位' : '放在這裡'}</span></div>
                    <button type="button" class="cake-dough ${this.state.doughPositioned ? 'snapped' : ''}" data-dough aria-label="${this.state.doughPositioned ? '已定位的米糰' : '拖曳米糰到中央'}" ${this.state.doughPositioned ? 'tabindex="-1"' : ''}></button>
                    <div class="cake-mold-dock"></div>
                    <button type="button" class="cake-mold-tool ${this.state.moldPositioned ? 'positioned' : ''} step-${step}" data-mold-tool aria-label="目前是${face.name}的四面粿印棒">
                        <span class="cake-mold-handle"><i></i></span>
                        <span class="cake-mold-block">
                            <span class="cake-mold-face"><img src="${face.moldImage}" alt=""><b>${face.name}</b></span>
                            <span class="cake-mold-side"></span>
                            <span class="cake-press-fill" data-hold-fill></span>
                        </span>
                    </button>
                    ${step === 'rotate' ? `<div class="cake-rotate-controls" aria-label="旋轉粿印棒">
                        <button type="button" data-rotate="-1" aria-label="向左旋轉">↶</button>
                        <span>拖曳或按箭頭旋轉</span>
                        <button type="button" data-rotate="1" aria-label="向右旋轉">↷</button>
                    </div>` : ''}
                    ${step === 'press' ? '<div class="cake-hold-label">按住不放<br><strong>1 秒</strong></div>' : ''}
                </div>
            </section>`;
        this.listen(this.container.querySelector('[data-exit]'), 'click', () => this.close());
        const dough = this.container.querySelector('[data-dough]');
        const mold = this.container.querySelector('[data-mold-tool]');
        if (step === 'dough') {
            this.listen(dough, 'pointerdown', (event) => this.startObjectDrag(event, 'dough'));
            this.listen(dough, 'keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.snapDough();
                }
            });
        }
        if (step === 'rotate') {
            this.container.querySelectorAll('[data-rotate]').forEach((button) => this.listen(button, 'click', () => this.rotateMold(Number(button.dataset.rotate))));
            this.listen(mold, 'pointerdown', (event) => this.startMoldRotateGesture(event));
            this.listen(mold, 'keydown', (event) => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault();
                    this.rotateMold(event.key === 'ArrowRight' ? 1 : -1);
                }
            });
        }
        if (step === 'move') {
            this.listen(mold, 'pointerdown', (event) => this.startObjectDrag(event, 'mold'));
            this.listen(mold, 'keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.snapMold();
                }
            });
        }
        if (step === 'press') {
            this.listen(mold, 'pointerdown', (event) => {
                event.preventDefault();
                mold.setPointerCapture?.(event.pointerId);
                this.startHold();
            });
            this.listen(mold, 'pointerup', () => this.cancelHold());
            this.listen(mold, 'pointercancel', () => this.cancelHold());
            this.listen(mold, 'keydown', (event) => {
                if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
                    event.preventDefault();
                    this.startHold();
                }
            });
            this.listen(mold, 'keyup', (event) => {
                if (event.key === ' ' || event.key === 'Enter') this.cancelHold();
            });
            mold.focus({ preventScroll: true });
        }
    },

    startObjectDrag(event, type) {
        if (!this.state || !event.isPrimary) return;
        event.preventDefault();
        const object = event.currentTarget;
        object.setPointerCapture?.(event.pointerId);
        object.classList.add('dragging');
        const move = (moveEvent) => {
            if (moveEvent.pointerId !== event.pointerId) return;
            const workbench = this.container?.querySelector('[data-workbench]');
            if (!workbench) return;
            const bounds = workbench.getBoundingClientRect();
            object.style.left = `${moveEvent.clientX - bounds.left}px`;
            object.style.top = `${moveEvent.clientY - bounds.top}px`;
        };
        const cleanup = () => {
            object.classList.remove('dragging');
            object.removeEventListener('pointermove', move);
            object.removeEventListener('pointerup', finish);
            object.removeEventListener('pointercancel', cancel);
        };
        const finish = (finishEvent) => {
            if (finishEvent.pointerId !== event.pointerId) return;
            cleanup();
            const zone = this.container?.querySelector('[data-work-zone]');
            if (!zone) return;
            const bounds = zone.getBoundingClientRect();
            const distance = Math.hypot(finishEvent.clientX - (bounds.left + bounds.width / 2), finishEvent.clientY - (bounds.top + bounds.height / 2));
            if (distance <= Math.max(bounds.width, bounds.height) * 0.48) {
                if (type === 'dough') this.snapDough();
                else this.snapMold();
            } else {
                object.removeAttribute('style');
                this.setMakingFeedback(type === 'dough' ? '米糰要放到中央圓盤，已幫你送回左邊。' : '粿印棒要移到中央米糰上，已幫你送回右邊。');
            }
        };
        const cancel = (cancelEvent) => {
            if (cancelEvent.pointerId !== event.pointerId) return;
            cleanup();
            object.removeAttribute('style');
        };
        object.addEventListener('pointermove', move);
        object.addEventListener('pointerup', finish);
        object.addEventListener('pointercancel', cancel);
    },

    snapDough() {
        if (!this.state || this.state.makeStep !== 'dough') return;
        this.state.doughPositioned = true;
        this.state.makeStep = 'rotate';
        this.playClick();
        this.showMaking();
    },

    startMoldRotateGesture(event) {
        if (!this.state || this.state.makeStep !== 'rotate' || !event.isPrimary) return;
        event.preventDefault();
        const mold = event.currentTarget;
        const startX = event.clientX;
        mold.setPointerCapture?.(event.pointerId);
        mold.classList.add('rotating');
        const finish = (finishEvent) => {
            if (finishEvent.pointerId !== event.pointerId) return;
            cleanup();
            const delta = finishEvent.clientX - startX;
            if (Math.abs(delta) < 18) {
                this.setMakingFeedback('在粿印棒上左右拖曳，或按下方箭頭旋轉。');
                return;
            }
            this.rotateMold(delta < 0 ? 1 : -1);
        };
        const cleanup = () => {
            mold.classList.remove('rotating');
            mold.removeEventListener('pointerup', finish);
            mold.removeEventListener('pointercancel', cleanup);
        };
        mold.addEventListener('pointerup', finish);
        mold.addEventListener('pointercancel', cleanup);
    },

    rotateMold(direction) {
        if (!this.state || this.state.makeStep !== 'rotate') return;
        this.state.moldFaceIndex = (this.state.moldFaceIndex + direction + this.patterns.length) % this.patterns.length;
        const face = this.patterns[this.state.moldFaceIndex];
        this.playClick();
        if (face.id === this.state.selectedPatternId) this.state.makeStep = 'move';
        this.showMaking();
        if (this.state.makeStep === 'rotate') this.setMakingFeedback(`現在是「${face.name}」，目標不是這一面，繼續旋轉。`);
    },

    snapMold() {
        if (!this.state || this.state.makeStep !== 'move') return;
        this.state.moldPositioned = true;
        this.state.makeStep = 'press';
        this.playClick();
        this.showMaking();
    },

    setMakingFeedback(message) {
        const feedback = this.container?.querySelector('[data-making-feedback] strong');
        if (feedback) feedback.textContent = message;
    },

    startHold() {
        if (!this.state || this.state.makeStep !== 'press' || this.state.holding) return;
        this.state.holding = true;
        this.state.holdStartedAt = performance.now();
        this.setMakingFeedback('穩穩按住，不要放開……');
        this.holdAnimationId = requestAnimationFrame((time) => this.tickHold(time));
    },

    tickHold(time) {
        if (!this.state?.holding || !this.container) return;
        const elapsed = time - this.state.holdStartedAt;
        const percent = Math.min(100, elapsed / 1000 * 100);
        const fill = this.container.querySelector('[data-hold-fill]');
        if (fill) fill.style.height = `${percent}%`;
        if (elapsed >= 1000) {
            this.state.holding = false;
            this.holdAnimationId = null;
            this.finishCake();
            return;
        }
        this.holdAnimationId = requestAnimationFrame((nextTime) => this.tickHold(nextTime));
    },

    cancelHold(silent = false) {
        if (this.holdAnimationId) cancelAnimationFrame(this.holdAnimationId);
        this.holdAnimationId = null;
        if (!this.state?.holding) return;
        this.state.holding = false;
        const fill = this.container?.querySelector('[data-hold-fill]');
        if (fill) fill.style.height = '0%';
        if (!silent) this.setMakingFeedback('還差一點！要連續按滿一秒，再試一次。');
    },

    finishCake() {
        const pattern = this.getPattern(this.state?.selectedPatternId);
        if (!pattern) return;
        this.lastResult = { selectedPatternId: pattern.id, pattern: { ...pattern } };
        window.selectedPatternId = pattern.id;
        window.dispatchEvent(new CustomEvent('cake-station-complete', { detail: this.lastResult }));
        this.showResult(pattern);
    },

    showResult(pattern) {
        if (!this.container || !this.state) return;
        this.removeListeners();
        this.container.innerHTML = `
            <section class="cake-result-panel">
                <div class="cake-result-art">
                    <div class="cake-serving-leaf" aria-hidden="true"></div>
                    <div class="cake-finished-cake cake-finished-${pattern.id}">
                        <span class="cake-emboss-ring"><img src="${pattern.cakeImage}" alt="${pattern.name}紅粿壓紋"></span>
                    </div>
                    <span class="cake-result-caption">剛壓好的${pattern.name}紅粿</span>
                </div>
                <div class="cake-result-copy">
                    <div class="station-kicker-line">紅粿完成</div><h1>${pattern.name}</h1>
                    <p class="cake-meaning">${pattern.meaning}</p><p>${pattern.blessing}</p>
                    <div class="cake-result-data">祝福花紋已記錄：<strong>${pattern.name}</strong></div>
                    <div class="cake-card-actions" aria-label="祝福卡分享與下載">
                        <button type="button" class="station-primary cake-card-action" data-share-card><span aria-hidden="true">↗</span> 分享祝福卡</button>
                        <button type="button" class="station-secondary cake-card-action" data-download-card><span aria-hidden="true">⇩</span> 下載卡片</button>
                    </div>
                    <p class="cake-share-feedback" data-share-feedback aria-live="polite"></p>
                    <div class="station-actions cake-actions">
                        <button type="button" class="station-primary" data-again>再做一塊</button>
                        <button type="button" class="station-secondary" data-back>返回入口</button>
                    </div>
                </div>
            </section>`;
        this.listen(this.container.querySelector('[data-again]'), 'click', () => {
            this.playClick();
            this.showSelection();
        });
        this.listen(this.container.querySelector('[data-share-card]'), 'click', () => this.shareBlessingCard(pattern));
        this.listen(this.container.querySelector('[data-download-card]'), 'click', () => this.downloadBlessingCard(pattern));
        this.listen(this.container.querySelector('[data-back]'), 'click', () => this.close());
    },

    async createBlessingCard(pattern) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 1080, 1350);
        gradient.addColorStop(0, '#243b31');
        gradient.addColorStop(1, '#0d1e1c');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 1080, 1350);
        context.strokeStyle = '#d9b45d';
        context.lineWidth = 8;
        context.strokeRect(42, 42, 996, 1266);
        context.fillStyle = '#e8ca78';
        context.font = '700 34px "Noto Sans TC", sans-serif';
        context.textAlign = 'center';
        context.fillText('市場裡的祝福', 540, 125);

        context.save();
        context.translate(540, 575);
        context.rotate(-0.08);
        context.fillStyle = '#567346';
        context.beginPath();
        context.ellipse(0, 95, 390, 155, 0, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = 'rgba(225, 240, 174, .38)';
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(-330, 100);
        context.lineTo(330, 88);
        context.stroke();
        context.restore();

        const cakeGradient = context.createRadialGradient(425, 405, 30, 540, 555, 330);
        cakeGradient.addColorStop(0, '#ff9b88');
        cakeGradient.addColorStop(.58, '#dc514b');
        cakeGradient.addColorStop(1, '#8e282d');
        context.fillStyle = '#752328';
        context.beginPath();
        context.ellipse(540, 625, 315, 260, -0.03, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = cakeGradient;
        context.beginPath();
        context.ellipse(540, 596, 315, 260, -0.03, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = 'rgba(105, 22, 27, .5)';
        context.lineWidth = 10;
        context.beginPath();
        context.ellipse(540, 596, 218, 182, -0.03, 0, Math.PI * 2);
        context.stroke();

        try {
            const image = await this.loadCardImage(pattern.cakeImage);
            context.save();
            context.globalAlpha = .58;
            context.filter = 'sepia(1) saturate(2.2) brightness(.48)';
            context.drawImage(image, 390, 445, 300, 300);
            context.restore();
        } catch (error) {
            console.warn('祝福卡花紋載入失敗', error);
        }

        context.fillStyle = '#fff4d2';
        context.font = '900 82px "Noto Serif TC", serif';
        context.fillText(pattern.name, 540, 985);
        context.fillStyle = '#f1c65c';
        context.font = '700 47px "Noto Sans TC", sans-serif';
        context.fillText(pattern.meaning, 540, 1065);
        context.fillStyle = '#f7edda';
        context.font = '400 35px "Noto Sans TC", sans-serif';
        context.fillText(pattern.blessing, 540, 1135);
        context.fillStyle = '#b9c9bd';
        context.font = '400 26px "Noto Sans TC", sans-serif';
        context.fillText('Museum Web Game・紅粿祝福卡', 540, 1245);

        return new Promise((resolve, reject) => canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('無法產生卡片圖片'));
        }, 'image/png'));
    },

    loadCardImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
        });
    },

    async downloadBlessingCard(pattern) {
        this.setShareFeedback('正在製作卡片…');
        try {
            const blob = await this.createBlessingCard(pattern);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `紅粿祝福卡-${pattern.name}.png`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.setShareFeedback('卡片已下載，可以收藏或傳給朋友。');
        } catch (error) {
            console.error(error);
            this.setShareFeedback('卡片製作失敗，請再試一次。');
        }
    },

    async shareBlessingCard(pattern) {
        this.setShareFeedback('正在製作分享卡…');
        try {
            const blob = await this.createBlessingCard(pattern);
            const file = new File([blob], `紅粿祝福卡-${pattern.name}.png`, { type: 'image/png' });
            if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
                await navigator.share({ title: `${pattern.name}紅粿祝福卡`, text: `${pattern.meaning}｜${pattern.blessing}`, files: [file] });
                this.setShareFeedback('祝福卡已分享。');
                return;
            }
            await this.downloadBlessingCard(pattern);
            this.setShareFeedback('此裝置不支援分享面板，已改為下載卡片。');
        } catch (error) {
            if (error?.name === 'AbortError') {
                this.setShareFeedback('已取消分享。');
                return;
            }
            console.error(error);
            this.setShareFeedback('目前無法分享，請改用下載卡片。');
        }
    },

    setShareFeedback(message) {
        const feedback = this.container?.querySelector('[data-share-feedback]');
        if (feedback) feedback.textContent = message;
    },

    showDataError() {
        if (!this.container) return;
        this.container.innerHTML = `<section class="station-panel"><h1>花紋資料載入失敗</h1><p>請重新整理頁面後再試。</p><button type="button" class="station-secondary" data-back>返回入口</button></section>`;
        this.listen(this.container.querySelector('[data-back]'), 'click', () => this.close());
    },

    getPattern(id) {
        return this.patterns.find((pattern) => pattern.id === id);
    },

    shuffle(items) {
        const result = [...items];
        for (let index = result.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
        }
        return result;
    },

    listen(target, type, handler, options) {
        if (!target) return;
        target.addEventListener(type, handler, options);
        this.listeners.push({ target, type, handler, options });
    },

    removeListeners() {
        this.listeners.forEach(({ target, type, handler, options }) => target.removeEventListener(type, handler, options));
        this.listeners = [];
    },

    playClick() {
        if (window.AudioManager) AudioManager.playSFX('assets/sounds/click.mp3');
    },

    playWrong() {
        if (window.AudioManager) AudioManager.playSFX('assets/sounds/wrong.mp3');
    },

    getResult() {
        return this.lastResult ? { ...this.lastResult, pattern: { ...this.lastResult.pattern } } : null;
    },

    close() {
        this.stop();
        showScene('level-select');
    },

    stop() {
        this.removeListeners();
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers = [];
        if (this.holdAnimationId) cancelAnimationFrame(this.holdAnimationId);
        this.holdAnimationId = null;
        if (this.container?.parentNode) this.container.remove();
        document.body.classList.remove('cake-station-active');
        this.container = null;
        this.state = null;
    }
};

window.CakeStationGame = CakeStationGame;
