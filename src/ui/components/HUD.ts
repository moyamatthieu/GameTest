import { HealthComponent } from '../../ecs/components/HealthComponent';
import { LocationComponent } from '../../ecs/components/LocationComponent';
import { CargoComponent } from '../../ecs/components/CargoComponent';

export class HUD {
  private container: HTMLElement;
  private healthFill: HTMLElement;
  private healthText: HTMLElement;
  private radar: HTMLElement;
  private targetInfo: HTMLElement;
  private locationInfo: HTMLElement;
  private cargoInfo: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'hud-container';
    parent.appendChild(this.container);

    this.container.innerHTML = `
      <div id="health-bar-container" class="hud-panel">
        <div style="margin-bottom: 5px;">HULL INTEGRITY</div>
        <div style="border: 1px solid #00ff00; height: 20px;">
          <div id="health-bar-fill"></div>
        </div>
        <div id="health-text" style="text-align: right; margin-top: 5px;">100%</div>
      </div>

      <div id="crosshair"></div>

      <div id="radar" class="hud-panel">
        <div style="position: absolute; top: 50%; left: 50%; width: 100%; height: 1px; background: rgba(0,255,0,0.2);"></div>
        <div style="position: absolute; top: 0; left: 50%; width: 1px; height: 100%; background: rgba(0,255,0,0.2);"></div>
        <div class="radar-dot player" style="top: 50%; left: 50%;"></div>
        <div id="radar-entities"></div>
      </div>

      <div id="target-info" class="hud-panel">
        <div id="target-name">NO TARGET</div>
        <div id="target-hp">HP: ---</div>
      </div>

      <div id="cargo-panel" class="hud-panel" style="top: 180px; right: 20px; width: 150px;">
        <div style="border-bottom: 1px solid #00ff00; margin-bottom: 5px;">CARGO BAY</div>
        <div id="cargo-list" style="font-size: 12px;">EMPTY</div>
        <div id="cargo-load" style="margin-top: 5px; text-align: right; font-size: 10px;">0/100</div>
      </div>

      <div id="location-display" style="position: absolute; bottom: 20px; right: 20px; text-align: right;">
        <div id="location-text">SECTOR: 0,0 | SYSTEM: 0</div>
      </div>
    `;

    this.healthFill = document.getElementById('health-bar-fill')!;
    this.healthText = document.getElementById('health-text')!;
    this.radar = document.getElementById('radar-entities')!;
    this.targetInfo = document.getElementById('target-info')!;
    this.locationInfo = document.getElementById('location-text')!;
    this.cargoInfo = document.getElementById('cargo-list')!;
  }

  updateCargo(cargo: CargoComponent) {
    if (cargo.items.size === 0) {
      this.cargoInfo.innerText = 'EMPTY';
    } else {
      let html = '';
      cargo.items.forEach((amount, type) => {
        html += `<div>${type}: ${Math.floor(amount)}</div>`;
      });
      this.cargoInfo.innerHTML = html;
    }
    document.getElementById('cargo-load')!.innerText = `${Math.floor(cargo.currentLoad)}/${cargo.capacity}`;
  }

  updateHealth(health: HealthComponent) {
    const percent = (health.current / health.max) * 100;
    this.healthFill.style.width = `${percent}%`;
    this.healthText.innerText = `${Math.ceil(percent)}%`;

    if (percent < 30) {
      this.healthFill.style.background = '#ff0000';
    } else if (percent < 60) {
      this.healthFill.style.background = '#ffff00';
    } else {
      this.healthFill.style.background = '#00ff00';
    }
  }

  updateLocation(loc: LocationComponent) {
    this.locationInfo.innerText = `SECTOR: ${loc.clusterX},${loc.clusterY} | SYSTEM: ${loc.systemIndex}`;
  }

  updateRadar(playerPos: { x: number, z: number }, entities: { x: number, z: number, type: 'planet' | 'enemy' }[]) {
    this.radar.innerHTML = '';
    const radarSize = 150;
    const radarRange = 1000; // Distance represented by radar radius

    entities.forEach(entity => {
      const dx = entity.x - playerPos.x;
      const dz = entity.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < radarRange) {
        const dot = document.createElement('div');
        dot.className = `radar-dot ${entity.type}`;

        // Map to radar coordinates (0-100%)
        const rx = 50 + (dx / radarRange) * 50;
        const ry = 50 + (dz / radarRange) * 50;

        dot.style.left = `${rx}%`;
        dot.style.top = `${ry}%`;
        this.radar.appendChild(dot);
      }
    });
  }

  showTarget(name: string, hp: number) {
    this.targetInfo.style.display = 'block';
    document.getElementById('target-name')!.innerText = name;
    document.getElementById('target-hp')!.innerText = `HP: ${hp}`;

    // Hide after 3 seconds of no updates
    if ((this as any).targetTimeout) clearTimeout((this as any).targetTimeout);
    (this as any).targetTimeout = setTimeout(() => {
      this.targetInfo.style.display = 'none';
    }, 3000);
  }
}
