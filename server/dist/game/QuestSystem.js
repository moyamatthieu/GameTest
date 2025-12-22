"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestSystem = void 0;
const QuestState_1 = require("../../../shared/src/components/QuestState");
const Quests_1 = require("../../../shared/src/types/Quests");
class QuestSystem {
    inventorySystem;
    constructor(inventorySystem) {
        this.inventorySystem = inventorySystem;
    }
    acceptQuest(playerEntity, quest, world) {
        const questState = world.getComponent(playerEntity, QuestState_1.QuestState);
        if (!questState)
            return false;
        // Check if already active or completed
        if (questState.activeQuests.find(q => q.id === quest.id) ||
            questState.completedQuestIds.includes(quest.id)) {
            return false;
        }
        const newQuest = { ...quest, status: Quests_1.QuestStatus.ACTIVE };
        questState.activeQuests.push(newQuest);
        return true;
    }
    updateProgress(playerEntity, type, targetId, amount, world) {
        const questState = world.getComponent(playerEntity, QuestState_1.QuestState);
        if (!questState)
            return;
        for (const quest of questState.activeQuests) {
            let changed = false;
            for (const objective of quest.objectives) {
                if (objective.type === type && objective.targetId === targetId) {
                    objective.currentAmount = Math.min(objective.requiredAmount, objective.currentAmount + amount);
                    changed = true;
                }
            }
            if (changed) {
                this.checkQuestCompletion(playerEntity, quest, world);
            }
        }
    }
    checkQuestCompletion(playerEntity, quest, world) {
        const allCompleted = quest.objectives.every(obj => obj.currentAmount >= obj.requiredAmount);
        if (allCompleted && quest.status !== Quests_1.QuestStatus.COMPLETED) {
            quest.status = Quests_1.QuestStatus.COMPLETED;
            // Notify player (handled via socket in index.ts)
        }
    }
    completeQuest(playerEntity, questId, world) {
        const questState = world.getComponent(playerEntity, QuestState_1.QuestState);
        if (!questState)
            return false;
        const questIndex = questState.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1)
            return false;
        const quest = questState.activeQuests[questIndex];
        if (quest.status !== Quests_1.QuestStatus.COMPLETED)
            return false;
        // Give rewards
        if (quest.rewards.items) {
            for (const item of quest.rewards.items) {
                this.inventorySystem.addItem(playerEntity, item.itemId, item.amount, world);
            }
        }
        // Exp and Gold could be added here if Stats component supported them
        questState.completedQuestIds.push(questId);
        questState.activeQuests.splice(questIndex, 1);
        return true;
    }
}
exports.QuestSystem = QuestSystem;
//# sourceMappingURL=QuestSystem.js.map