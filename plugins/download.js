// plugins/download.js
const axios = require('axios');
module.exports = {
    command: 'download',
    aliases: ['dl', 'save'],
    category: 'download',
    description: 'Universal media downloader (Facebook, Instagram, TikTok, X, etc.)',
    usage: '.download <url>',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const url = args[0];
        if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .download <url>', ...channelInfo }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });
        try {
            const { data } = await axios.get(`https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(url)}`, { timeout: 20000 });
            if (!data.status) throw new Error('Download failed');
            const platform = data.platform;
            const results = data.result;
            if (!results || !results.length) throw new Error('No media found');

            // Use the first result
            const mediaUrl = results[0];
            const meta = data.metadata || {};

            let caption = `📥 *${platform.toUpperCase()} Download*\n\n`;
            if (meta.author) caption += `👤 *Author:* ${meta.author}\n`;
            if (meta.caption) caption += `📝 *Caption:* ${meta.caption.substring(0, 100)}...\n`;
            caption += `\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʀᴇᴅxʙᴏᴛ302`;

            // Determine if it's video or image
            const isVideo = mediaUrl.match(/\.(mp4|mov|webm)$/i);
            if (isVideo) {
                await sock.sendMessage(chatId, { video: { url: mediaUrl }, caption, ...channelInfo }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, { image: { url: mediaUrl }, caption, ...channelInfo }, { quoted: message });
            }
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `❌ Error: ${err.message}`, ...channelInfo }, { quoted: message });
        }
    }
};
