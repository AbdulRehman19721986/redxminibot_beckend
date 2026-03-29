/**
 * REDXBOT302 - Play2 with fallback URLs
 */
const yts = require('yt-search');
const axios = require('axios');

const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302', serverMessageId: -1
    }
  }
};

module.exports = {
  command: 'play2',
  aliases: ['mp3fallback', 'song2'],
  category: 'music',
  description: 'Stream audio with fallback URLs',
  usage: '.play2 <song name>',

  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ');
    if (!query) return sock.sendMessage(chatId, { text: '❌ Usage: .play2 <song name>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });
    try {
      const searchResult = await yts(query);
      const video = searchResult.videos[0];
      if (!video) return sock.sendMessage(chatId, { text: '❌ No results found.', ...CH }, { quoted: message });

      await sock.sendMessage(chatId, {
        image: { url: video.thumbnail },
        caption: `*🎵 ${video.title}*\n⏱️ ${video.timestamp} | 👤 ${video.author.name}\n⬇️ Downloading...`,
        ...CH
      }, { quoted: message });

      const apiUrl = `https://api.qasimdev.dpdns.org/api/loaderto/download?apiKey=qasim-dev&format=mp3&url=${video.url}`;
      const { data: apiResponse } = await axios.get(apiUrl, { timeout: 30000 });

      const urlsToTry = [];
      if (apiResponse?.data?.downloadUrl) urlsToTry.push(apiResponse.data.downloadUrl);
      if (apiResponse?.data?.alternativeUrls) apiResponse.data.alternativeUrls.forEach(a => urlsToTry.push(a.url));
      if (!urlsToTry.length) throw new Error('No download URLs');

      for (const url of urlsToTry) {
        try {
          await axios.head(url, { timeout: 5000 });
          await sock.sendMessage(chatId, { audio: { url }, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3`, ...CH }, { quoted: message });
          return;
        } catch { /* try next */ }
      }
      throw new Error('All URLs failed');
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ play2 failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
};
