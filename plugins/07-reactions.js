'use strict';
const axios = require('axios');
const fvc   = require('../lib/fakevcard');

async function sendReaction(conn, msg, from, sender, targetJid, action, emoji, apiAction) {
  try {
    const target = targetJid || sender;
    let text;
    if (targetJid && targetJid !== sender) {
      text = `@${sender.split('@')[0]} ${action} @${targetJid.split('@')[0]} ${emoji}`;
    } else {
      text = `@${sender.split('@')[0]} ${action} themselves ${emoji}`;
    }
    const { data } = await axios.get(`https://api.waifu.pics/sfw/${apiAction}`, { timeout: 10000 });
    const gifUrl = data.url;
    // Convert GIF to video buffer for WhatsApp
    const { data: gifBuf } = await axios.get(gifUrl, { responseType: 'arraybuffer', timeout: 15000 });
    await conn.sendMessage(from, {
      video: Buffer.from(gifBuf),
      caption: text,
      gifPlayback: true,
      mentions: [sender, ...(targetJid ? [targetJid] : [])].filter(Boolean),
    }, { quoted: fvc });
  } catch {
    // Fallback: send as text
    const target = targetJid;
    const text = target ? `@${sender.split('@')[0]} ${action} @${target.split('@')[0]} ${emoji}` : `@${sender.split('@')[0]} ${action} ${emoji}`;
    conn.sendMessage(from, { text, mentions: [sender, ...(target ? [target] : [])] }, { quoted: fvc });
  }
}

const makeReaction = (pattern, alias, desc, action, emoji, api) => ({
  pattern, alias, desc, category: 'reaction', react: emoji,
  execute: async (conn, msg, m, { from, sender }) => {
    const target = m.mentionedJid?.[0] || m.quoted?.sender || null;
    await sendReaction(conn, msg, from, sender, target, action, emoji, api);
  },
});

module.exports = [
  makeReaction('hug',       ['hugs'],      'Send a hug GIF',        'hugged',     '🤗',  'hug'),
  makeReaction('kiss',      ['kisses'],    'Send a kiss GIF',       'kissed',     '💋',  'kiss'),
  makeReaction('slap',      ['slaps'],     'Send a slap GIF',       'slapped',    '✊',  'slap'),
  makeReaction('pat',       ['pats'],      'Send a pat GIF',        'patted',     '🫂',  'pat'),
  makeReaction('cry',       ['cries'],     'Send a cry GIF',        'is crying',  '😢',  'cry'),
  makeReaction('cuddle',    [],            'Send a cuddle GIF',     'cuddled',    '🥰',  'cuddle'),
  makeReaction('bully',     [],            'Send a bully GIF',      'bullied',    '😈',  'bully'),
  makeReaction('wink',      ['winks'],     'Send a wink GIF',       'winked at',  '😉',  'wink'),
  makeReaction('smile',     [],            'Send a smile GIF',      'smiled at',  '😁',  'smile'),
  makeReaction('wave',      ['waves'],     'Send a wave GIF',       'waved at',   '👋',  'wave'),
  makeReaction('dance',     ['dances'],    'Send a dance GIF',      'danced with','💃',  'dance'),
  makeReaction('blush',     [],            'Send a blush GIF',      'blushed at', '😊',  'blush'),
  makeReaction('happy',     [],            'Send a happy GIF',      'is happy',   '😊',  'happy'),
  makeReaction('poke',      ['pokes'],     'Send a poke GIF',       'poked',      '👉',  'poke'),
  makeReaction('bonk',      ['bonks'],     'Send a bonk GIF',       'bonked',     '🔨',  'bonk'),
  makeReaction('bite',      ['bites'],     'Send a bite GIF',       'bit',        '🦷',  'bite'),
  makeReaction('glomp',     [],            'Send a glomp GIF',      'glomped',    '🤗',  'glomp'),
  makeReaction('nom',       ['noms'],      'Send a nom GIF',        'nommed',     '🍽️', 'nom'),
  makeReaction('yeet',      ['yeets'],     'Send a yeet GIF',       'yeeted',     '💨',  'yeet'),
  makeReaction('kill',      ['kills'],     'Send a kill GIF (fun)', 'killed',     '🔪',  'kill'),
  makeReaction('handhold',  [],            'Hold hands GIF',        'held hands with','🤝','handhold'),
  makeReaction('highfive',  [],            'High five GIF',         'high-fived', '✋',  'highfive'),
  makeReaction('lick',      ['licks'],     'Send a lick GIF',       'licked',     '👅',  'lick'),
  makeReaction('awoo',      [],            'Send an awoo GIF',      'awooed at',  '🐺',  'awoo'),
  makeReaction('smug',      [],            'Send a smug GIF',       'is smug at', '😏',  'smug'),
  makeReaction('cringe',    [],            'Send a cringe GIF',     'cringes at', '😬',  'cringe'),
];
