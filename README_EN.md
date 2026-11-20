# Music Overlay Prime Plus

Language: [繁體中文](./README.md) | **English**

Music Overlay Prime Plus is a real-time multimedia overlay system designed for live streamers, VTubers, and content creators using OBS Studio. It captures active playback metadata directly from your web browser via a Chromium extension and synchronizes it to OBS Browser Sources with ultra-low latency through a local WebSocket server. It also features a built-in Twitch chat bot that responds to `>np` commands in real time.

## Key Features

- **Multi-Platform Streaming Support**: Supports YouTube (Videos and Live Streams), YouTube Music, Spotify Web Player, SoundCloud, and Twitch (Live Streams and VODs/Clips).
- **Twitch Chat Bot Integration**: Connects directly to Twitch IRC via native WebSocket. Viewers can type `>np` or `!np` in chat to receive instant replies with the current track title, creator, playback progress, and direct URL. Supports replying from either the streamer's main account or a dedicated bot account.
- **Dual Overlay Layouts**: Offers both a Horizontal Capsule Card (650 x 125 px) and a Vertical Cover Card (380 x 510 px).
- **Visual Theme Engine & AI CSS Generation**: Includes built-in theme presets and real-time controls for background opacity, backdrop blur, border radius, progress bar gradients, and audio spectrum animations. Also provides documented CSS templates and an AI design specification (`custom-themes/SKILL.md`) so you can use generative AI to create custom CSS themes effortlessly.
- **Background System Tray Daemon**: Ships with a native Windows system tray application (`MusicOverlay.exe`) that runs silently in the background without intrusive command-line windows.

## Supported Platforms

| Platform | Supported Content | Extracted Metadata |
| :--- | :--- | :--- |
| YouTube | Standard videos, MVs, Live streams | Title, channel name, progress, thumbnail, URL |
| YouTube Music | Singles, albums, playlists | Track title, artist, album art, progress, URL |
| Spotify (Web) | Web player tracks | Track title, artist, high-res cover art, progress, URL |
| SoundCloud | Tracks, DJ mixes, podcasts | Track title, creator, progress, thumbnail, URL |
| Twitch | Live channels, VODs / Past broadcasts | Stream title, streamer, category, uptime or progress, URL |

## Project Structure

```text
Music-Overlay-Prime-Plus/
├── MusicOverlay.exe             # Windows system tray launcher & daemon
├── import/                      # Chromium browser extension (Manifest V3)
│   ├── manifest.json            # Extension manifest
│   ├── background.js            # WebSocket client & data relay
│   ├── content.js               # DOM observer & playback state detector
│   ├── extractors.js            # Multi-platform metadata extractors
│   ├── ytmusic-extractor.js     # Dedicated YouTube Music extractor
│   ├── twitch-adapter.js        # Dedicated Twitch adapter
│   └── popup.html / popup.js    # Extension popup UI
├── main/                        # Local backend & control panel server
│   ├── server.js                # HTTP server entry point
│   ├── ws.js                    # WebSocket broadcast hub
│   ├── state.js                 # Playback state manager
│   ├── twitch-bot.js            # Twitch IRC WebSocket bot engine
│   ├── routes/api.js            # REST API for status & Twitch bot config
│   ├── views/                   # Control panel (index.html) & OBS canvas (overlay.html)
│   └── tray/                    # C# Win32 system tray source code
└── custom-themes/               # Custom CSS templates, presets, and AI design guide
```

## Quick Start

### 1. Start the Local Server
- **Portable Edition (Recommended for users)**: Download the portable `.zip` archive from the **Releases** page, extract it, and double-click `MusicOverlay.exe`. The server will run in the Windows system tray and automatically open the control panel (`http://localhost:50120/index`).
- **From Source (For developers)**: Ensure Node.js is installed, then run:
  ```bash
  cd main
  npm install
  node server.js
  ```

### 2. Load the Browser Extension
1. Open Google Chrome or Microsoft Edge and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left corner and select the `import` folder inside this project.

### 3. Configure OBS Studio Browser Source
Add a new **Browser Source** in OBS Studio with one of the following configurations:

- **Horizontal Layout**:
  - URL: `http://localhost:50120/overlay?view=player2`
  - Width: `650` / Height: `125`
- **Vertical Layout**:
  - URL: `http://localhost:50120/overlay?view=player1`
  - Width: `380` / Height: `510`

### 4. Configure the Twitch Chat Bot (Optional)
1. Open the control panel at `http://localhost:50120/index` and switch to the **Twitch Bot (>np)** tab.
2. Generate a Twitch OAuth Token with `chat:read` and `chat:edit` scopes.
3. Enter your target Twitch channel name, bot username, and OAuth token, then click **Save & Connect**.
4. Your OAuth token is stored strictly locally in `main/twitch-bot-config.json` and is never transmitted to any external server.

## Detailed Documentation

For complete setup instructions, AI CSS customization guides, and troubleshooting, please refer to [HowToUse_EN.md](./HowToUse_EN.md) (English) or [HowToUse.md](./HowToUse.md) (Traditional Chinese).
