// js/minigames/defense/DefenseAttackRunner.js
// 攻擊序列與結束流程（由 DefenseGameV2 合併）

window.DefenseAttackRunnerMixin = {
    startAttackSequence: function () {
        if (!this.gameActive) return;
        this.attackQueue = this.levelConfig.attackPatterns.map((attack) => {
            const copy = { ...attack };
            if (attack.dirs) copy.dirs = [...attack.dirs];
            if (attack.correctDirs) copy.correctDirs = [...attack.correctDirs];
            if (attack.wrongDirs) copy.wrongDirs = [...attack.wrongDirs];
            copy.resolved = false;
            return copy;
        });
        this.processNextAttack();
    },

    processNextAttack: function () {
        console.log('processNextAttack 被呼叫, 當前狀態:', this.state);

        if (!this.gameActive || this.attackQueue.length === 0) {
            if (this.attackQueue.length === 0 && this.state !== this.states.RESULT) {
                this.setState(this.states.RESULT);
                this.showFinalResult();
            }
            return;
        }

        if (this.state !== this.states.IDLE) {
            console.log(`狀態不是 IDLE (${this.state})，等待...`);
            const session = this.sessionId;
            setTimeout(() => {
                if (session !== this.sessionId) return;
                this.processNextAttack();
            }, 100);
            return;
        }

        const attack = this.attackQueue.shift();
        this.currentAttack = attack;

        this.setState(this.states.PREPARING);
        this.msg.innerText = attack.text;

        const prepareTime = Math.max(300, Math.min(800, this.getCurrentGap() / 2));

        const session = this.sessionId;
        setTimeout(() => {
            if (session !== this.sessionId) return;
            this.executeAttack(attack);
        }, prepareTime);
    },

    executeAttack: function (attack) {
        console.log('executeAttack 開始，類型:', attack.type);

        const currentSession = this.sessionId;

        this.clearAllTimers();

        this.clearHeavySequence();
        this.clearHeavyProjectiles();
        this.clearEnemies();
        this.clearProjectiles();

        switch (attack.type) {
            case 'END':
                console.log('遊戲結束，準備結算');
                this.setState(this.states.RESULT);
                setTimeout(() => {
                    this.showFinalResult();
                }, 500);
                break;

            case 'NORMAL':
                this.setState(this.states.NORMAL);
                this.spawnEnemy(attack.dir);

                const normalTimer = setTimeout(() => {
                    if (this.sessionId !== currentSession) return;
                    if (this.state === this.states.NORMAL && this.currentAttack && !this.currentAttack.resolved) {
                        console.log(`⏰ NORMAL 攻擊超時！方向: ${attack.dir}`);

                        this.addScore(this.scoreTable.TIME_OUT_PENALTY);
                        console.log(`❌ 未接住敵人，扣 ${Math.abs(this.scoreTable.TIME_OUT_PENALTY)} 分`);

                        this.missAttack('時間到！未接住敵人');
                        this.finishAttack();
                    }
                }, attack.wait);
                this.timers.push(normalTimer);
                this.currentAttack.timer = normalTimer;
                break;

            case 'MULTI':
                this.setState(this.states.MULTI);
                this.currentAttack.hits = 0;
                this.currentAttack.swipedDirs = [];
                this.currentAttack.totalDirs = attack.dirs.length;
                attack.dirs.forEach((dir) => this.spawnEnemy(dir));

                this.currentAttack.multiTimeout = setTimeout(() => {
                    if (this.state === this.states.MULTI && this.currentAttack && !this.currentAttack.resolved) {
                        const notSwiped = this.currentAttack.dirs.filter(
                            (d) => !this.currentAttack.swipedDirs.includes(d)
                        );
                        console.log(`⏰ 超時！未滑動方向: ${notSwiped.join(', ')}`);

                        const remainingCount = notSwiped.length;
                        if (remainingCount > 0) {
                            const penalty = remainingCount * Math.abs(this.scoreTable.TIME_OUT_PENALTY);
                            this.addScore(-penalty);
                            console.log(`❌ 剩餘 ${remainingCount} 個敵人未處理，扣 ${penalty} 分`);
                        }

                        this.missAttack(`未完成所有方向！遺漏: ${notSwiped.join(', ')}`);
                        this.finishAttack();
                    }
                }, attack.wait);
                this.timers.push(this.currentAttack.multiTimeout);
                break;

            case 'HEAVY':
                this.setState(this.states.HEAVY_CHARGING);
                this.spawnHeavySequence(attack.dir);
                break;

            case 'AOE':
                this.setState(this.states.AOE_ACTIVE);
                this.startAOE(attack.wait);
                break;

            case 'DECOY':
                this.setState(this.states.DECOY);
                this.spawnEnemy(attack.dir, true, false);

                this.currentAttack.decoyTimeout = setTimeout(() => {
                    if (this.state === this.states.DECOY && this.currentAttack && !this.currentAttack.resolved) {
                        console.log('✅ DECOY 成功！沒有滑動石頭');
                        this.currentAttack.resolved = true;
                        this.addScore(this.scoreTable.DECOY_SUCCESS);
                        this.finishAttack();
                    }
                }, attack.wait);
                this.timers.push(this.currentAttack.decoyTimeout);
                break;

            case 'MULTI_MIXED':
                this.setState(this.states.MULTI_MIXED);
                this.currentAttack.hits = 0;
                this.currentAttack.swipedDirs = [];
                this.currentAttack.correctDirs = attack.correctDirs || [];
                this.currentAttack.wrongDirsList = attack.wrongDirs || [];
                this.currentAttack.totalDirs = attack.dirs.length;

                this.currentAttack.wrongHandled = [];

                attack.dirs.forEach((dir) => {
                    const isWrong = this.currentAttack.wrongDirsList.includes(dir);
                    this.spawnEnemy(dir, false, isWrong);
                });

                this.currentAttack.multiTimeout = setTimeout(() => {
                    if (this.state === this.states.MULTI_MIXED && this.currentAttack && !this.currentAttack.resolved) {
                        const notSwipedCorrect = this.currentAttack.correctDirs.filter(
                            (d) => !this.currentAttack.swipedDirs.includes(d)
                        );

                        const notSwipedWrong = this.currentAttack.wrongDirsList.filter(
                            (d) => !this.currentAttack.swipedDirs.includes(d)
                        );

                        console.log(`⏰ 超時！未滑到的正確方向: ${notSwipedCorrect.join(', ')}`);
                        console.log(`✅ 成功閃避的錯誤方向: ${notSwipedWrong.join(', ')}`);

                        if (notSwipedWrong.length > 0) {
                            const bonusScore = notSwipedWrong.length * this.scoreTable.MIXED_AVOID;
                            this.addScore(bonusScore);
                            console.log(`✨ 成功閃避 ${notSwipedWrong.length} 個石頭，獲得 ${bonusScore} 分！`);
                        }

                        if (notSwipedCorrect.length > 0) {
                            const penalty = notSwipedCorrect.length * Math.abs(this.scoreTable.TIME_OUT_PENALTY);
                            this.addScore(-penalty);
                            console.log(`❌ 剩餘 ${notSwipedCorrect.length} 個敵人未處理，扣 ${penalty} 分`);
                            this.missAttack(`未完成所有正確方向！遺漏: ${notSwipedCorrect.join(', ')}`);
                        }

                        this.clearEnemies();

                        this.currentAttack.resolved = true;
                        this.finishAttack();
                    }
                }, attack.wait);
                this.timers.push(this.currentAttack.multiTimeout);
                break;

            default:
                console.error('未知攻擊類型:', attack.type);
                this.finishAttack();
        }
    },

    setAttackTimer: function (wait, attack) {
        if (!wait || wait <= 0) {
            console.warn('無效的等待時間:', wait);
            return;
        }

        console.log(`設定攻擊計時器，等待 ${wait}ms`);
        const timer = setTimeout(() => {
            if (
                (this.state === this.states.NORMAL || this.state === this.states.MULTI) &&
                this.currentAttack &&
                !this.currentAttack.resolved
            ) {
                console.log(`計時器觸發：${attack.type} 攻擊時間到`);
                this.missAttack('時間到！');
                this.finishAttack();
            }
        }, wait);
        this.timers.push(timer);
        if (this.currentAttack) this.currentAttack.timer = timer;
    },

    finishAttack: function () {
        console.log('✅ 攻擊結束, 當前狀態:', this.state);

        this.heavyBlockReady = false;
        if (this.heavyBlockTimeout) {
            clearTimeout(this.heavyBlockTimeout);
            this.heavyBlockTimeout = null;
        }

        this.isShieldActive = false;
        this.shieldEndTime = 0;

        if (this.currentAttack && this.currentAttack.multiTimeout) {
            clearTimeout(this.currentAttack.multiTimeout);
            this.currentAttack.multiTimeout = null;
        }

        this.clearTrail();

        this.stopAllEnemiesBounce();

        if (this.aoeTimers) {
            this.aoeTimers.forEach((t) => {
                if (t) clearTimeout(t);
                if (t) clearInterval(t);
            });
            this.aoeTimers = [];
        }
        if (this.currentAttack && this.currentAttack.timer) {
            clearTimeout(this.currentAttack.timer);
            this.currentAttack.timer = null;
        }

        this.clearEnemies();
        this.clearProjectiles();
        this.clearHeavySequence();
        this.clearHeavyProjectiles();

        ['up', 'down', 'left', 'right'].forEach((dir) => {
            if (this.lightIntervals[dir]) {
                clearInterval(this.lightIntervals[dir]);
                this.lightIntervals[dir] = null;
            }
        });

        this.aoeLines.forEach((dir) => {
            const line = document.getElementById(`aoe-${dir}`);
            if (line) {
                line.style.opacity = '0';
                line.style.transform = 'translate(0,0)';
                line.style.display = 'none';
                line.style.pointerEvents = 'none';
            }
        });

        this.setState(this.states.IDLE);

        const gap = this.getCurrentGap();
        console.log(`⏱️ 下一攻擊將在 ${gap}ms 後開始`);

        const session = this.sessionId;
        setTimeout(() => {
            if (session !== this.sessionId) return;
            this.processNextAttack();
        }, gap);
    }
};
