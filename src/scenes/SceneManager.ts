import * as THREE from 'three';
import { SceneDirector } from './SceneDirector';
import { BaseScene, IGame } from './BaseScene';
import { EventBus } from './EventBus';
import { EntityFactory } from './EntityFactory';

export class SceneManager {
  private game: IGame;
  public director: SceneDirector;
  public scenes: Map<string, BaseScene>;
  public currentScene: BaseScene | null = null;
  public currentSceneName = '';
  public isTransitioning = false;
  private transitionOverlay: HTMLElement | null;

  constructor(game: IGame) {
    this.game = game;
    this.director = new SceneDirector(game);
    this.scenes = this.director.scenes;
    this.transitionOverlay = document.getElementById('scene-transition');
  }

  addScene(name: string, sceneInstance: BaseScene): void {
    this.director.registerScene(name, sceneInstance);
  }

  async switchScene(name: string): Promise<void> {
    await this.director.switchScene(name);
    this.currentScene = this.director.getCurrentScene();
    this.currentSceneName = this.director.getCurrentSceneName();
  }

  update(deltaTime: number): void {
    this.director.update(deltaTime);
  }

  render(renderer: THREE.WebGLRenderer): void {
    this.director.render(renderer);
  }

  onResize(width: number, height: number): void {
    this.director.onResize(width, height);
  }

  getDirector(): SceneDirector { return this.director; }
  getEventBus(): EventBus { return this.director.getEventBus(); }
  getEntityFactory(): EntityFactory { return this.director.getEntityFactory(); }

  createEntity(type: string, options: any = {}): number | null {
    return this.director.createEntity(type, options);
  }

  destroyEntity(entityId: number): void {
    this.director.destroyEntity(entityId);
  }

  getCurrentScene(): BaseScene | null { return this.director.getCurrentScene(); }
  getCurrentSceneName(): string { return this.director.getCurrentSceneName(); }
  hasScene(sceneName: string): boolean { return this.director.hasScene(sceneName); }
  getScene(sceneName: string): BaseScene | null { return this.director.getScene(sceneName); }
}
