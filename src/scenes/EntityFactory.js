import * as THREE from 'three';
import * as components from '../ecs/components/index.js';

export class EntityFactory {
  constructor(assetManager, world) {
    this.assetManager = assetManager;
    this.world = world;
    this.templates = this.createTemplates();
  }

  /**
   * Create templates for different entity types
   */
  createTemplates() {
    return {
      // Building templates
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

      // Ship templates
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

      // Planet templates
      planets: {
        terrestre: {
          geometry: (radius) => new THREE.SphereGeometry(radius, 64, 64),
          material: { color: 0x228b22 },
          radius: 100
        },
        volcanique: {
          geometry: (radius) => new THREE.SphereGeometry(radius, 64, 64),
          material: { color: 0x8b0000 },
          radius: 100
        },
        gazeuse: {
          geometry: (radius) => new THREE.SphereGeometry(radius, 64, 64),
          material: { color: 0x4682b4 },
          radius: 100
        }
      },

      // Star system templates
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

  /**
   * Create a building entity
   * @param {string} type - Building type
   * @param {Object} position - Position {x, y, z}
   * @param {Object} options - Additional options
   * @returns {Object} Created entity
   */
  createBuilding(type, position, options = {}) {
    const template = this.templates.buildings[type];
    if (!template) {
      console.warn(`Building template not found: ${type}`);
      return null;
    }

    const entity = this.world.createEntity();

    // Create mesh
    const geometry = this.assetManager.getGeometry(
      `building_${type}_geo`,
      template.geometry
    );

    const material = this.assetManager.getMaterial(
      `building_${type}_mat`,
      () => new THREE.MeshPhongMaterial(template.material)
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.scale.setScalar(template.scale);

    // Add components
    this.world.addComponent(entity, 'Position', components.Position(position.x, position.y, position.z));
    this.world.addComponent(entity, 'Building', components.Building(type, options.level || 1));
    this.world.addComponent(entity, 'Renderable', components.Renderable(mesh));
    this.world.addComponent(entity, 'Selectable', components.Selectable('building'));

    return entity;
  }

  /**
   * Create a ship entity
   * @param {string} name - Ship name
   * @param {Object} position - Position {x, y, z}
   * @param {string} faction - 'player' or 'enemy'
   * @param {Object} options - Additional options
   * @returns {Object} Created entity
   */
  createShip(name, position, faction = 'player', options = {}) {
    const template = this.templates.ships[faction];
    if (!template) {
      console.warn(`Ship template not found: ${faction}`);
      return null;
    }

    const entity = this.world.createEntity();

    // Create mesh
    const geometry = this.assetManager.getGeometry(
      `ship_${faction}_geo`,
      template.geometry
    );

    const material = this.assetManager.getMaterial(
      `ship_${faction}_mat`,
      () => new THREE.MeshPhongMaterial(template.material)
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.name = name;
    mesh.userData.entityId = entity;
    mesh.scale.setScalar(template.scale);

    // Add components
    this.world.addComponent(entity, 'Selectable', components.Selectable(faction));
    this.world.addComponent(entity, 'Combat', components.Combat(
      options.health || 100,
      options.maxHealth || 100,
      options.damage || 10
    ));

    if (options.shields !== false) {
      this.world.addComponent(entity, 'ShieldWedge', components.ShieldWedge(
        options.shieldHealth || 50,
        options.shieldMax || 50,
        options.shieldAngle || Math.PI / 2
      ));
    }

    return entity;
  }

  /**
   * Create a planet entity
   * @param {string} name - Planet name
   * @param {string} type - Planet type (terrestre, volcanique, gazeuse)
   * @param {Object} options - Additional options
   * @returns {Object} Created entity
   */
  createPlanet(name, type = 'terrestre', options = {}) {
    const template = this.templates.planets[type];
    if (!template) {
      console.warn(`Planet template not found: ${type}`);
      return null;
    }

    const entity = this.world.createEntity();
    const radius = options.radius || template.radius;

    // Add components
    this.world.addComponent(entity, 'Position', components.Position(0, 0, 0));
    this.world.addComponent(entity, 'Planet', components.Planet(type, radius));
    this.world.addComponent(entity, 'Renderable', components.Renderable('planet', template.material.color, { radius }));
    this.world.addComponent(entity, 'Selectable', components.Selectable('planet'));

    if (options.specialization) {
      this.world.addComponent(entity, 'Specialization', components.Specialization(options.specialization));
    }

    return entity;
  }

  /**
   * Create a star system entity
   * @param {string} name - System name
   * @param {Object} position - Position {x, y, z}
   * @param {Object} options - Additional options
   * @returns {Object} Created entity
   */
  createStarSystem(name, position, options = {}) {
    const entity = this.world.createEntity();

    // Create star mesh
    const starTemplate = this.templates.systems.star;
    const starGeometry = this.assetManager.getGeometry(
      'system_star_geo',
      starTemplate.geometry
    );

    const starMaterial = this.assetManager.getMaterial(
      'system_star_mat',
      () => new THREE.MeshBasicMaterial(starTemplate.material)
    );

    const starMesh = new THREE.Mesh(starGeometry, starMaterial);
    starMesh.position.set(position.x, position.y, position.z);
    starMesh.name = name;
    starMesh.userData.entityId = entity;

    // Add components
    this.world.addComponent(entity, 'Position', components.Position(position.x, position.y, position.z));
    this.world.addComponent(entity, 'StarSystem', components.StarSystem(name, position));
    this.world.addComponent(entity, 'Renderable', components.Renderable(starMesh));
    this.world.addComponent(entity, 'Selectable', components.Selectable('system'));

    if (options.owner) {
      this.world.addComponent(entity, 'Sovereignty', components.Sovereignty(
        options.owner,
        options.influenceRadius || 50,
        options.influenceStrength || 0.1
      ));
    }

    return entity;
  }

  /**
   * Create an influence zone mesh
   * @param {Object} position - Position {x, y, z}
   * @param {number} color - Color in hex format
   * @param {Object} options - Additional options
   * @returns {THREE.Mesh} Created mesh
   */
  createInfluenceZone(position, color, options = {}) {
    const template = this.templates.systems.influenceZone;
    const geometry = this.assetManager.getGeometry(
      'influence_zone_geo',
      template.geometry
    );

    const material = this.assetManager.getMaterial(
      `influence_mat_${color}`,
      () => new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: options.opacity || 0.1,
        side: THREE.DoubleSide
      })
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);

    return mesh;
  }

  /**
   * Create a building visual on a planet surface
   * @param {string} type - Building type
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {number} planetRadius - Planet radius
   * @returns {THREE.Mesh} Created mesh
   */
  createPlanetBuilding(type, latitude, longitude, planetRadius) {
    const template = this.templates.buildings[type];
    if (!template) {
      console.warn(`Building template not found: ${type}`);
      return null;
    }

    const geometry = this.assetManager.getGeometry(
      `building_${type}_geo`,
      template.geometry
    );

    const material = this.assetManager.getMaterial(
      `building_${type}_mat`,
      () => new THREE.MeshPhongMaterial(template.material)
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(template.scale);

    // Convert latitude/longitude to 3D position
    const latRad = (latitude * Math.PI) / 180;
    const lonRad = (longitude * Math.PI) / 180;
    const radius = planetRadius + 1; // Slightly above surface

    mesh.position.set(
      radius * Math.cos(latRad) * Math.cos(lonRad),
      radius * Math.sin(latRad),
      radius * Math.cos(latRad) * Math.sin(lonRad)
    );

    // Orient building perpendicular to surface
    mesh.lookAt(0, 0, 0);
    mesh.rotateX(Math.PI / 2);

    return mesh;
  }

  /**
   * Create a laser effect
   * @param {Object} start - Start position {x, y, z}
   * @param {Object} end - End position {x, y, z}
   * @param {Object} options - Additional options
   * @returns {THREE.Line} Created laser line
   */
  createLaser(start, end, options = {}) {
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

  /**
   * Create a planet grid (latitude/longitude lines)
   * @param {number} planetRadius - Planet radius
   * @param {Object} options - Additional options
   * @returns {THREE.Group} Group containing grid lines
   */
  createPlanetGrid(planetRadius, options = {}) {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: options.color || 0x444444,
      transparent: true,
      opacity: options.opacity || 0.3
    });

    // Latitude lines (parallels)
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

    // Longitude lines (meridians)
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
