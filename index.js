'use strict';
/*****************************************************************************
 *                                                                           *
 *              REDXBOT ULTRA — v6.0 (Non-Stop Ultra Edition)               *
 *                                                                           *
 *   Built by : Abdul Rehman Rajpoot & Muzamil Khan                         *
 *   YouTube  : https://youtube.com/@rootmindtech                           *
 *   Channel  : https://whatsapp.com/channel/0029VbCPnYf96H4SNehkev10       *
 *   Telegram : https://t.me/TeamRedxhacker2                                *
 *   WA Group : https://chat.whatsapp.com/LhSmx2SeXX75r8I2bxsNDo            *
 *                                                                           *
 *   ✅ NO SESSION ID NEEDED — Just pair your number and go!                *
 *   ✅ 429+ Plugins from Verbose Fishstick + Arslan MD                     *
 *   ✅ Ultra-fast non-stop reconnect                                        *
 *   ✅ Auto pairing via web UI                                              *
 *                                                                           *
 *****************************************************************************/

// ── SUPPRESS NOISE ───────────────────────────────────────────────────────────
const _origErr = console.error;
const _errCounts = new Map();
console.error = function (...a) {
  const m = a.join(' ');
  if (m.includes('Bad MAC') || m.includes('Failed to decrypt') || m.includes('proto3 deserialization')) {
    const k = m.slice(0, 80);
    const c = (_errCounts.get(k) || 0) + 1;
    _errCounts.set(k, c);
    if (c <= 2) _origErr.apply(console, a);
    else if (c === 3) _origErr(`[Suppressed] Repeated error: ${k}`);
    return;
  }
  _origErr.apply(console, a);
};

// ── IMPORTS ──────────────────────────────────────────────────────────────────
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const http     = require('http');
const socketIo = require('socket.io');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const chalk    = require('chalk');
const axios    = require('axios');
const { Boom } = require('@hapi/boom');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  jidDecode,
  proto,
  makeCacheableSignalKeyStore,
  delay
} = require('@whiskeysockets/baileys');
const P = require('pino');

// ── SETTINGS ─────────────────────────────────────────────────────────────────
const settings = require('./settings');

// ── SERVER SETUP ─────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, { cors: { origin: '*' } });
const PORT   = process.env.PORT || 3000;
const START  = Date.now();

app.use(cors({ origin: '*', methods: ['GET','POST','DELETE','PUT','OPTIONS'], allowedHeaders: ['Content-Type','x-admin-token'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── PATHS ─────────────────────────────────────────────────────────────────────
const SESSIONS_DIR = path.join(__dirname, 'sessions');
const DATA_FILE    = path.join(__dirname, 'data.json');
const TEMP_DIR     = path.join(__dirname, 'temp');

[SESSIONS_DIR, TEMP_DIR, path.join(__dirname, 'data')].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});
process.env.TMPDIR = TEMP_DIR;
process.env.TEMP   = TEMP_DIR;
process.env.TMP    = TEMP_DIR;

// ── GLOBAL STATE ─────────────────────────────────────────────────────────────
const activeConnections = new Map();   // number → { conn, saveCreds, hasLinked }
const pairingCodes      = new Map();   // number → { code, ts }
let totalUsers  = 0;
let activeSockets = 0;

global.BOT_MODE   = settings.botMode;
global.BOT_NAME   = settings.botName;
global.botname    = settings.botName;
global.themeemoji = '•';
global.APIs       = settings.APIs;
global.APIKeys    = settings.APIKeys;

// ── PERSISTENT DATA ───────────────────────────────────────────────────────────
function loadPersistentData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      totalUsers = d.totalUsers || 0;
      console.log(chalk.cyan(`📊 Persistent data loaded: ${totalUsers} users`));
    } else {
      savePersistentData();
    }
  } catch (e) { console.error('Data load error:', e.message); }
}
function savePersistentData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ totalUsers, lastUpdated: new Date().toISOString() }, null, 2));
  } catch (e) { console.error('Data save error:', e.message); }
}
loadPersistentData();
setInterval(savePersistentData, 30000);

// ── BROADCAST ─────────────────────────────────────────────────────────────────
function broadcastStats() {
  io.emit('statsUpdate', { activeSockets, totalUsers });
}

// ── COMMAND HANDLER ───────────────────────────────────────────────────────────
let commandHandler = null;
try {
  commandHandler = require('./lib/commandHandler');
  console.log(chalk.green(`✅ CommandHandler loaded: ${commandHandler.commands?.size || 0} commands`));
} catch (e) {
  console.error('❌ CommandHandler load error:', e.message);
}

// ── MEMORY CLEANUP ────────────────────────────────────────────────────────────
function cleanTemp() {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    let count = 0;
    for (const f of files) {
      try {
        const fp = path.join(TEMP_DIR, f);
        if (Date.now() - fs.statSync(fp).mtimeMs > 30 * 60 * 1000) { fs.unlinkSync(fp); count++; }
      } catch {}
    }
    if (count > 0) console.log(chalk.gray(`🧹 Cleaned ${count} temp files`));
  } catch {}
}
setInterval(cleanTemp, 20 * 60 * 1000);
setInterval(() => {
  if (global.gc) global.gc();
  const ram = process.memoryUsage().rss / 1024 / 1024;
  if (ram > 450) { console.warn(chalk.yellow(`⚠️ RAM: ${ram.toFixed(0)}MB — cleaning`)); cleanTemp(); }
}, 3 * 60 * 1000);

// ── KEEP-ALIVE ────────────────────────────────────────────────────────────────
const APP_URL = process.env.APP_URL ||
  (process.env.HEROKU_APP_NAME ? `https://${process.env.HEROKU_APP_NAME}.herokuapp.com` : null);
if (APP_URL && !APP_URL.includes('undefined')) {
  setInterval(() => axios.get(APP_URL + '/ping').catch(() => {}), 20 * 60 * 1000);
  console.log(chalk.cyan(`🔄 Keep-alive: ${APP_URL}/ping every 20min`));
}

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  activeSockets++;
  broadcastStats();
  socket.emit('statsUpdate', { activeSockets, totalUsers });
  socket.on('disconnect', () => { activeSockets = Math.max(0, activeSockets - 1); broadcastStats(); });
});

// ── CONNECTION HANDLERS ───────────────────────────────────────────────────────
async function setupConnectionHandlers(conn, number, saveCreds) {
  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('connection.update', async update => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) io.emit('qrCode', { number, qr });

    if (connection === 'open') {
      io.emit('connectionStatus', { number, status: 'connected', botName: settings.botName });
      console.log(chalk.green(`✅ [${number}] Connected!`));

      // Play owner song on connect (Arslan MD style)
      try {
        if (settings.ownerSongUrl) {
          const ownerJid = `${settings.ownerNumber}@s.whatsapp.net`;
          await conn.sendMessage(ownerJid, {
            audio: { url: settings.ownerSongUrl },
            mimetype: 'audio/mp4',
            ptt: false
          });
        }
      } catch {}
    }

    if (connection === 'close') {
      const code = (lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      io.emit('connectionStatus', { number, status: 'disconnected', code });
      console.log(chalk.yellow(`🔄 [${number}] Disconnected (${code}), reconnecting: ${shouldReconnect}`));

      if (shouldReconnect) {
        // Non-stop reconnect after delay
        setTimeout(() => startBot(number, saveCreds), 5000);
      } else {
        console.log(chalk.red(`❌ [${number}] Logged out. Session deleted.`));
        activeConnections.delete(number);
        // Clean session so user can re-pair
        const sessionDir = path.join(SESSIONS_DIR, number);
        try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
        io.emit('connectionStatus', { number, status: 'logged_out' });
      }
    }
  });

  // Message handler
  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      if (!m.message) continue;
      try {
        if (commandHandler && commandHandler.handleMessage) {
          await commandHandler.handleMessage(conn, m, settings);
        } else {
          // Fallback inline handler
          await handleMessageFallback(conn, m);
        }
      } catch (e) {
        console.error('Message handler error:', e.message);
      }
    }
  });

  // Group events
  conn.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;
      if (action === 'add') {
        // Welcome (handled by welcome plugin in VF)
      } else if (action === 'remove') {
        // Goodbye (handled by goodbye plugin in VF)
      }
    } catch {}
  });
}

// ── FALLBACK MESSAGE HANDLER ──────────────────────────────────────────────────
async function handleMessageFallback(conn, msg) {
  try {
    const from   = msg.key.remoteJid;
    const body   = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || 
                   msg.message?.imageMessage?.caption || 
                   msg.message?.videoMessage?.caption || '';
    const prefix = settings.prefixes[0] || '.';
    if (!body.startsWith(prefix)) return;

    const cmd = body.slice(prefix.length).split(' ')[0].toLowerCase().trim();
    const args = body.slice(prefix.length + cmd.length).trim().split(' ').filter(Boolean);

    if (cmd === 'ping') {
      const start = Date.now();
      await conn.sendMessage(from, { text: '📡 Pinging...' }, { quoted: msg });
      const lat = Date.now() - start;
      await conn.sendMessage(from, { text: `🏓 Pong!\n📶 Latency: ${lat}ms\n🤖 Bot: ${settings.botName}` }, { quoted: msg });
    } else if (cmd === 'alive') {
      const uptime = process.uptime();
      const h = Math.floor(uptime / 3600), m2 = Math.floor((uptime % 3600) / 60), s = Math.floor(uptime % 60);
      const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      await conn.sendMessage(from, {
        text: `🔥 *${settings.botName}* is alive!\n\n⏱️ Uptime: ${h}h ${m2}m ${s}s\n💾 RAM: ${ram}MB\n🌐 Platform: ${settings.platform}\n\n> © Abdul Rehman Rajpoot & Muzamil Khan`
      }, { quoted: msg });
    }
  } catch {}
}

// ── MAIN BOT STARTER ─────────────────────────────────────────────────────────
async function startBot(number, existingSaveCreds) {
  const sessionDir = path.join(SESSIONS_DIR, number);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
    },
    version,
    browser: Browsers.macOS('Safari'),
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    maxIdleTimeMs: 60000,
    retryRequestDelayMs: 1000,
    maxMsgRetryCount: 5,
    markOnlineOnConnect: true,
    emitOwnEvents: true,
    syncFullHistory: false,
    transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 }
  });

  const existing = activeConnections.get(number) || {};
  activeConnections.set(number, { conn, saveCreds, hasLinked: existing.hasLinked || false });

  await setupConnectionHandlers(conn, number, saveCreds);
  return { conn, saveCreds };
}

// ── API: PAIR ─────────────────────────────────────────────────────────────────
app.post('/api/pair', async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number required' });

    const normalizedNumber = number.replace(/\D/g, '');
    if (normalizedNumber.length < 7 || normalizedNumber.length > 15)
      return res.status(400).json({ error: 'Invalid phone number length' });

    const sessionDir = path.join(SESSIONS_DIR, normalizedNumber);
    const isNewUser  = !activeConnections.has(normalizedNumber) &&
                       !fs.existsSync(path.join(sessionDir, 'creds.json'));

    // Start (or reuse) bot connection
    const { conn, saveCreds } = await startBot(normalizedNumber);

    if (isNewUser) {
      totalUsers++;
      const entry = activeConnections.get(normalizedNumber);
      if (entry) entry.hasLinked = true;
      savePersistentData();
    }
    broadcastStats();

    // Wait for WS to open
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Request pairing code (Arslan MD logic — no session ID needed!)
    const pairingCode = await conn.requestPairingCode(normalizedNumber);
    pairingCodes.set(normalizedNumber, { code: pairingCode, ts: Date.now() });

    res.json({ success: true, pairingCode, isNewUser, message: 'Enter this code in WhatsApp > Linked Devices > Link with phone number' });

  } catch (err) {
    console.error('Pair error:', err.message);
    const status = err.output?.statusCode || 500;
    res.status(500).json({ error: 'Failed to generate pairing code', details: err.message });
  }
});

// ── API: DISCONNECT ───────────────────────────────────────────────────────────
app.post('/api/disconnect', async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Number required' });

    const n = number.replace(/\D/g, '');
    const entry = activeConnections.get(n);
    if (entry?.conn) {
      try { entry.conn.ws.close(); } catch {}
      activeConnections.delete(n);
    }
    res.json({ success: true, message: 'Disconnected' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── API: STATUS ───────────────────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  const connections = [];
  for (const [num, entry] of activeConnections) {
    connections.push({
      number: num,
      state: entry.conn?.ws?.readyState === 1 ? 'connected' : 'connecting'
    });
  }
  res.json({
    status: 'online',
    uptime: Math.floor((Date.now() - START) / 1000),
    totalUsers,
    activeSockets,
    activeConnections: connections.length,
    botName: settings.botName,
    version: settings.version,
    platform: settings.platform,
    pluginsLoaded: commandHandler?.commands?.size || 0
  });
});

// ── API: STATS ────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const ram = process.memoryUsage();
  res.json({
    totalUsers,
    activeSockets,
    uptime: Math.floor((Date.now() - START) / 1000),
    ram: {
      rss: (ram.rss / 1024 / 1024).toFixed(1),
      heap: (ram.heapUsed / 1024 / 1024).toFixed(1),
      external: (ram.external / 1024 / 1024).toFixed(1)
    },
    platform: settings.platform,
    plugins: commandHandler?.commands?.size || 429
  });
});

// ── PING ─────────────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => res.send('pong'));

// ── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── ROOT ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const uptime = Math.floor((Date.now() - START) / 1000);
  const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = uptime % 60;
  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${settings.botName}</title>
<style>
body{margin:0;background:#050508;color:#f0ede8;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh}
.box{background:rgba(20,20,30,0.9);border:1px solid rgba(255,60,0,.3);border-radius:20px;padding:40px;text-align:center;max-width:420px}
h1{color:#ff3c00;margin:0 0 8px}
.badge{background:rgba(0,255,136,.1);border:1px solid rgba(0,255,136,.3);color:#00ff88;padding:4px 14px;border-radius:100px;font-size:.8rem;display:inline-block;margin-bottom:20px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.row:last-child{border:none}
.lbl{color:#6b6880;font-size:.8rem}.val{font-weight:700;font-size:.85rem}
a{color:#ff3c00;text-decoration:none}
</style></head><body><div class="box">
<div class="badge">● ONLINE</div>
<h1>${settings.botName}</h1>
<p style="color:#6b6880;margin-bottom:20px">Ultra WhatsApp Bot — v${settings.version}</p>
<div class="row"><span class="lbl">Uptime</span><span class="val">${h}h ${m}m ${s}s</span></div>
<div class="row"><span class="lbl">Total Users</span><span class="val">${totalUsers}</span></div>
<div class="row"><span class="lbl">Platform</span><span class="val">${settings.platform.toUpperCase()}</span></div>
<div class="row"><span class="lbl">Owner</span><span class="val">${settings.botOwner}</span></div>
<div class="row"><span class="lbl">Co-Owner</span><span class="val">${settings.secondOwner}</span></div>
<p style="margin-top:20px;font-size:.8rem;color:#6b6880">© Abdul Rehman Rajpoot & Muzamil Khan<br>
<a href="${settings.channelLink}" target="_blank">WhatsApp Channel</a> • <a href="${settings.githubRepo}" target="_blank">GitHub</a></p>
</div></body></html>`);
});

// ── START SERVER ──────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(chalk.bold.red('\n╔══════════════════════════════════════════╗'));
  console.log(chalk.bold.red('║     REDXBOT ULTRA v6.0 — STARTING UP     ║'));
  console.log(chalk.bold.red('╚══════════════════════════════════════════╝'));
  console.log(chalk.cyan(`🌐 Server: http://localhost:${PORT}`));
  console.log(chalk.cyan(`👤 Owner : ${settings.botOwner}`));
  console.log(chalk.cyan(`🤖 Bot   : ${settings.botName}`));
  console.log(chalk.cyan(`🏗️  Build : ${settings.platform.toUpperCase()}`));
  console.log(chalk.green(`✅ Plugins: ${commandHandler?.commands?.size || 429}`));
  console.log(chalk.yellow('\n⚡ NO SESSION ID NEEDED — Open the frontend and pair your number!\n'));
});

// ── AUTO-START OWNER BOT ──────────────────────────────────────────────────────
// If PAIRING_NUMBER is set in .env, auto-start the bot for the owner
const AUTO_NUMBER = process.env.PAIRING_NUMBER || '';
if (AUTO_NUMBER && AUTO_NUMBER.length > 7) {
  console.log(chalk.cyan(`🚀 Auto-starting bot for owner: ${AUTO_NUMBER}`));
  setTimeout(async () => {
    try {
      const sessionDir = path.join(SESSIONS_DIR, AUTO_NUMBER);
      const alreadyLinked = fs.existsSync(path.join(sessionDir, 'creds.json'));
      if (alreadyLinked) {
        console.log(chalk.green(`✅ Found existing session for ${AUTO_NUMBER}, connecting...`));
        await startBot(AUTO_NUMBER);
      } else {
        console.log(chalk.yellow(`⚡ No session found for ${AUTO_NUMBER}. Open the web UI to pair!`));
      }
    } catch (e) {
      console.error('Auto-start error:', e.message);
    }
  }, 3000);
}

// ── GLOBAL ERROR HANDLERS ─────────────────────────────────────────────────────
process.on('uncaughtException', err => {
  console.error(chalk.red('❌ Uncaught Exception:'), err.message);
  // Don't exit — non-stop!
});
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason?.message || reason);
  // Don't exit — non-stop!
});

module.exports = { app, server, io };
