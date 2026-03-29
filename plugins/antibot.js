/**
 * REDXBOT302 v6 — AntiBot Plugin
 * Blocks other bots from using this bot's commands in groups
 * Custom JID blocking, word-based bot detection
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';
const store    = require('../lib/lightweight_store');
const BOT_NAME = process.env.BOT_NAME || '🔥 REDXBOT302 🔥';
const NL_JID   = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const ctx = () => ({ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{newsletterJid:NL_JID,newsletterName:`🔥 ${BOT_NAME}`,serverMessageId:200} });

const BOT_INDICATORS = [/bot[\d_]/i, /robot/i, /autobot/i, /assistant/i];
const KNOWN_BOT_NUMS = ['15550199717','12025550000','918000000000'];

async function isKnownBot(jid) {
  const num = (jid||'').split('@')[0];
  if (KNOWN_BOT_NUMS.some(b => num === b)) return true;
  if (BOT_INDICATORS.some(p => p.test(num))) return true;
  return false;
}

async function shouldBlock(from, senderJid) {
  try {
    const s = await store.getSetting(from, 'antibot') || { enabled:false, blockedJids:[] };
    if (!s.enabled) return false;
    if ((s.blockedJids||[]).some(j => senderJid.includes(j))) return true;
    return isKnownBot(senderJid);
  } catch { return false; }
}

module.exports = [
  {
    pattern:'antibot', alias:['nobot','blockbot'],
    desc:'Block other bots from using this bot in group', category:'Group',
    execute: async (conn, msg, m, { from, args, reply, isAdmin, isOwner }) => {
      if (!from.endsWith('@g.us')) return reply('❌ Group only!');
      if (!isAdmin && !isOwner) return reply('❌ Admins only!');
      const sub = (args[0]||'').toLowerCase();
      const cur = await store.getSetting(from,'antibot') || { enabled:false, blockedJids:[] };

      if (sub==='on')  { await store.saveSetting(from,'antibot',{...cur,enabled:true});  return reply('✅ *AntiBot ON* — Other bots cannot use this bot here.'); }
      if (sub==='off') { await store.saveSetting(from,'antibot',{...cur,enabled:false}); return reply('❌ *AntiBot OFF*'); }

      if (sub==='add') {
        const jid = m.mentionedJid?.[0] || ((args[1]||'').replace(/\D/g,'')+'@s.whatsapp.net');
        if (!jid || jid==='@s.whatsapp.net') return reply('❌ Mention a bot: .antibot add @bot');
        const list = [...(cur.blockedJids||[])];
        if (!list.includes(jid)) list.push(jid);
        await store.saveSetting(from,'antibot',{...cur,blockedJids:list});
        return reply(`✅ *@${jid.split('@')[0]}* blocked from using this bot.`);
      }
      if (sub==='remove') {
        const jid = m.mentionedJid?.[0] || ((args[1]||'').replace(/\D/g,'')+'@s.whatsapp.net');
        await store.saveSetting(from,'antibot',{...cur,blockedJids:(cur.blockedJids||[]).filter(j=>j!==jid)});
        return reply(`✅ Removed from bot block list.`);
      }
      if (sub==='list') {
        const list = cur.blockedJids||[];
        return reply(`🤖 *Blocked Bot JIDs:*\n${list.length?list.map(j=>`• @${j.split('@')[0]}`).join('\n'):'(none — auto-detect active)'}\n\nAuto-detect: ${cur.enabled?'✅ ON':'❌ OFF'}`);
      }

      reply(
        `╔══════════════════════╗\n║  🤖 *ANTIBOT STATUS*   ║\n╚══════════════════════╝\n\n`+
        `Status: ${cur.enabled?'✅ ON':'❌ OFF'}\nBlocked JIDs: ${(cur.blockedJids||[]).length}\n\n`+
        `.antibot on|off\n.antibot add @bot\n.antibot remove @bot\n.antibot list`
      );
    },
  },
];
module.exports.shouldBlock = shouldBlock;
