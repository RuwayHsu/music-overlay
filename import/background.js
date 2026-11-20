/**
 * background.js — Service Worker (v3.0 多媒體串流增強版)
 *
 * 支援平台：
 * - YouTube
 * - YouTube Music
 * - Spotify Web Player
 * - SoundCloud
 * - Twitch（直播中實況與 VOD 記錄檔）
 */
'use strict';

let projectedTabId = null;
let updateInterval = null;

const SERVER_URL = 'http://localhost:50120/api/update';

const MEDIA_URL_PATTERNS = [
  '*://*.youtube.com/watch*',
  '*://*.youtube.com/live/*',
  '*://music.youtube.com/*',
  '*://*.spotify.com/*',
  '*://*.soundcloud.com/*',
  '*://*.twitch.tv/*'
];

function getPlatformFromUrl(url = '') {
  if (url.includes('music.youtube.com')) return 'ytmusic';
  if (url.includes('youtube.com')) return 'youtube';
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  if (url.includes('twitch.tv/videos/') || url.includes('/clip/')) return 'twitch-vod';
  if (url.includes('twitch.tv')) return 'twitch-live';
  return 'media';
}

function getPlatformLabel(platform) {
  switch (platform) {
    case 'ytmusic':     return 'YT Music';
    case 'youtube':     return 'YouTube';
    case 'spotify':     return 'Spotify';
    case 'soundcloud':  return 'SoundCloud';
    case 'twitch-live': return 'Twitch 直播';
    case 'twitch-vod':  return 'Twitch 記錄檔';
    default:            return '串流媒體';
  }
}

// ── 啟動/停止投影定時器 ───────────────────────────────────────────────────
function startProjection(tabId) {
  stopProjection();
  projectedTabId = tabId;
  chrome.storage.local.set({ projectedTabId: tabId });

  // 立即執行一次輪詢
  pollProjectedTab();

  // 保留定期輪詢作為雙重保險
  updateInterval = setInterval(pollProjectedTab, 400);
  console.log(`[bg] 開始投影分頁: ${tabId}`);
}

function stopProjection() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  projectedTabId = null;
  chrome.storage.local.remove(['projectedTabId']);
  console.log('[bg] 停止投影');
}

// ── 輪詢當前投影分頁 ─────────────────────────────────────────────────────
function pollProjectedTab() {
  if (!projectedTabId) return;
  const tabId = projectedTabId;

  chrome.tabs.sendMessage(tabId, { action: 'getLastInfo' }, (res) => {
    if (chrome.runtime.lastError || !res || !res.data) {
      injectAndRetry(tabId);
      return;
    }
    sendToServer(res.data, tabId);
  });
}

// ── 按平台決定需要注入哪些腳本 ──────────────────────────────────────────
function getScriptsForUrl(url) {
  if (!url) return ['content.js'];
  if (url.includes('music.youtube.com'))   return ['ytmusic-extractor.js', 'content.js'];
  if (url.includes('youtube.com'))         return ['content.js'];
  if (url.includes('spotify.com'))         return ['extractors.js', 'content.js'];
  if (url.includes('soundcloud.com'))      return ['extractors.js', 'content.js'];
  if (url.includes('twitch.tv'))           return ['twitch-adapter.js', 'content.js'];
  return ['content.js'];
}

// ── 當 content script 尚未就緒時，按平台自動注入對應適配器 ───────────────
function injectAndRetry(tabId) {
  // 先取得分頁 URL，再決定注入哪些腳本（避免跨平台腳本污染）
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    const scripts = getScriptsForUrl(tab.url);
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: scripts
    }).then(() => {
      chrome.tabs.sendMessage(tabId, { action: 'getLastInfo' }, (res) => {
        if (!chrome.runtime.lastError && res && res.data) {
          sendToServer(res.data, tabId);
        }
      });
    }).catch(() => {});
  });
}

// ── 將資訊發送至本地伺服器 ───────────────────────────────────────────────
function sendToServer(info, tabId) {
  if (!info || !info.title) return;

  const payload = {
    tabId:       tabId,
    platform:    info.platform || 'media',
    title:       info.title,
    artist:      info.artist || info.streamer || '',
    thumbnail:   info.thumbnail || '',
    currentTime: info.currentTime || '0:00',
    duration:    info.duration || '0:00',
    videoStatus: info.videoStatus || 'unknown',
    isLive:      Boolean(info.isLive),
    url:         info.url || '',
    extra: {
      channel:     info.channel || info.streamer || '',
      category:    info.category || info.game || '',
      viewers:     info.viewers || '',
      streamTitle: info.streamTitle || '',
      liveStatus:  info.liveStatus || ''
    }
  };

  fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

// ── 訊息監聽器 ────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {

    // 接收來自 content.js 的原生 timeupdate 即時推送
    case 'videoTimeUpdate':
      if (message.data && sender.tab && sender.tab.id === projectedTabId) {
        sendToServer(message.data, sender.tab.id);
      }
      sendResponse({ success: true });
      break;

    // 設定投影分頁
    case 'setProjectedTab':
      if (message.tabId) {
        startProjection(message.tabId);
        sendResponse({ success: true, tabId: message.tabId });
      } else {
        stopProjection();
        sendResponse({ success: true, tabId: null });
      }
      break;

    // 取得當前投影分頁
    case 'getProjectedTab':
      sendResponse({ success: true, tabId: projectedTabId });
      break;

    // 停止投影
    case 'clearProjection':
      stopProjection();
      sendResponse({ success: true });
      break;

    // 查詢所有多媒體串流分頁 (YouTube, YT Music, Spotify, SoundCloud, Twitch)
    case 'getMediaTabs':
    case 'getYouTubeTabs':
      chrome.tabs.query({}, (allTabs) => {
        if (chrome.runtime.lastError || !allTabs) {
          sendResponse({ success: false, tabs: [] });
          return;
        }

        const matched = allTabs.filter(tab => {
          if (!tab.url) return false;
          return (
            tab.url.includes('youtube.com/watch') ||
            tab.url.includes('youtube.com/live') ||
            tab.url.includes('music.youtube.com') ||
            tab.url.includes('spotify.com') ||
            tab.url.includes('soundcloud.com') ||
            tab.url.includes('twitch.tv')
          );
        }).map(tab => {
          const platform = getPlatformFromUrl(tab.url);
          const platformLabel = getPlatformLabel(platform);
          let cleanTitle = (tab.title || '').trim();
          cleanTitle = cleanTitle
            .replace(/ - YouTube$/, '')
            .replace(/ - YouTube Music$/, '')
            .replace(/ \| Spotify$/, '')
            .replace(/ on SoundCloud$/, '')
            .replace(/ - Twitch$/, '')
            .trim();

          return {
            id: tab.id,
            url: tab.url,
            platform: platform,
            platformLabel: platformLabel,
            title: cleanTitle || '未命名分頁'
          };
        });

        sendResponse({ success: true, tabs: matched });
      });
      break;

    default:
      sendResponse({ success: false, error: 'unknown_action' });
  }

  return true;
});

// ── 分頁關閉事件 ─────────────────────────────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === projectedTabId) {
    stopProjection();
  }
});

// ── 瀏覽器啟動時恢復上次投影狀態 ─────────────────────────────────────────
chrome.storage.local.get(['projectedTabId'], (res) => {
  if (res.projectedTabId) {
    chrome.tabs.get(res.projectedTabId, (tab) => {
      if (!chrome.runtime.lastError && tab && tab.url) {
        const isMedia = (
          tab.url.includes('youtube.com/watch') ||
          tab.url.includes('youtube.com/live') ||
          tab.url.includes('music.youtube.com') ||
          tab.url.includes('spotify.com') ||
          tab.url.includes('soundcloud.com') ||
          tab.url.includes('twitch.tv')
        );
        if (isMedia) {
          startProjection(res.projectedTabId);
        } else {
          chrome.storage.local.remove(['projectedTabId']);
        }
      } else {
        chrome.storage.local.remove(['projectedTabId']);
      }
    });
  }
});

console.log('[bg] 多媒體 Service Worker (v3.0) 已啟動');