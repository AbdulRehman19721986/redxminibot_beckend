/**
 * REDXBOT302 — Extended Utility Functions
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const axios = require('axios');
const { tmpPath } = require('./functions');
const fs   = require('fs');
const path = require('path');

// Re-export fetchJson for plugins that import from here
async function fetchJson(url, options = {}) {
  const res = await axios.get(url, {
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; REDXBOT302/1.0)' },
    ...options,
  });
  return res.data;
}

// ── Download media to buffer ──────────────────────────────
async function downloadMedia(msg, mtype) {
  const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
  const stream = await downloadContentFromMessage(msg[`${mtype}Message`] || msg, mtype);
  let buf = Buffer.alloc(0);
  for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
  return buf;
}

// ── Get image from URL as base64 ──────────────────────────
async function urlToBase64(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
  return Buffer.from(res.data).toString('base64');
}

// ── Shorten URL ───────────────────────────────────────────
async function shortenUrl(url) {
  try {
    const res = await fetchJson(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    return res;
  } catch {
    return url;
  }
}

// ── Translate text ────────────────────────────────────────
async function translate(text, to = 'en') {
  try {
    const res = await fetchJson(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${to}`
    );
    return res?.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

// ── Get Wikipedia summary ─────────────────────────────────
async function wikiSummary(query) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  return {
    title:   data.title,
    extract: data.extract,
    image:   data.thumbnail?.source || null,
    url:     data.content_urls?.desktop?.page || null,
  };
}

// ── Random quote ─────────────────────────────────────────
async function randomQuote() {
  const data = await fetchJson('https://zenquotes.io/api/random');
  return { quote: data[0]?.q, author: data[0]?.a };
}

// ── Weather ───────────────────────────────────────────────
async function getWeather(city) {
  const data = await fetchJson(
    `https://wttr.in/${encodeURIComponent(city)}?format=j1`
  );
  const cur = data.current_condition[0];
  return {
    city:    data.nearest_area[0]?.areaName[0]?.value || city,
    temp_c:  cur.temp_C,
    temp_f:  cur.temp_F,
    feels_c: cur.FeelsLikeC,
    humidity: cur.humidity,
    desc:    cur.weatherDesc[0]?.value,
    wind:    cur.windspeedKmph + ' km/h',
  };
}

module.exports = {
  fetchJson,
  downloadMedia,
  urlToBase64,
  shortenUrl,
  translate,
  wikiSummary,
  randomQuote,
  getWeather,
};
