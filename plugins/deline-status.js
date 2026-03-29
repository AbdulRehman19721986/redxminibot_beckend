/*****************************************************************************
 *  REDX BOT — Enhanced .status and .gstatus commands
 *  .status  — post text/image/video/audio/doc status with audience control
 *  .gstatus — post group status (reply to any media type)
 *  .statuswho — who can see your status (everyone/contacts/selected)
 *****************************************************************************/
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = [
  {
    command: 'status',
    aliases: ['story', 'updatestatus', 'setstatus'],
    category: 'owner',
    description: 'Post status: text, image, video, audio, or document',
    usage: '.status <text>  or  reply to media with .status [caption]\nOptions: .status --everyone / --contacts / --nobody',
    ownerOnly: true,
    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const channelInfo = context.channelInfo || {};

      // Parse audience flag
      let audience = null; // null = use WA default
      const filteredArgs = args.filter(a => {
        const low = a.toLowerCase();
        if (low === '--everyone') { audience = 'everyone'; return false; }
        if (low === '--contacts') { audience = 'contacts'; return false; }
        if (low === '--nobody')   { audience = 'nobody'; return false; }
        return true;
      });
      const caption = filteredArgs.join(' ');

      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const isImage  = !!quoted?.imageMessage;
      const isVideo  = !!quoted?.videoMessage;
      const isAudio  = !!(quoted?.audioMessage || quoted?.voiceMessage);
      const isDoc    = !!quoted?.documentMessage;

      // TEXT status
      if (!isImage && !isVideo && !isAudio && !isDoc) {
        if (!caption) {
          return sock.sendMessage(chatId, {
            text: `📤 *Status Upload*\n\n` +
              `• *.status <text>* — text status\n` +
              `• Reply to image + *.status [caption]* — image status\n` +
              `• Reply to video + *.status [caption]* — video status\n` +
              `• Reply to audio + *.status* — audio status\n` +
              `• Reply to document + *.status* — document status\n\n` +
              `*Audience:*\n` +
              `Add \`--everyone\`, \`--contacts\`, or \`--nobody\` at the end\n\n` +
              `Example: \`.status Good morning! --everyone\``,
            ...channelInfo
          }, { quoted: message });
        }
        try {
          const statusMsg = { text: caption };
          if (audience) statusMsg.statusJidList = audience === 'everyone' ? undefined : [];
          await sock.sendMessage('status@broadcast', statusMsg);
          await sock.sendMessage(chatId, { text: `✅ *Text status posted!*\n\n📝 "${caption}"\n${audience ? `👁️ Audience: ${audience}` : ''}`, ...channelInfo }, { quoted: message });
        } catch (e) {
          await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}`, ...channelInfo }, { quoted: message });
        }
        return;
      }

      // MEDIA status
      try {
        let mediaType = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'document';
        const msgObj = quoted?.imageMessage || quoted?.videoMessage ||
                       quoted?.audioMessage || quoted?.voiceMessage || quoted?.documentMessage;

        const stream = await downloadContentFromMessage(msgObj, mediaType === 'audio' ? 'audio' : mediaType === 'document' ? 'document' : mediaType);
        let buf = Buffer.from([]);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);

        let statusPayload = {};
        if (isImage) {
          statusPayload = { image: buf, caption: caption || '' };
        } else if (isVideo) {
          statusPayload = { video: buf, caption: caption || '', mimetype: 'video/mp4' };
        } else if (isAudio) {
          statusPayload = { audio: buf, mimetype: 'audio/mpeg', ptt: false };
        } else if (isDoc) {
          statusPayload = {
            document: buf,
            fileName: msgObj.fileName || 'document',
            mimetype: msgObj.mimetype || 'application/octet-stream',
            caption: caption || ''
          };
        }

        await sock.sendMessage('status@broadcast', statusPayload);
        await sock.sendMessage(chatId, {
          text: `✅ *${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} status posted!*\n${caption ? `📝 Caption: ${caption}` : ''}\n${audience ? `👁️ Audience: ${audience}` : ''}`,
          ...channelInfo
        }, { quoted: message });
      } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Error posting status: ${e.message}`, ...channelInfo }, { quoted: message });
      }
    }
  },
  {
    command: 'gstatus',
    aliases: ['groupstatus', 'statusgroup'],
    category: 'owner',
    description: 'Post status from group message — reply to any media',
    usage: '.gstatus [caption]  (reply to image/video/audio/document)',
    ownerOnly: true,
    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const channelInfo = context.channelInfo || {};
      const caption = args.join(' ');

      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) {
        return sock.sendMessage(chatId, {
          text: `📤 *Group Status*\n\nReply to any message (image/video/audio/doc/text) and use \`.gstatus [caption]\``,
          ...channelInfo
        }, { quoted: message });
      }

      const isText  = !!(quoted.conversation || quoted.extendedTextMessage?.text);
      const isImage = !!quoted.imageMessage;
      const isVideo = !!quoted.videoMessage;
      const isAudio = !!(quoted.audioMessage || quoted.voiceMessage);
      const isDoc   = !!quoted.documentMessage;

      try {
        if (isText) {
          const text = quoted.conversation || quoted.extendedTextMessage?.text || caption;
          await sock.sendMessage('status@broadcast', { text });
          return sock.sendMessage(chatId, { text: `✅ Text status posted!`, ...channelInfo }, { quoted: message });
        }

        let mediaType = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'document';
        const msgObj = quoted.imageMessage || quoted.videoMessage ||
                       quoted.audioMessage || quoted.voiceMessage || quoted.documentMessage;

        const stream = await downloadContentFromMessage(msgObj, mediaType === 'audio' ? 'audio' : mediaType === 'document' ? 'document' : mediaType);
        let buf = Buffer.from([]);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);

        let payload = {};
        if (isImage)      payload = { image: buf, caption: caption || msgObj.caption || '' };
        else if (isVideo) payload = { video: buf, caption: caption || msgObj.caption || '', mimetype: 'video/mp4' };
        else if (isAudio) payload = { audio: buf, mimetype: 'audio/mpeg', ptt: false };
        else if (isDoc)   payload = { document: buf, fileName: msgObj.fileName || 'file', mimetype: msgObj.mimetype || 'application/octet-stream', caption };

        await sock.sendMessage('status@broadcast', payload);
        await sock.sendMessage(chatId, { text: `✅ *${mediaType} status posted!*\n${caption ? `📝 ${caption}` : ''}`, ...channelInfo }, { quoted: message });
      } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}`, ...channelInfo }, { quoted: message });
      }
    }
  },
  {
    command: 'statuswho',
    aliases: ['setstaudiuence', 'statusprivacy'],
    category: 'owner',
    description: 'Change who can see your WhatsApp status',
    usage: '.statuswho <everyone|contacts|contactsexcept|none>',
    ownerOnly: true,
    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const channelInfo = context.channelInfo || {};
      const opt = args[0]?.toLowerCase();

      const validOpts = ['everyone', 'contacts', 'contactsexcept', 'none'];
      if (!opt || !validOpts.includes(opt)) {
        return sock.sendMessage(chatId, {
          text: `👁️ *Status Privacy*\n\nUsage: \`.statuswho <option>\`\n\nOptions:\n• \`everyone\` — Anyone can see\n• \`contacts\` — Only your contacts\n• \`contactsexcept\` — Contacts except some\n• \`none\` — Nobody`
        , ...channelInfo }, { quoted: message });
      }

      try {
        await sock.updateStatusPrivacy(opt);
        await sock.sendMessage(chatId, { text: `✅ Status privacy set to: *${opt}*`, ...channelInfo }, { quoted: message });
      } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}\n\nNote: This may require WhatsApp to support it natively.`, ...channelInfo }, { quoted: message });
      }
    }
  }
];
