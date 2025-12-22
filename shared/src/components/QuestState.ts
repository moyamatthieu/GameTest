import { Component } from '../ecs/Component';
import { Quest } from '../types/Quests';

export class QuestState implements Component {
  public static readonly TYPE = 'QuestState';
  public readonly _type = QuestState.TYPE;

  constructor(
    public activeQuests: Quest[] = [],
    public completedQuestIds: string[] = []
  ) {}
}
