const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const assetsMatch = sw.match(/const SHELL_ASSETS = \[(.*?)\];/s);
assert(assetsMatch, 'SHELL_ASSETS must be declared');
const shellAssets = Function(`return [${assetsMatch[1]}];`)();

for (const asset of shellAssets) {
    const filePath = asset.split('?')[0];
    if (filePath === './') continue;
    assert(fs.existsSync(path.join(root, filePath)), `Precached asset is missing: ${asset}`);
}

const requiredHtmlResources = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map((match) => match[1])
    .filter((resource) => /^(?:style\.css|css\/|js\/|manifest\.json|assets\/images\/title\/|assets\/images\/characters\/)/.test(resource));

for (const resource of requiredHtmlResources) {
    assert(shellAssets.includes(resource), `App-shell resource is not precached: ${resource}`);
}

assert(sw.includes("new Request(toAppUrl(asset), { cache: 'reload' })"), 'Shell install must bypass stale HTTP cache');
assert(sw.includes("event.data && event.data.type === 'SKIP_WAITING'"), 'Update activation must require a player action');
const installHandler = sw.match(/self\.addEventListener\('install',[\s\S]*?\n\}\);/);
assert(installHandler && !installHandler[0].includes('skipWaiting()'), 'Install must not force an in-progress game to reload');
assert(sw.includes('RUNTIME_CACHE'), 'Played level assets need a separate runtime cache');
assert(sw.includes("['image', 'font', 'audio', 'video']"), 'Runtime cache must cover level media');
assert(sw.includes("request.mode === 'navigate'"), 'Offline navigation must have an app-shell response');
assert(sw.includes('startsWith(`${CACHE_PREFIX}-`)'), 'Activation must only delete this app\'s old caches');

console.log(`Service worker checks passed (${shellAssets.length} app-shell assets).`);
