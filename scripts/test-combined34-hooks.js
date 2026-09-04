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
    const cradle = { stop() {} };
    const cake = { stop() {} };
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
}

console.log('combined34 hooks ok');
