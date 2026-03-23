// plugins/menu.js
const settings = require('../settings');
const commandHandler = require('../lib/commandHandler');
const store = require('../lib/lightweight_store');
const { getPairedUsers } = require('../lib/pairing'); // you need to implement this

module.exports = {
    command: 'menu',
    aliases: ['help', 'cmds'],
    category: 'main',
    description: 'Show categorized menu with numbers',
    usage: '.menu',

    async handler(sock, message, args, context) {
        const { chatId, sender, channelInfo } = context;
        const isOwner = settings.ownerNumber.split(',').includes(sender.split('@')[0]);

        // Check if user is paired (only for non‑owner commands)
        const pairedUsers = await getPairedUsers(); // returns array of JIDs
        const isPaired = isOwner || pairedUsers.includes(sender);

        // Get dynamic prefix
        const prefix = await store.getSetting('global', 'prefix') || settings.prefix || '.';

        // Get command categories from handler
        const categories = Array.from(commandHandler.categories.keys()).sort();

        // Build the menu with numbers
        let menuText = `╭┈───〔 *REDXBOT302* 〕───⊷\n`;
        menuText += `├▢ 🤖 *Owner:* ${settings.botOwner} & ${settings.secondOwner}\n`;
        menuText += `├▢ 🪄 *Prefix:* ${prefix}\n`;
        menuText += `├▢ 🎐 *Version:* ${settings.version}\n`;
        menuText += `├▢ ☁️ *Platform:* ${settings.platform.toUpperCase()}\n`;
        menuText += `├▢ 📜 *Plugins:* ${commandHandler.commands.size}\n`;
        menuText += `├▢ ⏰ *Runtime:* ${formatUptime(process.uptime())}\n`;
        menuText += `╰───────────────────⊷\n`;
        menuText += `╭───⬡ SELECT MENU ⬡───\n`;

        let index = 1;
        for (const cat of categories) {
            const cmdCount = commandHandler.getCommandsByCategory(cat).length;
            if (cmdCount === 0) continue;
            menuText += `┋ ⬡ ${index} ${cat.toUpperCase()} (${cmdCount})\n`;
            index++;
        }
        menuText += `╰───────────────────⊷\n\n`;
        menuText += `> *Reply with the number to select menu (1-${categories.length})*`;

        // Send the menu
        const sentMsg = await sock.sendMessage(chatId, {
            text: menuText,
            ...channelInfo
        }, { quoted: message });

        const msgId = sentMsg.key.id;

        // Wait for reply
        const listener = async (update) => {
            const msg = update.messages?.[0];
            if (!msg?.message) return;

            const replyTo = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
            if (replyTo !== msgId) return;

            const choice = parseInt((msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim());
            if (isNaN(choice) || choice < 1 || choice > categories.length) {
                await sock.sendMessage(chatId, {
                    text: '❌ Invalid number. Please send a number between 1 and ' + categories.length,
                    ...channelInfo
                }, { quoted: msg });
                return;
            }

            sock.ev.off('messages.upsert', listener);

            const selectedCat = categories[choice - 1];
            const commands = commandHandler.getCommandsByCategory(selectedCat);

            // Filter commands based on paired status
            const filtered = commands.filter(cmd => {
                const cmdObj = commandHandler.commands.get(cmd);
                if (cmdObj.ownerOnly && !isOwner) return false;
                if (!isPaired && !cmdObj.public) return false; // if you have a `public` flag
                return true;
            });

            if (!filtered.length) {
                await sock.sendMessage(chatId, {
                    text: `❌ No commands available in *${selectedCat}* for you.`,
                    ...channelInfo
                }, { quoted: msg });
                return;
            }

            const list = filtered.map(cmd => `┋ ➜ ${cmd}`).join('\n');
            const catText = `『 *${selectedCat.toUpperCase()}* 』\n╭───────────────┄┈╮\n${list}\n╰───────────────┄┈╯`;

            await sock.sendMessage(chatId, {
                text: catText,
                ...channelInfo
            }, { quoted: msg });
        };

        sock.ev.on('messages.upsert', listener);
        setTimeout(() => sock.ev.off('messages.upsert', listener), 60 * 1000); // 1 minute timeout
    }
};

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}
