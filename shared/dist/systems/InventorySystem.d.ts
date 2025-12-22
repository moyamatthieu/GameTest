import { World } from '../ecs/World';
import { System } from '../ecs/System';
import { ItemId } from '../types/Items';
export declare class InventorySystem extends System {
    update(dt: number, world: World): void;
    addItem(entityId: string, itemId: ItemId, quantity: number, world: World): boolean;
    removeItem(entityId: string, itemId: ItemId, quantity: number, world: World): boolean;
    removeItemAtIndex(entityId: string, index: number, quantity: number, world: World): boolean;
    hasItems(entityId: string, ingredients: {
        itemId: ItemId;
        quantity: number;
    }[], world: World): boolean;
    craftItem(entityId: string, recipeId: string, world: World): boolean;
}
