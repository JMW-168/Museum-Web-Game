const Station34CombinedStory = {
    sections: {
        opening: {
            theme: 'cradle',
            lines: [
                {
                    speaker: '阿嬤',
                    cue: '側耳聽見哭聲',
                    text: '噓——你有沒有聽見？裡屋的囡仔哭了，我們先去看看。',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speaker: '旁白',
                    text: '廚房的工作還沒停，阿嬤已經熟練地走向吊在屋裡的搖籃。',
                    narration: true
                },
                {
                    speaker: '阿嬤',
                    text: '以前大人忙著做事，孩子就睡在麵粉袋改成的搖籃裡。手要輕，心要定，慢慢跟著節奏搖。',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female',
                    actionLabel: '開始第三關'
                }
            ]
        },
        afterCradle: {
            theme: 'cradle',
            lines: [
                {
                    speaker: '阿嬤',
                    text: '睡著了。這只用麵粉袋改成的搖籃，養大了家裡不少人。',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speaker: '旁白',
                    text: '哭聲安靜下來，阿嬤帶你回到廚房。桌上已經放好了米糰和一支四面粿印棒。',
                    narration: true
                },
                {
                    speaker: '阿嬤',
                    text: '接下來做紅粿。粿印上的花紋不只是好看，每一面都藏著要送給家人的祝福。',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female',
                    actionLabel: '前往第四關'
                }
            ]
        },
        ending: {
            theme: 'cake',
            lines: [
                {
                    speaker: '阿嬤',
                    text: '你選的是「{{patternName}}」，它代表「{{meaning}}」。',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speaker: '阿嬤',
                    text: '{{blessing}} 一塊紅粿，把做粿人的心意和想說的話都印在上面了。',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
                {
                    speaker: '旁白',
                    text: '從搖籃裡的牽掛，到粿印上的祝福，日常使用的東西也會把一家人的故事留下來。',
                    narration: true,
                    actionLabel: '查看祝福卡'
                }
            ]
        }
    }
};

window.Station34CombinedStory = Station34CombinedStory;
