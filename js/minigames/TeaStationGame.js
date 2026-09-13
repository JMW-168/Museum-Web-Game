const TeaStationGame = {
    teaStageDurationMs: 45000,
    teaSpawnIntervalMs: 975,
    teaTravelMs: 1950,
    teaEssentialImageUrls: [
        'assets/images/station-tea/basil.png',
        'assets/images/station-tea/mint.png',
        'assets/images/station-tea/kuding.png',
        'assets/images/station-tea/peanut.png',
        'assets/images/station-tea/sesame.png',
        'assets/images/station-tea/pestle.png',
        'assets/images/station-tea/mortar-1.png',
        'assets/images/station-tea/mortar-2.png',
        'assets/images/station-tea/mortar-3.png',
        'assets/images/station-tea/mortar-4.png',
        'assets/images/station-fire/wood-small.png',
        'assets/images/station-fire/wood-large.png',
        'assets/images/station-tea/stone.png'
    ],
    teaDeferredImageUrls: [
        'assets/images/station-tea/chop-tool-sprites-v2.png',
        'assets/images/station-tea/long-bean.png',
        'assets/images/station-tea/radish.png',
        'assets/images/station-tea/tree-veg.png',
        'assets/images/station-tea/tofu.png',
        'assets/images/station-tea/knife.png',
        'assets/images/station-tea/chopped-bowls-strip.png',
        'assets/images/station-tea/tea-result-v2.png'
    ],
    teaAssetTimeoutMs: 12000,

    startCombinedTea(game) {
        game.station = game.getStation('tea');
        game.setShellTheme('tea');
        return TeaStationGame.beginTeaAssetLoad(game);
    },

    beginTeaAssetLoad(game) {
        const loadHost = game.container;
        TeaStationGame.showTeaLoading(game);
        return TeaStationGame.prepareTeaAssets()
            .then(() => {
                if (!loadHost || game.container !== loadHost) return;
                TeaStationGame.preloadDeferredTeaAssets();
                TeaStationGame.startTeaGame(game);
            })
            .catch((error) => {
                if (!loadHost || game.container !== loadHost) return;
                TeaStationGame.showTeaLoadError(game, error);
            });
    },

    showTeaLoading(game) {
        if (!game.container) return;
        game.container.innerHTML = `
            <section class="station-panel station-result-panel tea-loading-panel" aria-live="polite" aria-busy="true">
                <button type="button" class="station-secondary station-corner-exit" data-exit>${game.tr('story.action.leave')}</button>
                <div class="station-kicker-line">${game.station.kicker}</div>
                <h1>${game.tr('station.tea.loading.title')}</h1>
                <p class="station-copy">${game.tr('station.tea.loading.copy')}</p>
                <span class="tea-loading-spinner" aria-hidden="true"></span>
            </section>
        `;
        game.container.querySelector('[data-exit]').addEventListener('click', () => game.close());
    },

    getTeaStageConfig(game, stageId) {
        const stages = {
            grind: {
                title: game.tr('station.tea.grind.title'),
                verb: game.tr('station.tea.grind.verb'),
                target: 5,
                unit: game.tr('station.tea.grind.unit'),
                toolClass: 'grind',
                items: [
                    { id: 'kuding', name: game.tr('ingredient.kuding'), image: 'assets/images/station-tea/kuding.png' },
                    { id: 'mint', name: game.tr('ingredient.mint'), image: 'assets/images/station-tea/mint.png' },
                    { id: 'basil', name: game.tr('ingredient.basil'), image: 'assets/images/station-tea/basil.png' },
                    { id: 'sesame', name: game.tr('ingredient.sesame'), image: 'assets/images/station-tea/sesame.png' },
                    { id: 'peanut', name: game.tr('ingredient.peanut'), image: 'assets/images/station-tea/peanut.png' }
                ]
            },
            chop: {
                title: game.tr('station.tea.chop.title'),
                verb: game.tr('station.tea.chop.verb'),
                target: 6,
                unit: game.tr('station.tea.chop.unit'),
                toolClass: 'chop',
                items: [
                    { id: 'long-bean', name: game.tr('ingredient.longBean'), image: 'assets/images/station-tea/long-bean.png' },
                    { id: 'radish', name: game.tr('ingredient.radish'), image: 'assets/images/station-tea/radish.png' },
                    { id: 'tree-veg', name: game.tr('ingredient.treeVeg'), image: 'assets/images/station-tea/tree-veg.png' },
                    { id: 'tofu', name: game.tr('ingredient.tofu'), image: 'assets/images/station-tea/tofu.png' }
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

    loadTeaImages(urls, timeoutMs = 0) {
        const request = Promise.all(urls.map((src) => new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = resolve;
            image.onerror = () => reject(new Error(`無法載入 ${src}`));
            image.src = src;
        })));
        if (!timeoutMs) return request;
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`素材載入超過 ${timeoutMs}ms`)), timeoutMs);
            request.then(
                (images) => {
                    clearTimeout(timeout);
                    resolve(images);
                },
                (error) => {
                    clearTimeout(timeout);
                    reject(error);
                }
            );
        });
    },

    prepareTeaAssets() {
        return TeaStationGame.loadTeaImages(TeaStationGame.teaEssentialImageUrls, TeaStationGame.teaAssetTimeoutMs);
    },

    preloadDeferredTeaAssets() {
        TeaStationGame.loadTeaImages(TeaStationGame.teaDeferredImageUrls).catch((error) => {
            if (window.Logger) window.Logger.warn('關卡二後續素材背景載入失敗，進入階段時會再次請求:', error);
        });
    },

    showTeaLoadError(game, error) {
        if (window.Logger) window.Logger.error('關卡二圖片準備失敗:', error);
        if (!game.container) return;
        game.container.innerHTML = `
            <section class="station-panel station-result-panel">
                <div class="station-kicker-line">${game.station.kicker}</div>
                <h1>${game.tr('station.tea.load.title')}</h1>
                <p class="station-copy">${game.tr('station.tea.load.copy')}</p>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry-load>${game.tr('game.retryLoad')}</button>
                    <button type="button" class="station-secondary" data-back>${game.tr('game.backToEntrance')}</button>
                </div>
            </section>
        `;
        game.container.querySelector('[data-retry-load]').addEventListener('click', () => {
            TeaStationGame.beginTeaAssetLoad(game);
        });
        game.container.querySelector('[data-back]').addEventListener('click', () => game.close());
    },

    startTeaGame(game) {
        TeaStationGame.clearTeaTimer(game);
        TeaStationGame.stopTeaTrack(game);
        const grind = TeaStationGame.getTeaStageConfig(game, 'grind');
        const chop = TeaStationGame.getTeaStageConfig(game, 'chop');
        game.state = {
            stationId: 'tea',
            phase: 'grind',
            orders: {
                // 研磨與配菜皆採固定順序，提示與完成素材才能穩定對應。
                grind: grind.items.map((item) => ({ ...item })),
                // 配菜固定順序，才能讓完成的小碗依固定位置逐格出現。
                chop: chop.items.map((item) => ({ ...item }))
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
            timeLeft: TeaStationGame.teaStageDurationMs / 1000,
            stageDeadline: 0,
            transitioning: false,
            feedback: game.tr('station.tea.firstIngredient', { item: grind.items[0].name }),
            finished: false
        };
        TeaStationGame.renderTeaStage(game);
        TeaStationGame.showTeaGuide(game);
    },

    showTeaGuide(game) {
        const play = game.container?.querySelector('.tea-play');
        const begin = () => {
            if (!game.state || game.state.stationId !== 'tea' || game.state.finished) return;
            TeaStationGame.startTeaTrack(game);
            TeaStationGame.startTeaTimer(game);
        };
        if (game.teaGuideShown || !play || typeof StationIntroGuide === 'undefined') {
            begin();
            return;
        }
        game.teaGuideShown = true;
        TeaStationGame.stopTeaTrack(game); // 說明期間先停住流動軌道與倒數
        StationIntroGuide.start({
            host: play,
            steps: [
                { selector: '[data-tea-order]', textKey: 'station.tea.guide.order' },
                { selector: '[data-tea-track]', textKey: 'station.tea.guide.pick' },
                { selector: '[data-tea-drop]', textKey: 'station.tea.guide.process' }
            ],
            onFinish: begin
        });
    },

    renderTeaStage(game) {
        if (!game.container || !game.state || game.state.stationId !== 'tea') return;
        TeaStationGame.stopTeaTrack(game);
        const config = TeaStationGame.getTeaStageConfig(game, game.state.phase);
        const order = game.state.orders[game.state.phase];
        const completed = game.state.completed[game.state.phase];
        const expected = order[game.state.currentIndex];
        const orderMarkup = order.map((item, index) => {
            const status = completed.includes(item.id)
                ? 'done'
                : index === game.state.currentIndex ? 'current' : '';
            return `<span class="${status}"><b>${index + 1}</b>${item.name}${status === 'done' ? ' ✓' : ''}</span>`;
        }).join('');
        const ingredientSourceMarkup = `<div class="tea-moving-track" data-tea-track aria-label="${game.tr('station.tea.track')}"><span class="tea-track-hint">${game.tr('station.tea.trackHint')}</span></div>`;
        const progressText = game.state.processing
            ? `${game.state.actionProgress}/${config.target} ${config.unit}`
            : game.tr('station.tea.waiting', { item: expected ? expected.name : game.tr('station.tea.done') });
        const progressPercent = game.state.processing
            ? Math.min(100, game.state.actionProgress / config.target * 100)
            : 0;
        const activeItem = game.state.processing
            ? config.items.find((item) => item.id === game.state.activeItemId)
            : null;
        const activeIngredientMarkup = activeItem
            ? `<span class="tea-processing-ingredient ${game.state.phase}" aria-label="${activeItem.name}">
                    <img class="tea-ingredient-art" src="${activeItem.image}" alt="">
               </span>`
            : '';
        const choppedBowlsMarkup = game.state.phase === 'chop'
            ? `<div class="tea-chopped-bowls" aria-label="${game.tr('station.tea.choppedBowls')}">
                ${config.items.map((item, index) => `
                    <span class="tea-chopped-bowl${completed.includes(item.id) ? ' is-ready' : ''}"
                        style="--tea-bowl-x:${index * (100 / (config.items.length - 1))}%"
                        role="img" aria-label="${item.name}" aria-hidden="${completed.includes(item.id) ? 'false' : 'true'}"></span>
                `).join('')}
               </div>`
            : '';
        const toolMarkup = game.state.phase === 'grind'
            ? `
                <img class="tea-mortar-art" data-tea-mortar src="${TeaStationGame.getTeaMortarImage(game)}" alt="">
                ${activeIngredientMarkup}
                <img class="tea-pestle-art" data-tea-pestle src="assets/images/station-tea/pestle.png" alt="">
            `
            : `
                <span class="tea-cutting-board-art" aria-hidden="true"></span>
                ${activeIngredientMarkup}
                <img class="tea-knife-art" src="assets/images/station-tea/knife.png" alt="">
                ${choppedBowlsMarkup}
            `;

        game.container.innerHTML = `
            <div class="station-play tea-play">
                <button type="button" class="station-secondary station-corner-exit" data-exit>${game.tr('story.action.leave')}</button>
                <div class="station-hud tea-hud">
                    <span>${config.title}</span>
                    <span>${game.tr('station.tea.progress', { current: Math.min(game.state.currentIndex + 1, order.length), total: order.length })}</span>
                    <span class="tea-timer${game.state.timeLeft <= 5 ? ' urgent' : ''}">${game.tr('station.tea.remaining', { seconds: `<b data-tea-time>${Math.ceil(game.state.timeLeft)}</b>` })}</span>
                </div>
                <div class="tea-order" data-tea-order aria-label="${game.tr('station.tea.order')}">${orderMarkup}</div>
                <div class="tea-game-area">
                    ${ingredientSourceMarkup}
                    <div class="tea-workspace">
                        <div class="station-feedback tea-feedback" aria-live="polite">${game.state.feedback}</div>
                        <div class="tea-drop-zone ${config.toolClass}${game.state.processing ? ' processing' : ''}" data-tea-drop>
                            ${toolMarkup}
                            ${game.state.phase === 'grind' || game.state.processing
                                ? `<span class="tea-action-progress ${game.state.phase}">${progressText}</span>`
                                : ''}
                            <span class="tea-action-meter"><i style="width:${progressPercent}%"></i></span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        game.container.querySelector('[data-exit]').addEventListener('click', () => game.close());
        TeaStationGame.startTeaTrack(game);
        if (game.state.processing) {
            if (game.state.phase === 'grind') TeaStationGame.bindTeaGrinding(game);
            if (game.state.phase === 'chop') TeaStationGame.bindTeaChopping(game);
        }
    },

    startTeaTrack(game) {
        if (!game.state || game.state.finished || !['grind', 'chop'].includes(game.state.phase)) return;
        TeaStationGame.stopTeaTrack(game);
        game.state.movingItems = [];
        game.state.teaLastFrameAt = 0;
        game.state.teaLastSpawnAt = 0;
        game.teaAnimationId = requestAnimationFrame((time) => TeaStationGame.tickTeaTrack(game, time));
    },

    stopTeaTrack(game) {
        if (game.teaAnimationId) cancelAnimationFrame(game.teaAnimationId);
        game.teaAnimationId = null;
        if (!game.state?.movingItems) return;
        game.state.movingItems.forEach((entry) => {
            if (entry.el?.parentNode) entry.el.remove();
        });
        game.state.movingItems = [];
    },

    tickTeaTrack(game, time) {
        if (!game.state || game.state.finished || !['grind', 'chop'].includes(game.state.phase)) {
            game.teaAnimationId = null;
            return;
        }
        const track = game.container?.querySelector('[data-tea-track]');
        if (!track) {
            game.teaAnimationId = null;
            return;
        }
        if (!game.state.teaLastFrameAt) {
            game.state.teaLastFrameAt = time;
            game.state.teaLastSpawnAt = time - TeaStationGame.teaSpawnIntervalMs;
        }
        const delta = Math.min(80, time - game.state.teaLastFrameAt);
        game.state.teaLastFrameAt = time;
        if (time - game.state.teaLastSpawnAt >= TeaStationGame.teaSpawnIntervalMs) {
            TeaStationGame.spawnTeaTrackItem(game, track);
            game.state.teaLastSpawnAt = time;
        }

        const trackWidth = Math.max(1, track.clientWidth);
        const speed = (trackWidth * (1 - 0.24)) / TeaStationGame.teaTravelMs;
        const active = [];
        game.state.movingItems.forEach((entry) => {
            if (!entry.dragging) entry.x -= speed * delta;
            if (entry.el?.isConnected) entry.el.style.left = `${entry.x}px`;
            const halfWidth = Math.max(36, (entry.el?.offsetWidth || 72) / 2);
            if (entry.x >= -halfWidth || entry.dragging) active.push(entry);
            else if (entry.el?.parentNode) entry.el.remove();
        });
        game.state.movingItems = active;
        game.teaAnimationId = requestAnimationFrame((nextTime) => TeaStationGame.tickTeaTrack(game, nextTime));
    },

    spawnTeaTrackItem(game, track) {
        if (!game.state || !track) return;
        game.state.teaSpawnPatternIndex++;
        const shouldSpawnDecoy = Math.random() < (1 / 3);
        const item = shouldSpawnDecoy ? TeaStationGame.getTeaDecoyItem(game) : TeaStationGame.getTeaMovingIngredient(game);
        if (!item) return;

        const instanceId = `${item.id}-${Date.now()}-${game.state.teaSpawnPatternIndex}`;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `tea-ingredient-card tea-moving-item${item.isDecoy ? ' tea-decoy' : ''}`;
        card.dataset.teaItem = item.id;
        card.dataset.teaInstance = instanceId;
        card.setAttribute('aria-label', game.tr('station.tea.dragItem', { item: item.name }));
        if (item.isDecoy) {
            card.innerHTML = `
                <span class="tea-decoy-art" aria-hidden="true"><img src="${item.image}" alt=""></span>
                <span class="tea-ingredient-name">${item.name}</span>
            `;
        } else {
            card.innerHTML = `
                <img class="tea-ingredient-art" src="${item.image}" alt="">
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
        game.state.movingItems.push(entry);
        TeaStationGame.bindTeaIngredientDrag(game, card, entry.item, entry);
    },

    getTeaMovingIngredient(game) {
        if (!game.state) return null;
        const phase = game.state.phase;
        const config = TeaStationGame.getTeaStageConfig(game, phase);
        const completed = game.state.completed[phase];
        const available = config.items.filter((item) => !completed.includes(item.id) && item.id !== game.state.activeItemId);
        if (!available.length) return null;
        const expected = game.state.orders[phase][game.state.currentIndex];
        const shouldPrioritizeExpected = !game.state.processing && Math.random() < 0.58;
        game.state.teaIngredientSpawnCount++;
        if (shouldPrioritizeExpected && expected) return { ...expected, isDecoy: false };
        const alternatives = expected ? available.filter((item) => item.id !== expected.id) : available;
        const pool = alternatives.length ? alternatives : available;
        return { ...pool[Math.floor(Math.random() * pool.length)], isDecoy: false };
    },

    getTeaDecoyItem(game) {
        if (!game.state) return null;
        const decoys = [
            { id: 'wood-small', name: game.tr('ingredient.woodSmall'), image: 'assets/images/station-fire/wood-small.png' },
            { id: 'stone', name: game.tr('ingredient.stone'), image: 'assets/images/station-tea/stone.png' },
            { id: 'wood-large', name: game.tr('ingredient.woodLarge'), image: 'assets/images/station-fire/wood-large.png' }
        ];
        const item = decoys[game.state.teaDecoySpawnCount++ % decoys.length];
        return { ...item, isDecoy: true };
    },

    bindTeaIngredientDrag(game, card, item, movingEntry = null) {
        card.addEventListener('pointerdown', (event) => {
            if (!game.state || game.state.finished || game.state.transitioning) return;
            if (game.state.processing) {
                const active = game.state.orders[game.state.phase][game.state.currentIndex];
                TeaStationGame.flashTeaError(game, game.tr('station.tea.finishActive', { item: active.name, verb: TeaStationGame.getTeaStageConfig(game, game.state.phase).verb }), item.instanceId || item.id);
                return;
            }
            event.preventDefault();
            const startX = event.clientX;
            const startY = event.clientY;
            const startRect = card.getBoundingClientRect();
            const dragLayerRect = game.container.getBoundingClientRect();
            let moved = false;
            let dragGhost = null;
            game.container.querySelectorAll('.tea-moving-item.selected').forEach((selected) => {
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
                    game.container.appendChild(dragGhost);
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
                const dropZone = game.container?.querySelector('[data-tea-drop]');
                if (!dropZone || !moved) return;
                const bounds = dropZone.getBoundingClientRect();
                const inside = finishEvent.clientX >= bounds.left && finishEvent.clientX <= bounds.right
                    && finishEvent.clientY >= bounds.top && finishEvent.clientY <= bounds.bottom;
                if (inside) TeaStationGame.handleTeaDrop(game, item);
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

    handleTeaDrop(game, item) {
        if (!game.state || game.state.processing || game.state.transitioning) return;
        if (item.isDecoy) {
            const destination = game.tr(game.state.phase === 'grind' ? 'station.tea.destination.mortar' : 'station.tea.destination.board');
            TeaStationGame.flashTeaError(game, game.tr('station.tea.wrongDestination', { item: item.name, destination }), item.instanceId || item.id);
            return;
        }
        const expected = game.state.orders[game.state.phase][game.state.currentIndex];
        if (!expected || item.id !== expected.id) {
            TeaStationGame.flashTeaError(game, game.tr('station.tea.wrongOrder', { item: expected ? expected.name : game.tr('station.tea.designated') }), item.instanceId || item.id);
            return;
        }
        const config = TeaStationGame.getTeaStageConfig(game, game.state.phase);
        game.state.processing = true;
        game.state.activeItemId = item.id;
        game.state.actionProgress = 0;
        game.state.rotationAngle = 0;
        game.state.lastPointerAngle = null;
        game.state.grindPath = null;
        game.state.feedback = game.tr('station.tea.started', { item: item.name, verb: config.verb });
        game.playClick();
        TeaStationGame.renderTeaStage(game);
    },

    flashTeaError(game, message, itemId) {
        if (!game.container) return;
        game.playWrong();
        const feedback = game.container.querySelector('.tea-feedback');
        const card = game.container.querySelector(`[data-tea-instance="${itemId}"]`)
            || game.container.querySelector(`[data-tea-item="${itemId}"]`);
        const dropZone = game.container.querySelector('[data-tea-drop]');
        if (feedback) feedback.textContent = message;
        if (card) card.classList.add('error');
        if (dropZone) dropZone.classList.add('error');
        game.timers.push(setTimeout(() => {
            if (card) card.classList.remove('error');
            if (dropZone) dropZone.classList.remove('error');
        }, 620));
    },

    bindTeaGrinding(game) {
        const target = game.container.querySelector('[data-tea-drop]');
        if (!target) return;
        const getAngle = (event) => {
            const bounds = target.getBoundingClientRect();
            return Math.atan2(event.clientY - (bounds.top + bounds.height / 2), event.clientX - (bounds.left + bounds.width / 2)) * 180 / Math.PI;
        };
        target.addEventListener('pointerdown', (event) => {
            if (!game.state?.processing) return;
            event.preventDefault();
            // 在使用者手勢內先解鎖 AudioContext，避免首次研磨時瀏覽器保持靜音。
            game.getGameAudioContext();
            target.setPointerCapture(event.pointerId);
            game.state.lastPointerAngle = getAngle(event);
            TeaStationGame.updateTeaPestle(game, game.state.lastPointerAngle);
            target.classList.add('gesturing');
        });
        target.addEventListener('pointermove', (event) => {
            if (!game.state?.processing || game.state.lastPointerAngle === null) return;
            event.preventDefault();
            const angle = getAngle(event);
            let delta = angle - game.state.lastPointerAngle;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            game.state.lastPointerAngle = angle;
            // 手機快速畫圈時 pointermove 取樣可能較疏，允許單次最多 120 度的有效位移。
            if (Math.abs(delta) < 1 || Math.abs(delta) > 120) return;
            game.state.rotationAngle += Math.abs(delta);
            TeaStationGame.updateTeaPestle(game, angle);
            TeaStationGame.playTeaGrindSound(game, Math.abs(delta));
            TeaStationGame.updateTeaMortar(game);
            while (game.state.rotationAngle >= 360 && game.state.actionProgress < 5) {
                game.state.rotationAngle -= 360;
                game.state.actionProgress++;
                target.classList.remove('tea-pulse');
                void target.offsetWidth;
                target.classList.add('tea-pulse');
                TeaStationGame.updateTeaActionProgress(game);
                if (game.state.actionProgress >= 5) {
                    TeaStationGame.completeTeaItem(game);
                    return;
                }
            }
        });
        const endGesture = (event) => {
            if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
            if (game.state) {
                game.state.lastPointerAngle = null;
                game.state.grindPath = null;
            }
            target.classList.remove('gesturing');
        };
        target.addEventListener('pointerup', endGesture);
        target.addEventListener('pointercancel', endGesture);
    },

    bindTeaChopping(game) {
        const target = game.container.querySelector('[data-tea-drop]');
        if (!target) return;
        // iOS Safari 對快速連點的 viewport 手勢不完全遵守 touch-action。
        // 限制在「正在切料」的砧板，使用 non-passive 原生事件取消預設行為，
        // 不影響食材拖曳、研磨手勢或砧板以外的頁面捲動。
        const blockNativeChopGesture = (event) => {
            if (!game.state?.processing || game.state.transitioning || game.state.phase !== 'chop') return;
            event.preventDefault();
        };
        target.addEventListener('touchstart', blockNativeChopGesture, { passive: false });
        target.addEventListener('touchmove', blockNativeChopGesture, { passive: false });
        target.addEventListener('touchend', blockNativeChopGesture, { passive: false });
        target.addEventListener('gesturestart', blockNativeChopGesture, { passive: false });
        target.addEventListener('pointerdown', (event) => {
            if (!game.state?.processing || game.state.transitioning || game.state.phase !== 'chop') return;
            event.preventDefault();
            game.state.actionProgress++;
            TeaStationGame.playTeaChopSound(game);
            target.classList.remove('tea-chop-hit');
            void target.offsetWidth;
            target.classList.add('tea-chop-hit');
            TeaStationGame.updateTeaActionProgress(game);
            if (game.state.actionProgress >= 6) TeaStationGame.completeTeaItem(game);
        });
    },

    updateTeaActionProgress(game) {
        if (!game.container || !game.state) return;
        const config = TeaStationGame.getTeaStageConfig(game, game.state.phase);
        const label = game.container.querySelector('.tea-action-progress');
        const meter = game.container.querySelector('.tea-action-meter i');
        if (label) label.textContent = `${game.state.actionProgress}/${config.target} ${config.unit}`;
        if (meter) meter.style.width = `${Math.min(100, game.state.actionProgress / config.target * 100)}%`;
        if (game.state.phase === 'grind') TeaStationGame.updateTeaMortar(game);
    },

    getTeaMortarImage(game) {
        const completedCount = game.state?.completed?.grind?.length || 0;
        const stage = Math.min(4, completedCount + 1);
        return `assets/images/station-tea/mortar-${stage}.png`;
    },

    updateTeaMortar(game) {
        const mortar = game.container?.querySelector('[data-tea-mortar]');
        if (mortar) mortar.src = TeaStationGame.getTeaMortarImage(game);
    },

    updateTeaPestle(game, angle) {
        const pestle = game.container?.querySelector('[data-tea-pestle]');
        if (!pestle || !Number.isFinite(angle)) return;
        const target = game.container.querySelector('[data-tea-drop]');
        const mortar = game.container.querySelector('[data-tea-mortar]');
        if (!target || !mortar) return;

        if (!game.state.grindPath) {
            const targetBounds = target.getBoundingClientRect();
            const mortarBounds = mortar.getBoundingClientRect();
            // 缽的影像可能還沒 decode，量到 0 尺寸就先跳過，等下一次 pointermove 再算。
            if (!mortarBounds.width || !mortarBounds.height) return;
            // 杵尖沿著缽「內圈」畫圓：取缽短邊再收進內緣。
            const radiusPx = Math.min(mortarBounds.width, mortarBounds.height) * 0.22;
            game.state.grindPath = {
                centerX: (mortarBounds.left + mortarBounds.width / 2 - targetBounds.left) / targetBounds.width * 100,
                // 圓心略往下偏，研磨面重心本來就偏低，也留出上緣空間讓棒身不被裁切。
                centerY: (mortarBounds.top + mortarBounds.height / 2 - targetBounds.top) / targetBounds.height * 100 + 5,
                radiusX: radiusPx / targetBounds.width * 100,
                radiusY: radiusPx / targetBounds.height * 100
            };
        }

        const radians = angle * Math.PI / 180;
        const path = game.state.grindPath;
        // 只有「杵尖」（影像左下角）沿著缽內圈畫圓；棒身角度固定不轉，僅位移。
        // 百分比半徑依容器寬高分別換算，畫面上的實際軌跡維持為正圓並貼著缽內緣。
        const tipX = path.centerX + Math.cos(radians) * path.radiusX;
        const tipY = path.centerY + Math.sin(radians) * path.radiusY;
        pestle.style.setProperty('--tea-pestle-x', `${tipX}%`);
        pestle.style.setProperty('--tea-pestle-y', `${tipY}%`);
    },

    completeTeaItem(game) {
        if (!game.state || !game.state.processing || game.state.transitioning) return;
        const phase = game.state.phase;
        const config = TeaStationGame.getTeaStageConfig(game, phase);
        const item = game.state.orders[phase][game.state.currentIndex];
        game.state.completed[phase].push(item.id);
        game.state.currentIndex++;
        game.state.processing = false;
        game.state.activeItemId = null;
        game.state.actionProgress = 0;
        game.state.feedback = game.tr('station.tea.completed', { item: item.name, verb: config.verb });
        if (game.state.currentIndex >= game.state.orders[phase].length) {
            game.state.transitioning = true;
            TeaStationGame.renderTeaStage(game);
            game.timers.push(setTimeout(() => TeaStationGame.completeTeaStage(game), 700));
            return;
        }
        const next = game.state.orders[phase][game.state.currentIndex];
        game.state.feedback += game.tr('station.tea.next', { item: next.name });
        TeaStationGame.renderTeaStage(game);
    },

    startTeaTimer(game) {
        TeaStationGame.clearTeaTimer(game);
        if (!game.state) return;
        game.state.timeLeft = TeaStationGame.teaStageDurationMs / 1000;
        game.state.stageDeadline = Date.now() + TeaStationGame.teaStageDurationMs;
        game.teaTimerId = setInterval(() => {
            if (!game.state || game.state.finished || game.state.transitioning) return;
            game.state.timeLeft = Math.max(0, (game.state.stageDeadline - Date.now()) / 1000);
            const time = game.container?.querySelector('[data-tea-time]');
            const timer = game.container?.querySelector('.tea-timer');
            if (time) time.textContent = Math.ceil(game.state.timeLeft);
            if (timer) timer.classList.toggle('urgent', game.state.timeLeft <= 5);
            if (game.state.timeLeft <= 0) TeaStationGame.handleTeaTimeout(game);
        }, 200);
    },

    clearTeaTimer(game) {
        if (game.teaTimerId) clearInterval(game.teaTimerId);
        game.teaTimerId = null;
    },

    handleTeaTimeout(game) {
        if (!game.state || game.state.transitioning) return;
        TeaStationGame.clearTeaTimer(game);
        const phase = game.state.phase;
        const config = TeaStationGame.getTeaStageConfig(game, phase);
        game.state.autoCompleted[phase] = true;
        game.state.completed[phase] = config.items.map((item) => item.id);
        game.state.currentIndex = game.state.orders[phase].length;
        game.state.processing = false;
        game.state.activeItemId = null;
        game.state.timeLeft = 0;
        game.state.transitioning = true;
        game.state.feedback = game.tr('station.tea.timeout');
        TeaStationGame.renderTeaStage(game);
        game.container.querySelector('.tea-play')?.classList.add('is-auto-completing');
        game.timers.push(setTimeout(() => TeaStationGame.completeTeaStage(game), 1200));
    },

    completeTeaStage(game) {
        if (!game.state || game.state.stationId !== 'tea') return;
        TeaStationGame.clearTeaTimer(game);
        if (game.state.phase === 'grind') {
            game.state.phase = 'chop';
            game.state.currentIndex = 0;
            game.state.processing = false;
            game.state.activeItemId = null;
            game.state.actionProgress = 0;
            game.state.rotationAngle = 0;
            game.state.lastPointerAngle = null;
            game.state.transitioning = false;
            const firstChopItem = TeaStationGame.getTeaStageConfig(game, 'chop').items[0];
            game.state.feedback = game.tr('station.tea.chopStart', { item: firstChopItem.name });
            TeaStationGame.renderTeaStage(game);
            TeaStationGame.startTeaTimer(game);
            return;
        }
        TeaStationGame.showTeaResult(game);
    },

    showTeaResult(game) {
        if (!game.state || !game.container) return;
        TeaStationGame.clearTeaTimer(game);
        game.state.finished = true;
        // 兩種入口都先看成果頁，再由成果頁進入阿公的結尾對話。
        TeaStationGame.renderTeaResult(game);
    },

    renderTeaResult(game) {
        if (!game.state || !game.container) return;
        const usedHelp = game.state.autoCompleted.grind || game.state.autoCompleted.chop;
        game.container.innerHTML = `
            <section class="station-panel station-result-panel tea-result-panel has-guide">
                <div class="tea-result-head">
                    <div class="station-kicker-line">${game.station.kicker}</div>
                    <h1>${game.tr('station.tea.result.title')}</h1>
                </div>
                <div class="tea-result-body">
                    <div class="tea-result-art" role="img" aria-label="${game.tr('station.tea.result.art')}"></div>
                    <div class="tea-result-copy">
                        <p class="station-subtitle tea-result-ingredients">${game.tr('station.tea.result.grindIngredients')}<br>${game.tr('station.tea.result.chopIngredients')}</p>
                        <p class="station-copy">${game.station.success}</p>
                        ${usedHelp ? `<p class="tea-assisted-note">${game.tr('station.tea.result.assisted')}</p>` : `<p class="tea-perfect-note">${game.tr('station.tea.result.perfect')}</p>`}
                    </div>
                </div>
                <div class="station-actions">
                    <button type="button" class="station-primary" data-retry>${game.tr('game.retry')}</button>
                    <button type="button" class="station-secondary" data-continue>${game.tr('station.tea.result.talkGrandpa')}</button>
                </div>
                <img class="station-guide station-guide-result" src="${game.station.guideImage}" alt="${game.station.guideAlt}">
            </section>
        `;
        game.container.querySelector('[data-retry]').addEventListener('click', () => TeaStationGame.startTeaGame(game));
        game.container.querySelector('[data-continue]').addEventListener('click', () => {
            const onComplete = game.mode === 'combined' ? () => game.showCombinedEnding() : () => game.close();
            game.showCombinedDialogue('teaExit', onComplete, {
                actionLabelKey: game.mode === 'combined' ? undefined : 'story.action.returnLobby'
            });
        });
    },

    playTeaGrindSound(game, delta = 12) {
        const now = performance.now();
        if (now - game.lastTeaGrindSoundAt < 45) return;
        game.lastTeaGrindSoundAt = now;
        const context = game.getGameAudioContext();
        if (!context) return;
        if (context.state !== 'running') {
            context.resume().catch(() => {});
            return;
        }
        const startAt = context.currentTime;
        const duration = 0.14;
        const source = game.createGameNoiseSource(context, duration);
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

    playTeaChopSound(game) {
        const context = game.getGameAudioContext();
        if (!context) {
            game.playClick();
            return;
        }
        const startAt = context.currentTime;
        const duration = 0.075;
        const noise = game.createGameNoiseSource(context, duration);
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
    }
};

window.TeaStationGame = TeaStationGame;
