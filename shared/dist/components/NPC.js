export var NPCType;
(function (NPCType) {
    NPCType["MERCHANT"] = "Merchant";
    NPCType["QUEST_GIVER"] = "QuestGiver";
    NPCType["ENEMY"] = "Enemy";
})(NPCType || (NPCType = {}));
export class NPC {
    name;
    npcType;
    dialogue;
    static TYPE = 'NPC';
    _type = NPC.TYPE;
    constructor(name, npcType, dialogue = []) {
        this.name = name;
        this.npcType = npcType;
        this.dialogue = dialogue;
    }
}
//# sourceMappingURL=NPC.js.map