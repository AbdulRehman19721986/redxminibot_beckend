/**
 * REDXBOT302 — Fake vCard for message quoting
 * Owner: Abdul Rehman Rajpoot
 */

const fakevCard = {
  key: {
    fromMe: false,
    participant: '0@s.whatsapp.net',
    remoteJid: 'status@broadcast',
  },
  message: {
    contactMessage: {
      displayName: '🔥 REDXBOT302',
      vcard:
        'BEGIN:VCARD\nVERSION:3.0\nFN:🔥 REDXBOT302 🔥\nORG:REDXBOT302 Team;\nTEL;type=CELL;type=VOICE;waid=923009842133:+923009842133\nEND:VCARD',
    },
  },
};

module.exports = fakevCard;
module.exports.fakevCard = fakevCard;
