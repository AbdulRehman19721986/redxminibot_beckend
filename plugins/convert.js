/**
 * REDXBOT302 — Convert Plugin
 * units, currency, base64, binary, morse
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { fetchJson } = require('../lib/functions2');
const fakevCard     = require('../lib/fakevcard');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: `🔥 ${BOT_NAME}`,
    serverMessageId: 200,
  },
});

const send = (conn, from, text) =>
  conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: fakevCard });

// Morse code map
const MORSE = {
  A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',
  K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',
  U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
  '6':'-....','7':'--...','8':'---..','9':'----.',
};
const MORSE_REV = Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]));

module.exports = [
  // ── BASE64 ENCODE
  {
    pattern: 'b64encode',
    alias: ['encode'],
    desc: 'Encode text to Base64',
    category: 'Convert',
    react: '🔐',
    use: '.b64encode Hello World',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide text to encode.');
      const result = Buffer.from(q).toString('base64');
      await send(conn, from, `🔐 *Base64 Encode*\n\n📝 Input: ${q}\n✅ Output:\n${result}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── BASE64 DECODE
  {
    pattern: 'b64decode',
    alias: ['decode'],
    desc: 'Decode Base64 text',
    category: 'Convert',
    react: '🔓',
    use: '.b64decode SGVsbG8gV29ybGQ=',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide Base64 text to decode.');
        const result = Buffer.from(q.trim(), 'base64').toString('utf8');
        await send(conn, from, `🔓 *Base64 Decode*\n\n📝 Input: ${q}\n✅ Output: ${result}\n\n> 🔥 ${BOT_NAME}`);
      } catch { reply('❌ Invalid Base64 string.'); }
    },
  },

  // ── BINARY ENCODE
  {
    pattern: 'binary',
    alias: ['tobin'],
    desc: 'Convert text to binary',
    category: 'Convert',
    react: '💻',
    use: '.binary Hello',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide text.');
      const result = q.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
      await send(conn, from, `💻 *Text → Binary*\n\n📝 Input: ${q}\n✅ Output:\n${result}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── MORSE ENCODE
  {
    pattern: 'morse',
    desc: 'Convert text to Morse code',
    category: 'Convert',
    react: '📡',
    use: '.morse SOS',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide text.');
      const result = q.toUpperCase().split('').map(c => MORSE[c] || (c === ' ' ? '/' : '?')).join(' ');
      await send(conn, from, `📡 *Text → Morse*\n\n📝 Input: ${q}\n✅ Output:\n${result}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── MORSE DECODE
  {
    pattern: 'unmorse',
    alias: ['decodemorse'],
    desc: 'Decode Morse code to text',
    category: 'Convert',
    react: '📡',
    use: '.unmorse ... --- ...',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide Morse code.');
      const result = q.split(' ').map(c => c === '/' ? ' ' : (MORSE_REV[c] || '?')).join('');
      await send(conn, from, `📡 *Morse → Text*\n\n📝 Input: ${q}\n✅ Output: ${result}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── CURRENCY CONVERT
  {
    pattern: 'currency',
    alias: ['fx', 'exchange'],
    desc: 'Convert currency',
    category: 'Convert',
    react: '💱',
    use: '.currency 100 USD to PKR',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Usage: .currency 100 USD to PKR');
        const match = q.match(/^([\d.]+)\s+([A-Za-z]{3})\s+(?:to\s+)?([A-Za-z]{3})$/i);
        if (!match) return reply('❌ Format: .currency 100 USD to PKR');
        const [, amount, from_c, to_c] = match;
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const data = await fetchJson(`https://api.exchangerate-api.com/v4/latest/${from_c.toUpperCase()}`);
        const rate = data.rates[to_c.toUpperCase()];
        if (!rate) return reply('❌ Currency not supported.');
        const result = (parseFloat(amount) * rate).toFixed(2);
        await send(conn, from,
`💱 *Currency Convert*

💵 ${amount} ${from_c.toUpperCase()} = *${result} ${to_c.toUpperCase()}*
📈 Rate: 1 ${from_c.toUpperCase()} = ${rate} ${to_c.toUpperCase()}

> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── COLOR HEX → RGB
  {
    pattern: 'colorinfo',
    alias: ['hex', 'color'],
    desc: 'Get color info from HEX code',
    category: 'Convert',
    react: '🎨',
    use: '.colorinfo #ff0000',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a hex color. Example: .colorinfo #ff0000');
        const hex = q.replace('#', '').trim();
        if (hex.length !== 6) return reply('❌ Invalid hex color.');
        const r = parseInt(hex.substring(0,2), 16);
        const g = parseInt(hex.substring(2,4), 16);
        const b = parseInt(hex.substring(4,6), 16);
        const imageUrl = `https://singlecolorimage.com/get/${hex}/200x200`;
        await conn.sendMessage(from, {
          image: { url: imageUrl },
          caption:
`🎨 *Color Info*

🔵 *HEX:* #${hex.toUpperCase()}
🔴 *RGB:* rgb(${r}, ${g}, ${b})
🌈 *R:* ${r} | G: ${g} | B: ${b}

> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── REVERSE TEXT
  {
    pattern: 'reverse',
    desc: 'Reverse text',
    category: 'Convert',
    react: '🔄',
    use: '.reverse Hello World',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide text.');
      const result = q.split('').reverse().join('');
      await send(conn, from, `🔄 *Reversed Text*\n\n📝 Original: ${q}\n✅ Reversed: ${result}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── STYLE TEXT
  {
    pattern: 'styletext',
    alias: ['fancy', 'fancytext'],
    desc: 'Style text in different fonts',
    category: 'Convert',
    react: '✍️',
    use: '.styletext Hello',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide text.');
      const styles = {
        'Bold':        str => str.split('').map(c => {
          const offset = c >= 'a' && c <= 'z' ? 0x1D41A - 97 : c >= 'A' && c <= 'Z' ? 0x1D400 - 65 : 0;
          return offset ? String.fromCodePoint(c.charCodeAt(0) + offset) : c;
        }).join(''),
        'Italic':      str => str.split('').map(c => {
          const offset = c >= 'a' && c <= 'z' ? 0x1D44E - 97 : c >= 'A' && c <= 'Z' ? 0x1D434 - 65 : 0;
          return offset ? String.fromCodePoint(c.charCodeAt(0) + offset) : c;
        }).join(''),
        'Monospace':   str => str.split('').map(c => {
          const offset = c >= 'a' && c <= 'z' ? 0x1D68A - 97 : c >= 'A' && c <= 'Z' ? 0x1D670 - 65 : c >= '0' && c <= '9' ? 0x1D7F6 - 48 : 0;
          return offset ? String.fromCodePoint(c.charCodeAt(0) + offset) : c;
        }).join(''),
        'Small Caps':  str => str.replace(/[a-z]/g, c => 'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘqʀsᴛᴜᴠᴡxʏᴢ'[c.charCodeAt(0) - 97]),
        'Upside Down': str => str.split('').reverse().map(c => ({ a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z' }[c] || c)).join(''),
      };
      let text = `✍️ *Styled Text: "${q}"*\n\n`;
      for (const [name, fn] of Object.entries(styles)) {
        try { text += `*${name}:* ${fn(q)}\n`; } catch {}
      }
      text += `\n> 🔥 ${BOT_NAME}`;
      await send(conn, from, text);
    },
  },
];
