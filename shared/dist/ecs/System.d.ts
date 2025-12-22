import { World } from './World';
export declare abstract class System {
    abstract update(dt: number, world: World): void;
}
