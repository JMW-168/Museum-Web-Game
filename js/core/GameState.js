// js/core/GameState.js
const GameState = {
    inventory: [],        // 道具
    choices: {},          // 玩家選擇記錄
    flags: {},            // 遊戲標誌
    
    hasItem: function(itemId) {
        return this.inventory.includes(itemId);
    },
    
    addItem: function(itemId) {
        if (!this.inventory.includes(itemId)) {
            this.inventory.push(itemId);
        }
    },
    
    recordChoice: function(choiceId, value) {
        this.choices[choiceId] = value;
    },
    
    getChoice: function(choiceId) {
        return this.choices[choiceId];
    },
    
    setFlag: function(flag, value = true) {
        this.flags[flag] = value;
    },
    
    checkFlag: function(flag) {
        return this.flags[flag] || false;
    },
    
    reset: function() {
        this.inventory = [];
        this.choices = {};
        this.flags = {};
    }
};