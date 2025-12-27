import { InputState } from '../../core/physics/types';

export class MovementController {
  private state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    rollLeft: false,
    rollRight: false,
    brake: false,
    boost: false,
    fire: false,
  };

  private keys: Set<string> = new Set();
  private onKeyPressCallbacks: Map<string, () => void> = new Map();

  private mousePos: { x: number; y: number } = { x: 0, y: 0 };
  private isMouseDown: boolean = false;
  private mouseDownPos: { x: number; y: number } = { x: 0, y: 0 };
  private onRightClickCallbacks: ((pos: { x: number, y: number }) => void)[] = [];

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.handleKey(e.code, true);
      if (!e.repeat && this.onKeyPressCallbacks.has(e.code)) {
        this.onKeyPressCallbacks.get(e.code)!();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.handleKey(e.code, false);
    });

    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.mouseDownPos = { ...this.mousePos };
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.onRightClickCallbacks.forEach(cb => cb(this.mousePos));
    });
  }

  public onKeyPress(code: string, callback: () => void) {
    this.onKeyPressCallbacks.set(code, callback);
  }

  public onRightClick(callback: (pos: { x: number, y: number }) => void) {
    this.onRightClickCallbacks.push(callback);
  }

  public getMouseState() {
    return {
      pos: this.mousePos,
      isDown: this.isMouseDown,
      downPos: this.mouseDownPos
    };
  }

  private handleKey(code: string, isPressed: boolean) {
    switch (code) {
      case 'KeyW': this.state.forward = isPressed; break;
      case 'KeyS': this.state.backward = isPressed; break;
      case 'KeyA': this.state.left = isPressed; break;
      case 'KeyD': this.state.right = isPressed; break;
      case 'KeyR': this.state.up = isPressed; break;
      case 'KeyF': this.state.down = isPressed; break;
      case 'KeyQ': this.state.rollLeft = isPressed; break;
      case 'KeyE': this.state.rollRight = isPressed; break;
      case 'Space': this.state.brake = isPressed; break;
      case 'ControlLeft':
      case 'ControlRight': this.state.fire = isPressed; break;
      case 'ShiftLeft':
      case 'ShiftRight': this.state.boost = isPressed; break;
    }
  }

  public getInputState(): InputState {
    return { ...this.state };
  }

  public isKeyPressed(code: string): boolean {
    return this.keys.has(code);
  }
}
