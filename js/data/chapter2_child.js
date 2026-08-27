// js/data/chapter2_child.js
const chapter2ChildData = {
    id: 'chapter2_child',
    background: 'assets/images/ch2/background.png',
    
    // ✅ 定義卡片圖庫資料
    cardGallery: [
            {
                id: "card1",
                thumb: "assets/images/memory/詹永豐米店.png",
                fullImage: "assets/images/memory/詹永豐米店.png",
                title: "詹永豐米店",
                summary: "大榕樹下，有一家會親自試吃米飯的老米店。",
                story: "在大榕樹旁，有一家很老的米店，已經傳到第三代了。以前店裡有很大的碾米機，工作時會有很多灰塵，是長輩辛苦工作的地方。現在雖然沒有機器了，但老闆還是會自己試吃每一種米，確定米飯吃起來很Q、放冷也好吃才會賣。店裡還有一個小小的模型，把以前的米店樣子留下來。"
            },
            {
                id: "card2",
                thumb: "assets/images/memory/其實豆製所.png",
                fullImage: "assets/images/memory/其實豆製所.png",
                title: "其實豆製所",
                summary: "在紅磚市場裡，用台灣黃豆做豆漿的店。",
                story: "紅磚市場裡有一家豆製所，會用台灣種的黃豆做出香香的豆漿、豆腐和豆花。這家店曾經休息過，後來又重新開張，讓市場變得更熱鬧，也讓大家重新認識豆子的味道。"
            },
            {
                id: "card3",
                thumb: "assets/images/memory/彰化北斗肉圓.png",
                fullImage: "assets/images/memory/彰化北斗肉圓.png",
                title: "彰化北斗肉圓",
                summary: "這裡的肉圓是三角形，而且吃起來很Q。",
                story: "一般的肉圓是圓形的，但這裡的肉圓是用手捏成三角形。做的時候會先蒸，再拿去炸，外皮會變得有點透明，吃起來很有彈性，很特別。"
            },
            {
                id: "card4",
                thumb: "assets/images/memory/正老店阿美.png",
                fullImage: "assets/images/memory/正老店阿美.png",
                title: "正老店阿美",
                summary: "一碗加了高麗菜和軟軟豬皮的古早味飯。",
                story: "這家店已經開了很久，很多人從小就吃這碗飯。高麗菜會先炒過，再慢慢煮到很入味，米飯會吸滿湯汁。上面還會放一片軟軟的豬皮、肉燥和鴨蛋，每一口都有不同的味道。"
            },
            {
                id: "card5",
                thumb: "assets/images/memory/阿在伯炸彈蔥油餅.png",
                fullImage: "assets/images/memory/阿在伯炸彈蔥油餅.png",
                title: "阿在伯炸彈蔥油餅",
                summary: "放進油鍋後會膨起來的蔥油餅。",
                story: "把麵團放進熱油裡後，餅會慢慢鼓起來，變得像氣球一樣大。外面炸得有點脆，裡面還有很多蔥，聞起來很香。"
            },
            {
                id: "card6",
                thumb: "assets/images/memory/奠安宮楊記炸物.png",
                fullImage: "assets/images/memory/奠安宮楊記炸物.png",
                title: "奠安宮楊記炸物",
                summary: "外面酥酥、裡面軟軟的炸豆腐。",
                story: "白色的豆腐放進油鍋後，外面會變成金黃色，吃起來脆脆的，但裡面還是軟軟又熱熱的，一口咬下去有兩種不同的感覺。"
            },
            {
                id: "card7",
                thumb: "assets/images/memory/碗粿.png",
                fullImage: "assets/images/memory/碗粿.png",
                title: "碗粿",
                summary: "傳統的碗粿小吃。",
                story: "用米漿做成的碗粿，口感軟軟的，配上醬油和配料，是很傳統的台灣小吃。"
            }
        ],
    
    // ✅ 儲存問答分數（用於減免次數）
    quizScore: 0,
    
    // ✅ 設定減免次數的方法
    setQuizScore: function(score) {
        this.quizScore = score;
        console.log(`📝 問答分數已儲存: ${score} 分，獲得 ${score} 次減免機會`);
    },
    
    // ✅ 獲取減免次數的方法
    getPenaltyRedemption: function() {
        return this.quizScore;
    },
    
    dialogue: [
        // ========== 開場 ==========
        {
            id: 'start',
            type: 'narration',
            text: '你剛認識紅磚市場的故事。阿斗仔說：「現在，我們來看看這裡的食物吧！」\n跟著他走進市場，\n開始新的冒險。',
            speed: 60,                   // 可選：打字速度（毫秒/字），預設 50
            next: 'show_options'
        },
        {
            id: 'show_options',
            name: '阿斗仔',
            text: '選擇一個開場',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '市場的味道',
                    action: 'goto',
                    target: 'intro'
                },
                {
                    text: '市場的人情',
                    action: 'goto',
                    target: 'intro'
                }
            ]
        },
        
        // ========== 圖文展示介紹 ==========
        {
            id: 'intro',
            name: '阿斗仔',
            text: '準備好了嗎？先來看看這些食物的圖片吧！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '先看看介紹',
                    action: 'goto',
                    target: 'show_gallery_intro',
                    gallery: null
                }
            ]
        },
        {
            id: 'show_gallery_intro',
            name: '阿斗仔',
            text: '這些圖案都記住了嗎？等一下要回答問題喔！答對越多題，遊戲會越簡單！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '好的，來回答問題！',
                    action: 'quiz',
                    questionRange: { start: 1, end: 8 },
                    questionCount: 2,
                    returnTo: 'quiz_result_menu'
                },
                {
                    text: '再看一次',
                    action: 'goto',
                    target: 'show_gallery_intro',
                    gallery: null,
                },
                {
                    text: '直接遊玩小遊戲',
                    action: 'minigame',
                    minigame: 'memory',
                    cardCount: 10,
                    gameType: 'attempts',
                    lightMode: 'red',
                    needMemorize: false,
                    totalAttempts: 20,
                    penaltyRedemption: 0,
                    returnTo: {
                        success: 'success_ending',
                        fail: 'fail_options'
                    }
                }
            ]
        },
        
        // ========== 問答結果選擇畫面 ==========
        {
            id: 'quiz_result_menu',
            name: '阿斗仔',
            characterImage: 'assets/images/characters/阿斗仔.png',
            get text() {
                const score = window.Chapter2_Child?.quizScore || 0;
                if (score === 0) {
                    return '很可惜，你沒有答對任何題目。沒有減免機會，但還是可以挑戰遊戲喔！要再試一次嗎？';
                } else if (score === 1) {
                    return '你答對了 1 題！獲得 1 次懲罰減免機會！要再回答一次爭取更多減免，還是直接開始遊戲？';
                } else {
                    return '太厲害了！你答對了 2 題！獲得 2 次懲罰減免機會！直接開始遊戲吧!';
                }
            },
            options: [
                {
                    text: '再回答一次',
                    action: 'quiz',
                    questionRange: { start: 1, end: 8 },
                    questionCount: 2,
                    returnTo: 'quiz_result_menu'
                },
                {
                    text: '開始遊戲',
                    action: 'minigame',
                    minigame: 'memory',
                    cardCount: 10,
                    gameType: 'attempts',
                    lightMode: 'red',
                    needMemorize: false,
                    totalAttempts: 20,
                    get penaltyRedemption() {
                        return window.Chapter2_Child?.getPenaltyRedemption() || 0;
                    },
                    returnTo: {
                        success: 'success_ending',
                        fail: 'fail_options'
                    }
                }
            ]
        },
        
        // ========== 成功結局 ==========
        {
            id: 'success_ending',
            name: '阿斗仔',
            text: '太棒了！你把這些記憶一一找回來了，這就是屬於你的老街故事。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'final_message'
        },
        
        // ========== 失敗選項 ==========
        {
            id: 'fail_options',
            name: '阿斗仔',
            text: '好可惜，要再挑戰一次嗎？',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '重來一次',
                    action: 'goto',
                    target: 'show_gallery_intro'
                },
                {
                    text: '結束旅程',
                    action: 'goto',
                    target: 'fail_ending'
                }
            ]
        },
        
        // ========== 失敗結局 ==========
        {
            id: 'fail_ending',
            name: '阿斗仔',
            text: '沒關係，記憶不會消失，歡迎下次再來尋找。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'final_message'
        },
        
        // ========== 最終訊息 ==========
        {
            id: 'final_message',
            name: '阿斗仔',
            text: '第二章完成了！繼續往下探索吧～',
            characterImage: 'assets/images/characters/阿斗仔.png'
        }
    ]
};

// ✅ 在載入後動態填入 gallery 資料
chapter2ChildData.dialogue.forEach(line => {
    if (line.gallery === null) {
        line.gallery = chapter2ChildData.cardGallery;
    }
    if (line.options) {
        line.options.forEach(opt => {
            if (opt.gallery === null) {
                opt.gallery = chapter2ChildData.cardGallery;
            }
        });
    }
});

// ✅ 設定變數名稱
window.Chapter2_Child = chapter2ChildData;

console.log('✅ Chapter2 兒童版已載入（卡片介紹 → 問答 → 選擇畫面 → 小遊戲）');
console.log('📦 cardGallery 共有', chapter2ChildData.cardGallery.length, '張卡片');