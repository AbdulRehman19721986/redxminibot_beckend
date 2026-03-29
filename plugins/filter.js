/**
 * REDXBOT302 — Filter/Auto Plugin
 * antilink, antispam, autoread, antidelete, viewonce
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const fakevCard      = require('../lib/fakevcard');
const fs             = require('fs');
const path           = require('path');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const OWNER_NUM      = process.env.OWNER_NUMBER    || '923009842133';
const CO_OWNER_NUM   = process.env.CO_OWNER_NUM    || '923183928892';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID  || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

const DATA_PATH = path.join(process.cwd(), 'data', 'autoAi.json');
function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch { return {}; }
}
function saveData(d) {
  try { fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2)); } catch {}
}

const isOwnerCheck = (jid) => {
  const base = jid.split('@')[0];
  return base === OWNER_NUM || base === CO_OWNER_NUM;
};

module.exports = [
  // ── AUTOREACT ON/OFF
  {
    pattern: 'autoreact',
    desc: 'Toggle auto react to messages',
    category: 'filter',
    react: '😊',
    use: '.autoreact on|off',
    execute: async (conn, msg, m, { from, reply, sender, args }) => {
      if (!isOwnerCheck(sender)) return reply('❌ Owner only.');
      const val = args[0]?.toLowerCase();
      if (!['on','off'].includes(val)) return reply('❌ Usage: .autoreact on|off');
      const d = loadData();
      d.autoreact = val === 'on';
      saveData(d);
      reply(`😊 Auto-React: *${val.toUpperCase()}*\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── VIEWONCE
  {
    pattern: 'viewonce',
    alias: ['vv', 'antiviewonce'],
    desc: 'View once message bypass',
    category: 'filter',
    react: '👁️',
    use: '.viewonce (reply to view-once)',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        const quoted = ctx?.quotedMessage;
        if (!quoted) return reply('❌ Reply to a view-once message.');

        const vo = quoted?.viewOnceMessage?.message || quoted?.viewOnceMessageV2?.message;
        if (!vo) return reply('❌ Not a view-once message.');

        const type = Object.keys(vo)[0];
        const media = vo[type];

        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(media, type.replace('Message', ''));
        let buf = Buffer.alloc(0);
        for await (const c of stream) buf = Buffer.concat([buf, c]);

        if (type === 'imageMessage') {
          await conn.sendMessage(from, {
            image: buf,
            caption: `👁️ *View Once Revealed*\n\n> 🔥 ${BOT_NAME}`,
            contextInfo: ctxInfo(),
          }, { quoted: fakevCard });
        } else if (type === 'videoMessage') {
          await conn.sendMessage(from, {
            video: buf,
            caption: `👁️ *View Once Revealed*\n\n> 🔥 ${BOT_NAME}`,
            contextInfo: ctxInfo(),
          }, { quoted: fakevCard });
        } else {
          reply('❌ Unsupported view-once type.');
        }
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },

  // ── ANTIDELETE
  {
    pattern: 'antidelete',
    desc: 'Toggle anti-delete',
    category: 'filter',
    react: '🗑️',
    use: '.antidelete on|off',
    execute: async (conn, msg, m, { from, isGroup, reply, sender, args }) => {
      if (!isOwnerCheck(sender)) return reply('❌ Owner only.');
      const val = args[0]?.toLowerCase();
      if (!['on','off'].includes(val)) return reply('❌ Usage: .antidelete on|off');
      const d = loadData();
      d.antidelete = val === 'on';
      saveData(d);
      reply(`🗑️ Anti-Delete: *${val.toUpperCase()}*\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── AUTOREAD
  {
    pattern: 'autoread',
    desc: 'Toggle auto read status/messages',
    category: 'filter',
    react: '👁️',
    use: '.autoread on|off',
    execute: async (conn, msg, m, { from, reply, sender, args }) => {
      if (!isOwnerCheck(sender)) return reply('❌ Owner only.');
      const val = args[0]?.toLowerCase();
      if (!['on','off'].includes(val)) return reply('❌ Usage: .autoread on|off');
      const d = loadData();
      d.autoread = val === 'on';
      saveData(d);
      reply(`👁️ Auto-Read: *${val.toUpperCase()}*\n\n> 🔥 ${BOT_NAME}`);
    },
  },
];
