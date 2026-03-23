/**
 * REDXBOT302 — Games Plugin
 * tictactoe, trivia, wordle, hangman, riddles
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { fetchJson } = require('../lib/functions2');
const { getRandom } = require('../lib/functions');
const fakevCard     = require('../lib/fakevcard');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

// In-memory game state
const triviaGames  = new Map();
const hangmanGames = new Map();

module.exports = [
  // ── TRIVIA
  {
    pattern: 'trivia',
    desc: 'Play trivia quiz',
    category: 'Games',
    react: '🎯',
    use: '.trivia',
    execute: async (conn, msg, m, { from, reply }) => {
      try {
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const res = await fetchJson('https://opentdb.com/api.php?amount=1&type=multiple');
        const q   = res?.results?.[0];
        if (!q) return reply('❌ Could not fetch trivia question.');

        const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
        const labels  = ['A', 'B', 'C', 'D'];
        const correctIdx = answers.indexOf(q.correct_answer);

        triviaGames.set(from, { correct: q.correct_answer, expires: Date.now() + 30000 });

        const text = `🎯 *TRIVIA*\n\n📂 *Category:* ${q.category}\n🔥 *Difficulty:* ${q.difficulty}\n\n❓ *Question:*\n${q.question.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&')}\n\n${answers.map((a, i) => `${labels[i]}. ${a.replace(/&quot;/g,'"').replace(/&#039;/g,"'")}`).join('\n')}\n\n⏰ *30 seconds to answer! Reply A, B, C or D*\n\n> 🔥 ${BOT_NAME}`;
        await conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: fakevCard });

        // Auto-reveal answer after 30 secs
        setTimeout(async () => {
          if (triviaGames.has(from)) {
            triviaGames.delete(from);
            await conn.sendMessage(from, {
              text: `⏰ *Time's up!*\n✅ Correct answer: *${q.correct_answer}*\n\n> 🔥 ${BOT_NAME}`,
              contextInfo: ctxInfo(),
            }, { quoted: fakevCard });
          }
        }, 30000);

      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },

  // ── TRIVIA ANSWER CHECK
  {
    pattern: 'answer',
    alias: ['ans'],
    desc: 'Answer the trivia question',
    category: 'Games',
    react: '✅',
    use: '.answer A',
    execute: async (conn, msg, m, { from, q, reply, sender }) => {
      const game = triviaGames.get(from);
      if (!game) return reply('❌ No active trivia. Type *.trivia* to start!');
      if (Date.now() > game.expires) { triviaGames.delete(from); return reply('⏰ Time expired! Start a new game with *.trivia*'); }

      const ans = q.trim().toUpperCase();
      triviaGames.delete(from);

      if (ans === game.correct || ans === game.correct.toUpperCase().substring(0,1)) {
        await conn.sendMessage(from, {
          text: `🎉 *CORRECT!* Well done @${sender.split('@')[0]}!\n✅ Answer: *${game.correct}*\n\n> 🔥 ${BOT_NAME}`,
          mentions: [sender],
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
      } else {
        await conn.sendMessage(from, {
          text: `❌ *WRONG!* Better luck next time, @${sender.split('@')[0]}.\n✅ Correct: *${game.correct}*\n\n> 🔥 ${BOT_NAME}`,
          mentions: [sender],
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
      }
    },
  },

  // ── HANGMAN
  {
    pattern: 'hangman',
    desc: 'Play hangman word guessing game',
    category: 'Games',
    react: '🪓',
    use: '.hangman',
    execute: async (conn, msg, m, { from, reply }) => {
      const words = ['javascript','pakistan','elephant','computer','mountain','butterfly','telephone','birthday','chocolate','fantastic'];
      const word  = getRandom(words);
      const state = { word, guessed: [], attempts: 6 };
      hangmanGames.set(from, state);

      const display = word.split('').map(l => (state.guessed.includes(l) ? l : '_')).join(' ');
      await conn.sendMessage(from, {
        text: `🪓 *HANGMAN*\n\n${display}\n\n❤️ Lives: ${'❤️'.repeat(state.attempts)}\nGuessed: none\n\n*Guess a letter! Type .guess a*\n\n> 🔥 ${BOT_NAME}`,
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── HANGMAN GUESS
  {
    pattern: 'guess',
    desc: 'Guess a letter in hangman',
    category: 'Games',
    react: '🔤',
    use: '.guess a',
    execute: async (conn, msg, m, { from, q, reply, sender }) => {
      const game = hangmanGames.get(from);
      if (!game) return reply('❌ No hangman game! Start with *.hangman*');

      const letter = q.trim().toLowerCase()[0];
      if (!letter || !/[a-z]/.test(letter)) return reply('❌ Guess a single letter.');
      if (game.guessed.includes(letter)) return reply(`❌ Already guessed "*${letter}*"!`);

      game.guessed.push(letter);
      const display = game.word.split('').map(l => (game.guessed.includes(l) ? l : '_')).join(' ');
      const isCorrect = game.word.includes(letter);
      if (!isCorrect) game.attempts--;

      const won  = !display.includes('_');
      const lost = game.attempts <= 0;

      if (won)  { hangmanGames.delete(from); return conn.sendMessage(from, { text: `🎉 *YOU WIN!*\n\nThe word was: *${game.word}*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: fakevCard }); }
      if (lost) { hangmanGames.delete(from); return conn.sendMessage(from, { text: `💀 *GAME OVER!*\n\nThe word was: *${game.word}*\n\n> 🔥 ${BOT_NAME}`, contextInfo: ctxInfo() }, { quoted: fakevCard }); }

      await conn.sendMessage(from, {
        text: `🪓 *HANGMAN*\n\n${display}\n\n${isCorrect ? '✅ Correct!' : '❌ Wrong!'}\n❤️ Lives: ${'❤️'.repeat(game.attempts)}\n📝 Guessed: ${game.guessed.join(', ')}\n\n> 🔥 ${BOT_NAME}`,
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── RIDDLE
  {
    pattern: 'riddle',
    desc: 'Random riddle',
    category: 'Games',
    react: '🧩',
    use: '.riddle',
    execute: async (conn, msg, m, { from }) => {
      const riddles = [
        { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "An Echo" },
        { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
        { q: "I have cities, but no houses live there. I have mountains, but no trees. I have water, but no fish. What am I?", a: "A Map" },
        { q: "What has to be broken before you can use it?", a: "An Egg" },
        { q: "I'm tall when I'm young, short when I'm old. What am I?", a: "A Candle" },
        { q: "What month has 28 days?", a: "All of them!" },
      ];
      const r = getRandom(riddles);
      await conn.sendMessage(from, {
        text: `🧩 *RIDDLE*\n\n❓ ${r.q}\n\n||Answer: ${r.a}||\n\n> 🔥 ${BOT_NAME}`,
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },

  // ── SLOT MACHINE
  {
    pattern: 'slot',
    alias: ['slots'],
    desc: 'Play slot machine',
    category: 'Games',
    react: '🎰',
    use: '.slot',
    execute: async (conn, msg, m, { from, sender }) => {
      const symbols = ['🍒','🍊','🍋','🍇','🔔','💎','7️⃣','⭐'];
      const s1 = getRandom(symbols), s2 = getRandom(symbols), s3 = getRandom(symbols);
      const win = s1 === s2 && s2 === s3;
      const two = s1 === s2 || s2 === s3 || s1 === s3;

      await conn.sendMessage(from, {
        text:
`🎰 *SLOT MACHINE*

╔═══════════════╗
║  ${s1}  │  ${s2}  │  ${s3}  ║
╚═══════════════╝

${win ? '🎉 *JACKPOT! YOU WIN!* 🎉' : two ? '✨ *Two in a row! Close!*' : '❌ *No match. Try again!*'}

> 🔥 ${BOT_NAME}`,
        mentions: [sender],
        contextInfo: ctxInfo(),
      }, { quoted: fakevCard });
    },
  },
];
