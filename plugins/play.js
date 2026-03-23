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

const yts = require('yt-search');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { fromBuffer } = require('file-type');

const execAsync = promisify(exec);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Download YouTube video/audio using ytdown.to proxy
 * @param {string} url - YouTube video URL
 * @param {string} type - 'video' or 'audio'
 * @returns {Promise<{info: object, download: string}>}
 */
async function ytdown(url, type = 'audio') {
	const { data } = await axios.post('https://app.ytdown.to/proxy.php',
		new URLSearchParams({ url }),
		{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
	);

	const api = data.api;
	if (api?.status == 'ERROR') throw new Error(api.message);

	const media = api?.mediaItems?.find(m => m.type.toLowerCase() === type.toLowerCase());
	if (!media) throw new Error('Media type not found');

	while (true) {
		const { data: res } = await axios.get(media.mediaUrl);

		if (res?.error === 'METADATA_NOT_FOUND') throw new Error('Metadata not found');

		if (res?.percent === 'Completed' && res?.fileUrl !== 'In Processing...') {
			return {
				info: {
					title: api.title,
					desc: api.description,
					thumbnail: api.imagePreviewUrl,
					views: api.mediaStats?.viewsCount,
					uploader: api.userInfo?.name,
					quality: media.mediaQuality,
					duration: media.mediaDuration,
					extension: media.mediaExtension,
					size: media.mediaFileSize,
				},
				download: res.fileUrl,
			};
		}

		await delay(5000);
	}
}

/**
 * Convert any audio to MP3 using ffmpeg (ultrafast preset)
 */
async function convertToMp3(inputBuffer, inputExt) {
	const tempDir = path.join(process.cwd(), 'temp');
	if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

	const id = Date.now();
	const inputPath = path.join(tempDir, `play_in_${id}.${inputExt}`);
	const outputPath = path.join(tempDir, `play_out_${id}.mp3`);

	fs.writeFileSync(inputPath, inputBuffer);

	await execAsync(`ffmpeg -i "${inputPath}" -codec:a libmp3lame -b:a 128k -preset ultrafast "${outputPath}"`, { timeout: 60000 });

	const outputBuffer = fs.readFileSync(outputPath);

	try { fs.unlinkSync(inputPath); } catch {}
	try { fs.unlinkSync(outputPath); } catch {}

	return outputBuffer;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
	return num?.toLocaleString() || 'N/A';
}

module.exports = {
	command: 'play',
	aliases: ['song', 'mp3'],
	category: 'music',
	description: 'Stream audio from YouTube',
	usage: '.play <song name>',

	async handler(sock, message, args, context) {
		const chatId = context.chatId || message.key.remoteJid;
		const channelInfo = context.channelInfo || {};
		const query = args.join(' ');

		if (!query) {
			return await sock.sendMessage(chatId, {
				text: '❌ Please provide a song name!\nExample: .play Moye Moye',
				...channelInfo
			}, { quoted: message });
		}

		try {
			// React with 🎵 to indicate processing
			await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });

			// Search YouTube
			const searchResult = await yts(query);
			const video = searchResult.videos[0];

			if (!video) {
				await sock.sendMessage(chatId, {
					text: '❌ No results found for your query.',
					...channelInfo
				}, { quoted: message });
				return;
			}

			// Build thumbnail caption
			const views = formatNumber(video.views);
			const uploaded = video.uploadDate ? new Date(video.uploadDate).toLocaleDateString() : 'Unknown';
			const duration = video.timestamp || 'N/A';
			const caption = `╔══════════════════╗\n` +
				`║  *🎵 YOUTUBE AUDIO*  ║\n` +
				`╚══════════════════╝\n\n` +
				`📌 *Title:* ${video.title}\n` +
				`👤 *Channel:* ${video.author.name}\n` +
				`⏱️ *Duration:* ${duration}\n` +
				`👀 *Views:* ${views}\n` +
				`📅 *Uploaded:* ${uploaded}\n` +
				`🔗 *URL:* ${video.url}\n\n` +
				`⬇️ *Downloading audio...*`;

			// Send thumbnail with details
			await sock.sendMessage(chatId, {
				image: { url: video.thumbnail },
				caption: caption,
				...channelInfo
			}, { quoted: message });

			// Get download link using ytdown
			const result = await ytdown(video.url, 'audio');
			const downloadUrl = result.download;
			const title = result.info.title.replace(/[^\w\s]/gi, '').substring(0, 100);

			// Download the file to buffer
			const audioRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 60000 });
			let audioBuffer = Buffer.from(audioRes.data);

			// Detect file type
			const fileType = await fromBuffer(audioBuffer);
			let finalBuffer = audioBuffer;
			let ext = fileType?.ext || 'bin';

			// If not MP3, convert silently
			if (!fileType || fileType.mime !== 'audio/mpeg') {
				finalBuffer = await convertToMp3(audioBuffer, ext);
			}

			// Send as WhatsApp audio
			await sock.sendMessage(chatId, {
				audio: finalBuffer,
				mimetype: 'audio/mpeg',
				fileName: `${title}.mp3`,
				// ptt: false, // set to true for voice note style
				...channelInfo
			}, { quoted: message });

		} catch (error) {
			console.error('Play command error:', error);
			await sock.sendMessage(chatId, {
				text: `❌ *Error:* ${error.message}`,
				...channelInfo
			}, { quoted: message });
		}
	}
};
