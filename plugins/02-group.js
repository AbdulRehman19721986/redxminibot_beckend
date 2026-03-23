'use strict';
const fvc = require('../lib/fakevcard');
const { isAdmin, getAdmins, react } = require('../lib/utils');

const meta  = (conn, from) => conn.groupMetadata(from);
const chkAdm = async (conn, from, sender) => {
  const adm = await getAdmins(conn, from);
  return adm.includes(sender);
};

module.exports = [
  { pattern:'kick',alias:['remove'],desc:'Remove user from group',category:'group',react:'👢',
    execute:async(conn,msg,m,{from,isGroup,reply,sender})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      const t=m.mentionedJid?.[0]||m.quoted?.sender;
      if(!t) return reply('❌ Mention or reply to user');
      await react(conn,msg,'👢');
      await conn.groupParticipantsUpdate(from,[t],'remove');
      conn.sendMessage(from,{text:`👢 Removed @${t.split('@')[0]}`,mentions:[t]},{quoted:fvc});
    }
  },
  { pattern:'add',desc:'Add user to group',category:'group',react:'➕',
    execute:async(conn,msg,m,{from,isGroup,reply,sender,args})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      const n=args[0]?.replace(/\D/g,'');
      if(!n) return reply('❌ .add 923001234567');
      await conn.groupParticipantsUpdate(from,[n+'@s.whatsapp.net'],'add');
      conn.sendMessage(from,{text:`➕ Added +${n}`},{quoted:fvc});
    }
  },
  { pattern:'promote',desc:'Promote to admin',category:'group',react:'⬆️',
    execute:async(conn,msg,m,{from,isGroup,reply,sender})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      const t=m.mentionedJid?.[0]||m.quoted?.sender;
      if(!t) return reply('❌ Mention user');
      await conn.groupParticipantsUpdate(from,[t],'promote');
      conn.sendMessage(from,{text:`⬆️ @${t.split('@')[0]} promoted to admin!`,mentions:[t]},{quoted:fvc});
    }
  },
  { pattern:'demote',desc:'Demote admin',category:'group',react:'⬇️',
    execute:async(conn,msg,m,{from,isGroup,reply,sender})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      const t=m.mentionedJid?.[0]||m.quoted?.sender;
      if(!t) return reply('❌ Mention user');
      await conn.groupParticipantsUpdate(from,[t],'demote');
      conn.sendMessage(from,{text:`⬇️ @${t.split('@')[0]} demoted`,mentions:[t]},{quoted:fvc});
    }
  },
  { pattern:'mute',desc:'Mute group',category:'group',react:'🔇',
    execute:async(conn,msg,m,{from,isGroup,reply,sender})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      await conn.groupSettingUpdate(from,'announcement');
      conn.sendMessage(from,{text:'🔇 Group muted — admins only can send'},{quoted:fvc});
    }
  },
  { pattern:'unmute',alias:['open'],desc:'Unmute group',category:'group',react:'🔊',
    execute:async(conn,msg,m,{from,isGroup,reply,sender})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      await conn.groupSettingUpdate(from,'not_announcement');
      conn.sendMessage(from,{text:'🔊 Group unmuted — all can send'},{quoted:fvc});
    }
  },
  { pattern:'tagall',alias:['everyone','@all'],desc:'Tag all members',category:'group',react:'📢',
    execute:async(conn,msg,m,{from,isGroup,reply,sender,q})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      const gm=await meta(conn,from);
      const mentions=gm.participants.map(p=>p.id);
      let text=`📢 *${q||'Attention everyone!'}*\n\n`;
      gm.participants.forEach(p=>{text+=`@${p.id.split('@')[0]}\n`;});
      text+=`\n👥 ${mentions.length} members`;
      conn.sendMessage(from,{text,mentions},{quoted:fvc});
    }
  },
  { pattern:'tagadmins',alias:['alladmins'],desc:'Tag all admins',category:'group',react:'👑',
    execute:async(conn,msg,m,{from,isGroup,reply,q})=>{
      if(!isGroup) return reply('❌ Group only');
      const gm=await meta(conn,from);
      const adms=gm.participants.filter(p=>p.admin);
      const mentions=adms.map(p=>p.id);
      let text=`👑 *${q||'Calling all admins!'}*\n\n`;
      adms.forEach(p=>{text+=`@${p.id.split('@')[0]}\n`;});
      conn.sendMessage(from,{text,mentions},{quoted:fvc});
    }
  },
  { pattern:'hidetag',desc:'Tag all silently',category:'group',react:'👀',
    execute:async(conn,msg,m,{from,isGroup,reply,q})=>{
      if(!isGroup) return reply('❌ Group only');
      const gm=await meta(conn,from);
      const mentions=gm.participants.map(p=>p.id);
      conn.sendMessage(from,{text:q||'👀',mentions},{quoted:fvc});
    }
  },
  { pattern:'groupinfo',alias:['gcinfo'],desc:'Group information',category:'group',react:'ℹ️',
    execute:async(conn,msg,m,{from,isGroup,reply})=>{
      if(!isGroup) return reply('❌ Group only');
      const gm=await meta(conn,from);
      const adms=gm.participants.filter(p=>p.admin).length;
      conn.sendMessage(from,{text:`ℹ️ *GROUP INFO*\n\n📌 Name: *${gm.subject}*\n👥 Members: *${gm.participants.length}*\n👑 Admins: *${adms}*\n📅 Created: *${new Date(gm.creation*1000).toLocaleDateString()}*\n🆔 ID: \`${from}\`\n📝 Desc: ${gm.desc||'None'}`},{quoted:fvc});
    }
  },
  { pattern:'invite',desc:'Get group invite link',category:'group',react:'🔗',
    execute:async(conn,msg,m,{from,isGroup,reply,sender})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      try{
        const code=await conn.groupInviteCode(from);
        conn.sendMessage(from,{text:`🔗 *Invite Link*\nhttps://chat.whatsapp.com/${code}`},{quoted:fvc});
      }catch{reply('❌ Need admin rights to get invite link');}
    }
  },
  { pattern:'setgname',alias:['changegname'],desc:'Change group name',category:'group',react:'✏️',
    execute:async(conn,msg,m,{from,isGroup,reply,sender,q})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!q) return reply('❌ .setgname <new name>');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      await conn.groupUpdateSubject(from,q);
      conn.sendMessage(from,{text:`✏️ Group renamed: *${q}*`},{quoted:fvc});
    }
  },
  { pattern:'setgdesc',alias:['changedesc'],desc:'Change group description',category:'group',react:'📝',
    execute:async(conn,msg,m,{from,isGroup,reply,sender,q})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!q) return reply('❌ .setgdesc <new description>');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      await conn.groupUpdateDescription(from,q);
      conn.sendMessage(from,{text:'📝 Group description updated!'},{quoted:fvc});
    }
  },
  { pattern:'broadcast',alias:['bc'],desc:'Broadcast message to all members',category:'group',react:'📣',
    execute:async(conn,msg,m,{from,isGroup,reply,sender,q,isOwner})=>{
      if(!isOwner) return reply('❌ Owner only');
      if(!q) return reply('❌ .broadcast <message>');
      const gm=await meta(conn,from);
      const nums=gm.participants.map(p=>p.id.split('@')[0]).filter(n=>n.length>5);
      let sent=0;
      for(const n of nums){
        try{
          await conn.sendMessage(`${n}@s.whatsapp.net`,{text:`📣 *Broadcast*\n\n${q}`});
          sent++;
          await new Promise(r=>setTimeout(r,500));
        }catch{}
      }
      reply(`✅ Sent to ${sent}/${nums.length} members`);
    }
  },
  { pattern:'resetlink',desc:'Reset group invite link',category:'group',react:'🔄',
    execute:async(conn,msg,m,{from,isGroup,reply,sender})=>{
      if(!isGroup) return reply('❌ Group only');
      if(!await chkAdm(conn,from,sender)) return reply('❌ Admins only');
      await conn.groupRevokeInvite(from);
      conn.sendMessage(from,{text:'🔄 Invite link reset!'},{quoted:fvc});
    }
  },
];
