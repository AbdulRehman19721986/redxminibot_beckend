/**
 * REDXBOT302 — Downloader Plugin
 * TikTok, YouTube, Spotify, Instagram, etc.
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { fetchJson } = require('../lib/functions2');
const { isUrl }     = require('../lib/functions');
const fakevCard     = require('../lib/fakevcard');
const axios         = require('axios');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

module.exports = [
  // ── TIKTOK DOWNLOADER
  {
    pattern: 'tiktok',
    alias: ['tt', 'ttdl'],
    desc: 'Download TikTok video (no watermark)',
    category: 'Download',
    react: '🎵',
    use: '.tiktok <url>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ Provide a valid TikTok URL.\n*.tiktok https://vm.tiktok.com/...*');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const res = await fetchJson(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(q)}`);
        const data = res?.data || res;
        const videoUrl = data?.video || data?.play || data?.nwm;
        if (!videoUrl) return reply('❌ Could not fetch TikTok video.');

        await conn.sendMessage(from, {
          video: { url: videoUrl },
          caption: `🎵 *TikTok Video*\n\n📝 ${data?.title || 'TikTok'}\n👤 ${data?.author?.nickname || ''}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ Error: ${e.message}`);
      }
    },
  },

  // ── YOUTUBE MP3
  {
    pattern: 'ytmp3',
    alias: ['song', 'music', 'yta'],
    desc: 'Download YouTube audio (MP3)',
    category: 'Download',
    react: '🎵',
    use: '.ytmp3 <url or title>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a YouTube URL or song name.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        let videoUrl = q;
        if (!isUrl(q)) {
          const search = await fetchJson(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`);
          const match = search.match?.(/watch\?v=([\w-]{11})/);
          if (match) videoUrl = `https://www.youtube.com/watch?v=${match[1]}`;
          else {
            const ytRes = await fetchJson(`https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(q)}`);
            videoUrl = ytRes?.data?.[0]?.url || ytRes?.data?.[0]?.link;
          }
        }
        if (!videoUrl || !isUrl(videoUrl)) return reply('❌ Could not find video.');

        const res = await fetchJson(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(videoUrl)}`);
        const data = res?.data || res;
        const audioUrl = data?.url || data?.download;
        if (!audioUrl) return reply('❌ Could not download audio.');

        await conn.sendMessage(from, {
          audio: { url: audioUrl },
          mimetype: 'audio/mpeg',
          fileName: `${data?.title || 'audio'}.mp3`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ Error: ${e.message}`);
      }
    },
  },

  // ── YOUTUBE MP4
  {
    pattern: 'ytmp4',
    alias: ['ytvid', 'ytv'],
    desc: 'Download YouTube video (MP4)',
    category: 'Download',
    react: '🎬',
    use: '.ytmp4 <url or title>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a YouTube URL or video title.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        let videoUrl = q;
        if (!isUrl(q)) {
          const ytRes = await fetchJson(`https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(q)}`);
          videoUrl = ytRes?.data?.[0]?.url || ytRes?.data?.[0]?.link;
        }
        if (!videoUrl || !isUrl(videoUrl)) return reply('❌ Could not find video.');

        const res  = await fetchJson(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(videoUrl)}`);
        const data = res?.data || res;
        const vUrl = data?.url || data?.download;
        if (!vUrl) return reply('❌ Could not download video.');

        await conn.sendMessage(from, {
          video: { url: vUrl },
          caption: `🎬 ${data?.title || 'YouTube Video'}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ Error: ${e.message}`);
      }
    },
  },

  // ── YOUTUBE SEARCH
  {
    pattern: 'yts',
    alias: ['ytsearch'],
    desc: 'Search YouTube videos',
    category: 'Download',
    react: '🔍',
    use: '.yts despacito',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a search query.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const res   = await fetchJson(`https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(q)}`);
        const items = res?.data?.slice(0, 5) || [];
        if (!items.length) return reply('❌ No results found.');

        let text = `🔍 *YouTube Search: "${q}"*\n\n`;
        items.forEach((v, i) => {
          text += `${i+1}. *${v.title}*\n   ⏱️ ${v.duration || '?'} | 👁️ ${v.views || '?'}\n   🔗 ${v.url || v.link}\n\n`;
        });
        text += `> 🔥 ${BOT_NAME}`;

        await conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },

  // ── INSTAGRAM DOWNLOADER
  {
    pattern: 'ig',
    alias: ['igdl', 'instagram'],
    desc: 'Download Instagram reel/post',
    category: 'Download',
    react: '📸',
    use: '.ig <url>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ Provide a valid Instagram URL.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const res  = await fetchJson(`https://api.siputzx.my.id/api/d/instagram?url=${encodeURIComponent(q)}`);
        const url  = res?.data?.url || res?.url;
        const type = res?.data?.type || 'video';
        if (!url) return reply('❌ Could not download. Try a public post.');

        if (type === 'image') {
          await conn.sendMessage(from, { image: { url }, caption: `📸 Instagram\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: fakevCard });
        } else {
          await conn.sendMessage(from, { video: { url }, caption: `📸 Instagram Reel\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: fakevCard });
        }
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ Error: ${e.message}`);
      }
    },
  },

  // ── FACEBOOK DOWNLOADER
  {
    pattern: 'fbdl',
    alias: ['facebook', 'fb'],
    desc: 'Download Facebook video',
    category: 'Download',
    react: '📱',
    use: '.fbdl <url>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ Provide a Facebook video URL.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const res = await fetchJson(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(q)}`);
        const url = res?.data?.hd || res?.data?.sd || res?.url;
        if (!url) return reply('❌ Could not download. Try a public video.');

        await conn.sendMessage(from, { video: { url }, caption: `📱 Facebook Video\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },

  // ── MEDIAFIRE DOWNLOADER
  {
    pattern: 'mediafire',
    alias: ['mf'],
    desc: 'Get MediaFire download link',
    category: 'Download',
    react: '📦',
    use: '.mediafire <url>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ Provide a MediaFire URL.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const res = await fetchJson(`https://api.siputzx.my.id/api/d/mediafire?url=${encodeURIComponent(q)}`);
        const link = res?.data?.link || res?.link;
        const name = res?.data?.name || 'File';
        const size = res?.data?.size || '?';

        if (!link) return reply('❌ Could not fetch download link.');
        await conn.sendMessage(from, {
          text: `📦 *MediaFire Download*\n\n📁 Name: ${name}\n📏 Size: ${size}\n🔗 Link: ${link}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },
];
