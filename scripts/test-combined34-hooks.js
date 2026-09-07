const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function loadGame(relativePath, exportExpression, extras = {}) {
    const context = {
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        requestAnimationFrame: () => 1,
        cancelAnimationFrame: () => {},
        performance: { now: () => Date.now() },
        CustomEvent: class CustomEvent {
            constructor(type, options = {}) {
                this.type = type;
                this.detail = options.detail;
            }
        },
        ...extras
    };
    context.window = context;
    context.dispatchEvent = () => {};
    vm.createContext(context);
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    vm.runInContext(`${source}\nwindow.__testedGame = ${exportExpression};`, context);
    return { game: context.__testedGame, context };
}

{
    const { game } = loadGame('js/minigames/CradleStationGame.js', 'CradleStationGame');
    let result = null;
    game.container = {};
    game.state = { finished: false, assisted: true };
    game.removeListeners = () => {};
    game.updateAudioStage = () => {};
    game.onComplete = (detail) => { result = detail; };
    game.finishGame();
    assert.deepStrictEqual({ ...result }, { assisted: true });
}

{
    const patterns = [{ id: 'peach', name: '桃紋', meaning: '福壽吉祥', blessing: '願你喜樂常在。' }];
    const { game } = loadGame('js/minigames/CakeStationGame.js', 'CakeStationGame', { CakePatterns: patterns });
    let result = null;
    game.state = { selectedPatternId: 'peach' };
    game.onComplete = (detail) => { result = detail; };
    game.finishCake();
    assert.strictEqual(result.selectedPatternId, 'peach');
    assert.strictEqual(result.pattern.meaning, '福壽吉祥');
}

{
    const pattern = {
        id: 'peach',
        name: '桃紋',
        meaning: '福壽吉祥',
        blessing: '願你喜樂常在。',
        cakeImage: 'assets/images/station-cake/pattern-peach.svg'
    };
    const scenes = [];
    const { game } = loadGame('js/minigames/CakeStationGame.js', 'CakeStationGame', {
        CakePatterns: [pattern],
        showScene: (sceneId) => scenes.push(sceneId)
    });
    let renderedPattern = null;
    let shellCreated = false;
    game.stop = () => {};
    game.createShell = () => {
        shellCreated = true;
        game.container = {};
    };
    game.showResult = (resultPattern) => { renderedPattern = resultPattern; };

    game.showCompletedResult(pattern, { onExit() {} });

    assert.deepStrictEqual(scenes, ['game-container']);
    assert.strictEqual(shellCreated, true);
    assert.strictEqual(game.mode, 'combined34-result');
    assert.strictEqual(game.state.selectedPatternId, 'peach');
    assert.strictEqual(renderedPattern, pattern);
}

{
    const cradle = { stop() {} };
    let cardTransition = null;
    const cake = {
        stop() {},
        showCompletedResult(pattern, options) {
            cardTransition = { pattern, hasOnExit: typeof options.onExit === 'function' };
        }
    };
    const { game } = loadGame('js/minigames/Station34CombinedGame.js', 'Station34CombinedGame', {
        CradleStationGame: cradle,
        CakeStationGame: cake
    });
    let transition = null;
    game.active = true;
    game.createShell = () => {};
    game.showDialogue = (sectionId, onComplete, tokens) => { transition = { sectionId, tokens }; };
    game.afterCake({
        pattern: { id: 'peach', name: '桃紋', meaning: '福壽吉祥', blessing: '願你喜樂常在。' }
    });
    assert.strictEqual(transition.sectionId, 'ending');
    assert.strictEqual(transition.tokens.patternName, '桃紋');
    assert.strictEqual(game.interpolate('選擇「{{patternName}}」', transition.tokens), '選擇「桃紋」');

    game.removeShell = () => {};
    game.showCard({ id: 'peach' });
    assert.strictEqual(cardTransition.pattern.id, 'peach');
    assert.strictEqual(cardTransition.hasOnExit, true);
}

{
    // 按住壓印：進度條靠 rAF，但「壓滿一秒」的判定要有 setTimeout 保底，
    // 這樣分頁被切到背景、rAF 被凍結時，只要真的按住滿時間仍會完成。
    const pattern = { id: 'peach', name: '桃紋', meaning: '福壽吉祥', blessing: '願你喜樂常在。' };

    const setup = () => {
        const { game } = loadGame('js/minigames/CakeStationGame.js', 'CakeStationGame', { CakePatterns: [pattern] });
        const done = [];
        game.container = { querySelector: () => null };
        game.state = { makeStep: 'press', holding: false, holdStartedAt: 0, selectedPatternId: 'peach' };
        game.onComplete = (detail) => done.push(detail);
        return { game, done };
    };

    // rAF 完全沒回呼（測試環境即模擬凍結），按住後 completeHold 仍能完成壓印
    const held = setup();
    held.game.startHold();
    assert.strictEqual(held.game.state.holding, true, '按下後應進入按住狀態');
    assert.notStrictEqual(held.game.holdCompleteTimer, null, '按下後應排定保底計時器');
    assert.strictEqual(held.done.length, 0, 'rAF 未推進時不應立即完成');
    held.game.completeHold();
    assert.strictEqual(held.game.state.holding, false, '完成後應離開按住狀態');
    assert.strictEqual(held.game.holdCompleteTimer, null, '完成後應清掉保底計時器');
    assert.strictEqual(held.done[0] && held.done[0].selectedPatternId, 'peach', 'rAF 凍結時仍應完成壓印');

    // 放開／離開要清掉保底計時器，且不得誤觸完成
    const released = setup();
    released.game.startHold();
    released.game.cancelHold(true);
    assert.strictEqual(released.game.state.holding, false, '放開後應離開按住狀態');
    assert.strictEqual(released.game.holdCompleteTimer, null, '放開後應清掉保底計時器');
    released.game.completeHold();
    assert.strictEqual(released.done.length, 0, '放開後不得再觸發完成');
}

function makeFakeBox() {
    const set = new Set();
    return {
        classList: {
            add: (c) => set.add(c),
            remove: (c) => set.delete(c),
            contains: (c) => set.has(c)
        }
    };
}

{
    // 合併劇情最短閱讀停留（Issue #32）：文字完整出現後不可立即前進。
    const pacing = { charIntervalMs: 42, minReadMs: 20 };

    for (const spec of [
        { file: 'js/minigames/Station34CombinedGame.js', name: 'Station34CombinedGame', finish: 'finishTyping', end: 'endDwell' },
        { file: 'js/minigames/StationDemoGame.js', name: 'StationDemoGame', finish: 'finishCombinedTyping', end: 'endCombinedDwell' }
    ]) {
        const { game } = loadGame(spec.file, spec.name, { CombinedStoryPacing: pacing });
        const box = makeFakeBox();
        const action = { hidden: true };
        game.container = { querySelector: (sel) => (sel === '[data-story-action]' ? action : box) };
        game.dialogueTextTarget = { textContent: '' };
        game.dialogueFullText = '句子';
        game.dialogueTyping = true;

        game[spec.finish]();
        assert.strictEqual(game.dialogueTyping, false, `${spec.name}: 逐字結束`);
        assert.strictEqual(game.dialogueReady, false, `${spec.name}: 停留中不可前進`);
        assert.strictEqual(box.classList.contains('is-reading'), true, `${spec.name}: 停留中顯示 is-reading`);
        assert.strictEqual(action.hidden, true, `${spec.name}: 停留中 CTA 仍隱藏`);

        game[spec.end]();
        assert.strictEqual(game.dialogueReady, true, `${spec.name}: 停留結束後可前進`);
        assert.strictEqual(box.classList.contains('is-reading'), false, `${spec.name}: 停留結束移除 is-reading`);
        assert.strictEqual(box.classList.contains('is-complete'), true, `${spec.name}: 停留結束顯示可繼續`);
        assert.strictEqual(action.hidden, false, `${spec.name}: 停留結束後 CTA 可用`);

        // clearTyping 要一併清掉 dwell timer 並重置狀態
        game.dialogueReady = true;
        const clear = spec.name === 'Station34CombinedGame' ? 'clearTyping' : 'clearCombinedTyping';
        game[clear]();
        assert.strictEqual(game.dwellTimer, null, `${spec.name}: clear 後清掉 dwellTimer`);
        assert.strictEqual(game.dialogueReady, false, `${spec.name}: clear 後重置 dialogueReady`);
    }
}

{
    // 通關致謝畫面（Issue #30）：完成合併流程後顯示 Ending；中途離開不進 Ending。
    const s34 = loadGame('js/minigames/Station34CombinedGame.js', 'Station34CombinedGame', {
        showScene: () => {},
        EndingScreen: { show: (cb) => { s34.shown = cb; } },
        CradleStationGame: { stop() {} },
        CakeStationGame: { stop() {} }
    });
    s34.game.active = true;
    s34.game.showEnding();
    assert.strictEqual(typeof s34.shown, 'function', '三四關完成流程後顯示 Ending');
    assert.strictEqual(s34.game.active, false, 'showEnding 後停用');

    const s34exit = loadGame('js/minigames/Station34CombinedGame.js', 'Station34CombinedGame', {
        showScene: () => {},
        EndingScreen: { show: () => { throw new Error('中途離開不應顯示 Ending'); } },
        CradleStationGame: { stop() {} },
        CakeStationGame: { stop() {} }
    });
    s34exit.game.active = false;
    s34exit.game.showEnding(); // 不應丟出錯誤

    const demo = loadGame('js/minigames/StationDemoGame.js', 'StationDemoGame', {
        showScene: () => {},
        EndingScreen: { show: (cb) => { demo.shown = cb; } }
    });
    demo.game.stop = () => {};
    demo.game.showCombinedEnding();
    assert.strictEqual(typeof demo.shown, 'function', '關卡一二完成流程後顯示 Ending');
}

{
    // EndingScreen 本體：顯示時切到 game-container，返回按鈕觸發 onReturn。
    let clickHandler = null;
    const button = { addEventListener: (t, h) => { if (t === 'click') clickHandler = h; }, focus() {} };
    const fakeDoc = {
        getElementById: () => null,
        createElement: () => ({ className: '', innerHTML: '', querySelector: () => button }),
        body: { appendChild() {} }
    };
    const scenes = [];
    const { game } = loadGame('js/minigames/EndingScreen.js', 'EndingScreen', {
        document: fakeDoc,
        showScene: (s) => scenes.push(s),
        AudioManager: { stopBGM() {}, playSFX() {} }
    });
    let returned = false;
    game.show(() => { returned = true; });
    assert.strictEqual(scenes.includes('game-container'), true, 'Ending 顯示時切到 game-container');
    assert.strictEqual(typeof clickHandler, 'function', '返回按鈕已綁定');
    clickHandler();
    assert.strictEqual(returned, true, '按返回入口觸發 onReturn');
    assert.strictEqual(game.container, null, '返回後畫面已清除');
}

{
    // dwell timer 真的會在 minReadMs 後翻轉 dialogueReady
    const { game } = loadGame('js/minigames/Station34CombinedGame.js', 'Station34CombinedGame', {
        CombinedStoryPacing: { charIntervalMs: 42, minReadMs: 15 }
    });
    const box = makeFakeBox();
    game.container = { querySelector: () => box };
    game.dialogueTextTarget = { textContent: '' };
    game.dialogueFullText = '句';
    game.dialogueTyping = true;
    game.finishTyping();
    assert.strictEqual(game.dialogueReady, false, 'dwell 期間 dialogueReady 為 false');
    setTimeout(() => {
        assert.strictEqual(game.dialogueReady, true, 'dwell 到點後 dialogueReady 為 true');
        console.log('combined34 hooks ok');
    }, 45);
}
