/**
 * REDXBOT302 — Group Management Plugin
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const path = require('path');
const fs   = require('fs');

const fakevCard     = require('../lib/fakevcard');
const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

const getGroupMeta  = (conn, from)    => conn.groupMetadata(from);
const checkAdmin    = async (conn, from, sender) => {
  const meta  = await getGroupMeta(conn, from);
  const p     = meta.participants.find(x => x.id === sender);
  const isAdm = p?.admin === 'admin' || p?.admin === 'superadmin';
  const isBot = conn.user.id.split(':')[0] === sender.split('@')[0];
  if (!isAdm && !isBot) throw new Error('❌ Only admins can use this command.');
  return meta;
};

const sendOk = async (conn, from, text, mentions = [], key) => {
  if (key) await conn.sendMessage(from, { react: { text: '✅', key } });
  await conn.sendMessage(from, { text, mentions, contextInfo: ctxInfo() }, { quoted: fakevCard });
};

module.exports = [
  // ── KICK
  {
    pattern: 'kick',
    alias: ['remove'],
    desc: 'Kick a member from group',
    category: 'Group',
    react: '👢',
    use: '.kick @user',
    execute: async (conn, msg, m, { from, isGroup, reply, sender }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        await checkAdmin(conn, from, sender);
        const target = m.mentionedJid?.[0] || m.quoted?.sender;
        if (!target) return reply('❌ Mention or reply to user to kick.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        await conn.groupParticipantsUpdate(from, [target], 'remove');
        await sendOk(conn, from, `👢 @${target.split('@')[0]} has been kicked!\n\n> 🔥 ${BOT_NAME}`, [target], msg.key);
      } catch (e) { reply(e.message); }
    },
  },

  // ── PROMOTE
  {
    pattern: 'promote',
    desc: 'Promote member to admin',
    category: 'Group',
    react: '⬆️',
    use: '.promote @user',
    execute: async (conn, msg, m, { from, isGroup, reply, sender }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        await checkAdmin(conn, from, sender);
        const target = m.mentionedJid?.[0] || m.quoted?.sender;
        if (!target) return reply('❌ Mention or reply to user.');
        await conn.groupParticipantsUpdate(from, [target], 'promote');
        await sendOk(conn, from, `⬆️ @${target.split('@')[0]} promoted to admin! 👑\n\n> 🔥 ${BOT_NAME}`, [target], msg.key);
      } catch (e) { reply(e.message); }
    },
  },

  // ── DEMOTE
  {
    pattern: 'demote',
    desc: 'Demote admin to member',
    category: 'Group',
    react: '⬇️',
    use: '.demote @user',
    execute: async (conn, msg, m, { from, isGroup, reply, sender }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        await checkAdmin(conn, from, sender);
        const target = m.mentionedJid?.[0] || m.quoted?.sender;
        if (!target) return reply('❌ Mention or reply to user.');
        await conn.groupParticipantsUpdate(from, [target], 'demote');
        await sendOk(conn, from, `⬇️ @${target.split('@')[0]} has been demoted.\n\n> 🔥 ${BOT_NAME}`, [target], msg.key);
      } catch (e) { reply(e.message); }
    },
  },

  // ── TAGALL
  {
    pattern: 'tagall',
    desc: 'Tag all group members',
    category: 'Group',
    react: '📢',
    use: '.tagall [message]',
    execute: async (conn, msg, m, { from, isGroup, reply, sender, q }) => {
      if (!isGroup) return reply('❌ Group only command.');
      try {
        const meta    = await getGroupMeta(conn, from);
        const members = meta.participants.map(p => p.id);
        const text    = q || '📢 Attention everyone!';
        const mentions = members.join(' ');
        const tagList  = members.map(id => `@${id.split('@')[0]}`).join('\n');

        await conn.sendMessage(from, {
          text: `📢 *${text}*\n\n${tagList}\n\n> 🔥 ${BOT_NAME}`,
          mentions: members,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
      } catch (e) { reply(e.message); }
    },
  },

  // ── MUTE
  {
    pattern: 'mute',
    desc: 'Mute group (only admins can send)',
    category: 'Group',
    react: '🔇',
    use: '.mute',
    execute: async (conn, msg, m, { from, isGroup, reply, sender }) => {
      if (!isGroup) return reply('❌ Group only.');
      try {
        await checkAdmin(conn, from, sender);
        await conn.groupSettingUpdate(from, 'announcement');
        await sendOk(conn, from, `🔇 Group muted! Only admins can send messages.\n\n> 🔥 ${BOT_NAME}`, [], msg.key);
      } catch (e) { reply(e.message); }
    },
  },

  // ── UNMUTE
  {
    pattern: 'unmute',
    alias: ['open'],
    desc: 'Unmute group',
    category: 'Group',
    react: '🔊',
    use: '.unmute',
    execute: async (conn, msg, m, { from, isGroup, reply, sender }) => {
      if (!isGroup) return reply('❌ Group only.');
      try {
        await checkAdmin(conn, from, sender);
        await conn.groupSettingUpdate(from, 'not_announcement');
        await sendOk(conn, from, `🔊 Group unmuted! Everyone can send messages.\n\n> 🔥 ${BOT_NAME}`, [], msg.key);
      } catch (e) { reply(e.message); }
    },
  },

  // ── GROUP INFO
  {
    pattern: 'groupinfo',
    alias: ['gcinfo'],
    desc: 'Get group information',
    category: 'Group',
    react: 'ℹ️',
    use: '.groupinfo',
    execute: async (conn, msg, m, { from, isGroup, reply }) => {
      if (!isGroup) return reply('❌ Group only.');
      try {
        const meta    = await getGroupMeta(conn, from);
        const admins  = meta.participants.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`).join(', ');
        const created = new Date(meta.creation * 1000).toLocaleDateString();
        await conn.sendMessage(from, {
          text:
`╔══════════════════════════╗
║   ℹ️ *GROUP INFORMATION*   ║
╚══════════════════════════╝

📌 *Name:* ${meta.subject}
👥 *Members:* ${meta.participants.length}
📅 *Created:* ${created}
👑 *Admins:* ${admins || 'None'}
📝 *Description:*
${meta.desc || 'No description'}

> 🔥 ${BOT_NAME}`,
          mentions: meta.participants.filter(p => p.admin).map(p => p.id),
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
      } catch (e) { reply(e.message); }
    },
  },

  // ── INVITE LINK
  {
    pattern: 'invitelink',
    alias: ['invlink'],
    desc: 'Get group invite link',
    category: 'Group',
    react: '🔗',
    use: '.invitelink',
    execute: async (conn, msg, m, { from, isGroup, reply, sender }) => {
      if (!isGroup) return reply('❌ Group only.');
      try {
        await checkAdmin(conn, from, sender);
        const code = await conn.groupInviteCode(from);
        await sendOk(conn, from,
          `🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}\n\n> 🔥 ${BOT_NAME}`,
          [], msg.key);
      } catch (e) { reply(e.message); }
    },
  },

  // ── RESET LINK
  {
    pattern: 'resetlink',
    desc: 'Reset group invite link',
    category: 'Group',
    react: '🔄',
    use: '.resetlink',
    execute: async (conn, msg, m, { from, isGroup, reply, sender }) => {
      if (!isGroup) return reply('❌ Group only.');
      try {
        await checkAdmin(conn, from, sender);
        const code = await conn.groupRevokeInvite(from);
        await sendOk(conn, from,
          `🔄 *Link Reset!*\n\nhttps://chat.whatsapp.com/${code}\n\n> 🔥 ${BOT_NAME}`,
          [], msg.key);
      } catch (e) { reply(e.message); }
    },
  },

  // ── SET GROUP NAME
  {
    pattern: 'setgname',
    alias: ['setname'],
    desc: 'Set group name',
    category: 'Group',
    react: '✏️',
    use: '.setgname New Name',
    execute: async (conn, msg, m, { from, isGroup, reply, sender, q }) => {
      if (!isGroup) return reply('❌ Group only.');
      if (!q) return reply('❌ Provide a new name.');
      try {
        await checkAdmin(conn, from, sender);
        await conn.groupUpdateSubject(from, q);
        await sendOk(conn, from, `✏️ Group name changed to: *${q}*\n\n> 🔥 ${BOT_NAME}`, [], msg.key);
      } catch (e) { reply(e.message); }
    },
  },

  // ── SET GROUP DESC
  {
    pattern: 'setgdesc',
    alias: ['setdesc'],
    desc: 'Set group description',
    category: 'Group',
    react: '📝',
    use: '.setgdesc New description',
    execute: async (conn, msg, m, { from, isGroup, reply, sender, q }) => {
      if (!isGroup) return reply('❌ Group only.');
      if (!q) return reply('❌ Provide a description.');
      try {
        await checkAdmin(conn, from, sender);
        await conn.groupUpdateDescription(from, q);
        await sendOk(conn, from, `📝 Group description updated!\n\n> 🔥 ${BOT_NAME}`, [], msg.key);
      } catch (e) { reply(e.message); }
    },
  },

  // ── ANTILINK
  {
    pattern: 'setlink',
    desc: 'Toggle anti-link in group',
    category: 'Group',
    react: '🔗',
    use: '.antilink on|off',
    execute: async (conn, msg, m, { from, isGroup, reply, sender, args }) => {
      if (!isGroup) return reply('❌ Group only.');
      try {
        await checkAdmin(conn, from, sender);
        const val = args[0]?.toLowerCase();
        if (val !== 'on' && val !== 'off') return reply('❌ Usage: .antilink on|off');
        const dataPath = path.join(process.cwd(), 'data', 'autoAi.json');
        let data = {};
        try { data = JSON.parse(fs.readFileSync(dataPath, 'utf8')); } catch {}
        data[`antilink_${from}`] = val === 'on';
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

        await sendOk(conn, from,
          `🔗 Anti-Link: *${val.toUpperCase()}*\n\n> 🔥 ${BOT_NAME}`, [], msg.key);
      } catch (e) { reply(e.message); }
    },
  },
];
