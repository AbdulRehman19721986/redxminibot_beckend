'use strict';
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fvc = require('../lib/fakevcard');

module.exports = [
  {
    pattern: 's', alias: ['sticker', 'stiker'],
    desc: 'Convert image/video/GIF to sticker',
    category: 'sticker', react: '🖼️',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        const { Sticker, StickerTypes } = require('wa-sticker-formatter');

        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
        if (!quotedMsg) return reply('❌ Reply to an image/video/GIF or send as caption');

        let mediaNode = null, mediaType = null;
        if (quotedMsg.imageMessage)   { mediaNode = quotedMsg.imageMessage;  mediaType = 'image';   }
        else if (quotedMsg.videoMessage) { mediaNode = quotedMsg.videoMessage; mediaType = 'video'; }
        else if (quotedMsg.stickerMessage) { mediaNode = quotedMsg.stickerMessage; mediaType = 'sticker'; }
        else return reply('❌ Reply to an image, video, or sticker');

        await conn.sendMessage(from, { react: { text: '🔄', key: msg.key } });

        // Download
        const stream = await downloadContentFromMessage(mediaNode, mediaType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        if (!buffer.length) return reply('❌ Failed to download media');

        // Convert to webp
        let webp = buffer;
        if (mediaType !== 'sticker') {
          try {
            const { imageToWebp, videoToWebp } = require('../lib/video-utils');
            webp = mediaType === 'image' ? await imageToWebp(buffer) : await videoToWebp(buffer);
          } catch {}
        }

        // Create sticker
        const authorName = q?.trim() || 'REDXBOT302';
        try {
          const sticker = new Sticker(webp, { pack: '', author: authorName, type: StickerTypes.FULL, quality: 75 });
          const out = await sticker.toBuffer();
          await conn.sendMessage(from, { sticker: out }, { quoted: fvc });
        } catch {
          await conn.sendMessage(from, { sticker: webp }, { quoted: fvc });
        }
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        reply(`❌ Sticker failed: ${e.message}`);
      }
    },
  },
  {
    pattern: 'toimg', alias: ['stickertoimg', 'sticker2img'],
    desc: 'Convert sticker to image',
    category: 'sticker', react: '🖼️',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg?.stickerMessage) return reply('❌ Reply to a sticker');
        const stream = await downloadContentFromMessage(quotedMsg.stickerMessage, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await conn.sendMessage(from, { image: buffer, caption: '🖼️ Sticker → Image' }, { quoted: fvc });
      } catch (e) { reply(`❌ Failed: ${e.message}`); }
    },
  },
];
