/**
 * routes/api.js v2.1 — 精簡版，僅保留 YouTube 端點
 */
'use strict';

const state = require('../state');
const ws    = require('../ws');
const twitchBot = require('../twitch-bot');

/**
 * 嘗試處理 API 路由
 * @returns {boolean} true 表示已處理
 */
function handleApiRoutes(req, res) {
  const urlPath = req.url.split('?')[0];
  const { method } = req;

  // ── POST /api/update ─────────────────────────────────────────────────
  // Content script 傳送多媒體串流播放資訊
  if (urlPath === '/api/update' && method === 'POST') {
    collectBody(req, (err, data) => {
      if (err) return sendJSON(res, 400, { success: false, error: err.message });
      state.setMediaInfo(data);
      const curState = state.getState();
      ws.broadcast('youtube', curState.youtubeInfo); // 向下相容
      ws.broadcast('media', curState.mediaInfo);     // 新標準
      sendJSON(res, 200, { success: true });
    });
    return true;
  }

  // ── GET /api/info ─────────────────────────────────────────────────────
  // 向下相容（popup.js 查詢用）
  if (urlPath === '/api/info' && method === 'GET') {
    sendJSON(res, 200, state.getState().mediaInfo);
    return true;
  }

  // ── GET /api/status ───────────────────────────────────────────────────
  // Index 頁面查詢連線狀態
  if (urlPath === '/api/status' && method === 'GET') {
    const curState = state.getState();
    sendJSON(res, 200, {
      wsConnections: ws.connectionCount(),
      youtube: curState.youtubeInfo,
      media: curState.mediaInfo,
      twitchBot: twitchBot.getStatus()
    });
    return true;
  }

  // ── Twitch 機器人 API 端點 ──────────────────────────────────────────
  if (urlPath === '/api/twitch-bot/config' && method === 'GET') {
    sendJSON(res, 200, twitchBot.getConfig());
    return true;
  }

  if (urlPath === '/api/twitch-bot/config' && method === 'POST') {
    collectBody(req, (err, data) => {
      if (err) return sendJSON(res, 400, { ok: false, success: false, error: err.message });
      const updated = twitchBot.updateConfig(data || {});
      sendJSON(res, 200, { ok: true, success: true, config: updated, status: twitchBot.getStatus() });
    });
    return true;
  }

  if (urlPath === '/api/twitch-bot/status' && method === 'GET') {
    sendJSON(res, 200, twitchBot.getStatus());
    return true;
  }

  if (urlPath === '/api/twitch-bot/test' && method === 'POST') {
    const result = twitchBot.sendTestMessage();
    sendJSON(res, 200, result);
    return true;
  }

  return false;
}

// ── 工具函數 ─────────────────────────────────────────────────────────────────

function collectBody(req, cb) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try { cb(null, JSON.parse(body)); }
    catch (err) { cb(err); }
  });
  req.on('error', cb);
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

module.exports = { handleApiRoutes };
