// js/data/chapter3_child.js
const chapter3ChildData = {
    id: 'chapter3_child',
    background: 'assets/images/ch3/kitchen.png',
    
    // 玩家名稱
    playerName: '小旅人',
    
    // 錢袋系統
    money: 20,
    
    // 店鋪完成狀態
    shopStatus: {
        herbal: false,
        knife: false,
        grocery: false
    },
    
    // 各店鋪花費
    shopCost: {
        herbal: 5,
        knife: 5,
        grocery: 4
    },
    
    setPlayerName: function(name) {
        this.playerName = name || '小旅人';
        console.log(`📝 玩家名稱: ${this.playerName}`);
    },
    
    // 取得剩餘錢袋
    getMoney: function() {
        return this.money;
    },
    
    // 檢查是否足夠扣款
    canAfford: function(shopId) {
        const cost = this.shopCost[shopId];
        return this.money >= cost;
    },
    
    // 觸發畫面更新
    triggerMoneyUpdate: function() {
        const event = new CustomEvent('moneyUpdate', { detail: { money: this.money } });
        window.dispatchEvent(event);
        console.log(`💰 觸發畫面更新，目前銅板: ${this.money}`);
    },
    
    // 扣款
    deductMoney: function(shopId) {
        const cost = this.shopCost[shopId];
        if (this.money >= cost) {
            this.money -= cost;
            console.log(`💰 支付 ${cost} 銅板，剩餘 ${this.money} 銅板`);
            this.triggerMoneyUpdate();
            return true;
        }
        console.log(`💰 銅板不足！需要 ${cost}，剩餘 ${this.money}`);
        return false;
    },
    
    // 標記店鋪完成
    markShopComplete: function(shopId) {
        if (!this.canAfford(shopId)) {
            console.log(`💰 無法完成 ${shopId}，銅板不足！`);
            return false;
        }
        this.deductMoney(shopId);
        this.shopStatus[shopId] = true;
        console.log(`✅ ${shopId} 完成，購物清單已更新`);
        return true;
    },
    
    // 檢查是否全部完成
    isAllComplete: function() {
        return this.shopStatus.herbal && this.shopStatus.knife && this.shopStatus.grocery;
    },
    
    dialogue: [
        // ========== 命名畫面 ==========
        {
            id: 'start',
            type: 'naming',
            title: '小朋友，你叫什麼名字啊？',
            characterImage: 'assets/images/characters/mom.png',
            next: 'after_naming'
        },
        
        {
            id: 'after_naming',
            name: '媽媽',
            text: function() {
                const name = window.Chapter3_Child?.playerName || '小旅人';
                return `${name}！好可愛的名字！來，媽媽有事要拜託你……`;
            },
            characterImage: 'assets/images/characters/mom.png',
            next: 'opening'
        },
        
        // ========== 序幕 ==========
        {
            id: 'opening',
            name: '媽媽',
            text: '今年蘇王爺聖誕，咱們村要辦呷客！媽媽要煮高麗菜飯，你去幫我買幾樣東西！',
            characterImage: 'assets/images/characters/mom.png',
            next: 'player_ask'
        },
        
        {
            id: 'player_ask',
            name: function() {
                return window.Chapter3_Child?.playerName || '小旅人';
            },
            text: '要買什麼？',
            next: 'mom_tell'
        },
        
        {
            id: 'mom_tell',
            name: '媽媽',
            text: '去中藥行買八角和黑胡椒，去雜貨店買乾香菇，還有把菜刀帶去刀行磨一磨！',
            characterImage: 'assets/images/characters/mom.png',
            next: 'give_money'
        },
        
        {
            id: 'give_money',
            name: '媽媽',
            text: function() {
                const name = window.Chapter3_Child?.playerName || '小旅人';
                return `${name}，這是給你的錢袋（20枚銅板），要收好喔！`;
            },
            characterImage: 'assets/images/characters/mom.png',
            next: 'player_confirm'
        },
        
        {
            id: 'player_confirm',
            name: function() {
                return window.Chapter3_Child?.playerName || '小旅人';
            },
            text: '好，我記住了！',
            next: 'collection_intro'
        },
        
        // ========== 地圖收集模式 ==========
        {
            id: 'collection_intro',
            name: '阿斗仔',
            text: '呷客辦桌需要準備食材和工具，我們去市場逛逛吧！',
            characterImage: 'assets/images/characters/阿斗仔.png',
            options: [
                {
                    text: '出發囉！',
                    action: 'collection',
                    collectionConfig: {
                        background: 'assets/images/ch3/map.png',
                        items: [
                            {
                                name: '八角 & 黑胡椒',
                                shadowImage: 'assets/images/ch3/items/herbal_black.png',
                                colorImage: 'assets/images/ch3/items/herbal.png'
                            },
                            {
                                name: '磨利的菜刀',
                                shadowImage: 'assets/images/ch3/items/knife_black.png',
                                colorImage: 'assets/images/ch3/items/knife.png'
                            },
                            {
                                name: '乾香菇',
                                shadowImage: 'assets/images/ch3/items/mushroom_black.png',
                                colorImage: 'assets/images/ch3/items/mushroom.png'
                            }
                        ],
                        hotspots: [
                            // ========== 中藥行 ==========
                            {
                                x: 20,
                                y: 55,
                                shopId: 'herbal',
                                shopName: '中藥行',
                                dialogue: {
                                    name: '中藥行老闆',
                                    text: '哦！要買八角和黑胡椒啊？來，我幫你找找看！你知道它們長什麼樣子嗎？',
                                    characterImage: 'assets/images/characters/herbal_owner.png',
                                    background: 'assets/images/ch3/shop_herbal.png',
                                    options: [
                                        {
                                            text: '🔍 開始尋找香料',
                                            action: 'start_game'
                                        }
                                    ]
                                },
                                successDialogue: [
                                    {
                                        name: '中藥行老闆',
                                        text: '找對了！你好厲害！',
                                        characterImage: 'assets/images/characters/herbal_owner.png',
                                        background: 'assets/images/ch3/shop_herbal.png'
                                    },
                                    {
                                        name: '中藥行老闆',
                                        text: '八角和黑胡椒長得不一樣，下次你就認得啦！',
                                        characterImage: 'assets/images/characters/herbal_owner.png',
                                        background: 'assets/images/ch3/shop_herbal.png'
                                    },
                                    {
                                        name: '中藥行老闆',
                                        text: '拿回去給媽媽煮高麗菜飯，一定會很好吃！',
                                        characterImage: 'assets/images/characters/herbal_owner.png',
                                        background: 'assets/images/ch3/shop_herbal.png'
                                    }
                                ],
                                gameConfig: {
                                    mode: 'matching',
                                    title: '🏮 中藥行 · 找香料',
                                    hint: '把八角(星形)和黑胡椒(黑色顆粒)拖到購物籃裡！\n💡 點擊物品可查看介紹',
                                    totalMatches: 2,
                                    items: [
                                        {
                                            id: 'star_anise',
                                            name: '八角',
                                            image: 'assets/images/ch3/game/star_anise.png',
                                            description: '星形褐色果實，香香的',
                                            correctZone: 'basket',
                                            knowledgeCard: {
                                                title: '八角',
                                                description: '星星形狀的香料',
                                                detail: '八角長得像星星，加在飯裡面會很香喔！'
                                            }
                                        },
                                        {
                                            id: 'black_pepper',
                                            name: '黑胡椒',
                                            image: 'assets/images/ch3/game/black_pepper.png',
                                            description: '黑色小顆粒，辣辣的',
                                            correctZone: 'basket',
                                            knowledgeCard: {
                                                title: '黑胡椒',
                                                description: '黑色的小顆粒',
                                                detail: '黑胡椒吃起來會辣辣的，可以讓食物更有味道！'
                                            }
                                        },
                                        {
                                            id: 'white_pepper',
                                            name: '白胡椒',
                                            image: 'assets/images/ch3/game/white_pepper.png',
                                            description: '白色小顆粒',
                                            correctZone: 'wrong',
                                            knowledgeCard: {
                                                title: '白胡椒',
                                                description: '白色的小顆粒',
                                                detail: '白胡椒顏色比較白，味道比較溫和。'
                                            }
                                        },
                                        {
                                            id: 'sichuan_pepper',
                                            name: '花椒',
                                            image: 'assets/images/ch3/game/sichuan_pepper.png',
                                            description: '紅色小顆粒，麻麻的',
                                            correctZone: 'wrong',
                                            knowledgeCard: {
                                                title: '花椒',
                                                description: '紅色的小顆粒',
                                                detail: '花椒吃起來麻麻的，會讓舌頭感覺刺刺的。'
                                            }
                                        }
                                    ],
                                    zones: [
                                        {
                                            id: 'basket',
                                            name: '🛒 購物籃',
                                            hint: '把正確香料拖到這裡',
                                            expectedItem: null
                                        }
                                    ]
                                }
                            },
                            // ========== 刀行 ==========
                            {
                                x: 50,
                                y: 55,
                                shopId: 'knife',
                                shopName: '刀行',
                                dialogue: {
                                    name: '刀行師傅',
                                    text: '來看看……菜刀鈍了。磨刀有順序喔，你來幫我排排看！',
                                    characterImage: 'assets/images/characters/knife_smith.png',
                                    background: 'assets/images/ch3/shop_knife.png',
                                    options: [
                                        {
                                            text: '🔪 開始磨刀',
                                            action: 'start_game'
                                        }
                                    ]
                                },
                                successDialogue: [
                                    {
                                        name: '刀行師傅',
                                        text: '順序正確！磨好了！',
                                        characterImage: 'assets/images/characters/knife_smith.png',
                                        background: 'assets/images/ch3/shop_knife.png'
                                    },
                                    {
                                        name: '刀行師傅',
                                        text: '要先粗磨石，再細磨石，最後用報紙試試看有沒有利！',
                                        characterImage: 'assets/images/characters/knife_smith.png',
                                        background: 'assets/images/ch3/shop_knife.png'
                                    },
                                    {
                                        name: '刀行師傅',
                                        text: '下次菜刀鈍了，再拿來給師傅磨喔！',
                                        characterImage: 'assets/images/characters/knife_smith.png',
                                        background: 'assets/images/ch3/shop_knife.png'
                                    }
                                ],
                                gameConfig: {
                                    mode: 'sorting',
                                    title: '🔪 刀行 · 磨刀順序',
                                    hint: '將工具按正確順序排好！粗磨石 → 細磨石 → 報紙\n💡 點擊物品可查看介紹',
                                    totalMatches: 3,
                                    correctOrder: ['coarse_stone', 'fine_stone', 'newspaper'],
                                    items: [
                                        {
                                            id: 'coarse_stone',
                                            name: '粗磨石',
                                            image: 'assets/images/ch3/game/coarse_stone.png',
                                            description: '粗粗的石頭',
                                            knowledgeCard: {
                                                title: '粗磨石',
                                                description: '粗粗的石頭',
                                                detail: '先用粗磨石把菜刀磨平！'
                                            }
                                        },
                                        {
                                            id: 'fine_stone',
                                            name: '細磨石',
                                            image: 'assets/images/ch3/game/fine_stone.png',
                                            description: '細細的石頭',
                                            knowledgeCard: {
                                                title: '細磨石',
                                                description: '細細的石頭',
                                                detail: '再用細磨石讓菜刀變利！'
                                            }
                                        },
                                        {
                                            id: 'newspaper',
                                            name: '報紙',
                                            image: 'assets/images/ch3/game/newspaper.png',
                                            description: '報紙',
                                            knowledgeCard: {
                                                title: '報紙',
                                                description: '用來測試刀子',
                                                detail: '最後用報紙測試刀子有沒有利！'
                                            }
                                        }
                                    ],
                                    zones: [
                                        {
                                            id: 'step1',
                                            name: '步驟 ①',
                                            hint: '第一步',
                                            sortPosition: 0
                                        },
                                        {
                                            id: 'step2',
                                            name: '步驟 ②',
                                            hint: '第二步',
                                            sortPosition: 1
                                        },
                                        {
                                            id: 'step3',
                                            name: '步驟 ③',
                                            hint: '第三步',
                                            sortPosition: 2
                                        }
                                    ]
                                }
                            },
                            // ========== 雜貨店 ==========
                            {
                                x: 80,
                                y: 55,
                                shopId: 'grocery',
                                shopName: '雜貨店',
                                dialogue: {
                                    name: '雜貨店老闆娘',
                                    text: '乾香菇有分等級喔！你來幫我分類，哪些適合煮湯，哪些適合煮飯！',
                                    characterImage: 'assets/images/characters/grocery_owner.png',
                                    background: 'assets/images/ch3/shop_grocery.png',
                                    options: [
                                        {
                                            text: '🍄 開始分類香菇',
                                            action: 'start_game'
                                        }
                                    ]
                                },
                                successDialogue: [
                                    {
                                        name: '雜貨店老闆娘',
                                        text: '分對了！你好聰明！',
                                        characterImage: 'assets/images/characters/grocery_owner.png',
                                        background: 'assets/images/ch3/shop_grocery.png'
                                    },
                                    {
                                        name: '雜貨店老闆娘',
                                        text: '厚香菇煮湯，薄香菇炒飯，記住了嗎？',
                                        characterImage: 'assets/images/characters/grocery_owner.png',
                                        background: 'assets/images/ch3/shop_grocery.png'
                                    },
                                    {
                                        name: '雜貨店老闆娘',
                                        text: '拿回去給媽媽，她一定會稱讚你的！',
                                        characterImage: 'assets/images/characters/grocery_owner.png',
                                        background: 'assets/images/ch3/shop_grocery.png'
                                    }
                                ],
                                gameConfig: {
                                    mode: 'classifying',
                                    title: '🍄 雜貨店 · 香菇分類',
                                    hint: '將香菇拖到正確的分類框裡！\n💡 點擊物品可查看介紹',
                                    totalMatches: 3,
                                    items: [
                                        {
                                            id: 'thick_mushroom',
                                            name: '厚菇 (花菇)',
                                            image: 'assets/images/ch3/game/thick_mushroom.png',
                                            description: '厚厚的香菇，香香的',
                                            correctZone: 'soup',
                                            knowledgeCard: {
                                                title: '厚菇',
                                                description: '厚厚的香菇',
                                                detail: '厚厚的香菇煮湯最適合！'
                                            }
                                        },
                                        {
                                            id: 'thin_mushroom',
                                            name: '薄菇',
                                            image: 'assets/images/ch3/game/thin_mushroom.png',
                                            description: '薄薄的香菇',
                                            correctZone: 'rice',
                                            knowledgeCard: {
                                                title: '薄菇',
                                                description: '薄薄的香菇',
                                                detail: '薄薄的香菇炒飯很好吃！'
                                            }
                                        },
                                        {
                                            id: 'broken_mushroom',
                                            name: '香菇碎',
                                            image: 'assets/images/ch3/game/broken_mushroom.png',
                                            description: '碎碎的香菇',
                                            correctZone: 'rice',
                                            knowledgeCard: {
                                                title: '香菇碎',
                                                description: '碎碎的香菇',
                                                detail: '碎碎的香菇可以拌在飯裡面！'
                                            }
                                        }
                                    ],
                                    zones: [
                                        {
                                            id: 'soup',
                                            name: '🍲 煮湯用',
                                            hint: '適合煮湯的香菇',
                                            expectedItem: 'thick_mushroom'
                                        },
                                        {
                                            id: 'rice',
                                            name: '🍚 煮飯菜用',
                                            hint: '適合煮飯的香菇',
                                            expectedItem: null
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                    returnTo: 'check_complete'
                }
            ]
        },
        
        // ========== 檢查完成狀態 ==========
        {
            id: 'check_complete',
            name: '阿斗仔',
            text:'東西都買齊了！我們去廟裡找媽媽吧！',
            // text: function() {
            //     const allComplete = window.Chapter3_Teen?.isAllComplete();
            //     if (allComplete) {
            //         return '東西都買齊了！我們回去找媽媽吧！';
            //     } else {
            //         return '還有東西沒買完，再去逛逛吧！';
            //     }
            // },
            characterImage: 'assets/images/characters/阿斗仔.png',
            background: 'assets/images/ch3/kitchen.png',
            // options: function() {
            //     const allComplete = window.Chapter3_Teen?.isAllComplete();
            //     if (allComplete) {
            //         return [{ text: '回去找媽媽', action: 'goto', target: 'ending' }];
            //     } else {
            //         return [{ text: '繼續逛逛', action: 'goto', target: 'collection_intro' }];
            //     }
            // }
        },
        
        // ========== 結局 ==========
        {
            id: 'ending',
            name: '媽媽',
            text: function() {
                const name = window.Chapter3_Child?.playerName || '小旅人';
                return `${name}！都買回來了！你好棒！準備開灶，感謝蘇王爺，感謝今年沒有水患，大家平安！`;
            },
            characterImage: 'assets/images/characters/mom.png',
            background: 'assets/images/ch3/temple.png',
            next: 'final_message'
        },
        
        {
            id: 'final_message',
            name: '阿斗仔',
            text: '因為辦桌，香料帶旺了中藥行；因為辦桌，刀行師傅幫大家磨刀；因為辦桌，雜貨店的乾貨一掃而空。一場呷客，串起了整條街的生計，這就是北斗紅磚市場商街的故事。',
            characterImage: 'assets/images/characters/阿斗仔.png',
            background: 'assets/images/ch3/temple.png',
        }
    ]
};

window.Chapter3_Child = chapter3ChildData;
console.log('✅ Chapter3 兒童版已載入（呷客辦桌 - 簡單版）');