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
    command: 'summarize',
    aliases: ['summary', 'tl;dr'],
    category: 'ai',
    description: 'Summarize a long text',
    usage: '.summarize <text> or reply to a message',

    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const input = args.join(' ') || quotedText;

        if (!input) {
            await sock.sendMessage(chatId, {
                text: `📝 *AI SUMMARIZER*\n\n` +
                      `*Usage:* \`.summarize <text>\` or reply to a message\n` +
                      `*Example:* \`.summarize This is a very long article about...\``,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: '📝', key: message.key }
            });

            const apis = [
                `https://api.agatz.xyz/api/gpt?message=Summarize%20this%20text%20in%20a%20concise%20way%3A%20${encodeURIComponent(input)}`,
                `https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=Give%20a%20short%20summary%20of%20this%3A%20${encodeURIComponent(input)}`
            ];

            let summary = '';
            for (const api of apis) {
                try {
                    const { data } = await axios.get(api, { timeout: 15000 });
                    summary = data.result || data.message || data.data || data.answer || data.response;
                    if (summary) break;
                } catch (e) { /* ignore */ }
            }

            if (!summary) throw new Error('No API response');

            await sock.sendMessage(chatId, {
                text: `*📝 Summary:*\n\n${summary}`,
                ...channelInfo
            }, { quoted: message });

        } catch (error) {
            console.error('[SUMMARIZE] Error:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Failed to summarize. Try again later.',
                ...channelInfo
            }, { quoted: message });
        }
    }
};
