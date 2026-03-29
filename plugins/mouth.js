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
  command: 'mouth',
  aliases: ['oral', 'blowjob', 'bj'],
  category: 'fun',
  description: '👄 Mouth action with wet emojis',
  usage: '.mouth',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;

    try {
      const initialMsg = await sock.sendMessage(chatId, {
        text: '👄',
        ...channelInfo
      }, { quoted: message });

      const sequence = [
        "👄", "👅", "🍆👄", "💦👅", "😮",
        "👄💦", "🍆💦👄", "😝", "🥵👄", "💦💦👅",
        "🍆👅💦", "😫👄", "🔥👄", "💢👅", "👄🍑"
      ];

      for (const line of sequence) {
        await delay(600);
        await sock.relayMessage(
          chatId,
          {
            protocolMessage: {
              key: initialMsg.key,
              type: 14,
              editedMessage: { conversation: line }
            }
          },
          {}
        );
      }
    } catch (error) {
      console.error('Mouth command error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};
