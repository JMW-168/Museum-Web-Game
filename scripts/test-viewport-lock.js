const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');

const viewport = html.match(/<meta\s+name="viewport"\s+content="([^"]+)"/i)?.[1] || '';
assert.ok(viewport.includes('width=device-width'), 'viewport 應保留響應式寬度');
assert.ok(!/user-scalable\s*=\s*no/i.test(viewport), '非遊戲頁面應允許縮放');
assert.ok(!/maximum-scale\s*=\s*1(?:\.0)?(?:,|$)/i.test(viewport), '非遊戲頁面不應限制最大縮放倍率');

assert.match(main, /const isGameScene = sceneId === 'game-container';/,
    '只有正式遊戲場景應啟用輸入鎖定');
assert.match(main, /document\.documentElement\.classList\.toggle\('game-input-locked', isGameScene\);/,
    'HTML 根節點應隨遊戲場景切換鎖定狀態');
assert.match(main, /document\.body\.classList\.toggle\('game-input-locked', isGameScene\);/,
    'body 應隨遊戲場景切換鎖定狀態');
assert.match(css, /body\.game-input-locked #game-container\s*\{[^}]*touch-action:\s*none;/s,
    '遊戲進行中應停用縮放與頁面拖曳手勢');
assert.match(main, /\['gesturestart', 'gesturechange', 'gestureend', 'dblclick'\]/,
    'Safari 遊戲場景應阻擋縮放與雙擊手勢');
assert.match(css, /@media \(orientation: landscape\) and \(max-height: 560px\)[\s\S]*?#level-select\s*\{[\s\S]*?justify-content:\s*flex-start;[\s\S]*?overflow-y:\s*auto;/,
    '矮螢幕的站點頁應由頂端排列，並以頁內捲動避免上下裁切');
assert.ok(!html.includes('station-meta'), '站點入口不應再顯示風格不一致的裝飾 icon');
assert.match(css, /\.station-entry-collect\s*\{[^}]*border-radius:\s*24px;/s,
    '客家老物件徵集入口應使用高辨識度的圓弧外框');
assert.match(css, /\.station-entry-collect \.station-kicker\s*\{[^}]*font-size:\s*clamp\(20px, 3vw, 28px\);/s,
    '徵集活動與客家老物件徵集應使用相同字級');

console.log('Viewport lock checks passed.');
