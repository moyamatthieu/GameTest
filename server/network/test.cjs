const { NetworkProtocol } = await import('./Protocol.js');
const { InterestManager } = await import('./InterestManager.js');

console.log('=== Test des optimisations réseau ===\n');

// Test 1: Protocole de sérialisation
console.log('Test 1: MessagePack + Delta Compression');
console.log('----------------------------------------');

const protocol = new NetworkProtocol();

// Simuler des données de jeu typiques
const testSnapshot1 = {
  entities: [
    {
      id: 1,
      components: {
        Position: { x: 100, y: 200, z: 300 },
        Building: { type: 'mine', level: 5 },
        Economy: { metal: 1500, energy: 800 }
      }
    },
    {
      id: 2,
      components: {
        Position: { x: 150, y: 250, z: 350 },
        Building: { type: 'factory', level: 3 },
        Economy: { metal: 2000, energy: 1200 }
      }
    },
    {
      id: 3,
      components: {
        Position: { x: 200, y: 300, z: 400 },
        Fleet: { name: 'Alpha', shipCount: 10 }
      }
    }
  ]
};

const testSnapshot2 = {
  entities: [
    {
      id: 1,
      components: {
        Position: { x: 101, y: 200, z: 300 }, // Seul changement
        Building: { type: 'mine', level: 5 },
        Economy: { metal: 1600, energy: 800 } // metal changé
      }
    },
    {
      id: 2,
      components: {
        Position: { x: 150, y: 250, z: 350 },
        Building: { type: 'factory', level: 3 },
        Economy: { metal: 2000, energy: 1200 }
      }
    },
    {
      id: 3,
      components: {
        Position: { x: 200, y: 300, z: 400 },
        Fleet: { name: 'Alpha', shipCount: 12 } // shipCount changé
      }
    }
  ]
};

// Encoder le snapshot complet
const fullEncoded1 = protocol.encodeSnapshot(testSnapshot1);
console.log(`Taille snapshot complet: ${fullEncoded1.length} bytes`);

// Encoder avec delta compression
const deltaEncoded1 = protocol.createDeltaSnapshot('player1', testSnapshot1);
console.log(`Taille premier delta: ${deltaEncoded1.length} bytes`);

const deltaEncoded2 = protocol.createDeltaSnapshot('player1', testSnapshot2);
console.log(`Taille delta avec changements: ${deltaEncoded2.length} bytes`);

const metrics1 = protocol.getMetrics();
console.log(`\nMétriques protocole:`);
console.log(`  Compression ratio: ${metrics1.compressionRatio}`);
console.log(`  Bytes saved: ${metrics1.bytesSaved}`);

// Test 2: Interest Management
console.log('\n\nTest 2: Interest Management (Spatial Hashing)');
console.log('-----------------------------------------------');

const interestManager = new InterestManager(1000);

// Simuler des joueurs
interestManager.updatePlayerPosition('player1', { x: 500, y: 0, z: 500 });
interestManager.updatePlayerPosition('player2', { x: 5000, y: 0, z: 5000 });

// Simuler des entités dans différentes zones
for (let i = 0; i < 100; i++) {
  const x = Math.random() * 10000;
  const y = 0;
  const z = Math.random() * 10000;

  interestManager.updateEntity(i, { x, y, z }, {
    id: i,
    components: {
      Position: { x, y, z },
      Building: { type: 'test', level: 1 }
    }
  });
}

// Tester le filtrage
const allEntities = [];
for (let i = 0; i < 100; i++) {
  allEntities.push({
    id: i,
    components: {
      Position: { x: Math.random() * 10000, y: 0, z: Math.random() * 10000 },
      Building: { type: 'test', level: 1 }
    }
  });
}

const filteredForPlayer1 = interestManager.filterEntitiesForPlayer('player1', allEntities);
const filteredForPlayer2 = interestManager.filterEntitiesForPlayer('player2', allEntities);

console.log(`Total entités: ${allEntities.length}`);
console.log(`Entités visibles pour player1: ${filteredForPlayer1.length}`);
console.log(`Entités visibles pour player2: ${filteredForPlayer2.length}`);

const metrics2 = interestManager.getMetrics();
console.log(`\nMétriques Interest Management:`);
console.log(`  Reduction ratio: ${metrics2.reductionRatio}`);
console.log(`  Average entities per update: ${metrics2.averageEntitiesPerUpdate}`);

// Test 3: Performance comparison
console.log('\n\nTest 3: Comparaison JSON vs MessagePack');
console.log('---------------------------------------');

const largeSnapshot = {
  entities: []
};

// Créer un gros snapshot
for (let i = 0; i < 500; i++) {
  largeSnapshot.entities.push({
    id: i,
    components: {
      Position: { x: Math.random() * 1000, y: Math.random() * 1000, z: Math.random() * 1000 },
      Building: { type: 'test', level: Math.floor(Math.random() * 10) },
      Economy: {
        metal: Math.random() * 10000,
        energy: Math.random() * 5000,
        credits: Math.random() * 100000
      }
    }
  });
}

// JSON
const jsonStart = Date.now();
const jsonString = JSON.stringify(largeSnapshot);
const jsonSize = Buffer.byteLength(jsonString, 'utf8');
const jsonTime = Date.now() - jsonStart;

// MessagePack
const msgpackStart = Date.now();
const msgpackData = protocol.encodeSnapshot(largeSnapshot);
const msgpackSize = msgpackData.length;
const msgpackTime = Date.now() - msgpackStart;

console.log(`JSON: ${jsonSize} bytes, ${jsonTime}ms`);
console.log(`MessagePack: ${msgpackSize} bytes, ${msgpackTime}ms`);
console.log(`\nGain de taille: ${(((jsonSize - msgpackSize) / jsonSize) * 100).toFixed(2)}%`);
console.log(`Gain de temps: ${(((jsonTime - msgpackTime) / jsonTime) * 100).toFixed(2)}%`);

console.log('\n=== Tests terminés avec succès ! ===');
