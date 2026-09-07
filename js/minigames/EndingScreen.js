// 兩個合併版共用的通關致謝畫面（Issue #30）。
// 玩家完成合併版終點內容後呼叫 EndingScreen.show(onReturn)，
// 顯示明確的收尾與「返回入口」按鈕，避免直接落到黑底或空白場景。
const EndingScreen = {
    container: null,

    // 文案暫用值，最終文案待進銘核定。
    title: '感謝遊玩',
    subtitle: '謝謝你來到客家土樓，和我們一起留下這段生活記憶。',

    show(onReturn) {
        this.dismiss();
        if (typeof showScene === 'function') showScene('game-container');
        if (window.AudioManager) AudioManager.stopBGM();
        const parent = document.getElementById('game-wrapper') || document.body;
        this.container = document.createElement('div');
        this.container.className = 'station-demo ending-screen';
        this.container.innerHTML = `
            <section class="ending-panel" role="group" aria-label="通關致謝">
                <div class="ending-kicker">旅程完成</div>
                <h1 class="ending-title">${this.title}</h1>
                <p class="ending-subtitle">${this.subtitle}</p>
                <div class="station-actions ending-actions">
                    <button type="button" class="station-primary" data-ending-return>返回入口</button>
                </div>
            </section>`;
        parent.appendChild(this.container);

        const returnButton = this.container.querySelector('[data-ending-return]');
        returnButton.addEventListener('click', () => {
            if (window.AudioManager) AudioManager.playSFX('assets/sounds/click.mp3');
            this.dismiss();
            if (typeof onReturn === 'function') onReturn();
            else if (typeof showScene === 'function') showScene('level-select');
        });
        returnButton.focus({ preventScroll: true });
    },

    dismiss() {
        if (this.container?.parentNode) this.container.remove();
        this.container = null;
    }
};

window.EndingScreen = EndingScreen;
