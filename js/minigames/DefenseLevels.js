// js/minigames/DefenseLevels.js
// 防禦遊戲關卡設定 — 共用圖檔路徑，避免 adult/child 重複維護

(function () {
    /**
     * @param {number} level 1–3
     * @param {string} name 顯示名稱
     * @param {string} [heavyFile='enemy.png'] heavyEnemy 圖檔名
     */
    function defenseAssets(level, name, heavyFile) {
        const b = `assets/images/defense/level${level}/`;
        return {
            name: name,
            bgImage: b + 'bg.png',
            playerImage: b + 'player.png',
            enemyImage: b + 'enemy.png',
            decoyImage: b + 'stone.png',
            wrongEnemyImage: b + 'stone.png',
            heavyEnemyImage: b + (heavyFile || 'enemy.png'),
            projectileImage: b + 'projectile.png',
            projectileHitImage: b + 'projectile_hit.png',
            shieldImage: b + 'shield.png',
            aoeLineImage: b + 'aoe_line.png'
        };
    }

    const DefenseLevels = {
        1: {
            adult: Object.assign(defenseAssets(1, '肉圓滑溜戰', 'enemy.png'), {
                attackPatterns: [
                    { type: 'NORMAL', dir: 'up', wait: 3500, text: '⬆️ 肉圓' },
                    { type: 'NORMAL', dir: 'down', wait: 3500, text: '⬇️ 肉圓' },
                    { type: 'NORMAL', dir: 'left', wait: 3500, text: '⬅️ 肉圓' },
                    { type: 'NORMAL', dir: 'right', wait: 3500, text: '➡️ 肉圓' },
                    { type: 'DECOY', dir: 'up', wait: 2500, text: '🪨 石頭！別滑' },
                    { type: 'DECOY', dir: 'right', wait: 2500, text: '🪨 石頭！別滑' },
                    { type: 'MULTI', dirs: ['up', 'down'], wait: 4000, text: '⬆️⬇️ 肉圓' },
                    { type: 'MULTI', dirs: ['left', 'right'], wait: 4000, text: '⬅️➡️ 肉圓' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['left', 'right'],
                        correctDirs: ['left'],
                        wrongDirs: ['right'],
                        wait: 4000,
                        text: '⬅️肉圓｜➡️石頭'
                    },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['up', 'down'],
                        correctDirs: ['down'],
                        wrongDirs: ['up'],
                        wait: 4000,
                        text: '⬆️石頭｜⬇️肉圓'
                    },
                    { type: 'NORMAL', dir: 'up', wait: 3500, text: '⬆️ 肉圓' },
                    { type: 'NORMAL', dir: 'left', wait: 3500, text: '⬅️ 肉圓' },
                    { type: 'MULTI', dirs: ['up', 'left', 'right'], wait: 4500, text: '⬆️⬅️➡️ 肉圓' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['up', 'down', 'right'],
                        correctDirs: ['up', 'right'],
                        wrongDirs: ['down'],
                        wait: 4500,
                        text: '⬆️➡️肉圓｜⬇️石頭'
                    },
                    { type: 'END', text: '' }
                ]
            }),
            child: Object.assign(defenseAssets(1, '肉圓滑溜戰', 'enemy.png'), {
                attackPatterns: [
                    { type: 'NORMAL', dir: 'up', wait: 4500, text: '⬆️ 肉圓' },
                    { type: 'NORMAL', dir: 'down', wait: 4500, text: '⬇️ 肉圓' },
                    { type: 'NORMAL', dir: 'left', wait: 4500, text: '⬅️ 肉圓' },
                    { type: 'NORMAL', dir: 'right', wait: 4500, text: '➡️ 肉圓' },
                    { type: 'DECOY', dir: 'up', wait: 3000, text: '🪨 石頭' },
                    { type: 'MULTI', dirs: ['up', 'down'], wait: 5000, text: '⬆️⬇️ 肉圓' },
                    { type: 'MULTI', dirs: ['left', 'right'], wait: 5000, text: '⬅️➡️ 肉圓' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['left', 'right'],
                        correctDirs: ['left'],
                        wrongDirs: ['right'],
                        wait: 5000,
                        text: '⬅️肉圓｜➡️石頭'
                    },
                    { type: 'MULTI', dirs: ['up', 'left', 'right'], wait: 5500, text: '⬆️⬅️➡️ 肉圓' },
                    { type: 'END', text: '' }
                ]
            })
        },

        2: {
            adult: Object.assign(defenseAssets(2, '火災防衛戰', 'enemy.png'), {
                attackPatterns: [
                    { type: 'NORMAL', dir: 'up', wait: 3500, text: '⬆️ 火' },
                    { type: 'NORMAL', dir: 'down', wait: 3500, text: '⬇️ 火' },
                    { type: 'NORMAL', dir: 'left', wait: 3500, text: '⬅️ 火' },
                    { type: 'NORMAL', dir: 'right', wait: 3500, text: '➡️ 火' },
                    { type: 'DECOY', dir: 'down', wait: 2500, text: '🪨 石頭' },
                    { type: 'DECOY', dir: 'left', wait: 2500, text: '🪨 石頭' },
                    { type: 'MULTI', dirs: ['up', 'down'], wait: 4000, text: '⬆️⬇️ 火' },
                    { type: 'MULTI', dirs: ['left', 'right'], wait: 4000, text: '⬅️➡️ 火' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['up', 'down', 'left'],
                        correctDirs: ['up', 'left'],
                        wrongDirs: ['down'],
                        wait: 4500,
                        text: '⬆️⬅️火｜⬇️石頭'
                    },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['left', 'right', 'up'],
                        correctDirs: ['right'],
                        wrongDirs: ['left', 'up'],
                        wait: 4500,
                        text: '➡️火｜⬅️⬆️石頭'
                    },
                    { type: 'HEAVY', dir: 'up', wait: 5000, text: '🔥🔥 火牆' },
                    { type: 'HEAVY', dir: 'down', wait: 5000, text: '🔥🔥 火牆' },
                    { type: 'HEAVY', dir: 'left', wait: 5000, text: '🔥🔥 火牆' },
                    { type: 'NORMAL', dir: 'right', wait: 3500, text: '➡️ 火' },
                    { type: 'HEAVY', dir: 'right', wait: 5000, text: '🔥🔥 火牆' },
                    { type: 'MULTI', dirs: ['up', 'down', 'left', 'right'], wait: 5000, text: '⬆️⬇️⬅️➡️ 火' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['up', 'down', 'left', 'right'],
                        correctDirs: ['up', 'down'],
                        wrongDirs: ['left', 'right'],
                        wait: 5000,
                        text: '⬆️⬇️火｜⬅️➡️石頭'
                    },
                    { type: 'HEAVY', dir: 'up', wait: 5000, text: '🔥🔥 火牆' },
                    { type: 'END', text: '' }
                ]
            }),
            child: Object.assign(defenseAssets(2, '火災防衛戰', 'enemy.png'), {
                attackPatterns: [
                    { type: 'NORMAL', dir: 'up', wait: 4500, text: '⬆️ 火' },
                    { type: 'NORMAL', dir: 'down', wait: 4500, text: '⬇️ 火' },
                    { type: 'NORMAL', dir: 'left', wait: 4500, text: '⬅️ 火' },
                    { type: 'NORMAL', dir: 'right', wait: 4500, text: '➡️ 火' },
                    { type: 'DECOY', dir: 'up', wait: 3000, text: '🪨 石頭' },
                    { type: 'MULTI', dirs: ['up', 'down'], wait: 5000, text: '⬆️⬇️ 火' },
                    { type: 'MULTI', dirs: ['left', 'right'], wait: 5000, text: '⬅️➡️ 火' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['left', 'right'],
                        correctDirs: ['left'],
                        wrongDirs: ['right'],
                        wait: 5000,
                        text: '⬅️火｜➡️石頭'
                    },
                    { type: 'HEAVY', dir: 'up', wait: 6000, text: '🔥🔥 大火' },
                    { type: 'HEAVY', dir: 'down', wait: 6000, text: '🔥🔥 大火' },
                    { type: 'MULTI', dirs: ['up', 'down', 'left'], wait: 5500, text: '⬆️⬇️⬅️ 火' },
                    { type: 'END', text: '' }
                ]
            })
        },

        3: {
            adult: Object.assign(defenseAssets(3, '豆乳研磨戰', 'heavy_enemy.png'), {
                attackPatterns: [
                    { type: 'NORMAL', dir: 'up', wait: 3500, text: '⬆️ 黃豆' },
                    { type: 'NORMAL', dir: 'down', wait: 3500, text: '⬇️ 黃豆' },
                    { type: 'NORMAL', dir: 'left', wait: 3500, text: '⬅️ 黃豆' },
                    { type: 'NORMAL', dir: 'right', wait: 3500, text: '➡️ 黃豆' },
                    { type: 'DECOY', dir: 'up', wait: 2500, text: '🪨 石頭' },
                    { type: 'DECOY', dir: 'right', wait: 2500, text: '🪨 石頭' },
                    { type: 'MULTI', dirs: ['up', 'down'], wait: 4000, text: '⬆️⬇️ 黃豆' },
                    { type: 'MULTI', dirs: ['left', 'right'], wait: 4000, text: '⬅️➡️ 黃豆' },
                    { type: 'MULTI', dirs: ['up', 'down', 'left'], wait: 4500, text: '⬆️⬇️⬅️ 黃豆' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['up', 'down', 'left', 'right'],
                        correctDirs: ['up', 'left'],
                        wrongDirs: ['down', 'right'],
                        wait: 4800,
                        text: '⬆️⬅️黃豆｜⬇️➡️石頭'
                    },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['up', 'right'],
                        correctDirs: ['right'],
                        wrongDirs: ['up'],
                        wait: 4000,
                        text: '➡️黃豆｜⬆️石頭'
                    },
                    { type: 'HEAVY', dir: 'up', wait: 5000, text: '💨 蒸氣' },
                    { type: 'HEAVY', dir: 'down', wait: 5000, text: '💨 蒸氣' },
                    { type: 'HEAVY', dir: 'left', wait: 5000, text: '💨 蒸氣' },
                    { type: 'HEAVY', dir: 'right', wait: 5000, text: '💨 蒸氣' },
                    { type: 'AOE', wait: 5500, text: '🔄 旋轉' },
                    { type: 'NORMAL', dir: 'up', wait: 3500, text: '⬆️ 黃豆' },
                    { type: 'HEAVY', dir: 'down', wait: 5000, text: '💨 蒸氣' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['left', 'right'],
                        correctDirs: ['right'],
                        wrongDirs: ['left'],
                        wait: 4200,
                        text: '➡️黃豆｜⬅️石頭'
                    },
                    { type: 'AOE', wait: 5500, text: '🔄 旋轉' },
                    { type: 'HEAVY', dir: 'up', wait: 5000, text: '💨 蒸氣' },
                    { type: 'MULTI', dirs: ['up', 'down', 'left', 'right'], wait: 5000, text: '⬆️⬇️⬅️➡️ 黃豆' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['up', 'down', 'left', 'right'],
                        correctDirs: ['up', 'down', 'left'],
                        wrongDirs: ['right'],
                        wait: 5200,
                        text: '⬆️⬇️⬅️黃豆｜➡️石頭'
                    },
                    { type: 'AOE', wait: 5500, text: '🔄 旋轉' },
                    { type: 'END', text: '' }
                ]
            }),
            child: Object.assign(defenseAssets(3, '豆乳研磨戰', 'heavy_enemy.png'), {
                attackPatterns: [
                    { type: 'NORMAL', dir: 'up', wait: 4500, text: '⬆️ 黃豆' },
                    { type: 'NORMAL', dir: 'down', wait: 4500, text: '⬇️ 黃豆' },
                    { type: 'NORMAL', dir: 'left', wait: 4500, text: '⬅️ 黃豆' },
                    { type: 'NORMAL', dir: 'right', wait: 4500, text: '➡️ 黃豆' },
                    { type: 'DECOY', dir: 'up', wait: 3000, text: '🪨 石頭' },
                    { type: 'MULTI', dirs: ['up', 'down'], wait: 5000, text: '⬆️⬇️ 黃豆' },
                    { type: 'MULTI', dirs: ['left', 'right'], wait: 5000, text: '⬅️➡️ 黃豆' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['left', 'right'],
                        correctDirs: ['left'],
                        wrongDirs: ['right'],
                        wait: 5000,
                        text: '⬅️黃豆｜➡️石頭'
                    },
                    { type: 'HEAVY', dir: 'up', wait: 6000, text: '💨 蒸氣' },
                    { type: 'HEAVY', dir: 'down', wait: 6000, text: '💨 蒸氣' },
                    { type: 'AOE', wait: 6500, text: '🔄 旋轉' },
                    { type: 'MULTI', dirs: ['up', 'down', 'left'], wait: 5500, text: '⬆️⬇️⬅️ 黃豆' },
                    { type: 'HEAVY', dir: 'left', wait: 6000, text: '💨 蒸氣' },
                    { type: 'AOE', wait: 6500, text: '🔄 旋轉' },
                    { type: 'END', text: '' }
                ]
            })
        },

        99: {
            adult: {
                name: '🧪 測試關卡',
                bgImage: 'assets/images/defense/level2/bg.png',
                playerImage: 'assets/images/defense/level2/player.png',
                enemyImage: 'assets/images/defense/level2/enemy.png',
                decoyImage: 'assets/images/defense/level1/stone.png',
                wrongEnemyImage: 'assets/images/defense/level1/stone.png',
                projectileImage: 'assets/images/defense/level2/projectile.png',
                projectileHitImage: 'assets/images/defense/level2/projectile_hit.png',
                shieldImage: 'assets/images/defense/level2/shield.png',
                aoeLineImage: 'assets/images/defense/level3/aoe_line.png',
                attackPatterns: [
                    { type: 'HEAVY', dir: 'left', wait: 6000, text: '💨 蒸氣' },
                    { type: 'HEAVY', dir: 'right', wait: 6000, text: '💨 蒸氣' },
                    { type: 'AOE', wait: 6500, text: '🔄 旋轉' },
                    { type: 'AOE', wait: 6500, text: '🔄 旋轉' },
                    { type: 'NORMAL', dir: 'up', wait: 3000, text: '⬆️ 肉圓' },
                    { type: 'NORMAL', dir: 'down', wait: 3000, text: '⬇️ 肉圓' },
                    { type: 'DECOY', dir: 'up', wait: 2500, text: '🪨 石頭' },
                    { type: 'MULTI', dirs: ['up', 'down'], wait: 3500, text: '⬆️⬇️ 肉圓' },
                    {
                        type: 'MULTI_MIXED',
                        dirs: ['left', 'right'],
                        correctDirs: ['left'],
                        wrongDirs: ['right'],
                        wait: 4000,
                        text: '⬅️黃豆｜➡️石頭'
                    },
                    { type: 'END', text: '' }
                ]
            },
            child: {
                name: '🧪 測試關卡',
                bgImage: 'assets/images/defense/level1/bg.png',
                playerImage: 'assets/images/defense/level1/player.png',
                enemyImage: 'assets/images/defense/level1/enemy.png',
                projectileImage: 'assets/images/defense/level1/projectile.png',
                projectileHitImage: 'assets/images/defense/level1/projectile_hit.png',
                shieldImage: 'assets/images/defense/level1/shield.png',
                aoeLineImage: 'assets/images/defense/level1/aoe_line.png',
                attackPatterns: [
                    { type: 'NORMAL', dir: 'up', wait: 4000, text: '⬆️' },
                    { type: 'MULTI', dirs: ['up', 'down'], wait: 5000, text: '⬆️⬇️' },
                    { type: 'END', text: '' }
                ]
            }
        }
    };

    window.DefenseLevels = DefenseLevels;
})();

console.log('✅ DefenseLevels 關卡設定已載入（手機優化簡短版）');
