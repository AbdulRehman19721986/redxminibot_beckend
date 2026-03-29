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

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { writeFile } = require('fs/promises');

const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

module.exports = {
  command: 'stickerpack',
  aliases: ['spack', 'getstickers'],
  category: 'general',
  description: 'Extract all stickers from a sticker pack message.',
  usage: '.stickerpack (reply to a sticker pack message)',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted || !quoted.stickerPackMessage) {
        return await sock.sendMessage(chatId, {
          text: '❌ Please reply to a *sticker pack message*.'
        }, { quoted: message });
      }

      const pack = quoted.stickerPackMessage;
      const stickers = pack.stickers || [];

      if (stickers.length === 0) {
        return await sock.sendMessage(chatId, {
          text: '❌ No stickers found in this pack.'
        }, { quoted: message });
      }

      await sock.sendMessage(chatId, {
        text: `📦 Sticker pack: *${pack.name || 'Unnamed'}*\nPublisher: ${pack.publisher || 'Unknown'}\nExtracting ${stickers.length} sticker(s)...`
      });

      for (let i = 0; i < stickers.length; i++) {
        const sticker = stickers[i];
        // Construct a fake message object that downloadContentFromMessage can use
        const stickerMsg = {
          stickerMessage: {
            url: `https://mmg.whatsapp.net${sticker.directPath}`,
            directPath: sticker.directPath,
            mediaKey: sticker.mediaKey,
            mimetype: sticker.mimetype || 'image/webp',
            fileEncSha256: sticker.fileEncSha256,
            fileSha256: sticker.fileSha256,
            fileLength: sticker.fileLength,
          }
        };

        try {
          const stream = await downloadContentFromMessage(stickerMsg.stickerMessage, 'sticker');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }

          const fileName = `sticker_${i+1}_${Date.now()}.webp`;
          const filePath = path.join(TEMP_DIR, fileName);
          await writeFile(filePath, buffer);

          await sock.sendMessage(chatId, {
            sticker: { url: filePath },
            mimetype: 'image/webp'
          });

          // Clean up temp file
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Failed to download sticker ${i+1}:`, err);
          await sock.sendMessage(chatId, {
            text: `⚠️ Failed to download sticker ${i+1}.`
          });
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await sock.sendMessage(chatId, {
        text: '✅ All stickers extracted!'
      });

    } catch (error) {
      console.error('Error in stickerpack command:', error);
      await sock.sendMessage(chatId, {
        text: '❌ An error occurred while processing the sticker pack.'
      }, { quoted: message });
    }
  }
};
