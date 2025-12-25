import { ComponentTypes } from '../components.js';

export class FleetSystem {
  constructor(world) {
    this.world = world;
  }

  update(deltaTime) {
    const fleets = this.world.getEntitiesWith('Fleet', 'Position');

    for (const fleetEntity of fleets) {
      const fleet = this.world.getComponent(fleetEntity, 'Fleet');
      const fleetPos = this.world.getComponent(fleetEntity, 'Position');

      this.updateFormation(fleet, fleetPos);
      this.updateJumpLogic(fleet, fleetEntity, deltaTime);
    }
  }

  updateFormation(fleet, fleetPos) {
    const members = fleet.members
      .filter((id) => {
        const mask = this.world.entityMasks.get(id);
        const posBit = ComponentTypes.Position;
        return mask !== undefined && (mask & posBit) === posBit;
      });

    if (members.length === 0) return;

    members.forEach((memberId, index) => {
      const pos = this.world.getComponent(memberId, 'Position');
      const offset = this.getFormationOffset(fleet.formation, index, members.length);

      // Les membres tendent vers leur position dans la formation par rapport au centre de la flotte
      const targetX = fleetPos.x + offset.x;
      const targetY = fleetPos.y + offset.y;
      const targetZ = fleetPos.z + offset.z;

      // Interpolation simple pour le mouvement de formation
      pos.x += (targetX - pos.x) * 0.1;
      pos.y += (targetY - pos.y) * 0.1;
      pos.z += (targetZ - pos.z) * 0.1;
    });
  }

  getFormationOffset(type, index, total) {
    const spacing = 5;
    switch (type) {
      case 'line':
        return { x: (index - (total - 1) / 2) * spacing, y: 0, z: 0 };
      case 'delta':
        const row = Math.floor(Math.sqrt(index));
        const col = index - row * row;
        return { x: (col - row) * spacing, y: 0, z: -row * spacing };
      case 'circle':
      default:
        const angle = (index / total) * Math.PI * 2;
        return { x: Math.cos(angle) * spacing, y: 0, z: Math.sin(angle) * spacing };
    }
  }

  updateJumpLogic(fleet, fleetEntity, deltaTime) {
    if (!fleet.isJumping) return;

    fleet.jumpProgress += deltaTime * 0.0005; // Vitesse de saut arbitraire

    if (fleet.jumpProgress >= 1) {
      fleet.isJumping = false;
      fleet.jumpProgress = 0;

      if (fleet.destination) {
        const fleetPos = this.world.getComponent(fleetEntity, 'Position');
        fleetPos.x = fleet.destination.x;
        fleetPos.y = fleet.destination.y;
        fleetPos.z = fleet.destination.z;

        // Téléporter tous les membres
        fleet.members.forEach((id) => {
          const mPos = this.world.getComponent(id, 'Position');
          if (mPos) {
            mPos.x = fleetPos.x;
            mPos.y = fleetPos.y;
            mPos.z = fleetPos.z;
          }
        });
        fleet.destination = null;
      }
    }
  }
}
