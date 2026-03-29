'use strict';
// settings.js — used by some plugins via require('../settings')
// Reads from process.env so it stays in sync with index.js config
module.exports = {
  get botName()    { return process.env.BOT_NAME     || '🔥 REDXBOT302 🔥'; },
  get botOwner()   { return process.env.OWNER_NAME   || 'Abdul Rehman Rajpoot'; },
  get ownerNumber(){ return process.env.OWNER_NUMBER || '923009842133'; },
  get coOwner()    { return process.env.CO_OWNER     || 'Muzamil Khan'; },
  get prefix()     { return process.env.PREFIX       || '.'; },
  get mode()       { return process.env.BOT_MODE     || 'public'; },
};
