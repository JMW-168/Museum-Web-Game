const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js/core/LoadingManager.js'), 'utf8');
let imageRequests = 0;
let decodedImages = 0;
let failuresRemaining = 1;

class TestImage {
    set src(value) {
        imageRequests++;
        queueMicrotask(() => {
            if (value.includes('retry.webp') && failuresRemaining-- > 0) {
                this.onerror?.();
                return;
            }
            this.onload?.();
        });
    }

    decode() {
        decodedImages++;
        return Promise.resolve();
    }
}

const context = { console, setTimeout, clearTimeout, queueMicrotask, Image: TestImage };
context.window = context;
vm.createContext(context);
vm.runInContext(source, context);

(async () => {
    const loader = context.LoadingManager;
    await Promise.all([
        loader.preloadImages(['assets/images/example.webp', 'assets/images/example.webp']),
        loader.preloadImage('assets/images/example.webp')
    ]);
    assert.strictEqual(imageRequests, 1, '同 URL 的平行預載應只建立一次圖片請求');
    assert.strictEqual(decodedImages, 1, '圖片應完成 decode 後才 ready');

    await assert.rejects(loader.preloadImage('assets/images/retry.webp'), /無法載入/);
    await loader.preloadImage('assets/images/retry.webp');
    assert.strictEqual(imageRequests, 3, '失敗 URL 應從快取移除，讓下一次能重試');

    console.log('image preload ok');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
