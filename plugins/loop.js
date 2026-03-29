module.exports = {
    command: 'loop',
    aliases: ['repeat'],
    category: 'owner',
    description: 'Repeat a message multiple times (all in one message)',
    usage: '.loop <count> <message>',
    ownerOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;

        if (args.length < 2) {
            await sock.sendMessage(chatId, { 
                text: '❌ *Usage:* `.loop <count> <message>`\n\nExample: `.loop 5 Hello everyone!`' 
            }, { quoted: message });
            return;
        }

        const count = parseInt(args[0], 10);
        if (isNaN(count) || count <= 0 || count > 1000) {
            await sock.sendMessage(chatId, { 
                text: '❌ *Invalid count* (must be between 1 and 1000)' 
            }, { quoted: message });
            return;
        }

        const messageText = args.slice(1).join(' ');
        if (!messageText.trim()) {
            await sock.sendMessage(chatId, { 
                text: '❌ *Message cannot be empty*' 
            }, { quoted: message });
            return;
        }

        // Build a single message with repeated lines
        const repeatedLines = Array(count).fill(messageText).join('\n');
        // Send as plain text – no channelInfo, no extra context
        await sock.sendMessage(chatId, { text: repeatedLines }, { quoted: message });
    }
};
