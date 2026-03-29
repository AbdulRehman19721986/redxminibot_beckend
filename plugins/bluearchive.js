// plugins/bluearchive.js
const axios = require('axios');
module.exports = {
    command: 'bluearchive',
    aliases: ['ba', 'bluearchive'],
    category: 'anime',
    description: 'Send a random Blue Archive image',
    usage: '.bluearchive',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        try {
            const { data } = await axios.get('https://jawad-tech.vercel.app/random/ba');
            if (!data || !data.url) throw new Error('No image');
            await sock.sendMessage(chatId, { image: { url: data.url }, caption: '📸 Blue Archive Random Image', ...channelInfo }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `❌ Failed: ${err.message}`, ...channelInfo }, { quoted: message });
        }
    }
};
