const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function makeLocalStorage() {
    const store = {};
    return {
        getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        _store: store
    };
}

function makeElement(attrs = {}) {
    return {
        _attrs: { ...attrs },
        textContent: '',
        getAttribute(name) {
            return Object.prototype.hasOwnProperty.call(this._attrs, name) ? this._attrs[name] : null;
        },
        setAttribute(name, value) { this._attrs[name] = value; }
    };
}

function loadI18n(extra = {}) {
    const warnings = [];
    const context = {
        console,
        Logger: { warn: (...a) => warnings.push(a.join(' ')), error: () => {} },
        ...extra
    };
    context.window = context;
    if (!context.localStorage) context.localStorage = makeLocalStorage();
    vm.createContext(context);
    for (const file of ['js/i18n/i18n.js', 'js/i18n/zh-Hant.js', 'js/i18n/zh-Hans.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
    }
    return { I18n: context.I18n, t: context.t, warnings, context };
}

// --- t(): 命中、內插、未命中 ---
{
    const { I18n, t } = loadI18n();
    I18n.init();
    assert.strictEqual(I18n.getLocale(), 'zh-Hant', '無記憶時預設繁體');
    assert.strictEqual(t('menu.start'), '搭乘時光機');
    assert.strictEqual(t('ending.subtitle').includes('客家土樓'), true);

    I18n.register('zh-Hant', { 'test.token': '選擇「{{name}}」，共 {{count}} 張' });
    assert.strictEqual(t('test.token', { name: '桃紋', count: 4 }), '選擇「桃紋」，共 4 張');
    assert.strictEqual(t('test.token', { name: '桃紋' }), '選擇「桃紋」，共 {{count}} 張', '缺 token 保留佔位');
}

// --- 未命中回傳 key 並 warn ---
{
    const { t, warnings } = loadI18n();
    assert.strictEqual(t('does.not.exist'), 'does.not.exist');
    assert.strictEqual(warnings.some((w) => w.includes('does.not.exist')), true, '未命中應 warn');
}

// --- 切換語言與記憶 ---
{
    const ls = makeLocalStorage();
    const { I18n, t } = loadI18n({ localStorage: ls });
    I18n.init();
    let changed = null;
    I18n.onChange((loc) => { changed = loc; });

    I18n.setLocale('zh-Hans');
    assert.strictEqual(I18n.getLocale(), 'zh-Hans');
    assert.strictEqual(changed, 'zh-Hans', 'onChange 應觸發');
    assert.strictEqual(ls.getItem('museum-game-lang'), 'zh-Hans', '應寫入 localStorage');
    assert.strictEqual(t('menu.start'), '搭乘时光机', '切換後取簡體');

    I18n.setLocale('fr'); // 非法
    assert.strictEqual(I18n.getLocale(), 'zh-Hans', '非法語言不生效');
}

// --- getStoredLocale：非法值、有效值、localStorage 拋錯 ---
{
    const badLs = { getItem: () => 'klingon', setItem: () => {} };
    const { I18n } = loadI18n({ localStorage: badLs });
    assert.strictEqual(I18n.getStoredLocale(), 'zh-Hant', '非法記憶值回退繁體');

    const goodLs = makeLocalStorage();
    goodLs.setItem('museum-game-lang', 'zh-Hans');
    const b = loadI18n({ localStorage: goodLs });
    assert.strictEqual(b.I18n.init(), 'zh-Hans', '有效記憶值生效');

    const throwLs = { getItem: () => { throw new Error('blocked'); }, setItem: () => {} };
    const c = loadI18n({ localStorage: throwLs });
    assert.strictEqual(c.I18n.getStoredLocale(), 'zh-Hant', 'localStorage 拋錯時回退繁體');
}

// --- applyStatic：data-i18n 與 data-i18n-attr ---
{
    const textEl = makeElement({ 'data-i18n': 'menu.exit' });
    const attrEl = makeElement({ 'data-i18n-attr': 'alt:title.alt' });
    const fakeDoc = {
        querySelectorAll(sel) {
            if (sel === '[data-i18n]') return [textEl];
            if (sel === '[data-i18n-attr]') return [attrEl];
            return [];
        }
    };
    const { I18n } = loadI18n({ document: fakeDoc });
    I18n.init();
    I18n.applyStatic();
    assert.strictEqual(textEl.textContent, '回到現實');
    assert.strictEqual(attrEl.getAttribute('alt'), '森美蘭客家文化博物館・傳統日常再現');

    I18n.setLocale('zh-Hans');
    I18n.applyStatic();
    assert.strictEqual(textEl.textContent, '回到现实', '切換後重掃 data-i18n');
    assert.strictEqual(attrEl.getAttribute('alt'), '森美兰客家文化博物馆・传统日常再现');
}

// --- 字典對照完整性：繁簡 key 必須一一對應 ---
{
    const { I18n } = loadI18n();
    const hantKeys = Object.keys(I18n.dicts['zh-Hant']).sort();
    const hansKeys = Object.keys(I18n.dicts['zh-Hans']).sort();
    const missingInHans = hantKeys.filter((k) => hansKeys.indexOf(k) === -1);
    const extraInHans = hansKeys.filter((k) => hantKeys.indexOf(k) === -1);
    assert.deepStrictEqual(missingInHans, [], 'zh-Hans 缺少 key: ' + missingInHans.join(', '));
    assert.deepStrictEqual(extraInHans, [], 'zh-Hans 多出 key: ' + extraInHans.join(', '));
    assert.ok(hantKeys.length >= 30, '殼層 key 數量合理');
}

console.log('i18n ok');
