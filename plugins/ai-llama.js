/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/AbdulRehman19721986/redxbot302          *
 *  ▶️  YouTube  : https://youtube.com/@rootmindtech                         *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10     *
 *  🔗  Telegram : https://t.me/TeamRedxhacker2                              *
 *                                                                           *
 *    © 2026 Abdul Rehman Rajpoot. All rights reserved.                      *
 *                                                                           *
 *****************************************************************************/

const axios = require('axios');

module.exports = {
    command: 'llama',
    aliases: [],
    category: 'ai',
    description: 'Ask a question to Llama AI',
    usage: '.llama <question>',

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '❌ Please provide a query.\n\nExample: .llama Explain quantum physics'
            }, { quoted: message });
        }

        try {
            await sock.sendMessage(chatId, { react: { text: '🦙', key: message.key } });

            const llamaAPIs = [
                `https://llama.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(query)}`,
                `https://api.giftedtech.my.id/api/ai/llama3?apikey=gifted&q=${encodeURIComponent(query)}`,
                `https://api.agatz.xyz/api/llama?message=${encodeURIComponent(query)}`
            ];

            let answer = '';
            for (const api of llamaAPIs) {
                try {
                    const { data } = await axios.get(api, { timeout: 10000 });
                    answer = data.data?.response || data.result || data.message || data.answer || data.response;
                    if (answer) break;
                } catch (e) { /* continue */ }
            }

            if (!answer) throw new Error('All Llama APIs failed');

            await sock.sendMessage(chatId, { text: answer }, { quoted: message });

        } catch (error) {
            console.error('Llama Command Error:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Failed to get Llama response. Please try again later.'
            }, { quoted: message });
        }
    }
};
