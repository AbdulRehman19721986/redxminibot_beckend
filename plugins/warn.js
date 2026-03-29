/**
 * REDXBOT302 — Warning System Plugin
 * Commands: warn, warnings, clearwarn, setwarnlimit
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const fs        = require('fs');
const path      = require('path');
const fakevCard = require('../lib/fakevcard');

const BOT_NAME = process.env.BOT_NAME || '🔥 REDXBOT302 🔥';
const NL_JID   = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

const WARN_FILE = path.join(process.cwd(), 'data', 'warnings.json');
function loadWarns() {
  try { return JSON.parse(fs.readFileSync(WARN_FILE, 'utf8')); } catch { return {}; }
}
function saveWarns(data) {
  try { fs.writeFileSync(WARN_FILE, JSON.stringify(data, null, 2)); } catch {}
}

const send = (conn, from, text, mentions = []) =>
  conn.sendMessage(from, { text, mentions, contextInfo: ctxInfo() }, { quoted: fakevCard });

const checkAdmin = async (conn, from, sender) => {
  const meta = await conn.groupMetadata(from);
  const p    = meta.participants.find(x => x.id === sender);
  const isAdm = p?.admin === 'admin' || p?.admin === 'superadmin';
  const ownerNum = process.env.OWNER_NUMBER || '923009842133';
  const isOwn    = sender.split('@')[0].split(':')[0] === ownerNum;
  if (!isAdm && !isOwn) throw new Error('❌ Admin only command.');
  return meta;
};

module.exports = [

  {
    pattern: 'warn',
    desc: 'Warn a user in the group',
    category: 'Group',
    react: '⚠️',
    use: '.warn @user [reason]',
    execute: async (conn, msg, m, { from, args, isGroup, sender, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        await checkAdmin(conn, from, sender);
        const target = m.mentionedJid?.[0] || m.quoted?.sender;
        if (!target) return reply('❌ Mention or reply to a user to warn them.');

        const reason  = m.mentionedJid?.[0] ? args.slice(1).join(' ') : args.join(' ');
        const warns   = loadWarns();
        const key     = `${from}::${target}`;
        warns[key]    = (warns[key] || 0) + 1;
        saveWarns(warns);

        const MAX = 3;
        const count = warns[key];
        const num   = target.split('@')[0];

        await conn.sendMessage(from, { react: { text: '⚠️', key: msg.key } });
        await send(conn, from,
`⚠️ *WARNING ISSUED*

👤 User: @${num}
⚠️ Warnings: ${count}/${MAX}
📝 Reason: ${reason || 'No reason provided'}

${count >= MAX ? '🚨 *MAX WARNINGS REACHED — Kicking user!*' : `🔔 ${MAX - count} more warning(s) before kick.`}

> 🔥 ${BOT_NAME}`, [target]);

        if (count >= MAX) {
          try {
            await new Promise(r => setTimeout(r, 1500));
            await conn.groupParticipantsUpdate(from, [target], 'remove');
            warns[key] = 0;
            saveWarns(warns);
          } catch (e) {
            await send(conn, from, `❌ Couldn't kick @${num}: ${e.message}`, [target]);
          }
        }
      } catch (e) {
        return reply(e.message);
      }
    },
  },

  {
    pattern: 'warnings',
    alias: ['warncount', 'checkwarn'],
    desc: 'Check warnings of a user',
    category: 'Group',
    react: '📋',
    use: '.warnings @user',
    execute: async (conn, msg, m, { from, isGroup, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      const target = m.mentionedJid?.[0] || m.quoted?.sender;
      if (!target) return reply('❌ Mention or reply to a user.');
      const warns = loadWarns();
      const count = warns[`${from}::${target}`] || 0;
      await send(conn, from,
`📋 *Warnings for @${target.split('@')[0]}*

⚠️ Count: ${count}/3
${count === 0 ? '✅ Clean record!' : count >= 3 ? '🚨 Eligible for kick!' : `🔔 ${3 - count} warning(s) remaining.`}

> 🔥 ${BOT_NAME}`, [target]);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  {
    pattern: 'clearwarn',
    alias: ['resetwarn'],
    desc: 'Clear warnings of a user',
    category: 'Group',
    react: '🗑️',
    use: '.clearwarn @user',
    execute: async (conn, msg, m, { from, isGroup, sender, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        await checkAdmin(conn, from, sender);
        const target = m.mentionedJid?.[0] || m.quoted?.sender;
        if (!target) return reply('❌ Mention or reply to a user.');
        const warns = loadWarns();
        delete warns[`${from}::${target}`];
        saveWarns(warns);
        await send(conn, from, `✅ Warnings cleared for @${target.split('@')[0]}!\n\n> 🔥 ${BOT_NAME}`, [target]);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        return reply(e.message);
      }
    },
  },
];
