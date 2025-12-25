import { IWorld, Snapshot, EntityState } from '../../common/types';

/**
 * Type pour les fonctions de rappel des abonnés aux changements d'état.
 */
export type StateChangeCallback = (state: Snapshot) => void;

/**
 * StateManager centralisé pour la gestion de l'état local du client.
 *
 * Ce gestionnaire est le "cerveau" de la synchronisation côté client. Il maintient
 * la cohérence entre les données reçues du serveur et les prédictions locales.
 *
 * ### Optimisations de latence et fluidité :
 *
 * 1. **Interpolation (Snapshot Interpolation)** :
 *    Le StateManager stocke les snapshots serveurs récents. Au lieu d'afficher
 *    immédiatement le dernier snapshot (ce qui causerait des saccades), le moteur
 *    de rendu peut interpoler entre deux snapshots passés pour un mouvement fluide.
 *
 * 2. **Prédiction Client (Client-side Prediction)** :
 *    Les actions du joueur (ex: déplacement) sont appliquées immédiatement à l'état
 *    local via le `PredictionEngine`. Le `StateManager` intègre ces prédictions
 *    pour une réactivité instantanée (0ms de latence perçue).
 *
 * 3. **Réconciliation (Server Reconciliation)** :
 *    Lorsque le serveur envoie un snapshot officiel, le `StateManager` vérifie si
 *    la prédiction locale était correcte. En cas de divergence (ex: collision non
 *    prédite), il "rembobine" l'état au snapshot serveur et réapplique les commandes
 *    locales en attente pour corriger la trajectoire sans saut visuel brusque.
 *
 * @template T Type étendant IWorld pour la flexibilité du moteur ECS.
 */
export class StateManager<T extends IWorld = IWorld> {
  private currentState: Snapshot | null = null;
  private lastServerSnapshot: Snapshot | null = null;
  private subscribers: Set<StateChangeCallback> = new Set();
  private world: T;

  /**
   * @param world Instance du monde ECS local.
   */
  constructor(world: T) {
    this.world = world;
  }

  /**
   * Applique un nouveau snapshot reçu du serveur.
   * Cette méthode est généralement appelée par le NetworkManager.
   *
   * @param snapshot Le snapshot d'état faisant autorité.
   */
  public applySnapshot(snapshot: Snapshot): void {
    // On garde trace du dernier état serveur pour la réconciliation
    this.lastServerSnapshot = snapshot;

    // Dans une implémentation avancée, on déclencherait ici la réconciliation
    // Pour le squelette, on met à jour l'état courant
    this.currentState = snapshot;

    this.notifySubscribers();
  }

  /**
   * Gère la réconciliation avec le moteur de prédiction.
   * Permet d'ajuster l'état local après une simulation de prédiction.
   *
   * @param predictedState L'état résultant de la prédiction locale.
   */
  public reconcile(predictedState: Snapshot): void {
    // On compare l'état prédit avec le dernier état serveur faisant autorité
    // Si la divergence est trop grande, on corrige.

    // Pour le squelette, on considère que l'état prédit devient l'état actuel
    this.currentState = predictedState;
    this.notifySubscribers();
  }

  /**
   * Récupère l'état actuel (mélange de snapshots serveurs et prédictions).
   * @returns Le snapshot actuel ou null si aucun état n'est disponible.
   */
  public getCurrentState(): Snapshot | null {
    return this.currentState;
  }

  /**
   * Récupère le dernier snapshot reçu du serveur (autorité).
   */
  public getLastServerSnapshot(): Snapshot | null {
    return this.lastServerSnapshot;
  }

  /**
   * Ajoute un abonné pour être notifié des changements d'état.
   * Utile pour l'UI ou les systèmes de rendu qui doivent réagir aux updates.
   *
   * @param callback Fonction de rappel recevant le nouveau snapshot.
   * @returns Une fonction pour se désabonner.
   */
  public subscribe(callback: StateChangeCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notifie tous les abonnés du changement d'état.
   */
  private notifySubscribers(): void {
    if (this.currentState) {
      this.subscribers.forEach(callback => callback(this.currentState!));
    }
  }

  /**
   * Synchronise le monde ECS avec l'état actuel du StateManager.
   * Parcourt les entités du snapshot et met à jour les composants correspondants.
   */
  public syncWorld(): void {
    if (!this.currentState) return;

    for (const entityState of this.currentState.entities) {
      this.updateEntityInWorld(entityState);
    }
  }

  /**
   * Met à jour une entité spécifique dans le monde ECS.
   * @param entityState État de l'entité à synchroniser.
   */
  private updateEntityInWorld(entityState: EntityState): void {
    const { id, components } = entityState;

    // Logique de synchronisation ECS :
    // Pour chaque composant dans l'état, on met à jour le composant dans le monde
    for (const [componentName, data] of Object.entries(components)) {
      if (this.world.hasComponent(id, componentName)) {
        const component = this.world.getComponent<any>(id, componentName);
        if (component) {
          // Mise à jour des données du composant
          // Note: Dans une implémentation réelle, on utiliserait un système de dirty checking
          Object.assign(component, data);
        }
      }
    }
  }
}
