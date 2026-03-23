/**
 * REDXBOT302 - Reactions Plugins
 * Category: reactions
 */
const axios = require('axios');
const cat = 'reactions';
const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302', serverMessageId: -1
    }
  }
};

const GIF_APIS = {
  hug:       'https://nekos.life/api/v2/img/hug',
  slap:      'https://nekos.life/api/v2/img/slap',
  pat:       'https://nekos.life/api/v2/img/pat',
  kiss:      'https://nekos.life/api/v2/img/kiss',
  tickle:    'https://nekos.life/api/v2/img/tickle',
  poke:      'https://nekos.life/api/v2/img/poke',
  wink:      'https://nekos.life/api/v2/img/wink',
  smug:      'https://nekos.life/api/v2/img/smug',
  happy:     'https://nekos.life/api/v2/img/happy',
  blush:     'https://nekos.life/api/v2/img/blush',
};

async function getGif(type) {
  try {
    const url = GIF_APIS[type];
    if (!url) return null;
    const { data } = await axios.get(url, { timeout: 8000 });
    return data?.url || null;
  } catch { return null; }
}

function makeReactionPlugin(cmd, emoji, label) {
  return {
    command: cmd, aliases: [], category: cat,
    description: `Send a ${label} reaction GIF`, usage: `.${cmd} @user`,
    async handler(sock, message, args, context) {
      const chatId = context.chatId || message.key.remoteJid;
      const sender = message.key.participant || message.key.remoteJid;
      const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const target = mentioned[0] ? `@${mentioned[0].split('@')[0]}` : 'someone';
      const senderName = message.pushName || 'Someone';
      await sock.sendMessage(chatId, { react: { text: emoji, key: message.key } });
      const gifUrl = await getGif(cmd);
      if (gifUrl) {
        await sock.sendMessage(chatId, {
          video: { url: gifUrl },
          caption: `${emoji} *${senderName}* ${label} ${target}!`,
          gifPlayback: true,
          mentions: mentioned,
          ...CH
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, {
          text: `${emoji} *${senderName}* ${label} ${target}!`,
          mentions: mentioned,
          ...CH
        }, { quoted: message });
      }
    }
  };
}

const plugins = [
  makeReactionPlugin('hug',    '🤗', 'hugged'),
  makeReactionPlugin('slap',   '👋', 'slapped'),
  makeReactionPlugin('pat',    '🫳', 'patted'),
  makeReactionPlugin('kiss',   '💋', 'kissed'),
  makeReactionPlugin('tickle', '😆', 'tickled'),
  makeReactionPlugin('poke',   '👉', 'poked'),
  makeReactionPlugin('wink',   '😉', 'winked at'),
  makeReactionPlugin('smug',   '😏', 'is smug at'),
  makeReactionPlugin('happy',  '😊', 'is happy with'),
  makeReactionPlugin('blush',  '😊', 'blushed at'),

  // Custom reactions without GIF
  {
    command: 'cry', aliases: ['crying'], category: cat,
    description: 'Cry reaction', usage: '.cry',
    async handler(sock, message, args, context) {
      const chatId = context.chatId || message.key.remoteJid;
      await sock.sendMessage(chatId, { react: { text: '😢', key: message.key } });
      await sock.sendMessage(chatId, { text: `😢 *${message.pushName || 'Someone'}* is crying...`, ...CH }, { quoted: message });
    }
  },
  {
    command: 'dance', aliases: ['dancing'], category: cat,
    description: 'Dance reaction', usage: '.dance',
    async handler(sock, message, args, context) {
      const chatId = context.chatId || message.key.remoteJid;
      await sock.sendMessage(chatId, { react: { text: '💃', key: message.key } });
      await sock.sendMessage(chatId, { text: `💃 *${message.pushName || 'Someone'}* is dancing! 🕺`, ...CH }, { quoted: message });
    }
  },
  {
    command: 'bonk', aliases: [], category: cat,
    description: 'Bonk someone', usage: '.bonk @user',
    async handler(sock, message, args, context) {
      const chatId = context.chatId || message.key.remoteJid;
      const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const target = mentioned[0] ? `@${mentioned[0].split('@')[0]}` : 'someone';
      await sock.sendMessage(chatId, { react: { text: '🔨', key: message.key } });
      await sock.sendMessage(chatId, { text: `🔨 *${message.pushName || 'Someone'}* bonked ${target}!`, mentions: mentioned, ...CH }, { quoted: message });
    }
  },
  {
    command: 'wave', aliases: [], category: cat,
    description: 'Wave at someone', usage: '.wave @user',
    async handler(sock, message, args, context) {
      const chatId = context.chatId || message.key.remoteJid;
      const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const target = mentioned[0] ? `@${mentioned[0].split('@')[0]}` : 'everyone';
      await sock.sendMessage(chatId, { react: { text: '👋', key: message.key } });
      await sock.sendMessage(chatId, { text: `👋 *${message.pushName || 'Someone'}* waved at ${target}!`, mentions: mentioned, ...CH }, { quoted: message });
    }
  },
  {
    command: 'kill', aliases: [], category: cat,
    description: 'Kill someone (fun)', usage: '.kill @user',
    async handler(sock, message, args, context) {
      const chatId = context.chatId || message.key.remoteJid;
      const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const target = mentioned[0] ? `@${mentioned[0].split('@')[0]}` : 'themselves';
      const ways = ['⚔️ sliced', '🔫 shot', '💣 blew up', '☠️ eliminated', '🪓 axed', '🔪 stabbed'];
      const way = ways[Math.floor(Math.random() * ways.length)];
      await sock.sendMessage(chatId, { react: { text: '💀', key: message.key } });
      await sock.sendMessage(chatId, { text: `💀 *${message.pushName || 'Someone'}* ${way} ${target}!`, mentions: mentioned, ...CH }, { quoted: message });
    }
  },
  {
    command: 'smile', aliases: [], category: cat,
    description: 'Smile reaction', usage: '.smile',
    async handler(sock, message, args, context) {
      const chatId = context.chatId || message.key.remoteJid;
      await sock.sendMessage(chatId, { react: { text: '😊', key: message.key } });
      await sock.sendMessage(chatId, { text: `😊 *${message.pushName || 'Someone'}* is smiling!`, ...CH }, { quoted: message });
    }
  },
];

module.exports = plugins;
