/**
 * REDXBOT302 - Sticker Plugins
 * Category: sticker
 */
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cat = 'sticker';
const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302', serverMessageId: -1
    }
  }
};

async function downloadMedia(message, type) {
  try {
    const m = message.message || {};
    const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage;
    const media = m[`${type}Message`] || quoted?.[`${type}Message`];
    if (!media) return null;
    const stream = await downloadContentFromMessage(media, type);
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    return Buffer.concat(chunks);
  } catch { return null; }
}

const plugins = [

{
  command: 'sticker', aliases: ['s', 'stiker', 'stic'], category: cat,
  description: 'Convert image/video to sticker', usage: '.sticker (reply to image/video/gif)',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });

    const m = message.message || {};
    const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage;

    // Detect media type
    const isImage = m.imageMessage || quoted?.imageMessage;
    const isVideo = m.videoMessage || quoted?.videoMessage || m.stickerMessage || quoted?.stickerMessage;
    const isGif = (m.videoMessage || quoted?.videoMessage)?.gifPlayback;

    if (!isImage && !isVideo) {
      return sock.sendMessage(chatId, { text: '❌ Reply to an image, video, or GIF with .sticker', ...CH }, { quoted: message });
    }

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const id = Date.now();

    try {
      if (isImage) {
        const imgBuf = await downloadMedia(message, 'image');
        if (!imgBuf) return sock.sendMessage(chatId, { text: '❌ Failed to download image.', ...CH }, { quoted: message });
        const inPath = path.join(tmpDir, `stk_${id}.jpg`);
        const outPath = path.join(tmpDir, `stk_${id}.webp`);
        fs.writeFileSync(inPath, imgBuf);
        await new Promise((resolve, reject) => {
          exec(`ffmpeg -y -i "${inPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" "${outPath}"`, (err) => err ? reject(err) : resolve());
        });
        const stickerBuf = fs.readFileSync(outPath);
        await sock.sendMessage(chatId, { sticker: stickerBuf }, { quoted: message });
        try { fs.unlinkSync(inPath); fs.unlinkSync(outPath); } catch {}
      } else {
        const vidBuf = await downloadMedia(message, 'video');
        if (!vidBuf) return sock.sendMessage(chatId, { text: '❌ Failed to download video.', ...CH }, { quoted: message });
        const inPath = path.join(tmpDir, `stk_${id}.mp4`);
        const outPath = path.join(tmpDir, `stk_${id}.webp`);
        fs.writeFileSync(inPath, vidBuf);
        await new Promise((resolve, reject) => {
          exec(`ffmpeg -y -i "${inPath}" -vcodec libwebp -filter:v "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -loop 0 -ss 00:00:00.0 -t 00:00:05.0 -preset default -an -vsync 0 "${outPath}"`, (err) => err ? reject(err) : resolve());
        });
        const stickerBuf = fs.readFileSync(outPath);
        await sock.sendMessage(chatId, { sticker: stickerBuf }, { quoted: message });
        try { fs.unlinkSync(inPath); fs.unlinkSync(outPath); } catch {}
      }
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Sticker creation failed. Make sure ffmpeg is installed.\n${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'toimg', aliases: ['stickertoimg', 'stickertojpg'], category: cat,
  description: 'Convert sticker to image', usage: '.toimg (reply to sticker)',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const m = message.message || {};
    const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage;
    const sticker = m.stickerMessage || quoted?.stickerMessage;
    if (!sticker) return sock.sendMessage(chatId, { text: '❌ Reply to a sticker with .toimg', ...CH }, { quoted: message });

    try {
      const stream = await downloadContentFromMessage(sticker, 'sticker');
      const chunks = [];
      for await (const c of stream) chunks.push(c);
      const buf = Buffer.concat(chunks);

      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const id = Date.now();
      const inPath = path.join(tmpDir, `img_${id}.webp`);
      const outPath = path.join(tmpDir, `img_${id}.png`);
      fs.writeFileSync(inPath, buf);

      await new Promise((resolve, reject) => {
        exec(`ffmpeg -y -i "${inPath}" "${outPath}"`, (err) => err ? reject(err) : resolve());
      });

      await sock.sendMessage(chatId, { image: fs.readFileSync(outPath), caption: '🖼️ *Sticker → Image*', ...CH }, { quoted: message });
      try { fs.unlinkSync(inPath); fs.unlinkSync(outPath); } catch {}
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Conversion failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

];

module.exports = plugins;
