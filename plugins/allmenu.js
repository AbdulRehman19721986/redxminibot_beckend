// plugins/allmenu.js
module.exports = {
    command: 'allmenu',
    aliases: ['allcmd', 'fullmenu'],
    category: 'info',
    description: 'Show all commands grouped by category',
    usage: '.allmenu',
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

        const builtins = ['ping', 'owner', 'mode', 'deployid', 'runtime', 'restart'];
        for (const cmd of builtins) {
            if (!cmds.has(cmd)) {
                if (!categories.has('owner')) categories.set('owner', []);
                categories.get('owner').push(cmd);
            }
        }

        let menu = `╭┈┄───【 ${config.botName || 'REDXBOT302'} 】───┄┈╮\n`;
        menu += `├■ 🤖 Owner: ${config.ownerName}\n`;
        menu += `├■ 📜 Commands: ${cmds.size + builtins.length}\n`;
        menu += `├■ ⏱️ Runtime: ${formatUptime(process.uptime())}\n`;
        menu += `├■ 📡 Baileys: Multi Device\n`;
        menu += `├■ ☁️ Platform: ${config.platform || 'Local'}\n`;
        menu += `├■ 📦 Prefix: ${prefix}\n`;
        menu += `├■ ⚙️ Mode: ${config.mode.toUpperCase()}\n`;
        menu += `├■ 🖼️ Version: 6.0.0\n`;
        menu += `╰───────────────┄┈╯\n\n`;

        const sortedCats = [...categories.keys()].sort();
        for (const cat of sortedCats) {
            const cmdList = categories.get(cat).sort();
            menu += `『 ${cat.toUpperCase()} 』\n╭───────────────┄┈╮\n`;
            cmdList.forEach(c => { menu += `┋ ➜ ${prefix}${c}\n`; });
            menu += `╰───────────────┄┈╯\n\n`;
        }
        menu += `> *© Powered by ${config.botName}*`;

        await sock.sendMessage(chatId, { text: menu, ...channelInfo }, { quoted: message });
    }
};

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}
