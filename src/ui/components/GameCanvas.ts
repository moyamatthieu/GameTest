export class GameCanvas {
  private canvas: HTMLCanvasElement;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';

    container.appendChild(this.canvas);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
