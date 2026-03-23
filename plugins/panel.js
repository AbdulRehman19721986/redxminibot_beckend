/**
 * REDXBOT302 v6 — Panel Plugin
 * .panel — manage bot from WhatsApp
 * Install/remove plugins, settings, guide
 * Owner: Abdul Rehman Rajpoot & Muzamil Khan
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const store = require('../lib/lightweight_store');

const BOT_NAME    = process.env.BOT_NAME     || '🔥 REDXBOT302 🔥';
const NL_JID      = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const PLUGINS_DIR = path.join(process.cwd(), 'plugins');
const CREDS_FILE  = path.join(process.cwd(), 'data', 'panel_creds.json');

const ctxInfo = () => ({
  forwardingScore: 999, isForwarded: true,
  forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: `🔥 ${BOT_NAME}`, serverMessageId: 200 },
});

let PANEL_PASS = null;
try { const c=JSON.parse(fs.readFileSync(CREDS_FILE,'utf8')); PANEL_PASS=c.pass; } catch {}

module.exports = [
  {
    pattern: 'panel', alias: ['adminpanel','bp'],
    desc: 'Bot management panel from WhatsApp', category: 'Owner',
    execute: async (conn, msg, m, { from, args, q, reply, isOwner }) => {
      if (!isOwner) return reply('❌ Owner only!');
      const sub = (args[0]||'').toLowerCase();

      if (!sub || sub==='menu' || sub==='help') return reply(
        `╔══════════════════════════════╗\n║    🔧 *REDXBOT302 PANEL*      ║\n╚══════════════════════════════╝\n\n`+
        `🧩 *Plugin Manager:*\n`+
        `• .panel plugins — list all plugins\n`+
        `• .panel install <raw-js-url>\n`+
        `• .panel remove <filename.js>\n`+
        `• .panel disable <filename.js>\n`+
        `• .panel enable <filename.js>\n\n`+
        `⚙️ *Bot Settings:*\n`+
        `• .panel setname <Bot Name>\n`+
        `• .panel setprefix <.>\n`+
        `• .panel setmode public|private\n`+
        `• .panel setowner <number>\n\n`+
        `🔒 *Security:*\n`+
        `• .panel setpass <password>\n`+
        `• .panel changepass <old> <new>\n\n`+
        `📊 .panel status\n`+
        `📖 .panel guide\n\n`+
        `> 🔥 ${BOT_NAME}`
      );

      // PLUGIN LIST
      if (sub==='plugins'||sub==='list') {
        const files    = fs.existsSync(PLUGINS_DIR) ? fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')) : [];
        const disabled = await store.getSetting('global','disabled_plugins')||[];
        let text = `🧩 *Plugins (${files.length}):*\n\n`;
        files.forEach((f,i)=>{ text+=`${i+1}. ${f} ${disabled.includes(f)?'❌ off':'✅'}\n`; });
        text+=`\n.panel install <url>\n.panel remove <name>\n\n> 🔥 ${BOT_NAME}`;
        return reply(text);
      }

      // INSTALL FROM URL
      if (sub==='install') {
        const url = args[1];
        if (!url||!url.startsWith('http')) return reply('❌ .panel install <raw GitHub URL to .js>');
        if (!url.endsWith('.js')) return reply('❌ Only .js files allowed.');
        const fn = url.split('/').pop().split('?')[0];
        if (!fn.endsWith('.js')) return reply('❌ Invalid filename.');
        await conn.sendMessage(from,{react:{text:'⏳',key:msg.key}});
        try {
          const res  = await axios.get(url,{timeout:20000,responseType:'text'});
          const dest = path.join(PLUGINS_DIR,fn);
          fs.writeFileSync(dest,res.data,'utf8');
          reply(`✅ *Plugin Installed: ${fn}*\nBot auto-reloads.\n\n> 🔥 ${BOT_NAME}`);
          conn.sendMessage(from,{react:{text:'✅',key:msg.key}});
        } catch(e){ reply(`❌ ${e.message}`); }
        return;
      }

      // REMOVE
      if (sub==='remove'||sub==='delete') {
        const fn = args[1]?.endsWith('.js') ? args[1] : (args[1]||'')+'.js';
        if (!fn||fn==='.js') return reply('❌ .panel remove <plugin.js>');
        const fp = path.join(PLUGINS_DIR,fn);
        if (!fs.existsSync(fp)) return reply(`❌ "${fn}" not found.`);
        fs.unlinkSync(fp);
        return reply(`✅ *Plugin Removed: ${fn}*\n\n> 🔥 ${BOT_NAME}`);
      }

      // DISABLE / ENABLE
      if (sub==='disable') {
        const fn = (args[1]||'')+(args[1]?.endsWith('.js')?'':'.js');
        const d  = await store.getSetting('global','disabled_plugins')||[];
        if (!d.includes(fn)) d.push(fn);
        await store.saveSetting('global','disabled_plugins',d);
        return reply(`✅ Plugin *${fn}* disabled.`);
      }
      if (sub==='enable') {
        const fn  = (args[1]||'')+(args[1]?.endsWith('.js')?'':'.js');
        const d   = (await store.getSetting('global','disabled_plugins')||[]).filter(x=>x!==fn);
        await store.saveSetting('global','disabled_plugins',d);
        return reply(`✅ Plugin *${fn}* enabled.`);
      }

      // SETTINGS
      if (sub==='setname') { const n=args.slice(1).join(' '); if(!n) return reply('❌ .panel setname <n>'); await store.saveSetting('global','botname_temp',n); process.env.BOT_NAME=n; return reply(`✅ Bot name: *${n}*`); }
      if (sub==='setprefix') { const p=args[1]; if(!p) return reply('❌ .panel setprefix <p>'); await store.saveSetting('global','prefix',p); process.env.PREFIX=p; return reply(`✅ Prefix: *${p}*`); }
      if (sub==='setmode') { const mode=args[1]?.toLowerCase(); if(!['public','private'].includes(mode)) return reply('❌ public|private'); await store.saveSetting('global','mode',mode); return reply(`✅ Mode: *${mode.toUpperCase()}*`); }
      if (sub==='setowner') { const n=(args[1]||'').replace(/\D/g,''); if(!n) return reply('❌ .panel setowner <num>'); await store.saveSetting('global','owner_temp',n); return reply(`✅ Owner: +${n}`); }

      // PASSWORD
      if (sub==='setpass') {
        const p=args[1]; if(!p||p.length<4) return reply('❌ Min 4 chars: .panel setpass <pass>');
        fs.writeFileSync(CREDS_FILE,JSON.stringify({pass:p})); PANEL_PASS=p;
        return reply(`✅ Panel password set!`);
      }
      if (sub==='changepass') {
        const [,o,n]=args;
        if (!PANEL_PASS) return reply('❌ No pass set. .panel setpass first.');
        if (o!==PANEL_PASS) return reply('❌ Old password wrong.');
        if (!n||n.length<4) return reply('❌ New pass min 4 chars.');
        fs.writeFileSync(CREDS_FILE,JSON.stringify({pass:n})); PANEL_PASS=n;
        return reply('✅ Password changed!');
      }

      // STATUS
      if (sub==='status') {
        const files   = fs.existsSync(PLUGINS_DIR)?fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).length:0;
        const mode    = await store.getSetting('global','mode')||process.env.MODE||'public';
        const prefix  = await store.getSetting('global','prefix')||process.env.PREFIX||'.';
        const botName = await store.getSetting('global','botname_temp')||process.env.BOT_NAME||'REDXBOT302';
        const up      = process.uptime();
        return reply(
          `╔══════════════════════════╗\n║  📊 *BOT STATUS*           ║\n╚══════════════════════════╝\n\n`+
          `🤖 *Bot:* ${botName}\n⚡ *Prefix:* ${prefix}\n🌐 *Mode:* ${mode.toUpperCase()}\n`+
          `🧩 *Plugins:* ${files}\n⏱️ *Uptime:* ${Math.floor(up/3600)}h ${Math.floor((up%3600)/60)}m\n`+
          `💾 *RAM:* ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)} MB\n\n`+
          `> 🔥 ${BOT_NAME}`
        );
      }

      // GUIDE
      if (sub==='guide') return reply(
        `╔══════════════════════════════╗\n║    📖 *PLUGIN DEV GUIDE*      ║\n╚══════════════════════════════╝\n\n`+
        `*PLUGIN FILE FORMAT:*\n\`\`\`\nmodule.exports = [{\n  pattern: 'hello',\n  alias: ['hi','hey'],\n  desc: 'Say hello',\n  category: 'Fun',\n  execute: async (conn, msg, m, ctx) => {\n    ctx.reply('Hello World! 👋');\n  }\n}];\n\`\`\`\n\n`+
        `*CTX OBJECT:*\n• from — chat JID\n• q — query text\n• args — args array\n• reply(text) — quick reply\n• sender — user JID\n• isOwner / isAdmin / isGroup\n• downloadSessions, dlKey\n• groupMetadata, m.mentionedJid\n\n`+
        `*HOW TO INSTALL:*\n1. Upload .js to GitHub (raw) or catbox.moe\n2. .panel install <raw URL>\n\n`+
        `> 🔥 ${BOT_NAME}`
      );

      reply('❓ Unknown. Type *.panel* for help.');
    },
  },
];
