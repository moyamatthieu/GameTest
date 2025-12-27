import * as THREE from 'three';

export class SelectableComponent {
  constructor(
    public ownerId: string,
    public isSelected: boolean = false,
    public selectionCircle: THREE.Mesh
  ) {}
}
