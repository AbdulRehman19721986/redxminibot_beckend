'use strict';
const store = require('../lib/store');
const fvc   = require('../lib/fakevcard');
const { isAdmin, react } = require('../lib/utils');

// ── Helper ────────────────────────────────────────────────────
const toggle = async (conn, from, sender, store_key, feature, q, msg) => {
  const isAdm = await isAdmin(conn, from, sender);
  if (!isAdm) return conn.sendMessage(from, { text: '❌ Admins only!' }, { quoted: fvc });
  const val = q?.toLowerCase();
  if (!['on','off'].includes(val)) return conn.sendMessage(from, { text: `⚙️ Usage: .${feature} on/off\nCurrent: *${store_key.get(from) ? 'ON ✅' : 'OFF ❌'}*` }, { quoted: fvc });
  store_key.set(from, val === 'on');
  await conn.sendMessage(from, { text: `✅ *${feature.toUpperCase()}* is now *${val === 'on' ? 'ON ✅' : 'OFF ❌'}*` }, { quoted: fvc });
};

module.exports = [
  // ── ANTILINK ───────────────────────────────────────────────
  {
    pattern: 'antilink', alias: ['antilnk'], category: 'setting',
    desc: 'Block WhatsApp invite links in group', react: '🛡️',
    execute: async (conn, msg, m, { from, q, sender, isGroup, reply }) => {
      if (!isGroup) return reply('❌ Group only');
      await toggle(conn, from, sender, store.antilink, 'antilink', q, msg);
    },
  },
  // ── ANTISPAM ───────────────────────────────────────────────
  {
    pattern: 'antispam', category: 'setting',
    desc: 'Kick members who spam messages', react: '🚫',
    execute: async (conn, msg, m, { from, q, sender, isGroup, reply }) => {
      if (!isGroup) return reply('❌ Group only');
      await toggle(conn, from, sender, store.antispam, 'antispam', q, msg);
    },
  },
  // ── ANTITAG ────────────────────────────────────────────────
  {
    pattern: 'antitag', category: 'setting',
    desc: 'Prevent members from tagging everyone', react: '🏷️',
    execute: async (conn, msg, m, { from, q, sender, isGroup, reply }) => {
      if (!isGroup) return reply('❌ Group only');
      await toggle(conn, from, sender, store.antitag, 'antitag', q, msg);
    },
  },
  // ── ANTICALL ───────────────────────────────────────────────
  {
    pattern: 'anticall', category: 'setting',
    desc: 'Auto-reject incoming calls', react: '📵',
    execute: async (conn, msg, m, { from, q, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only');
      const val = q?.toLowerCase();
      if (!['on','off'].includes(val)) return reply(`⚙️ .anticall on/off\nCurrent: *${store.anticall.get('enabled') ? 'ON ✅' : 'OFF ❌'}*`);
      store.anticall.set('enabled', val === 'on');
      reply(`✅ *ANTICALL* is now *${val === 'on' ? 'ON ✅' : 'OFF ❌'}*`);
    },
  },
  // ── ANTIDELETE ─────────────────────────────────────────────
  {
    pattern: 'antidelete', alias: ['antidel'], category: 'setting',
    desc: 'Re-send deleted messages', react: '♻️',
    execute: async (conn, msg, m, { from, q, sender, isGroup, reply }) => {
      if (!isGroup) return reply('❌ Group only');
      await toggle(conn, from, sender, store.antidel, 'antidelete', q, msg);
    },
  },
  // ── WARN ───────────────────────────────────────────────────
  {
    pattern: 'warn', category: 'group',
    desc: 'Warn a user (3 warns = kick)', react: '⚠️',
    execute: async (conn, msg, m, { from, isGroup, reply, sender }) => {
      if (!isGroup) return reply('❌ Group only');
      if (!await isAdmin(conn, from, sender)) return reply('❌ Admins only');
      const target = m.mentionedJid?.[0] || m.quoted?.sender;
      if (!target) return reply('❌ Mention or reply to user to warn');
      const key   = `${from}:${target}`;
      const count = (store.warns.get(key) || 0) + 1;
      store.warns.set(key, count);
      if (count >= 3) {
        await conn.groupParticipantsUpdate(from, [target], 'remove');
        store.warns.del(key);
        return conn.sendMessage(from, { text: `👢 @${target.split('@')[0]} kicked after 3 warnings!`, mentions: [target] }, { quoted: fvc });
      }
      await conn.sendMessage(from, { text: `⚠️ *WARNING ${count}/3*\n@${target.split('@')[0]} has been warned!`, mentions: [target] }, { quoted: fvc });
    },
  },
  // ── RESETWARN ──────────────────────────────────────────────
  {
    pattern: 'resetwarn', alias: ['rwarn'], category: 'group',
    desc: 'Reset warnings for a user', react: '🔄',
    execute: async (conn, msg, m, { from, isGroup, reply, sender }) => {
      if (!isGroup) return reply('❌ Group only');
      if (!await isAdmin(conn, from, sender)) return reply('❌ Admins only');
      const target = m.mentionedJid?.[0] || m.quoted?.sender;
      if (!target) return reply('❌ Mention or reply to user');
      store.warns.del(`${from}:${target}`);
      conn.sendMessage(from, { text: `✅ Warnings reset for @${target.split('@')[0]}`, mentions: [target] }, { quoted: fvc });
    },
  },
  // ── BLOCK ──────────────────────────────────────────────────
  {
    pattern: 'block', category: 'owner',
    desc: 'Block a user from using the bot', react: '🚫',
    execute: async (conn, msg, m, { from, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only');
      const target = m.mentionedJid?.[0] || m.quoted?.sender;
      if (!target) return reply('❌ Mention user to block');
      store.blocked.set(target, true);
      await conn.sendMessage(from, { text: `🚫 *${target.split('@')[0]}* blocked from using the bot.` }, { quoted: fvc });
    },
  },
  // ── UNBLOCK ────────────────────────────────────────────────
  {
    pattern: 'unblock', category: 'owner',
    desc: 'Unblock a user', react: '✅',
    execute: async (conn, msg, m, { from, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only');
      const target = m.mentionedJid?.[0] || m.quoted?.sender;
      if (!target) return reply('❌ Mention user to unblock');
      store.blocked.del(target);
      await conn.sendMessage(from, { text: `✅ *${target.split('@')[0]}* unblocked.` }, { quoted: fvc });
    },
  },
];
