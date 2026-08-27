// js/data/minigameAssets.js
// 小遊戲資源清單（單一來源，供預載入與記憶牌面對應）

(function () {
    const MEMORY_CARD_URLS = [
        'assets/images/memory/詹永豐米店.png',
        'assets/images/memory/其實豆製所.png',
        'assets/images/memory/彰化北斗肉圓.png',
        'assets/images/memory/正老店阿美.png',
        'assets/images/memory/阿在伯炸彈蔥油餅.png',
        'assets/images/memory/奠安宮楊記炸物.png',
        'assets/images/memory/碗粿.png'
    ];

    /** 與 MemoryGameV2 卡片符號對應（有圖片的符號） */
    const MEMORY_EMOJI_TO_IMAGE = {
        '🫘': 'assets/images/memory/詹永豐米店.png',
        '🥛': 'assets/images/memory/其實豆製所.png',
        '🍮': 'assets/images/memory/彰化北斗肉圓.png',
        '🧈': 'assets/images/memory/正老店阿美.png',
        '🥢': 'assets/images/memory/阿在伯炸彈蔥油餅.png',
        '🍜': 'assets/images/memory/奠安宮楊記炸物.png',
        '🌱': 'assets/images/memory/碗粿.png'
    };

    function defenseLevelUrls(levelNum) {
        const base = `assets/images/defense/level${levelNum}/`;
        const files = [
            'bg.png',
            'player.png',
            'enemy.png',
            'stone.png',
            'projectile.png',
            'projectile_hit.png',
            'shield.png',
            'aoe_line.png'
        ];
        if (levelNum >= 2) files.push('heavy_enemy.png');
        return files.map((f) => base + f);
    }

    window.MinigameAssets = {
        memoryCardImageUrls: MEMORY_CARD_URLS.slice(),
        memoryEmojiToImageUrl: Object.assign({}, MEMORY_EMOJI_TO_IMAGE),

        getMemoryPreloadUrls: function () {
            return MEMORY_CARD_URLS.slice();
        },

        /** 防禦遊戲預載：一次載入 1–3 關所需圖檔 */
        getDefensePreloadUrls: function () {
            const out = [];
            for (let L = 1; L <= 3; L++) {
                out.push(...defenseLevelUrls(L));
            }
            return [...new Set(out)];
        }
    };
})();
