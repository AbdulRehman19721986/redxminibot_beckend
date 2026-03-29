// plugins/calc.js – CommonJS version
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = {
  command: 'calc',
  aliases: ['calculator'],
  category: 'tools',
  description: 'Evaluate a mathematical expression',
  usage: '.calc <expression>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const channelInfo = context.channelInfo || {};
    const expression = args.join(' ');

    if (!expression) {
      return sock.sendMessage(chatId, {
        text: '❌ Please provide an expression.\nExample: `.calc 2 + 2`',
        ...channelInfo
      }, { quoted: message });
    }

    try {
      // Safer evaluation using a subprocess (avoid eval)
      const { stdout, stderr } = await execPromise(`node -p "${expression.replace(/"/g, '\\"')}"`);
      if (stderr) throw new Error(stderr);
      const result = stdout.trim();

      await sock.sendMessage(chatId, {
        text: `📟 *Result:* ${result}`,
        ...channelInfo
      }, { quoted: message });
    } catch (err) {
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${err.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};
