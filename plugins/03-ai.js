'use strict';
const axios = require('axios');
const fvc   = require('../lib/fakevcard');
const { react } = require('../lib/utils');

const ask = async (url) => { try { const {data} = await axios.get(url,{timeout:30000}); return data.response||data.result||data.answer||data.text||data.reply||null; } catch { return null; } };

module.exports = [
  { pattern:'gpt',alias:['ai','ask','chatgpt','gpt4'],desc:'Chat with GPT-4 AI',category:'ai',react:'🤖',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .gpt <question>');
      await react(conn,msg,'⏳');
      const r=await ask(`https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(q)}`);
      if(!r) return reply('❌ AI unavailable, try again');
      conn.sendMessage(from,{text:`🤖 *GPT-4*\n\n${r}`},{quoted:fvc});
      await react(conn,msg,'✅');
    }
  },
  { pattern:'deepseek',alias:['ds','deep'],desc:'DeepSeek AI',category:'ai',react:'🔵',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .deepseek <question>');
      await react(conn,msg,'⏳');
      const r=await ask(`https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(q)}`);
      if(!r) return reply('❌ DeepSeek unavailable');
      conn.sendMessage(from,{text:`🔵 *DeepSeek AI*\n\n${r}`},{quoted:fvc});
      await react(conn,msg,'✅');
    }
  },
  { pattern:'gemini',alias:['gem','google'],desc:'Google Gemini AI',category:'ai',react:'💎',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .gemini <question>');
      await react(conn,msg,'⏳');
      const r=await ask(`https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(q)}`);
      if(!r) return reply('❌ Gemini unavailable');
      conn.sendMessage(from,{text:`💎 *Gemini AI*\n\n${r}`},{quoted:fvc});
      await react(conn,msg,'✅');
    }
  },
  { pattern:'imagine',alias:['aiimg','flux','aiart','image'],desc:'Generate AI image',category:'ai',react:'🎨',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .imagine <prompt>');
      await react(conn,msg,'⏳');
      conn.sendMessage(from,{text:'🎨 Generating AI image...'},{quoted:fvc});
      try{
        const {data}=await axios.get(`https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(q)}`,{timeout:60000});
        if(!data?.download_url) throw new Error('No image');
        conn.sendMessage(from,{image:{url:data.download_url},caption:`🎨 *AI Image*\n📝 ${q.slice(0,100)}`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch(e){reply(`❌ ${e.message}`);}
    }
  },
  { pattern:'summarize',alias:['sum','tldr'],desc:'Summarize text with AI',category:'ai',react:'📝',
    execute:async(conn,msg,m,{from,q,reply})=>{
      const text=q||(m.quoted?.message?.conversation)||'';
      if(!text) return reply('❌ .summarize <text> or reply to message');
      await react(conn,msg,'⏳');
      const r=await ask(`https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent('Summarize in 3-5 bullet points:\n'+text.slice(0,1500))}`);
      if(!r) return reply('❌ AI unavailable');
      conn.sendMessage(from,{text:`📝 *Summary*\n\n${r}`},{quoted:fvc});
      await react(conn,msg,'✅');
    }
  },
  { pattern:'explain',desc:'Explain a concept simply',category:'ai',react:'💡',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .explain <topic>');
      await react(conn,msg,'⏳');
      const r=await ask(`https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(`Explain "${q}" simply in 3-5 lines`)}`);
      if(!r) return reply('❌ AI unavailable');
      conn.sendMessage(from,{text:`💡 *${q}*\n\n${r}`},{quoted:fvc});
      await react(conn,msg,'✅');
    }
  },
  { pattern:'translate',alias:['trl','trt'],desc:'Translate text',category:'utility',react:'🌐',
    execute:async(conn,msg,m,{from,args,q,reply})=>{
      if(!q) return reply('❌ .translate [lang] <text>\nExample: .translate fr Hello');
      await react(conn,msg,'⏳');
      const parts=q.split(' ');
      const lang=parts[0].length<=3&&!/\s/.test(parts[0])?parts.shift():'en';
      const text=parts.join(' ');
      if(!text) return reply('❌ Provide text to translate');
      try{
        const {data}=await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`,{timeout:8000});
        const translated=data[0].map(i=>i[0]).filter(Boolean).join('');
        conn.sendMessage(from,{text:`🌐 *Translation → ${lang.toUpperCase()}*\n\n📝 ${text}\n✅ ${translated}`},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch{reply('❌ Translation failed');}
    }
  },
  { pattern:'chatbot',alias:['chat'],desc:'Toggle AI chatbot mode',category:'setting',react:'🤖',
    execute:async(conn,msg,m,{from,q,reply,isGroup,sender})=>{
      if(isGroup){
        const {isAdmin}=require('../lib/utils');
        if(!await isAdmin(conn,from,sender)) return reply('❌ Admins only in group');
      }
      const val=q?.toLowerCase();
      if(!['on','off'].includes(val)) return reply(`⚙️ .chatbot on/off\nCurrent: *${require('../lib/store').chatbot.get(from)?'ON ✅':'OFF ❌'}*`);
      require('../lib/store').chatbot.set(from,val==='on');
      reply(`✅ Chatbot *${val==='on'?'ON ✅':'OFF ❌'}* for this chat`);
    }
  },
  { pattern:'suno',desc:'Generate AI music',category:'ai',react:'🎵',
    execute:async(conn,msg,m,{from,q,reply})=>{
      if(!q) return reply('❌ .suno <prompt>\nExample: .suno a happy pop song');
      await react(conn,msg,'⏳');
      conn.sendMessage(from,{text:'🎵 Generating AI music (1-2 mins)...'},{quoted:fvc});
      try{
        const {data}=await axios.get(`https://api.privatezia.biz.id/api/ai/suno?query=${encodeURIComponent(q)}`,{timeout:120000});
        if(!data?.result?.data?.length) throw new Error('No music generated');
        const song=data.result.data[0];
        conn.sendMessage(from,{image:{url:song.image_url},caption:`🎵 *${song.title}*`},{quoted:fvc});
        conn.sendMessage(from,{audio:{url:song.audio_url},mimetype:'audio/mpeg',fileName:song.title+'.mp3'},{quoted:fvc});
        await react(conn,msg,'✅');
      }catch(e){reply(`❌ ${e.message}`);}
    }
  },
];
