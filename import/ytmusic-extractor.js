/**
 * ytmusic-extractor.js — YouTube Music (music.youtube.com) 播放資訊擷取配接器
 *
 * 功能特色：
 * 1. 深度 DOM 擷取：支援 ytmusic-player-bar、title、byline、subtitle、thumbnail 各層級選擇器
 * 2. 雙重保障：DOM 優先 + navigator.mediaSession.metadata 備用方案
 * 3. 高畫質封面：自動升級 Google CDN (=w544-h544-l90-rj) 與 YouTube CDN (maxresdefault.jpg)
 * 4. 背景不凍結：優先讀取 <video> 原生 currentTime，背景分頁秒數精確推送
 * 5. 完整事件掛載：提供 hookYTMusicVideoEvents 與 initYTMusicWatcher
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.YTMusicExtractor = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  // 1. 輔助函數 (Helper & Formatting Functions)
  // ══════════════════════════════════════════════════════════════

  /**
   * 格式化秒數為時鐘字串 (例如 "3:24" 或 "1:05:32")
   * @param {number} sec 秒數
   * @returns {string} 格式化字串
   */
  function formatTime(sec) {
    if (sec === undefined || sec === null || isNaN(sec) || !isFinite(sec) || sec < 0) {
      return '0:00';
    }
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /**
   * 解析時鐘字串為秒數 (例如 "3:24" -> 204)
   * @param {string} timeStr 時鐘字串
   * @returns {number} 總秒數
   */
  function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.trim().split(':').map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return 0;
  }

  /**
   * 清理多餘空白與換行字元
   * @param {string} str 待處理字串
   * @returns {string} 清理後的字串
   */
  function cleanText(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\s+/g, ' ').trim();
  }

  /**
   * 升級縮圖解析度為高畫質 (支援 Google CDN 與 YouTube CDN)
   * @param {string} url 原始圖片 URL
   * @param {number} [targetDimension=544] 目標尺寸
   * @returns {string} 升級後 URL
   */
  function upgradeThumbnailUrl(url, targetDimension = 544) {
    if (!url || typeof url !== 'string') return '';
    // 過濾 1x1 透明 gif 或空占位圖
    if (url.startsWith('data:image/gif') || url.startsWith('data:image/svg')) return '';

    // 1. Google User Content CDN (lh3.googleusercontent.com, yt3.ggpht.com)
    // 預設常見為 =w60-h60-l90-rj 或 =s60，升級為 544x544 或更高
    if (/googleusercontent\.com|ggpht\.com/i.test(url)) {
      if (/=w\d+-h\d+[^"]*/.test(url)) {
        return url.replace(/=w\d+-h\d+[^"]*/, `=w${targetDimension}-h${targetDimension}-l90-rj`);
      }
      if (/=s\d+[^"]*/.test(url)) {
        return url.replace(/=s\d+[^"]*/, `=s${Math.max(targetDimension, 800)}`);
      }
    }

    // 2. YouTube 標準影片縮圖 (i.ytimg.com)
    // 將 4:3 帶黑邊的 hqdefault / mqdefault / sddefault 替換為乾淨 16:9 maxresdefault
    if (/ytimg\.com\/vi\/[^\/]+/i.test(url)) {
      return url.replace(/\/(?:hq|mq|sd|default)default\.jpg/i, '/maxresdefault.jpg');
    }

    return url;
  }

  /**
   * 判定當前頁面是否為 YouTube Music
   * @returns {boolean}
   */
  function isYTMusicPage() {
    if (typeof window === 'undefined') return false;
    const isHost = (window.location && window.location.hostname === 'music.youtube.com');
    const hasPlayerBar = Boolean(document.querySelector('ytmusic-player-bar, ytmusic-app'));
    return isHost || hasPlayerBar;
  }

  // ══════════════════════════════════════════════════════════════
  // 2. 核心擷取函數 (extractYTMusicInfo)
  // ══════════════════════════════════════════════════════════════

  /**
   * 擷取 YouTube Music 當前播放資訊
   * @returns {{
   *   platform: 'ytmusic',
   *   title: string,
   *   artist: string,
   *   thumbnail: string,
   *   currentTime: string,
   *   duration: string,
   *   videoStatus: 'playing' | 'paused' | 'ended' | 'unknown',
   *   isLive: boolean,
   *   timestamp: number
   * }}
   */
  function extractYTMusicInfo() {
    try {
      const video = document.querySelector('video');

      // ── 1. 播放進度 (優先讀取 <video> 原生時鐘) ──
      let currentTime = '0:00';
      let duration    = '0:00';
      let isLive      = false;

      if (video && !isNaN(video.duration) && video.duration > 0) {
        if (!isFinite(video.duration)) {
          isLive = true;
          currentTime = formatTime(video.currentTime);
          duration = 'LIVE';
        } else {
          currentTime = formatTime(video.currentTime);
          duration = formatTime(video.duration);
        }
      } else {
        // DOM 備援：ytmusic-player-bar .time-info ("1:23 / 3:45")
        const timeInfoEl = document.querySelector(
          'ytmusic-player-bar .time-info, .time-info.ytmusic-player-bar, .time-info'
        );
        if (timeInfoEl) {
          const text = (timeInfoEl.innerText || timeInfoEl.textContent || '').trim();
          if (/live|直播/i.test(text)) {
            isLive = true;
            duration = 'LIVE';
          }
          if (text.includes('/')) {
            const parts = text.split('/');
            currentTime = cleanText(parts[0]);
            if (!isLive) duration = cleanText(parts[1]);
          }
        }
      }

      // ── 2. 播放狀態 (playing | paused | ended | unknown) ──
      let videoStatus = 'unknown';
      if (video) {
        if (video.ended) {
          videoStatus = 'ended';
        } else if (video.paused) {
          videoStatus = 'paused';
        } else {
          videoStatus = 'playing';
        }
      } else {
        // DOM 備援：檢查 #play-pause-button 的 aria-label / title
        const playPauseBtn = document.querySelector(
          'ytmusic-player-bar #play-pause-button, #play-pause-button'
        );
        if (playPauseBtn) {
          const label = (
            playPauseBtn.getAttribute('aria-label') ||
            playPauseBtn.getAttribute('title') ||
            ''
          ).toLowerCase();
          if (/pause|暫停|暂停/.test(label)) {
            videoStatus = 'playing';
          } else if (/play|播放/.test(label)) {
            videoStatus = 'paused';
          }
        }
        // navigator.mediaSession.playbackState 備援
        if (videoStatus === 'unknown' && typeof navigator !== 'undefined' && navigator.mediaSession) {
          const ps = navigator.mediaSession.playbackState;
          if (ps === 'playing' || ps === 'paused') {
            videoStatus = ps;
          }
        }
      }

      // ── 3. 歌曲標題 (Title) ──
      let title = '';
      const titleSelectors = [
        'ytmusic-player-bar yt-formatted-string.title.ytmusic-player-bar',
        'ytmusic-player-bar .middle-controls .title',
        'ytmusic-player-bar .title',
        'yt-formatted-string.title.ytmusic-player-bar',
        '.middle-controls .title'
      ];
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          // getAttribute('title') 經常保留未被 UI 省略符號裁切的完整文字
          const text = el.getAttribute('title') || el.innerText || el.textContent || '';
          const cleaned = cleanText(text);
          if (cleaned) {
            title = cleaned;
            break;
          }
        }
      }
      // 備援 A: navigator.mediaSession.metadata.title
      if (!title && typeof navigator !== 'undefined' && navigator.mediaSession?.metadata?.title) {
        title = cleanText(navigator.mediaSession.metadata.title);
      }
      // 備援 B: document.title (去除後綴 " - YouTube Music" 或 " • YouTube Music")
      if (!title && typeof document !== 'undefined' && document.title) {
        title = cleanText(document.title.replace(/(?:\s*[-•]\s*YouTube Music)$/i, ''));
      }

      // ── 4. 歌手資訊 (Artist / Byline) ──
      let artist = '';
      // 備援 A (最純淨)：navigator.mediaSession.metadata.artist (由 YTM 官方填入純歌手名，不含專輯與年份)
      if (typeof navigator !== 'undefined' && navigator.mediaSession?.metadata?.artist) {
        artist = cleanText(navigator.mediaSession.metadata.artist);
      }

      // 備援 B：從 DOM .byline.ytmusic-player-bar 擷取
      if (!artist) {
        const bylineSelectors = [
          'ytmusic-player-bar .byline.ytmusic-player-bar',
          'ytmusic-player-bar span.subtitle.ytmusic-player-bar',
          'ytmusic-player-bar yt-formatted-string.byline',
          '.byline.ytmusic-player-bar',
          'span.subtitle.ytmusic-player-bar'
        ];
        for (const sel of bylineSelectors) {
          const bylineEl = document.querySelector(sel);
          if (bylineEl) {
            // 先尋找明確的歌手連結 (例如 a[href*="channel/"], a[href*="browse/UC"])
            const artistLinks = bylineEl.querySelectorAll('a[href*="channel/"], a[href*="browse/UC"]');
            if (artistLinks.length > 0) {
              artist = Array.from(artistLinks)
                .map(a => cleanText(a.innerText || a.textContent || ''))
                .filter(Boolean)
                .join(', ');
              if (artist) break;
            }
            // 若無連結則依據隔開符號 (•, \u2022, ·, /) 切割第一段
            const rawByline = bylineEl.getAttribute('title') || bylineEl.innerText || bylineEl.textContent || '';
            if (rawByline) {
              const parts = rawByline.split(/\s*[•·\u2022\u00B7/]\s*/);
              if (parts.length > 0 && cleanText(parts[0])) {
                artist = cleanText(parts[0]);
                break;
              }
            }
          }
        }
      }

      // ── 5. 專輯 / 歌曲縮圖 (Thumbnail) ──
      let thumbnail = '';
      // 備援 A: navigator.mediaSession.metadata.artwork (陣列最後一筆通常為最高解析度 544x544)
      if (
        typeof navigator !== 'undefined' &&
        navigator.mediaSession?.metadata?.artwork &&
        Array.isArray(navigator.mediaSession.metadata.artwork)
      ) {
        const art = navigator.mediaSession.metadata.artwork;
        if (art.length > 0) {
          const best = art[art.length - 1];
          if (best && best.src) {
            thumbnail = upgradeThumbnailUrl(best.src);
          }
        }
      }

      // 備援 B: DOM 播放條縮圖 (img.image.ytmusic-player-bar, #thumbnail img 等)
      if (!thumbnail) {
        const thumbSelectors = [
          'ytmusic-player-bar img.image.ytmusic-player-bar',
          'ytmusic-player-bar #thumbnail img',
          'ytmusic-player-bar img#img',
          'ytmusic-player-bar .thumbnail-image-wrapper img',
          'img.image.ytmusic-player-bar',
          '#thumbnail img'
        ];
        for (const sel of thumbSelectors) {
          const img = document.querySelector(sel);
          if (img) {
            const src = img.getAttribute('src') || img.src || '';
            if (src && !src.startsWith('data:image/gif') && !src.startsWith('data:image/svg')) {
              thumbnail = upgradeThumbnailUrl(src);
              break;
            }
          }
        }
      }

      // 備援 C: 網址 ?v= query 參數產生 16:9 封面
      if (!thumbnail && typeof window !== 'undefined' && window.location) {
        try {
          const vId = new URLSearchParams(window.location.search).get('v');
          if (vId) {
            thumbnail = `https://i.ytimg.com/vi/${vId}/maxresdefault.jpg`;
          }
        } catch (_) {}
      }

      // 備援 D: meta[property="og:image"]
      if (!thumbnail) {
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg) {
          thumbnail = ogImg.getAttribute('content') || '';
        }
      }

      return {
        platform: 'ytmusic',
        title: title || '等待 YouTube Music 播放...',
        artist: artist || '',
        thumbnail: thumbnail || '',
        currentTime: currentTime || '0:00',
        duration: duration || '0:00',
        videoStatus: videoStatus,
        isLive: Boolean(isLive),
        url: window.location.href,
        timestamp: Date.now()
      };
    } catch (err) {
      console.warn('[ytmusic-extractor] 擷取過程警告:', err);
      return {
        platform: 'ytmusic',
        title: '等待 YouTube Music 播放...',
        artist: '',
        thumbnail: '',
        currentTime: '0:00',
        duration: '0:00',
        videoStatus: 'unknown',
        isLive: false,
        timestamp: Date.now()
      };
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 3. 事件監聽掛載 (hookYTMusicVideoEvents)
  // ══════════════════════════════════════════════════════════════

  /**
   * 掛載原生 <video> 事件監聽器 (包含 250ms 節流與定時推送)
   * @param {HTMLVideoElement} video 目標 video 標籤
   * @param {(info: object) => void} onUpdateCallback 狀態更新回呼
   * @param {{ throttleMs?: number }} [options] 自訂選項
   * @returns {(() => void) | null} 卸載回呼函數
   */
  function hookYTMusicVideoEvents(video, onUpdateCallback, options = {}) {
    if (!video) return null;

    const throttleMs = options.throttleMs ?? 250;
    const hookKey = '_ytmOverlayHooked';

    // 防止重複掛載同一個 video 實體
    if (video[hookKey]) {
      return video._ytmUnhook || null;
    }
    video[hookKey] = true;

    let lastSentTime = 0;
    let throttleTimer = null;

    const handleUpdate = () => {
      const now = Date.now();
      const elapsed = now - lastSentTime;

      if (elapsed >= throttleMs) {
        lastSentTime = now;
        if (throttleTimer) {
          clearTimeout(throttleTimer);
          throttleTimer = null;
        }
        const data = extractYTMusicInfo();
        if (typeof onUpdateCallback === 'function') {
          onUpdateCallback(data);
        }
      } else if (!throttleTimer) {
        // 延遲執行補齊節流視窗
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
          lastSentTime = Date.now();
          const data = extractYTMusicInfo();
          if (typeof onUpdateCallback === 'function') {
            onUpdateCallback(data);
          }
        }, throttleMs - elapsed);
      }
    };

    // 涵蓋原生時鐘推進、播放、暫停、結束、快轉倒帶、長度變更
    const events = ['timeupdate', 'play', 'pause', 'ended', 'seeked', 'durationchange'];
    events.forEach(evt => video.addEventListener(evt, handleUpdate));

    const unhook = () => {
      events.forEach(evt => video.removeEventListener(evt, handleUpdate));
      if (throttleTimer) clearTimeout(throttleTimer);
      video[hookKey] = false;
      delete video._ytmUnhook;
    };

    video._ytmUnhook = unhook;
    console.log('[ytmusic-extractor] 已成功掛載原生 <video> 監聽器');
    return unhook;
  }

  // ══════════════════════════════════════════════════════════════
  // 4. 自動巡檢與 SPA 換曲監聽 (initYTMusicWatcher)
  // ══════════════════════════════════════════════════════════════

  /**
   * 初始化自動巡檢器：處理 YouTube Music SPA 切換切曲與 video 換新
   * @param {(info: object) => void} onUpdateCallback 狀態更新回呼
   * @param {{ checkIntervalMs?: number }} [options]
   * @returns {() => void} 停止監聽與巡檢的銷毀函數
   */
  function initYTMusicWatcher(onUpdateCallback, options = {}) {
    const intervalMs = options.checkIntervalMs ?? 500;
    let currentVideo = null;
    let unhookFn = null;

    const checkAndHook = () => {
      const v = document.querySelector('video');
      if (v && v !== currentVideo) {
        if (unhookFn) unhookFn();
        currentVideo = v;
        unhookFn = hookYTMusicVideoEvents(v, onUpdateCallback);
      }
      const data = extractYTMusicInfo();
      if (typeof onUpdateCallback === 'function') {
        onUpdateCallback(data);
      }
    };

    // 立即執行一次
    checkAndHook();

    // 定期輪詢
    const intervalId = setInterval(checkAndHook, intervalMs);

    // YouTube 專屬 SPA 切頁自訂事件
    const onNavigate = () => setTimeout(checkAndHook, 300);
    document.addEventListener('yt-navigate-finish', onNavigate);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('yt-navigate-finish', onNavigate);
      if (unhookFn) unhookFn();
    };
  }

  return {
    extractYTMusicInfo,
    hookYTMusicVideoEvents,
    initYTMusicWatcher,
    isYTMusicPage,
    formatTime,
    parseTime,
    cleanText,
    upgradeThumbnailUrl
  };
});
