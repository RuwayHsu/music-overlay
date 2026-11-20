---
name: music-overlay-theme
description: Comprehensive design guide and generator for YouTube Music Player OBS Overlays. Use when creating, modifying, or styling CSS themes for Player 1 (vertical) or Player 2 (horizontal).
---

# YouTube Music Player Overlay 主題設計與修改指南

本指南供 **使用者** 與 **AI Agent** 共同參考。當使用者需要修改播放器外觀、新增視覺效果、調整尺寸或設計全新風格（例如賽博龐克、日系粉櫻、極簡透明、復古終端機等）時，請依照此規格進行設計。

---

## 1. 播放器架構與 DOM 結構

播放器頁面為 `http://localhost:50120/overlay?view=[player1|player2]`。
所有外觀皆由純 CSS 控制，可直接在 **OBS 瀏覽器來源** 的「**自訂 CSS (Custom CSS)**」欄位覆寫。

### Player 1（直向版型）DOM 結構
```html
<div id="view-player1" class="view active">
  <div class="p1-container">
    <!-- 上：獨立圓角正方形縮圖 -->
    <div class="p1-thumb-card">
      <img id="p1-thumb" class="p1-thumb-img" src="...">
      <div class="p1-thumb-placeholder" id="p1-placeholder">♪</div>
    </div>
    <!-- 下：獨立長方形圓角資訊群組 -->
    <div class="p1-info-card">
      <div class="p1-title-wrap">
        <div class="marquee-wrap">
          <span class="marquee-inner" id="p1-title">歌曲名稱...</span>
        </div>
      </div>
      <div class="p1-bottom">
        <span class="p1-time" id="p1-cur-time">01:23</span>
        <div class="p1-progress-track">
          <div class="p1-progress-fill" id="p1-fill"></div>
        </div>
        <span class="p1-time" id="p1-total-time">03:45</span>
      </div>
    </div>
  </div>
</div>
```

### Player 2（橫向版型，高度 125px）DOM 結構
```html
<div id="view-player2" class="view active">
  <div class="p2-container">
    <!-- 左：獨立圓角正方形縮圖 (125px × 125px) -->
    <div class="p2-thumb-card">
      <img id="p2-thumb" class="p2-thumb-img" src="...">
      <div class="p2-thumb-placeholder" id="p2-placeholder">♪</div>
    </div>
    <!-- 右：獨立長方形圓角資訊群組 (高 125px) -->
    <div class="p2-info-card">
      <!-- 右上：跑馬燈標題 + 5 條 Audio Spectrum -->
      <div class="p2-top">
        <div class="p2-title-wrap">
          <div class="marquee-wrap">
            <span class="marquee-inner" id="p2-title">歌曲名稱...</span>
          </div>
        </div>
        <div class="spectrum" id="p2-spectrum">
          <i></i><i></i><i></i><i></i><i></i>
        </div>
      </div>
      <!-- 右下：目前秒數 + 進度條 + 總長度（分列兩側） -->
      <div class="p2-bottom">
        <span class="p2-time" id="p2-cur-time">01:23</span>
        <div class="p2-progress-track">
          <div class="p2-progress-fill" id="p2-fill"></div>
        </div>
        <span class="p2-time" id="p2-total-time">03:45</span>
      </div>
    </div>
  </div>
</div>
```

---

## 2. 核心 CSS 自訂變數（Custom Properties）

透過在 `:root` 或個別容器中變更以下變數，即可快速客製化 80% 的風格：

```css
:root {
  /* ── 顏色與材質 ── */
  --font-family: 'Microsoft JhengHei', sans-serif;
  --card-bg: rgba(14, 16, 24, 0.88);             /* 背景毛玻璃色彩 */
  --card-blur: 18px;                               /* 模糊度 */
  --card-border: 1px solid rgba(255, 255, 255, 0.08); /* 邊框 */
  --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.45); /* 投影 */
  --text-color: #ffffff;                           /* 標題顏色 */
  --text-muted: rgba(255, 255, 255, 0.6);          /* 時間文字顏色 */
  --track-bg: rgba(255, 255, 255, 0.15);           /* 進度條底槽顏色 */
  --accent-gradient: linear-gradient(to right, #ff3535, #ff7a35); /* 進度條填色 */
  --spectrum-gradient: linear-gradient(to top, #ff3535, #ffcc00); /* 頻譜顏色 */

  /* ── Player 1 直向尺寸 ── */
  --p1-width: 280px;            /* 整體寬度 */
  --p1-thumb-size: 280px;       /* 縮圖尺寸 (寬高相等) */
  --p1-thumb-radius: 20px;      /* 縮圖圓角 */
  --p1-info-radius: 18px;       /* 資訊群組圓角 */
  --p1-gap: 12px;               /* 縮圖與資訊群組間距 */

  /* ── Player 2 橫向尺寸 ── */
  --p2-width: 650px;            /* 整體寬度 */
  --p2-height: 125px;           /* 嚴格高度 125px */
  --p2-thumb-size: 125px;       /* 縮圖尺寸 (寬高相等 125px) */
  --p2-thumb-radius: 18px;      /* 縮圖圓角 */
  --p2-info-radius: 18px;       /* 資訊群組圓角 */
  --p2-gap: 12px;               /* 縮圖與資訊群組間距 */
}
```

---

## 3. AI 修改指南（When an AI is asked to design a theme）

當使用者要求 AI「幫我做一個 [XX 風格] 的音樂播放器外觀」時，AI 請依照以下規則產出：

1. **輸出完整可複製的 CSS**：
   - 包含 `:root` 變數調整。
   - 針對特定類別（如 `.p1-thumb-card`, `.p2-info-card`, `.spectrum i`）進行進階微調（例如發光光暈 `box-shadow: 0 0 15px ...`、自訂漸層、邊框動態光等）。
2. **保持背景透明原則**：
   - OBS 覆蓋層最外層 `html, body` 必須維持 `background: transparent;`，不可蓋住實況畫面。
3. **Audio Spectrum 必須為 5 條**：
   - 頻譜共 5 根長條，選擇器為 `.spectrum i:nth-child(1)` 到 `(5)`。
   - 當影片暫停時，`.spectrum.paused i` 會自動暫停動畫。
4. **文字溢出保護**：
   - 標題使用 `.marquee-wrap` 與 `.marquee-inner` 進行跑馬燈滾動，請保留 `white-space: nowrap;`。

---

## 4. 如何在 OBS 套用自訂 CSS

1. 打開 OBS Studio。
2. 雙擊你的「瀏覽器 (Browser Source)」來源。
3. 往下拉找到「**自訂 CSS (Custom CSS)**」文字方塊。
4. 將自訂 CSS 貼到方塊最下方或完全取代。
5. 點擊「確定」，OBS 畫面立即呈現新主題！
