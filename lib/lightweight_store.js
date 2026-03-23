/*****************************************************************************
 *  Developed By Abdul Rehman Rajpoot & Muzamil Khan
 *  © 2026 All rights reserved.
 *****************************************************************************/
'use strict';
const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

let _cache = null;

function _load() {
  if (_cache) return _cache;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) { _cache = {}; return _cache; }
  try { _cache = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8') || '{}'); }
  catch { _cache = {}; }
  return _cache;
}

function _save() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(_cache, null, 2));
}

async function getSetting(namespace, key) {
  const data = _load();
  return data[namespace]?.[key] ?? null;
}

async function saveSetting(namespace, key, value) {
  const data = _load();
  if (!data[namespace]) data[namespace] = {};
  data[namespace][key] = value;
  _save();
  return true;
}

async function deleteSetting(namespace, key) {
  const data = _load();
  if (data[namespace]) delete data[namespace][key];
  _save();
  return true;
}

async function getAllSettings(namespace) {
  const data = _load();
  return data[namespace] || {};
}

module.exports = { getSetting, saveSetting, deleteSetting, getAllSettings };
