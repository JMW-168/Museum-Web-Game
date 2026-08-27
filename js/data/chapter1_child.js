// js/data/chapter1_child.js
window.Chapter1_Child = {
    id: 'chapter1_child',
    background: 'assets/images/ch1/background.png',
    
    // ✅ 紀錄三個關卡的通關狀態
    gameProgress: {
        level1Completed: false,
        level2Completed: false,
        level3Completed: false
    },
    
    // ✅ 重置遊戲進度的方法
    resetProgress: function() {
        this.gameProgress = {
            level1Completed: false,
            level2Completed: false,
            level3Completed: false
        };
    },
    
    // ✅ 記錄關卡完成
    setLevelCompleted: function(level) {
        this.gameProgress[`level${level}Completed`] = true;
        console.log(`✅ 關卡 ${level} 通關記錄已儲存，目前進度:`, this.gameProgress);
    },
    
    // ✅ 檢查是否全部通關
    isAllCompleted: function() {
        return this.gameProgress.level1Completed && 
               this.gameProgress.level2Completed && 
               this.gameProgress.level3Completed;
    },
    
    dialogue: [
        // ========== 開場旁白 ==========
        {
            id: 'start',
            type: 'narration',
            text: '歡迎來到紅磚市場！\n這裡有好多有趣故事\n和小任務。\n快跟著阿斗仔一起出發吧！',
            speed: 60,
            next: 'intro_level1'
        },
        
        // ========== 第一關：最早的市場 ==========
        {
            id: 'intro_level1',
            name: '阿斗仔',
            text: '小朋友，你知道嗎？這裡以前還沒有紅磚房子喔！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_reply1'
        },
        {
            id: 'kid_reply1',
            name: '小朋友',
            text: '真的嗎？那以前是什麼樣子？',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level1_story1'
        },
        {
            id: 'level1_story1',
            name: '阿斗仔',
            text: '以前這裡有牛墟，還有臨時市場。\n大家會來賣牛、賣農具，清早很熱鬧。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_reply2'
        },
        {
            id: 'kid_reply2',
            name: '小朋友',
            text: '感覺好像很好玩！',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level1_story2'
        },
        {
            id: 'level1_story2',
            name: '阿斗仔',
            text: '對呀！你看，市場阿桑正在蒸肉圓呢。可是肉圓太滑了，一不小心就四處飛出去啦！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_reply3'
        },
        {
            id: 'kid_reply3',
            name: '小朋友',
            text: '哇！那怎麼辦？',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level1_challenge'
        },
        {
            id: 'level1_challenge',
            name: '阿斗仔',
            text: '現在就要請你來幫忙！快拿碗或盤子，把飛出去的肉圓接住，幫阿桑保住今天的早餐吧！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '好！我來幫忙接肉圓！',
                    action: 'minigame',
                    minigame: 'defense',
                    level: 1,
                    returnTo: {
                        success: 'level1_complete',
                        fail: 'level1_fail'
                    }
                }
            ]
        },
        {
            id: 'level1_complete',
            name: '阿斗仔',
            text: '哇！你好厲害！肉圓都接住了！阿桑說謝謝你～',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_happy'
        },
        {
            id: 'kid_happy',
            name: '小朋友',
            text: '耶！我接到好多肉圓！',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level1_transition'
        },
        {
            id: 'level1_transition',
            name: '阿斗仔',
            text: '太好了！繼續下一關吧！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'intro_level2'
        },
        {
            id: 'level1_fail',
            name: '阿斗仔',
            text: '沒關係，肉圓滑掉了可以再試一次。要再挑戰一次嗎？還是先往前走？',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '再試一次',
                    action: 'minigame',
                    minigame: 'defense',
                    level: 1,
                    returnTo: {
                        success: 'level1_complete',
                        fail: 'level1_fail'
                    }
                },
                {
                    text: '繼續往下一關',
                    action: 'goto',
                    target: 'intro_level2'
                }
            ]
        },
        
        // ========== 第二關：火災與重建 ==========
        {
            id: 'intro_level2',
            name: '阿斗仔',
            text: '接下來要帶你去看看市場經歷的大事件喔！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_ask_fire'
        },
        {
            id: 'kid_ask_fire',
            name: '小朋友',
            text: '阿斗仔，後來這裡怎麼變成紅磚市場的呢？',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level2_story1'
        },
        {
            id: 'level2_story1',
            name: '阿斗仔',
            text: '因為人越來越多，大家就一起蓋了一座真正的紅磚市場。本來這裡很熱鬧，可是後來發生了一場大火。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_scared'
        },
        {
            id: 'kid_scared',
            name: '小朋友',
            text: '大火？那不是很可怕嗎？',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level2_story2'
        },
        {
            id: 'level2_story2',
            name: '阿斗仔',
            text: '是啊，市場裡有些地方被燒黑了，還留下燒焦的痕跡。可是別怕，這一關你不是來看火災的，你是來幫忙守護市場的！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_help'
        },
        {
            id: 'kid_help',
            name: '小朋友',
            text: '我要怎麼幫忙？',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level2_challenge'
        },
        {
            id: 'level2_challenge',
            name: '阿斗仔',
            text: '火團一直掉下來了！你要用水球和水牆把火團擋住，不讓它繼續破壞市場！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '好！我要把火通通擋下來！',
                    action: 'minigame',
                    minigame: 'defense',
                    level: 2,
                    returnTo: {
                        success: 'level2_complete',
                        fail: 'level2_fail'
                    }
                }
            ]
        },
        {
            id: 'level2_complete',
            name: '阿斗仔',
            text: '太棒了！你成功守住市場了！這樣我們就有機會把它重新修好！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_proud'
        },
        {
            id: 'kid_proud',
            name: '小朋友',
            text: '耶！我保護了市場！',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level2_transition'
        },
        {
            id: 'level2_transition',
            name: '阿斗仔',
            text: '你好棒！我們來看最後一關吧！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'intro_level3'
        },
        {
            id: 'level2_fail',
            name: '阿斗仔',
            text: '火勢太猛了...沒關係，我們可以再試一次，市場還等著我們保護呢！要再挑戰一次嗎？',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '再試一次',
                    action: 'minigame',
                    minigame: 'defense',
                    level: 2,
                    returnTo: {
                        success: 'level2_complete',
                        fail: 'level2_fail'
                    }
                },
                {
                    text: '繼續往下一關',
                    action: 'goto',
                    target: 'intro_level3'
                }
            ]
        },
        
        // ========== 第三關：現在的樣子 ==========
        {
            id: 'intro_level3',
            name: '阿斗仔',
            text: '現在的紅磚市場，雖然沒有以前那麼熱鬧，可是它還是好好站在這裡。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_question'
        },
        {
            id: 'kid_question',
            name: '小朋友',
            text: '所以它像一個會說故事的地方嗎？',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level3_story1'
        },
        {
            id: 'level3_story1',
            name: '阿斗仔',
            text: '沒錯！每一塊紅磚，都在告訴我們以前的故事。這裡不只是市場，也是北斗很重要的記憶喔！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_understand'
        },
        {
            id: 'kid_understand',
            name: '小朋友',
            text: '我知道了，這裡是裝滿回憶的紅磚市場！',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level3_challenge'
        },
        {
            id: 'level3_challenge',
            name: '阿斗仔',
            text: '最後一關！豆乳快要完成了，但是黃豆一直亂跳！快來幫我用篩子接住黃豆，做出好喝的豆乳！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '沒問題！交給我！',
                    action: 'minigame',
                    minigame: 'defense',
                    level: 3,
                    returnTo: {
                        success: 'level3_complete',
                        fail: 'level3_fail'
                    }
                }
            ]
        },
        {
            id: 'level3_complete',
            name: '阿斗仔',
            text: '🎉 太厲害了！你完成了所有任務！豆乳也做好了！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'kid_celebrate'
        },
        {
            id: 'kid_celebrate',
            name: '小朋友',
            text: '哇～我成功了！謝謝阿斗仔帶我認識紅磚市場！',
            characterImage: 'assets/images/characters/non_character.png',
            // ✅ 根據通關進度動態決定跳轉目標（參考 teen 版）
            get next() {
                if (window.Chapter1_Child.isAllCompleted()) {
                    return 'good_ending';
                } else {
                    return 'normal_ending';
                }
            }
        },
        {
            id: 'level3_fail',
            name: '阿斗仔',
            text: '研磨失敗了...沒關係，豆乳可以重新磨。要再試一次嗎？還是要去看看結局？',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '再試一次',
                    action: 'minigame',
                    minigame: 'defense',
                    level: 3,
                    returnTo: {
                        success: 'level3_complete',
                        fail: 'level3_fail'
                    }
                },
                {
                    text: '前往結局',
                    action: 'goto',
                    // ✅ 根據通關進度動態決定跳轉目標（參考 teen 版）
                    target: 'normal_ending'
                }
            ]
        },
        
        // ========== 好結局（三關全通） ==========
        {
            id: 'good_ending',
            name: '阿斗仔',
            text: '🎉 太厲害了！三個任務你都完成了！你保護了肉圓、守住了大火中的市場、還做出了好喝的豆乳！你是最棒的小幫手！紅磚市場會永遠記得你喔！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'final_thanks'
        },
        
        // ========== 普通結局（未全通） ==========
        {
            id: 'normal_ending',
            name: '阿斗仔',
            text: '沒關係，市場還在這裡，歡迎你隨時再來。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'final_thanks'
        },
        
        // ========== 最終感謝 ==========
        {
            id: 'final_thanks',
            name: '阿斗仔',
            text: '紅磚市場的大門永遠為你打開喔！下次再來聽更多故事吧！拜拜～',
            characterImage: 'assets/images/characters/阿斗仔.png'
        }
    ]
};

console.log('✅ Chapter1_Child 小朋友版已載入');