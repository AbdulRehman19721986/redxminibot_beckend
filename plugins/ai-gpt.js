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
    command: 'gpt',
    aliases: ['ai', 'chat'],
    category: 'ai',
    description: 'Ask a question to GPT AI',
    usage: '.gpt <question>',

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '❌ Please provide a query.\n\nExample: .gpt Write a basic HTML page'
            }, { quoted: message });
        }

        try {
            await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });

            const gptAPIs = [
                `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`,
                `https://api.agatz.xyz/api/gpt?message=${encodeURIComponent(query)}`,
                `https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=${encodeURIComponent(query)}`
            ];

            let answer = '';
            for (const api of gptAPIs) {
                try {
                    const { data } = await axios.get(api, { timeout: 10000 });
                    answer = data.result || data.message || data.data || data.answer ||
                             data.response || (typeof data === 'string' ? data : null);
                    if (answer) break;
                } catch (e) { /* continue */ }
            }

            if (!answer) throw new Error('All GPT APIs failed');

            await sock.sendMessage(chatId, { text: answer }, { quoted: message });

        } catch (error) {
            console.error('GPT Command Error:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Failed to get GPT response. Please try again later.'
            }, { quoted: message });
        }
    }
};
