/**
 * server.js v2.1 — 精簡版入口點，僅保留音樂播放器功能
 */
'use strict';

const http = require('http');

const wsModule = require('./ws');
const { handleApiRoutes }   = require('./routes/api');
const { handlePageRoutes }  = require('./routes/pages');

// ── HTTP 伺服器 ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS（允許擴充功能跨域呼叫）
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (handleApiRoutes(req, res))  return;
  if (handlePageRoutes(req, res)) return;

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

// ── WebSocket（附掛到同一個 http.Server，不需額外 Port）────────────────
wsModule.init(server);

// ── Twitch 聊天室互動機器人 ─────────────────────────────────────────────
const twitchBot = require('./twitch-bot');
twitchBot.init();

// ── 啟動 ───────────────────────────────────────────────────────────────────
const PORT = 50120;

server.listen(PORT, '0.0.0.0', () => {
  const base = `http://localhost:${PORT}`;
  console.log('');
  console.log('  YouTube Music Player Overlay');
  console.log('  ─────────────────────────────────────────');
  console.log(`  入口選單：   ${base}/index`);
  console.log(`  直向播放器：  ${base}/overlay?view=player1`);
  console.log(`  橫條播放器：  ${base}/overlay?view=player2`);
  console.log('  ─────────────────────────────────────────');
  console.log('  等待 Chrome 擴充功能連線...');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} 已被佔用，請先停止舊的伺服器。`);
  } else {
    console.error('伺服器錯誤:', err);
  }
  process.exit(1);
});