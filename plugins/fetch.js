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
const { fromBuffer } = require('file-type');

const MAX_TEXT_LENGTH = 60000; // WhatsApp max message length

/**
 * Pretty‑print JSON with syntax highlighting using ANSI codes.
 * Falls back to plain JSON if highlight fails.
 */
function formatJSON(json) {
	try {
		const obj = typeof json === 'string' ? JSON.parse(json) : json;
		const pretty = JSON.stringify(obj, null, 2);

		// Simple ANSI colouring for keys and values (optional)
		return pretty.replace(/"([^"]+)":/g, '\x1b[36m$1\x1b[0m:') // cyan keys
			.replace(/: (\d+)/g, ': \x1b[33m$1\x1b[0m')            // yellow numbers
			.replace(/: "(.*?)"/g, ': \x1b[32m"$1"\x1b[0m');       // green strings
	} catch {
		return String(json);
	}
}

module.exports = {
	command: 'fetch',
	aliases: ['get', 'download', 'json'],
	category: 'tools',
	description: 'Fetch any URL and send content (binary or formatted JSON)',
	usage: '.fetch <url>',

	async handler(sock, message, args, context) {
		const chatId = context.chatId || message.key.remoteJid;
		const channelInfo = context.channelInfo || {};
		const url = args[0];

		if (!url || !url.startsWith('http')) {
			return await sock.sendMessage(chatId, {
				text: '❌ Provide a valid URL starting with http/https.',
				...channelInfo
			}, { quoted: message });
		}

		try {
			await sock.sendMessage(chatId, {
				text: '📡 Fetching data...',
				...channelInfo
			}, { quoted: message });

			const res = await axios.get(url, {
				responseType: 'arraybuffer',
				timeout: 30000,
				validateStatus: () => true // don't throw on any status
			});

			const buffer = Buffer.from(res.data);
			const contentType = res.headers['content-type'] || '';

			// ---- JSON handling ----
			if (contentType.includes('application/json') || url.endsWith('.json')) {
				let jsonText;
				try {
					// Try to parse and pretty‑print
					const obj = JSON.parse(buffer.toString('utf-8'));
					jsonText = JSON.stringify(obj, null, 2);
				} catch {
					// If parsing fails, send raw text
					jsonText = buffer.toString('utf-8').slice(0, MAX_TEXT_LENGTH);
				}

				if (jsonText.length > MAX_TEXT_LENGTH) {
					// Send as file if too long
					return await sock.sendMessage(chatId, {
						document: Buffer.from(jsonText),
						mimetype: 'application/json',
						fileName: 'response.json',
						caption: '📄 JSON response (sent as file due to length)',
						...channelInfo
					}, { quoted: message });
				} else {
					// Send as formatted text (monospace recommended)
					return await sock.sendMessage(chatId, {
						text: `\`\`\`json\n${jsonText}\n\`\`\``,
						...channelInfo
					}, { quoted: message });
				}
			}

			// ---- Binary file handling ----
			const type = await fromBuffer(buffer);
			if (!type) {
				// Unknown type – send as text up to limit
				const text = buffer.toString('utf-8').slice(0, MAX_TEXT_LENGTH);
				return await sock.sendMessage(chatId, {
					text: text || 'Empty response',
					...channelInfo
				}, { quoted: message });
			}

			// Send according to mime type
			if (type.mime.startsWith('image/')) {
				await sock.sendMessage(chatId, { image: buffer, ...channelInfo }, { quoted: message });
			} else if (type.mime.startsWith('video/')) {
				await sock.sendMessage(chatId, { video: buffer, ...channelInfo }, { quoted: message });
			} else if (type.mime.startsWith('audio/')) {
				await sock.sendMessage(chatId, { audio: buffer, mimetype: type.mime, ...channelInfo }, { quoted: message });
			} else {
				await sock.sendMessage(chatId, {
					document: buffer,
					mimetype: type.mime,
					fileName: `file.${type.ext}`,
					...channelInfo
				}, { quoted: message });
			}

		} catch (err) {
			console.error('[FETCH] Error:', err.message);
			await sock.sendMessage(chatId, {
				text: '❌ Failed to fetch. URL might be private, invalid, or unreachable.',
				...channelInfo
			}, { quoted: message });
		}
	}
};
