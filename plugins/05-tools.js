'use strict';
const axios = require('axios');
const fvc   = require('../lib/fakevcard');
const { react } = require('../lib/utils');

module.exports = [
  { pattern:'calc',alias:['math'],desc:'Calculator',category:'utility',react:'🧮',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .calc 2+2*5');
      try{
        const r=Function('"use strict";return('+q.replace(/[^0-9+\-*/.()% ]/g,'')+')()')();
        conn.sendMessage(from,{text:`🧮 *Calculator*\n\`${q}\` = \`${r}\``},{quoted:fvc});
      }catch{reply('❌ Invalid expression');}
    }
  },
  { pattern:'weather',desc:'City weather info',category:'utility',react:'🌤️',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .weather Karachi');
      await react(conn,msg,'⏳');
      try{
        const {data}=await axios.get(`https://wttr.in/${encodeURIComponent(q)}?format=j1`,{timeout:10000});
        const c=data.current_condition[0],a=data.nearest_area[0];
        conn.sendMessage(from,{text:`🌤️ *${a.areaName[0].value}, ${a.country[0].value}*\n\n🌡️ Temp: *${c.temp_C}°C / ${c.temp_F}°F*\n☁️ ${c.weatherDesc[0].value}\n💧 Humidity: *${c.humidity}%*\n💨 Wind: *${c.windspeedKmph} km/h*\n👁️ Visibility: *${c.visibility} km*`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply('❌ Failed. Try: .weather London');}
    }
  },
  { pattern:'define',alias:['dict','dictionary'],desc:'Word definition',category:'utility',react:'📖',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .define serendipity');
      try{
        const {data}=await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`,{timeout:8000});
        const mn=data[0].meanings[0],def=mn.definitions[0];
        conn.sendMessage(from,{text:`📖 *${data[0].word}* _(${mn.partOfSpeech})_\n\n${def.definition}${def.example?`\n\n💬 _"${def.example}"_`:''}`},{quoted:fvc});
      }catch{reply(`❌ Word "${q}" not found`);}
    }
  },
  { pattern:'qr',alias:['qrcode'],desc:'Generate QR code',category:'utility',react:'🔳',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .qr https://example.com');
      await react(conn,msg,'⏳');
      try{
        conn.sendMessage(from,{image:{url:`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(q)}`},caption:`🔳 *QR Code*\n📝 ${q.slice(0,80)}`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply('❌ QR generation failed');}
    }
  },
  { pattern:'wiki',alias:['wikipedia'],desc:'Search Wikipedia',category:'search',react:'📚',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .wiki Pakistan');
      await react(conn,msg,'⏳');
      try{
        const {data}=await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`,{timeout:8000});
        conn.sendMessage(from,{text:`📚 *${data.title}*\n\n${(data.extract||'').slice(0,500)}\n\n🔗 ${data.content_urls?.desktop?.page||''}`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply(`❌ "${q}" not found`);}
    }
  },
  { pattern:'ss',alias:['screenshot','webss'],desc:'Screenshot a website',category:'utility',react:'📸',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .ss https://google.com');
      if(!q.startsWith('http')) q='https://'+q;
      await react(conn,msg,'⏳');
      try{
        conn.sendMessage(from,{image:{url:`https://image.thum.io/get/width/1280/crop/900/${q}`},caption:`📸 *Screenshot*\n🌐 ${q}`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply('❌ Screenshot failed');}
    }
  },
  { pattern:'shorturl',alias:['tiny','tinyurl'],desc:'Shorten URL',category:'utility',react:'🔗',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q||!q.startsWith('http')) return reply('❌ .shorturl https://example.com');
      try{
        const {data}=await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(q)}`,{timeout:8000});
        conn.sendMessage(from,{text:`🔗 *Shortened URL*\n📎 ${q.slice(0,60)}\n✅ ${data}`},{quoted:fvc});
      }catch{reply('❌ Failed');}
    }
  },
  { pattern:'tts',alias:['speak'],desc:'Text to speech',category:'utility',react:'🔊',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .tts Hello World');
      await react(conn,msg,'⏳');
      try{
        conn.sendMessage(from,{audio:{url:`https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(q)}`},mimetype:'audio/mpeg',ptt:true},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply('❌ TTS failed');}
    }
  },
  { pattern:'imdb',alias:['movie'],desc:'Movie info from IMDB',category:'search',react:'🎬',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .imdb Avengers');
      await react(conn,msg,'⏳');
      try{
        const {data}=await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(q)}&apikey=trilogy`,{timeout:8000});
        if(data.Response==='False') return reply(`❌ Movie "${q}" not found`);
        conn.sendMessage(from,{text:`🎬 *${data.Title}* (${data.Year})\n\n⭐ IMDb: *${data.imdbRating}/10*\n🕐 Runtime: *${data.Runtime}*\n📌 Genre: ${data.Genre}\n📝 ${data.Plot}\n🎭 Cast: ${data.Actors}`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply('❌ IMDB search failed');}
    }
  },
  { pattern:'crypto',desc:'Crypto price',category:'utility',react:'💰',
    execute:async(conn,msg,m,{from,q,reply})=>{
      const coin=(q||'bitcoin').toLowerCase();
      await react(conn,msg,'⏳');
      try{
        const {data}=await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,pkr&include_24hr_change=true`,{timeout:8000});
        if(!data[coin]) return reply(`❌ Coin "${coin}" not found`);
        const c=data[coin],ch=c.usd_24h_change?.toFixed(2);
        conn.sendMessage(from,{text:`💰 *${coin.toUpperCase()}*\n\n💵 USD: *$${c.usd?.toLocaleString()}*\n🇵🇰 PKR: *₨${c.pkr?.toLocaleString()}*\n${ch>0?'📈':'📉'} 24h: *${ch}%*`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply(`❌ Price fetch failed`);}
    }
  },
  { pattern:'github',alias:['git'],desc:'GitHub user/repo info',category:'search',react:'🐙',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .github username OR .github user/repo');
      await react(conn,msg,'⏳');
      try{
        const url=q.includes('/')?`https://api.github.com/repos/${q}`:`https://api.github.com/users/${q}`;
        const {data}=await axios.get(url,{timeout:8000,headers:{'User-Agent':'REDXBOT302'}});
        const msg2=q.includes('/')?`🐙 *${data.full_name}*\n📝 ${data.description||'No description'}\n⭐ ${data.stargazers_count} stars\n🔀 ${data.forks_count} forks\n🌐 ${data.html_url}`:`👤 *${data.name||data.login}*\n📝 ${data.bio||'No bio'}\n📦 ${data.public_repos} repos\n👥 ${data.followers} followers\n🌐 ${data.html_url}`;
        conn.sendMessage(from,{text:msg2},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply(`❌ GitHub "${q}" not found`);}
    }
  },
  { pattern:'lyrics',desc:'Song lyrics',category:'search',react:'🎵',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .lyrics Shape of You');
      await react(conn,msg,'⏳');
      try{
        const {data}=await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(q)}`,{timeout:10000});
        if(!data.lyrics) return reply(`❌ Lyrics not found for "${q}"`);
        conn.sendMessage(from,{text:`🎵 *${data.title||q}*\n👤 ${data.author||'Unknown'}\n\n${data.lyrics.slice(0,2000)}`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply('❌ Lyrics not found');}
    }
  },
  { pattern:'pokedex',alias:['pokemon','poke'],desc:'Pokémon info',category:'search',react:'🎮',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .pokedex pikachu');
      await react(conn,msg,'⏳');
      try{
        const {data}=await axios.get(`https://pokeapi.co/api/v2/pokemon/${q.toLowerCase()}`,{timeout:8000});
        conn.sendMessage(from,{image:{url:data.sprites.other['official-artwork']?.front_default||data.sprites.front_default},caption:`🎮 *#${data.id} ${data.name.toUpperCase()}*\n\n🏷️ Types: ${data.types.map(t=>t.type.name).join(', ')}\n📏 Height: ${data.height/10}m | ⚖️ Weight: ${data.weight/10}kg`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply(`❌ Pokémon "${q}" not found`);}
    }
  },
  { pattern:'styletext',alias:['fancy','fancy-text'],desc:'Fancy text styles',category:'utility',react:'✨',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .styletext Hello');
      const styles=[
        {name:'𝗕𝗼𝗹𝗱',fn:c=>{const n=c.charCodeAt(0);if(n>=65&&n<=90)return String.fromCodePoint(n+120211);if(n>=97&&n<=122)return String.fromCodePoint(n+120205);return c;}},
        {name:'𝘐𝘵𝘢𝘭𝘪𝘤',fn:c=>{const n=c.charCodeAt(0);if(n>=65&&n<=90)return String.fromCodePoint(n+120263);if(n>=97&&n<=122)return String.fromCodePoint(n+120257);return c;}},
      ];
      let text='✨ *Styled Text*\n\n';
      styles.forEach(s=>{text+=`*${s.name}:* ${q.split('').map(s.fn).join('')}\n`;});
      conn.sendMessage(from,{text},{quoted:fvc});
    }
  },
  { pattern:'ping',alias:['speed'],desc:'Check bot ping',category:'main',react:'⚡',
    execute:async(conn,msg,m,{from,reply})=>{
      const t=Date.now();
      await react(conn,msg,'⚡');
      const ms=Date.now()-t;
      conn.sendMessage(from,{text:`⚡ *Pong!*\n\n🏓 Ping: \`${ms}ms\`\n💾 RAM: ${(process.memoryUsage().heapUsed/1048576).toFixed(1)}MB`},{quoted:fvc});
    }
  },
];
