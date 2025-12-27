import { System } from '../System';
import { World } from '../World';
import { Position } from '../components/Position';
import { Movable } from '../components/Movable';
import { Vector3 } from 'three';

export class MovementSystem implements System {
  update(world: World, delta: number): void {
    const entities = world.getEntitiesWith(Position, Movable);

    for (const entity of entities) {
      const position = world.getComponent(entity, Position)!;
      const movable = world.getComponent(entity, Movable)!;

      if (movable.target) {
        const currentPos = new Vector3(position.x, position.y, position.z);
        const direction = new Vector3().subVectors(movable.target, currentPos);
        direction.y = 0; // Keep on ground plane

        const distance = direction.length();

        if (distance < 0.1) {
          movable.target = null;
          movable.isMoving = false;
        } else {
          direction.normalize();
          const moveStep = movable.speed;

          position.x += direction.x * moveStep;
          position.z += direction.z * moveStep;

          movable.isMoving = true;
        }
      } else {
        movable.isMoving = false;
      }
    }
  }
}
