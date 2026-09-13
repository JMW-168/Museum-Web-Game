const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function loadGame(ImageClass) {
    const context = {
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        requestAnimationFrame: () => 1,
        cancelAnimationFrame: () => {},
        performance: { now: () => Date.now() },
        Image: ImageClass
    };
    context.window = context;
    vm.createContext(context);
    const source = fs.readFileSync(path.join(root, 'js/minigames/StationDemoGame.js'), 'utf8');
    vm.runInContext(source, context);
    return context.StationDemoGame;
}

class SuccessfulImage {
    set src(value) {
        this.currentSrc = value;
        queueMicrotask(() => this.onload?.());
    }
}

class StalledImage {
    set src(value) {
        this.currentSrc = value;
    }
}

(async () => {
    const game = loadGame(SuccessfulImage);
    assert.ok(game.teaEssentialImageUrls.length > 0, '應定義研磨階段必要素材');
    assert.ok(game.teaDeferredImageUrls.length > 0, '應定義後續背景載入素材');
    assert.strictEqual(
        game.teaEssentialImageUrls.filter((src) => game.teaDeferredImageUrls.includes(src)).length,
        0,
        '必要與延後素材不應重複'
    );
    assert.strictEqual(game.teaAssetTimeoutMs, 12000, '必要素材逾時應為 12 秒');

    await game.loadTeaImages(['one.png', 'two.png'], 50);

    game.container = {
        innerHTML: '',
        querySelector: () => ({ addEventListener() {} })
    };
    game.station = { kicker: '站點二：擂茶料理' };
    game.tr = (key) => ({
        'station.tea.loading.title': '擂茶素材載入中',
        'station.tea.loading.copy': '正在準備研磨需要的圖片，馬上就能開始。'
    }[key] || key);
    game.setShellTheme = () => {};
    game.prepareTeaAssets = () => Promise.resolve();
    let deferredStarted = false;
    let gameStarted = false;
    game.preloadDeferredTeaAssets = () => { deferredStarted = true; };
    game.startTeaGame = () => { gameStarted = true; };

    const startPromise = game.startCombinedTea();
    assert.ok(game.container.innerHTML.includes('擂茶素材載入中'), '點擊後應立即顯示載入畫面');
    assert.strictEqual(gameStarted, false, '必要素材完成前不應開始遊戲');
    await startPromise;
    assert.strictEqual(deferredStarted, true, '必要素材完成後應開始背景載入後續素材');
    assert.strictEqual(gameStarted, true, '必要素材完成後應開始遊戲');

    const stalledGame = loadGame(StalledImage);
    await assert.rejects(
        stalledGame.loadTeaImages(['stalled.png'], 5),
        /素材載入超過 5ms/,
        '載入卡住時應在期限後失敗，而不是永久等待'
    );

    console.log('station tea loading ok');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
