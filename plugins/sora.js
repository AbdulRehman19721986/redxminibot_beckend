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
const fs = require('fs');
const path = require('path');
const { fromBuffer } = require('file-type');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// List of free video generation APIs
const VIDEO_APIS = [
    { url: 'https://okatsu-rolezapiiz.vercel.app/ai/txt2video', param: 'text' },
    { url: 'https://api.agaxt.dev/ai/text2video', param: 'text' },
    { url: 'https://api.neoxr.eu/api/text2video', param: 'text' },
    { url: 'https://api.ryzendesu.vip/api/ai/text2video', param: 'text' },
    { url: 'https://api.giftedtech.my.id/api/ai/text2video', param: 'q', apikey: 'gifted' }
];

/**
 * Convert any video to MP4 using ffmpeg
 */
async function convertToMp4(inputBuffer, inputExt) {
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const id = Date.now();
    const inputPath = path.join(tempDir, `sora_in_${id}.${inputExt}`);
    const outputPath = path.join(tempDir, `sora_out_${id}.mp4`);

    fs.writeFileSync(inputPath, inputBuffer);

    try {
        await execAsync(`ffmpeg -i "${inputPath}" -c:v libx264 -preset ultrafast -c:a aac "${outputPath}"`, { timeout: 60000 });
        const outputBuffer = fs.readFileSync(outputPath);
        return outputBuffer;
    } finally {
        // Cleanup
        try { fs.unlinkSync(inputPath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
    }
}

module.exports = {
    command: 'sora',
    aliases: ['txt2video', 'aivideo', 'text2video'],
    category: 'ai',
    description: 'Generate AI video from text prompt',
    usage: '.sora <prompt>',

    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;

        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
            const prompt = args.join(' ') || quotedText;

            if (!prompt) {
                await sock.sendMessage(chatId, {
                    text: `🎬 *SORA AI VIDEO GENERATOR*\n\n` +
                          `*Usage:* \`.sora <prompt>\`\n` +
                          `*Example:* \`.sora A cat playing in a garden\``,
                    ...channelInfo
                }, { quoted: message });
                return;
            }

            const statusMsg = await sock.sendMessage(chatId, {
                text: `🎬 Generating video for:\n"${prompt}"\n\n⏳ This may take 60-90 seconds...`,
                ...channelInfo
            }, { quoted: message });

            let videoBuffer = null;
            let lastError = null;

            // Try each API
            for (const api of VIDEO_APIS) {
                try {
                    let url;
                    if (api.apikey) {
                        url = `${api.url}?${api.param}=${encodeURIComponent(prompt)}&apikey=${api.apikey}`;
                    } else {
                        url = `${api.url}?${api.param}=${encodeURIComponent(prompt)}`;
                    }

                    const response = await axios.get(url, {
                        timeout: 45000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });

                    const data = response.data;
                    let videoUrl = data?.videoUrl || data?.result || data?.data?.videoUrl ||
                                   data?.url || data?.video || data?.download || data?.link;

                    if (videoUrl) {
                        // Download video
                        const videoRes = await axios.get(videoUrl, {
                            responseType: 'arraybuffer',
                            timeout: 60000
                        });
                        videoBuffer = Buffer.from(videoRes.data);
                        break;
                    }
                } catch (e) {
                    lastError = e;
                    console.log(`[SORA] API ${api.url} failed: ${e.message}`);
                }
            }

            if (!videoBuffer) {
                throw new Error(lastError?.message || 'All video APIs failed');
            }

            // Check video type and convert if needed
            const type = await fromBuffer(videoBuffer);
            let finalBuffer = videoBuffer;
            let mimetype = type?.mime || 'video/mp4';

            // If not MP4, try to convert
            if (!type || type.mime !== 'video/mp4') {
                await sock.sendMessage(chatId, {
                    text: '🔄 Converting video to MP4...',
                    edit: statusMsg.key
                }, { quoted: message });

                finalBuffer = await convertToMp4(videoBuffer, type?.ext || 'bin');
                mimetype = 'video/mp4';
            }

            // Send video
            await sock.sendMessage(chatId, {
                video: finalBuffer,
                mimetype: mimetype,
                caption: `🎬 *Generated Video*\n\nPrompt: ${prompt}`,
                ...channelInfo
            }, { quoted: message });

            // Clean up status
            await sock.sendMessage(chatId, { delete: statusMsg.key });

        } catch (error) {
            console.error('[SORA] Error:', error.message);
            await sock.sendMessage(chatId, {
                text: `❌ Failed to generate video.\nReason: ${error.message}\n\nTry a different prompt or try again later.`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
