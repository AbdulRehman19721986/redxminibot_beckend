// plugins/drama.js
const axios = require('axios');
module.exports = {
    command: 'drama',
    aliases: ['searchdrama', 'dramadl'],
    category: 'download',
    description: 'Search and download the first result as video (mp4)',
    usage: '.drama <name>',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const query = args.join(' ').trim();
        if (!query) return sock.sendMessage(chatId, { text: '❌ Usage: .drama <drama name>', ...channelInfo }, { quoted: message });

        await sock.sendPresenceUpdate('composing', chatId);
        await sock.sendMessage(chatId, { text: `🔍 Searching for "${query}"...`, ...channelInfo }, { quoted: message });

        try {
            const searchRes = await axios.get(`https://jawad-tech.vercel.app/search/youtube?q=${encodeURIComponent(query)}`, { timeout: 15000 });
            if (!searchRes.data?.status || !searchRes.data?.result?.length) throw new Error('No results');
            const first = searchRes.data.result[0];
            const videoUrl = first.link;

            // Send thumbnail with info
            await sock.sendMessage(chatId, {
                image: { url: first.imageUrl },
                caption: `🎬 *${first.title}*\n📺 ${first.channel}\n⏱️ ${first.duration}\n\n⏳ Fetching download...`,
                ...channelInfo
            }, { quoted: message });

            const dlRes = await axios.get(`https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(videoUrl)}`, { timeout: 60000 });
            if (!dlRes.data?.status || !dlRes.data?.result?.mp4) throw new Error('Download link not found');
            const downloadUrl = dlRes.data.result.mp4;

            await sock.sendMessage(chatId, {
                video: { url: downloadUrl },
                caption: `🎬 *${first.title}*\n📺 ${first.channel}\n⏱️ ${first.duration}\n\n📥 Downloaded via REDXBOT302`,
                ...channelInfo
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `❌ Error: ${err.message}`, ...channelInfo }, { quoted: message });
        }
    }
};
