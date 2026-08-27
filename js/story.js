// js/story.js
const storyData = {
    "scene1": {
        "bg": "assets/images/market.jpg",
        "dialogue": [
            { "name": "時光導師", "text": "歡迎來到紅磚市場，你需要我的幫助嗎？" },
            { "name": "玩家", "text": "這是我今天的任務。", "options": [
                { "text": "我準備好了", "next": "minigame" },
                { "text": "再等一下", "next": "scene1" }
            ]}
        ]
    }
};