// js/minigames/defense/DefenseInput.js
// 觸控 / 滑動 / ZingTouch 旋轉（由 DefenseGameV2 合併）

window.DefenseInputMixin = {
    initEventListeners: function () {
        this.container.addEventListener('touchstart', (e) => {
            this.touchStart.x = e.touches[0].clientX;
            this.touchStart.y = e.touches[0].clientY;

            const rect = this.stage.getBoundingClientRect();
            this.lastTrailX = e.touches[0].clientX - rect.left;
            this.lastTrailY = e.touches[0].clientY - rect.top;

            this.addTrailPoint(this.lastTrailX, this.lastTrailY);
        });

        this.container.addEventListener('touchmove', (e) => {
            if (!this.gameActive) return;

            const rect = this.stage.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;

            if (this.lastTrailX !== null && this.lastTrailY !== null) {
                const dx = x - this.lastTrailX;
                const dy = y - this.lastTrailY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance >= this.trailMinDistance) {
                    const steps = Math.ceil(distance / this.trailMinDistance);
                    for (let i = 1; i <= steps; i++) {
                        const t = i / steps;
                        const ix = this.lastTrailX + dx * t;
                        const iy = this.lastTrailY + dy * t;
                        this.addTrailPoint(ix, iy);
                    }
                    this.lastTrailX = x;
                    this.lastTrailY = y;
                }
            } else {
                this.addTrailPoint(x, y);
                this.lastTrailX = x;
                this.lastTrailY = y;
            }
        });

        this.container.addEventListener('touchend', (e) => {
            this.lastTrailX = null;
            this.lastTrailY = null;
        });

        this.container.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 0) return;
            const dx = e.changedTouches[0].clientX - this.touchStart.x;
            const dy = e.changedTouches[0].clientY - this.touchStart.y;
            let swipe = null;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) swipe = dx > 0 ? 'right' : 'left';
            } else {
                if (Math.abs(dy) > 30) swipe = dy > 0 ? 'down' : 'up';
            }
            if (swipe && this.gameActive) this.handleSwipe(swipe);
        });

        if (window.ZingTouch) {
            this.zingRegion = new ZingTouch.Region(this.container);
            this.zingRegion.bind(this.container, 'rotate', (e) => this.handleRotate(e));
        }
    }
};
