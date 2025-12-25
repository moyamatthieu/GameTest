export const SovereigntySystem = (world, deltaTime) => {
  const sovereigntyEntities = world.getEntitiesWith('Sovereignty');
  const corporationEntities = world.getEntitiesWith('Corporation');
  const economyEntities = world.getEntitiesWith('Economy');

  // 1. Gérer l'influence et les revendications (Claims)
  for (const entityId of sovereigntyEntities) {
    const sovereignty = world.getComponent(entityId, 'Sovereignty');

    // Si le système est possédé, on renforce l'influence du propriétaire
    if (sovereignty.ownerId) {
      sovereignty.influence = Math.min(100, sovereignty.influence + deltaTime * 2);
    }

    // Logique de contestation simplifiée
    if (sovereignty.contested) {
      // On pourrait réduire l'influence ici ou gérer les conflits
    }
  }

  // 2. Appliquer les taxes de souveraineté
  // Pour chaque entité avec une économie, si elle est dans un territoire taxé
  for (const economyId of economyEntities) {
    const economy = world.getComponent(economyId, 'Economy');
    const identity = world.getComponent(economyId, 'Identity');

    if (!identity || !identity.ownerId) continue;

    // Trouver si cette entité est sous une souveraineté étrangère
    // Note: Dans une version complète, on chercherait le système parent.
    // Ici on simplifie : si l'entité a aussi un composant Sovereignty
    const sovereignty = world.getComponent(economyId, 'Sovereignty');

    if (sovereignty && sovereignty.ownerId && sovereignty.ownerId !== identity.ownerId) {
      const taxAmount = economy.production.credits * sovereignty.taxRate;

      if (taxAmount > 0) {
        // Déduire de la production locale
        economy.production.credits -= taxAmount;

        // Créditer la corporation propriétaire
        const ownerCorp = corporationEntities.find(corpId => corpId === sovereignty.ownerId);
        if (ownerCorp) {
          const corpComp = world.getComponent(ownerCorp, 'Corporation');
          corpComp.treasury += taxAmount;
        }
      }
    }
  }
};
