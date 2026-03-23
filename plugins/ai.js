/**
 * REDXBOT302 v6 — Full AI Plugin
 * Supports Urdu, English, Arabic, Hindi and all languages
 * GPT, DeepSeek, Gemini, Image Gen, Text-to-Audio, Text-to-Video, BGM,
 * OCR, Translate, Summarize, Story, Code, Quiz, Advice, Lyrics, Caption
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const OWNER_NUM      = process.env.OWNER_NUMBER   || '923009842133';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

async function get(url, opts = {}) {
  const res = await axios.get(url, { timeout: 35000, headers: { 'User-Agent': 'REDXBOT302/6.0' }, ...opts });
  return res.data;
}
async function post(url, data, hdrs = {}) {
  const res = await axios.post(url, data, { timeout: 35000, headers: { 'User-Agent': 'REDXBOT302/6.0', ...hdrs } });
  return res.data;
}

// Per-user AI conversation memory
const aiHistory = new Map();
function getHistory(jid) { return aiHistory.get(jid) || []; }
function pushHistory(jid, role, content) {
  const h = getHistory(jid);
  h.push({ role, content });
  if (h.length > 20) h.splice(0, 2);
  aiHistory.set(jid, h);
}

// Language detection helper
const urduPattern  = /[\u0600-\u06FF]/;
const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
function detectLang(text) {
  if (urduPattern.test(text))  return 'ur';
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  return 'en';
}

module.exports = [

  // ══════════════════════════════════════════════════════════════
  // AI CHAT (multilingual - Urdu, English, Arabic, Hindi, all)
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'ai', alias: ['gpt', 'chatgpt', 'ask', 'سوال', 'پوچھو'],
    desc: 'AI chat — Urdu/English/all languages supported', category: 'AI', react: '🤖',
    execute: async (conn, msg, m, { from, q, reply, sender }) => {
      if (!q) return reply('❌ Usage: .ai <question>\n.ai آپ کا سوال یہاں\n.ai your question here');
      await conn.sendMessage(from, { react: { text: '🤖', key: msg.key } });
      try {
        pushHistory(sender, 'user', q);
        const lang = detectLang(q);
        const sysPrompt = lang === 'ur'
          ? 'آپ ایک مددگار اے آئی اسسٹنٹ ہیں۔ اردو میں جواب دیں۔'
          : 'You are a helpful AI assistant. Reply in the same language as the user.';
        const prompt = `${sysPrompt}\n\nUser: ${q}`;
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const answer = res?.data || res?.result || res?.message || 'No response.';
        pushHistory(sender, 'assistant', answer);
        await conn.sendMessage(from, {
          text: `🤖 *AI Response*\n\n❓ ${q}\n\n💬 ${answer}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { conn.sendMessage(from, { react: { text: '❌', key: msg.key } }); reply(`❌ ${e.message}`); }
    },
  },

  // CLEAR AI HISTORY
  {
    pattern: 'clearchat', alias: ['clearai', 'resetai', 'newchat'],
    desc: 'Clear AI conversation history', category: 'AI',
    execute: async (conn, msg, m, { reply, sender }) => {
      aiHistory.delete(sender);
      reply('🗑️ *AI history cleared!* Start a fresh conversation.');
    },
  },

  // ══════════════════════════════════════════════════════════════
  // DEEPSEEK (multilingual)
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'deepseek', alias: ['ds', 'deep', 'دیپسیک'],
    desc: 'DeepSeek AI — multilingual', category: 'AI', react: '🧠',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .deepseek <question>');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const lang = detectLang(q);
        const prefix = lang === 'ur' ? 'اردو میں جواب دیں: ' : '';
        const res = await get(`https://api.siputzx.my.id/api/ai/deepseek-r1?content=${encodeURIComponent(prefix + q)}`);
        const a   = res?.data || res?.result || 'No response.';
        await conn.sendMessage(from, { text: `🧠 *DeepSeek AI*\n\n❓ ${q}\n\n💬 ${a}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // AI IMAGE GENERATION (multiple engines)
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'imagine', alias: ['aiimage', 'genimage', 'flux', 'txt2img', 'aiimg', 'gimage'],
    desc: 'Generate AI image from prompt', category: 'AI', react: '🎨',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .imagine <prompt>\nExample: .imagine a mountain in Pakistan at sunset');
      await conn.sendMessage(from, { react: { text: '🎨', key: msg.key } });
      try {
        // Try multiple image generation APIs
        let url = null;
        const apis = [
          `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(q)}`,
          `https://api.siputzx.my.id/api/ai/dalle?prompt=${encodeURIComponent(q)}`,
          `https://pollinations.ai/p/${encodeURIComponent(q)}?width=1024&height=1024&nologo=true`,
        ];
        for (const api of apis) {
          try {
            if (api.includes('pollinations')) { url = api; break; }
            const res = await get(api);
            url = res?.download_url || res?.url || res?.data || res?.image;
            if (url) break;
          } catch {}
        }
        if (!url) return reply('❌ Image generation failed. Try again.');
        await conn.sendMessage(from, {
          image: { url },
          caption: `🎨 *AI Generated Image*\n📝 Prompt: ${q}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { conn.sendMessage(from, { react: { text: '❌', key: msg.key } }); reply(`❌ ${e.message}`); }
    },
  },

  // AI IMAGE (Pollinations - always works)
  {
    pattern: 'gimage', alias: ['genimg', 'aiart', 'draw'],
    desc: 'Generate AI image (fast engine)', category: 'AI', react: '🖼️',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .gimage <prompt>');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const url = `https://pollinations.ai/p/${encodeURIComponent(q)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random()*9999)}`;
        await conn.sendMessage(from, {
          image: { url },
          caption: `🖼️ *AI Art*\n📝 ${q}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // TEXT TO AUDIO (TTS) — Urdu + English + all languages
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'tts', alias: ['speak', 'texttoaudio', 'voice', 'trt', 'tta'],
    desc: 'Convert text to audio/voice — all languages', category: 'AI', react: '🔊',
    execute: async (conn, msg, m, { from, q, args, reply }) => {
      if (!q) return reply('❌ Usage: .tts <text>\n.tts ur آپ کا متن یہاں\n.tts en Hello World\nLanguages: ur, en, hi, ar, tr, fr, de...');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        let lang = detectLang(q);
        let text = q;
        // Allow explicit lang prefix: .tts ur متن
        const langCodes = ['ur','en','hi','ar','fr','de','tr','es','it','ru','zh','ja','ko','pt'];
        if (langCodes.includes(args[0]?.toLowerCase())) {
          lang = args[0].toLowerCase();
          text = args.slice(1).join(' ');
        }
        // Google TTS (free, no key needed)
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
        const audioRes = await axios.get(ttsUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; REDXBOT302/6.0)', 'Referer': 'https://translate.google.com/' },
        });
        const buf = Buffer.from(audioRes.data);
        await conn.sendMessage(from, {
          audio: buf,
          mimetype: 'audio/mpeg',
          ptt: false,
          fileName: 'tts.mp3',
        }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) {
        // Fallback: try alternative TTS
        try {
          const lang2 = detectLang(q);
          const url2  = `https://api.siputzx.my.id/api/ai/tts?text=${encodeURIComponent(q)}&lang=${lang2}`;
          const r2    = await get(url2);
          const audio = r2?.url || r2?.data;
          if (audio) {
            await conn.sendMessage(from, { audio: { url: audio }, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
            conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
          } else throw new Error('No audio URL');
        } catch { reply(`❌ TTS failed: ${e.message}`); }
      }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // TEXT TO VIDEO AI
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'texttovideo', alias: ['ttv', 'txt2video', 'aivideo'],
    desc: 'Generate AI video from text prompt', category: 'AI', react: '🎬',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .texttovideo <prompt>\nExample: .texttovideo A sunset over mountains');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        // Try multiple TTV APIs
        const apis = [
          `https://api.siputzx.my.id/api/ai/texttovideo?prompt=${encodeURIComponent(q)}`,
        ];
        let vidUrl = null;
        for (const api of apis) {
          try { const r = await get(api); vidUrl = r?.url || r?.data || r?.video; if (vidUrl) break; } catch {}
        }
        if (!vidUrl) return reply('⚠️ Text-to-video AI is computationally intensive and may not always be available.\n\nTry: *.imagine* for AI images instead.\n\n> 🔥 ' + BOT_NAME);
        await conn.sendMessage(from, { video: { url: vidUrl }, caption: `🎬 *AI Video*\n📝 ${q}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // BGM / BACKGROUND MUSIC GENERATOR
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'bgm', alias: ['backgroundmusic', 'aimusic', 'musicgen'],
    desc: 'Generate background music by mood/genre', category: 'AI', react: '🎵',
    execute: async (conn, msg, m, { from, q, reply, downloadSessions, dlKey }) => {
      const moods = ['happy','sad','relaxing','epic','romantic','dark','funny','tense','peaceful','energetic'];
      if (!q) return reply(`🎵 *BGM Generator*\n\nUsage: .bgm <mood/genre>\n\nAvailable moods:\n${moods.map(m=>`• ${m}`).join('\n')}\n\nExample: .bgm epic`);
      await conn.sendMessage(from, { react: { text: '🎵', key: msg.key } });
      try {
        // Search YouTube for royalty-free BGM
        const query = `${q} background music no copyright royalty free`;
        const res   = await get(`https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(query)}`);
        const items = (res?.data || []).slice(0, 5).map((v,i) => ({ label: `${v.title} (${v.timestamp||'?'})`, url: v.url||v.link, title: v.title }));
        if (!items.length) return reply('❌ No BGM found. Try another mood.');

        let text = `🎵 *BGM Results — "${q}"*\n\n`;
        items.forEach((item, i) => { text += `*${i+1}.* ${item.label}\n`; });
        text += `\n💡 Reply with a number to download\n> 🔥 ${BOT_NAME}`;
        await conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: msg });
        downloadSessions.set(dlKey, {
          items,
          handler: async (conn2, msg2, num, session) => {
            const item = session.items[num-1];
            if (!item) return conn2.sendMessage(from, { text: `❌ Choose 1-${session.items.length}` }, { quoted: msg2 });
            await conn2.sendMessage(from, { react: { text: '⏳', key: msg2.key } });
            const dl = await get(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(item.url)}`);
            const audioUrl = dl?.data?.url || dl?.data?.download || dl?.url;
            if (!audioUrl) throw new Error('Could not get audio link');
            await conn2.sendMessage(from, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${item.title}.mp3`, contextInfo: ctxInfo() }, { quoted: msg2 });
            await conn2.sendMessage(from, { react: { text: '✅', key: msg2.key } });
            downloadSessions.delete(dlKey);
          },
        });
        setTimeout(() => downloadSessions.delete(dlKey), 120000);
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // OCR — Read text from image
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'ocr', alias: ['readimg', 'imgtext', 'readimage'],
    desc: 'Extract text from image (OCR) — all languages', category: 'AI', react: '📝',
    execute: async (conn, msg, m, { from, reply }) => {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const target = quoted?.imageMessage || msg.message?.imageMessage;
      if (!target) return reply('❌ Reply to an image with .ocr');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(target, 'image');
        let buf = Buffer.alloc(0); for await (const c of stream) buf = Buffer.concat([buf, c]);
        const FormData = require('form-data');
        const form = new FormData();
        form.append('base64Image', 'data:image/jpeg;base64,' + buf.toString('base64'));
        form.append('language', 'eng+ara+urd+hin');
        form.append('isOverlayRequired', 'false');
        const res = await post('https://api.ocr.space/parse/image', form, { ...form.getHeaders(), apikey: 'helloworld' });
        const text = res?.ParsedResults?.[0]?.ParsedText?.trim();
        if (!text) return reply('❌ No text found in image.');
        await conn.sendMessage(from, { text: `📝 *OCR Result*\n\n${text}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // TRANSLATE — Full multilingual
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'translate', alias: ['tr', 'tl', 'ترجمہ'],
    desc: 'Translate text to any language', category: 'AI', react: '🌐',
    execute: async (conn, msg, m, { from, args, q, reply }) => {
      const langs = { ur:'Urdu', en:'English', hi:'Hindi', ar:'Arabic', fr:'French', de:'German', tr:'Turkish', es:'Spanish', it:'Italian', ru:'Russian', zh:'Chinese', ja:'Japanese', ko:'Korean', pt:'Portuguese', fa:'Farsi', ps:'Pashto' };
      const lang = langs[args[0]?.toLowerCase()] ? args[0].toLowerCase() : 'en';
      const text = (args[0]?.toLowerCase() in langs) ? args.slice(1).join(' ') : q;
      if (!text) return reply(`❌ Usage: .translate <lang> <text>\n\nLang codes:\n${Object.entries(langs).map(([k,v])=>`${k}=${v}`).join(', ')}\n\nExample: .translate ur Hello`);
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const res = await get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`);
        const translated = res?.responseData?.translatedText || text;
        await conn.sendMessage(from, { text: `🌐 *Translation → ${langs[lang]||lang}*\n\n📝 Original: ${text}\n\n✅ Translated: ${translated}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // SUMMARIZE
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'summarize', alias: ['sum', 'tldr', 'summary', 'خلاصہ'],
    desc: 'Summarize text with AI (Urdu/English)', category: 'AI', react: '📋',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .summarize <text>');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      const lang = detectLang(q);
      const prompt = lang === 'ur'
        ? `یہ متن اردو میں 3-4 جملوں میں خلاصہ کریں:\n\n${q}`
        : `Summarize the following in 3-4 clear sentences:\n\n${q}`;
      try {
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const a   = res?.data || res?.result || 'Could not summarize.';
        await conn.sendMessage(from, { text: `📋 *Summary*\n\n${a}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // CODE GENERATOR
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'code', alias: ['codegen', 'aicode', 'کوڈ'],
    desc: 'Generate code with AI', category: 'AI', react: '💻',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .code <request>\nExample: .code Python fibonacci function');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      const lang = detectLang(q);
      const prompt = lang === 'ur'
        ? `اس کام کے لیے کوڈ لکھیں: ${q}\nصرف کوڈ اور مختصر وضاحت دیں۔`
        : `Write clean, well-commented code for: ${q}\nOnly provide the code and a brief explanation.`;
      try {
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const code = res?.data || res?.result || 'Could not generate.';
        await conn.sendMessage(from, { text: `💻 *AI Code*\n\n${code}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ══════════════════════════════════════════════════════════════
  // STORY GENERATOR (multilingual)
  // ══════════════════════════════════════════════════════════════
  {
    pattern: 'story', alias: ['writestory', 'tale', 'کہانی'],
    desc: 'Write a short story with AI', category: 'AI', react: '📖',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .story <prompt>\n.story ایک جادوئی کہانی لکھو');
      await conn.sendMessage(from, { react: { text: '✍️', key: msg.key } });
      const lang = detectLang(q);
      const prompt = lang === 'ur'
        ? `اس موضوع پر 300 الفاظ میں ایک دلچسپ کہانی لکھیں: ${q}`
        : `Write a creative short story (max 300 words) about: ${q}`;
      try {
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const story = res?.data || res?.result || 'Could not generate.';
        await conn.sendMessage(from, { text: `📖 *AI Story*\n\n${story}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // RIZZ / PICKUP LINES
  {
    pattern: 'rizz', alias: ['pickup', 'flirt', 'لائن'],
    desc: 'Generate creative pickup lines', category: 'AI', react: '😏',
    execute: async (conn, msg, m, { from, q, reply }) => {
      await conn.sendMessage(from, { react: { text: '😏', key: msg.key } });
      const lang = detectLang(q);
      const prompt = lang === 'ur'
        ? `ایک مزاحیہ اور تخلیقی رومانٹک جملہ بنائیں${q ? ` اس موضوع پر: ${q}` : ''}`
        : `Generate a clever, witty pickup line${q ? ` about: ${q}` : ''}. Make it creative and harmless.`;
      try {
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const line = res?.data || res?.result || '✨';
        await conn.sendMessage(from, { text: `😏 *Rizz Line*\n\n"${line}"\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ADVICE
  {
    pattern: 'advice', alias: ['suggest', 'مشورہ'],
    desc: 'Get AI advice (Urdu/English)', category: 'AI', react: '💡',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .advice <situation>\n.advice میری مدد کریں...');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      const lang = detectLang(q);
      const prompt = lang === 'ur'
        ? `اس صورتحال کے لیے عملی مشورہ دیں: ${q}`
        : `Give practical, helpful advice for: ${q}`;
      try {
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const a   = res?.data || res?.result || 'No advice.';
        await conn.sendMessage(from, { text: `💡 *AI Advice*\n\n${a}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // AI QUIZ
  {
    pattern: 'aiquiz', alias: ['quiz', 'کوئز'],
    desc: 'Generate a quiz question with AI', category: 'AI', react: '❓',
    execute: async (conn, msg, m, { from, q, reply }) => {
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      const topic  = q || 'general knowledge';
      const lang   = detectLang(q);
      const prompt = lang === 'ur'
        ? `"${topic}" کے بارے میں اردو میں ایک چار اختیاری سوال بنائیں اور صحیح جواب بتائیں۔`
        : `Create a multiple choice question about "${topic}" with 4 options (A,B,C,D) and mark the correct answer.`;
      try {
        const res  = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const quiz = res?.data || res?.result || 'Could not generate.';
        await conn.sendMessage(from, { text: `❓ *AI Quiz*\n\n${quiz}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // SHAYARI (Urdu poetry AI)
  {
    pattern: 'shayari', alias: ['shairi', 'poetry', 'شاعری'],
    desc: 'Generate Urdu Shayari with AI', category: 'AI', react: '🌹',
    execute: async (conn, msg, m, { from, q, reply }) => {
      await conn.sendMessage(from, { react: { text: '🌹', key: msg.key } });
      const topic = q || 'محبت';
      const prompt = `"${topic}" کے موضوع پر خوبصورت اردو شاعری لکھیں۔ 4 مصرعے۔`;
      try {
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const poem = res?.data || res?.result || 'کوئی شاعری نہیں مل سکی۔';
        await conn.sendMessage(from, { text: `🌹 *اردو شاعری*\n\n${poem}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '❤️', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // SHARIYAI (Islamic AI)
  {
    pattern: 'shariyai', alias: ['شریعت', 'islamai', 'fatwa'],
    desc: 'Islamic guidance with AI (Urdu/English)', category: 'AI', react: '☪️',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .shariyai <question>\n.shariyai نماز کا وقت\n.shariyai halal income question');
      await conn.sendMessage(from, { react: { text: '☪️', key: msg.key } });
      const lang = detectLang(q);
      const prompt = lang === 'ur'
        ? `آپ ایک اسلامی اسکالر ہیں۔ اس سوال کا قرآن و حدیث کی روشنی میں اردو میں جواب دیں: ${q}\n\nنوٹ: یہ AI کا جواب ہے، مستند عالم سے تصدیق کریں۔`
        : `You are an Islamic scholar. Answer this question based on Quran and Hadith: ${q}\n\nNote: This is an AI response. Please verify with a qualified Islamic scholar.`;
      try {
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const a   = res?.data || res?.result || 'Could not get response.';
        await conn.sendMessage(from, {
          text: `☪️ *Islamic AI*\n\n❓ ${q}\n\n💬 ${a}\n\n⚠️ _AI response — verify with a qualified scholar_\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '☪️', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ROAST
  {
    pattern: 'roastme', alias: ['roast', 'roastai'],
    desc: 'Roast with AI humor', category: 'AI', react: '🔥',
    execute: async (conn, msg, m, { from, q, reply, sender }) => {
      const name = q || sender.split('@')[0];
      const prompt = `Give a funny, harmless, playful roast about someone named "${name}". Keep it PG-13 and creative. Max 3 sentences.`;
      try {
        await conn.sendMessage(from, { react: { text: '🔥', key: msg.key } });
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const roast = res?.data || res?.result || '🔥';
        await conn.sendMessage(from, { text: `🔥 *AI Roast*\n\n${roast}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '😂', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // CAPTION GENERATOR (for images)
  {
    pattern: 'caption', alias: ['imgcaption', 'capai'],
    desc: 'Generate captions for photos with AI', category: 'AI', react: '✍️',
    execute: async (conn, msg, m, { from, q, reply }) => {
      const theme = q || 'general';
      const prompt = `Generate 5 creative social media captions for a photo about "${theme}". Make them engaging and emoji-rich.`;
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      try {
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const caps = res?.data || res?.result || 'No captions generated.';
        await conn.sendMessage(from, { text: `✍️ *AI Captions*\n\n${caps}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
        conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // DREAM INTERPRET
  {
    pattern: 'dream', alias: ['خواب', 'dreamai'],
    desc: 'Interpret dreams with AI (Urdu/English)', category: 'AI', react: '🌙',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .dream <describe your dream>');
      await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
      const lang = detectLang(q);
      const prompt = lang === 'ur'
        ? `اس خواب کی اسلامی و نفسیاتی تعبیر بتائیں: ${q}`
        : `Interpret this dream from psychological and cultural perspectives: ${q}`;
      try {
        const res = await get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}`);
        const a   = res?.data || res?.result || 'No interpretation.';
        await conn.sendMessage(from, { text: `🌙 *Dream Interpretation*\n\n${a}\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: msg });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },
];
