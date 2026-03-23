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
    command: 'aify',
    aliases: ['polish', 'rewrite', 'grammar'],
    category: 'ai',
    description: 'Improve or rewrite text using AI',
    usage: '.aify <text>',

    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const input = args.join(' ') || quotedText;

        if (!input) {
            await sock.sendMessage(chatId, {
                text: `✍️ *AI TEXT POLISHER*\n\n` +
                      `*Usage:* \`.aify <text>\` or reply to a message\n` +
                      `*Example:* \`.aify i am a student who want to improve my writing\``,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: '✍️', key: message.key }
            });

            const apis = [
                `https://api.agatz.xyz/api/gpt?message=Improve%20this%20text%20(make%20it%20better%2C%20fix%20grammar%2C%20and%20more%20professional)%3A%20${encodeURIComponent(input)}`,
                `https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=Polish%20this%20text%20(grammar%20and%20style)%3A%20${encodeURIComponent(input)}`
            ];

            let result = '';
            for (const api of apis) {
                try {
                    const { data } = await axios.get(api, { timeout: 15000 });
                    result = data.result || data.message || data.data || data.answer || data.response;
                    if (result) break;
                } catch (e) { /* ignore */ }
            }

            if (!result) throw new Error('No API response');

            await sock.sendMessage(chatId, {
                text: `*📝 Polished Text:*\n\n${result}`,
                ...channelInfo
            }, { quoted: message });

        } catch (error) {
            console.error('[AIFY] Error:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Failed to polish text. Try again later.',
                ...channelInfo
            }, { quoted: message });
        }
    }
};
