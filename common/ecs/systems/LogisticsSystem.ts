import { IWorld, System } from '../../types/ecs';
import { LogisticsData, PositionData, CargoData, VelocityData, EconomyData } from '../../types/components';
import { Cargo } from '../components';

export const LogisticsSystem: System = (world: IWorld, deltaTime: number) => {
  const logisticsEntities = world.getEntitiesWith('Logistics', 'Position');
  const cargoEntities = world.getEntitiesWith('Cargo', 'Position', 'Velocity');

  // 1. Gérer les entités logistiques (Bases/Planètes) qui génèrent des transferts
  for (const entityId of logisticsEntities) {
    const logistics = world.getComponent<LogisticsData>(entityId, 'Logistics');
    const pos = world.getComponent<PositionData>(entityId, 'Position');

    if (logistics && pos) {
      for (let i = logistics.transfers.length - 1; i >= 0; i--) {
        const transfer = logistics.transfers[i];

        const cargoId = world.createEntity();
        world.addComponent<PositionData>(cargoId, 'Position', { ...pos });
        world.addComponent<VelocityData>(cargoId, 'Velocity', { vx: 0, vy: 0, vz: 0 });
        world.addComponent(cargoId, 'Renderable', { type: 'cargo_ship' });

        const cargoComp = Cargo(transfer.amount * 2);
        (cargoComp.inventory as any)[transfer.resource] = transfer.amount;
        cargoComp.originId = entityId;
        cargoComp.targetId = transfer.targetEntityId;
        cargoComp.status = 'traveling';

        world.addComponent<CargoData>(cargoId, 'Cargo', cargoComp);

        logistics.transfers.splice(i, 1);
      }
    }
  }

  // 2. Gérer le mouvement physique des CargoShips
  for (const cargoId of cargoEntities) {
    const cargo = world.getComponent<CargoData>(cargoId, 'Cargo');
    const pos = world.getComponent<PositionData>(cargoId, 'Position');
    const vel = world.getComponent<VelocityData>(cargoId, 'Velocity');

    if (cargo && pos && vel && cargo.status === 'traveling' && cargo.targetId !== null) {
      const targetPos = world.getComponent<PositionData>(cargo.targetId, 'Position');
      if (targetPos) {
        const dx = targetPos.x - pos.x;
        const dy = targetPos.y - pos.y;
        const dz = targetPos.z - pos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 1) {
          // Arrivé à destination
          cargo.status = 'unloading';
          const targetEconomy = world.getComponent<EconomyData>(cargo.targetId, 'Economy');
          if (targetEconomy) {
            for (const res in cargo.inventory) {
              const amount = cargo.inventory[res as keyof typeof cargo.inventory] || 0;
              if (typeof targetEconomy[res] === 'number') {
                targetEconomy[res] += amount;
              } else {
                targetEconomy[res] = amount;
              }
              cargo.inventory[res as keyof typeof cargo.inventory] = 0;
            }
          }
          world.destroyEntity(cargoId);
        } else {
          // Déplacement vers la cible
          const speed = 0.05;
          vel.vx = (dx / dist) * speed;
          vel.vy = (dy / dist) * speed;
          vel.vz = (dz / dist) * speed;

          pos.x += vel.vx * deltaTime;
          pos.y += vel.vy * deltaTime;
          pos.z += vel.vz * deltaTime;
        }
      }
    }
  }
};
