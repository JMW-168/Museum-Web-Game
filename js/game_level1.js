// js/game_level1.js

function initPuzzleGame(context) {
    console.log("拼圖遊戲開始");
    
    // 清除畫布
    context.clearRect(0, 0, 1280, 720);
    
    // 背景
    context.fillStyle = '#bdc3c7';
    context.fillRect(0, 0, 1280, 720);
    
    // 繪製拼圖虛線框
    context.strokeStyle = 'white';
    context.lineWidth = 5;
    context.strokeRect(540, 260, 200, 200); // 假設中央
    
    context.fillStyle = 'black';
    context.font = '30px Arial';
    context.fillText('拼圖遊戲畫面 (1280x720)', 480, 100);
}