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

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

module.exports = {
    command: 'speedtest',
    aliases: ['speed', 'netspeed'],
    category: 'utility',
    description: 'Test internet speed of the server',
    usage: '.speedtest',
    ownerOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};

        await sock.sendMessage(chatId, {
            text: '🔄 *Testing internet speed...*\n\nPlease wait, this may take a moment.',
            ...channelInfo
        }, { quoted: message });

        try {
            const { stdout, stderr } = await execAsync('python3 lib/speed.py', { timeout: 120000 });
            const result = (stdout || stderr || '').trim();

            if (!result) {
                return await sock.sendMessage(chatId, {
                    text: '❌ No output from speed test.',
                    ...channelInfo
                }, { quoted: message });
            }

            await sock.sendMessage(chatId, { text: result, ...channelInfo }, { quoted: message });

        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ Speed test failed: ${error.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
