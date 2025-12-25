import { Constants } from '../utils/constants';

export interface UIState {
  resources: { metal: number; energy: number; credits: number };
  selection: { id: number | null; name: string; details: any };
  fleets: any[];
  production: any[];
  corporation: { name: string; treasury: number; color: string; assets: number[] };
  currentScene: string;
  isBuildingMode: boolean;
  buildingType: string | null;
  transfers: any[];
}

export type UIListener = (state: UIState) => void;

/**
 * Un store simple pour l'état de l'UI, inspiré par le pattern Observer.
 */
export class UIStore {
  private state: UIState;
  private listeners: Set<UIListener>;

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

  setState(newState: Partial<UIState>): void {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  subscribe(listener: UIListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  getState(): UIState {
    return this.state;
  }
}

export const uiStore = new UIStore();
