import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { Input } from '../components/Input';
import { Stats } from '../components/Stats';
import { MAP_OBSTACLES } from '../constants/MapData';

export class MovementSystem extends System {
  private readonly DEFAULT_MOVE_SPEED = 5;
  private readonly PLAYER_RADIUS = 0.5;

  public update(dt: number, world: World): void {
    const entities = world.getEntitiesWith(Position, Velocity, Input);

    for (const entity of entities) {
      const pos = world.getComponent(entity, Position)!;
      const vel = world.getComponent(entity, Velocity)!;
      const input = world.getComponent(entity, Input)!;
      const stats = world.getComponent(entity, Stats);

      // 1. Mise à jour de la rotation
      pos.rotationY = input.state.yaw;
      pos.pitch = input.state.pitch;

      // 2. Calcul du mouvement relatif à la rotation
      // Forward vector (sur le plan XZ)
      const forwardX = -Math.sin(pos.rotationY);
      const forwardZ = -Math.cos(pos.rotationY);

      // Right vector (perpendiculaire au forward)
      const rightX = Math.cos(pos.rotationY);
      const rightZ = -Math.sin(pos.rotationY);

      let moveX = 0;
      let moveZ = 0;

      if (input.state.up) {
        moveX += forwardX;
        moveZ += forwardZ;
      }
      if (input.state.down) {
        moveX -= forwardX;
        moveZ -= forwardZ;
      }
      if (input.state.left) {
        moveX -= rightX;
        moveZ -= rightZ;
      }
      if (input.state.right) {
        moveX += rightX;
        moveZ += rightZ;
      }

      // Normalisation du vecteur de direction
      if (moveX !== 0 || moveZ !== 0) {
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= length;
        moveZ /= length;
      }

      // 3. Vitesse
      const moveSpeed = stats?.moveSpeed ?? this.DEFAULT_MOVE_SPEED;
      vel.vx = moveX * moveSpeed;
      vel.vz = moveZ * moveSpeed;

      // Prédiction de la nouvelle position
      const nextX = pos.x + vel.vx * dt;
      const nextZ = pos.z + vel.vz * dt;

      // Collision simple (AABB)
      let collisionX = false;
      let collisionZ = false;

      for (const obs of MAP_OBSTACLES) {
        // Check X movement
        if (this.checkCollision(nextX, pos.z, this.PLAYER_RADIUS, obs)) {
          collisionX = true;
        }
        // Check Z movement
        if (this.checkCollision(pos.x, nextZ, this.PLAYER_RADIUS, obs)) {
          collisionZ = true;
        }
      }

      if (!collisionX) pos.x = nextX;
      if (!collisionZ) pos.z = nextZ;
    }
  }

  private checkCollision(px: number, pz: number, radius: number, obs: any): boolean {
    const obsMinX = obs.x - obs.w / 2;
    const obsMaxX = obs.x + obs.w / 2;
    const obsMinZ = obs.z - obs.d / 2;
    const obsMaxZ = obs.z + obs.d / 2;

    const closestX = Math.max(obsMinX, Math.min(px, obsMaxX));
    const closestZ = Math.max(obsMinZ, Math.min(pz, obsMaxZ));

    const distanceX = px - closestX;
    const distanceZ = pz - closestZ;

    const distanceSquared = (distanceX * distanceX) + (distanceZ * distanceZ);
    return distanceSquared < (radius * radius);
  }
}
