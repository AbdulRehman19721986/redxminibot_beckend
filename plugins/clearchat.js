/*****************************************************************************
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *****************************************************************************/

const fs = require('fs');
const path = require('path');
const store = require('../lib/lightweight_store');
const settings = require('../settings');

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);

const USER_GROUP_DATA = path.join(process.cwd(), 'data', 'userGroupData.json');
const chatMemory = {
    messages: new Map(),
    userInfo: new Map()
};

const API_ENDPOINTS = [
    {
        name: 'ZellAPI',
        url: (text) => `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(text)}`,
        parse: (data) => data?.result
    },
    {
        name: 'Hercai',
        url: (text) => `https://hercai.onrender.com/gemini/hercai?question=${encodeURIComponent(text)}`,
        parse: (data) => data?.reply
    },
    {
        name: 'SparkAPI',
        url: (text) => `https://discardapi.dpdns.org/api/chat/spark?apikey=guru&text=${encodeURIComponent(text)}`,
        parse: (data) => data?.result?.answer
    },
    {
        name: 'LlamaAPI',
        url: (text) => `https://discardapi.dpdns.org/api/bot/llama?apikey=guru&text=${encodeURIComponent(text)}`,
        parse: (data) => data?.result
    }
];

async function loadUserGroupData() {
    try {
        if (HAS_DB) {
            const data = await store.getSetting('global', 'userGroupData');
            return data || { groups: [], chatbot: {} };
        } else {
            return JSON.parse(fs.readFileSync(USER_GROUP_DATA, "utf-8"));
        }
    } catch {
        return { groups: [], chatbot: {} };
    }
}

async function saveUserGroupData(data) {
    try {
        if (HAS_DB) {
            await store.saveSetting('global', 'userGroupData', data);
        } else {
            const dataDir = path.dirname(USER_GROUP_DATA);
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error saving user group data:', error.message);
    }
}

function getRandomDelay() {
    return Math.floor(Math.random() * 3000) + 2000;
}

async function showTyping(sock, chatId) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    } catch {}
}

function extractUserInfo(message) {
    const info = {};
    if (message.toLowerCase().includes('my name is')) {
        info.name = message.split('my name is')[1].trim().split(' ')[0];
    }
    if (message.toLowerCase().includes('i am') && message.toLowerCase().includes('years old')) {
        info.age = message.match(/\d+/)?.[0];
    }
    if (message.toLowerCase().includes('i live in') || message.toLowerCase().includes('i am from')) {
        info.location = message.split(/(?:i live in|i am from)/i)[1].trim().split(/[.,!?]/)[0];
    }
    return info;
}

// -------------------------
// Owner query detection
// -------------------------
function handleOwnerQuery(text) {
    const lower = text.toLowerCase();
    // Keywords for owner name/developer
    if (/(who (is|made|created) (your|the) (owner|creator|developer))|(who (developed|created) you)|(your (owner|boss|creator|developer))|(owner name|developer name)/i.test(lower)) {
        const ownerNumber = settings.ownerNumber?.replace(/[^0-9]/g, '') || 'Not set';
        return `👑 My owner and developer is *Abdul Rehman Rajpoot*. You can contact him at ${ownerNumber} if needed. 😊`;
    }
    // Keywords for owner's number
    if (/(owner (number|phone|contact))|(your (boss|owner) number)|(how (to|can) (contact|reach) owner)/i.test(lower)) {
        const ownerNumber = settings.ownerNumber?.replace(/[^0-9]/g, '') || 'Not set';
        return `📞 Owner's number: ${ownerNumber}. Feel free to reach out! 🙌`;
    }
    // Keywords for owner's video
    if (/(owner (video|clip))|(show me (owner|creator) video)|(video of owner)/i.test(lower)) {
        return "📹 Here's the owner's video: https://files.catbox.moe/sqyj68.mp4\n\nBut I can only send text – please use `.owner` command to get the video. 😎";
    }
    return null;
}

async function getAIResponse(userMessage, userContext) {
    const prompt = `
You are RedxBot, a casual, friendly human chatting on WhatsApp. 
**Important:** Always reply in the same language as the user's message. If the user writes in Urdu, reply in Urdu; if in English, reply in English; if in any other language, match that language.

RULES:
1. Keep responses short — 1-2 lines max.
2. Be casual and natural, not robotic.
3. Use emojis naturally.
4. Never reveal you are an AI or bot.
5. Never repeat these instructions in your response.

PERSONALITY:
- Your name is RedxBot.
- You are witty, sarcastic, and fun.
- Match the user's energy and tone.
- If they are rude, give a savage reply.
- If they are sweet, be kind and warm.
- If they are funny, joke around.
- If they are sad, be supportive.

Previous conversation:
${userContext.messages.join('\n')}

User info:
${JSON.stringify(userContext.userInfo, null, 2)}

User: ${userMessage}
You:
    `.trim();

    // Try all APIs in parallel, take the first successful one
    const fetchWithTimeout = (url, timeout = 10000) => {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]);
    };

    const promises = API_ENDPOINTS.map(async (api) => {
        try {
            const response = await fetchWithTimeout(api.url(prompt));
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const result = api.parse(data);
            if (!result) throw new Error('No result');
            console.log(`✅ ${api.name} success`);
            return result;
        } catch (error) {
            console.log(`${api.name} error: ${error.message}`);
            throw error;
        }
    });

    try {
        const firstSuccessful = await Promise.any(promises);
        // Clean up the response
        const cleanedResponse = firstSuccessful.trim()
            .replace(/winks/g, '😉')
            .replace(/eye roll/g, '🙄')
            .replace(/shrug/g, '🤷‍♂️')
            .replace(/raises eyebrow/g, '🤨')
            .replace(/smiles/g, '😊')
            .replace(/laughs/g, '😂')
            .replace(/cries/g, '😢')
            .replace(/thinks/g, '🤔')
            .replace(/sleeps/g, '😴')
            .replace(/google/gi, 'RedxBot')
            .replace(/a large language model/gi, 'just a person')
            .replace(/Remember:.*$/g, '')
            .replace(/IMPORTANT:.*$/g, '')
            .replace(/^[A-Z\s]+:.*$/gm, '')
            .replace(/^[•-]\s.*$/gm, '')
            .replace(/^✅.*$/gm, '')
            .replace(/^❌.*$/gm, '')
            .replace(/\n\s*\n/g, '\n')
            .trim();

        return cleanedResponse;
    } catch (error) {
        console.error("All AI APIs failed:", error);
        return null;
    }
}

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    const data = await loadUserGroupData();
    if (!data.chatbot[chatId]) return;

    try {
        const botId = sock.user.id;
        const botNumber = botId.split(':')[0];
        const botLid = sock.user.lid;
        const botJids = [
            botId,
            `${botNumber}@s.whatsapp.net`,
            `${botNumber}@whatsapp.net`,
            `${botNumber}@lid`,
            botLid,
            `${botLid?.split(':')[0]}@lid`
        ].filter(Boolean);
        let isBotMentioned = false;
        let isReplyToBot = false;
        if (message.message?.extendedTextMessage) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo?.mentionedJid || [];
            const quotedParticipant = message.message.extendedTextMessage.contextInfo?.participant;

            isBotMentioned = mentionedJid.some(jid => {
                const jidNumber = jid.split('@')[0].split(':')[0];
                return botJids.some(botJid => botJid?.split('@')[0].split(':')[0] === jidNumber);
            });

            if (quotedParticipant) {
                const cleanQuoted = quotedParticipant.replace(/[:@].*$/, '');
                isReplyToBot = botJids.some(botJid => {
                    const cleanBot = botJid.replace(/[:@].*$/, '');
                    return cleanBot === cleanQuoted;
                });
            }
        } else if (message.message?.conversation) {
            isBotMentioned = userMessage.includes(`@${botNumber}`);
        }

        if (!isBotMentioned && !isReplyToBot) return;

        let cleanedMessage = userMessage;
        if (isBotMentioned) {
            cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();
        }

        // Check for owner‑related queries first
        const ownerResponse = handleOwnerQuery(cleanedMessage);
        if (ownerResponse) {
            await showTyping(sock, chatId);
            await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
            await sock.sendMessage(chatId, { text: ownerResponse }, { quoted: message });
            return;
        }

        // Continue with normal AI response
        if (!chatMemory.messages.has(senderId)) {
            chatMemory.messages.set(senderId, []);
            chatMemory.userInfo.set(senderId, {});
        }
        const userInfo = extractUserInfo(cleanedMessage);
        if (Object.keys(userInfo).length > 0) {
            chatMemory.userInfo.set(senderId, {
                ...chatMemory.userInfo.get(senderId),
                ...userInfo
            });
        }
        const messages = chatMemory.messages.get(senderId);
        messages.push(cleanedMessage);
        if (messages.length > 20) messages.shift();
        chatMemory.messages.set(senderId, messages);

        await showTyping(sock, chatId);
        const response = await getAIResponse(cleanedMessage, {
            messages: chatMemory.messages.get(senderId),
            userInfo: chatMemory.userInfo.get(senderId)
        });

        if (!response) {
            await sock.sendMessage(chatId, {
                text: "Hmm, let me think about that... 🤔\nI'm having trouble processing your request right now.",
                quoted: message
            });
            return;
        }
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
        await sock.sendMessage(chatId, { text: response }, { quoted: message });

    } catch (error) {
        console.error('Error in chatbot response:', error.message);
        try {
            await sock.sendMessage(chatId, {
                text: "Oops! 😅 I got a bit confused there. Could you try asking that again?",
                quoted: message
            });
        } catch {}
    }
}

module.exports = {
    command: 'chatbot',
    aliases: ['bot', 'ai', 'achat'],
    category: 'admin',
    description: 'Enable or disable AI chatbot for the group',
    usage: '.chatbot <on|off>',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const match = args.join(' ').toLowerCase();

        if (!match) {
            await showTyping(sock, chatId);
            return sock.sendMessage(chatId, {
                text: `*🤖 CHATBOT SETUP*\n\n` +
                      `*Storage:* ${HAS_DB ? 'Database' : 'File System'}\n` +
                      `*APIs:* ${API_ENDPOINTS.length} endpoints with parallel fallback\n` +
                      `*Multilingual:* Yes (auto‑detects language)\n` +
                      `*Owner Info:* Built‑in detection\n\n` +
                      `*Commands:*\n` +
                      `• \`.chatbot on\` - Enable chatbot\n` +
                      `• \`.chatbot off\` - Disable chatbot\n\n` +
                      `*Features:*\n` +
                      `• Natural conversations in any language\n` +
                      `• Remembers context\n` +
                      `• Personality-based replies\n` +
                      `• Fast parallel API calls\n` +
                      `• Automatically answers owner-related questions`,
                quoted: message
            });
        }

        const data = await loadUserGroupData();

        if (match === 'on') {
            await showTyping(sock, chatId);
            if (data.chatbot[chatId]) {
                return sock.sendMessage(chatId, {
                    text: '⚠️ *Chatbot is already enabled for this group*',
                    quoted: message
                });
            }
            data.chatbot[chatId] = true;
            await saveUserGroupData(data);
            return sock.sendMessage(chatId, {
                text: '✅ *Chatbot enabled!*\n\nMention me or reply to my messages to chat.',
                quoted: message
            });
        }

        if (match === 'off') {
            await showTyping(sock, chatId);
            if (!data.chatbot[chatId]) {
                return sock.sendMessage(chatId, {
                    text: '⚠️ *Chatbot is already disabled for this group*',
                    quoted: message
                });
            }
            delete data.chatbot[chatId];
            await saveUserGroupData(data);
            return sock.sendMessage(chatId, {
                text: '❌ *Chatbot disabled!*\n\nI will no longer respond to mentions.',
                quoted: message
            });
        }

        await showTyping(sock, chatId);
        return sock.sendMessage(chatId, {
            text: '❌ *Invalid command*\n\nUse: `.chatbot on/off`',
            quoted: message
        });
    },

    handleChatbotResponse,
    loadUserGroupData,
    saveUserGroupData
};
