/**
 * Réconciliateur d'état pour client-side prediction
 * Compare l'état prédit avec l'état serveur et applique les corrections
 */
export class StateReconciler {
    constructor(world) {
        this.world = world;
        this.lastServerState = null;
        this.correctionHistory = [];
        this.interpolationEnabled = true;
        this.interpolationDuration = 500; // ms

        // Statistiques
        this.stats = {
            totalReconciliations: 0,
            successfulReconciliations: 0,
            correctionsApplied: 0,
            rollbacks: 0,
            avgDeviation: 0,
            maxDeviation: 0
        };

        // Configuration
        this.config = {
            maxHistorySize: 50,
            deviationThreshold: 0.1, // Seuil de déviation pour les corrections
            interpolationEnabled: true,
            loggingEnabled: true
        };
    }

    /**
     * Réconcilie l'état local avec l'état serveur
     * @param {Object} localState - État local actuel
     * @param {Object} serverState - État reçu du serveur
     * @returns {Object} Résultat de la réconciliation
     */
    reconcile(localState, serverState) {
        this.stats.totalReconciliations++;

        const result = {
            needsCorrection: false,
            corrections: [],
            interpolations: [],
            deviations: [],
            timestamp: Date.now()
        };

        // Premier état serveur - juste le stocker
        if (!this.lastServerState) {
            this.lastServerState = serverState;
            this.stats.successfulReconciliations++;
            return result;
        }

        // Comparer les états
        const comparison = this.compareStates(localState, serverState);

        if (comparison.hasDeviations) {
            result.needsCorrection = true;
            result.deviations = comparison.deviations;

            // Générer les corrections
            result.corrections = this.generateCorrections(
                comparison.deviations,
                localState,
                serverState
            );

            // Appliquer les corrections avec interpolation si activé
            if (this.config.interpolationEnabled) {
                result.interpolations = this.generateInterpolations(
                    result.corrections,
                    localState,
                    serverState
                );
            }

            this.stats.correctionsApplied++;
            this.updateDeviationStats(comparison.deviations);

            // Journaliser si activé
            if (this.config.loggingEnabled) {
                this.logReconciliation(result);
            }
        } else {
            this.stats.successfulReconciliations++;
        }

        // Mettre à jour le dernier état serveur
        this.lastServerState = serverState;

        // Ajouter à l'historique
        this.addToHistory(result);

        return result;
    }

    /**
     * Compare deux états et détecte les déviations
     * @param {Object} localState - État local
     * @param {Object} serverState - État serveur
     * @returns {Object} Résultat de la comparaison
     */
    compareStates(localState, serverState) {
        const deviations = [];

        // Comparer les entités
        const localEntities = localState.entities || [];
        const serverEntities = serverState.entities || [];

        // Créer des maps pour un accès facile
        const localMap = new Map(localEntities.map(e => [e.id, e]));
        const serverMap = new Map(serverEntities.map(e => [e.id, e]));

        // Vérifier les entités présentes dans les deux états
        for (const [entityId, serverEntity] of serverMap) {
            const localEntity = localMap.get(entityId);

            if (!localEntity) {
                // Entité manquante localement
                deviations.push({
                    type: 'missing_entity',
                    entityId,
                    severity: 'high',
                    description: `Entité ${entityId} manquante localement`
                });
                continue;
            }

            // Comparer les positions
            if (this.hasPositionDeviation(localEntity, serverEntity)) {
                const deviation = this.calculatePositionDeviation(localEntity, serverEntity);
                if (deviation.magnitude > this.config.deviationThreshold) {
                    deviations.push({
                        type: 'position',
                        entityId,
                        severity: deviation.magnitude > 1 ? 'high' : 'medium',
                        local: localEntity.position,
                        server: serverEntity.position,
                        deviation: deviation.magnitude,
                        details: deviation
                    });
                }
            }

            // Comparer les ressources
            if (this.hasResourceDeviation(localEntity, serverEntity)) {
                const deviation = this.calculateResourceDeviation(localEntity, serverEntity);
                deviations.push({
                    type: 'resources',
                    entityId,
                    severity: 'medium',
                    local: localEntity.resources,
                    server: serverEntity.resources,
                    deviation: deviation.total,
                    details: deviation
                });
            }

            // Comparer les bâtiments
            if (this.hasBuildingDeviation(localEntity, serverEntity)) {
                deviations.push({
                    type: 'buildings',
                    entityId,
                    severity: 'high',
                    local: localEntity.buildings,
                    server: serverEntity.buildings,
                    description: 'Différence dans les bâtiments'
                });
            }

            // Comparer les flottes
            if (this.hasFleetDeviation(localEntity, serverEntity)) {
                deviations.push({
                    type: 'fleet',
                    entityId,
                    severity: 'medium',
                    local: localEntity.fleet,
                    server: serverEntity.fleet,
                    description: 'Différence dans les données de flotte'
                });
            }
        }

        // Vérifier les entités supplémentaires localement (rollback nécessaire)
        for (const [entityId, localEntity] of localMap) {
            if (!serverMap.has(entityId)) {
                deviations.push({
                    type: 'extra_entity',
                    entityId,
                    severity: 'high',
                    description: `Entité ${entityId} existe localement mais pas sur le serveur`,
                    local: localEntity
                });
            }
        }

        return {
            hasDeviations: deviations.length > 0,
            deviations,
            localEntityCount: localEntities.length,
            serverEntityCount: serverEntities.length
        };
    }

    /**
     * Vérifie si les positions divergent
     */
    hasPositionDeviation(localEntity, serverEntity) {
        return (
            localEntity.position &&
            serverEntity.position &&
            (localEntity.position.x !== serverEntity.position.x ||
             localEntity.position.y !== serverEntity.position.y ||
             localEntity.position.z !== serverEntity.position.z)
        );
    }

    /**
     * Calcule la déviation de position
     */
    calculatePositionDeviation(localEntity, serverEntity) {
        const dx = serverEntity.position.x - localEntity.position.x;
        const dy = serverEntity.position.y - localEntity.position.y;
        const dz = (serverEntity.position.z || 0) - (localEntity.position.z || 0);

        const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);

        return {
            magnitude,
            dx,
            dy,
            dz,
            local: { ...localEntity.position },
            server: { ...serverEntity.position }
        };
    }

    /**
     * Vérifie si les ressources divergent
     */
    hasResourceDeviation(localEntity, serverEntity) {
        if (!localEntity.resources || !serverEntity.resources) {
            return false;
        }

        const resources = Object.keys(localEntity.resources);
        return resources.some(resource =>
            Math.abs((localEntity.resources[resource] || 0) -
                    (serverEntity.resources[resource] || 0)) > 0.01
        );
    }

    /**
     * Calcule la déviation des ressources
     */
    calculateResourceDeviation(localEntity, serverEntity) {
        const resources = new Set([
            ...Object.keys(localEntity.resources || {}),
            ...Object.keys(serverEntity.resources || {})
        ]);

        const deviations = {};
        let total = 0;

        resources.forEach(resource => {
            const local = localEntity.resources[resource] || 0;
            const server = serverEntity.resources[resource] || 0;
            const diff = Math.abs(server - local);

            if (diff > 0.01) {
                deviations[resource] = {
                    local,
                    server,
                    diff
                };
                total += diff;
            }
        });

        return { deviations, total };
    }

    /**
     * Vérifie si les bâtiments divergent
     */
    hasBuildingDeviation(localEntity, serverEntity) {
        return (
            (localEntity.buildings && !serverEntity.buildings) ||
            (!localEntity.buildings && serverEntity.buildings) ||
            (localEntity.buildings && serverEntity.buildings &&
             JSON.stringify(localEntity.buildings) !== JSON.stringify(serverEntity.buildings))
        );
    }

    /**
     * Vérifie si les flottes divergent
     */
    hasFleetDeviation(localEntity, serverEntity) {
        return (
            (localEntity.fleet && !serverEntity.fleet) ||
            (!localEntity.fleet && serverEntity.fleet) ||
            (localEntity.fleet && serverEntity.fleet &&
             JSON.stringify(localEntity.fleet) !== JSON.stringify(serverEntity.fleet))
        );
    }

    /**
     * Génère les corrections nécessaires
     */
    generateCorrections(deviations, localState, serverState) {
        const corrections = [];

        deviations.forEach(deviation => {
            switch (deviation.type) {
                case 'position':
                    corrections.push({
                        type: 'position',
                        entityId: deviation.entityId,
                        correctState: { position: { ...deviation.server } },
                        deviation: deviation.deviation,
                        severity: deviation.severity
                    });
                    break;

                case 'resources':
                    corrections.push({
                        type: 'resources',
                        entityId: deviation.entityId,
                        correctState: { resources: { ...deviation.server } },
                        deviation: deviation.deviation,
                        severity: deviation.severity
                    });
                    break;

                case 'buildings':
                    corrections.push({
                        type: 'buildings',
                        entityId: deviation.entityId,
                        correctState: { buildings: JSON.parse(JSON.stringify(deviation.server)) },
                        severity: deviation.severity
                    });
                    break;

                case 'fleet':
                    corrections.push({
                        type: 'fleet',
                        entityId: deviation.entityId,
                        correctState: { fleet: { ...deviation.server } },
                        severity: deviation.severity
                    });
                    break;

                case 'missing_entity':
                    // Récupérer l'entité complète du serveur
                    const serverEntity = serverState.entities.find(e => e.id === deviation.entityId);
                    if (serverEntity) {
                        corrections.push({
                            type: 'create_entity',
                            entityId: deviation.entityId,
                            entityData: serverEntity,
                            severity: deviation.severity
                        });
                    }
                    break;

                case 'extra_entity':
                    corrections.push({
                        type: 'remove_entity',
                        entityId: deviation.entityId,
                        severity: deviation.severity
                    });
                    break;
            }
        });

        return corrections;
    }

    /**
     * Génère les interpolations pour lisser les corrections
     */
    generateInterpolations(corrections, localState, serverState) {
        const interpolations = [];

        corrections.forEach(correction => {
            if (correction.type === 'position') {
                const entity = this.world.getEntity(correction.entityId);
                if (entity && entity.position) {
                    interpolations.push({
                        entityId: correction.entityId,
                        type: 'position',
                        start: { ...entity.position },
                        end: { ...correction.correctState.position },
                        duration: this.interpolationDuration,
                        startTime: Date.now()
                    });
                }
            }
        });

        return interpolations;
    }

    /**
     * Applique les interpolations en cours
     */
    applyInterpolations(interpolations, deltaTime) {
        const now = Date.now();
        const activeInterpolations = [];

        interpolations.forEach(interp => {
            const elapsed = now - interp.startTime;
            const progress = Math.min(elapsed / interp.duration, 1);

            // Fonction d'interpolation smooth (ease-in-out)
            const smoothProgress = this.easeInOut(progress);

            const entity = this.world.getEntity(interp.entityId);
            if (!entity) return;

            switch (interp.type) {
                case 'position':
                    if (entity.position) {
                        entity.position.x = interp.start.x + (interp.end.x - interp.start.x) * smoothProgress;
                        entity.position.y = interp.start.y + (interp.end.y - interp.start.y) * smoothProgress;
                        entity.position.z = (interp.start.z || 0) + ((interp.end.z || 0) - (interp.start.z || 0)) * smoothProgress;
                    }
                    break;
            }

            if (progress < 1) {
                activeInterpolations.push(interp);
            }
        });

        return activeInterpolations;
    }

    /**
     * Fonction d'easing ease-in-out
     */
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Met à jour les statistiques de déviation
     */
    updateDeviationStats(deviations) {
        const positionDeviations = deviations
            .filter(d => d.type === 'position')
            .map(d => d.deviation);

        if (positionDeviations.length > 0) {
            const avg = positionDeviations.reduce((a, b) => a + b, 0) / positionDeviations.length;
            const max = Math.max(...positionDeviations);

            this.stats.avgDeviation = (this.stats.avgDeviation * (this.stats.correctionsApplied - 1) + avg) / this.stats.correctionsApplied;
            this.stats.maxDeviation = Math.max(this.stats.maxDeviation, max);
        }
    }

    /**
     * Journalise une réconciliation
     */
    logReconciliation(result) {
        const logEntry = {
            timestamp: result.timestamp,
            needsCorrection: result.needsCorrection,
            correctionCount: result.corrections.length,
            interpolationCount: result.interpolations.length,
            deviations: result.deviations.map(d => ({
                type: d.type,
                entityId: d.entityId,
                severity: d.severity,
                deviation: d.deviation
            }))
        };

        console.log('[Reconciliation]', logEntry);
    }

    /**
     * Ajoute un résultat à l'historique
     */
    addToHistory(result) {
        this.correctionHistory.push(result);

        // Limiter la taille de l'historique
        if (this.correctionHistory.length > this.config.maxHistorySize) {
            this.correctionHistory.shift();
        }
    }

    /**
     * Obtient les statistiques de réconciliation
     */
    getStats() {
        const successRate = this.stats.totalReconciliations > 0
            ? (this.stats.successfulReconciliations / this.stats.totalReconciliations) * 100
            : 0;

        return {
            ...this.stats,
            successRate: successRate.toFixed(2),
            historySize: this.correctionHistory.length,
            interpolationEnabled: this.config.interpolationEnabled
        };
    }

    /**
     * Réinitialise les statistiques
     */
    resetStats() {
        this.stats = {
            totalReconciliations: 0,
            successfulReconciliations: 0,
            correctionsApplied: 0,
            rollbacks: 0,
            avgDeviation: 0,
            maxDeviation: 0
        };
        this.correctionHistory = [];
    }

    /**
     * Exporte l'historique pour analyse
     */
    exportHistory() {
        return {
            corrections: this.correctionHistory,
            stats: this.getStats(),
            config: { ...this.config }
        };
    }
}
