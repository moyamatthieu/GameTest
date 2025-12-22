import { 
  Selector, 
  Sequence, 
  Node, 
  Inverter 
} from './BehaviorTree';
import { 
  CheckAggro, 
  Patrol, 
  AttackTarget, 
  Flee 
} from './AINodes';
import { EnemyType, BESTIARY } from '../../../shared/src/constants/Bestiary';

export class BTFactory {
  public static createBT(type: EnemyType): Node {
    const stats = BESTIARY[type];

    switch (type) {
      case EnemyType.SPRIGGAN:
        return new Selector([
          // Si HP bas, fuir
          new Sequence([
            Flee(stats.fleeThreshold || 0.2)
          ]),
          // Si joueur proche, attaquer
          new Sequence([
            CheckAggro(stats.aggroRange),
            AttackTarget()
          ]),
          // Sinon patrouiller
          Patrol([
            { x: 10, z: 10 },
            { x: -10, z: 10 },
            { x: -10, z: -10 },
            { x: 10, z: -10 }
          ])
        ]);

      case EnemyType.SPECTRAL_KNIGHT:
        return new Selector([
          // Le chevalier ne fuit pas. Il garde son point.
          new Sequence([
            CheckAggro(stats.aggroRange),
            AttackTarget()
          ]),
          // Patrouille très courte (garde)
          Patrol([
            { x: 0, z: 0 },
            { x: 1, z: 1 }
          ])
        ]);

      case EnemyType.LAND_DRAKE:
        return new Selector([
          new Sequence([
            Flee(stats.fleeThreshold || 0.1)
          ]),
          new Sequence([
            CheckAggro(stats.aggroRange),
            AttackTarget() // AttackTarget gérera la distance (ici 10 pour le drake)
          ]),
          Patrol([
            { x: 20, z: 0 },
            { x: 0, z: 20 },
            { x: -20, z: 0 },
            { x: 0, z: -20 }
          ])
        ]);

      default:
        return Patrol([{ x: 0, z: 0 }]);
    }
  }
}
