/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║            🔥 REDXBOT302 v7.0.0 🔥                          ║
 * ║   WhatsApp MD Bot — No SESSION_ID, Pair-Only                 ║
 * ║   Single index.js — Admin + User + Bot + Web Server          ║
 * ║   Owner  : Abdul Rehman Rajpoot  +923009842133               ║
 * ║   Co-Own : Muzamil Khan          +923183928892               ║
 * ║   GitHub : github.com/AbdulRehman19721986                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  ROUTES:
 *    GET  /                  → public user panel (pair + deploy lookup)
 *    GET  /health            → uptime check (Railway/Heroku)
 *    POST /api/pair          → get pairing code
 *    POST /api/login         → get admin token
 *    GET  /api/status        → public bot stats
 *    GET  /api/lookup/:id    → look up deploy ID
 *    GET  /api/admin/*       → admin only (x-admin-auth header)
 */

'use strict';
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const http      = require('http');
const path      = require('path');
const fs        = require('fs');
const crypto    = require('crypto');
const multer    = require('multer');

const {
  useMultiFileAuthState,
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys');
const P = require('pino');

// ════════════════════════════════════════════════════════════════
//  CONFIG
// ════════════════════════════════════════════════════════════════
const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const OWNER_NAME     = process.env.OWNER_NAME     || 'Abdul Rehman Rajpoot';
const OWNER_NUM      = process.env.OWNER_NUMBER   || '923009842133';
const CO_OWNER       = process.env.CO_OWNER       || 'Muzamil Khan';
const CO_OWNER_NUM   = process.env.CO_OWNER_NUM   || '923183928892';
const PREFIX         = process.env.PREFIX         || '.';
const MENU_IMAGE     = process.env.MENU_IMAGE     || 'https://files.catbox.moe/s36b12.jpg';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';
const REPO_LINK      = 'https://github.com/AbdulRehman19721986/REDXBOT-MD';
const WA_GROUP       = 'https://chat.whatsapp.com/LhSmx2SeXX75r8I2bxsNDo';
const WA_CHANNEL     = 'https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10';
const TG_GROUP       = 'https://t.me/TeamRedxhacker2';
const YOUTUBE        = 'https://youtube.com/@rootmindtech';
const PORT           = process.env.PORT || 3000;
const VERSION        = '7.0.0';

// ── Paths ────────────────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, 'data');
const SESS_DIR    = path.join(__dirname, 'sessions');
const PLUGINS_DIR = path.join(__dirname, 'plugins');
const PUBLIC_DIR  = path.join(__dirname, 'public');
const CREDS_FILE  = path.join(DATA_DIR, 'admin_creds.json');
const BOT_FILE    = path.join(DATA_DIR, 'bot.json');
const CFG_FILE    = path.join(DATA_DIR, 'config.json');

[DATA_DIR, SESS_DIR, PLUGINS_DIR, PUBLIC_DIR, path.join(DATA_DIR,'uploads')].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── Admin creds ──────────────────────────────────────────────────
let ADMIN_USER = process.env.ADMIN_USER || 'redx';
let ADMIN_PASS = process.env.ADMIN_PASS || 'redx';
try { const c = JSON.parse(fs.readFileSync(CREDS_FILE,'utf8')); ADMIN_USER = c.user||ADMIN_USER; ADMIN_PASS = c.pass||ADMIN_PASS; } catch {}
const saveAdminCreds = () => fs.writeFileSync(CREDS_FILE, JSON.stringify({ user:ADMIN_USER, pass:ADMIN_PASS }, null,2));

// ── Bot data ─────────────────────────────────────────────────────
let botData = { totalUsers:0, deployIds:{} };
try { botData = { ...botData, ...JSON.parse(fs.readFileSync(BOT_FILE,'utf8')||'{}') }; } catch {}
const saveBot = () => { try { fs.writeFileSync(BOT_FILE, JSON.stringify(botData,null,2)); } catch {} };
setInterval(saveBot, 30000);

// ── Helpers ──────────────────────────────────────────────────────
const rjson = f => { try { return JSON.parse(fs.readFileSync(f,'utf8')||'{}'); } catch { return {}; } };
const wjson = (f,d) => fs.writeFileSync(f, JSON.stringify(d,null,2));
const uptime = () => Math.floor((Date.now() - global.START_TIME)/1000);
const fmtUp  = s => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60; return `${h}h ${m}m ${sc}s`; };
const ctxBase = () => ({
  forwardingScore:999, isForwarded:true,
  forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, newsletterName:`🔥 ${BOT_NAME}`, serverMessageId:200 },
});

// ── Globals ──────────────────────────────────────────────────────
global.BOT_MODE   = process.env.BOT_MODE || 'public';
global.START_TIME = Date.now();

const commands      = new Map();
const activeConns   = new Map();
const downloadSess  = new Map();
const userPrefixes  = new Map();

// ════════════════════════════════════════════════════════════════
//  EXPRESS
// ════════════════════════════════════════════════════════════════
const app    = express();
const server = http.createServer(app);
const upload = multer({ dest:path.join(DATA_DIR,'uploads/'), limits:{fileSize:10*1024*1024} });

app.use(cors({ origin:'*' }));
app.use(express.json({ limit:'10mb' }));

// ── Admin auth ───────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const h = req.headers['x-admin-auth'] || '';
  try {
    const dec = Buffer.from(h,'base64').toString();
    const i   = dec.indexOf(':');
    if (dec.substring(0,i) === ADMIN_USER && dec.substring(i+1) === ADMIN_PASS) return next();
  } catch {}
  res.status(401).json({ error:'Unauthorized' });
}

// ── Serve single-page panel for ALL non-API routes ──────────────
const PANEL_FILE = path.join(PUBLIC_DIR, 'index.html');
app.use('/assets', express.static(path.join(PUBLIC_DIR,'assets')));
app.get('/', (_, res) => {
  if (fs.existsSync(PANEL_FILE)) return res.sendFile(PANEL_FILE);
  res.send('<h1>🔥 REDXBOT302</h1><p>Panel loading...</p>');
});
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/ping')) return next();
  if (fs.existsSync(PANEL_FILE)) return res.sendFile(PANEL_FILE);
  next();
});

// ── Health ───────────────────────────────────────────────────────
app.get('/health',  (_, res) => res.json({ status:'ok', uptime:uptime(), version:VERSION }));
app.get('/healthz', (_, res) => res.status(200).send('OK'));
app.get('/ping',    (_, res) => res.status(200).send('pong'));

// ════════════════════════════════════════════════════════════════
//  PUBLIC API
// ════════════════════════════════════════════════════════════════
app.get('/api/status', (_, res) => res.json({
  status:'online', bot:BOT_NAME, version:VERSION,
  instances:Object.keys(botData.deployIds).length,
  totalUsers:botData.totalUsers,
  commands:commands.size + 12,
  uptime:uptime(), uptimeFormatted:fmtUp(uptime()),
  mode:global.BOT_MODE,
  platform: process.env.RAILWAY_ENVIRONMENT?'Railway':process.env.DYNO?'Heroku':process.env.RENDER?'Render':'Local',
}));

app.get('/api/config', (_, res) => res.json({
  botName:BOT_NAME, ownerName:OWNER_NAME, coOwner:CO_OWNER,
  prefix:PREFIX, menuImage:MENU_IMAGE, waGroup:WA_GROUP, tgGroup:TG_GROUP,
  youtube:YOUTUBE, repoLink:REPO_LINK, waChannel:WA_CHANNEL,
}));

app.get('/api/lookup/:id', (req, res) => {
  const entry = botData.deployIds[req.params.id?.toUpperCase()];
  if (!entry) return res.status(404).json({ success:false, error:'Deploy ID not found' });
  res.json({ success:true, deployId:req.params.id.toUpperCase(), phone:entry.phone,
    status:activeConns.has(entry.phone)?'online':'offline', createdAt:entry.createdAt });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username===ADMIN_USER && password===ADMIN_PASS) {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    res.json({ success:true, token });
  } else {
    res.status(401).json({ success:false, error:'Invalid credentials' });
  }
});

// ── PAIR ─────────────────────────────────────────────────────────
app.post('/api/pair', async (req, res) => {
  let tempConn;
  try {
    const num = (req.body.number||'').replace(/\D/g,'');
    if (!num || num.length < 7) return res.status(400).json({ error:'Invalid phone number' });
    const sessDir = path.join(SESS_DIR, num);
    if (!fs.existsSync(sessDir)) fs.mkdirSync(sessDir, { recursive:true });
    const { state, saveCreds } = await useMultiFileAuthState(sessDir);
    const { version }          = await fetchLatestBaileysVersion();
    tempConn = makeWASocket({
      logger:P({ level:'silent' }), auth:state, version,
      browser:Browsers.macOS('Safari'), printQRInTerminal:false,
      connectTimeoutMs:60000, keepAliveIntervalMs:25000,
    });
    if (!activeConns.has(num)) { botData.totalUsers++; saveBot(); }
    activeConns.set(num, { conn:tempConn, saveCreds });
    setupConn(tempConn, num, saveCreds);
    await new Promise(r => setTimeout(r, 3000));
    const code     = await tempConn.requestPairingCode(num);
    const deployId = getDeployId(num);
    const fmt      = (code||'').toString().trim().match(/.{1,4}/g)?.join('-') || code;
    console.log(`📱 Pair code for ${num}: ${fmt}`);
    res.json({ success:true, pairingCode:fmt, code:fmt, deployId });
  } catch (e) {
    if (tempConn) try { tempConn.ws?.close(); } catch {}
    res.status(500).json({ error:e.message||'Pairing failed. Try again.' });
  }
});

app.post('/api/logout', async (req, res) => {
  const num = (req.body.number||'').replace(/\D/g,'');
  try {
    if (num && activeConns.has(num)) {
      try { activeConns.get(num).conn?.ws?.close(); } catch {}
      activeConns.delete(num);
      try { fs.rmSync(path.join(SESS_DIR,num), {recursive:true,force:true}); } catch {}
    }
    res.json({ success:true });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

// ════════════════════════════════════════════════════════════════
//  ADMIN API  (all need x-admin-auth header)
// ════════════════════════════════════════════════════════════════
app.get('/api/admin/stats', adminAuth, (_, res) => res.json({
  totalUsers:botData.totalUsers,
  instances:Object.keys(botData.deployIds).length,
  onlineNow:activeConns.size,
  plugins:fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).length,
  commands:commands.size+12, uptime:uptime(), uptimeFormatted:fmtUp(uptime()),
  mode:global.BOT_MODE, version:VERSION,
  platform:process.env.RAILWAY_ENVIRONMENT?'Railway':process.env.DYNO?'Heroku':process.env.RENDER?'Render':'Local',
  memory: process.memoryUsage(),
  nodeVersion: process.version,
}));

app.get('/api/admin/instances', adminAuth, (_, res) => {
  const list = Object.entries(botData.deployIds).map(([id,v]) => ({
    deployId:id, phone:v.phone, createdAt:v.createdAt,
    status:activeConns.has(v.phone)?'online':'offline',
  }));
  res.json({ success:true, instances:list });
});

app.delete('/api/admin/instances/:id', adminAuth, (req, res) => {
  const id = req.params.id.toUpperCase();
  if (botData.deployIds[id]) {
    const phone = botData.deployIds[id].phone;
    delete botData.deployIds[id]; saveBot();
    if (activeConns.has(phone)) {
      try { activeConns.get(phone).conn?.ws?.close(); } catch {}
      activeConns.delete(phone);
    }
  }
  res.json({ success:true });
});

app.get('/api/admin/config',  adminAuth, (_, res)  => res.json({ success:true, config:rjson(CFG_FILE) }));
app.post('/api/admin/config', adminAuth, (req, res) => {
  const updated = { ...rjson(CFG_FILE), ...req.body, updatedAt:new Date().toISOString() };
  wjson(CFG_FILE, updated);
  if (req.body.mode) global.BOT_MODE = req.body.mode;
  res.json({ success:true, config:updated });
});

app.post('/api/admin/change-password', adminAuth, (req, res) => {
  const { newUser, newPass } = req.body;
  if (!newPass || newPass.length < 3) return res.status(400).json({ error:'Password too short (min 3)' });
  ADMIN_USER = newUser||ADMIN_USER;
  ADMIN_PASS = newPass;
  saveAdminCreds();
  res.json({ success:true, message:'Credentials updated. Please log in again.' });
});

app.post('/api/admin/restart', adminAuth, (req, res) => {
  res.json({ success:true, message:'Restarting...' });
  setTimeout(() => process.exit(0), 500);
});

app.post('/api/admin/logout-all', adminAuth, async (req, res) => {
  for (const [phone, entry] of activeConns) {
    try { entry.conn?.ws?.close(); } catch {}
    try { fs.rmSync(path.join(SESS_DIR,phone),{recursive:true,force:true}); } catch {}
  }
  activeConns.clear();
  res.json({ success:true, message:'All sessions cleared' });
});

// Plugin manager
app.get('/api/admin/plugins', adminAuth, (_, res) => {
  const plugins = fs.readdirSync(PLUGINS_DIR).filter(f=>f.endsWith('.js')).map(f => {
    const s = fs.statSync(path.join(PLUGINS_DIR,f));
    return { name:f, size:s.size, modified:s.mtime };
  });
  res.json({ success:true, plugins });
});

app.post('/api/admin/plugins/upload', adminAuth, upload.single('plugin'), (req, res) => {
  if (!req.file) return res.status(400).json({ error:'No file uploaded' });
  if (!req.file.originalname.endsWith('.js')) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error:'Only .js files allowed' });
  }
  const dest = path.join(PLUGINS_DIR, req.file.originalname);
  fs.renameSync(req.file.path, dest);
  setTimeout(loadPlugins, 500);
  res.json({ success:true, message:`✅ ${req.file.originalname} installed & reloaded.` });
});

app.get('/api/admin/plugins/:name', adminAuth, (req, res) => {
  const fp = path.join(PLUGINS_DIR, path.basename(req.params.name));
  if (!fs.existsSync(fp)) return res.status(404).json({ error:'Not found' });
  res.json({ success:true, content:fs.readFileSync(fp,'utf8') });
});

app.put('/api/admin/plugins/:name', adminAuth, (req, res) => {
  const fp = path.join(PLUGINS_DIR, path.basename(req.params.name));
  fs.writeFileSync(fp, req.body.content||'', 'utf8');
  setTimeout(loadPlugins, 200);
  res.json({ success:true });
});

app.delete('/api/admin/plugins/:name', adminAuth, (req, res) => {
  const fp = path.join(PLUGINS_DIR, path.basename(req.params.name));
  if (!fs.existsSync(fp)) return res.status(404).json({ error:'Not found' });
  fs.unlinkSync(fp);
  setTimeout(loadPlugins, 200);
  res.json({ success:true });
});

app.post('/api/admin/plugins/reload', adminAuth, (req, res) => {
  loadPlugins();
  res.json({ success:true, commands:commands.size+12, message:'Plugins reloaded' });
});

// File manager (data/ and plugins/ only, safe)
const SAFE_DIRS = [path.resolve(DATA_DIR), path.resolve(PLUGINS_DIR)];
const safePath  = rel => {
  const abs = path.resolve(__dirname, (rel||'').replace(/^\/+/,''));
  return SAFE_DIRS.some(s => abs.startsWith(s)) ? abs : null;
};

app.get('/api/admin/files', adminAuth, (req, res) => {
  try {
    const fp = safePath(req.query.path||'data');
    if (!fp||!fs.existsSync(fp)) return res.status(404).json({ error:'Not found' });
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      const items = fs.readdirSync(fp).map(name => {
        const full = path.join(fp,name), s = fs.statSync(full);
        return { name, path:(req.query.path||'data').replace(/\\/g,'/')+'/'+name, isDir:s.isDirectory(), size:s.size };
      });
      return res.json({ success:true, items });
    }
    res.json({ success:true, content:fs.readFileSync(fp,'utf8') });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.put('/api/admin/files', adminAuth, (req, res) => {
  const fp = safePath(req.body.path||'');
  if (!fp) return res.status(403).json({ error:'Forbidden path' });
  fs.writeFileSync(fp, req.body.content||'', 'utf8');
  res.json({ success:true });
});

app.delete('/api/admin/files', adminAuth, (req, res) => {
  const fp = safePath(req.query.path||'');
  if (!fp||!fs.existsSync(fp)) return res.status(404).json({ error:'Not found' });
  fs.unlinkSync(fp);
  res.json({ success:true });
});

// Announcements
app.get('/api/admin/announcements',  adminAuth, (_, res) => {
  const d = rjson(path.join(DATA_DIR,'ann.json'));
  res.json({ success:true, list:d.list||[] });
});
app.post('/api/admin/announcements', adminAuth, (req, res) => {
  const f = path.join(DATA_DIR,'ann.json');
  const d = rjson(f); if (!d.list) d.list=[];
  d.list.unshift({ text:req.body.text, at:new Date().toISOString() });
  if (d.list.length > 50) d.list = d.list.slice(0,50);
  wjson(f,d); res.json({ success:true });
});

// ════════════════════════════════════════════════════════════════
//  PLUGIN LOADER
// ════════════════════════════════════════════════════════════════
function loadPlugins() {
  commands.clear();
  if (!fs.existsSync(PLUGINS_DIR)) return;
  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js') && !f.startsWith('_'));
  let count = 0;
  for (const file of files) {
    try {
      const fp = path.join(PLUGINS_DIR, file);
      delete require.cache[require.resolve(fp)];
      const mod = require(fp);
      const reg = cmd => {
        if (!cmd?.pattern || typeof cmd.execute !== 'function') return;
        commands.set(cmd.pattern, cmd); count++;
        (cmd.alias||[]).forEach(a => commands.set(a, cmd));
      };
      if (mod?.pattern)           reg(mod);
      else if (Array.isArray(mod)) mod.forEach(reg);
      else if (typeof mod==='object') Object.values(mod).filter(v=>v?.pattern).forEach(reg);
    } catch(e) { console.error(`❌ Plugin [${file}]: ${e.message?.slice(0,80)}`); }
  }
  console.log(`🔌 Loaded ${count} commands from ${files.length} plugins`);
}
loadPlugins();
fs.watch(PLUGINS_DIR, (_,f) => { if (f?.endsWith('.js')) setTimeout(loadPlugins, 300); });

// ════════════════════════════════════════════════════════════════
//  DEPLOY ID SYSTEM
// ════════════════════════════════════════════════════════════════
function getDeployId(phone) {
  const ex = Object.entries(botData.deployIds).find(([,v]) => v.phone===phone);
  if (ex) return ex[0];
  let id;
  do { id = 'REDX' + crypto.randomBytes(4).toString('hex').toUpperCase(); }
  while (botData.deployIds[id]);
  botData.deployIds[id] = { phone, createdAt:new Date().toISOString() };
  saveBot();
  return id;
}

// ════════════════════════════════════════════════════════════════
//  BOT CONNECTION
// ════════════════════════════════════════════════════════════════
function setupConn(conn, phone, saveCreds) {
  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log(`✅ Connected: +${phone}`);
      const deployId = getDeployId(phone);
      const botJid   = conn.user.id.split(':')[0] + '@s.whatsapp.net';
      try { if (conn.newsletterFollow) await conn.newsletterFollow(NEWSLETTER_JID); } catch {}
      await new Promise(r => setTimeout(r, 3000));
      // ── Welcome message ────────────────────────────────────────
      try {
        await conn.sendMessage(botJid, {
          image: { url:MENU_IMAGE },
          caption: buildWelcome(phone, deployId),
          contextInfo: {
            ...ctxBase(),
            externalAdReply: { title:`🔥 ${BOT_NAME} ONLINE`, body:`Owner: ${OWNER_NAME}`,
              thumbnailUrl:MENU_IMAGE, sourceUrl:REPO_LINK, mediaType:1, renderLargerThumbnail:true },
          },
        });
        await new Promise(r => setTimeout(r, 1500));
        await conn.sendMessage(botJid, {
          text: `🔑 *YOUR SECRET DEPLOY KEY*\n\n╔══════════════════════════╗\n║  \`${deployId}\`  ║\n╚══════════════════════════╝\n\n⚠️ *Save this privately! Don't share with anyone.*\n\n📱 Use this key on the website to:\n• View your bot status\n• Change prefix, name, mode\n• Restart or logout your bot\n\n> 🔥 ${BOT_NAME} — By ${OWNER_NAME}`,
        });
      } catch {}
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log(`🔄 Reconnecting +${phone} (code ${code})`);
        setTimeout(() => reconnect(phone), 5000);
      } else {
        activeConns.delete(phone);
        console.log(`🚪 Logged out: +${phone}`);
      }
    }
  });

  // Auto-reject calls
  conn.ev.on('call', async calls => {
    for (const call of calls) {
      if (call.status !== 'offer') continue;
      try { const ac = require('./plugins/anticall'); if (ac.handleIncomingCall) await ac.handleIncomingCall(conn, call); } catch {}
    }
  });

  // Messages
  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try { const ad = require('./plugins/antidelete'); if (ad.cacheMessage) await ad.cacheMessage(msg); } catch {}
      try { await handleMsg(conn, msg, phone); } catch(e) { console.error('Msg error:', e.message); }
    }
  });

  // Group events
  conn.ev.on('group-participants.update', async update => {
    try {
      const GE = require('./data/groupevents');
      await GE(conn, update, { botName:BOT_NAME, ownerName:OWNER_NAME, menuImage:MENU_IMAGE, newsletterJid:NEWSLETTER_JID });
    } catch {}
  });

  // Antidelete
  conn.ev.on('messages.delete', async item => {
    try { const ad = require('./plugins/antidelete'); if (ad.handleDelete) await ad.handleDelete(conn, item); } catch {}
  });
}

async function reconnect(phone) {
  if (!activeConns.has(phone)) return;
  const sessDir = path.join(SESS_DIR, phone);
  if (!fs.existsSync(sessDir)) return;
  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessDir);
    const { version }          = await fetchLatestBaileysVersion();
    const c = makeWASocket({ logger:P({level:'silent'}), auth:state, version,
      browser:Browsers.macOS('Safari'), connectTimeoutMs:60000, keepAliveIntervalMs:25000 });
    activeConns.set(phone, { conn:c, saveCreds });
    setupConn(c, phone, saveCreds);
  } catch(e) { console.error('Reconnect error:', e.message); }
}

async function restoreAll() {
  if (!fs.existsSync(SESS_DIR)) return;
  const dirs = fs.readdirSync(SESS_DIR).filter(d => {
    try { return fs.statSync(path.join(SESS_DIR,d)).isDirectory(); } catch { return false; }
  });
  console.log(`📂 Restoring ${dirs.length} session(s)...`);
  for (const phone of dirs) {
    if (!fs.existsSync(path.join(SESS_DIR,phone,'creds.json'))) continue;
    try {
      const { state, saveCreds } = await useMultiFileAuthState(path.join(SESS_DIR,phone));
      const { version }          = await fetchLatestBaileysVersion();
      const c = makeWASocket({ logger:P({level:'silent'}), auth:state, version,
        browser:Browsers.macOS('Safari'), connectTimeoutMs:60000, keepAliveIntervalMs:25000 });
      activeConns.set(phone, { conn:c, saveCreds });
      setupConn(c, phone, saveCreds);
      console.log(`✅ Restored: +${phone}`);
    } catch(e) { console.error(`Restore [${phone}]: ${e.message}`); }
  }
}

// ════════════════════════════════════════════════════════════════
//  MESSAGE HANDLER
// ════════════════════════════════════════════════════════════════
async function handleMsg(conn, msg, phone) {
  if (!msg.message) return;
  const from   = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  if (!from || from.endsWith('@newsletter')) return;

  // Status auto-react
  if (from === 'status@broadcast') {
    await conn.readMessages([msg.key]).catch(()=>{});
    const e=['🔥','⚡','💯','👑','🚀','💎','❤️','✨','🌟'];
    await conn.sendMessage(from,{react:{text:e[Math.floor(Math.random()*e.length)],key:msg.key}},{statusJidList:[msg.key.participant,conn.user.id]}).catch(()=>{});
    return;
  }

  const isGroup = from.endsWith('@g.us');
  const isOwner = [OWNER_NUM,CO_OWNER_NUM,process.env.TEMP_OWNER||''].includes(sender.split('@')[0]);
  if (global.BOT_MODE==='private' && !isOwner) return;

  // Anti-abuse (group)
  if (isGroup) {
    try { const af=require('./plugins/antilink'); if(af.handleAntiLink) await af.handleAntiLink(conn,msg); } catch {}
    try { const ab=require('./plugins/antibadword'); if(ab.handleAntiBadword||ab.checkAntiBadword) await (ab.handleAntiBadword||ab.checkAntiBadword)(conn,msg); } catch {}
  }

  const body = getBody(msg);
  const pfx  = userPrefixes.get(phone) || PREFIX;

  // Auto-react
  try {
    const store = require('./lib/lightweight_store');
    const ar    = await store.getSetting(from,'autoreact').catch(()=>null);
    if (ar?.enabled && !msg.key.fromMe) await conn.sendMessage(from,{react:{text:ar.emoji||'❤️',key:msg.key}}).catch(()=>{});
  } catch {}

  // Auto-read
  try {
    const store = require('./lib/lightweight_store');
    if (await store.getSetting('global','autoread').catch(()=>null)) await conn.readMessages([msg.key]).catch(()=>{});
  } catch {}

  // Chatbot mode
  if (body && !body.startsWith(pfx)) {
    try {
      const store   = require('./lib/lightweight_store');
      const replies = await store.getSetting(from,'autoreplies').catch(()=>null);
      if (replies) {
        const match = replies[body.toLowerCase().trim()];
        if (match) { await conn.sendMessage(from,{text:match},{quoted:msg}); return; }
      }
    } catch {}
  }

  // ── Number-reply handler (download + menu selection) ─────────
  const dlKey = `${from}_${sender}`;
  if (downloadSess.has(dlKey) && body && !body.startsWith(pfx)) {
    const num = parseInt(body.trim());
    if (!isNaN(num) && num > 0) {
      const sess = downloadSess.get(dlKey);
      if (sess?.handler) {
        try { await sess.handler(conn, msg, num, sess); } catch(e) {
          await conn.sendMessage(from,{text:`❌ ${e.message}`},{quoted:msg});
        }
        if (sess.type !== 'menu') downloadSess.delete(dlKey);
        return;
      }
    }
  }

  if (!body.startsWith(pfx)) return;

  const parts = body.slice(pfx.length).trim().split(/\s+/);
  const cmd   = parts.shift().toLowerCase();
  const args  = parts;
  const q     = body.slice(pfx.length + cmd.length).trim();

  // Typing indicator
  try {
    const store = require('./lib/lightweight_store');
    if (await store.getSetting('global','autotyping').catch(()=>null)) await conn.sendPresenceUpdate('composing',from).catch(()=>{});
  } catch {}

  console.log(`[${new Date().toLocaleTimeString()}] ${pfx}${cmd} | +${sender.split('@')[0]}`);

  if (await handleBuiltIn(conn, msg, cmd, args, q, from, sender, phone, pfx, isOwner)) return;

  const plug = commands.get(cmd);
  if (!plug) return;

  try {
    const reply = (text, opts={}) => conn.sendMessage(from,{text},{quoted:msg,...opts});
    let groupMetadata=null, isAdmin=false;
    if (isGroup) {
      try { groupMetadata = await conn.groupMetadata(from); } catch {}
      if (groupMetadata) { const p=groupMetadata.participants.find(x=>x.id===sender); isAdmin=!!p?.admin; }
    }
    await plug.execute(conn, msg,
      { mentionedJid:msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[], quoted:getQuoted(msg), sender, key:msg.key, downloadSessions:downloadSess, dlKey },
      { args, q, reply, from, isGroup, groupMetadata, sender, isAdmin, isOwner, isCreator:false,
        botName:BOT_NAME, ownerName:OWNER_NAME, prefix:pfx, phone, downloadSessions:downloadSess, dlKey });
  } catch(e) { console.error(`Plugin error [${cmd}]: ${e.message}`); }
}

// ════════════════════════════════════════════════════════════════
//  BUILT-IN COMMANDS
// ════════════════════════════════════════════════════════════════
async function handleBuiltIn(conn, msg, cmd, args, q, from, sender, phone, pfx, isOwner) {
  const ctx = () => ({
    ...ctxBase(),
    externalAdReply:{ title:`🔥 ${BOT_NAME}`, body:`Owner: ${OWNER_NAME}`, thumbnailUrl:MENU_IMAGE, sourceUrl:REPO_LINK, mediaType:1 },
  });
  const s = t => conn.sendMessage(from,{text:t,contextInfo:ctx()},{quoted:msg});

  switch (cmd) {
    case 'ping': case 'speed': {
      const t=Date.now(); await conn.sendMessage(from,{react:{text:'⚡',key:msg.key}});
      return s(`⚡ *Pong!* \`${Date.now()-t}ms\`\n⏰ Uptime: ${fmtUp(uptime())}`), true;
    }
    case 'menu': case 'help': case 'm':
      await sendMenu(conn, from, msg, pfx, phone); return true;
    case 'allmenu':
      await sendAllMenu(conn, from, msg, pfx); return true;
    case 'id': case 'myid': case 'deployid':
      await s(`🔑 *Deploy ID:* \`${getDeployId(phone)}\`\n\n💡 Use this on the website dashboard to manage your bot.`); return true;
    case 'mode':
      if (!isOwner) { await s('❌ Owner only!'); return true; }
      if (['public','private'].includes(args[0])) { global.BOT_MODE=args[0]; await s(`✅ Mode: *${args[0].toUpperCase()}*`); }
      else await s(`📌 Mode: *${global.BOT_MODE.toUpperCase()}*\n.mode public|private`);
      return true;
    case 'setprefix':
      if (!isOwner) { await s('❌ Owner only!'); return true; }
      if (args[0]) { userPrefixes.set(phone,args[0]); await s(`✅ Prefix: *${args[0]}*`); }
      return true;
    case 'setowner':
      if (!isOwner) { await s('❌ Owner only!'); return true; }
      if (args[0]) { process.env.TEMP_OWNER=args[0].replace(/\D/g,''); await s(`✅ Temp owner: +${process.env.TEMP_OWNER}`); }
      return true;
    case 'owner':
      await conn.sendMessage(from,{
        contacts:{ displayName:OWNER_NAME, contacts:[{ vcard:`BEGIN:VCARD\nVERSION:3.0\nFN:${OWNER_NAME}\nTEL;type=CELL;waid=${OWNER_NUM}:+${OWNER_NUM}\nEND:VCARD` }] },
      },{quoted:msg});
      return true;
    case 'uptime': case 'runtime':
      await s(`⏰ *Uptime:* ${fmtUp(uptime())}\n📦 Commands: ${commands.size+12}+\n💾 RAM: ${(process.memoryUsage().heapUsed/1048576).toFixed(1)}MB`);
      return true;
    case 'prefix':
      await s(`📌 Prefix: *${userPrefixes.get(phone)||pfx}*`); return true;
    default: return false;
  }
}

// ════════════════════════════════════════════════════════════════
//  MENU BUILDERS
// ════════════════════════════════════════════════════════════════
const CAT_EMOJI = { AI:'🤖', Fun:'🎉', Group:'👥', Sticker:'🎭', Download:'📥', Tools:'🔧',
  Media:'🎬', Games:'🎮', Utility:'🛠️', Owner:'👑', Auto:'⚙️', Search:'🔍', Other:'📦',
  'System':'⚙️', admin:'🔒', Admin:'🔒' };

async function sendMenu(conn, from, msg, pfx, phone) {
  const cats = {};
  for (const [n,c] of commands) {
    const cat = c.category || 'Other';
    if (!cats[cat]) cats[cat] = new Set();
    cats[cat].add(n);
  }
  cats['System'] = new Set(['ping','menu','allmenu','id','mode','prefix','owner','setowner','setprefix','uptime','runtime']);
  const catKeys = Object.keys(cats).sort();
  const up = Math.floor(uptime()/60);

  // KHAN-MD style interactive select menu
  let text = `╭┈───〔 *🔥 REDXBOT302 v7* 〕┈───⊷\n`;
  text += `┆👑 Owner: *${OWNER_NAME}*\n`;
  text += `┆🪄 Prefix: *${userPrefixes.get(phone)||pfx}*\n`;
  text += `┆🖼️ Version: *${VERSION}*\n`;
  text += `┆☁️ Platform: *${process.env.RAILWAY_ENVIRONMENT?'Railway':process.env.DYNO?'Heroku':process.env.RENDER?'Render':'Local'}*\n`;
  text += `┆📜 Commands: *${commands.size+12}+*\n`;
  text += `┆⏰ Runtime: *${fmtUp(uptime())}*\n`;
  text += `╰────────────────────────⊷\n`;
  text += `╭───⬡ *SELECT MENU* ⬡───\n`;
  catKeys.forEach((cat, i) => {
    const e = CAT_EMOJI[cat] || '📂';
    text += `┋ ⬡ ${i+1} ${e} *${cat}* (${cats[cat].size})\n`;
  });
  text += `╰────────────────────────⊷\n`;
  text += `> ʀᴇᴘʟʏ ᴡɪᴛʜ ɴᴜᴍʙᴇʀ ᴛᴏ sᴇʟᴇᴄᴛ (1-${catKeys.length})`;

  await conn.sendMessage(from, {
    image:{ url:MENU_IMAGE }, caption:text,
    contextInfo:{ ...ctxBase(), externalAdReply:{ title:`🔥 ${BOT_NAME}`, body:`${commands.size+12}+ commands`, thumbnailUrl:MENU_IMAGE, sourceUrl:REPO_LINK, mediaType:1, renderLargerThumbnail:true } },
  }, { quoted:msg });

  // Set up number-reply handler
  const dlKey = `${from}_${(msg.key.participant||msg.key.remoteJid)}`;
  downloadSess.set(dlKey, {
    type:'menu', catKeys, cats,
    handler: async (conn2, msg2, num, sess) => {
      const cat = sess.catKeys[num-1];
      if (!cat) return conn2.sendMessage(from,{text:`❌ Pick 1-${sess.catKeys.length}`},{quoted:msg2});
      const cmds = Array.from(sess.cats[cat]).sort();
      const e    = CAT_EMOJI[cat] || '📂';
      let t = `${e} *${cat.toUpperCase()} COMMANDS* (${cmds.length})\n\n`;
      cmds.forEach(x => { const p=commands.get(x); t+=`  ▸ ${pfx}${x}${p?.desc?` — _${p.desc}_`:''}\n`; });
      t += `\n> 🔥 ${BOT_NAME}`;
      await conn2.sendMessage(from,{text:t,contextInfo:ctxBase()},{quoted:msg2});
      downloadSess.delete(dlKey);
    },
  });
  setTimeout(() => downloadSess.delete(dlKey), 90000);
}

async function sendAllMenu(conn, from, msg, pfx) {
  const cats = {};
  for (const [n,c] of commands) {
    const cat = c.category || 'Other';
    if (!cats[cat]) cats[cat] = new Set();
    cats[cat].add(n);
  }
  cats['System'] = new Set(['ping','menu','allmenu','id','mode','prefix','owner','setowner','setprefix','uptime','runtime']);

  // REDXBOT302 full list style
  let t = `╭┈┄───【 *🔥 REDXBOT302 v7* 】───┄┈╮\n`;
  t += `├■ 👑 ${OWNER_NAME} & ${CO_OWNER}\n`;
  t += `├■ 📜 ${commands.size+12}+ Commands\n`;
  t += `├■ ⏱️ Runtime: ${fmtUp(uptime())}\n`;
  t += `├■ 📡 Baileys: Multi Device\n`;
  t += `├■ 📌 Prefix: ${pfx}\n`;
  t += `├■ 🖼️ Version: ${VERSION}\n`;
  t += `╰───────────────────────────┄┈╯\n\n`;

  Object.entries(cats).sort().forEach(([cat, cmds]) => {
    const e = CAT_EMOJI[cat] || '📂';
    t += `╭──「 ${e} *${cat.toUpperCase()}* (${cmds.size}) 」\n`;
    Array.from(cmds).sort().forEach(c => { t += `│  ◈ ${pfx}${c}\n`; });
    t += `╰──────────────────────────\n\n`;
  });

  t += `╭┈┄───【 🔗 *LINKS* 】───┄┈╮\n`;
  t += `├ 💬 WA: ${WA_GROUP}\n`;
  t += `├ 📣 Channel: ${WA_CHANNEL}\n`;
  t += `├ 📲 TG: ${TG_GROUP}\n`;
  t += `├ ▶️ YT: ${YOUTUBE}\n`;
  t += `╰┈┄──────────────────────┄┈╯\n\n`;
  t += `> ✨ ${BOT_NAME} — By ${OWNER_NAME}`;

  await conn.sendMessage(from, {
    image:{ url:MENU_IMAGE }, caption:t,
    contextInfo:{ ...ctxBase(), externalAdReply:{ title:`🔥 ${BOT_NAME} — All ${commands.size+12}+ Commands`, body:`Type ${pfx}menu for interactive menu`, thumbnailUrl:MENU_IMAGE, sourceUrl:REPO_LINK, mediaType:1 } },
  }, { quoted:msg });
}

// ════════════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════════════
function getBody(msg) {
  return msg.message?.conversation || msg.message?.extendedTextMessage?.text
    || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || '';
}
function getQuoted(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (!ctx?.quotedMessage) return null;
  return { message:{ key:{ remoteJid:ctx.participant, id:ctx.stanzaId, fromMe:false }, message:ctx.quotedMessage }, sender:ctx.participant };
}
function buildWelcome(phone, deployId) {
  return `╔══════════════════════════════╗\n║  🔥 *REDXBOT302 v7 ONLINE* 🔥 ║\n╚══════════════════════════════╝\n\n✅ *Bot Connected!*\n📱 Number: *+${phone}*\n👑 Owner: *${OWNER_NAME}*\n📌 Prefix: *${PREFIX}*\n🌍 Mode: *${global.BOT_MODE.toUpperCase()}*\n🤖 Commands: *${commands.size+12}+*\n🔑 Deploy ID: \`${deployId}\`\n\n💡 Type *${PREFIX}menu* for interactive menu\n💡 Type *${PREFIX}allmenu* for full list\n\n${REPO_LINK}\n${WA_GROUP}\n\n> 🔥 ${BOT_NAME} — By ${OWNER_NAME}`;
}

// ════════════════════════════════════════════════════════════════
//  START SERVER
// ════════════════════════════════════════════════════════════════
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   🔥 REDXBOT302 v${VERSION} — STARTED                ║
╠═══════════════════════════════════════════════════╣
║   👑 Owner  : ${OWNER_NAME.padEnd(35)}║
║   🌐 Port   : ${String(PORT).padEnd(35)}║
║   🔌 Plugins: ${String(commands.size+' commands').padEnd(35)}║
║   🌍 Mode   : ${global.BOT_MODE.toUpperCase().padEnd(35)}║
╠═══════════════════════════════════════════════════╣
║   🌐 Panel  : http://0.0.0.0:${PORT}/              ║
║   🏥 Health : http://0.0.0.0:${PORT}/health         ║
╚═══════════════════════════════════════════════════╝
  `);
  await restoreAll();
});

server.on('error', err => { console.error('❌ Server error:', err.message); process.exit(1); });
process.on('uncaughtException',  e => console.error('Uncaught:', e.message));
process.on('unhandledRejection', e => console.error('Unhandled:', e));
process.on('SIGINT',  () => { saveBot(); process.exit(0); });
process.on('SIGTERM', () => { saveBot(); process.exit(0); });

module.exports = { app, server };
