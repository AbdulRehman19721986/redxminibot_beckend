/**
 * REDXBOT302 — Search Plugin
 * github, npm, movie, anime, crypto, urlinfo
 * Owner: Abdul Rehman Rajpoot
 */

'use strict';

const { fetchJson } = require('../lib/functions2');
const { isUrl }     = require('../lib/functions');
const fakevCard     = require('../lib/fakevcard');

const BOT_NAME       = process.env.BOT_NAME       || '🔥 REDXBOT302 🔥';
const NEWSLETTER_JID = process.env.NEWSLETTER_JID || '120363405513439052@newsletter';

const ctxInfo = () => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: `🔥 ${BOT_NAME}`,
    serverMessageId: 200,
  },
});

const send = (conn, from, text) =>
  conn.sendMessage(from, { text, contextInfo: ctxInfo() }, { quoted: fakevCard });

module.exports = [
  {
    pattern: 'github',
    alias: ['gh'],
    desc: 'Search GitHub user profile',
    category: 'Search',
    react: '🐙',
    use: '.github AbdulRehman19721986',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide a GitHub username.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const data = await fetchJson(`https://api.github.com/users/${encodeURIComponent(q.trim())}`);
        if (data.message === 'Not Found') return reply('❌ GitHub user not found.');
        await conn.sendMessage(from, {
          image: { url: data.avatar_url },
          caption: `🐙 *GitHub: @${data.login}*\n\n👤 ${data.name || data.login}\n📝 ${data.bio || 'No bio'}\n📦 Repos: ${data.public_repos}\n👥 Followers: ${data.followers}\n🔗 ${data.html_url}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },
  {
    pattern: 'npm',
    desc: 'Search npm package',
    category: 'Search',
    react: '📦',
    use: '.npm axios',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide package name.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const data = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(q.trim())}/latest`);
        await send(conn, from, `📦 *npm: ${data.name}@${data.version}*\n\n${data.description || ''}\n👤 ${data.author?.name || 'N/A'}\n📜 ${data.license || 'N/A'}\n📥 npm install ${data.name}\n\n> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },
  {
    pattern: 'movie',
    alias: ['imdb'],
    desc: 'Search movie info',
    category: 'Search',
    react: '🎬',
    use: '.movie Inception',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide movie title.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const data = await fetchJson(`https://www.omdbapi.com/?t=${encodeURIComponent(q)}&apikey=free&plot=short`);
        if (data.Response === 'False') return reply(`❌ ${data.Error}`);
        await conn.sendMessage(from, {
          image: { url: data.Poster !== 'N/A' ? data.Poster : 'https://via.placeholder.com/300' },
          caption: `🎬 *${data.Title}* (${data.Year})\n\n⭐ ${data.imdbRating}/10\n🎭 ${data.Genre}\n🎬 Dir: ${data.Director}\n⏱️ ${data.Runtime}\n\n📝 ${data.Plot}\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },
  {
    pattern: 'anime',
    desc: 'Search anime info',
    category: 'Search',
    react: '🎌',
    use: '.anime Naruto',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        if (!q) return reply('❌ Provide anime name.');
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const data = await fetchJson(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`);
        const a    = data?.data?.[0];
        if (!a) return reply('❌ Anime not found.');
        await conn.sendMessage(from, {
          image: { url: a.images?.jpg?.image_url || '' },
          caption: `🎌 *${a.title}*\n\n⭐ ${a.score}/10\n📺 ${a.episodes || '?'} episodes\n📅 ${a.status}\n\n${a.synopsis?.substring(0,400) || ''}...\n\n> 🔥 ${BOT_NAME}`,
          contextInfo: ctxInfo(),
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },
  {
    pattern: 'crypto',
    desc: 'Get crypto price',
    category: 'Search',
    react: '💰',
    use: '.crypto bitcoin',
    execute: async (conn, msg, m, { from, q, reply }) => {
      try {
        const coins = { btc:'bitcoin',eth:'ethereum',bnb:'binancecoin',sol:'solana',xrp:'ripple',doge:'dogecoin' };
        const id = coins[q?.toLowerCase()] || q?.toLowerCase() || 'bitcoin';
        await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        const data = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd,pkr&include_24hr_change=true`);
        const coin = data[id];
        if (!coin) return reply('❌ Coin not found.');
        const change = coin.usd_24h_change?.toFixed(2);
        await send(conn, from, `💰 *${id.toUpperCase()}*\n\n💵 USD: $${coin.usd?.toLocaleString()}\n🇵🇰 PKR: ₨${coin.pkr?.toLocaleString() || 'N/A'}\n${change > 0 ? '📈' : '📉'} 24h: ${change}%\n\n> 🔥 ${BOT_NAME}`);
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch (e) { reply(`❌ ${e.message}`); }
    },
  },
];
