import { World } from '../../../shared/src/ecs/World';
import { QuestState } from '../../../shared/src/components/QuestState';
import { Quest, QuestStatus, QuestObjectiveType } from '../../../shared/src/types/Quests';
import { Inventory } from '../../../shared/src/components/Inventory';
import { InventorySystem } from '../../../shared/src/systems/InventorySystem';

export class QuestSystem {
  constructor(private inventorySystem: InventorySystem) {}

  public acceptQuest(playerEntity: string, quest: Quest, world: World): boolean {
    const questState = world.getComponent(playerEntity, QuestState);
    if (!questState) return false;

    // Check if already active or completed
    if (questState.activeQuests.find(q => q.id === quest.id) || 
        questState.completedQuestIds.includes(quest.id)) {
      return false;
    }

    const newQuest = { ...quest, status: QuestStatus.ACTIVE };
    questState.activeQuests.push(newQuest);
    return true;
  }

  public updateProgress(playerEntity: string, type: QuestObjectiveType, targetId: string, amount: number, world: World): void {
    const questState = world.getComponent(playerEntity, QuestState);
    if (!questState) return;

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

  private checkQuestCompletion(playerEntity: string, quest: Quest, world: World): void {
    const allCompleted = quest.objectives.every(obj => obj.currentAmount >= obj.requiredAmount);
    if (allCompleted && quest.status !== QuestStatus.COMPLETED) {
      quest.status = QuestStatus.COMPLETED;
      // Notify player (handled via socket in index.ts)
    }
  }

  public completeQuest(playerEntity: string, questId: string, world: World): boolean {
    const questState = world.getComponent(playerEntity, QuestState);
    if (!questState) return false;

    const questIndex = questState.activeQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) return false;

    const quest = questState.activeQuests[questIndex];
    if (quest.status !== QuestStatus.COMPLETED) return false;

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
