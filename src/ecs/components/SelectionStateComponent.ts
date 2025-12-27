import { Component, Entity } from '../World';

/**
 * SelectionStateComponent
 *
 * Global singleton component holding all selection state.
 * Should be attached to a singleton entity during game initialization.
 *
 * @see specs/011-rts-unit-selection/data-model.md
 */
export class SelectionStateComponent implements Component {
  constructor(
    public selectedEntities: Set<Entity> = new Set(),
    public selectionBox: {
      active: boolean;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    } | null = null
  ) {}

  // Helper methods

  public getSelectedCount(): number {
    return this.selectedEntities.size;
  }

  public hasSelection(): boolean {
    return this.selectedEntities.size > 0;
  }

  public clearSelection(): void {
    this.selectedEntities.clear();
  }

  public addEntity(entity: Entity): void {
    this.selectedEntities.add(entity);
  }

  public removeEntity(entity: Entity): void {
    this.selectedEntities.delete(entity);
  }

  public toggleEntity(entity: Entity): void {
    if (this.selectedEntities.has(entity)) {
      this.selectedEntities.delete(entity);
    } else {
      this.selectedEntities.add(entity);
    }
  }

  public isEntitySelected(entity: Entity): boolean {
    return this.selectedEntities.has(entity);
  }

  public getSelectedEntities(): Entity[] {
    return Array.from(this.selectedEntities);
  }
}

/**
 * Helper function to retrieve the SelectionStateComponent singleton from the world.
 *
 * @param world The ECS World instance
 * @returns The SelectionStateComponent singleton
 * @throws Error if SelectionStateComponent is not found (game not properly initialized)
 */
export function getSelectionState(world: any): SelectionStateComponent {
  const entities = world.getEntitiesWith(SelectionStateComponent);
  if (entities.length === 0) {
    throw new Error('SelectionStateComponent singleton not found. Ensure it is created during game initialization.');
  }
  return world.getComponent(entities[0], SelectionStateComponent)!;
}
