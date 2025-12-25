import * as THREE from 'three';
import * as components from '../../common/ecs/components';
import { AssetManager } from '../core/AssetManager';
import { World } from '../ecs/World';
import { BuildingType } from '../../common/types/game';

export class EntityFactory {
  private assetManager: AssetManager;
  private world: World;
  public templates: any;

  constructor(assetManager: AssetManager, world: World) {
    this.assetManager = assetManager;
    this.world = world;
    this.templates = this.createTemplates();
  }

  private createTemplates() {
    return {
      buildings: {
        base: {
          geometry: () => new THREE.BoxGeometry(3, 4, 3),
          material: { color: 0xffffff },
          scale: 1.0
        },
        habitation: {
          geometry: () => new THREE.BoxGeometry(2, 2, 2),
          material: { color: 0x44ff44 },
          scale: 1.0
        },
        ferme: {
          geometry: () => new THREE.CylinderGeometry(1.5, 1.5, 1, 32),
          material: { color: 0xffff44 },
          scale: 1.0
        },
        usine: {
          geometry: () => new THREE.BoxGeometry(2.5, 2, 2.5),
          material: { color: 0xff4444 },
          scale: 1.0
        },
        entrepot: {
          geometry: () => new THREE.BoxGeometry(2.5, 1.5, 4),
          material: { color: 0x884400 },
          scale: 1.0
        },
        centrale: {
          geometry: () => new THREE.CylinderGeometry(1, 1.5, 3, 16),
          material: { color: 0x4444ff },
          scale: 1.0
        },
        mine: {
          geometry: () => new THREE.ConeGeometry(1.5, 2.5, 4),
          material: { color: 0x555555 },
          scale: 1.0
        },
        route: {
          geometry: () => new THREE.BoxGeometry(2, 0.2, 2),
          material: { color: 0x333333 },
          scale: 1.0
        }
      },
      ships: {
        player: {
          geometry: () => {
            const g = new THREE.ConeGeometry(1, 3, 8);
            g.rotateX(Math.PI / 2);
            return g;
          },
          material: { color: 0x00ff00 },
          scale: 1.0
        },
        enemy: {
          geometry: () => {
            const g = new THREE.ConeGeometry(1, 3, 8);
            g.rotateX(Math.PI / 2);
            return g;
          },
          material: { color: 0xff0000 },
          scale: 1.0
        },
        cargo: {
          geometry: () => new THREE.BoxGeometry(0.5, 0.5, 1.5),
          material: { color: 0xaaaaaa },
          scale: 1.0
        }
      },
      planets: {
        terrestre: {
          geometry: (radius: number) => new THREE.SphereGeometry(radius, 64, 64),
          material: { color: 0x228b22 },
          radius: 100
        },
        volcanique: {
          geometry: (radius: number) => new THREE.SphereGeometry(radius, 64, 64),
          material: { color: 0x8b0000 },
          radius: 100
        },
        gazeuse: {
          geometry: (radius: number) => new THREE.SphereGeometry(radius, 64, 64),
          material: { color: 0x4682b4 },
          radius: 100
        }
      },
      systems: {
        star: {
          geometry: () => new THREE.SphereGeometry(5, 16, 16),
          material: { color: 0xffff00 },
          scale: 1.0
        },
        influenceZone: {
          geometry: () => new THREE.SphereGeometry(40, 32, 32),
          material: { color: 0x00ff00, transparent: true, opacity: 0.1 },
          scale: 1.0
        }
      }
    };
  }

  createBuilding(type: BuildingType, position: { x: number; y: number; z: number }, options: any = {}): number | null {
    const template = this.templates.buildings[type];
    if (!template) return null;

    const entity = this.world.createEntity();
    const geometry = this.assetManager.getGeometry(`building_${type}_geo`, template.geometry);
    const material = this.assetManager.getMaterial(`building_${type}_mat`, () => new THREE.MeshPhongMaterial(template.material));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.scale.setScalar(template.scale);

    this.world.addComponent(entity, 'Position', components.Position(position.x, position.y, position.z));
    this.world.addComponent(entity, 'Building', components.Building(type, options.level || 1));
    this.world.addComponent(entity, 'Renderable', components.Renderable('building', template.material.color, { mesh }));
    this.world.addComponent(entity, 'Selectable', components.Selectable('building'));

    return entity;
  }

  createShip(name: string, position: { x: number; y: number; z: number }, faction = 'player', options: any = {}): number | null {
    const template = this.templates.ships[faction];
    if (!template) return null;

    const entity = this.world.createEntity();
    const geometry = this.assetManager.getGeometry(`ship_${faction}_geo`, template.geometry);
    const material = this.assetManager.getMaterial(`ship_${faction}_mat`, () => new THREE.MeshPhongMaterial(template.material));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.name = name;
    mesh.userData.entityId = entity;
    mesh.scale.setScalar(template.scale);

    this.world.addComponent(entity, 'Position', components.Position(position.x, position.y, position.z));
    this.world.addComponent(entity, 'Selectable', components.Selectable(faction));
    this.world.addComponent(entity, 'Combat', components.Combat(options.health || 100, options.maxHealth || 100, options.damage || 10));
    this.world.addComponent(entity, 'Renderable', components.Renderable('ship', template.material.color, { mesh }));

    if (options.shields !== false) {
      this.world.addComponent(entity, 'ShieldWedge', components.ShieldWedge(options.shieldHealth || 50, options.shieldMax || 50, options.shieldAngle || Math.PI / 2));
    }

    return entity;
  }

  createPlanet(name: string, type = 'terrestre', options: any = {}): number | null {
    const template = this.templates.planets[type];
    if (!template) return null;

    const entity = this.world.createEntity();
    const radius = options.radius || template.radius;

    this.world.addComponent(entity, 'Position', components.Position(0, 0, 0));
    this.world.addComponent(entity, 'Planet', components.Planet(type, radius));
    this.world.addComponent(entity, 'Renderable', components.Renderable('planet', template.material.color, { radius }));
    this.world.addComponent(entity, 'Selectable', components.Selectable('planet'));
    this.world.addComponent(entity, 'Identity', components.Identity(name));

    if (options.specialization) {
      this.world.addComponent(entity, 'Specialization', components.Specialization(options.specialization));
    }

    return entity;
  }

  createStarSystem(name: string, position: { x: number; y: number; z: number }, options: any = {}): number | null {
    const entity = this.world.createEntity();
    const starTemplate = this.templates.systems.star;
    const starGeometry = this.assetManager.getGeometry('system_star_geo', starTemplate.geometry);
    const starMaterial = this.assetManager.getMaterial('system_star_mat', () => new THREE.MeshBasicMaterial(starTemplate.material));
    const starMesh = new THREE.Mesh(starGeometry, starMaterial);
    starMesh.position.set(position.x, position.y, position.z);
    starMesh.name = name;
    starMesh.userData.entityId = entity;

    this.world.addComponent(entity, 'Position', components.Position(position.x, position.y, position.z));
    this.world.addComponent(entity, 'StarSystem', components.StarSystem(name, position));
    this.world.addComponent(entity, 'Renderable', components.Renderable('star', starTemplate.material.color, { mesh: starMesh }));
    this.world.addComponent(entity, 'Selectable', components.Selectable('system'));

    if (options.owner) {
      this.world.addComponent(entity, 'Sovereignty', components.Sovereignty(options.owner, options.influenceRadius || 50, options.influenceStrength || 0.1));
    }

    return entity;
  }

  createInfluenceZone(position: { x: number; y: number; z: number }, color: number, options: any = {}): THREE.Mesh {
    const template = this.templates.systems.influenceZone;
    const geometry = this.assetManager.getGeometry('influence_zone_geo', template.geometry);
    const material = this.assetManager.getMaterial(`influence_mat_${color}`, () => new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: options.opacity || 0.1,
      side: THREE.DoubleSide
    }));

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    return mesh;
  }

  createPlanetBuilding(type: BuildingType, latitude: number, longitude: number, planetRadius: number): THREE.Mesh | null {
    const template = this.templates.buildings[type];
    if (!template) return null;

    const geometry = this.assetManager.getGeometry(`building_${type}_geo`, template.geometry);
    const material = this.assetManager.getMaterial(`building_${type}_mat`, () => new THREE.MeshPhongMaterial(template.material));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(template.scale);

    const latRad = (latitude * Math.PI) / 180;
    const lonRad = (longitude * Math.PI) / 180;
    const radius = planetRadius + 1;

    mesh.position.set(
      radius * Math.cos(latRad) * Math.cos(lonRad),
      radius * Math.sin(latRad),
      radius * Math.cos(latRad) * Math.sin(lonRad)
    );

    mesh.lookAt(0, 0, 0);
    mesh.rotateX(Math.PI / 2);

    return mesh;
  }

  createLaser(start: { x: number; y: number; z: number }, end: { x: number; y: number; z: number }, options: any = {}): THREE.Line {
    const material = new THREE.LineBasicMaterial({
      color: options.color || 0xff0000,
      linewidth: options.width || 1
    });

    const points = [
      new THREE.Vector3(start.x, start.y, start.z),
      new THREE.Vector3(end.x, end.y, end.z)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
  }

  createPlanetGrid(planetRadius: number, options: any = {}): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: options.color || 0x444444,
      transparent: true,
      opacity: options.opacity || 0.3
    });

    const latCount = options.latCount || 18;
    for (let i = 1; i < latCount; i++) {
      const phi = (Math.PI * i) / latCount;
      const points = [];
      for (let j = 0; j <= 64; j++) {
        const theta = (j / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(
          (planetRadius + 0.1) * Math.sin(phi) * Math.cos(theta),
          (planetRadius + 0.1) * Math.cos(phi),
          (planetRadius + 0.1) * Math.sin(phi) * Math.sin(theta)
        ));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geometry, material));
    }

    const lonCount = options.lonCount || 36;
    for (let i = 0; i < lonCount; i++) {
      const theta = (Math.PI * 2 * i) / lonCount;
      const points = [];
      for (let j = 0; j <= 64; j++) {
        const phi = (j / 64) * Math.PI;
        points.push(new THREE.Vector3(
          (planetRadius + 0.1) * Math.sin(phi) * Math.cos(theta),
          (planetRadius + 0.1) * Math.cos(phi),
          (planetRadius + 0.1) * Math.sin(phi) * Math.sin(theta)
        ));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geometry, material));
    }

    return group;
  }
}
