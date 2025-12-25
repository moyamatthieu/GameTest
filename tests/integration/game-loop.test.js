import { jest } from '@jest/globals';
import { World } from '../../common/ecs/World.js';
import { EconomySystem } from '../../common/ecs/systems/EconomySystem.js';
import { NetworkProtocol } from '../../server/network/Protocol.js';
import { Economy, Building, ProductionChain } from '../../common/ecs/components.js';

/**
 * Tests d'intégration pour la boucle de jeu complète
 * Vérifie le bon fonctionnement des systèmes ensemble
 */
describe('Game Loop Integration', () => {
  let world;
  let protocol;

  beforeEach(() => {
    world = new World();
    world.addSystem(EconomySystem);
    protocol = new NetworkProtocol();
  });

  describe('Complete Game Loop', () => {
    test('should run full game loop with economy system', () => {
      // Créer une planète avec une économie
      const planet = world.createEntity();
      world.addComponent(planet, 'Economy', Economy(1000, 500, 100));

      // Ajouter des bâtiments de production
      const mine = world.createEntity();
      world.addComponent(mine, 'Building', Building('mine', 2));
      world.addComponent(mine, 'ProductionChain', ProductionChain(
        {},
        { metal: 20 },
        1000
      ));

      const powerPlant = world.createEntity();
      world.addComponent(powerPlant, 'Building', Building('centrale', 1));
      world.addComponent(powerPlant, 'ProductionChain', ProductionChain(
        {},
        { energy: 15 },
        1000
      ));

      // Exécuter la boucle de jeu pendant 10 ticks (simulant 10 secondes)
      for (let i = 0; i < 10; i++) {
        world.update(1.0);
      }

      // Vérifier l'état final de l'économie
      const economy = world.getComponent(planet, 'Economy');

      // Mine level 2: 20 metal/sec * 10 sec = 200 metal
      // Power plant level 1: 15 energy/sec * 10 sec = 150 energy
      expect(economy.metal).toBe(1200);
      expect(economy.energy).toBe(650);
      expect(economy.credits).toBe(100); // Unchanged
    });

    test('should handle production chains with resource consumption', () => {
      const planet = world.createEntity();
      world.addComponent(planet, 'Economy', Economy(500, 1000, 100));

      // Usine qui consomme du métal pour produire de l'énergie
      const factory = world.createEntity();
      world.addComponent(factory, 'Building', Building('usine', 1));
      world.addComponent(factory, 'ProductionChain', ProductionChain(
        { metal: 10 },
        { energy: 25 },
        1000
      ));

      // Exécuter pendant 5 secondes
      for (let i = 0; i < 5; i++) {
        world.update(1.0);
      }

      const economy = world.getComponent(planet, 'Economy');

      // Consommé: 10 metal/sec * 5 sec = 50 metal
      // Produit: 25 energy/sec * 5 sec = 125 energy
      expect(economy.metal).toBe(450);
      expect(economy.energy).toBe(1125);
    });

    test('should stall production when resources are insufficient', () => {
      const planet = world.createEntity();
      world.addComponent(planet, 'Economy', Economy(25, 1000, 100)); // Low metal

      const factory = world.createEntity();
      world.addComponent(factory, 'Building', Building('usine', 1));
      world.addComponent(factory, 'ProductionChain', ProductionChain(
        { metal: 10 },
        { energy: 25 },
        1000
      ));

      // Exécuter pendant 10 secondes
      for (let i = 0; i < 10; i++) {
        world.update(1.0);
      }

      const economy = world.getComponent(planet, 'Economy');
      const productionChain = world.getComponent(factory, 'ProductionChain');

      // Devrait consommer seulement 20 metal (2 secondes de production)
      // puis staller quand les ressources sont insuffisantes
      expect(economy.metal).toBe(5);
      expect(economy.energy).toBe(1050); // 50 energy produced
      expect(productionChain.status).toBe('stalled_input');
    });
  });

  describe('Network Synchronization', () => {
    test('should serialize and deserialize game state', () => {
      // Créer un état de jeu
      const gameState = {
        entities: [
          { id: 1, type: 'planet', resources: { metal: 1000, energy: 500 } },
          { id: 2, type: 'ship', position: { x: 100, y: 200 } },
          { id: 3, type: 'building', buildingType: 'mine' }
        ],
        players: [
          { id: 'player1', name: 'Alice' },
          { id: 'player2', name: 'Bob' }
        ],
        timestamp: Date.now()
      };

      // Sérialiser
      const encoded = protocol.encodeSnapshot(gameState);

      // Désérialiser
      const decoded = protocol.decodeSnapshot(encoded);

      expect(decoded).toEqual(gameState);
      expect(encoded.length).toBeLessThan(JSON.stringify(gameState).length);
    });

    test('should use delta compression for network optimization', () => {
      const playerId = 'player1';

      // État initial
      const state1 = {
        entities: [
          { id: 1, position: { x: 100, y: 200 } },
          { id: 2, position: { x: 300, y: 400 } }
        ],
        timestamp: 1000
      };

      // État avec un seul changement
      const state2 = {
        entities: [
          { id: 1, position: { x: 110, y: 210 } }, // Position changée
          { id: 2, position: { x: 300, y: 400 } }  // Inchangé
        ],
        timestamp: 2000
      };

      // Premier snapshot (full)
      const delta1 = protocol.createDeltaSnapshot(playerId, state1);
      const decoded1 = protocol.decodeSnapshot(delta1);

      expect(decoded1.type).toBe('full');
      expect(decoded1.data.entities.length).toBe(2);

      // Deuxième snapshot (delta)
      const delta2 = protocol.createDeltaSnapshot(playerId, state2);
      const decoded2 = protocol.decodeSnapshot(delta2);

      expect(decoded2.type).toBe('delta');
      expect(decoded2.data.entities).toBeDefined();

      // Le delta devrait être plus petit que le snapshot complet
      const fullSize = protocol.encodeSnapshot(state2).length;
      expect(delta2.length).toBeLessThan(fullSize);
    });
  });

  describe('Performance Integration', () => {
    test('should handle 1000 entities efficiently', () => {
      const start = performance.now();

      // Créer 1000 entités avec différents composants
      for (let i = 0; i < 1000; i++) {
        const entity = world.createEntity();
        world.addComponent(entity, 'Economy', Economy(100, 100, 100));

        if (i % 3 === 0) {
          world.addComponent(entity, 'Building', Building('mine', 1));
        } else if (i % 3 === 1) {
          world.addComponent(entity, 'Building', Building('centrale', 1));
        }
      }

      const creationTime = performance.now() - start;
      expect(creationTime).toBeLessThan(100);

      // Exécuter la boucle de jeu
      const gameLoopStart = performance.now();
      world.update(1.0);
      const gameLoopTime = performance.now() - gameLoopStart;

      expect(gameLoopTime).toBeLessThan(50);
    });

    test('should maintain performance over extended gameplay', () => {
      // Simuler 5 minutes de jeu (300 ticks à 1 seconde chacun)
      const tickTimes = [];

      for (let i = 0; i < 300; i++) {
        const start = performance.now();
        world.update(1.0);
        const duration = performance.now() - start;
        tickTimes.push(duration);
      }

      const averageTickTime = tickTimes.reduce((a, b) => a + b, 0) / tickTimes.length;
      const maxTickTime = Math.max(...tickTimes);

      // La moyenne devrait être inférieure à 16ms (60 FPS)
      expect(averageTickTime).toBeLessThan(16);

      // Aucun tick ne devrait dépasser 50ms
      expect(maxTickTime).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    test('should gracefully handle missing components', () => {
      const entity = world.createEntity();

      // Essayer de récupérer un composant qui n'existe pas
      const component = world.getComponent(entity, 'NonExistent');

      expect(component).toBeNull();
    });

    test('should handle empty world state', () => {
      // Boucle de jeu avec un monde vide
      expect(() => {
        world.update(1.0);
      }).not.toThrow();
    });

    test('should handle network protocol with null values', () => {
      const data = { a: null, b: 0, c: undefined };

      const encoded = protocol.encodeSnapshot(data);
      const decoded = protocol.decodeSnapshot(encoded);

      expect(decoded.a).toBeNull();
      expect(decoded.b).toBe(0);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should complete full game cycle: build -> produce -> consume', () => {
      // Initialiser une planète
      const planet = world.createEntity();
      world.addComponent(planet, 'Economy', Economy(2000, 1000, 500));

      // Simuler la construction d'un bâtiment
      const mine = world.createEntity();
      world.addComponent(mine, 'Building', Building('mine', 3));
      world.addComponent(mine, 'ProductionChain', ProductionChain(
        {},
        { metal: 30 },
        1000
      ));

      // Simuler 60 secondes de jeu (1 minute)
      for (let i = 0; i < 60; i++) {
        world.update(1.0);
      }

      const economy = world.getComponent(planet, 'Economy');

      // Vérifier la production
      // 30 metal/sec * 60 sec * level 3 = 1800 metal
      expect(economy.metal).toBe(3800);
    });

    test('should handle complex production chains', () => {
      const planet = world.createEntity();
      world.addComponent(planet, 'Economy', Economy(5000, 2000, 1000));

      // Mine: produit du métal
      const mine = world.createEntity();
      world.addComponent(mine, 'Building', Building('mine', 2));
      world.addComponent(mine, 'ProductionChain', ProductionChain(
        {},
        { metal: 20 },
        1000
      ));

      // Usine: consomme du métal, produit de l'énergie
      const factory = world.createEntity();
      world.addComponent(factory, 'Building', Building('usine', 1));
      world.addComponent(factory, 'ProductionChain', ProductionChain(
        { metal: 15 },
        { energy: 30 },
        1000
      ));

      // Labo: consomme métal et énergie, produit des crédits
      const lab = world.createEntity();
      world.addComponent(lab, 'Building', Building('labo', 1));
      world.addComponent(lab, 'ProductionChain', ProductionChain(
        { metal: 10, energy: 20 },
        { credits: 15 },
        1000
      ));

      // Exécuter pendant 30 secondes
      for (let i = 0; i < 30; i++) {
        world.update(1.0);
      }

      const economy = world.getComponent(planet, 'Economy');

      // Calculs attendus:
      // Mine: +600 metal (20 * 30)
      // Factory: -450 metal, +900 energy (15 * 30, 30 * 30)
      // Lab: -300 metal, -600 energy, +450 credits (10 * 30, 20 * 30, 15 * 30)
      // Net: -150 metal, +300 energy, +450 credits

      expect(economy.metal).toBe(4850);
      expect(economy.energy).toBe(2300);
      expect(economy.credits).toBe(1450);
    });
  });
});
