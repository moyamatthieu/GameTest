import { InputState } from 'shared';

export class InputHandler {
  private keys: Map<string, boolean> = new Map();
  private keyListeners: Map<string, (() => void)[]> = new Map();
  private mouseMoveListeners: ((e: MouseEvent) => void)[] = [];
  private mouseDownListeners: ((e: MouseEvent) => void)[] = [];
  private mouseUpListeners: ((e: MouseEvent) => void)[] = [];
  private yaw: number = 0;
  private pitch: number = 0;
  private readonly SENSITIVITY = 0.002;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.get(e.code)) {
        const listeners = this.keyListeners.get(e.code);
        if (listeners) listeners.forEach(l => l());
      }
      this.keys.set(e.code, true);
    });
    window.addEventListener('keyup', (e) => this.keys.set(e.code, false));

    // Pointer Lock & Mouse Down
    window.addEventListener('mousedown', (e) => {
      this.mouseDownListeners.forEach(l => l(e));
      this.keys.set(`MouseButton${e.button}`, true);
      
      // Only request pointer lock on Right Click (button 2) on the canvas
      // or Left Click (button 0) on the canvas if no UI is open (we'll assume if target is canvas, it's fine)
      if (document.pointerLockElement === null && (e.target as HTMLElement).tagName === 'CANVAS') {
        if (e.button === 2) { // Right click
          document.body.requestPointerLock();
        }
      }
    });

    // Prevent context menu on right click to allow camera rotation
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Prevent selection and other default behaviors on the canvas
    window.addEventListener('selectstart', (e) => {
      if ((e.target as HTMLElement).tagName === 'CANVAS') {
        e.preventDefault();
      }
    });

    // Mouse Up
    window.addEventListener('mouseup', (e) => {
      this.mouseUpListeners.forEach(l => l(e));
      this.keys.set(`MouseButton${e.button}`, false);
    });

    // Mouse Move
    window.addEventListener('mousemove', (e) => {
      this.mouseMoveListeners.forEach(l => l(e));

      if (document.pointerLockElement === document.body) {
        this.yaw -= e.movementX * this.SENSITIVITY;
        this.pitch -= e.movementY * this.SENSITIVITY;

        // Clamp pitch between -PI/2 and PI/2 to avoid flipping over
        const limit = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
      }
    });
  }

  public isPressed(code: string): boolean {
    return this.keys.get(code) || false;
  }

  public onKeyPress(code: string, callback: () => void) {
    if (!this.keyListeners.has(code)) this.keyListeners.set(code, []);
    this.keyListeners.get(code)!.push(callback);
  }

  public onMouseDown(callback: (e: MouseEvent) => void) {
    this.mouseDownListeners.push(callback);
  }

  public onMouseMove(callback: (e: MouseEvent) => void) {
    this.mouseMoveListeners.push(callback);
  }

  public onMouseUp(callback: (e: MouseEvent) => void) {
    this.mouseUpListeners.push(callback);
  }

  public getInputState(): InputState {
    return {
      up: this.isPressed('KeyW') || this.isPressed('ArrowUp') || this.isPressed('KeyZ'),
      down: this.isPressed('KeyS') || this.isPressed('ArrowDown'),
      left: this.isPressed('KeyA') || this.isPressed('ArrowLeft') || this.isPressed('KeyQ'),
      right: this.isPressed('KeyD') || this.isPressed('ArrowRight'),
      jump: this.isPressed('Space'),
      attack: this.isPressed('KeyE') || (this.isPressed('MouseButton0') && document.pointerLockElement !== null),
      block: this.isPressed('KeyR') || (this.isPressed('MouseButton2') && document.pointerLockElement !== null),
      yaw: this.yaw,
      pitch: this.pitch
    };
  }
}
