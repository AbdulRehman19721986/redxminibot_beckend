/**
 * REDXBOT302 — Media Plugin
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { fetchJson } = require('../lib/functions2');
const { getRandom } = require('../lib/functions');
const fakevCard     = require('../lib/fakevcard');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

module.exports = [
  // ── IMAGE SEARCH (Bing)
  {
    pattern: 'img',
    alias: ['image', 'gimage', 'bing'],
    desc: 'Search and send an image',
    category: 'Media',
    react: '🖼️',
    use: '.img sunset over mountains',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a search query. Example: *.img cute cats*');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        // Use scraping approach — Bing image search
        const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&first=1`;
        const axios   = require('axios');
        const html    = await axios.get(bingUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          timeout: 15000,
        }).then(r => r.data);

        const matches = [...html.matchAll(/murl&quot;:&quot;(https[^&]+)&quot;/g)];
        const images  = matches.map(m => decodeURIComponent(m[1])).filter(u => u.startsWith('http'));
        if (!images.length) return reply('❌ No images found.');

        const imgUrl = images[Math.floor(Math.random() * Math.min(images.length, 10))];
        await conn.sendMessage(from, {
          image: { url: imgUrl },
          caption: `🖼️ *${q}*\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ Error: ${e.message}`);
      }
    },
  },

  // ── GIF SEARCH
  {
    pattern: 'gif',
    desc: 'Search a GIF',
    category: 'Media',
    react: '🎞️',
    use: '.gif dancing cat',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a GIF search term.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson(`https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(q)}&limit=10&api_key=dc6zaTOxFJmzC`);
        const gifs = res?.data || [];
        if (!gifs.length) return reply('❌ No GIFs found.');
        const gif = getRandom(gifs);
        const url = gif?.images?.original?.url || gif?.url;
        await conn.sendMessage(from, {
          video: { url },
          gifPlayback: true,
          caption: `🎞️ *${q}*\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },

  // ── MEME
  {
    pattern: 'meme',
    desc: 'Random meme',
    category: 'Media',
    react: '😂',
    use: '.meme',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson('https://meme-api.com/gimme');
        const url = res?.url;
        if (!url) return reply('❌ Could not fetch meme.');
        await conn.sendMessage(from, {
          image: { url },
          caption: `😂 *${res.title || 'Random Meme'}*\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },

  // ── WAIFU / ANIME IMAGE
  {
    pattern: 'waifu',
    alias: ['anime'],
    desc: 'Random anime/waifu image',
    category: 'Media',
    react: '🎌',
    use: '.waifu',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson('https://api.waifu.pics/sfw/waifu');
        const url = res?.url;
        if (!url) return reply('❌ Could not fetch image.');
        await conn.sendMessage(from, {
          image: { url },
          caption: `🎌 *Waifu*\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },

  // ── POKEDEX
  {
    pattern: 'pokedex',
    alias: ['pokemon'],
    desc: 'Get Pokemon info',
    category: 'Media',
    react: '🔴',
    use: '.pokedex pikachu',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a Pokemon name. Example: *.pokedex pikachu*');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${q.toLowerCase()}`);
        const url = res?.sprites?.other?.['official-artwork']?.front_default || res?.sprites?.front_default;
        const types = res?.types?.map(t => t.type.name).join(', ');
        const stats = res?.stats?.map(s => `${s.stat.name}: ${s.base_stat}`).join('\n');
        await conn.sendMessage(from, {
          image: { url },
          caption:
`🔴 *Pokédex: ${res.name.toUpperCase()}*

🔢 *ID:* #${res.id}
⚡ *Types:* ${types}
📏 *Height:* ${res.height / 10}m
⚖️ *Weight:* ${res.weight / 10}kg
🎯 *Base EXP:* ${res.base_experience}

📊 *Stats:*
${stats}

> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Pokemon not found: ${e.message}`); }
    },
  },

  // ── REMOVE BACKGROUND
  {
    pattern: 'removebg',
    alias: ['rmbg', 'nobg'],
    desc: 'Remove image background',
    category: 'Media',
    react: '✂️',
    use: '.removebg (reply to image)',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const target = quoted?.imageMessage || msg.message?.imageMessage;
        if (!target) return reply('❌ Reply to an image with *.removebg*');

        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(target, 'image');
        let buf = Buffer.alloc(0);
        for await (const c of stream) buf = Buffer.concat([buf, c]);

        const FormData = require('form-data');
        const axios    = require('axios');
        const form     = new FormData();
        form.append('image_file', buf, { filename: 'img.jpg', contentType: 'image/jpeg' });
        form.append('size', 'auto');

        const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
          headers: { ...form.getHeaders(), 'X-Api-Key': process.env.REMOVEBG_KEY || 'free' },
          responseType: 'arraybuffer',
          timeout: 30000,
        });
        if (res.status !== 200) return reply('❌ Failed to remove background. (Add REMOVEBG_KEY env var for unlimited)');

        await conn.sendMessage(from, {
          image: Buffer.from(res.data),
          caption: `✂️ *Background Removed*\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },
];
