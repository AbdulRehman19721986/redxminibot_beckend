/**
 * REDXBOT302 — AI Plugin
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { fetchJson } = require('../lib/functions2');
const fakevCard     = require('../lib/fakevcard');
const axios         = require('axios');
const FormData      = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: `🔥 ${BOT_NAME}`,
    serverMessageId: 200,
  },
});

module.exports = [
  // ── GPT / AI Chat
  {
    pattern: 'ai',
    alias: ['gpt', 'chatgpt', 'ask'],
    desc: 'Chat with AI (GPT)',
    category: 'AI',
    react: '🤖',
    use: '.ai your question',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Ask something! Example: *.ai what is the capital of France?*');
        await conn.sendMessage(from, { react: { text: '🤖', key: msg.key } });
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const res = await fetchJson(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(q)}`);
        const answer = res?.data || res?.result || res?.message || res?.response || 'No response';

        await conn.sendMessage(from, {
          text: `🤖 *AI Response*\n\n*Q:* ${q}\n\n*A:* ${answer}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ AI Error: ${e.message}`);
      }
    },
  },

  // ── DeepSeek
  {
    pattern: 'deepseek',
    alias: ['ds'],
    desc: 'Chat with DeepSeek AI',
    category: 'AI',
    react: '🧠',
    use: '.deepseek your question',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Example: *.deepseek explain quantum computing*');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const res = await fetchJson(`https://api.siputzx.my.id/api/ai/deepseek-r1?content=${encodeURIComponent(q)}`);
        const answer = res?.data || res?.result || 'No response';

        await conn.sendMessage(from, {
          text: `🧠 *DeepSeek AI*\n\n*Q:* ${q}\n\n*A:* ${answer}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        reply(`❌ Error: ${e.message}`);
      }
    },
  },

  // ── AI Image Generation (Flux)
  {
    pattern: 'imagine',
    alias: ['fluxai', 'aiimage', 'genimg'],
    desc: 'Generate AI image from text prompt',
    category: 'AI',
    react: '🖼️',
    use: '.imagine a dragon flying over mountains',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Give a prompt! Example: *.imagine a sunset over Pakistan*');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const res = await fetchJson(`https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(q)}`);
        const url = res?.download_url || res?.url || res?.data;
        if (!url) return reply('❌ Could not generate image.');

        await conn.sendMessage(from, {
          image: { url },
          caption: `🎨 *AI Generated Image*\n\n📝 Prompt: ${q}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ Image gen error: ${e.message}`);
      }
    },
  },

  // ── OCR - Image to Text
  {
    pattern: 'ocr',
    alias: ['readimg', 'imgtotext'],
    desc: 'Read text from image (OCR)',
    category: 'AI',
    react: '📝',
    use: '.ocr (reply to image)',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const target = quoted?.imageMessage || msg.message?.imageMessage;
        if (!target) return reply('❌ Reply to an image with *.ocr*');

        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const stream = await downloadContentFromMessage(target, 'image');
        let buf = Buffer.alloc(0);
        for await (const c of stream) buf = Buffer.concat([buf, c]);

        const form = new FormData();
        form.append('file', buf, { filename: 'img.jpg', contentType: 'image/jpeg' });
        const res = await axios.post('https://api.ocr.space/parse/image', form, {
          headers: { ...form.getHeaders(), apikey: 'helloworld' },
          timeout: 30000,
        });
        const text = res.data?.ParsedResults?.[0]?.ParsedText?.trim();
        if (!text) return reply('❌ No text found in image.');

        await conn.sendMessage(from, {
          text: `📝 *OCR Result*\n\n${text}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        reply(`❌ OCR Error: ${e.message}`);
      }
    },
  },

  // ── Summarize
  {
    pattern: 'summarize',
    alias: ['sum', 'tldr'],
    desc: 'Summarize text with AI',
    category: 'AI',
    react: '📋',
    use: '.summarize long text here',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide text to summarize.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const prompt = `Summarize the following in 3-4 sentences:\n\n${q}`;
        const res = await fetchJson(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const answer = res?.data || res?.result || 'Could not summarize.';

        await conn.sendMessage(from, {
          text: `📋 *Summary*\n\n${answer}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        reply(`❌ Error: ${e.message}`);
      }
    },
  },
];
