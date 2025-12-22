export class QuestState {
    activeQuests;
    completedQuestIds;
    static TYPE = 'QuestState';
    _type = QuestState.TYPE;
    constructor(activeQuests = [], completedQuestIds = []) {
        this.activeQuests = activeQuests;
        this.completedQuestIds = completedQuestIds;
    }
}
//# sourceMappingURL=QuestState.js.map