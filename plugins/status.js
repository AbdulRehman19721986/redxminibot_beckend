/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *                                                                           *
 *****************************************************************************/

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    command: 'status',
    aliases: ['story', 'updatestatus'],
    category: 'owner',
    description: 'Post a status update (text/photo/video)',
    usage: '.status <text>  or  reply to an image/video with .status',
    ownerOnly: true,

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};

        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isImage = quotedMsg?.imageMessage;
        const isVideo = quotedMsg?.videoMessage;

        // ==================== TEXT STATUS ====================
        if (!isImage && !isVideo) {
            if (args.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Provide text or reply to an image/video.\n\nUsage:\n`.status Hello world!`\nor reply to an image/video with `.status`',
                    ...channelInfo
                }, { quoted: message });
            }

            const text = args.join(' ');
            try {
                console.log('[STATUS] Attempting to post text status...');
                // Method 1: standard sendMessage
                const sent = await sock.sendMessage('status@broadcast', { text });
                console.log('[STATUS] sendMessage result:', sent ? 'OK' : 'FAILED');

                // Confirm to user
                await sock.sendMessage(chatId, { 
                    text: '✅ Status posted!', 
                    ...channelInfo 
                }, { quoted: message });
            } catch (e) {
                console.error('[STATUS] Error posting text:', e);
                await sock.sendMessage(chatId, { 
                    text: `❌ Error: ${e.message}`, 
                    ...channelInfo 
                }, { quoted: message });
            }
            return;
        }

        // ==================== MEDIA STATUS ====================
        try {
            const mediaType = isImage ? 'image' : 'video';
            const msg = isImage ? quotedMsg.imageMessage : quotedMsg.videoMessage;

            console.log(`[STATUS] Downloading ${mediaType}...`);
            const stream = await downloadContentFromMessage(msg, mediaType);
            const buffer = [];
            for await (const chunk of stream) {
                buffer.push(chunk);
            }
            const mediaBuffer = Buffer.concat(buffer);
            console.log(`[STATUS] Downloaded ${mediaBuffer.length} bytes`);

            const statusContent = {};
            if (isImage) {
                statusContent.image = mediaBuffer;
            } else {
                statusContent.video = mediaBuffer;
            }
            if (msg.caption) statusContent.caption = msg.caption;

            console.log('[STATUS] Sending to status@broadcast...');
            const sent = await sock.sendMessage('status@broadcast', statusContent);
            console.log('[STATUS] sendMessage result:', sent ? 'OK' : 'FAILED');

            await sock.sendMessage(chatId, { 
                text: '✅ Status posted successfully!', 
                ...channelInfo 
            }, { quoted: message });
        } catch (e) {
            console.error('[STATUS] Error posting media:', e);
            await sock.sendMessage(chatId, { 
                text: `❌ Failed to post status: ${e.message}`, 
                ...channelInfo 
            }, { quoted: message });
        }
    }
};
