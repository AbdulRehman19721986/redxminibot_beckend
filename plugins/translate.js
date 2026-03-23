/**
 * REDXBOT302 — Translate Plugin
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const fakevCard     = require('../lib/fakevcard');
const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const axios          = require('axios');

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: `🔥 ${BOT_NAME}`,
    serverMessageId: 200,
  },
});

const LANG_NAMES = {
  en:'English', ur:'Urdu', ar:'Arabic', fr:'French', de:'German',
  es:'Spanish', hi:'Hindi', zh:'Chinese', ja:'Japanese', ko:'Korean',
  tr:'Turkish', ru:'Russian', pt:'Portuguese', it:'Italian', nl:'Dutch',
  pl:'Polish', vi:'Vietnamese', th:'Thai', fa:'Persian', bn:'Bengali',
};

async function translateText(text, to = 'en') {
  try {
    const res = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${to}`,
      { timeout: 15000 }
    );
    return res.data?.responseData?.translatedText || text;
  } catch {
    // fallback
    const res = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`,
      { timeout: 15000 }
    );
    return res.data?.[0]?.map(x => x?.[0]).filter(Boolean).join('') || text;
  }
}

module.exports = [
  // ── TRANSLATE
  {
    pattern: 'translate',
    alias: ['tl', 'tr'],
    desc: 'Translate text to any language',
    category: 'Tools',
    react: '🌐',
    use: '.translate ur Hello world | .translate en مرحبا',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply(
`❌ *Usage:* .translate <lang_code> <text>

*Example:*
• .translate ur Hello world
• .translate en مرحبا بالعالم
• .translate fr Good morning

*Language Codes:*
en=English, ur=Urdu, ar=Arabic
fr=French, de=German, es=Spanish
hi=Hindi, zh=Chinese, ja=Japanese
ko=Korean, tr=Turkish, ru=Russian`);

        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const parts  = q.trim().split(' ');
        const toLang = parts[0].length <= 5 && /^[a-z-]+$/i.test(parts[0]) ? parts.shift().toLowerCase() : 'en';
        const text   = parts.join(' ');
        if (!text) return reply('❌ Provide text to translate.');

        const result = await translateText(text, toLang);
        const langName = LANG_NAMES[toLang] || toLang.toUpperCase();

        await conn.sendMessage(from, {
          text:
`🌐 *Translation*

📝 *Original:*
${text}

🔄 *Translated to ${langName}:*
${result}

> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ Translation error: ${e.message}`);
      }
    },
  },

  // ── TTS (Text to Speech)
  {
    pattern: 'tts',
    desc: 'Convert text to speech',
    category: 'Tools',
    react: '🔊',
    use: '.tts Hello world | .tts ur اردو میں بولو',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Usage: .tts <text> or .tts <lang> <text>');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const parts   = q.trim().split(' ');
        let lang      = 'en';
        let text      = q;
        if (parts[0].length <= 5 && /^[a-z-]+$/i.test(parts[0]) && parts.length > 1) {
          lang = parts.shift().toLowerCase();
          text = parts.join(' ');
        }

        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
        await conn.sendMessage(from, {
          audio: { url },
          mimetype: 'audio/mpeg',
          ptt: false,
          fileName: 'tts.mp3',
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
        reply(`❌ TTS error: ${e.message}`);
      }
    },
  },
];
