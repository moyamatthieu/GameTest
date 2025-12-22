import * as THREE from 'three';
import { System, World } from 'shared';
export declare class RenderSystem extends System {
    private scene;
    private camera;
    private localPlayerId;
    private isFirstPerson;
    meshes: Map<string, THREE.Object3D>;
    private equipmentMeshes;
    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera);
    setLocalPlayer(entityId: string): void;
    setFirstPerson(enabled: boolean): void;
    update(dt: number, world: World): void;
    private updateEquipmentVisuals;
    private floatingTexts;
    addFloatingText(text: string, position: THREE.Vector3, color?: string): void;
    private updateFloatingTexts;
    private createEquipmentMesh;
    private updateCamera;
    private createMesh;
}
