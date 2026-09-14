const FireStationGame = {
    fireMusicSrc: 'assets/sounds/station-fire-theme.mp3',
    fireDurationMs: 60000,
    fireImageUrls: [
        'assets/images/station-fire/background.webp',
        'assets/images/characters/grandma.webp',
        'assets/images/station-fire/stove.webp',
        'assets/images/station-fire/flame-1.webp',
        'assets/images/station-fire/flame-2.webp',
        'assets/images/station-fire/wood-small.webp',
        'assets/images/station-fire/wood-large.webp'
    ],

    warmFireAssets() {
        if (typeof LoadingManager === 'undefined' || !LoadingManager.preloadImages) return Promise.resolve();
        return LoadingManager.preloadImages(FireStationGame.fireImageUrls, { timeoutMs: 12000 }).catch((error) => {
            if (window.Logger) window.Logger.warn('關卡一進場前預載失敗，正式進入時會重試:', error);
        });
    },
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

    startFireGame(game) {
        game.state = {
            stationId: 'fire',
            score: 0,
            combo: 0,
            fire: 50,
            judged: 0,
            beats: [],
            startedAt: 0,
            nextBeatIndex: 0,
            nextSpawnAt: 0,
            fireTargetX: null,
            fireTargetTrackWidth: 0,
            fireTargetY: null,
            fireTargetTrackHeight: 0,
            totalBeats: FireStationGame.fireBeatTimes.length,
            idealMin: 60,
            idealMax: 86,
            safeMin: 46,
            safeMax: 94,
            unstableMs: 0,
            maxMistakes: 5,
            mistakesRemaining: 5,
            durationMs: FireStationGame.fireDurationMs,
            lastTickAt: 0,
            finished: false,
            lastResult: game.tr('station.fire.wait'),
        };

        const stoveImage = FireStationGame.getFireAsset(game, 'assets/images/station-fire/stove.webp');
        const smallFlameImage = FireStationGame.getFireAsset(game, 'assets/images/station-fire/flame-1.webp');

        game.container.innerHTML = `
            <div class="station-play is-preparing">
                <div class="station-hud">
                    <div>${game.station.kicker}</div>
                    <div>${game.tr('station.fire.hud.score')} <span data-score>0</span></div>
                    <div>${game.tr('station.fire.hud.heat')} <span data-fire>50</span>%</div>
                    <div>${game.tr('station.fire.hud.time')} <span data-time>60</span> ${game.tr('station.fire.hud.seconds')}</div>
                </div>
                <button type="button" class="station-corner-exit" data-exit aria-label="${game.tr('game.backToEntrance')}">${game.tr('game.back')}</button>
                <div class="fire-help-row">
                    <span>${game.tr('station.fire.help.wood')}</span>
                    <span data-water-hint>${game.tr('station.fire.help.water')}</span>
                </div>
                <div class="fire-track" aria-label="${game.tr('station.fire.track')}">
                    <div class="fire-danger-alert" data-fire-danger>${game.tr('station.fire.danger')}</div>
                    <div class="fire-target">
                        <img class="fire-stove-img" src="${stoveImage}" alt="${game.tr('station.fire.stove')}">
                        <img class="fire-flame-img" data-flame src="${smallFlameImage}" alt="${game.tr('station.fire.flame')}">
                        <div class="fire-water-burst" data-water-effect aria-hidden="true">
                            <span></span><span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
                <div class="station-feedback">${game.tr('station.fire.wait')}</div>
                <div class="fire-meter-wrap">
                    <span class="fire-meter-label">${game.tr('station.fire.meter.label')}</span>
                    <div class="fire-meter">
                        <div class="fire-ideal-zone"></div>
                        <span></span>
                    </div>
                </div>
                <div class="fire-score-layer" data-score-layer aria-hidden="true"></div>
                <div class="station-actions compact">
                    <button type="button" class="station-primary" data-hit>${game.tr('station.fire.addWood')}</button>
                </div>
                <button type="button" class="station-water station-water-fixed" data-water>${game.tr('station.fire.sprayWater')}</button>
            </div>
        `;

        game.container.querySelector('[data-hit]').addEventListener('click', () => FireStationGame.hitFireBeat(game));
        game.container.querySelector('[data-water]').addEventListener('click', () => FireStationGame.sprayWater(game));
        game.container.querySelector('[data-exit]').addEventListener('click', () => game.close());
        game.keyHandler = (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                FireStationGame.hitFireBeat(game);
            }
            if (event.key === 'w' || event.key === 'W' || event.key === '水') {
                event.preventDefault();
                FireStationGame.sprayWater(game);
            }
        };
        window.addEventListener('keydown', game.keyHandler);

        FireStationGame.renderFireHud(game);
        FireStationGame.waitForFireGameReady(game)
            .then(() => FireStationGame.showFireGuide(game))
            .catch((error) => FireStationGame.showFireLoadError(game, error));
    },

    showFireGuide(game) {
        if (!game.state || game.state.finished || game.state.stationId !== 'fire') return;
        const play = game.container?.querySelector('.station-play');
        // 在使用者手勢內起 BGM（startFireMusic 會吞掉被瀏覽器阻擋的例外）。
        const begin = () => {
            FireStationGame.startFireMusic(game);
            FireStationGame.beginFireLoop(game);
        };
        if (game.fireGuideShown || !play || typeof StationIntroGuide === 'undefined') {
            begin();
            return;
        }

        // 素材已就緒，先讓真實 HUD 顯示在遮罩下，但不啟動節奏迴圈與音樂。
        if (typeof LoadingManager !== 'undefined') LoadingManager.finish();
        play.classList.remove('is-preparing');
        game.fireGuideShown = true;

        StationIntroGuide.start({
            host: play,
            steps: [
                { selector: '[data-hit]', textKey: 'station.fire.guide.wood' },
                { selector: '[data-water]', textKey: 'station.fire.guide.water' }
            ],
            onFinish: begin
        });
    },

    beginFireLoop(game) {
        if (!game.state || game.state.finished || game.state.stationId !== 'fire') return;
        window.GameAnalytics?.start('fire', game.fullStory ? 'full_story' : game.mode || 'standalone');
        const play = game.container.querySelector('.station-play');
        if (play) play.classList.remove('is-preparing');
        if (typeof LoadingManager !== 'undefined') LoadingManager.finish();

        FireStationGame.syncFireMusicToGameStart(game)
            .then(() => {
                game.animationId = requestAnimationFrame((time) => {
                    if (!game.state || game.state.finished) return;
                    game.state.startedAt = time;
                    game.state.lastTickAt = time;
                    FireStationGame.renderFireHud(game);
                    game.animationId = requestAnimationFrame((nextTime) => FireStationGame.tickFire(game, nextTime));
                });
            })
            .catch((error) => FireStationGame.showFireLoadError(game, error));
    },

    waitForFireGameReady(game) {
        if (typeof LoadingManager !== 'undefined') {
            LoadingManager.loadingScreen.style.display = 'flex';
            LoadingManager.updateProgress(100);
        }

        const domImages = Array.from(game.container.querySelectorAll('.fire-stove-img, .fire-flame-img'));
        const domReady = domImages.map((img) => FireStationGame.waitForImageElement(img));

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

    prepareFireAssets(game) {
        if (game.fireAssetUrls && FireStationGame.fireImageUrls.every((src) => game.fireAssetUrls.has(src))) {
            return Promise.resolve();
        }

        if (typeof LoadingManager !== 'undefined' && LoadingManager.loadingScreen) {
            LoadingManager.loadingScreen.style.display = 'flex';
            LoadingManager.updateProgress(0);
        }

        FireStationGame.releaseFireAssets(game);
        const loadedAssets = new Map();
        let loadedCount = 0;
        return Promise.all(FireStationGame.fireImageUrls.map((src) => FireStationGame.fetchDecodedFireImage(src).then((objectUrl) => {
            loadedAssets.set(src, objectUrl);
            loadedCount++;
            if (typeof LoadingManager !== 'undefined') {
                LoadingManager.updateProgress(Math.round((loadedCount / FireStationGame.fireImageUrls.length) * 100));
            }
        }))).then(() => {
            game.fireAssetUrls = loadedAssets;
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
                return FireStationGame.decodeFireBlob(blob, src);
            })
            .catch((error) => {
                if (attempt < 1) return FireStationGame.fetchDecodedFireImage(src, attempt + 1);
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

    getFireAsset(game, src) {
        return game.fireAssetUrls && game.fireAssetUrls.get(src) || src;
    },

    releaseFireAssets(game) {
        if (!game.fireAssetUrls) return;
        game.fireAssetUrls.forEach((url) => URL.revokeObjectURL(url));
        game.fireAssetUrls = null;
    },

    showFireLoadError(game, error) {
        if (window.Logger) window.Logger.error('關卡一圖片準備失敗:', error);
        if (typeof LoadingManager !== 'undefined') LoadingManager.finish();
        if (!game.container) return;
        game.container.innerHTML = `
            <section class="station-panel station-intro-panel">
                <div class="station-kicker-line">${game.station.kicker}</div>
                <h1>${game.tr('station.fire.load.title')}</h1>
                <p class="station-copy">${game.tr('station.fire.load.copy')}</p>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry-load>${game.tr('game.retryLoad')}</button>
                    <button type="button" class="station-secondary" data-back>${game.tr('game.backToEntrance')}</button>
                </div>
            </section>
        `;
        game.container.querySelector('[data-retry-load]').addEventListener('click', () => {
            FireStationGame.prepareFireAssets(game)
                .then(() => FireStationGame.startFireGame(game))
                .catch((retryError) => FireStationGame.showFireLoadError(game, retryError));
        });
        game.container.querySelector('[data-back]').addEventListener('click', () => game.close());
    },

    tickFire(game, time) {
        if (!game.state || game.state.finished) return;

        const elapsed = FireStationGame.getFireElapsedMs(game, time);
        const delta = Math.min(80, time - game.state.lastTickAt);
        game.state.lastTickAt = time;

        while (
            game.state.nextBeatIndex < game.state.totalBeats &&
            elapsed >= FireStationGame.getFireSpawnAt(game.state.nextBeatIndex)
        ) {
            FireStationGame.spawnFireBeat(game, time);
            game.state.nextBeatIndex++;
        }

        const track = game.container.querySelector('.fire-track');
        const trackWidth = track ? track.clientWidth : 1;
        const targetX = FireStationGame.getFireTargetX(game, trackWidth);
        const targetY = FireStationGame.getFireTargetY(game, trackWidth);
        const stillActive = [];

        game.state.beats.forEach((beat) => {
            const progress = (elapsed - beat.spawnedAtMs) / beat.travelMs;
            // 木柴由右向左飄向灶口，高度對齊灶口實際位置。
            const startX = trackWidth + beat.el.offsetWidth;
            const x = startX + (progress * (targetX - startX));
            beat.el.style.left = `${x}px`;
            if (targetY !== null) beat.el.style.top = `${targetY}px`;

            if (!beat.hit && x < targetX - 100) {
                beat.hit = true;
                FireStationGame.applyFireScore(game, game.tr('station.fire.missed'), -8, -10, true, true);
                beat.el.remove();
                return;
            }

            if (progress <= 1.12 && !beat.hit) stillActive.push(beat);
            else beat.el.remove();
        });

        game.state.beats = stillActive;
        FireStationGame.updateFireStability(game, delta);
        FireStationGame.renderFireHud(game);

        if (elapsed >= game.state.durationMs) {
            FireStationGame.showFireResult(game);
            return;
        }

        game.animationId = requestAnimationFrame((nextTime) => FireStationGame.tickFire(game, nextTime));
    },

    spawnFireBeat(game, time) {
        const track = game.container.querySelector('.fire-track');
        if (!track) return;
        const type = Math.random() < 0.36 ? 'big' : 'small';
        const beat = document.createElement('div');
        beat.className = `fire-beat ${type === 'big' ? 'big' : 'small'}`;
        const woodImage = type === 'big'
            ? FireStationGame.getFireAsset(game, 'assets/images/station-fire/wood-large.webp')
            : FireStationGame.getFireAsset(game, 'assets/images/station-fire/wood-small.webp');
        beat.innerHTML = `
            <img src="${woodImage}" alt="${game.tr(type === 'big' ? 'station.fire.wood.big' : 'station.fire.wood.small')}">
            <span>${game.tr(type === 'big' ? 'station.fire.wood.big' : 'station.fire.wood.small')}</span>
        `;
        track.appendChild(beat);
        game.state.beats.push({
            el: beat,
            type,
            spawnedAtMs: FireStationGame.getFireSpawnAt(game.state.nextBeatIndex),
            targetAtMs: FireStationGame.fireBeatTimes[game.state.nextBeatIndex] * 1000,
            travelMs: FireStationGame.getFireTravelMs(game.state.nextBeatIndex),
            hit: false
        });
    },

    hitFireBeat(game) {
        if (!game.state || game.state.finished) return;

        const track = game.container.querySelector('.fire-track');
        const trackWidth = track ? track.clientWidth : 1;
        const targetX = FireStationGame.getFireTargetX(game, trackWidth);
        let best = null;
        let bestDistance = Infinity;

        game.state.beats.forEach((beat) => {
            if (beat.hit) return;
            const x = parseFloat(beat.el.style.left || '0');
            const distance = Math.abs(x - targetX);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = beat;
            }
        });

        if (!best) {
            FireStationGame.applyFireScore(game, game.tr('station.fire.tooEarly'), -8, -3, false, true);
            return;
        }

        if (bestDistance > 120) {
            best.hit = true;
            best.el.remove();
            FireStationGame.applyFireScore(game, game.tr('station.fire.misaligned'), -12, -8, true, true);
            return;
        }

        best.hit = true;
        best.el.remove();
        const woodLabel = game.tr(best.type === 'big' ? 'station.fire.wood.big' : 'station.fire.wood.small');
        const fireDelta = best.type === 'big' ? 13 : 7;
        const basePoints = bestDistance <= 38 ? 55 : 35;
        const timingLabel = game.tr(bestDistance <= 38 ? 'station.fire.timing.perfect' : 'station.fire.timing.hit');

        if (game.state.fire > game.state.idealMax) {
            FireStationGame.applyFireScore(game, game.tr('station.fire.tooHot', { wood: woodLabel }), -25, fireDelta, true, true);
        } else if (FireStationGame.isFireInIdealRange(game)) {
            FireStationGame.applyFireScore(game, game.tr('station.fire.heat.right', { timing: timingLabel, wood: woodLabel }), basePoints + 45, fireDelta);
        } else if (game.state.fire < game.state.idealMin) {
            FireStationGame.applyFireScore(game, game.tr('station.fire.heat.recover', { timing: timingLabel, wood: woodLabel }), basePoints + 15, fireDelta);
        } else {
            FireStationGame.applyFireScore(game, game.tr('station.fire.heat.neutral', { timing: timingLabel, wood: woodLabel }), basePoints, fireDelta);
        }
    },

    applyFireScore(game, label, points, fireDelta, countJudgement = true, countMistake = false) {
        if (!game.state || game.state.finished) return;
        if (countJudgement) game.state.judged++;
        if (countMistake) game.state.mistakesRemaining = Math.max(0, game.state.mistakesRemaining - 1);
        game.state.score = Math.max(0, game.state.score + points);
        game.state.fire = Math.max(0, Math.min(100, game.state.fire + fireDelta));
        const feedback = countMistake ? game.tr('station.fire.penalty', { label }) : label;
        game.state.lastResult = feedback;
        game.container.querySelector('.station-feedback').textContent = feedback;
        FireStationGame.showFireScorePop(game, points);
        FireStationGame.playFireWoodSound(game, points >= 0);
        FireStationGame.renderFireHud(game);
    },

    sprayWater(game) {
        if (!game.state || game.state.finished || game.state.stationId !== 'fire') return;
        const wasTooHot = game.state.fire > game.state.idealMax;
        // 畫面上「安全火候」黃框顯示的就是 idealMin~idealMax，扣分／不扣分要跟這個框對齊，而不是另一組沒畫出來的 safeMin~safeMax。
        const belowSafeZone = game.state.fire < game.state.idealMin;
        const wasAboveSafeZone = game.state.fire > game.state.safeMax;
        game.state.fire = Math.max(0, game.state.fire - 7);
        // 大火時維持原本加分（超過 safeMax 更高熱再多給一些）；安全火候框內噴水只降火，不扣分；低於安全火候框才扣分。
        const points = wasTooHot ? (wasAboveSafeZone ? 20 : 12) : (belowSafeZone ? -8 : 0);
        game.state.score = Math.max(0, game.state.score + points);
        const waterEffect = game.container.querySelector('[data-water-effect]');
        if (waterEffect) {
            waterEffect.classList.remove('active');
            void waterEffect.offsetWidth;
            waterEffect.classList.add('active');
        }
        game.container.querySelector('.station-feedback').textContent = game.state.fire > game.state.idealMax
            ? game.tr('station.fire.water.more')
            : wasTooHot ? game.tr('station.fire.water.recovered') : game.tr('station.fire.water.notNeeded');
        if (points !== 0) FireStationGame.showFireScorePop(game, points);
        FireStationGame.renderFireHud(game);
    },

    getFireProgress(game, index) {
        if (!game.state || game.state.totalBeats <= 1) return 0;
        return Math.max(0, Math.min(1, index / (game.state.totalBeats - 1)));
    },

    getFireTravelMs(index) {
        // 縮短 travel 讓木柴移動更快、鼓點更明確。
        return index < 4 ? 1900 : 1780;
    },

    getFireSpawnAt(index) {
        return Math.max(0, (FireStationGame.fireBeatTimes[index] * 1000) - FireStationGame.getFireTravelMs(index));
    },

    getFireElapsedMs(game, time) {
        if (!game.state.startedAt) return 0;
        if (game.fireMusicStarted && game.fireMusic && !game.fireMusic.paused) {
            return game.fireMusic.currentTime * 1000;
        }
        return time - game.state.startedAt;
    },

    getFireTargetX(game, trackWidth) {
        if (game.state?.fireTargetX !== null && game.state?.fireTargetTrackWidth === trackWidth) {
            return game.state.fireTargetX;
        }
        const track = game.container?.querySelector('.fire-track');
        const flame = game.container?.querySelector('.fire-flame-img');
        if (track && flame) {
            const trackBounds = track.getBoundingClientRect();
            const flameBounds = flame.getBoundingClientRect();
            const targetX = flameBounds.left + flameBounds.width / 2 - trackBounds.left;
            game.state.fireTargetX = targetX;
            game.state.fireTargetTrackWidth = trackWidth;
            return targetX;
        }
        return trackWidth * 0.15;
    },

    // 木柴的飄動高度要對齊灶口（火焰元素）實際渲染的垂直中心，不能只固定在軌道正中間，
    // 否則在灶台圖片較高／灶口偏下的版面（例如手機橫向）柴火會飄在灶口上方。
    getFireTargetY(game, trackWidth) {
        if (game.state?.fireTargetY !== null && game.state?.fireTargetTrackHeight === trackWidth) {
            return game.state.fireTargetY;
        }
        const track = game.container?.querySelector('.fire-track');
        const flame = game.container?.querySelector('.fire-flame-img');
        if (track && flame) {
            const trackBounds = track.getBoundingClientRect();
            const flameBounds = flame.getBoundingClientRect();
            const targetY = flameBounds.top + flameBounds.height / 2 - trackBounds.top;
            game.state.fireTargetY = targetY;
            game.state.fireTargetTrackHeight = trackWidth;
            return targetY;
        }
        return null;
    },

    updateFireStability(game, delta) {
        const inIdeal = FireStationGame.isFireInIdealRange(game);
        // 火候自然消退比原本稍快，讓玩家不操作時更快回到需要補柴的狀態。
        const drift = game.state.fire > game.state.idealMax ? -0.005 : -0.006;
        game.state.fire = Math.max(0, Math.min(100, game.state.fire + (drift * delta)));

        if (inIdeal) {
            game.state.unstableMs = Math.max(0, game.state.unstableMs - delta * 0.4);
        } else {
            game.state.unstableMs += delta;
        }

        if (!FireStationGame.isFireInSafeRange(game) && game.state.unstableMs > 3200) game.state.unstableMs = 3200;
    },

    isFireInIdealRange(game) {
        return game.state.fire >= game.state.idealMin && game.state.fire <= game.state.idealMax;
    },

    isFireInSafeRange(game) {
        return game.state.fire >= game.state.safeMin && game.state.fire <= game.state.safeMax;
    },

    renderFireHud(game) {
        const score = game.container.querySelector('[data-score]');
        const fire = game.container.querySelector('[data-fire]');
        const time = game.container.querySelector('[data-time]');
        const meter = game.container.querySelector('.fire-meter span');
        const idealZone = game.container.querySelector('.fire-ideal-zone');
        const waterHint = game.container.querySelector('[data-water-hint]');
        const waterButton = game.container.querySelector('[data-water]');
        const dangerAlert = game.container.querySelector('[data-fire-danger]');
        const flame = game.container.querySelector('[data-flame]');
        if (score) score.textContent = game.state.score;
        if (fire) fire.textContent = Math.round(game.state.fire);
        if (time) {
            const elapsed = FireStationGame.getFireElapsedMs(game, performance.now());
            time.textContent = Math.max(0, Math.ceil((game.state.durationMs - elapsed) / 1000));
        }
        if (meter) meter.style.width = `${game.state.fire}%`;
        if (idealZone) {
            idealZone.style.left = `${game.state.idealMin}%`;
            idealZone.style.width = `${game.state.idealMax - game.state.idealMin}%`;
        }
        const needsWater = game.state.fire > game.state.idealMax;
        if (waterHint) waterHint.classList.toggle('active', needsWater);
        if (waterButton) waterButton.classList.toggle('needs-water', needsWater);
        if (dangerAlert) dangerAlert.classList.toggle('active', game.state.fire > game.state.safeMax);
        if (flame) {
            const flameSrc = game.state.fire > game.state.idealMax
                ? FireStationGame.getFireAsset(game, 'assets/images/station-fire/flame-2.webp')
                : FireStationGame.getFireAsset(game, 'assets/images/station-fire/flame-1.webp');
            if (flame.src !== flameSrc) flame.src = flameSrc;
            // 火焰隨火候長大，但幅度收斂，避免超出灶門。
            const flameScale = 0.78 + (game.state.fire / 150);
            flame.style.transform = `translateX(-50%) scale(${flameScale})`;
        }
    },

    showFireScorePop(game, points, prefix = '') {
        if (!game.container || !Number.isFinite(points)) return;
        const layer = game.container.querySelector('[data-score-layer]');
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
        game.timers.push(setTimeout(() => {
            if (pop.parentNode) pop.remove();
        }, 900));
    },

    showFireResult(game) {
        if (!game.state || game.state.stationId !== 'fire') return;
        const fireScore = Math.max(0, 100 - Math.abs(game.state.fire - 73) * 2);
        const mistakeBonus = game.state.mistakesRemaining * 40;
        const totalScore = Math.round(game.state.score + fireScore + mistakeBonus);
        const success = totalScore >= 2400 && FireStationGame.isFireInSafeRange(game);
        game.state.score = totalScore;
        game.station.fireSummary = game.tr('station.fire.summary', {
            score: totalScore
        });
        // 灶台結果頁在單關版與融合版都會顯示，再由「去找阿罵」進入離開引導對話。
        if (game.animationId) cancelAnimationFrame(game.animationId);
        game.animationId = null;
        FireStationGame.stopFireMusic(game);
        window.GameAnalytics?.complete('fire');
        game.showResult(success);
    },

    playFireWoodSound(game, strong = true) {
        const context = game.getGameAudioContext();
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

        const texture = game.createGameNoiseSource(context, duration * 0.75);
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

    startFireMusic(game) {
        if (!game.fireMusic) {
            game.fireMusic = new Audio(FireStationGame.fireMusicSrc);
            game.fireMusic.loop = true;
            game.fireMusic.volume = 0.20;
            game.fireMusic.preload = 'auto';
        }

        game.fireMusic.currentTime = 0;
        return game.fireMusic.play().then(() => {
            game.fireMusicStarted = true;
        }).catch((error) => {
            game.fireMusicStarted = false;
            if (window.Logger) window.Logger.warn('⚠️ 關卡一音樂播放被瀏覽器阻擋:', error);
        });
    },

    syncFireMusicToGameStart(game) {
        if (!game.fireMusic) {
            return FireStationGame.startFireMusic(game);
        }

        try {
            game.fireMusic.currentTime = 0;
        } catch (error) {
            if (window.Logger) window.Logger.warn('⚠️ 關卡一音樂重設失敗:', error);
        }

        return game.fireMusic.play().then(() => {
            game.fireMusicStarted = true;
        }).catch((error) => {
            game.fireMusicStarted = false;
            if (window.Logger) window.Logger.warn('⚠️ 關卡一音樂播放被瀏覽器阻擋:', error);
            throw error;
        });
    },

    stopFireMusic(game) {
        if (!game.fireMusic) return;
        game.fireMusic.pause();
        game.fireMusic.currentTime = 0;
        game.fireMusicStarted = false;
    }
};

window.FireStationGame = FireStationGame;
