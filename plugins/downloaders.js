/**
 * REDXBOT302 - Downloader Plugins
 * Category: downloaders
 */
const axios = require('axios');
const yts = require('yt-search');

const cat = 'downloaders';
const CH = {
  contextInfo: {
    forwardingScore: 1, isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363405513439052@newsletter',
      newsletterName: 'REDXBOT302', serverMessageId: -1
    }
  }
};

const plugins = [

{
  command: 'tiktok', aliases: ['tt', 'ttdl'], category: cat,
  description: 'Download TikTok video without watermark', usage: '.tiktok <url>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];
    if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .tiktok <url>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
    try {
      const apis = [
        `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`,
        `https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`,
      ];
      for (const api of apis) {
        try {
          const { data } = await axios.get(api, { timeout: 20000 });
          const vid = data?.data?.play || data?.data?.hdplay || data?.result?.video?.noWatermark || data?.nwm;
          if (vid) {
            return await sock.sendMessage(chatId, { video: { url: vid }, caption: `📱 *TikTok Video*\n${data?.data?.title || ''}`, ...CH }, { quoted: message });
          }
        } catch { /* try next */ }
      }
      throw new Error('All APIs failed');
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ TikTok download failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'ytmp3', aliases: ['song', 'yta', 'mp3'], category: cat,
  description: 'Download YouTube audio as MP3', usage: '.ytmp3 <url or song name>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!args.length) return sock.sendMessage(chatId, { text: '❌ Usage: .ytmp3 <song name or URL>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });
    const query = args.join(' ');
    try {
      let videoUrl = query;
      if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
        const s = await yts(query);
        videoUrl = s.videos[0]?.url;
        if (!videoUrl) return sock.sendMessage(chatId, { text: '❌ No results found.', ...CH }, { quoted: message });
      }
      const apis = [
        `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`,
      ];
      for (const api of apis) {
        try {
          const { data } = await axios.get(api, { timeout: 30000 });
          const audioUrl = data?.data?.url || data?.url || data?.result?.url;
          if (audioUrl) {
            return await sock.sendMessage(chatId, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${data?.data?.title || 'audio'}.mp3`, ...CH }, { quoted: message });
          }
        } catch { /* try next */ }
      }
      throw new Error('All APIs failed');
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ YouTube audio failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'ytmp4', aliases: ['ytvid', 'yt', 'video'], category: cat,
  description: 'Download YouTube video', usage: '.ytmp4 <youtube url>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];
    if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .ytmp4 <YouTube URL>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '📹', key: message.key } });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`, { timeout: 30000 });
      const vid = data?.data?.url || data?.url;
      if (!vid) throw new Error('No download URL');
      await sock.sendMessage(chatId, { video: { url: vid }, caption: `📹 *YouTube Video*\n${data?.data?.title || ''}`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ YouTube video failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'ytsearch', aliases: ['yts', 'searchyt'], category: cat,
  description: 'Search YouTube videos', usage: '.ytsearch <query>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!args.length) return sock.sendMessage(chatId, { text: '❌ Usage: .ytsearch <query>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });
    const query = args.join(' ');
    const results = await yts(query);
    const videos = results.videos.slice(0, 5);
    if (!videos.length) return sock.sendMessage(chatId, { text: '❌ No results found.', ...CH }, { quoted: message });
    const text = videos.map((v, i) => `${i+1}. *${v.title}*\n   ⏱️ ${v.timestamp} | 👁️ ${v.views?.toLocaleString()}\n   🔗 ${v.url}`).join('\n\n');
    await sock.sendMessage(chatId, { text: `🔍 *YouTube Search Results*\n\n${text}`, ...CH }, { quoted: message });
  }
},

{
  command: 'spotify', aliases: ['sp', 'spotifydl'], category: cat,
  description: 'Download Spotify track', usage: '.spotify <song name>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!args.length) return sock.sendMessage(chatId, { text: '❌ Usage: .spotify <song name>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🎧', key: message.key } });
    const query = args.join(' ');
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/d/spotify?query=${encodeURIComponent(query)}`, { timeout: 25000 });
      const audioUrl = data?.data?.url || data?.url;
      if (!audioUrl) throw new Error('No download URL');
      await sock.sendMessage(chatId, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${query}.mp3`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Spotify failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'instagram', aliases: ['ig', 'igdl', 'reel'], category: cat,
  description: 'Download Instagram post/reel', usage: '.instagram <url>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];
    if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .instagram <url>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '📸', key: message.key } });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/d/ig?url=${encodeURIComponent(url)}`, { timeout: 20000 });
      const vid = data?.data?.[0]?.url;
      if (!vid) throw new Error('No download URL');
      await sock.sendMessage(chatId, { video: { url: vid }, caption: '📸 *Instagram*', ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Instagram failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'facebook', aliases: ['fb', 'fbdl'], category: cat,
  description: 'Download Facebook video', usage: '.facebook <url>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];
    if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .facebook <url>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '📘', key: message.key } });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/d/fb?url=${encodeURIComponent(url)}`, { timeout: 20000 });
      const vid = data?.data?.hd || data?.data?.sd;
      if (!vid) throw new Error('No download URL');
      await sock.sendMessage(chatId, { video: { url: vid }, caption: '📘 *Facebook*', ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Facebook failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'twitter', aliases: ['tw', 'twdl', 'xdl'], category: cat,
  description: 'Download Twitter/X video', usage: '.twitter <url>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];
    if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .twitter <url>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🐦', key: message.key } });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(url)}`, { timeout: 20000 });
      const vid = data?.data?.url || data?.url;
      if (!vid) throw new Error('No download URL');
      await sock.sendMessage(chatId, { video: { url: vid }, caption: '🐦 *Twitter/X*', ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Twitter failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'pinterest', aliases: ['pin', 'ptdl'], category: cat,
  description: 'Download Pinterest image/video', usage: '.pinterest <url>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];
    if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .pinterest <url>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '📌', key: message.key } });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(url)}`, { timeout: 15000 });
      const imgUrl = data?.data?.url || data?.url;
      if (!imgUrl) throw new Error('No URL');
      await sock.sendMessage(chatId, { image: { url: imgUrl }, caption: '📌 *Pinterest*', ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ Pinterest failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'soundcloud', aliases: ['sc', 'scloud'], category: cat,
  description: 'Download SoundCloud audio', usage: '.soundcloud <url or name>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    if (!args.length) return sock.sendMessage(chatId, { text: '❌ Usage: .soundcloud <url or name>', ...CH }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '🎶', key: message.key } });
    const query = args.join(' ');
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/d/soundcloud?query=${encodeURIComponent(query)}`, { timeout: 25000 });
      const audioUrl = data?.data?.url || data?.url;
      if (!audioUrl) throw new Error('No URL');
      await sock.sendMessage(chatId, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ SoundCloud failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

{
  command: 'mediafire', aliases: ['mf'], category: cat,
  description: 'Get MediaFire direct download link', usage: '.mediafire <url>',
  async handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];
    if (!url) return sock.sendMessage(chatId, { text: '❌ Usage: .mediafire <url>', ...CH }, { quoted: message });
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/d/mediafire?url=${encodeURIComponent(url)}`, { timeout: 15000 });
      const dlUrl = data?.data?.url || data?.url;
      if (!dlUrl) throw new Error('No URL');
      await sock.sendMessage(chatId, { text: `📥 *MediaFire Download Link*\n\n${dlUrl}`, ...CH }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `❌ MediaFire failed: ${e.message}`, ...CH }, { quoted: message });
    }
  }
},

];

module.exports = plugins;
