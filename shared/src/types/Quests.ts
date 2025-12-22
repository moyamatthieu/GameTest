export enum QuestObjectiveType {
  KILL = 'Kill',
  COLLECT = 'Collect',
  TALK = 'Talk'
}

export interface QuestObjective {
  type: QuestObjectiveType;
  targetId: string; // Entity type ID or Item ID
  requiredAmount: number;
  currentAmount: number;
  description: string;
}

export enum QuestStatus {
  AVAILABLE = 'Available',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  REWARDED = 'Rewarded'
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: {
    exp?: number;
    gold?: number;
    items?: { itemId: string; amount: number }[];
  };
  status: QuestStatus;
}
