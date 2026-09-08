const Station34CombinedStory = {
    sections: {
        opening: {
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
                    actionLabelKey: 'story.action.startThird'
                }
            ]
        },
        afterCradle: {
            theme: 'cradle',
            lines: [
                {
                    speakerKey: 'story.speaker.grandma',
                    textKey: 'story.combined34.afterCradle.1',
                    image: 'assets/images/characters/grandma.png',
                    voice: 'female'
                },
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
                    actionLabelKey: 'story.action.goToFourth'
                }
            ]
        },
        ending: {
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
