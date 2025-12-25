import * as THREE from 'three';
import { Constants } from '../utils/constants';
import { BaseScene, IGame } from './BaseScene';
import * as components from '../../common/ecs/components';

export class SystemScene extends BaseScene {
  private lasers: { mesh: THREE.Line; life: number }[] = [];
  public systemId = 'system_alpha';
  private fleetEntities: Map<string, number> = new Map();

  constructor(game: IGame) {
    super(Constants.SCENES.SYSTEM, game);
  }

  async init(initData: any = {}): Promise<void> {
    this.scene.clear();
    this.lasers = [];
    this.fleetEntities.clear();

    const sunMesh = this.createSun();
    this.scene.add(sunMesh);

    this.createPlanets();
    this.createShips();
    this.createTestFleet();
    this.setupLights();

    this.camera.position.set(0, 100, 100);
    this.camera.lookAt(0, 0, 50);

    this.setupEventListeners();
  }

  private createSun(): THREE.Mesh {
    const geometry = this.assetManager.getGeometry('sun_geo', () => new THREE.SphereGeometry(10, 32, 32));
    const material = this.assetManager.getMaterial('sun_mat', () => new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    const sun = new THREE.Mesh(geometry, material);
    sun.name = 'Soleil';
    if (this.director) this.director.registerResource(this.name, 'mesh', sun);
    return sun;
  }

  private createPlanets(): void {
    const geometry = this.assetManager.getGeometry('system_planet_geo', () => new THREE.SphereGeometry(2, 16, 16));
    for (let i = 0; i < 5; i++) {
      const material = this.assetManager.getMaterial(`system_planet_mat_${i}`, () => new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff }));
      const planet = new THREE.Mesh(geometry, material);
      planet.position.x = 30 + i * 20;
      planet.name = `Planète ${i + 1}`;
      this.scene.add(planet);
      if (this.director) this.director.registerResource(this.name, 'mesh', planet);
    }
  }

  private createShips(): void {
    if (!this.director) return;
    const ship1 = this.director.createEntity('ship', { name: 'Player Ship 1', position: { x: 0, y: 0, z: 50 }, faction: 'player' });
    const ship2 = this.director.createEntity('ship', { name: 'Player Ship 2', position: { x: 5, y: 0, z: 55 }, faction: 'player' });
    const enemyShip = this.director.createEntity('ship', { name: 'Enemy Ship', position: { x: 20, y: 0, z: 50 }, faction: 'enemy' });

    if (ship1 !== null) this.fleetEntities.set('ship1', ship1);
    if (ship2 !== null) this.fleetEntities.set('ship2', ship2);
    if (enemyShip !== null) this.fleetEntities.set('enemy', enemyShip);

    this.addShipMeshesToScene([ship1, ship2, enemyShip].filter(id => id !== null) as number[]);
  }

  private addShipMeshesToScene(shipEntities: number[]): void {
    for (const entity of shipEntities) {
      const renderable = this.game.world.getComponent<any>(entity, 'Renderable');
      if (renderable && renderable.mesh && !this.scene.children.includes(renderable.mesh)) {
        this.scene.add(renderable.mesh);
      }
    }
  }

  private createTestFleet(): void {
    const fleetEntity = this.game.world.createEntity();
    this.game.world.addComponent(fleetEntity, 'Fleet', components.Fleet('Alpha Fleet'));
    this.game.world.addComponent(fleetEntity, 'Position', components.Position(0, 0, 50));
    this.game.world.addComponent(fleetEntity, 'Selectable', components.Selectable('fleet'));

    const fleetComp = this.game.world.getComponent<any>(fleetEntity, 'Fleet');
    if (fleetComp) {
      const s1 = this.fleetEntities.get('ship1');
      const s2 = this.fleetEntities.get('ship2');
      if (s1 !== undefined) fleetComp.members.push(s1);
      if (s2 !== undefined) fleetComp.members.push(s2);
    }
    this.fleetEntities.set('fleet', fleetEntity);
  }

  private setupLights(): void {
    const light = new THREE.PointLight(0xffffff, 2, 500);
    this.scene.add(light);
    const ambientLight = new THREE.AmbientLight(0x202020);
    this.scene.add(ambientLight);
    if (this.director) {
      this.director.registerResource(this.name, 'light', light);
      this.director.registerResource(this.name, 'light', ambientLight);
    }
  }

  private setupEventListeners(): void {
    if (!this.eventBus) return;
    this.eventBus.on('combat:fire', (data: any) => this.createLaserEffect(data.attackerPos, data.targetPos));
    this.eventBus.on('ship:created', (data: any) => {
      if (data.systemId === this.systemId) this.addShipToScene(data.shipEntity);
    });
  }

  private createLaserEffect(start: any, end: any): void {
    if (!this.entityFactory) return;
    const laser = this.entityFactory.createLaser(start, end, { color: 0xff0000, width: 1 });
    this.scene.add(laser);
    this.lasers.push({ mesh: laser, life: 0.2 });
    if (this.director) this.director.registerResource(this.name, 'mesh', laser);
  }

  private addShipToScene(shipEntity: number): void {
    const renderable = this.game.world.getComponent<any>(shipEntity, 'Renderable');
    if (renderable && renderable.mesh) {
      this.scene.add(renderable.mesh);
      this.fleetEntities.set(`ship_${shipEntity}`, shipEntity);
    }
  }

  update(deltaTime: number): void {
    this.updateFloatingOrigin();
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      this.lasers[i].life -= deltaTime;
      if (this.lasers[i].life <= 0) {
        this.scene.remove(this.lasers[i].mesh);
        this.lasers.splice(i, 1);
      }
    }
    this.syncEntityPositions();
  }

  private syncEntityPositions(): void {
    const entities = this.game.world.getEntitiesWith('Position', 'Renderable');
    for (const entity of entities) {
      const pos = this.game.world.getComponent<any>(entity, 'Position');
      const rend = this.game.world.getComponent<any>(entity, 'Renderable');
      if (rend && rend.mesh && pos) {
        if (!this.scene.children.includes(rend.mesh)) this.scene.add(rend.mesh);
        rend.mesh.position.set(pos.x, pos.y, pos.z);
      }
    }
  }

  async teardown(): Promise<void> {
    this.lasers = [];
    this.fleetEntities.clear();
    if (this.eventBus) {
      this.eventBus.clear('combat:fire');
      this.eventBus.clear('ship:created');
    }
  }
}
