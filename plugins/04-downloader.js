'use strict';
const axios = require('axios');
const fvc   = require('../lib/fakevcard');
const { react } = require('../lib/utils');

// ── Safe yt-search ────────────────────────────────────────────
async function ytSearch(query) {
  try {
    // Try yt-search if installed
    try {
      const yts = require('yt-search');
      const res  = await yts(query);
      return res?.videos?.[0] || null;
    } catch {}
    // Fallback: YouTube search API
    const { data } = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
    });
    const match = data.match(/"videoId":"([^"]+)","title":{"runs":\[{"text":"([^"]+)"/);
    if (match) {
      return { url: `https://youtube.com/watch?v=${match[1]}`, title: match[2], thumbnail: `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`, timestamp: '?', views: 0, author: { name: 'YouTube' } };
    }
    return null;
  } catch { return null; }
}

// ── Download from YouTube ─────────────────────────────────────
async function ytDownload(url, format = 'mp3') {
  const apis = [
    () => axios.get(`https://api.agatz.xyz/api/ytdlp?url=${encodeURIComponent(url)}&format=${format}`, { timeout: 60000 }),
    () => axios.get(`https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(url)}&format=720`, { timeout: 60000 }),
    () => axios.get(`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}`, { timeout: 60000 }),
  ];
  for (const api of apis) {
    try {
      const { data } = await api();
      const link = data?.result?.download || data?.data?.url || data?.result?.mp4 || data?.url || data?.download;
      if (link) return link;
    } catch {}
  }
  throw new Error('All download APIs failed — try again later');
}

// ── Pending download map — stores info for number-reply ────────
const pendingDownloads = new Map();

// ── Handle number reply for pending downloads ──────────────────
async function handleDownloadReply(conn, msg, choice, pendingId) {
  const pd = pendingDownloads.get(pendingId);
  if (!pd) return false;
  const { type, url, title, from } = pd;
  await conn.sendMessage(from, { react: { text: '📥', key: msg.key } });
  try {
    if (type === 'song') {
      const dlUrl = await ytDownload(url, 'mp3');
      if (choice === '1') {
        await conn.sendMessage(from, { audio: { url: dlUrl }, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: fvc });
      } else if (choice === '2') {
        await conn.sendMessage(from, { document: { url: dlUrl }, mimetype: 'audio/mpeg', fileName: `${title}.mp3`, caption: `🎵 ${title}` }, { quoted: fvc });
      } else if (choice === '3') {
        await conn.sendMessage(from, { audio: { url: dlUrl }, mimetype: 'audio/mpeg', ptt: true }, { quoted: fvc });
      }
    } else if (type === 'video') {
      const dlUrl = await ytDownload(url, 'mp4');
      if (choice === '1') {
        await conn.sendMessage(from, { video: { url: dlUrl }, caption: `🎬 ${title}`, mimetype: 'video/mp4' }, { quoted: fvc });
      } else if (choice === '2') {
        await conn.sendMessage(from, { document: { url: dlUrl }, mimetype: 'video/mp4', fileName: `${title}.mp4`, caption: `🎬 ${title}` }, { quoted: fvc });
      } else if (choice === '3') {
        await conn.sendMessage(from, { video: { url: dlUrl }, caption: `🎬 ${title}`, gifPlayback: true }, { quoted: fvc });
      }
    }
    await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
  } catch (e) {
    await conn.sendMessage(from, { text: `❌ Download failed: ${e.message}\n💡 Try again or use a different search term` }, { quoted: fvc });
  }
  pendingDownloads.delete(pendingId);
  return true;
}

module.exports = {
  pendingDownloads,
  handleDownloadReply,

  ...[ {
    pattern: 'song', alias: ['ytmp3','ytaudio','audio','play'],
    desc: 'Search & download YouTube audio',
    category: 'audio', react: '🎵',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .song <name or URL>\nExample: .song Shape of You');
      await react(conn, msg, '🔍');
      await conn.sendMessage(from, { text: '🔍 *Searching YouTube...*' }, { quoted: fvc });
      const info = await ytSearch(q);
      if (!info) return reply('❌ No video found for: ' + q);
      const caption =
        `🎵 *${info.title}*\n\n` +
        `⏱️ Duration : *${info.timestamp || 'N/A'}*\n` +
        `👁️ Views    : *${info.views?.toLocaleString?.() || 'N/A'}*\n` +
        `👤 Channel  : *${info.author?.name || 'N/A'}*\n\n` +
        `✦━━━━━━━━━━━━━━━━━━━━━✦\n` +
        `📲 *Reply with number to download:*\n\n` +
        `*1* 🎵 Audio MP3 (Play in gallery)\n` +
        `*2* 📁 Audio File (Document)\n` +
        `*3* 🎤 Voice Note (PTT)\n\n` +
        `> ⏰ Wait 20-60s after selecting · 🔥 REDXBOT302`;
      const sent = await conn.sendMessage(from, { image: { url: info.thumbnail }, caption }, { quoted: fvc });
      pendingDownloads.set(sent.key.id, { type: 'song', url: info.url, title: info.title, from });
      setTimeout(() => pendingDownloads.delete(sent.key.id), 600000);
    }
  } ],

  ...[ {
    pattern: 'video', alias: ['ytmp4','ytvideo','yt'],
    desc: 'Search & download YouTube video',
    category: 'downloader', react: '🎬',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .video <name or URL>\nExample: .video Gangnam Style');
      await react(conn, msg, '🔍');
      await conn.sendMessage(from, { text: '🔍 *Searching YouTube...*' }, { quoted: fvc });
      const info = await ytSearch(q);
      if (!info) return reply('❌ No video found for: ' + q);
      const caption =
        `🎬 *${info.title}*\n\n` +
        `⏱️ Duration : *${info.timestamp || 'N/A'}*\n` +
        `👁️ Views    : *${info.views?.toLocaleString?.() || 'N/A'}*\n` +
        `👤 Channel  : *${info.author?.name || 'N/A'}*\n\n` +
        `✦━━━━━━━━━━━━━━━━━━━━━✦\n` +
        `📲 *Reply with number to download:*\n\n` +
        `*1* 🎬 Video MP4 (Gallery)\n` +
        `*2* 📁 Video File (Document)\n` +
        `*3* 🎞️ GIF Video\n\n` +
        `> ⏰ Wait 20-60s after selecting · 🔥 REDXBOT302`;
      const sent = await conn.sendMessage(from, { image: { url: info.thumbnail }, caption }, { quoted: fvc });
      pendingDownloads.set(sent.key.id, { type: 'video', url: info.url, title: info.title, from });
      setTimeout(() => pendingDownloads.delete(sent.key.id), 600000);
    }
  } ],

  ...[ {
    pattern: 'tiktok', alias: ['tt','ttdl'],
    desc: 'Download TikTok no watermark',
    category: 'downloader', react: '🎵',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q?.includes('tiktok')) return reply('❌ .tiktok <tiktok url>');
      await react(conn, msg, '⏳');
      try {
        const { data } = await axios.get(`https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(q)}`, { timeout: 30000 });
        const videoUrl = data.data?.meta?.media?.find(v => v.type === 'video')?.org || data.data?.video;
        if (!videoUrl) throw new Error('No video found');
        await conn.sendMessage(from, { video: { url: videoUrl }, caption: `🎵 *TikTok*\n👤 @${data.data?.author?.username || 'unknown'}\n\n> 🔥 REDXBOT302` }, { quoted: fvc });
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ TikTok: ${e.message}`); }
    }
  } ],

  ...[ {
    pattern: 'spotify', alias: ['splay','sp'],
    desc: 'Download Spotify track',
    category: 'audio', react: '🎵',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .spotify <song name>');
      await react(conn, msg, '⏳');
      try {
        // Fallback: search YouTube for spotify song
        const info = await ytSearch(q + ' official audio');
        if (!info) return reply('❌ Song not found');
        const dlUrl = await ytDownload(info.url, 'mp3');
        await conn.sendMessage(from, { audio: { url: dlUrl }, mimetype: 'audio/mpeg', fileName: `${info.title}.mp3` }, { quoted: fvc });
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ Spotify: ${e.message}`); }
    }
  } ],

  ...[ {
    pattern: 'instagram', alias: ['ig','igdl'],
    desc: 'Download Instagram media',
    category: 'downloader', react: '📸',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q?.includes('instagram')) return reply('❌ .ig <instagram url>');
      await react(conn, msg, '⏳');
      try {
        const { data } = await axios.get(`https://api.yodpi.dev/api/instagram?url=${encodeURIComponent(q)}`, { timeout: 20000 });
        if (!data?.result?.length) throw new Error('No media found');
        const media = data.result[0];
        if (media.url?.includes('.mp4')) {
          await conn.sendMessage(from, { video: { url: media.url }, caption: '📸 *Instagram*\n> 🔥 REDXBOT302' }, { quoted: fvc });
        } else {
          await conn.sendMessage(from, { image: { url: media.url }, caption: '📸 *Instagram*\n> 🔥 REDXBOT302' }, { quoted: fvc });
        }
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ Instagram: ${e.message}`); }
    }
  } ],

  ...[ {
    pattern: 'twitter', alias: ['twdl','xdl'],
    desc: 'Download Twitter/X video',
    category: 'downloader', react: '🐦',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q?.match(/twitter|x\.com/)) return reply('❌ .twitter <twitter/x url>');
      await react(conn, msg, '⏳');
      try {
        const { data } = await axios.get(`https://api.tiklydown.eu.org/api/download/v3?url=${encodeURIComponent(q)}`, { timeout: 20000 });
        const url = data?.video?.hd || data?.video?.sd;
        if (!url) throw new Error('No video found');
        await conn.sendMessage(from, { video: { url }, caption: '🐦 *Twitter/X*\n> 🔥 REDXBOT302' }, { quoted: fvc });
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ Twitter: ${e.message}`); }
    }
  } ],

  ...[ {
    pattern: 'facebook', alias: ['fb','fbdl'],
    desc: 'Download Facebook video',
    category: 'downloader', react: '📘',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q?.includes('facebook')) return reply('❌ .fb <facebook video url>');
      await react(conn, msg, '⏳');
      try {
        const { data } = await axios.get(`https://api.yodpi.dev/api/facebook?url=${encodeURIComponent(q)}`, { timeout: 20000 });
        if (!data?.result?.download_url) throw new Error('No video found');
        await conn.sendMessage(from, { video: { url: data.result.download_url }, caption: '📘 *Facebook*\n> 🔥 REDXBOT302' }, { quoted: fvc });
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ Facebook: ${e.message}`); }
    }
  } ],

  ...[ {
    pattern: 'pinterest', alias: ['pin'],
    desc: 'Search Pinterest images',
    category: 'search', react: '📌',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .pinterest <search term>');
      await react(conn, msg, '⏳');
      try {
        const { data } = await axios.get(`https://api.popcat.xyz/pinterest?q=${encodeURIComponent(q)}`, { timeout: 10000 });
        if (!data?.results?.length) throw new Error('No results');
        const img = data.results[Math.floor(Math.random() * Math.min(5, data.results.length))];
        await conn.sendMessage(from, { image: { url: img }, caption: `📌 *Pinterest: ${q}*\n> 🔥 REDXBOT302` }, { quoted: fvc });
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ Pinterest: ${e.message}`); }
    }
  } ],
};
