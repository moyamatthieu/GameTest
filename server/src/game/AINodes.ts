import { 
  Node, 
  NodeStatus, 
  Context, 
  ActionNode, 
  ConditionNode 
} from './BehaviorTree';
import { Position } from '../../../shared/src/components/Position';
import { Velocity } from '../../../shared/src/components/Velocity';
import { Input } from '../../../shared/src/components/Input';
import { CombatState } from '../../../shared/src/components/CombatState';
import { Stats } from '../../../shared/src/components/Stats';
import { NPC } from '../../../shared/src/components/NPC';
import { BESTIARY, EnemyType, EnemyStats } from '../../../shared/src/constants/Bestiary';

const getEnemyStats = (world: any, entityId: string): EnemyStats | null => {
  const npc = world.getComponent(entityId, NPC);
  if (!npc) return null;
  return BESTIARY[npc.name as EnemyType] || BESTIARY[EnemyType.SPRIGGAN];
};

export const CheckAggro = (range: number) => new ConditionNode((context: Context) => {
  const { world, entityId, blackboard } = context;
  const pos = world.getComponent(entityId, Position);
  if (!pos) return false;

  // Si on a déjà une cible, on vérifie si elle est toujours valide et à portée
  const currentTargetId = blackboard.get<string>('targetId');
  if (currentTargetId) {
    const targetPos = world.getComponent(currentTargetId, Position);
    if (targetPos) {
      const dx = targetPos.x - pos.x;
      const dz = targetPos.z - pos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < range * 1.5) { // On garde l'aggro un peu plus loin que la détection initiale
        return true;
      }
    }
    blackboard.delete('targetId');
  }

  const players = world.getEntitiesWith(Input, Position);
  let closestPlayer: string | null = null;
  let minDistance = range;

  for (const playerEntity of players) {
    const playerPos = world.getComponent(playerEntity, Position)!;
    const dx = playerPos.x - pos.x;
    const dz = playerPos.z - pos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < minDistance) {
      minDistance = distance;
      closestPlayer = playerEntity;
    }
  }

  if (closestPlayer) {
    blackboard.set('targetId', closestPlayer);
    return true;
  }

  return false;
});

export const Patrol = (points: {x: number, z: number}[]) => new ActionNode((context: Context) => {
  const { world, entityId, blackboard } = context;
  const pos = world.getComponent(entityId, Position);
  const vel = world.getComponent(entityId, Velocity);
  if (!pos || !vel) return NodeStatus.FAILURE;

  const stats = getEnemyStats(world, entityId);
  const speed = stats ? stats.moveSpeed * 0.5 : 2; // Patrouille plus lente que la poursuite

  let currentIndex = blackboard.get<number>('patrolIndex') || 0;
  const target = points[currentIndex];
  
  const dx = target.x - pos.x;
  const dz = target.z - pos.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance < 0.5) {
    currentIndex = (currentIndex + 1) % points.length;
    blackboard.set('patrolIndex', currentIndex);
    vel.vx = 0;
    vel.vz = 0;
    return NodeStatus.SUCCESS;
  }

  vel.vx = (dx / distance) * speed;
  vel.vz = (dz / distance) * speed;
  pos.rotationY = Math.atan2(-dx, -dz);

  return NodeStatus.RUNNING;
});

export const AttackTarget = () => new ActionNode((context: Context) => {
  const { world, entityId, blackboard } = context;
  const targetId = blackboard.get<string>('targetId');
  if (!targetId) return NodeStatus.FAILURE;

  const pos = world.getComponent(entityId, Position);
  const targetPos = world.getComponent(targetId, Position);
  if (!pos || !targetPos) return NodeStatus.FAILURE;

  const stats = getEnemyStats(world, entityId);
  const attackRange = stats ? stats.attackRange : 2;
  const moveSpeed = stats ? stats.moveSpeed : 4;

  const dx = targetPos.x - pos.x;
  const dz = targetPos.z - pos.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance > attackRange) {
    // Move towards target
    const vel = world.getComponent(entityId, Velocity);
    if (vel) {
      vel.vx = (dx / distance) * moveSpeed;
      vel.vz = (dz / distance) * moveSpeed;
      pos.rotationY = Math.atan2(-dx, -dz);
    }
    return NodeStatus.RUNNING;
  }

  // In range, stop and attack
  const vel = world.getComponent(entityId, Velocity);
  if (vel) {
    vel.vx = 0;
    vel.vz = 0;
  }

  // Gestion du cooldown d'attaque
  const now = Date.now();
  const lastAttack = blackboard.get<number>('lastAttackTime') || 0;
  const attackCooldown = stats ? (1000 / stats.attackSpeed) : 1000;

  if (now - lastAttack >= attackCooldown) {
    let combatState = world.getComponent(entityId, CombatState);
    if (!combatState) {
      combatState = new CombatState();
      world.addComponent(entityId, combatState);
    }
    combatState.targetId = targetId;
    blackboard.set('lastAttackTime', now);
    return NodeStatus.SUCCESS;
  }
  
  return NodeStatus.RUNNING;
});

export const Flee = (threshold: number) => new ActionNode((context: Context) => {
  const { world, entityId, blackboard } = context;
  const statsComp = world.getComponent(entityId, Stats);
  if (!statsComp || statsComp.hp / statsComp.maxHp > threshold) return NodeStatus.FAILURE;

  const targetId = blackboard.get<string>('targetId');
  if (!targetId) return NodeStatus.FAILURE;

  const pos = world.getComponent(entityId, Position);
  const targetPos = world.getComponent(targetId, Position);
  const vel = world.getComponent(entityId, Velocity);
  if (!pos || !targetPos || !vel) return NodeStatus.FAILURE;

  const stats = getEnemyStats(world, entityId);
  const fleeSpeed = stats ? stats.moveSpeed * 1.2 : 5;

  const dx = pos.x - targetPos.x; // Away from target
  const dz = pos.z - targetPos.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  vel.vx = (dx / distance) * fleeSpeed;
  vel.vz = (dz / distance) * fleeSpeed;
  pos.rotationY = Math.atan2(-dx, -dz);

  return NodeStatus.RUNNING;
});

