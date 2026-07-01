# 🎵 Offline Media Hub

A modern, offline-first desktop music and video player built with **Electron**, **React**, **Vite**, **Tailwind CSS**, **Framer Motion**, and **MongoDB**.

---

## ✨ Features

- 🎵 Play audio: MP3, FLAC, WAV, AAC, M4A, OGG, OPUS, WMA, AIFF, APE
- 🎬 Play video: MP4, MKV, AVI, MOV, WEBM, FLV, WMV, M4V, TS
- 📁 Drag & drop files/folders
- 🗃️ MongoDB-backed library, playlists, history, settings, profile
- 🎨 7 themes: Dark, Light, AMOLED, Neon, Studio, Glass, Classic
- 🌈 10 accent colors
- ❤️ Favorites
- 📜 Play history
- 🎶 Playlists (create, rename, delete)
- 🔀 Shuffle & repeat modes
- ⚡ Now playing full-screen view
- 👤 Profile with avatar (Cloudinary sync when online, local fallback offline)
- 🔒 100% offline media playback — no uploads, no cloud for media files

---

## 📦 Requirements

### 1. Node.js
Download from https://nodejs.org (v18+ recommended)

### 2. MongoDB
Install MongoDB Community Edition:
- **Windows**: https://www.mongodb.com/try/download/community
- **macOS**: `brew install mongodb-community`
- **Linux**: Follow https://www.mongodb.com/docs/manual/administration/install-on-linux/

Start MongoDB:
```bash
# Windows (as service)
net start MongoDB

# macOS/Linux
mongod --dbpath /data/db
```

### 3. MPV (optional, for advanced format support)
- **Windows**: https://mpv.io/installation/ or `winget install mpv`
- **macOS**: `brew install mpv`
- **Linux**: `sudo apt install mpv`

> MPV is used for video playback. The app will use HTML5 audio for music files.

---

## 🚀 Setup

### 1. Clone / open the project

### 2. Copy environment variables
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```env
# MongoDB connection (local by default)
MONGODB_URI=mongodb://localhost:27017/offline-media-hub

# Cloudinary (ONLY for profile image upload - optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> ⚠️ **Media files are NEVER uploaded anywhere.** Cloudinary is ONLY used for profile avatar images.

### 3. Install dependencies
```bash
npm install
```

### 4. Start the app
```bash
npm run dev
```

---

## 🏗️ Build

```bash
npm run build
```

---

## 📁 Project Structure

```
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Secure preload bridge
│   ├── mpvController.js     # MPV IPC controller
│   ├── localApi.js          # All IPC handlers
│   ├── database.js          # MongoDB/Mongoose models
│   ├── mediaScanner.js      # File scanning & metadata
│   └── cloudinaryProfile.js # Profile image upload
├── src/
│   ├── App.jsx              # Root component
│   ├── main.jsx             # React entry point
│   ├── styles.css           # Global styles
│   ├── components/          # Reusable UI components
│   ├── pages/               # Page components
│   ├── hooks/               # React context providers
│   ├── utils/               # Utilities
│   └── data/                # Static data (themes, defaults)
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔒 Security

- `contextIsolation: true` — renderer is sandboxed
- `nodeIntegration: false` — no Node access in renderer
- All file system access is done via secure IPC channels in the main process
- Media files never leave your computer

---

## 🗄️ Database

Uses **MongoDB** via **Mongoose** for:
- Media library
- Playlists
- Play history
- Settings
- Profile

Connect at: `mongodb://localhost:27017/offline-media-hub` (configurable via `MONGODB_URI` env)

---

## 🎨 Themes

| Theme   | Description                    |
|---------|-------------------------------|
| Dark    | Default sleek dark             |
| Light   | Clean bright interface         |
| AMOLED  | Pure black for OLED screens    |
| Neon    | Cyberpunk neon vibes           |
| Studio  | Professional studio aesthetic  |
| Glass   | Glassmorphism                  |
| Classic | Retro media player look        |
