import { describe, it, expect, beforeEach } from 'vitest';
import { SelectionSystem } from '../../../../src/ecs/systems/SelectionSystem';
import * as THREE from 'three';
import { World } from '../../../../src/ecs/World';
import { SelectableComponent } from '../../../../src/ecs/components/SelectableComponent';

describe('SelectionSystem', () => {
  let scene: THREE.Scene;
  let world: World;
  let system: SelectionSystem;
  let entity: number;
  let selectable: SelectableComponent;

  beforeEach(() => {
    scene = new THREE.Scene();
    world = new World();
    system = new SelectionSystem(scene);
    entity = world.createEntity();
    selectable = new SelectableComponent('player1', false, new THREE.Mesh());
    world.addComponent(entity, selectable);
  });

  it('should add selection circle to scene when selected', () => {
    selectable.isSelected = true;
    system.update(world, 0.016);
    expect(scene.children).toContain(selectable.selectionCircle);
  });

  it('should remove selection circle from scene when deselected', () => {
    selectable.isSelected = true;
    system.update(world, 0.016);
    expect(scene.children).toContain(selectable.selectionCircle);

    selectable.isSelected = false;
    system.update(world, 0.016);
    expect(scene.children).not.toContain(selectable.selectionCircle);
  });

  // TODO: Add more tests
});
