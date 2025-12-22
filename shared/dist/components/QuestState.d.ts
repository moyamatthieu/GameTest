import { Component } from '../ecs/Component';
import { Quest } from '../types/Quests';
export declare class QuestState implements Component {
    activeQuests: Quest[];
    completedQuestIds: string[];
    static readonly TYPE = "QuestState";
    readonly _type = "QuestState";
    constructor(activeQuests?: Quest[], completedQuestIds?: string[]);
}
