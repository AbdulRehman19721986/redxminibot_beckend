'use strict';
const axios  = require('axios');
const fvc    = require('../lib/fakevcard');
const { react, getBuffer } = require('../lib/utils');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function dlMedia(msg, type) {
  const stream = await downloadContentFromMessage(msg, type);
  let buf = Buffer.from([]);
  for await (const c of stream) buf = Buffer.concat([buf, c]);
  return buf;
}

module.exports = [
  // ── TOAUDIO ──────────────────────────────────────────────
  {
    pattern: 'toaudio', alias: ['tomp3','mp3'],
    desc: 'Convert video to audio', category: 'tools', react: '🎵',
    execute: async (conn, msg, m, { from, reply }) => {
      const q = m.quoted;
      if (!q?.message?.videoMessage && !msg.message?.videoMessage)
        return reply('❌ Reply to a video to convert to audio');
      const vmsg = q?.message?.videoMessage || msg.message?.videoMessage;
      await react(conn, msg, '⏳');
      try {
        const buf = await dlMedia(vmsg, 'video');
        await conn.sendMessage(from, {
          audio: buf, mimetype: 'audio/mpeg', ptt: false,
          fileName: 'converted.mp3',
        }, { quoted: fvc });
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ Conversion failed: ${e.message}`); }
    },
  },
  // ── TOVIDEO ───────────────────────────────────────────────
  {
    pattern: 'tovideo', alias: ['tomp4'],
    desc: 'Convert audio to video note', category: 'tools', react: '🎬',
    execute: async (conn, msg, m, { from, reply }) => {
      const q = m.quoted;
      const amsg = q?.message?.audioMessage || msg.message?.audioMessage;
      if (!amsg) return reply('❌ Reply to an audio to convert');
      await react(conn, msg, '⏳');
      try {
        const buf = await dlMedia(amsg, 'audio');
        await conn.sendMessage(from, { audio: buf, mimetype: 'audio/mpeg', ptt: true }, { quoted: fvc });
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ Failed: ${e.message}`); }
    },
  },
  // ── TOURL ─────────────────────────────────────────────────
  {
    pattern: 'tourl', alias: ['upload','catbox'],
    desc: 'Upload media and get URL', category: 'tools', react: '🔗',
    execute: async (conn, msg, m, { from, reply }) => {
      const q = m.quoted;
      if (!q) return reply('❌ Reply to any media to get its URL');
      reply('⚠️ Media upload to catbox requires catbox API. Set CATBOX_KEY in environment variables.\n\nAlternatively use: https://catbox.moe');
    },
  },
  // ── REMOVEBG ──────────────────────────────────────────────
  {
    pattern: 'removebg', alias: ['rmbg', 'nobg'],
    desc: 'Remove image background', category: 'tools', react: '✂️',
    execute: async (conn, msg, m, { from, reply }) => {
      const q = m.quoted;
      const imsg = q?.message?.imageMessage || msg.message?.imageMessage;
      if (!imsg) return reply('❌ Reply to an image to remove background\n\nRequires: REMOVEBG_API_KEY env var');
      const apiKey = process.env.REMOVEBG_API_KEY;
      if (!apiKey) return reply('❌ Set REMOVEBG_API_KEY environment variable to use this feature.\nGet free key at: https://www.remove.bg');
      await react(conn, msg, '⏳');
      try {
        const buf = await dlMedia(imsg, 'image');
        const FormData = require('form-data');
        const form = new FormData();
        form.append('image_file', buf, { filename: 'image.png', contentType: 'image/png' });
        form.append('size', 'auto');
        const { data } = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
          headers: { ...form.getHeaders(), 'X-Api-Key': apiKey },
          responseType: 'arraybuffer', timeout: 30000,
        });
        await conn.sendMessage(from, { image: Buffer.from(data), caption: '✂️ *Background Removed!*\n> 🔥 REDXBOT302' }, { quoted: fvc });
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ Failed: ${e.message}`); }
    },
  },
  // ── RESIZE ────────────────────────────────────────────────
  {
    pattern: 'resize',
    desc: 'Resize image (width x height)', category: 'tools', react: '📐',
    execute: async (conn, msg, m, { from, q, reply }) => {
      const [w, h] = (q || '512x512').split(/[xX×]/).map(n => parseInt(n) || 512);
      const imsg = (m.quoted?.message || msg.message)?.imageMessage;
      if (!imsg) return reply('❌ Reply to image. Usage: .resize 512x512');
      await react(conn, msg, '⏳');
      try {
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=${w}x${h}&data=test`; // placeholder
        reply(`📐 Resize to ${w}x${h} requires server-side image processing.\n💡 Use .ss to screenshot websites at any size.`);
      } catch (e) { reply(`❌ Failed: ${e.message}`); }
    },
  },
  // ── OCR ───────────────────────────────────────────────────
  {
    pattern: 'ocr', alias: ['readtext','textfromimg'],
    desc: 'Extract text from image', category: 'tools', react: '🔍',
    execute: async (conn, msg, m, { from, reply }) => {
      const imsg = (m.quoted?.message || msg.message)?.imageMessage;
      if (!imsg) return reply('❌ Reply to an image to extract text');
      await react(conn, msg, '⏳');
      try {
        const buf  = await dlMedia(imsg, 'image');
        const b64  = buf.toString('base64');
        const { data } = await axios.post('https://api.ocr.space/parse/image',
          `base64Image=data:image/png;base64,${b64}&language=eng&isOverlayRequired=false`,
          { headers: { apikey: process.env.OCR_KEY || 'helloworld', 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
        );
        const text = data?.ParsedResults?.[0]?.ParsedText?.trim();
        if (!text) return reply('❌ No text detected in image');
        conn.sendMessage(from, { text: `🔍 *Extracted Text*\n\n${text}` }, { quoted: fvc });
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ OCR failed: ${e.message}`); }
    },
  },
  // ── VIEWONCE ──────────────────────────────────────────────
  {
    pattern: 'viewonce', alias: ['vo', 'antiviewonce'],
    desc: 'Re-send view-once media', category: 'tools', react: '👁️',
    execute: async (conn, msg, m, { from, reply }) => {
      const q = m.quoted;
      if (!q) return reply('❌ Reply to a view-once message');
      const vmsg = q.message?.viewOnceMessage?.message || q.message?.viewOnceMessageV2?.message;
      if (!vmsg) return reply('❌ This is not a view-once message');
      try {
        await react(conn, msg, '⏳');
        const media = vmsg.imageMessage || vmsg.videoMessage;
        if (!media) return reply('❌ Cannot access this view-once media');
        const type = vmsg.imageMessage ? 'image' : 'video';
        const buf  = await dlMedia(media, type);
        if (type === 'image') {
          conn.sendMessage(from, { image: buf, caption: '👁️ *View Once Unlocked!*\n> 🔥 REDXBOT302' }, { quoted: fvc });
        } else {
          conn.sendMessage(from, { video: buf, caption: '👁️ *View Once Unlocked!*\n> 🔥 REDXBOT302' }, { quoted: fvc });
        }
        await react(conn, msg, '✅');
      } catch (e) { reply(`❌ Failed: ${e.message}`); }
    },
  },
  // ── GETPPURL ─────────────────────────────────────────────
  {
    pattern: 'ppurl', alias: ['getppurl'],
    desc: 'Get profile picture URL', category: 'utility', react: '🔗',
    execute: async (conn, msg, m, { from, sender, reply }) => {
      const target = m.mentionedJid?.[0] || m.quoted?.sender || sender;
      try {
        const url = await conn.profilePictureUrl(target, 'image');
        conn.sendMessage(from, {
          text: `🔗 *Profile Picture URL*\n👤 @${target.split('@')[0]}\n\n${url}`,
          mentions: [target],
        }, { quoted: fvc });
      } catch { reply('❌ Privacy settings prevent access to this profile picture'); }
    },
  },
];
