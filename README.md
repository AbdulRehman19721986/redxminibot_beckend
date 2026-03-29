# 🔥 REDXBOT302 — Combined Final Edition

> WhatsApp Multi-Device Bot | Pair-Only | No SESSION_ID | 200+ Commands
> **Owner:** Abdul Rehman Rajpoot | **Co-Owner:** Muzamil Khan

---

## 📁 Project Structure

```
REDXBOT302/
├── index.js          ← Main bot server (Arslan MD architecture)
├── settings.js       ← Bot config (reads from process.env)
├── package.json      ← All dependencies
├── Procfile          ← Heroku: web: node index.js
├── app.json          ← Heroku one-click deploy (FFmpeg buildpack included)
├── railway.json      ← Railway config
├── render.yaml       ← Render config
├── Dockerfile        ← Docker support
├── .env.example      ← All environment variables
│
├── plugins/          ← 34 plugin files, 200+ commands
│   ├── ai.js, ai-gpt.js, ai-llama.js, aify.js
│   ├── fun-cmds.js, fun.js
│   ├── groups-cmds.js, groups.js
│   ├── reactions.js, sticker.js
│   ├── song.js, play.js, playx.js
│   ├── tiktok.js, ytmp4.js, dl-spotify.js, downloaders.js
│   ├── translate.js, tools.js, search.js
│   ├── autoread.js, autoreply.js, autostatus.js, autotyping.js
│   ├── autoForward.js, antilink.js, pmblocker.js
│   ├── owner.js, owner-cmds.js, menu.js
│   ├── audiofx.js, logo.js, brat.js, tempmail.js
│
├── lib/              ← Shared utilities
│   ├── fakevcard.js, database.js, functions.js, functions2.js
│   ├── groupevents.js, fetchGif.js
│   ├── video-utils.js, sticker-utils.js
│   ├── lightweight_store.js, print.js
│
├── data/             ← JSON data files (auto-created)
├── public/           ← Web frontend (served by Express)
│   └── index.html    ← Pair page + Admin panel + Dashboard
└── frontend/         ← Separate Vercel frontend
    ├── index.html    ← Deploy to Vercel separately
    └── vercel.json
```

---

## 🚀 Deploy on Heroku (Recommended)

1. Push this folder to a GitHub repository
2. Go to [heroku.com](https://heroku.com) → New App
3. **Deploy → Connect to GitHub** → select your repo
4. **Settings → Config Vars** → add:

| Variable | Value |
|---|---|
| `BOT_NAME` | `🔥 REDXBOT302 🔥` |
| `OWNER_NUMBER` | `923009842133` |
| `OWNER_NAME` | `Abdul Rehman Rajpoot` |
| `PREFIX` | `.` |
| `BOT_MODE` | `public` |
| `ADMIN_USERNAME` | `redx` |
| `ADMIN_PASSWORD` | `redx` |
| `APP_URL` | `https://your-app-name.herokuapp.com` |

5. **Settings → Buildpacks** — Add in this exact order:
   - `https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git`
   - `heroku/nodejs`
6. **Deploy → Deploy Branch**
7. Open your Heroku URL → enter phone number → get code → pair!

---

## 🚂 Deploy on Railway

1. Push to GitHub
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variables (same as above)
4. Done — Railway auto-detects Node.js

---

## 🌐 Deploy Frontend on Vercel (Optional)

The `frontend/` folder is a separate static site you can host on Vercel:
1. Push `frontend/` to a separate GitHub repo
2. Import in [vercel.com](https://vercel.com) → Deploy
3. In the frontend, set your backend URL via localStorage:
   ```js
   localStorage.setItem('REDX_API', 'https://your-backend-url.com')
   ```

---

## 🔑 How it works

1. Deploy backend → open the site URL
2. Enter your WhatsApp number (international format: `923001234567`)
3. Get an 8-digit pairing code in ~3 seconds
4. Open WhatsApp → Settings → Linked Devices → Link with phone number → Enter code
5. Bot connects and sends you:
   - **Welcome message** with bot info
   - **Your secret deploy key** (e.g. `RDXKEY-XXXXXXXXXXXXXXXX`)
6. Use the deploy key on the **Dashboard** page to manage your bot

---

## 📦 Command Categories (200+ total)

| Category | Key Commands |
|---|---|
| 🤖 AI | gpt, gemini, llama, mistral, aify, imagine |
| 📥 Downloaders | tiktok, ytmp3, ytmp4, spotify, instagram, facebook, twitter |
| 🎵 Music | play, song, audiofx, bass, nightcore, reverse, chipmunk |
| 🎉 Fun | joke, fact, truth, dare, flirt, 8ball, ship, rate, slot |
| 🔧 Tools | ping, calc, weather, wiki, translate, tts, qr, crypto |
| 👥 Groups | kick, promote, demote, mute, tagall, warn, groupinfo |
| 🎨 Stickers | sticker, toimg, logo, brat |
| 😄 Reactions | hug, slap, pat, kiss, dance, bonk, cry, wave |
| 🔍 Search | gimage, pokedex, anime, meme, quote, currency |
| 🛡️ Owner | autoread, autoreply, autostatus, pmblocker, ban, mode |

---

© 2026 Abdul Rehman Rajpoot. All rights reserved.
