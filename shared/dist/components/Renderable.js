export var RenderType;
(function (RenderType) {
    RenderType[RenderType["BOX"] = 0] = "BOX";
    RenderType[RenderType["SPHERE"] = 1] = "SPHERE";
    RenderType[RenderType["PLAYER"] = 2] = "PLAYER";
})(RenderType || (RenderType = {}));
export class Renderable {
    type;
    color;
    static TYPE = 'Renderable';
    _type = Renderable.TYPE;
    constructor(type = RenderType.BOX, color = 0xffffff) {
        this.type = type;
        this.color = color;
    }
}
//# sourceMappingURL=Renderable.js.map