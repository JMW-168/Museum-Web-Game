const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function runCase(share, canShare, expectedResult, mode = 'full_story') {
    const events = [];
    const context = {
        console: { ...console, error: () => {} }, setTimeout, clearTimeout,
        navigator: { share, canShare },
        File: class File {},
        trackGa4Event: (name, params) => events.push({ name, params: { ...params } })
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/minigames/CakeStationGame.js'), 'utf8'), context);
    const game = context.CakeStationGame;
    game.analyticsMode = mode;
    game.tr = (key) => key;
    game.createBlessingCard = async () => ({});
    game.setShareFeedback = () => {};
    let fallbackDownloads = 0;
    game.downloadBlessingCard = async () => { fallbackDownloads++; };
    await game.shareBlessingCard({ id: 'linked-coins', meaning: 'secret text', blessing: 'private content' });
    assert.deepStrictEqual(events.map((event) => event.name), ['blessing_card_share_click', 'blessing_card_share_result']);
    assert.strictEqual(events[0].params.pattern_id, 'linked-coins');
    assert.strictEqual(events[0].params.play_mode, mode);
    assert.strictEqual(events[1].params.share_result, expectedResult);
    assert(!JSON.stringify(events).includes('private content'), '卡片文字不得送到 GA4');
    assert.strictEqual(fallbackDownloads, expectedResult === 'unsupported' ? 1 : 0);
    assert(!events.some((event) => event.name === 'blessing_card_download_click'), '分享 fallback 不得算手動下載');
}

(async () => {
    await runCase(async () => {}, () => true, 'resolved');
    await runCase(async () => { throw Object.assign(new Error('cancel'), { name: 'AbortError' }); }, () => true, 'cancelled', 'standalone');
    await runCase(undefined, undefined, 'unsupported');
    await runCase(async () => { throw new Error('failure'); }, () => true, 'failed');
    await runCase(async () => {}, () => false, 'unsupported');
    const events = [];
    const handlers = {};
    const ctx = { console: { ...console, warn: () => {} }, setTimeout, clearTimeout, trackGa4Event: (name, data) => events.push({ name, data }) };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/minigames/CakeStationGame.js'), 'utf8'), ctx);
    const game = ctx.CakeStationGame;
    game.container = { innerHTML: '', querySelector: (selector) => ({ selector }) };
    game.state = {};
    game.analyticsMode = 'standalone';
    game.removeListeners = () => {};
    game.listen = (el, type, callback) => { handlers[el.selector] = callback; };
    game.downloadBlessingCard = () => {};
    game.showResult({ id: 'fish', name: '魚紋', meaning: '', blessing: '' });
    handlers['[data-download-card]']();
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].name, 'blessing_card_download_click');
    assert.strictEqual(events[0].data.pattern_id, 'fish');
    assert.strictEqual(events[0].data.play_mode, 'standalone');

    const results = [];
    const cake = { stop() {}, showCompletedResult: (pattern, options) => results.push(options.analyticsMode) };
    const combinedContext = { console, CakeStationGame: cake, CradleStationGame: { stop() {} } };
    combinedContext.window = combinedContext;
    vm.createContext(combinedContext);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/minigames/Station34CombinedGame.js'), 'utf8'), combinedContext);
    const combined = combinedContext.Station34CombinedGame;
    combined.active = true;
    combined.removeShell = () => {};
    combined.createShell = () => {};
    combined.showDialogue = (section, callback) => callback();
    combined.playMode = 'full_story';
    combined.only = null;
    combined.afterCake({ pattern: { id: 'fish' } });
    combined.only = 'cake';
    combined.afterCake({ pattern: { id: 'fish' } });
    assert.deepStrictEqual(results, ['full_story', 'standalone'], '成果頁應保留實際入口模式');

    let shared = false;
    ctx.navigator = { share: async () => { shared = true; }, canShare: () => true };
    ctx.File = class File {};
    ctx.trackGa4Event = () => { throw new Error('GA4 unavailable'); };
    game.createBlessingCard = async () => ({});
    game.setShareFeedback = () => {};
    game.tr = (key) => key;
    game.trackCardEvent = ctx.CakeStationGame.trackCardEvent;
    await game.shareBlessingCard({ id: 'fish' });
    assert(shared, 'GA4 發生例外時不應阻斷分享');
    console.log('GA4 card sharing checks passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
