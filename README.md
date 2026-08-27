# Museum Web Game

Museum Web Game 是一款以博物館展覽與地方文化故事為核心的網頁互動遊戲。

目前版本是新專案的技術基底：已具備可在瀏覽器執行的靜態網頁遊戲架構，後續會逐步替換正式名稱、素材、劇情與玩法。

## 線上開啟

GitHub Pages：

https://jmw-168.github.io/Museum-Web-Game/

Repo：

https://github.com/JMW-168/Museum-Web-Game

## 本機開啟

Clone 專案：

```powershell
git clone https://github.com/JMW-168/Museum-Web-Game.git
cd Museum-Web-Game
```

啟動靜態伺服器：

```powershell
python -m http.server 8765
```

然後用瀏覽器開啟：

http://localhost:8765/

## 遊戲內容

- 章節式互動劇情
- 小朋友版與一般版
- 問答、記憶翻牌、防禦、拖曳互動、付款、接物等小遊戲骨架
- PWA 支援，可由瀏覽器安裝為類 App 體驗

## 目前狀態

- 已完成初始專案搬移與 GitHub repo 初始化。
- 目前仍保留來源專案的部分示範素材與劇情資料，作為後續改版基底。
- 正式博物館版本的角色、場景、展品、文案與玩法仍在規劃中。

## 技術架構

- `index.html`：遊戲入口。
- `style.css`、`css/`：主要版面與小遊戲樣式。
- `js/core/`：遊戲核心系統。
- `js/data/`：劇情、章節與題庫資料。
- `js/minigames/`：小遊戲模組。
- `assets/`：圖片、字型、音效與影片素材。
- `manifest.json`、`sw.js`：PWA 設定。

## GitHub Pages 設定

若線上網址尚未啟用，請到 GitHub repo：

`Settings` -> `Pages` -> `Build and deployment`

設定：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

儲存後即可使用上方線上網址。
