import { PredictionEngine } from './PredictionEngine.js';
import { CommandBuffer } from './CommandBuffer.js';
import { StateReconciler } from './StateReconciler.js';
import { World } from '../ecs/World.js';

/**
 * Tests de performance pour le client-side prediction
 *
 * Ce fichier contient des tests pour :
 * - Mesurer la latence perçue avant/après
 * - Tester différents scénarios de réconciliation
 * - Valider la correction des prédictions
 */

export class PredictionTester {
    constructor() {
        this.world = new World();
        this.networkManager = null; // Mock
        this.predictionEngine = new PredictionEngine(this.world, this.networkManager);
        this.results = [];
        this.testStartTime = 0;
    }

    /**
     * Test 1: Mesure de latence perçue
     */
    async testLatencyPerception() {
        console.log('\n=== Test 1: Mesure de Latence Perçue ===');

        const testCases = [
            { name: 'Sans Prédiction', usePrediction: false },
            { name: 'Avec Prédiction', usePrediction: true }
        ];

        for (const testCase of testCases) {
            console.log(`\n📊 ${testCase.name}`);

            const results = {
                name: testCase.name,
                actionCount: 100,
                totalTime: 0,
                perceivedLatency: [],
                actualLatency: []
            };

            for (let i = 0; i < results.actionCount; i++) {
                const actionStart = performance.now();

                if (testCase.usePrediction) {
                    // Simuler une prédiction
                    const commandId = this.predictionEngine.predictAction(
                        'MOVE_FLEET',
                        { fleetId: `fleet_${i}`, targetPosition: { x: i * 10, y: 0, z: i * 10 } }
                    );

                    // Simuler la confirmation du serveur après un délai
                    setTimeout(() => {
                        this.predictionEngine.handleCommandConfirmation({
                            id: commandId,
                            confirmed: true,
                            tick: i
                        });
                    }, 50 + Math.random() * 50); // Latence réseau simulée
                } else {
                    // Simuler l'attente du serveur
                    await this.delay(50 + Math.random() * 50);
                }

                const actionEnd = performance.now();
                const perceivedLatency = actionEnd - actionStart;

                results.perceivedLatency.push(perceivedLatency);
                results.totalTime += perceivedLatency;
            }

            // Calculer les statistiques
            results.avgPerceivedLatency = this.calculateAverage(results.perceivedLatency);
            results.minPerceivedLatency = Math.min(...results.perceivedLatency);
            results.maxPerceivedLatency = Math.max(...results.perceivedLatency);

            console.log(`  Temps total: ${results.totalTime.toFixed(2)}ms`);
            console.log(`  Latence moyenne perçue: ${results.avgPerceivedLatency.toFixed(2)}ms`);
            console.log(`  Latence min: ${results.minPerceivedLatency.toFixed(2)}ms`);
            console.log(`  Latence max: ${results.maxPerceivedLatency.toFixed(2)}ms`);

            this.results.push(results);
        }

        // Comparaison
        const withoutPrediction = this.results.find(r => !r.name.includes('Avec'));
        const withPrediction = this.results.find(r => r.name.includes('Avec'));

        if (withoutPrediction && withPrediction) {
            const improvement = ((withoutPrediction.avgPerceivedLatency - withPrediction.avgPerceivedLatency) /
                                withoutPrediction.avgPerceivedLatency) * 100;
            console.log(`\n✨ Amélioration: ${improvement.toFixed(2)}%`);
        }
    }

    /**
     * Test 2: Scénarios de réconciliation
     */
    async testReconciliationScenarios() {
        console.log('\n=== Test 2: Scénarios de Réconciliation ===');

        const scenarios = [
            {
                name: 'Réconciliation Simple',
                description: 'Correction de position mineure',
                setup: () => this.createTestEntity('test_entity', { x: 100, y: 0, z: 100 }),
                localState: { x: 105, y: 0, z: 100 }, // Prédiction légèrement décalée
                serverState: { x: 100, y: 0, z: 100 } // État réel du serveur
            },
            {
                name: 'Réconciliation Complexe',
                description: 'Correction de ressources et position',
                setup: () => this.createTestEntity('complex_entity', {
                    x: 200, y: 0, z: 200,
                    resources: { metal: 1000, energy: 500 }
                }),
                localState: {
                    x: 210, y: 0, z: 205,
                    resources: { metal: 950, energy: 500 }
                },
                serverState: {
                    x: 200, y: 0, z: 200,
                    resources: { metal: 1000, energy: 500 }
                }
            },
            {
                name: 'Réconciliation Multi-Entités',
                description: 'Correction de plusieurs entités',
                setup: () => {
                    this.createTestEntity('entity_1', { x: 100, y: 0, z: 100 });
                    this.createTestEntity('entity_2', { x: 200, y: 0, z: 200 });
                },
                localState: [
                    { id: 'entity_1', position: { x: 110, y: 0, z: 100 } },
                    { id: 'entity_2', position: { x: 200, y: 0, z: 210 } }
                ],
                serverState: [
                    { id: 'entity_1', position: { x: 100, y: 0, z: 100 } },
                    { id: 'entity_2', position: { x: 200, y: 0, z: 200 } }
                ]
            }
        ];

        for (const scenario of scenarios) {
            console.log(`\n📋 ${scenario.name}: ${scenario.description}`);

            // Setup
            scenario.setup();

            // Créer le réconciliateur
            const reconciler = new StateReconciler(this.world);

            // Préparer les états
            const localState = this.worldToState();
            const serverState = this.applyServerState(scenario.serverState);

            // Exécuter la réconciliation
            const startTime = performance.now();
            const result = reconciler.reconcile(localState, serverState);
            const endTime = performance.now();

            // Afficher les résultats
            console.log(`  Temps de réconciliation: ${(endTime - startTime).toFixed(2)}ms`);
            console.log(`  Corrections nécessaires: ${result.needsCorrection}`);
            console.log(`  Nombre de corrections: ${result.corrections.length}`);
            console.log(`  Nombre de déviations: ${result.deviations.length}`);

            if (result.deviations.length > 0) {
                console.log('  Détails des déviations:');
                result.deviations.forEach((dev, i) => {
                    console.log(`    ${i + 1}. Type: ${dev.type}, Entité: ${dev.entityId}, Sévérité: ${dev.severity}`);
                    if (dev.deviation) {
                        console.log(`       Déviation: ${dev.deviation.toFixed(2)}`);
                    }
                });
            }

            // Nettoyer
            this.cleanupTestEntities();
        }
    }

    /**
     * Test 3: Validation de la correction des prédictions
     */
    async testPredictionAccuracy() {
        console.log('\n=== Test 3: Validation de la Précision des Prédictions ===');

        const testCount = 100;
        let correctPredictions = 0;
        let incorrectPredictions = 0;
        let rollbacks = 0;

        for (let i = 0; i < testCount; i++) {
            // Créer une entité de test
            const entityId = `test_fleet_${i}`;
            this.createTestEntity(entityId, { x: 0, y: 0, z: 0 });

            // Prédire un mouvement
            const commandId = this.predictionEngine.predictAction(
                'MOVE_FLEET',
                {
                    fleetId: entityId,
                    targetPosition: { x: i * 10, y: 0, z: i * 10 },
                    path: [{ x: 0, y: 0, z: 0 }, { x: i * 10, y: 0, z: i * 10 }]
                },
                this.world.getEntity(entityId)
            );

            // Simuler différentes réponses du serveur
            const serverResponse = this.simulateServerResponse(i);

            if (serverResponse.confirmed) {
                correctPredictions++;
            } else {
                incorrectPredictions++;
                rollbacks++;
            }

            // Appliquer la réponse du serveur
            this.predictionEngine.handleCommandConfirmation({
                id: commandId,
                confirmed: serverResponse.confirmed,
                serverState: serverResponse.serverState,
                tick: i
            });
        }

        // Afficher les résultats
        const accuracy = (correctPredictions / testCount) * 100;
        console.log(`\n📊 Résultats:`);
        console.log(`  Prédictions correctes: ${correctPredictions}/${testCount} (${accuracy.toFixed(2)}%)`);
        console.log(`  Prédictions incorrectes: ${incorrectPredictions}/${testCount}`);
        console.log(`  Rollbacks: ${rollbacks}`);

        // Obtenir les statistiques finales
        const stats = this.predictionEngine.getStats();
        console.log(`\n📈 Statistiques du moteur de prédiction:`);
        console.log(`  Taux de succès: ${stats.successRate}%`);
        console.log(`  Latence moyenne: ${stats.avgLatency}ms`);
        console.log(`  Rollbacks totaux: ${stats.rollbacks}`);
    }

    /**
     * Test 4: Performance du CommandBuffer
     */
    async testCommandBufferPerformance() {
        console.log('\n=== Test 4: Performance du CommandBuffer ===');

        const buffer = new CommandBuffer();
        const commandCount = 1000;

        // Test d'ajout de commandes
        console.log(`\n📝 Test d'ajout de ${commandCount} commandes...`);
        const addStart = performance.now();

        for (let i = 0; i < commandCount; i++) {
            buffer.add({
                id: `cmd_${i}`,
                type: 'MOVE_FLEET',
                data: { fleetId: `fleet_${i}`, targetPosition: { x: i, y: 0, z: i } },
                timestamp: Date.now(),
                status: 'pending'
            });
        }

        const addEnd = performance.now();
        console.log(`  Temps d'ajout: ${(addEnd - addStart).toFixed(2)}ms`);
        console.log(`  Débit: ${(commandCount / ((addEnd - addStart) / 1000)).toFixed(2)} cmd/s`);

        // Test de récupération
        console.log(`\n🔍 Test de récupération de commandes...`);
        const getStart = performance.now();

        for (let i = 0; i < commandCount; i++) {
            buffer.get(`cmd_${i}`);
        }

        const getEnd = performance.now();
        console.log(`  Temps de récupération: ${(getEnd - getStart).toFixed(2)}ms`);
        console.log(`  Débit: ${(commandCount / ((getEnd - getStart) / 1000)).toFixed(2)} cmd/s`);

        // Test de nettoyage
        console.log(`\n🧹 Test de nettoyage...`);
        const cleanupStart = performance.now();
        const cleaned = buffer.cleanupExpired();
        const cleanupEnd = performance.now();

        console.log(`  Commandes nettoyées: ${cleaned}`);
        console.log(`  Temps de nettoyage: ${(cleanupEnd - cleanupStart).toFixed(2)}ms`);

        // Obtenir les statistiques
        const stats = buffer.getStats();
        console.log(`\n📊 Statistiques du buffer:`);
        console.log(`  Total: ${stats.total}`);
        console.log(`  En attente: ${stats.pending}`);
        console.log(`  Confirmées: ${stats.confirmed}`);
        console.log(`  Rejetées: ${stats.rejected}`);
        console.log(`  Latence moyenne: ${stats.avgLatency}ms`);
    }

    /**
     * Méthodes utilitaires
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    calculateAverage(numbers) {
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    createTestEntity(id, position) {
        if (!this.world.entities.has(id)) {
            this.world.createEntity(id);
        }
        this.world.addComponent(id, 'Position', position);
    }

    cleanupTestEntities() {
        const testEntities = Array.from(this.world.entities.keys())
            .filter(id => id.includes('test_') || id.includes('entity_'));
        testEntities.forEach(id => this.world.removeEntity(id));
    }

    worldToState() {
        const entities = Array.from(this.world.entities.keys()).map(id => ({
            id,
            position: this.world.getComponent(id, 'Position'),
            resources: this.world.getComponent(id, 'Resources')
        }));
        return { entities, timestamp: Date.now(), tick: 0 };
    }

    applyServerState(serverState) {
        if (Array.isArray(serverState)) {
            return {
                entities: serverState,
                timestamp: Date.now(),
                tick: 0
            };
        } else {
            return {
                entities: [{ id: 'test_entity', ...serverState }],
                timestamp: Date.now(),
                tick: 0
            };
        }
    }

    simulateServerResponse(index) {
        // 90% de chances de confirmation, 10% de rejet
        const confirmed = Math.random() > 0.1;

        return {
            confirmed,
            serverState: {
                x: index * 10,
                y: 0,
                z: index * 10
            }
        };
    }

    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('\n🚀 Début des tests de prédiction client-side\n');
        this.testStartTime = performance.now();

        try {
            await this.testLatencyPerception();
            await this.testReconciliationScenarios();
            await this.testPredictionAccuracy();
            await this.testCommandBufferPerformance();

            const totalTime = performance.now() - this.testStartTime;
            console.log(`\n✅ Tous les tests terminés en ${(totalTime / 1000).toFixed(2)}s`);

        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
        }
    }
}

// Exécuter les tests si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new PredictionTester();
    tester.runAllTests();
}
