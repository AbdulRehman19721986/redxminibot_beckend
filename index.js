'use strict';
/**
 * 🔥 REDXBOT302 — FINAL EDITION v5.2
 * Full plugin system · Built‑in menus removed · Antidelete integrated · YTDownloader
 * Owner: Abdul Rehman Rajpoot (+923009842133)
 */

const express  = require('express');
const cors     = require('cors');
const http     = require('http');
const socketIo = require('socket.io');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
require('dotenv').config();

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys');
const P = require('pino');

// ── APP ─────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, { cors: { origin: '*' } });
const PORT   = process.env.PORT || 3000;
const START_TIME = Date.now();

app.use(cors({ origin: '*', methods: ['GET','POST','DELETE','PUT','OPTIONS'], allowedHeaders: ['Content-Type','x-admin-token','x-deploy-key'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── CONFIG ──────────────────────────────────────────────────
const BOT_NAME     = process.env.BOT_NAME     || '🔥 REDXBOT302 🔥';
const OWNER_NAME   = process.env.OWNER_NAME   || 'Abdul Rehman Rajpoot';
const OWNER_NUM    = process.env.OWNER_NUMBER || '923009842133';
const CO_OWNER     = process.env.CO_OWNER     || 'Muzamil Khan';
const CO_OWNER_NUM = process.env.CO_OWNER_NUM || '923183928892';
const PREFIX       = process.env.PREFIX       || '.';
const BOT_IMG      = process.env.MENU_IMAGE   || 'https://files.catbox.moe/s36b12.jpg';
const REPO_LINK    = process.env.REPO_LINK    || 'https://github.com/AbdulRehman19721986/REDXBOT-MD';
const NL_JID       = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const NL_NAME      = '🔥 REDXBOT302 🔥';
const WA_GROUP     = 'https://chat.whatsapp.com/LhSmx2SeXX75r8I2bxsNDo';
const TG_GROUP     = 'https://t.me/TeamRedxhacker2';
global.BOT_MODE    = process.env.BOT_MODE || 'public';

let adminUsername = process.env.ADMIN_USERNAME || 'redx';
let adminPassword = process.env.ADMIN_PASSWORD || 'redx';
const adminSessions = new Map(); // token → { user, ts }

// ── PATHS ────────────────────────────────────────────────────
const SESSIONS_DIR   = path.join(__dirname, 'sessions');
const DATA_FILE      = path.join(__dirname, 'data.json');
const DEPLOYS_FILE   = path.join(__dirname, 'deploys.json');
const SERVERS_FILE   = path.join(__dirname, 'servers.json');
const DEPLOY_ID_FILE = path.join(__dirname, 'deploy_id.txt');

[SESSIONS_DIR, path.join(__dirname,'temp'), path.join(__dirname,'data')].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── DEPLOY ID (this server's unique ID) ─────────────────────
const DEPLOY_ID = (() => {
  if (fs.existsSync(DEPLOY_ID_FILE)) return fs.readFileSync(DEPLOY_ID_FILE,'utf8').trim();
  const id = process.env.DEPLOY_ID || ('REDX-' + crypto.randomBytes(4).toString('hex').toUpperCase());
  fs.writeFileSync(DEPLOY_ID_FILE, id);
  return id;
})();

const detectPlatform = () => {
  if (process.env.DYNO)                return 'Heroku';
  if (process.env.RAILWAY_ENVIRONMENT) return 'Railway';
  if (process.env.RENDER)              return 'Render';
  return 'Local';
};

// ── PERSISTENT DATA ──────────────────────────────────────────
let statsData = { totalUsers: 0, pairCount: 0 };
const loadStats = () => { try { if (fs.existsSync(DATA_FILE)) statsData = { ...statsData, ...JSON.parse(fs.readFileSync(DATA_FILE,'utf8')) }; } catch {} };
const saveStats = () => { try { fs.writeFileSync(DATA_FILE, JSON.stringify({ ...statsData, lastUpdated: new Date().toISOString() },null,2)); } catch {} };
loadStats(); setInterval(saveStats, 30000);

// ── DEPLOYS REGISTRY ─────────────────────────────────────────
let deploys = {};
const loadDeploys = () => { try { if (fs.existsSync(DEPLOYS_FILE)) deploys = JSON.parse(fs.readFileSync(DEPLOYS_FILE,'utf8')); } catch {} };
const saveDeploys = () => { try { fs.writeFileSync(DEPLOYS_FILE, JSON.stringify(deploys,null,2)); } catch {} };
loadDeploys();

if (!deploys[DEPLOY_ID]) {
  deploys[DEPLOY_ID] = {
    id: DEPLOY_ID,
    platform: detectPlatform(),
    createdAt: new Date().toISOString(),
    numbers: [],
    pairCount: 0,
    botName: BOT_NAME,
    ownerName: OWNER_NAME,
    prefix: PREFIX,
    mode: global.BOT_MODE,
    deployKey: crypto.randomBytes(16).toString('hex'),
  };
}
deploys[DEPLOY_ID].lastSeen = new Date().toISOString();
deploys[DEPLOY_ID].platform = detectPlatform();
saveDeploys();

let servers = [];
const loadServers = () => { try { if (fs.existsSync(SERVERS_FILE)) servers = JSON.parse(fs.readFileSync(SERVERS_FILE,'utf8')); } catch {} };
const saveServers = () => { try { fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers,null,2)); } catch {} };
loadServers();

// ── ACTIVE CONNECTIONS (per number) ────────────────────────
const activeConnections = new Map();

const broadcastStats = () => {
  const connected = [...activeConnections.values()].filter(c=>c.connected).length;
  io.emit('statsUpdate', { activeSockets: connected, totalUsers: statsData.totalUsers, pairCount: statsData.pairCount });
};

// ======================== PLUGIN LOADER ========================
const commands   = new Map();
const pluginsDir = path.join(__dirname, 'plugins');
let cmdCount     = 0;

const loadPlugins = () => {
  commands.clear(); cmdCount = 0;
  if (!fs.existsSync(pluginsDir)) { fs.mkdirSync(pluginsDir,{recursive:true}); return; }
  const files = fs.readdirSync(pluginsDir).filter(f=>f.endsWith('.js')&&!f.startsWith('.'));

  for (const file of files) {
    try {
      const fp = path.join(pluginsDir, file);
      delete require.cache[require.resolve(fp)];
      const mod = require(fp);

      const normalise = (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        if (raw.pattern && raw.execute) return raw;
        if ((raw.command || raw.pattern) && (raw.handler || raw.execute)) {
          const pattern = raw.command || raw.pattern;
          const execute = raw.handler
            ? async (conn, msg, m, opts) => {
                const context = {
                  chatId: opts.from,
                  command: pattern,
                  config: {
                    botName: BOT_NAME,
                    ownerName: OWNER_NAME,
                    ownerNumber: OWNER_NUM,
                    coOwner: CO_OWNER,
                    coOwnerNumber: CO_OWNER_NUM,
                    prefix: PREFIX,
                    mode: global.BOT_MODE,
                    platform: detectPlatform(),
                  },
                  deployId: DEPLOY_ID,
                  channelInfo: {
                    contextInfo: {
                      forwardingScore: 999,
                      isForwarded: true,
                      forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: NL_NAME, serverMessageId: -1 },
                    }
                  },
                  ...opts,
                };
                return raw.handler(conn, msg, opts.args || [], context);
              }
            : raw.execute;
          return {
            ...raw,
            pattern,
            execute,
            alias: raw.aliases || raw.alias || [],
            category: raw.category || 'other',
            desc: raw.description || raw.desc || '',
            ownerOnly: !!raw.ownerOnly,
          };
        }
        return null;
      };

      const register = (cmd) => {
        const norm = normalise(cmd);
        if (!norm) return;
        commands.set(norm.pattern, norm); cmdCount++;
        const aliases = Array.isArray(norm.alias) ? norm.alias : [];
        aliases.forEach(a => { if (a) commands.set(a, norm); });
      };

      if (Array.isArray(mod)) {
        mod.forEach(register);
      } else if (mod && typeof mod === 'object') {
        const norm = normalise(mod);
        if (norm) {
          register(mod);
        } else {
          Object.values(mod).forEach(v => { if (v && typeof v === 'object') register(v); });
        }
      }
    } catch(e){ console.error(`Plugin ${file}: ${e.message?.slice(0,120)}`); }
  }
  console.log(`🔌 ${cmdCount} commands loaded from ${files.length} plugin files`);
  global.botCommands = commands;
};
loadPlugins();
if (fs.existsSync(pluginsDir)) fs.watch(pluginsDir,(e,f)=>{ if(f&&f.endsWith('.js')){ console.log(`♻️ Reloading ${f}`); loadPlugins(); } });

// ======================== ANTIDELETE INTEGRATION ========================
const antidelete = require('./lib/antidelete'); // we'll create this file from the provided code
// We'll also need to call storeMessage on every message and handleMessageRevocation on delete
// This will be done inside the message handler.

// ======================== YOUTUBE DOWNLOADER MODULE ========================
const ytDownloader = require('./lib/ytdownloader'); // we'll create this from the provided class

// ======================== INITIALIZATION FUNCTIONS ========================
async function initConnection(number) {
  const sessionDir = path.join(SESSIONS_DIR, number);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version }          = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    version,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS('Safari'),
    connectTimeoutMs:      30000,
    keepAliveIntervalMs:   10000,
    defaultQueryTimeoutMs: 30000,
    retryRequestDelayMs:   250,
    maxRetries:            5,
    markOnlineOnConnect:   true,
    syncFullHistory:       false,
  });

  const prev = activeConnections.get(number) || {};
  activeConnections.set(number, { conn, saveCreds, connected: false, hasWelcomed: prev.hasWelcomed||false, reconnectAttempts: prev.reconnectAttempts||0 });

  setupHandlers(conn, number, saveCreds);
  return conn;
}

function setupHandlers(conn, number, saveCreds) {
  const entry = activeConnections.get(number);

  conn.ev.on('creds.update', async () => { try { await saveCreds(); } catch {} });

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    console.log(`[${number}] ${connection}`);

    if (connection === 'open') {
      entry.connected = true;
      entry.reconnectAttempts = 0;
      statsData.pairCount++;
      statsData.totalUsers++;
      saveStats();

      const dep = deploys[DEPLOY_ID];
      if (!dep.numbers.includes(number)) dep.numbers.push(number);
      dep.pairCount = (dep.pairCount||0)+1;
      dep.lastPaired = new Date().toISOString();
      saveDeploys();

      broadcastStats();
      io.emit('linked',    { sessionId: number, number });
      io.emit('botStatus', { connected: true, number, deployId: DEPLOY_ID, platform: detectPlatform() });
      console.log(`✅ [${number}] CONNECTED — ${BOT_NAME}`);

      if (!entry.hasWelcomed) {
        entry.hasWelcomed = true;
        setTimeout(() => sendWelcome(conn, number).catch(()=>{}), 3000);
      }
    }

    if (connection === 'close') {
      entry.connected = false;
      broadcastStats();
      io.emit('botStatus', { connected: false, number });

      const code        = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = code === DisconnectReason.loggedOut || code === 401 || code === 405;
      console.log(`❌ [${number}] closed code=${code}`);

      if (isLoggedOut) {
        console.log(`🗑️  [${number}] logout — deleting session`);
        try { fs.rmSync(path.join(SESSIONS_DIR,number),{recursive:true,force:true}); } catch {}
        activeConnections.delete(number);
        io.emit('unlinked', { sessionId: number, number });
        return;
      }

      if (entry.reconnectAttempts < 10) {
        entry.reconnectAttempts++;
        const wait = Math.min(3000*entry.reconnectAttempts, 20000);
        console.log(`🔄 [${number}] reconnect in ${wait/1000}s (${entry.reconnectAttempts}/10)`);
        setTimeout(async () => {
          try { conn.ev.removeAllListeners(); try{conn.ws?.terminate();}catch{}; await initConnection(number); }
          catch(e){ console.error(`Reconnect ${number}: ${e.message}`); }
        }, wait);
      } else {
        activeConnections.delete(number);
        io.emit('unlinked', { sessionId: number, number });
      }
    }
  });

  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      // Store for antidelete
      if (antidelete && antidelete.storeMessage) await antidelete.storeMessage(conn, msg);
      try { await handleMessage(conn, msg, number); } catch(e){ console.error(`msg: ${e.message}`); }
    }
  });

  // Antidelete: listen for protocol messages that indicate a deletion
  conn.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      if (update.update?.protocolMessage?.type === 1) { // message deletion
        if (antidelete && antidelete.handleMessageRevocation) {
          await antidelete.handleMessageRevocation(conn, update);
        }
      }
    }
  });

  // Group events
  conn.ev.on('group-participants.update', async (update) => {
    try {
      const GroupEvents = require('./lib/groupevents');
      await GroupEvents(conn, update, {
        botName: BOT_NAME, ownerName: OWNER_NAME,
        menuImage: BOT_IMG, newsletterJid: NL_JID,
      });
    } catch(e){ console.error('GroupEvents:', e.message); }
  });
}

async function sendWelcome(conn, number) {
  const userJid = `${number}@s.whatsapp.net`;
  let name = 'User';
  try { name = conn.user?.name || conn.user?.notify || 'User'; } catch {}
  const dep = deploys[DEPLOY_ID];

  const text = `╭━[ \`🔥 ${BOT_NAME}\` ]━⊷
┆⚜️ *DEV:* ☛ _+${OWNER_NUM}_
╰━━━━━━━━━━⊷

👋 Hey *${name}* 🤩
🎉 *Pairing Completed — You're good to go!*

_ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʀᴇᴅxʙᴏᴛ302_

📱 *Number:* +${number}
🆔 *Deploy ID:* \`${DEPLOY_ID}\`
🔑 *Your Deploy Key:* \`${dep.deployKey}\`
🌐 *Platform:* ${detectPlatform()}
👑 *Owner:* ${OWNER_NAME}
📦 *Commands:* ${cmdCount+8}+
📌 *Prefix:* ${dep.prefix||PREFIX}
🌍 *Mode:* ${global.BOT_MODE.toUpperCase()}

> 🔒 Keep your Deploy Key private!
> Use it on the website to manage your bot.
> Type *${dep.prefix||PREFIX}menu* to see all commands!

🍴 Fork & ⭐ Star: ${REPO_LINK}

> 🔥 ${BOT_NAME} — By ${OWNER_NAME}`;

  await conn.sendMessage(userJid, {
    text,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: NL_NAME, serverMessageId: -1 },
      externalAdReply: {
        title: `${BOT_NAME} Connected 🚀`,
        body: `Deploy ID: ${DEPLOY_ID}`,
        thumbnailUrl: BOT_IMG,
        sourceUrl: REPO_LINK,
        mediaType: 1,
        renderLargerThumbnail: true,
      },
    },
  });
}

// ======================== MESSAGE HANDLER ========================
async function handleMessage(conn, msg, sessionId) {
  const from    = msg.key.remoteJid;
  const sender  = msg.key.participant || msg.key.remoteJid;
  const sNum    = sender.split('@')[0].split(':')[0];
  const isOwner = sNum === OWNER_NUM || sNum === CO_OWNER_NUM || sNum === sessionId;

  // Status messages
  if (from === 'status@broadcast') {
    if (process.env.AUTO_STATUS_SEEN !== 'false') await conn.readMessages([msg.key]).catch(()=>{});
    if (process.env.AUTO_STATUS_REACT !== 'false') {
      const e=['🔥','⚡','💯','👑','🚀','💎','❤️','💜','✨','🌟'][Math.floor(Math.random()*10)];
      await conn.sendMessage(from,{react:{text:e,key:msg.key}},{statusJidList:[sender,conn.user.id]}).catch(()=>{});
    }
    return;
  }
  if (from?.endsWith('@newsletter')) return;
  if (!msg.message) return;
  if (global.BOT_MODE === 'private' && !isOwner) return;

  const body = msg.message?.conversation
    || msg.message?.extendedTextMessage?.text
    || msg.message?.imageMessage?.caption
    || msg.message?.videoMessage?.caption || '';

  const dep    = deploys[DEPLOY_ID];
  const pfx    = dep?.prefix || PREFIX;
  if (!body.startsWith(pfx)) return;

  const args = body.slice(pfx.length).trim().split(/ +/);
  const cmd  = args.shift().toLowerCase();
  const q    = body.slice(pfx.length + cmd.length).trim();

  console.log(`[${new Date().toLocaleTimeString()}] ${pfx}${cmd} | ${sNum}`);

  // Built‑in commands (only essential ones)
  if (await runBuiltIn(conn, msg, cmd, args, q, from, sender, isOwner, pfx)) return;

  // Plugin commands
  if (commands.has(cmd)) {
    const plugin = commands.get(cmd);
    if (plugin.ownerOnly && !isOwner) {
      await conn.sendMessage(from, { text: '❌ This command is only for the bot owner.' }, { quoted: msg });
      return;
    }
    try {
      const reply   = (text, opts={}) => conn.sendMessage(from,{text},{quoted:msg,...opts});
      const isGroup = from.endsWith('@g.us');
      let gMeta = null;
      if (isGroup) { try { gMeta = await conn.groupMetadata(from); } catch {} }
      let isAdmin = false;
      if (isGroup && gMeta) { const p = gMeta.participants.find(p=>p.id===sender); isAdmin = p?.admin==='admin'||p?.admin==='superadmin'; }
      const quoted = getQuoted(msg);
      const pluginOpts = {
        args, q, reply, from, isGroup, groupMetadata: gMeta,
        sender, isAdmin, isOwner, botName: BOT_NAME, ownerName: OWNER_NAME,
        prefix: pfx, senderNumber: sNum,
        chatId: from, deployId: DEPLOY_ID,
      };
      await plugin.execute(conn, msg, {
        mentionedJid: msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[],
        quoted, sender, key: msg.key,
        message: msg.message,
      }, pluginOpts);
    } catch(e){ console.error(`cmd[${cmd}]: ${e.message}`); }
  }
}

async function runBuiltIn(conn, msg, cmd, args, q, from, sender, isOwner, pfx) {
  const dep = deploys[DEPLOY_ID];
  const nlCtx = {
    forwardingScore: 999, isForwarded: true,
    forwardedNewsletterMessageInfo: { newsletterJid: NL_JID, newsletterName: NL_NAME, serverMessageId: -1 },
    externalAdReply: { title: `🔥 ${BOT_NAME}`, body: `Owner: ${OWNER_NAME}`, thumbnailUrl: BOT_IMG, sourceUrl: REPO_LINK, mediaType: 1, renderLargerThumbnail: false },
  };
  const s = text => conn.sendMessage(from, { text, contextInfo: nlCtx }, { quoted: msg });

  switch(cmd) {
    case 'ping':
      const t = Date.now();
      await conn.sendMessage(from, { react: { text: '⚡', key: msg.key } });
      await s(`⚡ *ᴘɪɴɢ:* \`${Date.now()-t}ms\`\n\n> 🔥 ${BOT_NAME}`);
      return true;

    case 'owner':
      await conn.sendMessage(from, {
        contacts: { displayName: OWNER_NAME, contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${OWNER_NAME}\nTEL;type=CELL;waid=${OWNER_NUM}:+${OWNER_NUM}\nEND:VCARD` }] }
      }, { quoted: msg });
      await s(`👑 *ᴏᴡɴᴇʀ:* ${OWNER_NAME}\n📱 *ɴᴜᴍ:* +${OWNER_NUM}\n👤 *ᴄᴏ:* ${CO_OWNER}\n\n> 🔥 ${BOT_NAME}`);
      return true;

    case 'mode':
      if (!isOwner) { await s('❌ Owner only.'); return true; }
      const m = args[0]?.toLowerCase();
      if (m==='public'||m==='private') {
        global.BOT_MODE = m;
        if (dep) dep.mode = m;
        saveDeploys();
        await s(`✅ *ᴍᴏᴅᴇ:* \`${m.toUpperCase()}\`\n\n> 🔥 ${BOT_NAME}`);
      } else await s(`📌 *ᴄᴜʀʀᴇɴᴛ ᴍᴏᴅᴇ:* \`${global.BOT_MODE.toUpperCase()}\`\n\n💡 Use: \`${pfx}mode public\` | \`${pfx}mode private\``);
      return true;

    case 'deployid':
    case 'myid':
      await s(`🆔 *ᴅᴇᴘʟᴏʏ ɪᴅ:* \`${DEPLOY_ID}\`\n🔑 *ᴋᴇʏ:* \`${dep?.deployKey||'—'}\`\n🌐 *ᴘʟᴀᴛᴇ:* ${detectPlatform()}\n\n> 🔥 ${BOT_NAME}`);
      return true;

    case 'runtime':
    case 'uptime':
      const up = Math.floor((Date.now()-START_TIME)/1000);
      const h=Math.floor(up/3600), m2=Math.floor((up%3600)/60), s2=up%60;
      await s(`⏱️ *ʀᴜɴᴛɪᴍᴇ:* \`${h}h ${m2}m ${s2}s\`\n📦 *ᴄᴍᴅs:* ${cmdCount+8}+\n🌍 *ᴍᴏᴅᴇ:* ${global.BOT_MODE.toUpperCase()}\n\n> 🔥 ${BOT_NAME}`);
      return true;

    case 'restart':
    case 'shutdown':
      if (!isOwner) { await s('❌ Owner only.'); return true; }
      await s('🔄 *Restarting...*\n\n> 🔥 '+BOT_NAME);
      setTimeout(()=>process.exit(0),2000);
      return true;

    default: return false;
  }
}

function getQuoted(msg) {
  const ctx=msg.message?.extendedTextMessage?.contextInfo;
  if(!ctx?.quotedMessage)return null;
  return{message:{key:{remoteJid:ctx.participant||ctx.stanzaId,id:ctx.stanzaId,fromMe:false},message:ctx.quotedMessage},sender:ctx.participant};
}

// ======================== EXPRESS ROUTES (unchanged) ========================
app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/api/status', (req,res)=>res.json(getStats()));
app.get('/api/config', (req,res)=>res.json({
  botName: BOT_NAME, ownerName: OWNER_NAME, coOwner: CO_OWNER,
  prefix: PREFIX, menuImage: BOT_IMG, repoLink: REPO_LINK,
  waGroup: WA_GROUP, tgGroup: TG_GROUP,
  hasSession: (()=>{ try{ return fs.readdirSync(SESSIONS_DIR).some(d=>fs.existsSync(path.join(SESSIONS_DIR,d,'creds.json'))); }catch{return false;} })(),
  deployId: DEPLOY_ID, platform: detectPlatform(),
}));

app.post('/api/pair', async (req, res) => {
  let conn;
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number required' });
    const num = number.replace(/\D/g,'');
    if (num.length < 7) return res.status(400).json({ error: 'Invalid phone number' });

    console.log(`📱 Pair request: ${num}`);

    const existing = activeConnections.get(num);
    if (existing?.connected) return res.status(400).json({ error: 'Already connected! Use Logout to re-pair.' });

    if (existing?.conn) {
      try { existing.conn.ev.removeAllListeners(); existing.conn.ws?.terminate(); } catch {}
      activeConnections.delete(num);
      await new Promise(r=>setTimeout(r,600));
    }

    const sessionDir = path.join(SESSIONS_DIR, num);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir,{recursive:true});

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version }          = await fetchLatestBaileysVersion();

    conn = makeWASocket({
      version,
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: Browsers.macOS('Safari'),
      connectTimeoutMs:      30000,
      keepAliveIntervalMs:   10000,
      defaultQueryTimeoutMs: 30000,
      retryRequestDelayMs:   250,
      maxRetries:            5,
      markOnlineOnConnect:   true,
      syncFullHistory:       false,
    });

    activeConnections.set(num, { conn, saveCreds, connected: false, hasWelcomed: false, reconnectAttempts: 0 });
    setupHandlers(conn, num, saveCreds);

    await new Promise(r=>setTimeout(r,3000));

    const rawCode = await conn.requestPairingCode(num);
    const code    = (rawCode||'').toString().trim();
    const formatted = code.match(/.{1,4}/g)?.join('-') || code;

    console.log(`✅ Code for ${num}: ${formatted}`);
    return res.json({ success: true, pairingCode: formatted, code: formatted, number: num });

  } catch(err) {
    console.error('❌ /api/pair:', err.message);
    if (conn) { try { conn.ev.removeAllListeners(); conn.ws?.terminate(); } catch {} }
    return res.status(500).json({ error: err.message || 'Failed to get pairing code. Try again.' });
  }
});

app.post('/api/logout', async (req,res) => {
  try {
    const { number } = req.body;
    const num = (number||'').replace(/\D/g,'');
    if (num) {
      const e = activeConnections.get(num);
      if (e?.conn){ try{e.conn.ev.removeAllListeners();e.conn.ws?.terminate();}catch{} }
      activeConnections.delete(num);
      try{fs.rmSync(path.join(SESSIONS_DIR,num),{recursive:true,force:true});}catch{}
      io.emit('unlinked',{sessionId:num,number:num});
    } else {
      for(const[n,e]of activeConnections){ if(e?.conn){try{e.conn.ev.removeAllListeners();e.conn.ws?.terminate();}catch{}} try{fs.rmSync(path.join(SESSIONS_DIR,n),{recursive:true,force:true});}catch{} io.emit('unlinked',{sessionId:n,number:n}); }
      activeConnections.clear();
    }
    broadcastStats();
    io.emit('botStatus',{connected:false,number:''});
    res.json({success:true,message:'Logged out'});
  } catch(err){ res.status(500).json({error:err.message}); }
});

app.post('/api/reload',(req,res)=>{ loadPlugins(); res.json({success:true,commands:cmdCount}); });

app.get('/api/deploy/:id',(req,res)=>{
  const id=req.params.id.toUpperCase(); const d=deploys[id];
  if(!d)return res.status(404).json({error:'Deploy ID not found'});
  res.json({ id:d.id, platform:d.platform, pairCount:d.pairCount||0, createdAt:d.createdAt, lastSeen:d.lastSeen, numbers:d.numbers?.length||0 });
});

// ======================== USER DEPLOY KEY API (unchanged) ========================
function deployKeyAuth(req, res, next) {
  const key = req.headers['x-deploy-key'] || req.body?.deployKey || req.query?.key;
  if (!key) return res.status(401).json({ error: 'Deploy key required' });
  const dep = Object.values(deploys).find(d => d.deployKey === key);
  if (!dep) return res.status(401).json({ error: 'Invalid deploy key' });
  req.deploy = dep;
  next();
}

app.post('/api/user/info', deployKeyAuth, (req,res) => {
  const d = req.deploy;
  res.json({
    id: d.id, platform: d.platform, pairCount: d.pairCount||0,
    numbers: d.numbers||[], createdAt: d.createdAt, lastSeen: d.lastSeen,
    botName: d.botName, ownerName: d.ownerName, prefix: d.prefix, mode: d.mode,
    connected: [...activeConnections.values()].some(e=>e.connected),
  });
});

app.post('/api/user/update', deployKeyAuth, (req,res) => {
  const d = req.deploy;
  const { botName, ownerName, prefix, mode } = req.body;
  if (botName)   { d.botName   = botName;   }
  if (ownerName) { d.ownerName = ownerName; }
  if (prefix)    { d.prefix    = prefix;    }
  if (mode && (mode==='public'||mode==='private')) {
    d.mode = mode;
    if (d.id === DEPLOY_ID) global.BOT_MODE = mode;
  }
  saveDeploys();
  res.json({ success: true, deploy: { id:d.id, botName:d.botName, ownerName:d.ownerName, prefix:d.prefix, mode:d.mode } });
});

app.post('/api/user/logout', deployKeyAuth, async (req,res) => {
  const d = req.deploy;
  let count = 0;
  for (const num of (d.numbers||[])) {
    const e = activeConnections.get(num);
    if (e?.conn) { try{e.conn.ev.removeAllListeners();e.conn.ws?.terminate();}catch{} }
    activeConnections.delete(num);
    try{fs.rmSync(path.join(SESSIONS_DIR,num),{recursive:true,force:true});}catch{}
    count++;
  }
  d.numbers = [];
  saveDeploys();
  broadcastStats();
  io.emit('botStatus',{connected:false,number:''});
  res.json({ success: true, message: `Logged out ${count} session(s)` });
});

app.get('/api/user/status', deployKeyAuth, (req,res) => {
  res.json({ ...getStats(), deployKey: '***hidden***' });
});

// ======================== ADMIN ROUTES (unchanged) ========================
const adminAuth = (req,res,next) => {
  const token = req.headers['x-admin-token']||req.query.token;
  if(!token||!adminSessions.has(token))return res.status(401).json({error:'Unauthorized'});
  const s=adminSessions.get(token);
  if(Date.now()-s.ts>86400000){adminSessions.delete(token);return res.status(401).json({error:'Session expired'});}
  req.adminSession=s; next();
};

app.post('/api/admin/login',(req,res)=>{
  const{username,password}=req.body;
  if(username!==adminUsername||password!==adminPassword)return res.status(401).json({error:'Invalid credentials'});
  const token=crypto.randomBytes(32).toString('hex');
  adminSessions.set(token,{user:username,ts:Date.now()});
  res.json({success:true,token,username});
});
app.post('/api/admin/logout',adminAuth,(req,res)=>{ adminSessions.delete(req.headers['x-admin-token']); res.json({success:true}); });

app.get('/api/admin/overview',adminAuth,(req,res)=>res.json({
  stats:{ totalDeploys:Object.keys(deploys).length, totalPairs:statsData.pairCount, totalUsers:statsData.totalUsers, uptime:Math.floor((Date.now()-START_TIME)/1000) },
  currentDeploy: deploys[DEPLOY_ID], servers, platform:detectPlatform(),
  adminUser:req.adminSession.user, botVersion:'5.2.0', nodeVersion:process.version, memUsage:process.memoryUsage(), activeConnections:activeConnections.size,
}));

app.get('/api/admin/deploys',adminAuth,(req,res)=>res.json({deploys:Object.values(deploys)}));
app.delete('/api/admin/deploys/:id',adminAuth,(req,res)=>{
  const id=req.params.id.toUpperCase();
  if(id===DEPLOY_ID)return res.status(400).json({error:'Cannot remove current deploy'});
  if(!deploys[id])return res.status(404).json({error:'Not found'});
  delete deploys[id];saveDeploys();res.json({success:true});
});

app.get('/api/admin/servers',adminAuth,(req,res)=>res.json({servers}));
app.post('/api/admin/servers',adminAuth,(req,res)=>{
  const{name,url,platform,description}=req.body;
  if(!name||!url)return res.status(400).json({error:'Name and URL required'});
  const srv={id:crypto.randomBytes(4).toString('hex'),name,url,platform:platform||'Unknown',description:description||'',addedAt:new Date().toISOString()};
  servers.push(srv);saveServers();res.json({success:true,server:srv});
});
app.delete('/api/admin/servers/:id',adminAuth,(req,res)=>{
  const i=servers.findIndex(s=>s.id===req.params.id);
  if(i===-1)return res.status(404).json({error:'Not found'});
  servers.splice(i,1);saveServers();res.json({success:true});
});

app.get('/api/admin/bot/status',adminAuth,(req,res)=>res.json(getStats()));
app.post('/api/admin/bot/restart',adminAuth,(req,res)=>{ res.json({success:true}); setTimeout(()=>process.exit(0),800); });
app.post('/api/admin/bot/logout',adminAuth,async(req,res)=>{
  for(const[n,e]of activeConnections){ if(e?.conn){try{e.conn.ev.removeAllListeners();e.conn.ws?.terminate();}catch{}} try{fs.rmSync(path.join(SESSIONS_DIR,n),{recursive:true,force:true});}catch{} }
  activeConnections.clear(); broadcastStats(); io.emit('botStatus',{connected:false,number:''});
  res.json({success:true});
});
app.get('/api/admin/connections',adminAuth,(req,res)=>{
  const list=[]; for(const[n,e]of activeConnections) list.push({number:'+'+n,connected:e.connected});
  res.json({connections:list});
});
app.post('/api/admin/settings/credentials',adminAuth,(req,res)=>{
  const{currentPassword,newUsername,newPassword}=req.body;
  if(currentPassword!==adminPassword)return res.status(403).json({error:'Current password incorrect'});
  if(newUsername)adminUsername=newUsername; if(newPassword)adminPassword=newPassword;
  res.json({success:true,message:'Updated (set ADMIN_USERNAME/ADMIN_PASSWORD env to persist)'});
});

// ======================== SOCKET.IO ========================
io.on('connection', socket => {
  const st=getStats();
  socket.emit('statsUpdate',{activeSockets:st.activeSockets,totalUsers:st.totalUsers,pairCount:st.pairCount});
  socket.emit('botStatus',{connected:st.connected,number:st.botNumber,deployId:DEPLOY_ID,platform:detectPlatform()});
  socket.on('disconnect',()=>{});
});

// ======================== GRACEFUL SHUTDOWN ========================
let isShuttingDown=false;
const gracefulShutdown=sig=>{
  if(isShuttingDown)return; isShuttingDown=true;
  console.log(`\n🛑 ${sig} — preserving all sessions`);
  saveStats();
  activeConnections.forEach((e,num)=>{ try{e.conn.ws?.terminate();console.log(`🔒 ${num}`);}catch{} });
  setTimeout(()=>process.exit(0),3000);
};
process.on('SIGINT',()=>gracefulShutdown('SIGINT'));
process.on('SIGTERM',()=>gracefulShutdown('SIGTERM'));
process.on('uncaughtException',err=>console.error('uncaughtException:',err.message));
process.on('unhandledRejection',err=>console.error('unhandledRejection:',err));

// ======================== KEEP-ALIVE ========================
const APP_URL = process.env.APP_URL || process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME
  ? `https://${process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME}`
  : null;
function startKeepAlive() {
  const url = APP_URL || process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : null;
  if (!url) return;
  const interval = 25 * 60 * 1000;
  setInterval(() => {
    try {
      const https = require('https');
      const http  = require('http');
      const mod   = url.startsWith('https') ? https : http;
      mod.get(url + '/health', res => {
        console.log(`💓 Keep-alive ping → ${res.statusCode}`);
      }).on('error', () => {});
    } catch {}
  }, interval);
  console.log(`💓 Keep-alive enabled → ${url}`);
}
app.get('/health', (req, res) => res.json({
  ok: true,
  uptime: Math.floor((Date.now() - START_TIME) / 1000),
  connected: [...activeConnections.values()].some(e => e.connected),
  platform: detectPlatform(),
  deployId: DEPLOY_ID,
}));

// ======================== START ========================
server.listen(PORT, async () => {
  console.log(`\n╔════════════════════════════════════════════════════╗`);
  console.log(`║  🔥 REDXBOT302 FINAL EDITION v5.2                  ║`);
  console.log(`║  🌐 http://localhost:${String(PORT).padEnd(26)}║`);
  console.log(`║  🆔 Deploy ID: ${String(DEPLOY_ID).padEnd(34)}║`);
  console.log(`║  🔑 Deploy Key: ${String(deploys[DEPLOY_ID]?.deployKey||'—').slice(0,20).padEnd(33)}║`);
  console.log(`║  🌐 Platform:  ${String(detectPlatform()).padEnd(34)}║`);
  console.log(`║  🔌 Commands:  ${String(cmdCount+'+ loaded').padEnd(34)}║`);
  console.log(`╚════════════════════════════════════════════════════╝\n`);
  await reloadExistingSessions();
  startKeepAlive();
});

async function reloadExistingSessions() {
  console.log('🔄 Checking existing sessions...');
  if (!fs.existsSync(SESSIONS_DIR)) return;
  const dirs = fs.readdirSync(SESSIONS_DIR).filter(d => {
    try { return fs.statSync(path.join(SESSIONS_DIR,d)).isDirectory(); } catch { return false; }
  });
  console.log(`📂 Found ${dirs.length} session(s)`);
  for (const num of dirs) {
    if (fs.existsSync(path.join(SESSIONS_DIR,num,'creds.json'))) {
      console.log(`🔄 Reloading: ${num}`);
      try { await initConnection(num); } catch(e){ console.error(`Reload ${num}: ${e.message}`); }
    }
  }
  broadcastStats();
  console.log('✅ Session reload done');
}

function getStats() {
  return {
    connected: [...activeConnections.values()].some(e=>e.connected),
    activeSockets: [...activeConnections.values()].filter(e=>e.connected).length,
    botNumber: (()=>{ for(const[n,e]of activeConnections) if(e.connected) return n; return ''; })(),
    commands: cmdCount+8,
    totalUsers: statsData.totalUsers,
    pairCount: statsData.pairCount,
    uptime: Math.floor((Date.now()-START_TIME)/1000),
    mode: global.BOT_MODE,
    deployId: DEPLOY_ID,
    platform: detectPlatform(),
    hasSession: (()=>{ try{ return fs.readdirSync(SESSIONS_DIR).some(d=>fs.existsSync(path.join(SESSIONS_DIR,d,'creds.json'))); }catch{return false;} })(),
    botName: deploys[DEPLOY_ID]?.botName || BOT_NAME,
    ownerName: deploys[DEPLOY_ID]?.ownerName || OWNER_NAME,
    prefix: deploys[DEPLOY_ID]?.prefix || PREFIX,
  };
}

module.exports = { app, server, io };
