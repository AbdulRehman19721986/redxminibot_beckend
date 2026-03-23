/**
 * REDXBOT302 — Status & Profile Plugin
 * Commands: setstatus, setname, getpp, tagstatus
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fakevCard = require('../lib/fakevcard');

const BOT_NAME   = process.env.BOT_NAME   || '🔥 REDXBOT302 🔥';
const OWNER_NAME = process.env.OWNER_NAME || 'Abdul Rehman Rajpoot';
const OWNER_NUM  = process.env.OWNER_NUMBER || '923009842133';
const NL_JID     = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

const isOwner = (sender) =>
  sender.split('@')[0].split(':')[0] === OWNER_NUM ||
  sender.split('@')[0].split(':')[0] === (process.env.CO_OWNER_NUM || '923183928892');

module.exports = [

  // ── SET STATUS ─────────────────────────────────────────
  {
    pattern: 'setstatus',
    alias: ['setbio'],
    desc: 'Set bot WhatsApp about/status (Owner only)',
    category: 'Owner',
    react: '📝',
    use: '.setstatus <text>',
    execute: async (conn, msg, m, { from, q, sender, reply }) => {
      if (!isOwner(sender)) return reply('❌ Owner only command.');
      if (!q) return reply('❌ Provide a status text.');
      try {
        await conn.updateProfileStatus(q);
        await conn.sendMessage(from, { text: `✅ *Status Updated!*\n\n📝 "${q}"\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        return reply(`❌ Failed: ${e.message}`);
      }
    },
  },

  // ── SET BOT NAME ───────────────────────────────────────
  {
    pattern: 'stsetbotname',
    alias: ['setname'],
    desc: 'Set bot profile name (Owner only)',
    category: 'Owner',
    react: '✏️',
    use: '.setbotname <name>',
    execute: async (conn, msg, m, { from, q, sender, reply }) => {
      if (!isOwner(sender)) return reply('❌ Owner only command.');
      if (!q) return reply('❌ Provide a name.');
      try {
        await conn.updateProfileName(q);
        await conn.sendMessage(from, { text: `✅ *Bot Name Updated!*\n\n👤 "${q}"\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        return reply(`❌ Failed: ${e.message}`);
      }
    },
  },

  // ── SET BOT DP ────────────────────────────────────────
  {
    pattern: 'stsetbotdp',
    alias: ['setpp', 'setdp'],
    desc: 'Set bot profile picture (reply to image, Owner only)',
    category: 'Owner',
    react: '🖼️',
    use: '<reply to image> .setbotdp',
    execute: async (conn, msg, m, { from, sender, reply }) => {
      if (!isOwner(sender)) return reply('❌ Owner only command.');
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imgMsg    = quotedMsg?.imageMessage || msg.message?.imageMessage;
      if (!imgMsg) return reply('❌ Reply to an image to set as bot DP.');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const stream = await downloadContentFromMessage(imgMsg, 'image');
        let buf = Buffer.alloc(0);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        await conn.updateProfilePicture(conn.user.id, buf);
        await conn.sendMessage(from, { text: `✅ *Bot DP Updated!*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        return reply(`❌ Failed to set DP: ${e.message}`);
      }
    },
  },

  // ── GET PP ────────────────────────────────────────────
  {
    pattern: 'stgetpp',
    alias: ['pp', 'pfp', 'profilepic'],
    desc: 'Get profile picture of a user',
    category: 'Utility',
    react: '🖼️',
    use: '.getpp @user or reply to message',
    execute: async (conn, msg, m, { from, reply }) => {
      const target = m.mentionedJid?.[0] || m.quoted?.sender || msg.key.remoteJid;
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const ppUrl = await conn.profilePictureUrl(target, 'image');
        await conn.sendMessage(from, {
          image: { url: ppUrl },
          caption: `🖼️ *Profile Picture*\n\n👤 @${target.split('@')[0]}\n\n> 🔥 ${BOT_NAME}`,
          mentions: [target],
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        return reply('❌ No profile picture found or user has privacy settings enabled.');
      }
    },
  },

  // ── VCARD ─────────────────────────────────────────────
  {
    pattern: 'vcard',
    alias: ['contact', 'vcf'],
    desc: 'Send bot owner contact card',
    category: 'Utility',
    react: '📇',
    use: '.vcard',
    execute: async (conn, msg, m, { from }) => {
      await conn.sendMessage(from, {
        contacts: {
          displayName: `${BOT_NAME} — ${OWNER_NAME}`,
          contacts: [
            {
              vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${OWNER_NAME}\nORG:REDXBOT302 Team;\nTEL;type=CELL;type=VOICE;waid=${OWNER_NUM}:+${OWNER_NUM}\nEND:VCARD`,
            },
            {
              vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Muzamil Khan (Co-Owner)\nORG:REDXBOT302 Team;\nTEL;type=CELL;type=VOICE;waid=${process.env.CO_OWNER_NUM || '923183928892'}:+${process.env.CO_OWNER_NUM || '923183928892'}\nEND:VCARD`,
            },
          ],
        },
      }, { quoted: msg });
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },
];
