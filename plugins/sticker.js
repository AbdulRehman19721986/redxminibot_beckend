/**
 * REDXBOT302 — Sticker Plugin
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes }      = require('wa-sticker-formatter');
const fakevCard = require('../lib/fakevcard');

const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';

async function downloadMedia(msg, type) {
  const stream = await downloadContentFromMessage(msg, type);
  let buf = Buffer.alloc(0);
  for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
  return buf;
}

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
  // ── .s — image/video → sticker
  {
    pattern: 's',
    alias: ['sticker'],
    desc: 'Convert image/video/GIF to sticker',
    category: 'Sticker',
    react: '🎭',
    use: '.s [author name]',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const target = quoted || msg.message;
        if (!target) return reply('❌ Reply to an image/video/GIF with *.s*');

        let mediaNode, mediaType;
        if (target.imageMessage)        { mediaNode = target.imageMessage;   mediaType = 'image'; }
        else if (target.videoMessage)   { mediaNode = target.videoMessage;   mediaType = 'video'; }
        else if (target.stickerMessage) { mediaNode = target.stickerMessage; mediaType = 'sticker'; }
        else return reply('❌ Reply to an image, video or sticker.');

        const buf   = await downloadMedia(mediaNode, mediaType);
        const pack  = process.env.STICKER_PACK   || BOT_NAME;
        const author = q.trim() || process.env.STICKER_AUTHOR || 'REDXBOT302';

        const sticker = new Sticker(buf, {
          pack,
          author,
          type: mediaType === 'video' ? StickerTypes.ANIMATED : StickerTypes.FULL,
          categories: ['🔥'],
          quality: 50,
        });

        const stickerBuf = await sticker.toBuffer();
        await conn.sendMessage(from, { sticker: stickerBuf }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });

      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ Sticker error: ${e.message}`);
      }
    },
  },

  // ── .toimg — sticker → image
  {
    pattern: 'toimg',
    alias: ['stickertoimg'],
    desc: 'Convert sticker to image',
    category: 'Sticker',
    react: '🖼️',
    use: '.toimg (reply to sticker)',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const target = quoted?.stickerMessage;
        if (!target) return reply('❌ Reply to a sticker with *.toimg*');

        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const buf = await downloadMedia(target, 'sticker');
        await conn.sendMessage(from, { image: buf, caption: `🖼️ Sticker → Image\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        reply(`❌ Error: ${e.message}`);
      }
    },
  },

  // ── .emojisticker — emoji to sticker
  {
    pattern: 'emojisticker',
    alias: ['esticker'],
    desc: 'Convert emoji to sticker',
    category: 'Sticker',
    react: '😊',
    use: '.emojisticker 😍',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide an emoji. Example: *.emojisticker 😍*');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const code = [...q.trim()][0].codePointAt(0).toString(16).padStart(4, '0');
        const url  = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${code}.png`;
        const sticker = new Sticker(url, {
          pack:   BOT_NAME,
          author: 'REDXBOT302',
          type:   StickerTypes.FULL,
        });
        const buf = await sticker.toBuffer();
        await conn.sendMessage(from, { sticker: buf }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        reply(`❌ Error: ${e.message}`);
      }
    },
  },
];
