/**
 * REDXBOT302 — Time Plugin
 * Commands: time, worldtime, date, timezone
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

const ZONES = {
  'Pakistan':      'Asia/Karachi',
  'Australia':     'Australia/Sydney',
  'UK':            'Europe/London',
  'USA NY':        'America/New_York',
  'USA LA':        'America/Los_Angeles',
  'UAE/Dubai':     'Asia/Dubai',
  'India':         'Asia/Kolkata',
  'Saudi Arabia':  'Asia/Riyadh',
  'Turkey':        'Europe/Istanbul',
  'Germany':       'Europe/Berlin',
  'Japan':         'Asia/Tokyo',
  'China':         'Asia/Shanghai',
};

function getTimeInZone(zone) {
  return new Date().toLocaleString('en-US', {
    timeZone: zone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

module.exports = [
  // ── WORLD TIME
  {
    pattern: 'time',
    alias: ['worldtime', 'timezone'],
    desc: 'Show time in major world cities',
    category: 'Tools',
    react: '🕐',
    use: '.time | .time Karachi',
    execute: async (conn, msg, m, { from, q }) => {
      let text;

      if (q) {
        // Try to find the zone
        const key = Object.keys(ZONES).find(k =>
          k.toLowerCase().includes(q.toLowerCase()) ||
          ZONES[k].toLowerCase().includes(q.toLowerCase())
        );
        const zone = key ? ZONES[key] : 'Asia/Karachi';
        const t = getTimeInZone(zone);
        text = `🕐 *Time in ${key || q}*\n\n📅 ${t}\n🌍 Timezone: ${zone}\n\n> 🔥 ${BOT_NAME}`;
      } else {
        // Show all major zones
        text = `🌍 *World Time*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        for (const [place, zone] of Object.entries(ZONES)) {
          const t = getTimeInZone(zone);
          text += `🕐 *${place}*\n   ${t}\n\n`;
        }
        text += `> 🔥 ${BOT_NAME}`;
      }

      await conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: fakevCard });
    },
  },

  // ── DATE INFO
  {
    pattern: 'date',
    desc: 'Get today\'s date and info',
    category: 'Tools',
    react: '📅',
    use: '.date',
    execute: async (conn, msg, m, { from }) => {
      const now = new Date();
      const pkt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
      const day = now.toLocaleDateString('en-US', { weekday: 'long' });

      await conn.sendMessage(from, {
        text:
`📅 *Today's Date Info*

📆 *Date (UTC):* ${now.toDateString()}
🕐 *Pakistan Time:* ${pkt}
📌 *Day:* ${day}
🗓️ *Week #:* ${Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 604800000)}
📊 *Day of Year:* ${Math.ceil((now - new Date(now.getFullYear(), 0, 0)) / 86400000)}

> 🔥 ${BOT_NAME}`,
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── COUNTDOWN
  {
    pattern: 'countdown',
    alias: ['timer'],
    desc: 'Countdown to a date',
    category: 'Tools',
    react: '⏳',
    use: '.countdown 2026-12-31',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide a date. Example: *.countdown 2026-12-31*');
      try {
        const target = new Date(q);
        if (isNaN(target)) return reply('❌ Invalid date format. Use YYYY-MM-DD');
        const now  = new Date();
        const diff = target - now;
        if (diff < 0) return reply('❌ That date is in the past!');

        const days    = Math.floor(diff / 86400000);
        const hours   = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);

        await conn.sendMessage(from, {
          text:
`⏳ *Countdown to ${target.toDateString()}*

📅 *${days}* days
⏰ *${hours}* hours
⏱️ *${minutes}* minutes

> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },
];
