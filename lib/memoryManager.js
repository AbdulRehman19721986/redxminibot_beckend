const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let forwardedCache = null;
let chatMemory = null;

function setCaches(forwarded, chat) {
  forwardedCache = forwarded;
  chatMemory = chat;
}

// Adjusted thresholds for stability (Heroku free tier: 512 MB)
const MEMORY_WARN = 470 * 1024 * 1024;   // 470 MB (warning)
const MEMORY_RESTART = 500 * 1024 * 1024; // 500 MB (restart – leaves 12 MB buffer)
const CHECK_INTERVAL = 60000; // 1 minute

let restarting = false;

async function cleanupMemory() {
  console.log('🧹 Running memory cleanup...');
  if (forwardedCache && typeof forwardedCache.clear === 'function') {
    const size = forwardedCache.size;
    forwardedCache.clear();
    console.log(`   Cleared forwardedCache (${size} entries)`);
  }
  if (chatMemory && chatMemory.messages) {
    const msgSize = chatMemory.messages.size;
    const infoSize = chatMemory.userInfo.size;
    chatMemory.messages.clear();
    chatMemory.userInfo.clear();
    console.log(`   Cleared chatMemory (${msgSize} messages, ${infoSize} users)`);
  }

  const cleanupScript = path.join(process.cwd(), 'cleanup.js');
  if (fs.existsSync(cleanupScript)) {
    exec(`node ${cleanupScript}`, (error, stdout, stderr) => {
      if (error) console.error('Cleanup script error:', error.message);
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
    });
  }
}

function checkMemory() {
  const usage = process.memoryUsage();
  const heapUsed = usage.heapUsed;
  console.log(`[MEM] Heap: ${(heapUsed / 1024 / 1024).toFixed(2)} MB`);

  if (heapUsed >= MEMORY_RESTART && !restarting) {
    console.error(`⚠️  Memory limit reached! (${(heapUsed / 1024 / 1024).toFixed(2)} MB). Restarting...`);
    restarting = true;
    setTimeout(() => process.exit(1), 1000);
  } else if (heapUsed >= MEMORY_WARN) {
    console.warn(`⚠️  Memory warning: ${(heapUsed / 1024 / 1024).toFixed(2)} MB. Running cleanup...`);
    cleanupMemory();
  }
}

function startMonitoring() {
  console.log('📊 Memory monitor started (check every minute)');
  setInterval(checkMemory, CHECK_INTERVAL);
  setTimeout(checkMemory, 5000);
}

module.exports = { startMonitoring, setCaches, cleanupMemory };
