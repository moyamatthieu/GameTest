export class CombatState {
    static TYPE = 'CombatState';
    _type = CombatState.TYPE;
    targetId = null;
    cooldowns = new Map();
    casting = null;
    isBlocking = false;
    lastAttackTime = 0;
    constructor() { }
}
//# sourceMappingURL=CombatState.js.map