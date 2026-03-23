/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *                                                                           *
 *****************************************************************************/

const gtts = require('gtts');
const fs = require('fs');
const path = require('path');

// Expanded gaali list – 50+ lines in Hindi/Urdu/English
const GAALIS = [
    // Hindi/Urdu
    "Madarchod! Teri maa ka bhosda!",
    "Bhen ke lode!",
    "Tatti chod! Randi ke!",
    "Gaand mara! Chutiye!",
    "Bhan ka taka!",
    "Teri ma ko lun!",
    "Mia Khalifa ki aulad!",
    "Johny Sins ki aulaad!",
    "Ladle! Maderchod!",
    "Mewo! Madarjaat!",
    "Teri ammi ka joota!",
    "Haramzade!",
    "Kamine! Suar ki aulad!",
    "Teri behen ki choot!",
    "Tera baap chakka!",
    "Bhadwe!",
    "Teri naani ka tatta!",
    "Gandu!",
    "Randibaaz!",
    "Chakke ke pille!",
    "Kutte ki dum!",
    "Teri mummy ka lund!",
    "Teri didi ka bhosda!",
    "Teri family ka bharosa nahi!",
    "Maa chudane wale!",
    "Bhen ke takke!",
    "Lund le!",
    "Teri gaand mein danda!",
    "Chup chaap mar!",
    "Suar ki aulaad!",
    "Kutte ki nasal!",
    "Teri ammi ka number do!",
    "Tera baap nahi teri maa bhi nahi!",
    "Hijde!",
    "Launda!",
    "Teri aukaat kya hai?",
    "Jhat ke!",
    "Fattu!",
    "Namak haram!",
    "Beghairat!",
    // English
    "Fuck you!",
    "Motherfucker!",
    "Dickhead!",
    "Asshole!",
    "Prick!",
    "Wanker!",
    "Bastard!",
    "Cocksucker!",
    "Son of a bitch!",
    "Shithead!",
    "Twat!",
    "Bollocks!",
    "Arsehole!",
    "Piss off!",
    "Bugger off!",
    "Sod off!",
    "Bloody hell!",
    "You piece of shit!",
    "You fucking idiot!",
    "You absolute wanker!"
];

module.exports = {
    command: 'gaali',
    aliases: ['gali', 'abuse'],
    category: 'fun',
    description: '🤬 Hear a funny gaali in TTS (reply with number to select)',
    usage: '.gaali [number] or .gaali [language code]',

    async handler(sock, message, args, context) {
        const { chatId, channelInfo, senderId } = context;
        const input = args[0]?.toLowerCase();

        // Language override if last arg is two-letter code
        let language = 'hi'; // default Hindi for gaali
        if (args.length && /^[a-z]{2}$/.test(args[args.length - 1])) {
            language = args.pop().toLowerCase();
        }

        // If no args or args is not a number, show list
        if (!args.length || isNaN(parseInt(input))) {
            // Show numbered list of first 20 gaalis (or all if less)
            const list = GAALIS.map((g, i) => `${i+1}. ${g}`).slice(0, 20).join('\n');
            const caption = `🤬 *GAALI LIST (1-${Math.min(20, GAALIS.length)})*\n\n${list}\n\n_Reply with a number to hear that gaali._`;
            
            // Store the list in a temporary session
            if (!global.gaaliSessions) global.gaaliSessions = {};
            global.gaaliSessions[chatId] = {
                userId: senderId,
                list: GAALIS,
                language: language,
                timestamp: Date.now()
            };

            return await sock.sendMessage(chatId, {
                text: caption,
                ...channelInfo
            }, { quoted: message });
        }

        // Handle number selection
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > GAALIS.length) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid number. Please enter a number between 1 and ${GAALIS.length}.`,
                ...channelInfo
            }, { quoted: message });
        }

        // Generate TTS for selected gaali
        const text = GAALIS[num - 1];
        const filePath = path.join(process.cwd(), 'tmp', `gaali-${Date.now()}.mp3`);
        if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });

        try {
            await sock.sendMessage(chatId, { react: { text: '🤬', key: message.key } });
            const tts = new gtts(text, language);
            await new Promise((resolve, reject) => tts.save(filePath, (err) => err ? reject(err) : resolve()));
            await sock.sendMessage(chatId, {
                audio: { url: filePath },
                mimetype: 'audio/mpeg',
                ptt: true,
                ...channelInfo
            }, { quoted: message });
        } catch (err) {
            console.error('Gaali error:', err);
            await sock.sendMessage(chatId, {
                text: `❌ Failed to generate audio: ${err.message}`,
                ...channelInfo
            }, { quoted: message });
        } finally {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    }
};
