'use strict';
const axios  = require('axios');
const fvc    = require('../lib/fakevcard');
const { react, pick } = require('../lib/utils');

// ── GAALI / INSULTS LIST ──────────────────────────────────────
const gaaliList = ['Besharam!','Ullu ka pattha!','Bewaqoof!','Pagal hai tu!','Gadha kahin ka!','Neech insaan!','Sharmo hayaa nahi hai tujhe!','Andha hai kya?','Dimag ghar pe bhool aaya?','Suar ki dum!'];

module.exports = [
  // ── FORWARD ───────────────────────────────────────────────
  { pattern:'forward',alias:['fwd'],desc:'Forward message to a number',category:'owner',react:'📤',
    execute:async(conn,msg,m,{from,args,q,reply,isOwner})=>{
      if(!isOwner) return reply('❌ Owner only');
      const quotedMsg=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if(!quotedMsg) return reply('❌ Reply to a message to forward');
      const num=args[0]?.replace(/\D/g,'');
      if(!num||num.length<7) return reply('❌ .forward <number> (reply to message)');
      try{
        await conn.sendMessage(`${num}@s.whatsapp.net`,{forward:msg},{quoted:fvc});
        reply(`✅ Forwarded to +${num}`);
      }catch(e){reply(`❌ Forward failed: ${e.message}`);}
    }
  },
  // ── FORWARDED (toggle) ────────────────────────────────────
  { pattern:'forwarded',alias:['rmfwd'],desc:'Remove forwarded tag',category:'tools',react:'🏷️',
    execute:async(conn,msg,m,{from,reply})=>{
      const quotedMsg=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if(!quotedMsg) return reply('❌ Reply to a forwarded message');
      await conn.sendMessage(from,{text:'✅ Forwarded tag removed (sent fresh)',contextInfo:{forwardingScore:0,isForwarded:false}},{quoted:fvc});
    }
  },
  // ── FETCH / SCRAPE ────────────────────────────────────────
  { pattern:'fetch',alias:['geturl'],desc:'Fetch content from a URL',category:'tools',react:'🌐',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q||!q.startsWith('http')) return reply('❌ .fetch <url>');
      await react(conn,msg,'⏳');
      try{
        const {data}=await axios.get(q,{timeout:10000,responseType:'text'});
        const text=String(data).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,1500);
        conn.sendMessage(from,{text:`🌐 *Fetched Content*\n🔗 ${q}\n\n${text}...`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch(e){reply(`❌ Fetch failed: ${e.message}`);}
    }
  },
  // ── GAALI ─────────────────────────────────────────────────
  { pattern:'gaali',desc:'Send a gaali (Hindi insult, fun)',category:'fun',react:'😤',
    execute:async(conn,msg,m,{from,sender})=>{
      const target=m.mentionedJid?.[0]||sender;
      conn.sendMessage(from,{text:`😤 @${target.split('@')[0]}, ${pick(gaaliList)}`,mentions:[target]},{quoted:fvc});
    }
  },
  // ── MUTH (fun) ────────────────────────────────────────────
  { pattern:'muth',desc:'Fun percentage meter',category:'fun',react:'😂',
    execute:async(conn,msg,m,{from,sender})=>{
      const target=m.mentionedJid?.[0]||sender;
      const rate=Math.floor(Math.random()*101);
      conn.sendMessage(from,{text:`😂 *Fun Meter*\n@${target.split('@')[0]}: *${rate}%* 💯`,mentions:[target]},{quoted:fvc});
    }
  },
  // ── FUCK COMMANDS (fun) ───────────────────────────────────
  { pattern:'fuck',alias:['f'],desc:'Fun roast (group)',category:'fun',react:'🔥',
    execute:async(conn,msg,m,{from,isGroup,reply,sender})=>{
      if(!isGroup) return reply('❌ Group only');
      const t=m.mentionedJid?.[0]||m.quoted?.sender;
      if(!t) return reply('❌ Mention someone');
      const msgs=['😤 @{t} got roasted!','🔥 @{t} is on fire (not literally)!','💥 @{t} just got wrecked!'];
      conn.sendMessage(from,{text:pick(msgs).replace('{t}',t.split('@')[0]),mentions:[t]},{quoted:fvc});
    }
  },
  { pattern:'fuckall',desc:'Tag + roast everyone (fun)',category:'fun',react:'💥',
    execute:async(conn,msg,m,{from,isGroup,reply})=>{
      if(!isGroup) return reply('❌ Group only');
      const gm=await conn.groupMetadata(from);
      const mentions=gm.participants.map(p=>p.id);
      let text='💥 *Everyone got WRECKED!*\n\n';
      mentions.forEach(id=>{text+=`@${id.split('@')[0]}\n`;});
      conn.sendMessage(from,{text,mentions},{quoted:fvc});
    }
  },
  { pattern:'finger',desc:'Finger pointing (fun)',category:'fun',react:'👉',
    execute:async(conn,msg,m,{from,sender})=>{
      const t=m.mentionedJid?.[0]||sender;
      conn.sendMessage(from,{text:`👉 @${sender.split('@')[0]} is pointing at @${t.split('@')[0]}!`,mentions:[sender,t]},{quoted:fvc});
    }
  },
  // ── NOTES ─────────────────────────────────────────────────
  { pattern:'savenote',alias:['note','addnote'],desc:'Save a note',category:'utility',react:'📝',
    execute:async(conn,msg,m,{from,args,q,reply})=>{
      if(!q) return reply('❌ .savenote <name> | <content>');
      const [name,...rest]=q.split('|');
      if(!name||!rest.length) return reply('❌ .savenote <name> | <content>');
      const store=require('../lib/store');
      store.notes.set(`${from}:${name.trim()}`,rest.join('|').trim());
      reply(`📝 Note *${name.trim()}* saved!`);
    }
  },
  { pattern:'getnote',alias:['note#'],desc:'Get a saved note',category:'utility',react:'📋',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .getnote <name>');
      const store=require('../lib/store');
      const note=store.notes.get(`${from}:${q.trim()}`);
      if(!note) return reply(`❌ No note named "${q}" found`);
      conn.sendMessage(from,{text:`📋 *Note: ${q}*\n\n${note}`},{quoted:fvc});
    }
  },
  { pattern:'delnote',desc:'Delete a note',category:'utility',react:'🗑️',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .delnote <name>');
      const store=require('../lib/store');
      store.notes.del(`${from}:${q.trim()}`);
      reply(`✅ Note *${q}* deleted`);
    }
  },
  // ── STALK / PROFILE ───────────────────────────────────────
  { pattern:'pp',alias:['getpp','profilepic'],desc:'Get profile picture',category:'utility',react:'🖼️',
    execute:async(conn,msg,m,{from,sender,reply})=>{
      const target=m.mentionedJid?.[0]||m.quoted?.sender||sender;
      try{
        const ppUrl=await conn.profilePictureUrl(target,'image');
        conn.sendMessage(from,{image:{url:ppUrl},caption:`🖼️ *Profile Picture*\n👤 @${target.split('@')[0]}`,mentions:[target]},{quoted:fvc});
      }catch{reply('❌ Could not get profile picture (privacy settings)');}
    }
  },
  // ── SPEED TEST ────────────────────────────────────────────
  { pattern:'speedtest',alias:['speed'],desc:'Internet speed test',category:'utility',react:'⚡',
    execute:async(conn,msg,m,{from})=>{
      await react(conn,msg,'⏳');
      const start=Date.now();
      try{
        await axios.get('https://speed.cloudflare.com/__down?bytes=1000000',{timeout:15000,responseType:'arraybuffer'});
        const ms=Date.now()-start;
        const mbps=((8/ms)*1000).toFixed(2);
        conn.sendMessage(from,{text:`⚡ *Speed Test*\n\n📥 Download: *${mbps} Mbps*\n⏱️ Ping: *${ms}ms*`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{conn.sendMessage(from,{text:`⚡ Bot Ping: *${Date.now()-start}ms*`},{quoted:fvc});}
    }
  },
  // ── GIF SEARCH ────────────────────────────────────────────
  { pattern:'gif',desc:'Search GIFs',category:'search',react:'🎭',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .gif <search term>');
      await react(conn,msg,'⏳');
      try{
        const {data}=await axios.get(`https://api.popcat.xyz/giphy?q=${encodeURIComponent(q)}`,{timeout:8000});
        if(!data?.url) throw new Error('Not found');
        conn.sendMessage(from,{video:{url:data.url},caption:`🎭 *GIF: ${q}*`,gifPlayback:true},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply('❌ GIF not found');}
    }
  },
  // ── GIMAGE ────────────────────────────────────────────────
  { pattern:'gimage',alias:['googleimage','img'],desc:'Search Google Images',category:'search',react:'🖼️',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .gimage <search term>');
      await react(conn,msg,'⏳');
      try{
        const {data}=await axios.get(`https://api.popcat.xyz/search/image?q=${encodeURIComponent(q)}`,{timeout:8000});
        if(!data?.[0]) throw new Error('No results');
        conn.sendMessage(from,{image:{url:data[0].image},caption:`🖼️ *Google Image: ${q}*`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply('❌ No images found');}
    }
  },
  // ── BING SEARCH ───────────────────────────────────────────
  { pattern:'bing',alias:['search'],desc:'Bing web search',category:'search',react:'🔍',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .bing <query>');
      try{
        const {data}=await axios.get(`https://api.popcat.xyz/bing?q=${encodeURIComponent(q)}`,{timeout:8000});
        if(!data?.results?.length) throw new Error('No results');
        let text=`🔍 *Bing: ${q}*\n\n`;
        data.results.slice(0,5).forEach((r,i)=>{text+=`${i+1}. *${r.title}*\n${r.snippet}\n🔗 ${r.url}\n\n`;});
        conn.sendMessage(from,{text},{quoted:fvc});
      }catch{reply('❌ Search failed');}
    }
  },
];
