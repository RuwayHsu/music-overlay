/**
 * twitch-bot.js — Twitch 聊天室互動機器人
 *
 * 功能亮點：
 * 1. 原生輕量級 IRC over WebSocket (wss://irc-ws.chat.twitch.tv:443)
 * 2. 支援實況主本人帳號 或 專屬機器人小帳 (雙模式支援)
 * 3. 監聽聊天室 `>np` 與 `!np` 指令
 * 4. 即時回傳當前播放中之音樂、收看之實況或影片連結 (YouTube / Spotify / SoundCloud / Twitch)
 * 5. 防洗版冷卻機制 (預設 5 秒) 與設定檔本機持久化儲存
 */

'use strict';

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const stateModule = require('./state');

const CONFIG_PATH = path.join(__dirname, 'twitch-bot-config.json');

// ── 預設設定檔 ─────────────────────────────────────────────────────────────
const defaultConfig = {
  enabled: false,
  channel: '',            // 要加入的實況頻道名稱 (如: streamer_name)
  botUsername: '',        // 機器人登入帳號 (留空則使用 channel 本人)
  oauthToken: '',         // Twitch OAuth Token (格式: oauth:xxxx 或 xxxx)
  commandPrefix: '>np',   // 預設觸發指令
  cooldownSeconds: 5,     // 指令防洗版冷卻秒數
  customTemplate: ''      // 自訂回覆模板 (留空則使用智慧型預設格式)
};

let config = { ...defaultConfig };
let ws = null;
let reconnectTimer = null;
let pingInterval = null;
let lastCommandTime = 0;

let botStatus = {
  connected: false,
  connecting: false,
  channel: '',
  botUsername: '',
  lastError: '',
  commandsProcessed: 0,
  lastReply: ''
};

// ── 讀取與儲存設定檔 ───────────────────────────────────────────────────────
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      config = { ...defaultConfig, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('[twitch-bot] 讀取設定檔失敗:', err.message);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('[twitch-bot] 儲存設定檔失敗:', err.message);
  }
}

// ── 清理 Token 格式 ───────────────────────────────────────────────────────
function cleanToken(token) {
  if (!token) return '';
  let t = token.trim();
  if (t.startsWith('oauth:')) {
    t = t.substring(6);
  }
  return t;
}

// ── 智慧型產生 >np 回覆內容 ─────────────────────────────────────────────────
function buildNowPlayingMessage() {
  const current = stateModule.getState().mediaInfo;

  if (!current || !current.title || current.title === '等待媒體資訊...' || current.title.startsWith('等待')) {
    return '[現在播放] 目前尚未偵測到播放中的音樂或影片。';
  }

  const p = (current.platform || '').toLowerCase();
  const title = current.title || '';
  const artist = current.artist || '';
  const cur = current.currentTime || '0:00';
  const dur = current.duration || '0:00';
  const url = current.url || '';

  let tag = '[音樂]';
  let content = '';

  if (p === 'youtube') {
    tag = current.isLive ? '[YouTube 直播]' : '[YouTube]';
    content = artist ? `${title} - ${artist}` : title;
  } else if (p === 'ytmusic') {
    tag = '[YT Music]';
    content = artist ? `${title} - ${artist}` : title;
  } else if (p === 'spotify') {
    tag = '[Spotify]';
    content = artist ? `${title} - ${artist}` : title;
  } else if (p === 'soundcloud') {
    tag = '[SoundCloud]';
    content = artist ? `${title} - ${artist}` : title;
  } else if (p === 'twitch-live' || (p === 'twitch' && current.isLive)) {
    tag = '[Twitch 直播]';
    const streamer = current.artist || current.extra?.channel || '';
    const game = current.extra?.category || current.extra?.game || '';
    content = `正在收看 ${streamer} 的實況：${title}${game ? ' [' + game + ']' : ''}`;
  } else if (p === 'twitch-vod' || p === 'twitch') {
    tag = '[Twitch 影片]';
    content = `正在收看 ${current.artist || ''} 的錄影：${title}`;
  } else {
    tag = '[Now Playing]';
    content = artist ? `${title} - ${artist}` : title;
  }

  if (url) {
    return `${tag} ${content} | ${url}`;
  }
  return `${tag} ${content}`;
}

// ── 發送 IRC 訊息 ─────────────────────────────────────────────────────────
function sendRaw(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(msg + '\r\n');
  }
}

function sendChatMessage(text) {
  const targetChannel = (config.channel || '').toLowerCase().replace(/^#/, '');
  if (!targetChannel) return;
  sendRaw(`PRIVMSG #${targetChannel} :${text}`);
  botStatus.lastReply = text;
}

// ── 連線至 Twitch IRC WebSocket ──────────────────────────────────────────
function connect() {
  if (ws) {
    disconnect();
  }

  if (!config.enabled) {
    botStatus.connected = false;
    botStatus.connecting = false;
    return;
  }

  const channel = (config.channel || '').toLowerCase().replace(/^#/, '').trim();
  const token = cleanToken(config.oauthToken);
  const botUser = (config.botUsername || config.channel || '').toLowerCase().trim();

  if (!channel || !token || !botUser) {
    botStatus.connected = false;
    botStatus.connecting = false;
    botStatus.lastError = '請填寫完整的頻道名稱與 OAuth Token';
    return;
  }

  botStatus.connecting = true;
  botStatus.lastError = '';
  botStatus.channel = channel;
  botStatus.botUsername = botUser;

  console.log(`[twitch-bot] 正在連線至 Twitch IRC (帳號: ${botUser}, 頻道: #${channel})...`);

  try {
    ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    ws.on('open', () => {
      console.log('[twitch-bot] WebSocket 已建立，正在傳送驗證資訊...');
      sendRaw('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
      sendRaw(`PASS oauth:${token}`);
      sendRaw(`NICK ${botUser}`);
    });

    ws.on('message', (data) => {
      const lines = data.toString().split(/\r\n|\r|\n/);
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line) {
          handleIrcMessage(line);
        }
      }
    });

    ws.on('close', (code, reason) => {
      botStatus.connected = false;
      botStatus.connecting = false;
      clearInterval(pingInterval);
      console.log(`[twitch-bot] 連線已中斷 (code: ${code}, reason: ${reason})`);
      if (config.enabled) {
        scheduleReconnect();
      }
    });

    ws.on('error', (err) => {
      botStatus.lastError = err.message || '連線發生錯誤';
      console.error('[twitch-bot] 連線異常:', err.message);
    });
  } catch (err) {
    botStatus.connecting = false;
    botStatus.lastError = err.message;
  }
}

// ── IRC 訊息解析與指令觸發 ────────────────────────────────────────────────
function handleIrcMessage(line) {
  // 1. PING 保持連線
  if (line.startsWith('PING')) {
    sendRaw('PONG :tmi.twitch.tv');
    return;
  }

  // 2. 驗證成功或已加入頻道
  if (line.includes(':tmi.twitch.tv 001 ') || line.includes('Welcome, GLHF!')) {
    const channel = (config.channel || '').toLowerCase().replace(/^#/, '').trim();
    console.log(`[twitch-bot] 登入驗證成功！正在加入頻道 #${channel}...`);
    sendRaw(`JOIN #${channel}`);
  }

  if (line.includes('JOIN #') || line.includes(' 366 ') || line.includes('ROOMSTATE')) {
    botStatus.connected = true;
    botStatus.connecting = false;
    botStatus.lastError = '';
    console.log(`[twitch-bot] 成功加入頻道 #${botStatus.channel}，聊天室 >np 指令已就緒！`);
  }

  // 3. 登入失敗偵測
  if (line.includes(':tmi.twitch.tv NOTICE * :Login authentication failed') || line.includes('Login unsuccessful')) {
    botStatus.connected = false;
    botStatus.connecting = false;
    botStatus.lastError = 'OAuth Token 驗證失敗，請確認 Token 是否有效且包含 chat:read chat:edit 權限';
    console.error('[twitch-bot] 登入失敗: OAuth Token 無效');
    disconnect();
    return;
  }

  // 4. 監聽聊天室訊息 (PRIVMSG)
  // 支援標籤 (tags) 前綴與標準 PRIVMSG
  // 範例: @badge-info=... :user!user@user.tmi.twitch.tv PRIVMSG #channel :>np
  const privmsgMatch = line.match(/^(?:@\S+\s+)?:([^!]+)![^\s]+\s+PRIVMSG\s+#([^\s]+)\s+:(.*)$/i);
  if (privmsgMatch) {
    const sender = privmsgMatch[1];
    const message = privmsgMatch[3].trim();
    checkAndExecuteCommand(sender, message);
  }
}

function checkAndExecuteCommand(sender, message) {
  const prefix = (config.commandPrefix || '>np').trim().toLowerCase();
  const lowerMsg = message.toLowerCase();

  // 支援預設 >np、!np 或自訂指令
  const isTriggered = (
    lowerMsg === prefix ||
    lowerMsg.startsWith(prefix + ' ') ||
    lowerMsg === '!np' ||
    lowerMsg.startsWith('!np ') ||
    lowerMsg === '>nowplaying' ||
    lowerMsg.startsWith('>nowplaying ')
  );

  if (!isTriggered) return;

  const now = Date.now();
  const cooldownMs = (Number(config.cooldownSeconds) || 5) * 1000;

  // 冷卻時間檢查，防止洗版
  if (now - lastCommandTime < cooldownMs) {
    console.log(`[twitch-bot] 指令冷卻中，略過來自 @${sender} 的請求`);
    return;
  }
  lastCommandTime = now;

  // 取得最新播放訊息並在聊天室發送
  const reply = buildNowPlayingMessage();
  console.log(`[twitch-bot] 收到 @${sender} 呼叫指令，回覆: ${reply}`);
  sendChatMessage(reply);
  botStatus.commandsProcessed++;
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (config.enabled && !botStatus.connected) {
      console.log('[twitch-bot] 正在嘗試自動重新連線...');
      connect();
    }
  }, 10000);
}

function disconnect() {
  clearTimeout(reconnectTimer);
  clearInterval(pingInterval);
  if (ws) {
    try {
      ws.removeAllListeners();
      ws.close();
    } catch (_) {}
    ws = null;
  }
  botStatus.connected = false;
  botStatus.connecting = false;
}

// ── 外部 API ───────────────────────────────────────────────────────────────
function init() {
  loadConfig();
  if (config.enabled) {
    connect();
  }
}

function updateConfig(newConfig) {
  const wasEnabled = config.enabled;
  const oldChannel = config.channel;
  const oldToken   = config.oauthToken;
  const oldBot     = config.botUsername;

  config = {
    ...config,
    enabled: Boolean(newConfig.enabled),
    channel: (newConfig.channel || '').trim(),
    botUsername: (newConfig.botUsername || '').trim(),
    oauthToken: newConfig.oauthToken ? newConfig.oauthToken.trim() : config.oauthToken,
    commandPrefix: (newConfig.commandPrefix || '>np').trim(),
    cooldownSeconds: Math.max(2, Number(newConfig.cooldownSeconds) || 5)
  };

  saveConfig();

  const needReconnect = (
    config.enabled !== wasEnabled ||
    config.channel !== oldChannel ||
    config.oauthToken !== oldToken ||
    config.botUsername !== oldBot
  );

  if (needReconnect) {
    if (config.enabled) {
      connect();
    } else {
      disconnect();
    }
  }

  return getSanitizedConfig();
}

function getSanitizedConfig() {
  return {
    enabled: config.enabled,
    channel: config.channel,
    botUsername: config.botUsername,
    oauthToken: config.oauthToken || '',
    hasToken: Boolean(config.oauthToken),
    maskedToken: config.oauthToken ? '••••••••' + config.oauthToken.slice(-4) : '',
    commandPrefix: config.commandPrefix || '>np',
    cooldownSeconds: config.cooldownSeconds || 5
  };
}

function getStatus() {
  return {
    ...botStatus,
    enabled: config.enabled,
    commandPrefix: config.commandPrefix
  };
}

function sendTestMessage() {
  if (!botStatus.connected) {
    return { ok: false, success: false, error: '機器人尚未連線至 Twitch 聊天室' };
  }
  const reply = buildNowPlayingMessage();
  sendChatMessage(`[測試] ${reply}`);
  return { ok: true, success: true, message: `已在 #${botStatus.channel} 發送測試回覆` };
}

module.exports = {
  init,
  connect,
  disconnect,
  updateConfig,
  getConfig: getSanitizedConfig,
  getStatus,
  sendTestMessage,
  buildNowPlayingMessage
};
