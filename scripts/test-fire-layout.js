const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'css', 'station-demo-game.css'), 'utf8');
const game = fs.readFileSync(path.join(root, 'js', 'minigames', 'StationDemoGame.js'), 'utf8');

const fireStoveRule = css.match(/\.station-demo-fire \.fire-stove-img \{([\s\S]*?)\n\}/);
const fireFlameRule = css.match(/\.station-demo-fire \.fire-flame-img \{([\s\S]*?)\n\}/);

assert(fireStoveRule, 'Fire stove rule must exist');
assert(fireFlameRule, 'Fire flame rule must exist');
assert(!fireStoveRule[1].includes('scaleX(-1)'), 'The stove must keep the source image\'s right-facing mouth');
assert(/left:\s*70%;/.test(fireFlameRule[1]), 'The flame must be positioned over the right-side stove mouth');
assert(game.includes('flameBounds.left + flameBounds.width / 2 - trackBounds.left'), 'Fire timing must use the rendered flame center');

console.log('Fire layout checks passed.');
