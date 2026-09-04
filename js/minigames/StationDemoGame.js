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
    fireDurationMs: 60000,
    fireAssetUrls: null,
    teaTimerId: null,
    teaAnimationId: null,
    teaAudioContext: null,
    lastTeaGrindSoundAt: 0,
    mode: null,
    dialogueTimer: null,
    dialogueTyping: false,
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
        'assets/images/defense/level1/stone.png'
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
            kicker: '關卡一 / 站點 1',
            title: '灶台生火',
            subtitle: '看準節拍添柴，讓火候維持在剛好的溫度。',
            intro: '木柴會沿著節奏軌道移動。當木柴進入灶台火圈時，按「添柴」或空白鍵。小柴升火少，大柴升火多；添柴時火候在綠色區間會獲得較多分，火候太高還添柴會扣分。火候超過綠色區間右側時，按「噴水」少量降火。',
            success: '火候穩了，鍋鏟阿嬤點點頭：勤儉不是省掉一切，是把每一分力氣用在剛好的地方。',
            fail: '火候還不穩。再試一次，抓到節奏後，灶台就會慢慢旺起來。',
            guideImage: 'assets/images/characters/grandma.png',
            guideAlt: '阿嬤',
        },
        tea: {
            kicker: '關卡二 / 站點 2',
            title: '擂茶料理',
            subtitle: '看著指定順序，把食材逐一研磨、切好，完成一組擂茶。',
            intro: '先從移動軌道中依照上方順序挑出五種食材，避開柴火與石頭，拖進石臼後讓研磨棒沿著碗緣畫滿 5 圈；接著把四種配菜拖上砧板，每一種連點 10 刀。兩段各有 1 分鐘，拖錯只會放不進來，不扣分也不扣時間。',
            success: '擂茶小知識：擂茶把茶葉、香草、花生與芝麻耐心擂成茶膏，再配上切細的蔬菜與豆腐，是一碗兼具香氣與口感的客家料理。',
            fail: '',
            guideImage: 'assets/images/characters/grandpa.png',
            guideAlt: '阿公',
        }
    },

    start(stationId) {
        this.stop();
        if (stationId === 'combined') {
            this.mode = 'combined';
            this.station = this.stations.fire;
            showScene('game-container');
            this.hideLegacyGameUi();
            this.createShell('fire');
            this.showCombinedDialogue('opening', () => this.startCombinedFire());
            return;
        }

        this.mode = 'standalone';
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

    setShellTheme(stationId) {
        if (!this.container) return;
        this.container.classList.remove('station-demo-fire', 'station-demo-tea');
        this.container.classList.add(`station-demo-${stationId}`);
    },

    showCombinedDialogue(sectionId, onComplete) {
        const section = window.StationCombinedStory?.sections?.[sectionId];
        if (!section || !this.container) {
            if (window.Logger) window.Logger.error('找不到合併版劇情段落:', sectionId);
            this.close();
            return;
        }

        this.clearCombinedTyping();
        this.state = null;
        this.setShellTheme(section.theme);
        let lineIndex = 0;

        const renderLine = () => {
            const line = section.lines[lineIndex];
            const characterMarkup = line.image
                ? `<img class="combined-story-character" src="${line.image}" alt="${line.speaker}">`
                : '';
            const cueMarkup = line.cue ? `<span class="combined-dialogue-cue">（${line.cue}）</span>` : '';
            const actionMarkup = line.actionLabel
                ? `<button type="button" class="station-primary combined-story-action" data-story-action hidden>${line.actionLabel}</button>`
                : '';

            this.container.innerHTML = `
                <section class="combined-story${line.narration ? ' is-narration' : ''}">
                    <button type="button" class="station-secondary station-corner-exit" data-exit>離開</button>
                    <div class="combined-story-character-stage">${characterMarkup}</div>
                    <div class="combined-dialogue-box${line.actionLabel ? ' has-action' : ''}" data-dialogue-advance role="button" tabindex="0" aria-label="繼續對話">
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
            if (action) {
                action.addEventListener('click', (event) => {
                    event.stopPropagation();
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
        }, 42);

        if (action) action.hidden = true;
    },

    finishCombinedTyping() {
        if (this.dialogueTimer) clearInterval(this.dialogueTimer);
        this.dialogueTimer = null;
        if (this.dialogueTextTarget) this.dialogueTextTarget.textContent = this.dialogueFullText;
        this.dialogueTyping = false;
        const box = this.container?.querySelector('.combined-dialogue-box');
        const action = this.container?.querySelector('[data-story-action]');
        if (box) box.classList.add('is-complete');
        if (action) action.hidden = false;
    },

    clearCombinedTyping() {
        if (this.dialogueTimer) clearInterval(this.dialogueTimer);
        this.dialogueTimer = null;
        this.dialogueTyping = false;
        this.dialogueTextTarget = null;
        this.dialogueFullText = '';
    },

    startCombinedFire() {
        this.station = this.stations.fire;
        this.setShellTheme('fire');
        this.startFireMusic();
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
        this.showCombinedDialogue('afterFire', () => {
            this.station = this.stations.tea;
            this.showCombinedDialogue('beforeTea', () => this.startCombinedTea());
        });
    },

    startCombinedTea() {
        this.station = this.stations.tea;
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
        speaker.textContent = `${coaching.speaker}：`;
        message.append(speaker, document.createTextNode(coaching.text));
        play.appendChild(message);
        this.timers.push(setTimeout(() => message.remove(), 6200));
    },

    showIntro(stationId) {
        const guide = this.station.guideImage
            ? `<img class="station-guide station-guide-intro" src="${this.station.guideImage}" alt="${this.station.guideAlt}">`
            : '';
        this.container.innerHTML = `
            <section class="station-panel station-intro-panel ${guide ? 'has-guide' : ''}">
                <div class="station-kicker-line">${this.station.kicker}</div>
                <h1>${this.station.title}</h1>
                <p class="station-subtitle">${this.station.subtitle}</p>
                <p class="station-copy">${this.station.intro}</p>
                <div class="station-actions">
                    <button type="button" class="station-primary">開始挑戰</button>
                    <button type="button" class="station-secondary">返回入口</button>
                </div>
                ${guide}
            </section>
        `;

        this.container.querySelector('.station-primary').addEventListener('click', () => {
            this.playClick();
            if (stationId === 'fire') {
                this.startFireMusic();
                this.prepareFireAssets()
                    .then(() => this.startFireGame())
                    .catch((error) => this.showFireLoadError(error));
            }
            if (stationId === 'tea') {
                this.prepareTeaAssets()
                    .then(() => this.startTeaGame())
                    .catch((error) => this.showTeaLoadError(error));
            }
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
            lastResult: '等木柴進入灶台火圈再添柴',
        };

        const stoveImage = this.getFireAsset('assets/images/station-fire/stove.png');
        const smallFlameImage = this.getFireAsset('assets/images/station-fire/fire-small.png');

        this.container.innerHTML = `
            <div class="station-play is-preparing">
                <div class="station-hud">
                    <div>${this.station.kicker}</div>
                    <div>分數 <span data-score>0</span></div>
                    <div>火候 <span data-fire>50</span>%</div>
                    <div>時間 <span data-time>60</span> 秒</div>
                </div>
                <button type="button" class="station-corner-exit" data-exit aria-label="返回入口">返回</button>
                <div class="fire-help-row">
                    <span>木柴進入灶台火圈：按添柴</span>
                    <span data-water-hint>火候超過 72%：按噴水</span>
                </div>
                <div class="fire-track" aria-label="節奏軌道">
                    <div class="fire-danger-alert" data-fire-danger>快要火燒厝了</div>
                    <div class="fire-target">
                        <img class="fire-stove-img" src="${stoveImage}" alt="灶台">
                        <img class="fire-flame-img" data-flame src="${smallFlameImage}" alt="火焰">
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
                <div class="fire-score-layer" data-score-layer aria-hidden="true"></div>
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

        this.renderFireHud();
        this.waitForFireGameReady()
            .then(() => this.beginFireLoop())
            .catch((error) => this.showFireLoadError(error));
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
                <h1>關卡素材還沒載入完成</h1>
                <p class="station-copy">目前網路沒有把圖片或音樂完整送達，請按下方按鈕重新載入。</p>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry-load>重新載入</button>
                    <button type="button" class="station-secondary" data-back>返回入口</button>
                </div>
            </section>
        `;
        this.container.querySelector('[data-retry-load]').addEventListener('click', () => {
            this.startFireMusic();
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
                this.applyFireScore('木柴錯過了', -8, -10, true, true);
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
            <img src="${woodImage}" alt="${type === 'big' ? '大柴' : '小柴'}">
            <span>${type === 'big' ? '大柴' : '小柴'}</span>
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
            this.applyFireScore('太早了，等木柴進火圈', -8, -3, false, true);
            return;
        }

        if (bestDistance > 120) {
            best.hit = true;
            best.el.remove();
            this.applyFireScore('沒對準火圈', -12, -8, true, true);
            return;
        }

        best.hit = true;
        best.el.remove();
        const woodLabel = best.type === 'big' ? '大柴' : '小柴';
        const fireDelta = best.type === 'big' ? 13 : 7;
        const basePoints = bestDistance <= 38 ? 55 : 35;
        const timingLabel = bestDistance <= 38 ? '剛剛好' : '有添到';

        if (this.state.fire > this.state.idealMax) {
            this.applyFireScore(`火太旺還添${woodLabel}`, -25, fireDelta, true, true);
        } else if (this.isFireInIdealRange()) {
            this.applyFireScore(`${timingLabel}：${woodLabel}，火候正好`, basePoints + 45, fireDelta);
        } else if (this.state.fire < this.state.idealMin) {
            this.applyFireScore(`${timingLabel}：${woodLabel}，把火拉回來`, basePoints + 15, fireDelta);
        } else {
            this.applyFireScore(`${timingLabel}：${woodLabel}`, basePoints, fireDelta);
        }
    },

    applyFireScore(label, points, fireDelta, countJudgement = true, countMistake = false) {
        if (!this.state || this.state.finished) return;
        if (countJudgement) this.state.judged++;
        if (countMistake) this.state.mistakesRemaining = Math.max(0, this.state.mistakesRemaining - 1);
        this.state.score = Math.max(0, this.state.score + points);
        this.state.fire = Math.max(0, Math.min(100, this.state.fire + fireDelta));
        const feedback = countMistake ? `${label}，扣分但繼續` : label;
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
            ? '噴水降火，再按一次可以更穩'
            : wasTooHot ? '噴水降火，火候回穩' : '火候還不用噴水';
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
                title: '小遊戲一・研磨食材',
                verb: '研磨',
                instruction: '從流動軌道依序拖進石臼，每一種食材畫滿 5 圈',
                target: 5,
                unit: '圈',
                toolClass: 'grind',
                items: [
                    { id: 'basil', name: '九層塔', sprite: 0 },
                    { id: 'mint', name: '薄荷', sprite: 1 },
                    { id: 'kuding', name: '苦刺心', sprite: 2 },
                    { id: 'peanut', name: '花生', sprite: 3 },
                    { id: 'sesame', name: '芝麻', sprite: 4 }
                ]
            },
            chop: {
                title: '小遊戲二・切配菜',
                verb: '切料',
                instruction: '從流動軌道依序拖上砧板，每一種食材快速連點 10 刀',
                target: 10,
                unit: '刀',
                toolClass: 'chop',
                items: [
                    { id: 'long-bean', name: '長豆', sprite: 5 },
                    { id: 'radish', name: '菜脯', sprite: 6 },
                    { id: 'tree-veg', name: '樹仔菜', sprite: 7 },
                    { id: 'tofu', name: '豆腐', sprite: 8 }
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
                <h1>素材載入失敗</h1>
                <p class="station-copy">請確認網路後再試一次，或先返回入口。</p>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry-load>重新載入</button>
                    <button type="button" class="station-secondary" data-back>返回入口</button>
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
            feedback: '先看上方順序，把第一種食材拖下來',
            finished: false
        };
        this.renderTeaStage();
        this.startTeaTimer();
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
        const ingredientSourceMarkup = '<div class="tea-moving-track" data-tea-track aria-label="移動食材軌道"><span class="tea-track-hint">拖曳目前指定食材・避開柴火和石頭</span></div>';
        const progressText = this.state.processing
            ? `${this.state.actionProgress}/${config.target} ${config.unit}`
            : `等待 ${expected ? expected.name : '完成'}`;
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
                <button type="button" class="station-secondary station-corner-exit" data-exit>離開</button>
                <div class="station-hud tea-hud">
                    <span>${config.title}</span>
                    <span>進度 ${Math.min(this.state.currentIndex + 1, order.length)}/${order.length}</span>
                    <span class="tea-timer${this.state.timeLeft <= 5 ? ' urgent' : ''}">剩餘 <b data-tea-time>${Math.ceil(this.state.timeLeft)}</b> 秒</span>
                </div>
                <div class="tea-instruction">${config.instruction}</div>
                <div class="tea-order" aria-label="正確順序">${orderMarkup}</div>
                <div class="tea-game-area">
                    ${ingredientSourceMarkup}
                    <div class="tea-workspace">
                        <div class="tea-drop-zone ${config.toolClass}${this.state.processing ? ' processing' : ''}" data-tea-drop>
                            ${toolMarkup}
                            <span class="tea-target-label">${this.state.processing && expected ? `${expected.name}・${config.verb}` : `拖到這裡${config.verb}`}</span>
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
        card.setAttribute('aria-label', `拖曳${item.name}`);
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
            { id: 'wood-small', name: '小柴', image: 'assets/images/station-fire/wood-small.png' },
            { id: 'stone', name: '石頭', image: 'assets/images/defense/level1/stone.png' },
            { id: 'wood-large', name: '大柴', image: 'assets/images/station-fire/wood-large.png' }
        ];
        const item = decoys[this.state.teaDecoySpawnCount++ % decoys.length];
        return { ...item, isDecoy: true };
    },

    bindTeaIngredientDrag(card, item, movingEntry = null) {
        card.addEventListener('pointerdown', (event) => {
            if (!this.state || this.state.finished || this.state.transitioning) return;
            if (this.state.processing) {
                const active = this.state.orders[this.state.phase][this.state.currentIndex];
                this.flashTeaError(`請先完成${active.name}的${this.getTeaStageConfig(this.state.phase).verb}`, item.instanceId || item.id);
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
            const destination = this.state.phase === 'grind' ? '擂缽' : '砧板';
            this.flashTeaError(`${item.name}不能放進${destination}`, item.instanceId || item.id);
            return;
        }
        const expected = this.state.orders[this.state.phase][this.state.currentIndex];
        if (!expected || item.id !== expected.id) {
            this.flashTeaError(`順序錯誤，下一個是${expected ? expected.name : '指定食材'}`, item.instanceId || item.id);
            return;
        }
        const config = this.getTeaStageConfig(this.state.phase);
        this.state.processing = true;
        this.state.activeItemId = item.id;
        this.state.actionProgress = 0;
        this.state.rotationAngle = 0;
        this.state.lastPointerAngle = null;
        this.state.feedback = `${item.name}已放入，開始${config.verb}`;
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
        this.state.feedback = `${item.name}${config.verb}完成！`;
        if (this.state.currentIndex >= this.state.orders[phase].length) {
            this.state.transitioning = true;
            this.renderTeaStage();
            this.timers.push(setTimeout(() => this.completeTeaStage(), 700));
            return;
        }
        const next = this.state.orders[phase][this.state.currentIndex];
        this.state.feedback += ` 下一個是${next.name}`;
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
        this.state.feedback = '時間到，師傅幫你完成剩餘步驟';
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
            this.state.feedback = '配菜時間！先把第一種食材拖上砧板';
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
            this.showCombinedDialogue('afterTea', () => this.close());
            return;
        }
        const usedHelp = this.state.autoCompleted.grind || this.state.autoCompleted.chop;
        this.container.innerHTML = `
            <section class="station-panel station-result-panel tea-result-panel has-guide">
                <div class="station-kicker-line">${this.station.kicker}</div>
                <h1>擂茶組合完成</h1>
                <div class="tea-result-layout">
                    <div class="tea-result-art" role="img" aria-label="擂茶與配菜組合"></div>
                    <div class="tea-result-copy">
                        <p class="station-subtitle">九層塔・薄荷・苦刺心・花生・芝麻</p>
                        <p class="station-subtitle">長豆・菜脯・樹仔菜・豆腐</p>
                        <p class="station-copy">${this.station.success}</p>
                        ${usedHelp ? '<p class="tea-assisted-note">這次有師傅協助補完，下一次試著在倒數內完成吧！</p>' : '<p class="tea-perfect-note">兩段都在時間內完成，手腳真俐落！</p>'}
                    </div>
                </div>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry>再玩一次</button>
                    <button type="button" class="station-secondary" data-back>返回入口</button>
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
        this.station.fireSummary = `分數 ${totalScore}，火候 ${Math.round(this.state.fire)}%，失誤 ${this.state.maxMistakes - this.state.mistakesRemaining} 次。`;
        if (this.mode === 'combined') {
            this.finishCombinedFire();
            return;
        }
        this.showResult(success);
    },

    showResult(success) {
        if (!this.state) return;
        this.state.finished = true;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.stopFireMusic();

        const summary = this.state.stationId === 'fire' && this.station.fireSummary
            ? `${this.station.fireSummary} `
            : '';
        const message = summary + (success ? this.station.success : this.station.fail);
        this.container.innerHTML = `
            <section class="station-panel station-result-panel has-guide">
                <div class="station-kicker-line">${this.station.kicker}</div>
                <h1>${success ? '挑戰成功' : '再試一次'}</h1>
                <p class="station-copy">${message}</p>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry>再玩一次</button>
                    <button type="button" class="station-secondary" data-back>返回入口</button>
                </div>
                <img class="station-guide station-guide-result" src="${this.station.guideImage}" alt="${this.station.guideAlt}">
            </section>
        `;

        this.container.querySelector('[data-retry]').addEventListener('click', () => {
            if (this.state.stationId === 'fire') {
                this.startFireMusic();
                this.startFireGame();
            }
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
        this.clearCombinedTyping();
        this.clearTeaTimer();
        this.stopTeaTrack();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
        this.stopFireMusic();
        this.releaseFireAssets();
        if (this.teaAudioContext) {
            this.teaAudioContext.close().catch(() => {});
            this.teaAudioContext = null;
        }
        if (this.container && this.container.parentNode) this.container.remove();
        this.container = null;
        this.state = null;
        this.mode = null;
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
    if (stationId === 'cradle' && window.CradleStationGame) {
        CradleStationGame.start();
        return;
    }
    if (window.CradleStationGame) CradleStationGame.stop();
    StationDemoGame.start(stationId);
}

window.StationDemoGame = StationDemoGame;
window.startStationDemo = startStationDemo;
