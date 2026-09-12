const Station34CombinedGame = {
    container: null,
    dialogueTimer: null,
    dwellTimer: null,
    dialogueTyping: false,
    dialogueReady: false,
    dialogueTextTarget: null,
    dialogueFullText: '',
    active: false,
    only: null, // null = 完整三四關；'cradle' / 'cake' = 單關版

    tr(key, tokens) {
        return typeof window.t === 'function' ? window.t(key, tokens) : key;
    },

    localizeLine(sourceLine, tokens) {
        return {
            ...sourceLine,
            speaker: sourceLine.speakerKey ? this.tr(sourceLine.speakerKey) : sourceLine.speaker,
            cue: sourceLine.cueKey ? this.tr(sourceLine.cueKey) : sourceLine.cue,
            text: sourceLine.textKey ? this.tr(sourceLine.textKey, tokens) : this.interpolate(sourceLine.text, tokens),
            actionLabel: sourceLine.actionLabelKey ? this.tr(sourceLine.actionLabelKey) : sourceLine.actionLabel
        };
    },

    start(options = {}) {
        this.stop();
        if (window.StationDemoGame) StationDemoGame.stop();
        this.only = options.only || null;
        this.active = true;
        showScene('game-container');
        if (this.only === 'cake') {
            this.createShell('cake');
            this.showDialogue('cakeEntry', () => this.startCake());
        } else {
            this.createShell('cradle');
            this.showDialogue('cradleEntry', () => this.startCradle());
        }
    },

    createShell(theme) {
        this.removeShell();
        const parent = document.getElementById('game-wrapper') || document.body;
        this.container = document.createElement('div');
        this.container.className = `station-demo station-demo-${theme}`;
        parent.appendChild(this.container);
    },

    // opts.actionLabelKey：覆寫本段最後一句的 CTA 文字／去向（單關版用 story.action.seeResult）。
    showDialogue(sectionId, onComplete, tokens = {}, opts = {}) {
        const section = window.Station34CombinedStory?.sections?.[sectionId];
        if (!section || !this.container) {
            if (window.Logger) Logger.error('找不到三四關合併劇情段落:', sectionId);
            this.close();
            return;
        }
        this.clearTyping();
        this.container.className = `station-demo station-demo-${section.theme}`;
        let lineIndex = 0;

        const renderLine = () => {
            const sourceLine = section.lines[lineIndex];
            const line = this.localizeLine(sourceLine, tokens);
            const isLastLine = lineIndex === section.lines.length - 1;
            const actionLabel = (isLastLine && opts.actionLabelKey) ? this.tr(opts.actionLabelKey) : line.actionLabel;
            const character = line.image ? `<img class="combined-story-character" src="${line.image}" alt="${line.speaker}">` : '';
            const cue = line.cue ? `<span class="combined-dialogue-cue">（${line.cue}）</span>` : '';
            const action = actionLabel
                ? `<button type="button" class="station-primary combined-story-action" data-story-action hidden>${actionLabel}</button>`
                : '';
            this.container.innerHTML = `
                <section class="combined-story${line.narration ? ' is-narration' : ''}">
                    <button type="button" class="station-secondary station-corner-exit" data-exit>${this.tr('story.action.leave')}</button>
                    <div class="combined-story-character-stage">${character}</div>
                    <div class="combined-dialogue-box${actionLabel ? ' has-action' : ''}" data-dialogue-advance role="button" tabindex="0" aria-label="${this.tr('story.action.continueDialogue')}">
                        <div class="combined-dialogue-speaker">${line.speaker}${cue}</div>
                        <div class="combined-dialogue-text" aria-live="polite"></div>
                        <span class="combined-dialogue-indicator" aria-hidden="true"></span>
                        ${action}
                    </div>
                </section>`;

            const dialogueBox = this.container.querySelector('[data-dialogue-advance]');
            const actionButton = this.container.querySelector('[data-story-action]');
            const advance = () => {
                if (this.dialogueTyping) {
                    this.finishTyping();
                    return;
                }
                if (!this.dialogueReady) return; // 逐字完成後的防連點短暫停內，忽略前進輸入
                if (actionLabel) return;
                if (lineIndex < section.lines.length - 1) {
                    lineIndex++;
                    renderLine();
                    return;
                }
                onComplete();
            };
            dialogueBox.addEventListener('click', advance);
            dialogueBox.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                advance();
            });
            this.container.querySelector('[data-exit]').addEventListener('click', () => this.close());
            if (actionButton) actionButton.addEventListener('click', (event) => {
                event.stopPropagation();
                if (!this.dialogueReady) return; // CTA 需等逐字完成且短暫停結束
                this.playClick();
                onComplete();
            });
            this.typeLine(line, actionButton);
        };
        renderLine();
    },

    typeLine(line, actionButton) {
        this.clearTyping();
        const target = this.container?.querySelector('.combined-dialogue-text');
        if (!target) return;
        const characters = Array.from(line.text || '');
        let index = 0;
        this.dialogueTyping = true;
        this.dialogueTextTarget = target;
        this.dialogueFullText = line.text || '';
        target.textContent = '';
        this.dialogueTimer = setInterval(() => {
            if (!this.dialogueTextTarget) return;
            if (index >= characters.length) {
                this.finishTyping();
                return;
            }
            this.dialogueTextTarget.textContent += characters[index];
            if (index % 3 === 0 && line.voice && window.AudioManager) {
                AudioManager.playSFX(line.voice === 'female' ? 'assets/sounds/sfx-blipfemale.wav' : 'assets/sounds/sfx-blipmale.wav', 0.08);
            }
            index++;
        }, window.CombinedStoryPacing?.charIntervalMs ?? 42);
        if (actionButton) actionButton.hidden = true;
    },

    finishTyping() {
        if (this.dialogueTimer) clearInterval(this.dialogueTimer);
        this.dialogueTimer = null;
        if (this.dialogueTextTarget) this.dialogueTextTarget.textContent = this.dialogueFullText;
        this.dialogueTyping = false;
        this.startDwell();
    },

    startDwell() {
        if (this.dwellTimer) clearTimeout(this.dwellTimer);
        this.dialogueReady = false;
        const box = this.container?.querySelector('.combined-dialogue-box');
        if (box) {
            box.classList.add('is-reading');
            box.classList.remove('is-complete');
        }
        const minReadMs = window.CombinedStoryPacing?.minReadMs ?? 1500;
        this.dwellTimer = setTimeout(() => this.endDwell(), minReadMs);
    },

    endDwell() {
        if (this.dwellTimer) clearTimeout(this.dwellTimer);
        this.dwellTimer = null;
        this.dialogueReady = true;
        const box = this.container?.querySelector('.combined-dialogue-box');
        const action = this.container?.querySelector('[data-story-action]');
        if (box) {
            box.classList.remove('is-reading');
            box.classList.add('is-complete');
        }
        if (action) action.hidden = false;
    },

    clearTyping() {
        if (this.dialogueTimer) clearInterval(this.dialogueTimer);
        this.dialogueTimer = null;
        if (this.dwellTimer) clearTimeout(this.dwellTimer);
        this.dwellTimer = null;
        this.dialogueTyping = false;
        this.dialogueReady = false;
        this.dialogueTextTarget = null;
        this.dialogueFullText = '';
    },

    startCradle() {
        this.removeShell();
        CradleStationGame.start({
            mode: 'combined34',
            onComplete: (result) => this.afterCradle(result),
            onExit: () => this.close()
        });
    },

    afterCradle(result) {
        CradleStationGame.stop();
        if (!this.active) return;
        this.createShell('cradle');
        if (this.only === 'cradle') {
            this.showCradleResult(result);
        } else {
            this.showDialogue('cradleExit', () => this.showDialogue('cakeEntry', () => this.startCake()));
        }
    },

    // 搖籃單關版：先看成果頁，再由「去找阿嬤」進入離開引導對話。
    showCradleResult(result) {
        if (!this.container) return;
        const assisted = !!(result && result.assisted);
        this.container.className = 'station-demo station-demo-cradle';
        this.container.innerHTML = `
            <section class="station-panel station-result-panel cradle-result-panel has-guide">
                <div class="cradle-result-head">
                    <div class="station-kicker-line">${this.tr('station.cradle.kicker')}</div>
                    <h1>${this.tr('station.cradle.result.title')}</h1>
                </div>
                <div class="cradle-result-body">
                    <img class="cradle-result-baby" src="assets/images/station-cradle/cradle-result.png" alt="${this.tr('station.cradle.result.art')}">
                    <div class="cradle-result-copy">
                        <p class="station-copy">${this.tr('station.cradle.result.copy')}</p>
                        ${assisted ? `<p class="cradle-assisted-note">${this.tr('station.cradle.result.assisted')}</p>` : `<p class="cradle-perfect-note">${this.tr('station.cradle.result.perfect')}</p>`}
                    </div>
                </div>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry>${this.tr('game.retry')}</button>
                    <button type="button" class="station-secondary" data-back>${this.tr('station.cradle.result.findGrandma')}</button>
                </div>
                <img class="station-guide station-guide-result" src="assets/images/characters/grandma.png" alt="${this.tr('story.speaker.grandma')}">
            </section>
        `;
        this.container.querySelector('[data-retry]').addEventListener('click', () => {
            this.playClick();
            this.startCradle(); // 重玩只回遊戲，不重播對話
        });
        this.container.querySelector('[data-back]').addEventListener('click', () => {
            this.showDialogue('cradleExit', () => this.close(), {}, { actionLabelKey: 'story.action.returnLobby' });
        });
    },

    startCake() {
        this.removeShell();
        CakeStationGame.start({
            mode: 'combined34',
            onComplete: (result) => this.afterCake(result),
            onExit: () => this.close()
        });
    },

    afterCake(result) {
        CakeStationGame.stop();
        if (!this.active || !result?.pattern) return;
        this.createShell('cake');
        const tokens = {
            patternName: result.pattern.name,
            meaning: result.pattern.meaning,
            blessing: result.pattern.blessing
        };
        const opts = this.only === 'cake' ? { actionLabelKey: 'story.action.seeResult' } : {};
        this.showDialogue('cakeExit', () => this.showCard(result.pattern), tokens, opts);
    },

    showCard(pattern) {
        this.removeShell();
        if (!this.active) return;
        CakeStationGame.showCompletedResult(pattern, { onExit: () => this.showEnding() });
    },

    showEnding() {
        const wasActive = this.active;
        const wasOnly = this.only;
        this.stop();
        // 單關版看完祝福卡直接回入口，不進「通關致謝」。
        if (!wasActive || wasOnly) {
            showScene('level-select');
            return;
        }
        if (window.EndingScreen) EndingScreen.show(() => showScene('level-select'));
        else showScene('level-select');
    },

    interpolate(text, tokens) {
        return String(text || '').replace(/\{\{(\w+)\}\}/g, (match, key) => tokens[key] ?? match);
    },

    playClick() {
        if (window.AudioManager) AudioManager.playSFX('assets/sounds/click.mp3');
    },

    removeShell() {
        this.clearTyping();
        if (this.container?.parentNode) this.container.remove();
        this.container = null;
    },

    close() {
        this.stop();
        showScene('level-select');
    },

    stop() {
        this.active = false;
        this.only = null;
        this.removeShell();
        if (window.CradleStationGame) CradleStationGame.stop();
        if (window.CakeStationGame) CakeStationGame.stop();
    }
};

window.Station34CombinedGame = Station34CombinedGame;
