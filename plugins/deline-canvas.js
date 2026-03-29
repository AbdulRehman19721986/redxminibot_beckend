/*****************************************************************************
 *  REDX BOT — Deline API: Canvas / Maker commands
 *  .attp, .ttp, .brat, .bratvid, .levelup, .welcomecard, .fakestory, .faketweet
 *****************************************************************************/
const axios = require('axios');
const API = 'https://api.deline.web.id';

async function delineGet(endpoint, params = {}) {
    const url = new URL(API + endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const { data } = await axios.get(url.toString(), { responseType: 'arraybuffer', timeout: 30000 });
    return Buffer.from(data);
}
async function delineGetJSON(endpoint, params = {}) {
    const url = new URL(API + endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const { data } = await axios.get(url.toString(), { timeout: 30000 });
    return data;
}

module.exports = [
    {
        command: 'attp',
        aliases: ['animattp'],
        category: 'stickers',
        description: 'Generate animated ATTP sticker',
        usage: '.attp <text>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const text = args.join(' ');
            if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: `.attp <text>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '✨', key: message.key } });
            try {
                const buf = await delineGet('/maker/attp', { text });
                await sock.sendMessage(chatId, { sticker: buf }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'ttp',
        aliases: ['textpic'],
        category: 'stickers',
        description: 'Generate TTP sticker',
        usage: '.ttp <text> [color]',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const color = args[args.length - 1]?.match(/^(red|blue|green|yellow|black|white|purple|gold|silver|cyan|orange)$/) ? args.pop() : 'white';
            const text = args.join(' ');
            if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: `.ttp <text> [color]`\n\nColors: red, blue, green, yellow, black, white, purple, gold, silver, cyan, orange' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '✨', key: message.key } });
            try {
                const buf = await delineGet('/maker/ttp', { text, color });
                await sock.sendMessage(chatId, { sticker: buf }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'brat',
        aliases: ['bratimg'],
        category: 'maker',
        description: 'Generate a brat image',
        usage: '.brat <text>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const text = args.join(' ');
            if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: `.brat <text>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });
            try {
                const buf = await delineGet('/maker/brat', { text });
                await sock.sendMessage(chatId, { image: buf, caption: text }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'bratvid',
        aliases: ['bratv', 'bratvideo'],
        category: 'maker',
        description: 'Generate a brat video',
        usage: '.bratvid <text>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const text = args.join(' ');
            if (!text) return sock.sendMessage(chatId, { text: '❌ Usage: `.bratvid <text>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '🎬', key: message.key } });
            try {
                const buf = await delineGet('/maker/bratvid', { text });
                await sock.sendMessage(chatId, { video: buf, mimetype: 'video/mp4', caption: text }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'levelup',
        aliases: ['lvlup'],
        category: 'maker',
        description: 'Generate a level-up card',
        usage: '.levelup <name> <from> <to>  (reply to image for avatar)',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const name = args[0] || 'Player';
            const fromLevel = args[1] || '1';
            const toLevel = args[2] || '2';
            await sock.sendMessage(chatId, { react: { text: '⬆️', key: message.key } });
            try {
                // Use sender's profile pic as avatar
                const senderId = message.key.participant || message.key.remoteJid;
                let avatarURL = `https://api.deline.web.id/4w9O3SzQWY.jpg`;
                try {
                    avatarURL = await sock.profilePictureUrl(senderId, 'image') || avatarURL;
                } catch {}
                const backgroundURL = avatarURL;
                const buf = await delineGet('/canvas/levelup', { backgroundURL, avatarURL, fromLevel, toLevel, name });
                await sock.sendMessage(chatId, { image: buf, caption: `🎮 *${name}* leveled up!\n${fromLevel} → ${toLevel}` }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'welcomecard',
        aliases: ['welcomeimg'],
        category: 'maker',
        description: 'Generate welcome card',
        usage: '.welcomecard <username> <group name>  (admin use)',
        adminOnly: true,
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const username = args[0] || 'User';
            const guildName = args.slice(1).join(' ') || 'REDX Group';
            await sock.sendMessage(chatId, { react: { text: '👋', key: message.key } });
            try {
                let avatar = `https://api.deline.web.id/4w9O3SzQWY.jpg`;
                let background = avatar;
                const quotedSender = message.message?.extendedTextMessage?.contextInfo?.participant;
                if (quotedSender) {
                    try { avatar = await sock.profilePictureUrl(quotedSender, 'image') || avatar; } catch {}
                }
                try {
                    if (chatId.endsWith('@g.us')) background = await sock.profilePictureUrl(chatId, 'image') || background;
                } catch {}
                const { rows } = await sock.groupMetadata(chatId).catch(() => ({ participants: [] }));
                const memberCount = rows?.length || 0;
                const buf = await delineGet('/canvas/welcome', {
                    username, guildName, memberCount: String(memberCount || 1),
                    avatar, background, quality: '90'
                });
                await sock.sendMessage(chatId, { image: buf, caption: `👋 Welcome *${username}* to *${guildName}*!` }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'faketweet',
        aliases: ['faketw', 'tweetfake'],
        category: 'maker',
        description: 'Generate a fake tweet',
        usage: '.faketweet <username>|<text>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const full = args.join(' ');
            const [username, ...rest] = full.split('|');
            const tweet = rest.join('|').trim() || username;
            const name = rest.length ? username.trim() : 'REDX User';
            if (!tweet) return sock.sendMessage(chatId, { text: '❌ Usage: `.faketweet <username>|<tweet text>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '🐦', key: message.key } });
            try {
                const buf = await delineGet('/maker/faketweet', { username: name, display_name: name, tweet });
                await sock.sendMessage(chatId, { image: buf, caption: '🐦 Fake Tweet' }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    }
];
