// js/minigames/defense/DefenseTrailRender.js
// 軌跡特效（由 DefenseGameV2 以 Object.assign 合併）

window.DefenseTrailMixin = {
    // ========== 軌跡特效方法 ==========

    initTrailCanvas: function () {
        this.trailCanvas = document.getElementById('trail-canvas');
        if (!this.trailCanvas) return;

        this.trailCanvas.width = this.stage.clientWidth;
        this.trailCanvas.height = this.stage.clientHeight;
        this.trailCtx = this.trailCanvas.getContext('2d');
        this.trailPoints = [];

        this.trailCanvas.style.width = '100%';
        this.trailCanvas.style.height = '100%';
    },

    addTrailPoint: function (x, y) {
        if (!this.trailCtx) return;

        this.trailPoints.push({
            x: x,
            y: y,
            life: 1.0,
            createdAt: Date.now()
        });

        if (this.trailPoints.length > 100) {
            this.trailPoints.shift();
        }

        this.drawTrail();
    },

    drawTrail: function () {
        if (!this.trailCtx || this.trailPoints.length < 2) return;

        this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);

        for (let i = 0; i < this.trailPoints.length - 1; i++) {
            const p1 = this.trailPoints[i];
            const p2 = this.trailPoints[i + 1];

            const alpha = p1.life * 0.7;

            this.trailCtx.beginPath();
            this.trailCtx.moveTo(p1.x, p1.y);
            this.trailCtx.lineTo(p2.x, p2.y);
            this.trailCtx.lineWidth = 12;
            this.trailCtx.lineCap = 'round';
            this.trailCtx.lineJoin = 'round';
            this.trailCtx.strokeStyle = `rgba(192, 248, 250, ${alpha})`;
            this.trailCtx.stroke();

            this.trailCtx.beginPath();
            this.trailCtx.moveTo(p1.x, p1.y);
            this.trailCtx.lineTo(p2.x, p2.y);
            this.trailCtx.lineWidth = 5;
            this.trailCtx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.trailCtx.stroke();
        }
    },

    updateTrail: function () {
        if (!this.trailCtx) return;

        const now = Date.now();
        const duration = 100;

        let changed = false;
        for (let i = this.trailPoints.length - 1; i >= 0; i--) {
            const point = this.trailPoints[i];
            const elapsed = now - point.createdAt;

            if (elapsed >= duration) {
                this.trailPoints.splice(i, 1);
                changed = true;
            } else {
                point.life = 1 - (elapsed / duration);
            }
        }

        if (changed) {
            this.drawTrail();
        }
    },

    clearTrail: function () {
        if (this.trailCtx) {
            this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
        }
        this.trailPoints = [];
        this.lastTrailX = null;
        this.lastTrailY = null;
    }
};
