export class Input {
    static TYPE = 'Input';
    _type = Input.TYPE;
    sequence = 0;
    state = {
        up: false,
        down: false,
        left: false,
        right: false,
        jump: false,
        attack: false,
        block: false,
        yaw: 0,
        pitch: 0
    };
    constructor() { }
}
//# sourceMappingURL=Input.js.map