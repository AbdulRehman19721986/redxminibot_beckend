/**
 * REDXBOT302 — Reactions Plugin
 * hug, slap, kiss, pat, bite, punch, etc.
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { fetchJson } = require('../lib/functions2');
const fakevCard     = require('../lib/fakevcard');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: `🔥 ${BOT_NAME}`,
    serverMessageId: 200,
  },
});

async function getReactionGif(type) {
  try {
    const res = await fetchJson(`https://api.waifu.pics/sfw/${type}`);
    return res?.url || null;
  } catch {
    return null;
  }
}

function makeReaction(pattern, emoji, action, sfwType) {
  return {
    pattern,
    desc: `${action} someone`,
    category: 'Reactions',
    react: emoji,
    use: `.${pattern} @user`,
    execute: async (conn, msg, m, { from, reply, sender }) => {
      try {
        const target = m.mentionedJid?.[0] || m.quoted?.sender;
        const senderName = `@${sender.split('@')[0]}`;
        const targetName = target ? `@${target.split('@')[0]}` : 'the air';
        const mentions   = target ? [sender, target] : [sender];

        await conn.sendMessage(from, { react: { text: emoji, key: msg.key } });

        const gifUrl = await getReactionGif(sfwType);

        const caption = `${emoji} *${senderName} ${action} ${targetName}!*\n\n> 🔥 ${BOT_NAME}`;

        if (gifUrl) {
          await conn.sendMessage(from, {
            video: { url: gifUrl },
            gifPlayback: true,
            caption,
            mentions,
            contextInfo: ctxInfo(),
          }, { quoted: fakevCard });
        } else {
          await conn.sendMessage(from, {
            text: caption,
            mentions,
            contextInfo: ctxInfo(),
          }, { quoted: fakevCard });
        }
      } catch (e) {
        reply(`❌ Error: ${e.message}`);
      }
    },
  };
}

module.exports = [
  makeReaction('hug',    '🤗', 'hugs',     'hug'),
  makeReaction('slap',   '👋', 'slaps',    'slap'),
  makeReaction('kiss',   '💋', 'kisses',   'kiss'),
  makeReaction('pat',    '👏', 'pats',     'pat'),
  makeReaction('bite',   '😬', 'bites',    'bite'),
  makeReaction('cuddle', '🥰', 'cuddles',  'cuddle'),
  makeReaction('poke',   '👉', 'pokes',    'poke'),
  makeReaction('wave',   '👋', 'waves at', 'wave'),
  makeReaction('dance',  '💃', 'dances with', 'dance'),
  makeReaction('wink',   '😉', 'winks at', 'wink'),
  makeReaction('blush',  '😊', 'blushes at', 'blush'),
  makeReaction('cry',    '😭', 'cries for', 'cry'),
  makeReaction('laugh',  '😂', 'laughs at', 'laugh'),
  makeReaction('smug',   '😏', 'is smug at', 'smug'),
  makeReaction('punch',  '👊', 'punches',  'punch'),

  // ── STARE (custom)
  {
    pattern: 'stare',
    desc: 'Stare at someone',
    category: 'Reactions',
    react: '👀',
    use: '.stare @user',
    execute: async (conn, msg, m, { from, reply, sender }) => {
      const target     = m.mentionedJid?.[0] || m.quoted?.sender;
      const senderName = `@${sender.split('@')[0]}`;
      const targetName = target ? `@${target.split('@')[0]}` : 'into the void';
      const mentions   = target ? [sender, target] : [sender];
      await conn.sendMessage(from, {
        text: `👀 *${senderName} is intensely staring at ${targetName}...*\n\n> 🔥 ${BOT_NAME}`,
        mentions,
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },
];
