# 🎨 YouTube Music Player Overlay — 樣式自訂與主題中心

歡迎來到音樂播放器樣式中心！本目錄提供現成的 CSS 模板、主題預設集，以及供 AI Agent 參考的修改 Skill 規範。

---

## 📁 目錄檔案一覽

| 檔案 | 說明 |
| :--- | :--- |
| [`SKILL.md`](./SKILL.md) | **AI Skill 指南**：規範 DOM 結構、CSS 選擇器與主題設計規則，可直接供 AI 讀取並生成全新主題。 |
| [`player1-vertical-template.css`](./player1-vertical-template.css) | **Player 1 直向版型**專用模板（附詳細註解）。 |
| [`player2-horizontal-template.css`](./player2-horizontal-template.css) | **Player 2 橫向版型**專用模板（高度 150px、5 條頻譜動畫）。 |
| [`presets.css`](./presets.css) | **精選主題包**：包含賽博龐克、日系櫻花、復古終端綠、北歐極簡等現成樣式。 |

---

## 🚀 如何在 OBS 套用主題？

不需要修改伺服器程式碼，只需要使用 OBS 內建的「自訂 CSS」功能：

1. 打開 **OBS Studio**。
2. 在「來源」面板中，雙擊你的音樂播放器瀏覽器來源（例如網址為 `http://localhost:50120/overlay?view=player2`）。
3. 視窗往下拉，找到「**自訂 CSS (Custom CSS)**」輸入框。
4. 打開本目錄中的 [`presets.css`](./presets.css) 或 [`player2-horizontal-template.css`](./player2-horizontal-template.css)，複製你喜歡的樣式代碼。
5. 貼入 OBS 的「自訂 CSS」欄位中，並點擊「確定」。
6. OBS 畫面會即時呈現新外觀！

---

## 🤖 如何讓 AI 幫你設計專屬主題？

如果你有任何自訂想法（例如：「我想要一個黑白漫畫風格的播放器」、「我想把橫向的高度改成 180px 並加粗邊框」），你可以直接在對話中對 AI 下指令：

> **對 AI 的 Prompt 範例：**
> 「請參考 `custom-themes/SKILL.md`，幫我設計一款日系復古動漫風格的 Player 2 橫向播放器 CSS，主色系要深邃星空藍，進度條要有閃爍微光效果。」

AI 將會依照 `SKILL.md` 的精確結構，為你生成一段可以直接貼入 OBS 的完整 CSS！
