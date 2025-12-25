import { io } from 'socket.io-client'
import { decode } from '@msgpack/msgpack'
import { SnapshotInterpolator } from '../network/SnapshotInterpolator.js'
import { StateReconciler } from '../prediction/StateReconciler.js'

/**
 * NetworkManager - Gestionnaire de connexion au serveur avec optimisations
 *
 * Nouvelles fonctionnalités :
 * - Désérialisation MessagePack
 * - Snapshot Interpolation pour des mouvements fluides
 * - Métriques de performance
 *
 * Responsabilités :
 * - Recevoir les snapshots/deltas compressés du serveur
 * - Désérialiser avec MessagePack
 * - Interpoler les snapshots pour lisser les mouvements
 * - Synchroniser l'état ECS local (lecture seule)
 * - Envoyer les inputs du joueur au serveur
 *
 * ⚠️ Utilise directement les IDs serveur (pas de mapping)
 * ⚠️ Ne modifie JAMAIS la logique de jeu
 */
export class NetworkManager {
  constructor(game) {
    this.game = game
    this.socket = io('http://localhost:3001')
    this.playerEntityId = null

    // Initialiser l'interpolateur de snapshots
    this.interpolator = new SnapshotInterpolator(100) // 100ms delay

    // Réconciliateur d'état pour la prédiction
    this.stateReconciler = new StateReconciler(this.game.world)

    // Métriques
    this.metrics = {
      packetsReceived: 0,
      bytesReceived: 0,
      lastUpdate: Date.now(),
      commandConfirmations: 0,
      reconciliations: 0
    }

    // Dernier snapshot complet (pour le delta)
    this.lastSnapshot = new Map()

    // Buffer pour les commandes en attente
    this.pendingCommands = new Map()

    this.initSocketListeners()
  }

  initSocketListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Connecté au serveur')
    })

    this.socket.on('disconnect', () => {
      console.warn('⚠️ Déconnecté du serveur')
      this.interpolator.clear()
    })

    // Réception de l'état initial complet
    this.socket.on('initWorld', (serverEntities) => {
      console.log(`📦 Initialisation du monde : ${serverEntities.length} entités`)
      this.syncWorld(serverEntities)
    })

    // Attribution de l'entité du joueur
    this.socket.on('assignedEntity', ({ entityId, username }) => {
      console.log(`👤 Entité joueur assignée : ${entityId} (${username})`)
      this.playerEntityId = entityId
      this.game.playerEntity = entityId
      this.game.username = username

      // Mettre à jour l'UI si nécessaire
      const playerDisplay = document.getElementById('player-name-display');
      if (playerDisplay) {
        playerDisplay.textContent = username;
      }
    })

    // Réception des deltas compressés (mises à jour incrémentales)
    this.socket.on('worldDelta', (compressedData) => {
      this.handleCompressedDelta(compressedData)
    })

    // Confirmation de commande avec réconciliation
    this.socket.on('commandConfirmation', (confirmation) => {
      this.handleCommandConfirmation(confirmation)
    })

    // Réception d'un snapshot serveur pour réconciliation
    this.socket.on('serverSnapshot', (snapshotData) => {
      this.handleServerSnapshot(snapshotData)
    })

    // Ancien système de test (à conserver pour compatibilité)
    this.socket.on('entityMoved', ({ id, x, y, z }) => {
      if (this.game.world.entities.has(id)) {
        const pos = this.game.world.getComponent(id, 'Position')
        if (pos) {
          pos.x = x
          pos.y = y
          pos.z = z
        }
      }
    })

    // Réponse en cas de requête refusée
    this.socket.on('requestRejected', ({ reason }) => {
      console.error(`❌ Requête refusée : ${reason}`)
      // TODO: Afficher un message à l'utilisateur via l'UI
    })

    // Méthode pour changer de scène (pour l'AOI)
    this.switchScene = (sceneName) => {
      console.log(`🔄 Changement de scène : ${sceneName}`)
      this.socket.emit('switchScene', sceneName)
    }
  }

  /**
   * Gère les données compressées reçues du serveur
   * @param {Uint8Array} compressedData - Données MessagePack
   */
  handleCompressedDelta(compressedData) {
    try {
      // Désérialiser les données MessagePack
      const decodedData = decode(compressedData)

      this.metrics.packetsReceived++
      this.metrics.bytesReceived += compressedData.length

      // Appliquer le delta en fonction du type
      if (decodedData.type === 'full') {
        // Snapshot complet
        this.syncWorld(decodedData.data.entities)
      } else if (decodedData.type === 'delta') {
        // Delta compressé
        this.applyDelta(decodedData.data.entities)

        // Ajouter les snapshots à l'interpolateur
        for (const entity of decodedData.data.entities) {
          this.interpolator.addSnapshot(
            entity.id,
            entity,
            decodedData.timestamp
          )
        }
      }

      this.metrics.lastUpdate = Date.now()

    } catch (error) {
      console.error('❌ Erreur de désérialisation MessagePack:', error)
    }
  }

  /**
   * Met à jour l'interpolation (à appeler dans la boucle de jeu)
   */
  update() {
    const interpolatedStates = this.interpolator.update(Date.now())

    // Appliquer les états interpolés
    for (const entityState of interpolatedStates) {
      const entityId = entityState.id

      // Créer l'entité si elle n'existe pas
      if (!this.game.world.entities.has(entityId)) {
        this.game.world.createEntity(entityId)
      }

      // Mettre à jour les composants
      if (entityState.components) {
        for (const [compName, compData] of Object.entries(entityState.components)) {
          this.game.world.addComponent(entityId, compName, compData)
        }
      }
    }
  }

  /**
   * Synchronisation initiale du monde
   */
  syncWorld(serverEntities) {
    console.log('🔄 Synchronisation complète du monde...')

    for (const serverEntity of serverEntities) {
      // Utiliser directement l'ID serveur
      const entityId = serverEntity.id

      // Créer l'entité avec l'ID serveur
      if (!this.game.world.entities.has(entityId)) {
        this.game.world.createEntity(entityId)
      }

      // Ajouter tous les composants
      if (serverEntity.components) {
        for (const [compName, compData] of Object.entries(serverEntity.components)) {
          this.game.world.addComponent(entityId, compName, compData)
        }
      }

      // Créer un composant Renderable si nécessaire pour MeshSync
      if (!this.game.world.hasComponent(entityId, 'Renderable')) {
        const building = this.game.world.getComponent(entityId, 'Building')
        if (building) {
          this.game.world.addComponent(entityId, 'Renderable', {
            type: 'building',
            buildingType: building.type,
            color: 0x808080
          })
        }
      }

      // Ajouter au snapshot de référence
      this.lastSnapshot.set(entityId, serverEntity)
    }

    console.log(`✅ ${serverEntities.length} entités synchronisées`)
  }

  /**
   * Application des deltas (mises à jour incrémentales)
   */
  applyDelta(delta) {
    for (const serverEntity of delta) {
      const entityId = serverEntity.id

      // Créer l'entité si elle n'existe pas encore
      if (!this.game.world.entities.has(entityId)) {
        this.game.world.createEntity(entityId)
        console.log(`🆕 Nouvelle entité découverte : ${entityId}`)
      }

      // Mettre à jour tous les composants modifiés
      for (const [compName, compData] of Object.entries(serverEntity.components)) {
        this.game.world.addComponent(entityId, compName, compData)
      }

      // Mettre à jour le snapshot de référence
      const existingSnapshot = this.lastSnapshot.get(entityId) || { id: entityId, components: {} }
      const updatedSnapshot = {
        ...existingSnapshot,
        components: {
          ...existingSnapshot.components,
          ...serverEntity.components
        }
      }
      this.lastSnapshot.set(entityId, updatedSnapshot)
    }
  }

  /**
   * Gère la confirmation d'une commande
   */
  handleCommandConfirmation(confirmation) {
    this.metrics.commandConfirmations++

    if (this.game.predictionEngine) {
      this.game.predictionEngine.handleCommandConfirmation(confirmation)
    }

    // Retirer de la liste d'attente
    this.pendingCommands.delete(confirmation.commandId)
  }

  /**
   * Gère un snapshot serveur pour réconciliation
   */
  handleServerSnapshot(snapshotData) {
    this.metrics.reconciliations++

    if (this.game.predictionEngine) {
      const serverState = {
        entities: snapshotData.entities,
        timestamp: snapshotData.timestamp,
        tick: snapshotData.tick
      }

      this.game.predictionEngine.reconcileWithServer(serverState)
    }
  }

  /**
   * Envoyer une commande avec prédiction
   */
  sendCommand(command) {
    // Stocker la commande en attente
    this.pendingCommands.set(command.id, command)

    // Envoyer au serveur
    this.socket.emit('playerCommand', {
      commandId: command.id,
      type: command.type,
      data: command.data,
      timestamp: command.timestamp,
      tick: command.tick
    })
  }

  /**
   * Envoyer une commande de déplacement (exemple)
   */
  sendMove(entityId, x, y, z) {
    this.socket.emit('moveEntity', { id: entityId, x, y, z })
  }

  /**
   * Demander le placement d'un bâtiment
   */
  requestPlacement(type, x, y, z, mode) {
    this.socket.emit('requestPlacement', {
      type,
      x,
      y,
      z,
      mode,
      playerId: this.playerEntityId
    })
  }

  /**
   * Demander un transfert de ressources
   */
  requestTransfer(resource, amount, targetEntityId) {
    this.socket.emit('requestTransfer', {
      resource,
      amount,
      playerId: this.playerEntityId,
      targetEntityId
    })
  }

  /**
   * Demander une attaque
   */
  requestAttack(attackerId, targetId) {
    this.socket.emit('requestAttack', {
      attackerId,
      targetId
    })
  }

  /**
   * Récupérer les métriques de performance
   */
  getMetrics() {
    const interpolatorMetrics = this.interpolator.getMetrics()
    const now = Date.now()
    const timeSinceLastUpdate = now - this.metrics.lastUpdate

    let reconciliationStats = {}
    if (this.stateReconciler) {
      reconciliationStats = this.stateReconciler.getStats()
    }

    return {
      packetsReceived: this.metrics.packetsReceived,
      bytesReceived: this.metrics.bytesReceived,
      timeSinceLastUpdate: timeSinceLastUpdate + 'ms',
      commandConfirmations: this.metrics.commandConfirmations,
      reconciliations: this.metrics.reconciliations,
      pendingCommands: this.pendingCommands.size,
      interpolator: interpolatorMetrics,
      reconciliation: reconciliationStats
    }
  }

  /**
   * Afficher les métriques de performance
   */
  logMetrics() {
    const metrics = this.getMetrics()
    console.log('\n=== Client Network Metrics ===')
    console.log(`Packets Received: ${metrics.packetsReceived}`)
    console.log(`Bytes Received: ${metrics.bytesReceived}`)
    console.log(`Time Since Last Update: ${metrics.timeSinceLastUpdate}`)
    console.log('Interpolator:')
    console.log(`  Active Entities: ${metrics.interpolator.activeEntities}`)
    console.log(`  Snapshots Received: ${metrics.interpolator.snapshotsReceived}`)
    console.log(`  Average Latency: ${metrics.interpolator.averageLatency}`)
    console.log('==============================\n')
  }
}
