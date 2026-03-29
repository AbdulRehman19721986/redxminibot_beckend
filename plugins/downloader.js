/**
 * REDXBOT302 v6 — Downloader Plugin
 * Full number-selection for YouTube, TikTok, Spotify, Instagram, Facebook, Twitter, Pinterest, SoundCloud
 * Owner: Abdul Rehman Rajpoot
 */
'use strict';

const axios = require('axios');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

async function fetchJson(url, opts = {}) {
  const res = await axios.get(url, {
    timeout: 25000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; REDXBOT302/6.0)' },
    ...opts,
  });
  return res.data;
}

function isUrl(str) { try { new URL(str); return true; } catch { return false; } }

async function sendSelectionMenu(conn, msg, from, dlKey, downloadSessions, title, items, sendFn) {
  let text = `╔══════════════════════════╗\n║  📥 *${title}*\n╚══════════════════════════╝\n\n`;
  items.forEach((item, i) => { text += `*${i + 1}.* ${item.label}\n`; });
  text += `\n💡 *Reply with a number to download*\n> 🔥 REDXBOT302`;
  await conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: msg });
  downloadSessions.set(dlKey, {
    items, sendFn,
    handler: async (conn2, msg2, num, session) => {
      const item = session.items[num - 1];
      if (!item) return conn2.sendMessage(from, { text: `❌ Invalid. Choose 1-${session.items.length}` }, { quoted: msg2 });
      await conn2.sendMessage(from, { react: { text: '⏳', key: msg2.key } });
      try {
        await session.sendFn(conn2, msg2, from, item);
        await conn2.sendMessage(from, { react: { text: '✅', key: msg2.key } });
      } catch (e) {
        await conn2.sendMessage(from, { react: { text: '❌', key: msg2.key } });
        await conn2.sendMessage(from, { text: `❌ Download failed: ${e.message}` }, { quoted: msg2 });
      }
    },
  });
  setTimeout(() => downloadSessions.delete(dlKey), 120000);
}

module.exports = [
  // ── YOUTUBE MP3 ──────────────────────────────────────────────────────────
  {
    pattern: 'ytmp3', alias: ['song', 'music', 'yta', 'audio'],
    desc: 'YouTube audio with number selection', category: 'Download', react: '🎵',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      try {
        if (!q) return reply('❌ Usage: .ytmp3 <song name or url>');
        await conn.sendMessage(from, { react: { text: '🔍', key: msg.key } });
        let results = [];
        if (isUrl(q)) {
          results = [{ label: q, url: q, title: 'Direct URL' }];
        } else {
          const res = await fetchJson(`https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(q)}`);
          results = (res?.data || []).slice(0, 6).map(v => ({ label: `${v.title} (${v.timestamp || '?'})`, url: v.url || v.link, title: v.title }));
        }
        if (!results.length) return reply('❌ No results found.');
        if (results.length === 1) {
          await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
          const dl = await fetchJson(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(results[0].url)}`);
          const audioUrl = dl?.data?.url || dl?.data?.download || dl?.url;
          if (!audioUrl) return reply('❌ Download failed.');
          await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${results[0].title || 'audio'}.mp3`, contextInfo: ctxInfo() }, { quoted: msg });
          return conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
        }
        await sendSelectionMenu(conn, msg, from, dlKey, downloadSessions, 'YouTube MP3', results,
          async (c, m2, f, item) => {
            const dl = await fetchJson(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(item.url)}`);
            const audioUrl = dl?.data?.url || dl?.data?.download || dl?.url;
            if (!audioUrl) throw new Error('No download link');
            await c.sendMessage(f, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${item.title || 'audio'}.mp3`, contextInfo: ctxInfo() }, { quoted: m2 });
          });
      } catch (e) { conn.sendMessage(from, { react: { text: '❌', key: msg.key } }); reply(`❌ ${e.message}`); }
    },
  },

  // ── YOUTUBE MP4 ──────────────────────────────────────────────────────────
  {
    pattern: 'ytmp4', alias: ['ytvid', 'ytv', 'video'],
    desc: 'YouTube video with number selection', category: 'Download', react: '🎬',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      try {
        if (!q) return reply('❌ Usage: .ytmp4 <video name or url>');
        await conn.sendMessage(from, { react: { text: '🔍', key: msg.key } });
        let results = [];
        if (isUrl(q)) {
          results = [{ label: q, url: q, title: 'Direct URL' }];
        } else {
          const res = await fetchJson(`https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(q)}`);
          results = (res?.data || []).slice(0, 6).map(v => ({ label: `${v.title} (${v.timestamp || '?'})`, url: v.url || v.link, title: v.title }));
        }
        if (!results.length) return reply('❌ No results found.');
        if (results.length === 1) {
          await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
          const dl = await fetchJson(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(results[0].url)}`);
          const vidUrl = dl?.data?.url || dl?.url;
          if (!vidUrl) return reply('❌ Download failed.');
          await conn.sendMessage(from, { video: { url: vidUrl }, caption: `🎬 *${results[0].title || 'Video'}*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
          return conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
        }
        await sendSelectionMenu(conn, msg, from, dlKey, downloadSessions, 'YouTube MP4', results,
          async (c, m2, f, item) => {
            const dl = await fetchJson(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(item.url)}`);
            const vidUrl = dl?.data?.url || dl?.url;
            if (!vidUrl) throw new Error('No download link');
            await c.sendMessage(f, { video: { url: vidUrl }, caption: `🎬 *${item.title}*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: m2 });
          });
      } catch (e) { conn.sendMessage(from, { react: { text: '❌', key: msg.key } }); reply(`❌ ${e.message}`); }
    },
  },

  // ── PLAY (auto-music selection) ─────────────────────────────────────────
  {
    pattern: 'play', alias: ['automusic', 'listen'],
    desc: 'Search & play music with number selection', category: 'Download', react: '🎶',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      try {
        if (!q) return reply('❌ Usage: .play <song name>');
        await conn.sendMessage(from, { react: { text: '🔍', key: msg.key } });
        const res = await fetchJson(`https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(q)}`);
        const results = (res?.data || []).slice(0, 8).map(v => ({ label: `🎵 ${v.title} (${v.timestamp || '?'})`, url: v.url || v.link, title: v.title }));
        if (!results.length) return reply('❌ No results found.');
        await sendSelectionMenu(conn, msg, from, dlKey, downloadSessions, 'Auto-Music Player', results,
          async (c, m2, f, item) => {
            const dl = await fetchJson(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(item.url)}`);
            const audioUrl = dl?.data?.url || dl?.data?.download || dl?.url;
            if (!audioUrl) throw new Error('No audio link');
            await c.sendMessage(f, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${item.title}.mp3`, contextInfo: ctxInfo() }, { quoted: m2 });
          });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── TIKTOK ──────────────────────────────────────────────────────────────
  {
    pattern: 'tiktok', alias: ['tt', 'ttdl'],
    desc: 'Download TikTok video (no watermark)', category: 'Download', react: '🎵',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ .tiktok <url>');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(q)}`);
        const data = res?.data || res;
        const videoUrl = data?.video || data?.play || data?.nwm || data?.download;
        if (!videoUrl) return reply('❌ Could not fetch. Make sure link is valid.');
        await conn.sendMessage(from, { video: { url: videoUrl }, caption: `🎵 *TikTok*\n\n📝 ${data?.title || data?.desc || ''}\n👤 ${data?.author?.nickname || ''}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── INSTAGRAM ───────────────────────────────────────────────────────────
  {
    pattern: 'instagram', alias: ['ig', 'igdl', 'insta', 'reel'],
    desc: 'Download Instagram photo/video/reel', category: 'Download', react: '📸',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ .instagram <url>');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson(`https://api.siputzx.my.id/api/d/instagram?url=${encodeURIComponent(q)}`);
        const medias = res?.data || (res?.url ? [{ url: res.url, type: 'video' }] : []);
        if (!medias.length) return reply('❌ Could not download. Make sure post is public.');
        const items = medias.map((x, i) => ({ label: `Media ${i + 1} (${x.type || 'photo'})`, url: x.url, type: x.type }));
        if (items.length === 1) {
          const x = items[0];
          if (x.url?.includes('.mp4') || x.type === 'video') {
            await conn.sendMessage(from, { video: { url: x.url }, caption: `📸 *Instagram*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
          } else {
            await conn.sendMessage(from, { image: { url: x.url }, caption: `📸 *Instagram*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
          }
          return conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
        }
        await sendSelectionMenu(conn, msg, from, dlKey, downloadSessions, 'Instagram Media', items,
          async (c, m2, f, item) => {
            if (item.url?.includes('.mp4') || item.type === 'video') {
              await c.sendMessage(f, { video: { url: item.url }, caption: `📸 Instagram\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: m2 });
            } else {
              await c.sendMessage(f, { image: { url: item.url }, caption: `📸 Instagram\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: m2 });
            }
          });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── FACEBOOK ────────────────────────────────────────────────────────────
  {
    pattern: 'facebook', alias: ['fb', 'fbdl'],
    desc: 'Download Facebook video (HD/SD)', category: 'Download', react: '📘',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ .facebook <url>');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(q)}`);
        const data = res?.data || res;
        const hdUrl = data?.hd || data?.HD;
        const sdUrl = data?.sd || data?.SD || data?.url;
        if (!hdUrl && !sdUrl) return reply('❌ Could not download. Make sure video is public.');
        const items = [];
        if (hdUrl) items.push({ label: '🎬 HD Quality', url: hdUrl });
        if (sdUrl) items.push({ label: '📱 SD Quality', url: sdUrl });
        if (items.length === 1) {
          await conn.sendMessage(from, { video: { url: items[0].url }, caption: `📘 *Facebook Video*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
          return conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
        }
        await sendSelectionMenu(conn, msg, from, dlKey, downloadSessions, 'Facebook Video Quality', items,
          async (c, m2, f, item) => {
            await c.sendMessage(f, { video: { url: item.url }, caption: `📘 Facebook Video\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: m2 });
          });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── TWITTER ─────────────────────────────────────────────────────────────
  {
    pattern: 'twitter', alias: ['tw', 'twdl', 'xdl'],
    desc: 'Download Twitter/X video', category: 'Download', react: '🐦',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ .twitter <url>');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(q)}`);
        const data = res?.data || res;
        const vidUrl = data?.url || data?.download;
        if (!vidUrl) return reply('❌ Could not download. Make sure tweet is public.');
        await conn.sendMessage(from, { video: { url: vidUrl }, caption: `🐦 *Twitter/X Video*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── SPOTIFY ─────────────────────────────────────────────────────────────
  {
    pattern: 'spotify', alias: ['sp', 'spotifydl'],
    desc: 'Download Spotify track (search & select)', category: 'Download', react: '💚',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      try {
        if (!q) return reply('❌ Usage: .spotify <song name>');
        await conn.sendMessage(from, { react: { text: '🔍', key: msg.key } });
        const search = await fetchJson(`https://api.siputzx.my.id/api/s/spotify?q=${encodeURIComponent(q)}`);
        const tracks = (search?.data || []).slice(0, 6);
        if (!tracks.length) return reply('❌ No Spotify results found.');
        const results = tracks.map(t => ({ label: `${t.name} — ${(t.artists || []).map(a => a.name).join(', ')}`, url: t.external_urls?.spotify || t.url, title: t.name }));
        await sendSelectionMenu(conn, msg, from, dlKey, downloadSessions, 'Spotify Download', results,
          async (c, m2, f, item) => {
            const dl = await fetchJson(`https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(item.url)}`);
            const audioUrl = dl?.data?.download || dl?.download || dl?.url;
            if (!audioUrl) throw new Error('Download link not found');
            await c.sendMessage(f, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${item.title}.mp3`, contextInfo: ctxInfo() }, { quoted: m2 });
          });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── SOUNDCLOUD ──────────────────────────────────────────────────────────
  {
    pattern: 'soundcloud', alias: ['sc', 'scdl'],
    desc: 'Download SoundCloud track', category: 'Download', react: '🎵',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Usage: .soundcloud <url>');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson(`https://api.siputzx.my.id/api/d/soundcloud?url=${encodeURIComponent(q)}`);
        const data = res?.data || res;
        const audioUrl = data?.url || data?.download;
        if (!audioUrl) return reply('❌ Could not download SoundCloud track.');
        await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${data?.title || 'soundcloud'}.mp3`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── PINTEREST ───────────────────────────────────────────────────────────
  {
    pattern: 'pinterest', alias: ['pin', 'pindl'],
    desc: 'Download Pinterest image/video', category: 'Download', react: '📌',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ .pinterest <url>');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson(`https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(q)}`);
        const data = res?.data || res;
        const mediaUrl = data?.url || data?.image || data?.video;
        if (!mediaUrl) return reply('❌ Could not download Pinterest media.');
        if (mediaUrl.includes('.mp4')) {
          await conn.sendMessage(from, { video: { url: mediaUrl }, caption: `📌 Pinterest Video\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        } else {
          await conn.sendMessage(from, { image: { url: mediaUrl }, caption: `📌 Pinterest Image\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        }
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },
];
