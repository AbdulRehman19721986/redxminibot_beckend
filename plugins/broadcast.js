/**
 * REDXBOT302 — Broadcast & Tag Plugin
 * Commands: tagall, hidetag, broadcast, poll
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const fakevCard = require('../lib/fakevcard');

const BOT_NAME   = process.env.BOT_NAME   || '🔥 REDXBOT302 🔥';
const OWNER_NAME = process.env.OWNER_NAME || 'Abdul Rehman Rajpoot';
const NL_JID     = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

const checkAdmin = async (conn, from, sender) => {
  const meta = await conn.groupMetadata(from);
  const p    = meta.participants.find(x => x.id === sender);
  const isAdm = p?.admin === 'admin' || p?.admin === 'superadmin';
  const ownerNum = process.env.OWNER_NUMBER || '923009842133';
  const isOwn    = sender.split('@')[0].split(':')[0] === ownerNum;
  if (!isAdm && !isOwn) throw new Error('❌ Admin/Owner only.');
  return meta;
};

module.exports = [

  // ── TAG ALL ────────────────────────────────────────────
  {
    pattern: 'btagall',
    alias: ['tag', 'everyone', 'all'],
    desc: 'Tag all group members',
    category: 'Group',
    react: '📢',
    use: '.tagall [message]',
    execute: async (conn, msg, m, { from, q, isGroup, sender, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        const meta = await checkAdmin(conn, from, sender);
        const members   = meta.participants.map(p => p.id);
        const mentions  = members;
        const chunkSize = 20;
        const message   = q || '📢 Attention everyone!';

        // Build mention text
        const tags = members.map(id => `@${id.split('@')[0]}`).join(' ');
        const text =
`╔══════[ *TAG ALL* ]══════╗

📢 ${message}

${tags}

> 🔥 ${BOT_NAME} | By ${OWNER_NAME}`;

        await conn.sendMessage(from, { text, mentions, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        return reply(e.message);
      }
    },
  },

  // ── HIDETAG ────────────────────────────────────────────
  {
    pattern: 'hidetag',
    alias: ['htag', 'silentping'],
    desc: 'Tag all members silently (no visible mention)',
    category: 'Group',
    react: '🔕',
    use: '.hidetag <message>',
    execute: async (conn, msg, m, { from, q, isGroup, sender, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      if (!q) return reply('❌ Provide a message.\n*Usage:* .hidetag <message>');
      try {
        const meta    = await checkAdmin(conn, from, sender);
        const mentions = meta.participants.map(p => p.id);
        await conn.sendMessage(from, { text: q, mentions, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        return reply(e.message);
      }
    },
  },

  // ── POLL ───────────────────────────────────────────────
  {
    pattern: 'poll',
    desc: 'Create a poll in the group',
    category: 'Group',
    react: '📊',
    use: '.poll Question | Option1 | Option2 | ...',
    execute: async (conn, msg, m, { from, q, isGroup, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      if (!q) return reply('❌ Usage: .poll Question | Option1 | Option2\nExample: .poll Best food? | Pizza | Burger | Sushi');
      const parts = q.split('|').map(x => x.trim()).filter(Boolean);
      if (parts.length < 3) return reply('❌ Provide a question and at least 2 options.\n*Usage:* .poll Question | Opt1 | Opt2');
      const [question, ...opts] = parts;
      try {
        await conn.sendMessage(from, {
          poll: {
            name:              question,
            values:            opts.slice(0, 12),
            selectableCount:   1,
          },
        });
        await conn.sendMessage(from, { react: { text: '📊', key: msg.key } });
      } catch (e) {
        return reply(`❌ Failed to create poll: ${e.message}`);
      }
    },
  },

  // ── MUTE/UNMUTE ────────────────────────────────────────
  {
    pattern: 'bmute',
    desc: 'Mute the group (only admins can message)',
    category: 'Group',
    react: '🔇',
    use: '.mute',
    execute: async (conn, msg, m, { from, isGroup, sender, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        await checkAdmin(conn, from, sender);
        await conn.groupSettingUpdate(from, 'announcement');
        await conn.sendMessage(from, { text: '🔇 *Group Muted!*\nOnly admins can now send messages.\n\n> 🔥 ' + BOT_NAME, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '🔇', key: msg.key } });
      } catch (e) { return reply(e.message); }
    },
  },

  {
    pattern: 'bunmute',
    desc: 'Unmute the group (everyone can message)',
    category: 'Group',
    react: '🔊',
    use: '.unmute',
    execute: async (conn, msg, m, { from, isGroup, sender, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        await checkAdmin(conn, from, sender);
        await conn.groupSettingUpdate(from, 'not_announcement');
        await conn.sendMessage(from, { text: '🔊 *Group Unmuted!*\nEveryone can now send messages.\n\n> 🔥 ' + BOT_NAME, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '🔊', key: msg.key } });
      } catch (e) { return reply(e.message); }
    },
  },

  // ── GROUP INFO ────────────────────────────────────────
  {
    pattern: 'bgroupinfo',
    alias: ['ginfo', 'grpinfo'],
    desc: 'Show group info and stats',
    category: 'Group',
    react: 'ℹ️',
    use: '.groupinfo',
    execute: async (conn, msg, m, { from, isGroup, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        const meta    = await conn.groupMetadata(from);
        const admins  = meta.participants.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`).join(', ');
        const created = new Date(meta.creation * 1000).toLocaleDateString('en-US');
        const text =
`╔══════[ *Group Info* ]══════╗

📌 *Name:* ${meta.subject}
📝 *Desc:* ${(meta.desc || 'No description').substring(0, 100)}
👥 *Members:* ${meta.participants.length}
👑 *Admins:* ${admins || 'N/A'}
📅 *Created:* ${created}
🔗 *JID:* ${meta.id}

> 🔥 ${BOT_NAME}`;
        await conn.sendMessage(from, {
          text,
          mentions: meta.participants.filter(p => p.admin).map(p => p.id),
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        return reply(`❌ Failed to fetch group info: ${e.message}`);
      }
    },
  },

  // ── INVITE LINK ───────────────────────────────────────
  {
    pattern: 'binvitelink',
    alias: ['invite', 'link'],
    desc: 'Get group invite link',
    category: 'Group',
    react: '🔗',
    use: '.invitelink',
    execute: async (conn, msg, m, { from, isGroup, sender, reply }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        await checkAdmin(conn, from, sender);
        const code = await conn.groupInviteCode(from);
        await conn.sendMessage(from, {
          text: `🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${code}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { return reply(e.message); }
    },
  },
];
