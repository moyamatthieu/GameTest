import { World } from '../../../shared/src/ecs/World';
import { Quest, QuestObjectiveType } from '../../../shared/src/types/Quests';
import { InventorySystem } from '../../../shared/src/systems/InventorySystem';
export declare class QuestSystem {
    private inventorySystem;
    constructor(inventorySystem: InventorySystem);
    acceptQuest(playerEntity: string, quest: Quest, world: World): boolean;
    updateProgress(playerEntity: string, type: QuestObjectiveType, targetId: string, amount: number, world: World): void;
    private checkQuestCompletion;
    completeQuest(playerEntity: string, questId: string, world: World): boolean;
}
