// plugins/menu.js
module.exports = {
    command: 'menu',
    aliases: ['help', 'cmds', 'start'],
    category: 'info',
    description: 'Show categorized menu with numbers. Reply with number to see commands.',
    usage: '.menu',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo, config } = context;
        const prefix = config.prefix;

        const cmds = global.botCommands || new Map();
        const categories = new Map();
        for (const [name, cmd] of cmds) {
            const cat = cmd.category || 'other';
            if (!categories.has(cat)) categories.set(cat, []);
            categories.get(cat).push(name);
        }

        // Add built‑ins to 'owner' category (they are not in plugins)
        const builtins = ['ping', 'owner', 'mode', 'deployid', 'runtime', 'restart'];
        for (const cmd of builtins) {
            if (!cmds.has(cmd)) {
                if (!categories.has('owner')) categories.set('owner', []);
                categories.get('owner').push(cmd);
            }
        }

        const sortedCats = [...categories.keys()].sort();
        let menu = `╭┈───〔 ${config.botName || 'REDXBOT302'} 〕───⊷\n`;
        menu += `├▢ 🤖 Owner: ${config.ownerName}\n`;
        menu += `├▢ 🪄 Prefix: ${prefix}\n`;
        menu += `├▢ 🎐 Version: 6.0.0\n`;
        menu += `├▢ ☁️ Platform: ${config.platform || 'Local'}\n`;
        menu += `├▢ 📜 Plugins: ${cmds.size + builtins.length}\n`;
        menu += `├▢ ⏰ Runtime: ${formatUptime(process.uptime())}\n`;
        menu += `╰───────────────────⊷\n`;
        menu += `╭───⬡ SELECT MENU ⬡───\n`;

        let index = 1;
        for (const cat of sortedCats) {
            const count = categories.get(cat).length;
            menu += `┋ ⬡ ${index} ${cat.toUpperCase()} (${count})\n`;
            index++;
        }
        menu += `╰───────────────────⊷\n\n`;
        menu += `> *Reply with the number to select menu (1-${sortedCats.length})*`;

        const sentMsg = await sock.sendMessage(chatId, { text: menu, ...channelInfo }, { quoted: message });
        const msgId = sentMsg.key.id;

        const listener = async (update) => {
            const msg = update.messages?.[0];
            if (!msg?.message) return;
            const replyTo = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
            if (replyTo !== msgId) return;

            const choice = parseInt((msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim());
            if (isNaN(choice) || choice < 1 || choice > sortedCats.length) {
                await sock.sendMessage(chatId, { text: '❌ Invalid number. Please send a number between 1 and ' + sortedCats.length, ...channelInfo }, { quoted: msg });
                return;
            }

            sock.ev.off('messages.upsert', listener);
            const selectedCat = sortedCats[choice - 1];
            const commandsList = categories.get(selectedCat).sort();
            let catText = `『 ${selectedCat.toUpperCase()} 』\n╭───────────────┄┈╮\n`;
            commandsList.forEach(cmd => { catText += `┋ ➜ ${prefix}${cmd}\n`; });
            catText += `╰───────────────┄┈╯`;

            await sock.sendMessage(chatId, { text: catText, ...channelInfo }, { quoted: msg });
        };

        sock.ev.on('messages.upsert', listener);
        setTimeout(() => sock.ev.off('messages.upsert', listener), 60 * 1000);
    }
};

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}
