const StationDemoGame = {
    container: null,
    station: null,
    state: null,
    animationId: null,
    timers: [],
    keyHandler: null,
    fireMusic: null,
    fireMusicSrc: 'assets/sounds/station-fire-theme.mp3',
    fireMusicStarted: false,
    fireGuideShown: false,
    teaGuideShown: false,
    fullStory: false,
    fireDurationMs: 60000,
    fireAssetUrls: null,
    teaTimerId: null,
    teaAnimationId: null,
    teaAudioContext: null,
    lastTeaGrindSoundAt: 0,
    mode: null,
    dialogueTimer: null,
    dwellTimer: null,
    dialogueTyping: false,
    dialogueReady: false,
    dialogueTextTarget: null,
    dialogueFullText: '',
    teaStageDurationMs: 60000,
    teaSpawnIntervalMs: 975,
    teaTravelMs: 1950,
    teaImageUrls: [
        'assets/images/station-tea/ingredient-sprites.png',
        'assets/images/station-tea/tool-sprites.png',
        'assets/images/station-tea/grind-tool-sprites.png',
        'assets/images/station-tea/chop-tool-sprites-v2.png',
        'assets/images/station-fire/wood-small.png',
        'assets/images/station-fire/wood-large.png',
        'assets/images/station-tea/stone.png'
    ],
    fireImageUrls: [
        'assets/images/station-fire/background.webp',
        'assets/images/characters/grandma.png',
        'assets/images/station-fire/stove.png',
        'assets/images/station-fire/fire-small.png',
        'assets/images/station-fire/fire-large.png',
        'assets/images/station-fire/wood-small.png',
        'assets/images/station-fire/wood-large.png'
    ],
    // 由甲方影片音軌的 onset 分析產生；前 12 秒取主拍，之後加入半拍增加密度。
    fireBeatTimes: [
        2.694, 4.226, 5.747, 7.291, 8.824, 10.344, 11.889,
        12.655, 13.421, 14.176, 14.942, 15.720, 16.498, 17.264,
        18.030, 18.820, 19.563, 20.341, 21.107, 21.862, 22.605,
        23.382, 24.149, 24.903, 25.704, 26.471, 27.225, 27.980,
        28.688, 29.524, 30.232, 31.057, 31.811, 32.578, 33.355,
        34.122, 34.900, 35.608, 36.339, 37.152, 37.941, 38.708,
        39.404, 40.240, 40.995, 41.761, 42.516, 43.294, 44.060,
        44.838, 45.616, 46.370, 47.148, 47.914, 48.692, 49.435,
        50.190, 50.968, 51.722, 52.489, 53.255, 54.021, 54.787,
        55.554, 56.308, 57.086, 57.841, 58.619, 59.385
    ],

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
        this.container.className = `station-demo station-demo-${stationId}`;
        parent.appendChild(this.container);
    },

    setShellTheme(stationId) {
        if (!this.container) return;
        this.container.classList.remove('station-demo-fire', 'station-demo-tea');
        this.container.classList.add(`station-demo-${stationId}`);
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
        this.prepareFireAssets()
            .then(() => this.startFireGame())
            .catch((error) => this.showFireLoadError(error));
    },

    finishCombinedFire() {
        if (!this.state) return;
        this.state.finished = true;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.stopFireMusic();
        this.releaseFireAssets();
        this.showCombinedDialogue('fireExit', () => {
            this.station = this.getStation('tea');
            this.showCombinedDialogue('teaEntry', () => this.startCombinedTea());
        });
    },

    startCombinedTea() {
        this.station = this.getStation('tea');
        this.setShellTheme('tea');
        this.prepareTeaAssets()
            .then(() => this.startTeaGame())
            .catch((error) => this.showTeaLoadError(error));
    },

    showCoachMessage(coachingId) {
        if (this.mode !== 'combined' || !this.container) return;
        const coaching = window.StationCombinedStory?.coaching?.[coachingId];
        const play = this.container.querySelector('.station-play');
        if (!coaching || !play) return;
        const oldMessage = play.querySelector('.station-coach-line');
        if (oldMessage) oldMessage.remove();
        const message = document.createElement('div');
        message.className = 'station-coach-line';
        const speaker = document.createElement('strong');
        speaker.textContent = `${this.tr(coaching.speakerKey)}：`;
        message.append(speaker, document.createTextNode(this.tr(coaching.textKey)));
        play.appendChild(message);
        this.timers.push(setTimeout(() => message.remove(), 6200));
    },

    startFireGame() {
        this.state = {
            stationId: 'fire',
            score: 0,
            combo: 0,
            fire: 50,
            judged: 0,
            beats: [],
            startedAt: 0,
            nextBeatIndex: 0,
            nextSpawnAt: 0,
            totalBeats: this.fireBeatTimes.length,
            idealMin: 45,
            idealMax: 72,
            safeMin: 30,
            safeMax: 88,
            unstableMs: 0,
            maxMistakes: 5,
            mistakesRemaining: 5,
            durationMs: this.fireDurationMs,
            lastTickAt: 0,
            finished: false,
            lastResult: this.tr('station.fire.wait'),
        };

        const stoveImage = this.getFireAsset('assets/images/station-fire/stove.png');
        const smallFlameImage = this.getFireAsset('assets/images/station-fire/fire-small.png');

        this.container.innerHTML = `
            <div class="station-play is-preparing">
                <div class="station-hud">
                    <div>${this.station.kicker}</div>
                    <div>${this.tr('station.fire.hud.score')} <span data-score>0</span></div>
                    <div>${this.tr('station.fire.hud.heat')} <span data-fire>50</span>%</div>
                    <div>${this.tr('station.fire.hud.time')} <span data-time>60</span> ${this.tr('station.fire.hud.seconds')}</div>
                </div>
                <button type="button" class="station-corner-exit" data-exit aria-label="${this.tr('game.backToEntrance')}">${this.tr('game.back')}</button>
                <div class="fire-help-row">
                    <span>${this.tr('station.fire.help.wood')}</span>
                    <span data-water-hint>${this.tr('station.fire.help.water')}</span>
                </div>
                <div class="fire-track" aria-label="${this.tr('station.fire.track')}">
                    <div class="fire-danger-alert" data-fire-danger>${this.tr('station.fire.danger')}</div>
                    <div class="fire-target">
                        <img class="fire-stove-img" src="${stoveImage}" alt="${this.tr('station.fire.stove')}">
                        <img class="fire-flame-img" data-flame src="${smallFlameImage}" alt="${this.tr('station.fire.flame')}">
                        <div class="fire-water-burst" data-water-effect aria-hidden="true">
                            <span></span><span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
                <div class="fire-meter">
                    <div class="fire-ideal-zone"></div>
                    <span></span>
                </div>
                <div class="station-feedback">${this.tr('station.fire.wait')}</div>
                <div class="fire-score-layer" data-score-layer aria-hidden="true"></div>
                <div class="station-actions compact">
                    <button type="button" class="station-primary" data-hit>${this.tr('station.fire.addWood')}</button>
                </div>
                <button type="button" class="station-water station-water-fixed" data-water>${this.tr('station.fire.sprayWater')}</button>
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

        this.renderFireHud();
        this.waitForFireGameReady()
            .then(() => this.showFireGuide())
            .catch((error) => this.showFireLoadError(error));
    },

    showFireGuide() {
        if (!this.state || this.state.finished || this.state.stationId !== 'fire') return;
        const play = this.container?.querySelector('.station-play');
        // 在使用者手勢內起 BGM（startFireMusic 會吞掉被瀏覽器阻擋的例外）。
        const begin = () => {
            this.startFireMusic();
            this.beginFireLoop();
        };
        if (this.fireGuideShown || !play || typeof StationIntroGuide === 'undefined') {
            begin();
            return;
        }

        // 素材已就緒，先讓真實 HUD 顯示在遮罩下，但不啟動節奏迴圈與音樂。
        if (typeof LoadingManager !== 'undefined') LoadingManager.finish();
        play.classList.remove('is-preparing');
        this.fireGuideShown = true;

        StationIntroGuide.start({
            host: play,
            steps: [
                { selector: '[data-hit]', textKey: 'station.fire.guide.wood' },
                { selector: '[data-water]', textKey: 'station.fire.guide.water' }
            ],
            onFinish: begin
        });
    },

    beginFireLoop() {
        if (!this.state || this.state.finished || this.state.stationId !== 'fire') return;
        const play = this.container.querySelector('.station-play');
        if (play) play.classList.remove('is-preparing');
        if (typeof LoadingManager !== 'undefined') LoadingManager.finish();

        this.syncFireMusicToGameStart()
            .then(() => {
                this.animationId = requestAnimationFrame((time) => {
                    if (!this.state || this.state.finished) return;
                    this.state.startedAt = time;
                    this.state.lastTickAt = time;
                    this.renderFireHud();
                    if (this.mode === 'combined' && !this.state.coachShown) {
                        this.state.coachShown = true;
                        this.timers.push(setTimeout(() => this.showCoachMessage('fire'), 2600));
                    }
                    this.animationId = requestAnimationFrame((nextTime) => this.tickFire(nextTime));
                });
            })
            .catch((error) => this.showFireLoadError(error));
    },

    waitForFireGameReady() {
        if (typeof LoadingManager !== 'undefined') {
            LoadingManager.loadingScreen.style.display = 'flex';
            LoadingManager.updateProgress(100);
        }

        const domImages = Array.from(this.container.querySelectorAll('.fire-stove-img, .fire-flame-img'));
        const domReady = domImages.map((img) => this.waitForImageElement(img));

        return Promise.all(domReady).then(() => new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        }));
    },

    waitForImageElement(img) {
        return new Promise((resolve, reject) => {
            let done = false;
            const finish = (error) => {
                if (done) return;
                done = true;
                clearTimeout(timeoutId);
                img.onload = null;
                img.onerror = null;
                if (error) reject(error);
                else resolve();
            };
            const verify = () => {
                if (!img.complete || img.naturalWidth <= 0) {
                    finish(new Error(`圖片無法顯示：${img.alt || img.src}`));
                    return;
                }
                if (typeof img.decode === 'function') {
                    img.decode().then(() => finish()).catch(() => finish(new Error(`圖片解碼失敗：${img.alt || img.src}`)));
                } else {
                    finish();
                }
            };
            const timeoutId = setTimeout(() => finish(new Error(`圖片顯示逾時：${img.alt || img.src}`)), 12000);
            if (img.complete && img.naturalWidth > 0) {
                verify();
                return;
            }
            img.onload = verify;
            img.onerror = () => finish(new Error(`圖片載入失敗：${img.alt || img.src}`));
        });
    },

    prepareFireAssets() {
        if (this.fireAssetUrls && this.fireImageUrls.every((src) => this.fireAssetUrls.has(src))) {
            return Promise.resolve();
        }

        if (typeof LoadingManager !== 'undefined' && LoadingManager.loadingScreen) {
            LoadingManager.loadingScreen.style.display = 'flex';
            LoadingManager.updateProgress(0);
        }

        this.releaseFireAssets();
        const loadedAssets = new Map();
        let loadedCount = 0;
        return Promise.all(this.fireImageUrls.map((src) => this.fetchDecodedFireImage(src).then((objectUrl) => {
            loadedAssets.set(src, objectUrl);
            loadedCount++;
            if (typeof LoadingManager !== 'undefined') {
                LoadingManager.updateProgress(Math.round((loadedCount / this.fireImageUrls.length) * 100));
            }
        }))).then(() => {
            this.fireAssetUrls = loadedAssets;
        }).catch((error) => {
            loadedAssets.forEach((url) => URL.revokeObjectURL(url));
            throw error;
        });
    },

    fetchDecodedFireImage(src, attempt = 0) {
        return fetch(src, { cache: attempt === 0 ? 'force-cache' : 'reload' })
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${src}`);
                return response.blob();
            })
            .then((blob) => {
                if (!blob.type.startsWith('image/') || blob.size === 0) {
                    throw new Error(`圖片資料無效：${src}`);
                }
                return this.decodeFireBlob(blob, src);
            })
            .catch((error) => {
                if (attempt < 1) return this.fetchDecodedFireImage(src, attempt + 1);
                throw error;
            });
    },

    decodeFireBlob(blob, src) {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(blob);
            const img = new Image();
            let done = false;
            const finish = (error) => {
                if (done) return;
                done = true;
                clearTimeout(timeoutId);
                img.onload = null;
                img.onerror = null;
                if (error) {
                    URL.revokeObjectURL(objectUrl);
                    reject(error);
                    return;
                }
                resolve(objectUrl);
            };
            const verify = () => {
                if (img.naturalWidth <= 0) {
                    finish(new Error(`圖片解碼後沒有尺寸：${src}`));
                    return;
                }
                if (typeof img.decode === 'function') {
                    img.decode().then(() => finish()).catch(() => finish(new Error(`圖片解碼失敗：${src}`)));
                } else {
                    finish();
                }
            };
            const timeoutId = setTimeout(() => finish(new Error(`圖片解碼逾時：${src}`)), 12000);
            img.onload = verify;
            img.onerror = () => finish(new Error(`圖片載入失敗：${src}`));
            img.src = objectUrl;
        });
    },

    getFireAsset(src) {
        return this.fireAssetUrls && this.fireAssetUrls.get(src) || src;
    },

    releaseFireAssets() {
        if (!this.fireAssetUrls) return;
        this.fireAssetUrls.forEach((url) => URL.revokeObjectURL(url));
        this.fireAssetUrls = null;
    },

    showFireLoadError(error) {
        if (window.Logger) window.Logger.error('關卡一圖片準備失敗:', error);
        if (typeof LoadingManager !== 'undefined') LoadingManager.finish();
        if (!this.container) return;
        this.container.innerHTML = `
            <section class="station-panel station-intro-panel">
                <div class="station-kicker-line">${this.station.kicker}</div>
                <h1>${this.tr('station.fire.load.title')}</h1>
                <p class="station-copy">${this.tr('station.fire.load.copy')}</p>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry-load>${this.tr('game.retryLoad')}</button>
                    <button type="button" class="station-secondary" data-back>${this.tr('game.backToEntrance')}</button>
                </div>
            </section>
        `;
        this.container.querySelector('[data-retry-load]').addEventListener('click', () => {
            this.prepareFireAssets()
                .then(() => this.startFireGame())
                .catch((retryError) => this.showFireLoadError(retryError));
        });
        this.container.querySelector('[data-back]').addEventListener('click', () => this.close());
    },

    tickFire(time) {
        if (!this.state || this.state.finished) return;

        const elapsed = this.getFireElapsedMs(time);
        const delta = Math.min(80, time - this.state.lastTickAt);
        this.state.lastTickAt = time;

        while (
            this.state.nextBeatIndex < this.state.totalBeats &&
            elapsed >= this.getFireSpawnAt(this.state.nextBeatIndex)
        ) {
            this.spawnFireBeat(time);
            this.state.nextBeatIndex++;
        }

        const track = this.container.querySelector('.fire-track');
        const trackWidth = track ? track.clientWidth : 1;
        const targetX = this.getFireTargetX(trackWidth);
        const stillActive = [];

        this.state.beats.forEach((beat) => {
            const progress = (elapsed - beat.spawnedAtMs) / beat.travelMs;
            const startX = trackWidth + beat.el.offsetWidth;
            const x = startX + (progress * (targetX - startX));
            beat.el.style.left = `${x}px`;

            if (!beat.hit && x < targetX - 100) {
                beat.hit = true;
                this.applyFireScore(this.tr('station.fire.missed'), -8, -10, true, true);
                beat.el.remove();
                return;
            }

            if (progress <= 1.12 && !beat.hit) stillActive.push(beat);
            else beat.el.remove();
        });

        this.state.beats = stillActive;
        this.updateFireStability(delta);
        this.renderFireHud();

        if (elapsed >= this.state.durationMs) {
            this.showFireResult();
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
            ? this.getFireAsset('assets/images/station-fire/wood-large.png')
            : this.getFireAsset('assets/images/station-fire/wood-small.png');
        beat.innerHTML = `
            <img src="${woodImage}" alt="${this.tr(type === 'big' ? 'station.fire.wood.big' : 'station.fire.wood.small')}">
            <span>${this.tr(type === 'big' ? 'station.fire.wood.big' : 'station.fire.wood.small')}</span>
        `;
        track.appendChild(beat);
        this.state.beats.push({
            el: beat,
            type,
            spawnedAtMs: this.getFireSpawnAt(this.state.nextBeatIndex),
            targetAtMs: this.fireBeatTimes[this.state.nextBeatIndex] * 1000,
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
            this.applyFireScore(this.tr('station.fire.tooEarly'), -8, -3, false, true);
            return;
        }

        if (bestDistance > 120) {
            best.hit = true;
            best.el.remove();
            this.applyFireScore(this.tr('station.fire.misaligned'), -12, -8, true, true);
            return;
        }

        best.hit = true;
        best.el.remove();
        const woodLabel = this.tr(best.type === 'big' ? 'station.fire.wood.big' : 'station.fire.wood.small');
        const fireDelta = best.type === 'big' ? 13 : 7;
        const basePoints = bestDistance <= 38 ? 55 : 35;
        const timingLabel = this.tr(bestDistance <= 38 ? 'station.fire.timing.perfect' : 'station.fire.timing.hit');

        if (this.state.fire > this.state.idealMax) {
            this.applyFireScore(this.tr('station.fire.tooHot', { wood: woodLabel }), -25, fireDelta, true, true);
        } else if (this.isFireInIdealRange()) {
            this.applyFireScore(this.tr('station.fire.heat.right', { timing: timingLabel, wood: woodLabel }), basePoints + 45, fireDelta);
        } else if (this.state.fire < this.state.idealMin) {
            this.applyFireScore(this.tr('station.fire.heat.recover', { timing: timingLabel, wood: woodLabel }), basePoints + 15, fireDelta);
        } else {
            this.applyFireScore(this.tr('station.fire.heat.neutral', { timing: timingLabel, wood: woodLabel }), basePoints, fireDelta);
        }
    },

    applyFireScore(label, points, fireDelta, countJudgement = true, countMistake = false) {
        if (!this.state || this.state.finished) return;
        if (countJudgement) this.state.judged++;
        if (countMistake) this.state.mistakesRemaining = Math.max(0, this.state.mistakesRemaining - 1);
        this.state.score = Math.max(0, this.state.score + points);
        this.state.fire = Math.max(0, Math.min(100, this.state.fire + fireDelta));
        const feedback = countMistake ? this.tr('station.fire.penalty', { label }) : label;
        this.state.lastResult = feedback;
        this.container.querySelector('.station-feedback').textContent = feedback;
        this.showFireScorePop(points);
        this.playFireWoodSound(points >= 0);
        this.renderFireHud();
    },

    sprayWater() {
        if (!this.state || this.state.finished || this.state.stationId !== 'fire') return;
        const wasTooHot = this.state.fire > this.state.idealMax;
        const wasSafe = this.isFireInSafeRange();
        this.state.fire = Math.max(0, this.state.fire - 7);
        const points = wasTooHot ? (wasSafe ? 12 : 20) : -8;
        this.state.score = Math.max(0, this.state.score + points);
        const waterEffect = this.container.querySelector('[data-water-effect]');
        if (waterEffect) {
            waterEffect.classList.remove('active');
            void waterEffect.offsetWidth;
            waterEffect.classList.add('active');
        }
        this.container.querySelector('.station-feedback').textContent = this.state.fire > this.state.idealMax
            ? this.tr('station.fire.water.more')
            : wasTooHot ? this.tr('station.fire.water.recovered') : this.tr('station.fire.water.notNeeded');
        this.showFireScorePop(points);
        this.renderFireHud();
    },

    getFireProgress(index) {
        if (!this.state || this.state.totalBeats <= 1) return 0;
        return Math.max(0, Math.min(1, index / (this.state.totalBeats - 1)));
    },

    getFireTravelMs(index) {
        return index < 4 ? 2100 : 1950;
    },

    getFireSpawnAt(index) {
        return Math.max(0, (this.fireBeatTimes[index] * 1000) - this.getFireTravelMs(index));
    },

    getFireElapsedMs(time) {
        if (!this.state.startedAt) return 0;
        if (this.fireMusicStarted && this.fireMusic && !this.fireMusic.paused) {
            return this.fireMusic.currentTime * 1000;
        }
        return time - this.state.startedAt;
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

        if (!this.isFireInSafeRange() && this.state.unstableMs > 3200) this.state.unstableMs = 3200;
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
        const time = this.container.querySelector('[data-time]');
        const meter = this.container.querySelector('.fire-meter span');
        const idealZone = this.container.querySelector('.fire-ideal-zone');
        const waterHint = this.container.querySelector('[data-water-hint]');
        const waterButton = this.container.querySelector('[data-water]');
        const dangerAlert = this.container.querySelector('[data-fire-danger]');
        const flame = this.container.querySelector('[data-flame]');
        if (score) score.textContent = this.state.score;
        if (fire) fire.textContent = Math.round(this.state.fire);
        if (time) {
            const elapsed = this.getFireElapsedMs(performance.now());
            time.textContent = Math.max(0, Math.ceil((this.state.durationMs - elapsed) / 1000));
        }
        if (meter) meter.style.width = `${this.state.fire}%`;
        if (idealZone) {
            idealZone.style.left = `${this.state.idealMin}%`;
            idealZone.style.width = `${this.state.idealMax - this.state.idealMin}%`;
        }
        const needsWater = this.state.fire > this.state.idealMax;
        if (waterHint) waterHint.classList.toggle('active', needsWater);
        if (waterButton) waterButton.classList.toggle('needs-water', needsWater);
        if (dangerAlert) dangerAlert.classList.toggle('active', this.state.fire > this.state.safeMax);
        if (flame) {
            const flameSrc = this.state.fire > this.state.idealMax
                ? this.getFireAsset('assets/images/station-fire/fire-large.png')
                : this.getFireAsset('assets/images/station-fire/fire-small.png');
            if (flame.src !== flameSrc) flame.src = flameSrc;
            const flameScale = 0.55 + (this.state.fire / 75);
            flame.style.transform = `translateX(-50%) scale(${flameScale})`;
        }
    },

    showFireScorePop(points, prefix = '') {
        if (!this.container || !Number.isFinite(points)) return;
        const layer = this.container.querySelector('[data-score-layer]');
        if (!layer) return;
        const pop = document.createElement('div');
        pop.className = `fire-score-pop ${points >= 0 ? 'positive' : 'negative'}`;
        const sign = points >= 0 ? '+' : '';
        pop.textContent = `${prefix ? `${prefix} ` : ''}${sign}${points}`;
        const offsetX = 42 + (Math.random() * 16);
        const offsetY = 42 + (Math.random() * 18);
        pop.style.left = `${offsetX}%`;
        pop.style.top = `${offsetY}%`;
        layer.appendChild(pop);
        this.timers.push(setTimeout(() => {
            if (pop.parentNode) pop.remove();
        }, 900));
    },

    getTeaStageConfig(stageId) {
        const stages = {
            grind: {
                title: this.tr('station.tea.grind.title'),
                verb: this.tr('station.tea.grind.verb'),
                instruction: this.tr('station.tea.grind.instruction'),
                target: 5,
                unit: this.tr('station.tea.grind.unit'),
                toolClass: 'grind',
                items: [
                    { id: 'basil', name: this.tr('ingredient.basil'), sprite: 0 },
                    { id: 'mint', name: this.tr('ingredient.mint'), sprite: 1 },
                    { id: 'kuding', name: this.tr('ingredient.kuding'), sprite: 2 },
                    { id: 'peanut', name: this.tr('ingredient.peanut'), sprite: 3 },
                    { id: 'sesame', name: this.tr('ingredient.sesame'), sprite: 4 }
                ]
            },
            chop: {
                title: this.tr('station.tea.chop.title'),
                verb: this.tr('station.tea.chop.verb'),
                instruction: this.tr('station.tea.chop.instruction'),
                target: 10,
                unit: this.tr('station.tea.chop.unit'),
                toolClass: 'chop',
                items: [
                    { id: 'long-bean', name: this.tr('ingredient.longBean'), sprite: 5 },
                    { id: 'radish', name: this.tr('ingredient.radish'), sprite: 6 },
                    { id: 'tree-veg', name: this.tr('ingredient.treeVeg'), sprite: 7 },
                    { id: 'tofu', name: this.tr('ingredient.tofu'), sprite: 8 }
                ]
            }
        };
        return stages[stageId];
    },

    shuffleTeaItems(items) {
        const shuffled = items.map((item) => ({ ...item }));
        for (let index = shuffled.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
        }
        return shuffled;
    },

    prepareTeaAssets() {
        return Promise.all(this.teaImageUrls.map((src) => new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = resolve;
            image.onerror = () => reject(new Error(`無法載入 ${src}`));
            image.src = src;
        })));
    },

    showTeaLoadError(error) {
        if (window.Logger) window.Logger.error('關卡二圖片準備失敗:', error);
        if (!this.container) return;
        this.container.innerHTML = `
            <section class="station-panel station-result-panel">
                <div class="station-kicker-line">${this.station.kicker}</div>
                <h1>${this.tr('station.tea.load.title')}</h1>
                <p class="station-copy">${this.tr('station.tea.load.copy')}</p>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry-load>${this.tr('game.retryLoad')}</button>
                    <button type="button" class="station-secondary" data-back>${this.tr('game.backToEntrance')}</button>
                </div>
            </section>
        `;
        this.container.querySelector('[data-retry-load]').addEventListener('click', () => {
            this.prepareTeaAssets()
                .then(() => this.startTeaGame())
                .catch((retryError) => this.showTeaLoadError(retryError));
        });
        this.container.querySelector('[data-back]').addEventListener('click', () => this.close());
    },

    startTeaGame() {
        this.clearTeaTimer();
        this.stopTeaTrack();
        const grind = this.getTeaStageConfig('grind');
        const chop = this.getTeaStageConfig('chop');
        this.state = {
            stationId: 'tea',
            phase: 'grind',
            orders: {
                grind: this.shuffleTeaItems(grind.items),
                chop: this.shuffleTeaItems(chop.items)
            },
            completed: { grind: [], chop: [] },
            autoCompleted: { grind: false, chop: false },
            currentIndex: 0,
            processing: false,
            activeItemId: null,
            actionProgress: 0,
            rotationAngle: 0,
            lastPointerAngle: null,
            movingItems: [],
            teaSpawnPatternIndex: 0,
            teaIngredientSpawnCount: 0,
            teaDecoySpawnCount: 0,
            teaLastSpawnAt: 0,
            teaLastFrameAt: 0,
            timeLeft: this.teaStageDurationMs / 1000,
            stageDeadline: 0,
            transitioning: false,
            feedback: this.tr('station.tea.firstIngredient'),
            finished: false
        };
        this.renderTeaStage();
        this.showTeaGuide();
    },

    showTeaGuide() {
        const play = this.container?.querySelector('.tea-play');
        const begin = () => {
            if (!this.state || this.state.stationId !== 'tea' || this.state.finished) return;
            this.startTeaTrack();
            this.startTeaTimer();
        };
        if (this.teaGuideShown || !play || typeof StationIntroGuide === 'undefined') {
            begin();
            return;
        }
        this.teaGuideShown = true;
        this.stopTeaTrack(); // 說明期間先停住流動軌道與倒數
        StationIntroGuide.start({
            host: play,
            steps: [
                { selector: '[data-tea-track]', textKey: 'station.tea.guide.pick' },
                { selector: '[data-tea-drop]', textKey: 'station.tea.guide.process' }
            ],
            onFinish: begin
        });
    },

    renderTeaStage() {
        if (!this.container || !this.state || this.state.stationId !== 'tea') return;
        this.stopTeaTrack();
        const config = this.getTeaStageConfig(this.state.phase);
        const order = this.state.orders[this.state.phase];
        const completed = this.state.completed[this.state.phase];
        const expected = order[this.state.currentIndex];
        const orderMarkup = order.map((item, index) => {
            const status = completed.includes(item.id)
                ? 'done'
                : index === this.state.currentIndex ? 'current' : '';
            return `<span class="${status}"><b>${index + 1}</b>${item.name}${status === 'done' ? ' ✓' : ''}</span>`;
        }).join('');
        const ingredientSourceMarkup = `<div class="tea-moving-track" data-tea-track aria-label="${this.tr('station.tea.track')}"><span class="tea-track-hint">${this.tr('station.tea.trackHint')}</span></div>`;
        const progressText = this.state.processing
            ? `${this.state.actionProgress}/${config.target} ${config.unit}`
            : this.tr('station.tea.waiting', { item: expected ? expected.name : this.tr('station.tea.done') });
        const progressPercent = this.state.processing
            ? Math.min(100, this.state.actionProgress / config.target * 100)
            : 0;
        const liquidPercent = this.getTeaLiquidPercent();
        const activeItem = this.state.processing
            ? config.items.find((item) => item.id === this.state.activeItemId)
            : null;
        const activeIngredientMarkup = activeItem
            ? `<span class="tea-processing-ingredient ${this.state.phase}" aria-label="${activeItem.name}"
                    style="--tea-sprite-x:${(activeItem.sprite % 3) * 50}%;--tea-sprite-y:${Math.floor(activeItem.sprite / 3) * 50}%">
                    <span class="tea-ingredient-art" aria-hidden="true"></span>
               </span>`
            : '';
        const toolMarkup = this.state.phase === 'grind'
            ? `
                <span class="tea-mortar-art" aria-hidden="true"></span>
                <span class="tea-liquid" data-tea-liquid aria-hidden="true"
                    style="width:${23 + liquidPercent * 0.08}%;height:${5 + liquidPercent * 0.16}px;opacity:${Math.min(1, liquidPercent / 14)}"></span>
                ${activeIngredientMarkup}
                <span class="tea-pestle-art" data-tea-pestle aria-hidden="true"></span>
            `
            : `
                <span class="tea-cutting-board-art" aria-hidden="true"></span>
                ${activeIngredientMarkup}
                <span class="tea-knife-art" aria-hidden="true"></span>
            `;

        this.container.innerHTML = `
            <div class="station-play tea-play">
                <button type="button" class="station-secondary station-corner-exit" data-exit>${this.tr('story.action.leave')}</button>
                <div class="station-hud tea-hud">
                    <span>${config.title}</span>
                    <span>${this.tr('station.tea.progress', { current: Math.min(this.state.currentIndex + 1, order.length), total: order.length })}</span>
                    <span class="tea-timer${this.state.timeLeft <= 5 ? ' urgent' : ''}">${this.tr('station.tea.remaining', { seconds: `<b data-tea-time>${Math.ceil(this.state.timeLeft)}</b>` })}</span>
                </div>
                <div class="tea-instruction">${config.instruction}</div>
                <div class="tea-order" aria-label="${this.tr('station.tea.order')}">${orderMarkup}</div>
                <div class="tea-game-area">
                    ${ingredientSourceMarkup}
                    <div class="tea-workspace">
                        <div class="tea-drop-zone ${config.toolClass}${this.state.processing ? ' processing' : ''}" data-tea-drop>
                            ${toolMarkup}
                            <span class="tea-target-label">${this.state.processing && expected ? this.tr('station.tea.processing', { item: expected.name, verb: config.verb }) : this.tr('station.tea.dropHere', { verb: config.verb })}</span>
                            <span class="tea-action-progress">${progressText}</span>
                            <span class="tea-action-meter"><i style="width:${progressPercent}%"></i></span>
                        </div>
                    </div>
                </div>
                <div class="station-feedback tea-feedback" aria-live="polite">${this.state.feedback}</div>
            </div>
        `;

        this.container.querySelector('[data-exit]').addEventListener('click', () => this.close());
        this.startTeaTrack();
        if (this.state.processing) {
            if (this.state.phase === 'grind') this.bindTeaGrinding();
            if (this.state.phase === 'chop') this.bindTeaChopping();
        }
    },

    startTeaTrack() {
        if (!this.state || this.state.finished || !['grind', 'chop'].includes(this.state.phase)) return;
        this.stopTeaTrack();
        this.state.movingItems = [];
        this.state.teaLastFrameAt = 0;
        this.state.teaLastSpawnAt = 0;
        this.teaAnimationId = requestAnimationFrame((time) => this.tickTeaTrack(time));
    },

    stopTeaTrack() {
        if (this.teaAnimationId) cancelAnimationFrame(this.teaAnimationId);
        this.teaAnimationId = null;
        if (!this.state?.movingItems) return;
        this.state.movingItems.forEach((entry) => {
            if (entry.el?.parentNode) entry.el.remove();
        });
        this.state.movingItems = [];
    },

    tickTeaTrack(time) {
        if (!this.state || this.state.finished || !['grind', 'chop'].includes(this.state.phase)) {
            this.teaAnimationId = null;
            return;
        }
        const track = this.container?.querySelector('[data-tea-track]');
        if (!track) {
            this.teaAnimationId = null;
            return;
        }
        if (!this.state.teaLastFrameAt) {
            this.state.teaLastFrameAt = time;
            this.state.teaLastSpawnAt = time - this.teaSpawnIntervalMs;
        }
        const delta = Math.min(80, time - this.state.teaLastFrameAt);
        this.state.teaLastFrameAt = time;
        if (time - this.state.teaLastSpawnAt >= this.teaSpawnIntervalMs) {
            this.spawnTeaTrackItem(track);
            this.state.teaLastSpawnAt = time;
        }

        const trackWidth = Math.max(1, track.clientWidth);
        const speed = (trackWidth * (1 - 0.24)) / this.teaTravelMs;
        const active = [];
        this.state.movingItems.forEach((entry) => {
            if (!entry.dragging) entry.x -= speed * delta;
            if (entry.el?.isConnected) entry.el.style.left = `${entry.x}px`;
            const halfWidth = Math.max(36, (entry.el?.offsetWidth || 72) / 2);
            if (entry.x >= -halfWidth || entry.dragging) active.push(entry);
            else if (entry.el?.parentNode) entry.el.remove();
        });
        this.state.movingItems = active;
        this.teaAnimationId = requestAnimationFrame((nextTime) => this.tickTeaTrack(nextTime));
    },

    spawnTeaTrackItem(track) {
        if (!this.state || !track) return;
        this.state.teaSpawnPatternIndex++;
        const shouldSpawnDecoy = Math.random() < (1 / 3);
        const item = shouldSpawnDecoy ? this.getTeaDecoyItem() : this.getTeaMovingIngredient();
        if (!item) return;

        const instanceId = `${item.id}-${Date.now()}-${this.state.teaSpawnPatternIndex}`;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `tea-ingredient-card tea-moving-item${item.isDecoy ? ' tea-decoy' : ''}`;
        card.dataset.teaItem = item.id;
        card.dataset.teaInstance = instanceId;
        card.setAttribute('aria-label', this.tr('station.tea.dragItem', { item: item.name }));
        if (item.isDecoy) {
            card.innerHTML = `
                <span class="tea-decoy-art" aria-hidden="true"><img src="${item.image}" alt=""></span>
                <span class="tea-ingredient-name">${item.name}</span>
            `;
        } else {
            const column = item.sprite % 3;
            const row = Math.floor(item.sprite / 3);
            card.style.setProperty('--tea-sprite-x', `${column * 50}%`);
            card.style.setProperty('--tea-sprite-y', `${row * 50}%`);
            card.innerHTML = `
                <span class="tea-ingredient-art" aria-hidden="true"></span>
                <span class="tea-ingredient-name">${item.name}</span>
            `;
        }
        track.appendChild(card);
        const entry = {
            el: card,
            item: { ...item, instanceId },
            x: track.clientWidth + Math.max(38, card.offsetWidth / 2),
            dragging: false
        };
        card.style.left = `${entry.x}px`;
        this.state.movingItems.push(entry);
        this.bindTeaIngredientDrag(card, entry.item, entry);
    },

    getTeaMovingIngredient() {
        if (!this.state) return null;
        const phase = this.state.phase;
        const config = this.getTeaStageConfig(phase);
        const completed = this.state.completed[phase];
        const available = config.items.filter((item) => !completed.includes(item.id) && item.id !== this.state.activeItemId);
        if (!available.length) return null;
        const expected = this.state.orders[phase][this.state.currentIndex];
        const shouldPrioritizeExpected = !this.state.processing && Math.random() < 0.58;
        this.state.teaIngredientSpawnCount++;
        if (shouldPrioritizeExpected && expected) return { ...expected, isDecoy: false };
        const alternatives = expected ? available.filter((item) => item.id !== expected.id) : available;
        const pool = alternatives.length ? alternatives : available;
        return { ...pool[Math.floor(Math.random() * pool.length)], isDecoy: false };
    },

    getTeaDecoyItem() {
        if (!this.state) return null;
        const decoys = [
            { id: 'wood-small', name: this.tr('ingredient.woodSmall'), image: 'assets/images/station-fire/wood-small.png' },
            { id: 'stone', name: this.tr('ingredient.stone'), image: 'assets/images/station-tea/stone.png' },
            { id: 'wood-large', name: this.tr('ingredient.woodLarge'), image: 'assets/images/station-fire/wood-large.png' }
        ];
        const item = decoys[this.state.teaDecoySpawnCount++ % decoys.length];
        return { ...item, isDecoy: true };
    },

    bindTeaIngredientDrag(card, item, movingEntry = null) {
        card.addEventListener('pointerdown', (event) => {
            if (!this.state || this.state.finished || this.state.transitioning) return;
            if (this.state.processing) {
                const active = this.state.orders[this.state.phase][this.state.currentIndex];
                this.flashTeaError(this.tr('station.tea.finishActive', { item: active.name, verb: this.getTeaStageConfig(this.state.phase).verb }), item.instanceId || item.id);
                return;
            }
            event.preventDefault();
            const startX = event.clientX;
            const startY = event.clientY;
            const startRect = card.getBoundingClientRect();
            const dragLayerRect = this.container.getBoundingClientRect();
            let moved = false;
            let dragGhost = null;
            this.container.querySelectorAll('.tea-moving-item.selected').forEach((selected) => {
                selected.classList.remove('selected');
            });
            card.classList.add('selected');
            if (movingEntry) movingEntry.dragging = true;
            try {
                card.setPointerCapture(event.pointerId);
            } catch (error) {
                if (window.Logger) window.Logger.warn('關卡二拖曳無法鎖定指標，改用全域追蹤:', error);
            }

            const move = (moveEvent) => {
                if (moveEvent.pointerId !== event.pointerId) return;
                const offsetX = moveEvent.clientX - startX;
                const offsetY = moveEvent.clientY - startY;
                if (!moved && Math.abs(offsetX) + Math.abs(offsetY) <= 8) return;
                if (!moved) {
                    moved = true;
                    card.classList.add('dragging');
                    dragGhost = card.cloneNode(true);
                    dragGhost.classList.add('tea-drag-ghost');
                    dragGhost.classList.remove('selected');
                    dragGhost.removeAttribute('data-tea-item');
                    dragGhost.removeAttribute('data-tea-instance');
                    dragGhost.setAttribute('aria-hidden', 'true');
                    dragGhost.style.left = `${startRect.left - dragLayerRect.left}px`;
                    dragGhost.style.top = `${startRect.top - dragLayerRect.top}px`;
                    dragGhost.style.width = `${startRect.width}px`;
                    dragGhost.style.height = `${startRect.height}px`;
                    this.container.appendChild(dragGhost);
                    card.style.visibility = 'hidden';
                }
                dragGhost.style.left = `${startRect.left - dragLayerRect.left + offsetX}px`;
                dragGhost.style.top = `${startRect.top - dragLayerRect.top + offsetY}px`;
            };
            const cleanup = () => {
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', finish);
                window.removeEventListener('pointercancel', cancel);
                if (card.hasPointerCapture?.(event.pointerId)) card.releasePointerCapture(event.pointerId);
                card.classList.remove('dragging');
                card.style.visibility = '';
                if (dragGhost?.parentNode) dragGhost.remove();
                dragGhost = null;
                if (movingEntry) {
                    movingEntry.dragging = false;
                }
            };
            const finish = (finishEvent) => {
                if (finishEvent.pointerId !== event.pointerId) return;
                cleanup();
                const dropZone = this.container?.querySelector('[data-tea-drop]');
                if (!dropZone || !moved) return;
                const bounds = dropZone.getBoundingClientRect();
                const inside = finishEvent.clientX >= bounds.left && finishEvent.clientX <= bounds.right
                    && finishEvent.clientY >= bounds.top && finishEvent.clientY <= bounds.bottom;
                if (inside) this.handleTeaDrop(item);
            };
            const cancel = (cancelEvent) => {
                if (cancelEvent.pointerId !== event.pointerId) return;
                cleanup();
            };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', finish);
            window.addEventListener('pointercancel', cancel);
        });
    },

    handleTeaDrop(item) {
        if (!this.state || this.state.processing || this.state.transitioning) return;
        if (item.isDecoy) {
            const destination = this.tr(this.state.phase === 'grind' ? 'station.tea.destination.mortar' : 'station.tea.destination.board');
            this.flashTeaError(this.tr('station.tea.wrongDestination', { item: item.name, destination }), item.instanceId || item.id);
            return;
        }
        const expected = this.state.orders[this.state.phase][this.state.currentIndex];
        if (!expected || item.id !== expected.id) {
            this.flashTeaError(this.tr('station.tea.wrongOrder', { item: expected ? expected.name : this.tr('station.tea.designated') }), item.instanceId || item.id);
            return;
        }
        const config = this.getTeaStageConfig(this.state.phase);
        this.state.processing = true;
        this.state.activeItemId = item.id;
        this.state.actionProgress = 0;
        this.state.rotationAngle = 0;
        this.state.lastPointerAngle = null;
        this.state.feedback = this.tr('station.tea.started', { item: item.name, verb: config.verb });
        this.playClick();
        this.renderTeaStage();
        if (this.mode === 'combined' && this.state.phase === 'grind' && this.state.currentIndex === 0 && !this.state.coachShown) {
            this.state.coachShown = true;
            this.showCoachMessage('tea');
        }
    },

    flashTeaError(message, itemId) {
        if (!this.container) return;
        this.playWrong();
        const feedback = this.container.querySelector('.tea-feedback');
        const card = this.container.querySelector(`[data-tea-instance="${itemId}"]`)
            || this.container.querySelector(`[data-tea-item="${itemId}"]`);
        const dropZone = this.container.querySelector('[data-tea-drop]');
        if (feedback) feedback.textContent = message;
        if (card) card.classList.add('error');
        if (dropZone) dropZone.classList.add('error');
        this.timers.push(setTimeout(() => {
            if (card) card.classList.remove('error');
            if (dropZone) dropZone.classList.remove('error');
        }, 620));
    },

    bindTeaGrinding() {
        const target = this.container.querySelector('[data-tea-drop]');
        if (!target) return;
        const getAngle = (event) => {
            const bounds = target.getBoundingClientRect();
            return Math.atan2(event.clientY - (bounds.top + bounds.height / 2), event.clientX - (bounds.left + bounds.width / 2)) * 180 / Math.PI;
        };
        target.addEventListener('pointerdown', (event) => {
            if (!this.state?.processing) return;
            event.preventDefault();
            // 在使用者手勢內先解鎖 AudioContext，避免首次研磨時瀏覽器保持靜音。
            this.getTeaAudioContext();
            target.setPointerCapture(event.pointerId);
            this.state.lastPointerAngle = getAngle(event);
            this.updateTeaPestle(this.state.lastPointerAngle);
            target.classList.add('gesturing');
        });
        target.addEventListener('pointermove', (event) => {
            if (!this.state?.processing || this.state.lastPointerAngle === null) return;
            event.preventDefault();
            const angle = getAngle(event);
            let delta = angle - this.state.lastPointerAngle;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            this.state.lastPointerAngle = angle;
            // 手機快速畫圈時 pointermove 取樣可能較疏，允許單次最多 120 度的有效位移。
            if (Math.abs(delta) < 1 || Math.abs(delta) > 120) return;
            this.state.rotationAngle += Math.abs(delta);
            this.updateTeaPestle(angle);
            this.playTeaGrindSound(Math.abs(delta));
            this.updateTeaLiquid();
            while (this.state.rotationAngle >= 360 && this.state.actionProgress < 5) {
                this.state.rotationAngle -= 360;
                this.state.actionProgress++;
                target.classList.remove('tea-pulse');
                void target.offsetWidth;
                target.classList.add('tea-pulse');
                this.updateTeaActionProgress();
                if (this.state.actionProgress >= 5) {
                    this.completeTeaItem();
                    return;
                }
            }
        });
        const endGesture = (event) => {
            if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
            if (this.state) this.state.lastPointerAngle = null;
            target.classList.remove('gesturing');
        };
        target.addEventListener('pointerup', endGesture);
        target.addEventListener('pointercancel', endGesture);
    },

    bindTeaChopping() {
        const target = this.container.querySelector('[data-tea-drop]');
        if (!target) return;
        target.addEventListener('pointerdown', (event) => {
            if (!this.state?.processing || this.state.transitioning) return;
            event.preventDefault();
            this.state.actionProgress++;
            this.playTeaChopSound();
            target.classList.remove('tea-chop-hit');
            void target.offsetWidth;
            target.classList.add('tea-chop-hit');
            this.updateTeaActionProgress();
            if (this.state.actionProgress >= 10) this.completeTeaItem();
        });
    },

    updateTeaActionProgress() {
        if (!this.container || !this.state) return;
        const config = this.getTeaStageConfig(this.state.phase);
        const label = this.container.querySelector('.tea-action-progress');
        const meter = this.container.querySelector('.tea-action-meter i');
        if (label) label.textContent = `${this.state.actionProgress}/${config.target} ${config.unit}`;
        if (meter) meter.style.width = `${Math.min(100, this.state.actionProgress / config.target * 100)}%`;
        if (this.state.phase === 'grind') this.updateTeaLiquid();
    },

    getTeaLiquidPercent() {
        if (!this.state) return 0;
        const completedTurns = this.state.completed.grind.length * 5;
        const currentTurns = this.state.phase === 'grind' && this.state.processing
            ? this.state.actionProgress + (this.state.rotationAngle / 360)
            : 0;
        return Math.max(0, Math.min(100, ((completedTurns + currentTurns) / 25) * 100));
    },

    updateTeaLiquid() {
        const liquid = this.container?.querySelector('[data-tea-liquid]');
        if (!liquid) return;
        const percent = this.getTeaLiquidPercent();
        liquid.style.width = `${23 + percent * 0.08}%`;
        liquid.style.height = `${5 + percent * 0.16}px`;
        liquid.style.opacity = `${Math.min(1, percent / 14)}`;
    },

    updateTeaPestle(angle) {
        const pestle = this.container?.querySelector('[data-tea-pestle]');
        if (!pestle || !Number.isFinite(angle)) return;
        const radians = angle * Math.PI / 180;
        const x = 50 + Math.cos(radians) * 20;
        const y = 54 + Math.sin(radians) * 12;
        pestle.style.setProperty('--tea-pestle-x', `${x}%`);
        pestle.style.setProperty('--tea-pestle-y', `${y}%`);
    },

    completeTeaItem() {
        if (!this.state || !this.state.processing || this.state.transitioning) return;
        const phase = this.state.phase;
        const config = this.getTeaStageConfig(phase);
        const item = this.state.orders[phase][this.state.currentIndex];
        this.state.completed[phase].push(item.id);
        this.state.currentIndex++;
        this.state.processing = false;
        this.state.activeItemId = null;
        this.state.actionProgress = 0;
        this.state.feedback = this.tr('station.tea.completed', { item: item.name, verb: config.verb });
        if (this.state.currentIndex >= this.state.orders[phase].length) {
            this.state.transitioning = true;
            this.renderTeaStage();
            this.timers.push(setTimeout(() => this.completeTeaStage(), 700));
            return;
        }
        const next = this.state.orders[phase][this.state.currentIndex];
        this.state.feedback += this.tr('station.tea.next', { item: next.name });
        this.renderTeaStage();
    },

    startTeaTimer() {
        this.clearTeaTimer();
        if (!this.state) return;
        this.state.timeLeft = this.teaStageDurationMs / 1000;
        this.state.stageDeadline = Date.now() + this.teaStageDurationMs;
        this.teaTimerId = setInterval(() => {
            if (!this.state || this.state.finished || this.state.transitioning) return;
            this.state.timeLeft = Math.max(0, (this.state.stageDeadline - Date.now()) / 1000);
            const time = this.container?.querySelector('[data-tea-time]');
            const timer = this.container?.querySelector('.tea-timer');
            if (time) time.textContent = Math.ceil(this.state.timeLeft);
            if (timer) timer.classList.toggle('urgent', this.state.timeLeft <= 5);
            if (this.state.timeLeft <= 0) this.handleTeaTimeout();
        }, 200);
    },

    clearTeaTimer() {
        if (this.teaTimerId) clearInterval(this.teaTimerId);
        this.teaTimerId = null;
    },

    handleTeaTimeout() {
        if (!this.state || this.state.transitioning) return;
        this.clearTeaTimer();
        const phase = this.state.phase;
        const config = this.getTeaStageConfig(phase);
        this.state.autoCompleted[phase] = true;
        this.state.completed[phase] = config.items.map((item) => item.id);
        this.state.currentIndex = this.state.orders[phase].length;
        this.state.processing = false;
        this.state.activeItemId = null;
        this.state.timeLeft = 0;
        this.state.transitioning = true;
        this.state.feedback = this.tr('station.tea.timeout');
        this.renderTeaStage();
        this.container.querySelector('.tea-play')?.classList.add('is-auto-completing');
        this.timers.push(setTimeout(() => this.completeTeaStage(), 1200));
    },

    completeTeaStage() {
        if (!this.state || this.state.stationId !== 'tea') return;
        this.clearTeaTimer();
        if (this.state.phase === 'grind') {
            this.state.phase = 'chop';
            this.state.currentIndex = 0;
            this.state.processing = false;
            this.state.activeItemId = null;
            this.state.actionProgress = 0;
            this.state.rotationAngle = 0;
            this.state.lastPointerAngle = null;
            this.state.transitioning = false;
            this.state.feedback = this.tr('station.tea.chopStart');
            this.renderTeaStage();
            this.startTeaTimer();
            return;
        }
        this.showTeaResult();
    },

    showTeaResult() {
        if (!this.state || !this.container) return;
        this.clearTeaTimer();
        this.state.finished = true;
        if (this.mode === 'combined') {
            this.showCombinedDialogue('teaExit', () => this.showCombinedEnding());
            return;
        }
        // 單關版：離開引導對話 → 結果頁。
        this.showCombinedDialogue('teaExit', () => this.renderTeaResult(), { actionLabelKey: 'story.action.seeResult' });
    },

    renderTeaResult() {
        if (!this.state || !this.container) return;
        const usedHelp = this.state.autoCompleted.grind || this.state.autoCompleted.chop;
        this.container.innerHTML = `
            <section class="station-panel station-result-panel tea-result-panel has-guide">
                <div class="station-kicker-line">${this.station.kicker}</div>
                <h1>${this.tr('station.tea.result.title')}</h1>
                <div class="tea-result-layout">
                    <div class="tea-result-art" role="img" aria-label="${this.tr('station.tea.result.art')}"></div>
                    <div class="tea-result-copy">
                        <p class="station-subtitle">${this.tr('station.tea.result.grindIngredients')}</p>
                        <p class="station-subtitle">${this.tr('station.tea.result.chopIngredients')}</p>
                        <p class="station-copy">${this.station.success}</p>
                        ${usedHelp ? `<p class="tea-assisted-note">${this.tr('station.tea.result.assisted')}</p>` : `<p class="tea-perfect-note">${this.tr('station.tea.result.perfect')}</p>`}
                    </div>
                </div>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry>${this.tr('game.retry')}</button>
                    <button type="button" class="station-secondary" data-back>${this.tr('game.backToEntrance')}</button>
                </div>
                <img class="station-guide station-guide-result" src="${this.station.guideImage}" alt="${this.station.guideAlt}">
            </section>
        `;
        this.container.querySelector('[data-retry]').addEventListener('click', () => this.startTeaGame());
        this.container.querySelector('[data-back]').addEventListener('click', () => this.close());
    },

    showFireResult() {
        if (!this.state || this.state.stationId !== 'fire') return;
        const fireScore = Math.max(0, 100 - Math.abs(this.state.fire - 58) * 2);
        const mistakeBonus = this.state.mistakesRemaining * 40;
        const totalScore = Math.round(this.state.score + fireScore + mistakeBonus);
        const success = totalScore >= 2400 && this.isFireInSafeRange();
        this.state.score = totalScore;
        this.station.fireSummary = this.tr('station.fire.summary', {
            score: totalScore
        });
        if (this.mode === 'combined') {
            this.finishCombinedFire();
            return;
        }
        // 單關版：先看結果，再由「去找阿罵」進入離開引導對話。
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.stopFireMusic();
        this.showResult(success);
    },

    showResult(success) {
        if (!this.state) return;
        this.state.finished = true;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.stopFireMusic();

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
            if (this.state.stationId === 'fire') this.startFireGame();
            if (this.state.stationId === 'tea') this.startTeaGame();
        });
        this.container.querySelector('[data-back]').addEventListener('click', () => {
            this.showCombinedDialogue('fireExit', () => this.close(), { actionLabelKey: 'story.action.returnLobby' });
        });
    },

    close() {
        this.stop();
        showScene('level-select');
    },

    showCombinedEnding() {
        const continueToSecondHalf = this.fullStory;
        this.stop();
        if (continueToSecondHalf && window.Station34CombinedGame && window.EndingScreen) {
            // 「完整劇情體驗」：上半場（灶台＋擂茶）結束後接中場過場，再進三四關。
            EndingScreen.show(() => Station34CombinedGame.start(), {
                kicker: this.tr('story.intermission.kicker'),
                title: this.tr('story.intermission.title'),
                subtitle: this.tr('story.intermission.subtitle'),
                button: this.tr('story.intermission.continue')
            });
            return;
        }
        if (window.EndingScreen) EndingScreen.show(() => showScene('level-select'));
        else showScene('level-select');
    },

    stop() {
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers = [];
        this.clearCombinedTyping();
        this.clearTeaTimer();
        this.stopTeaTrack();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
        this.stopFireMusic();
        this.releaseFireAssets();
        if (typeof StationIntroGuide !== 'undefined') StationIntroGuide.stop();
        this.fireGuideShown = false;
        this.teaGuideShown = false;
        if (this.teaAudioContext) {
            this.teaAudioContext.close().catch(() => {});
            this.teaAudioContext = null;
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

    getTeaAudioContext() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        if (!this.teaAudioContext || this.teaAudioContext.state === 'closed') {
            this.teaAudioContext = new AudioContextClass();
        }
        if (this.teaAudioContext.state === 'suspended') {
            this.teaAudioContext.resume().catch(() => {});
        }
        return this.teaAudioContext;
    },

    createTeaNoiseSource(context, duration) {
        const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
        const buffer = context.createBuffer(1, frameCount, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let index = 0; index < frameCount; index++) {
            data[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
        }
        const source = context.createBufferSource();
        source.buffer = buffer;
        return source;
    },

    playFireWoodSound(strong = true) {
        const context = this.getTeaAudioContext();
        if (!context) return;
        const startAt = context.currentTime;
        const duration = strong ? 0.14 : 0.1;

        const knock = context.createOscillator();
        const knockGain = context.createGain();
        knock.type = 'triangle';
        knock.frequency.setValueAtTime(strong ? 150 : 120, startAt);
        knock.frequency.exponentialRampToValueAtTime(strong ? 62 : 54, startAt + duration);
        knockGain.gain.setValueAtTime(strong ? 0.24 : 0.16, startAt);
        knockGain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
        knock.connect(knockGain).connect(context.destination);

        const texture = this.createTeaNoiseSource(context, duration * 0.75);
        const textureFilter = context.createBiquadFilter();
        const textureGain = context.createGain();
        textureFilter.type = 'bandpass';
        textureFilter.frequency.setValueAtTime(strong ? 620 : 480, startAt);
        textureFilter.Q.setValueAtTime(0.9, startAt);
        textureGain.gain.setValueAtTime(strong ? 0.1 : 0.065, startAt);
        textureGain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration * 0.75);
        texture.connect(textureFilter).connect(textureGain).connect(context.destination);

        knock.start(startAt);
        knock.stop(startAt + duration);
        texture.start(startAt);
        texture.stop(startAt + duration * 0.75);
    },

    playTeaGrindSound(delta = 12) {
        const now = performance.now();
        if (now - this.lastTeaGrindSoundAt < 45) return;
        this.lastTeaGrindSoundAt = now;
        const context = this.getTeaAudioContext();
        if (!context) return;
        if (context.state !== 'running') {
            context.resume().catch(() => {});
            return;
        }
        const startAt = context.currentTime;
        const duration = 0.14;
        const source = this.createTeaNoiseSource(context, duration);
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(280 + Math.min(520, delta * 9), startAt);
        filter.Q.setValueAtTime(0.55, startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.24, startAt + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
        source.connect(filter).connect(gain).connect(context.destination);
        source.start(startAt);
        source.stop(startAt + duration);
    },

    playTeaChopSound() {
        const context = this.getTeaAudioContext();
        if (!context) {
            this.playClick();
            return;
        }
        const startAt = context.currentTime;
        const duration = 0.075;
        const noise = this.createTeaNoiseSource(context, duration);
        const noiseFilter = context.createBiquadFilter();
        const noiseGain = context.createGain();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1300, startAt);
        noiseGain.gain.setValueAtTime(0.13, startAt);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
        noise.connect(noiseFilter).connect(noiseGain).connect(context.destination);

        const knock = context.createOscillator();
        const knockGain = context.createGain();
        knock.type = 'triangle';
        knock.frequency.setValueAtTime(190, startAt);
        knock.frequency.exponentialRampToValueAtTime(72, startAt + duration);
        knockGain.gain.setValueAtTime(0.1, startAt);
        knockGain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
        knock.connect(knockGain).connect(context.destination);
        noise.start(startAt);
        noise.stop(startAt + duration);
        knock.start(startAt);
        knock.stop(startAt + duration);
    },

    startFireMusic() {
        if (!this.fireMusic) {
            this.fireMusic = new Audio(this.fireMusicSrc);
            this.fireMusic.loop = true;
            this.fireMusic.volume = 0.20;
            this.fireMusic.preload = 'auto';
        }

        this.fireMusic.currentTime = 0;
        return this.fireMusic.play().then(() => {
            this.fireMusicStarted = true;
        }).catch((error) => {
            this.fireMusicStarted = false;
            if (window.Logger) window.Logger.warn('⚠️ 關卡一音樂播放被瀏覽器阻擋:', error);
        });
    },

    syncFireMusicToGameStart() {
        if (!this.fireMusic) {
            return this.startFireMusic();
        }

        try {
            this.fireMusic.currentTime = 0;
        } catch (error) {
            if (window.Logger) window.Logger.warn('⚠️ 關卡一音樂重設失敗:', error);
        }

        return this.fireMusic.play().then(() => {
            this.fireMusicStarted = true;
        }).catch((error) => {
            this.fireMusicStarted = false;
            if (window.Logger) window.Logger.warn('⚠️ 關卡一音樂播放被瀏覽器阻擋:', error);
            throw error;
        });
    },

    stopFireMusic() {
        if (!this.fireMusic) return;
        this.fireMusic.pause();
        this.fireMusic.currentTime = 0;
        this.fireMusicStarted = false;
    }
};

function startStationDemo(stationId) {
    if (stationId === 'combined34' && window.Station34CombinedGame) {
        Station34CombinedGame.start();
        return;
    }
    if (stationId === 'story') {
        if (window.Station34CombinedGame) Station34CombinedGame.stop();
        if (window.CradleStationGame) CradleStationGame.stop();
        if (window.CakeStationGame) CakeStationGame.stop();
        StationDemoGame.start('story');
        return;
    }
    if (window.Station34CombinedGame) Station34CombinedGame.stop();
    // 搖籃／粿印單關版與三四關合併版共用 Station34CombinedGame 這個 orchestrator。
    if ((stationId === 'cradle' || stationId === 'cake') && window.Station34CombinedGame) {
        Station34CombinedGame.start({ only: stationId });
        return;
    }
    if (window.CradleStationGame) CradleStationGame.stop();
    if (window.CakeStationGame) CakeStationGame.stop();
    StationDemoGame.start(stationId);
}

window.StationDemoGame = StationDemoGame;
window.startStationDemo = startStationDemo;
