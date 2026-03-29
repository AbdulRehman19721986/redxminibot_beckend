/*****************************************************************************
 *                                                                           *
 *                     Developed By Abdul Rehman Rajpoot                     *
 *                     & Muzamil Khan                                        *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/AbdulRehman19721986/redxbot302          *
 *  ▶️  YouTube  : https://youtube.com/@rootmindtech                         *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10     *
 *  🔗  Telegram : https://t.me/TeamRedxhacker2                              *
 *                                                                           *
 *    © 2026 Abdul Rehman Rajpoot. All rights reserved.                      *
 *                                                                           *
 *****************************************************************************/

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  command: 'dirty',
  aliases: ['dirtyline', 'bad', 'dirtytalk', 'naughty'],
  category: 'fun',
  description: '💋 Get a random dirty line with emojis (150+ lines for educational purposes)',
  usage: '.dirty',

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;

    const lines = [
      // 🔥 Brutal / Hardcore (50+)
      "🍆 I'll pound you so hard you'll forget your own name 💦",
      "💢 Take this dick like a good little slut 🍑",
      "🔨 I'll hammer that pussy until you scream 💥",
      "🍑 Bend over – I'm gonna tear that ass apart 🥵",
      "💦 I'll cum so deep inside you it'll leak for days 💧",
      "🖕 You're gonna choke on every inch of my cock 😈",
      "🍆 I'll fuck you so rough you'll limp tomorrow 🔥",
      "💢 I own that hole – don't you forget it 🍑",
      "🔞 I'll break that pussy in half tonight 💢",
      "🥜 I'm gonna paint your face white 💦",
      "🍆 Deep throat this dick like your life depends on it 👄",
      "💢 I'll make you gag until you cry – that's my promise 😤",
      "🖕 You're my personal fleshlight, use your holes 🕳️",
      "🍑 I'll slap that ass until it's cherry red 👋",
      "💦 I'm gonna fill every hole – mouth, pussy, ass 💧",
      "🍆 I'll shove this cock so far down your throat you'll taste my balls 👄",
      "💢 You're gonna walk bow‑legged after I'm done 🚶‍♀️",
      "🔞 I'll fuck you like the whore you are – no mercy 💀",
      "🍑 I'll spread those cheeks and eat you out from behind 👅",
      "💦 I'll cum on your face and make you lick it clean 👅",
      "🖕 You're nothing but a cocksleeve – now take it 🍆",
      "🍆 I'll pound that cervix until you see stars ✨",
      "💢 I'll use your throat as a warm wet hole 👄",
      "🔞 I'll make you scream daddy while I destroy your pussy 💢",
      "🍑 I'll tie you up and use you all night long 🔗",
      "💦 I'll leave bruises on your hips from gripping so hard 🤚",
      "🍆 I'll fuck your ass raw until you bleed – you'll love it 💢",
      "🖕 You're my cum dumpster – open wide 💦",
      "💢 I'll make you beg for more while I'm choking you 🫁",
      "🍑 I'll eat your asshole like a five‑course meal 👅",
      "🔞 I'll fuck you in front of a mirror so you see yourself being ruined 🪞",
      "💦 I'll cum inside you and then watch it drip out 👀",
      "🍆 I'll slap my cock on your face before I throat‑fuck you 👋",
      "💢 I'll make you my personal porn star – cameras rolling 📹",
      "🖕 I'll use your hair as reins while I ride you from behind 🏇",
      "🍑 I'll spread you open and spit on that hole 👅",
      "💦 I'll make you squirt until you pass out 🌊",
      "🍆 I'll fuck your throat until you vomit – and then do it again 🔄",
      "💢 I'll own your holes – they belong to me now 🏷️",
      "🔞 I'll make you my little fucktoy – no safeword 🚫",
      "🍑 I'll bite your neck while I pound you from behind 🧛",
      "💦 I'll leave you dripping my cum for the whole world to see 🌍",
      "🍆 I'll shove this dick so deep you'll taste it in your throat 👄",
      "💢 I'll make you scream 'uncle' before I'm done 🫂",
      "🖕 I'll fuck you so hard the neighbors will hear 🏢",
      "🍑 I'll eat your pussy until you can't stand 👅💦",
      "💦 I'll make you swallow every last drop 👄💧",
      "🍆 I'll break you in half with my monster cock 🦖",
      "💢 I'll use your tits as a target for my load 🎯",
      "🔞 I'll make you my personal urinal – drink up 🥛",
      "🍑 I'll fuck your ass so deep you'll taste it 👅",
      "💦 I'll cover you in so much cum you'll need a shower 🚿",

      // 💋 Romantic / Dirty (100+)
      "🍆 I want to feel you tighten around me 💕",
      "👅 Let me taste your sweet nectar all night long 🌙",
      "🖕 I love the way you moan when I'm deep inside 😍",
      "💢 You're so beautiful when you're wet and ready 🥰",
      "🍑 I dream of burying my face between your thighs 🌹",
      "👄 Kiss me like you mean it – then use your tongue 👅",
      "🔥 Every inch of your body drives me wild 💫",
      "💦 I want to make you cum so hard you forget your own name 💗",
      "🍆 Let me fill you up and watch it drip down your thighs 💧",
      "🥵 You're the sexiest thing I've ever seen – let's make a mess 🛏️",
      "👅 I'll lick you from head to toe and back again 🌊",
      "💢 I love it when you grab my hair and pull me closer 💇‍♀️",
      "🍑 That ass of yours deserves all my attention 👀",
      "👄 I could kiss your lips for hours – and then move lower 😉",
      "🔥 You're so hot you make me forget my own name 🥵",
      "💦 I want to hear you scream my name while you cum 🗣️",
      "🍆 Let's get lost in each other's bodies tonight 🌌",
      "🥵 Your body is a temple and I'm here to worship 🛐",
      "👅 I'll make you tremble with just my tongue 👅",
      "💢 I love the way your hips move when you ride me 🎢",
      "🍑 I want to spank that perfect ass until it's pink 👋",
      "👄 Your lips were made for kissing… and other things 😏",
      "🔥 You set me on fire every time I touch you 🔥",
      "💦 I'll make you squirt so much you'll flood the bed 🌊",
      "🍆 I want to feel you from the inside out 💗",
      "🥵 You're my favourite addiction – can't get enough 💉",
      "👅 Let me taste your arousal on my tongue 👅",
      "💢 I love watching your face when you climax 😍",
      "🍑 I'll eat that ass like it's my last meal 🍽️",
      "👄 Spit in my mouth while I fuck you – it's so hot 💦",
      "🔥 You're the only one who can make me this hard 🍆",
      "💦 I want to see you covered in my cum – it's art 🎨",
      "🍆 Let me slide inside you slowly and feel every inch 🐌",
      "🥵 You're so tight I might explode inside you 💥",
      "👅 I'll kiss down your stomach and keep going ⬇️",
      "💢 I love the way you beg for more – so sexy 🥺",
      "🍑 That ass jiggle when I slap it drives me crazy 🍑",
      "👄 I want your lips wrapped around me right now 👄",
      "🔥 You're the only one who can handle me at my wildest 🌪️",
      "💦 I'll make you cum until you can't walk – and then carry you 🚶‍♂️",
      "🍆 I want to be buried deep inside you forever ⚰️",
      "🥵 You're so perfect I might just keep you in my bed all day 🛌",
      "👅 I'll lick every drop of sweat off your body 💧",
      "💢 I love it when you ride me reverse – that view 😍",
      "🍑 I want to spread those cheeks and dive in headfirst 🤿",
      "👄 Kiss me until I can't breathe – then kiss me more 💋",
      "🔥 You're the fire that burns in my loins 🔥",
      "💦 I'll make you cum with my fingers while I kiss you 👉👌",
      "🍆 Let me fuck you slow and deep – feel every stroke 🐢",
      "🥵 You're so fucking sexy when you're on top 🏆",
      "👅 I'll eat you out until you scream mercy 🆘",
      "💢 I love the way your body responds to my touch 🎛️",
      "🍑 I want to bite that ass and leave my mark 🦷",
      "👄 Your moans are my favourite music 🎶",
      "🔥 You make me so hard just by looking at me 👀",
      "💦 I'll cover your tits in cum and then lick them clean 👅",
      "🍆 I want to feel you clench around me when you cum 💢",
      "🥵 You're my dirty little secret – and I love it 🤫",
      "👅 I'll kiss down your spine and keep going lower ⬇️",
      "💢 I love it when you're vocal – let the world know 🗣️",
      "🍑 I'll hold your hips and pound you from behind 🍆",
      "👄 Let me suck on your nipples while I finger you 👉👌",
      "🔥 You're the only one who can satisfy my cravings 🍽️",
      "💦 I'll make you cum on my face and then kiss you 👄",
      "🍆 I want to fuck you in the shower – water and all 🚿",
      "🥵 You're so beautiful when you're wet and needy 💦",
      "👅 I'll taste you on my lips all day long 👄",
      "💢 I love the way you say my name when I'm inside you 🗣️",
      "🍑 I want to watch you play with yourself – then join in 🎮",
      "👄 I'll kiss you deeply while you stroke me 👅",
      "🔥 You're the only one who can make me this weak 🦵",
      "💦 I'll make you squirt so hard you'll hit the headboard 🛏️",
      "🍆 Let me fuck you missionary and look into your eyes 👀",
      "🥵 You're my perfect match – in bed and out 💞",
      "👅 I'll eat your pussy like it's a ripe peach 🍑",
      "💢 I love it when you grab my ass and pull me deeper 🍑",
      "🍑 I'll slap that ass and watch it ripple 👋",
      "👄 I want your lips on mine – and elsewhere 💋",
      "🔥 You're the reason I can't sleep at night 🌙",
      "💦 I'll make you cum over and over until you beg me to stop 🛑",
      "🍆 I want to feel your warmth wrapped around me 🤗",
      "🥵 You're the sexiest woman alive – and you're mine 💍",
      "👅 I'll lick your earlobe and whisper dirty things 🗣️",
      "💢 I love the way you move when I hit that spot 🎯",
      "🍑 I want to eat your ass while you ride a dildo 🍆",
      "👄 I'll kiss you hard and then go down on you 🌊",
      "🔥 You set my soul on fire – and my dick 🔥",
      "💦 I'll make you cum on my tongue and then kiss you deeply 👅",
      "🍆 Let me fuck you doggy style – that arch is perfect 🐕",
      "🥵 You're so damn hot I might just combust 💥",
      "👅 I'll taste every inch of your body – no rush 🐢",
      "💢 I love it when you're on top – you control the pace 🎮",
      "🍑 I'll spread your cheeks and dive in – hungry 👅",
      "👄 I want your mouth on me while I finger you 👉👌",
      "🔥 You're the only one who can tame my wild side 🦁",
      "💦 I'll cover you in cum and then draw pictures with it 🖌️",
      "🍆 I want to feel you cum around my cock 💢",
      "🥵 You're the best thing that ever happened to my bed 🛏️",
      "👅 I'll kiss down your body and stop at your thighs 👄",
      "💢 I love it when you tell me how much you want it 🗣️",
      "🍑 I want to hold your tits while I fuck you from behind 🍆",
      "👄 I'll kiss your neck and leave hickeys 🦷",
      "🔥 You're the only one who can make me this horny 🍆",
      "💦 I'll make you squirt on my face and then we'll 69 👅",
      "🍆 Let me fuck you against the wall – rough 🧱",
      "🥵 You're so sexy when you're covered in sweat 💧",
      "👅 I'll eat you out until you forget your own name 💫",
      "💢 I love it when you pull my hair and tell me harder 💇‍♂️",
      "🍑 I want to spank that perfect peach until you cry 🍑😭",
      "👄 I'll kiss you while I slide inside you – so intimate 💕",
      "🔥 You're the fire that never goes out 🔥",
      "💦 I'll make you cum so hard you'll see stars – literally 🌟",
      "🍆 I want to feel you milk my cock with your tightness 🥛",
      "🥵 You're my favourite kind of addiction – healthy? No. Worth it? Yes. 💯",

      // 🥵 Extra heavy (10+)
      "💢 I'll fuck you until you can't walk – then I'll carry you to bed and fuck you again 🔁",
      "🍑 I'll eat your ass for breakfast, lunch and dinner 🍽️",
      "👅 I'll make you squirt on my face and then drink it like fine wine 🍷",
      "🔥 I'll tie you up and use you like my personal sex toy – no breaks 🪢",
      "💦 I'll cum so deep inside you that you'll be pregnant with my seed for days 🤰",
      "🍆 I'll fuck your throat until you're hoarse and then fuck your pussy until you're mute 🤐",
      "🖕 I'll treat you like my personal cum dumpster – open wide and swallow 🗑️",
      "💢 I'll make you my little fuckpet – on your knees and ready 🐶",
      "🍑 I'll spread those cheeks and fuck that ass so hard you'll beg for mercy 😱",
      "🔞 I'll use your body like a canvas – painting it with my cum 🎨",
      "💦 I'll make you drink my piss while I fuck you – ultimate submission 🚽",
      "🍆 I'll fuck you in front of your friends – let them see who you belong to 👥"
    ];

    try {
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      const initialMsg = await sock.sendMessage(chatId, {
        text: '💋 Generating your dirty line...',
        ...channelInfo
      }, { quoted: message });

      await delay(800);
      await sock.relayMessage(
        chatId,
        {
          protocolMessage: {
            key: initialMsg.key,
            type: 14,
            editedMessage: { conversation: randomLine }
          }
        },
        {}
      );
    } catch (error) {
      console.error('Dirty command error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${error.message}`,
        ...channelInfo
      }, { quoted: message });
    }
  }
};
