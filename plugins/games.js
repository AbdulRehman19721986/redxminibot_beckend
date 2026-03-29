/**
 * REDXBOT302 v6 — Full Games Plugin
 * TicTacToe (AI & 2-player), Minesweeper, Hangman, Number Guess,
 * Word Scramble, Trivia, RPS, 8-Ball
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';

const axios  = require('axios');
const BOT_NAME = process.env.BOT_NAME || '🔥 REDXBOT302 🔥';
const NL_JID   = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});
const send = (conn, from, text, mentions = []) =>
  conn.sendMessage(from, { text, mentions, contextInfo: ctxInfo() });

// Game state maps
const tttGames    = new Map();
const hangGames   = new Map();
const numGames    = new Map();
const wordGames   = new Map();
const triviaGames = new Map();

// ── TicTacToe helpers ──────────────────────────────────────────────────
function renderBoard(b) {
  const E = b.map(c => c === 'X' ? '❌' : c === 'O' ? '⭕' : '⬜');
  return `${E[0]}${E[1]}${E[2]}\n${E[3]}${E[4]}${E[5]}\n${E[6]}${E[7]}${E[8]}`;
}
function checkWin(b, m) {
  const W = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return W.some(([a,b2,c]) => b[a]===m && b[b2]===m && b[c]===m);
}
function aiMove(b) {
  for (let i=0;i<9;i++) if(b[i]===null){b[i]='O';if(checkWin(b,'O')){b[i]=null;return i;}b[i]=null;}
  for (let i=0;i<9;i++) if(b[i]===null){b[i]='X';if(checkWin(b,'X')){b[i]=null;return i;}b[i]=null;}
  if(b[4]===null) return 4;
  const e=b.map((v,i)=>v===null?i:-1).filter(i=>i>=0);
  return e[Math.floor(Math.random()*e.length)];
}

// ── Hangman drawing ────────────────────────────────────────────────────
const HANG = [
  '  _____\n |     |\n |\n |\n |\n |_____',
  '  _____\n |     |\n |     😵\n |\n |\n |_____',
  '  _____\n |     |\n |     😵\n |     |\n |\n |_____',
  '  _____\n |     |\n |     😵\n |    /|\n |\n |_____',
  '  _____\n |     |\n |     😵\n |    /|\\\n |\n |_____',
  '  _____\n |     |\n |     😵\n |    /|\\\n |    /\n |_____',
  '  _____\n |     |\n |     😵\n |    /|\\\n |    / \\\n |_____',
];

const WORDS = ['PAKISTAN','COMPUTER','JAVASCRIPT','ALGORITHM','DATABASE','NETWORK','SECURITY','ANDROID','WHATSAPP','PROGRAMMING','DEVELOPER','REDXBOT','BAILEYS','TELEGRAM','YOUTUBE'];

module.exports = [

  // ── TICTACTOE ─────────────────────────────────────────────────────────
  {
    pattern: 'ttt', alias: ['tictactoe', 'xo'],
    desc: 'TicTacToe vs AI | .ttt start | .ttt 2p @user | .ttt <1-9>', category: 'Games',
    execute: async (conn, msg, m, { from, args, reply, sender }) => {
      const sub  = (args[0]||'').toLowerCase();
      const gKey = from;

      if (sub === 'start' || sub === 'new' || !tttGames.has(gKey)) {
        if (!['start','new'].includes(sub) && !isNaN(parseInt(sub)) && tttGames.has(gKey)) {
          // Fall through to move handling below
        } else {
          tttGames.set(gKey, { board: Array(9).fill(null), player: sender, turn: 'X', mode: 'ai' });
          return send(conn, from,
            `🎮 *TicTacToe vs AI*\n❌ You vs ⭕ Bot\n\n${renderBoard(Array(9).fill(null))}\n\nPositions:\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\nYour turn! *.ttt <1-9>*\n\n> 🔥 ${BOT_NAME}`);
        }
      }

      if (sub === '2p' || sub === 'twoplayer') {
        const opp = m.mentionedJid?.[0];
        if (!opp) return reply('❌ .ttt 2p @opponent');
        tttGames.set(gKey, { board: Array(9).fill(null), p1: sender, p2: opp, turn: 'X', mode: '2p' });
        return send(conn, from, `🎮 *TicTacToe 2-Player*\n❌ @${sender.split('@')[0]} vs ⭕ @${opp.split('@')[0]}\n\n${renderBoard(Array(9).fill(null))}\n\n❌ goes first! *.ttt <1-9>*\n\n> 🔥 ${BOT_NAME}`, [sender, opp]);
      }

      const pos  = parseInt(args[0]) - 1;
      const game = tttGames.get(gKey);
      if (!game) return reply('❌ No game! *.ttt start*');
      if (isNaN(pos)||pos<0||pos>8) return reply('❌ Choose 1-9');
      if (game.board[pos]!==null) return reply('❌ Cell taken!');

      if (game.mode === '2p') {
        const exp = game.turn==='X' ? game.p1 : game.p2;
        if (sender !== exp) return reply(`❌ @${exp.split('@')[0]}'s turn!`);
      } else { if (sender !== game.player) return reply('❌ Not your game!'); }

      game.board[pos] = game.turn;
      if (checkWin(game.board, game.turn)) {
        tttGames.delete(gKey);
        const w = game.mode==='2p' ? (game.turn==='X'?game.p1:game.p2) : (game.turn==='X'?'You':'Bot');
        return send(conn, from, `${renderBoard(game.board)}\n\n🏆 *${w==='You'?'🎉 YOU WIN!':w==='Bot'?'🤖 BOT WINS!':('@'+w.split('@')[0]+' WINS!')}*\n\nPlay again: *.ttt start*\n\n> 🔥 ${BOT_NAME}`);
      }
      if (game.board.every(c=>c!==null)) { tttGames.delete(gKey); return send(conn, from, `${renderBoard(game.board)}\n\n🤝 *DRAW!*\n\n> 🔥 ${BOT_NAME}`); }

      if (game.mode === 'ai') {
        game.turn = 'O'; const ap = aiMove([...game.board]); game.board[ap] = 'O';
        if (checkWin(game.board,'O')) { tttGames.delete(gKey); return send(conn,from,`${renderBoard(game.board)}\n\n🤖 *BOT WINS!*\n\n> 🔥 ${BOT_NAME}`); }
        if (game.board.every(c=>c!==null)) { tttGames.delete(gKey); return send(conn,from,`${renderBoard(game.board)}\n\n🤝 *DRAW!*\n\n> 🔥 ${BOT_NAME}`); }
        game.turn = 'X';
        return send(conn, from, `${renderBoard(game.board)}\n\n🤖 Bot played! Your turn *.ttt <1-9>*\n\n> 🔥 ${BOT_NAME}`);
      }
      game.turn = game.turn==='X'?'O':'X';
      const nxt = game.turn==='X'?game.p1:game.p2;
      send(conn, from, `${renderBoard(game.board)}\n\n${game.turn==='X'?'❌':'⭕'} @${nxt.split('@')[0]}'s turn! *.ttt <1-9>*\n\n> 🔥 ${BOT_NAME}`, [nxt]);
    },
  },

  // ── MINESWEEPER ───────────────────────────────────────────────────────
  {
    pattern: 'mine', alias: ['minesweeper', 'mines'],
    desc: 'Minesweeper | .mine easy/hard', category: 'Games',
    execute: async (conn, msg, m, { from, args, reply }) => {
      const diff  = (args[0]||'easy').toLowerCase();
      const size  = diff==='hard'?6:5;
      const bombs = diff==='hard'?8:5;
      const board = Array(size*size).fill(0);
      let placed  = 0;
      while (placed<bombs) { const i=Math.floor(Math.random()*size*size); if(board[i]!==-1){board[i]=-1;placed++;} }
      for (let i=0;i<size*size;i++) {
        if(board[i]===-1) continue;
        const r=Math.floor(i/size),c=i%size; let cnt=0;
        for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<size&&nc>=0&&nc<size&&board[nr*size+nc]===-1)cnt++;}
        board[i]=cnt;
      }
      const EM=['⬛','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣'];
      let disp=`💣 *Minesweeper ${diff.toUpperCase()}* — ${bombs} mines!\n\n`;
      for(let r=0;r<size;r++){for(let c=0;c<size;c++){const v=board[r*size+c];disp+=v===-1?'||💣||':`||${EM[v]}||`;}disp+='\n';}
      disp+=`\n> 🔥 ${BOT_NAME}`;
      send(conn,from,disp);
    },
  },

  // ── HANGMAN ───────────────────────────────────────────────────────────
  {
    pattern: 'hangman', alias: ['hang'],
    desc: 'Hangman word game | .hangman new | .hangman <letter>', category: 'Games',
    execute: async (conn, msg, m, { from, args, reply, sender }) => {
      const sub  = (args[0]||'').toLowerCase();
      const gKey = `${from}_${sender}`;

      if (!hangGames.has(gKey) || sub==='new') {
        const word = WORDS[Math.floor(Math.random()*WORDS.length)];
        hangGames.set(gKey,{word,guessed:[],wrong:0,max:6});
        const disp=word.split('').map(()=>'_').join(' ');
        return send(conn,from,`\`\`\`${HANG[0]}\`\`\`\n\n🔤 *HANGMAN*\n*Word:* ${disp}\n*Wrong: 0/6*\n\nGuess: *.hangman <letter>*\n\n> 🔥 ${BOT_NAME}`);
      }
      if (sub==='hint') {
        const g=hangGames.get(gKey);
        return reply(`💡 Hint: First letter *${g.word[0]}*, length *${g.word.length}*`);
      }
      const letter=sub.toUpperCase();
      if (letter.length!==1||!/[A-Z]/.test(letter)) return reply('❌ Guess one letter: .hangman A');
      const game=hangGames.get(gKey);
      if(game.guessed.includes(letter)) return reply(`❌ Already guessed "${letter}"`);
      game.guessed.push(letter);
      if(!game.word.includes(letter)) game.wrong++;
      const disp=game.word.split('').map(c=>game.guessed.includes(c)?c:'_').join(' ');
      if(!disp.includes('_')){hangGames.delete(gKey);return send(conn,from,`🎉 *YOU WIN!* Word: *${game.word}*\n\n> 🔥 ${BOT_NAME}`);}
      if(game.wrong>=game.max){hangGames.delete(gKey);return send(conn,from,`\`\`\`${HANG[6]}\`\`\`\n\n💀 *GAME OVER!* Word: *${game.word}*\n\n> 🔥 ${BOT_NAME}`);}
      send(conn,from,`\`\`\`${HANG[game.wrong]}\`\`\`\n\n*Word:* ${disp}\n*Wrong:* ${game.wrong}/${game.max}\n*Used:* ${game.guessed.join(', ')}\n\nGuess: *.hangman <letter>*\n*.hangman hint* for clue\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── NUMBER GUESS ──────────────────────────────────────────────────────
  {
    pattern: 'numguess', alias: ['guess', 'numgame'],
    desc: 'Guess 1-100 in 10 tries | .numguess new', category: 'Games',
    execute: async (conn, msg, m, { from, args, reply, sender }) => {
      const gKey = `${from}_${sender}`;
      const sub  = parseInt(args[0]);
      if (!numGames.has(gKey) || args[0]==='new') {
        numGames.set(gKey,{num:Math.floor(Math.random()*100)+1,tries:0,max:10});
        return reply(`🔢 *Number Guess!*\nI'm thinking 1-100. You have 10 tries!\n*.numguess <number>*\n\n> 🔥 ${BOT_NAME}`);
      }
      if (isNaN(sub)||sub<1||sub>100) return reply('❌ 1-100 only');
      const game=numGames.get(gKey); game.tries++;
      if(sub===game.num){numGames.delete(gKey);return reply(`🎉 *CORRECT!* ${game.num} in ${game.tries} tries!\n\n> 🔥 ${BOT_NAME}`);}
      if(game.tries>=game.max){numGames.delete(gKey);return reply(`💀 *GAME OVER!* Was: *${game.num}*\n\n> 🔥 ${BOT_NAME}`);}
      reply(`${sub<game.num?'📈 Higher!':'📉 Lower!'}\n*Tries:* ${game.tries}/${game.max}`);
    },
  },

  // ── WORD SCRAMBLE ─────────────────────────────────────────────────────
  {
    pattern: 'scramble', alias: ['wordscramble'],
    desc: 'Unscramble the word | .scramble | .scramble <answer>', category: 'Games',
    execute: async (conn, msg, m, { from, args, reply, sender }) => {
      const gKey = `${from}_${sender}`;
      const sub  = (args[0]||'').toLowerCase();

      if (wordGames.has(gKey) && sub && sub!=='new') {
        if (sub==='hint') {
          const g=wordGames.get(gKey);
          return reply(`💡 Hint: First=*${g.word[0]}* Last=*${g.word[g.word.length-1]}* Len=*${g.word.length}*`);
        }
        const game=wordGames.get(gKey);
        if (sub===game.word.toLowerCase()){wordGames.delete(gKey);return reply(`🎉 *CORRECT!* Word: *${game.word}*\n\n> 🔥 ${BOT_NAME}`);}
        return reply(`❌ Wrong! Scrambled: *${game.scrambled}*\n*.scramble hint* for a clue`);
      }
      const word = WORDS[Math.floor(Math.random()*WORDS.length)];
      const scr  = word.split('').sort(()=>Math.random()-0.5).join('');
      wordGames.set(gKey,{word,scrambled:scr});
      reply(`🔤 *Word Scramble!*\n\nUnscramble: *${scr}*\n(${word.length} letters)\n\n*.scramble <answer>*\n*.scramble hint*\n\n> 🔥 ${BOT_NAME}`);
      setTimeout(()=>{if(wordGames.has(gKey)){wordGames.delete(gKey);send(conn,from,`⏰ Time's up! Word was *${word}*`);}},120000);
    },
  },

  // ── TRIVIA ────────────────────────────────────────────────────────────
  {
    pattern: 'trivia', alias: ['quizme'],
    desc: 'Random trivia | auto-reveals in 30s | .answer A/B/C/D', category: 'Games',
    execute: async (conn, msg, m, { from, reply }) => {
      await conn.sendMessage(from,{react:{text:'❓',key:msg.key}});
      try {
        const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple',{timeout:15000});
        const q   = res.data?.results?.[0];
        if (!q) return reply('❌ No trivia found. Try again.');
        const clean = s=>s.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
        const correct = q.correct_answer;
        const opts    = [...q.incorrect_answers,correct].sort(()=>Math.random()-0.5);
        const letters = ['A','B','C','D'];
        const corrL   = letters[opts.indexOf(correct)];
        let text = `❓ *TRIVIA*\n📚 ${clean(q.category)} | ${q.difficulty.toUpperCase()}\n\n*Q:* ${clean(q.question)}\n\n`;
        text += opts.map((o,i)=>`${letters[i]}. ${clean(o)}`).join('\n');
        text += `\n\n⏰ Answer with *.answer A/B/C/D* (30s)\n\n> 🔥 ${BOT_NAME}`;
        await conn.sendMessage(from,{text,contextInfo:ctxInfo()});
        triviaGames.set(from,{correct,corrL});
        setTimeout(async()=>{if(triviaGames.has(from)){triviaGames.delete(from);await conn.sendMessage(from,{text:`⏰ *Time's up!*\n✅ Answer: *${corrL}. ${clean(correct)}*\n\n> 🔥 ${BOT_NAME}`,contextInfo:ctxInfo()});}},30000);
      } catch(e){reply(`❌ ${e.message}`);}
    },
  },
  {
    pattern: 'answer', alias: ['ans'],
    desc: 'Answer trivia | .answer A', category: 'Games',
    execute: async (conn, msg, m, { from, args, reply }) => {
      const game = triviaGames.get(from);
      if (!game) return reply('❌ No active trivia! Start with .trivia');
      const ua = (args[0]||'').toUpperCase();
      if (!['A','B','C','D'].includes(ua)) return reply('❌ Answer A, B, C or D');
      triviaGames.delete(from);
      if (ua===game.corrL) reply(`🎉 *CORRECT!* ✅\n\n> 🔥 ${BOT_NAME}`);
      else reply(`❌ *WRONG!* Correct: *${game.corrL}*\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── ROCK PAPER SCISSORS ───────────────────────────────────────────────
  {
    pattern: 'rps', alias: ['rockpaperscissors'],
    desc: 'Rock Paper Scissors vs AI', category: 'Games',
    execute: async (conn, msg, m, { from, args, reply }) => {
      const choices=['rock','paper','scissors'];
      const EM={rock:'🪨',paper:'📄',scissors:'✂️'};
      const wins={rock:'scissors',paper:'rock',scissors:'paper'};
      const u=(args[0]||'').toLowerCase();
      if (!choices.includes(u)) return reply('❌ .rps rock|paper|scissors');
      const bot=choices[Math.floor(Math.random()*3)];
      const res=u===bot?'🤝 DRAW!':wins[u]===bot?'🎉 YOU WIN!':'🤖 BOT WINS!';
      reply(`🎮 *Rock Paper Scissors*\n\nYou: ${EM[u]} ${u}\nBot: ${EM[bot]} ${bot}\n\n*${res}*\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── 8 BALL ────────────────────────────────────────────────────────────
  {
    pattern: '8ball', alias: ['8b','magic8'],
    desc: 'Magic 8-Ball | .8ball <question>', category: 'Games',
    execute: async (conn, msg, m, { from, q, reply }) => {
      if (!q) return reply('❌ .8ball <question>');
      const A=['✅ Yes!','❌ No!','🤔 Maybe...','💯 Definitely!','🚫 Absolutely Not!','🌟 Signs point to Yes!','⚠️ Very Doubtful!','💎 Without a doubt!','🔮 Ask again later...','🎯 Most Likely!','🌀 Cannot predict now','💫 It is certain!'];
      reply(`🎱 *Magic 8-Ball*\n\n❓ ${q}\n\n*${A[Math.floor(Math.random()*A.length)]}*\n\n> 🔥 ${BOT_NAME}`);
    },
  },

  // ── COIN FLIP / DICE ──────────────────────────────────────────────────
  {
    pattern: 'flip', alias: ['coinflip', 'coin'],
    desc: 'Flip a coin', category: 'Games',
    execute: async (conn, msg, m, { reply }) => {
      reply(`🪙 *Coin Flip*\n\n${Math.random()<0.5?'HEADS 🦅':'TAILS 🔵'}\n\n> 🔥 ${BOT_NAME}`);
    },
  },
  {
    pattern: 'dice', alias: ['roll', 'rolldice'],
    desc: 'Roll dice | .dice 6 (sides)', category: 'Games',
    execute: async (conn, msg, m, { args, reply }) => {
      const sides = parseInt(args[0])||6;
      const result = Math.floor(Math.random()*sides)+1;
      reply(`🎲 *Dice Roll (1-${sides})*\n\n*${result}*\n\n> 🔥 ${BOT_NAME}`);
    },
  },
  {
    pattern: 'random', alias: ['randomnum', 'rand'],
    desc: 'Random number | .random 1 100', category: 'Games',
    execute: async (conn, msg, m, { args, reply }) => {
      const min = parseInt(args[0])||1;
      const max = parseInt(args[1])||100;
      reply(`🎲 *Random Number (${min}-${max})*\n\n*${Math.floor(Math.random()*(max-min+1))+min}*\n\n> 🔥 ${BOT_NAME}`);
    },
  },
];
