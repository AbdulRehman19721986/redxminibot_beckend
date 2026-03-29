// plugins/video.js
const yts = require('yt-search');
const fs = require('fs');
const yt = require('../lib/ytdownloader');
const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302',
      serverMessageId: -1,
    },
  },
};

module.exports = {
  command: 'video',
  aliases: ['ytvideo', 'ytv', 'ytmp4'],
  category: 'downloader',
  description: 'Download YouTube video with interactive menu',
  usage: '.video <song name or URL>',
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const query = args.join(' ');
    if (!query) return sock.sendMessage(chatId, { text: '❌ Usage: .video <song name or URL>', ...CH }, { quoted: message });

    await sock.sendMessage(chatId, { react: { text: '🎬', key: message.key } });

    try {
      let videoUrl = query;
      if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
        const search = await yts(query);
        if (!search?.videos?.length) throw new Error('No results');
        videoUrl = search.videos[0].url;
      }

      const info = (await yts(videoUrl)).videos[0] || (await yts(query)).videos[0];
      const caption = `☘️ *Title* ☛ ${info.title}\n` +
        `▫️⏱️ *Duration* ☛ ${info.timestamp}\n` +
        `▫️👁️ *Views* ☛ ${info.views?.toLocaleString()}\n` +
        `▫️👤 *Channel* ☛ ${info.author?.name}\n\n` +
        `🔢 *Reply with the number to download:*\n\n` +
        `1 🎬 Normal Video (Gallery)\n` +
        `2 📁 Document File (File)\n` +
        `3 📹 Video Note (PTV)\n\n` +
        `> *Powered by REDXBOT302*`;

      const sentMsg = await sock.sendMessage(chatId, {
        image: { url: info.thumbnail },
        caption,
        ...CH,
      }, { quoted: message });

      const msgId = sentMsg.key.id;

      const listener = async (update) => {
        const msg = update.messages?.[0];
        if (!msg?.message) return;

        const replyTo = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
        if (replyTo !== msgId) return;

        const choice = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
        if (!['1', '2', '3'].includes(choice)) return;

        sock.ev.off('messages.upsert', listener);
        await sock.sendMessage(chatId, { react: { text: '📥', key: msg.key } });

        try {
          // Download video using YTDownloader (720p)
          const filePath = await yt.downloadVideo(videoUrl, '720');
          const videoBuffer = fs.readFileSync(filePath);
          fs.unlinkSync(filePath); // clean up temp file

          if (choice === '1') {
            await sock.sendMessage(chatId, {
              video: videoBuffer,
              caption: info.title,
              ...CH,
            }, { quoted: msg });
          } else if (choice === '2') {
            await sock.sendMessage(chatId, {
              document: videoBuffer,
              mimetype: 'video/mp4',
              fileName: `${info.title}.mp4`,
              caption: info.title,
              ...CH,
            }, { quoted: msg });
          } else if (choice === '3') {
            await sock.sendMessage(chatId, {
              video: videoBuffer,
              mimetype: 'video/mp4',
              ptv: true,
              ...CH,
            }, { quoted: msg });
          }

          await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } catch (err) {
          console.error('Download error:', err);
          await sock.sendMessage(chatId, {
            text: `❌ Download failed: ${err.message}`,
            ...CH,
          }, { quoted: msg });
        }
      };

      sock.ev.on('messages.upsert', listener);
      setTimeout(() => sock.ev.off('messages.upsert', listener), 10 * 60 * 1000);
    } catch (err) {
      await sock.sendMessage(chatId, {
        text: `❌ ${err.message}`,
        ...CH,
      }, { quoted: message });
    }
  },
};
