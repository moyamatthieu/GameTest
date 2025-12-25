import * as THREE from 'three';

export const CombatSystem = (world, deltaTime) => {
  const entities = world.getEntitiesWith('Combat', 'Position');
  const currentTime = Date.now();

  for (const entity of entities) {
    const combat = world.getComponent(entity, 'Combat');
    const pos = world.getComponent(entity, 'Position');

    if (combat.targetId !== null) {
      const target = combat.targetId;
      const targetPos = world.getComponent(target, 'Position');
      const targetCombat = world.getComponent(target, 'Combat');
      const targetCargo = world.getComponent(target, 'Cargo');

      if (!targetPos || (!targetCombat && !targetCargo)) {
        combat.targetId = null;
        continue;
      }

      // Si la cible est un cargo sans composant Combat, on lui en ajoute un par défaut ou on gère les dégâts directement
      if (targetCargo && !targetCombat) {
        world.addComponent(target, 'Combat', { hp: 50, maxHp: 50, firepower: 0 });
      }

      if (targetCombat && targetCombat.hp <= 0) {
        combat.targetId = null;
        continue;
      }

      // Vérifier le cooldown de tir
      if (currentTime - combat.lastFireTime >= combat.fireRate) {
        fireAtTarget(world, entity, target, combat, pos, targetPos, targetCombat);
        combat.lastFireTime = currentTime;
      }
    }
  }
};

function fireAtTarget(world, attacker, target, attackerCombat, attackerPos, targetPos, targetCombat) {
  // Calcul de la direction de l'impact
  const dx = attackerPos.x - targetPos.x;
  const dy = attackerPos.y - targetPos.y;
  const dz = attackerPos.z - targetPos.z;

  // Angle d'impact dans le plan XZ (simplifié pour le moment)
  const impactAngle = Math.atan2(dx, dz);

  const targetShield = world.getComponent(target, 'ShieldWedge');
  let damage = attackerCombat.firepower;

  if (targetShield && targetShield.strength > 0) {
    // Récupérer l'orientation du vaisseau cible (si disponible, sinon on suppose 0)
    const targetRenderable = world.getComponent(target, 'Renderable');
    const targetRotation = targetRenderable ? targetRenderable.mesh.rotation.y : 0;

    // Calculer l'angle relatif par rapport à l'orientation du vaisseau
    let relativeAngle = impactAngle - targetRotation;
    // Normaliser l'angle entre -PI et PI
    relativeAngle = ((relativeAngle + Math.PI) % (2 * Math.PI)) - Math.PI;

    // Vérifier si l'impact est dans le wedge du bouclier
    const halfWedge = targetShield.angle / 2;
    const diff = Math.abs(relativeAngle - targetShield.direction);

    if (diff <= halfWedge || diff >= (2 * Math.PI - halfWedge)) {
      // Le bouclier absorbe les dégâts
      const absorbed = Math.min(targetShield.strength, damage);
      targetShield.strength -= absorbed;
      damage -= absorbed;
      console.log(`Entity ${target} shield absorbed ${absorbed} damage. Remaining shield: ${targetShield.strength}`);
    }
  }

  if (damage > 0) {
    targetCombat.hp -= damage;
    console.log(`Entity ${target} took ${damage} damage. Remaining HP: ${targetCombat.hp}`);

    if (targetCombat.hp <= 0) {
      console.log(`Entity ${target} destroyed!`);
      // On pourrait détruire l'entité ici ou laisser un autre système s'en charger
    }
  }

  // Événement visuel (sera intercepté par la scène pour afficher un laser)
  // Note: window.dispatchEvent ne fonctionnera pas côté serveur, il faudra adapter
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('combat-fire', {
      detail: {
        attackerId: attacker,
        targetId: target,
        attackerPos: { ...attackerPos },
        targetPos: { ...targetPos }
      }
    });
    window.dispatchEvent(event);
  }
}
