import { System } from '../ecs/System';
import { Inventory } from '../components/Inventory';
import { ITEMS, RECIPES } from '../types/Items';
export class InventorySystem extends System {
    update(dt, world) {
        // La logique de mise à jour périodique de l'inventaire si nécessaire
    }
    addItem(entityId, itemId, quantity, world) {
        const inventory = world.getComponent(entityId, Inventory);
        if (!inventory)
            return false;
        const itemDef = ITEMS[itemId];
        if (!itemDef)
            return false;
        if (itemDef.stackable) {
            const existingItem = inventory.items.find((i) => i.itemId === itemId);
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
    removeItem(entityId, itemId, quantity, world) {
        const inventory = world.getComponent(entityId, Inventory);
        if (!inventory)
            return false;
        const itemIndex = inventory.items.findIndex((i) => i.itemId === itemId);
        if (itemIndex === -1)
            return false;
        return this.removeItemAtIndex(entityId, itemIndex, quantity, world);
    }
    removeItemAtIndex(entityId, index, quantity, world) {
        const inventory = world.getComponent(entityId, Inventory);
        if (!inventory || !inventory.items[index])
            return false;
        const item = inventory.items[index];
        if (item.quantity < quantity)
            return false;
        item.quantity -= quantity;
        if (item.quantity === 0) {
            inventory.items.splice(index, 1);
        }
        return true;
    }
    hasItems(entityId, ingredients, world) {
        const inventory = world.getComponent(entityId, Inventory);
        if (!inventory)
            return false;
        for (const ingredient of ingredients) {
            const item = inventory.items.find((i) => i.itemId === ingredient.itemId);
            if (!item || item.quantity < ingredient.quantity) {
                return false;
            }
        }
        return true;
    }
    craftItem(entityId, recipeId, world) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe)
            return false;
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
//# sourceMappingURL=InventorySystem.js.map