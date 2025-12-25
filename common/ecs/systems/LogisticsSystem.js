import { Cargo } from '../components.js';

export const LogisticsSystem = (world, deltaTime) => {
  const logisticsEntities = world.getEntitiesWith('Logistics', 'Position');
  const cargoEntities = world.getEntitiesWith('Cargo', 'Position', 'Velocity');

  // 1. Gérer les entités logistiques (Bases/Planètes) qui génèrent des transferts
  for (const entityId of logisticsEntities) {
    const logistics = world.getComponent(entityId, 'Logistics');
    const pos = world.getComponent(entityId, 'Position');
    
    for (let i = logistics.transfers.length - 1; i >= 0; i--) {
      const transfer = logistics.transfers[i];
      
      // Au lieu de simplement attendre, on instancie un CargoShip physique
      const cargoId = world.createEntity();
      world.addComponent(cargoId, 'Position', { ...pos });
      world.addComponent(cargoId, 'Velocity', { vx: 0, vy: 0, vz: 0 });
      world.addComponent(cargoId, 'Renderable', { type: 'cargo_ship' });
      
      const cargoComp = Cargo(transfer.amount * 2); // Capacité suffisante
      cargoComp.inventory[transfer.resource] = transfer.amount;
      cargoComp.originId = entityId;
      cargoComp.targetId = transfer.targetEntityId;
      cargoComp.status = 'traveling';
      
      world.addComponent(cargoId, 'Cargo', cargoComp);
      
      // Retirer le transfert de la liste abstraite
      logistics.transfers.splice(i, 1);
    }
  }

  // 2. Gérer le mouvement physique des CargoShips
  for (const cargoId of cargoEntities) {
    const cargo = world.getComponent(cargoId, 'Cargo');
    const pos = world.getComponent(cargoId, 'Position');
    const vel = world.getComponent(cargoId, 'Velocity');

    if (cargo.status === 'traveling' && cargo.targetId !== null) {
      const targetPos = world.getComponent(cargo.targetId, 'Position');
      if (targetPos) {
        const dx = targetPos.x - pos.x;
        const dy = targetPos.y - pos.y;
        const dz = targetPos.z - pos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 1) {
          // Arrivé à destination
          cargo.status = 'unloading';
          const targetEconomy = world.getComponent(cargo.targetId, 'Economy');
          if (targetEconomy) {
            for (const res in cargo.inventory) {
              targetEconomy[res] += cargo.inventory[res];
              cargo.inventory[res] = 0;
            }
          }
          // Le cargo peut être détruit ou renvoyé
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
