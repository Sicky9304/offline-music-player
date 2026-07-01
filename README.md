# 🎵 Offline Media Hub

A modern, offline-first desktop music and video player built with **Electron**, **React**, **Vite**, **Tailwind CSS**, **Framer Motion**, and **MongoDB**.

---

## ✨ Features

- 🎵 **Multi-format Playback:** Play audio (MP3, FLAC, WAV, AAC, M4A, OGG, OPUS, etc.) and video (MP4, MKV, AVI, MOV, WEBM, etc.) files offline.
- 🎛️ **5-Band Sound Equalizer:** Integrated audio graph equalizer (60Hz, 230Hz, 910Hz, 4kHz, 14kHz) with 6 built-in curves (Flat, Bass Booster, Vocal Booster, Rock, Electronic, Jazz).
- ☁️ **Sound Preset Studio:** Download advanced preset profiles (e.g. Bass Extreme, Podcast Voice) from the online cloud library or import local preset `.json` files.
- 🎨 **Theme & Accent Studio:** Choose between 8+ premium themes (Dark, Light, AMOLED, Neon, Studio, Glass, Classic, 3D Space) and 10 dynamic accent colors.
- 📥 **Theme Import & Export:** Export your active theme settings to `.json` files or import custom themes dynamically.
- 🎬 **Premium Spotify-Style Animations:** Spotify-like bobbing covers and slide-out spinning vinyl disc animations in the Featured sections.
- 📁 **Drag & Drop Scanning:** Effortless folder scanner with dynamic metadata and file size calculations.
- 🗃️ **MongoDB Library State:** Full local database backing libraries, playlists, histories, custom profiles, and configurations.
- 🔒 **Privacy-First:** 100% offline media playback — no tracks or metadata ever leave your machine.

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
