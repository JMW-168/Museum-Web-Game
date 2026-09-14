const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const main = read('js', 'main.js');
const fire = read('js', 'minigames', 'FireStationGame.js');
const tea = read('js', 'minigames', 'TeaStationGame.js');
const cradle = read('js', 'minigames', 'CradleStationGame.js');
const cake = read('js', 'minigames', 'CakeStationGame.js');

for (const eventName of ['station_started', 'station_completed', 'station_abandoned', 'station_retry']) {
    assert(main.includes(`'${eventName}'`), `${eventName} must be sent to GA4`);
}
for (const parameter of ['station_id', 'play_mode', 'attempt_number', 'duration_seconds', 'exit_method']) {
    assert(main.includes(parameter), `${parameter} must be included in gameplay telemetry`);
}
assert(main.includes("addEventListener('pagehide'"), 'Closing or reloading a page must make a best-effort abandonment record');
assert(fire.includes("GameAnalytics?.start('fire'"), 'Fire timing must start when the gameplay loop starts');
assert(fire.includes("GameAnalytics?.complete('fire')"), 'Fire completion must be tracked');
assert(tea.includes("GameAnalytics?.start('tea'"), 'Tea timing must start after the guide');
assert(tea.includes("GameAnalytics?.complete('tea')"), 'Tea completion must be tracked');
assert(cradle.includes("GameAnalytics?.start('cradle'"), 'Cradle timing must start after the guide');
assert(cradle.includes("GameAnalytics?.complete('cradle')"), 'Cradle completion must be tracked');
assert(cake.includes("GameAnalytics?.start('cake'"), 'Cake timing must start when matching begins');
assert(cake.includes("GameAnalytics?.complete('cake')"), 'Cake completion must be tracked');

console.log('ga4 gameplay analytics ok');
