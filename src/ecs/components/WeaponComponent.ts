import { WeaponConfig } from '../../core/combat/types';

export class WeaponComponent implements WeaponConfig {
  public fireRate: number = 5; // 5 shots per second
  public damage: number = 10;
  public projectileSpeed: number = 200;
  public projectileLifeTime: number = 2;
  public lastFireTime: number = 0;

  public canFire(): boolean {
    const now = Date.now();
    const cooldown = 1000 / this.fireRate;
    return now - this.lastFireTime >= cooldown;
  }

  public recordFire(): void {
    this.lastFireTime = Date.now();
  }
}
