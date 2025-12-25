import * as THREE from 'three';
import { Constants } from '../utils/constants';
import { ConstructionContext } from '../../common/ecs/components';
import { IGame } from '../scenes/BaseScene';

export class BuildingPlacer {
  private game: IGame & { isBuildingMode: boolean; ghostBuilding: THREE.Mesh | null; buildingType: string | null; playerEntity: number | null; mouse: THREE.Vector2; sceneManager: any; meshSync: any };
  private raycaster: THREE.Raycaster;
  private planetGenerator: any;
  private buildingGrid: any;
  private placementValidator: any;
  private currentValidation: any;

  constructor(game: any) {
    this.game = game;
    this.raycaster = new THREE.Raycaster();
    this.planetGenerator = null;
    this.buildingGrid = null;
    this.placementValidator = null;
    this.currentValidation = null;
  }

  initialize(planetGenerator: any, buildingGrid: any, placementValidator: any): void {
    this.planetGenerator = planetGenerator;
    this.buildingGrid = buildingGrid;
    this.placementValidator = placementValidator;
  }

  update(deltaTime: number): void {
    if (!this.game.isBuildingMode || !this.game.ghostBuilding) return;

    const mode = this._detectConstructionMode();

    if (mode === 'PLANET') {
      this._handlePlanetConstruction();
    } else if (mode === 'SPACE') {
      this._handleSpaceConstruction();
    }
  }

  private _detectConstructionMode(): 'PLANET' | 'SPACE' {
    const currentScene = this.game.sceneManager.currentSceneName;
    return currentScene === Constants.SCENES.PLANET ? 'PLANET' : 'SPACE';
  }

  private _handleSpaceConstruction(): void {
    const systemScene = this.game.sceneManager.scenes.get('system');
    if (!systemScene) return;

    this.raycaster.setFromCamera(this.game.mouse, systemScene.camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(plane, target)) {
      const spaceGridSize = 10;
      const snappedX = Math.round(target.x / spaceGridSize) * spaceGridSize;
      const snappedZ = Math.round(target.z / spaceGridSize) * spaceGridSize;
      const snappedY = 0;

      this.game.ghostBuilding!.position.set(snappedX, snappedY, snappedZ);
      this.game.ghostBuilding!.rotation.set(0, 0, 0);

      if (!this.game.ghostBuilding!.userData.constructionContext) {
        this.game.ghostBuilding!.userData.constructionContext = ConstructionContext('SPACE', systemScene.systemId);
      }

      const context = this.game.ghostBuilding!.userData.constructionContext;
      context.snappingData = { x: snappedX, z: snappedZ };

      const isValid = this._checkCanAfford();
      this._updateGhostVisual(isValid, 100);

      this.game.ghostBuilding!.userData.snappedX = snappedX;
      this.game.ghostBuilding!.userData.snappedZ = snappedZ;
    }
  }

  private _handlePlanetConstruction(): void {
    if (!this.planetGenerator || !this.buildingGrid || !this.placementValidator) return;

    const planetScene = this.game.sceneManager.scenes.get('planet');
    if (!planetScene || !planetScene.planetEntityId) return;

    const planetMesh = this.game.meshSync.entityMeshes.get(planetScene.planetEntityId);
    if (!planetMesh) return;

    this.raycaster.setFromCamera(this.game.mouse, planetScene.camera);
    const intersects = this.raycaster.intersectObject(planetMesh);

    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point;
      const intersectionNormal = intersects[0].face!.normal.clone();

      intersectionNormal.transformDirection(planetMesh.matrixWorld);

      const gridCoords = this.buildingGrid.worldToGrid(intersectionPoint);
      const snappedPosition = this.buildingGrid.gridToWorld(gridCoords.theta, gridCoords.phi);

      const terrainData = this.planetGenerator.getTerrainDataAt(snappedPosition);
      const terrainNormal = terrainData ? terrainData.normal : intersectionNormal;

      const buildingHeight = this._getBuildingHeight(this.game.buildingType!);
      const offsetPosition = snappedPosition.clone().add(
        terrainNormal.clone().multiplyScalar(buildingHeight / 2)
      );

      this.game.ghostBuilding!.position.copy(offsetPosition);
      this.game.ghostBuilding!.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        terrainNormal
      );

      const playerEconomy = this.game.world.getComponent<any>(this.game.playerEntity!, 'Economy');
      const validation = this.placementValidator.validate(
        snappedPosition,
        this.game.buildingType,
        playerEconomy
      );

      this.currentValidation = validation;

      if (!this.game.ghostBuilding!.userData.constructionContext) {
        this.game.ghostBuilding!.userData.constructionContext = ConstructionContext('PLANET', planetScene.planetEntityId);
      }

      const context = this.game.ghostBuilding!.userData.constructionContext;
      context.snappingData = {
        theta: gridCoords.theta,
        phi: gridCoords.phi,
        height: terrainData ? terrainData.height : 0,
        slope: terrainData ? terrainData.slope : 0
      };

      this.game.ghostBuilding!.userData.theta = gridCoords.theta;
      this.game.ghostBuilding!.userData.phi = gridCoords.phi;
      this.game.ghostBuilding!.userData.snappedPosition = offsetPosition;

      this._updateGhostVisual(validation.valid, validation.data.qualityScore || 0);
    }
  }

  private _checkCanAfford(): boolean {
    if (!this.game.playerEntity) return false;

    const economy = this.game.world.getComponent<any>(this.game.playerEntity, 'Economy');
    if (!economy) return false;

    const costs: Record<string, { metal: number }> = {
      base: { metal: 100 },
      habitation: { metal: 30 },
      ferme: { metal: 40 },
      usine: { metal: 60 },
      entrepot: { metal: 50 },
      centrale: { metal: 80 },
      mine: { metal: 120 },
      route: { metal: 5 }
    };

    const cost = costs[this.game.buildingType!] || { metal: 0 };
    return economy.metal >= cost.metal;
  }

  private _updateGhostVisual(isValid: boolean, qualityScore = 100): void {
    if (!this.game.ghostBuilding) return;
    const material = this.game.ghostBuilding.material as THREE.MeshPhongMaterial;
    material.color.setHex(isValid ? 0x00ff00 : 0xff0000);
    material.opacity = 0.6;
  }

  private _getBuildingHeight(type: string): number {
    const heights: Record<string, number> = {
      base: 4, habitation: 2, ferme: 1, usine: 2, entrepot: 1.5, centrale: 3, mine: 2.5, route: 0.2
    };
    return heights[type] || 2;
  }

  tryPlaceBuilding(): boolean {
    if (!this.game.isBuildingMode || !this.game.ghostBuilding) return false;

    if (!this._checkCanAfford()) return false;

    const pos = this.game.ghostBuilding.position;
    const rot = this.game.ghostBuilding.rotation;
    const type = this.game.buildingType;
    const mode = this._detectConstructionMode();

    if (this.game.networkManager) {
      this.game.networkManager.socket.emit('requestPlacement', {
        type, x: pos.x, y: pos.y, z: pos.z,
        rotX: rot.x, rotY: rot.y, rotZ: rot.z,
        mode, playerId: this.game.playerEntity
      });

      this.game.isBuildingMode = false;
      if (this.game.ghostBuilding.parent) {
        this.game.ghostBuilding.parent.remove(this.game.ghostBuilding);
      }
      this.game.ghostBuilding = null;
      this.game.buildingType = null;
      return true;
    }

    return false;
  }
}
