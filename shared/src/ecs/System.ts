import { World } from './World';

export abstract class System {
  public abstract update(dt: number, world: World): void;
}
