/**
 * content.js — 多媒體串流資訊擷取核心調度腳本 (v3.0)
 *
 * 支援平台：
 * 1. YouTube (youtube.com/watch)
 * 2. YouTube Music (music.youtube.com)
 * 3. Spotify Web Player (open.spotify.com)
 * 4. SoundCloud (soundcloud.com)
 * 5. Twitch (twitch.tv — 支援直播與記錄檔 VOD 分流)
 */
'use strict';

if (!window._AGY_CONTENT_INJECTED) {
window._AGY_CONTENT_INJECTED = true;

let lastInfo = null;
let lastMediaElement = null;
let lastSentTime = 0;

// ── 格式化秒數為時鐘字串 ─────────────────────────────────────────────────────
function formatTime(sec) {
  if (sec === undefined || sec === null || isNaN(sec) || !isFinite(sec) || sec < 0) return '0:00';
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── 1. 原生 YouTube 資訊擷取 ─────────────────────────────────────────────────
function extractYouTubeInfo() {
  try {
    const video = document.querySelector('video');

    let currentTime = '0:00';
    let duration    = '0:00';
    let isLive      = false;

    // 綜合檢測 YouTube 直播狀態
    const liveMetaEl   = document.querySelector('meta[itemprop="isLiveBroadcast"]');
    const isLiveMeta   = Boolean(liveMetaEl && (liveMetaEl.content === 'True' || liveMetaEl.content === 'true'));
    const isLivePath   = Boolean(window.location && window.location.pathname && window.location.pathname.startsWith('/live/'));
    const ytpLiveBadge = document.querySelector('.ytp-live-badge');
    const isLiveBadgeVisible = Boolean(ytpLiveBadge && ytpLiveBadge.offsetWidth > 0);
    const hasLivePlayerClass = Boolean(document.querySelector('.html5-video-player.ytp-live, .ytp-time-display.ytp-live'));
    const isInfiniteDuration = Boolean(video && !isNaN(video.duration) && !isFinite(video.duration));

    const curTimeEl    = document.querySelector('.ytp-time-current');
    const durEl        = document.querySelector('.ytp-time-duration');

    if (isLiveBadgeVisible || hasLivePlayerClass || isLiveMeta || isLivePath || isInfiniteDuration) {
      isLive = true;
    }

    if (isLive) {
      duration = 'LIVE';
      currentTime = (video && !isNaN(video.currentTime) && video.currentTime > 0) ? formatTime(video.currentTime) : 'LIVE';
    } else if (video && !isNaN(video.duration) && video.duration > 0) {
      currentTime = formatTime(video.currentTime);
      duration    = formatTime(video.duration);
    } else {
      if (curTimeEl && durEl && curTimeEl.textContent.trim()) {
        currentTime = curTimeEl.textContent.trim();
        duration    = durEl.textContent.trim();
      }
    }

    let videoStatus = 'unknown';
    if (video) {
      if (video.paused) videoStatus = 'paused';
      else if (video.ended) videoStatus = 'ended';
      else videoStatus = 'playing';
    }

    let title = '';
    const titleSelectors = [
      'h1.ytd-watch-metadata yt-formatted-string',
      'h1.ytd-watch-metadata',
      '#title.ytd-watch-metadata',
      'h1.title.ytd-video-primary-info-renderer',
      'h1[itemprop="name"]',
      'title'
    ];
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.innerText || el.textContent || '').trim();
        if (text) {
          title = text.replace(/ - YouTube$/, '');
          break;
        }
      }
    }
    if (!title) {
      const meta = document.querySelector('meta[property="og:title"], meta[name="title"]');
      if (meta && meta.content) title = meta.content;
    }

    // 頻道名稱
    let channel = '';
    const channelEl = document.querySelector('ytd-channel-name a, #channel-name a, #owner-name a');
    if (channelEl) channel = (channelEl.innerText || channelEl.textContent || '').trim();

    let thumbnail = '';
    let vId = new URLSearchParams(window.location.search).get('v');
    if (!vId && window.location.pathname.startsWith('/live/')) {
      const livePathParts = window.location.pathname.split('/live/')[1];
      if (livePathParts) vId = livePathParts.split('/')[0].split('?')[0];
    }
    if (vId) {
      thumbnail = `https://i.ytimg.com/vi/${vId}/maxresdefault.jpg`;
    } else {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg && ogImg.content) thumbnail = ogImg.content;
    }

    return {
      platform:    'youtube',
      title:       title || '等待 YouTube 播放...',
      artist:      channel || '',
      thumbnail:   thumbnail || '',
      currentTime: currentTime || '0:00',
      duration:    duration || '0:00',
      videoStatus: videoStatus,
      isLive:      isLive,
      url:         window.location.href,
      timestamp:   Date.now(),
      extra: {
        channel: channel
      }
    };
  } catch (err) {
    console.warn('[content-youtube] 擷取過程警告:', err);
    return null;
  }
}

// ── 2. 總調度器：根據當前 Hostname 自動選擇適配器 ───────────────────────────
function extractCurrentPlatformInfo() {
  const host = window.location.hostname;

  // 1. YouTube Music
  if (host.includes('music.youtube.com')) {
    if (typeof window.YTMusicExtractor !== 'undefined' && window.YTMusicExtractor.extractYTMusicInfo) {
      return window.YTMusicExtractor.extractYTMusicInfo();
    }
  }

  // 2. Spotify Web Player
  if (host.includes('spotify.com')) {
    if (typeof window.extractSpotifyInfo === 'function') {
      return window.extractSpotifyInfo();
    }
  }

  // 3. SoundCloud
  if (host.includes('soundcloud.com')) {
    if (typeof window.extractSoundCloudInfo === 'function') {
      return window.extractSoundCloudInfo();
    }
  }

  // 4. Twitch (直播實況 vs 記錄檔 VOD)
  if (host.includes('twitch.tv')) {
    if (typeof window.extractTwitchInfo === 'function') {
      return window.extractTwitchInfo();
    }
  }

  // 5. 預設標準 YouTube
  return extractYouTubeInfo();
}

// ── 3. 媒體事件掛載（背景分頁關鍵）────────────────────────────────────────
function hookMediaEvents(media) {
  if (!media || media._unifiedHooked) return;
  media._unifiedHooked = true;

  const onUpdate = () => {
    // 1. 防禦：檢查擴充功能上下文是否有效（防止 Extension context invalidated 拋錯）
    if (!chrome.runtime || !chrome.runtime.id) {
      try {
        media.removeEventListener('timeupdate', onUpdate);
        media.removeEventListener('play', onUpdate);
        media.removeEventListener('pause', onUpdate);
        media.removeEventListener('seeked', onUpdate);
        media.removeEventListener('ended', onUpdate);
        media.removeEventListener('durationchange', onUpdate);
      } catch (e) {}
      return;
    }

    const now = Date.now();
    if (now - lastSentTime < 250) return; // 250ms 節流
    lastSentTime = now;

    const info = extractCurrentPlatformInfo();
    if (!info) return;
    lastInfo = info;

    try {
      // 2. 使用標準回呼並主動存取 lastError，徹底消除 Chrome「Could not establish connection」紅字警告
      chrome.runtime.sendMessage({
        action: 'videoTimeUpdate',
        data: info
      }, () => {
        // 主動存取以告知 Chrome 已處理此暫態連線狀況
        const ignored = chrome.runtime.lastError;
      });
    } catch (err) {
      // 忽略擴充功能重新載入時的暫態錯誤
    }
  };

  media.addEventListener('timeupdate', onUpdate);
  media.addEventListener('play', onUpdate);
  media.addEventListener('pause', onUpdate);
  media.addEventListener('seeked', onUpdate);
  media.addEventListener('ended', onUpdate);
  media.addEventListener('durationchange', onUpdate);

  console.log('[content] 已掛載原生媒體事件監聽器');
}

// ── 4. 訊息監聽器（供 background / popup 查詢）────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.action) {
      case 'ping':
      case 'checkContentScriptInjected':
        sendResponse({ success: true, message: 'ready', host: window.location.hostname });
        break;

      case 'getLastInfo':
      case 'extractInfo':
        const info = extractCurrentPlatformInfo();
        lastInfo = info;
        sendResponse({ success: true, data: info });
        break;

      default:
        sendResponse({ success: false, error: 'unknown_action' });
    }
  } catch (e) {
    sendResponse({ success: false, error: e.message });
  }
  return true;
});

// ── 5. 自動初始化與巡檢 ────────────────────────────────────────────────────
function setupMediaHooking() {
  const media = document.querySelector('video, audio');
  if (media && media !== lastMediaElement) {
    lastMediaElement = media;
    hookMediaEvents(media);
  }
}

setupMediaHooking();
lastInfo = extractCurrentPlatformInfo();

// 定期巡檢媒體元素更新（支援 SPA 頁面切換曲目）
setInterval(() => {
  setupMediaHooking();
  lastInfo = extractCurrentPlatformInfo();
}, 600);

// SPA 頁面切換監聽
document.addEventListener('yt-navigate-finish', () => setTimeout(setupMediaHooking, 300));
window.addEventListener('popstate', () => setTimeout(setupMediaHooking, 300));

console.log('[content] 多媒體串流資訊擷取腳本 (v3.0) 已啟動，平台:', window.location.hostname);

} // end of AGY_CONTENT_INJECTED