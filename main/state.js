/**
 * state.js v3.0 — 多媒體串流狀態管理核心
 *
 * 支援平台：
 * - YouTube
 * - YouTube Music
 * - Spotify Web Player
 * - SoundCloud
 * - Twitch (直播實況與記錄檔)
 */
'use strict';

let mediaInfo = {
  platform:    'youtube',
  title:       '等待媒體資訊...',
  artist:      '',
  thumbnail:   '',
  currentTime: '00:00',
  duration:    '00:00',
  videoStatus: 'unknown',  // 'playing' | 'paused' | 'ended' | 'unknown'
  isLive:      false,
  url:         '',
  extra:       {},
  tabId:       null
};

/** 取得狀態快照 */
function getState() {
  return {
    mediaInfo:   { ...mediaInfo },
    youtubeInfo: { ...mediaInfo } // 向下相容既有客戶端
  };
}

/** 合併更新多媒體播放資訊 */
function setMediaInfo(data) {
  if (data.tabId !== undefined && mediaInfo.tabId !== data.tabId) {
    console.log(`[state] 切換投影分頁: ${mediaInfo.tabId ?? '無'} → ${data.tabId} (${data.platform || 'media'})`);
  }
  mediaInfo = {
    tabId:       data.tabId       ?? mediaInfo.tabId,
    platform:    data.platform    || mediaInfo.platform,
    title:       data.title       || mediaInfo.title,
    artist:      data.artist      ?? mediaInfo.artist,
    thumbnail:   data.thumbnail   ?? mediaInfo.thumbnail,
    currentTime: data.currentTime || mediaInfo.currentTime,
    duration:    data.duration    || mediaInfo.duration,
    videoStatus: data.videoStatus || mediaInfo.videoStatus,
    isLive:      data.isLive !== undefined ? Boolean(data.isLive) : mediaInfo.isLive,
    url:         data.url         || mediaInfo.url || '',
    extra:       data.extra       || mediaInfo.extra || {}
  };
}

// 向下相容舊版呼叫
const setYouTubeInfo = setMediaInfo;

module.exports = { getState, setMediaInfo, setYouTubeInfo };
