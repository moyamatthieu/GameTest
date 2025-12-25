import { Constants } from '../utils/constants.js';

/**
 * Un store simple pour l'état de l'UI, inspiré par le pattern Observer.
 * Permet de découpler l'ECS de l'UI.
 */
export class UIStore {
  constructor() {
    this.state = {
      resources: { metal: 0, energy: 0, credits: 0 },
      selection: { id: null, name: 'Aucune sélection', details: {} },
      fleets: [],
      production: [],
      corporation: { name: '', treasury: 0, color: '#fff', assets: [] },
      currentScene: Constants.SCENES.PLANET,
      isBuildingMode: false,
      buildingType: null,
      transfers: []
    };
    this.listeners = new Set();
  }

  /**
   * Met à jour une partie de l'état et notifie les abonnés
   */
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };

    // Notification simple (on pourrait optimiser en comparant les clés)
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Appel immédiat pour initialiser l'UI
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const uiStore = new UIStore();
