import * as THREE from 'three';
import { ConnectionManager } from '../network/ConnectionManager';
import { IdentityManager } from '../identity/IdentityManager';
import { SelectionManager } from './SelectionManager';
import { CommandType, RTSCommand } from './types';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export class CommandDispatcher {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private selectionManager: SelectionManager;
  private connectionManager: ConnectionManager;
  private identityManager: typeof IdentityManager;
  private raycaster: THREE.Raycaster;
  private groundPlane: THREE.Plane;

  constructor(camera: THREE.Camera, scene: THREE.Scene, selectionManager: SelectionManager, connectionManager: ConnectionManager) {
    this.camera = camera;
    this.scene = scene;
    this.selectionManager = selectionManager;
    this.connectionManager = connectionManager;
    this.identityManager = IdentityManager;
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=0 plane
  }

  handleRightClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const mouse = new THREE.Vector2(x, y);

    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      const targetType = this.getTargetType(hitObject);
      if (targetType === 'enemy') {
        this.dispatchAttackCommand(hitObject);
      } else if (targetType === 'resource') {
        this.dispatchHarvestCommand(hitObject);
      } else if (targetType === 'unit') {
        // TODO: Implement FOLLOW
        this.dispatchMoveCommand(intersects[0].point);
      } else {
        this.dispatchMoveCommand(intersects[0].point);
      }
    } else {
      // Raycast to ground
      const intersection = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.groundPlane, intersection);
      if (intersection) {
        this.dispatchMoveCommand(intersection);
      }
    }
  }

  private getTargetType(object: THREE.Object3D): string | null {
    // Traverse to find userData.type
    let current: THREE.Object3D | null = object;
    while (current) {
      if (current.userData.type) {
        return current.userData.type as string;
      }
      current = current.parent;
    }
    return null;
  }

  private dispatchAttackCommand(targetObject: THREE.Object3D): void {
    const targetId = targetObject.userData.entityId;
    if (!targetId) return;

    const selectedIds = Array.from(this.selectionManager.selectionState.selectedEntityIds);
    if (selectedIds.length === 0) return;

    // Similar to move, but with targetId
    const identity = this.identityManager.getOrCreateIdentity();
    const tick = Date.now();
    const sequence = 0;

    const command: RTSCommand = {
      issuer: bs58.encode(identity.publicKey),
      signature: '',
      tick,
      sequence,
      type: CommandType.ATTACK,
      unitIds: selectedIds,
      target: {
        x: 0, y: 0, z: 0, // Not used for attack
        entityId: targetId,
      },
    };

    const message = JSON.stringify(command);
    const signature = nacl.sign.detached(new TextEncoder().encode(message), identity.secretKey);
    command.signature = bs58.encode(signature);

    const broadcastMessage = {
      type: 'COMMAND_BROADCAST',
      command: {
        issuer: command.issuer,
        signature: command.signature,
        tick: command.tick,
        sequence: command.sequence,
        action: command.type,
        units: command.unitIds,
        target: command.target,
        targetId: targetId,
      },
    };

    console.log('Broadcasting attack command:', broadcastMessage);
  }

  private dispatchHarvestCommand(targetObject: THREE.Object3D): void {
    // Similar to attack
    const targetId = targetObject.userData.entityId;
    if (!targetId) return;

    const selectedIds = Array.from(this.selectionManager.selectionState.selectedEntityIds);
    if (selectedIds.length === 0) return;

    const identity = this.identityManager.getOrCreateIdentity();
    const tick = Date.now();
    const sequence = 0;

    const command: RTSCommand = {
      issuer: bs58.encode(identity.publicKey),
      signature: '',
      tick,
      sequence,
      type: CommandType.HARVEST,
      unitIds: selectedIds,
      target: {
        x: 0, y: 0, z: 0,
        entityId: targetId,
      },
    };

    const message = JSON.stringify(command);
    const signature = nacl.sign.detached(new TextEncoder().encode(message), identity.secretKey);
    command.signature = bs58.encode(signature);

    const broadcastMessage = {
      type: 'COMMAND_BROADCAST',
      command: {
        issuer: command.issuer,
        signature: command.signature,
        tick: command.tick,
        sequence: command.sequence,
        action: command.type,
        units: command.unitIds,
        target: command.target,
        targetId: targetId,
      },
    };

    console.log('Broadcasting harvest command:', broadcastMessage);
  }

  private dispatchMoveCommand(target: THREE.Vector3): void {
    const selectedIds = Array.from(this.selectionManager.selectionState.selectedEntityIds);
    if (selectedIds.length === 0) return;

    const identity = this.identityManager.getOrCreateIdentity();
    const tick = Date.now(); // Placeholder for game tick
    const sequence = 0; // Placeholder

    const command: RTSCommand = {
      issuer: bs58.encode(identity.publicKey),
      signature: '', // Will set after signing
      tick,
      sequence,
      type: CommandType.MOVE,
      unitIds: selectedIds,
      target: {
        x: target.x,
        y: target.y,
        z: target.z,
      },
    };

    // Sign the command
    const message = JSON.stringify(command);
    const signature = nacl.sign.detached(new TextEncoder().encode(message), identity.secretKey);
    command.signature = bs58.encode(signature);

    // Broadcast
    const broadcastMessage = {
      type: 'COMMAND_BROADCAST',
      command: {
        issuer: command.issuer,
        signature: command.signature,
        tick: command.tick,
        sequence: command.sequence,
        action: command.type,
        units: command.unitIds,
        target: command.target,
      },
    };

    // Assume connectionManager has broadcast method
    // this.connectionManager.broadcast(broadcastMessage);
    console.log('Broadcasting command:', broadcastMessage);
  }
}
