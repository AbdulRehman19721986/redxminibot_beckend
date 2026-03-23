'use strict';
const axios = require('axios');
const fvc   = require('../lib/fakevcard');
const { react, pick, randInt } = require('../lib/utils');

module.exports = [
  { pattern:'joke',alias:['jokes'],desc:'Random joke',category:'fun',react:'😂',
    execute:async(conn,msg,m,{from,reply})=>{
      try{const {data}=await axios.get('https://official-joke-api.appspot.com/random_joke',{timeout:6000});conn.sendMessage(from,{text:`😂 *Joke*\n\n🎭 ${data.setup}\n🤣 ${data.punchline}`},{quoted:fvc});}
      catch{reply('❌ Failed');}
    }
  },
  { pattern:'fact',alias:['funfact'],desc:'Fun fact',category:'fun',react:'🧠',
    execute:async(conn,msg,m,{from,reply})=>{
      try{const {data}=await axios.get('https://uselessfacts.jsph.pl/random.json?language=en',{timeout:6000});conn.sendMessage(from,{text:`🧠 *Fun Fact*\n\n${data.text}`},{quoted:fvc});}
      catch{reply('❌ Failed');}
    }
  },
  { pattern:'flirt',alias:['pickup'],desc:'Flirt line',category:'fun',react:'💘',
    execute:async(conn,msg,m,{from})=>{
      const lines=['Are you a magician? Whenever I look at you everyone else disappears! ✨','Is your name Google? Because you have everything I\'ve been searching for 🔍','Are you Wi-Fi? Because I feel a strong connection 📡','Do you have a map? I keep getting lost in your eyes 👀','You must be a keyboard shortcut because you\'re just my type ⌨️'];
      conn.sendMessage(from,{text:`💘 *Flirt Line*\n\n${pick(lines)}`},{quoted:fvc});
    }
  },
  { pattern:'truth',desc:'Truth question',category:'fun',react:'❓',
    execute:async(conn,msg,m,{from})=>{
      const qs=["What's the most embarrassing thing you've done?","Have you ever lied to get out of trouble?","What's your biggest secret?","Who do you have a crush on?","What's the most childish thing you still do?","Have you ever pretended to be sick?","What's the biggest mistake you've made?","Who is the last person you stalked on social media?"];
      conn.sendMessage(from,{text:`❓ *Truth Question*\n\n${pick(qs)}`},{quoted:fvc});
    }
  },
  { pattern:'dare',desc:'Dare challenge',category:'fun',react:'🎯',
    execute:async(conn,msg,m,{from})=>{
      const ds=["Send a voice note in an accent for 30 seconds 🎙️","Change your WA status to something embarrassing for 1 hour 😅","Do 20 push-ups and send proof 💪","Call someone and sing Happy Birthday (not on their birthday) 🎂","Post a cringe photo on your story for 1 hour 📸","Say something nice to the last person you texted 💌","Do your best celebrity impression in a voice note 🎭"];
      conn.sendMessage(from,{text:`🎯 *Dare Challenge*\n\n${pick(ds)}`},{quoted:fvc});
    }
  },
  { pattern:'roast',desc:'Roast someone (fun)',category:'fun',react:'🔥',
    execute:async(conn,msg,m,{from,isGroup,reply,sender})=>{
      if(!isGroup) return reply('❌ Group only — mention someone!');
      const t=m.mentionedJid?.[0]||m.quoted?.sender;
      if(!t) return reply('❌ Mention someone to roast! 🔥');
      const roasts=["Your WiFi signal has more personality than you 📶","You're like a broken pencil — completely pointless ✏️","You're the reason shampoo has instructions 🧴","You're like Monday. Nobody likes you 📅","You're like a software update — nobody wants you, but we're stuck with you 💻","Your brain has more buffering than free WiFi in a mall 🧠","You bring everyone together… in disappointment 😔"];
      await react(conn,msg,'🔥');
      conn.sendMessage(from,{text:`🔥 *ROASTED!*\n\n@${t.split('@')[0]}: ${pick(roasts)}`,mentions:[t]},{quoted:fvc});
    }
  },
  { pattern:'simp',alias:['simpmeter'],desc:'Simp level meter',category:'fun',react:'😍',
    execute:async(conn,msg,m,{from,sender})=>{
      const t=m.mentionedJid?.[0]||sender,rate=randInt(0,100);
      const bar='😍'.repeat(Math.floor(rate/20))+'😐'.repeat(5-Math.floor(rate/20));
      conn.sendMessage(from,{text:`😍 *Simp Meter*\n\n@${t.split('@')[0]}\n[${bar}] *${rate}%*\n\n${rate>80?'💀 CERTIFIED SIMP':rate>60?'😅 Pretty Simpy':'😎 Not a Simp'}`,mentions:[t]},{quoted:fvc});
    }
  },
  { pattern:'ship',desc:'Ship two people',category:'fun',react:'💕',
    execute:async(conn,msg,m,{from,reply})=>{
      const mentions=m.mentionedJid;
      if(!mentions||mentions.length<2) return reply('❌ Mention 2 people: .ship @p1 @p2');
      const rate=randInt(0,100),bar='❤️'.repeat(Math.floor(rate/20))+'🖤'.repeat(5-Math.floor(rate/20));
      conn.sendMessage(from,{text:`💕 *Ship-O-Meter*\n\n@${mentions[0].split('@')[0]} + @${mentions[1].split('@')[0]}\n[${bar}] *${rate}%* compatible`,mentions},{quoted:fvc});
    }
  },
  { pattern:'wyr',alias:['wouldyourather'],desc:'Would you rather',category:'fun',react:'🤔',
    execute:async(conn,msg,m,{from})=>{
      const qs=[['Unlimited money but no friends','Best friends but always broke'],['Be able to fly','Be invisible'],['Live in the past','Live in the future'],['Be famous','Be powerful'],['Never use social media','Never watch TV'],['Have super strength','Have super speed']];
      const q=pick(qs);
      conn.sendMessage(from,{text:`🤔 *Would You Rather?*\n\n1️⃣ ${q[0]}\n\nOR\n\n2️⃣ ${q[1]}`},{quoted:fvc});
    }
  },
  { pattern:'compliment',desc:'Give a compliment',category:'fun',react:'💖',
    execute:async(conn,msg,m,{from})=>{
      const cs=["You light up every room you enter! ✨","Your kindness makes the world a better place 💖","You are more capable than you realize 💪","You have a heart of gold 💛","The world is better with you in it 🌍","Your smile is truly contagious 😊","You inspire everyone around you 🌟"];
      conn.sendMessage(from,{text:`💖 *Compliment*\n\n${pick(cs)}`},{quoted:fvc});
    }
  },
  { pattern:'howgay',desc:'How gay? (fun)',category:'fun',react:'🌈',
    execute:async(conn,msg,m,{from,sender})=>{
      const rate=randInt(0,100),bar='█'.repeat(Math.floor(rate/10))+'░'.repeat(10-Math.floor(rate/10));
      conn.sendMessage(from,{text:`🌈 *Gay Rate*\n\n@${sender.split('@')[0]}\n[${bar}] *${rate}%*`,mentions:[sender]},{quoted:fvc});
    }
  },
  { pattern:'rate',desc:'Rate something',category:'fun',react:'⭐',
    execute:async(conn,msg,m,{from,q})=>{
      const rate=randInt(0,100),stars='⭐'.repeat(Math.floor(rate/20));
      conn.sendMessage(from,{text:`⭐ *Rating: ${q||'you'}*\n\n${stars||'💀'} *${rate}/100*\n\n${rate>=90?'🏆 Legendary!':rate>=70?'🔥 Amazing!':rate>=50?'😊 Pretty good!':rate>=30?'😐 Average':'💀 Yikes...'}`},{quoted:fvc});
    }
  },
  { pattern:'slot',alias:['slots'],desc:'Slot machine 🎰',category:'games',react:'🎰',
    execute:async(conn,msg,m,{from})=>{
      const sym=['🍒','🍋','🍊','🍇','💎','7️⃣','🃏'],spin=()=>pick(sym);
      const s1=spin(),s2=spin(),s3=spin(),win=s1===s2&&s2===s3;
      conn.sendMessage(from,{text:`🎰 *SLOT MACHINE*\n┌──────────────┐\n│ ${s1} │ ${s2} │ ${s3} │\n└──────────────┘\n\n${win&&s1==='7️⃣'?'💰 *JACKPOT!!! 🎊*':win?'✅ *YOU WIN! 🎉*':'❌ No luck this time...'}`},{quoted:fvc});
    }
  },
  { pattern:'blackjack',alias:['bj'],desc:'Play Blackjack',category:'games',react:'🃏',
    execute:async(conn,msg,m,{from})=>{
      const cards=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],suits=['♠','♥','♦','♣'];
      const deal=()=>pick(cards)+pick(suits);
      conn.sendMessage(from,{text:`🃏 *BLACKJACK*\n\nYour hand: ${deal()} ${deal()}\nDealer shows: ${deal()}\n\n💡 Reply *hit* for card or *stand* to stay`},{quoted:fvc});
    }
  },
  { pattern:'coin',alias:['flip'],desc:'Flip a coin',category:'fun',react:'🪙',
    execute:async(conn,msg,m,{from})=>{
      conn.sendMessage(from,{text:`🪙 *Coin Flip*\n\n${Math.random()<0.5?'🪙 *HEADS*':'🔵 *TAILS*'}`},{quoted:fvc});
    }
  },
  { pattern:'roll',alias:['dice'],desc:'Roll a dice',category:'fun',react:'🎲',
    execute:async(conn,msg,m,{from,q})=>{
      const sides=parseInt(q)||6,result=randInt(1,sides);
      conn.sendMessage(from,{text:`🎲 *Dice Roll (d${sides})*\n\nResult: *${result}*`},{quoted:fvc});
    }
  },
  { pattern:'trivia',alias:['quiz'],desc:'Random trivia question',category:'fun',react:'🧩',
    execute:async(conn,msg,m,{from,reply})=>{
      try{
        await react(conn,msg,'⏳');
        const {data}=await axios.get('https://opentdb.com/api.php?amount=1&type=multiple',{timeout:8000});
        const q=data.results[0],ans=[...q.incorrect_answers,q.correct_answer].sort(()=>Math.random()-.5);
        const L=['A','B','C','D'],ci=ans.indexOf(q.correct_answer);
        let text=`🧩 *Trivia* · ${q.category} · ${q.difficulty}\n\n❓ ${q.question.replace(/&quot;/g,'"').replace(/&#039;/g,"'")}\n\n`;
        ans.forEach((a,i)=>{text+=`${L[i]}. ${a.replace(/&quot;/g,'"')}\n`;});
        text+=`\n✅ _Answer: ${L[ci]}_`;
        conn.sendMessage(from,{text},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply('❌ Failed to fetch trivia');}
    }
  },
  { pattern:'insult',desc:'Funny insult',category:'fun',react:'😈',
    execute:async(conn,msg,m,{from,reply})=>{
      try{const {data}=await axios.get('https://evilinsult.com/generate_insult.php?lang=en&type=json',{timeout:6000});conn.sendMessage(from,{text:`😈 *Insult*\n\n_${data.insult}_`},{quoted:fvc});}
      catch{reply('❌ Failed');}
    }
  },
  { pattern:'eightball',alias:['8ball'],desc:'Magic 8-Ball',category:'fun',react:'🎱',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ Ask a question! .8ball Will I win?');
      const r=pick(['✅ Definitely yes','✅ Without doubt','✅ Outlook good','🤔 Ask again later','🤔 Reply hazy','❌ Very doubtful','❌ My reply is no','❌ Don\'t count on it']);
      conn.sendMessage(from,{text:`🎱 *Magic 8-Ball*\n\n❓ ${q}\n\n${r}`},{quoted:fvc});
    }
  },
  { pattern:'quote',alias:['inspire'],desc:'Inspirational quote',category:'fun',react:'💭',
    execute:async(conn,msg,m,{from,reply})=>{
      try{const {data}=await axios.get('https://api.quotable.io/random',{timeout:6000});conn.sendMessage(from,{text:`💭 *"${data.content}"*\n\n— _${data.author}_`},{quoted:fvc});}
      catch{reply('❌ Failed');}
    }
  },
];
