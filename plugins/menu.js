/**
 * REDXBOT302 - Menu Plugin
 */
const settings = require('../settings');
const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302', serverMessageId: -1
    }
  }
};

const CATEGORIES = {
  ai:          { emoji: '🤖', label: 'AI & Chat',       cmds: ['gpt','gemini','llama','mistral','aify','imagine','summarize','explain','analyze'] },
  downloaders: { emoji: '📥', label: 'Downloaders',     cmds: ['tiktok','ytmp3','ytmp4','spotify','instagram','facebook','twitter','pinterest','soundcloud','mediafire'] },
  fun:         { emoji: '🎉', label: 'Fun & Games',     cmds: ['joke','fact','truth','dare','flirt','wyr','8ball','ship','rate','iq','roast','compliment','trivia','dice','coin','slot','simp'] },
  tools:       { emoji: '🔧', label: 'Tools',           cmds: ['ping','calc','weather','wiki','translate','tts','qr','shorturl','base64','password','crypto','news','screenshot','github','imdb','lyrics','styletext'] },
  groups:      { emoji: '👥', label: 'Group Mgmt',      cmds: ['kick','promote','demote','mute','unmute','tagall','hidetag','groupinfo','invitelink','setgname','setgdesc','warn','delete'] },
  music:       { emoji: '🎵', label: 'Music',           cmds: ['play','song','mp3','audiofx','bass','nightcore'] },
  sticker:     { emoji: '🎨', label: 'Stickers',        cmds: ['sticker','toimg'] },
  owner:       { emoji: '👑', label: 'Owner Only',      cmds: ['autoread','autoreply','autostatus','autotyping','pmblocker','autoforward','uptime','restart','botname','botdesc'] },
  info:        { emoji: 'ℹ️', label: 'Info',            cmds: ['owner','botinfo','deployid','menu','alive'] },
};

const plugins = [

{
  command: 'menu', aliases: ['help', 'cmds', 'commands', 'start'], category: 'info',
  description: 'Show bot commands menu', usage: '.menu [category]',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const P = settings.prefix;
    const sub = args[0]?.toLowerCase();

    // Category menu
    if (sub && CATEGORIES[sub]) {
      const cat = CATEGORIES[sub];
      const cmdList = cat.cmds.map(c => `  ${P}${c}`).join('\n');
      return sock.sendMessage(chatId, {
        text: `${cat.emoji} *${cat.label.toUpperCase()}*\n${'─'.repeat(25)}\n\n${cmdList}\n\n${'─'.repeat(25)}\n💡 Type ${P}<command> to use`,
        ...CH
      }, { quoted: message });
    }

    // Main menu
    const catLines = Object.entries(CATEGORIES)
      .map(([key, c]) => `${c.emoji} *${c.label}* — \`${P}menu ${key}\`\n    ${c.cmds.length} commands`)
      .join('\n\n');

    const totalCmds = Object.values(CATEGORIES).reduce((acc, c) => acc + c.cmds.length, 0);

    const menuText =
`╔══════════════════════════╗
║  🔥  *REDXBOT302*  🔥   ║
╚══════════════════════════╝

👑 *Owner:* ${settings.botOwner}
🌍 *Mode:* ${settings.mode}
📌 *Prefix:* \`${P}\`
📦 *Total Commands:* ${totalCmds}+
━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *COMMAND CATEGORIES*
━━━━━━━━━━━━━━━━━━━━━━━━━━

${catLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Type \`${P}menu <category>\` to see commands
Example: \`${P}menu ai\` | \`${P}menu fun\``;

    await sock.sendMessage(chatId, { text: menuText, ...CH }, { quoted: message });
  }
},

{
  command: 'alive', aliases: ['status', 'bot'], category: 'info',
  description: 'Check if bot is alive', usage: '.alive',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const uptime = process.uptime();
    const h = Math.floor(uptime/3600), m = Math.floor((uptime%3600)/60);
    await sock.sendMessage(chatId, {
      text: `*╔═══════════════════════╗*\n*║  🔥 REDXBOT302  🔥  ║*\n*╚═══════════════════════╝*\n\n✅ *Bot is ONLINE!*\n\n🤖 *Bot:* ${settings.botName}\n👑 *Owner:* ${settings.botOwner}\n📌 *Prefix:* ${settings.prefix}\n🌍 *Mode:* ${settings.mode}\n⏱️ *Uptime:* ${h}h ${m}m\n💾 *RAM:* ${Math.round(process.memoryUsage().heapUsed/1024/1024)}MB\n\n🚀 _Type ${settings.prefix}menu for commands_`,
      ...CH
    }, { quoted: message });
  }
},

{
  command: 'botinfo', aliases: ['info', 'about'], category: 'info',
  description: 'Get bot information', usage: '.botinfo',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    await sock.sendMessage(chatId, {
      text: `*🤖 BOT INFORMATION*\n\n🔥 *Name:* ${settings.botName}\n👑 *Owner:* ${settings.botOwner}\n👤 *Co-Owner:* ${settings.coOwner}\n📌 *Prefix:* ${settings.prefix}\n🌍 *Mode:* ${settings.mode}\n⏱️ *Uptime:* ${Math.floor(process.uptime()/3600)}h ${Math.floor((process.uptime()%3600)/60)}m\n💾 *RAM:* ${Math.round(process.memoryUsage().heapUsed/1024/1024)}MB\n🔧 *Node:* ${process.version}\n\n🌐 GitHub: https://github.com/AbdulRehman19721986/redxbot302`,
      ...CH
    }, { quoted: message });
  }
},

];

module.exports = plugins;
