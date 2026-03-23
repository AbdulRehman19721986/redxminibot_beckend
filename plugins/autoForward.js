/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *                                                                           *
 *****************************************************************************/

const store = require('../lib/lightweight_store');
const { printLog } = require('../lib/print');

const AUTO_FORWARD_KEY = 'auto_forward_config';
const IGNORED_BOTS_KEY = 'ignored_bots';

async function getConfig() {
    try {
        const data = await store.getSetting('global', AUTO_FORWARD_KEY);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        printLog('error', `[AUTO-FWD-CMD] Failed to load config: ${e.message}`);
        return [];
    }
}

async function saveConfig(rules) {
    await store.saveSetting('global', AUTO_FORWARD_KEY, rules);
}

async function getIgnoredBots() {
    try {
        const bots = await store.getSetting('global', IGNORED_BOTS_KEY);
        return Array.isArray(bots) ? bots : [];
    } catch {
        return [];
    }
}

async function saveIgnoredBots(bots) {
    await store.saveSetting('global', IGNORED_BOTS_KEY, bots);
}

function formatRule(index, rule) {
    const status = rule.enabled ? '✅' : '❌';
    return `${index}. ${status} Source: ${rule.sourceJid}\n   Target: ${rule.targetJid}\n   Mode: ${rule.mode || 'all'}`;
}

module.exports = {
    command: 'autoforward',
    aliases: ['af'],
    category: 'owner',
    description: 'Manage multiple auto‑forwarding rules',
    usage:
        '.autoforward                               – show all rules\n' +
        '.autoforward list                           – list all rules\n' +
        '.autoforward <index>                        – show details of one rule\n' +
        '.autoforward add <source> <target> [mode]   – add new rule (mode: all|owner|others|admin, default all)\n' +
        '.autoforward remove <index>                  – remove a rule\n' +
        '.autoforward edit <index> <field> <value>    – edit source, target, mode, or enabled (true/false)\n' +
        '.autoforward enable <index>                   – enable a rule\n' +
        '.autoforward disable <index>                  – disable a rule\n' +
        '.autoforward botignore add <jid>              – ignore another bot\n' +
        '.autoforward botignore remove <jid>           – stop ignoring\n' +
        '.autoforward botignore list                   – list ignored bots',
    ownerOnly: true,

    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;

        if (args.length === 0) {
            const rules = await getConfig();
            const ignored = await getIgnoredBots();
            const ignoreList = ignored.length ? ignored.map(j => `• ${j}`).join('\n') : 'None';

            if (rules.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `*Auto‑forward Rules*\n\nNo rules configured.\nUse \`.autoforward add <source> <target>\` to create one.\n\n*Ignored Bots:*\n${ignoreList}`,
                    ...channelInfo
                }, { quoted: message });
            }

            let ruleText = rules.map((r, i) => formatRule(i + 1, r)).join('\n\n');
            await sock.sendMessage(chatId, {
                text: `*Auto‑forward Rules*\n\n${ruleText}\n\n*Ignored Bots:*\n${ignoreList}`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const subCmd = args[0].toLowerCase();

        // botignore subcommands
        if (subCmd === 'botignore') {
            const action = args[1]?.toLowerCase();
            if (!action) return usageError(sock, chatId, channelInfo, message);
            const ignored = await getIgnoredBots();

            if (action === 'list') {
                const list = ignored.length ? ignored.map(j => `• ${j}`).join('\n') : 'None';
                return await sock.sendMessage(chatId, { text: `*Ignored Bots:*\n${list}`, ...channelInfo }, { quoted: message });
            }

            if (args.length < 3) return usageError(sock, chatId, channelInfo, message);
            const jid = args[2].trim();

            if (action === 'add') {
                if (!ignored.includes(jid)) {
                    ignored.push(jid);
                    await saveIgnoredBots(ignored);
                    await sock.sendMessage(chatId, { text: `✅ Added ${jid} to ignore list.`, ...channelInfo }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, { text: `⚠️ ${jid} already ignored.`, ...channelInfo }, { quoted: message });
                }
            } else if (action === 'remove') {
                const index = ignored.indexOf(jid);
                if (index !== -1) {
                    ignored.splice(index, 1);
                    await saveIgnoredBots(ignored);
                    await sock.sendMessage(chatId, { text: `✅ Removed ${jid} from ignore list.`, ...channelInfo }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, { text: `❌ ${jid} not in ignore list.`, ...channelInfo }, { quoted: message });
                }
            } else {
                usageError(sock, chatId, channelInfo, message);
            }
            return;
        }

        const rules = await getConfig();

        // list
        if (subCmd === 'list') {
            if (rules.length === 0) {
                return await sock.sendMessage(chatId, { text: 'No rules configured.', ...channelInfo }, { quoted: message });
            }
            let ruleText = rules.map((r, i) => formatRule(i + 1, r)).join('\n\n');
            await sock.sendMessage(chatId, { text: `*Auto‑forward Rules*\n\n${ruleText}`, ...channelInfo }, { quoted: message });
            return;
        }

        // show single rule by index
        if (!isNaN(parseInt(subCmd)) && args.length === 1) {
            const idx = parseInt(subCmd) - 1;
            if (idx < 0 || idx >= rules.length) {
                return await sock.sendMessage(chatId, { text: `❌ Rule #${subCmd} does not exist.`, ...channelInfo }, { quoted: message });
            }
            await sock.sendMessage(chatId, { text: `*Rule #${subCmd}*\n\n${formatRule(subCmd, rules[idx])}`, ...channelInfo }, { quoted: message });
            return;
        }

        // add <source> <target> [mode]
        if (subCmd === 'add') {
            if (args.length < 3) {
                return await sock.sendMessage(chatId, { text: '❌ Usage: .autoforward add <sourceJid> <targetJid> [mode]', ...channelInfo }, { quoted: message });
            }
            const source = args[1].trim();
            const target = args[2].trim();
            let mode = 'all';
            if (args.length >= 4) {
                mode = args[3].toLowerCase();
                if (!['all', 'owner', 'others', 'admin'].includes(mode)) {
                    return await sock.sendMessage(chatId, { text: '❌ Mode must be all, owner, others, or admin.', ...channelInfo }, { quoted: message });
                }
            }
            const newRule = { sourceJid: source, targetJid: target, enabled: true, mode };
            rules.push(newRule);
            await saveConfig(rules);
            await sock.sendMessage(chatId, { text: `✅ Rule added (index #${rules.length})\n${formatRule(rules.length, newRule)}`, ...channelInfo }, { quoted: message });
            return;
        }

        // remove <index>
        if (subCmd === 'remove') {
            if (args.length < 2) return usageError(sock, chatId, channelInfo, message);
            const idx = parseInt(args[1]) - 1;
            if (isNaN(idx) || idx < 0 || idx >= rules.length) {
                return await sock.sendMessage(chatId, { text: `❌ Invalid rule index.`, ...channelInfo }, { quoted: message });
            }
            const removed = rules.splice(idx, 1)[0];
            await saveConfig(rules);
            await sock.sendMessage(chatId, { text: `✅ Removed rule #${args[1]}\n${formatRule(args[1], removed)}`, ...channelInfo }, { quoted: message });
            return;
        }

        // edit <index> <field> <value>
        if (subCmd === 'edit') {
            if (args.length < 4) return usageError(sock, chatId, channelInfo, message);
            const idx = parseInt(args[1]) - 1;
            if (isNaN(idx) || idx < 0 || idx >= rules.length) {
                return await sock.sendMessage(chatId, { text: `❌ Invalid rule index.`, ...channelInfo }, { quoted: message });
            }
            const field = args[2].toLowerCase();
            const value = args.slice(3).join(' ');

            if (field === 'source') {
                rules[idx].sourceJid = value;
            } else if (field === 'target') {
                rules[idx].targetJid = value;
            } else if (field === 'mode') {
                if (!['all', 'owner', 'others', 'admin'].includes(value.toLowerCase())) {
                    return await sock.sendMessage(chatId, { text: '❌ Mode must be all, owner, others, or admin.', ...channelInfo }, { quoted: message });
                }
                rules[idx].mode = value.toLowerCase();
            } else if (field === 'enabled') {
                const bool = value.toLowerCase() === 'true' ? true : (value.toLowerCase() === 'false' ? false : null);
                if (bool === null) {
                    return await sock.sendMessage(chatId, { text: '❌ enabled must be true or false.', ...channelInfo }, { quoted: message });
                }
                rules[idx].enabled = bool;
            } else {
                return await sock.sendMessage(chatId, { text: '❌ Field must be source, target, mode, or enabled.', ...channelInfo }, { quoted: message });
            }

            await saveConfig(rules);
            await sock.sendMessage(chatId, { text: `✅ Rule #${args[1]} updated.\n${formatRule(args[1], rules[idx])}`, ...channelInfo }, { quoted: message });
            return;
        }

        // enable <index>
        if (subCmd === 'enable') {
            if (args.length < 2) return usageError(sock, chatId, channelInfo, message);
            const idx = parseInt(args[1]) - 1;
            if (isNaN(idx) || idx < 0 || idx >= rules.length) {
                return await sock.sendMessage(chatId, { text: `❌ Invalid rule index.`, ...channelInfo }, { quoted: message });
            }
            rules[idx].enabled = true;
            await saveConfig(rules);
            await sock.sendMessage(chatId, { text: `✅ Rule #${args[1]} enabled.\n${formatRule(args[1], rules[idx])}`, ...channelInfo }, { quoted: message });
            return;
        }

        // disable <index>
        if (subCmd === 'disable') {
            if (args.length < 2) return usageError(sock, chatId, channelInfo, message);
            const idx = parseInt(args[1]) - 1;
            if (isNaN(idx) || idx < 0 || idx >= rules.length) {
                return await sock.sendMessage(chatId, { text: `❌ Invalid rule index.`, ...channelInfo }, { quoted: message });
            }
            rules[idx].enabled = false;
            await saveConfig(rules);
            await sock.sendMessage(chatId, { text: `❌ Rule #${args[1]} disabled.\n${formatRule(args[1], rules[idx])}`, ...channelInfo }, { quoted: message });
            return;
        }

        usageError(sock, chatId, channelInfo, message);
    }
};

async function usageError(sock, chatId, channelInfo, message) {
    await sock.sendMessage(chatId, {
        text: '❌ Invalid subcommand. Use `.autoforward` to see available commands.',
        ...channelInfo
    }, { quoted: message });
}
