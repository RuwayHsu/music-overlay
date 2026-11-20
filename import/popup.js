/**
 * popup.js — 擴充功能彈窗控制
 */
'use strict';

const SERVER_INFO_URL = 'http://localhost:50120/api/info';

let projectedTabId = null;
let selectedTabId  = null;
let statusTimer    = null;

document.addEventListener('DOMContentLoaded', () => {
  // 取得當前投影狀態
  chrome.runtime.sendMessage({ action: 'getProjectedTab' }, (res) => {
    if (!chrome.runtime.lastError && res) {
      projectedTabId = res.tabId;
    }
    loadTabs();
  });

  document.getElementById('proj-btn').addEventListener('click', toggleProjection);
  document.getElementById('refresh-btn').addEventListener('click', loadTabs);

  // 定時更新伺服器目前收到的資料與連線狀態
  updateServerStatus();
  statusTimer = setInterval(updateServerStatus, 800);
});

// ── 讀取所有 YouTube 分頁 ────────────────────────────────────────────────
function loadTabs() {
  const select = document.getElementById('tab-list');
  select.innerHTML = '<option value="">載入分頁中...</option>';

  chrome.runtime.sendMessage({ action: 'getMediaTabs' }, (res) => {
    const tabs = res && res.tabs ? res.tabs : [];
    select.innerHTML = '';

    if (tabs.length === 0) {
      select.innerHTML = '<option value="">未偵測到支援的媒體播放分頁</option>';
      document.getElementById('proj-btn').disabled = true;
      setStatus('', '請先開啟 YouTube、Spotify、SoundCloud 或 Twitch 分頁');
      return;
    }

    tabs.forEach(tab => {
      const opt = document.createElement('option');
      opt.value = tab.id;
      const tag = tab.platformLabel ? `[${tab.platformLabel}] ` : '';
      const fullText = tag + tab.title;
      opt.textContent = fullText.length > 40 ? fullText.slice(0, 37) + '...' : fullText;
      opt.title = fullText;
      select.appendChild(opt);
    });

    // 若有當前投影分頁，自動選取
    if (projectedTabId && tabs.some(t => t.id === projectedTabId)) {
      select.value = projectedTabId;
    }

    selectedTabId = parseInt(select.value) || null;
    updateUI();

    select.onchange = () => {
      selectedTabId = parseInt(select.value) || null;
      updateUI();
    };
  });
}

// ── 切換投影 ─────────────────────────────────────────────────────────────
function toggleProjection() {
  if (!selectedTabId) return;

  const btn = document.getElementById('proj-btn');
  btn.disabled = true;

  if (projectedTabId === selectedTabId) {
    // 停止投影
    chrome.runtime.sendMessage({ action: 'clearProjection' }, () => {
      projectedTabId = null;
      btn.disabled = false;
      updateUI();
    });
  } else {
    // 開始投影
    chrome.runtime.sendMessage({ action: 'setProjectedTab', tabId: selectedTabId }, () => {
      projectedTabId = selectedTabId;
      btn.disabled = false;
      updateUI();
      // 立即刷新伺服器狀態
      setTimeout(updateServerStatus, 300);
    });
  }
}

// ── 更新介面 ─────────────────────────────────────────────────────────────
function updateUI() {
  const btn = document.getElementById('proj-btn');

  if (!selectedTabId) {
    btn.textContent = '投影';
    btn.className   = 'btn btn-project';
    btn.disabled    = true;
    setStatus('', '');
    return;
  }

  btn.disabled = false;

  if (projectedTabId === selectedTabId) {
    btn.textContent = '停止投影';
    btn.className   = 'btn btn-project active';
    setStatus('ok', '✓ 此分頁正在投影中');
  } else if (projectedTabId) {
    btn.textContent = '切換投影至此';
    btn.className   = 'btn btn-project';
    setStatus('', '注意：目前另一個分頁正在投影中');
  } else {
    btn.textContent = '開始投影';
    btn.className   = 'btn btn-project';
    setStatus('', '');
  }
}

function setStatus(type, text) {
  const el = document.getElementById('proj-status');
  el.textContent = text;
  el.className = 'proj-status' + (type ? ' ' + type : '');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getPlatformBadgeHtml(platform, isLive) {
  if (!platform) return '';
  const p = String(platform).toLowerCase();

  switch (p) {
    case 'youtube':
      return `<span class="platform-badge platform-youtube" title="來源：YouTube${isLive ? ' (直播)' : ''}" aria-label="YouTube${isLive ? ' 直播' : ''}">` +
        `<svg viewBox="0 0 24 24" aria-hidden="true">` +
          `<path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>` +
          `<polygon fill="#FFFFFF" points="9.545,8.432 15.818,12 9.545,15.568"/>` +
        `</svg>` +
        (isLive ? `<span class="live-dot-pulse"></span>` : '') +
      `</span>`;

    case 'ytmusic':
      return `<span class="platform-badge platform-ytmusic" title="來源：YouTube Music" aria-label="YouTube Music">` +
        `<svg viewBox="0 0 24 24" aria-hidden="true">` +
          `<circle cx="12" cy="12" r="11" fill="#FF0000"/>` +
          `<circle cx="12" cy="12" r="7" fill="none" stroke="#FFFFFF" stroke-width="1.8"/>` +
          `<polygon fill="#FFFFFF" points="10,8.5 15.5,12 10,15.5"/>` +
        `</svg>` +
      `</span>`;

    case 'spotify':
      return `<span class="platform-badge platform-spotify" title="來源：Spotify" aria-label="Spotify">` +
        `<svg viewBox="0 0 24 24" aria-hidden="true">` +
          `<circle cx="12" cy="12" r="11" fill="#000000"/>` +
          `<path fill="#1ED760" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>` +
        `</svg>` +
      `</span>`;

    case 'soundcloud':
      return `<span class="platform-badge platform-soundcloud" title="來源：SoundCloud" aria-label="SoundCloud">` +
        `<svg viewBox="0 0 24 24" aria-hidden="true">` +
          `<path fill="#FF5500" d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c0 .055.045.094.09.094s.089-.045.104-.104l.21-1.319-.21-1.334c0-.061-.044-.09-.09-.09m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.119.12.061 0 .105-.061.121-.12l.254-2.474-.254-2.548c-.016-.06-.061-.12-.121-.12m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.15l.24-2.532-.24-2.623c0-.075-.06-.135-.135-.135l-.031-.017zm1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.217 2.43.2 2.563c0 .09.075.157.159.157.074 0 .148-.068.148-.158l.227-2.563-.227-2.444.033.015zm.809-1.709c-.101 0-.18.09-.18.181l-.21 3.957.187 2.563c0 .09.08.164.18.164.094 0 .174-.09.18-.18l.209-2.563-.209-3.972c-.008-.104-.088-.18-.18-.18m.959-.914c-.105 0-.195.09-.203.194l-.18 4.872.165 2.548c0 .12.09.209.195.209.104 0 .194-.089.21-.209l.193-2.548-.192-4.856c-.016-.12-.105-.21-.21-.21m.989-.449c-.121 0-.211.089-.225.209l-.165 5.275.165 2.52c.014.119.104.225.225.225.119 0 .225-.105.225-.225l.195-2.52-.196-5.275c0-.12-.105-.225-.225-.225m1.245.045c0-.135-.105-.24-.24-.24-.119 0-.24.105-.24.24l-.149 5.441.149 2.503c.016.135.121.24.256.24s.24-.105.24-.24l.164-2.503-.164-5.456-.016.015zm.749-.134c-.135 0-.255.119-.255.254l-.15 5.322.15 2.473c0 .15.12.255.255.255s.255-.12.255-.27l.15-2.474-.165-5.307c0-.148-.12-.27-.271-.27m1.005.166c-.164 0-.284.135-.284.285l-.103 5.143.135 2.474c0 .149.119.277.284.277.149 0 .271-.12.284-.285l.121-2.443-.135-5.112c-.012-.164-.135-.285-.285-.285m1.184-.945c-.045-.029-.105-.044-.165-.044s-.119.015-.165.044c-.09.054-.149.15-.149.255v.061l-.104 6.048.115 2.449v.008c.008.06.03.135.074.18.058.061.142.104.234.104.08 0 .158-.044.209-.09.058-.06.091-.135.091-.225l.015-.24.117-2.203-.135-6.086c0-.104-.061-.193-.135-.239l-.002-.022zm1.006-.547c-.045-.045-.09-.061-.15-.061-.074 0-.149.016-.209.061-.075.061-.119.15-.119.24v.029l-.137 6.609.076 1.215.061 1.185c0 .164.148.314.328.314.181 0 .33-.15.33-.329l.15-2.414-.15-6.637c0-.12-.074-.221-.165-.277m8.934 3.777c-.405 0-.795.086-1.139.232-.24-2.654-2.46-4.736-5.188-4.736-.659 0-1.305.135-1.889.359-.225.09-.27.18-.285.359v9.368c.016.18.15.33.33.345h8.185C22.681 17.218 24 15.914 24 14.28s-1.319-2.952-2.938-2.952"/>` +
        `</svg>` +
      `</span>`;

    case 'twitch-live':
      return `<span class="platform-badge platform-twitch-live" title="來源：Twitch (直播)" aria-label="Twitch 直播">` +
        `<svg viewBox="0 0 24 24" aria-hidden="true">` +
          `<path fill="#9146FF" d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>` +
        `</svg>` +
        `<span class="live-dot-pulse"></span>` +
      `</span>`;

    case 'twitch-vod':
    case 'twitch':
      return `<span class="platform-badge platform-twitch-vod" title="來源：Twitch (記錄檔)" aria-label="Twitch 記錄檔">` +
        `<svg viewBox="0 0 24 24" aria-hidden="true">` +
          `<path fill="#9146FF" d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>` +
            `</svg>` +
      `</span>`;

    default:
      return '';
  }
}

// ── 檢查本機伺服器目前收到的資料 ─────────────────────────────────────────
function updateServerStatus() {
  fetch(SERVER_INFO_URL)
    .then(r => r.json())
    .then(d => {
      document.getElementById('srv-dot').className = 'srv-dot ok';
      document.getElementById('srv-dot').title = '伺服器已連線';

      const thumbEl = document.getElementById('np-thumb');
      if (d.thumbnail) {
        thumbEl.src = d.thumbnail;
        thumbEl.style.display = 'block';
      }

      const rawTitle = d.title || '等待播放中...';
      const artist = d.artist || (d.extra && d.extra.channel) || '';
      const displayTitle = (artist && !rawTitle.toLowerCase().includes(artist.toLowerCase()))
        ? `${rawTitle} · ${artist}`
        : rawTitle;

      const hasValidTitle = rawTitle && !rawTitle.startsWith('等待') && rawTitle !== '未找到標題';
      const isLive = Boolean(d.duration === 'LIVE' || d.isLive);
      const badgeHtml = hasValidTitle ? getPlatformBadgeHtml(d.platform || 'youtube', isLive) : '';

      document.getElementById('np-title').innerHTML =
        `<span class="np-title-text">${escapeHtml(displayTitle)}</span>${badgeHtml}`;

      if (isLive) {
        document.getElementById('np-fill').style.width = '100%';
        const liveTime = (d.currentTime && d.currentTime !== 'LIVE' && d.currentTime !== '0:00') ? d.currentTime : '';
        document.getElementById('np-time').textContent = liveTime ? `LIVE ${liveTime}` : 'LIVE 直播中';
      } else {
        const curSec = parseSeconds(d.currentTime);
        const totSec = parseSeconds(d.duration);
        const pct = totSec > 0 ? (curSec / totSec * 100).toFixed(1) + '%' : '0%';
        document.getElementById('np-fill').style.width = pct;
        document.getElementById('np-time').textContent =
          (d.currentTime || '0:00') + ' / ' + (d.duration || '0:00');
      }
    })
    .catch(() => {
      document.getElementById('srv-dot').className = 'srv-dot err';
      document.getElementById('srv-dot').title = '伺服器未連線 (localhost:50120)';
      document.getElementById('np-title').textContent = '伺服器未連線';
    });
}

function parseSeconds(t) {
  if (!t || t === 'N/A' || t === 'LIVE') return 0;
  if (typeof t === 'number') return t;
  const m = String(t).match(/\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2}/);
  if (m) {
    const parts = m[0].split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return parseFloat(t) || 0;
}