import * as THREE from 'three';
import { Constants } from '../utils/constants';
import { BaseScene, IGame } from './BaseScene';
import * as components from '../../common/ecs/components';

export class GalaxyScene extends BaseScene {
  private influenceZones: THREE.Group | null = null;
  private starSystems: Map<number, any> = new Map();

  constructor(game: IGame) {
    super(Constants.SCENES.GALAXY, game);
  }

  async init(initData: any = {}): Promise<void> {
    this.scene.clear();
    this.starSystems.clear();

    this.createStarfield();

    this.influenceZones = new THREE.Group();
    this.scene.add(this.influenceZones);

    this.camera.position.z = 500;

    await this.createStarSystems();
    this.setupEventListeners();
  }

  private createStarfield(): void {
    const starsCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
    const stars = new THREE.Points(geometry, material);
    this.scene.add(stars);

    if (this.director) {
      this.director.registerResource(this.name, 'geometry', geometry);
      this.director.registerResource(this.name, 'material', material);
      this.director.registerResource(this.name, 'mesh', stars);
    }
  }

  private async createStarSystems(): Promise<void> {
    const systems = this.game.world.getEntitiesWith('StarSystem', 'Sovereignty', 'Position');
    if (systems.length === 0) {
      await this.createDemoSystems();
    } else {
      for (const entity of systems) {
        await this.createSystemVisual(entity);
      }
    }
  }

  private async createDemoSystems(): Promise<void> {
    const demoSystems = [
      { name: 'Alpha Centauri', pos: { x: -100, y: 0, z: -50 }, owner: (this.game as any).playerCorp, color: 0x00ff00 },
      { name: 'Sol', pos: { x: 0, y: 0, z: 0 }, owner: (this.game as any).playerCorp, color: 0x00ff00 },
      { name: 'Sirius', pos: { x: 150, y: 50, z: 100 }, owner: (this.game as any).rivalCorp, color: 0xff0000 }
    ];

    for (const sys of demoSystems) {
      if (this.director && this.entityFactory) {
        const systemEntity = this.director.createEntity('starSystem', {
          name: sys.name, position: sys.pos, owner: sys.owner, influenceRadius: 50, influenceStrength: 0.1
        });

        if (systemEntity !== null) {
          this.starSystems.set(systemEntity, sys);
          const influenceZone = this.entityFactory.createInfluenceZone(sys.pos, sys.color, { opacity: 0.1 });
          this.influenceZones?.add(influenceZone);
          this.director.registerResource(this.name, 'mesh', influenceZone);
        }
      }
    }
  }

  private async createSystemVisual(entity: number): Promise<void> {
    const starSystem = this.game.world.getComponent<any>(entity, 'StarSystem');
    const position = this.game.world.getComponent<any>(entity, 'Position');
    const sovereignty = this.game.world.getComponent<any>(entity, 'Sovereignty');

    if (!starSystem || !position || !this.entityFactory) return;

    const starTemplate = this.entityFactory.templates.systems.star;
    const starGeometry = this.assetManager.getGeometry('system_star_geo', starTemplate.geometry);
    const starMaterial = this.assetManager.getMaterial('system_star_mat', () => new THREE.MeshBasicMaterial(starTemplate.material));
    const starMesh = new THREE.Mesh(starGeometry, starMaterial);
    starMesh.position.set(position.x, position.y, position.z);
    starMesh.userData.entityId = entity;
    starMesh.name = starSystem.name;

    this.scene.add(starMesh);
    if (this.director) this.director.registerResource(this.name, 'mesh', starMesh);

    if (sovereignty && this.influenceZones) {
      const color = sovereignty.corporationId === (this.game as any).playerCorp ? 0x00ff00 : 0xff0000;
      const influenceZone = this.entityFactory.createInfluenceZone(
        { x: position.x, y: position.y, z: position.z },
        color,
        { opacity: 0.1, radius: sovereignty.influenceRadius || 40 }
      );
      this.influenceZones.add(influenceZone);
      if (this.director) this.director.registerResource(this.name, 'mesh', influenceZone);
    }

    const renderable = this.game.world.getComponent<any>(entity, 'Renderable');
    if (!renderable) {
      this.game.world.addComponent(entity, 'Renderable', components.Renderable('star', 0xffff00, { mesh: starMesh }));
    } else {
      renderable.mesh = starMesh;
    }

    this.starSystems.set(entity, {
      name: starSystem.name,
      pos: { x: position.x, y: position.y, z: position.z },
      owner: sovereignty ? sovereignty.corporationId : null
    });
  }

  private setupEventListeners(): void {
    if (!this.eventBus) return;
    this.eventBus.on('system:created', (data: any) => this.createSystemFromEvent(data));
    this.eventBus.on('sovereignty:updated', (data: any) => this.updateSystemSovereignty(data.entityId, data.newOwner));
    this.eventBus.on('system:destroyed', (data: any) => this.removeSystemVisual(data.entityId));
  }

  private async createSystemFromEvent(data: any): Promise<void> {
    if (this.director) {
      const entity = this.director.createEntity('starSystem', {
        name: data.name, position: data.position, owner: data.owner, influenceRadius: data.influenceRadius || 50, influenceStrength: data.influenceStrength || 0.1
      });
      if (entity !== null) await this.createSystemVisual(entity);
    }
  }

  private updateSystemSovereignty(entityId: number, newOwner: any): void {
    const systemData = this.starSystems.get(entityId);
    if (!systemData || !this.influenceZones || !this.entityFactory) return;

    const color = newOwner === (this.game as any).playerCorp ? 0x00ff00 : 0xff0000;
    const oldZone = this.influenceZones.children.find(child =>
      child.position.x === systemData.pos.x && child.position.y === systemData.pos.y && child.position.z === systemData.pos.z
    );

    if (oldZone) {
      this.influenceZones.remove(oldZone);
      if ((oldZone as any).material) (oldZone as any).material.dispose();
    }

    const newInfluenceZone = this.entityFactory.createInfluenceZone(systemData.pos, color, { opacity: 0.1 });
    this.influenceZones.add(newInfluenceZone);
    if (this.director) this.director.registerResource(this.name, 'mesh', newInfluenceZone);

    systemData.owner = newOwner;
    this.starSystems.set(entityId, systemData);
  }

  private removeSystemVisual(entityId: number): void {
    const systemData = this.starSystems.get(entityId);
    if (!systemData || !this.influenceZones) return;

    const starMesh = this.scene.children.find(child => child.userData && child.userData.entityId === entityId);
    if (starMesh) {
      this.scene.remove(starMesh);
      if ((starMesh as any).geometry) (starMesh as any).geometry.dispose();
      if ((starMesh as any).material) (starMesh as any).material.dispose();
    }

    const influenceZone = this.influenceZones.children.find(child =>
      child.position.x === systemData.pos.x && child.position.y === systemData.pos.y && child.position.z === systemData.pos.z
    );

    if (influenceZone) {
      this.influenceZones.remove(influenceZone);
      if ((influenceZone as any).material) (influenceZone as any).material.dispose();
    }

    this.starSystems.delete(entityId);
  }

  update(deltaTime: number): void {
    this.updateFloatingOrigin(5000);
  }

  async teardown(): Promise<void> {
    this.starSystems.clear();
    this.influenceZones = null;
    if (this.eventBus) {
      this.eventBus.clear('system:created');
      this.eventBus.clear('sovereignty:updated');
      this.eventBus.clear('system:destroyed');
    }
  }
}
