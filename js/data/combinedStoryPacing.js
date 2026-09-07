// 兩個合併版（關卡一二、三四關）逐字劇情的共用節奏設定。
// 集中在這裡，避免 StationDemoGame 與 Station34CombinedGame 兩套流程數值漂移。
const CombinedStoryPacing = {
    // 逐字顯示時每個字的間隔（毫秒）。放慢讓成人玩家能邊出現邊讀。
    charIntervalMs: 70,
    // 整行文字完整出現後的看不見短暫停（毫秒）：這段時間內用於前進的點擊
    // 一律無效，避免「連點一下就跳過剛出現的字卡」。不顯示任何提示文字。
    minReadMs: 500
};

window.CombinedStoryPacing = CombinedStoryPacing;
