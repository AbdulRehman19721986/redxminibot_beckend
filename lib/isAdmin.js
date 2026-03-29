/**
 * REDXBOT302 v6 — isAdmin Helper
 * Checks group admin status for a sender
 */
'use strict';

/**
 * Check if sender is a group admin
 * @param {object} sock     - baileys socket
 * @param {string} chatId   - group JID
 * @param {string} senderId - sender JID
 * @returns {Promise<{isSenderAdmin:boolean, isBotAdmin:boolean, admins:string[]}>}
 */
async function isAdmin(sock, chatId, senderId) {
  try {
    if (!chatId?.endsWith('@g.us')) {
      return { isSenderAdmin: false, isBotAdmin: false, admins: [] };
    }

    const meta   = await sock.groupMetadata(chatId);
    const admins = meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => p.id);

    const botJid        = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
    const isSenderAdmin = admins.some(a => a === senderId || a.split('@')[0] === senderId.split('@')[0]);
    const isBotAdmin    = admins.some(a => a === botJid    || a.split('@')[0] === botJid.split('@')[0]);

    return { isSenderAdmin, isBotAdmin, admins };
  } catch {
    return { isSenderAdmin: false, isBotAdmin: false, admins: [] };
  }
}

module.exports = isAdmin;
