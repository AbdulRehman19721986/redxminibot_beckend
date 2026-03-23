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

function getCommandName(message) {
    const text = message.message?.conversation ||
                 message.message?.extendedTextMessage?.text ||
                 '';
    if (text.startsWith('.')) {
        return text.split(' ')[0].substring(1).toLowerCase();
    }
    return '';
}

module.exports = {
    command: 'ai',
    aliases: ['gpt', 'llama', 'mistral', 'gemini'],
    category: 'ai',
    description: 'Ask a question to various AI models',
    usage: '.gpt <question>  or  .gemini <question>  or  .llama <question>  etc.',

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `❌ Please provide a query.\n\nExample: .gpt Write a basic HTML page`
            }, { quoted: message });
        }

        const usedCommand = context.command || getCommandName(message);
        const model = usedCommand === 'gpt' || usedCommand === 'ai' ? 'gpt' :
                      usedCommand === 'gemini' ? 'gemini' :
                      usedCommand === 'llama' ? 'llama' :
                      usedCommand === 'mistral' ? 'mistral' : 'gpt';

        try {
            await sock.sendMessage(chatId, {
                react: { text: '🤖', key: message.key }
            });

            let answer = '';

            if (model === 'gemini') {
                const geminiAPIs = [
                    `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,
                    `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,
                    `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`,
                    `https://api.agatz.xyz/api/gemini?message=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(query)}`
                ];
                for (const api of geminiAPIs) {
                    try {
                        const { data } = await axios.get(api, { timeout: 10000 });
                        answer = data.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                                 data.answer || data.message || data.result || data.response ||
                                 (typeof data === 'string' ? data : null);
                        if (answer) break;
                    } catch (e) { /* ignore */ }
                }
            } else if (model === 'llama') {
                const llamaAPIs = [
                    `https://llama.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/llama3?apikey=gifted&q=${encodeURIComponent(query)}`,
                    `https://api.agatz.xyz/api/llama?message=${encodeURIComponent(query)}`
                ];
                for (const api of llamaAPIs) {
                    try {
                        const { data } = await axios.get(api, { timeout: 10000 });
                        answer = data.data?.response || data.result || data.message || data.answer || data.response;
                        if (answer) break;
                    } catch (e) { /* ignore */ }
                }
            } else if (model === 'mistral') {
                const mistralAPIs = [
                    `https://mistral.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/mistral?apikey=gifted&q=${encodeURIComponent(query)}`,
                    `https://api.agatz.xyz/api/mistral?message=${encodeURIComponent(query)}`
                ];
                for (const api of mistralAPIs) {
                    try {
                        const { data } = await axios.get(api, { timeout: 10000 });
                        answer = data.data?.response || data.result || data.message || data.answer || data.response;
                        if (answer) break;
                    } catch (e) { /* ignore */ }
                }
            } else { // gpt fallback
                const gptAPIs = [
                    `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`,
                    `https://api.agatz.xyz/api/gpt?message=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=${encodeURIComponent(query)}`
                ];
                for (const api of gptAPIs) {
                    try {
                        const { data } = await axios.get(api, { timeout: 10000 });
                        answer = data.result || data.message || data.data || data.answer ||
                                 data.response || (typeof data === 'string' ? data : null);
                        if (answer) break;
                    } catch (e) { /* ignore */ }
                }
            }

            if (!answer) throw new Error('All APIs failed');

            await sock.sendMessage(chatId, { text: answer }, { quoted: message });

        } catch (error) {
            console.error('AI Command Error:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Failed to get AI response. Please try again later.'
            }, { quoted: message });
        }
    }
};
