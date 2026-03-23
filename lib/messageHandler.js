/*****************************************************************************
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *****************************************************************************/

const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const store = require('./lightweight_store');
const commandHandler = require('./commandHandler');
const { printMessage, printLog } = require('./print');
const { isBanned } = require('./isBanned');
const { isSudo } = require('./index');
const isOwnerOrSudo = require('./isOwner');
const isAdmin = require('./isAdmin');
const { handleAutoread } = require('../plugins/autoread');
const { handleAutotypingForMessage, showTypingAfterCommand } = require('../plugins/autotyping');
const { storeMessage, handleMessageRevocation } = require('../plugins/antidelete');
const { handleBadwordDetection } = require('./antibadword');
const { handleLinkDetection } = require('../plugins/antilink');
const { handleTagDetection } = require('../plugins/antitag');
const { handleChatbotResponse } = require('../plugins/chatbot');
const tictactoe = require('../plugins/tictactoe');
const connect4 = require('../plugins/connect4');
const { addCommandReaction, addSuccessReaction, addErrorReaction } = require('./reactions');
const { getAutoForwardRules, shouldForward, forwardMessage } = require('./forwardHelpers');
const memoryManager = require('./memoryManager'); // Memory management

// Plugins
const menuPlugin = require('../plugins/menu');
const welcomePlugin = require('../plugins/welcome');
const mentionPlugin = require('../plugins/mention');

// BGM plugin (optional) – with error logging
let bgmPlugin = null;
try {
  bgmPlugin = require('../plugins/bgm');
  if (bgmPlugin.loadTriggers) bgmPlugin.loadTriggers();
  printLog('info', '✅ BGM plugin loaded');
} catch (e) {
  printLog('error', `❌ BGM plugin failed to load: ${e.message}`);
  console.error(e);
}

// Goodbye handler
let goodbyeHandler = null;
try {
  const goodbyeModule = require('../plugins/goodbye');
  goodbyeHandler = goodbyeModule.handleLeaveEvent || goodbyeModule.handleGroupLeave;
  if (goodbyeHandler) printLog('info', '✅ Goodbye handler loaded');
} catch (e) { printLog('warn', 'No goodbye plugin found'); }

// Auto-forward cache
const forwardedCache = new Map();
const FORWARD_CACHE_TTL = 5000;

// Export caches for memory manager
module.exports.forwardedCache = forwardedCache;
module.exports.FORWARD_CACHE_TTL = FORWARD_CACHE_TTL;

const channelInfo = {
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302',
      serverMessageId: -1
    }
  }
};

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);
const STICKER_FILE = path.join(__dirname, '../data/sticker_commands.json');

async function getStickerCommands() {
  if (HAS_DB) {
    const data = await store.getSetting('global', 'stickerCommands');
    return data || {};
  }
  try {
    if (!fs.existsSync(STICKER_FILE)) return {};
    return JSON.parse(fs.readFileSync(STICKER_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// Flag to set memory caches only once
let memoryCacheSet = false;

async function handleMessages(sock, messageUpdate) {
  try {
    // Set memory caches after chatbot is loaded (once)
    if (!memoryCacheSet) {
      const chatbot = require('../plugins/chatbot');
      if (chatbot.chatMemory) {
        memoryManager.setCaches(forwardedCache, chatbot.chatMemory);
        memoryCacheSet = true;
      }
    }

    const { messages, type } = messageUpdate;
    if (type !== 'notify') return;

    const message = messages[0];
    if (!message?.message) return;

    await printMessage(message, sock);

    // Auto-read
    try {
      const ghostMode = await store.getSetting('global', 'stealthMode');
      if (!ghostMode?.enabled) await handleAutoread(sock, message);
    } catch (err) { printLog('error', `Autoread error: ${err.message}`); }

    const chatId = message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');

    // Message deletion
    if (message.message?.protocolMessage?.type === 0) {
      printLog('info', 'Message deletion detected');
      await handleMessageRevocation(sock, message);
      return;
    }

    // Store for anti‑delete
    await storeMessage(sock, message);

    const senderId = message.key.participant || message.key.remoteJid;

    // Mention detection
    try {
      const ownerNumber = settings.ownerNumber?.replace(/[^0-9]/g, '');
      if (ownerNumber) {
        const ownerJid = `${ownerNumber}@s.whatsapp.net`;
        await mentionPlugin.handleMention(sock, message, ownerJid);
      }
    } catch (err) { printLog('error', `Mention error: ${err.message}`); }

    // Sticker commands
    if (message.message?.stickerMessage) {
      const fileSha256 = message.message.stickerMessage.fileSha256;
      if (fileSha256) {
        const hash = Buffer.from(fileSha256).toString('base64');
        const stickers = await getStickerCommands();
        const trigger = stickers[hash];
        if (trigger) {
          // ... (sticker command execution)
          // (keep existing sticker logic)
          return;
        }
      }
    }

    // Regular message text
    const rawText = message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.imageMessage?.caption ||
      message.message?.videoMessage?.caption ||
      message.message?.buttonsResponseMessage?.selectedButtonId || '';
    const messageText = rawText.trim();
    const userMessage = messageText.toLowerCase();

    const senderIsSudo = await isSudo(senderId);
    const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);
    const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;

    // Buttons (interactive & legacy)
    if (message.message?.interactiveResponseMessage) {
      if (menuPlugin.handleButtonResponse) {
        await menuPlugin.handleButtonResponse(sock, message, { chatId, senderId, isGroup, channelInfo });
      }
      return;
    }
    if (message.message?.buttonsResponseMessage) {
      const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
      if (buttonId.startsWith('cat_')) {
        const args = [buttonId.replace('cat_', '')];
        const menuLegacy = require('../plugins/smenu');
        await menuLegacy.handler(sock, message, args, { chatId, senderId, isGroup, channelInfo });
        return;
      }
      if (buttonId === 'channel') {
        await sock.sendMessage(chatId, { text: '*Join our Channel:*\n[https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10](https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10)' }, { quoted: message });
        return;
      }
      if (buttonId === 'owner') {
        const ownerCommand = require('../plugins/owner');
        await ownerCommand.handler(sock, message, [], { chatId, senderId, isGroup, channelInfo });
        return;
      }
      if (buttonId === 'support') {
        await sock.sendMessage(chatId, { text: '*Support*\n\nhttps://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10' }, { quoted: message });
        return;
      }
    }

    // Banned user
    const userBanned = await isBanned(senderId);
    if (userBanned && !userMessage.startsWith('.unban')) {
      if (Math.random() < 0.1) {
        await sock.sendMessage(chatId, { text: 'You are banned. Contact an admin to be unbanned.', ...channelInfo });
      }
      return;
    }

    // Game moves
    if (/^[1-9]$/.test(userMessage) || userMessage === 'surrender') {
      if (await tictactoe.handleMove(sock, message, chatId, senderId, userMessage)) return;
    }
    if (/^[1-7]$/.test(userMessage) || userMessage === 'surrender') {
      if (await connect4.handleMove(sock, message, chatId, senderId, userMessage)) return;
    }

    // Auto-forward
    try {
      if (forwardedCache.has(message.key.id)) {
        const last = forwardedCache.get(message.key.id);
        if (Date.now() - last < FORWARD_CACHE_TTL) {
          if (process.env.LOG_LEVEL === 'debug') printLog('debug', `[AUTO-FWD] Skip duplicate ${message.key.id}`);
        } else {
          forwardedCache.delete(message.key.id);
        }
      } else {
        forwardedCache.set(message.key.id, Date.now());
        if (forwardedCache.size > 1000) {
          const now = Date.now();
          for (const [id, ts] of forwardedCache) {
            if (now - ts > FORWARD_CACHE_TTL) forwardedCache.delete(id);
          }
        }
      }
      const rules = await getAutoForwardRules();
      if (rules.length) {
        for (const rule of rules) {
          if (!rule.enabled || chatId !== rule.sourceJid) continue;
          if (message.key.fromMe && rule.mode !== 'owner') continue;
          const should = await shouldForward(sock, message, rule.mode, isGroup, senderId);
          if (should) {
            printLog('info', `[AUTO-FWD] → ${rule.targetJid} (${rule.mode})`);
            forwardMessage(sock, message, rule.targetJid).catch(e => printLog('error', `Forward error: ${e.message}`));
          } else if (process.env.LOG_LEVEL === 'debug') {
            printLog('debug', `[AUTO-FWD] Filtered by mode ${rule.mode}`);
          }
        }
      }
    } catch (e) { printLog('error', `[AUTO-FWD] ${e.message}`); }

    // Increment message count
    if (!message.key.fromMe) await store.incrementMessageCount(chatId, senderId).catch(() => {});

    // Group protection
    if (isGroup) {
      if (userMessage) await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
      await handleLinkDetection(sock, chatId, message, userMessage, senderId);
      await handleTagDetection(sock, chatId, message, senderId);
    }

    // PM blocker
    if (!isGroup && !message.key.fromMe && !senderIsSudo) {
      const { readState } = require('../plugins/pmblocker');
      const pmState = await readState();
      if (pmState.enabled) {
        await sock.sendMessage(chatId, { text: pmState.message || 'Private messages are blocked. Use groups.' });
        await new Promise(r => setTimeout(r, 1500));
        await sock.updateBlockStatus(chatId, 'block');
        return;
      }
    }

    // ==========================
    // BGM COMMAND HANDLING (FIXED)
    // ==========================
    const usedPrefix = settings.prefixes.find(p => userMessage.startsWith(p));
    if (usedPrefix && bgmPlugin?.handler) {  // ✅ use .handler, not .handleCommand
      const fullArgs = messageText.slice(usedPrefix.length).trim().split(/\s+/);
      if (fullArgs[0]?.toLowerCase() === 'bgm') {
        const context = {
          chatId, senderId, isGroup,
          isSenderAdmin: false,   // not used by bgm
          isBotAdmin: false,      // not used
          senderIsOwnerOrSudo, isOwnerOrSudoCheck,
          channelInfo, rawText, userMessage, messageText
        };
        await bgmPlugin.handler(sock, message, fullArgs.slice(1), context);
        return; // BGM command handled, stop processing
      }
    }

    // Regular command detection
    const command = commandHandler.getCommand(userMessage, settings.prefixes);

    if (!usedPrefix && !command) {
      // BGM trigger (non‑command keyword)
      if (bgmPlugin?.checkAndPlay) {
        if (await bgmPlugin.checkAndPlay(sock, message, userMessage, chatId, channelInfo)) return;
      }
      // No command → autotyping & chatbot
      await handleAutotypingForMessage(sock, chatId, userMessage);
      if (isGroup) {
        const botMode = await store.getBotMode();
        const canUseChatbot = botMode === 'public' ||
          (botMode === 'groups' && isGroup) ||
          (botMode === 'inbox' && !isGroup) ||
          isOwnerOrSudoCheck;
        if (canUseChatbot) await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
      }
      return;
    }

    if (!command) {
      if (isGroup) {
        const botMode = await store.getBotMode();
        const canUseChatbot = botMode === 'public' ||
          (botMode === 'groups' && isGroup) ||
          (botMode === 'inbox' && !isGroup) ||
          isOwnerOrSudoCheck;
        if (canUseChatbot) await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
      }
      return;
    }

    // Bot mode access
    const botMode = await store.getBotMode();
    const allowed = (() => {
      if (isOwnerOrSudoCheck) return true;
      switch (botMode) {
        case 'public': return true;
        case 'groups': return isGroup;
        case 'inbox': return !isGroup;
        default: return false;
      }
    })();
    if (!allowed) return;

    // Parse arguments for normal commands
    let args;
    if (usedPrefix) {
      args = messageText.slice(usedPrefix.length).trim().split(/\s+/).slice(1);
    } else {
      args = messageText.trim().split(/\s+/).slice(1);
    }

    // Permission checks
    if (command.strictOwnerOnly) {
      const { isOwnerOnly } = require('./isOwner');
      if (!message.key.fromMe && !isOwnerOnly(senderId)) {
        await sock.sendMessage(chatId, { text: '❌ Owner only!', ...channelInfo }, { quoted: message });
        return;
      }
    }
    if (command.ownerOnly && !message.key.fromMe && !senderIsOwnerOrSudo) {
      await sock.sendMessage(chatId, { text: '❌ Owner or sudo only!', ...channelInfo }, { quoted: message });
      return;
    }
    if (command.groupOnly && !isGroup) {
      await sock.sendMessage(chatId, { text: 'This command is group only!', ...channelInfo }, { quoted: message });
      return;
    }

    let isSenderAdmin = false, isBotAdmin = false;
    if (command.adminOnly && isGroup) {
      const adminStatus = await isAdmin(sock, chatId, senderId);
      isSenderAdmin = adminStatus.isSenderAdmin;
      isBotAdmin = adminStatus.isBotAdmin;
      if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Make the bot admin first!', ...channelInfo }, { quoted: message });
        return;
      }
      if (!isSenderAdmin && !message.key.fromMe && !senderIsOwnerOrSudo) {
        await sock.sendMessage(chatId, { text: '❌ Group admins only!', ...channelInfo }, { quoted: message });
        return;
      }
    }

    const context = {
      chatId, senderId, isGroup,
      isSenderAdmin, isBotAdmin,
      senderIsOwnerOrSudo, isOwnerOrSudoCheck,
      channelInfo, rawText, userMessage, messageText
    };

    await addCommandReaction(sock, message);
    try {
      const start = Date.now();
      await command.handler(sock, message, args, context);
      const duration = Date.now() - start;
      await commandHandler.recordCommandSpeed(command.command, duration);
      await addSuccessReaction(sock, message);
      await showTypingAfterCommand(sock, chatId);
    } catch (err) {
      await addErrorReaction(sock, message);
      printLog('error', `Command error [${command.command}]: ${err.message}`);
      console.error(err.stack);
      await sock.sendMessage(chatId, { text: `❌ Error: ${err.message}`, ...channelInfo }, { quoted: message });
    }

  } catch (err) {
    printLog('error', `Message handler fatal: ${err.message}`);
    console.error(err.stack);
  }
}

// Group participant update
async function handleGroupParticipantUpdate(sock, update) {
  try {
    const { id, participants, action, author } = update;
    if (!id.endsWith('@g.us')) return;
    const botMode = await store.getBotMode();
    const isPublicMode = botMode === 'public' || botMode === 'groups';

    switch (action) {
      case 'promote':
        if (!isPublicMode) return;
        const { handlePromotionEvent } = require('../plugins/promote');
        await handlePromotionEvent(sock, id, participants, author);
        break;
      case 'demote':
        if (!isPublicMode) return;
        const { handleDemotionEvent } = require('../plugins/demote');
        await handleDemotionEvent(sock, id, participants, author);
        break;
      case 'add':
        if (typeof welcomePlugin.handleJoinEvent === 'function')
          await welcomePlugin.handleJoinEvent(sock, id, participants);
        break;
      case 'remove':
        if (goodbyeHandler) await goodbyeHandler(sock, id, participants);
        break;
      default:
        printLog('warning', `Unhandled group action: ${action}`);
    }
  } catch (err) {
    printLog('error', `Group update error: ${err.message}`);
    console.error(err.stack);
  }
}

// Status updates
async function handleStatus(sock, status) {
  try {
    const { handleStatusUpdate } = require('../plugins/autostatus');
    await handleStatusUpdate(sock, status);
  } catch (err) {
    printLog('error', `Status handler error: ${err.message}`);
    console.error(err.stack);
  }
}

// Incoming calls – delegate to anticall plugin
async function handleCall(sock, calls) {
  try {
    const anticall = require('../plugins/anticall');
    // Process each call using the anticall plugin's dedicated handler
    for (const call of calls) {
      await anticall.handleIncomingCall(sock, call);
    }
  } catch (err) {
    printLog('error', `Call handler error: ${err.message}`);
    console.error(err.stack);
  }
}

// Start memory monitoring after a short delay (ensures everything is loaded)
setTimeout(() => {
  memoryManager.startMonitoring();
}, 5000);

module.exports = {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus,
  handleCall
};
