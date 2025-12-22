import { World } from '../ecs/World';
import { System } from '../ecs/System';
import { Inventory } from '../components/Inventory';
import { ItemId, ITEMS, RECIPES, InventoryItem } from '../types/Items';

export class InventorySystem extends System {
    public update(dt: number, world: World): void {
        // La logique de mise à jour périodique de l'inventaire si nécessaire
    }

    public addItem(entityId: string, itemId: ItemId, quantity: number, world: World): boolean {
        const inventory = world.getComponent(entityId, Inventory);
        if (!inventory) return false;

        const itemDef = ITEMS[itemId];
        if (!itemDef) return false;

        if (itemDef.stackable) {
            const existingItem = inventory.items.find((i: InventoryItem) => i.itemId === itemId);
            if (existingItem) {
                existingItem.quantity += quantity;
                return true;
            }
        }

        if (inventory.items.length < inventory.maxSize) {
            inventory.items.push({ itemId, quantity });
            return true;
        }

        return false;
    }

    public removeItem(entityId: string, itemId: ItemId, quantity: number, world: World): boolean {
        const inventory = world.getComponent(entityId, Inventory) as Inventory;
        if (!inventory) return false;

        const itemIndex = inventory.items.findIndex((i: InventoryItem) => i.itemId === itemId);
        if (itemIndex === -1) return false;

        return this.removeItemAtIndex(entityId, itemIndex, quantity, world);
    }

    public removeItemAtIndex(entityId: string, index: number, quantity: number, world: World): boolean {
        const inventory = world.getComponent(entityId, Inventory) as Inventory;
        if (!inventory || !inventory.items[index]) return false;

        const item = inventory.items[index];
        if (item.quantity < quantity) return false;

        item.quantity -= quantity;
        if (item.quantity === 0) {
            inventory.items.splice(index, 1);
        }

        return true;
    }

    public hasItems(entityId: string, ingredients: { itemId: ItemId; quantity: number }[], world: World): boolean {
        const inventory = world.getComponent(entityId, Inventory);
        if (!inventory) return false;

        for (const ingredient of ingredients) {
            const item = inventory.items.find((i: InventoryItem) => i.itemId === ingredient.itemId);
            if (!item || item.quantity < ingredient.quantity) {
                return false;
            }
        }

        return true;
    }

    public craftItem(entityId: string, recipeId: string, world: World): boolean {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return false;

        if (!this.hasItems(entityId, recipe.ingredients, world)) {
            return false;
        }

        // Consommer les ingrédients
        for (const ingredient of recipe.ingredients) {
            this.removeItem(entityId, ingredient.itemId, ingredient.quantity, world);
        }

        // Ajouter le résultat
        return this.addItem(entityId, recipe.result.itemId, recipe.result.quantity, world);
    }
}
