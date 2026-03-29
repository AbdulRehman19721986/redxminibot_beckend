// plugins/tiktok.js
const axios = require('axios');
module.exports = {
    command: 'tiktok',
    aliases: ['tt', 'ttdl'],
    category: 'download',
    description: 'Download TikTok video without watermark',
    usage: '.tiktok <url>',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const url = args[0];
        if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .tiktok <url>', ...channelInfo }, { quoted: message });
        if (!url.includes('tiktok.com')) return sock.sendMessage(chatId, { text: '❌ Invalid TikTok link', ...channelInfo }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        try {
            const { data } = await axios.get(`https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`, { timeout: 20000 });
            if (!data.status) throw new Error('Download failed');
            const videoUrl = data.result;
            const meta = data.metadata;
            const caption = `🎵 *TikTok Video* 🎵\n\n👤 *User:* ${meta.author?.nickname} (@${meta.author?.username})\n📖 *Title:* ${meta.title}\n👍 *Likes:* ${meta.stats?.likes}\n💬 *Comments:* ${meta.stats?.comments}\n🔁 *Shares:* ${meta.stats?.shares}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʀᴇᴅxʙᴏᴛ302`;
            await sock.sendMessage(chatId, { video: { url: videoUrl }, caption, ...channelInfo }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `❌ Error: ${err.message}`, ...channelInfo }, { quoted: message });
        }
    }
};
