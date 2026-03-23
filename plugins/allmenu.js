// plugins/allmenu.js
const settings = require('../settings');
const commandHandler = require('../lib/commandHandler');
const store = require('../lib/lightweight_store');

module.exports = {
    command: 'allmenu',
    aliases: ['allcmd', 'fullmenu'],
    category: 'main',
    description: 'Show all commands in categorized list',
    usage: '.allmenu',

    async handler(sock, message, args, context) {
        const { chatId, channelInfo, sender } = context;
        const isOwner = settings.ownerNumber.split(',').includes(sender.split('@')[0]);

        const prefix = await store.getSetting('global', 'prefix') || settings.prefix || '.';
        const categories = Array.from(commandHandler.categories.keys()).sort();

        let fullText = `╭┈┄───【 *${settings.botName}* 】───┄┈╮\n`;
        fullText += `├■ 🤖 *Owner:* ${settings.botOwner} & ${settings.secondOwner}\n`;
        fullText += `├■ 📜 *Commands:* ${commandHandler.commands.size}\n`;
        fullText += `├■ ⏱️ *Runtime:* ${formatUptime(process.uptime())}\n`;
        fullText += `├■ 📡 *Baileys:* Multi Device\n`;
        fullText += `├■ ☁️ *Platform:* ${settings.platform.toUpperCase()}\n`;
        fullText += `├■ 📦 *Prefix:* ${prefix}\n`;
        fullText += `├■ ⚙️ *Mode:* ${await store.getBotMode()}\n`;
        fullText += `├■ 🖼️ *Version:* ${settings.version}\n`;
        fullText += `├■ 📝 *About:* ${settings.botDesc}\n`;
        fullText += `╰───────────────┄┈╯\n\n`;

        for (const cat of categories) {
            const commands = commandHandler.getCommandsByCategory(cat);
            if (commands.length === 0) continue;

            // Filter owner‑only commands for non‑owner
            const filtered = commands.filter(cmd => {
                const cmdObj = commandHandler.commands.get(cmd);
                if (cmdObj.ownerOnly && !isOwner) return false;
                return true;
            });

            if (filtered.length === 0) continue;

            fullText += `『 ${cat.toUpperCase()} 』\n`;
            fullText += `╭───────────────┄┈╮\n`;
            filtered.forEach(cmd => {
                fullText += `┋ ➜ ${cmd}\n`;
            });
            fullText += `╰───────────────┄┈╯\n\n`;
        }

        fullText += `> *© Powered by ${settings.botName}*`;

        await sock.sendMessage(chatId, {
            text: fullText,
            ...channelInfo
        }, { quoted: message });
    }
};

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}
