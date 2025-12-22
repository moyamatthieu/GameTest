export type ItemId = string;
export declare enum EquipmentSlot {
    MAIN_HAND = "MAIN_HAND",
    OFF_HAND = "OFF_HAND"
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
}
export interface Item {
    id: ItemId;
    name: string;
    description: string;
    stackable: boolean;
    maxStack?: number;
    slot?: EquipmentSlot;
    stats?: ItemStats;
}
export interface InventoryItem {
    itemId: ItemId;
    quantity: number;
}
export interface Recipe {
    id: string;
    ingredients: {
        itemId: ItemId;
        quantity: number;
    }[];
    result: {
        itemId: ItemId;
        quantity: number;
    };
}
export declare const ITEMS: Record<ItemId, Item>;
export declare const RECIPES: Recipe[];
export declare function canEquip(item: Item, slot: EquipmentSlot): boolean;
