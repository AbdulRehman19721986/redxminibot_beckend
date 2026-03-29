/*****************************************************************************
 *  REDX BOT — Deline API: Indonesian Games / Quiz
 *  .asahotak, .caklontong, .tekatek, .tebakanime, .tebakff, .tebakml
 *****************************************************************************/
const axios = require('axios');
const API = 'https://api.deline.web.id';

async function delineGet(endpoint, params = {}) {
    const url = new URL(API + endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const { data } = await axios.get(url.toString(), { timeout: 20000 });
    return data;
}

// Active game sessions: chatId → { question, answer, expires }
const activeSessions = new Map();

function formatGameMsg(soal, hint = '') {
    return `🧩 *RIDDLE*\n\n${soal}${hint ? `\n\n💡 Hint: ${hint}` : ''}\n\n_Reply with your answer!_\n_Timeout: 60 seconds_`;
}

async function handleGameReply(sock, message, chatId, userText) {
    const session = activeSessions.get(chatId);
    if (!session) return false;
    if (Date.now() > session.expires) { activeSessions.delete(chatId); return false; }

    const answer = session.answer?.toLowerCase().trim();
    const input = userText?.toLowerCase().trim();
    if (!input || !answer) return false;

    const correct = input === answer || input.includes(answer) || answer.includes(input);
    if (correct) {
        activeSessions.delete(chatId);
        const senderId = message.key.participant || message.key.remoteJid;
        await sock.sendMessage(chatId, {
            text: `✅ *Correct!* 🎉\n\n@${senderId.split('@')[0]}, that's right!\n\n*Answer:* ${session.answer}`,
            mentions: [senderId]
        }, { quoted: message });
        return true;
    }
    return false;
}

module.exports = {
    games: [
        {
            command: 'asahotak',
            aliases: ['brainteaser', 'tebakiq'],
            category: 'games',
            description: 'Indonesian brain teaser riddle',
            usage: '.asahotak',
            async handler(sock, message, args, context = {}) {
                const chatId = context.chatId || message.key.remoteJid;
                try {
                    const data = await delineGet('/game/asahotak');
                    if (!data.status || !data.data) throw new Error('No data');
                    const { soal, jawaban } = data.data;
                    activeSessions.set(chatId, { answer: jawaban, expires: Date.now() + 60000 });
                    await sock.sendMessage(chatId, { text: formatGameMsg(soal) }, { quoted: message });
                    setTimeout(() => {
                        if (activeSessions.get(chatId)?.answer === jawaban) {
                            activeSessions.delete(chatId);
                            sock.sendMessage(chatId, { text: `⏰ Time's up!\n*Answer was:* ${jawaban}` });
                        }
                    }, 60000);
                } catch (e) {
                    await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
                }
            }
        },
        {
            command: 'caklontong',
            aliases: ['caklnt', 'tebakcak'],
            category: 'games',
            description: 'Random Cak Lontong riddle',
            usage: '.caklontong',
            async handler(sock, message, args, context = {}) {
                const chatId = context.chatId || message.key.remoteJid;
                try {
                    const data = await delineGet('/game/caklontong');
                    if (!data.status || !data.data) throw new Error('No data');
                    const { soal, jawaban, deskripsi } = data.data;
                    activeSessions.set(chatId, { answer: jawaban, expires: Date.now() + 60000 });
                    await sock.sendMessage(chatId, {
                        text: `🎭 *CAK LONTONG RIDDLE*\n\n${soal}\n\n_Reply with your answer!_`
                    }, { quoted: message });
                    setTimeout(() => {
                        if (activeSessions.get(chatId)?.answer === jawaban) {
                            activeSessions.delete(chatId);
                            sock.sendMessage(chatId, { text: `⏰ Time's up!\n*Answer:* ${jawaban}\n_${deskripsi || ''}_` });
                        }
                    }, 60000);
                } catch (e) {
                    await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
                }
            }
        },
        {
            command: 'tekateki',
            aliases: ['riddle', 'teka'],
            category: 'games',
            description: 'Indonesian riddle game',
            usage: '.tekateki',
            async handler(sock, message, args, context = {}) {
                const chatId = context.chatId || message.key.remoteJid;
                try {
                    const data = await delineGet('/game/tekateki');
                    if (!data.status || !data.data) throw new Error('No data');
                    const { soal, jawaban } = data.data;
                    activeSessions.set(chatId, { answer: jawaban, expires: Date.now() + 60000 });
                    await sock.sendMessage(chatId, { text: formatGameMsg(soal) }, { quoted: message });
                    setTimeout(() => {
                        if (activeSessions.get(chatId)?.answer === jawaban) {
                            activeSessions.delete(chatId);
                            sock.sendMessage(chatId, { text: `⏰ Time's up!\n*Answer:* ${jawaban}` });
                        }
                    }, 60000);
                } catch (e) {
                    await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
                }
            }
        },
        {
            command: 'tebakanime',
            aliases: ['guessanime', 'animeq'],
            category: 'games',
            description: 'Guess the anime from image',
            usage: '.tebakanime',
            async handler(sock, message, args, context = {}) {
                const chatId = context.chatId || message.key.remoteJid;
                try {
                    const data = await delineGet('/game/tebakanime');
                    if (!data.status || !data.result) throw new Error('No data');
                    const { soal, jawaban } = data.result;
                    activeSessions.set(chatId, { answer: jawaban.toLowerCase(), expires: Date.now() + 90000 });
                    await sock.sendMessage(chatId, {
                        image: { url: soal },
                        caption: `🎌 *GUESS THE ANIME!*\n\n_Reply with the anime name_\n_Timeout: 90 seconds_`
                    }, { quoted: message });
                    setTimeout(() => {
                        if (activeSessions.get(chatId)?.answer === jawaban.toLowerCase()) {
                            activeSessions.delete(chatId);
                            sock.sendMessage(chatId, { text: `⏰ Time's up!\n*Anime:* ${jawaban}` });
                        }
                    }, 90000);
                } catch (e) {
                    await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
                }
            }
        },
        {
            command: 'tebakff',
            aliases: ['guessff', 'ffquiz'],
            category: 'games',
            description: 'Guess the Free Fire character',
            usage: '.tebakff',
            async handler(sock, message, args, context = {}) {
                const chatId = context.chatId || message.key.remoteJid;
                try {
                    const data = await delineGet('/game/tebakff');
                    if (!data.status || !data.result) throw new Error('No data');
                    const { img, jawaban, deskripsi } = data.result;
                    activeSessions.set(chatId, { answer: jawaban.toLowerCase(), expires: Date.now() + 90000 });
                    await sock.sendMessage(chatId, {
                        image: { url: img },
                        caption: `🔥 *GUESS THE FREE FIRE CHARACTER!*\n\n💡 Hint: ${deskripsi}\n\n_Reply with the name!_`
                    }, { quoted: message });
                    setTimeout(() => {
                        if (activeSessions.get(chatId)?.answer === jawaban.toLowerCase()) {
                            activeSessions.delete(chatId);
                            sock.sendMessage(chatId, { text: `⏰ Time's up!\n*Character:* ${jawaban}` });
                        }
                    }, 90000);
                } catch (e) {
                    await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
                }
            }
        },
        {
            command: 'tebakml',
            aliases: ['guessml', 'mlhero'],
            category: 'games',
            description: 'Guess the Mobile Legends hero',
            usage: '.tebakml',
            async handler(sock, message, args, context = {}) {
                const chatId = context.chatId || message.key.remoteJid;
                try {
                    const data = await delineGet('/game/tebakheroml');
                    if (!data.status || !data.result) throw new Error('No data');
                    const { img, jawaban } = data.result;
                    activeSessions.set(chatId, { answer: jawaban.toLowerCase(), expires: Date.now() + 90000 });
                    await sock.sendMessage(chatId, {
                        image: { url: img },
                        caption: `⚔️ *GUESS THE MOBILE LEGENDS HERO!*\n\n_Reply with the hero name!_`
                    }, { quoted: message });
                    setTimeout(() => {
                        if (activeSessions.get(chatId)?.answer === jawaban.toLowerCase()) {
                            activeSessions.delete(chatId);
                            sock.sendMessage(chatId, { text: `⏰ Time's up!\n*Hero:* ${jawaban}` });
                        }
                    }, 90000);
                } catch (e) {
                    await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
                }
            }
        }
    ],
    handleGameReply,
    activeSessions
};
