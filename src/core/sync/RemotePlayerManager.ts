import * as THREE from 'three';
import { RemotePlayer, VesselState } from './types';
import { PrimitiveFactory } from '../renderer/PrimitiveFactory';
import { SceneManager } from '../renderer/SceneManager';
import { HealthComponent } from '../../ecs/components/HealthComponent';

export class RemotePlayerManager {
  private players: Map<string, RemotePlayer & { health?: HealthComponent }> = new Map();
  private factory: PrimitiveFactory;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager, factory: PrimitiveFactory) {
    this.sceneManager = sceneManager;
    this.factory = factory;
  }

  public updatePlayerState(peerId: string, state: VesselState): void {
    let player = this.players.get(peerId);

    if (!player) {
      console.log(`New remote player detected: ${peerId}`);
      const ship = this.factory.createShip();
      ship.name = peerId; // Use peerId as name for collision detection
      this.sceneManager.addObject(ship);

      player = {
        peerId,
        state,
        lastUpdate: Date.now(),
        object: ship,
        health: new HealthComponent(100),
      };
      this.players.set(peerId, player);
    }

    player.state = state;
    player.lastUpdate = Date.now();

    if (player.object) {
      player.object.position.set(state.position.x, state.position.y, state.position.z);
      player.object.quaternion.set(
        state.rotation.x,
        state.rotation.y,
        state.rotation.z,
        state.rotation.w
      );
    }
  }

  public removePlayer(peerId: string): void {
    const player = this.players.get(peerId);
    if (player && player.object) {
      this.sceneManager.removeObject(player.object.name);
      this.players.delete(peerId);
      console.log(`Remote player removed: ${peerId}`);
    }
  }

  public applyDamage(peerId: string, amount: number): void {
    const player = this.players.get(peerId);
    if (player && player.health) {
      player.health.takeDamage(amount);
      console.log(`Player ${peerId} took ${amount} damage. HP: ${player.health.current}`);
      if (player.health.isDead) {
        this.removePlayer(peerId);
      }
    }
  }

  public getRemotePlayerObjects(): THREE.Object3D[] {
    return Array.from(this.players.values())
      .map((p) => p.object)
      .filter((obj): obj is THREE.Object3D => obj !== undefined);
  }

  public cleanup(timeoutMs: number = 5000): void {
    const now = Date.now();
    for (const [peerId, player] of this.players.entries()) {
      if (now - player.lastUpdate > timeoutMs) {
        console.log(`Player ${peerId} timed out`);
        this.removePlayer(peerId);
      }
    }
  }
}
