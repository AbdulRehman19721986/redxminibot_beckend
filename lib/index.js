'use strict';

/**
 * REDXBOT302 — Library Barrel Export
 * Owner: Abdul Rehman Rajpoot
 */

const {
  getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json,
  runtime, sleep, fetchJson, fetchPostJson, randomBetween,
  formatBytes, botFooter, isAdminJid, tmpPath, cleanTmp,
} = require('./functions');

const {
  downloadMedia, urlToBase64, shortenUrl,
  translate, wikiSummary, randomQuote, getWeather,
  fetchJson: fetchJson2,
} = require('./functions2');

const fakevCard = require('./fakevcard');
const { db, JsonDB } = require('./database');

module.exports = {
  // Functions
  getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json,
  runtime, sleep, fetchJson, fetchPostJson, randomBetween,
  formatBytes, botFooter, isAdminJid, tmpPath, cleanTmp,
  // Functions2
  downloadMedia, urlToBase64, shortenUrl,
  translate, wikiSummary, randomQuote, getWeather,
  // Other
  fakevCard,
  db, JsonDB,
};
