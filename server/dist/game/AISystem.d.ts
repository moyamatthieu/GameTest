import { System } from '../../../shared/src/ecs/System';
import { World } from '../../../shared/src/ecs/World';
export declare class AISystem extends System {
    private readonly DETECTION_RANGE;
    private readonly ATTACK_RANGE;
    private readonly MOVE_SPEED;
    update(dt: number, world: World): void;
    private updateEnemyAI;
    private updatePassiveAI;
}
