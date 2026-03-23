/**
 * REDXBOT302 - Auto-Events & Protection Plugins
 * Category: protection
 */
const fs = require('fs');
const path = require('path');
const store = require('../lib/lightweight_store');
const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302', serverMessageId: -1
    }
  }
};

// Anti-link state per group
const antilinkGroups = new Set();

const plugins = [

{
  command: 'antilink', aliases: ['antispam'], category: 'protection',
  description: 'Toggle antilink protection in group', usage: '.antilink <on|off>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const sub = (args[0] || '').toLowerCase();
    if (sub === 'on') {
      antilinkGroups.add(chatId);
      await store.saveSetting(chatId, 'antilink', true);
      await sock.sendMessage(chatId, { text: '🛡️ *Anti-link enabled!* Links will be deleted and sender warned.', ...CH }, { quoted: message });
    } else if (sub === 'off') {
      antilinkGroups.delete(chatId);
      await store.saveSetting(chatId, 'antilink', false);
      await sock.sendMessage(chatId, { text: '❌ *Anti-link disabled.*', ...CH }, { quoted: message });
    } else {
      const enabled = antilinkGroups.has(chatId);
      await sock.sendMessage(chatId, { text: `🛡️ *Anti-link Status:* ${enabled ? '✅ ON' : '❌ OFF'}\n\nUsage: .antilink on|off`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'welcome', aliases: ['setwelcome', 'welcomemsg'], category: 'protection',
  description: 'Toggle welcome message for new members', usage: '.welcome <on|off> [message]',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const sub = (args[0] || '').toLowerCase();
    if (sub === 'on') {
      const customMsg = args.slice(1).join(' ') || '';
      await store.saveSetting(chatId, 'welcome', { enabled: true, message: customMsg });
      await sock.sendMessage(chatId, { text: `✅ *Welcome messages enabled!*${customMsg ? '\n\nCustom message: ' + customMsg : ''}`, ...CH }, { quoted: message });
    } else if (sub === 'off') {
      await store.saveSetting(chatId, 'welcome', { enabled: false });
      await sock.sendMessage(chatId, { text: '❌ *Welcome messages disabled.*', ...CH }, { quoted: message });
    } else {
      const cfg = await store.getSetting(chatId, 'welcome') || { enabled: false };
      await sock.sendMessage(chatId, { text: `👋 *Welcome Status:* ${cfg.enabled ? '✅ ON' : '❌ OFF'}\n\nUsage: .welcome on|off [custom message]`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'goodbye', aliases: ['bye', 'setgoodbye'], category: 'protection',
  description: 'Toggle goodbye message for leaving members', usage: '.goodbye <on|off>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const sub = (args[0] || '').toLowerCase();
    if (sub === 'on') {
      await store.saveSetting(chatId, 'goodbye', { enabled: true });
      await sock.sendMessage(chatId, { text: '✅ *Goodbye messages enabled!*', ...CH }, { quoted: message });
    } else {
      await store.saveSetting(chatId, 'goodbye', { enabled: false });
      await sock.sendMessage(chatId, { text: '❌ *Goodbye messages disabled.*', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'antidelete', aliases: ['ad'], category: 'protection',
  description: 'Toggle antidelete (resend deleted messages)', usage: '.antidelete <on|off>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const sub = (args[0] || '').toLowerCase();
    const dataPath = path.join(__dirname, '../data/antidelete.json');
    let cfg = { enabled: false };
    try { cfg = JSON.parse(fs.readFileSync(dataPath, 'utf8')); } catch {}
    if (sub === 'on') {
      cfg.enabled = true;
      fs.writeFileSync(dataPath, JSON.stringify(cfg, null, 2));
      await sock.sendMessage(chatId, { text: '🛡️ *Anti-delete enabled!* Deleted messages will be resent.', ...CH }, { quoted: message });
    } else if (sub === 'off') {
      cfg.enabled = false;
      fs.writeFileSync(dataPath, JSON.stringify(cfg, null, 2));
      await sock.sendMessage(chatId, { text: '❌ *Anti-delete disabled.*', ...CH }, { quoted: message });
    } else {
      await sock.sendMessage(chatId, { text: `🛡️ *Anti-delete:* ${cfg.enabled ? '✅ ON' : '❌ OFF'}\n\nUsage: .antidelete on|off`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'pinchat', aliases: ['pin'], category: 'owner',
  description: 'Pin a message in group (reply to message)', usage: '.pinchat (reply to msg)',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Group command only!', ...CH }, { quoted: message });
    const quoted = message.message?.extendedTextMessage?.contextInfo;
    if (!quoted) return sock.sendMessage(chatId, { text: '❌ Reply to a message to pin it!', ...CH }, { quoted: message });
    try {
      await sock.sendMessage(chatId, { pin: { type: 1, time: 86400 }, key: { remoteJid: chatId, id: quoted.stanzaId, participant: quoted.participant } });
      await sock.sendMessage(chatId, { text: '📌 *Message pinned!*', ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

];

module.exports = plugins;
