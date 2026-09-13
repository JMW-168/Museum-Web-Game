const StationGame = {
    container: null,
    station: null,
    state: null,
    animationId: null,
    timers: [],
    keyHandler: null,
    fireMusic: null,
    fireMusicStarted: false,
    fireGuideShown: false,
    teaGuideShown: false,
    fullStory: false,
    fireAssetUrls: null,
    teaTimerId: null,
    teaAnimationId: null,
    gameAudioContext: null,
    lastTeaGrindSoundAt: 0,
    mode: null,
    dialogueTimer: null,
    dwellTimer: null,
    dialogueTyping: false,
    dialogueReady: false,
    dialogueTextTarget: null,
    dialogueFullText: '',

    stations: {
        fire: {
            id: 'fire',
            guideImage: 'assets/images/characters/grandma.png',
            guideAltKey: 'story.speaker.grandma'
        },
        tea: {
            id: 'tea',
            guideImage: 'assets/images/characters/grandpa.png',
            guideAltKey: 'story.speaker.grandpa'
        }
    },

    tr(key, tokens) {
        return typeof window.t === 'function' ? window.t(key, tokens) : key;
    },

    getStation(stationId) {
        const source = this.stations[stationId];
        if (!source) return null;
        const prefix = `station.${stationId}`;
        return {
            ...source,
            kicker: this.tr(`${prefix}.kicker`),
            title: this.tr(`${prefix}.title`),
            success: this.tr(`${prefix}.success`),
            fail: stationId === 'fire' ? this.tr('station.fire.fail') : '',
            guideAlt: this.tr(source.guideAltKey)
        };
    },

    localizeStoryLine(sourceLine) {
        return {
            ...sourceLine,
            speaker: sourceLine.speakerKey ? this.tr(sourceLine.speakerKey) : sourceLine.speaker,
            cue: sourceLine.cueKey ? this.tr(sourceLine.cueKey) : sourceLine.cue,
            text: sourceLine.textKey ? this.tr(sourceLine.textKey) : sourceLine.text,
            actionLabel: sourceLine.actionLabelKey ? this.tr(sourceLine.actionLabelKey) : sourceLine.actionLabel
        };
    },

    start(stationId) {
        this.stop();
        if (stationId === 'combined' || stationId === 'story') {
            this.mode = 'combined';
            this.fullStory = stationId === 'story';
            this.station = this.getStation('fire');
            showScene('game-container');
            if (typeof AudioManager !== 'undefined') AudioManager.stopBGM();
            this.createShell('fire');
            this.showCombinedDialogue('fireEntry', () => this.startCombinedFire());
            return;
        }

        this.mode = 'standalone';
        this.station = this.getStation(stationId);
        if (!this.station) return;

        showScene('game-container');
        if (typeof AudioManager !== 'undefined') AudioManager.stopBGM();
        this.createShell(stationId);
        // 單關版：進入引導對話 → 遊戲（聚光燈操作提示在遊戲啟動路徑內）。
        if (stationId === 'fire') {
            this.showCombinedDialogue('fireEntry', () => this.startCombinedFire());
        } else if (stationId === 'tea') {
            this.station = this.getStation('tea');
            this.showCombinedDialogue('teaEntry', () => this.startCombinedTea());
        }
    },

    createShell(stationId) {
        const parent = document.getElementById('game-wrapper') || document.body;
        this.container = document.createElement('div');
        this.container.className = `station-game station-game-${stationId}`;
        parent.appendChild(this.container);
    },

    setShellTheme(stationId) {
        if (!this.container) return;
        this.container.classList.remove('station-game-fire', 'station-game-tea');
        this.container.classList.add(`station-game-${stationId}`);
    },

    // opts.actionLabelKey：覆寫本段最後一句的 CTA 文字／去向（單關版用 story.action.seeResult）。
    showCombinedDialogue(sectionId, onComplete, opts = {}) {
        const section = window.StationCombinedStory?.sections?.[sectionId];
        if (!section || !this.container) {
            if (window.Logger) window.Logger.error('找不到合併版劇情段落:', sectionId);
            this.close();
            return;
        }

        this.clearCombinedTyping();
        this.setShellTheme(section.theme);
        let lineIndex = 0;

        const renderLine = () => {
            const line = this.localizeStoryLine(section.lines[lineIndex]);
            const isLastLine = lineIndex === section.lines.length - 1;
            const actionLabel = (isLastLine && opts.actionLabelKey)
                ? this.tr(opts.actionLabelKey)
                : line.actionLabel;
            const characterMarkup = line.image
                ? `<img class="combined-story-character" src="${line.image}" alt="${line.speaker}">`
                : '';
            const cueMarkup = line.cue ? `<span class="combined-dialogue-cue">（${line.cue}）</span>` : '';
            const actionMarkup = actionLabel
                ? `<button type="button" class="station-primary combined-story-action" data-story-action hidden>${actionLabel}</button>`
                : '';

            this.container.innerHTML = `
                <section class="combined-story${line.narration ? ' is-narration' : ''}">
                    <button type="button" class="station-secondary station-corner-exit" data-exit>${this.tr('story.action.leave')}</button>
                    <div class="combined-story-character-stage">${characterMarkup}</div>
                    <div class="combined-dialogue-box${actionLabel ? ' has-action' : ''}" data-dialogue-advance role="button" tabindex="0" aria-label="${this.tr('story.action.continueDialogue')}">
                        <div class="combined-dialogue-speaker">${line.speaker}${cueMarkup}</div>
                        <div class="combined-dialogue-text" aria-live="polite"></div>
                        <span class="combined-dialogue-indicator" aria-hidden="true"></span>
                        ${actionMarkup}
                    </div>
                </section>
            `;

            const dialogueBox = this.container.querySelector('[data-dialogue-advance]');
            const action = this.container.querySelector('[data-story-action]');
            const advance = () => {
                if (this.dialogueTyping) {
                    this.finishCombinedTyping();
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
            if (action) {
                action.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (!this.dialogueReady) return; // CTA 需等逐字完成且短暫停結束
                    this.playClick();
                    onComplete();
                });
            }
            this.typeCombinedLine(line, action);
        };

        renderLine();
    },

    typeCombinedLine(line, action) {
        this.clearCombinedTyping();
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
                this.finishCombinedTyping();
                return;
            }
            this.dialogueTextTarget.textContent += characters[index];
            if (index % 3 === 0 && line.voice && typeof AudioManager !== 'undefined') {
                const sound = line.voice === 'female'
                    ? 'assets/sounds/sfx-blipfemale.wav'
                    : 'assets/sounds/sfx-blipmale.wav';
                AudioManager.playSFX(sound, 0.08);
            }
            index++;
        }, window.CombinedStoryPacing?.charIntervalMs ?? 42);

        if (action) action.hidden = true;
    },

    finishCombinedTyping() {
        if (this.dialogueTimer) clearInterval(this.dialogueTimer);
        this.dialogueTimer = null;
        if (this.dialogueTextTarget) this.dialogueTextTarget.textContent = this.dialogueFullText;
        this.dialogueTyping = false;
        this.startCombinedDwell();
    },

    startCombinedDwell() {
        if (this.dwellTimer) clearTimeout(this.dwellTimer);
        this.dialogueReady = false;
        const box = this.container?.querySelector('.combined-dialogue-box');
        if (box) {
            box.classList.add('is-reading');
            box.classList.remove('is-complete');
        }
        const minReadMs = window.CombinedStoryPacing?.minReadMs ?? 1500;
        this.dwellTimer = setTimeout(() => this.endCombinedDwell(), minReadMs);
    },

    endCombinedDwell() {
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

    clearCombinedTyping() {
        if (this.dialogueTimer) clearInterval(this.dialogueTimer);
        this.dialogueTimer = null;
        if (this.dwellTimer) clearTimeout(this.dwellTimer);
        this.dwellTimer = null;
        this.dialogueTyping = false;
        this.dialogueReady = false;
        this.dialogueTextTarget = null;
        this.dialogueFullText = '';
    },

    startCombinedFire() {
        this.station = this.getStation('fire');
        this.setShellTheme('fire');
        FireStationGame.prepareFireAssets(this)
            .then(() => FireStationGame.startFireGame(this))
            .catch((error) => FireStationGame.showFireLoadError(this, error));
    },

    startCombinedTea() {
        return TeaStationGame.startCombinedTea(this);
    },

    showResult(success) {
        if (!this.state) return;
        this.state.finished = true;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        FireStationGame.stopFireMusic(this);

        const summary = this.state.stationId === 'fire' && this.station.fireSummary
            ? this.station.fireSummary
            : '';
        const message = success ? this.station.success : this.station.fail;
        this.container.innerHTML = `
            <section class="station-panel station-result-panel has-guide">
                <div class="station-kicker-line">${this.station.kicker}</div>
                <h1>${this.tr(success ? 'station.fire.result.success' : 'station.fire.result.retry')}</h1>
                <p class="station-subtitle fire-result-score">${summary}</p>
                <p class="station-copy fire-result-quote">「${message}」</p>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry>${this.tr('game.retry')}</button>
                    <button type="button" class="station-secondary" data-back>${this.tr('station.fire.result.findGrandma')}</button>
                </div>
                <img class="station-guide station-guide-result" src="${this.station.guideImage}" alt="${this.station.guideAlt}">
            </section>
        `;

        this.container.querySelector('[data-retry]').addEventListener('click', () => {
            if (this.state.stationId === 'fire') FireStationGame.startFireGame(this);
            if (this.state.stationId === 'tea') TeaStationGame.startTeaGame(this);
        });
        this.container.querySelector('[data-back]').addEventListener('click', () => {
            if (this.mode === 'combined') {
                this.showCombinedDialogue('fireExit', () => {
                    this.station = this.getStation('tea');
                    this.showCombinedDialogue('teaEntry', () => this.startCombinedTea());
                });
            } else {
                this.showCombinedDialogue('fireExit', () => this.close(), { actionLabelKey: 'story.action.returnLobby' });
            }
        });
    },

    close() {
        this.stop();
        showScene('level-select');
    },

    showCombinedEnding() {
        const continueToSecondHalf = this.fullStory;
        this.stop();
        if (continueToSecondHalf && window.Station34CombinedGame) {
            // 「完整劇情體驗」：上半場（灶台＋擂茶）結束後直接接三四關，不再顯示中場過場。
            Station34CombinedGame.start();
            return;
        }
        if (window.EndingScreen) EndingScreen.show(() => showScene('level-select'));
        else showScene('level-select');
    },

    stop() {
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers = [];
        this.clearCombinedTyping();
        TeaStationGame.clearTeaTimer(this);
        TeaStationGame.stopTeaTrack(this);
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
        FireStationGame.stopFireMusic(this);
        FireStationGame.releaseFireAssets(this);
        if (typeof StationIntroGuide !== 'undefined') StationIntroGuide.stop();
        this.fireGuideShown = false;
        this.teaGuideShown = false;
        if (this.gameAudioContext) {
            this.gameAudioContext.close().catch(() => {});
            this.gameAudioContext = null;
        }
        if (this.container && this.container.parentNode) this.container.remove();
        this.container = null;
        this.state = null;
        this.mode = null;
        this.fullStory = false;
    },

    playClick() {
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('assets/sounds/click.mp3');
    },

    playWrong() {
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('assets/sounds/wrong.mp3');
    },

    // 灶台補柴音效與擂茶研磨／切料音效共用同一個 AudioContext。
    getGameAudioContext() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        if (!this.gameAudioContext || this.gameAudioContext.state === 'closed') {
            this.gameAudioContext = new AudioContextClass();
        }
        if (this.gameAudioContext.state === 'suspended') {
            this.gameAudioContext.resume().catch(() => {});
        }
        return this.gameAudioContext;
    },

    createGameNoiseSource(context, duration) {
        const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
        const buffer = context.createBuffer(1, frameCount, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let index = 0; index < frameCount; index++) {
            data[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
        }
        const source = context.createBufferSource();
        source.buffer = buffer;
        return source;
    }
};

function startStationGame(stationId) {
    if (stationId === 'combined34' && window.Station34CombinedGame) {
        Station34CombinedGame.start();
        return;
    }
    if (stationId === 'story') {
        if (window.Station34CombinedGame) Station34CombinedGame.stop();
        if (window.CradleStationGame) CradleStationGame.stop();
        if (window.CakeStationGame) CakeStationGame.stop();
        StationGame.start('story');
        return;
    }
    if (window.Station34CombinedGame) Station34CombinedGame.stop();
    // 搖籃／粄印單關版與三四關合併版共用 Station34CombinedGame 這個 orchestrator。
    if ((stationId === 'cradle' || stationId === 'cake') && window.Station34CombinedGame) {
        Station34CombinedGame.start({ only: stationId });
        return;
    }
    if (window.CradleStationGame) CradleStationGame.stop();
    if (window.CakeStationGame) CakeStationGame.stop();
    StationGame.start(stationId);
}

window.StationGame = StationGame;
window.startStationGame = startStationGame;
