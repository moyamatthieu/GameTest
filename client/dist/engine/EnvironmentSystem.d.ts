import * as THREE from 'three';
import { System, World } from 'shared';
/**
 * Système gérant l'environnement atmosphérique, le terrain et les structures procédurales.
 */
export declare class EnvironmentSystem extends System {
    private scene;
    private terrain;
    private sunLight;
    private ambientLight;
    private megaliths;
    private rocks;
    constructor(scene: THREE.Scene);
    private setupAtmosphere;
    private setupLights;
    private generateTerrain;
    private generateMegaliths;
    private getTerrainHeight;
    update(dt: number, world: World): void;
}
