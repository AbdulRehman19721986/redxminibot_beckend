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

// Free DeepSeek API endpoints (multiple fallbacks)
const API_ENDPOINTS = [
  'https://api.yanzbotz.live/api/ai/deepseek',
  'https://api.guruapi.tech/api/deepseek',
  'https://api.nexoracle.com/ai/deepseek'
];

module.exports = {
  command: 'deepseek',
  aliases: ['ds', 'deep', 'seek'],
  category: 'misc',
  description: '🧠 Chat with DeepSeek AI – free, intelligent responses',
  usage: '.deepseek <question>\nExample: .deepseek what is the meaning of life?',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;

    try {
      // Get prompt from quoted message or arguments
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
      const prompt = args.join(' ') || quotedText;

      if (!prompt) {
        return await sock.sendMessage(chatId, {
          text: '🧠 *DEEPSEEK AI*\n\n' +
                '*Usage:* `.deepseek <question>`\n' +
                '*Example:* `.deepseek tell me a joke`\n\n' +
                'You can also reply to a message containing the question.',
          ...channelInfo
        }, { quoted: message });
      }

      // Send typing indicator
      await sock.sendPresenceUpdate('composing', chatId);

      let responseText = null;
      let lastError = null;

      // Try each endpoint until success
      for (const endpoint of API_ENDPOINTS) {
        try {
          const url = `${endpoint}?${endpoint.includes('nexoracle') ? 'q' : 'query'}=${encodeURIComponent(prompt)}`;
          const res = await axios.get(url, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });

          // Extract response from various structures
          const data = res.data;
          responseText = data?.result || data?.response || data?.message || data?.text || data?.data?.result;

          if (responseText) break;
        } catch (e) {
          lastError = e;
        }
      }

      if (!responseText) {
        throw new Error(lastError?.message || 'All DeepSeek APIs failed');
      }

      await sock.sendMessage(chatId, {
        text: `🧠 *DeepSeek AI*\n\n${responseText}`,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error('[DEEPSEEK] Error:', error.message);
      await sock.sendMessage(chatId, {
        text: `❌ DeepSeek AI error: ${error.message}\n\nPlease try again later.`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};
