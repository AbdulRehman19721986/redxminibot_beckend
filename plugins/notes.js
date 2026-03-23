/**
 * REDXBOT302 — Notes Plugin
 * Commands: savenote, getnote, delnote, listnotes
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const fs        = require('fs');
const path      = require('path');
const fakevCard = require('../lib/fakevcard');

const BOT_NAME = process.env.BOT_NAME || '🔥 REDXBOT302 🔥';
const NL_JID   = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

const NOTES_FILE = path.join(process.cwd(), 'data', 'notes.json');
function loadNotes() {
  try { return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8')); } catch { return {}; }
}
function saveNotes(data) {
  try { fs.writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2)); } catch {}
}

const send = (conn, from, text) =>
  conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: fakevCard });

module.exports = [

  {
    pattern: 'savenote',
    alias: ['note', 'addnote'],
    desc: 'Save a note for the group/chat',
    category: 'Utility',
    react: '📝',
    use: '.savenote <name> <content>',
    execute: async (conn, msg, m, { from, args, reply }) => {
      if (args.length < 2) return reply('❌ Usage: .savenote <name> <content>\nExample: .savenote rules No spam allowed!');
      const name    = args[0].toLowerCase();
      const content = args.slice(1).join(' ');
      const notes   = loadNotes();
      notes[from]   = notes[from] || {};
      notes[from][name] = { content, savedBy: m.sender, date: new Date().toISOString() };
      saveNotes(notes);
      await send(conn, from, `📝 *Note Saved!*\n\n🏷️ *Name:* ${name}\n📄 *Content:* ${content}\n\n> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  {
    pattern: 'getnote',
    alias: ['get', '#'],
    desc: 'Get a saved note',
    category: 'Utility',
    react: '📄',
    use: '.getnote <name>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide a note name.\n*Usage:* .getnote <name>');
      const notes = loadNotes();
      const note  = notes[from]?.[q.toLowerCase()];
      if (!note) return reply(`❌ No note named "${q}" found in this chat.`);
      await send(conn, from, `📄 *Note: ${q}*\n\n${note.content}\n\n> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  {
    pattern: 'listnotes',
    alias: ['notes'],
    desc: 'List all saved notes',
    category: 'Utility',
    react: '📋',
    use: '.listnotes',
    execute: async (conn, msg, m, { from }) => {
      const notes    = loadNotes();
      const chatNotes = notes[from] || {};
      const names    = Object.keys(chatNotes);
      if (names.length === 0) {
        await send(conn, from, `📋 *No notes saved yet.*\n\nUse .savenote <name> <content> to add one.\n\n> 🔥 ${BOT_NAME}`);
        return;
      }
      const list = names.map((n, i) => `  ${i+1}. *${n}*`).join('\n');
      await send(conn, from,
`╔══════[ *Notes* ]══════╗

📋 *${names.length} note(s) saved:*

${list}

💡 Use *.getnote <name>* to view

> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },

  {
    pattern: 'delnote',
    alias: ['deletenote', 'clearnote'],
    desc: 'Delete a saved note',
    category: 'Utility',
    react: '🗑️',
    use: '.delnote <name>',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Provide the note name to delete.\n*Usage:* .delnote <name>');
      const notes = loadNotes();
      if (!notes[from]?.[q.toLowerCase()]) return reply(`❌ No note named "${q}" found.`);
      delete notes[from][q.toLowerCase()];
      saveNotes(notes);
      await send(conn, from, `🗑️ *Note "${q}" deleted.*\n\n> 🔥 ${BOT_NAME}`);
      await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    },
  },
];
