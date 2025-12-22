export class Stats {
    hp;
    maxHp;
    mana;
    maxMana;
    stamina;
    maxStamina;
    level;
    moveSpeed;
    attackPower;
    defense;
    static TYPE = 'Stats';
    _type = Stats.TYPE;
    constructor(hp = 100, maxHp = 100, mana = 100, maxMana = 100, stamina = 100, maxStamina = 100, level = 1, moveSpeed = 5, attackPower = 5, defense = 0) {
        this.hp = hp;
        this.maxHp = maxHp;
        this.mana = mana;
        this.maxMana = maxMana;
        this.stamina = stamina;
        this.maxStamina = maxStamina;
        this.level = level;
        this.moveSpeed = moveSpeed;
        this.attackPower = attackPower;
        this.defense = defense;
    }
}
//# sourceMappingURL=Stats.js.map