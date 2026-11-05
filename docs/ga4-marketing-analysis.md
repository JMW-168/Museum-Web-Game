# GA4 中文標籤與行銷分析設定

## 目前狀態

程式會保留既有 raw ID，並為事件、關卡、入口、入口類型、遊玩模式、離開方式與語言加送固定繁體中文 Label。Label 不隨玩家選擇的繁簡介面改變；遇到未知 raw 值時，Label 會保留該 raw 值，避免資料消失。

本機自動檢查完成不等於正式 GA4 已驗收。以下自訂定義及探索報表須等新版部署到業主網址後設定，並透過 Realtime／DebugView 與處理後報表確認。

## 祝福卡分享與下載

正式業主網域載入新版後，成果頁會送出以下事件；測試站仍受既有主機限制，不會送入正式 GA4。

| 事件 | 送出時點 | 解讀 |
| --- | --- | --- |
| `blessing_card_share_click` | 每次按分享按鈕，產圖前 | 點擊分享的意圖，事件數是次數，不是人數 |
| `blessing_card_share_result` | 分享流程回報結果 | `share_result` 為 `resolved`、`cancelled`、`failed` 或 `unsupported` |
| `blessing_card_download_click` | 玩家主動按下載按鈕 | 按鈕點擊，不代表下載完成；分享不支援而自動下載不記此事件 |

事件帶 `station_id=cake`、`pattern_id`（`turtle`、`luck`、`fish`、`linked-coins`，無法辨識時為 `unknown`）及 `play_mode`（`standalone`、`full_story`、`combined34` 或 `unknown`）。不傳送祝福文字、圖片、收件人或分享目標。已有 `play_mode_label` 與 `station_label`；如需依花紋或系統回報分組，於 GA4 管理介面新增事件範圍自訂維度，參數分別填入 `pattern_id` 和 `share_result`。

在探索報表篩選事件名稱 `blessing_card_share_click`，用「總使用者數」查看指定期間內按過分享的 GA4 使用者數；「事件計數」則是點擊次數。一人多次點擊會增加次數，不一定增加人數；使用者數受 GA4 身分辨識、瀏覽器及資料收集條件影響，並非精確的自然人數。新增自訂維度不會回填建立前的歷史資料。

`resolved` 只表示瀏覽器分享 API 回報完成，並不保證分享至目標或收件人收到；不同系統的回報時機可能不同。取消、失敗和不支援分別記錄；中斷或未收到回報可能沒有結果事件，不能以點擊數減結果數推定成功。

在業主網域部署後，使用 Realtime／DebugView 測試單關與完整劇情的分享、取消、失敗、不支援下載替代、主動下載及不同花紋；檢查事件與參數後，再於處理完成的探索報表查看人數與次數。開發站未送正式 GA4，不得視為正式資料驗收。

## 館內、推廣與班級的流量分組

遊戲既有 Google tag 可接收網址的 UTM 參數，不需新增 GA4 事件或另外設定自訂維度。請把不同連結做成不同 QR code，並放在相應場所；以下 `class_01` 是示範代碼，實際推廣前請建立清單並為不同班級或場次使用不同代碼。不要把學生姓名、電話、學號等個人資料放進網址。

| 用途 | 專屬入口連結 | 使用位置 |
| --- | --- | --- |
| 館內一般 | [館內入口](https://persatuankebudayaanhakkagame-gif.github.io/Museum-Web-Game/?utm_source=museum&utm_medium=qr&utm_campaign=onsite) | 館內固定 QR code |
| 推廣活動 | [推廣入口](https://persatuankebudayaanhakkagame-gif.github.io/Museum-Web-Game/?utm_source=promotion&utm_medium=qr&utm_campaign=promo_2026) | 一般活動的宣傳品；可依活動改 campaign 代碼 |
| 班級示範 | [班級 01 範例入口](https://persatuankebudayaanhakkagame-gif.github.io/Museum-Web-Game/?utm_source=school&utm_medium=qr&utm_campaign=class_01) | 範例；各班或各場次請換不同代碼 |

建議用一致的小寫英文、數字與底線管理代碼，將「代碼、活動名稱、日期、負責人」記在內部清單；不要把人名或其他識別資料放在 UTM。改代碼要連同該次 QR code 一起更新；舊 QR code 仍會指向原代碼。

1. 在 GA4「報表 → 獲客 → 流量獲取」（實際選單名稱依介面而異）選擇日期，將主要維度切成「工作階段活動」或「工作階段來源／媒介」；可依 `onsite`、`promo_2026`、`class_01` 對照工作階段及互動。
2. 若要比較分享行為，在「探索 → 自由形式」加入工作階段活動、事件名稱與總使用者數／事件計數；篩選 `blessing_card_share_click`，並依各活動名稱比較。它計算的是各活動工作階段內觸發事件的 GA4 使用者與點擊次數；同一人跨活動可能分別出現在多組，不能直接加總為不重複人數。
3. 正式發放前，使用獨立測試瀏覽器逐一掃描各 QR code，檢查最終網址保留參數與首頁可用；在業主 GA4 的 Realtime／DebugView 檢查來源及事件，待資料處理完成後，再於流量獲取／探索報表核對。測試結果在正式環境驗證前保持待驗證。

注意：未標記、未收到資料、重導或縮網址丟失參數的流量不能直接歸為館內；GA4 工作階段採非直接來源最後點擊歸因，直接回訪可能歸到先前活動，因此不是完美的實體位置或班級辨識。PWA 已安裝後透過主畫面重開，亦不能假設仍保留原始 UTM；先分別以一般瀏覽與安裝後開啟測試。若需要嚴格依實際館內位置或班級逐次分類，需另外設計並核定可持續的入口識別方式。

## 程式送出的欄位

| raw 欄位／事件 | 中文 Label 欄位 | 說明 |
| --- | --- | --- |
| event name | `event_label` | 首頁：開始體驗、入口點擊、關卡開始、關卡完成、中途離開、再次遊玩 |
| `station_id` | `station_label` | 第一關：灶台生火、第二關：擂茶料理、第三關：搖籃哄睡、第四關：紅粄製作 |
| `entry_id` | `entry_label` | 四個關卡、完整劇情體驗、客家老物件徵集 |
| `entry_type` | `entry_type_label` | 遊戲入口、徵集活動 |
| `entry_source` | `entry_source_label` | 選擇遊戲頁、通關畫面 |
| `play_mode` | `play_mode_label` | 單關體驗、完整劇情體驗、第一二關串連、第三四關串連 |
| `exit_method` | `exit_method_label` | 完成關卡、主動離開、離開頁面／關閉或重整、切換關卡 |
| `journey_stage` | `journey_stage_label` | 完整劇情的開場、四關操作與各關成果／轉場階段 |
| `language` | `language_label` | 繁體中文、簡體中文 |

`attempt_number`、`duration_seconds`、`completed_station_count` 與 `journey_duration_seconds` 維持數字欄位，不建立 Label。

完整劇情另送三個旅程層級事件：

| 事件 | 送出時點 | 主要參數 |
| --- | --- | --- |
| `story_started` | 點擊完整劇情並啟動流程 | `journey_stage=story_intro`、完成關數 0 |
| `story_completed` | 完成第四關收尾並進入通關畫面 | 當下階段、完成關數、整趟秒數 |
| `story_abandoned` | 未完成旅程即按離開、關閉、重整或離開頁面 | 當下階段、完成關數、整趟秒數、離開方式 |

逐關的 `station_started`、`station_completed`、`station_abandoned`、`station_retry` 與 `duration_seconds` 維持不變。完整劇情四關的 `play_mode` 均為 `full_story`。

## GA4 自訂定義

部署後到「管理 → 自訂定義」，建立下列事件範圍自訂維度：

| 建議維度名稱 | 事件參數 |
| --- | --- |
| 事件名稱（中文） | `event_label` |
| 關卡名稱 | `station_label` |
| 入口名稱 | `entry_label` |
| 入口類型 | `entry_type_label` |
| 入口來源 | `entry_source_label` |
| 遊玩模式 | `play_mode_label` |
| 離開方式 | `exit_method_label` |
| 完整劇情進度 | `journey_stage_label` |
| 語言 | `language_label` |

保留現有「遊玩秒數」作為累計秒數，另建自訂指標：

- 名稱：平均單局遊玩秒數
- 事件參數：`duration_seconds`
- 範圍：事件
- 計量單位：時間／秒
- 彙整：平均

另建完整劇情專用指標：

- 名稱：完整劇情遊玩秒數
- 事件參數：`journey_duration_seconds`
- 範圍：事件
- 計量單位：時間／秒

- 名稱：完整劇情已完成關數
- 事件參數：`completed_station_count`
- 範圍：事件
- 計量單位：標準

自訂定義不回填歷史事件。新 Label 與平均指標只會從部署並完成定義後的新事件開始累積；原有 raw ID 報表繼續保留。

## 探索報表

在同一份探索建立以下四個分頁。

### 入口轉換

建立封閉式漏斗，依序使用：

1. `page_view`
2. `event_label` 完全符合「首頁：開始體驗」
3. `event_label` 完全符合「入口點擊」，並以 `entry_type_label` 完全符合「遊戲入口」排除徵集活動
4. `event_label` 完全符合「關卡開始」

另建自由格式表格，以 `entry_source_label` 為列、事件計數為值，篩選 `entry_label` 完全符合「客家老物件徵集」。這會分開顯示選擇遊戲頁與通關畫面的徵集點擊；徵集活動不納入遊戲入口轉換率。

### 完整劇情旅程

- 列：`journey_stage_label`
- 欄：`event_label`
- 值：事件計數、完整劇情遊玩秒數、完整劇情已完成關數
- 篩選：`event_label` 只保留「完整劇情開始」、「完整劇情完成」與「完整劇情中途離開」

完成率固定使用「完整劇情完成 ÷ 完整劇情開始」。中途離開分布使用 `journey_stage_label`，可看出玩家停在開場、哪一關操作中，或哪一關成果／轉場。

### 關卡成效

- 列：`station_label`
- 值：事件計數
- 比較或區隔：`event_label` 的關卡開始、關卡完成、中途離開、再次遊玩

固定計算口徑：

- 完成率 = 關卡完成 ÷ 關卡開始
- 已記錄中途離開率 = 中途離開 ÷ 關卡開始
- 重玩率 = 再次遊玩 ÷ 關卡開始

GA4 自由格式表格若未直接提供上述比率，使用個別漏斗或匯出後以相同分母計算，不改用工作階段數或使用者數。

### 離開與投入分析

- 列：`station_label`
- 欄：`exit_method_label`
- 值：事件計數、平均單局遊玩秒數
- 篩選：`event_label` 只保留「關卡完成」與「中途離開」
- 排除：`station_label`、`exit_method_label` 的 `(not set)`

`pagehide` 僅是瀏覽器允許範圍內的最佳努力紀錄。突然斷網、瀏覽器或系統強制終止時事件可能無法送達，因此只能稱為「已記錄中途離開率」，不得當成絕對跳出率。

## 部署後驗收

- 在業主網址逐一點擊首頁開始、四個單關、完整劇情與客家老物件徵集。
- 四關各驗證開始、完成、主動離開與再次遊玩。
- 驗證完整劇情開始、完成，以及分別在開場對話、關卡操作、成果頁／轉場離開；確認階段、完成關數與旅程秒數正確。
- 確認完整劇情第三、四關的逐關事件使用 `play_mode=full_story`。
- 分別點擊選擇遊戲頁與通關畫面的徵集按鈕，確認 `entry_source_label` 可辨識來源。
- 驗證繁體、簡體介面下送出的固定繁體中文 Label。
- 在 Realtime／DebugView 檢查事件名稱、raw 參數與九個 Label 同時存在。
- 等資料處理完成後，確認四個探索分頁可讀，且徵集活動未混入遊戲轉換率。
