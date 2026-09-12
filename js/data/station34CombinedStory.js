// 搖籃哄睡（站點 3）與粄印製作（站點 4）的角色對話。
// 每站拆成 entry（進入引導）與 exit（離開引導）兩段：
//   單關版：entry → 遊戲 → 結果頁 → exit（exit 末句 CTA 由呼叫端覆寫成「返回大廳」）。
//   完整劇情體驗：cradleEntry → 搖籃 → cradleExit → cakeEntry → 粄印 → cakeExit → 祝福卡。
const Station34CombinedStory = {
    sections: {
        cradleEntry: {
            theme: 'cradle',
            lines: [
                {
                    speakerKey: 'story.speaker.grandma',
                    cueKey: 'story.combined34.opening.1.cue',
                    textKey: 'story.combined34.opening.1',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speakerKey: 'story.speaker.narrator',
                    textKey: 'story.combined34.opening.2',
                    narration: true
                },
                {
                    speakerKey: 'story.speaker.grandma',
                    textKey: 'story.combined34.opening.3',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female',
                    actionLabelKey: 'story.action.startGame'
                }
            ]
        },
        cradleExit: {
            theme: 'cradle',
            lines: [
                {
                    speakerKey: 'story.speaker.grandma',
                    textKey: 'story.combined34.afterCradle.1',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                }
            ]
        },
        cakeEntry: {
            theme: 'cake',
            lines: [
                {
                    speakerKey: 'story.speaker.narrator',
                    textKey: 'story.combined34.afterCradle.2',
                    narration: true
                },
                {
                    speakerKey: 'story.speaker.grandma',
                    textKey: 'story.combined34.afterCradle.3',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female',
                    actionLabelKey: 'story.action.startGame'
                }
            ]
        },
        cakeExit: {
            theme: 'cake',
            lines: [
                {
                    speakerKey: 'story.speaker.grandma',
                    textKey: 'story.combined34.ending.1',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speakerKey: 'story.speaker.grandma',
                    textKey: 'story.combined34.ending.2',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speakerKey: 'story.speaker.narrator',
                    textKey: 'story.combined34.ending.3',
                    narration: true,
                    actionLabelKey: 'story.action.viewBlessingCard'
                }
            ]
        }
    }
};

window.Station34CombinedStory = Station34CombinedStory;
