// js/data/quizQuestions.js
// 問答題庫 - 支援隨機抽題、題號範圍控制

const QuizQuestions = {
    // 題庫列表
    questions: [
        {
            id: 1,
            text: "紅磚市場最早是什麼型態的市集？",
            options: [
                { text: "牛墟和臨時市場", correct: true },
                { text: "百貨公司", correct: false },
                { text: "超級市場", correct: false },
                { text: "漁市場", correct: false }
            ],
            explanation: "紅磚市場最早是牛墟和臨時市集，農民會來這裡交易牛隻和農產品。"
        },
        {
            id: 2,
            text: "紅磚市場曾經歷過什麼重大災害？",
            options: [
                { text: "地震", correct: false },
                { text: "火災", correct: true },
                { text: "水災", correct: false },
                { text: "颱風", correct: false }
            ],
            explanation: "紅磚市場曾經發生過大火，燒毀了部分建築，後來經過重建才恢復。"
        },
        {
            id: 3,
            text: "詹永豐米店的老闆用什麼方式來確保米飯好吃？",
            options: [
                { text: "只看包裝", correct: false },
                { text: "親自試吃", correct: true },
                { text: "問客人意見", correct: false },
                { text: "看米的外觀", correct: false }
            ],
            explanation: "詹永豐米店的老闆會親自試吃每一種米，確認米飯Q彈好吃才賣。"
        },
        {
            id: 4,
            text: "其實豆製所主要使用什麼原料製作豆製品？",
            options: [
                { text: "進口黃豆", correct: false },
                { text: "國產大豆", correct: true },
                { text: "黑豆", correct: false },
                { text: "綠豆", correct: false }
            ],
            explanation: "其實豆製所堅持使用台灣國產大豆，強調傳統濃郁風味。"
        },
        {
            id: 5,
            text: "北斗肉圓的外型是什麼形狀？",
            options: [
                { text: "圓形", correct: false },
                { text: "方形", correct: false },
                { text: "三角形", correct: true },
                { text: "橢圓形", correct: false }
            ],
            explanation: "北斗肉圓是手工捏製的三角錐形狀，與一般圓形肉圓不同。"
        },
        {
            id: 6,
            text: "正老店阿美的招牌飯是什麼？",
            options: [
                { text: "滷肉飯", correct: false },
                { text: "雞肉飯", correct: false },
                { text: "高麗菜飯", correct: true },
                { text: "炒飯", correct: false }
            ],
            explanation: "正老店阿美的招牌是高麗菜飯，搭配軟嫩的豬皮和鴨蛋。"
        },
        {
            id: 7,
            text: "阿在伯炸彈蔥油餅在油炸過程中有什麼特色？",
            options: [
                { text: "會變黑", correct: false },
                { text: "會膨脹變大", correct: true },
                { text: "會冒煙", correct: false },
                { text: "會結塊", correct: false }
            ],
            explanation: "蔥油餅在高溫油炸時會迅速膨脹，形成如氣球般的外觀。"
        },
        {
            id: 8,
            text: "奠安宮楊記炸物的豆腐有什麼口感特色？",
            options: [
                { text: "外酥內嫩", correct: true },
                { text: "整塊都軟", correct: false },
                { text: "整塊都硬", correct: false },
                { text: "外軟內硬", correct: false }
            ],
            explanation: "炸豆腐外層酥脆金黃，內部仍保有柔軟水分，形成外酥內嫩的口感。"
        }
    ],
    
    // 根據題號範圍取得題目（隨機抽指定數量）
    getRandomQuestions: function(startId, endId, count) {
        const filtered = this.questions.filter(q => q.id >= startId && q.id <= endId);
        
        if (filtered.length === 0) return [];
        
        const shuffled = [...filtered];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled.slice(0, count);
    },
    
    // 取得正確答案文字
    getCorrectAnswerText: function(question) {
        const correct = question.options.find(opt => opt.correct === true);
        return correct ? correct.text : "";
    }
};

window.QuizQuestions = QuizQuestions;
console.log('✅ 問答題庫已載入，共', QuizQuestions.questions.length, '題');