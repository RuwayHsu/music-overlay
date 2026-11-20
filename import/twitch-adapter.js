/**
 * twitch-adapter.js — Twitch (twitch.tv) 實況與記錄檔 (VOD) 資訊擷取器 (v3.5 GQL 雙引擎強化版)
 *
 * 特性亮點：
 * 1. GQL + DOM 雙軌混合架構：
 *    - 整合 Twitch 官方公開 Web GQL 端點 (Client-Id: kimne78kx3ncx6brgo4mv6wki5h1ko)
 *    - 毫秒級直取實況主 300x300 高解析度官方頭貼（100% 準確，徹底杜絕抓到登入者個人頭像或找不到頭貼問題）
 *    - 官方資料庫開台時間 (createdAt) 同步，即使播放器控制列隱藏、全螢幕或劇院模式，直播時長依然分秒精準！
 * 2. 核心時間軸精準修復：
 *    - 徹底捨棄 live 串流錯誤讀取 video.currentTime（本機緩衝區秒數）的缺陷
 *    - 自動依據官方開台戳記計算即時時長；並具備 DOM .live-time 反向時鐘校正引擎
 * 3. 實況 (Live) 與 記錄檔 (VOD) 智慧分流：
 *    - 精準區分頻道實況與 /videos/<id> 錄影，VOD 精確抓取影片標題、原片縮圖與進度條
 * 4. 相容性：
 *    - 輸出完全相容於 YouTube Overlay 體系的標準化 Payload
 */

'use strict';

// ── 內部快取與狀態管理 ─────────────────────────────────────────────────────
const _twitchCache = {
  target: '',              // 當前目標 (頻道名 或 VOD ID)
  isVod: false,
  lastFetchTime: 0,
  data: null,              // GQL 回傳的 user 或 video 資料
  streamStartedAt: 0,      // 開台起始時間戳 (毫秒)
  isFetching: false
};

// ── Twitch 非頻道之保留路由 ──────────────────────────────────────────────────
const TWITCH_RESERVED_ROUTES = new Set([
  '',
  'directory',
  'videos',
  'downloads',
  'p',
  'jobs',
  'turbo',
  'prime',
  'settings',
  'subscriptions',
  'wallet',
  'inventory',
  'drops',
  'friends',
  'messages',
  'popout',
  'search',
  'login',
  'signup',
  'moderator',
  'dashboard',
  'creator',
  'payments',
  'notifications',
  'broadcast'
]);

/**
 * 格式化秒數為時鐘字串 (例如 3:24 或 1:05:32)
 * @param {number} sec 秒數
 * @returns {string} 格式化字串
 */
function _twitchFormatTime(sec) {
  if (sec === undefined || sec === null || isNaN(sec) || !isFinite(sec)) return '0:00';
  sec = Math.floor(sec);
  if (sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── GQL 官方端點快速查詢 (無須驗證 Token) ──────────────────────────────────
async function _fetchTwitchGQL(query, variables) {
  try {
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    return null;
  }
}

/**
 * 非同步背景同步 Twitch 官方資料庫資料 (節流 15 秒)
 */
function _syncTwitchData(target, isVod) {
  if (!target) return;
  const now = Date.now();

  // 若目標切換或快取已超過 15 秒，且未在查詢中，則發起請求
  const targetChanged = (_twitchCache.target !== target || _twitchCache.isVod !== isVod);
  if ((targetChanged || now - _twitchCache.lastFetchTime > 15000) && !_twitchCache.isFetching) {
    _twitchCache.isFetching = true;
    _twitchCache.target = target;
    _twitchCache.isVod = isVod;

    if (isVod) {
      // 查詢 VOD 資料
      const vodQuery = `query($id: ID!) {
        video(id: $id) {
          id
          title
          lengthSeconds
          previewThumbnailURL(width: 640, height: 360)
          owner {
            displayName
            profileImageURL(width: 300)
          }
          game { name }
        }
      }`;
      _fetchTwitchGQL(vodQuery, { id: target }).then((data) => {
        _twitchCache.isFetching = false;
        _twitchCache.lastFetchTime = Date.now();
        if (data?.video) {
          _twitchCache.data = data.video;
        }
      }).catch(() => { _twitchCache.isFetching = false; });
    } else {
      // 查詢直播頻道資料
      const channelQuery = `query($login: String!) {
        user(login: $login) {
          id
          displayName
          profileImageURL(width: 300)
          stream {
            id
            createdAt
            title
            viewersCount
            game { name }
          }
        }
      }`;
      _fetchTwitchGQL(channelQuery, { login: target }).then((data) => {
        _twitchCache.isFetching = false;
        _twitchCache.lastFetchTime = Date.now();
        if (data?.user) {
          _twitchCache.data = data.user;
          if (data.user.stream?.createdAt) {
            _twitchCache.streamStartedAt = new Date(data.user.stream.createdAt).getTime();
          }
        }
      }).catch(() => { _twitchCache.isFetching = false; });
    }
  }
}

/**
 * 判斷當前頁面為「直播中的實況 (Live)」還是「記錄檔 (VOD)」
 * @param {HTMLVideoElement|null} video
 * @returns {{ isLive: boolean, platform: 'twitch-live'|'twitch-vod', type: 'live'|'vod'|'offline'|'other' }}
 */
function detectTwitchStreamType(video) {
  const pathname = window.location.pathname;
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = (pathSegments[0] || '').toLowerCase();

  // 1. 優先判斷 URL：若路徑為 /videos/<id> 或剪輯 /clip/，確定為 VOD
  const isVodPath = pathname.startsWith('/videos/') || (firstSegment === 'videos' && pathSegments.length > 1);
  const isClipPath = pathname.includes('/clip/') || window.location.hostname.startsWith('clips.');
  if (isVodPath || isClipPath) {
    return { isLive: false, platform: 'twitch-vod', type: 'vod' };
  }

  // 2. 檢驗 DOM 中的 Live 指標
  const liveIndicator = document.querySelector(
    '[data-a-target="live-indicator"], .live-indicator-container, .tw-channel-status-text-indicator, [data-a-target="player-live-text"], .stream-type-indicator--live'
  );
  if (liveIndicator) {
    const text = (liveIndicator.textContent || '').trim().toUpperCase();
    if (
      text.includes('LIVE') ||
      text.includes('直播') ||
      text.includes('實況') ||
      liveIndicator.getAttribute('data-a-target') === 'live-indicator' ||
      liveIndicator.classList.contains('live-indicator-container')
    ) {
      return { isLive: true, platform: 'twitch-live', type: 'live' };
    }
  }

  // 3. 檢驗 Live 開台時長元素
  const liveTimeEl = document.querySelector('.live-time, [data-a-target="player-live-time"]');
  if (liveTimeEl && liveTimeEl.textContent.trim()) {
    return { isLive: true, platform: 'twitch-live', type: 'live' };
  }

  // 4. 檢驗 <video> 元素長度特性
  if (video) {
    if (video.duration === Infinity || isNaN(video.duration)) {
      return { isLive: true, platform: 'twitch-live', type: 'live' };
    }
    if (isFinite(video.duration) && video.duration > 0) {
      return { isLive: false, platform: 'twitch-vod', type: 'vod' };
    }
  }

  // 5. 頻道網址判定：twitch.tv/<channel_name>
  if (firstSegment && !TWITCH_RESERVED_ROUTES.has(firstSegment)) {
    const offlineIndicator = document.querySelector(
      '.channel-status-info--offline, [data-a-target="channel-offline-carousel"]'
    );
    if (offlineIndicator) {
      return { isLive: false, platform: 'twitch-live', type: 'offline' };
    }
    return { isLive: true, platform: 'twitch-live', type: 'live' };
  }

  return { isLive: false, platform: 'twitch-vod', type: 'other' };
}

/**
 * 擷取實況主 / 頻道名稱
 * @param {boolean} isLive
 * @returns {string} 實況主名稱
 */
function extractStreamerName(isLive) {
  // 1. 若 GQL 快取已有官方 displayName，優先返回
  if (_twitchCache.data) {
    if (isLive && _twitchCache.data.displayName) {
      return _twitchCache.data.displayName;
    }
    if (!isLive && _twitchCache.data.owner?.displayName) {
      return _twitchCache.data.owner.displayName;
    }
  }

  const pathname = window.location.pathname;
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0] || '';

  if (isLive && firstSegment && !TWITCH_RESERVED_ROUTES.has(firstSegment.toLowerCase())) {
    const channelEl = document.querySelector(
      'a[data-a-target="user-channel-link"], [data-a-target="channel-header-title"], span[data-a-target="user-display-name"]'
    );
    if (channelEl && channelEl.textContent.trim()) {
      return channelEl.textContent.trim();
    }
    return firstSegment;
  }

  const streamerSelectors = [
    'a[data-a-target="video-owner-name"]',
    '.channel-info-content a[data-a-target="user-channel-link"]',
    'a[data-a-target="user-channel-link"]',
    'h1.tw-title',
    '[data-a-target="channel-header-title"]',
    'span[data-a-target="user-display-name"]'
  ];

  for (const sel of streamerSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim()) {
      return el.textContent.trim();
    }
  }

  return firstSegment && !TWITCH_RESERVED_ROUTES.has(firstSegment.toLowerCase()) ? firstSegment : '';
}

/**
 * 擷取標題 (實況標題或 VOD 影片標題)
 * @param {boolean} isLive
 * @returns {string} 標題
 */
function extractTitle(isLive) {
  // DOM 選擇器優先
  if (isLive) {
    const liveSelectors = [
      'h2[data-a-target="stream-title"]',
      '[data-a-target="stream-title"]',
      'h1[data-a-target="stream-title"]'
    ];
    for (const sel of liveSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.innerText || el.textContent || '').trim();
        if (text) return text;
      }
    }
    // GQL 備用標題
    if (_twitchCache.data?.stream?.title) {
      return _twitchCache.data.stream.title;
    }
  } else {
    const vodSelectors = [
      '[data-a-target="stream-title"]',
      'h2[data-a-target="stream-title"]',
      'h2.tw-title',
      '[data-a-target="video-title"]',
      '.video-info__metadata h2',
      'h2[title]'
    ];
    for (const sel of vodSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.getAttribute('title') || el.innerText || el.textContent || '').trim();
        if (text) return text;
      }
    }
    // GQL 備用 VOD 標題
    if (_twitchCache.data?.title) {
      return _twitchCache.data.title;
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) {
      const cleaned = ogTitle.content.replace(/ - Twitch$/i, '').trim();
      if (cleaned) return cleaned;
    }
  }

  if (document.title) {
    let t = document.title.replace(/ - Twitch$/i, '').trim();
    t = t.replace(/\s*-\s*[^-]+ on Twitch$/i, '').trim();
    if (t) return t;
  }

  return '';
}

/**
 * 擷取遊戲 / 分類 (Category / Game)
 * @returns {string} 遊戲或分類名稱
 */
function extractCategory() {
  const categorySelectors = [
    'a[data-a-target="stream-game-link"]',
    '[data-a-target="stream-game-link"] span',
    'a[data-a-target="animated-channel-viewers-and-category"]',
    '[data-a-target="animated-channel-viewers-and-category"]'
  ];

  for (const sel of categorySelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent.trim();
      if (text) return text;
    }
  }

  if (_twitchCache.data?.stream?.game?.name) {
    return _twitchCache.data.stream.game.name;
  }
  if (_twitchCache.data?.game?.name) {
    return _twitchCache.data.game.name;
  }

  return '';
}

/**
 * 擷取當前觀看人數 (僅直播)
 * @returns {string} 觀看人數
 */
function extractViewers() {
  const viewerSelectors = [
    '[data-a-target="animated-channel-viewers-and-category"] span',
    'span[data-a-target="animated-channel-viewers-and-category"]',
    '[data-a-target="live-channel-viewers-count"]',
    '.tw-stat--live'
  ];

  for (const sel of viewerSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent.trim();
      if (text) {
        return text.replace(/(?:觀眾|viewers)/gi, '').trim();
      }
    }
  }

  if (_twitchCache.data?.stream?.viewersCount !== undefined) {
    return Number(_twitchCache.data.stream.viewersCount).toLocaleString();
  }

  return '';
}

/**
 * 擷取頻道實況主頭貼或縮圖（100% 穩定，嚴格杜絕登入者個人頭像）
 * @param {HTMLVideoElement|null} video
 * @param {boolean} isLive
 * @returns {string} 圖片 URL
 */
function extractThumbnail(video, isLive) {
  // 1. 最高優先：GQL 官方保證的 300x300 高清頭貼
  if (_twitchCache.data) {
    if (isLive && _twitchCache.data.profileImageURL) {
      return _twitchCache.data.profileImageURL;
    }
    if (!isLive) {
      if (_twitchCache.data.previewThumbnailURL) return _twitchCache.data.previewThumbnailURL;
      if (_twitchCache.data.owner?.profileImageURL) return _twitchCache.data.owner.profileImageURL;
    }
  }

  // 2. 頻道路徑精準匹配：尋找包含實況主頻道名 href 的頭像圖片
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const channel = (pathSegments[0] || '').toLowerCase();
  if (channel && !TWITCH_RESERVED_ROUTES.has(channel)) {
    const channelLinkImgs = document.querySelectorAll(
      `a[href="/${channel}"] img, a[href="/${channel}/"] img, a[data-a-target="user-channel-link"] img`
    );
    for (const img of channelLinkImgs) {
      if (img && img.src && !img.src.includes('user-default-pictures')) {
        return img.src;
      }
    }
  }

  // 3. DOM 頻道資訊區頭像選擇器（嚴格排除頂部導覽列與側邊欄帳號頭像）
  const streamerAvatarSelectors = [
    '.channel-info-content img.tw-image-avatar',
    '.channel-info-content .tw-avatar img',
    '[data-a-target="channel-header-avatar"] img',
    '[data-a-target="user-avatar-image"]',
    '.metadata-layout__support .tw-avatar img',
    '.channel-root__info img',
    'figure.tw-avatar img'
  ];

  for (const sel of streamerAvatarSelectors) {
    const img = document.querySelector(sel);
    if (img && img.src && !img.src.includes('user-default-pictures')) {
      if (!img.closest('nav, header, .top-nav, #root-nav, [data-a-target="user-menu-toggle"]')) {
        return img.src;
      }
    }
  }

  // 4. OpenGraph 備用
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg && ogImg.content) {
    return ogImg.content;
  }

  // 5. Video poster
  if (video && video.poster) {
    return video.poster;
  }

  return '';
}

/**
 * 擷取 Live 開台已持續時間 (Uptime)
 * 徹底解決「直播時間不一樣」的關鍵修復：
 * - 依據 GQL 官方 createdAt 精準依秒推進
 * - 或依據 DOM .live-time 提取並自動校正錨點時間戳
 * - 絕對不回傳本機緩衝區 video.currentTime
 * @param {HTMLVideoElement|null} video
 * @returns {string} 純時間字串 (例如 "3:16:06" 或 "LIVE")
 */
function extractLiveUptime(video) {
  // 1. 若已有開台起始時間戳 (來自 GQL 或 DOM 校正)，直接以精準時間差平滑計算
  if (_twitchCache.streamStartedAt > 0) {
    const sec = Math.max(0, Math.floor((Date.now() - _twitchCache.streamStartedAt) / 1000));
    return _twitchFormatTime(sec);
  }

  // 2. DOM 開台時長讀取（當滑鼠移入播放器或控制列存在時）
  const liveTimeEl = document.querySelector(
    '.live-time, [data-a-target="player-live-time"], span.live-time, [data-test-selector="stream-uptime"]'
  );
  if (liveTimeEl) {
    const text = liveTimeEl.textContent.trim();
    const matches = text.match(/\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2}/g);
    if (matches && matches.length > 0) {
      const timeStr = matches[matches.length - 1];
      // 自動校正錨點 streamStartedAt，即使之後滑鼠移開控制列消失，計時依然精確延續
      const parts = timeStr.split(':').map(Number);
      let sec = 0;
      if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) sec = parts[0] * 60 + parts[1];
      if (sec > 0) {
        _twitchCache.streamStartedAt = Date.now() - (sec * 1000);
      }
      return timeStr;
    }
  }

  return 'LIVE';
}

/**
 * 核心：自包含的 Twitch 資訊擷取函數
 * @param {Object} [options] 擴充選項
 * @param {boolean} [options.combineTitle=false] 是否將「實況主 - 標題」組合輸出為 title
 * @returns {Object} 符合標準格式的統一資料封包
 */
function extractTwitchInfo(options = {}) {
  try {
    const video = document.querySelector('video');

    // ── 1. 核心判斷：直播實況 vs 記錄檔 ──────────────────────────
    const detection = detectTwitchStreamType(video);
    const isLive = detection.isLive;
    const platform = detection.platform; // 'twitch-live' | 'twitch-vod'

    // ── 2. 目標識別與 GQL 背景同步 ───────────────────────────────
    const pathname = window.location.pathname;
    const pathSegments = pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0] || '';

    if (!isLive && firstSegment.toLowerCase() === 'videos' && pathSegments[1]) {
      // VOD 目標 ID
      _syncTwitchData(pathSegments[1], true);
    } else if (firstSegment && !TWITCH_RESERVED_ROUTES.has(firstSegment.toLowerCase())) {
      // 直播頻道目標
      _syncTwitchData(firstSegment.toLowerCase(), false);
    }

    // ── 3. 實況主、標題、分類與觀看數 ────────────────────────────
    const streamer = extractStreamerName(isLive);
    const rawTitle = extractTitle(isLive);
    const category = extractCategory();
    const viewers  = isLive ? extractViewers() : '';

    let displayTitle = rawTitle;
    if (!displayTitle && streamer) {
      displayTitle = isLive ? `${streamer} 的直播` : `${streamer} 的錄影`;
    }
    if (options.combineTitle && streamer && rawTitle && !rawTitle.toLowerCase().includes(streamer.toLowerCase())) {
      displayTitle = `${streamer} - ${rawTitle}`;
    }

    // ── 4. 時間與長度 (核心差異化處理) ───────────────────────────
    let currentTime = '0:00';
    let duration    = '0:00';

    if (isLive) {
      // 直播中的實況：精準開台時長
      currentTime = extractLiveUptime(video);
      duration    = 'LIVE';
    } else {
      // 記錄檔 (VOD)：讀取播放進度
      if (video && isFinite(video.currentTime)) {
        currentTime = _twitchFormatTime(video.currentTime);
      }
      if (video && isFinite(video.duration) && video.duration > 0) {
        duration = _twitchFormatTime(video.duration);
      } else if (_twitchCache.data?.lengthSeconds) {
        duration = _twitchFormatTime(_twitchCache.data.lengthSeconds);
      }
    }

    // ── 5. 播放狀態 ──────────────────────────────────────────────
    let videoStatus = 'unknown';
    let isPaused = false;

    if (video) {
      if (video.paused) {
        videoStatus = 'paused';
        isPaused = true;
      } else if (video.ended) {
        videoStatus = 'ended';
      } else {
        videoStatus = 'playing';
      }
    } else if (isLive && detection.type === 'live') {
      videoStatus = 'playing';
    }

    // ── 6. 縮圖 / 頭貼 (GQL + DOM 雙引擎) ────────────────────────
    const thumbnail = extractThumbnail(video, isLive);

    // ── 7. 輸出標準化 Payload ────────────────────────────────────
    return {
      title:       displayTitle || (isLive ? '等待 Twitch 直播...' : '等待 Twitch 影片...'),
      thumbnail:   thumbnail || '',
      currentTime: currentTime,
      duration:    duration,
      videoStatus: videoStatus,
      timestamp:   Date.now(),

      platform:    platform,
      isLive:      isLive,
      streamer:    streamer,
      channel:     streamer,
      streamTitle: rawTitle,
      category:    category,
      game:        category,
      viewers:     viewers,
      liveStatus:  isLive ? (isPaused ? 'paused' : 'live') : (isPaused ? 'paused' : 'playing'),
      url:         window.location.href
    };
  } catch (err) {
    console.warn('[twitch-adapter] 擷取過程異常:', err);
    return null;
  }
}

/**
 * 監聽 <video> 原生時間更新事件並掛載回調
 * @param {HTMLVideoElement} video
 * @param {Function} onUpdateCallback
 */
function hookTwitchVideoEvents(video, onUpdateCallback) {
  if (!video || video._twitchOverlayHooked) return;
  video._twitchOverlayHooked = true;

  let lastSentTime = 0;

  const onUpdate = () => {
    const now = Date.now();
    if (now - lastSentTime < 250) return;
    lastSentTime = now;

    const info = extractTwitchInfo();
    if (info && typeof onUpdateCallback === 'function') {
      onUpdateCallback(info);
    }
  };

  video.addEventListener('timeupdate', onUpdate);
  video.addEventListener('play', onUpdate);
  video.addEventListener('pause', onUpdate);
  video.addEventListener('seeked', onUpdate);
  video.addEventListener('durationchange', onUpdate);

  console.log('[twitch-adapter] 已掛載 Twitch 原生 <video> 事件監聽器');
}

// 支援模組與全域導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractTwitchInfo,
    detectTwitchStreamType,
    hookTwitchVideoEvents,
    formatTime: _twitchFormatTime
  };
}

if (typeof window !== 'undefined') {
  window.extractTwitchInfo = extractTwitchInfo;
  window.detectTwitchStreamType = detectTwitchStreamType;
  window.hookTwitchVideoEvents = hookTwitchVideoEvents;
}
