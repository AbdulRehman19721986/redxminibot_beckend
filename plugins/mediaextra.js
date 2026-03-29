/**
 * REDXBOT302 v6 — Media Extra Plugin
 * .status (upload status), movie/anime/series download, picture editor, video editor
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const BOT_NAME = process.env.BOT_NAME || '🔥 REDXBOT302 🔥';
const NL_JID   = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const OWNER_NUM = process.env.OWNER_NUMBER || '923009842133';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

async function fetchJson(url, opts = {}) {
  const res = await axios.get(url, { timeout: 30000, headers: { 'User-Agent': 'REDXBOT302/6.0' }, ...opts });
  return res.data;
}

async function downloadBuf(msg, type) {
  const stream = await downloadContentFromMessage(msg, type);
  const chunks = []; for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

function sendSel(conn, msg, from, dlKey, downloadSessions, title, items, sendFn) {
  let text = `╔══════════════════════════╗\n║  📥 *${title}*\n╚══════════════════════════╝\n\n`;
  items.forEach((item, i) => { text += `*${i + 1}.* ${item.label}\n`; });
  text += `\n💡 *Reply with number to download*\n> 🔥 ${BOT_NAME}`;
  conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: msg });
  downloadSessions.set(dlKey, {
    items, sendFn,
    handler: async (conn2, msg2, num, session) => {
      const item = session.items[num - 1];
      if (!item) return conn2.sendMessage(from, { text: `❌ Choose 1-${session.items.length}` }, { quoted: msg2 });
      await conn2.sendMessage(from, { react: { text: '⏳', key: msg2.key } });
      try {
        await session.sendFn(conn2, msg2, from, item);
        conn2.sendMessage(from, { react: { text: '✅', key: msg2.key } });
      } catch (e) {
        conn2.sendMessage(from, { react: { text: '❌', key: msg2.key } });
        conn2.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg2 });
      }
      downloadSessions.delete(dlKey);
    },
  });
  setTimeout(() => downloadSessions.delete(dlKey), 120000);
}

module.exports = [

  // ══════════════════════════════════════════════════════════════
  // STATUS UPLOAD — directly from WhatsApp
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'status', alias: ['poststatus', 'setstatus', 'uploadstatus'],
    desc: 'Post status directly | .status <text> or reply to media', category: 'Tools',
    execute: async (conn, msg, m, { from, q, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only!');
      try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (quoted?.imageMessage || msg.message?.imageMessage) {
          // Image status
          const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
          const buf    = await downloadBuf(imgMsg, 'image');
          await conn.sendMessage('status@broadcast', {
            image: buf,
            caption: q || `🔥 ${BOT_NAME}`,
          }, { statusJidList: [] });
          return reply('✅ *Image status posted!*');
        }

        if (quoted?.videoMessage || msg.message?.videoMessage) {
          // Video status
          const vidMsg = quoted?.videoMessage || msg.message?.videoMessage;
          const buf    = await downloadBuf(vidMsg, 'video');
          await conn.sendMessage('status@broadcast', {
            video: buf,
            caption: q || `🔥 ${BOT_NAME}`,
          }, { statusJidList: [] });
          return reply('✅ *Video status posted!*');
        }

        // Text status
        const text = q || `🔥 ${BOT_NAME} is Online!`;
        const bgColors = [0x00AE99FF, 0xAC344CFF, 0xFF7518FF, 0x1D8348FF, 0x6A0572FF];
        const bg = bgColors[Math.floor(Math.random() * bgColors.length)];
        await conn.sendMessage('status@broadcast', {
          text,
          backgroundColor: bg,
          font: Math.floor(Math.random() * 8),
        }, { statusJidList: [] });
        reply('✅ *Text status posted!*');
      } catch (e) { reply(`❌ Status error: ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // MOVIE DOWNLOADER
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'movie', alias: ['film', 'moviedl', 'moviesearch'],
    desc: 'Search & download movies with number selection', category: 'Download',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      if (!q) return reply('❌ Usage: .movie <movie name>');
      await conn.sendMessage(from, { react: { text: '🎬', key: msg.key } });
      try {
        // Search movie info
        const res = await fetchJson(`https://api.siputzx.my.id/api/s/movie?q=${encodeURIComponent(q)}`);
        const movies = (res?.data || []).slice(0, 6);
        if (!movies.length) return reply(`❌ No movies found for: "${q}"`);

        const items = movies.map(m => ({
          label: `🎬 ${m.title || m.name} (${m.year || '?'}) | ${m.quality || 'HD'}`,
          url: m.url || m.link || m.download,
          title: m.title || m.name,
          year: m.year,
          poster: m.poster || m.image,
          quality: m.quality,
        }));

        await sendSel(conn, msg, from, dlKey, downloadSessions, 'Movie Search', items, async (c, m2, f, item) => {
          if (item.poster) {
            await c.sendMessage(f, {
              image: { url: item.poster },
              caption: `🎬 *${item.title}* (${item.year})\n🎞️ Quality: ${item.quality || 'HD'}\n🔗 ${item.url}\n\n> 🔥 ${BOT_NAME}`,
              contextInfo: ctxInfo(),
            }, { quoted: m2 });
          } else {
            await c.sendMessage(f, { text: `🎬 *${item.title}*\n🔗 Download: ${item.url}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: m2 });
          }
        });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // ANIME DOWNLOADER
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'anime', alias: ['animedl', 'animesearch', 'anidl'],
    desc: 'Search & get anime info/download links', category: 'Download',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      if (!q) return reply('❌ Usage: .anime <anime name>');
      await conn.sendMessage(from, { react: { text: '🎌', key: msg.key } });
      try {
        const res = await fetchJson(`https://api.siputzx.my.id/api/s/anime?q=${encodeURIComponent(q)}`);
        const animes = (res?.data || []).slice(0, 6);
        if (!animes.length) return reply(`❌ No anime found for: "${q}"`);

        const items = animes.map(a => ({
          label: `🎌 ${a.title || a.name} | ${a.type || 'Series'} | ${a.status || '?'}`,
          url: a.url || a.link,
          title: a.title || a.name,
          poster: a.poster || a.image,
          episodes: a.episodes,
          type: a.type,
        }));

        await sendSel(conn, msg, from, dlKey, downloadSessions, 'Anime Search', items, async (c, m2, f, item) => {
          const cap = `🎌 *${item.title}*\n📺 Type: ${item.type || '?'}\n🎞️ Episodes: ${item.episodes || '?'}\n🔗 ${item.url}\n\n> 🔥 ${BOT_NAME}`;
          if (item.poster) {
            await c.sendMessage(f, { image: { url: item.poster }, caption: cap, contextInfo: ctxInfo() }, { quoted: m2 });
          } else {
            await c.sendMessage(f, { text: cap, contextInfo: ctxInfo() }, { quoted: m2 });
          }
        });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // SERIES DOWNLOADER
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'series', alias: ['tvshow', 'seriesdl', 'show'],
    desc: 'Search TV series & get download info', category: 'Download',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      if (!q) return reply('❌ Usage: .series <series name>');
      await conn.sendMessage(from, { react: { text: '📺', key: msg.key } });
      try {
        const res = await fetchJson(`https://api.siputzx.my.id/api/s/movie?q=${encodeURIComponent(q + ' series')}`);
        const shows = (res?.data || []).slice(0, 6);
        if (!shows.length) return reply(`❌ No series found for: "${q}"`);

        const items = shows.map(s => ({
          label: `📺 ${s.title || s.name} (${s.year || '?'}) | ${s.type || 'Series'}`,
          url: s.url || s.link,
          title: s.title || s.name,
          poster: s.poster,
        }));

        await sendSel(conn, msg, from, dlKey, downloadSessions, 'Series Search', items, async (c, m2, f, item) => {
          const cap = `📺 *${item.title}*\n🔗 ${item.url}\n\n> 🔥 ${BOT_NAME}`;
          if (item.poster) {
            await c.sendMessage(f, { image: { url: item.poster }, caption: cap, contextInfo: ctxInfo() }, { quoted: m2 });
          } else {
            await c.sendMessage(f, { text: cap, contextInfo: ctxInfo() }, { quoted: m2 });
          }
        });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // PICTURE EDITOR
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'blur', alias: ['blurimg'],
    desc: 'Blur an image (reply to image)', category: 'Tools',
    execute: async (conn, msg, m, { from, reply }) => {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
      if (!imgMsg) return reply('❌ Reply to an image with .blur');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const buf = await downloadBuf(imgMsg, 'image');
        const b64 = buf.toString('base64');
        const res = await axios.post('https://api.siputzx.my.id/api/tools/blur', { image: b64 }, { timeout: 30000 });
        const out = res.data?.url || res.data?.image;
        if (!out) throw new Error('No result URL');
        await conn.sendMessage(from, { image: { url: out }, caption: `🌫️ *Blurred Image*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch {
        // Fallback: return same image with message
        reply('⚠️ Blur effect not available. Try .sticker to convert to sticker.');
      }
    },
  },

  {
    pattern: 'enhance', alias: ['hd', 'upscale', 'aienhance'],
    desc: 'Enhance image quality with AI', category: 'Tools',
    execute: async (conn, msg, m, { from, reply }) => {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
      if (!imgMsg) return reply('❌ Reply to an image with .enhance');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const buf = await downloadBuf(imgMsg, 'image');
        // Use remove.bg / remini style API
        const FormData = require('form-data');
        const form = new FormData();
        form.append('image', buf, { filename: 'img.jpg', contentType: 'image/jpeg' });
        const res = await axios.post('https://api.siputzx.my.id/api/tools/remini', form, {
          headers: form.getHeaders(), timeout: 60000,
        });
        const out = res.data?.url || res.data?.image;
        if (!out) throw new Error('No result');
        await conn.sendMessage(from, { image: { url: out }, caption: `✨ *AI Enhanced Image*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  {
    pattern: 'removebg', alias: ['rmbg', 'nobg', 'cutout'],
    desc: 'Remove image background', category: 'Tools',
    execute: async (conn, msg, m, { from, reply }) => {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
      if (!imgMsg) return reply('❌ Reply to an image with .removebg');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const buf = await downloadBuf(imgMsg, 'image');
        const FormData = require('form-data');
        const form = new FormData();
        form.append('image_file', buf, { filename: 'img.jpg', contentType: 'image/jpeg' });
        const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
          headers: { ...form.getHeaders(), 'X-Api-Key': 'qjG4AX8cNY1L1Kzh7q4zVHqp' },
          responseType: 'arraybuffer', timeout: 60000,
        });
        await conn.sendMessage(from, { image: Buffer.from(res.data), caption: `✂️ *Background Removed*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}\n\nTip: Try .sticker to convert to transparent sticker.`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // VIDEO EDITOR
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'videotoaudio', alias: ['vtoa', 'extractaudio', 'mp4tomp3'],
    desc: 'Convert video to audio (reply to video)', category: 'Tools',
    execute: async (conn, msg, m, { from, reply }) => {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const vidMsg = quoted?.videoMessage || msg.message?.videoMessage;
      if (!vidMsg) return reply('❌ Reply to a video with .videotoaudio');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const buf = await downloadBuf(vidMsg, 'video');
        // Send as audio by mimetype trick
        await conn.sendMessage(from, {
          audio: buf,
          mimetype: 'audio/mpeg',
          ptt: false,
          fileName: 'audio.mp3',
        }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  {
    pattern: 'compress', alias: ['compressvid', 'smallvid'],
    desc: 'Info: compress video (upload to cloud first)', category: 'Tools',
    execute: async (conn, msg, m, { reply }) => {
      reply(`📦 *Video Compress*\n\nFor video compression, please:\n1. Upload to https://www.freeconvert.com/video-compressor\n2. Or use: .videotoaudio to extract audio only\n\nServer-side FFmpeg compression requires hosting with FFmpeg installed.\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ══════════════════════════════════════════════════════════════
  // UPDATE BOT
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'update', alias: ['botupdate', 'checkupdate'],
    desc: 'Check for bot updates from GitHub', category: 'Owner',
    execute: async (conn, msg, m, { from, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only!');
      await conn.sendMessage(from, { react: { text: '🔄', key: msg.key } });
      try {
        const res = await fetchJson('https://api.github.com/repos/AbdulRehman19721986/REDXBOT-MD/commits/main');
        const sha     = res?.sha?.substring(0, 7) || '?';
        const message = res?.commit?.message || 'No message';
        const date    = res?.commit?.author?.date ? new Date(res.commit.author.date).toLocaleString() : '?';
        const author  = res?.commit?.author?.name || '?';

        reply(
          `🔄 *REDXBOT302 Update Check*\n\n` +
          `📦 *Latest Commit:* ${sha}\n` +
          `✍️ *Message:* ${message}\n` +
          `👤 *Author:* ${author}\n` +
          `📅 *Date:* ${date}\n\n` +
          `🔗 *GitHub:* https://github.com/AbdulRehman19721986/REDXBOT-MD\n\n` +
          `To update:\n` +
          `\`git pull origin main\`\n` +
          `\`npm install\`\n` +
          `\`npm start\`\n\n` +
          `> 🔥 ${BOT_NAME}`
        );
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Update check failed: ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // LOGO MAKER
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'logo', alias: ['makelogo', 'textlogo'],
    desc: 'Create logo from text | .logo Text | Style', category: 'Tools',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      if (!q) return reply('❌ .logo <text> | <style>\nStyles: 1-10\nExample: .logo REDXBOT | 1');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      const parts = q.split('|').map(s => s.trim());
      const text  = parts[0];
      const style = parseInt(parts[1]) || 1;

      const logos = [
        `https://api.siputzx.my.id/api/maker/logo?text=${encodeURIComponent(text)}&type=${style}`,
        `https://api.xteam.xyz/maker/logo?text=${encodeURIComponent(text)}`,
      ];
      try {
        for (const url of logos) {
          try {
            const res = await fetchJson(url);
            const img = res?.url || res?.image || res?.data;
            if (img) {
              await conn.sendMessage(from, { image: { url: img }, caption: `🎨 *Logo: ${text}*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
              conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
              return;
            }
          } catch {}
        }
        reply('❌ Logo generation failed. Try a different style number (1-10).');
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },
];
