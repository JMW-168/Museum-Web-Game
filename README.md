# Museum Web Game

這是一款以博物館展覽與地方文化故事為核心的網頁互動遊戲。現階段沿用 `red brick game` 的靜態網頁遊戲架構，後續會替換成新的名稱、素材、劇情與玩法。

## 線上開啟

GitHub Pages：

Repo：`https://github.com/JMW-168/Museum-Web-Game.git`

Pages URL 待 GitHub Pages 設定完成後補上。

如果剛推送完程式碼，GitHub Pages 可能需要 1 到 2 分鐘才會更新完成。

## 本機開啟

在專案上一層啟動靜態伺服器：

```powershell
cd "C:\Users\taiyu\Github\Museum Web Game"
py -m http.server 8765
```

然後用瀏覽器開啟：

http://localhost:8765/Museum%20Web%20Game/

如果 `py` 無法使用，可以改用：

```powershell
python -m http.server 8765
```

## 遊戲內容

- 章節式互動劇情
- 小朋友版與一般版
- 問答、記憶翻牌、防禦、拖曳互動、付款、接物等小遊戲骨架
- PWA 支援，可由瀏覽器安裝為類 App 體驗

## GitHub Pages 設定

若線上網址尚未啟用，請到 GitHub repo：

`Settings` -> `Pages` -> `Build and deployment`

設定：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

儲存後即可使用上方線上網址。
