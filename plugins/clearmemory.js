const memoryManager = require('../lib/memoryManager');

module.exports = {
  command: 'clearmemory',
  aliases: ['clearcache', 'freemem'],
  category: 'owner',
  description: 'Clear all caches and free memory',
  usage: '.clearmemory',
  ownerOnly: true,
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    await memoryManager.cleanupMemory();
    await sock.sendMessage(chatId, { text: '🗑️ Memory caches cleared.' }, { quoted: message });
  }
};
