import { IWorld, System } from '../../types/ecs';
import { SovereigntyData, CorporationData, EconomyData, IdentityData } from '../../types/components';

export const SovereigntySystem: System = (world: IWorld, deltaTime: number) => {
  const sovereigntyEntities = world.getEntitiesWith('Sovereignty');
  const corporationEntities = world.getEntitiesWith('Corporation');
  const economyEntities = world.getEntitiesWith('Economy');

  // 1. Gérer l'influence et les revendications (Claims)
  for (const entityId of sovereigntyEntities) {
    const sovereignty = world.getComponent<SovereigntyData>(entityId, 'Sovereignty');
    if (sovereignty && sovereignty.ownerId) {
      sovereignty.influence = Math.min(100, sovereignty.influence + deltaTime * 2);
    }
  }

  // 2. Appliquer les taxes de souveraineté
  for (const economyId of economyEntities) {
    const economy = world.getComponent<EconomyData>(economyId, 'Economy');
    const identity = world.getComponent<IdentityData>(economyId, 'Identity');

    if (!economy || !identity || !identity.ownerId) continue;

    const sovereignty = world.getComponent<SovereigntyData>(economyId, 'Sovereignty');

    if (sovereignty && sovereignty.ownerId && sovereignty.ownerId !== identity.ownerId) {
      const taxAmount = economy.production.credits * sovereignty.taxRate;

      if (taxAmount > 0) {
        economy.production.credits -= taxAmount;

        const ownerCorpId = corporationEntities.find(corpId => {
          // Note: On suppose que ownerId dans Sovereignty est l'ID de l'entité Corporation
          // ou on doit faire une recherche plus complexe.
          return corpId.toString() === sovereignty.ownerId;
        });

        if (ownerCorpId !== undefined) {
          const corpComp = world.getComponent<CorporationData>(ownerCorpId, 'Corporation');
          if (corpComp) {
            corpComp.treasury += taxAmount;
          }
        }
      }
    }
  }
};
