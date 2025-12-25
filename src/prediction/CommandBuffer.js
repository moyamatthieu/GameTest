/**
 * Tampon de commandes pour le client-side prediction
 * Stocke les commandes envoyées au serveur en attendant la confirmation
 */
export class CommandBuffer {
    constructor(maxSize = 100, maxAge = 30000) {
        this.commands = new Map();
        this.maxSize = maxSize;
        this.maxAge = maxAge; // 30 secondes
        this.confirmedCommands = new Map();
        this.rejectedCommands = new Map();
    }

    /**
     * Ajoute une commande au buffer
     * @param {Object} command - Commande à ajouter
     */
    add(command) {
        // Nettoyer les anciennes commandes si nécessaire
        if (this.commands.size >= this.maxSize) {
            this.cleanupOldest();
        }

        // Ajouter la commande avec des métadonnées supplémentaires
        const enrichedCommand = {
            ...command,
            _bufferAdded: Date.now(),
            _retryCount: 0,
            _lastRetry: null
        };

        this.commands.set(command.id, enrichedCommand);

        // Déclencher le nettoyage périodique
        if (this.commands.size % 10 === 0) {
            this.cleanupExpired();
        }
    }

    /**
     * Récupère une commande par son ID
     * @param {string} commandId - ID de la commande
     * @returns {Object|null} La commande ou null si non trouvée
     */
    get(commandId) {
        return this.commands.get(commandId) || null;
    }

    /**
     * Met à jour le statut d'une commande
     * @param {string} commandId - ID de la commande
     * @param {string} status - Nouveau statut (confirmed, rejected, pending)
     * @param {Object} serverData - Données supplémentaires du serveur
     */
    updateStatus(commandId, status, serverData = {}) {
        const command = this.commands.get(commandId);
        if (!command) {
            console.warn(`Commande non trouvée pour mise à jour: ${commandId}`);
            return false;
        }

        command.status = status;
        command.serverData = serverData;
        command._statusUpdated = Date.now();

        // Déplacer vers la collection appropriée
        if (status === 'confirmed') {
            this.confirmedCommands.set(commandId, command);
            this.commands.delete(commandId);
        } else if (status === 'rejected') {
            this.rejectedCommands.set(commandId, command);
            this.commands.delete(commandId);
        }

        return true;
    }

    /**
     * Supprime une commande du buffer
     * @param {string} commandId - ID de la commande à supprimer
     */
    remove(commandId) {
        this.commands.delete(commandId);
        this.confirmedCommands.delete(commandId);
        this.rejectedCommands.delete(commandId);
    }

    /**
     * Récupère toutes les commandes en attente
     * @returns {Array} Liste des commandes en attente
     */
    getPendingCommands() {
        return Array.from(this.commands.values())
            .filter(cmd => cmd.status === 'pending');
    }

    /**
     * Récupère les commandes par type
     * @param {string} type - Type de commande
     * @returns {Array} Liste des commandes correspondantes
     */
    getCommandsByType(type) {
        return Array.from(this.commands.values())
            .filter(cmd => cmd.type === type);
    }

    /**
     * Récupère les commandes pour une entité spécifique
     * @param {string} entityId - ID de l'entité
     * @returns {Array} Liste des commandes correspondantes
     */
    getCommandsForEntity(entityId) {
        return Array.from(this.commands.values())
            .filter(cmd => cmd.entityId === entityId);
    }

    /**
     * Vérifie si une commande est en attente pour une entité
     * @param {string} entityId - ID de l'entité
     * @param {string} type - Type de commande (optionnel)
     * @returns {boolean} True si une commande est en attente
     */
    hasPendingCommand(entityId, type = null) {
        const commands = this.getCommandsForEntity(entityId);
        return commands.some(cmd =>
            cmd.status === 'pending' &&
            (type === null || cmd.type === type)
        );
    }

    /**
     * Récupère les commandes expirées
     * @returns {Array} Liste des commandes expirées
     */
    getExpiredCommands() {
        const now = Date.now();
        return Array.from(this.commands.values())
            .filter(cmd => (now - cmd.timestamp) > this.maxAge);
    }

    /**
     * Nettoie les commandes expirées
     * @returns {number} Nombre de commandes nettoyées
     */
    cleanupExpired() {
        const expired = this.getExpiredCommands();
        expired.forEach(cmd => {
            this.commands.delete(cmd.id);
            console.warn(`Commande expirée: ${cmd.id} (${cmd.type})`);
        });
        return expired.length;
    }

    /**
     * Nettoie les commandes les plus anciennes pour faire de la place
     */
    cleanupOldest() {
        const commands = Array.from(this.commands.values());
        if (commands.length === 0) return;

        // Trier par timestamp (plus anciennes d'abord)
        commands.sort((a, b) => a.timestamp - b.timestamp);

        // Supprimer les 10% les plus anciennes
        const toRemove = Math.max(1, Math.floor(commands.length * 0.1));
        for (let i = 0; i < toRemove; i++) {
            this.commands.delete(commands[i].id);
        }
    }

    /**
     * Marque une commande pour retry
     * @param {string} commandId - ID de la commande
     */
    markForRetry(commandId) {
        const command = this.commands.get(commandId);
        if (!command) return false;

        command._retryCount++;
        command._lastRetry = Date.now();

        return true;
    }

    /**
     * Récupère les commandes éligibles pour un retry
     * @param {number} retryDelay - Délai minimum entre les retries (ms)
     * @returns {Array} Liste des commandes éligibles
     */
    getRetryEligibleCommands(retryDelay = 5000) {
        const now = Date.now();
        return Array.from(this.commands.values())
            .filter(cmd =>
                cmd.status === 'pending' &&
                (!cmd._lastRetry || (now - cmd._lastRetry) > retryDelay) &&
                cmd._retryCount < 3 // Max 3 retries
            );
    }

    /**
     * Récupère l'historique des commandes récentes
     * @param {number} maxAge - Âge maximum en ms
     * @returns {Object} Historique par statut
     */
    getHistory(maxAge = 60000) {
        const now = Date.now();
        const filterByAge = (commands) =>
            Array.from(commands.values())
                .filter(cmd => (now - cmd.timestamp) <= maxAge);

        return {
            pending: filterByAge(this.commands),
            confirmed: filterByAge(this.confirmedCommands),
            rejected: filterByAge(this.rejectedCommands)
        };
    }

    /**
     * Récupère les statistiques du buffer
     * @returns {Object} Statistiques
     */
    getStats() {
        const now = Date.now();
        const pending = Array.from(this.commands.values());
        const confirmed = Array.from(this.confirmedCommands.values());
        const rejected = Array.from(this.rejectedCommands.values());

        // Calculer la latence moyenne des commandes confirmées
        const avgLatency = confirmed.length > 0
            ? confirmed.reduce((sum, cmd) => {
                const latency = (cmd._statusUpdated || now) - cmd.timestamp;
                return sum + latency;
            }, 0) / confirmed.length
            : 0;

        // Compter les commandes par type
        const typeCounts = {};
        pending.concat(confirmed, rejected).forEach(cmd => {
            typeCounts[cmd.type] = (typeCounts[cmd.type] || 0) + 1;
        });

        return {
            total: this.commands.size + confirmed.length + rejected.length,
            pending: this.commands.size,
            confirmed: confirmed.length,
            rejected: rejected.length,
            avgLatency: Math.round(avgLatency),
            typeCounts,
            oldestPending: pending.length > 0
                ? Math.max(0, now - Math.min(...pending.map(c => c.timestamp)))
                : 0
        };
    }

    /**
     * Vide complètement le buffer
     */
    clear() {
        this.commands.clear();
        this.confirmedCommands.clear();
        this.rejectedCommands.clear();
    }

    /**
     * Exporte l'état du buffer (pour le débogage)
     * @returns {Object} État du buffer
     */
    exportState() {
        return {
            commands: Array.from(this.commands.values()),
            confirmed: Array.from(this.confirmedCommands.values()),
            rejected: Array.from(this.rejectedCommands.values()),
            stats: this.getStats(),
            config: {
                maxSize: this.maxSize,
                maxAge: this.maxAge
            }
        };
    }

    /**
     * Importe l'état du buffer (pour le débogage)
     * @param {Object} state - État à importer
     */
    importState(state) {
        if (state.config) {
            this.maxSize = state.config.maxSize || this.maxSize;
            this.maxAge = state.config.maxAge || this.maxAge;
        }

        if (state.commands) {
            this.commands.clear();
            state.commands.forEach(cmd => {
                this.commands.set(cmd.id, cmd);
            });
        }
    }

    /**
     * Met à jour le buffer (à appeler régulièrement)
     */
    update() {
        this.cleanupExpired();
    }
}
