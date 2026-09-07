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

console.log('combined34 hooks ok');
