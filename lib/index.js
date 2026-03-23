'use strict';
const {
  getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json,
  runtime, sleep, fetchJson, fetchPostJson, randomBetween,
  formatBytes, botFooter, isAdminJid, tmpPath, cleanTmp,
} = require('./functions');

const {
  downloadMedia, urlToBase64, shortenUrl, translate,
  wikiSummary, randomQuote, getWeather, empiretourl,
  fetchJson: fetchJson2, fetchPostJson: fetchPostJson2, saveConfig,
} = require('./functions2');

const fakevCard = require('./fakevcard');
const { db, JsonDB } = require('./database');

module.exports = {
  getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json,
  runtime, sleep, fetchJson, fetchPostJson, randomBetween,
  formatBytes, botFooter, isAdminJid, tmpPath, cleanTmp,
  downloadMedia, urlToBase64, shortenUrl, translate,
  wikiSummary, randomQuote, getWeather, empiretourl, saveConfig,
  fakevCard, db, JsonDB,
};
