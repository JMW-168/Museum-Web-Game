const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert(main.includes("const GA4_MEASUREMENT_ID = 'G-PKVJPFCPDZ'"), 'GA4 Measurement ID must be configured');
assert(main.includes("const GA4_ALLOWED_HOST = 'persatuankebudayaanhakkagame-gif.github.io'"), 'GA4 must only run on the delivery host');
assert(main.includes("trackGa4Event('home_start_click')"), 'Home start button must be tracked');
assert(main.includes("trackGa4Event('experience_entry_click', { entry_id: button.dataset.station, entry_type: 'game' })"), 'Game entries must be tracked');
assert(main.includes("entry_id: 'collection', entry_type: 'collection'"), 'Collection entry must be tracked');
assert.strictEqual((html.match(/data-station="/g) || []).length, 5, 'Five game entry buttons must remain available');

console.log('ga4 entry tracking ok');
