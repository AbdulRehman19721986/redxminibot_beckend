/**
 * REDXBOT302 v6 — Complete Group Management
 * kick, kickall, add, promote, demote, mute, unmute, tagall, hidetag,
 * setwelcome, setgoodbye, groupinfo, glink, grevoke, setname, setdesc,
 * warn, warnings, clearwarn, setwarnlimit, lock, unlock, members, poll, leave, antiflood
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';
const store   = require('../lib/lightweight_store');
const BOT_NAME  = process.env.BOT_NAME     || '🔥 REDXBOT302 🔥';
const NL_JID    = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});
const send = (conn, from, text, mentions = []) =>
  conn.sendMessage(from, { text, mentions, contextInfo: ctxInfo() });

async function getMeta(conn, from)  { return conn.groupMetadata(from); }
async function getWarns(from)       { return await store.getSetting(from, 'warns') || {}; }
async function saveWarns(from, w)   { await store.saveSetting(from, 'warns', w); }
async function getWarnLimit(from)   { return await store.getSetting(from, 'warnlimit') || 3; }

module.exports = [
  // KICK ─────────────────────────────────────────────────────────────────
  {
    pattern: 'kick', alias: ['remove'],
    desc: 'Kick a member from group', category: 'Group',
    execute: async (conn, msg, m, { from, args, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const jid = m.mentionedJid?.[0] || ((args[0]||'').replace(/\D/g,'') + '@s.whatsapp.net');
      if (!jid || jid === '@s.whatsapp.net') return reply('❌ Mention a user: .kick @user');
      try {
        await conn.groupParticipantsUpdate(from, [jid], 'remove');
        send(conn, from, `✅ @${jid.split('@')[0]} kicked.\n\n> 🔥 ${BOT_NAME}`, [jid]);
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // KICKALL ──────────────────────────────────────────────────────────────
  {
    pattern: 'kickall',
    desc: 'Kick all non-admin members', category: 'Group',
    execute: async (conn, msg, m, { from, reply, sender, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isOwner) return reply('❌ Owner only!');
      const meta  = await getMeta(conn, from);
      const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
      const list  = meta.participants.filter(p => !p.admin && p.id !== botId && p.id !== sender);
      if (!list.length) return reply('❌ No members to kick.');
      await reply(`⏳ Kicking ${list.length} members...`);
      for (const p of list) { try { await conn.groupParticipantsUpdate(from, [p.id], 'remove'); } catch {} await new Promise(r=>setTimeout(r,700)); }
      reply(`✅ Kicked ${list.length} members.\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ADD ──────────────────────────────────────────────────────────────────
  {
    pattern: 'add',
    desc: 'Add member to group', category: 'Group',
    execute: async (conn, msg, m, { from, args, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const num = (args[0]||'').replace(/\D/g,'');
      if (!num) return reply('❌ Usage: .add <number>');
      try { await conn.groupParticipantsUpdate(from, [num+'@s.whatsapp.net'], 'add'); reply(`✅ Added +${num}.`); }
      catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // PROMOTE / DEMOTE ─────────────────────────────────────────────────────
  {
    pattern: 'promote', alias: ['makeadmin'],
    desc: 'Promote member to admin', category: 'Group',
    execute: async (conn, msg, m, { from, args, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const jid = m.mentionedJid?.[0] || ((args[0]||'').replace(/\D/g,'')+'@s.whatsapp.net');
      if (!jid || jid === '@s.whatsapp.net') return reply('❌ Mention a user.');
      try { await conn.groupParticipantsUpdate(from,[jid],'promote'); send(conn,from,`✅ @${jid.split('@')[0]} promoted to *admin*! 👑\n\n> 🔥 ${BOT_NAME}`,[jid]); }
      catch (e) { reply(`❌ ${e.message}`); }
    },
  },
  {
    pattern: 'demote', alias: ['removeadmin'],
    desc: 'Demote admin to member', category: 'Group',
    execute: async (conn, msg, m, { from, args, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const jid = m.mentionedJid?.[0] || ((args[0]||'').replace(/\D/g,'')+'@s.whatsapp.net');
      if (!jid || jid === '@s.whatsapp.net') return reply('❌ Mention a user.');
      try { await conn.groupParticipantsUpdate(from,[jid],'demote'); send(conn,from,`📉 @${jid.split('@')[0]} demoted.\n\n> 🔥 ${BOT_NAME}`,[jid]); }
      catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // MUTE / UNMUTE / LOCK / UNLOCK ────────────────────────────────────────
  {
    pattern: 'mute', alias: ['lock'],
    desc: 'Mute group — only admins can send', category: 'Group',
    execute: async (conn, msg, m, { from, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      try { await conn.groupSettingUpdate(from,'announcement'); reply('🔇 Group *muted*. Only admins can send.\n\n> 🔥 '+BOT_NAME); }
      catch (e) { reply(`❌ ${e.message}`); }
    },
  },
  {
    pattern: 'unmute', alias: ['unlock'],
    desc: 'Unmute group — everyone can send', category: 'Group',
    execute: async (conn, msg, m, { from, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      try { await conn.groupSettingUpdate(from,'not_announcement'); reply('🔊 Group *unmuted*. Everyone can send.\n\n> 🔥 '+BOT_NAME); }
      catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // TAGALL / HIDETAG ─────────────────────────────────────────────────────
  {
    pattern: 'tagall', alias: ['everyone','all','@all'],
    desc: 'Tag all group members', category: 'Group',
    execute: async (conn, msg, m, { from, q, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const meta = await getMeta(conn, from);
      const mentions = meta.participants.map(p=>p.id);
      const text = `📢 *${q||'Attention!'}*\n\n`+mentions.map(j=>`@${j.split('@')[0]}`).join(' ')+`\n\n> 🔥 ${BOT_NAME}`;
      conn.sendMessage(from,{text,mentions,contextInfo:ctxInfo()});
    },
  },
  {
    pattern: 'hidetag', alias: ['ht','h'],
    desc: 'Tag all without showing names', category: 'Group',
    execute: async (conn, msg, m, { from, q, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const meta = await getMeta(conn, from);
      const mentions = meta.participants.map(p=>p.id);
      conn.sendMessage(from,{text:q||'📢 Admin announcement.',mentions,contextInfo:ctxInfo()});
    },
  },

  // GROUP INFO ───────────────────────────────────────────────────────────
  {
    pattern: 'groupinfo', alias: ['ginfo','ginfo'],
    desc: 'Show group info', category: 'Group',
    execute: async (conn, msg, m, { from, reply }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      const meta   = await getMeta(conn,from);
      const admins = meta.participants.filter(p=>p.admin).map(p=>`@${p.id.split('@')[0]}`).join(', ');
      const date   = meta.creation ? new Date(meta.creation*1000).toLocaleDateString() : '?';
      reply(`╔══════════════════════════╗\n║  👥 *GROUP INFO*           ║\n╚══════════════════════════╝\n\n`+
        `📌 *Name:* ${meta.subject}\n🆔 *JID:* ${from}\n👥 *Members:* ${meta.participants.length}\n`+
        `👑 *Admins:* ${admins}\n📅 *Created:* ${date}\n🔒 *Locked:* ${meta.announce?'Yes':'No'}\n`+
        `📝 *Desc:* ${meta.desc||'None'}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // GLINK / REVOKE ───────────────────────────────────────────────────────
  {
    pattern: 'glink', alias: ['grouplink','invite'],
    desc: 'Get group invite link', category: 'Group',
    execute: async (conn, msg, m, { from, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      try { const c = await conn.groupInviteCode(from); reply(`🔗 *Invite Link:*\nhttps://chat.whatsapp.com/${c}\n\n> 🔥 ${BOT_NAME}`); }
      catch (e) { reply(`❌ ${e.message}`); }
    },
  },
  {
    pattern: 'grevoke', alias: ['revokelink'],
    desc: 'Revoke group invite link', category: 'Group',
    execute: async (conn, msg, m, { from, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      try { await conn.groupRevokeInvite(from); reply('✅ Invite link revoked! New link generated.\n\n> 🔥 '+BOT_NAME); }
      catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // SET NAME / DESC ──────────────────────────────────────────────────────
  {
    pattern: 'setgroupname', alias: ['gname','setname'],
    desc: 'Set group name', category: 'Group',
    execute: async (conn, msg, m, { from, q, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      if (!q) return reply('❌ Usage: .setgroupname <name>');
      try { await conn.groupUpdateSubject(from,q); reply(`✅ Group name → *${q}*`); }
      catch (e) { reply(`❌ ${e.message}`); }
    },
  },
  {
    pattern: 'setdesc', alias: ['gdesc','setgroupdesc'],
    desc: 'Set group description', category: 'Group',
    execute: async (conn, msg, m, { from, q, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      if (!q) return reply('❌ Usage: .setdesc <description>');
      try { await conn.groupUpdateDescription(from,q); reply('✅ Group description updated.'); }
      catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // WARN SYSTEM ──────────────────────────────────────────────────────────
  {
    pattern: 'warn',
    desc: 'Warn a group member', category: 'Group',
    execute: async (conn, msg, m, { from, q, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const jid = m.mentionedJid?.[0];
      if (!jid) return reply('❌ Mention a user: .warn @user <reason>');
      const reason = q.replace(`@${jid.split('@')[0]}`,'').trim() || 'No reason given';
      const warns  = await getWarns(from);
      const limit  = await getWarnLimit(from);
      warns[jid]   = (warns[jid]||0)+1;
      await saveWarns(from,warns);
      if (warns[jid] >= limit) {
        try { await conn.groupParticipantsUpdate(from,[jid],'remove'); } catch {}
        warns[jid] = 0; await saveWarns(from,warns);
        return send(conn,from,`⛔ @${jid.split('@')[0]} hit *${limit} warnings* and was kicked!\n\n> 🔥 ${BOT_NAME}`,[jid]);
      }
      send(conn,from,`⚠️ *WARNING ${warns[jid]}/${limit}*\n\n@${jid.split('@')[0]}\n📝 Reason: ${reason}\n\n> 🔥 ${BOT_NAME}`,[jid]);
    },
  },
  {
    pattern: 'warnings', alias: ['warnlist','wcount'],
    desc: 'Show member warnings', category: 'Group',
    execute: async (conn, msg, m, { from, reply }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      const jid   = m.mentionedJid?.[0];
      const warns = await getWarns(from);
      const limit = await getWarnLimit(from);
      if (!jid) {
        const list = Object.entries(warns).filter(([,c])=>c>0).map(([j,c])=>`• @${j.split('@')[0]}: ${c}/${limit}`).join('\n');
        return reply(`⚠️ *All Warnings:*\n\n${list||'(none)'}\n\n> 🔥 ${BOT_NAME}`);
      }
      reply(`⚠️ @${jid.split('@')[0]}: *${warns[jid]||0}/${limit}* warnings.`);
    },
  },
  {
    pattern: 'clearwarn', alias: ['resetwarn','clearwarns'],
    desc: 'Clear warnings', category: 'Group',
    execute: async (conn, msg, m, { from, reply, isAdmin, isOwner }) => {
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const jid = m.mentionedJid?.[0];
      const warns = await getWarns(from);
      if (!jid) { await saveWarns(from,{}); return reply('✅ All warnings cleared!'); }
      warns[jid]=0; await saveWarns(from,warns);
      reply(`✅ Warnings cleared for @${jid.split('@')[0]}.`);
    },
  },
  {
    pattern: 'setwarnlimit', alias: ['warnlimit'],
    desc: 'Set warn limit before kick', category: 'Group',
    execute: async (conn, msg, m, { from, args, reply, isAdmin, isOwner }) => {
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const n = parseInt(args[0]);
      if (isNaN(n)||n<1) return reply('❌ Usage: .setwarnlimit <number>');
      await store.saveSetting(from,'warnlimit',n);
      reply(`✅ Warn limit set to *${n}*.`);
    },
  },

  // WELCOME / GOODBYE (custom msg) ───────────────────────────────────────
  {
    pattern: 'setwelcome', alias: ['welcome'],
    desc: 'Set custom welcome message. Variables: @user @group @count', category: 'Group',
    execute: async (conn, msg, m, { from, args, q, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const sub = (args[0]||'').toLowerCase();
      if (sub==='off') { await store.saveSetting(from,'welcome',{enabled:false}); return reply('❌ Welcome *disabled*.'); }
      const customMsg = sub==='on' ? q.replace(/^on\s*/i,'').trim()||null : q||null;
      await store.saveSetting(from,'welcome',{enabled:true,msg:customMsg});
      reply(`✅ *Welcome message set!*\n\n${customMsg||'[Default]'}\n\n💡 Use: @user @group @count`);
    },
  },
  {
    pattern: 'setgoodbye', alias: ['goodbye','bye'],
    desc: 'Set custom goodbye message. Variables: @user @group @count', category: 'Group',
    execute: async (conn, msg, m, { from, args, q, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const sub = (args[0]||'').toLowerCase();
      if (sub==='off') { await store.saveSetting(from,'goodbye',{enabled:false}); return reply('❌ Goodbye *disabled*.'); }
      const customMsg = q.replace(/^on\s*/i,'').trim()||null;
      await store.saveSetting(from,'goodbye',{enabled:true,msg:customMsg});
      reply(`✅ *Goodbye message set!*\n\n${customMsg||'[Default]'}\n\n💡 Use: @user @group @count`);
    },
  },

  // MEMBERS ──────────────────────────────────────────────────────────────
  {
    pattern: 'members', alias: ['memberlist','participants'],
    desc: 'List all group members', category: 'Group',
    execute: async (conn, msg, m, { from, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const meta   = await getMeta(conn,from);
      const admins = meta.participants.filter(p=>p.admin);
      const members= meta.participants.filter(p=>!p.admin);
      const mentions= meta.participants.map(p=>p.id);
      let text = `👥 *${meta.subject}* — ${meta.participants.length} members\n\n`;
      text += `👑 *Admins (${admins.length}):*\n${admins.map(p=>`• @${p.id.split('@')[0]}`).join('\n')}\n\n`;
      text += `👤 *Members (${members.length}):*\n${members.map(p=>`• @${p.id.split('@')[0]}`).join('\n')}`;
      text += `\n\n> 🔥 ${BOT_NAME}`;
      send(conn,from,text,mentions);
    },
  },

  // POLL ─────────────────────────────────────────────────────────────────
  {
    pattern: 'poll',
    desc: 'Create a poll | .poll Question | Opt1 | Opt2', category: 'Group',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      const parts = q.split('|').map(s=>s.trim()).filter(Boolean);
      if (parts.length<3) return reply('❌ .poll Question | Option1 | Option2');
      const [question,...options]=parts;
      try { await conn.sendMessage(from,{poll:{name:question,values:options,selectableCount:1}}); }
      catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // LEAVE ────────────────────────────────────────────────────────────────
  {
    pattern: 'leave', alias: ['leavegroup'],
    desc: 'Bot leaves the group', category: 'Group',
    execute: async (conn, msg, m, { from, reply, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isOwner) return reply('❌ Owner only!');
      await reply('👋 Goodbye!');
      try { await conn.groupLeave(from); } catch {}
    },
  },

  // ANTIFLOOD ────────────────────────────────────────────────────────────
  {
    pattern: 'antiflood', alias: ['flood'],
    desc: 'Limit message flood per user', category: 'Group',
    execute: async (conn, msg, m, { from, args, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const sub = (args[0]||'').toLowerCase();
      if (sub==='on') {
        const limit = parseInt(args[1])||10;
        await store.saveSetting(from,'antiflood',{enabled:true,limit});
        return reply(`✅ Anti-flood *ON* — max ${limit} msgs/10s per user.`);
      }
      if (sub==='off') { await store.saveSetting(from,'antiflood',{enabled:false}); return reply('❌ Anti-flood *OFF*'); }
      const cur = await store.getSetting(from,'antiflood')||{enabled:false,limit:10};
      reply(`📊 Anti-Flood: ${cur.enabled?`✅ ON (max ${cur.limit}/10s)`:'❌ OFF'}\n\n.antiflood on [limit]\n.antiflood off`);
    },
  },
];
