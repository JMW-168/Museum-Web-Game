const Station34CombinedGame = {
    container: null,
    dialogueTimer: null,
    dialogueTyping: false,
    dialogueTextTarget: null,
    dialogueFullText: '',
    active: false,

    start() {
        this.stop();
        if (window.StationDemoGame) StationDemoGame.stop();
        this.active = true;
        showScene('game-container');
        this.createShell('cradle');
        this.showDialogue('opening', () => this.startCradle());
    },

    createShell(theme) {
        this.removeShell();
        const parent = document.getElementById('game-wrapper') || document.body;
        this.container = document.createElement('div');
        this.container.className = `station-demo station-demo-${theme}`;
        parent.appendChild(this.container);
    },

    showDialogue(sectionId, onComplete, tokens = {}) {
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
            const line = { ...sourceLine, text: this.interpolate(sourceLine.text, tokens) };
            const character = line.image ? `<img class="combined-story-character" src="${line.image}" alt="${line.speaker}">` : '';
            const cue = line.cue ? `<span class="combined-dialogue-cue">（${line.cue}）</span>` : '';
            const action = line.actionLabel
                ? `<button type="button" class="station-primary combined-story-action" data-story-action hidden>${line.actionLabel}</button>`
                : '';
            this.container.innerHTML = `
                <section class="combined-story${line.narration ? ' is-narration' : ''}">
                    <button type="button" class="station-secondary station-corner-exit" data-exit>離開</button>
                    <div class="combined-story-character-stage">${character}</div>
                    <div class="combined-dialogue-box${line.actionLabel ? ' has-action' : ''}" data-dialogue-advance role="button" tabindex="0" aria-label="繼續對話">
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
                if (line.actionLabel) return;
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
        }, 42);
        if (actionButton) actionButton.hidden = true;
    },

    finishTyping() {
        if (this.dialogueTimer) clearInterval(this.dialogueTimer);
        this.dialogueTimer = null;
        if (this.dialogueTextTarget) this.dialogueTextTarget.textContent = this.dialogueFullText;
        this.dialogueTyping = false;
        const box = this.container?.querySelector('.combined-dialogue-box');
        const action = this.container?.querySelector('[data-story-action]');
        if (box) box.classList.add('is-complete');
        if (action) action.hidden = false;
    },

    clearTyping() {
        if (this.dialogueTimer) clearInterval(this.dialogueTimer);
        this.dialogueTimer = null;
        this.dialogueTyping = false;
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

    afterCradle() {
        CradleStationGame.stop();
        if (!this.active) return;
        this.createShell('cradle');
        this.showDialogue('afterCradle', () => this.startCake());
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
        this.showDialogue('ending', () => this.showCard(result.pattern), {
            patternName: result.pattern.name,
            meaning: result.pattern.meaning,
            blessing: result.pattern.blessing
        });
    },

    showCard(pattern) {
        this.removeShell();
        if (!this.active) return;
        CakeStationGame.showCompletedResult(pattern, { onExit: () => this.close() });
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
        this.removeShell();
        if (window.CradleStationGame) CradleStationGame.stop();
        if (window.CakeStationGame) CakeStationGame.stop();
    }
};

window.Station34CombinedGame = Station34CombinedGame;
