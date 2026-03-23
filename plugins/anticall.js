/**
 * REDXBOT302 v6 — Anti-Call Plugin
 * Custom reject msg, media, whitelist/blacklist, ring duration, block
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const store = require('../lib/lightweight_store');

const BOT_NAME = process.env.BOT_NAME || '🔥 REDXBOT302 🔥';
const NL_JID   = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const MEDIA_DIR = path.join(process.cwd(), 'data', 'anticall_media');
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

const DEFAULT_MSG = `📵 *Calls Not Allowed!*\n\nThis bot doesn't accept calls.\nPlease send a text message instead. 🙏\n\n> 🔥 ${BOT_NAME}`;
const processed = new Set();
setInterval(() => processed.clear(), 60000);

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

async function getState() {
  return await store.getSetting('global', 'anticall') || {
    enabled: false, ringDuration: 0, blockAfter: false,
    text: DEFAULT_MSG, mediaPath: null, mediaType: null,
    mediaMime: null, sendMode: 'text', whitelist: [], blacklist: [],
  };
}
async function setState(u) { const c = await getState(); await store.saveSetting('global', 'anticall', { ...c, ...u }); }

async function downloadMediaFromMsg(msg, conn) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!ctx) throw new Error('Reply to a media message first.');
  const typeMap = { imageMessage: 'image', videoMessage: 'video', audioMessage: 'audio', stickerMessage: 'sticker', documentMessage: 'document' };
  let found, mtype;
  for (const [k, v] of Object.entries(typeMap)) { if (ctx[k]) { found = ctx[k]; mtype = v; break; } }
  if (!found) throw new Error('Unsupported media type.');
  const stream = await downloadContentFromMessage(found, mtype);
  const chunks = []; for await (const c of stream) chunks.push(c);
  return { buf: Buffer.concat(chunks), mime: found.mimetype, type: mtype };
}

async function handleIncomingCall(conn, call) {
  try {
    const state = await getState();
    const { id: callId, from: caller } = call;
    if (!callId || !caller || processed.has(callId)) return;
    processed.add(callId);
    if (state.whitelist.some(n => caller.includes(n))) return;
    const inBlack = state.blacklist.some(n => caller.includes(n));
    if (!state.enabled && !inBlack) return;
    setTimeout(async () => {
      try { await conn.rejectCall(callId, caller); } catch {}
      await sendRejectMsg(conn, caller, state);
      if (state.blockAfter) try { await conn.updateBlockStatus(caller, 'block'); } catch {}
    }, state.ringDuration || 0);
  } catch {}
}

async function sendRejectMsg(conn, to, state) {
  try {
    const { sendMode, text, mediaPath, mediaType, mediaMime } = state;
    const hasMedia = mediaPath && fs.existsSync(mediaPath);
    if (!hasMedia || sendMode === 'text') return conn.sendMessage(to, { text: text || DEFAULT_MSG, contextInfo: ctxInfo() });
    const buf = fs.readFileSync(mediaPath);
    const cap = sendMode === 'both' ? (text || undefined) : undefined;
    let payload = {};
    if (mediaType === 'image')    payload = { image: buf, caption: cap, contextInfo: ctxInfo() };
    else if (mediaType === 'video')   payload = { video: buf, caption: cap, contextInfo: ctxInfo() };
    else if (mediaType === 'audio')   payload = { audio: buf, mimetype: mediaMime || 'audio/mpeg' };
    else if (mediaType === 'sticker') payload = { sticker: buf };
    else payload = { document: buf, mimetype: mediaMime, contextInfo: ctxInfo() };
    await conn.sendMessage(to, payload);
    if (sendMode === 'both' && !cap) conn.sendMessage(to, { text: text || DEFAULT_MSG, contextInfo: ctxInfo() });
  } catch {}
}

module.exports = [
  {
    pattern: 'anticall', alias: ['acall', 'callblock'],
    desc: 'Auto-reject calls with custom message/media', category: 'Owner',
    execute: async (conn, msg, m, { from, args, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only!');
      const state = await getState();
      const sub   = args.join(' ').trim().toLowerCase();
      const rawQ  = args.join(' ').trim();

      if (!sub || sub === 'status') {
        return reply(
          `╔══════════════════════════╗\n║  📵 *ANTI-CALL STATUS*     ║\n╚══════════════════════════╝\n\n` +
          `Status: ${state.enabled ? '✅ ON' : '❌ OFF'}\n` +
          `Ring: ${(state.ringDuration||0)/1000}s\nBlock After: ${state.blockAfter ? '✅' : '❌'}\n` +
          `Mode: ${(state.sendMode||'text').toUpperCase()}\nMsg: ${state.text !== DEFAULT_MSG ? 'Custom' : 'Default'}\n` +
          `Media: ${state.mediaPath ? '✅ Set' : '❌ None'}\nWhitelist: ${state.whitelist.length}\nBlacklist: ${state.blacklist.length}\n\n` +
          `*Commands:*\n.anticall on|off\n.anticall text <msg>\n.anticall media (reply)\n` +
          `.anticall mode text|media|both\n.anticall ring <sec>\n.anticall block on|off\n` +
          `.anticall whitelist add|remove|list <num>\n.anticall blacklist add|remove|list <num>\n.anticall reset`
        );
      }
      if (sub === 'on')  { await setState({ enabled: true });  return reply('✅ *Anti-Call ON* — all calls will be rejected.'); }
      if (sub === 'off') { await setState({ enabled: false }); return reply('❌ *Anti-Call OFF*'); }
      if (sub.startsWith('text ')) { const t = rawQ.slice(5); await setState({ text: t }); return reply(`✅ Custom reject message:\n\n"${t}"`); }

      if (sub === 'media') {
        try {
          const { buf, mime, type } = await downloadMediaFromMsg(msg, conn);
          const ext = { image:'jpg', video:'mp4', audio:'mp3', sticker:'webp', document:'bin' }[type] || 'bin';
          const fp  = path.join(MEDIA_DIR, `ac_${Date.now()}.${ext}`);
          fs.writeFileSync(fp, buf);
          await setState({ mediaPath: fp, mediaType: type, mediaMime: mime });
          return reply(`✅ Anticall media set! Type: ${type} | ${(buf.length/1024).toFixed(1)}KB\nUse *.anticall mode media* to activate.`);
        } catch (e) { return reply(`❌ ${e.message}`); }
      }

      if (sub === 'mode text')  { await setState({ sendMode: 'text' });  return reply('✅ Mode: TEXT'); }
      if (sub === 'mode media') { await setState({ sendMode: 'media' }); return reply('✅ Mode: MEDIA'); }
      if (sub === 'mode both')  { await setState({ sendMode: 'both' });  return reply('✅ Mode: BOTH'); }

      if (sub.startsWith('ring ')) {
        const s = parseInt(args[1]); if (isNaN(s)) return reply('❌ .anticall ring <seconds>');
        await setState({ ringDuration: s * 1000 }); return reply(`✅ Ring: ${s}s`);
      }
      if (sub === 'block on')  { await setState({ blockAfter: true });  return reply('🔒 Auto-block ON'); }
      if (sub === 'block off') { await setState({ blockAfter: false }); return reply('🔓 Auto-block OFF'); }

      if (sub === 'reset') {
        await setState({ text: DEFAULT_MSG, mediaPath: null, mediaType: null, mediaMime: null, sendMode: 'text' });
        return reply('🔄 Reset to default.');
      }

      for (const listName of ['whitelist', 'blacklist']) {
        if (sub.startsWith(listName)) {
          const [, action, num] = args;
          const n = (num || '').replace(/\D/g, '');
          const cur = state[listName] || [];
          if (action === 'add' && n) {
            const upd = cur.includes(n) ? cur : [...cur, n];
            await setState({ [listName]: upd }); return reply(`✅ +${n} → ${listName}`);
          }
          if (action === 'remove' && n === 'all') { await setState({ [listName]: [] }); return reply(`🗑️ ${listName} cleared.`); }
          if (action === 'remove' && n) {
            await setState({ [listName]: cur.filter(x => x !== n) }); return reply(`❌ +${n} removed from ${listName}`);
          }
          if (action === 'list') return reply(`📋 *${listName}:*\n${cur.length ? cur.map(x=>`• +${x}`).join('\n') : '(empty)'}`);
          return reply(`Usage: .anticall ${listName} add|remove|list <number>`);
        }
      }
      reply('❓ Unknown. Type *.anticall* for help.');
    },
  },
];
module.exports.handleIncomingCall = handleIncomingCall;
