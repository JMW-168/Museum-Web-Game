// 灶台生火（站點 1）與擂茶料理（站點 2）的角色對話。
// 每站拆成 entry（進入引導）與 exit（離開引導）兩段：
//   單關版：entry → 遊戲 → 結果頁 → exit → 返回入口。
//   完整劇情體驗：fireEntry → 灶台 → fireExit → teaEntry → 擂茶 → teaExit → 中場過場。
const StationCombinedStory = {
    sections: {
        fireEntry: {
            theme: 'fire',
            lines: [
                {
                    speakerKey: 'story.speaker.grandma',
                    textKey: 'story.combined12.opening.1',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speakerKey: 'story.speaker.playerNarration',
                    textKey: 'story.combined12.opening.2',
                    narration: true
                },
                {
                    speakerKey: 'story.speaker.grandma',
                    textKey: 'story.combined12.opening.3',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speakerKey: 'story.speaker.grandma',
                    textKey: 'story.combined12.opening.4',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female',
                    actionLabelKey: 'story.action.startGame'
                }
            ]
        },
        fireExit: {
            theme: 'fire',
            lines: [
                {
                    speakerKey: 'story.speaker.grandma',
                    textKey: 'story.combined12.afterFire.1',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speakerKey: 'story.speaker.narrator',
                    textKey: 'story.combined12.afterFire.2',
                    narration: true
                }
            ]
        },
        teaEntry: {
            theme: 'tea',
            lines: [
                {
                    speakerKey: 'story.speaker.grandpa',
                    textKey: 'story.combined12.beforeTea.1',
                    image: 'assets/images/characters/grandpa.png',
                    voice: 'male',
                    actionLabelKey: 'story.action.startGame'
                }
            ]
        },
        teaExit: {
            theme: 'tea',
            lines: [
                {
                    speakerKey: 'story.speaker.grandpa',
                    textKey: 'story.combined12.afterTea.1',
                    image: 'assets/images/characters/grandpa.png',
                    voice: 'male'
                },
                {
                    speakerKey: 'story.speaker.grandpa',
                    cueKey: 'story.combined12.afterTea.2.cue',
                    textKey: 'story.combined12.afterTea.2',
                    image: 'assets/images/characters/grandpa.png',
                    voice: 'male',
                    actionLabelKey: 'story.action.returnLobby'
                }
            ]
        }
    },
    coaching: {
        fire: {
            speakerKey: 'story.speaker.grandma',
            textKey: 'story.combined12.coaching.fire'
        },
        tea: {
            speakerKey: 'story.speaker.grandpa',
            textKey: 'story.combined12.coaching.tea'
        }
    }
};

window.StationCombinedStory = StationCombinedStory;
