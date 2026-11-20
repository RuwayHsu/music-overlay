# Music Overlay Prime Plus

語言 / Language: **繁體中文** | [English](./README_EN.md)

Music Overlay Prime Plus 是一套專為實況主與內容創作者設計的 OBS 即時多媒體資訊投影系統。系統透過瀏覽器擴充功能擷取當前播放的音樂或影音狀態，經由本機 WebSocket 伺服器以極低延遲同步至 OBS Studio 瀏覽器來源，並內建 Twitch 聊天室機器人（支援 `>np` 即時查詢當前曲目）。

## 核心功能

- **多平台串流支援**：支援 YouTube、YouTube Music、Spotify Web Player、SoundCloud 與 Twitch（直播與 VOD）。
- **Twitch 聊天室機器人整合**：透過原生 WebSocket 連線 Twitch IRC，觀眾輸入 `>np` 或 `!np` 即可自動回覆曲名、創作者、播放進度與來源網址。支援實況主本尊帳號或獨立機器人帳號發言。
- **雙版型投影畫布**：提供橫向膠囊卡片（650 x 125 px）與直向黑膠封面卡片（380 x 510 px）兩種版型。
- **視覺化調色引擎與 AI 樣式生成**：中控台內建多款預設主題，支援自訂背景透明度、高斯模糊（Backdrop Blur）、圓角半徑、進度條漸層與頻譜動畫；同時於 `custom-themes/` 提供完整 CSS 範本與 AI 設計規範（`SKILL.md`），可搭配生成式 AI 快速產出專屬主題。
- **系統匣背景常駐**：提供 Windows 系統匣常駐程式（`MusicOverlay.exe`），無命令列黑框干擾，可於背景管理伺服器與快速開啟中控台。

## 支援平台一覽

| 平台名稱 | 支援內容 | 擷取資訊 |
| :--- | :--- | :--- |
| YouTube | 一般影片、MV、直播串流 | 標題、頻道名稱、播放進度、縮圖、來源網址 |
| YouTube Music | 單曲、專輯、播放清單 | 曲名、演出者、專輯封面、播放進度、來源網址 |
| Spotify (Web) | 網頁播放器曲目 | 曲名、歌手、高解析度封面、播放進度、來源網址 |
| SoundCloud | 單曲、DJ Mix、Podcast | 曲名、創作者、播放進度、縮圖、來源網址 |
| Twitch | 實況直播、VOD 歷史影片 | 標題、實況主、遊戲分類、開台時長或播放進度、網址 |

## 專案目錄結構

```text
Music-Overlay-Prime-Plus/
├── MusicOverlay.exe             # Windows 系統匣常駐啟動程式
├── import/                      # Chromium 瀏覽器擴充功能 (Manifest V3)
│   ├── manifest.json            # 擴充功能設定檔
│   ├── background.js            # WebSocket 連線與資料中繼核心
│   ├── content.js               # 頁面 DOM 與播放狀態偵測
│   ├── extractors.js            # 多平台資訊解析器
│   ├── ytmusic-extractor.js     # YouTube Music 專用解析器
│   ├── twitch-adapter.js        # Twitch 平台專用適配器
│   └── popup.html / popup.js    # 擴充功能操作介面
├── main/                        # 本機後端與中控台伺服器
│   ├── server.js                # HTTP 與靜態資源伺服器
│   ├── ws.js                    # WebSocket 廣播核心
│   ├── state.js                 # 播放狀態管理
│   ├── twitch-bot.js            # Twitch IRC WebSocket 機器人引擎
│   ├── routes/api.js            # 系統狀態與機器人設定 API
│   ├── views/                   # 中控台 (index.html) 與投影畫布 (overlay.html)
│   └── tray/                    # C# Win32 系統匣常駐程式原始碼
└── custom-themes/               # 客製化 CSS 樣板與主題預設集
```

## 快速安裝與使用

### 1. 啟動後端伺服器
- **免安裝版（推薦一般使用者）**：於 Releases 頁面下載完整壓縮包並解壓縮，雙擊執行 `MusicOverlay.exe`。程式將常駐於 Windows 右下角系統匣，並自動開啟中控台（`http://localhost:50120/index`）。
- **原始碼執行（開發者）**：確認系統已安裝 Node.js，進入 `main` 目錄安裝相依套件並啟動：
  ```bash
  cd main
  npm install
  node server.js
  ```

### 2. 安裝瀏覽器擴充功能
1. 開啟 Google Chrome 或 Microsoft Edge，於網址列輸入 `chrome://extensions`。
2. 開啟右上角「開發人員模式」。
3. 點擊左上角「載入未封裝項目」，選擇專案目錄下的 `import` 資料夾。

### 3. 設定 OBS Studio 瀏覽器來源
於 OBS Studio 新增「瀏覽器 (Browser Source)」，依需求填入以下參數：

- **橫向版型**：
  - URL: `http://localhost:50120/overlay?view=player2`
  - 寬度: `650` / 高度: `125`
- **直向版型**：
  - URL: `http://localhost:50120/overlay?view=player1`
  - 寬度: `380` / 高度: `510`

### 4. 設定 Twitch 聊天室機器人（選用）
1. 開啟中控台 `http://localhost:50120/index`，切換至「Twitch 機器人 (>np)」分頁。
2. 取得具備 `chat:read` 與 `chat:edit` 權限之 Twitch OAuth Token。
3. 填入欲進駐的實況頻道名稱、機器人帳號與 OAuth Token，點擊「儲存設定並連線」。
4. 您的 OAuth Token 僅儲存於本機 `main/twitch-bot-config.json`，不會上傳至任何外部伺服器。

## 詳細說明文件

完整圖文操作指南與常見問題排除，請參閱專案內的 [HowToUse.md](./HowToUse.md)。