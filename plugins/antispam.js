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

const fs = require('fs');
const path = require('path');
const store = require('../lib/lightweight_store');

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);

const configPath = path.join(process.cwd(), 'data', 'antispam.json');

const tracker = new Map();
const metaCache = new Map();
const META_TTL_MS = 5 * 60 * 1000;

async function getParticipants(sock, chatId) {
    const cached = metaCache.get(chatId);
    if (cached && (Date.now() - cached.fetchedAt) < META_TTL_MS) {
        return cached.participants;
    }
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata?.participants || [];
        metaCache.set(chatId, { participants, fetchedAt: Date.now() });
        return participants;
    } catch {
        return cached?.participants || [];
    }
}

function isParticipantAdmin(participants, jid) {
    if (!jid) return false;
    const num = jid.split('@')[0].split(':')[0];
    return participants.some(p => {
        if (p.admin !== 'admin' && p.admin !== 'superadmin') return false;
        const pId = p.id || '';
        const pLid = p.lid || '';
        const pNum = pId.split('@')[0].split(':')[0];
        const pLidNum = pLid.split('@')[0].split(':')[0];
        const pPhone = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
        return pId === jid || pLid === jid || pNum === num || pLidNum === num || pPhone === num;
    });
}

function getBotAdminStatus(participants, sock) {
    const botId = sock.user?.id || '';
    const botLid = sock.user?.lid || '';
    const botNum = botId.split('@')[0].split(':')[0];
    const botLidNum = botLid.split('@')[0].split(':')[0];
    return participants.some(p => {
        if (p.admin !== 'admin' && p.admin !== 'superadmin') return false;
        const pId = p.id || '';
        const pLid = p.lid || '';
        const pNum = pId.split('@')[0].split(':')[0];
        const pLidNum = pLid.split('@')[0].split(':')[0];
        const pPhone = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
        return pId === botId || pId === botLid || pLid === botLid || pLid === botId ||
               pNum === botNum || pLidNum === botLidNum || pNum === botLidNum || pLidNum === botNum ||
               pPhone === botNum;
    });
}

const DEFAULT_GROUP_CONFIG = {
    enabled: false,
    maxMessages: 5,
    windowSeconds: 5,
    action: 'warn',
    warnCount: 3
};

async function loadConfig() {
    try {
        if (HAS_DB) {
            const data = await store.getSetting('global', 'antispam');
            return data || { groups: {} };
        } else {
            if (!fs.existsSync(configPath)) {
                fs.mkdirSync(path.dirname(configPath), { recursive: true });
                fs.writeFileSync(configPath, JSON.stringify({ groups: {} }, null, 2));
            }
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
    } catch {
        return { groups: {} };
    }
}

async function saveConfig(config) {
    if (HAS_DB) {
        await store.saveSetting('global', 'antispam', config);
    } else {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
}

async function handleAntiSpam(sock, chatId, message, senderId, senderIsOwnerOrSudo) {
    try {
        if (message.key.fromMe || senderIsOwnerOrSudo) return false;

        const config = await loadConfig();
        const groupConfig = config.groups[chatId];
        if (!groupConfig || !groupConfig.enabled) return false;

        const participants = await getParticipants(sock, chatId);
        const isBotAdmin = getBotAdminStatus(participants, sock);
        const isSenderAdmin = isParticipantAdmin(participants, senderId);
        if (isSenderAdmin) return false;

        const now = Date.now();
        const windowMs = groupConfig.windowSeconds * 1000;

        if (!tracker.has(chatId)) tracker.set(chatId, new Map());
        const groupTracker = tracker.get(chatId);

        if (!groupTracker.has(senderId)) {
            groupTracker.set(senderId, { count: 1, firstMessageTime: now, warns: 0 });
            return false;
        }

        const userData = groupTracker.get(senderId);
        if (now - userData.firstMessageTime > windowMs) {
            userData.count = 1;
            userData.firstMessageTime = now;
            return false;
        }

        userData.count++;
        if (userData.count <= groupConfig.maxMessages) return false;

        userData.count = 0;
        userData.firstMessageTime = now;

        if (groupConfig.action === 'warn') {
            userData.warns++;
            const warnsLeft = groupConfig.warnCount - userData.warns;
            try {
                if (warnsLeft > 0) {
                    await sock.sendMessage(chatId, {
                        text: `⚠️ @${senderId.split('@')[0]} *Stop spamming!*\n_Warning ${userData.warns}/${groupConfig.warnCount}. ${warnsLeft} more warn(s) before removal._`,
                        mentions: [senderId]
                    });
                } else {
                    userData.warns = 0;
                    if (!isBotAdmin) {
                        await sock.sendMessage(chatId, {
                            text: `⚠️ @${senderId.split('@')[0]} reached max warnings but bot needs admin rights to remove them.`,
                            mentions: [senderId]
                        });
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `🚫 @${senderId.split('@')[0]} has been *removed* for repeated spamming.`,
                            mentions: [senderId]
                        });
                        await new Promise(r => setTimeout(r, 500));
                        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    }
                }
            } catch {}
            return true;
        }

        if (groupConfig.action === 'kick' || groupConfig.action === 'mute') {
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, {
                    text: `⚠️ Spam from @${senderId.split('@')[0]} — bot needs admin to ${groupConfig.action}.`,
                    mentions: [senderId]
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: `🚫 @${senderId.split('@')[0]} removed for spamming.`,
                    mentions: [senderId]
                });
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
            }
            return true;
        }

        return false;
    } catch (e) {
        console.error('[ANTISPAM] Error:', e.message);
        return false;
    }
}

function invalidateGroupCache(chatId) {
    metaCache.delete(chatId);
    tracker.delete(chatId);
}

module.exports = {
    command: 'antispam',
    aliases: ['floodprotect', 'antiflood'],
    category: 'admin',
    description: 'Configure anti-spam flood protection for the group',
    usage: '.antispam on/off | .antispam set <msgs> <seconds> | .antispam action <warn/kick/mute> | .antispam warns <n>',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const isBotAdmin = context.isBotAdmin || false;

        const config = await loadConfig();
        if (!config.groups[chatId]) config.groups[chatId] = { ...DEFAULT_GROUP_CONFIG };
        const groupConfig = config.groups[chatId];
        const action = args[0]?.toLowerCase();

        if (!action || action === 'status') {
            return await sock.sendMessage(chatId, {
                text: `*🛡️ ANTI-SPAM STATUS*\n\n` +
                      `*Status:* ${groupConfig.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                      `*Limit:* ${groupConfig.maxMessages} messages in ${groupConfig.windowSeconds}s\n` +
                      `*Action:* ${groupConfig.action.toUpperCase()}\n` +
                      `*Warn limit:* ${groupConfig.warnCount} warns before kick\n` +
                      `*Bot is admin:* ${isBotAdmin ? '✅ Yes' : '❌ No (needed for kick/mute)'}\n\n` +
                      `*Commands:*\n` +
                      `• \`.antispam on/off\`\n` +
                      `• \`.antispam set 5 10\` — 5 msgs in 10s\n` +
                      `• \`.antispam action warn/kick/mute\`\n` +
                      `• \`.antispam warns 3\` — warns before kick`,
                ...channelInfo
            }, { quoted: message });
        }

        if (action === 'on' || action === 'enable') {
            if (groupConfig.enabled) return await sock.sendMessage(chatId, { text: '⚠️ Anti-spam already enabled.', ...channelInfo }, { quoted: message });
            if (!isBotAdmin && groupConfig.action !== 'warn') {
                await sock.sendMessage(chatId, { text: `⚠️ Bot is not admin — kick/mute won't work until bot is made admin.`, ...channelInfo }, { quoted: message });
            }
            groupConfig.enabled = true;
            await saveConfig(config);
            return await sock.sendMessage(chatId, {
                text: `✅ *Anti-spam enabled!*\nLimit: ${groupConfig.maxMessages} msgs in ${groupConfig.windowSeconds}s | Action: ${groupConfig.action.toUpperCase()}`,
                ...channelInfo
            }, { quoted: message });
        }

        if (action === 'off' || action === 'disable') {
            if (!groupConfig.enabled) return await sock.sendMessage(chatId, { text: '⚠️ Anti-spam already disabled.', ...channelInfo }, { quoted: message });
            groupConfig.enabled = false;
            await saveConfig(config);
            return await sock.sendMessage(chatId, { text: '❌ *Anti-spam disabled.*', ...channelInfo }, { quoted: message });
        }

        if (action === 'set') {
            const maxMsgs = parseInt(args[1], 10);
            const windowSec = parseInt(args[2], 10);
            if (isNaN(maxMsgs) || isNaN(windowSec) || maxMsgs < 2 || windowSec < 1) {
                return await sock.sendMessage(chatId, { text: '❌ Usage: `.antispam set <messages> <seconds>`\nExample: `.antispam set 5 10`', ...channelInfo }, { quoted: message });
            }
            groupConfig.maxMessages = maxMsgs;
            groupConfig.windowSeconds = windowSec;
            await saveConfig(config);
            return await sock.sendMessage(chatId, { text: `✅ Limit: *${maxMsgs} msgs* in *${windowSec}s*`, ...channelInfo }, { quoted: message });
        }

        if (action === 'action') {
            const newAction = args[1]?.toLowerCase();
            if (!['warn', 'kick', 'mute'].includes(newAction)) {
                return await sock.sendMessage(chatId, { text: '❌ Choose: `warn`, `kick`, or `mute`', ...channelInfo }, { quoted: message });
            }
            if (newAction !== 'warn' && !isBotAdmin) {
                await sock.sendMessage(chatId, { text: `⚠️ Action set to *${newAction.toUpperCase()}* but bot needs admin rights to execute it.`, ...channelInfo }, { quoted: message });
            }
            groupConfig.action = newAction;
            await saveConfig(config);
            return await sock.sendMessage(chatId, { text: `✅ Action: *${newAction.toUpperCase()}*`, ...channelInfo }, { quoted: message });
        }

        if (action === 'warns') {
            const count = parseInt(args[1], 10);
            if (isNaN(count) || count < 1) return await sock.sendMessage(chatId, { text: '❌ Example: `.antispam warns 3`', ...channelInfo }, { quoted: message });
            groupConfig.warnCount = count;
            await saveConfig(config);
            return await sock.sendMessage(chatId, { text: `✅ Warn limit: *${count}* before action.`, ...channelInfo }, { quoted: message });
        }

        return await sock.sendMessage(chatId, { text: '❌ Unknown option. Use `.antispam status`', ...channelInfo }, { quoted: message });
    },

    handleAntiSpam,
    invalidateGroupCache
};
