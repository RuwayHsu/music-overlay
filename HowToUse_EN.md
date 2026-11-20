# Music Overlay Prime+ Insider User Manual

Language: [繁體中文](./HowToUse.md) | **English**

**Version**: Prime Plus Insider Edition (v2.4)  
**Release Year**: 2026  
**Supported OS**: Windows 10 / Windows 11 (64-bit)  

---

## Table of Contents

- [1. Overview & Edition Highlights](#1-overview--edition-highlights)
- [2. Directory Structure & System Requirements](#2-directory-structure--system-requirements)
- [3. Quick Start in 3 Steps](#3-quick-start-in-3-steps)
- [4. OBS Studio Browser Source Configuration](#4-obs-studio-browser-source-configuration)
- [5. Supported Streaming Platforms](#5-supported-streaming-platforms)
- [6. Twitch Chat Bot & >np Command](#6-twitch-chat-bot--np-command)
  - [6.1 Overview](#61-overview)
  - [6.2 Obtaining a Twitch OAuth Token](#62-obtaining-a-twitch-oauth-token)
  - [6.3 Channel & Bot Account Setup](#63-channel--bot-account-setup)
  - [6.4 Supported Commands & Cooldown](#64-supported-commands--cooldown)
  - [6.5 Reply Format & Live Preview](#65-reply-format--live-preview)
  - [6.6 Privacy & Local Security](#66-privacy--local-security)
- [7. Visual Theme Engine & AI Custom CSS](#7-visual-theme-engine--ai-custom-css)
- [8. Frequently Asked Questions (FAQ)](#8-frequently-asked-questions-faq)

---

## 1. Overview & Edition Highlights

Music Overlay is a real-time multimedia projection system built for live streamers, VTubers, and content creators. It captures currently playing audio and video metadata from your web browser and renders it inside OBS Studio with ultra-low latency over WebSocket.

### Key Highlights

1. **Twitch Chat Bot Integration**
   - When viewers type `>np` or `!np` in your Twitch chat, the bot replies immediately with the current track title, artist/creator, playback progress, and a direct link.
   - Supports replying via your primary streamer account or a dedicated bot account.
2. **Comprehensive Platform Coverage**
   - Supports YouTube (videos and live streams), YouTube Music, Spotify Web Player, SoundCloud, and Twitch (live streams and VOD recordings).
3. **Standalone Portable Architecture**
   - The portable release bundles `runtime\node.exe` so no system-wide Node.js installation is required.
   - Includes `MusicOverlay.exe`, a native Win32 system tray utility that runs silently in the background without console windows, providing one-click access to the control panel and server restart controls.
4. **Dual Overlay Layouts**
   - Horizontal Capsule Card (650 x 125 px): Compact bottom bar ideal for gaming and chatting scenes.
   - Vertical Cover Card (380 x 510 px): Enlarged cover artwork with clear progress indicators, ideal for sidebars.
5. **Visual Theme Engine & Generative AI CSS Templates**
   - Built-in theme presets (Glassmorphism, Cyberpunk, Sakura Pink, Retro Terminal, Nordic Minimal) with real-time sliders for blur, opacity, border radius, and gradients.
   - Includes CSS templates and an AI specification file (`custom-themes/SKILL.md`) to generate custom themes using ChatGPT, Claude, or Gemini.

---

## 2. Directory Structure & System Requirements

```text
Music Overlay Prime Plus/
├── MusicOverlay.exe             # Main executable: Win32 system tray daemon
├── HowToUse.md / HowToUse_EN.md # User manuals (Traditional Chinese / English)
├── runtime/                     # Portable Node.js runtime (included in Release zip)
│   └── node.exe                 # Standalone executable
├── import/                      # Google Chrome / Microsoft Edge extension
│   ├── manifest.json            # Manifest V3 configuration
│   ├── background.js            # WebSocket relay core
│   ├── content.js               # Page DOM & playback detector
│   ├── extractors.js            # Multi-platform metadata extractors
│   └── popup.html / popup.js    # Extension popup UI
├── main/                        # Local backend & control panel server
│   ├── server.js                # HTTP & WebSocket server
│   ├── twitch-bot.js            # Twitch IRC WebSocket bot engine
│   ├── state.js                 # Playback state manager
│   ├── routes/api.js            # Status & Twitch bot configuration API
│   ├── views/                   # Web interfaces
│   │   ├── index.html           # Visual control panel & bot configuration
│   │   └── overlay.html         # OBS Browser Source canvas (Horizontal / Vertical)
│   └── tray/                    # System tray launcher C# source code
└── custom-themes/               # Custom CSS templates, presets, and AI design guide
```

**Minimum Requirements**:
- OS: Windows 10 / Windows 11 (64-bit)
- Browser: Google Chrome or Microsoft Edge
- Streaming Software: OBS Studio 28.0 or later

---

## 3. Quick Start in 3 Steps

### Step 1: Start the Local Server
- Double-click **`MusicOverlay.exe`** in the project root directory.
- The application will run silently in the Windows system tray (bottom-right corner of the taskbar) and automatically open the control panel (`http://localhost:50120/index`) in your default browser.

### Step 2: Load the Browser Extension
1. Open Chrome or Edge, type `chrome://extensions` in the address bar, and press Enter.
2. Turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the **`import`** folder inside the project directory.
5. Pin the Music Overlay extension to your browser toolbar for easy access.

### Step 3: Add Browser Source in OBS Studio
1. Open OBS Studio, click `+` under the **Sources** panel, and select **Browser**.
2. Configure the source according to your preferred layout:
   - **Horizontal Capsule Card**:
     - URL: `http://localhost:50120/overlay?view=player2`
     - Width: `650`
     - Height: `125`
   - **Vertical Cover Card**:
     - URL: `http://localhost:50120/overlay?view=player1`
     - Width: `380`
     - Height: `510`
3. Click **OK** to finish.

---

## 4. OBS Studio Browser Source Configuration

- **Preventing Clipping or Borders**: Ensure the Browser Source width and height match the exact dimensions listed above (`650 x 125` for Horizontal, `380 x 510` for Vertical).
- **Applying Custom CSS**:
  1. Customize your appearance in the control panel (`http://localhost:50120/index`) and click **Copy CSS for OBS**.
  2. In OBS Studio, right-click your Music Overlay Browser Source and open **Properties**.
  3. Paste the copied CSS into the **Custom CSS** field and click **OK**.

---

## 5. Supported Streaming Platforms

Open any supported streaming site in your browser and start playback. Click the extension icon in the toolbar to verify that projection is active:

| Platform | Supported Content | Extracted Metadata | Live Mode Detection |
| :--- | :--- | :--- | :--- |
| **YouTube** | Standard videos, MVs, Live streams | Title, channel, progress bar, thumbnail, URL | Supported (automatically detects live streams) |
| **YouTube Music** | Official singles, albums, playlists | Track title, artist, album cover, progress, URL | Standard track timer |
| **Spotify (Web)** | Spotify Web Player tracks | Track title, artist, HD album cover, progress, URL | Real-time DOM synchronization |
| **SoundCloud** | Indie tracks, DJ mixes, podcasts | Track title, creator, progress, thumbnail, URL | HTML5 player synchronization |
| **Twitch Live** | Live channels (`twitch.tv/channel`) | Stream title, streamer, category, uptime, URL | Live indicator badge & wave animation |
| **Twitch VOD** | Past broadcasts (`twitch.tv/videos/ID`) | Video title, channel name, playback time, thumbnail, URL | Synchronized timeline & progress bar |

---

## 6. Twitch Chat Bot & >np Command

### 6.1 Overview
- **Zero-Dependency IRC Architecture**: Connects directly to Twitch IRC over native WebSocket.
- **Dual Account Support**: Reply using either your main streamer account or a dedicated bot account (e.g., `yourname_bot`).
- **Smart Formatting**: Automatically formats platform tags, playback timestamps, and direct links.

### 6.2 Obtaining a Twitch OAuth Token
Connecting to Twitch chat requires only `chat:read` and `chat:edit` scopes:

1. Open your browser and visit:
   `https://twitchtokengenerator.com/?scope=chat:read+chat:edit`
2. Log in with the Twitch account you want the bot to speak as (either your main account or your bot account) and click **Authorize**.
3. Copy the generated OAuth token string.

### 6.3 Channel & Bot Account Setup
1. Open the control panel (`http://localhost:50120/index`) and select the **Twitch Bot (>np)** tab.
2. Fill in the fields:
   - **Channel**: Your Twitch channel login name (with or without `#`).
   - **Bot Username**: The account username that will send the replies.
   - **Twitch OAuth Token**: Paste your OAuth token.
   - **Enable Bot**: Toggle on.
3. Click **Save & Connect**. Once connected, the top status badge will turn green.

### 6.4 Supported Commands & Cooldown
- **Triggers**: `>np`, `!np`, and `>nowplaying`.
- **Cooldown**: Default is **5 seconds** to prevent chat spam.

### 6.5 Reply Format & Live Preview
- **YouTube Example**:
  ```text
  [YouTube] Yoru ni Kakeru - YOASOBI (1:45 / 4:21) | https://www.youtube.com/watch?v=...
  ```
- **Spotify Example**:
  ```text
  [Spotify] Blinding Lights - The Weeknd (0:58 / 3:20) | https://open.spotify.com/track/...
  ```
- **Twitch Live Example**:
  ```text
  [Twitch Live] Watching shroud: VALORANT Ranked Games [VALORANT] | https://www.twitch.tv/shroud
  ```

### 6.6 Privacy & Local Security
- **Local Storage Only**: Your OAuth token is saved exclusively on your local machine in `main/twitch-bot-config.json` and is never sent to any external server.
- **Minimal Scopes**: Uses only `chat:read` and `chat:edit`.

---

## 7. Visual Theme Engine & AI Custom CSS

In addition to the visual sliders in the control panel, the `custom-themes/` directory includes templates designed for generative AI:

- `custom-themes/SKILL.md`: Complete DOM structure, CSS custom properties, and design constraints.
- `custom-themes/player1-vertical-template.css`: Template for the vertical layout.
- `custom-themes/player2-horizontal-template.css`: Template for the horizontal layout.
- `custom-themes/presets.css`: Ready-to-use theme presets.

You can upload `custom-themes/SKILL.md` along with a template CSS file to ChatGPT, Claude, or Gemini and describe the theme you want. The AI will output ready-to-paste OBS Custom CSS tailored to the exact player layout.

---

## 8. Frequently Asked Questions (FAQ)

#### Q1: Nothing pops up on screen after double-clicking MusicOverlay.exe?
- **A**: This is expected behavior. `MusicOverlay.exe` runs silently without a console window and resides in your Windows system tray (bottom-right taskbar area). Right-click the tray icon to open the control panel, restart the server, or exit.

#### Q2: Typing >np in Twitch chat does not trigger a reply?
- **A**: Check the following:
  1. Verify that the Twitch status indicator in the control panel shows green (**Connected**).
  2. Verify that your OAuth token is valid and has not expired.
  3. Ensure the bot account is not muted or banned in your channel, and wait at least 5 seconds between commands.

#### Q3: OBS displays "Waiting for media..."?
- **A**: Ensure the browser extension is enabled, the media tab is actively playing, and refresh the media webpage if it was opened before loading the extension.

#### Q4: How do I shut down the server?
- **A**: Right-click the Music Overlay icon in the Windows system tray and select **Exit**. This cleanly terminates the background server and releases port `50120`.

---

*Music Overlay © 2026. All rights reserved.*
