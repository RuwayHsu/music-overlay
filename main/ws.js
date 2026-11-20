/**
 * ws.js — WebSocket 廣播模組
 * 附掛在既有的 http.Server 上，管理所有 OBS 客戶端連線，
 * 並負責主動推送狀態更新。
 */
const WebSocket = require('ws');
const state     = require('./state');

let wss = null;

/**
 * 初始化 WebSocket 伺服器（附掛到 http.Server）
 * @param {import('http').Server} httpServer
 */
function init(httpServer) {
  wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[ws] 新連線: ${ip}，目前共 ${wss.clients.size} 個連線`);

    // ── 送出初始狀態 ──────────────────────────────────────────────────
    const { youtubeInfo } = state.getState();

    _send(ws, 'init', {
      youtube: youtubeInfo
    });

    ws.on('close', () => {
      console.log(`[ws] 連線關閉: ${ip}，剩餘 ${wss.clients.size} 個連線`);
    });

    ws.on('error', (err) => {
      console.error(`[ws] 連線錯誤: ${ip}`, err.message);
    });
  });

  wss.on('error', (err) => {
    console.error('[ws] WebSocket 伺服器錯誤:', err);
  });

  console.log('[ws] WebSocket 伺服器已初始化');
}

/**
 * 廣播訊息給所有已連線的客戶端
 * @param {string} type  訊息類型（'youtube' | 'tomato' | 'imageIndex'）
 * @param {object} data  訊息資料
 */
function broadcast(type, data) {
  if (!wss) return;
  const payload = JSON.stringify({ type, data });
  let sent = 0;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
      sent++;
    }
  });
}

/** 取得目前連線數 */
function connectionCount() {
  return wss ? wss.clients.size : 0;
}

// ── 私有工具 ─────────────────────────────────────────────────────────────────
function _send(ws, type, data) {
  try {
    ws.send(JSON.stringify({ type, data }));
  } catch (err) {
    console.error('[ws] 傳送初始狀態失敗:', err.message);
  }
}

module.exports = { init, broadcast, connectionCount };
