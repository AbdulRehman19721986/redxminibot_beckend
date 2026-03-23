/**
 * REDXBOT302 v6 — Print / Logger Helper
 * Colorful console output using chalk
 * Used by autoForward.js and other plugins
 */
'use strict';

let chalk;
try {
  chalk = require('chalk');
} catch {
  // chalk not installed - use plain text fallback
  chalk = {
    green:  s => s, red:    s => s, yellow: s => s,
    blue:   s => s, cyan:   s => s, white:  s => s,
    bold:   { green: s => s, red: s => s, yellow: s => s, white: s => s },
    gray:   s => s, magenta: s => s,
  };
}

const PREFIX = chalk.bold.white('[REDXBOT302]');

const print = {
  success: (msg) => console.log(`${PREFIX} ${chalk.green('✔')} ${chalk.green(msg)}`),
  error:   (msg) => console.log(`${PREFIX} ${chalk.red('✖')} ${chalk.red(msg)}`),
  warn:    (msg) => console.log(`${PREFIX} ${chalk.yellow('⚠')} ${chalk.yellow(msg)}`),
  info:    (msg) => console.log(`${PREFIX} ${chalk.cyan('ℹ')} ${chalk.cyan(msg)}`),
  log:     (msg) => console.log(`${PREFIX} ${chalk.white(msg)}`),
  cmd:     (cmd, sender) => console.log(`${PREFIX} ${chalk.blue('►')} ${chalk.bold.yellow(cmd)} ${chalk.gray('from')} ${chalk.magenta(sender || '?')}`),
  plugin:  (name, count) => console.log(`${PREFIX} ${chalk.green('🔌')} ${chalk.cyan(name)} ${chalk.gray(`(${count} cmds)`)}`),
  bot:     (msg) => console.log(`\n${chalk.bold.green('══════════════════════')}\n${chalk.bold.green(msg)}\n${chalk.bold.green('══════════════════════')}\n`),
};

module.exports = print;
module.exports.chalk = chalk;
