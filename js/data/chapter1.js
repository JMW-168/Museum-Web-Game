// js/data/chapter1.js
window.Chapter1 = {
    id: 'chapter1',
    background: 'assets/images/market.jpg',
    
    dialogue: [
        // 起始節點
        {
            id: 'start',
            name: '時光導師',
            text: '歡迎來到紅磚市場。你準備好開始探索了嗎？',
            options: [
                {
                    text: '是的，我準備好了',
                    action: 'goto',
                    target: 'intro'
                },
                {
                    text: '先告訴我這裡的故事',
                    action: 'goto',
                    target: 'story_background'
                },
                {
                    text: '挑戰肉圓滑溜戰',
                    action: 'minigame',
                    minigame: 'defense',
                    level: 1,  // 第一關
                    returnTo: 'after_game'
                }
            ]
        },
        
        // 故事背景
        {
            id: 'story_background',
            name: '時光導師',
            text: '這個市場有百年歷史，見證了許多人的故事...',
            options: [
                {
                    text: '聽起來很有趣',
                    action: 'goto',
                    target: 'intro'
                },
                {
                    text: '我還是直接開始吧',
                    action: 'goto',
                    target: 'intro'
                }
            ]
        },
        
        // 任務介紹
        {
            id: 'intro',
            name: '時光導師',
            text: '今天有三個任務需要完成，你想先做哪個？',
            options: [
                {
                    text: '幫助老攤販（記憶遊戲）',
                    action: 'minigame',
                    minigame: 'memory',
                    returnTo: 'after_memory'
                },
                {
                    text: '尋找失物（尋物遊戲）',
                    action: 'minigame',
                    minigame: 'finding',
                    returnTo: 'after_finding'
                },
                {
                    text: '修復照片（拼圖遊戲）',
                    action: 'minigame',
                    minigame: 'puzzle',
                    returnTo: 'after_puzzle'
                }
            ]
        },
        
        // 記憶遊戲後
        {
            id: 'after_defense_1',
            name: '老攤販',
            text: '太感謝你了！你找回了我重要的回憶。',
            options: [
                {
                    text: '繼續下一個任務',
                    action: 'goto',
                    target: 'intro'
                },
                {
                    text: '完成今天的任務',
                    action: 'goto',
                    target: 'ending'
                }
            ]
        },
        
        // // 條件分支範例
        // {
        //     id: 'check_items',
        //     name: '系統',
        //     text: '檢查你的進度...',
        //     options: [
        //         {
        //             text: '繼續',
        //             action: 'condition',
        //             condition: 'hasItem',
        //             item: 'special_key',
        //             trueTarget: 'special_ending',
        //             falseTarget: 'normal_ending'
        //         }
        //     ]
        // },
        
        // // 多重結局
        // {
        //     id: 'special_ending',
        //     name: '時光導師',
        //     text: '你有特殊道具！解鎖隱藏結局！'
        // },
        // {
        //     id: 'normal_ending',
        //     name: '時光導師',
        //     text: '任務完成，感謝你的幫助。'
        // },
        
        // 新增結束節點
        {
            id: 'ending',
            name: '時光導師',
            text: '今天的任務就到這裡，感謝你的幫助！'
        }
    ]
};

console.log('✅ Chapter1 已載入:', window.Chapter1);