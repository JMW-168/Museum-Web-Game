# Issue #25 舊內容清理紀錄

## 狀態

- 程式與素材清理：已完成。
- 自動與瀏覽器回歸：已完成。
- 刪除範圍：使用者已確認。
- 使用者最終驗收：已於 2026-09-04 確認完成。
- Git 狀態：commit `ff1d686` 已由 PR #27 合併至 `main`，merge commit 為 `8898ba3`；Issue #25 已關閉。

## 盤點方法

1. 從 `index.html` 的實際 CSS 與 script 入口建立執行期清單。
2. 掃描保留中的 HTML、CSS、JavaScript、Manifest 與 Service Worker 內所有素材路徑。
3. 將動態組合路徑回查到目前四站程式；擂茶仍需使用的石頭素材已移到 `assets/images/station-tea/stone.png`。
4. 刪除後再次掃描所有保留來源，確認沒有舊系統名稱、舊 DOM id 或不存在的素材路徑。

## 已移除

- 舊 DOM：背景層、角色層、canvas、對話框、選項容器與舊返回按鈕。
- 舊共用系統：`DialogueSystem`、`Typewriter`、`GallerySystem`、`CollectionSystem`、`GameEngine`、`GameState`。
- 舊資料：章節一至三的一般版／小朋友版、舊章節草稿、問答與舊小遊戲素材表。
- 舊玩法：防禦、翻牌、接物、付款、舊拖曳互動及其獨立樣式。
- 舊素材：上述功能使用的章節、人物、卡牌、防禦、收藏、舊封面、按鈕與音效素材。
- 舊工具頁：初始專案批次檔與字型測試頁。

清理前的素材盤點判定約有 92.86 MiB 不再被現行入口引用。刪除內容均保留在 Git 歷史，可從清理前 commit 還原。

## 明確保留

- 四個獨立入口：灶台生火、擂茶料理、搖籃哄睡、粿印製作。
- 兩個合併入口：關卡一二合併版、三四關合併版。
- 兩個合併版內建的逐字劇情邏輯；它們不依賴已移除的舊 `Typewriter.js`。
- 新封面、入口背景、阿嬤／阿公、四站玩法素材與必要音效。
- 字型本體及其 LICENSE／NOTICE 文件。
- Logger、ErrorReporter、LoadingManager、AudioManager、SceneManager 與 PWA 檔案。
- 生火音軌分析與預覽腳本，以及三四關合併流程測試。

## 驗證結果

- `node --check`：主入口與四個現行遊戲模組通過。
- `node scripts/test-combined34-hooks.js`：通過。
- `git diff --check`：通過。
- 靜態素材引用掃描：沒有缺少檔案。
- 舊系統與舊 DOM 名稱掃描：沒有殘留引用。
- 瀏覽器逐一開啟四個獨立入口與兩個合併入口：皆成功。
- 兩個合併版逐字劇情：皆正常顯示。
- 瀏覽器 Console：0 個錯誤。

## 驗收入口

- 模式選擇與新封面。
- 四個獨立入口：灶台生火、擂茶料理、搖籃哄睡、粿印製作。
- 兩個合併入口：關卡一二合併版、三四關合併版。
- 合併版逐字劇情、第四關分享與 PNG 下載。

此文件記錄 Issue #25 的實作、測試、使用者驗收與交付結果；清理內容已合併至 `main`。
