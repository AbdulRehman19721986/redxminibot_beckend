/**
 * REDXBOT302 v6 — View-Once & Anti-ViewOnce Plugin
 * .vv — reveal view-once media (image/video/audio/voice)
 * Saves to path for later retrieval
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const BOT_NAME  = process.env.BOT_NAME     || '🔥 REDXBOT302 🔥';
const NL_JID    = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const VV_DIR    = path.join(process.cwd(), 'data', 'viewonce');
if (!fs.existsSync(VV_DIR)) fs.mkdirSync(VV_DIR, { recursive: true });

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

// Store viewonce paths per sender
const voCache = new Map();

module.exports = [
  {
    pattern: 'vv', alias: ['viewonce', 'antiviewonce', 'vo', 'reveal'],
    desc: 'Reveal view-once media (image/video/audio/voice)', category: 'Tools',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        // Get the quoted message context
        const ctx     = msg.message?.extendedTextMessage?.contextInfo;
        const quoted  = ctx?.quotedMessage;
        if (!quoted) return reply('❌ Reply to a view-once message with .vv');

        // Find the view-once content type
        const voTypes = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'];
        let voMsg = null, voType = null;

        for (const t of voTypes) {
          if (quoted[t]) { voMsg = quoted[t]; break; }
        }
        // Also check direct media in quoted
        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
        let mediaMsg = null, mediaType = null;

        if (voMsg) {
          // Unwrap viewonce wrapper
          const inner = voMsg.message || voMsg;
          for (const mt of mediaTypes) {
            if (inner[mt]) { mediaMsg = inner[mt]; mediaType = mt.replace('Message',''); break; }
          }
        } else {
          // Direct reply to viewonce
          for (const mt of mediaTypes) {
            if (quoted[mt]?.viewOnce) { mediaMsg = quoted[mt]; mediaType = mt.replace('Message',''); break; }
            if (quoted[mt]) { mediaMsg = quoted[mt]; mediaType = mt.replace('Message',''); break; }
          }
        }

        if (!mediaMsg) return reply('❌ No view-once media found. Reply directly to a view-once message.');

        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        // Download media
        const stream = await downloadContentFromMessage(mediaMsg, mediaType);
        const chunks = []; for await (const c of stream) chunks.push(c);
        const buf = Buffer.concat(chunks);

        // Save to path
        const ext  = mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : mediaType === 'audio' ? 'mp3' : 'bin';
        const fp   = path.join(VV_DIR, `vo_${Date.now()}.${ext}`);
        fs.writeFileSync(fp, buf);

        // Store path in cache
        const sender = ctx?.participant || msg.key.remoteJid;
        voCache.set(sender, { fp, mediaType, mime: mediaMsg.mimetype });
        setTimeout(() => voCache.delete(sender), 30 * 60 * 1000); // clear after 30min

        // Send media
        let payload = { contextInfo: ctxInfo() };
        const cap  = `👁️ *View-Once Revealed*\n📁 Saved to: ${path.basename(fp)}\n\n> 🔥 ${BOT_NAME}`;

        if (mediaType === 'image') {
          payload = { image: buf, caption: cap, contextInfo: ctxInfo() };
        } else if (mediaType === 'video') {
          payload = { video: buf, caption: cap, contextInfo: ctxInfo() };
        } else if (mediaType === 'audio') {
          const isPtt = mediaMsg.ptt;
          payload = { audio: buf, mimetype: mediaMsg.mimetype || 'audio/mpeg', ptt: isPtt };
        }

        await conn.sendMessage(from, payload, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ ViewOnce error: ${e.message}`);
      }
    },
  },

  // Get saved viewonce path
  {
    pattern: 'vopath', alias: ['getvo', 'savedvo'],
    desc: 'Get path of last saved view-once media', category: 'Tools',
    execute: async (conn, msg, m, { from, reply, sender }) => {
      const cached = voCache.get(sender);
      if (!cached) return reply('❌ No saved view-once. Use .vv first.');
      reply(`📁 *Saved ViewOnce Path:*\n\n${cached.fp}\n📎 Type: ${cached.mediaType}\n\n> 🔥 ${BOT_NAME}`);
    },
  },
];
