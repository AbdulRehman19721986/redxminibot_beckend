/**
 * REDXBOT302 — Fun Plugin
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { fetchJson }  = require('../lib/functions2');
const { getRandom }  = require('../lib/functions');
const fakevCard      = require('../lib/fakevcard');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

const send = (conn, from, text, mentions = []) =>
  conn.sendMessage(from, { text, mentions, contextInfo: ctxInfo() }, { quoted: fakevCard });

module.exports = [
  // ── JOKE
  {
    pattern: 'joke',
    desc: 'Random joke',
    category: 'Fun',
    react: '😂',
    use: '.joke',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const data = await fetchJson('https://official-joke-api.appspot.com/random_joke');
        await send(conn, from,
`╭───[ 😂 *Random Joke* ]───
│
├ *Setup:* ${data.setup}
├ *Punchline:* ${data.punchline}
│
╰───[ > 🔥 ${BOT_NAME} ]───`);
        await conn.sendMessage(from, { react: { text: '😂', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── FACT
  {
    pattern: 'fact',
    desc: 'Random interesting fact',
    category: 'Fun',
    react: '🧠',
    use: '.fact',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const data = await fetchJson('https://uselessfacts.jsph.pl/random.json?language=en');
        await send(conn, from,
`🧠 *Random Fact*\n\n${data.text}\n\n> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── QUOTE
  {
    pattern: 'quote',
    desc: 'Inspirational quote',
    category: 'Fun',
    react: '💬',
    use: '.quote',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const data = await fetchJson('https://zenquotes.io/api/random');
        await send(conn, from,
`💬 *Quote of the Day*\n\n_"${data[0].q}"_\n\n— *${data[0].a}*\n\n> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── FLIRT
  {
    pattern: 'flirt',
    desc: 'Random flirt line',
    category: 'Fun',
    react: '💘',
    use: '.flirt',
    execute: async (conn, msg, m, { from, reply }) => {
      const lines = [
        "Are you a WiFi signal? Because I'm feeling a connection. 📶",
        "Do you have a map? I keep getting lost in your eyes. 🗺️",
        "Are you a bank loan? Because you've got my interest! 💰",
        "Do you believe in love at first text? Because you just made my heart skip. 💬",
        "Is your name Google? Because you have everything I've been searching for. 🔍",
        "You must be tired because you've been running through my mind all day. 😍",
        "Are you a camera? Every time I look at you, I smile. 📸",
      ];
      await send(conn, from, `💘 *Flirt Line*\n\n${getRandom(lines)}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── TRUTH
  {
    pattern: 'truth',
    desc: 'Truth question',
    category: 'Fun',
    react: '❓',
    use: '.truth',
    execute: async (conn, msg, m, { from }) => {
      const questions = [
        "What's the most embarrassing thing you've done in public?",
        "Have you ever lied to get out of trouble? What was it?",
        "What's the biggest secret you've kept from your parents?",
        "Who is your crush right now?",
        "What is the most childish thing you still do?",
        "Have you ever cheated on a test?",
        "What's the worst thing someone has caught you doing?",
        "What's a habit you have that you're embarrassed about?",
      ];
      await send(conn, from, `❓ *Truth Question*\n\n${getRandom(questions)}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── DARE
  {
    pattern: 'dare',
    desc: 'Dare challenge',
    category: 'Fun',
    react: '🔥',
    use: '.dare',
    execute: async (conn, msg, m, { from }) => {
      const dares = [
        "Send a voice note singing your favourite song 🎤",
        "Change your WhatsApp profile pic to something funny for 1 hour 📸",
        "Send the last photo in your gallery 🖼️",
        "Type a message with your eyes closed and send it 😂",
        "Say 5 nice things about everyone in the chat 💬",
        "Send your oldest WhatsApp message screenshot 🕰️",
        "Do 20 pushups and send a video! 💪",
      ];
      await send(conn, from, `🔥 *Dare Challenge*\n\n${getRandom(dares)}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── COIN FLIP
  {
    pattern: 'coin',
    alias: ['flip'],
    desc: 'Flip a coin',
    category: 'Fun',
    react: '🪙',
    use: '.coin',
    execute: async (conn, msg, m, { from }) => {
      const result = Math.random() < 0.5 ? '🪙 *HEADS*' : '🪙 *TAILS*';
      await send(conn, from, `*Coin Flip Result:* ${result}\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── DICE
  {
    pattern: 'dice',
    alias: ['roll'],
    desc: 'Roll a dice',
    category: 'Fun',
    react: '🎲',
    use: '.dice',
    execute: async (conn, msg, m, { from }) => {
      const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
      const val   = Math.ceil(Math.random() * 6);
      await send(conn, from, `🎲 *Dice Roll:* ${faces[val - 1]} *${val}*\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── 8BALL
  {
    pattern: '8ball',
    alias: ['magic8'],
    desc: 'Ask the magic 8 ball',
    category: 'Fun',
    react: '🎱',
    use: '.8ball will I win the lottery?',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ Ask a yes/no question!');
      const answers = [
        '✅ It is certain.', '✅ Without a doubt.', '✅ Yes, definitely!', '✅ You may rely on it.',
        '✅ As I see it, yes.', '⚠️ Reply hazy, try again.', '⚠️ Ask again later.',
        '⚠️ Cannot predict now.', '❌ Don\'t count on it.', '❌ Very doubtful.',
        '❌ My sources say no.', '❌ Outlook not so good.',
      ];
      await send(conn, from,
`🎱 *Magic 8-Ball*

*Q:* ${q}
*A:* ${getRandom(answers)}

> 🔥 ${BOT_NAME}`);
    },
  },

  // ── HOWGAY
  {
    pattern: 'howgay',
    alias: ['gayrate'],
    desc: 'Gay rate meter (fun)',
    category: 'Fun',
    react: '🌈',
    use: '.howgay @user',
    execute: async (conn, msg, m, { from, reply }) => {
      const rate = Math.floor(Math.random() * 101);
      const bar  = '█'.repeat(Math.floor(rate / 10)) + '░'.repeat(10 - Math.floor(rate / 10));
      const target = m.mentionedJid?.[0] || m.sender;
      await conn.sendMessage(from, {
        text: `🌈 *Gay Rate*\n\n@${target.split('@')[0]}\n\n[${bar}] ${rate}%\n\n> 🔥 ${BOT_NAME}`,
        mentions: [target],
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── SHIP
  {
    pattern: 'ship',
    desc: 'Ship two users',
    category: 'Fun',
    react: '💑',
    use: '.ship @user1 @user2',
    execute: async (conn, msg, m, { from, reply }) => {
      if (!m.mentionedJid || m.mentionedJid.length < 2) return reply('❌ Mention 2 users to ship!');
      const [u1, u2] = m.mentionedJid;
      const rate = Math.floor(Math.random() * 101);
      const bar  = '💗'.repeat(Math.floor(rate / 10)) + '🖤'.repeat(10 - Math.floor(rate / 10));
      await conn.sendMessage(from, {
        text:
`💑 *SHIP METER*

@${u1.split('@')[0]} 💘 @${u2.split('@')[0]}

[${bar}] ${rate}% compatible!

${rate >= 70 ? '💑 Perfect match!' : rate >= 40 ? '💛 Could work!' : '💔 Not meant to be...'}

> 🔥 ${BOT_NAME}`,
        mentions: [u1, u2],
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── ROAST
  {
    pattern: 'roast',
    desc: 'Roast a user',
    category: 'Fun',
    react: '🔥',
    use: '.roast @user',
    execute: async (conn, msg, m, { from, reply }) => {
      const target = m.mentionedJid?.[0] || m.quoted?.sender;
      if (!target) return reply('❌ Mention someone to roast!');
      const roasts = [
        "You're the human equivalent of a participation trophy. 🏆",
        "I'd agree with you but then we'd both be wrong. 🤷",
        "You're not stupid; you just have bad luck thinking. 💭",
        "If laughter is the best medicine, your face must be curing diseases. 😂",
        "I'd call you a tool, but even tools are useful. 🔧",
        "You're like a cloud. When you disappear, it's a beautiful day. ☀️",
        "You bring everyone so much joy when you leave the room. 😅",
      ];
      await conn.sendMessage(from, {
        text: `🔥 *Roast for @${target.split('@')[0]}*\n\n${getRandom(roasts)}\n\n> 🔥 ${BOT_NAME}`,
        mentions: [target],
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── COMPLIMENT
  {
    pattern: 'compliment',
    alias: ['compliment'],
    desc: 'Compliment a user',
    category: 'Fun',
    react: '💝',
    use: '.compliment @user',
    execute: async (conn, msg, m, { from, reply }) => {
      const target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;
      const compliments = [
        "You have an amazing energy that lights up any room! ✨",
        "Your intelligence is truly inspiring! 🧠",
        "You make the world a better place just by being in it! 🌍",
        "You have the best smile! 😊",
        "You're one of the kindest people I've ever met! 💝",
        "Your positivity is absolutely contagious! 🌟",
        "You're incredibly talented and don't even know it! 🎯",
      ];
      await conn.sendMessage(from, {
        text: `💝 *Compliment for @${target.split('@')[0]}*\n\n${getRandom(compliments)}\n\n> 🔥 ${BOT_NAME}`,
        mentions: [target],
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── WYR (Would You Rather)
  {
    pattern: 'wyr',
    desc: 'Would you rather question',
    category: 'Fun',
    react: '🤔',
    use: '.wyr',
    execute: async (conn, msg, m, { from }) => {
      const questions = [
        ['be able to fly', 'be invisible'],
        ['have unlimited money', 'have unlimited time'],
        ['live in the past', 'live in the future'],
        ['be famous', 'be rich but unknown'],
        ['speak all languages', 'play all instruments'],
        ['never use social media', 'never watch TV/movies'],
        ['have no enemies', 'have 100 true friends'],
      ];
      const q = getRandom(questions);
      await send(conn, from,
`🤔 *Would You Rather?*

🅰️ ${q[0]}
     OR
🅱️ ${q[1]}

> 🔥 ${BOT_NAME}`);
    },
  },

  // ── RANK
  {
    pattern: 'rank',
    desc: 'Get your random rank',
    category: 'Fun',
    react: '🏆',
    use: '.rank',
    execute: async (conn, msg, m, { from, sender }) => {
      const ranks = [
        '👑 Grand Master', '💎 Diamond', '🥇 Platinum', '🥈 Gold',
        '🥉 Silver', '⚔️ Bronze', '🛡️ Iron', '🔰 Rookie',
      ];
      const rank = getRandom(ranks);
      await conn.sendMessage(from, {
        text: `🏆 *Your Rank*\n\n@${sender.split('@')[0]}: ${rank}\n\n> 🔥 ${BOT_NAME}`,
        mentions: [sender],
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },
];
