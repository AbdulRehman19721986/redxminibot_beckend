/**
 * REDXBOT302 - Owner Commands
 * Category: owner
 */
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const cat = 'owner';
const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302', serverMessageId: -1
    }
  }
};

const BANNED_FILE = path.join(__dirname, '../data/banned.json');
function readBanned() { try { return JSON.parse(fs.readFileSync(BANNED_FILE,'utf8')); } catch { return []; } }
function writeBanned(d) { fs.writeFileSync(BANNED_FILE, JSON.stringify(d, null, 2)); }

const OWNER_FILE = path.join(__dirname, '../data/owner.json');
function readOwners() { try { return JSON.parse(fs.readFileSync(OWNER_FILE,'utf8')); } catch { return []; } }

function isOwner(number) { return readOwners().includes(number.replace(/[^0-9]/g,'')); }

const plugins = [

{
  command: 'ban', aliases: ['banuser'], category: cat,
  description: 'Ban a user from using the bot', usage: '.ban @user',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const sender = (message.key.participant || message.key.remoteJid).replace('@s.whatsapp.net','');
    if (!isOwner(sender)) return sock.sendMessage(chatId, { text: '❌ Owner only!', ...CH }, { quoted: message });
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return sock.sendMessage(chatId, { text: '❌ Mention someone to ban!', ...CH }, { quoted: message });
    const banned = readBanned();
    const newBans = mentioned.map(m => m.replace('@s.whatsapp.net','')).filter(n => !banned.includes(n));
    if (!newBans.length) return sock.sendMessage(chatId, { text: '⚠️ Already banned.', ...CH }, { quoted: message });
    writeBanned([...banned, ...newBans]);
    await sock.sendMessage(chatId, { text: `🚫 *Banned ${newBans.length} user(s)!*\n${newBans.map(n=>`• ${n}`).join('\n')}`, ...CH }, { quoted: message });
  }
},

{
  command: 'unban', aliases: ['unbanuser'], category: cat,
  description: 'Unban a user', usage: '.unban @user',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const sender = (message.key.participant || message.key.remoteJid).replace('@s.whatsapp.net','');
    if (!isOwner(sender)) return sock.sendMessage(chatId, { text: '❌ Owner only!', ...CH }, { quoted: message });
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return sock.sendMessage(chatId, { text: '❌ Mention someone to unban!', ...CH }, { quoted: message });
    let banned = readBanned();
    const nums = mentioned.map(m => m.replace('@s.whatsapp.net',''));
    banned = banned.filter(n => !nums.includes(n));
    writeBanned(banned);
    await sock.sendMessage(chatId, { text: `✅ *Unbanned ${nums.length} user(s)!*`, ...CH }, { quoted: message });
  }
},

{
  command: 'listban', aliases: ['banned'], category: cat,
  description: 'List all banned users', usage: '.listban',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const banned = readBanned();
    if (!banned.length) return sock.sendMessage(chatId, { text: '✅ No banned users.', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { text: `🚫 *Banned Users (${banned.length})*\n\n${banned.map((n,i)=>`${i+1}. ${n}`).join('\n')}`, ...CH }, { quoted: message });
  }
},

{
  command: 'broadcast', aliases: ['bc'], category: cat,
  description: 'Broadcast a message to all chats', usage: '.broadcast <message>',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const sender = (message.key.participant || message.key.remoteJid).replace('@s.whatsapp.net','');
    if (!isOwner(sender)) return sock.sendMessage(chatId, { text: '❌ Owner only!', ...CH }, { quoted: message });
    const msg = args.join(' ');
    if (!msg) return sock.sendMessage(chatId, { text: '❌ Usage: .broadcast <message>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { text: `📢 *Broadcast sent!*\n\n${msg}`, ...CH }, { quoted: message });
  }
},

{
  command: 'mode', aliases: ['botmode'], category: cat,
  description: 'Change bot mode (PUBLIC/PRIVATE)', usage: '.mode <public|private>',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const m = (args[0] || '').toUpperCase();
    if (!['PUBLIC','PRIVATE','GROUP'].includes(m)) return sock.sendMessage(chatId, { text: '❌ Usage: .mode <public|private|group>', ...CH }, { quoted: message });
    process.env.MODE = m;
    await sock.sendMessage(chatId, { text: `✅ *Bot mode set to:* ${m}`, ...CH }, { quoted: message });
  }
},

{
  command: 'prefix', aliases: ['setprefix'], category: cat,
  description: 'Change bot command prefix', usage: '.prefix <new prefix>',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const p = args[0];
    if (!p) return sock.sendMessage(chatId, { text: '❌ Usage: .prefix <symbol>', ...CH }, { quoted: message });
    process.env.PREFIX = p;
    await sock.sendMessage(chatId, { text: `✅ *Prefix changed to:* \`${p}\`\n\nRestart bot to apply globally.`, ...CH }, { quoted: message });
  }
},

{
  command: 'botname', aliases: ['setname', 'setbotname'], category: cat,
  description: 'Change bot display name', usage: '.botname <new name>',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const name = args.join(' ');
    if (!name) return sock.sendMessage(chatId, { text: '❌ Usage: .botname <name>', ...CH }, { quoted: message });
    process.env.BOT_NAME = name;
    await sock.sendMessage(chatId, { text: `✅ *Bot name changed to:* ${name}\n\nRestart to apply fully.`, ...CH }, { quoted: message });
  }
},

{
  command: 'botdesc', aliases: ['setdesc'], category: cat,
  description: 'Set bot description', usage: '.botdesc <description>',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const desc = args.join(' ');
    if (!desc) return sock.sendMessage(chatId, { text: '❌ Usage: .botdesc <description>', ...CH }, { quoted: message });
    try {
      await sock.updateProfileStatus(desc);
      await sock.sendMessage(chatId, { text: `✅ *Bot bio updated!*\n\n${desc}`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'setpp', aliases: ['setbotpp', 'setdp'], category: cat,
  description: 'Set bot profile picture (reply to image)', usage: '.setpp (reply to image)',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const m = message.message || {};
    const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage;
    const img = m.imageMessage || quoted?.imageMessage;
    if (!img) return sock.sendMessage(chatId, { text: '❌ Reply to an image!', ...CH }, { quoted: message });
    try {
      const stream = await downloadContentFromMessage(img, 'image');
      const chunks = [];
      for await (const c of stream) chunks.push(c);
      const buf = Buffer.concat(chunks);
      await sock.updateProfilePicture(sock.user.id, buf);
      await sock.sendMessage(chatId, { text: '✅ *Profile picture updated!*', ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'getpp', aliases: ['pfp', 'profilepic'], category: cat,
  description: 'Get someone profile picture', usage: '.getpp @user',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentioned[0] || (message.key.participant || message.key.remoteJid);
    try {
      const url = await sock.profilePictureUrl(target, 'image');
      await sock.sendMessage(chatId, { image: { url }, caption: `📸 Profile picture of @${target.split('@')[0]}`, mentions: [target], ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ Could not fetch profile picture. It may be private.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'jid', aliases: ['getjid'], category: cat,
  description: 'Get JID of a user or group', usage: '.jid',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const sender = message.key.participant || message.key.remoteJid;
    await sock.sendMessage(chatId, {
      text: `🆔 *JID Info*\n\n*Chat JID:* \`${chatId}\`\n*Sender JID:* \`${sender}\``,
      ...CH
    }, { quoted: message });
  }
},

{
  command: 'sysinfo', aliases: ['system', 'server'], category: 'tools',
  description: 'Get server system info', usage: '.sysinfo',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    await sock.sendMessage(chatId, {
      text: `⚙️ *System Info*\n\n🖥️ Platform: ${process.platform}\n🔧 Node: ${process.version}\n💾 Heap Used: ${Math.round(mem.heapUsed/1024/1024)}MB\n📊 Heap Total: ${Math.round(mem.heapTotal/1024/1024)}MB\n🔄 RSS: ${Math.round(mem.rss/1024/1024)}MB\n⏱️ Uptime: ${Math.floor(uptime/3600)}h ${Math.floor((uptime%3600)/60)}m ${Math.floor(uptime%60)}s`,
      ...CH
    }, { quoted: message });
  }
},

{
  command: 'echo', aliases: ['say', 'repeat'], category: 'tools',
  description: 'Bot repeats your message', usage: '.echo <text>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const text = args.join(' ');
    if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: .echo <text>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { text, ...CH }, { quoted: message });
  }
},

{
  command: 'poll', aliases: ['vote'], category: 'groups',
  description: 'Create a poll', usage: '.poll <Question> | Option1 | Option2...',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const full = args.join(' ');
    const parts = full.split('|').map(s => s.trim());
    if (parts.length < 3) return sock.sendMessage(chatId, { text: '❌ Usage: .poll Question | Option1 | Option2 | ...', ...CH }, { quoted: message });
    const [question, ...options] = parts;
    try {
      await sock.sendMessage(chatId, {
        poll: { name: question, values: options, selectableCount: 1 }
      });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Poll failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'quoted', aliases: ['q', 'getquoted'], category: 'tools',
  description: 'Get info of replied message', usage: '.quoted (reply to message)',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    if (!ctx) return sock.sendMessage(chatId, { text: '❌ Reply to a message first!', ...CH }, { quoted: message });
    const text = ctx.quotedMessage?.conversation || ctx.quotedMessage?.extendedTextMessage?.text || '(media message)';
    await sock.sendMessage(chatId, {
      text: `📩 *Quoted Message Info*\n\n*From:* @${ctx.participant?.split('@')[0] || 'unknown'}\n*Message ID:* ${ctx.stanzaId}\n*Content:* ${text.substring(0,200)}`,
      mentions: ctx.participant ? [ctx.participant] : [],
      ...CH
    }, { quoted: message });
  }
},

{
  command: 'deployid', aliases: ['myid', 'getid'], category: 'info',
  description: 'Show your deployment ID', usage: '.deployid',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    await sock.sendMessage(chatId, {
      text: `🆔 *Deploy ID*\n\n\`${context.deployId}\`\n\n📡 *Platform:* ${process.env.RAILWAY_ENVIRONMENT ? 'Railway' : process.env.DYNO ? 'Heroku' : process.env.RENDER ? 'Render' : 'Local'}`,
      ...CH
    }, { quoted: message });
  }
},

];

module.exports = plugins;
