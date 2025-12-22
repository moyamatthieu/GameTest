export var AbilityType;
(function (AbilityType) {
    AbilityType["MELEE"] = "MELEE";
    AbilityType["SPELL"] = "SPELL";
    AbilityType["HEAL"] = "HEAL";
    AbilityType["BLOCK"] = "BLOCK";
})(AbilityType || (AbilityType = {}));
export const ABILITIES = {
    'melee_attack': {
        id: 'melee_attack',
        name: 'Attaque à l\'épée',
        type: AbilityType.MELEE,
        castTime: 0,
        cooldown: 0.8,
        manaCost: 0,
        staminaCost: 10,
        range: 3,
        power: 15
    },
    'block': {
        id: 'block',
        name: 'Blocage au bouclier',
        type: AbilityType.BLOCK,
        castTime: 0,
        cooldown: 0,
        manaCost: 0,
        staminaCost: 5,
        range: 0,
        power: 0.5 // Réduction de 50% des dégâts
    },
    'fireball': {
        id: 'fireball',
        name: 'Fireball',
        type: AbilityType.SPELL,
        castTime: 2.0,
        cooldown: 0,
        manaCost: 20,
        staminaCost: 0,
        range: 300,
        power: 25
    },
    'heal': {
        id: 'heal',
        name: 'Heal',
        type: AbilityType.HEAL,
        castTime: 2.5,
        cooldown: 5.0,
        manaCost: 30,
        staminaCost: 0,
        range: 200,
        power: 40
    }
};
//# sourceMappingURL=Abilities.js.map