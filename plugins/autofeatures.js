/**
 * REDXBOT302 v6 — Auto Features Plugin
 * autoread, autotyping, autostatus, autorecord, autoreact (custom emoji),
 * getpp, antibot, automention, setreply
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';

const store  = require('../lib/lightweight_store');
const BOT_NAME = process.env.BOT_NAME || '🔥 REDXBOT302 🔥';
const NL_JID   = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

module.exports = [

  {
    pattern: 'autoread', alias: ['autoseen'],
    desc: 'Auto-read all messages (blue tick)', category: 'Auto',
    execute: async (conn, msg, m, { from, args, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only!');
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'on')  { await store.saveSetting('global', 'autoread', true);  return reply('✅ Auto-read *ON*'); }
      if (sub === 'off') { await store.saveSetting('global', 'autoread', false); return reply('❌ Auto-read *OFF*'); }
      const cur = await store.getSetting('global', 'autoread');
      reply(`📌 Auto-read: ${cur ? '✅ ON' : '❌ OFF'}\n.autoread on|off`);
    },
  },

  {
    pattern: 'autotyping', alias: ['autotype', 'typing'],
    desc: 'Show typing indicator before replies', category: 'Auto',
    execute: async (conn, msg, m, { from, args, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only!');
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'on')  { await store.saveSetting('global', 'autotyping', true);  return reply('✅ Auto-typing *ON*'); }
      if (sub === 'off') { await store.saveSetting('global', 'autotyping', false); return reply('❌ Auto-typing *OFF*'); }
      const cur = await store.getSetting('global', 'autotyping');
      reply(`📌 Auto-typing: ${cur ? '✅ ON' : '❌ OFF'}\n.autotyping on|off`);
    },
  },

  {
    pattern: 'autorecord', alias: ['autorecording'],
    desc: 'Show recording indicator before audio replies', category: 'Auto',
    execute: async (conn, msg, m, { from, args, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only!');
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'on')  { await store.saveSetting('global', 'autorecord', true);  return reply('✅ Auto-record *ON*'); }
      if (sub === 'off') { await store.saveSetting('global', 'autorecord', false); return reply('❌ Auto-record *OFF*'); }
      const cur = await store.getSetting('global', 'autorecord');
      reply(`📌 Auto-record: ${cur ? '✅ ON' : '❌ OFF'}\n.autorecord on|off`);
    },
  },

  {
    pattern: 'autoreact', alias: ['autolike', 'react'],
    desc: 'Auto-react to messages with custom emoji', category: 'Auto',
    execute: async (conn, msg, m, { from, args, reply, isAdmin, isOwner }) => {
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const sub   = (args[0] || '').toLowerCase();
      const emoji = args[1] || '❤️';
      if (sub === 'on')  {
        await store.saveSetting(from, 'autoreact', { enabled: true, emoji });
        return reply(`✅ Auto-react *ON* — Emoji: ${emoji}\n\nChange: .autoreact on 🔥`);
      }
      if (sub === 'off') { await store.saveSetting(from, 'autoreact', { enabled: false }); return reply('❌ Auto-react *OFF*'); }
      const cur = await store.getSetting(from, 'autoreact') || { enabled: false, emoji: '❤️' };
      reply(`📌 Auto-react: ${cur.enabled ? `✅ ON (${cur.emoji})` : '❌ OFF'}\n\n.autoreact on [emoji]\n.autoreact off`);
    },
  },

  {
    pattern: 'autostatus', alias: ['autostatusseen'],
    desc: 'Auto-view & react to all WhatsApp statuses', category: 'Auto',
    execute: async (conn, msg, m, { from, args, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only!');
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'off') { await store.saveSetting('global', 'autostatus', { enabled: false }); return reply('❌ Auto-status *OFF*'); }
      const react = args.includes('react');
      const replyMode = args.includes('reply');
      const customMsg = replyMode ? args.slice(args.indexOf('reply') + 1).join(' ') : `_Status seen by ${BOT_NAME}_`;
      await store.saveSetting('global', 'autostatus', { enabled: true, react, replyMode, msg: customMsg });
      reply(`✅ Auto-status *ON*\n👁️ Auto-seen: ✅\n💬 Auto-react: ${react ? '✅' : '❌'}\n💬 Auto-reply: ${replyMode ? '✅' : '❌'}\n\nUsage: .autostatus on react reply <custom msg>`);
    },
  },

  {
    pattern: 'setreply', alias: ['autorespond', 'autoreply', 'ar'],
    desc: 'Set keyword auto-reply | .setreply hi | Hello!', category: 'Auto',
    execute: async (conn, msg, m, { from, q, reply, isAdmin, isOwner }) => {
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const parts = q.split('|').map(s => s.trim());
      if (parts.length < 2) {
        const all = await store.getSetting(from, 'autoreplies') || {};
        const list = Object.entries(all).map(([k, v]) => `• "${k}" → "${v}"`).join('\n');
        return reply(`📋 *Auto-Replies:*\n${list || '(none)'}\n\nUsage: .setreply <keyword> | <response>\nRemove: .removereply <keyword>`);
      }
      const [keyword, response] = parts;
      const all = await store.getSetting(from, 'autoreplies') || {};
      all[keyword.toLowerCase()] = response;
      await store.saveSetting(from, 'autoreplies', all);
      reply(`✅ Auto-reply set:\n"${keyword}" → "${response}"`);
    },
  },

  {
    pattern: 'removereply', alias: ['delreply', 'rmreply'],
    desc: 'Remove an auto-reply keyword', category: 'Auto',
    execute: async (conn, msg, m, { from, q, reply, isAdmin, isOwner }) => {
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const all = await store.getSetting(from, 'autoreplies') || {};
      if (!all[q.toLowerCase()]) return reply(`❌ Keyword "${q}" not found.`);
      delete all[q.toLowerCase()];
      await store.saveSetting(from, 'autoreplies', all);
      reply(`✅ Removed auto-reply: "${q}"`);
    },
  },

  {
    pattern: 'getpp', alias: ['pp', 'profilepic', 'pfp', 'photo'],
    desc: 'Get profile picture of any user', category: 'Tools',
    execute: async (conn, msg, m, { from, args, reply, sender }) => {
      try {
        const target = m.mentionedJid?.[0]
          || (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null)
          || sender;
        const ppUrl = await conn.profilePictureUrl(target, 'image').catch(() => null);
        if (!ppUrl) return reply('❌ No profile picture found (private or not set).');
        await conn.sendMessage(from, {
          image: { url: ppUrl },
          caption: `📸 *Profile Picture*\n👤 @${target.split('@')[0]}\n\n> 🔥 ${BOT_NAME}`,
          mentions: [target],
          contextInfo: ctxInfo(),
        }, { quoted: msg });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  {
    pattern: 'antibot', alias: ['botblock'],
    desc: 'Block other bots from using commands in group', category: 'Group',
    execute: async (conn, msg, m, { from, args, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'on')  { await store.saveSetting(from, 'antibot', { enabled: true, botJids: [] }); return reply('✅ *Anti-Bot ON* — only you can use bot commands.'); }
      if (sub === 'off') { await store.saveSetting(from, 'antibot', { enabled: false });              return reply('❌ Anti-Bot *OFF*'); }
      if (sub === 'add') {
        const jid = m.mentionedJid?.[0] || (args[1] ? args[1].replace(/\D/g,'')+'@s.whatsapp.net' : null);
        if (!jid) return reply('❌ Mention a bot: .antibot add @bot');
        const cur = await store.getSetting(from, 'antibot') || { enabled: true, botJids: [] };
        if (!cur.botJids.includes(jid)) cur.botJids.push(jid);
        await store.saveSetting(from, 'antibot', cur);
        return reply(`✅ Bot blocked: @${jid.split('@')[0]}`);
      }
      const cur = await store.getSetting(from, 'antibot') || { enabled: false, botJids: [] };
      reply(`📌 Anti-Bot: ${cur.enabled ? '✅ ON' : '❌ OFF'}\nBlocked: ${cur.botJids.length}\n\n.antibot on|off\n.antibot add @botjid`);
    },
  },
];
