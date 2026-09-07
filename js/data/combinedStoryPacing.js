// 兩個合併版（關卡一二、三四關）逐字劇情的共用節奏設定。
// 集中在這裡，避免 StationDemoGame 與 Station34CombinedGame 兩套流程數值漂移。
const CombinedStoryPacing = {
    // 逐字顯示時每個字的間隔（毫秒）。
    charIntervalMs: 42,
    // 整行文字完整出現後的最短閱讀停留（毫秒）。
    // 依 Issue #32：預設 1500，可在 1000–2000 之間依成人試玩感受微調。
    minReadMs: 1500
};

window.CombinedStoryPacing = CombinedStoryPacing;
