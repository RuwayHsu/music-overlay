/**
 * routes/pages.js v2.1 — 只保留音樂播放器頁面
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const VIEWS_DIR = path.join(__dirname, '../views');

/** 舊路由一律導向 overlay?view=player1 */
const LEGACY_TO_PLAYER1 = [
  '/title', '/thumbnail', '/progress', '/progressbar',
  '/tomato', '/ads', '/adsQR', '/adsqr', '/dashboard'
];

/**
 * 嘗試處理頁面路由
 * @returns {boolean} true 表示已處理
 */
function handlePageRoutes(req, res) {
  const urlPath = req.url.split('?')[0];

  // ── 舊路由 301 重定向（向下相容）────────────────────────────────────
  if (LEGACY_TO_PLAYER1.includes(urlPath)) {
    res.writeHead(301, { Location: '/overlay?view=player1' });
    res.end();
    return true;
  }

  // ── / 或 /index — 入口選擇頁 ─────────────────────────────────────────
  if (urlPath === '/' || urlPath === '/index') {
    serveHTML('index.html', res);
    return true;
  }

  // ── /overlay — 整合式 OBS SPA ────────────────────────────────────────
  if (urlPath === '/overlay') {
    serveHTML('overlay.html', res);
    return true;
  }

  if (urlPath === '/i18n.js') {
    fs.readFile(path.join(VIEWS_DIR, 'i18n.js'), (err, script) => {
      if (err) {
        res.writeHead(500);
        res.end('Localization unavailable');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(script);
    });
    return true;
  }

  return false;
}

// ── 工具 ─────────────────────────────────────────────────────────────────────
function serveHTML(filename, res) {
  const filePath = path.join(VIEWS_DIR, filename);
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) {
      console.error(`[pages] 無法讀取 ${filename}:`, err.message);
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
}

module.exports = { handlePageRoutes };
