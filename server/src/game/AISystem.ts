import { System } from '../../../shared/src/ecs/System';
import { World } from '../../../shared/src/ecs/World';
import { Position } from '../../../shared/src/components/Position';
import { Velocity } from '../../../shared/src/components/Velocity';
import { NPC, NPCType } from '../../../shared/src/components/NPC';
import { AIComponent } from './AIComponent';
import { BTFactory } from './BTFactory';
import { EnemyType } from '../../../shared/src/constants/Bestiary';

export class AISystem extends System {
  public update(dt: number, world: World): void {
    const now = Date.now();
    const entities = world.getEntitiesWith(NPC, Position, Velocity);

    for (const entityId of entities) {
      const npc = world.getComponent(entityId, NPC)!;
      
      // On ne gère que les ennemis pour l'instant avec les BTs
      if (npc.npcType !== NPCType.ENEMY) continue;

      let ai = world.getComponent(entityId, AIComponent);

      // Initialisation de l'IA si absente
      if (!ai) {
        // On détermine le type d'ennemi (par défaut Spriggan pour le test)
        // Dans un vrai système, cela viendrait d'un composant EnemyData
        const enemyType = (npc.name as EnemyType) || EnemyType.SPRIGGAN;
        ai = new AIComponent(BTFactory.createBT(enemyType));
        world.addComponent(entityId, ai);
      }

      // Throttling: On ne met à jour l'IA que selon son intervalle
      if (now - ai.lastUpdate < ai.updateInterval) {
        continue;
      }

      // Exécution du Behavior Tree
      ai.rootNode.tick({
        world,
        entityId,
        blackboard: ai.blackboard,
        dt: dt
      });

      ai.lastUpdate = now;
    }
  }
}
