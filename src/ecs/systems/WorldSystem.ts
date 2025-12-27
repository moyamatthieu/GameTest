import * as THREE from 'three';
import { World } from '../World';
import { LocationComponent } from '../components/LocationComponent';
import { PlanetComponent } from '../components/PlanetComponent';
import { UniverseState, ViewScale, SystemData, PlanetData } from '../../core/world/types';
import { GalaxyRenderer } from '../../renderer/GalaxyRenderer';
import { SystemRenderer } from '../../renderer/SystemRenderer';
import { PlanetRenderer } from '../../renderer/PlanetRenderer';
import { SceneManager } from '../../core/renderer/SceneManager';
import { HeightmapGenerator } from '../../core/world/HeightmapGenerator';

export class WorldSystem {
  private currentViewScale: ViewScale | null = null;
  private currentSystemId: string | null = null;
  private currentPlanetId: string | null = null;

  private galaxyRenderer: GalaxyRenderer;
  private systemRenderer: SystemRenderer;
  private planetRenderer: PlanetRenderer;
  private heightmapGen: HeightmapGenerator;

  private worldGroup: THREE.Group;

  constructor(
    private world: World,
    private universe: UniverseState,
    private sceneManager: SceneManager
  ) {
    this.galaxyRenderer = new GalaxyRenderer();
    this.systemRenderer = new SystemRenderer();
    this.planetRenderer = new PlanetRenderer();
    this.heightmapGen = new HeightmapGenerator();
    this.worldGroup = new THREE.Group();
    this.worldGroup.name = 'world-group';
    this.sceneManager.addObject(this.worldGroup);
  }

  update(playerLocation: LocationComponent) {
    // Check for view scale change or initial render
    if (this.currentViewScale !== playerLocation.viewScale) {
      this.handleViewScaleChange(playerLocation);
      this.currentViewScale = playerLocation.viewScale;
    }

    // Check for system change within System view
    if (playerLocation.viewScale === 'System' && this.currentSystemId !== playerLocation.systemId) {
      this.loadSystem(playerLocation);
      this.currentSystemId = playerLocation.systemId;
    }

    // Check for planet change within Planet view
    // (Assuming systemId is also used to find the planet)
    if (playerLocation.viewScale === 'Planet' && this.currentPlanetId !== playerLocation.systemId) {
      this.loadPlanet(playerLocation);
      this.currentPlanetId = playerLocation.systemId;
    }
  }

  private handleViewScaleChange(location: LocationComponent) {
    this.worldGroup.clear();

    switch (location.viewScale) {
      case 'Galaxy':
        const galaxyGroup = this.galaxyRenderer.update(this.universe);
        this.worldGroup.add(galaxyGroup);
        break;
      case 'System':
        this.loadSystem(location);
        break;
      case 'Planet':
        this.loadPlanet(location);
        break;
    }
  }

  private loadSystem(location: LocationComponent) {
    this.worldGroup.clear();
    const cluster = this.universe.clusters.get(`${location.clusterX},${location.clusterY}`);
    if (!cluster) return;

    const system = cluster.systems.find(s => s.id === location.systemId);
    if (!system) return;

    const systemGroup = this.systemRenderer.update(system);
    this.worldGroup.add(systemGroup);
  }

  private loadPlanet(location: LocationComponent) {
    this.worldGroup.clear();
    const cluster = this.universe.clusters.get(`${location.clusterX},${location.clusterY}`);
    if (!cluster) return;

    const system = cluster.systems.find(s => s.id === location.systemId);
    if (!system) return;

    // For MVP, we just pick the first planet
    const planet = system.planets[0];

    // Generate heightmap lazily
    const heightmap = this.heightmapGen.generate(planet.heightmapSeed);

    const planetGroup = this.planetRenderer.update(planet, heightmap);
    this.worldGroup.add(planetGroup);
  }
}
