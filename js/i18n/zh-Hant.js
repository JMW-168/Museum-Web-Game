// 繁體中文（專案母語、預設語言）。
// S1 範圍：介面殼層、導覽、模式選擇、入口卡、退出確認、通關致謝。
// 劇情（S2）與玩法／結果頁／祝福卡（S3）的 key 由對應子單補上。
window.I18n.register('zh-Hant', {
    // 載入 / 安裝
    'loading.text': '資源加載中...',
    'install.label': '安裝',

    // 首頁
    'title.alt': '森美蘭客家文化博物館・傳統日常再現',
    'menu.start': '搭乘時光機',
    'menu.exit': '回到現實',

    // 模式選擇
    'age.title': '選擇遊戲模式',
    'age.subtitle': '請選擇適合您的版本',
    'age.child.text': '小朋友版',
    'age.child.desc': '附注音・簡單引導',
    'age.adult.text': '一般版',
    'age.adult.desc': '標準文字・完整劇情',

    // 入口選擇
    'level.title': '選擇遊戲入口',
    'level.back': '返回',
    'level.fire.kicker': '關卡一 / 站點 1',
    'level.fire.title': '灶台生火',
    'level.fire.desc': '依節拍加入柴火，控制火候條，認識葉家勤儉與生火日常。',
    'level.tea.kicker': '關卡二 / 站點 2',
    'level.tea.title': '擂茶料理',
    'level.tea.desc': '從流動隊列依序拖曳食材，避開柴火與石頭，完成研磨與切料。',
    'level.cradle.kicker': '關卡三 / 站點 3',
    'level.cradle.title': '搖籃哄睡',
    'level.cradle.desc': '跟隨左右導引輕搖搖籃，慢慢累積穩定度，讓嬰孩安心睡著。',
    'level.cake.kicker': '關卡四 / 站點 4',
    'level.cake.title': '粿印製作',
    'level.cake.desc': '認識龜、桃、魚與連錢紋，完成拖曳配對後用四面粿印棒壓出紅粿。',
    'level.combined12.kicker': '劇情體驗',
    'level.combined12.title': '關卡一二合併版',
    'level.combined12.desc': '跟著阿嬤與阿公的故事，依序完成灶台生火與擂茶料理。',
    'level.combined34.kicker': '劇情體驗',
    'level.combined34.title': '三四關合併版',
    'level.combined34.desc': '從搖籃裡的牽掛走到粿印上的祝福，依序完成搖籃哄睡與粿印製作。',

    // 退出確認
    'exit.title': '你確定要退出嗎？',
    'exit.warning': '任何未儲存的進度都會遺失',
    'exit.yes': '確認退出',
    'exit.no': '繼續遊戲',

    // 共用 / fallback 對話
    'common.notLoaded': '遊戲尚未載入，請重新整理頁面。',
    'common.confirmExit': '確定要離開遊戲嗎？',

    // 通關致謝畫面
    'ending.kicker': '旅程完成',
    'ending.title': '感謝遊玩',
    'ending.subtitle': '謝謝你來到客家土樓，和我們一起留下這段生活記憶。',
    'ending.return': '返回入口'
});
