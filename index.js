/**
 * ╔══════════════════════════════════════════╗
 * ║   🔥 REDXBOT302 - Backend v6.0 FINAL 🔥  ║
 * ║   Arslan MD Architecture | Pair-Only     ║
 * ╚══════════════════════════════════════════╝
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const {
  makeWASocket, useMultiFileAuthState, DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST'] } });

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const SESSIONS_DIR = path.join(__dirname, 'sessions');
const DATA_DIR = path.join(__dirname, 'data');
const DEPLOYS_FILE = path.join(__dirname, 'data', 'deploys.json');
const DEPLOY_ID_FILE = path.join(__dirname, 'deploy_id.txt');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const CONFIG = {
  BOT_NAME:     process.env.BOT_NAME     || '🔥 REDXBOT302 🔥',
  OWNER_NAME:   process.env.OWNER_NAME   || 'Abdul Rehman Rajpoot',
  OWNER_NUMBER: process.env.OWNER_NUMBER || '923183928892',
  CO_OWNER:     process.env.CO_OWNER     || 'Muzamil Khan',
  PREFIX:       process.env.PREFIX       || '.',
  MODE:         process.env.MODE         || 'PUBLIC',
  ADMIN_USER:   process.env.ADMIN_USER   || 'redx',
  ADMIN_PASS:   process.env.ADMIN_PASS   || 'redx',
  get PLATFORM() {
    return process.env.RAILWAY_ENVIRONMENT ? 'Railway'
      : process.env.DYNO ? 'Heroku'
      : process.env.RENDER ? 'Render'
      : 'Local';
  }
};

// Sync settings.js with runtime config
const settingsPath = path.join(__dirname, 'settings.js');
function syncSettings() {
  const content = `module.exports = {
  botName: process.env.BOT_NAME || '${CONFIG.BOT_NAME}',
  botOwner: process.env.OWNER_NAME || '${CONFIG.OWNER_NAME}',
  ownerNumber: process.env.OWNER_NUMBER || '${CONFIG.OWNER_NUMBER}',
  coOwner: process.env.CO_OWNER || '${CONFIG.CO_OWNER}',
  prefix: process.env.PREFIX || '${CONFIG.PREFIX}',
  mode: process.env.MODE || '${CONFIG.MODE}',
};\n`;
  try { fs.writeFileSync(settingsPath, content); } catch {}
}
syncSettings();

// ── DEPLOY ID ────────────────────────────────────────────────────────────────
let DEPLOY_ID = process.env.DEPLOY_ID || '';
if (!DEPLOY_ID) {
  if (fs.existsSync(DEPLOY_ID_FILE)) {
    DEPLOY_ID = fs.readFileSync(DEPLOY_ID_FILE, 'utf8').trim();
  } else {
    DEPLOY_ID = 'REDX-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    fs.writeFileSync(DEPLOY_ID_FILE, DEPLOY_ID);
  }
}

// ── DATA STORE ────────────────────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

function loadDeploys() {
  try { return fs.existsSync(DEPLOYS_FILE) ? JSON.parse(fs.readFileSync(DEPLOYS_FILE, 'utf8')) : {}; }
  catch { return {}; }
}
function saveDeploys(d) { fs.writeFileSync(DEPLOYS_FILE, JSON.stringify(d, null, 2)); }
let deploys = loadDeploys();

const stats = { totalPairs: 0, totalMessages: 0, startTime: Date.now() };

// ── SESSION MANAGEMENT ────────────────────────────────────────────────────────
const activeSessions = {}; // number -> { sock, status, reconnectAttempts }

function generateDeployKey() {
  return 'RDXKEY-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

// ── PLUGIN LOADER ─────────────────────────────────────────────────────────────
const allPlugins = []; // { commands, aliases, handler, category }

function loadAllPlugins() {
  const pluginDir = path.join(__dirname, 'plugins');
  const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));
  let total = 0;

  for (const file of files) {
    try {
      delete require.cache[require.resolve(path.join(pluginDir, file))];
      const loaded = require(path.join(pluginDir, file));

      // Support both single export and array export
      const pluginList = Array.isArray(loaded) ? loaded : [loaded];

      for (const plugin of pluginList) {
        if (!plugin.command || !plugin.handler) continue;
        const cmds = [plugin.command, ...(plugin.aliases || [])].map(c => c.toLowerCase());
        allPlugins.push({ cmds, handler: plugin.handler, category: plugin.category || 'misc', desc: plugin.description || '', usage: plugin.usage || '' });
        total++;
      }
    } catch (e) {
      console.error(`[PLUGIN ERROR] ${file}: ${e.message}`);
    }
  }
  console.log(`[REDX] ✅ Loaded ${total} commands from ${files.length} plugin files`);
  return total;
}

function getPlugin(cmdName) {
  return allPlugins.find(p => p.cmds.includes(cmdName.toLowerCase()));
}

// ── CONNECT NUMBER (Arslan MD Architecture) ───────────────────────────────────
async function connectNumber(number) {
  const sessionDir = path.join(SESSIONS_DIR, number);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 30000,
    keepAliveIntervalMs: 25000,
    browser: ['REDXBOT302', 'Chrome', '4.0.0'],
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true,
  });

  activeSessions[number] = { sock, status: 'connecting', number, reconnectAttempts: 0 };
  io.emit('bot_status', { number, status: 'connecting' });

  // Wait for socket registration before requesting code (Arslan MD uses 3s)
  await new Promise(r => setTimeout(r, 2000));

  let pairCode = null;
  if (!sock.authState.creds.registered) {
    const cleanNum = number.replace(/[^0-9]/g, '');
    try {
      pairCode = await sock.requestPairingCode(cleanNum);
      pairCode = pairCode?.match(/.{1,4}/g)?.join('-') || pairCode;
      console.log(`[REDX] 📱 Pair code for ${number}: ${pairCode}`);
      io.emit('pair_code', { number, code: pairCode });
    } catch (err) {
      console.error(`[REDX] Pair code error: ${err.message}`);
      if (activeSessions[number]) delete activeSessions[number];
      try { sock.end(); } catch {}
      throw new Error('Failed to get pairing code: ' + err.message);
    }
  }

  // ── CONNECTION EVENTS ─────────────────────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log(`[REDX] ✅ Bot connected: ${number}`);
      activeSessions[number] = { ...activeSessions[number], status: 'connected', reconnectAttempts: 0 };
      stats.totalPairs++;

      // Save deployment
      const deployKey = deploys[number]?.key || generateDeployKey();
      deploys[number] = {
        number, deployId: DEPLOY_ID, key: deployKey,
        platform: CONFIG.PLATFORM, connectedAt: new Date().toISOString(),
        status: 'connected', botName: CONFIG.BOT_NAME,
        owner: CONFIG.OWNER_NAME, prefix: CONFIG.PREFIX, mode: CONFIG.MODE,
      };
      saveDeploys(deploys);
      io.emit('bot_status', { number, status: 'connected', deployId: DEPLOY_ID });

      // Send professional welcome message
      try {
        await new Promise(r => setTimeout(r, 2000));

        const totalCmds = allPlugins.length;

        const welcomeMsg =
`*╔══════════════════════════╗*
*║  🔥  REDXBOT302  🔥  ║*
*╚══════════════════════════╝*

✅ *Bot Connected Successfully!*

🤖 *Bot:* ${CONFIG.BOT_NAME}
👑 *Owner:* ${CONFIG.OWNER_NAME}
👤 *Co-Owner:* ${CONFIG.CO_OWNER}
📌 *Prefix:* \`${CONFIG.PREFIX}\`
🌍 *Mode:* ${CONFIG.MODE}
📦 *Commands:* ${totalCmds}+
🆔 *Deploy ID:* \`${DEPLOY_ID}\`
📡 *Platform:* ${CONFIG.PLATFORM}

🚀 _Type ${CONFIG.PREFIX}menu to see all ${totalCmds}+ commands!_

━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 GitHub: github.com/AbdulRehman19721986/redxbot302
💬 WhatsApp Channel: wa.me/channel/0029VbCPnYf96H4SNehkev10`;

        await sock.sendMessage(number + '@s.whatsapp.net', {
          text: welcomeMsg,
          contextInfo: {
            forwardingScore: 1, isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363405513439052@newsletter',
              newsletterName: 'REDXBOT302', serverMessageId: -1
            }
          }
        });

        // Send secret key in second message
        await new Promise(r => setTimeout(r, 1500));
        await sock.sendMessage(number + '@s.whatsapp.net', {
          text: `🔑 *Your Secret Deploy Key*\n\n\`\`\`${deployKey}\`\`\`\n\n⚠️ *KEEP THIS PRIVATE — Don't share with anyone!*\n\n📋 *How to use:*\n1. Go to the bot website dashboard\n2. Click "My Dashboard"\n3. Enter this key\n4. You can then:\n   • View your bot status\n   • Edit bot name/prefix/mode\n   • Restart or delete your bot\n\n🌐 _Save this key safely!_`
        });
      } catch (e) {
        console.error('[REDX] Welcome msg error:', e.message);
      }
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const noRetry = [DisconnectReason.loggedOut, 401, 405, 403];
      console.log(`[REDX] Connection closed for ${number}. Reason: ${reason}`);

      if (noRetry.includes(reason)) {
        console.log(`[REDX] Session logged out: ${number}`);
        delete activeSessions[number];
        if (deploys[number]) { deploys[number].status = 'disconnected'; saveDeploys(deploys); }
        io.emit('bot_status', { number, status: 'disconnected' });
        try { fs.rmSync(path.join(SESSIONS_DIR, number), { recursive: true, force: true }); } catch {}
      } else {
        const attempts = (activeSessions[number]?.reconnectAttempts || 0) + 1;
        const delay = Math.min(5000 * attempts, 30000);
        console.log(`[REDX] Reconnecting ${number} in ${delay}ms (attempt ${attempts})`);
        if (activeSessions[number]) activeSessions[number].status = 'reconnecting';
        io.emit('bot_status', { number, status: 'reconnecting' });
        setTimeout(() => connectNumber(number).catch(console.error), delay);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ── MESSAGE HANDLER ──────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      stats.totalMessages++;

      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption || '';

      if (!body.startsWith(CONFIG.PREFIX)) continue;

      const parts = body.trim().slice(CONFIG.PREFIX.length).split(/\s+/);
      const cmdName = parts[0].toLowerCase();
      const args = parts.slice(1);

      const plugin = getPlugin(cmdName);
      if (!plugin) continue;

      const chatId = msg.key.remoteJid;
      try {
        await plugin.handler(sock, msg, args, {
          chatId, config: CONFIG, deployId: DEPLOY_ID,
          command: cmdName,
          channelInfo: {
            contextInfo: {
              forwardingScore: 1, isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: '120363405513439052@newsletter',
                newsletterName: 'REDXBOT302', serverMessageId: -1
              }
            }
          }
        });
      } catch (e) {
        console.error(`[PLUGIN ERROR] ${cmdName}: ${e.message}`);
      }
    }
  });

  return { pairCode, deployId: DEPLOY_ID };
}

// ── RELOAD EXISTING SESSIONS ──────────────────────────────────────────────────
async function reloadSessions() {
  if (!fs.existsSync(SESSIONS_DIR)) return;
  const dirs = fs.readdirSync(SESSIONS_DIR).filter(d => {
    const credsPath = path.join(SESSIONS_DIR, d, 'creds.json');
    return fs.existsSync(credsPath);
  });
  console.log(`[REDX] Found ${dirs.length} existing session(s) to reload`);
  for (const dir of dirs) {
    try {
      console.log(`[REDX] Reloading session: ${dir}`);
      await connectNumber(dir);
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error(`[REDX] Failed to reload ${dir}: ${e.message}`);
    }
  }
}

// ── REST API ─────────────────────────────────────────────────────────────────

app.get('/', (req, res) => res.json({ status: 'ok', bot: 'REDXBOT302', deployId: DEPLOY_ID, platform: CONFIG.PLATFORM }));
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Pair API
app.post('/pair', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number required' });
  const clean = number.replace(/[^0-9]/g, '');
  if (clean.length < 10) return res.status(400).json({ error: 'Invalid number format' });

  try {
    // Already connected
    if (activeSessions[clean]?.status === 'connected') {
      return res.json({ success: true, alreadyConnected: true, code: null, deployId: DEPLOY_ID });
    }
    // If currently connecting, wait a bit
    if (activeSessions[clean]?.status === 'connecting') {
      return res.status(429).json({ error: 'Pairing already in progress. Please wait.' });
    }

    const result = await connectNumber(clean);
    res.json({ success: true, code: result.pairCode, deployId: DEPLOY_ID });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Bot status
app.get('/status/:number', (req, res) => {
  const { number } = req.params;
  const session = activeSessions[number];
  const dep = deploys[number];
  res.json({
    status: session?.status || 'offline',
    deployId: DEPLOY_ID,
    platform: CONFIG.PLATFORM,
    botName: CONFIG.BOT_NAME,
    deployment: dep ? { ...dep, key: undefined } : null,
  });
});

// Global info
app.get('/info', (req, res) => {
  const connected = Object.values(activeSessions).filter(s => s.status === 'connected').length;
  res.json({
    deployId: DEPLOY_ID, platform: CONFIG.PLATFORM,
    botName: CONFIG.BOT_NAME, owner: CONFIG.OWNER_NAME,
    prefix: CONFIG.PREFIX, mode: CONFIG.MODE,
    totalDeployments: Object.keys(deploys).length,
    connected, totalCommands: allPlugins.length,
    stats,
  });
});

// User dashboard - requires deploy key
app.post('/dashboard', (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'Deploy key required' });
  const dep = Object.values(deploys).find(d => d.key === key);
  if (!dep) return res.status(403).json({ error: 'Invalid deploy key' });
  const session = activeSessions[dep.number];
  res.json({ success: true, deployment: { ...dep, status: session?.status || dep.status } });
});

app.post('/dashboard/update', (req, res) => {
  const { key, botName, prefix, mode, owner } = req.body;
  const dep = Object.values(deploys).find(d => d.key === key);
  if (!dep) return res.status(403).json({ error: 'Invalid key' });
  if (botName) dep.botName = botName;
  if (prefix) dep.prefix = prefix;
  if (mode) dep.mode = mode;
  if (owner) dep.owner = owner;
  saveDeploys(deploys);
  res.json({ success: true, deployment: dep });
});

app.post('/dashboard/restart', async (req, res) => {
  const { key } = req.body;
  const dep = Object.values(deploys).find(d => d.key === key);
  if (!dep) return res.status(403).json({ error: 'Invalid key' });
  const session = activeSessions[dep.number];
  if (session) { try { session.sock.end(); } catch {} delete activeSessions[dep.number]; }
  setTimeout(() => connectNumber(dep.number).catch(console.error), 2000);
  res.json({ success: true, message: 'Restarting bot...' });
});

app.post('/dashboard/delete', async (req, res) => {
  const { key } = req.body;
  const dep = Object.values(deploys).find(d => d.key === key);
  if (!dep) return res.status(403).json({ error: 'Invalid key' });
  const session = activeSessions[dep.number];
  if (session) { try { session.sock.end(); } catch {} delete activeSessions[dep.number]; }
  try { fs.rmSync(path.join(SESSIONS_DIR, dep.number), { recursive: true, force: true }); } catch {}
  delete deploys[dep.number];
  saveDeploys(deploys);
  res.json({ success: true });
});

// Lookup by Deploy ID
app.get('/lookup/:deployId', (req, res) => {
  const { deployId } = req.params;
  const dep = Object.values(deploys).find(d => d.deployId === deployId);
  if (!dep) return res.status(404).json({ error: 'Deploy ID not found' });
  const session = activeSessions[dep.number];
  res.json({ deployId, platform: dep.platform, status: session?.status || dep.status, connected: session?.status === 'connected', connectedAt: dep.connectedAt });
});

// ── ADMIN ROUTES ─────────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const auth = req.headers['x-admin-auth'] || req.body?.auth;
  if (auth === Buffer.from(`${CONFIG.ADMIN_USER}:${CONFIG.ADMIN_PASS}`).toString('base64')) return next();
  const { user, pass } = req.body || {};
  if (user === CONFIG.ADMIN_USER && pass === CONFIG.ADMIN_PASS) return next();
  res.status(403).json({ error: 'Unauthorized' });
}

app.post('/admin/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === CONFIG.ADMIN_USER && pass === CONFIG.ADMIN_PASS) {
    const token = Buffer.from(`${user}:${pass}`).toString('base64');
    res.json({ success: true, token });
  } else {
    res.status(403).json({ error: 'Invalid credentials' });
  }
});

app.post('/admin/stats', adminAuth, (req, res) => {
  res.json({
    deployId: DEPLOY_ID, platform: CONFIG.PLATFORM,
    totalDeployments: Object.keys(deploys).length,
    connected: Object.values(activeSessions).filter(s => s.status === 'connected').length,
    totalCommands: allPlugins.length,
    uptime: process.uptime(), memory: process.memoryUsage(),
    nodeVersion: process.version, stats,
    config: { botName: CONFIG.BOT_NAME, owner: CONFIG.OWNER_NAME, prefix: CONFIG.PREFIX, mode: CONFIG.MODE },
  });
});

app.post('/admin/deployments', adminAuth, (req, res) => {
  const all = Object.values(deploys).map(d => ({
    ...d,
    status: activeSessions[d.number]?.status || d.status,
  }));
  res.json({ deployments: all });
});

app.post('/admin/remove-deployment', adminAuth, (req, res) => {
  const { number } = req.body;
  if (activeSessions[number]) { try { activeSessions[number].sock.end(); } catch {} delete activeSessions[number]; }
  try { fs.rmSync(path.join(SESSIONS_DIR, number), { recursive: true, force: true }); } catch {}
  delete deploys[number];
  saveDeploys(deploys);
  res.json({ success: true });
});

app.post('/admin/update-config', adminAuth, (req, res) => {
  const { botName, ownerName, prefix, mode, adminUser, adminPass } = req.body;
  if (botName) CONFIG.BOT_NAME = botName;
  if (ownerName) CONFIG.OWNER_NAME = ownerName;
  if (prefix) CONFIG.PREFIX = prefix;
  if (mode) CONFIG.MODE = mode;
  if (adminUser) CONFIG.ADMIN_USER = adminUser;
  if (adminPass) CONFIG.ADMIN_PASS = adminPass;
  syncSettings();
  res.json({ success: true, config: { botName: CONFIG.BOT_NAME, owner: CONFIG.OWNER_NAME, prefix: CONFIG.PREFIX, mode: CONFIG.MODE } });
});

app.post('/admin/reload-plugins', adminAuth, (req, res) => {
  allPlugins.length = 0;
  const total = loadAllPlugins();
  res.json({ success: true, totalCommands: total });
});

app.post('/admin/restart', adminAuth, (req, res) => {
  res.json({ success: true, message: 'Restarting...' });
  setTimeout(() => process.exit(0), 1000);
});

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.emit('deploy_info', {
    deployId: DEPLOY_ID, platform: CONFIG.PLATFORM,
    connected: Object.values(activeSessions).filter(s => s.status === 'connected').length,
  });
  socket.on('get_status', ({ number }) => {
    const s = activeSessions[number];
    socket.emit('bot_status', { number, status: s?.status || 'offline' });
  });
});

// ── START SERVER ──────────────────────────────────────────────────────────────
server.listen(PORT, async () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   🔥 REDXBOT302 Backend Started! 🔥  ║');
  console.log('╚══════════════════════════════════════╝\n');
  console.log(`🚀 Port:       ${PORT}`);
  console.log(`🆔 Deploy ID:  ${DEPLOY_ID}`);
  console.log(`📡 Platform:   ${CONFIG.PLATFORM}`);
  console.log(`🛡️  Admin:      ${CONFIG.ADMIN_USER} / ${CONFIG.ADMIN_PASS}`);
  console.log('');

  // Load plugins first
  loadAllPlugins();

  // Then reload sessions
  await reloadSessions();
});
