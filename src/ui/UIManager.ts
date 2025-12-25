import { uiStore, UIState } from './UIStore';
import { Constants } from '../utils/constants';

export class UIManager {
  private elements: Record<string, HTMLElement | null> = {};

  constructor() {
    this.init();
    uiStore.subscribe((state) => this.render(state));
  }

  private init(): void {
    this.elements = {
      metal: document.getElementById('res-metal'),
      energy: document.getElementById('res-energy'),
      credits: document.getElementById('res-credits'),
      metalCount: document.getElementById('metal-count'),
      energyCount: document.getElementById('energy-count'),
      selectionName: document.getElementById('selection-name'),
      selectionDetails: document.getElementById('selection-details'),
      defaultInfo: document.getElementById('default-info'),
      hpBarFill: document.getElementById('hp-bar-fill'),
      shieldBarFill: document.getElementById('shield-bar-fill'),
      hpContainer: document.getElementById('hp-bar-container'),
      shieldContainer: document.getElementById('shield-bar-container'),
      ownerEl: document.getElementById('selection-owner'),
      fleetPanel: document.getElementById('fleet-panel'),
      fleetList: document.getElementById('fleet-list'),
      productionList: document.getElementById('production-list'),
      corpName: document.getElementById('corp-name'),
      corpTreasury: document.getElementById('corp-treasury'),
      assetList: document.getElementById('asset-list'),
      buildMenu: document.getElementById('build-menu'),
      logisticsMenu: document.getElementById('logistics-menu'),
      activeTransfers: document.getElementById('active-transfers'),
      sceneIndicator: document.getElementById('scene-indicator'),
      combatActions: document.getElementById('combat-actions')
    };
  }

  private render(state: UIState): void {
    this.updateResources(state.resources);
    this.updateSelection(state.selection);
    this.updateFleets(state.fleets, state.currentScene);
    this.updateProduction(state.production);
    this.updateCorporation(state.corporation);
    this.updateMenus(state.currentScene, state.transfers);
  }

  private updateResources(res: { metal: number; energy: number; credits: number }): void {
    if (this.elements.metal) this.elements.metal.textContent = Math.floor(res.metal).toString();
    if (this.elements.energy) this.elements.energy.textContent = Math.floor(res.energy).toString();
    if (this.elements.credits) this.elements.credits.textContent = Math.floor(res.credits).toString();
    if (this.elements.metalCount) this.elements.metalCount.textContent = Math.floor(res.metal).toString();
    if (this.elements.energyCount) this.elements.energyCount.textContent = Math.floor(res.energy).toString();
    this.updateBuildButtons(res.metal);
  }

  private updateSelection(sel: { id: number | null; name: string; details: any }): void {
    if (!this.elements.selectionName) return;
    this.elements.selectionName.textContent = sel.name;

    if (sel.id === null) {
      this.elements.selectionDetails?.classList.add('hidden');
      this.elements.defaultInfo?.classList.remove('hidden');
      return;
    }

    this.elements.selectionDetails?.classList.remove('hidden');
    this.elements.defaultInfo?.classList.add('hidden');

    if (sel.details.hp !== undefined) {
      this.elements.hpContainer?.classList.remove('hidden');
      const hpPercent = (sel.details.hp / sel.details.maxHp) * 100;
      if (this.elements.hpBarFill) this.elements.hpBarFill.style.width = `${Math.max(0, hpPercent)}%`;
    } else {
      this.elements.hpContainer?.classList.add('hidden');
    }

    if (sel.details.shield !== undefined) {
      this.elements.shieldContainer?.classList.remove('hidden');
      const shieldPercent = (sel.details.shield / sel.details.maxShield) * 100;
      if (this.elements.shieldBarFill) this.elements.shieldBarFill.style.width = `${Math.max(0, shieldPercent)}%`;
    } else {
      this.elements.shieldContainer?.classList.add('hidden');
    }

    if (this.elements.ownerEl) {
      if (sel.details.ownerName) {
        this.elements.ownerEl.textContent = `Propriétaire : ${sel.details.ownerName}`;
        this.elements.ownerEl.style.color = sel.details.ownerColor || '#fff';
      } else {
        this.elements.ownerEl.textContent = sel.id ? 'Propriétaire : Aucun' : '';
      }
    }

    if (this.elements.combatActions) {
      if (sel.details.isEnemy) this.elements.combatActions.classList.remove('hidden');
      else this.elements.combatActions.classList.add('hidden');
    }
  }

  private updateFleets(fleets: any[], currentScene: string): void {
    if (!this.elements.fleetPanel || !this.elements.fleetList) return;
    if (currentScene === Constants.SCENES.SYSTEM) {
      this.elements.fleetPanel.style.display = 'block';
      if (fleets.length === 0) this.elements.fleetList.innerHTML = 'Aucune flotte';
      else this.elements.fleetList.innerHTML = fleets.map(f => `<div class="fleet-item" data-id="${f.id}">${f.name} (${f.shipCount} vaisseaux)</div>`).join('');
    } else {
      this.elements.fleetPanel.style.display = 'none';
    }
  }

  private updateProduction(production: any[]): void {
    if (!this.elements.productionList) return;
    if (production.length === 0) {
      this.elements.productionList.innerHTML = '<p>Aucune chaîne active</p>';
      return;
    }
    this.elements.productionList.innerHTML = production.map(p => {
      const statusClass = p.status === 'active' ? 'status-active' : 'status-stalled';
      const statusText = p.status === 'active' ? 'En production' : (p.status === 'stalled_input' ? 'Manque de ressources' : 'Stock plein');
      return `<div class="production-item"><div class="production-header"><strong>${p.type.toUpperCase()}</strong><span class="production-status ${statusClass}">${statusText}</span></div><div class="production-details">Efficacité: ${(p.efficiency * 100).toFixed(0)}%</div></div>`;
    }).join('');
  }

  private updateCorporation(corp: { name: string; treasury: number; color: string; assets: number[] }): void {
    if (this.elements.corpName) {
      this.elements.corpName.textContent = corp.name;
      this.elements.corpName.style.color = corp.color;
    }
    if (this.elements.corpTreasury) this.elements.corpTreasury.textContent = `Trésorerie : ${Math.floor(corp.treasury)} Cr`;
    if (this.elements.assetList) this.elements.assetList.innerHTML = corp.assets.map(id => `<li>Entité ${id}</li>`).join('');
  }

  private updateMenus(scene: string, transfers: any[]): void {
    if (scene === Constants.SCENES.PLANET) {
      this.elements.buildMenu?.classList.remove('hidden');
      this.elements.logisticsMenu?.classList.remove('hidden');
      if (this.elements.activeTransfers) {
        if (transfers.length === 0) this.elements.activeTransfers.innerHTML = 'Aucun transfert en cours';
        else this.elements.activeTransfers.innerHTML = transfers.map(t => `<div>${t.resource}: ${t.amount} (${t.remainingTime.toFixed(1)}s)</div>`).join('');
      }
    } else {
      this.elements.buildMenu?.classList.add('hidden');
      this.elements.logisticsMenu?.classList.add('hidden');
    }
    if (this.elements.sceneIndicator) this.elements.sceneIndicator.textContent = scene.toUpperCase();
  }

  private updateBuildButtons(metal: number): void {
    const costs: Record<string, number> = { base: 100, habitation: 30, ferme: 40, usine: 60, entrepot: 50, centrale: 80, mine: 120, route: 5 };
    document.querySelectorAll<HTMLButtonElement>('.build-btn').forEach(btn => {
      const type = btn.dataset.type || '';
      const cost = costs[type] || 0;
      if (metal < cost) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
      } else {
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    });
  }
}
