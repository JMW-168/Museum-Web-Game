const StationCombinedStory = {
    sections: {
        opening: {
            theme: 'fire',
            lines: [
                {
                    speaker: '阿嬤',
                    text: '誒，你是誰家的孩子？跑到阿嬤這廚房來做什麼？',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speaker: '玩家（旁白代答）',
                    text: '我想看看，以前的日子是怎麼過的。',
                    narration: true
                },
                {
                    speaker: '阿嬤',
                    text: '好啊，那你就跟阿嬤一起，重新把這頓飯生出來吧。',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speaker: '阿嬤',
                    text: '柴火要一根一根添，急不得。你看這火候，急了就滅，慢了就冷。',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female',
                    actionLabel: '開始遊戲'
                }
            ]
        },
        afterFire: {
            theme: 'fire',
            lines: [
                {
                    speaker: '阿嬤',
                    text: '以前沒柴火錢，去山上撿樹枝也要生出一頓熱飯。人窮，志氣不能短！',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speaker: '旁白',
                    text: '灶火終於旺了起來，鍋裡的水開始咕嚕作響……',
                    narration: true,
                    actionLabel: '前往第二關'
                }
            ]
        },
        beforeTea: {
            theme: 'tea',
            lines: [
                {
                    speaker: '阿公',
                    text: '喔，火生好了？來，換我教你一樣東西——擂茶。',
                    image: 'assets/images/characters/grandpa.png',
                    voice: 'male',
                    actionLabel: '開始遊戲'
                }
            ]
        },
        afterTea: {
            theme: 'tea',
            lines: [
                {
                    speaker: '阿公',
                    text: '擂茶最費工，但客家人哪怕再窮，一碗熱茶也要待一整個下午的客，這是禮數，也是教養。',
                    image: 'assets/images/characters/grandpa.png',
                    voice: 'male'
                },
                {
                    speaker: '阿公',
                    cue: '突然想起往事',
                    text: '我阿爸那年，家裡連鹽都快沒了，還是留了一碗擂茶給教書先生喝。',
                    image: 'assets/images/characters/grandpa.png',
                    voice: 'male',
                    actionLabel: '返回大廳'
                }
            ]
        }
    },
    coaching: {
        fire: {
            speaker: '阿嬤',
            text: '對，就是這個節奏！……欸欸，快一點，別把火弄熄了！'
        },
        tea: {
            speaker: '阿公',
            text: '順時針，別急，茶葉才不會被你磨飛了。'
        }
    }
};

window.StationCombinedStory = StationCombinedStory;
