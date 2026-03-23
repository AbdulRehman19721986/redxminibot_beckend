/**
 * REDXBOT302 — Tools Plugin
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { fetchJson, getWeather, translate, wikiSummary } = require('../lib/functions2');
const { runtime, isUrl, fetchJson: fetchJ } = require('../lib/functions');
const fakevCard     = require('../lib/fakevcard');
const os            = require('os');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const START_TIME     = Date.now();

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});
const send = (conn, from, text) =>
  conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: fakevCard });

module.exports = [
  // ── UPTIME
  {
    pattern: 'uptime',
    alias: ['runtime'],
    desc: 'Bot uptime',
    category: 'Tools',
    react: '⏱️',
    use: '.uptime',
    execute: async (conn, msg, m, { from }) => {
      const secs = Math.floor((Date.now() - START_TIME) / 1000);
      const r = runtime(secs);
      await send(conn, from,
`⏱️ *Bot Uptime*

🕐 Running for: *${r}*
🤖 Bot: ${BOT_NAME}

> 🔥 REDXBOT302`);
    },
  },

  // ── SYSINFO
  {
    pattern: 'sysinfo',
    alias: ['system', 'specs'],
    desc: 'Server system info',
    category: 'Tools',
    react: '💻',
    use: '.sysinfo',
    execute: async (conn, msg, m, { from }) => {
      const mb  = (b) => (b / 1024 / 1024).toFixed(2) + ' MB';
      const mem = process.memoryUsage();
      await send(conn, from,
`💻 *System Info*

🖥️ *Platform:* ${os.platform()} ${os.arch()}
🧠 *CPU:* ${os.cpus()[0]?.model || 'Unknown'}
🔢 *Cores:* ${os.cpus().length}
💾 *RAM Used:* ${mb(mem.rss)}
💾 *Heap Used:* ${mb(mem.heapUsed)}
⏱️ *OS Uptime:* ${runtime(Math.floor(os.uptime()))}
🤖 *Node.js:* ${process.version}

> 🔥 ${BOT_NAME}`);
    },
  },

  // ── WEATHER
  {
    pattern: 'weather',
    alias: ['w', 'forecast'],
    desc: 'Get weather for a city',
    category: 'Tools',
    react: '🌤️',
    use: '.weather Karachi',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a city name. Example: *.weather Lahore*');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const w = await getWeather(q);
        await send(conn, from,
`🌤️ *Weather: ${w.city}*

🌡️ *Temp:* ${w.temp_c}°C / ${w.temp_f}°F
🤔 *Feels like:* ${w.feels_c}°C
💧 *Humidity:* ${w.humidity}%
🌬️ *Wind:* ${w.wind}
📝 *Condition:* ${w.desc}

> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Weather error: ${e.message}`); }
    },
  },

  // ── TRANSLATE
  {
    pattern: 'tr',
    alias: ['translate'],
    desc: 'Translate text',
    category: 'Tools',
    react: '🌐',
    use: '.tr en Hello world | .tr ur Good morning',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Usage: *.tr <lang> <text>*\nExample: *.tr ur Hello world*');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const parts = q.trim().split(' ');
        const lang  = parts[0].length <= 3 ? parts.shift() : 'en';
        const text  = parts.join(' ');
        if (!text) return reply('❌ Provide text to translate.');

        const result = await translate(text, lang);
        await send(conn, from,
`🌐 *Translation*

📝 *Original:* ${text}
🌍 *Language:* ${lang}
✅ *Translated:* ${result}

> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },

  // ── WIKIPEDIA
  {
    pattern: 'wiki',
    alias: ['wikipedia', 'define'],
    desc: 'Wikipedia search',
    category: 'Tools',
    react: '📖',
    use: '.wiki Pakistan',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a search term.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const w = await wikiSummary(q);
        await send(conn, from,
`📖 *${w.title}*

${w.extract?.substring(0, 800) || 'No info found.'}${w.extract?.length > 800 ? '...' : ''}

🔗 ${w.url || ''}

> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Not found: ${e.message}`); }
    },
  },

  // ── QR CODE
  {
    pattern: 'qr',
    alias: ['qrcode', 'genqr'],
    desc: 'Generate QR code',
    category: 'Tools',
    react: '📱',
    use: '.qr https://google.com',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide text or URL to convert to QR.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(q)}`;
        await conn.sendMessage(from, {
          image: { url },
          caption: `📱 *QR Code*\n\n📝 Data: ${q}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── SCREENSHOT
  {
    pattern: 'ss',
    alias: ['screenshot', 'web2img'],
    desc: 'Screenshot a website',
    category: 'Tools',
    react: '📸',
    use: '.ss https://google.com',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ Provide a valid URL.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const url = `https://api.microlink.io/?url=${encodeURIComponent(q)}&screenshot=true&meta=false&embed=screenshot.url`;
        await conn.sendMessage(from, {
          image: { url },
          caption: `📸 *Screenshot: ${q}*\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── IP LOOKUP
  {
    pattern: 'iplookup',
    alias: ['ip', 'ipinfo'],
    desc: 'IP address lookup',
    category: 'Tools',
    react: '🌐',
    use: '.iplookup 8.8.8.8',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        const ip = q?.trim() || '';
        if (!ip) return reply('❌ Provide an IP. Example: *.iplookup 8.8.8.8*');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const data = await fetchJson(`https://ipapi.co/${ip}/json/`);
        await send(conn, from,
`🌐 *IP Lookup: ${ip}*

📍 *Country:* ${data.country_name || '?'} ${data.country_code || ''}
🏙️ *City:* ${data.city || '?'}
🗺️ *Region:* ${data.region || '?'}
📮 *ZIP:* ${data.postal || '?'}
⏰ *Timezone:* ${data.timezone || '?'}
🌐 *ISP:* ${data.org || '?'}
📡 *ASN:* ${data.asn || '?'}

> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── CALCULATOR
  {
    pattern: 'calc',
    alias: ['math', 'calculate'],
    desc: 'Calculator',
    category: 'Tools',
    react: '🧮',
    use: '.calc 2+2*10',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a math expression.');
        // Safe eval
        const safe = q.replace(/[^0-9+\-*/.() %^]/g, '');
        if (!safe) return reply('❌ Invalid expression.');
        // eslint-disable-next-line no-new-func
        const result = Function('"use strict"; return (' + safe + ')')();
        await send(conn, from,
`🧮 *Calculator*

📝 *Expression:* ${safe}
✅ *Result:* ${result}

> 🔥 ${BOT_NAME}`);
      } catch { reply('❌ Invalid math expression.'); }
    },
  },

  // ── SHORT URL
  {
    pattern: 'shorturl',
    alias: ['shorten', 'tiny'],
    desc: 'Shorten a URL',
    category: 'Tools',
    react: '🔗',
    use: '.shorturl https://very-long-url.com',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q || !isUrl(q)) return reply('❌ Provide a valid URL.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const short = await fetchJson(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(q)}`);
        await send(conn, from,
`🔗 *Short URL*

📝 Original: ${q}
✅ Short: ${short}

> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── LYRICS
  {
    pattern: 'lyrics',
    desc: 'Search song lyrics',
    category: 'Tools',
    react: '🎵',
    use: '.lyrics Blinding Lights The Weeknd',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide song name. Example: *.lyrics Shape of You Ed Sheeran*');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson(`https://api.siputzx.my.id/api/s/lyrics?title=${encodeURIComponent(q)}`);
        const lyrics = res?.data?.lyrics || res?.lyrics;
        const title  = res?.data?.title  || q;
        if (!lyrics) return reply('❌ Lyrics not found.');
        await send(conn, from,
`🎵 *Lyrics: ${title}*\n\n${lyrics.substring(0, 3000)}${lyrics.length > 3000 ? '\n...(truncated)' : ''}\n\n> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── NEWS
  {
    pattern: 'news',
    desc: 'Latest news headlines',
    category: 'Tools',
    react: '📰',
    use: '.news',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson('https://gnews.io/api/v4/top-headlines?lang=en&max=5&token=free');
        const items = res?.articles?.slice(0, 5) || [];
        if (!items.length) return reply('❌ No news found.');
        let text = `📰 *Latest News*\n\n`;
        items.forEach((n, i) => { text += `${i+1}. *${n.title}*\n   🔗 ${n.url}\n\n`; });
        text += `> 🔥 ${BOT_NAME}`;
        await send(conn, from, text);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── DICTIONARY
  {
    pattern: 'dict',
    alias: ['dictionary', 'meaning'],
    desc: 'Get word definition',
    category: 'Tools',
    react: '📚',
    use: '.dict serendipity',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a word.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res  = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q.split(' ')[0])}`);
        const word = res[0];
        const def  = word?.meanings?.[0]?.definitions?.[0];
        if (!def) return reply('❌ Word not found.');
        await send(conn, from,
`📚 *${word.word}* *(${word.meanings[0]?.partOfSpeech})*

📝 *Definition:*
${def.definition}

${def.example ? `💬 *Example:* ${def.example}` : ''}
${word.phonetics?.[0]?.text ? `🔊 *Phonetic:* ${word.phonetics[0].text}` : ''}

> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },
];
