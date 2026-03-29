/**
 * REDXBOT302 v6 — isOwner Helper
 * Checks if a sender is the owner, co-owner, or sudo user
 */
'use strict';

const OWNER_NUM    = process.env.OWNER_NUMBER  || '923009842133';
const CO_OWNER_NUM = process.env.CO_OWNER_NUM  || '923183928892';

/**
 * Check if a JID belongs to owner / co-owner / temp sudo
 * @param {string} senderJid  - full JID  e.g. "923001234567@s.whatsapp.net"
 * @param {object} sock       - baileys socket (optional, for future DB check)
 * @param {string} chatId     - chat JID (optional)
 * @returns {Promise<boolean>}
 */
async function isOwnerOrSudo(senderJid, sock, chatId) {
  try {
    const num = (senderJid || '').split('@')[0].replace(/\D/g, '');
    if (!num) return false;

    // Check against env owners
    if (num === OWNER_NUM.replace(/\D/g, ''))    return true;
    if (num === CO_OWNER_NUM.replace(/\D/g, '')) return true;

    // Check temp owner set via .setowner command
    const tempOwner = (process.env.TEMP_OWNER || '').replace(/\D/g, '');
    if (tempOwner && num === tempOwner) return true;

    // Check store for sudo list
    try {
      const store = require('./lightweight_store');
      const sudoList = await store.getSetting('global', 'sudo_list') || [];
      if (Array.isArray(sudoList) && sudoList.includes(num)) return true;
    } catch {}

    return false;
  } catch {
    return false;
  }
}

module.exports = isOwnerOrSudo;
