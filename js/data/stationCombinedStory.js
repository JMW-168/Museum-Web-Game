const StationCombinedStory = {
    sections: {
        opening: {
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
        afterFire: {
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
                    narration: true,
                    actionLabelKey: 'story.action.goToSecond'
                }
            ]
        },
        beforeTea: {
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
        afterTea: {
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
