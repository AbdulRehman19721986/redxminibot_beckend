const chalk = require('chalk');

function printLog(level, msg) {
  const ts = new Date().toLocaleTimeString();
  const colors = { info: 'cyan', success: 'green', warn: 'yellow', error: 'red' };
  const color = colors[level] || 'white';
  console.log(chalk[color]?.(`[${ts}] [${level.toUpperCase()}] ${msg}`) || `[${ts}] [${level.toUpperCase()}] ${msg}`);
}

module.exports = { printLog };
