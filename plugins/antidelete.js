/**
 * REDXBOT302 v6 — Anti-Delete Plugin
 * Caches all messages, forwards deleted ones to owner or group
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const store = require('../lib/lightweight_store');

const BOT_NAME  = process.env.BOT_NAME     || '🔥 REDXBOT302 🔥';
const OWNER_NUM = process.env.OWNER_NUMBER || '923009842133';
const NL_JID    = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const MAX_CACHE = 2000;

// message cache: msgId → entry
const msgCache = new Map();

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

async function cacheMessage(msg) {
  try {
    if (!msg.key?.id || !msg.message) return;
    const type = Object.keys(msg.message)[0] || 'unknown';
    const text = msg.message?.conversation
              || msg.message?.extendedTextMessage?.text
              || msg.message?.imageMessage?.caption
              || msg.message?.videoMessage?.caption || '';
    const mediaTypes = ['imageMessage','videoMessage','audioMessage','stickerMessage'];
    const entry = {
      text, type,
      from: msg.key.remoteJid,
      sender: msg.key.participant || msg.key.remoteJid,
      ts: Date.now(),
      mediaType: mediaTypes.includes(type) ? type.replace('Message','') : null,
      mediaMsg:  mediaTypes.includes(type) ? msg.message[type] : null,
      mime:      mediaTypes.includes(type) ? msg.message[type]?.mimetype : null,
    };
    msgCache.set(msg.key.id, entry);
    if (msgCache.size > MAX_CACHE) msgCache.delete(msgCache.keys().next().value);
  } catch {}
}

async function handleDelete(conn, item) {
  try {
    const ownerJid = OWNER_NUM + '@s.whatsapp.net';
    for (const key of (item?.keys || [])) {
      const cached = msgCache.get(key.id);
      if (!cached) continue;
      const setting = await store.getSetting(cached.from, 'antidelete') || {};
      if (!setting.enabled) continue;
      const dest   = setting.target === 'owner' ? ownerJid : cached.from;
      const sender = cached.sender?.split('@')[0] || '?';
      const time   = new Date(cached.ts).toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi' });
      const header = `🗑️ *DELETED MESSAGE*\n\n👤 *From:* @${sender}\n🏠 *Chat:* ${cached.from.endsWith('@g.us') ? 'Group' : 'DM'}\n🕐 *Time:* ${time}\n\n`;

      if (cached.text) {
        await conn.sendMessage(dest, {
          text: `${header}📝 *Message:*\n${cached.text}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: { ...ctxInfo(), mentionedJid: [cached.sender] },
        }).catch(() => {});
      }

      if (cached.mediaMsg && cached.mediaType) {
        try {
          const stream = await downloadContentFromMessage(cached.mediaMsg, cached.mediaType);
          const chunks = []; for await (const c of stream) chunks.push(c);
          const buf = Buffer.concat(chunks);
          const cap = `${header}> 🔥 ${BOT_NAME}`;
          let payload = {};
          if (cached.mediaType === 'image')    payload = { image: buf, caption: cap, contextInfo: ctxInfo() };
          else if (cached.mediaType === 'video')   payload = { video: buf, caption: cap, contextInfo: ctxInfo() };
          else if (cached.mediaType === 'audio')   payload = { audio: buf, mimetype: cached.mime || 'audio/mpeg' };
          else if (cached.mediaType === 'sticker') payload = { sticker: buf };
          await conn.sendMessage(dest, payload).catch(() => {});
        } catch {
          await conn.sendMessage(dest, {
            text: `${header}📎 *${cached.mediaType} deleted*\n\n> 🔥 ${BOT_NAME}`,
            contextInfo: { ...ctxInfo(), mentionedJid: [cached.sender] },
          }).catch(() => {});
        }
      }
      msgCache.delete(key.id);
    }
  } catch {}
}

module.exports = [
  {
    pattern: 'antidelete', alias: ['antidel', 'adel'],
    desc: 'Detect & forward deleted messages to owner or group',
    category: 'Group',
    execute: async (conn, msg, m, { from, args, reply, isAdmin, isOwner }) => {
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const sub = (args[0] || '').toLowerCase();
      const cur = await store.getSetting(from, 'antidelete') || { enabled: false, target: 'group' };

      if (sub === 'on') {
        const target = args[1] === 'owner' ? 'owner' : 'group';
        await store.saveSetting(from, 'antidelete', { enabled: true, target });
        return reply(`✅ *Anti-Delete ON*\n📍 Forwarding deleted msgs → *${target === 'owner' ? 'Owner DM' : 'This Group'}*`);
      }
      if (sub === 'off') {
        await store.saveSetting(from, 'antidelete', { ...cur, enabled: false });
        return reply('❌ *Anti-Delete OFF*');
      }
      if (sub === 'owner') { await store.saveSetting(from, 'antidelete', { ...cur, target: 'owner' }); return reply('✅ Target → *Owner DM*'); }
      if (sub === 'group') { await store.saveSetting(from, 'antidelete', { ...cur, target: 'group' }); return reply('✅ Target → *This Group*'); }

      reply(
        `╔══════════════════════╗\n║  🗑️ *ANTI-DELETE*      ║\n╚══════════════════════╝\n\n` +
        `Status: ${cur.enabled ? '✅ ON' : '❌ OFF'}\n` +
        `Target: ${cur.target === 'owner' ? '👑 Owner DM' : '👥 This Group'}\n\n` +
        `*.antidelete on* — enable (forwards to group)\n` +
        `*.antidelete on owner* — forward to owner DM\n` +
        `*.antidelete off* — disable\n` +
        `*.antidelete owner|group* — change target`
      );
    },
  },
];
module.exports.cacheMessage = cacheMessage;
module.exports.handleDelete  = handleDelete;
