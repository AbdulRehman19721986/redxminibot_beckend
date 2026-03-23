'use strict';
const fakevCard = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "© 🔥 REDXBOT302 🔥",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:REDXBOT302\nORG:Abdul Rehman Rajpoot;\nTEL;type=CELL;type=VOICE;waid=923009842133:+92 300 9842133\nEND:VCARD`
        }
    }
};
// Export both ways so all plugins work regardless of import style
module.exports = fakevCard;
module.exports.fakevCard = fakevCard;
module.exports.default = fakevCard;
