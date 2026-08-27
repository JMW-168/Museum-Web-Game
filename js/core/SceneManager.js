// js/core/SceneManager.js
const SceneManager = {
    scenes: {},
    
    init: function() {
        if (window.Logger) window.Logger.info('SceneManager 初始化');
        // 收集所有場景
        document.querySelectorAll('.scene').forEach(scene => {
            this.scenes[scene.id] = scene;
            if (window.Logger) window.Logger.debug('找到場景:', scene.id);
        });
    },
    
    show: function(sceneId) {
        if (window.Logger) window.Logger.info('SceneManager 顯示場景:', sceneId);
        
        // 隱藏所有場景
        Object.values(this.scenes).forEach(scene => {
            if (scene) {
                scene.style.display = 'none';
            }
        });
        
        // 顯示目標場景
        const target = this.scenes[sceneId];
        if (target) {
            target.style.display = 'flex';
            if (window.Logger) window.Logger.debug('已顯示場景:', sceneId);
        } else {
            if (window.Logger) window.Logger.error('找不到場景:', sceneId);
            // 備用：直接透過 ID 找
            const fallback = document.getElementById(sceneId);
            if (fallback) {
                fallback.style.display = 'flex';
                this.scenes[sceneId] = fallback;
            }
        }
    }
};

// 確保全域可用
window.SceneManager = SceneManager;