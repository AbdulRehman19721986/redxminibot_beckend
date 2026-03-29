/**
 * REDXBOT302 - Search & Info Plugins
 * Category: search
 */
const axios = require('axios');
const cat = 'search';
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
  command: 'gimage', aliases: ['img', 'image', 'randompic'], category: cat,
  description: 'Search and send a random image', usage: '.gimage <query>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ');
    if (!query) return sock.sendMessage(chatId, { text: '❌ Usage: .gimage <search query>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/s/image?q=${encodeURIComponent(query)}`, { timeout: 10000 });
      const imgs = data?.data || [];
      if (!imgs.length) throw new Error('No images');
      const pick = imgs[Math.floor(Math.random() * Math.min(imgs.length, 5))];
      const imgUrl = pick?.url || pick;
      if (!imgUrl) throw new Error('No URL');
      await sock.sendMessage(chatId, { image: { url: imgUrl }, caption: `🖼️ *${query}*`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Image search failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'pokedex', aliases: ['pokemon', 'poke'], category: cat,
  description: 'Search Pokédex', usage: '.pokedex <pokemon name>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const name = args.join(' ').toLowerCase();
    if (!name) return sock.sendMessage(chatId, { text: '❌ Usage: .pokedex <pokemon name>', ...CH }, { quoted: message });
    try {
      const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`, { timeout: 10000 });
      const types = data.types.map(t => t.type.name).join(', ');
      const abilities = data.abilities.map(a => a.ability.name).join(', ');
      const stats = data.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(' | ');
      await sock.sendMessage(chatId, {
        image: { url: data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default },
        caption: `⚡ *#${data.id} ${data.name.toUpperCase()}*\n\n🔥 *Type:* ${types}\n✨ *Abilities:* ${abilities}\n📊 *Height:* ${data.height/10}m | Weight: ${data.weight/10}kg\n\n*Stats:* ${stats}`,
        ...CH
      }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: `❌ Pokémon "${name}" not found.`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'anime', aliases: ['animesearch'], category: cat,
  description: 'Search anime info', usage: '.anime <title>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ');
    if (!query) return sock.sendMessage(chatId, { text: '❌ Usage: .anime <title>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🎌', key: message.key } });
    try {
      const { data } = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, { timeout: 10000 });
      const a = data?.data?.[0];
      if (!a) throw new Error('Not found');
      await sock.sendMessage(chatId, {
        image: { url: a.images?.jpg?.image_url || '' },
        caption: `🎌 *${a.title}*\n\n⭐ Score: ${a.score || 'N/A'}\n📺 Episodes: ${a.episodes || 'N/A'}\n📅 Year: ${a.year || 'N/A'}\n🎭 Genre: ${a.genres?.map(g => g.name).join(', ') || 'N/A'}\n📝 ${a.synopsis?.substring(0, 250)}...`,
        ...CH
      }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: `❌ Anime "${query}" not found.`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'shazam', aliases: ['identify', 'song'], category: cat,
  description: 'Identify a song (reply to audio)', usage: '.shazam (reply to audio)',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    await sock.sendMessage(chatId, { text: '🎵 *Shazam*\n\nReply to an audio file and type .shazam to identify the song.\n\n_(Feature requires audio upload — use .ytmp3 to download songs by name)_', ...CH }, { quoted: message });
  }
},

{
  command: 'ocr', aliases: ['readtext', 'textfromimg'], category: cat,
  description: 'Extract text from image (OCR)', usage: '.ocr (reply to image)',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const m = message.message || {};
    const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage;
    const img = m.imageMessage || quoted?.imageMessage;
    if (!img) return sock.sendMessage(chatId, { text: '❌ Reply to an image with .ocr', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });
    try {
      const stream = await downloadContentFromMessage(img, 'image');
      const chunks = [];
      for await (const c of stream) chunks.push(c);
      const buf = Buffer.concat(chunks);
      const base64 = buf.toString('base64');
      const { data } = await axios.post('https://api.siputzx.my.id/api/tools/ocr', { image: base64 }, { timeout: 15000 });
      const text = data?.result || data?.text || 'No text detected.';
      await sock.sendMessage(chatId, { text: `📝 *OCR Result*\n\n${text}`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ OCR failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'removebg', aliases: ['rmbg', 'nobg'], category: cat,
  description: 'Remove image background', usage: '.removebg (reply to image)',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const m = message.message || {};
    const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage;
    const img = m.imageMessage || quoted?.imageMessage;
    if (!img) return sock.sendMessage(chatId, { text: '❌ Reply to an image with .removebg', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '✂️', key: message.key } });
    try {
      const stream = await downloadContentFromMessage(img, 'image');
      const chunks = [];
      for await (const c of stream) chunks.push(c);
      const buf = Buffer.concat(chunks);
      const FormData = require('form-data');
      const form = new FormData();
      form.append('image_file', buf, { filename: 'image.jpg', contentType: 'image/jpeg' });
      const { data } = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
        headers: { ...form.getHeaders(), 'X-Api-Key': 'DEMO' },
        responseType: 'arraybuffer', timeout: 20000
      });
      await sock.sendMessage(chatId, { image: Buffer.from(data), caption: '✂️ *Background Removed!*', ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ Remove BG failed. Try again later.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'quote', aliases: ['qotd', 'inspire'], category: cat,
  description: 'Get an inspiring quote', usage: '.quote',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    try {
      const { data } = await axios.get('https://api.quotable.io/random', { timeout: 8000 });
      await sock.sendMessage(chatId, { text: `💭 *Quote*\n\n_"${data.content}"_\n\n— *${data.author}*`, ...CH }, { quoted: message });
    } catch {
      const quotes = ['"The only way to do great work is to love what you do." — Steve Jobs','"In the middle of difficulty lies opportunity." — Albert Einstein','"Life is what happens when you\'re busy making other plans." — John Lennon'];
      await sock.sendMessage(chatId, { text: `💭 *Quote*\n\n${quotes[Math.floor(Math.random()*quotes.length)]}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'currency', aliases: ['convert', 'exchange'], category: cat,
  description: 'Convert currency', usage: '.currency <amount> <from> <to>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (args.length < 3) return sock.sendMessage(chatId, { text: '❌ Usage: .currency <amount> <from> <to>\nExample: .currency 100 USD PKR', ...CH }, { quoted: message });
    const [amount, from, to] = args;
    try {
      const { data } = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`, { timeout: 8000 });
      const rate = data.rates?.[to.toUpperCase()];
      if (!rate) return sock.sendMessage(chatId, { text: `❌ Currency "${to}" not found.`, ...CH }, { quoted: message });
      const result = (parseFloat(amount) * rate).toFixed(2);
      await sock.sendMessage(chatId, { text: `💱 *Currency Converter*\n\n${amount} ${from.toUpperCase()} = *${result} ${to.toUpperCase()}*\nRate: 1 ${from.toUpperCase()} = ${rate.toFixed(4)} ${to.toUpperCase()}`, ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ Currency conversion failed.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'ipinfo', aliases: ['iplookup', 'ip'], category: cat,
  description: 'Get IP address info', usage: '.ipinfo <ip address>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const ip = args[0] || '';
    if (!ip) return sock.sendMessage(chatId, { text: '❌ Usage: .ipinfo <ip address>', ...CH }, { quoted: message });
    try {
      const { data } = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 8000 });
      await sock.sendMessage(chatId, {
        text: `🌍 *IP Info: ${ip}*\n\n📍 Location: ${data.city}, ${data.region}, ${data.country_name}\n🌐 ISP: ${data.org}\n📮 Postal: ${data.postal}\n🕐 Timezone: ${data.timezone}\n📡 ASN: ${data.asn}`,
        ...CH
      }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ IP lookup failed.', ...CH }, { quoted: message });
    }
  }
},

{
  command: 'meme', aliases: ['randmeme'], category: 'fun',
  description: 'Get a random meme', usage: '.meme',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    await sock.sendMessage(chatId, { react: { text: '😂', key: message.key } });
    try {
      const { data } = await axios.get('https://meme-api.com/gimme', { timeout: 10000 });
      if (!data?.url) throw new Error('No meme');
      await sock.sendMessage(chatId, { image: { url: data.url }, caption: `😂 *${data.title}*\n\n👍 ${data.ups} upvotes | r/${data.subreddit}`, ...CH }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: '❌ Meme unavailable. Try again!', ...CH }, { quoted: message });
    }
  }
},

];

module.exports = plugins;
