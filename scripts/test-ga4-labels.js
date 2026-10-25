const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
const trackingSource = main.slice(0, main.indexOf('// 一次實際遊玩只會有一筆結束事件'));
const calls = [];
let locale = 'zh-Hant';
const context = {
    window: {
        location: { hostname: 'persatuankebudayaanhakkagame-gif.github.io' },
        I18n: { getLocale: () => locale },
        gtag: (...args) => calls.push(args)
    },
    document: { documentElement: { lang: 'zh-Hant' } }
};
vm.createContext(context);
vm.runInContext(trackingSource, context);

const cases = [
    ['home_start_click', {}, { event_label: '首頁：開始體驗' }],
    ['experience_entry_click', { entry_id: 'fire', entry_type: 'game' }, {
        event_label: '入口點擊', entry_label: '第一關：灶台生火', entry_type_label: '遊戲入口'
    }],
    ['experience_entry_click', { entry_id: 'tea', entry_type: 'game' }, { entry_label: '第二關：擂茶料理' }],
    ['experience_entry_click', { entry_id: 'cradle', entry_type: 'game' }, { entry_label: '第三關：搖籃哄睡' }],
    ['experience_entry_click', { entry_id: 'cake', entry_type: 'game' }, { entry_label: '第四關：紅粄製作' }],
    ['experience_entry_click', { entry_id: 'story', entry_type: 'game' }, { entry_label: '完整劇情體驗' }],
    ['experience_entry_click', { entry_id: 'collection', entry_type: 'collection' }, {
        entry_label: '客家老物件徵集', entry_type_label: '徵集活動'
    }],
    ['station_started', { station_id: 'fire', play_mode: 'standalone', attempt_number: 1 }, {
        event_label: '關卡開始', station_label: '第一關：灶台生火', play_mode_label: '單關體驗'
    }],
    ['station_started', { station_id: 'tea', play_mode: 'full_story', attempt_number: 1 }, {
        station_label: '第二關：擂茶料理', play_mode_label: '完整劇情體驗'
    }],
    ['station_started', { station_id: 'cradle', play_mode: 'combined34', attempt_number: 1 }, {
        station_label: '第三關：搖籃哄睡', play_mode_label: '第三四關串連'
    }],
    ['station_started', { station_id: 'cake', play_mode: 'combined', attempt_number: 1 }, {
        station_label: '第四關：紅粄製作', play_mode_label: '第一二關串連'
    }],
    ['station_completed', { station_id: 'fire', play_mode: 'standalone', attempt_number: 1, duration_seconds: 10, exit_method: 'completed' }, {
        event_label: '關卡完成', exit_method_label: '完成關卡'
    }],
    ['station_abandoned', { station_id: 'fire', play_mode: 'standalone', attempt_number: 1, duration_seconds: 10, exit_method: 'leave_button' }, {
        event_label: '中途離開', exit_method_label: '主動離開'
    }],
    ['station_abandoned', { station_id: 'fire', play_mode: 'standalone', attempt_number: 1, duration_seconds: 10, exit_method: 'page_hidden' }, {
        exit_method_label: '離開頁面／關閉或重整'
    }],
    ['station_abandoned', { station_id: 'fire', play_mode: 'standalone', attempt_number: 1, duration_seconds: 10, exit_method: 'station_switch' }, {
        exit_method_label: '切換關卡'
    }],
    ['station_retry', { station_id: 'fire', play_mode: 'standalone', attempt_number: 2 }, {
        event_label: '再次遊玩'
    }]
];

for (const [eventName, parameters, expected] of cases) {
    calls.length = 0;
    context.trackGa4Event(eventName, parameters);
    assert.strictEqual(calls.length, 1, `${eventName} must send exactly one event on the delivery host`);
    const [command, sentEventName, payload] = calls[0];
    assert.strictEqual(command, 'event');
    assert.strictEqual(sentEventName, eventName);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(payload)), {
        language: 'zh-Hant',
        ...parameters,
        event_label: expected.event_label || context.ga4Label('event', eventName),
        language_label: '繁體中文',
        ...(Object.hasOwn(parameters, 'station_id') ? { station_label: context.ga4Label('station', parameters.station_id) } : {}),
        ...(Object.hasOwn(parameters, 'entry_id') ? { entry_label: context.ga4Label('entry', parameters.entry_id) } : {}),
        ...(Object.hasOwn(parameters, 'entry_type') ? { entry_type_label: context.ga4Label('entryType', parameters.entry_type) } : {}),
        ...(Object.hasOwn(parameters, 'play_mode') ? { play_mode_label: context.ga4Label('playMode', parameters.play_mode) } : {}),
        ...(Object.hasOwn(parameters, 'exit_method') ? { exit_method_label: context.ga4Label('exitMethod', parameters.exit_method) } : {}),
        ...expected
    });
    assert(!Object.hasOwn(payload, 'attempt_number_label'), 'attempt_number must remain a numeric field without a label');
    assert(!Object.hasOwn(payload, 'duration_seconds_label'), 'duration_seconds must remain a numeric field without a label');
}

locale = 'zh-Hans';
calls.length = 0;
context.trackGa4Event('home_start_click');
assert.strictEqual(calls[0][2].language_label, '簡體中文', 'Simplified Chinese locale must get a Traditional Chinese label');

locale = 'ms';
calls.length = 0;
context.trackGa4Event('unknown_event', {
    station_id: 'unknown_station',
    entry_id: 'unknown_entry',
    entry_type: 'unknown_entry_type',
    play_mode: 'unknown_play_mode',
    exit_method: 'unknown_exit_method'
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(calls[0][2])), {
    language: 'ms',
    station_id: 'unknown_station',
    entry_id: 'unknown_entry',
    entry_type: 'unknown_entry_type',
    play_mode: 'unknown_play_mode',
    exit_method: 'unknown_exit_method',
    event_label: 'unknown_event',
    language_label: 'ms',
    station_label: 'unknown_station',
    entry_label: 'unknown_entry',
    entry_type_label: 'unknown_entry_type',
    play_mode_label: 'unknown_play_mode',
    exit_method_label: 'unknown_exit_method'
}, 'Unknown raw values must be preserved as label fallbacks');

context.window.location.hostname = 'jmw-168.github.io';
calls.length = 0;
context.trackGa4Event('home_start_click');
assert.strictEqual(calls.length, 0, 'Non-delivery hosts must not send GA4 events');

console.log('ga4 Chinese labels ok');
