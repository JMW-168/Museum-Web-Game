// js/data/chapter1_teen.js
window.Chapter1_Teen = {
    id: 'chapter1_teen',
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
        // ========== 開場 ==========
        {
            id: 'start',
            type: 'narration',
            text: '歡迎來到紅磚市場的時光任務。\n接下來，你將一步步走進市場的過去\n，從熱鬧的清晨，到重要的轉折時刻。\n準備好了就跟著阿斗仔出發，進入第一關吧。',
            speed: 60, 
            next: 'intro_level1',
        },
        
        // ========== 第一關：市場的起點 ==========
        {
            id: 'intro_level1',
            name: '阿斗仔',
            text: '先別急著往前走，你聽——牛叫聲、叫賣聲，還有蒸籠冒熱氣的聲音。\n這裡不是現在的紅磚市場，而是更早以前的臨時市場和牛墟。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'player_reply1'
        },
        {
            id: 'player_reply1',
            name: '你',
            text: '原來以前的市場，是從這樣開始的。',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level1_story1'
        },
        {
            id: 'level1_story1',
            name: '阿斗仔',
            text: '對。天才剛亮，市場就已經醒了。賣牛的、賣農具的、趕早來做買賣的人，全都擠在這裡。你看那邊，阿桑正在蒸肉圓——',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'player_reply2'
        },
        {
            id: 'player_reply2',
            name: '你',
            text: '等等，肉圓怎麼飛出來了？',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level1_story2'
        },
        {
            id: 'level1_story2',
            name: '阿斗仔',
            text: '因為太滑了啊。別站著看了，快拿碗或盤子幫忙接住！不然今天清早市場最香的一攤，可要忙翻了。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '好，我來！',
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
            text: '漂亮！全都接住了！你讓阿桑的肉圓攤保住了今天最早的生意。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'player_satisfied'
        },
        {
            id: 'player_satisfied',
            name: '你',
            text: '還好來得及。繼續前進吧。',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'intro_level2'
        },
        {
            id: 'level1_fail',
            name: '阿斗仔',
            text: '沒關係，肉圓滑掉了可以再試一次。重要的是我們願意幫忙的心意。要再挑戰一次嗎？還是先往前走？',
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
        
        // ========== 第二關：關鍵轉折 ==========
        {
            id: 'intro_level2',
            name: '阿斗仔',
            text: '小心，這一關不一樣了。你有沒有發現，四周暗了下來，牆上也多了燒黑的痕跡？',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'player_observe'
        },
        {
            id: 'player_observe',
            name: '你',
            text: '這裡看起來……像是剛發生過什麼事。',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level2_story1'
        },
        {
            id: 'level2_story1',
            name: '阿斗仔',
            text: '對。這座市場曾經被大火吞過。原本熟悉的攤位變得殘破，空氣裡還像留著煙味。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'player_sympathy'
        },
        {
            id: 'player_sympathy',
            name: '你',
            text: '所以這就是市場受傷的樣子。',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level2_story2'
        },
        {
            id: 'level2_story2',
            name: '阿斗仔',
            text: '沒錯。現在火團還在往下掉，市場還沒完全安全。你要用水球和水牆把它們擋下來，先把這裡守住。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'player_determine'
        },
        {
            id: 'player_determine',
            name: '你',
            text: '只要把火擋住，就還有機會把市場救回來，對吧？',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level2_challenge'
        },
        {
            id: 'level2_challenge',
            name: '阿斗仔',
            text: '對。只要守住，就還來得及重建。來吧，動手！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '開始！',
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
            text: '火勢止住了。你成功守住了這座市場的未來。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'player_relieved'
        },
        {
            id: 'player_relieved',
            name: '你',
            text: '呼……還好來得及。',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'intro_level3'
        },
        {
            id: 'level2_fail',
            name: '阿斗仔',
            text: '火勢太猛了...沒關係，我們可以再試一次，市場還等著我們拯救。要再挑戰一次嗎？',
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
        
        // ========== 第三關：今天的紅磚市場 ==========
        {
            id: 'intro_level3',
            name: '阿斗仔',
            text: '現在的紅磚市場，功能和過去已經不太一樣了。雖然不再像以前那麼繁忙，但它被保存下來，成為歷史建築。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'player_reflect'
        },
        {
            id: 'player_reflect',
            name: '你',
            text: '也就是說，它的價值不只在「市場」，還在它承載的記憶。',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level3_story1'
        },
        {
            id: 'level3_story1',
            name: '阿斗仔',
            text: '沒錯。它記錄了北斗從庶民交易、地方發展，到文化保存的過程。所以這裡不只是老建築，而是一段還留在街上的歷史。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'player_understand'
        },
        {
            id: 'player_understand',
            name: '你',
            text: '我懂了。那最後要做什麼？',
            characterImage: 'assets/images/characters/non_character.png',
            next: 'level3_challenge'
        },
        {
            id: 'level3_challenge',
            name: '阿斗仔',
            text: '最後一步，幫市場裡的豆乳店完成研磨。黃豆會從四面八方跳出來，你要用篩子把它們接住，完成最純粹的豆乳。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '開始研磨！',
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
            text: '完成了。濃郁的豆乳，就像這座市場沉澱下來的記憶一樣。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'player_appreciate'
        },
        {
            id: 'player_appreciate',
            name: '你',
            text: '謝謝你帶我走這一趟。',
            characterImage: 'assets/images/characters/non_character.png',
            // ✅ 根據通關進度動態決定跳轉目標
            get next() {
                if (window.Chapter1_Teen.isAllCompleted()) {
                    return 'good_ending';
                } else {
                    return 'normal_ending';
                }
            }
        },
        {
            id: 'level3_fail',
            name: '阿斗仔',
            text: '研磨失敗了...沒關係，豆乳可以重新磨，但時間不等人。要再試一次嗎？',
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
                    // ✅ 根據通關進度動態決定跳轉目標
                    target: 'normal_ending'
                }
            ]
        },
        
        // ========== 好結局（三關全通） ==========
        {
            id: 'good_ending',
            name: '阿斗仔',
            text: '你用行動守住了這段歷史，紅磚市場謝謝你。',
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
            text: '再見了，期待下次見面！',
            characterImage: 'assets/images/characters/阿斗仔.png'
        }
    ]
};

console.log('✅ Chapter1_Teen 青少年版已載入');