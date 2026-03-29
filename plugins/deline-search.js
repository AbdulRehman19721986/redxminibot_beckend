/*****************************************************************************
 *  REDX BOT — Deline API: Search Tools
 *  .whasearch, .happymod, .npminfo, .jobstreet, .spotifysearch, .pisearch
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
        command: 'groupsearch',
        aliases: ['whasearch', 'findgroup', 'groupfind'],
        category: 'search',
        description: 'Search for public WhatsApp group links',
        usage: '.groupsearch <keyword>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const q = args.join(' ');
            if (!q) return sock.sendMessage(chatId, { text: '❌ Usage: `.groupsearch <keyword>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });
            try {
                const data = await delineGet('/search/grubwa', { q });
                if (!data.status || !data.result?.length) throw new Error('No groups found');
                let text = `🔍 *WhatsApp Groups: "${q}"*\n*Found: ${data.total || data.result.length}*\n\n`;
                data.result.slice(0, 8).forEach((g, i) => {
                    text += `*${i + 1}.* ${g.Name}\n`;
                    text += `   📝 ${g.Description?.substring(0, 60) || 'No description'}...\n`;
                    text += `   🔗 ${g.Link}\n\n`;
                });
                await sock.sendMessage(chatId, { text }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'happymod',
        aliases: ['hmod', 'modapk'],
        category: 'search',
        description: 'Search HappyMod for modded APKs',
        usage: '.happymod <app name>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const q = args.join(' ');
            if (!q) return sock.sendMessage(chatId, { text: '❌ Usage: `.happymod <app name>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });
            try {
                const data = await delineGet('/search/happymod', { q });
                if (!data.status || !data.result?.length) throw new Error('No results');
                let text = `📲 *HappyMod: "${q}"*\n\n`;
                data.result.slice(0, 5).forEach((a, i) => {
                    text += `*${i + 1}.* ${a.title}\n`;
                    text += `   📦 ${a.package}\n`;
                    text += `   🏷️ v${a.version} | ${a.size}\n`;
                    text += `   ✨ ${a.modInfo}\n`;
                    text += `   🔗 ${a.page_dl}\n\n`;
                });
                await sock.sendMessage(chatId, { text }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'npminfo',
        aliases: ['npmfind', 'npmpackage'],
        category: 'search',
        description: 'Search NPM packages',
        usage: '.npminfo <package>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const q = args.join(' ');
            if (!q) return sock.sendMessage(chatId, { text: '❌ Usage: `.npminfo <package name>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '📦', key: message.key } });
            try {
                const data = await delineGet('/search/npm', { q });
                if (!data.status || !data.result?.length) throw new Error('No packages found');
                let text = `📦 *NPM Packages: "${q}"*\n\n`;
                data.result.slice(0, 5).forEach((p, i) => {
                    text += `*${i + 1}.* \`${p.name}\`\n`;
                    if (p.description) text += `   📝 ${p.description.substring(0, 80)}\n`;
                    text += `   🏷️ v${p.version}\n`;
                    if (p.links?.npm) text += `   🔗 ${p.links.npm}\n`;
                    text += '\n';
                });
                await sock.sendMessage(chatId, { text }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'spotifyfind',
        aliases: ['spotsearch', 'searchspot'],
        category: 'search',
        description: 'Search songs on Spotify',
        usage: '.spotifyfind <song name>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const q = args.join(' ');
            if (!q) return sock.sendMessage(chatId, { text: '❌ Usage: `.spotifyfind <song name>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });
            try {
                const data = await delineGet('/search/spotify', { q });
                if (!data.status || !data.result?.length) throw new Error('No results');
                let text = `🎵 *Spotify Search: "${q}"*\n\n`;
                data.result.slice(0, 5).forEach((s, i) => {
                    text += `*${i + 1}.* ${s.title || s.name}\n`;
                    text += `   👤 ${s.artist || s.artists?.join(', ')}\n`;
                    text += `   💿 ${s.album || ''}\n`;
                    if (s.url) text += `   🔗 ${s.url}\n`;
                    text += '\n';
                });
                await sock.sendMessage(chatId, { text }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    },
    {
        command: 'ttsearch',
        aliases: ['tiktoksearch', 'searchtt'],
        category: 'search',
        description: 'Search TikTok videos by keyword',
        usage: '.ttsearch <keyword>',
        async handler(sock, message, args, context = {}) {
            const chatId = context.chatId || message.key.remoteJid;
            const q = args.join(' ');
            if (!q) return sock.sendMessage(chatId, { text: '❌ Usage: `.ttsearch <keyword>`' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });
            try {
                const data = await delineGet('/search/tiktok', { q });
                if (!data.status || !data.result) throw new Error('No results');
                const r = data.result;
                let text = `🎵 *TikTok: "${q}"*\n\n`;
                text += `📌 *${r.title || r.desc || 'No title'}*\n`;
                text += `👤 ${r.author?.unique_id || ''}\n`;
                if (r.download) text += `🔗 Download: ${r.download}\n`;
                await sock.sendMessage(chatId, { text }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
            }
        }
    }
];
