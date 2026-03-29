/*****************************************************************************
 *  REDX BOT — Deline API: AI Commands
 *  .ai, .think, .openai, .nsfwcheck, .toprompt
 *****************************************************************************/
const axios = require('axios');
const API = 'https://api.deline.web.id';

async function delineGet(endpoint, params = {}) {
    const url = new URL(API + endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const { data } = await axios.get(url.toString(), { timeout: 30000 });
    return data;
}

module.exports = [
    {
        command: 'ai',
        aliases: ['copilot', 'gpt4'],
        category: 'ai',
        description: 'Ask Copilot AI anything',
        usage: '.ai <question>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const text = args.join(' ');
            if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: `.ai <question>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '🤔', key: message.key } });
            try {
                const data = await delineGet('/ai/copilot', { text });
                if (!data.status) throw new Error(data.error || 'No response');
                await sock.sendMessage(chatId, { text: `🤖 *REDX AI*\n\n${data.result}` }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ AI Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'think',
        aliases: ['copilotthink', 'deepthink'],
        category: 'ai',
        description: 'Copilot with deep reasoning mode',
        usage: '.think <question>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const text = args.join(' ');
            if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: `.think <question>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '💭', key: message.key } });
            try {
                const data = await delineGet('/ai/copilot-think', { text });
                if (!data.status) throw new Error(data.error || 'No response');
                const res = data.result;
                let reply = `💭 *REDX DEEP THINK*\n\n${res.text || res}`;
                if (res.citations?.length) reply += `\n\n📚 *Sources:* ${res.citations.join(', ')}`;
                await sock.sendMessage(chatId, { text: reply }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'nsfwcheck',
        aliases: ['nsfwscan', 'checksafe'],
        category: 'tools',
        description: 'Check if an image contains NSFW content (reply to image)',
        usage: '.nsfwcheck (reply to image)',
        ownerOnly: true,
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imgUrl = args[0] || null;
            if (!quoted?.imageMessage && !imgUrl) {
                return sock.sendMessage(chatId, { text: '❌ Reply to an image or provide URL.\nUsage: `.nsfwcheck <url>` or reply to image' }, { quoted: message });
            }
            await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });
            try {
                let url = imgUrl;
                if (!url && quoted?.imageMessage) {
                    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                    const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
                    let buf = Buffer.from([]);
                    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
                    const { uploadToCatbox } = require('../lib/uploader');
                    url = await uploadToCatbox(buf, 'image.jpg', 'image/jpeg');
                }
                const data = await delineGet('/ai/nsfwcheck', { url });
                if (!data.status) throw new Error(data.error || 'Check failed');
                const r = data.result;
                const isSafe = r.labelName?.toLowerCase().includes('not') || r.confidence > 0.7;
                await sock.sendMessage(chatId, {
                    text: `🔍 *NSFW CHECK RESULT*\n\n` +
                        `*Label:* ${r.labelName}\n` +
                        `*Confidence:* ${(r.confidence * 100).toFixed(1)}%\n` +
                        `*Safe:* ${isSafe ? '✅ Yes' : '❌ No'}`
                }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'toprompt',
        aliases: ['img2prompt', 'imageprompt'],
        category: 'ai',
        description: 'Extract AI prompt from an image (owner/sudo only)',
        usage: '.toprompt (reply to image)',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imgUrl = args[0] || null;
            if (!quoted?.imageMessage && !imgUrl) {
                return sock.sendMessage(chatId, { text: '❌ Reply to an image or provide URL.' }, { quoted: message });
            }
            await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });
            try {
                let url = imgUrl;
                if (!url && quoted?.imageMessage) {
                    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                    const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
                    let buf = Buffer.from([]);
                    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
                    const { uploadToCatbox } = require('../lib/uploader');
                    url = await uploadToCatbox(buf, 'image.jpg', 'image/jpeg');
                }
                const data = await delineGet('/ai/toprompt', { url });
                if (!data.status) throw new Error(data.error || 'Failed');
                const r = data.result;
                await sock.sendMessage(chatId, {
                    text: `🎨 *IMAGE TO PROMPT*\n\n*Original:*\n${r.original}\n\n*Translated:*\n${r.translated || 'N/A'}`
                }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    }
];
