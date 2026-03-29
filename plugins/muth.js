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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    command: 'muth',
    aliases: ['handjob', 'hand'],
    category: 'fun',
    description: '✊ Explicit hand action emoji sequence',
    usage: '.muth',

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};

        try {
            const initialMsg = await sock.sendMessage(chatId, {
                text: '✊',
                ...channelInfo
            });

            const sequence = [
                "✊", "👊", "✊🍆", "👊🍆", "💦",
                "✊💦", "👊💦", "😩", "💦💦", "🔥"
            ];

            for (const line of sequence) {
                await delay(800);
                await sock.relayMessage(
                    chatId,
                    {
                        protocolMessage: {
                            key: initialMsg.key,
                            type: 14,
                            editedMessage: {
                                conversation: line,
                            },
                        },
                    },
                    {}
                );
            }
        } catch (error) {
            console.error('muth command error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Error: ${error.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
