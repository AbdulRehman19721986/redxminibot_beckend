/*****************************************************************************
 *  REDX BOT — Group Join Requests (.requests, .approve, .reject)
 *  Enhanced version — number selection, bulk approve/reject
 *****************************************************************************/
module.exports = {
  command: 'requests',
  aliases: ['joinreqs', 'pendingreqs', 'gcreq'],
  category: 'group',
  description: 'View, approve or reject group join requests',
  usage: '.requests\n.approve all / .approve <number>\n.reject all / .reject <number>',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const channelInfo = context.channelInfo || {};
    const rawCmd = (context.rawText || '').toLowerCase().split(' ')[0].replace(/[.,!]/, '');

    const isApprove = rawCmd.includes('approve');
    const isReject  = rawCmd.includes('reject');

    try {
      const pendingList = await sock.groupRequestParticipantsList(chatId);
      const pending = pendingList || [];

      // .requests — list pending
      if (!isApprove && !isReject) {
        if (!pending.length) {
          return sock.sendMessage(chatId, { text: `✅ No pending join requests.`, ...channelInfo }, { quoted: message });
        }
        let text = `📋 *Pending Join Requests (${pending.length})*\n\n`;
        pending.forEach((p, i) => {
          const num = p.jid?.split('@')[0] || p.id?.split('@')[0] || 'Unknown';
          text += `*${i + 1}.* +${num}\n`;
        });
        text += `\n*Actions:*\n• \`.approve all\` — approve everyone\n• \`.approve <n>\` — approve by number\n• \`.reject all\` — reject everyone\n• \`.reject <n>\` — reject by number`;

        // Store for number selection
        const pendingKey = `reqlist_${chatId}`;
        global._reqPending = global._reqPending || new Map();
        global._reqPending.set(pendingKey, { list: pending, expires: Date.now() + 120000 });

        return sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
      }

      const subArg = args[0]?.toLowerCase();

      // Bulk approve/reject
      if (subArg === 'all') {
        const jids = pending.map(p => p.jid || p.id);
        if (!jids.length) return sock.sendMessage(chatId, { text: `✅ No pending requests.`, ...channelInfo }, { quoted: message });
        if (isApprove) {
          await sock.groupRequestParticipantsUpdate(chatId, jids, 'approve');
          return sock.sendMessage(chatId, { text: `✅ Approved *${jids.length}* join request(s).`, ...channelInfo }, { quoted: message });
        } else {
          await sock.groupRequestParticipantsUpdate(chatId, jids, 'reject');
          return sock.sendMessage(chatId, { text: `❌ Rejected *${jids.length}* join request(s).`, ...channelInfo }, { quoted: message });
        }
      }

      // By number
      const num = parseInt(subArg);
      if (!isNaN(num)) {
        // Try from stored list first
        const stored = global._reqPending?.get(`reqlist_${chatId}`);
        const list = stored && Date.now() < stored.expires ? stored.list : pending;
        const target = list[num - 1];
        if (!target) return sock.sendMessage(chatId, { text: `❌ Invalid number. Use \`.requests\` to see the list.`, ...channelInfo }, { quoted: message });
        const jid = target.jid || target.id;
        const action = isApprove ? 'approve' : 'reject';
        await sock.groupRequestParticipantsUpdate(chatId, [jid], action);
        const shortNum = jid.split('@')[0];
        return sock.sendMessage(chatId, {
          text: `${isApprove ? '✅ Approved' : '❌ Rejected'}: *+${shortNum}*`,
          ...channelInfo
        }, { quoted: message });
      }

      return sock.sendMessage(chatId, {
        text: `❌ Usage:\n• \`.requests\` — list pending\n• \`.approve all\` — approve all\n• \`.approve <n>\` — approve by number\n• \`.reject all\` — reject all\n• \`.reject <n>\` — reject by number`,
        ...channelInfo
      }, { quoted: message });

    } catch (e) {
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${e.message}\n\nMake sure I am admin and the group has join-approval enabled.`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};
