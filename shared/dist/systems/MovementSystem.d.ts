import { System } from '../ecs/System';
import { World } from '../ecs/World';
export declare class MovementSystem extends System {
    private readonly DEFAULT_MOVE_SPEED;
    private readonly PLAYER_RADIUS;
    update(dt: number, world: World): void;
    private checkCollision;
}
