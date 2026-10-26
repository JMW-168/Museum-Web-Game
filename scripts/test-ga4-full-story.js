const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
const analyticsSource = main.slice(0, main.indexOf('let stationBackgroundPrefetchStarted'));
const calls = [];
const listeners = {};
let now = 1000;
const context = {
    window: {
        location: { hostname: 'persatuankebudayaanhakkagame-gif.github.io' },
        I18n: { getLocale: () => 'zh-Hant' },
        gtag: (...args) => calls.push(args),
        addEventListener: (type, handler) => { listeners[type] = handler; }
    },
    document: { documentElement: { lang: 'zh-Hant' } },
    performance: { now: () => now }
};
vm.createContext(context);
vm.runInContext(analyticsSource, context);

const journey = context.window.FullStoryAnalytics;
const station = context.window.GameAnalytics;
const events = (name) => calls.filter((call) => call[0] === 'event' && call[1] === name).map((call) => call[2]);

journey.start();
assert.deepStrictEqual(JSON.parse(JSON.stringify(events('story_started')[0])), {
    language: 'zh-Hant',
    play_mode: 'full_story',
    journey_stage: 'story_intro',
    completed_station_count: 0,
    journey_duration_seconds: 0,
    event_label: '完整劇情開始',
    language_label: '繁體中文',
    play_mode_label: '完整劇情體驗',
    journey_stage_label: '開場對話'
});

station.start('fire', 'full_story');
now = 6100;
station.complete('fire');
now = 8100;
journey.abandon('leave_button');
journey.abandon('leave_button');
const abandoned = events('story_abandoned');
assert.strictEqual(abandoned.length, 1, 'A journey may only be abandoned once');
assert.strictEqual(abandoned[0].journey_stage, 'after_fire');
assert.strictEqual(abandoned[0].completed_station_count, 1);
assert.strictEqual(abandoned[0].journey_duration_seconds, 7);
assert.strictEqual(abandoned[0].exit_method, 'leave_button');

calls.length = 0;
now = 10000;
journey.start();
for (const stationId of ['fire', 'tea', 'cradle', 'cake']) {
    station.start(stationId, 'full_story');
    now += 1000;
    station.complete(stationId);
}
journey.complete();
journey.complete();
const completed = events('story_completed');
assert.strictEqual(completed.length, 1, 'A journey may only be completed once');
assert.strictEqual(completed[0].journey_stage, 'after_cake');
assert.strictEqual(completed[0].completed_station_count, 4);
assert.strictEqual(events('station_completed').length, 4, 'Existing per-station completion events must remain');
assert(events('station_started').every((payload) => payload.play_mode === 'full_story'), 'Every station in full story must use full_story mode');

calls.length = 0;
journey.start();
listeners.pagehide();
assert.strictEqual(events('story_abandoned').length, 1, 'Page exit must abandon an active journey');
assert.strictEqual(events('story_abandoned')[0].exit_method, 'page_hidden');

console.log('ga4 full-story journey analytics ok');
