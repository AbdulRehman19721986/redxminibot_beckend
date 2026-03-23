/**
 * REDXBOT302 — Owner Plugin
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { fetchJson } = require('../lib/functions2');
const { runtime }   = require('../lib/functions');
const fakevCard     = require('../lib/fakevcard');
const fs            = require('fs');
const path          = require('path');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const OWNER_NUM      = process.env.OWNER_NUMBER    || '923009842133';
const CO_OWNER_NUM   = process.env.CO_OWNER_NUM    || '923183928892';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID  || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});
const send = (conn, from, text) =>
  conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: fakevCard });

const checkOwner = (sender) => {
  const base = sender.split('@')[0];
  return base === OWNER_NUM || base === CO_OWNER_NUM;
};

module.exports = [
  // ── BROADCAST
  {
    pattern: 'broadcast',
    alias: ['bc'],
    desc: 'Broadcast message to all chats',
    category: 'Owner',
    react: '📢',
    use: '.broadcast message',
    execute: async (conn, msg, m, { from, q, reply, sender, isOwner }) => {
      if (!isOwner && !checkOwner(sender)) return reply('❌ Owner only.');
      if (!q) return reply('❌ Provide a message to broadcast.');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

      const chats = await conn.groupFetchAllParticipating().catch(() => ({}));
      const keys  = Object.keys(chats);
      let sent    = 0;

      for (const jid of keys) {
        try {
          await conn.sendMessage(jid, {
            text: `📢 *Broadcast from ${BOT_NAME}*\n\n${q}\n\n> 🔥 ${BOT_NAME}`,
            contextInfo: ctxInfo(),
          });
          sent++;
          await new Promise(r => setTimeout(r, 1500));
        } catch {}
      }
      await send(conn, from, `✅ Broadcast sent to ${sent}/${keys.length} groups.`);
    },
  },

  // ── SETBOTDP
  {
    pattern: 'setbotdp',
    alias: ['setdp', 'changedp'],
    desc: 'Change bot profile picture',
    category: 'Owner',
    react: '🖼️',
    use: '.setbotdp (reply to image)',
    execute: async (conn, msg, m, { from, reply, sender, isOwner }) => {
      if (!isOwner && !checkOwner(sender)) return reply('❌ Owner only.');
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const target = quoted?.imageMessage || msg.message?.imageMessage;
      if (!target) return reply('❌ Reply to an image.');
      try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(target, 'image');
        let buf = Buffer.alloc(0);
        for await (const c of stream) buf = Buffer.concat([buf, c]);
        await conn.updateProfilePicture(conn.user.id, buf);
        await send(conn, from, `✅ Bot profile picture updated!\n\n> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },

  // ── SETBOTNAME
  {
    pattern: 'setbotname',
    alias: ['setname'],
    desc: 'Change bot display name',
    category: 'Owner',
    react: '✏️',
    use: '.setbotname New Name',
    execute: async (conn, msg, m, { from, q, reply, sender, isOwner }) => {
      if (!isOwner && !checkOwner(sender)) return reply('❌ Owner only.');
      if (!q) return reply('❌ Provide a name.');
      try {
        await conn.updateProfileName(q);
        await send(conn, from, `✅ Bot name changed to: *${q}*\n\n> 🔥 ${BOT_NAME}`);
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },

  // ── CLEARTMP
  {
    pattern: 'cleartmp',
    alias: ['cleantemp'],
    desc: 'Clear temp folder',
    category: 'Owner',
    react: '🗑️',
    use: '.cleartmp',
    execute: async (conn, msg, m, { from, reply, sender, isOwner }) => {
      if (!isOwner && !checkOwner(sender)) return reply('❌ Owner only.');
      const tmpDir = path.join(process.cwd(), 'temp');
      let count = 0;
      if (fs.existsSync(tmpDir)) {
        for (const f of fs.readdirSync(tmpDir)) {
          try { fs.unlinkSync(path.join(tmpDir, f)); count++; } catch {}
        }
      }
      await send(conn, from, `🗑️ Cleared *${count}* temp files.\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── BLOCK
  {
    pattern: 'block',
    desc: 'Block a user',
    category: 'Owner',
    react: '🚫',
    use: '.block @user',
    execute: async (conn, msg, m, { from, reply, sender, isOwner }) => {
      if (!isOwner && !checkOwner(sender)) return reply('❌ Owner only.');
      const target = m.mentionedJid?.[0] || m.quoted?.sender;
      if (!target) return reply('❌ Mention or reply to user.');
      await conn.updateBlockStatus(target, 'block');
      await send(conn, from, `🚫 Blocked @${target.split('@')[0]}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── UNBLOCK
  {
    pattern: 'unblock',
    desc: 'Unblock a user',
    category: 'Owner',
    react: '✅',
    use: '.unblock @user',
    execute: async (conn, msg, m, { from, reply, sender, isOwner }) => {
      if (!isOwner && !checkOwner(sender)) return reply('❌ Owner only.');
      const target = m.mentionedJid?.[0] || m.quoted?.sender;
      if (!target) return reply('❌ Mention or reply to user.');
      await conn.updateBlockStatus(target, 'unblock');
      await send(conn, from, `✅ Unblocked @${target.split('@')[0]}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── SHUTDOWN / RESTART
  {
    pattern: 'shutdown',
    alias: ['restart'],
    desc: 'Restart the bot',
    category: 'Owner',
    react: '🔄',
    use: '.shutdown',
    execute: async (conn, msg, m, { from, reply, sender, isOwner }) => {
      if (!isOwner && !checkOwner(sender)) return reply('❌ Owner only.');
      await send(conn, from, `🔄 *${BOT_NAME}* is restarting...\n\n> 🔥 By Abdul Rehman Rajpoot`);
      await new Promise(r => setTimeout(r, 2000));
      process.exit(0);
    },
  },

  // ── EVAL
  {
    pattern: 'eval',
    alias: ['exec'],
    desc: 'Execute JavaScript code',
    category: 'Owner',
    react: '💻',
    use: '.eval 1+1',
    execute: async (conn, msg, m, { from, q, reply, sender, isOwner }) => {
      if (!isOwner && !checkOwner(sender)) return reply('❌ Owner only.');
      if (!q) return reply('❌ Provide code to execute.');
      try {
        // eslint-disable-next-line no-eval
        let result = eval(q);
        if (typeof result !== 'string') result = require('util').inspect(result, { depth: 4 });
        await send(conn, from, `💻 *Eval Result*\n\n\`\`\`\n${result}\n\`\`\`\n\n> 🔥 ${BOT_NAME}`);
      } catch (e) {
        await send(conn, from, `❌ *Eval Error*\n\n${e.message}\n\n> 🔥 ${BOT_NAME}`);
      }
    },
  },
];
