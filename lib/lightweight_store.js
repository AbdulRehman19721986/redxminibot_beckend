/**
 * Lightweight store - file-based settings storage
 * Compatible with the plugin system
 */
const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(process.cwd(), 'data', 'store.json');

function readStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) return {};
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch { return {}; }
}

function writeStore(data) {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
  } catch (e) { console.error('Store write error:', e.message); }
}

const store = {
  async getSetting(scope, key) {
    const s = readStore();
    return s[`${scope}:${key}`] ?? null;
  },
  async saveSetting(scope, key, value) {
    const s = readStore();
    s[`${scope}:${key}`] = value;
    writeStore(s);
    return true;
  },
  async deleteSetting(scope, key) {
    const s = readStore();
    delete s[`${scope}:${key}`];
    writeStore(s);
    return true;
  },
};

module.exports = store;
