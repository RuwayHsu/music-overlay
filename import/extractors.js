/**
 * extractors.js — Web Media Extractor Adapters
 * Supported Platforms: Spotify Web Player (open.spotify.com) & SoundCloud (soundcloud.com)
 *
 * Uniform Payload Format:
 * {
 *   platform: 'spotify' | 'soundcloud',
 *   title: string,
 *   artist: string,
 *   thumbnail: string,
 *   currentTime: string,
 *   duration: string,
 *   videoStatus: 'playing' | 'paused' | 'ended' | 'unknown',
 *   isLive: false,
 *   timestamp: number
 * }
 */

// ── Shared Utilities ──────────────────────────────────────────────────────────

/**
 * Format raw seconds into "M:SS" or "H:MM:SS" string.
 * @param {number} sec
 * @returns {string}
 */
function formatTime(sec) {
  if (sec === undefined || sec === null || isNaN(sec) || sec < 0) return '0:00';
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
 * Upgrade Spotify album artwork URL to high-resolution 640x640.
 * Spotify hashes:
 * - ab67616d00004851: 64x64
 * - ab67616d00001e02: 300x300
 * - ab67616d0000b273: 640x640 (High-Res)
 * @param {string} url
 * @returns {string}
 */
function upgradeSpotifyThumbnail(url) {
  if (!url || typeof url !== 'string') return '';
  return url
    .replace('ab67616d00004851', 'ab67616d0000b273')
    .replace('ab67616d00001e02', 'ab67616d0000b273');
}

/**
 * Upgrade SoundCloud artwork URL to high-resolution 500x500.
 * Replaces all SoundCloud size suffixes:
 * - -large, -t50x50, -t67x67, -t120x120, -t200x200, -t240x240, -t300x300, -crop, -badge, -small, -tiny, -mini
 * -> -t500x500 (High-Definition 500x500)
 * @param {string} url
 * @returns {string}
 */
function upgradeSoundCloudThumbnail(url) {
  if (!url || typeof url !== 'string') return '';
  
  let cleanUrl = url.replace(/^['"]|['"]$/g, '').trim();
  cleanUrl = cleanUrl.replace(/&quot;/g, '').replace(/\\"/g, '');

  if (cleanUrl.includes('-t500x500') || cleanUrl.includes('-original')) {
    return cleanUrl;
  }

  const scRegex = /-(?:t\d+x\d+|large|small|mini|tiny|badge|crop)(?=\.[a-z0-9]+(?:\?.*)?$)/i;
  if (scRegex.test(cleanUrl)) {
    return cleanUrl.replace(scRegex, '-t500x500');
  }

  return cleanUrl.replace(/-(?:t\d+x\d+|large|small|mini|tiny|badge|crop)\b/i, '-t500x500');
}

/**
 * Extract background image URL from inline CSS style string.
 * @param {HTMLElement} el
 * @returns {string}
 */
function extractBackgroundImageUrl(el) {
  if (!el) return '';
  const style = el.style?.backgroundImage || (typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(el).backgroundImage : '');
  if (!style || style === 'none') return '';
  let raw = style.replace(/^url\(/i, '').replace(/\)$/i, '').trim();
  raw = raw.replace(/^["']|["']$/g, '').trim();
  raw = raw.replace(/&quot;/g, '').replace(/\\"/g, '');
  return raw;
}

/**
 * Get the active MediaSession metadata if available.
 * @returns {{title: string, artist: string, album: string, artwork: string} | null}
 */
function getMediaSessionMetadata() {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.metadata) {
    return null;
  }
  const meta = navigator.mediaSession.metadata;
  let bestArtwork = '';
  if (meta.artwork && meta.artwork.length > 0) {
    const sorted = [...meta.artwork].sort((a, b) => {
      const getScore = (item) => {
        if (!item) return 0;
        let score = 0;
        if (item.sizes) {
          const match = String(item.sizes).match(/(\d+)x(\d+)/i);
          if (match) score = parseInt(match[1], 10) * parseInt(match[2], 10);
        }
        const src = (item.src || '').toLowerCase();
        if (src.includes('500x500') || src.includes('original') || src.includes('b273')) score += 250000;
        if (src.includes('large') || src.includes('300x300') || src.includes('1e02')) score += 90000;
        if (src.includes('50x50') || src.includes('mini') || src.includes('tiny')) score -= 10000;
        return score;
      };
      return getScore(b) - getScore(a);
    });
    bestArtwork = sorted[0].src || '';
  }
  return {
    title: meta.title || '',
    artist: meta.artist || '',
    album: meta.album || '',
    artwork: bestArtwork
  };
}

// ── 1. Spotify Web Player Extractor ───────────────────────────────────────────

/**
 * Extracts currently playing track metadata from Spotify Web Player (open.spotify.com).
 * Zero configuration required (no Spotify Client ID or OAuth tokens).
 *
 * @returns {{
 *   platform: 'spotify',
 *   title: string,
 *   artist: string,
 *   thumbnail: string,
 *   currentTime: string,
 *   duration: string,
 *   videoStatus: 'playing' | 'paused' | 'ended' | 'unknown',
 *   isLive: false,
 *   timestamp: number
 * }}
 */
function extractSpotifyInfo() {
  const sessionMeta = getMediaSessionMetadata();
  const mediaEl = document.querySelector('audio, video');

  // 1. Track Title
  let title = '';
  const titleEl = document.querySelector(
    '[data-testid="context-item-info-title"] a, ' +
    '[data-testid="context-item-info-title"], ' +
    '[data-testid="context-item-link"], ' +
    'a[data-testid="nowplaying-track-link"]'
  );
  if (titleEl) {
    title = (titleEl.innerText || titleEl.textContent || '').trim();
  }
  if (!title && sessionMeta && sessionMeta.title) {
    title = sessionMeta.title.trim();
  }
  if (!title && document.title && document.title.includes(' • ')) {
    // Spotify web title format: "Song Title • Artist | Spotify"
    const parts = document.title.replace(/\s*\|\s*Spotify$/, '').split(' • ');
    if (parts[0]) title = parts[0].trim();
  }

  // 2. Artist Name
  let artist = '';
  const artistEls = document.querySelectorAll(
    '[data-testid="context-item-info-subtitles"] a, ' +
    '[data-testid="context-item-info-artist"] a'
  );
  if (artistEls.length > 0) {
    artist = Array.from(artistEls)
      .map(el => (el.innerText || el.textContent || '').trim())
      .filter(Boolean)
      .join(', ');
  } else {
    const singleArtistEl = document.querySelector(
      '[data-testid="context-item-info-subtitles"], ' +
      '[data-testid="context-item-info-artist"]'
    );
    if (singleArtistEl) {
      artist = (singleArtistEl.innerText || singleArtistEl.textContent || '').trim();
    }
  }
  if (!artist && sessionMeta && sessionMeta.artist) {
    artist = sessionMeta.artist.trim();
  }
  if (!artist && document.title && document.title.includes(' • ')) {
    const parts = document.title.replace(/\s*\|\s*Spotify$/, '').split(' • ');
    if (parts[1]) artist = parts[1].trim();
  }

  // 3. Album Art / Thumbnail
  let thumbnail = '';
  const imgEl = document.querySelector(
    '[data-testid="cover-art-image"], ' +
    '[data-testid="now-playing-image"] img, ' +
    'footer img[src*="i.scdn.co"], ' +
    'footer [data-testid="cover-art-button"] img'
  );
  if (imgEl && imgEl.src) {
    thumbnail = imgEl.src;
  } else if (sessionMeta && sessionMeta.artwork) {
    thumbnail = sessionMeta.artwork;
  }
  thumbnail = upgradeSpotifyThumbnail(thumbnail);

  // 4. Current Time & Duration
  let currentTime = '0:00';
  let duration = '0:00';

  const curTimeEl = document.querySelector('[data-testid="playback-position"]');
  const durTimeEl = document.querySelector('[data-testid="playback-duration"]');

  if (curTimeEl && curTimeEl.textContent.trim()) {
    currentTime = curTimeEl.textContent.trim();
  } else if (mediaEl && !isNaN(mediaEl.currentTime) && mediaEl.currentTime > 0) {
    currentTime = formatTime(mediaEl.currentTime);
  }

  if (durTimeEl && durTimeEl.textContent.trim()) {
    duration = durTimeEl.textContent.trim();
  } else if (mediaEl && !isNaN(mediaEl.duration) && mediaEl.duration > 0) {
    duration = formatTime(mediaEl.duration);
  }

  // 5. Play/Pause Playback Status
  let videoStatus = 'unknown';
  const playPauseBtn = document.querySelector('button[data-testid="control-button-playpause"]');
  if (playPauseBtn) {
    const ariaLabel = (playPauseBtn.getAttribute('aria-label') || '').toLowerCase();
    // In English: "Pause" means currently playing; "Play" means currently paused.
    // Multilingual check: contains "pause", "暫停", "暂停"
    if (ariaLabel.includes('pause') || ariaLabel.includes('暫停') || ariaLabel.includes('暂停')) {
      videoStatus = 'playing';
    } else if (ariaLabel.includes('play') || ariaLabel.includes('播放')) {
      videoStatus = 'paused';
    }
  }

  // Fallback to MediaSession / HTMLMediaElement
  if (videoStatus === 'unknown') {
    if (navigator.mediaSession && navigator.mediaSession.playbackState) {
      if (navigator.mediaSession.playbackState === 'playing') videoStatus = 'playing';
      else if (navigator.mediaSession.playbackState === 'paused') videoStatus = 'paused';
    } else if (mediaEl) {
      videoStatus = mediaEl.paused ? 'paused' : (mediaEl.ended ? 'ended' : 'playing');
    }
  }

  // 嘗試提取當前曲目專屬網址
  let trackUrl = '';
  const spotifyTrackLink = document.querySelector(
    '[data-testid="context-item-link"], a[data-testid="nowplaying-track-link"], .now-playing a[href*="/track/"]'
  );
  if (spotifyTrackLink) {
    const rawHref = spotifyTrackLink.getAttribute('href') || spotifyTrackLink.href || '';
    if (rawHref && rawHref.includes('/track/')) {
      try {
        trackUrl = new URL(rawHref, window.location.origin).href;
      } catch (_) {
        trackUrl = spotifyTrackLink.href || '';
      }
    }
  }
  if (!trackUrl) {
    trackUrl = window.location.href;
  }

  return {
    platform: 'spotify',
    title: title || 'Spotify 播放中...',
    artist: artist || '',
    thumbnail: thumbnail || '',
    currentTime: currentTime || '0:00',
    duration: duration || '0:00',
    videoStatus: videoStatus,
    isLive: false,
    url: trackUrl,
    timestamp: Date.now()
  };
}

// ── 2. SoundCloud Extractor ───────────────────────────────────────────────────

/**
 * Extracts currently playing track metadata from SoundCloud (soundcloud.com).
 * Reads bottom player controls (.playControls), native <audio>, and mediaSession.
 *
 * @returns {{
 *   platform: 'soundcloud',
 *   title: string,
 *   artist: string,
 *   thumbnail: string,
 *   currentTime: string,
 *   duration: string,
 *   videoStatus: 'playing' | 'paused' | 'ended' | 'unknown',
 *   isLive: false,
 *   timestamp: number
 * }}
 */
function extractSoundCloudInfo() {
  const sessionMeta = getMediaSessionMetadata();
  const audioEl = document.querySelector('audio');

  // 1. Track Title
  let title = '';
  const titleLinkEl = document.querySelector(
    '.playbackSoundBadge__titleLink, ' +
    '.playbackSoundBadge__title a, ' +
    'a.playbackSoundBadge__title'
  );
  if (titleLinkEl) {
    title = (
      titleLinkEl.getAttribute('title') ||
      titleLinkEl.innerText ||
      titleLinkEl.textContent ||
      ''
    ).trim();
  }
  // Strip SoundCloud's assistive prefix if present: "Current track: "
  title = title.replace(/^Current track:\s*/i, '');

  if (!title && sessionMeta && sessionMeta.title) {
    title = sessionMeta.title.trim();
  }

  // 2. Artist Name
  let artist = '';
  const artistLinkEl = document.querySelector(
    '.playbackSoundBadge__lightLink, ' +
    '.playbackSoundBadge__titleContextContainer a'
  );
  if (artistLinkEl) {
    artist = (
      artistLinkEl.getAttribute('title') ||
      artistLinkEl.innerText ||
      artistLinkEl.textContent ||
      ''
    ).trim();
  }
  if (!artist && sessionMeta && sessionMeta.artist) {
    artist = sessionMeta.artist.trim();
  }

  // 3. Artwork / Thumbnail (多層級高清提取策略)
  let thumbnail = '';

  // 3.1 優先從主播放頁面中大尺寸的 Hero / Artwork 容器提取（原生通常即為 500x500 高清圖）
  const heroArt = document.querySelector(
    '.fullListenHero__artwork span.sc-artwork, ' +
    '.listenArtworkWrapper span.sc-artwork, ' +
    '.soundTitle__artwork span.sc-artwork, ' +
    '.sound__artworkContainer span.sc-artwork'
  );
  if (heroArt) {
    thumbnail = extractBackgroundImageUrl(heroArt);
  }

  // 3.2 次選底部播放列縮圖（.playbackSoundBadge__avatar）
  if (!thumbnail) {
    const avatarEl = document.querySelector(
      '.playbackSoundBadge__avatar [style*="background-image"], ' +
      '.playbackSoundBadge__avatar .image__full, ' +
      '.playbackSoundBadge__avatar span.sc-artwork, ' +
      '.playbackSoundBadge__avatar img'
    );
    if (avatarEl) {
      if (avatarEl.tagName === 'IMG' && avatarEl.src) {
        thumbnail = avatarEl.src;
      } else {
        thumbnail = extractBackgroundImageUrl(avatarEl);
      }
    }
  }

  // 3.3 嘗試頁面 meta 標籤（og:image 在 SoundCloud 上固定為官方 500x500 圖片）
  if (!thumbnail) {
    const metaImg = document.querySelector('meta[property="og:image"], meta[name="twitter:image:src"], link[rel="image_src"]');
    if (metaImg) {
      thumbnail = metaImg.getAttribute('content') || metaImg.getAttribute('href') || '';
    }
  }

  // 3.4 MediaSession fallback
  if (!thumbnail && sessionMeta && sessionMeta.artwork) {
    thumbnail = sessionMeta.artwork;
  }

  // 3.5 全面正則匹配並升級至 500x500 高清解析度（徹底解決 50x50 模糊問題）
  thumbnail = upgradeSoundCloudThumbnail(thumbnail);

  // 4. Current Time & Duration (絕對優先讀取原生 <audio>，徹底避免無障礙輔助字串干擾)
  let currentTime = '0:00';
  let duration = '0:00';

  const cleanClock = (str) => {
    if (!str || typeof str !== 'string') return '';
    const matches = str.match(/\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2}/g);
    if (!matches || matches.length === 0) return '';
    return matches[matches.length - 1];
  };

  if (audioEl && !isNaN(audioEl.duration) && audioEl.duration > 0) {
    currentTime = formatTime(audioEl.currentTime);
    duration = formatTime(audioEl.duration);
  } else {
    const timePassedEl = document.querySelector(
      '.playbackTimeline__timePassed span[aria-hidden="true"], .playbackTimeline__timePassed'
    );
    const durationEl = document.querySelector(
      '.playbackTimeline__duration span[aria-hidden="true"], .playbackTimeline__duration'
    );

    const parsedCur = cleanClock(timePassedEl ? timePassedEl.textContent : '');
    const parsedDur = cleanClock(durationEl ? durationEl.textContent : '');

    if (parsedCur) {
      currentTime = parsedCur;
    } else if (audioEl && isFinite(audioEl.currentTime)) {
      currentTime = formatTime(audioEl.currentTime);
    }

    if (parsedDur) {
      duration = parsedDur;
    } else if (audioEl && isFinite(audioEl.duration) && audioEl.duration > 0) {
      duration = formatTime(audioEl.duration);
    }
  }

  // 5. Play/Pause Status
  let videoStatus = 'unknown';
  const playBtn = document.querySelector('button.playControl, button.playControls__play');
  if (playBtn) {
    // When playing in SoundCloud, the button contains class 'playing'
    if (playBtn.classList.contains('playing')) {
      videoStatus = 'playing';
    } else {
      videoStatus = 'paused';
    }
  }

  // Fallback to MediaSession / HTMLAudioElement
  if (videoStatus === 'unknown') {
    if (navigator.mediaSession && navigator.mediaSession.playbackState) {
      if (navigator.mediaSession.playbackState === 'playing') videoStatus = 'playing';
      else if (navigator.mediaSession.playbackState === 'paused') videoStatus = 'paused';
    } else if (audioEl) {
      videoStatus = audioEl.paused ? 'paused' : (audioEl.ended ? 'ended' : 'playing');
    }
  }

  // 提取 SoundCloud 當前播放曲目之專屬網址
  // 優先抓取底欄播放指示器 playbackSoundBadge__titleLink 的 href（例如 /artist/track-name）
  // 徹底避免停留在 discover / stream 等主頁時抓成個人帳戶分頁網址
  let trackUrl = '';
  if (titleLinkEl) {
    const rawHref = titleLinkEl.getAttribute('href') || titleLinkEl.href || '';
    if (rawHref && rawHref !== '#' && !rawHref.startsWith('javascript:')) {
      try {
        trackUrl = new URL(rawHref, window.location.origin).href;
      } catch (_) {
        trackUrl = titleLinkEl.href || '';
      }
    }
  }

  // 次選：底欄縮圖頭像包裹之曲目連結
  if (!trackUrl) {
    const avatarLink = document.querySelector('a.playbackSoundBadge__avatar, .playbackSoundBadge__avatar a');
    if (avatarLink) {
      const rawHref = avatarLink.getAttribute('href') || avatarLink.href || '';
      if (rawHref && rawHref !== '#' && !rawHref.startsWith('javascript:')) {
        try {
          trackUrl = new URL(rawHref, window.location.origin).href;
        } catch (_) {}
      }
    }
  }

  // 若仍未取得，最後降級為當前頁面網址
  if (!trackUrl) {
    trackUrl = window.location.href;
  }

  return {
    platform: 'soundcloud',
    title: title || 'SoundCloud 播放中...',
    artist: artist || '',
    thumbnail: thumbnail || '',
    currentTime: currentTime || '0:00',
    duration: duration || '0:00',
    videoStatus: videoStatus,
    isLive: false,
    url: trackUrl,
    timestamp: Date.now()
  };
}

// ── 3. Universal Media Dispatcher ─────────────────────────────────────────────

/**
 * Automatically detects the current website and invokes the appropriate extractor.
 * @returns {ReturnType<typeof extractSpotifyInfo> | null}
 */
function extractMediaInfo() {
  const host = window.location.hostname;
  if (host.includes('spotify.com')) {
    return extractSpotifyInfo();
  }
  if (host.includes('soundcloud.com')) {
    return extractSoundCloudInfo();
  }
  return null;
}

/**
 * Hooks native HTMLMediaElement (<audio> / <video>) events for accurate background playback tracking.
 * Chrome throttles setInterval in background tabs, but native media timeupdate fires continuously!
 *
 * @param {(data: any) => void} onUpdateCallback
 */
function hookNativeMediaEvents(onUpdateCallback) {
  let lastHooked = null;
  let lastSentTime = 0;

  const attachEvents = (media) => {
    if (!media || media._extractorHooked) return;
    media._extractorHooked = true;

    const handler = () => {
      const now = Date.now();
      if (now - lastSentTime < 250) return; // 250ms throttle
      lastSentTime = now;

      const data = extractMediaInfo();
      if (data && typeof onUpdateCallback === 'function') {
        onUpdateCallback(data);
      }
    };

    media.addEventListener('timeupdate', handler);
    media.addEventListener('play', handler);
    media.addEventListener('pause', handler);
    media.addEventListener('seeked', handler);
    media.addEventListener('ended', handler);
  };

  setInterval(() => {
    const media = document.querySelector('audio, video');
    if (media && media !== lastHooked) {
      lastHooked = media;
      attachEvents(media);
    }
  }, 1000);

  const initialMedia = document.querySelector('audio, video');
  if (initialMedia) {
    lastHooked = initialMedia;
    attachEvents(initialMedia);
  }
}

// Export for ES modules / CommonJS / Browser environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractSpotifyInfo,
    extractSoundCloudInfo,
    extractMediaInfo,
    hookNativeMediaEvents,
    formatTime,
    upgradeSpotifyThumbnail,
    upgradeSoundCloudThumbnail
  };
}

if (typeof window !== 'undefined') {
  window.extractSpotifyInfo = extractSpotifyInfo;
  window.extractSoundCloudInfo = extractSoundCloudInfo;
  window.extractMediaInfo = extractMediaInfo;
  window.hookNativeMediaEvents = hookNativeMediaEvents;
}
