/**
 * REDXBOT302 — Temp Mail Plugin
 * Commands: tempmail, checkinbox
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

// In-memory temp mail store per user
const tempMails = new Map();

module.exports = [
  // ── GENERATE TEMP MAIL
  {
    pattern: 'tempmail',
    alias: ['fakemail', 'tmail'],
    desc: 'Generate a disposable email address',
    category: 'Tools',
    react: '📧',
    use: '.tempmail',
    execute: async (conn, msg, m, { from, reply, sender }) => {
      try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        // Generate random email via 1secmail API
        const res   = await fetchJson('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
        const email = Array.isArray(res) ? res[0] : res;
        if (!email) return reply('❌ Could not generate temp mail.');

        const [user, domain] = email.split('@');
        tempMails.set(sender, { user, domain, email, created: Date.now() });

        await conn.sendMessage(from, {
          text:
`📧 *Temporary Email Generated!*

✉️ *Email:* \`${email}\`

━━━━━━━━━━━━━━━━━━━━━━━
📥 *Check inbox:* .checkinbox
🗑️ *Email expires:* ~60 minutes
━━━━━━━━━━━━━━━━━━━━━━━

> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },

  // ── CHECK INBOX
  {
    pattern: 'checkinbox',
    alias: ['inbox', 'readmail'],
    desc: 'Check inbox of your temp email',
    category: 'Tools',
    react: '📬',
    use: '.checkinbox',
    execute: async (conn, msg, m, { from, reply, sender }) => {
      try {
        const mail = tempMails.get(sender);
        if (!mail) return reply('❌ No temp mail found! Generate one first with *.tempmail*');

        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const msgs = await fetchJson(
          `https://www.1secmail.com/api/v1/?action=getMessages&login=${mail.user}&domain=${mail.domain}`
        );

        if (!msgs || msgs.length === 0) {
          await conn.sendMessage(from, {
            text: `📬 *Inbox: ${mail.email}*\n\n📭 No messages yet. Check back soon!\n\n> 🔥 ${BOT_NAME}`,
            contextInfo: ctxInfo(),
          }, { quoted: fakevCard });
          return;
        }

        let text = `📬 *Inbox: ${mail.email}*\n📨 ${msgs.length} message(s)\n\n`;
        for (const [i, m] of msgs.slice(0, 5).entries()) {
          text += `${i + 1}. 📩 *From:* ${m.from}\n   *Subject:* ${m.subject}\n   *Date:* ${m.date}\n\n`;
        }
        text += `> 🔥 ${BOT_NAME}`;

        await conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ Error: ${e.message}`); }
    },
  },
];
