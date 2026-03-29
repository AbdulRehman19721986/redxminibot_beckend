/**
 * REDXBOT302 - Fun & Entertainment Plugins
 * Category: fun
 */
const axios = require('axios');
const cat = 'fun';
const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302', serverMessageId: -1
    }
  }
};

const jokes = ['Why don\'t scientists trust atoms? They make up everything!','I asked a dog what 2 minus 2 is. He said nothing.','I\'m reading a book about anti-gravity. It\'s impossible to put down.','Why did the math book look sad? Because it had too many problems.','I told my wife she was drawing her eyebrows too high. She looked surprised.','Why can\'t you give Elsa a balloon? She\'ll let it go.','What do you call a fake noodle? An Impasta.','I invented a new word! Plagiarism.','I\'m on a seafood diet. I see food and I eat it.','What do you call a sleeping dinosaur? A dino-snore.'];
const facts = ['Honey never spoils – edible after 3000 years!','A group of flamingos is called a flamboyance.','Octopuses have three hearts.','Sharks are older than trees.','Wombat poop is cube-shaped.','A day on Venus is longer than a year on Venus.','Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.','The shortest war in history lasted 38–45 minutes.','Butterflies taste with their feet.','A snail can sleep for 3 years.'];
const truths = ['What\'s the most embarrassing thing you\'ve ever done?','Have you ever lied to your best friend?','What\'s a secret you\'ve never told anyone?','Who was your first crush?','What\'s the most childish thing you still do?','Have you ever cheated on a test?','What\'s your biggest fear?','What is something you\'re ashamed of?','Have you ever broken someone\'s heart?','What\'s the worst thing you ever said to someone?'];
const dares = ['Do 20 push-ups right now!','Send a voice message singing a song','Change your profile picture to a funny face for 1 hour','Call someone and say nothing for 30 seconds then hang up','Send a selfie making the ugliest face possible','Type a message with your elbows','Let the group write your WhatsApp status for a day'];
const flirts = ['Are you a magician? Because whenever I look at you, everyone else disappears.','Do you have a map? I keep getting lost in your eyes.','Is your name Google? Because you have everything I\'ve been searching for.','Are you a parking ticket? Because you\'ve got "fine" written all over you.','Do you believe in love at first text?'];
const wyr_q = ['Would you rather be invisible or be able to fly?','Would you rather lose all your money or lose all your contacts?','Would you rather always tell the truth or always lie?','Would you rather have unlimited battery or unlimited data?','Would you rather live in the past or the future?'];

const plugins = [

{
  command: 'joke', aliases: ['joke2', 'funny'], category: cat,
  description: 'Get a random joke', usage: '.joke',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    await sock.sendMessage(chatId, { text: `😂 *Joke of the Day*\n\n${joke}`, ...CH }, { quoted: message });
  }
},

{
  command: 'fact', aliases: ['funfact', 'facts'], category: cat,
  description: 'Get a random fun fact', usage: '.fact',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const fact = facts[Math.floor(Math.random() * facts.length)];
    await sock.sendMessage(chatId, { text: `🤯 *Fun Fact*\n\n${fact}`, ...CH }, { quoted: message });
  }
},

{
  command: 'truth', aliases: ['truthq'], category: cat,
  description: 'Get a truth question', usage: '.truth',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const q = truths[Math.floor(Math.random() * truths.length)];
    await sock.sendMessage(chatId, { text: `🫣 *Truth*\n\n${q}`, ...CH }, { quoted: message });
  }
},

{
  command: 'dare', aliases: ['dareq'], category: cat,
  description: 'Get a dare challenge', usage: '.dare',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const d = dares[Math.floor(Math.random() * dares.length)];
    await sock.sendMessage(chatId, { text: `😈 *Dare*\n\n${d}`, ...CH }, { quoted: message });
  }
},

{
  command: 'flirt', aliases: ['pickup', 'pickupline'], category: cat,
  description: 'Send a flirty pickup line', usage: '.flirt',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const f = flirts[Math.floor(Math.random() * flirts.length)];
    await sock.sendMessage(chatId, { text: `😍 *Flirt*\n\n${f}`, ...CH }, { quoted: message });
  }
},

{
  command: 'wyr', aliases: ['wouldyourather'], category: cat,
  description: 'Would you rather question', usage: '.wyr',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const q = wyr_q[Math.floor(Math.random() * wyr_q.length)];
    await sock.sendMessage(chatId, { text: `🤔 *Would You Rather?*\n\n${q}`, ...CH }, { quoted: message });
  }
},

{
  command: '8ball', aliases: ['eightball', 'magic8'], category: cat,
  description: 'Ask the magic 8-ball', usage: '.8ball <question>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const responses = ['Yes, definitely!','It is certain.','Outlook good.','Signs point to yes.','Reply hazy, try again.','Ask again later.','Don\'t count on it.','My reply is no.','Very doubtful.','Absolutely not!','Without a doubt!','Most likely yes.'];
    const q = args.join(' ');
    if (!q) return sock.sendMessage(chatId, { text: '❌ Ask a question! Usage: .8ball <your question>', ...CH }, { quoted: message });
    const ans = responses[Math.floor(Math.random() * responses.length)];
    await sock.sendMessage(chatId, { text: `🎱 *Magic 8-Ball*\n\n*Q:* ${q}\n*A:* ${ans}`, ...CH }, { quoted: message });
  }
},

{
  command: 'ship', aliases: ['love', 'lovecalc'], category: cat,
  description: 'Calculate love percentage', usage: '.ship @user1 @user2',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const pct = Math.floor(Math.random() * 101);
    const bar = '💗'.repeat(Math.floor(pct / 10)) + '🖤'.repeat(10 - Math.floor(pct / 10));
    const emoji = pct >= 80 ? '💞' : pct >= 50 ? '💕' : '💔';
    await sock.sendMessage(chatId, { text: `${emoji} *Love Calculator*\n\n${bar}\n\n*Result:* ${pct}% love! ${pct >= 80 ? 'Perfect match! 💍' : pct >= 50 ? 'Good chance! 😊' : 'Maybe just friends 😅'}`, ...CH }, { quoted: message });
  }
},

{
  command: 'rate', aliases: ['rateme'], category: cat,
  description: 'Rate something out of 10', usage: '.rate <anything>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const subject = args.join(' ') || 'you';
    const rating = Math.floor(Math.random() * 11);
    const stars = '⭐'.repeat(rating) + '☆'.repeat(10 - rating);
    await sock.sendMessage(chatId, { text: `⭐ *Rating: ${subject}*\n\n${stars}\n*Score: ${rating}/10*`, ...CH }, { quoted: message });
  }
},

{
  command: 'howgay', aliases: ['gaymeter'], category: cat,
  description: 'How gay are you?', usage: '.howgay @user',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const pct = Math.floor(Math.random() * 101);
    await sock.sendMessage(chatId, { text: `🏳️‍🌈 *Gay Meter*\n\n${'🌈'.repeat(Math.ceil(pct/10))}${'⬜'.repeat(10 - Math.ceil(pct/10))}\n*Result: ${pct}%*`, ...CH }, { quoted: message });
  }
},

{
  command: 'iq', aliases: ['iqtest'], category: cat,
  description: 'Check your IQ', usage: '.iq @user',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const iq = Math.floor(Math.random() * 201);
    const verdict = iq >= 160 ? '🧠 Genius!' : iq >= 130 ? '🤓 Very smart' : iq >= 100 ? '😊 Average' : iq >= 70 ? '😅 Below average' : '🥴 Hmm...';
    await sock.sendMessage(chatId, { text: `🧠 *IQ Test*\n\n*Score:* ${iq} IQ\n*Verdict:* ${verdict}`, ...CH }, { quoted: message });
  }
},

{
  command: 'roast', aliases: ['insult'], category: cat,
  description: 'Roast someone', usage: '.roast @user',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const roasts = ['I\'d explain it to you but I left my crayons at home.','You\'re the reason the gene pool needs a lifeguard.','I\'d agree with you but then we\'d both be wrong.','You\'re like a cloud – when you disappear, it\'s a beautiful day.','I\'d insult you, but you won\'t understand big words anyway.'];
    await sock.sendMessage(chatId, { text: `🔥 *Roasted!*\n\n${roasts[Math.floor(Math.random() * roasts.length)]}`, ...CH }, { quoted: message });
  }
},

{
  command: 'compliment', alias: ['praise'], category: cat,
  description: 'Compliment someone', usage: '.compliment @user',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const compliments = ['You are absolutely amazing!','You have the best smile!','Your creativity is incredible.','The world is a better place because of you!','You are one of the most genuine people I\'ve ever met.'];
    await sock.sendMessage(chatId, { text: `💖 *Compliment*\n\n${compliments[Math.floor(Math.random() * compliments.length)]}`, ...CH }, { quoted: message });
  }
},

{
  command: 'trivia', aliases: ['quiz'], category: cat,
  description: 'Get a random trivia question', usage: '.trivia',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const trivia = [
      { q: 'What is the capital of Japan?', a: 'Tokyo' },
      { q: 'How many bones are in the human body?', a: '206' },
      { q: 'What is the largest planet in our solar system?', a: 'Jupiter' },
      { q: 'Who wrote Romeo and Juliet?', a: 'William Shakespeare' },
      { q: 'What is the chemical symbol for water?', a: 'H₂O' },
    ];
    const t = trivia[Math.floor(Math.random() * trivia.length)];
    await sock.sendMessage(chatId, { text: `🧩 *Trivia*\n\n*Q:* ${t.q}\n\nSend your answer! The answer is: ||${t.a}||`, ...CH }, { quoted: message });
  }
},

{
  command: 'dice', aliases: ['roll'], category: cat,
  description: 'Roll a dice', usage: '.dice [sides]',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const sides = parseInt(args[0]) || 6;
    const roll = Math.floor(Math.random() * sides) + 1;
    await sock.sendMessage(chatId, { text: `🎲 *Dice Roll (${sides}-sided)*\n\nResult: *${roll}*`, ...CH }, { quoted: message });
  }
},

{
  command: 'coin', aliases: ['flip', 'coinflip'], category: cat,
  description: 'Flip a coin', usage: '.coin',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const result = Math.random() > 0.5 ? 'Heads 🪙' : 'Tails 🔵';
    await sock.sendMessage(chatId, { text: `🪙 *Coin Flip*\n\nResult: *${result}*`, ...CH }, { quoted: message });
  }
},

{
  command: 'simp', aliases: ['simpmeter'], category: cat,
  description: 'Simp meter', usage: '.simp @user',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const pct = Math.floor(Math.random() * 101);
    await sock.sendMessage(chatId, { text: `😔 *Simp Meter*\n\nSimpiness: *${pct}%*\n${pct > 80 ? '🚨 Certified Simp!' : pct > 50 ? '😅 Kinda a simp' : '😎 Not a simp!'}`, ...CH }, { quoted: message });
  }
},

{
  command: 'slot', aliases: ['slots'], category: cat,
  description: 'Play slot machine', usage: '.slot',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const items = ['🍎', '🍋', '🍇', '🔔', '⭐', '💎', '7️⃣'];
    const s = () => items[Math.floor(Math.random() * items.length)];
    const a = s(), b = s(), c = s();
    const win = a === b && b === c;
    await sock.sendMessage(chatId, { text: `🎰 *Slot Machine*\n\n| ${a} | ${b} | ${c} |\n\n${win ? '🎉 *JACKPOT! YOU WIN!*' : '😔 *No luck this time...*'}`, ...CH }, { quoted: message });
  }
},

];

module.exports = plugins;
