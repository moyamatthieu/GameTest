import { HealthState } from '../../core/combat/types';

export class HealthComponent implements HealthState {
  public current: number;
  public max: number;
  public isDead: boolean = false;

  constructor(max: number = 100) {
    this.max = max;
    this.current = max;
  }

  public takeDamage(amount: number): void {
    if (this.isDead) return;
    this.current -= amount;
    if (this.current <= 0) {
      this.current = 0;
      this.isDead = true;
    }
  }
}
