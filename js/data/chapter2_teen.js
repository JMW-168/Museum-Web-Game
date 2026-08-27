// js/data/chapter2_teen.js
const chapter2TeenData = {
    id: 'chapter2_teen',
    background: 'assets/images/ch2/background.png',
    
    // ✅ 定義卡片圖庫資料（6張卡片）
    cardGallery: [
            {
                id: "card1",
                thumb: "assets/images/memory/詹永豐米店.png",
                fullImage: "assets/images/memory/詹永豐米店.png",
                title: "詹永豐米店",
                summary: "創立於日治時期、以試吃選米與職人精神聞名的百年米店。",
                story: "詹永豐米店位於西門大榕樹旁，創立於日治時期，至今已傳承至第三代。早期店內設有大型碾米機，象徵著過去勞動密集的產業型態，後因環保法規拆除，改由外部碾米廠供應。儘管設備改變，店家仍堅持「實在、正直」的理念，透過親自試吃來挑選米種，強調米飯必須Q彈且冷食亦佳。第三代並創立品牌與展示模型，將家族記憶轉化為具體的文化呈現。"
            },
            {
                id: "card2",
                thumb: "assets/images/memory/其實豆製所.png",
                fullImage: "assets/images/memory/其實豆製所.png",
                title: "其實豆製所",
                summary: "以國產大豆為核心、重新活化紅磚市場的在地品牌。",
                story: "其實豆製所創立於2016年，曾短暫停業，並於2023年與在地品牌合作後重新出發。店家堅持使用國產大豆製作豆漿與豆製品，強調傳統濃郁風味的再現。其選址於具有百年歷史的紅磚市場，不僅推廣在地農業，也賦予老市場新的功能與文化意義，使其成為地方飲食文化的延續據點。"
            },
            {
                id: "card3",
                thumb: "assets/images/memory/彰化北斗肉圓.png",
                fullImage: "assets/images/memory/彰化北斗肉圓.png",
                title: "彰化北斗肉圓",
                summary: "以三角錐造型與先蒸後炸工法著稱的在地肉圓。",
                story: "彰化北斗肉圓位於奠安宮周邊，其特色在於手工捏製的三角錐外型，與一般圓形肉圓有所區別。製作上採用先蒸再炸的傳統工序，使外皮呈現半透明狀，並保有高度的彈性與嚼勁。這種外型與口感的結合，成為當地極具代表性的飲食特色。"
            },
            {
                id: "card4",
                thumb: "assets/images/memory/正老店阿美.png",
                fullImage: "assets/images/memory/正老店阿美.png",
                title: "正老店阿美",
                summary: "傳承三代、以濕潤口感與豬皮為特色的在地經典主食。",
                story: "正老店阿美位於奠安宮周邊，營業超過50年，已傳承至第三代。其招牌高麗菜飯透過爆炒與慢火燉煮，使高麗菜釋放甜味並滲入米飯，形成微濕潤的口感。搭配滷製軟嫩的豬皮、肉燥與鴨蛋，構成層次豐富的風味組合。此種將湯汁與食材融合於米飯中的作法，反映北斗在地飲食的樸實與日常性。"
            },
            {
                id: "card5",
                thumb: "assets/images/memory/阿在伯炸彈蔥油餅.png",
                fullImage: "assets/images/memory/阿在伯炸彈蔥油餅.png",
                title: "阿在伯炸彈蔥油餅",
                summary: "以油炸膨脹效果為特色的廟口視覺型小吃。",
                story: "阿在伯炸彈蔥油餅位於奠安宮美食廣場，其最大特色是在高溫油炸過程中，麵皮會迅速膨脹，形成如氣球般的外觀。外層經油炸後略帶酥脆，內部則保有柔軟口感並包覆青蔥香氣。此種強烈的視覺變化，使其成為具有辨識度的街邊小吃。"
            },
            {
                id: "card6",
                thumb: "assets/images/memory/奠安宮楊記炸物.png",
                fullImage: "assets/images/memory/奠安宮楊記炸物.png",
                title: "奠安宮楊記炸物",
                summary: "以外酥內嫩對比口感為特色的傳統炸豆腐。",
                story: "奠安宮楊記炸物位於廟口周邊，主打將白豆腐經高溫油炸，使外層形成酥脆的金黃色外皮，而內部仍保有原本的柔軟與水分。這種外酥內嫩的口感對比，是其吸引人的關鍵，也體現傳統街邊炸物的製作特色。"
            },
            {
                id: "card7",
                thumb: "assets/images/memory/碗粿.png",
                fullImage: "assets/images/memory/碗粿.png",
                title: "碗粿",
                summary: "...",
                story: "..."
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
        // 答對 1 題 → 1 次減免，答對 2 題 → 2 次減免
        return this.quizScore;
    },
    
    dialogue: [
        // ========== 開場 ==========
        {
            id: 'start',
            type: 'narration',
            text: '你走過紅磚市場的過去，從最早的臨時市場與牛墟，到火災帶來的轉折，再到被保存下來的今日樣貌。\n阿斗仔停下腳步，看向市場深處： \n「但這裡的故事，不只停在歷史。」\n攤位之間仍有人來人往， 空氣裡混著米香、豆香與剛出鍋的熱氣。',
            speed: 60,
            next: 'after_narration_1'
        },
        {
            id: 'after_narration_1',
            type: 'narration',
            text: '「真正的故事，其實藏在這些食物裡。」\n\n接下來，你將走進市場的每一個角落， \n從一間店、一種味道開始，\n 認識這座市場現在正在發生的事。',
            speed: 60,
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
            text: '準備好了嗎?',
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
            text: '這些圖案都記住了嗎？在開始遊戲之前，先來回答幾個問題吧！\n答對越多題，遊戲中的懲罰減免次數越多喔！',
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
                    cardCount: 14,
                    gameType: 'time',
                    time: 60,
                    lightMode: 'both',
                    needMemorize: true,
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
                const score = window.Chapter2_Teen?.quizScore || 0;
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
                    cardCount: 14,
                    gameType: 'time',
                    time: 60,
                    lightMode: 'both',
                    needMemorize: true,
                    get penaltyRedemption() {
                        return window.Chapter2_Teen?.getPenaltyRedemption() || 0;
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
            text: '你把這些記憶一一找回來了，這就是屬於你的老街故事。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            next: 'final_message'
        },
        
        // ========== 失敗選項 ==========
        {
            id: 'fail_options',
            name: '阿斗仔',
            text: '好可惜，要再挑戰一次嗎?',
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

// ✅ 在載入後動態填入 gallery 資料（避免引用錯誤）
chapter2TeenData.dialogue.forEach(line => {
    if (line.gallery === null) {
        line.gallery = chapter2TeenData.cardGallery;
    }
    if (line.options) {
        line.options.forEach(opt => {
            if (opt.gallery === null) {
                opt.gallery = chapter2TeenData.cardGallery;
            }
        });
    }
});

// ✅ 同時設定兩個變數名稱，確保 main.js 能找到
window.Chapter2_Teen = chapter2TeenData;

console.log('✅ Chapter2 青少年版已載入（卡片介紹 → 問答 → 選擇畫面 → 小遊戲）');
console.log('📦 cardGallery 共有', chapter2TeenData.cardGallery.length, '張卡片');