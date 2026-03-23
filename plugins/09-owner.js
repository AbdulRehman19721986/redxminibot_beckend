'use strict';
const fvc    = require('../lib/fakevcard');
const loader = require('../lib/loader');

module.exports = [
  { pattern:'restart',alias:['shutdown'],desc:'Restart the bot',category:'owner',react:'🔄',
    execute:async(conn,msg,m,{from,reply,isOwner})=>{
      if(!isOwner) return reply('❌ Owner only');
      await conn.sendMessage(from,{text:'🔄 *Restarting bot...*'},{quoted:fvc});
      setTimeout(()=>process.exit(0),2000);
    }
  },
  { pattern:'update',alias:['reload'],desc:'Reload all plugins',category:'owner',react:'♻️',
    execute:async(conn,msg,m,{from,reply,isOwner})=>{
      if(!isOwner) return reply('❌ Owner only');
      const path=require('path');
      loader.load(path.join(__dirname));
      conn.sendMessage(from,{text:`✅ *Plugins reloaded!*\n📦 ${loader.count}+ commands loaded`},{quoted:fvc});
    }
  },
  { pattern:'mode',desc:'Set bot mode (public/private)',category:'owner',react:'⚙️',
    execute:async(conn,msg,m,{from,args,reply,isOwner})=>{
      if(!isOwner) return reply('❌ Owner only');
      const m2=args[0]?.toLowerCase();
      if(m2==='public'||m2==='private'){
        global.BOT_MODE=m2;
        const store=require('../lib/store');
        store.settings.set('mode',m2);
        conn.sendMessage(from,{text:`✅ Bot mode: *${m2.toUpperCase()}*`},{quoted:fvc});
      }else{
        reply(`📌 Current mode: *${global.BOT_MODE?.toUpperCase()||'PUBLIC'}*\n💡 .mode public | private`);
      }
    }
  },
  { pattern:'broadcast',alias:['bcast'],desc:'Broadcast to all groups',category:'owner',react:'📣',
    execute:async(conn,msg,m,{from,q,reply,isOwner})=>{
      if(!isOwner) return reply('❌ Owner only');
      if(!q) return reply('❌ .broadcast <message>');
      const groups=await conn.groupFetchAllParticipating();
      const ids=Object.keys(groups);
      let sent=0;
      for(const id of ids){
        try{
          await conn.sendMessage(id,{text:`📣 *Broadcast from Owner*\n\n${q}`});
          sent++;
          await new Promise(r=>setTimeout(r,300));
        }catch{}
      }
      reply(`✅ Sent to ${sent}/${ids.length} groups`);
    }
  },
  { pattern:'setname',alias:['botname'],desc:'Change bot display name',category:'owner',react:'✏️',
    execute:async(conn,msg,m,{from,q,reply,isOwner})=>{
      if(!isOwner) return reply('❌ Owner only');
      if(!q) return reply('❌ .setname <new name>');
      await conn.updateProfileName(q);
      conn.sendMessage(from,{text:`✅ Bot name changed to: *${q}*`},{quoted:fvc});
    }
  },
  { pattern:'setbio',desc:'Change bot bio',category:'owner',react:'📝',
    execute:async(conn,msg,m,{from,q,reply,isOwner})=>{
      if(!isOwner) return reply('❌ Owner only');
      if(!q) return reply('❌ .setbio <new bio>');
      await conn.updateProfileStatus(q);
      conn.sendMessage(from,{text:`✅ Bio updated: _${q}_`},{quoted:fvc});
    }
  },
  { pattern:'setdp',desc:'Change bot profile picture',category:'owner',react:'🖼️',
    execute:async(conn,msg,m,{from,reply,isOwner})=>{
      if(!isOwner) return reply('❌ Owner only');
      const quotedMsg=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage||msg.message;
      if(!quotedMsg?.imageMessage) return reply('❌ Reply to or send image as caption');
      try{
        const {downloadContentFromMessage}=require('@whiskeysockets/baileys');
        const stream=await downloadContentFromMessage(quotedMsg.imageMessage,'image');
        let buf=Buffer.from([]);
        for await(const chunk of stream) buf=Buffer.concat([buf,chunk]);
        await conn.updateProfilePicture(conn.user.id,buf);
        conn.sendMessage(from,{text:'✅ Profile picture updated!'},{quoted:fvc});
      }catch(e){reply(`❌ Failed: ${e.message}`);}
    }
  },
  { pattern:'deployid',alias:['myid'],desc:'Show deploy ID and key',category:'owner',react:'🆔',
    execute:async(conn,msg,m,{from,reply})=>{
      const {DEPLOY_ID,deploys}=require('../index');
      const dep=deploys?.[DEPLOY_ID];
      conn.sendMessage(from,{text:`🆔 *Deploy ID:* \`${DEPLOY_ID||'N/A'}\`\n🔑 *Key:* \`${dep?.deployKey||'N/A'}\`\n🌐 *Platform:* ${dep?.platform||'Local'}`},{quoted:fvc});
    }
  },
  { pattern:'runtime',alias:['uptime'],desc:'Show bot uptime',category:'main',react:'⏱️',
    execute:async(conn,msg,m,{from})=>{
      const up=process.uptime();
      const h=Math.floor(up/3600),mn=Math.floor((up%3600)/60),s=Math.floor(up%60);
      const mem=process.memoryUsage();
      conn.sendMessage(from,{text:`⏱️ *Runtime*\n\n⏰ Uptime: *${h}h ${mn}m ${s}s*\n💾 RAM Used: *${(mem.heapUsed/1048576).toFixed(1)}MB*\n📦 Commands: *${loader.count+8}+*\n🖼️ Version: *5.2.0*`},{quoted:fvc});
    }
  },
  { pattern:'owner',desc:'Show owner contact',category:'main',react:'👑',
    execute:async(conn,msg,m,{from})=>{
      const cfg=require('../lib/config');
      await conn.sendMessage(from,{contacts:{displayName:cfg.OWNER_NAME,contacts:[{vcard:`BEGIN:VCARD\nVERSION:3.0\nFN:${cfg.OWNER_NAME}\nTEL;type=CELL;waid=${cfg.OWNER_NUM}:+${cfg.OWNER_NUM}\nEND:VCARD`}]}},{quoted:fvc});
      conn.sendMessage(from,{text:`👑 *${cfg.OWNER_NAME}*\n📱 +${cfg.OWNER_NUM}\n👤 Co-Owner: ${cfg.OWNER_NAME2}`},{quoted:fvc});
    }
  },
];
