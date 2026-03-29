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

const settings = require('../settings');
const commandHandler = require('../lib/commandHandler');
const store = require('../lib/lightweight_store');
const axios = require('axios');
const { sendInteractiveMessage } = require('gifted-btns');

const MENU_IMAGE_URL = 'https://files.catbox.moe/dfseqs.jpg';

module.exports = {
    command: 'menu',
    aliases: ['help', 'cmd'],
    category: 'main',
    description: 'Show main command list and separate quick‑link buttons',
    usage: '.menu',

    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;

        try {
            // Get dynamic values from DB (with fallback to settings)
            const dynamicPrefix = await store.getSetting('global', 'prefix') || settings.prefixes[0];
            const dynamicBotName = await store.getSetting('global', 'botName') || settings.botName;
            const dynamicBotDesc = await store.getSetting('global', 'botDesc') || settings.botDesc;
            const dynamicBotDp = await store.getSetting('global', 'botDp') || settings.botDp;

            // Get runtime
            const uptimeSeconds = process.uptime();
            const hours = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = Math.floor(uptimeSeconds % 60);
            const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

            // Get bot mode
            const botMode = await store.getBotMode();

            // Total commands
            const totalCommands = commandHandler.commands.size;

            // Build menu text
            let menuText = `╭┈┄───【 *${dynamicBotName}* 】───┄┈╮\n`;
            menuText += `├■ 🤖 *Owner:* ${settings.botOwner} & ${settings.secondOwner}\n`;
            menuText += `├■ 📜 *Commands:* ${totalCommands}\n`;
            menuText += `├■ ⏱️ *Runtime:* ${uptimeString}\n`;
            menuText += `├■ 📡 *Baileys:* Multi Device\n`;
            menuText += `├■ ☁️ *Platform:* ${settings.platform.toUpperCase()}\n`;
            menuText += `├■ 📦 *Prefix:* ${dynamicPrefix}\n`;
            menuText += `├■ ⚙️ *Mode:* ${botMode}\n`;
            menuText += `├■ 🖼️ *Version:* ${settings.version}\n`;
            menuText += `├■ 📝 *About:* ${dynamicBotDesc}\n`;
            menuText += `╰───────────────┄┈╯\n\n`;

            // Categories
            const categories = Array.from(commandHandler.categories.keys()).sort();
            for (const cat of categories) {
                const cmdList = commandHandler.getCommandsByCategory(cat);
                if (cmdList.length === 0) continue;

                menuText += `『 *${cat.toUpperCase()}* 』\n`;
                menuText += `╭───────────────┄┈╮\n`;
                cmdList.forEach(cmd => {
                    menuText += `┋ ➜ *${cmd}*\n`;
                });
                menuText += `╰───────────────┄┈╯\n\n`;
            }

            menuText += `> *© Powered by REDX BOT*`;

            // Fetch image with fallback
            let imageUrl = dynamicBotDp !== 'uploaded via image' ? dynamicBotDp : MENU_IMAGE_URL;
            let imageBuffer = null;
            try {
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
                imageBuffer = Buffer.from(response.data);
            } catch (err) {
                console.error('Failed to fetch menu image:', err.message);
                // Try fallback image if the primary failed
                if (imageUrl !== MENU_IMAGE_URL) {
                    try {
                        const fallbackRes = await axios.get(MENU_IMAGE_URL, { responseType: 'arraybuffer', timeout: 10000 });
                        imageBuffer = Buffer.from(fallbackRes.data);
                    } catch (fallbackErr) {
                        console.error('Failed to fetch fallback image:', fallbackErr.message);
                    }
                }
            }

            // Send main menu – only send image if we have a buffer
            if (imageBuffer) {
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: menuText,
                    ...channelInfo
                }, { quoted: message });
            } else {
                // Send as text only
                await sock.sendMessage(chatId, {
                    text: menuText,
                    ...channelInfo
                }, { quoted: message });
            }

            // ==================== SIMPLIFIED QUICK LINKS ====================
            const quickLinkButtons = [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '👥 WhatsApp Group',
                        url: settings.whatsappGroup || 'https://chat.whatsapp.com/LhSmx2SeXX75r8I2bxsNDo'
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '💬 Telegram Group',
                        url: settings.telegramGroup || 'https://t.me/TeamRedxhacker2'
                    })
                }
            ];

            // Send quick‑links as interactive message
            await sendInteractiveMessage(sock, chatId, {
                text: '🔗 *JOIN OUR COMMUNITIES*\n\nTap the buttons below to join our WhatsApp and Telegram groups.',
                footer: 'Stay connected!',
                interactiveButtons: quickLinkButtons
            }, { quoted: message });

        } catch (error) {
            console.error('Error in menu command:', error);
            await sock.sendMessage(chatId, {
                text: '❌ An error occurred while displaying the menu.',
                ...channelInfo
            }, { quoted: message });
        }
    }
};
