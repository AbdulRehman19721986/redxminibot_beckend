// plugins/dl.js
const axios = require('axios');

async function downloadAndSend(sock, chatId, message, url, type, caption = '') {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
  const buffer = Buffer.from(res.data);
  if (type === 'video') {
    await sock.sendMessage(chatId, { video: buffer, mimetype: 'video/mp4', caption }, { quoted: message });
  } else if (type === 'image') {
    await sock.sendMessage(chatId, { image: buffer, caption }, { quoted: message });
  } else {
    await sock.sendMessage(chatId, { document: buffer, fileName: 'media', caption }, { quoted: message });
  }
}

module.exports = {
  command: 'dl',
  aliases: ['download', 'social'],
  category: 'download',
  description: 'Download videos from Facebook, Instagram, TikTok, X, etc.',
  usage: '.dl <URL>',

  async handler(sock, message, args, context) {
    const { chatId } = context;
    const url = args[0]?.trim();
    if (!url) {
      return sock.sendMessage(chatId, {
        text: '🌐 *Universal Downloader*\n\nProvide a link from:\nFacebook, Instagram, TikTok, X (Twitter), YouTube Shorts, etc.\nExample: .dl https://www.instagram.com/reel/...'
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, { react: { text: '⬇️', key: message.key } });

    try {
      const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(apiUrl, { timeout: 20000 });
      if (!data.status || !Array.isArray(data.result) || !data.result.length) {
        throw new Error('No media found');
      }

      const mediaUrls = data.result;
      const platform = data.platform || 'social';
      const metadata = data.metadata || {};

      // Determine type from first URL
      const isVideo = mediaUrls[0].includes('.mp4') || mediaUrls[0].includes('/video/');
      const type = isVideo ? 'video' : 'image';

      let caption = `📥 *Downloaded from ${platform}*\n`;
      if (metadata.title) caption += `📝 *Title:* ${metadata.title}\n`;
      if (metadata.author) caption += `👤 *Author:* ${metadata.author}\n`;

      // Send first media (if multiple, you can loop)
      await downloadAndSend(sock, chatId, message, mediaUrls[0], type, caption.trim());

    } catch (err) {
      console.error('Universal downloader error:', err);
      sock.sendMessage(chatId, { text: `❌ Failed: ${err.message}` }, { quoted: message });
    }
  }
};
