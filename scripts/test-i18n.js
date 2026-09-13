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
    assert.strictEqual(t('station.fire.kicker'), '站點一：灶台生火');
    assert.strictEqual(t('station.fire.result.findGrandma'), '去找阿罵');
    assert.strictEqual(t('station.fire.summary', { score: 1022 }), '分數 1022');

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
    hantKeys.forEach((key) => {
        const tokens = (value) => Array.from(String(value).matchAll(/\{\{(\w+)\}\}/g), (match) => match[1]).sort();
        assert.deepStrictEqual(
            tokens(I18n.dicts['zh-Hans'][key]),
            tokens(I18n.dicts['zh-Hant'][key]),
            `繁簡 token 不一致: ${key}`
        );
    });
    assert.ok(hantKeys.length >= 30, '殼層 key 數量合理');
}

// --- #42 / #43：資料 key 與玩法程式引用的靜態 key 都必須存在 ---
{
    const { I18n } = loadI18n();
    const dictionary = I18n.dicts['zh-Hant'];
    const files = [
        'js/data/stationCombinedStory.js',
        'js/data/station34CombinedStory.js',
        'js/data/cakePatterns.js',
        'js/minigames/StationDemoGame.js',
        'js/minigames/CradleStationGame.js',
        'js/minigames/CakeStationGame.js',
        'js/minigames/Station34CombinedGame.js'
    ];
    const missing = [];
    files.forEach((file) => {
        const source = fs.readFileSync(path.join(root, file), 'utf8');
        const patterns = [
            /\b(?:speaker|text|cue|actionLabel|name|meaning|blessing)Key:\s*['"]([^'"]+)['"]/g,
            /\btr\(\s*['"]([^'"]+)['"]/g
        ];
        patterns.forEach((pattern) => {
            for (const match of source.matchAll(pattern)) {
                if (!Object.prototype.hasOwnProperty.call(dictionary, match[1])) missing.push(`${file}: ${match[1]}`);
            }
        });
    });
    ['dough', 'rotate', 'move', 'press'].forEach((step) => {
        const key = `station.cake.make.step.${step}`;
        if (!Object.prototype.hasOwnProperty.call(dictionary, key)) missing.push(`dynamic: ${key}`);
    });
    assert.deepStrictEqual(missing, [], '程式引用了不存在的 i18n key:\n' + missing.join('\n'));

    const cakeSource = fs.readFileSync(path.join(root, 'js/minigames/CakeStationGame.js'), 'utf8');
    assert.ok(cakeSource.includes("window.I18n?.getLocale?.() === 'zh-Hans'"), '祝福卡字型應依 locale 選 TC / SC');
    assert.ok(cakeSource.includes('document.fonts.load'), '祝福卡繪製前應等待字型');
    assert.ok(cakeSource.includes("this.tr('station.cake.card.heading')"), '祝福卡標題應走 i18n');
    assert.ok(cakeSource.includes("this.tr('station.cake.card.footer')"), '祝福卡頁尾應走 i18n');
}

// --- 劇情與粄印資料能依目前 locale 解析，token 也在 t() 階段完成內插 ---
{
    const { I18n, context } = loadI18n();
    for (const file of [
        'js/data/stationCombinedStory.js',
        'js/data/station34CombinedStory.js',
        'js/data/cakePatterns.js',
        'js/minigames/StationDemoGame.js',
        'js/minigames/CakeStationGame.js',
        'js/minigames/Station34CombinedGame.js'
    ]) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
    }

    I18n.init();
    const opening = context.StationDemoGame.localizeStoryLine(context.StationCombinedStory.sections.fireEntry.lines[0]);
    assert.strictEqual(opening.speaker, '阿嬤');
    assert.ok(opening.text.includes('廚房'));
    assert.strictEqual(context.CakeStationGame.patterns[0].name, '龜紋');
    assert.ok(context.CakeStationGame.patterns.every((pattern) => pattern.blessing.startsWith('祝你')), '繁體四種祝福應統一使用「祝你」');

    I18n.setLocale('zh-Hans');
    const ending = context.Station34CombinedGame.localizeLine(
        context.Station34CombinedStory.sections.cakeExit.lines[0],
        { patternName: '桃纹', meaning: '福寿吉祥' }
    );
    assert.strictEqual(ending.speaker, '阿嬷');
    assert.ok(ending.text.includes('桃纹'));
    assert.ok(!ending.text.includes('{{patternName}}'));
    assert.strictEqual(context.CakeStationGame.patterns[0].name, '龟纹');
    assert.strictEqual(context.CakeStationGame.patterns[2].meaning, '年年有余');
    assert.ok(context.CakeStationGame.patterns.every((pattern) => pattern.blessing.startsWith('祝你')), '簡體四種祝福應統一使用「祝你」');
}

console.log('i18n ok');
