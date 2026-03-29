/**
 * REDXBOT302 — Utility Plugin
 * Commands: calc, qr, uptime, sysinfo, base64, shorturl, color, password, uuid
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { getBuffer, runtime, formatBytes } = require('../lib/functions');
const fakevCard = require('../lib/fakevcard');
const os        = require('os');
const crypto    = require('crypto');

const BOT_NAME   = process.env.BOT_NAME   || '🔥 REDXBOT302 🔥';
const OWNER_NAME = process.env.OWNER_NAME || 'Abdul Rehman Rajpoot';
const NL_JID     = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const START_TIME = Date.now();

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});
const send = (conn, from, text) =>
  conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: fakevCard });

module.exports = [

  // ── CALCULATOR ─────────────────────────────────────────
  {
    pattern: 'ucalc',
    alias: ['calculate', 'math', 'eval'],
    desc: 'Calculate a math expression',
    category: 'Utility',
    react: '🧮',
    use: '.calc 2+2*10',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide a math expression.\n*Usage:* .calc 2+2*10');
      try {
        // Safe eval using Function constructor scoped to math only
        const sanitized = q.replace(/[^0-9+\-*/.()^%\s]/g, '');
        if (!sanitized) return reply('❌ Invalid expression. Only numbers and operators allowed.');
        // eslint-disable-next-line no-new-func
        const result = new Function(`return (${sanitized})`)();
        if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result');
        await send(conn, from,
`╔══════[ *Calculator* ]══════╗

🔢 *Expression:* ${sanitized}
✅ *Result:* ${result}

> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch {
        return reply('❌ Invalid expression. Please use valid math notation.');
      }
    },
  },

  // ── QR CODE ────────────────────────────────────────────
  {
    pattern: 'uqr',
    alias: ['qrcode', 'makeqr'],
    desc: 'Generate a QR code from text/URL',
    category: 'Utility',
    react: '📷',
    use: '.qr <text or URL>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide text or a URL.\n*Usage:* .qr <text>');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(q)}&color=DC1E3C&bgcolor=080810&format=png`;
        await conn.sendMessage(from, {
          image: { url },
          caption: `📷 *QR Code Generated!*\n\n📝 Content: ${q.substring(0, 100)}${q.length > 100 ? '...' : ''}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        return reply('❌ Failed to generate QR code.');
      }
    },
  },

  // ── READ QR ────────────────────────────────────────────
  {
    pattern: 'readqr',
    alias: ['scanqr', 'qrread'],
    desc: 'Read/decode a QR code from image',
    category: 'Utility',
    react: '🔍',
    use: '<reply to QR image>',
    execute: async (conn, msg, m, { from, reply }) => {
      const { fetchJson } = require('../lib/functions2');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg    = quotedMsg?.imageMessage || msg.message?.imageMessage;
        if (!imgMsg) return reply('❌ Please reply to a QR code image.');
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(imgMsg, 'image');
        let buf = Buffer.alloc(0);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        const { default: FormData } = await import('form-data');
        // We can't easily decode without external API, just respond accordingly
        await send(conn, from, '⚠️ QR reading requires a server-side decoder. Try uploading to: https://zxing.org/w/decode.jspx\n\n> 🔥 ' + BOT_NAME);
        await conn.sendMessage(from, { react: { text: '⚠️', key: msg.key } });
      } catch (e) {
        return reply(`❌ Failed: ${e.message}`);
      }
    },
  },

  // ── UPTIME ─────────────────────────────────────────────
  {
    pattern: 'uuptime',
    alias: ['alive', 'runtime'],
    desc: 'Check bot uptime',
    category: 'Utility',
    react: '⏱️',
    use: '.uptime',
    execute: async (conn, msg, m, { from }) => {
      const up = runtime(Math.floor((Date.now() - START_TIME) / 1000));
      await send(conn, from,
`╔══════[ *Bot Uptime* ]══════╗

⏱️ *Runtime:* ${up}
🤖 *Bot:* ${BOT_NAME}
👑 *Owner:* ${OWNER_NAME}
📅 *Started:* ${new Date(START_TIME).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })} PKT

> 🔥 Still running strong!`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  // ── SYS INFO ───────────────────────────────────────────
  {
    pattern: 'usysinfo',
    alias: ['system', 'serverinfo'],
    desc: 'Show server/system info',
    category: 'Utility',
    react: '💻',
    use: '.sysinfo',
    execute: async (conn, msg, m, { from }) => {
      const totalMem = os.totalmem();
      const freeMem  = os.freemem();
      const usedMem  = totalMem - freeMem;
      const up       = runtime(os.uptime());
      const cpus     = os.cpus();
      await send(conn, from,
`╔══════[ *System Info* ]══════╗

💻 *Platform:* ${os.platform()} (${os.arch()})
🖥️ *Hostname:* ${os.hostname()}
⚙️ *CPU:* ${cpus[0]?.model || 'N/A'} (${cpus.length} cores)
📊 *RAM Total:* ${formatBytes(totalMem)}
📊 *RAM Used:* ${formatBytes(usedMem)} (${Math.round(usedMem/totalMem*100)}%)
📊 *RAM Free:* ${formatBytes(freeMem)}
⏰ *OS Uptime:* ${up}
🟢 *Node.js:* ${process.version}
📦 *Bot:* ${BOT_NAME}

> 🔥 ${OWNER_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  // ── BASE64 ─────────────────────────────────────────────
  {
    pattern: 'base64',
    alias: ['b64'],
    desc: 'Encode/decode base64',
    category: 'Utility',
    react: '🔐',
    use: '.base64 encode|decode <text>',
    execute: async (conn, msg, m, { from, args, reply }) => {
      if (args.length < 2) return reply('❌ Usage: .base64 encode|decode <text>');
      const action = args[0].toLowerCase();
      const text   = args.slice(1).join(' ');
      let result;
      if (action === 'encode') {
        result = Buffer.from(text).toString('base64');
      } else if (action === 'decode') {
        try { result = Buffer.from(text, 'base64').toString('utf8'); }
        catch { return reply('❌ Invalid base64 string.'); }
      } else {
        return reply('❌ Use: .base64 encode <text>  or  .base64 decode <b64>');
      }
      await send(conn, from,
`╔══════[ *Base64* ]══════╗

🔄 *Action:* ${action.toUpperCase()}
📝 *Input:* ${text.substring(0, 100)}
✅ *Result:* ${result.substring(0, 500)}

> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  // ── PASSWORD GENERATOR ────────────────────────────────
  {
    pattern: 'password',
    alias: ['genpass', 'passgen'],
    desc: 'Generate a strong random password',
    category: 'Utility',
    react: '🔑',
    use: '.password [length]',
    execute: async (conn, msg, m, { from, q }) => {
      const len    = Math.min(Math.max(parseInt(q) || 16, 8), 64);
      const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
      let password = '';
      const bytes  = crypto.randomBytes(len);
      for (let i = 0; i < len; i++) password += chars[bytes[i] % chars.length];
      await send(conn, from,
`╔══════[ *Password Generator* ]══════╗

🔑 *Generated Password (${len} chars):*
\`\`\`${password}\`\`\`

⚠️ _Keep this password safe! Do not share it._

> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  // ── UUID ───────────────────────────────────────────────
  {
    pattern: 'uuid',
    alias: ['guid'],
    desc: 'Generate a random UUID',
    category: 'Utility',
    react: '🎲',
    use: '.uuid',
    execute: async (conn, msg, m, { from }) => {
      const uuid = crypto.randomUUID ? crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = crypto.randomInt(16);
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
      await send(conn, from, `🎲 *UUID:*\n\`\`\`${uuid}\`\`\`\n\n> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  // ── SHORTURL ───────────────────────────────────────────
  {
    pattern: 'short',
    alias: ['shorturl', 'tinyurl'],
    desc: 'Shorten a URL',
    category: 'Utility',
    react: '🔗',
    use: '.short <url>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q || !q.startsWith('http')) return reply('❌ Provide a valid URL.\n*Usage:* .short <url>');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const { fetchJson } = require('../lib/functions2');
        const result = await fetchJson(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(q)}`);
        await send(conn, from,
`╔══════[ *URL Shortener* ]══════╗

🔗 *Original:* ${q.substring(0, 80)}...
✅ *Short:* ${result}

> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        return reply('❌ Failed to shorten URL.');
      }
    },
  },

  // ── REVERSE TEXT ──────────────────────────────────────
  {
    pattern: 'ureverse',
    alias: ['rev'],
    desc: 'Reverse text',
    category: 'Utility',
    react: '🔄',
    use: '.reverse <text>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide text to reverse.');
      await send(conn, from, `🔄 *Reversed:*\n${q.split('').reverse().join('')}\n\n> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  // ── EMOJIFY ───────────────────────────────────────────
  {
    pattern: 'emojify',
    alias: ['emoji'],
    desc: 'Convert text to emoji letters',
    category: 'Utility',
    react: '🔤',
    use: '.emojify <text>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide text.');
      const map = {
        a:'🅐',b:'🅑',c:'🅒',d:'🅓',e:'🅔',f:'🅕',g:'🅖',h:'🅗',i:'🅘',j:'🅙',
        k:'🅚',l:'🅛',m:'🅜',n:'🅝',o:'🅞',p:'🅟',q:'🅠',r:'🅡',s:'🅢',t:'🅣',
        u:'🅤',v:'🅥',w:'🅦',x:'🅧',y:'🅨',z:'🅩',' ':'  ',
      };
      const result = q.toLowerCase().split('').map(c => map[c] || c).join(' ');
      await send(conn, from, `🔤 *Emojified:*\n${result}\n\n> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },
];
