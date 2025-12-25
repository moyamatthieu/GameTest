/**
 * Types de base pour le système ECS (Entity Component System)
 */

export type Entity = number;

/**
 * Interface pour un système ECS
 */
export type System = (world: IWorld, deltaTime: number) => void;

/**
 * Interface pour le monde ECS
 */
export interface IWorld {
  /**
   * Crée une nouvelle entité
   */
  createEntity(requestedId?: number | null): Entity;

  /**
   * Détruit une entité et ses composants
   */
  destroyEntity(entity: Entity): void;

  /**
   * Ajoute un composant à une entité
   */
  addComponent<T>(entity: Entity, componentName: string, data?: T): void;

  /**
   * Supprime un composant d'une entité
   */
  removeComponent(entity: Entity, componentName: string): void;

  /**
   * Récupère un composant pour une entité donnée
   */
  getComponent<T>(entity: Entity, componentName: string): T | null;

  /**
   * Vérifie si une entité possède un composant
   */
  hasComponent(entity: Entity, componentName: string): boolean;

  /**
   * Ajoute un système au monde
   */
  addSystem(system: System): void;

  /**
   * Met à jour tous les systèmes
   */
  update(deltaTime: number): void;

  /**
   * Récupère toutes les entités possédant un ensemble de composants
   */
  getEntitiesWith(...componentNames: string[]): Entity[];
}
