export type ItemId = string;

export enum EquipmentSlot {
    HEAD = 'HEAD',
    TORSO = 'TORSO',
    ARMS = 'ARMS',
    LEGS = 'LEGS',
    BACK = 'BACK',
    MAIN_HAND = 'MAIN_HAND',
    OFF_HAND = 'OFF_HAND'
}

export interface ItemStats {
    hp?: number;
    maxHp?: number;
    mana?: number;
    maxMana?: number;
    stamina?: number;
    maxStamina?: number;
    moveSpeed?: number;
    attackPower?: number;
    defense?: number;
    // Statistiques Arthuriennes
    strength?: number;
    dexterity?: number;
    wisdom?: number;
    faith?: number;
    luck?: number;
}

export type ItemTier = 1 | 2 | 3 | 4 | 5;

export interface Item {
    id: ItemId;
    name: string;
    description: string;
    stackable: boolean;
    maxStack?: number;
    slot?: EquipmentSlot;
    stats?: ItemStats;
}

export interface ArthurianItem extends Item {
    tier: ItemTier;
    visuals: {
        meshType: string;
        colorOverride?: number;
        socket?: string;
    };
}

export interface InventoryItem {
    itemId: ItemId;
    quantity: number;
}

export interface Recipe {
    id: string;
    ingredients: { itemId: ItemId; quantity: number }[];
    result: { itemId: ItemId; quantity: number };
}

export const ITEMS: Record<ItemId, Item> = {
    'wood': {
        id: 'wood',
        name: 'Bois',
        description: 'Un morceau de bois.',
        stackable: true,
        maxStack: 99
    },
    'iron': {
        id: 'iron',
        name: 'Fer',
        description: 'Un morceau de minerai de fer.',
        stackable: true,
        maxStack: 99
    },
    'sword': {
        id: 'sword',
        name: 'Épée en fer',
        description: 'Une épée tranchante en fer.',
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        stats: { attackPower: 10 }
    },
    'shield': {
        id: 'shield',
        name: 'Bouclier en bois',
        description: 'Un bouclier simple en bois.',
        stackable: false,
        slot: EquipmentSlot.OFF_HAND,
        stats: { defense: 5, maxHp: 20 }
    },
    'potion': {
        id: 'potion',
        name: 'Potion',
        description: 'Une potion de soin.',
        stackable: true,
        maxStack: 10
    }
};

export const RECIPES: Recipe[] = [
    {
        id: 'craft_sword',
        ingredients: [
            { itemId: 'wood', quantity: 1 },
            { itemId: 'iron', quantity: 1 }
        ],
        result: { itemId: 'sword', quantity: 1 }
    },
    {
        id: 'craft_shield',
        ingredients: [
            { itemId: 'wood', quantity: 2 }
        ],
        result: { itemId: 'shield', quantity: 1 }
    }
];

export function canEquip(item: Item, slot: EquipmentSlot): boolean {
    return item.slot === slot;
}
