/**
 * REDXBOT302 v6 — Media Tools Plugin
 * video2audio, image editor, movie/anime/series downloader, logo maker
 * All with number-selection system
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';
const axios = require('axios');
const fs    = require('fs');
const path  = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const BOT_NAME = process.env.BOT_NAME || '🔥 REDXBOT302 🔥';
const NL_JID   = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const TMP_DIR  = path.join(process.cwd(), 'data', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const ctx = () => ({ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{newsletterJid:NL_JID,newsletterName:`🔥 ${BOT_NAME}`,serverMessageId:200} });
async function api(url,opts={}) { const r=await axios.get(url,{timeout:30000,headers:{'User-Agent':'REDXBOT302/6.0'},...opts}); return r.data; }

async function selectionMenu(conn,msg,from,dlKey,downloadSessions,title,items,sendFn) {
  let text=`╔══════════════════════╗\n║  📥 *${title}*\n╚══════════════════════╝\n\n`;
  items.forEach((it,i)=>{ text+=`*${i+1}.* ${it.label}\n`; });
  text+=`\n💡 *Reply with a number*\n> 🔥 REDXBOT302`;
  await conn.sendMessage(from,{text,contextInfo:ctx()},{quoted:msg});
  downloadSessions.set(dlKey,{items,sendFn,
    handler:async(c2,m2,num,sess)=>{
      const it=sess.items[num-1];
      if(!it) return c2.sendMessage(from,{text:`❌ Invalid. Choose 1-${sess.items.length}`},{quoted:m2});
      await c2.sendMessage(from,{react:{text:'⏳',key:m2.key}});
      try{ await sess.sendFn(c2,m2,from,it); c2.sendMessage(from,{react:{text:'✅',key:m2.key}}); }
      catch(e){ c2.sendMessage(from,{react:{text:'❌',key:m2.key}}); c2.sendMessage(from,{text:`❌ ${e.message}`},{quoted:m2}); }
    }
  });
  setTimeout(()=>downloadSessions.delete(dlKey),120000);
}

module.exports = [

  // ── VIDEO TO AUDIO ───────────────────────────────────────────────────────
  {
    pattern:'tomp3', alias:['vid2mp3','video2audio','extractaudio','v2a'],
    desc:'Convert video to audio (reply to video)', category:'Convert',
    execute: async (conn,msg,m,{from,reply}) => {
      const qmsg=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage||{};
      const vidMsg=qmsg.videoMessage||msg.message?.videoMessage;
      if(!vidMsg) return reply('❌ Reply to a video with .tomp3');
      await conn.sendMessage(from,{react:{text:'⏳',key:msg.key}});
      try {
        const stream=await downloadContentFromMessage(vidMsg,'video');
        let buf=Buffer.alloc(0); for await(const c of stream) buf=Buffer.concat([buf,c]);
        const fp=path.join(TMP_DIR,`v2a_${Date.now()}.mp4`);
        const op=fp.replace('.mp4','.mp3');
        fs.writeFileSync(fp,buf);
        const ffmpeg=require('fluent-ffmpeg');
        await new Promise((res,rej)=>ffmpeg(fp).noVideo().audioCodec('libmp3lame').save(op).on('end',res).on('error',rej));
        const audioBuf=fs.readFileSync(op);
        await conn.sendMessage(from,{audio:audioBuf,mimetype:'audio/mpeg',fileName:'audio.mp3',contextInfo:ctx()},{quoted:msg});
        fs.unlinkSync(fp); fs.unlinkSync(op);
        conn.sendMessage(from,{react:{text:'✅',key:msg.key}});
      } catch(e){ reply(`❌ ${e.message}`); }
    },
  },

  // ── AUDIO TO VOICE NOTE ──────────────────────────────────────────────────
  {
    pattern:'toptt', alias:['tovoice','audio2ptt'],
    desc:'Convert audio to voice note (PTT)', category:'Convert',
    execute: async (conn,msg,m,{from,reply}) => {
      const qmsg=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage||{};
      const audMsg=qmsg.audioMessage||msg.message?.audioMessage;
      if(!audMsg) return reply('❌ Reply to an audio with .toptt');
      await conn.sendMessage(from,{react:{text:'⏳',key:msg.key}});
      try {
        const stream=await downloadContentFromMessage(audMsg,'audio');
        let buf=Buffer.alloc(0); for await(const c of stream) buf=Buffer.concat([buf,c]);
        await conn.sendMessage(from,{audio:buf,mimetype:'audio/ogg; codecs=opus',ptt:true},{quoted:msg});
        conn.sendMessage(from,{react:{text:'✅',key:msg.key}});
      } catch(e){ reply(`❌ ${e.message}`); }
    },
  },

  // ── MOVIE DOWNLOADER ────────────────────────────────────────────────────
  {
    pattern:'movie', alias:['film','filmdownload'],
    desc:'Search & download movie info/links', category:'Download',
    execute: async (conn,msg,m,{from,q,reply,downloadSessions,dlKey}) => {
      if(!q) return reply('❌ Usage: .movie <movie name>');
      await conn.sendMessage(from,{react:{text:'🔍',key:msg.key}});
      try {
        const res=await api(`https://api.siputzx.my.id/api/s/movie?q=${encodeURIComponent(q)}`);
        const movies=(res?.data||[]).slice(0,6);
        if(!movies.length) return reply('❌ No results found.');
        const items=movies.map(mv=>({ label:`🎬 ${mv.title||mv.name} (${mv.year||'?'}) ⭐${mv.rating||'?'}`, url:mv.link||mv.url, title:mv.title||mv.name, data:mv }));
        await selectionMenu(conn,msg,from,dlKey,downloadSessions,'Movie Search',items,
          async(c2,m2,f,it)=>{
            const d=it.data;
            const info=`🎬 *${d.title||d.name}*\n\n📅 Year: ${d.year||'?'}\n⭐ Rating: ${d.rating||'?'}\n🌐 Genre: ${d.genre||'?'}\n📝 Story: ${(d.synopsis||d.plot||'').substring(0,300)}\n\n🔗 Link: ${it.url||'N/A'}\n\n> 🔥 ${BOT_NAME}`;
            await c2.sendMessage(f,{text:info,contextInfo:ctx()},{quoted:m2});
          });
      } catch(e){ reply(`❌ ${e.message}`); }
    },
  },

  // ── ANIME DOWNLOADER ────────────────────────────────────────────────────
  {
    pattern:'anime', alias:['animedl','animedownload'],
    desc:'Search & get anime info/episodes', category:'Download',
    execute: async (conn,msg,m,{from,q,reply,downloadSessions,dlKey}) => {
      if(!q) return reply('❌ Usage: .anime <anime name>');
      await conn.sendMessage(from,{react:{text:'🔍',key:msg.key}});
      try {
        const res=await api(`https://api.siputzx.my.id/api/s/anime?q=${encodeURIComponent(q)}`);
        const list=(res?.data||[]).slice(0,6);
        if(!list.length) return reply('❌ No anime found.');
        const items=list.map(a=>({ label:`🌸 ${a.title||a.name} (${a.type||'?'}) — ${a.episodes||'?'} eps`, url:a.link||a.url, data:a }));
        await selectionMenu(conn,msg,from,dlKey,downloadSessions,'Anime Search',items,
          async(c2,m2,f,it)=>{
            const d=it.data;
            const cap=`🌸 *${d.title||d.name}*\n\n📺 Type: ${d.type||'?'}\n📊 Episodes: ${d.episodes||'?'}\n⭐ Rating: ${d.rating||d.score||'?'}\n🌐 Genre: ${Array.isArray(d.genres)?d.genres.join(', '):(d.genre||'?')}\n📝 ${(d.synopsis||d.description||'').substring(0,300)}\n\n🔗 ${it.url||'N/A'}\n\n> 🔥 ${BOT_NAME}`;
            if(d.image||d.thumbnail||d.poster){
              await c2.sendMessage(f,{image:{url:d.image||d.thumbnail||d.poster},caption:cap,contextInfo:ctx()},{quoted:m2});
            } else {
              await c2.sendMessage(f,{text:cap,contextInfo:ctx()},{quoted:m2});
            }
          });
      } catch(e){ reply(`❌ ${e.message}`); }
    },
  },

  // ── SERIES DOWNLOADER ───────────────────────────────────────────────────
  {
    pattern:'series', alias:['tvseries','tvshow','show'],
    desc:'Search TV series/shows', category:'Download',
    execute: async (conn,msg,m,{from,q,reply,downloadSessions,dlKey}) => {
      if(!q) return reply('❌ Usage: .series <series name>');
      await conn.sendMessage(from,{react:{text:'🔍',key:msg.key}});
      try {
        const res=await api(`https://api.siputzx.my.id/api/s/movie?q=${encodeURIComponent(q+' series')}`);
        const list=(res?.data||[]).slice(0,6);
        if(!list.length) return reply('❌ No results found.');
        const items=list.map(s=>({ label:`📺 ${s.title||s.name} (${s.year||'?'}) ⭐${s.rating||'?'}`, url:s.link||s.url, data:s }));
        await selectionMenu(conn,msg,from,dlKey,downloadSessions,'TV Series',items,
          async(c2,m2,f,it)=>{
            const d=it.data;
            await c2.sendMessage(f,{text:`📺 *${d.title||d.name}*\n\n📅 Year: ${d.year||'?'}\n⭐ Rating: ${d.rating||'?'}\n🌐 Genre: ${d.genre||'?'}\n📝 ${(d.synopsis||d.plot||'').substring(0,300)}\n\n🔗 ${it.url||'N/A'}\n\n> 🔥 ${BOT_NAME}`,contextInfo:ctx()},{quoted:m2});
          });
      } catch(e){ reply(`❌ ${e.message}`); }
    },
  },

  // ── IMAGE EDITOR ────────────────────────────────────────────────────────
  {
    pattern:'imgeffect', alias:['imgedit','imageeffect','imgfilter'],
    desc:'Apply effects to image | .imgeffect <effect>', category:'Media',
    execute: async (conn,msg,m,{from,args,reply,downloadSessions,dlKey}) => {
      const effects=['blur','grayscale','sepia','negative','brightness','contrast','flip','flop','rotate90','rotate180'];
      const qmsg=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage||{};
      const imgMsg=qmsg.imageMessage||msg.message?.imageMessage;
      if(!imgMsg && !args[0]) return reply(`❌ Reply to image with .imgeffect\nEffects: ${effects.join(', ')}`);
      if(!imgMsg) return reply('❌ Reply to an image with .imgeffect <effect>');
      const effect=(args[0]||'').toLowerCase();
      if(effect && !effects.includes(effect)){
        return reply(`❌ Unknown effect. Available:\n${effects.map((e,i)=>`${i+1}. ${e}`).join('\n')}`);
      }
      if(!effect){
        const items=effects.map(e=>({label:`✨ ${e}`,effect:e}));
        return selectionMenu(conn,msg,from,dlKey,downloadSessions,'Image Effect',items,
          async(c2,m2,f,it)=>{
            const stream=await downloadContentFromMessage(imgMsg,'image');
            let buf=Buffer.alloc(0); for await(const c of stream) buf=Buffer.concat([buf,c]);
            buf=await applyEffect(buf,it.effect);
            await c2.sendMessage(f,{image:buf,caption:`✨ Effect: *${it.effect}*\n\n> 🔥 ${BOT_NAME}`,contextInfo:ctx()},{quoted:m2});
          });
      }
      await conn.sendMessage(from,{react:{text:'⏳',key:msg.key}});
      try {
        const stream=await downloadContentFromMessage(imgMsg,'image');
        let buf=Buffer.alloc(0); for await(const c of stream) buf=Buffer.concat([buf,c]);
        buf=await applyEffect(buf,effect);
        await conn.sendMessage(from,{image:buf,caption:`✨ Effect: *${effect}*\n\n> 🔥 ${BOT_NAME}`,contextInfo:ctx()},{quoted:msg});
        conn.sendMessage(from,{react:{text:'✅',key:msg.key}});
      } catch(e){ reply(`❌ ${e.message}`); }
    },
  },

  // ── LOGO MAKER ──────────────────────────────────────────────────────────
  {
    pattern:'logo', alias:['makelogo','logomaker'],
    desc:'Create a logo | .logo <text>', category:'Media',
    execute: async (conn,msg,m,{from,q,args,reply,downloadSessions,dlKey}) => {
      if(!q) return reply('❌ Usage: .logo <text> [style]\nStyles: neon glow fire ice metal wood');
      const styles=['neon','glow','fire','ice','metal','wood','gold','shadow','graffiti','3d'];
      const styleName=styles.includes(args[args.length-1]?.toLowerCase())?args.pop().toLowerCase():'neon';
      const text=q.replace(styleName,'').trim()||q;
      await conn.sendMessage(from,{react:{text:'⏳',key:msg.key}});
      try {
        const apis=[
          `https://api.siputzx.my.id/api/maker/logo?text=${encodeURIComponent(text)}&color=${styleName}`,
          `https://api.zalihat.site/api/logo?text=${encodeURIComponent(text)}&style=${styleName}`,
        ];
        let imgUrl=null;
        for(const u of apis){ try{ const r=await api(u); imgUrl=r?.url||r?.result||r?.data; if(imgUrl) break; }catch{} }
        if(!imgUrl) return reply('❌ Could not create logo. Try a different style.');
        await conn.sendMessage(from,{image:{url:imgUrl},caption:`🎨 *Logo*\n✏️ Text: ${text}\n🎨 Style: ${styleName}\n\n> 🔥 ${BOT_NAME}`,contextInfo:ctx()},{quoted:msg});
        conn.sendMessage(from,{react:{text:'✅',key:msg.key}});
      } catch(e){ reply(`❌ ${e.message}`); }
    },
  },
];

// ── Effect helper ─────────────────────────────────────────────────────────
async function applyEffect(buf, effect) {
  const Jimp = require('jimp');
  const img  = await Jimp.read(buf);
  switch(effect) {
    case 'grayscale':  img.grayscale(); break;
    case 'sepia':      img.sepia(); break;
    case 'negative':   img.invert(); break;
    case 'blur':       img.blur(5); break;
    case 'brightness': img.brightness(0.3); break;
    case 'contrast':   img.contrast(0.5); break;
    case 'flip':       img.flip(false,true); break;
    case 'flop':       img.flip(true,false); break;
    case 'rotate90':   img.rotate(90); break;
    case 'rotate180':  img.rotate(180); break;
    default: break;
  }
  return img.getBufferAsync(Jimp.MIME_JPEG);
}
