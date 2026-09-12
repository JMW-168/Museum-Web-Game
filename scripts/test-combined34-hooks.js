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
    assert.strictEqual(game.getBabyImage('crying'), 'assets/images/station-cradle/baby-crying.png');
    assert.strictEqual(game.getBabyImage('calming'), 'assets/images/station-cradle/baby-calm.png');
    assert.strictEqual(game.getBabyImage('asleep'), 'assets/images/station-cradle/baby-asleep.png');
    assert.strictEqual(game.getBabyStage(34), 'crying');
    assert.strictEqual(game.getBabyStage(35), 'calming');
    assert.strictEqual(game.getBabyStage(66), 'calming');
    assert.strictEqual(game.getBabyStage(67), 'asleep', '最後約三分之一應提前切換成睡著狀態');
    let result = null;
    game.container = { querySelector: () => null };
    game.state = { finished: false, assisted: true };
    game.removeListeners = () => {};
    game.updateAudioStage = () => {};
    game.onComplete = (detail) => { result = detail; };
    game.finishGame();
    assert.deepStrictEqual({ ...result }, { assisted: true }, '遊戲完成後應直接進入成果流程，不額外延遲');
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
    // 粄印完成應先看祝福卡成果，再由「去找阿嬤」進入 cakeExit 離開引導對話（比照搖籃站）。
    const cradle = { stop() {} };
    let cardTransition = null;
    const cake = {
        stop() {},
        showCompletedResult(pattern, options) {
            cardTransition = { pattern, onExit: options.onExit };
        }
    };
    const { game } = loadGame('js/minigames/Station34CombinedGame.js', 'Station34CombinedGame', {
        CradleStationGame: cradle,
        CakeStationGame: cake
    });
    let transition = null;
    game.active = true;
    game.only = 'cake';
    game.createShell = () => {};
    game.removeShell = () => {};
    game.showDialogue = (sectionId, onComplete, tokens, opts) => { transition = { sectionId, tokens, opts }; };
    const targetPattern = { id: 'peach', name: '桃紋', meaning: '福壽吉祥', blessing: '願你喜樂常在。' };
    game.afterCake({ pattern: targetPattern });

    assert.strictEqual(cardTransition.pattern.id, 'peach', '應先呼叫 showCompletedResult 顯示祝福卡成果');
    assert.strictEqual(transition, null, '看到成果前不應提前進入離開對話');

    cardTransition.onExit();
    assert.strictEqual(transition.sectionId, 'cakeExit', '按下「去找阿嬤」後才進入 cakeExit 對話');
    assert.strictEqual(transition.tokens.patternName, '桃紋');
    assert.strictEqual(game.interpolate('選擇「{{patternName}}」', transition.tokens), '選擇「桃紋」');
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
    // 第一關單玩結束：先顯示結果頁，按「去找阿罵」後才播離開對話。
    const { game } = loadGame('js/minigames/StationDemoGame.js', 'StationDemoGame');
    const events = [];
    game.mode = 'single';
    game.state = {
        stationId: 'fire',
        fire: 58,
        score: 2400,
        mistakesRemaining: 5,
        maxMistakes: 5
    };
    game.station = {};
    game.tr = (key) => key;
    game.isFireInSafeRange = () => true;
    game.stopFireMusic = () => {};
    const originalShowResult = game.showResult;
    game.showResult = () => events.push('result');
    game.showCombinedDialogue = () => events.push('dialogue');
    game.showFireResult();
    assert.deepStrictEqual(events, ['result'], '第一關單玩結束應先顯示結果頁');
    game.showResult = originalShowResult;

    let retryHandler = null;
    let backHandler = null;
    const retryButton = { addEventListener: (type, handler) => { if (type === 'click') retryHandler = handler; } };
    const backButton = { addEventListener: (type, handler) => { if (type === 'click') backHandler = handler; } };
    game.container = {
        innerHTML: '',
        querySelector: (selector) => (selector === '[data-retry]' ? retryButton : backButton)
    };
    game.state = { stationId: 'fire' };
    game.station = { kicker: '站點一：灶台生火', success: '成功', fail: '失敗', guideImage: 'grandma.png', guideAlt: '阿罵' };
    game.tr = (key) => ({
        'station.fire.result.success': '挑戰成功',
        'station.fire.result.retry': '再試一次',
        'game.retry': '再玩一次',
        'station.fire.result.findGrandma': '去找阿罵'
    }[key] || key);
    let exitSection = null;
    game.showCombinedDialogue = (sectionId) => { exitSection = sectionId; };
    game.showResult(true);
    assert.ok(game.container.innerHTML.includes('data-retry'), '結果頁應顯示再玩一次按鈕');
    assert.ok(game.container.innerHTML.includes('data-back'), '結果頁應顯示去找阿罵按鈕');
    assert.ok(game.container.innerHTML.includes('「成功」'), '阿罵的話應換行並使用直角引號');
    assert.strictEqual(typeof retryHandler, 'function', '結果頁應綁定再玩一次');
    assert.strictEqual(typeof backHandler, 'function', '結果頁應綁定去找阿罵');
    backHandler();
    assert.strictEqual(exitSection, 'fireExit', '按「去找阿罵」後才播放離開對話');
}

{
    // 第三關單玩結束：比照一、二關先顯示結果頁，再從結果頁進入收尾對話。
    const cradle = { stop() {} };
    const { game } = loadGame('js/minigames/Station34CombinedGame.js', 'Station34CombinedGame', {
        CradleStationGame: cradle
    });
    const result = { assisted: false };
    const events = [];
    game.active = true;
    game.only = 'cradle';
    game.createShell = () => { game.container = {}; };
    const originalShowCradleResult = game.showCradleResult;
    game.showCradleResult = (value) => events.push({ type: 'result', value });
    game.showDialogue = () => events.push({ type: 'dialogue' });
    game.afterCradle(result);
    assert.deepStrictEqual(events, [{ type: 'result', value: result }], '第三關單玩結束應先顯示結果頁');
    game.showCradleResult = originalShowCradleResult;

    events.length = 0;
    game.only = null;
    game.showDialogue = (sectionId) => events.push({ type: 'dialogue', sectionId });
    game.afterCradle(result);
    assert.deepStrictEqual(events, [{ type: 'dialogue', sectionId: 'cradleExit' }], '完整劇情仍應從第三關收尾對話接往第四關');

    let retryHandler = null;
    let backHandler = null;
    const retryButton = { addEventListener: (type, handler) => { if (type === 'click') retryHandler = handler; } };
    const backButton = { addEventListener: (type, handler) => { if (type === 'click') backHandler = handler; } };
    game.container = {
        className: '',
        innerHTML: '',
        querySelector: (selector) => (selector === '[data-retry]' ? retryButton : backButton)
    };
    game.tr = (key) => ({
        'station.cradle.result.findGrandma': '去找阿嬤',
        'game.retry': '再玩一次'
    }[key] || key);
    let exitTransition = null;
    game.showDialogue = (sectionId, onComplete, tokens, opts) => {
        exitTransition = { sectionId, onComplete, tokens, opts };
    };
    game.showCradleResult(result);
    assert.ok(game.container.innerHTML.includes('data-retry'), '第三關結果頁應顯示再玩一次按鈕');
    assert.ok(game.container.innerHTML.includes('data-back'), '第三關結果頁應顯示去找阿嬤按鈕');
    assert.ok(game.container.innerHTML.includes('去找阿嬤'), '第三關離開按鈕應比照前兩關改為角色引導');
    assert.ok(game.container.innerHTML.includes('assets/images/station-cradle/cradle-result.png'), '第三關結果頁應顯示嬰兒與吊床合併圖');
    assert.ok(game.container.innerHTML.includes('cradle-result-body'), '第三關結果頁應使用與前兩關一致的圖文分欄');
    assert.strictEqual(typeof retryHandler, 'function', '第三關結果頁應綁定再玩一次');
    assert.strictEqual(typeof backHandler, 'function', '第三關結果頁應綁定去找阿嬤');
    backHandler();
    assert.strictEqual(exitTransition.sectionId, 'cradleExit', '按「去找阿嬤」後才播放收尾對話');
    assert.strictEqual(exitTransition.opts.actionLabelKey, 'story.action.returnLobby', '收尾對話按鈕應返回大廳');
}

{
    // 合併劇情逐字完成後的防連點短暫停（Issue #32）：文字完整出現後不可立即前進。
    const pacing = { charIntervalMs: 70, minReadMs: 20 };

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
    // 短暫停計時器真的會在 minReadMs 後翻轉 dialogueReady
    const { game } = loadGame('js/minigames/Station34CombinedGame.js', 'Station34CombinedGame', {
        CombinedStoryPacing: { charIntervalMs: 70, minReadMs: 15 }
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
