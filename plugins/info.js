/**
 * REDXBOT302 — Info Plugin
 * userinfo, getpp, jid, botinfo, etc.
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const fakevCard      = require('../lib/fakevcard');
const { runtime }    = require('../lib/functions');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const OWNER_NAME     = process.env.OWNER_NAME     || 'Abdul Rehman Rajpoot';
const CO_OWNER       = process.env.CO_OWNER       || 'Muzamil Khan';
const OWNER_NUM      = process.env.OWNER_NUMBER   || '923009842133';
const CO_OWNER_NUM   = process.env.CO_OWNER_NUM   || '923183928892';
const REPO_LINK      = process.env.REPO_LINK      || 'https://github.com/AbdulRehman19721986/REDXBOT-MD';
const MENU_IMAGE     = process.env.MENU_IMAGE     || 'https://files.catbox.moe/s36b12.jpg';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const WA_GROUP       = process.env.WA_GROUP       || 'https://chat.whatsapp.com/LhSmx2SeXX75r8I2bxsNDo';
const TG_GROUP       = process.env.TG_GROUP       || 'https://t.me/TeamRedxhacker2';
const YOUTUBE        = process.env.YOUTUBE        || 'https://youtube.com/@rootmindtech';
const START_TIME     = Date.now();

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: `🔥 ${BOT_NAME}`,
    serverMessageId: 200,
  },
  externalAdReply: {
    title: `🔥 ${BOT_NAME}`,
    body: `Owner: ${OWNER_NAME}`,
    thumbnailUrl: MENU_IMAGE,
    sourceUrl: REPO_LINK,
    mediaType: 1,
    renderLargerThumbnail: false,
  },
});

module.exports = [
  // ── BOTINFO
  {
    pattern: 'botinfo',
    alias: ['bi', 'info'],
    desc: 'Get bot information',
    category: 'Utility',
    react: 'ℹ️',
    use: '.botinfo',
    execute: async (conn, msg, m, { from }) => {
      const secs = Math.floor((Date.now() - START_TIME) / 1000);
      await conn.sendMessage(from, {
        image: { url: MENU_IMAGE },
        caption:
`╔══════════════════════════════╗
║    🔥 *REDXBOT302 INFO* 🔥    ║
╚══════════════════════════════╝

🤖 *Bot Name:* ${BOT_NAME}
👑 *Owner:* ${OWNER_NAME}
👤 *Co-Owner:* ${CO_OWNER}
📌 *Prefix:* ${process.env.PREFIX || '.'}
🌍 *Mode:* ${(global.BOT_MODE || 'public').toUpperCase()}
⏱️ *Uptime:* ${runtime(secs)}
🔢 *Platform:* WhatsApp MD (Baileys)
🏗️ *Version:* 1.0.0

🔗 *Links:*
• GitHub: ${REPO_LINK}
• WA Group: ${WA_GROUP}
• Telegram: ${TG_GROUP}
• YouTube: ${YOUTUBE}

> ✨ Thank you for using ${BOT_NAME}!`,
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── GETPP (get profile picture)
  {
    pattern: 'getpp',
    alias: ['pp', 'pfp'],
    desc: 'Get profile picture of a user',
    category: 'Utility',
    react: '🖼️',
    use: '.getpp @user',
    execute: async (conn, msg, m, { from, reply, sender }) => {
      try {
        const target = m.mentionedJid?.[0] || m.quoted?.sender || sender;
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const ppUrl = await conn.profilePictureUrl(target, 'image').catch(() => MENU_IMAGE);
        await conn.sendMessage(from, {
          image: { url: ppUrl },
          caption: `🖼️ Profile picture of @${target.split('@')[0]}\n\n> 🔥 ${BOT_NAME}`,
          mentions: [target],
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Could not fetch profile picture: ${e.message}`); }
    },
  },

  // ── JID
  {
    pattern: 'jid',
    desc: 'Get WhatsApp JID of a user or group',
    category: 'Utility',
    react: '🔢',
    use: '.jid',
    execute: async (conn, msg, m, { from, reply, sender }) => {
      const target = m.mentionedJid?.[0] || m.quoted?.sender || sender;
      await conn.sendMessage(from, {
        text:
`🔢 *JID Info*

👤 *Your JID:* ${sender}
📍 *Chat JID:* ${from}
${target !== sender ? `🎯 *Target JID:* ${target}` : ''}

> 🔥 ${BOT_NAME}`,
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── USERINFO
  {
    pattern: 'userinfo',
    alias: ['whois', 'profile'],
    desc: 'Get user information',
    category: 'Utility',
    react: '👤',
    use: '.userinfo @user',
    execute: async (conn, msg, m, { from, reply, sender, isGroup, groupMetadata }) => {
      try {
        const target = m.mentionedJid?.[0] || m.quoted?.sender || sender;
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const ppUrl = await conn.profilePictureUrl(target, 'image').catch(() => MENU_IMAGE);
        const num   = target.split('@')[0];

        let adminStatus = '';
        if (isGroup && groupMetadata) {
          const p = groupMetadata.participants.find(x => x.id === target);
          adminStatus = p?.admin === 'superadmin' ? '👑 Group Creator'
            : p?.admin === 'admin' ? '⭐ Group Admin' : '👤 Member';
        }

        await conn.sendMessage(from, {
          image: { url: ppUrl },
          caption:
`👤 *User Info*

📱 *Number:* +${num}
🆔 *JID:* ${target}
${adminStatus ? `🏅 *Role:* ${adminStatus}` : ''}
${target === OWNER_NUM + '@s.whatsapp.net' ? '👑 *Special:* Bot Owner' : ''}
${target === CO_OWNER_NUM + '@s.whatsapp.net' ? '👤 *Special:* Co-Owner' : ''}

> 🔥 ${BOT_NAME}`,
          mentions: [target],
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── ALIVE (check if bot is online)
  {
    pattern: 'alive',
    alias: ['online', 'status'],
    desc: 'Check if bot is alive',
    category: 'Utility',
    react: '🟢',
    use: '.alive',
    execute: async (conn, msg, m, { from }) => {
      const secs = Math.floor((Date.now() - START_TIME) / 1000);
      await conn.sendMessage(from, {
        image: { url: MENU_IMAGE },
        caption:
`╔══════════════════════════╗
║  ✅ *YES, I'M ALIVE!* ✅  ║
╚══════════════════════════╝

🟢 Status: *Online*
⏱️ Uptime: *${runtime(secs)}*
🤖 Bot: *${BOT_NAME}*
👑 Owner: *${OWNER_NAME}*
🌍 Mode: *${(global.BOT_MODE || 'public').toUpperCase()}*

> 🔥 REDXBOT302 — Always Online!`,
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── LISTCMDS
  {
    pattern: 'listcmds',
    alias: ['commands', 'cmds'],
    desc: 'List all commands',
    category: 'Utility',
    react: '📋',
    use: '.listcmds',
    execute: async (conn, msg, m, { from, prefix }) => {
      // This will be handled by the main menu command, just redirect
      await conn.sendMessage(from, {
        text: `📋 *Use* *${prefix || '.'}menu* *to see all commands with categories!*\n\n> 🔥 ${BOT_NAME}`,
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── RUNTIME
  {
    pattern: 'runtime',
    alias: ['uptime2'],
    desc: 'Show bot runtime',
    category: 'Utility',
    react: '⏱️',
    use: '.runtime',
    execute: async (conn, msg, m, { from }) => {
      const secs = Math.floor((Date.now() - START_TIME) / 1000);
      await conn.sendMessage(from, {
        text: `⏱️ *Runtime:* ${runtime(secs)}\n\n> 🔥 ${BOT_NAME}`,
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },
];
