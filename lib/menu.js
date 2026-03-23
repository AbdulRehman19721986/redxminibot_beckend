'use strict';
const cfg = require('./config');

// Category definitions with emojis and display names
const CATEGORIES = [
  { id: 'ai',         name: 'ᴀɪ ᴍᴇɴᴜ',       emoji: '🤖', num: 1  },
  { id: 'owner',      name: 'ᴏᴡɴᴇʀ ᴍᴇɴᴜ',    emoji: '👑', num: 2  },
  { id: 'audio',      name: 'ᴀᴜᴅɪᴏ ᴍᴇɴᴜ',    emoji: '🎵', num: 3  },
  { id: 'fun',        name: 'ғᴜɴ ᴍᴇɴᴜ',       emoji: '🎯', num: 4  },
  { id: 'utility',    name: 'ᴜᴛɪʟɪᴛʏ ᴍᴇɴᴜ',  emoji: '⚙️', num: 5  },
  { id: 'search',     name: 'sᴇᴀʀᴄʜ ᴍᴇɴᴜ',   emoji: '🔍', num: 6  },
  { id: 'group',      name: 'ɢʀᴏᴜᴘ ᴍᴇɴᴜ',    emoji: '👥', num: 7  },
  { id: 'downloader', name: 'ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ', emoji: '📥', num: 8  },
  { id: 'other',      name: 'ᴏᴛʜᴇʀ ᴍᴇɴᴜ',    emoji: '🧩', num: 9  },
  { id: 'tools',      name: 'ᴛᴏᴏʟs ᴍᴇɴᴜ',    emoji: '🔧', num: 10 },
  { id: 'main',       name: 'ᴍᴀɪɴ ᴍᴇɴᴜ',     emoji: '🏠', num: 11 },
  { id: 'sticker',    name: 'sᴛɪᴄᴋᴇʀ ᴍᴇɴᴜ',  emoji: '🖼️', num: 12 },
  { id: 'reaction',   name: 'ʀᴇᴀᴄᴛɪᴏɴ ᴍᴇɴᴜ', emoji: '💫', num: 13 },
  { id: 'games',      name: 'ɢᴀᴍᴇs ᴍᴇɴᴜ',    emoji: '🎮', num: 14 },
  { id: 'setting',    name: 'sᴇᴛᴛɪɴɢ ᴍᴇɴᴜ',  emoji: '⚙️', num: 15 },
];

/**
 * Build the interactive select menu (.menu)
 */
function buildSelectMenu(prefix, runtime, platform, cmdCount, ownerName, ownerName2, version) {
  const p = prefix || cfg.PREFIX;
  let m = '';
  m += `╭┈───〔 *REDXBOT302* 〕┈───⊷\n`;
  m += `┆🔥 Owner: *${ownerName || cfg.OWNER_NAME}*\n`;
  if (ownerName2) m += `┆👑 Co-Owner: *${ownerName2}*\n`;
  m += `┆🪄 Prefix: *${p}*\n`;
  m += `┆🖼️ Version: *${version || cfg.VERSION}*\n`;
  m += `┆☁️ Platform: *${platform || 'Heroku'}*\n`;
  m += `┆📜 Plugins: *${cmdCount || '300'}+*\n`;
  m += `┆⏰ Runtime: *${runtime || '0h 0m 0s'}*\n`;
  m += `╰────────────────────⊷\n`;
  m += `╭───⬡ *SELECT MENU* ⬡───\n`;
  CATEGORIES.forEach(cat => {
    m += `┋ ⬡ ${cat.num} ${cat.emoji} ${cat.name}\n`;
  });
  m += `╰────────────────────⊷\n`;
  m += `> ʀᴇᴘʟʏ ᴡɪᴛʜ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴛᴏ sᴇʟᴇᴄᴛ ᴍᴇɴᴜ (1-15)`;
  return m;
}

/**
 * Build a specific category menu
 */
function buildCategoryMenu(catId, commands, prefix) {
  const p    = prefix || cfg.PREFIX;
  const cat  = CATEGORIES.find(c => c.id === catId);
  if (!cat) return '❌ Invalid category';
  const cmds = commands.filter(c => (c.category || 'other') === catId);
  if (!cmds.length) return `❌ No commands in *${cat.name}* yet`;

  let m = `╭┈───〔 *${cat.emoji} ${cat.name.toUpperCase()}* 〕┈───⊷\n`;
  m += `┆ Total: *${cmds.length} commands*\n`;
  m += `╰────────────────────⊷\n`;
  cmds.sort((a,b) => (a.pattern||'').localeCompare(b.pattern||'')).forEach(c => {
    const aliases = c.alias?.length ? ` (${c.alias.map(a=>`${p}${a}`).join(', ')})` : '';
    m += `┋ ${c.react||'▸'} *${p}${c.pattern}*${aliases}\n`;
    if (c.desc) m += `┋   _${c.desc}_\n`;
  });
  m += `╰────────────────────⊷\n`;
  m += `> 🔥 *REDXBOT302* — By Abdul Rehman Rajpoot`;
  return m;
}

/**
 * Build all-in-one menu (.allmenu)
 */
function buildAllMenu(commands, prefix, runtime, cmdCount) {
  const p = prefix || cfg.PREFIX;
  let m = `╭┈┄───【 *REDXBOT302* 】───┄┈╮\n`;
  m += `├■ 🤖 Owner: *${cfg.OWNER_NAME} & ${cfg.OWNER_NAME2}*\n`;
  m += `├■ 📜 Commands: *${cmdCount || commands.length}+*\n`;
  m += `├■ ⏱️ Runtime: *${runtime || '0h 0m 0s'}*\n`;
  m += `├■ 📡 Baileys: *Multi Device*\n`;
  m += `├■ 📦 Prefix: *${p}*\n`;
  m += `├■ 🖼️ Version: *${cfg.VERSION}*\n`;
  m += `╰───────────────┄┈╯\n\n`;

  // Group by category
  const catMap = {};
  commands.forEach(c => {
    const cat = c.category || 'other';
    if (!catMap[cat]) catMap[cat] = [];
    catMap[cat].push(c);
  });

  const catInfo = { ai:'🤖', owner:'👑', audio:'🎵', fun:'🎯', utility:'⚙️', search:'🔍', group:'👥', downloader:'📥', other:'🧩', tools:'🔧', main:'🏠', sticker:'🖼️', reaction:'💫', games:'🎮', setting:'⚙️' };

  for (const [cat, cmds] of Object.entries(catMap)) {
    const emoji = catInfo[cat] || '📂';
    m += `╭──${emoji} *${cat.toUpperCase()}* (${cmds.length})\n`;
    cmds.sort((a,b)=>(a.pattern||'').localeCompare(b.pattern||'')).forEach(c => {
      m += `┋ ▸ ${p}${c.pattern}${c.desc ? `  _${c.desc}_` : ''}\n`;
    });
    m += `╰──────────────\n\n`;
  }
  m += `> 🔥 _Powered by REDXBOT302 · ${cfg.OWNER_NAME}_`;
  return m;
}

module.exports = { CATEGORIES, buildSelectMenu, buildCategoryMenu, buildAllMenu };
