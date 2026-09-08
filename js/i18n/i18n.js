// 輕量多語系機制（Issue #41 / 協調單 #40）。
// 不引入 i18n 套件：每個語言一個字典檔（js/i18n/<locale>.js）呼叫 I18n.register()，
// 介面透過 t(key, tokens) 取字串，靜態 DOM 用 data-i18n / data-i18n-attr 標記。
const I18n = {
    STORAGE_KEY: 'museum-game-lang',
    DEFAULT_LOCALE: 'zh-Hant',
    SUPPORTED: ['zh-Hant', 'zh-Hans'],

    dicts: {},
    locale: 'zh-Hant',
    listeners: [],

    register(locale, dict) {
        this.dicts[locale] = Object.assign(this.dicts[locale] || {}, dict || {});
    },

    // 讀取記憶的語言；讀取失敗或非法值時回退預設（繁體）。
    getStoredLocale() {
        try {
            const stored = window.localStorage.getItem(this.STORAGE_KEY);
            if (this.SUPPORTED.indexOf(stored) !== -1) return stored;
        } catch (error) {
            /* localStorage 不可用時忽略 */
        }
        return this.DEFAULT_LOCALE;
    },

    init() {
        this.locale = this.getStoredLocale();
        return this.locale;
    },

    getLocale() {
        return this.locale;
    },

    setLocale(locale) {
        if (this.SUPPORTED.indexOf(locale) === -1 || locale === this.locale) return;
        this.locale = locale;
        try {
            window.localStorage.setItem(this.STORAGE_KEY, locale);
        } catch (error) {
            /* 記不住就算了，至少本次 session 有切換 */
        }
        this.listeners.forEach((fn) => {
            try {
                fn(locale);
            } catch (error) {
                if (window.Logger) Logger.error('[i18n] onChange 監聽器錯誤:', error);
            }
        });
    },

    onChange(fn) {
        if (typeof fn === 'function') this.listeners.push(fn);
    },

    lookup(key) {
        const active = this.dicts[this.locale];
        if (active && Object.prototype.hasOwnProperty.call(active, key)) return active[key];
        const fallback = this.dicts[this.DEFAULT_LOCALE];
        if (fallback && Object.prototype.hasOwnProperty.call(fallback, key)) return fallback[key];
        return null;
    },

    t(key, tokens) {
        let str = this.lookup(key);
        if (str === null || str === undefined) {
            if (window.Logger) Logger.warn('[i18n] 找不到字串 key:', key);
            return key;
        }
        if (tokens) {
            str = String(str).replace(/\{\{(\w+)\}\}/g, (match, token) => {
                const value = tokens[token];
                return (value === undefined || value === null) ? match : value;
            });
        }
        return str;
    },

    // 掃描靜態 DOM 並套用翻譯。data-i18n 換 textContent；
    // data-i18n-attr="alt:key,aria-label:key2" 換屬性。
    applyStatic(root) {
        const scope = root || document;
        scope.querySelectorAll('[data-i18n]').forEach((el) => {
            el.textContent = this.t(el.getAttribute('data-i18n'));
        });
        scope.querySelectorAll('[data-i18n-attr]').forEach((el) => {
            el.getAttribute('data-i18n-attr').split(',').forEach((pair) => {
                const parts = pair.split(':');
                const attr = (parts[0] || '').trim();
                const key = (parts[1] || '').trim();
                if (attr && key) el.setAttribute(attr, this.t(key));
            });
        });
    }
};

window.I18n = I18n;
window.t = function t(key, tokens) {
    return I18n.t(key, tokens);
};
