// settings.js — REDXBOT ULTRA centralized config
const fs = require('fs');
const path = require('path');

// Auto-detect hosting platform
let platform = 'local';
if (process.env.RAILWAY_SERVICE_NAME || process.env.RAILWAY_PROJECT_NAME || process.env.RAILWAY_ENVIRONMENT) {
  platform = 'railway';
} else if (process.env.DYNO || process.env.HEROKU_APP_NAME) {
  platform = 'heroku';
} else if (process.env.RENDER_EXTERNAL_URL) {
  platform = 'render';
} else if (process.env.KOYEB_APP_NAME) {
  platform = 'koyeb';
} else if (fs.existsSync('/.fly')) {
  platform = 'flyio';
}

const settings = {
  // Core
  prefixes: [process.env.PREFIX || '.'],
  packname: process.env.PACKNAME || 'REDXBOT ULTRA',
  author: process.env.AUTHOR || 'Abdul Rehman Rajpoot',
  timeZone: process.env.TIMEZONE || 'Asia/Karachi',
  botMode: process.env.BOT_MODE || 'public',

  // Bot Identity (your REDX branding)
  botName: process.env.BOT_NAME || 'REDXBOT ULTRA',
  botDesc: process.env.BOT_DESC || 'Ultra-Fast WhatsApp Bot by Abdul Rehman Rajpoot',
  botDp: process.env.BOT_DP || 'https://files.catbox.moe/s36b12.jpg',
  botOwner: process.env.BOT_OWNER || 'Abdul Rehman Rajpoot',
  secondOwner: process.env.SECOND_OWNER || 'Muzamil Khan',
  ownerNumber: process.env.OWNER_NUMBER || '923009842133',
  coOwnerNumber: process.env.CO_OWNER_NUMBER || '923183928892',

  // Owner Info
  ownerName: process.env.OWNER_NAME || 'Abdul Rehman Rajpoot',
  ownerVideo: process.env.OWNER_VIDEO || 'https://files.catbox.moe/sqyj68.mp4',
  coOwnerName: process.env.CO_OWNER_NAME || 'Muzamil Khan',
  coOwnerVideo: process.env.CO_OWNER_VIDEO || 'https://files.catbox.moe/n7sjdc.mp4',

  // Social Links (REDX branding kept)
  channelLink: process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10',
  githubRepo: process.env.GITHUB_REPO || 'https://github.com/AbdulRehman19721986/redxbot302',
  whatsappGroup: process.env.WHATSAPP_GROUP || 'https://chat.whatsapp.com/LhSmx2SeXX75r8I2bxsNDo',
  telegramGroup: process.env.TELEGRAM_GROUP || 'https://t.me/TeamRedxhacker2',
  youtubeChannel: process.env.YOUTUBE_CHANNEL || 'https://youtube.com/@rootmindtech',
  channelJid: process.env.CHANNEL_JID || '120363405513439052@newsletter',

  // Audio
  welcomeAudio: process.env.WELCOME_AUDIO || 'https://files.catbox.moe/voio3f.m4a',
  ownerSongUrl: process.env.OWNER_SONG || 'https://files.catbox.moe/voio3f.m4a',

  // API keys
  giphyApiKey: process.env.GIPHY_API_KEY || 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  tmdbApiKey: process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63',

  // Performance
  maxStoreMessages: parseInt(process.env.MAX_STORE_MESSAGES) || 20,
  storeWriteInterval: parseInt(process.env.STORE_WRITE_INTERVAL) || 10000,
  tempCleanupInterval: parseInt(process.env.TEMP_CLEANUP_INTERVAL) || 1 * 60 * 60 * 1000,

  // Bot meta
  version: process.env.BOT_VERSION || '6.0.0',
  platform,

  // API endpoints (from verbose fishstick)
  APIs: {
    xteam: 'https://api.xteam.xyz',
    dzx: 'https://api.dhamzxploit.my.id',
    lol: 'https://api.lolhuman.xyz',
    violetics: 'https://violetics.pw',
    neoxr: 'https://api.neoxr.my.id',
    zenzapis: 'https://zenzapis.xyz',
    akuari: 'https://api.akuari.my.id',
    akuari2: 'https://apimu.my.id',
    nrtm: 'https://fg-nrtm.ddns.net',
    siputzx: 'https://api.siputzx.my.id'
  },
  APIKeys: {
    'https://api.xteam.xyz': 'd90a9e986e18778b',
    'https://api.lolhuman.xyz': '85faf717d0545d14074659ad',
    'https://violetics.pw': 'beta',
    'https://api-fgmods.ddns.net': 'fg-dylux'
  }
};

module.exports = settings;
