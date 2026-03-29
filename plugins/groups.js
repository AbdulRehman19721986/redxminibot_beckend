/**
 * REDXBOT302 - Group Management Plugins
 * Category: groups
 */
const cat = 'groups';
const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302', serverMessageId: -1
    }
  }
};

async function getGroupMeta(sock, jid) {
  try { return await sock.groupMetadata(jid); } catch { return null; }
}

const plugins = [

{
  command: 'kick', aliases: ['remove', 'ban'], category: cat,
  description: 'Kick a member from the group', usage: '.kick @user',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted = message.message?.extendedTextMessage?.contextInfo?.participant;
    const targets = mentioned.length ? mentioned : (quoted ? [quoted] : []);
    if (!targets.length) return sock.sendMessage(chatId, { text: '❌ Mention someone to kick!', ...CH }, { quoted: message });
    try {
      await sock.groupParticipantsUpdate(chatId, targets, 'remove');
      await sock.sendMessage(chatId, { text: `✅ *Kicked ${targets.length} member(s)*`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed to kick: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'promote', aliases: ['admin', 'makeadmin'], category: cat,
  description: 'Promote a member to admin', usage: '.promote @user',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return sock.sendMessage(chatId, { text: '❌ Mention someone to promote!', ...CH }, { quoted: message });
    try {
      await sock.groupParticipantsUpdate(chatId, mentioned, 'promote');
      await sock.sendMessage(chatId, { text: `✅ *Promoted to admin!*`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'demote', aliases: ['removeadmin', 'unadmin'], category: cat,
  description: 'Demote an admin to member', usage: '.demote @user',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return sock.sendMessage(chatId, { text: '❌ Mention someone to demote!', ...CH }, { quoted: message });
    try {
      await sock.groupParticipantsUpdate(chatId, mentioned, 'demote');
      await sock.sendMessage(chatId, { text: `✅ *Demoted from admin!*`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'mute', aliases: ['close', 'lock'], category: cat,
  description: 'Mute the group (only admins can send)', usage: '.mute',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    try {
      await sock.groupSettingUpdate(chatId, 'announcement');
      await sock.sendMessage(chatId, { text: '🔇 *Group Muted!* Only admins can send messages.', ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'unmute', aliases: ['open', 'unlock'], category: cat,
  description: 'Unmute the group (all can send)', usage: '.unmute',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    try {
      await sock.groupSettingUpdate(chatId, 'not_announcement');
      await sock.sendMessage(chatId, { text: '🔊 *Group Unmuted!* Everyone can now send messages.', ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'tagall', aliases: ['everyone', 'all', 'tag'], category: cat,
  description: 'Tag all members in the group', usage: '.tagall [message]',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const meta = await getGroupMeta(sock, chatId);
    if (!meta) return sock.sendMessage(chatId, { text: '❌ Could not fetch group info.', ...CH }, { quoted: message });
    const msg = args.join(' ') || '📢 Attention everyone!';
    const mentions = meta.participants.map(p => p.id);
    const text = `*${msg}*\n\n` + mentions.map(m => `@${m.split('@')[0]}`).join(' ');
    await sock.sendMessage(chatId, { text, mentions, ...CH }, { quoted: message });
  }
},

{
  command: 'hidetag', aliases: ['stag', 'silentall'], category: cat,
  description: 'Tag all members silently', usage: '.hidetag <message>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const meta = await getGroupMeta(sock, chatId);
    if (!meta) return sock.sendMessage(chatId, { text: '❌ Could not fetch group info.', ...CH }, { quoted: message });
    const msg = args.join(' ') || '👋';
    const mentions = meta.participants.map(p => p.id);
    await sock.sendMessage(chatId, { text: msg, mentions, ...CH }, { quoted: message });
  }
},

{
  command: 'groupinfo', aliases: ['ginfo', 'gcinfo'], category: cat,
  description: 'Get group information', usage: '.groupinfo',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const meta = await getGroupMeta(sock, chatId);
    if (!meta) return sock.sendMessage(chatId, { text: '❌ Failed to get info.', ...CH }, { quoted: message });
    const admins = meta.participants.filter(p => p.admin).length;
    await sock.sendMessage(chatId, {
      text: `👥 *Group Information*\n\n📌 *Name:* ${meta.subject}\n🆔 *ID:* ${chatId}\n👤 *Members:* ${meta.participants.length}\n👑 *Admins:* ${admins}\n📅 *Created:* ${new Date(meta.creation * 1000).toLocaleString()}\n📝 *Desc:* ${meta.desc?.substring(0, 200) || 'No description'}`,
      ...CH
    }, { quoted: message });
  }
},

{
  command: 'invitelink', aliases: ['invite', 'link'], category: cat,
  description: 'Get group invite link', usage: '.invitelink',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    try {
      const code = await sock.groupInviteCode(chatId);
      await sock.sendMessage(chatId, { text: `🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'resetlink', aliases: ['revoke', 'revokelink'], category: cat,
  description: 'Reset group invite link', usage: '.resetlink',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    try {
      await sock.groupRevokeInvite(chatId);
      await sock.sendMessage(chatId, { text: '✅ *Invite link reset!* Old link is now invalid.', ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'setgname', aliases: ['rename', 'groupname'], category: cat,
  description: 'Change group name', usage: '.setgname <name>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const name = args.join(' ');
    if (!name) return sock.sendMessage(chatId, { text: '❌ Usage: .setgname <new name>', ...CH }, { quoted: message });
    try {
      await sock.groupUpdateSubject(chatId, name);
      await sock.sendMessage(chatId, { text: `✅ *Group name changed to:* ${name}`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'setgdesc', aliases: ['desc', 'groupdesc'], category: cat,
  description: 'Change group description', usage: '.setgdesc <description>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const desc = args.join(' ');
    if (!desc) return sock.sendMessage(chatId, { text: '❌ Usage: .setgdesc <description>', ...CH }, { quoted: message });
    try {
      await sock.groupUpdateDescription(chatId, desc);
      await sock.sendMessage(chatId, { text: `✅ *Group description updated!*`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'warn', aliases: ['warning'], category: cat,
  description: 'Warn a group member', usage: '.warn @user',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return sock.sendMessage(chatId, { text: '❌ Mention someone to warn!', ...CH }, { quoted: message });
    const reason = args.filter(a => !a.includes('@')).join(' ') || 'Violating group rules';
    const mentions = mentioned;
    await sock.sendMessage(chatId, {
      text: `⚠️ *Warning Issued!*\n\n${mentions.map(m => `@${m.split('@')[0]}`).join(' ')}\n\n*Reason:* ${reason}\n\n_3 warnings = kick_`,
      mentions, ...CH
    }, { quoted: message });
  }
},

{
  command: 'delete', aliases: ['del', 'unsend'], category: cat,
  description: 'Delete a message (reply to it)', usage: '.delete (reply to message)',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const quoted = message.message?.extendedTextMessage?.contextInfo;
    if (!quoted) return sock.sendMessage(chatId, { text: '❌ Reply to a message to delete it.', ...CH }, { quoted: message });
    try {
      await sock.sendMessage(chatId, { delete: { remoteJid: chatId, id: quoted.stanzaId, participant: quoted.participant } });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed to delete: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

];

module.exports = plugins;
