/**
 * REDXBOT302 — Anti-Abuse Plugin
 * Commands: antilink, antibadword, antispam toggle + enforcement
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const fs        = require('fs');
const path      = require('path');
const fakevCard = require('../lib/fakevcard');

const BOT_NAME   = process.env.BOT_NAME   || '🔥 REDXBOT302 🔥';
const NL_JID     = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});
const sendWarn = (conn, from, text, mentions = []) =>
  conn.sendMessage(from, { text, mentions, contextInfo: ctxInfo() }, { quoted: fakevCard });

// Persistent settings
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'antiabuse.json');
function loadSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch { return {}; }
}
function saveSettings(data) {
  try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2)); } catch {}
}

let settings = loadSettings();

// Link regex
const LINK_REGEX = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/[^\s]+|t\.me\/[^\s]+)/gi;

// Bad words list (customize as needed)
const BAD_WORDS = ['badword1','badword2','spam','scam','hack',
  // Urdu/common bad words
  'gandu','madarchod','chutiya','bhenchod','lund','gaand','harami'];

// Spam tracking
const msgTracker = new Map(); // jid -> { count, timer }

module.exports = [

  // ── ANTILINK TOGGLE ────────────────────────────────────
  {
    pattern: 'antilink',
    desc: 'Toggle anti-link in group',
    category: 'Filter',
    react: '🔗',
    use: '.antilink on|off',
    execute: async (conn, msg, m, { from, args, isGroup, sender, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      const jidToBase = j => j.split('@')[0].split(':')[0];
      const ownerNum  = process.env.OWNER_NUMBER || '923009842133';
      const isOwner   = jidToBase(sender) === ownerNum || jidToBase(sender) === (process.env.CO_OWNER_NUM || '923183928892');
      let   meta, isAdmin = false;
      try { meta = await conn.groupMetadata(from); const p = meta.participants.find(x => x.id === sender); isAdmin = p?.admin === 'admin' || p?.admin === 'superadmin'; } catch {}
      if (!isOwner && !isAdmin) return reply('❌ Only admins can toggle antilink.');

      const val = args[0]?.toLowerCase();
      if (!['on','off'].includes(val)) return reply('❌ Usage: .antilink on|off');
      settings[from] = settings[from] || {};
      settings[from].antilink = val === 'on';
      saveSettings(settings);
      await sendWarn(conn, from, `${val === 'on' ? '🔒' : '🔓'} *AntiLink ${val.toUpperCase()}*\n\nLinks ${val === 'on' ? 'will now be deleted and violators warned!' : 'are now allowed.'}\n\n> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: val === 'on' ? '🔒' : '🔓', key: msg.key } });
    },
  },

  // ── ANTIBADWORD TOGGLE ─────────────────────────────────
  {
    pattern: 'antibadword',
    alias: ['antiswear'],
    desc: 'Toggle anti-bad-word filter',
    category: 'Filter',
    react: '🤬',
    use: '.antibadword on|off',
    execute: async (conn, msg, m, { from, args, isGroup, sender, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      const jidToBase = j => j.split('@')[0].split(':')[0];
      const ownerNum  = process.env.OWNER_NUMBER || '923009842133';
      const isOwner   = jidToBase(sender) === ownerNum;
      let   meta, isAdmin = false;
      try { meta = await conn.groupMetadata(from); const p = meta.participants.find(x => x.id === sender); isAdmin = p?.admin === 'admin' || p?.admin === 'superadmin'; } catch {}
      if (!isOwner && !isAdmin) return reply('❌ Only admins can toggle this.');

      const val = args[0]?.toLowerCase();
      if (!['on','off'].includes(val)) return reply('❌ Usage: .antibadword on|off');
      settings[from] = settings[from] || {};
      settings[from].antibadword = val === 'on';
      saveSettings(settings);
      await sendWarn(conn, from, `${val === 'on' ? '🤬' : '✅'} *Anti-BadWord ${val.toUpperCase()}*\n\nBad language ${val === 'on' ? 'will now be detected and deleted.' : 'filter is now disabled.'}\n\n> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  // ── ANTISPAM TOGGLE ────────────────────────────────────
  {
    pattern: 'antispam',
    desc: 'Toggle anti-spam (5 msgs/10s)',
    category: 'Filter',
    react: '🚫',
    use: '.antispam on|off',
    execute: async (conn, msg, m, { from, args, isGroup, sender, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      const jidToBase = j => j.split('@')[0].split(':')[0];
      const ownerNum  = process.env.OWNER_NUMBER || '923009842133';
      const isOwner   = jidToBase(sender) === ownerNum;
      let   meta, isAdmin = false;
      try { meta = await conn.groupMetadata(from); const p = meta.participants.find(x => x.id === sender); isAdmin = p?.admin === 'admin' || p?.admin === 'superadmin'; } catch {}
      if (!isOwner && !isAdmin) return reply('❌ Only admins can toggle this.');

      const val = args[0]?.toLowerCase();
      if (!['on','off'].includes(val)) return reply('❌ Usage: .antispam on|off');
      settings[from] = settings[from] || {};
      settings[from].antispam = val === 'on';
      saveSettings(settings);
      await sendWarn(conn, from, `🚫 *AntiSpam ${val.toUpperCase()}*\n\nSpam detection ${val === 'on' ? 'enabled. Sending 5+ messages in 10s = warning.' : 'disabled.'}\n\n> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  // ── GROUP SETTINGS INFO ────────────────────────────────
  {
    pattern: 'groupsettings',
    alias: ['gsettings', 'filters'],
    desc: 'Show current group filter settings',
    category: 'Filter',
    react: '⚙️',
    use: '.groupsettings',
    execute: async (conn, msg, m, { from, isGroup, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      const s = settings[from] || {};
      await sendWarn(conn, from,
`╔══[ *Group Settings* ]══╗

🔗 *AntiLink:* ${s.antilink ? '🟢 ON' : '🔴 OFF'}
🤬 *AntiBadWord:* ${s.antibadword ? '🟢 ON' : '🔴 OFF'}
🚫 *AntiSpam:* ${s.antispam ? '🟢 ON' : '🔴 OFF'}

> Use .antilink/.antibadword/.antispam to toggle
> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },
];

// ── MESSAGE EVENT HOOK (called from index.js message handler) ──
module.exports.handleAntiAbuse = async function(conn, msg) {
  try {
    const from   = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    if (!from?.endsWith('@g.us')) return;

    const s = settings[from] || {};
    const body = msg.message?.conversation
      || msg.message?.extendedTextMessage?.text
      || msg.message?.imageMessage?.caption
      || msg.message?.videoMessage?.caption || '';

    const jidToBase = j => j.split('@')[0].split(':')[0];
    const ownerNum  = process.env.OWNER_NUMBER || '923009842133';
    const isOwner   = jidToBase(sender) === ownerNum;
    if (isOwner) return; // never penalize owner

    // ── ANTILINK
    if (s.antilink && LINK_REGEX.test(body)) {
      try { await conn.sendMessage(from, { delete: msg.key }); } catch {}
      await sendWarn(conn, from,
        `⚠️ *AntiLink Warning!*\n@${jidToBase(sender)} — Links are not allowed here!\n\n> 🔥 ${BOT_NAME}`,
        [sender]);
    }

    // ── ANTIBADWORD
    if (s.antibadword) {
      const lower = body.toLowerCase();
      const found = BAD_WORDS.find(w => lower.includes(w));
      if (found) {
        try { await conn.sendMessage(from, { delete: msg.key }); } catch {}
        await sendWarn(conn, from,
          `⚠️ *Bad Language Warning!*\n@${jidToBase(sender)} — Please keep it clean!\n\n> 🔥 ${BOT_NAME}`,
          [sender]);
      }
    }

    // ── ANTISPAM
    if (s.antispam) {
      const key = `${from}::${sender}`;
      const now = Date.now();
      if (!msgTracker.has(key)) msgTracker.set(key, { count: 0, first: now });
      const track = msgTracker.get(key);
      if (now - track.first > 10000) { track.count = 0; track.first = now; }
      track.count++;
      if (track.count > 5) {
        await sendWarn(conn, from,
          `⚠️ *AntiSpam Warning!*\n@${jidToBase(sender)} — You're sending too many messages!\n\n> 🔥 ${BOT_NAME}`,
          [sender]);
        track.count = 0;
      }
    }
  } catch {}
};
