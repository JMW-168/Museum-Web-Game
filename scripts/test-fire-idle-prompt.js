const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const pending = [];
const context = {
    setTimeout: (fn, ms) => { pending.push({ fn, ms }); return pending.length; },
    clearTimeout: () => {},
    console
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/minigames/FireStationGame.js'), 'utf8'), context);
const fire = context.FireStationGame;

function setup() {
    const classes = new Set();
    const button = { classList: { add: (v) => classes.add(v), remove: (v) => classes.delete(v) } };
    const prompt = { hidden: true };
    const state = { stationId: 'fire', startedAt: 1, finished: false, hasPressedWood: false, beats: [] };
    const game = {
        state, timers: [], tr: (key) => key,
        container: { querySelector: (selector) => selector === '[data-hit]' ? button : selector === '[data-fire-idle-prompt]' ? prompt : null }
    };
    return { game, state, classes, prompt };
}

const idle = setup();
fire.scheduleWoodPrompt(idle.game);
assert.strictEqual(pending.at(-1).ms, 5000);
assert.strictEqual(idle.prompt.hidden, true);
pending.at(-1).fn();
assert.strictEqual(idle.prompt.hidden, false);
assert(idle.classes.has('fire-idle-highlight'));
fire.applyFireScore = () => {};
fire.hitFireBeat(idle.game);
assert.strictEqual(idle.state.hasPressedWood, true);
assert.strictEqual(idle.prompt.hidden, true);
assert(!idle.classes.has('fire-idle-highlight'));

const early = setup();
fire.scheduleWoodPrompt(early.game);
fire.hitFireBeat(early.game);
pending.at(-1).fn();
assert.strictEqual(early.prompt.hidden, true, '按過添柴後延遲回呼不能再顯示提示');

const stopped = setup();
fire.scheduleWoodPrompt(stopped.game);
stopped.game.state = null;
pending.at(-1).fn();
assert.strictEqual(stopped.prompt.hidden, true, '退出後不能顯示提示');
console.log('Fire idle prompt checks passed.');
