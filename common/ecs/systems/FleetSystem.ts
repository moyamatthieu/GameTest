import { IWorld, System } from '../../types/ecs';
import { FleetData, PositionData } from '../../types/components';
import { ComponentTypes } from '../components';

export const FleetSystem: System = (world: IWorld, deltaTime: number) => {
  const fleets = world.getEntitiesWith('Fleet', 'Position');

  for (const fleetEntity of fleets) {
    const fleet = world.getComponent<FleetData>(fleetEntity, 'Fleet');
    const fleetPos = world.getComponent<PositionData>(fleetEntity, 'Position');

    if (fleet && fleetPos) {
      updateFormation(world, fleet, fleetPos);
      updateJumpLogic(world, fleet, fleetEntity, deltaTime);
    }
  }
};

function updateFormation(world: IWorld, fleet: FleetData, fleetPos: PositionData) {
  const members = fleet.members.filter((id) => {
    // Note: On accède à world.entityMasks qui n'est pas dans IWorld.
    // On devrait peut-être ajouter hasComponent ou utiliser getEntitiesWith.
    return world.hasComponent(id, 'Position');
  });

  if (members.length === 0) return;

  members.forEach((memberId, index) => {
    const pos = world.getComponent<PositionData>(memberId, 'Position');
    if (!pos) return;

    const offset = getFormationOffset(fleet.formation, index, members.length);

    const targetX = fleetPos.x + offset.x;
    const targetY = fleetPos.y + offset.y;
    const targetZ = fleetPos.z + offset.z;

    pos.x += (targetX - pos.x) * 0.1;
    pos.y += (targetY - pos.y) * 0.1;
    pos.z += (targetZ - pos.z) * 0.1;
  });
}

function getFormationOffset(type: string, index: number, total: number) {
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

function updateJumpLogic(world: IWorld, fleet: FleetData, fleetEntity: number, deltaTime: number) {
  if (!fleet.isJumping) return;

  fleet.jumpProgress += deltaTime * 0.0005;

  if (fleet.jumpProgress >= 1) {
    fleet.isJumping = false;
    fleet.jumpProgress = 0;

    if (fleet.destination) {
      const fleetPos = world.getComponent<PositionData>(fleetEntity, 'Position');
      if (fleetPos) {
        fleetPos.x = fleet.destination.x;
        fleetPos.y = fleet.destination.y;
        fleetPos.z = fleet.destination.z;

        fleet.members.forEach((id) => {
          const mPos = world.getComponent<PositionData>(id, 'Position');
          if (mPos && fleet.destination) {
            mPos.x = fleet.destination.x;
            mPos.y = fleet.destination.y;
            mPos.z = fleet.destination.z;
          }
        });
      }
      fleet.destination = null;
    }
  }
}
