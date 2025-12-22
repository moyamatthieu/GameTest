export var EquipmentSlot;
(function (EquipmentSlot) {
    EquipmentSlot["MAIN_HAND"] = "MAIN_HAND";
    EquipmentSlot["OFF_HAND"] = "OFF_HAND";
})(EquipmentSlot || (EquipmentSlot = {}));
export const ITEMS = {
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
export const RECIPES = [
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
export function canEquip(item, slot) {
    return item.slot === slot;
}
//# sourceMappingURL=Items.js.map