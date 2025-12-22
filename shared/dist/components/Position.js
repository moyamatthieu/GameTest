export class Position {
    x;
    y;
    z;
    rotationY;
    pitch;
    static TYPE = 'Position';
    _type = Position.TYPE;
    constructor(x = 0, y = 0, z = 0, rotationY = 0, pitch = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotationY = rotationY;
        this.pitch = pitch;
    }
}
//# sourceMappingURL=Position.js.map