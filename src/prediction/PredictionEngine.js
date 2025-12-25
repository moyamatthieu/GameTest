import { CommandBuffer } from './CommandBuffer.js';
import { StateReconciler } from './StateReconciler.js';

/**
 * Moteur de prédiction côté client
 * Prédit les actions locales et gère la réconciliation avec le serveur
 */
export class PredictionEngine {
    constructor(world, networkManager) {
        this.world = world;
        this.networkManager = networkManager;
        this.commandBuffer = new CommandBuffer();
        this.reconciler = new StateReconciler(world);
        this.pendingCommands = new Map();
        this.lastProcessedTick = 0;
        this.commandCounter = 0;

        // Statistiques
        this.stats = {
            totalPredictions: 0,
            successfulPredictions: 0,
            failedPredictions: 0,
            rollbacks: 0,
            avgLatency: 0
        };
    }

    /**
     * Prédit une action locale et l'applique immédiatement
     * @param {string} type - Type de commande (MOVE, BUILD, etc.)
     * @param {Object} data - Données de la commande
     * @param {Object} entity - Entité concernée (optionnel)
     * @returns {string} ID de la commande
     */
    predictAction(type, data, entity = null) {
        const commandId = this.generateCommandId();
        const timestamp = Date.now();

        // Sauvegarder l'état avant prédiction
        const stateBefore = this.saveRelevantState(data, entity);

        // Créer la commande
        const command = {
            id: commandId,
            type,
            data,
            entityId: entity?.id || null,
            timestamp,
            stateBefore,
            status: 'pending',
            tick: this.lastProcessedTick
        };

        // Appliquer la prédiction localement
        this.applyPrediction(command);

        // Stocker dans le buffer
        this.commandBuffer.add(command);
        this.pendingCommands.set(commandId, command);

        // Envoyer au serveur
        this.networkManager.sendCommand(command);

        this.stats.totalPredictions++;

        return commandId;
    }

    /**
     * Applique une prédiction localement
     * @param {Object} command - Commande à appliquer
     */
    applyPrediction(command) {
        const { type, data, entityId } = command;

        switch (type) {
            case 'MOVE_FLEET':
                this.predictFleetMovement(data);
                break;

            case 'BUILD_BUILDING':
                this.predictBuildingConstruction(data);
                break;

            case 'UPGRADE_BUILDING':
                this.predictBuildingUpgrade(data);
                break;

            case 'TRANSFER_RESOURCES':
                this.predictResourceTransfer(data);
                break;

            default:
                console.warn(`Type de commande non géré: ${type}`);
        }
    }

    /**
     * Prédit le mouvement d'une flotte
     */
    predictFleetMovement(data) {
        const { fleetId, targetPosition, path } = data;
        const fleet = this.world.getEntity(fleetId);

        if (!fleet) return;

        // Mettre à jour la position immédiatement
        if (fleet.position) {
            fleet.position.target = targetPosition;
            fleet.position.path = path;
            fleet.position.lastUpdate = Date.now();
        }

        // Marquer comme en mouvement
        if (fleet.movement) {
            fleet.movement.isMoving = true;
            fleet.movement.startTime = Date.now();
        }
    }

    /**
     * Prédit la construction d'un bâtiment
     */
    predictBuildingConstruction(data) {
        const { planetId, buildingType, position } = data;
        const planet = this.world.getEntity(planetId);

        if (!planet || !planet.buildings) return;

        // Créer le bâtiment immédiatement en état de construction
        const building = {
            id: `pending_${Date.now()}`,
            type: buildingType,
            position,
            constructionProgress: 0,
            isConstructing: true,
            startTime: Date.now()
        };

        if (!planet.buildings.pending) {
            planet.buildings.pending = [];
        }
        planet.buildings.pending.push(building);
    }

    /**
     * Prédit l'amélioration d'un bâtiment
     */
    predictBuildingUpgrade(data) {
        const { planetId, buildingId } = data;
        const planet = this.world.getEntity(planetId);

        if (!planet || !planet.buildings) return;

        const building = planet.buildings.list.find(b => b.id === buildingId);
        if (building) {
            building.isUpgrading = true;
            building.upgradeStartTime = Date.now();
        }
    }

    /**
     * Prédit le transfert de ressources
     */
    predictResourceTransfer(data) {
        const { fromPlanetId, toPlanetId, resources } = data;
        const fromPlanet = this.world.getEntity(fromPlanetId);
        const toPlanet = this.world.getEntity(toPlanetId);

        if (!fromPlanet || !toPlanet) return;

        // Appliquer immédiatement les changements
        Object.keys(resources).forEach(resource => {
            if (fromPlanet.resources[resource] !== undefined) {
                fromPlanet.resources[resource] -= resources[resource];
            }
            if (toPlanet.resources[resource] !== undefined) {
                toPlanet.resources[resource] += resources[resource];
            }
        });
    }

    /**
     * Traite une confirmation de commande du serveur
     * @param {Object} serverCommand - Commande confirmée par le serveur
     */
    handleCommandConfirmation(serverCommand) {
        const { id, confirmed, serverState, tick } = serverCommand;
        const pendingCommand = this.pendingCommands.get(id);

        if (!pendingCommand) {
            console.warn(`Commande non trouvée: ${id}`);
            return;
        }

        if (confirmed) {
            // Commande confirmée - mettre à jour le statut
            pendingCommand.status = 'confirmed';
            pendingCommand.confirmedTick = tick;

            // Mettre à jour les statistiques
            this.stats.successfulPredictions++;

            // Calculer la latence
            const latency = Date.now() - pendingCommand.timestamp;
            this.updateAverageLatency(latency);

        } else {
            // Commande rejetée - rollback
            pendingCommand.status = 'rejected';
            this.rollbackCommand(pendingCommand);

            this.stats.failedPredictions++;
        }

        // Nettoyer les commandes confirmées/rejetées
        this.cleanupCommand(id);
    }

    /**
     * Gère la réconciliation d'état avec le serveur
     * @param {Object} serverState - État reçu du serveur
     */
    reconcileWithServer(serverState) {
        const localState = this.getCurrentState();
        const reconciliation = this.reconciler.reconcile(localState, serverState);

        if (reconciliation.needsCorrection) {
            this.stats.rollbacks++;

            // Appliquer les corrections
            this.applyCorrections(reconciliation.corrections);

            // Réappliquer les commandes en attente
            this.reapplyPendingCommands();
        }

        return reconciliation;
    }

    /**
     * Applique les corrections d'état
     */
    applyCorrections(corrections) {
        corrections.forEach(correction => {
            const entity = this.world.getEntity(correction.entityId);
            if (entity) {
                Object.assign(entity, correction.correctState);
            }
        });
    }

    /**
     * Réapplique les commandes en attente après un rollback
     */
    reapplyPendingCommands() {
        this.pendingCommands.forEach(command => {
            if (command.status === 'pending') {
                this.applyPrediction(command);
            }
        });
    }

    /**
     * Rollback d'une commande spécifique
     */
    rollbackCommand(command) {
        if (command.stateBefore) {
            this.restoreState(command.stateBefore);
        }
    }

    /**
     * Génère un ID de commande unique
     */
    generateCommandId() {
        return `cmd_${this.commandCounter++}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Sauvegarde l'état pertinent pour un rollback éventuel
     */
    saveRelevantState(data, entity) {
        if (!entity) return null;

        const state = {
            entityId: entity.id,
            components: {}
        };

        // Sauvegarder les composants pertinents
        if (entity.position) {
            state.components.position = { ...entity.position };
        }
        if (entity.resources) {
            state.components.resources = { ...entity.resources };
        }
        if (entity.buildings) {
            state.components.buildings = JSON.parse(JSON.stringify(entity.buildings));
        }

        return state;
    }

    /**
     * Restaure un état précédent
     */
    restoreState(state) {
        const entity = this.world.getEntity(state.entityId);
        if (!entity) return;

        Object.assign(entity, state.components);
    }

    /**
     * Obtient l'état courant du monde
     */
    getCurrentState() {
        const entities = this.world.getEntities();
        return {
            timestamp: Date.now(),
            tick: this.lastProcessedTick,
            entities: entities.map(e => ({
                id: e.id,
                position: e.position,
                resources: e.resources,
                buildings: e.buildings,
                fleet: e.fleet
            }))
        };
    }

    /**
     * Met à jour la latence moyenne
     */
    updateAverageLatency(latency) {
        const total = this.stats.successfulPredictions;
        this.stats.avgLatency = ((this.stats.avgLatency * (total - 1)) + latency) / total;
    }

    /**
     * Nettoie une commande traitée
     */
    cleanupCommand(commandId) {
        this.pendingCommands.delete(commandId);
        this.commandBuffer.remove(commandId);
    }

    /**
     * Nettoie les anciennes commandes
     */
    cleanupOldCommands(maxAge = 30000) {
        const now = Date.now();
        this.pendingCommands.forEach((command, id) => {
            if (now - command.timestamp > maxAge) {
                this.cleanupCommand(id);
            }
        });
    }

    /**
     * Met à jour le moteur de prédiction
     */
    update(deltaTime) {
        this.cleanupOldCommands();
        this.lastProcessedTick++;
    }

    /**
     * Obtient les statistiques de prédiction
     */
    getStats() {
        const successRate = this.stats.totalPredictions > 0
            ? (this.stats.successfulPredictions / this.stats.totalPredictions) * 100
            : 0;

        return {
            ...this.stats,
            successRate: successRate.toFixed(2),
            pendingCommands: this.pendingCommands.size
        };
    }

    /**
     * Réinitialise les statistiques
     */
    resetStats() {
        this.stats = {
            totalPredictions: 0,
            successfulPredictions: 0,
            failedPredictions: 0,
            rollbacks: 0,
            avgLatency: 0
        };
    }
}
