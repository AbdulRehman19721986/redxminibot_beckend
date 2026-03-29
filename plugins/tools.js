/**
 * REDXBOT302 - Tools & Utility Plugins
 * Category: tools
 */
const axios = require('axios');
const crypto = require('crypto');
const cat = 'tools';
const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302', serverMessageId: -1
    }
  }
};

const plugins = [

{
  command: 'ping', aliases: ['speed', 'latency'], category: cat,
  description: 'Check bot response speed', usage: '.ping',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const start = Date.now();
    await sock.sendMessage(chatId, { react: { text: '⚡', key: message.key } });
    const ms = Date.now() - start;
    await sock.sendMessage(chatId, {
      text: `*⚡ PONG!*\n\n🏓 Latency: *${ms}ms*\n⏱️ Uptime: ${Math.floor(process.uptime()/3600)}h ${Math.floor((process.uptime()%3600)/60)}m\n💾 RAM: ${Math.round(process.memoryUsage().heapUsed/1024/1024)}MB / ${Math.round(process.memoryUsage().heapTotal/1024/1024)}MB`,
      ...CH
    }, { quoted: message });
  }
},

{
  command: 'calc', aliases: ['calculate', 'math'], category: cat,
  description: 'Calculate a math expression', usage: '.calc <expression>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const expr = args.join(' ');
    if (!expr) return sock.sendMessage(chatId, { text: '❌ Usage: .calc <expression>\nExample: .calc 2+2*5', ...CH }, { quoted: message });
    try {
      // Safe eval - only math
      const safe = expr.replace(/[^0-9+\-*/.()%^ ]/g, '');
      const result = Function('"use strict"; return (' + safe + ')')();
      await sock.sendMessage(chatId, { text: `🔢 *Calculator*\n\n*Expression:* ${expr}\n*Result:* ${result}`, ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ Invalid expression.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'weather', aliases: ['w', 'forecast'], category: cat,
  description: 'Get weather for a city', usage: '.weather <city>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const city = args.join(' ');
    if (!city) return sock.sendMessage(chatId, { text: '❌ Usage: .weather <city name>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🌤️', key: message.key } });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/weather?city=${encodeURIComponent(city)}`, { timeout: 10000 });
      const d = data?.data || data;
      await sock.sendMessage(chatId, {
        text: `🌤️ *Weather: ${city}*\n\n🌡️ Temp: ${d?.temp || d?.temperature || 'N/A'}°C\n💧 Humidity: ${d?.humidity || 'N/A'}%\n💨 Wind: ${d?.wind || 'N/A'}\n📝 ${d?.description || d?.condition || 'N/A'}`,
        ...CH
      }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ Weather service unavailable.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'define', aliases: ['dict', 'dictionary'], category: cat,
  description: 'Define a word', usage: '.define <word>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const word = args.join(' ');
    if (!word) return sock.sendMessage(chatId, { text: '❌ Usage: .define <word>', ...CH }, { quoted: message });
    try {
      const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 10000 });
      const entry = data[0];
      const meanings = entry.meanings.slice(0, 2).map(m => `*${m.partOfSpeech}:* ${m.definitions[0].definition}`).join('\n');
      await sock.sendMessage(chatId, { text: `📖 *Dictionary: ${word}*\n\n${meanings}`, ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: `❌ Definition not found for "${word}".`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'wikipedia', aliases: ['wiki', 'wp'], category: cat,
  description: 'Search Wikipedia', usage: '.wiki <query>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ');
    if (!query) return sock.sendMessage(chatId, { text: '❌ Usage: .wiki <search term>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '📚', key: message.key } });
    try {
      const { data } = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { timeout: 10000 });
      await sock.sendMessage(chatId, {
        text: `📚 *Wikipedia: ${data.title}*\n\n${data.extract?.substring(0, 600)}...\n\n🔗 ${data.content_urls?.desktop?.page || ''}`,
        ...CH
      }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: `❌ Wikipedia: "${query}" not found.`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'translate', aliases: ['trt', 'tr'], category: cat,
  description: 'Translate text', usage: '.translate <lang> <text>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (args.length < 2) return sock.sendMessage(chatId, { text: '❌ Usage: .translate <lang> <text>\nExample: .translate ar Hello', ...CH }, { quoted: message });
    const [lang, ...textArr] = args;
    const text = textArr.join(' ');
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/translate?text=${encodeURIComponent(text)}&to=${lang}`, { timeout: 10000 });
      await sock.sendMessage(chatId, { text: `🌍 *Translation → ${lang.toUpperCase()}*\n\n*Original:* ${text}\n*Translated:* ${data?.result || data?.data || 'Failed'}`, ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ Translation failed.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'tts', aliases: ['texttospeech', 'speak'], category: cat,
  description: 'Convert text to speech', usage: '.tts <text>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!args.length) return sock.sendMessage(chatId, { text: '❌ Usage: .tts <text>', ...CH }, { quoted: message });
    const text = args.join(' ');
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/tts?text=${encodeURIComponent(text)}&lang=en`, { responseType: 'arraybuffer', timeout: 15000 });
      await sock.sendMessage(chatId, { audio: Buffer.from(data), mimetype: 'audio/mpeg', ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ TTS failed.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'qr', aliases: ['qrcode', 'qrgen'], category: cat,
  description: 'Generate a QR code', usage: '.qr <text or url>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const text = args.join(' ');
    if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: .qr <text or URL>', ...CH }, { quoted: message });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    await sock.sendMessage(chatId, { image: { url: qrUrl }, caption: `📱 *QR Code*\n${text}`, ...CH }, { quoted: message });
  }
},

{
  command: 'readqr', aliases: ['scanqr'], category: cat,
  description: 'Read QR code from image (reply to image)', usage: '.readqr (reply to image)',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    await sock.sendMessage(chatId, { text: '🔍 *QR Reader*\n\nReply to an image with .readqr to decode its QR code.', ...CH }, { quoted: message });
  }
},

{
  command: 'shorturl', aliases: ['short', 'tinyurl'], category: cat,
  description: 'Shorten a URL', usage: '.shorturl <url>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];
    if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .shorturl <url>', ...CH }, { quoted: message });
    try {
      const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 10000 });
      await sock.sendMessage(chatId, { text: `🔗 *Short URL*\n\nOriginal: ${url}\nShort: ${data}`, ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ URL shortening failed.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'base64', aliases: ['encode'], category: cat,
  description: 'Encode text to Base64', usage: '.base64 <text>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const text = args.join(' ');
    if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: .base64 <text>', ...CH }, { quoted: message });
    const encoded = Buffer.from(text).toString('base64');
    await sock.sendMessage(chatId, { text: `🔐 *Base64 Encoded*\n\n\`\`\`${encoded}\`\`\``, ...CH }, { quoted: message });
  }
},

{
  command: 'decode', aliases: ['b64decode'], category: cat,
  description: 'Decode Base64 text', usage: '.decode <base64>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const text = args.join(' ');
    if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: .decode <base64 text>', ...CH }, { quoted: message });
    try {
      const decoded = Buffer.from(text, 'base64').toString('utf8');
      await sock.sendMessage(chatId, { text: `🔓 *Base64 Decoded*\n\n${decoded}`, ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ Invalid Base64 string.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'password', aliases: ['genpass', 'passgen'], category: cat,
  description: 'Generate a random password', usage: '.password [length]',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const len = Math.min(parseInt(args[0]) || 16, 64);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    await sock.sendMessage(chatId, { text: `🔑 *Password Generator*\n\n\`\`\`${pass}\`\`\`\n\n*Length:* ${len} chars\n⚠️ Save it now!`, ...CH }, { quoted: message });
  }
},

{
  command: 'crypto', aliases: ['coin', 'btc', 'eth'], category: cat,
  description: 'Get crypto price', usage: '.crypto <coin>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const coin = (args[0] || 'bitcoin').toLowerCase();
    try {
      const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd&include_24hr_change=true`, { timeout: 10000 });
      const d = data[coin];
      if (!d) return sock.sendMessage(chatId, { text: `❌ Coin "${coin}" not found.`, ...CH }, { quoted: message });
      const change = d.usd_24h_change?.toFixed(2);
      const up = change > 0;
      await sock.sendMessage(chatId, { text: `💰 *${coin.toUpperCase()}*\n\n💵 Price: $${d.usd?.toLocaleString()}\n${up ? '📈' : '📉'} 24h: ${change}%`, ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ Crypto price unavailable.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'news', aliases: ['headlines'], category: cat,
  description: 'Get latest news headlines', usage: '.news [topic]',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const topic = args.join(' ') || 'world';
    await sock.sendMessage(chatId, { react: { text: '📰', key: message.key } });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/news?q=${encodeURIComponent(topic)}`, { timeout: 10000 });
      const articles = (data?.data || data?.articles || []).slice(0, 4);
      if (!articles.length) throw new Error('No news');
      const text = articles.map((a, i) => `${i+1}. *${a.title || a.name}*\n${a.url || ''}`).join('\n\n');
      await sock.sendMessage(chatId, { text: `📰 *News: ${topic}*\n\n${text}`, ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ News unavailable.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'uptime', aliases: ['runtime'], category: 'owner',
  description: 'Show bot uptime', usage: '.uptime',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const sec = process.uptime();
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = Math.floor(sec%60);
    const mem = process.memoryUsage();
    await sock.sendMessage(chatId, {
      text: `⏱️ *Bot Uptime*\n\n🕐 ${h}h ${m}m ${s}s\n💾 RAM Used: ${Math.round(mem.heapUsed/1024/1024)}MB\n📊 Total RAM: ${Math.round(mem.heapTotal/1024/1024)}MB\n🔧 Node: ${process.version}`,
      ...CH
    }, { quoted: message });
  }
},

{
  command: 'screenshot', aliases: ['ss', 'webss'], category: cat,
  description: 'Screenshot a website', usage: '.screenshot <url>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];
    if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .screenshot <url>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '📸', key: message.key } });
    const ssUrl = `https://image.thum.io/get/width/1280/crop/900/${encodeURIComponent(url)}`;
    await sock.sendMessage(chatId, { image: { url: ssUrl }, caption: `📸 *Screenshot:* ${url}`, ...CH }, { quoted: message });
  }
},

{
  command: 'github', aliases: ['gh', 'gitinfo'], category: cat,
  description: 'Get GitHub user info', usage: '.github <username>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const username = args[0];
    if (!username) return sock.sendMessage(chatId, { text: '❌ Usage: .github <username>', ...CH }, { quoted: message });
    try {
      const { data } = await axios.get(`https://api.github.com/users/${username}`, { timeout: 10000 });
      await sock.sendMessage(chatId, {
        text: `🐙 *GitHub: ${data.login}*\n\n👤 Name: ${data.name || 'N/A'}\n📝 Bio: ${data.bio || 'N/A'}\n📦 Repos: ${data.public_repos}\n👥 Followers: ${data.followers}\n👣 Following: ${data.following}\n🔗 ${data.html_url}`,
        ...CH
      }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: `❌ GitHub user "${username}" not found.`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'imdb', aliases: ['movie', 'film'], category: cat,
  description: 'Search IMDB for movies', usage: '.imdb <movie name>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ');
    if (!query) return sock.sendMessage(chatId, { text: '❌ Usage: .imdb <movie name>', ...CH }, { quoted: message });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/s/imdb?q=${encodeURIComponent(query)}`, { timeout: 10000 });
      const m = data?.data?.[0] || data?.[0];
      if (!m) throw new Error('Not found');
      await sock.sendMessage(chatId, {
        text: `🎬 *${m.title || m.name}*\n\n⭐ Rating: ${m.rating || 'N/A'}\n📅 Year: ${m.year || 'N/A'}\n🎭 Genre: ${m.genre || 'N/A'}\n📝 ${m.description?.substring(0, 200) || ''}`,
        ...CH
      }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: `❌ Movie "${query}" not found.`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'lyrics', aliases: ['lyric'], category: cat,
  description: 'Get song lyrics', usage: '.lyrics <song name>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ');
    if (!query) return sock.sendMessage(chatId, { text: '❌ Usage: .lyrics <song name>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/s/lyrics?q=${encodeURIComponent(query)}`, { timeout: 10000 });
      const lyr = data?.data?.lyrics || data?.lyrics;
      if (!lyr) throw new Error('No lyrics');
      await sock.sendMessage(chatId, { text: `🎵 *Lyrics: ${query}*\n\n${lyr.substring(0, 2000)}`, ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: `❌ Lyrics for "${query}" not found.`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'styletext', aliases: ['fancy', 'textfont'], category: cat,
  description: 'Style your text', usage: '.styletext <text>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const text = args.join(' ');
    if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: .styletext <text>', ...CH }, { quoted: message });
    const styles = {
      Bold: text.split('').map(c => '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭'[('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(c))]).join('') || text,
    };
    await sock.sendMessage(chatId, { text: `✨ *Style Text*\n\n*Original:* ${text}\n*Bold:* ${styles.Bold}`, ...CH }, { quoted: message });
  }
},

{
  command: 'uuid', aliases: ['uid'], category: cat,
  description: 'Generate a UUID', usage: '.uuid',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const crypto = require('crypto');
    const uuid = crypto.randomUUID();
    await sock.sendMessage(chatId, { text: `🔑 *UUID Generated*\n\n\`\`\`${uuid}\`\`\``, ...CH }, { quoted: message });
  }
},

];

module.exports = plugins;
