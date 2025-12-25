import { IWorld, System } from '../../types/ecs';
import { CombatData, PositionData, CargoData, ShieldWedgeData, RenderableData } from '../../types/components';

export const CombatSystem: System = (world: IWorld, deltaTime: number) => {
  const entities = world.getEntitiesWith('Combat', 'Position');
  const currentTime = Date.now();

  for (const entity of entities) {
    const combat = world.getComponent<CombatData>(entity, 'Combat');
    const pos = world.getComponent<PositionData>(entity, 'Position');

    if (combat && pos && combat.targetId !== null) {
      const target = combat.targetId;
      const targetPos = world.getComponent<PositionData>(target, 'Position');
      const targetCombat = world.getComponent<CombatData>(target, 'Combat');
      const targetCargo = world.getComponent<CargoData>(target, 'Cargo');

      if (!targetPos || (!targetCombat && !targetCargo)) {
        combat.targetId = null;
        continue;
      }

      // Si la cible est un cargo sans composant Combat, on lui en ajoute un par défaut
      if (targetCargo && !targetCombat) {
        world.addComponent<CombatData>(target, 'Combat', { 
          hp: 50, 
          maxHp: 50, 
          firepower: 0,
          targetId: null,
          lastFireTime: 0,
          fireRate: 1000
        });
      }

      const updatedTargetCombat = world.getComponent<CombatData>(target, 'Combat');

      if (updatedTargetCombat && updatedTargetCombat.hp <= 0) {
        combat.targetId = null;
        continue;
      }

      // Vérifier le cooldown de tir
      if (currentTime - combat.lastFireTime >= combat.fireRate) {
        if (updatedTargetCombat && targetPos) {
          fireAtTarget(world, entity, target, combat, pos, targetPos, updatedTargetCombat);
          combat.lastFireTime = currentTime;
        }
      }
    }
  }
};

function fireAtTarget(
  world: IWorld, 
  attacker: number, 
  target: number, 
  attackerCombat: CombatData, 
  attackerPos: PositionData, 
  targetPos: PositionData, 
  targetCombat: CombatData
) {
  // Calcul de la direction de l'impact
  const dx = attackerPos.x - targetPos.x;
  const dz = attackerPos.z - targetPos.z;

  // Angle d'impact dans le plan XZ
  const impactAngle = Math.atan2(dx, dz);

  const targetShield = world.getComponent<ShieldWedgeData>(target, 'ShieldWedge');
  let damage = attackerCombat.firepower;

  if (targetShield && targetShield.strength > 0) {
    // Récupérer l'orientation du vaisseau cible (si disponible)
    const targetRenderable = world.getComponent<RenderableData>(target, 'Renderable');
    // Note: En TS, on ne peut pas accéder à .mesh directement sur RenderableData car c'est un objet de données pur.
    // Le mesh est géré par le système de rendu côté client.
    // Pour le serveur, on pourrait avoir besoin d'un composant Rotation.
    const targetRotationComp = world.getComponent<{ y: number }>(target, 'Rotation');
    const targetRotation = targetRotationComp ? targetRotationComp.y : 0;

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
    }
  }

  if (damage > 0) {
    targetCombat.hp -= damage;

    if (targetCombat.hp <= 0) {
      // Logique de destruction
    }
  }

  // Événement visuel
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
