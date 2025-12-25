import * as THREE from 'three'
import { Constants } from '../utils/constants.js'
import { ConstructionContext } from '../ecs/components/index.js'

/**
 * BuildingPlacer - Gestionnaire de placement de bâtiments (REFACTORISÉ)
 *
 * Utilise le nouveau système de planète procédurale :
 * - PlanetGenerator : Génération de terrain avec relief
 * - BuildingGrid : Grille adaptative de placement
 * - PlacementValidator : Validation intelligente
 *
 * ⚠️ Ce n'est PAS un système ECS, c'est un gestionnaire d'UI/Input
 * Tout passe par des requêtes au serveur via NetworkManager
 */
export class BuildingPlacer {
  constructor(game) {
    this.game = game
    this.raycaster = new THREE.Raycaster()

    // Référence vers le système de planète (sera initialisé par la scène)
    this.planetGenerator = null
    this.buildingGrid = null
    this.placementValidator = null

    // État du placement
    this.currentValidation = null
  }

  /**
   * Initialise le placer avec les systèmes de planète
   */
  initialize(planetGenerator, buildingGrid, placementValidator) {
    this.planetGenerator = planetGenerator
    this.buildingGrid = buildingGrid
    this.placementValidator = placementValidator
    console.log('[BuildingPlacer] Initialized with procedural planet systems')
  }

  /**
   * Appelé chaque frame quand on est en mode construction
   */
  update(deltaTime) {
    if (!this.game.isBuildingMode || !this.game.ghostBuilding) return

    const mode = this._detectConstructionMode()

    if (mode === 'PLANET') {
      this._handlePlanetConstruction()
    } else if (mode === 'SPACE') {
      this._handleSpaceConstruction()
    }
  }

  _detectConstructionMode() {
    const currentScene = this.game.sceneManager.currentSceneName
    return currentScene === Constants.SCENES.PLANET ? 'PLANET' : 'SPACE'
  }

  _handleSpaceConstruction() {
    const systemScene = this.game.sceneManager.scenes.get('system')
    if (!systemScene) return

    this.raycaster.setFromCamera(this.game.mouse, systemScene.camera)

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const target = new THREE.Vector3()

    if (this.raycaster.ray.intersectPlane(plane, target)) {
      const spaceGridSize = 10
      const snappedX = Math.round(target.x / spaceGridSize) * spaceGridSize
      const snappedZ = Math.round(target.z / spaceGridSize) * spaceGridSize
      const snappedY = 0

      this.game.ghostBuilding.position.set(snappedX, snappedY, snappedZ)
      this.game.ghostBuilding.rotation.set(0, 0, 0)

      if (!this.game.ghostBuilding.userData.constructionContext) {
        this.game.ghostBuilding.userData.constructionContext = ConstructionContext('SPACE', systemScene.systemId)
      }

      const context = this.game.ghostBuilding.userData.constructionContext
      context.snappingData = { x: snappedX, z: snappedZ }

      const isValid = this._checkCanAfford()
      this._updateGhostVisual(isValid, 100)

      this.game.ghostBuilding.userData.snappedX = snappedX
      this.game.ghostBuilding.userData.snappedZ = snappedZ
    }
  }

  _handlePlanetConstruction() {
    // Vérifier que le système de planète est initialisé
    if (!this.planetGenerator || !this.buildingGrid || !this.placementValidator) {
      console.warn('[BuildingPlacer] Planet systems not initialized')
      return
    }

    const planetScene = this.game.sceneManager.scenes.get('planet')
    if (!planetScene || !planetScene.planetEntityId) return

    const planetMesh = this.game.meshSync.entityMeshes.get(planetScene.planetEntityId)
    if (!planetMesh) return

    // Raycasting sur le mesh de la planète avec relief
    this.raycaster.setFromCamera(this.game.mouse, planetScene.camera)
    const intersects = this.raycaster.intersectObject(planetMesh)

    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point
      const intersectionNormal = intersects[0].face.normal.clone()

      // Transformer la normale dans l'espace monde
      intersectionNormal.transformDirection(planetMesh.matrixWorld)

      // Obtenir les coordonnées de grille snappées
      const gridCoords = this.buildingGrid.worldToGrid(intersectionPoint)
      const snappedPosition = this.buildingGrid.gridToWorld(gridCoords.theta, gridCoords.phi)

      // Obtenir la normale du terrain à la position snappée
      const terrainData = this.planetGenerator.getTerrainDataAt(snappedPosition)
      const terrainNormal = terrainData ? terrainData.normal : intersectionNormal

      // Calculer l'offset basé sur la hauteur du bâtiment
      const buildingHeight = this._getBuildingHeight(this.game.buildingType)
      const offsetPosition = snappedPosition.clone().add(
        terrainNormal.clone().multiplyScalar(buildingHeight / 2)
      )

      // Positionner le ghost
      this.game.ghostBuilding.position.copy(offsetPosition)

      // Orienter perpendiculairement à la surface
      this.game.ghostBuilding.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        terrainNormal
      )

      // Valider le placement avec le système intelligent
      const playerEconomy = this.game.world.getComponent(this.game.playerEntity, 'Economy')
      const validation = this.placementValidator.validate(
        snappedPosition,
        this.game.buildingType,
        playerEconomy
      )

      this.currentValidation = validation

      // Mettre à jour le contexte de construction
      if (!this.game.ghostBuilding.userData.constructionContext) {
        this.game.ghostBuilding.userData.constructionContext = ConstructionContext('PLANET', planetScene.planetEntityId)
      }

      const context = this.game.ghostBuilding.userData.constructionContext
      context.snappingData = {
        theta: gridCoords.theta,
        phi: gridCoords.phi,
        height: terrainData ? terrainData.height : 0,
        slope: terrainData ? terrainData.slope : 0
      }

      // Stocker les coordonnées pour le placement
      this.game.ghostBuilding.userData.theta = gridCoords.theta
      this.game.ghostBuilding.userData.phi = gridCoords.phi
      this.game.ghostBuilding.userData.snappedPosition = offsetPosition

      // Mettre à jour le visuel avec feedback détaillé
      this._updateGhostVisual(validation.valid, validation.data.qualityScore || 0)
      this._displayValidationInfo(validation)
    }
  }

  /**
   * Affiche les informations de validation à l'utilisateur
   */
  _displayValidationInfo(validation) {
    const infoPanel = document.getElementById('placement-info')
    if (!infoPanel) return

    let html = `<div class="placement-validation">`

    // Statut
    html += `<div class="status ${validation.valid ? 'valid' : 'invalid'}">`
    html += validation.valid ? '✓ Placement valide' : '✗ Placement invalide'
    html += `</div>`

    // Score de qualité
    if (validation.valid && validation.data.qualityScore !== undefined) {
      html += `<div class="quality">Qualité: ${Math.round(validation.data.qualityScore)}%</div>`
    }

    // Informations terrain
    if (validation.data.terrainData) {
      html += `<div class="terrain-info">`
      html += `Pente: ${validation.data.slope.toFixed(1)}°<br>`
      html += `Hauteur: ${validation.data.height.toFixed(1)}<br>`
      html += `Biome: ${validation.data.biome}`
      html += `</div>`
    }

    // Raisons d'invalidité
    if (validation.reasons.length > 0) {
      html += `<div class="reasons">`
      validation.reasons.forEach(reason => {
        html += `<div class="reason">⚠ ${reason}</div>`
      })
      html += `</div>`
    }

    // Avertissements
    if (validation.warnings.length > 0) {
      html += `<div class="warnings">`
      validation.warnings.forEach(warning => {
        html += `<div class="warning">⚡ ${warning}</div>`
      })
      html += `</div>`
    }

    html += `</div>`
    infoPanel.innerHTML = html
  }

  /**
   * Vérification locale des ressources (validation rapide côté client)
   */
  _checkCanAfford() {
    if (!this.game.playerEntity) {
      console.warn('[BuildingPlacer] Pas d\'entité joueur assignée')
      return false
    }

    if (this.placementValidator) {
      const economy = this.game.world.getComponent(this.game.playerEntity, 'Economy')
      const cost = this.placementValidator.getBuildingCost(this.game.buildingType)

      for (const [resource, amount] of Object.entries(cost)) {
        if ((economy[resource] || 0) < amount) {
          return false
        }
      }
      return true
    }

    // Fallback ancien système
    const economy = this.game.world.getComponent(this.game.playerEntity, 'Economy')
    const costs = {
      base: { metal: 100 },
      habitation: { metal: 30 },
      ferme: { metal: 40 },
      usine: { metal: 60 },
      entrepot: { metal: 50 },
      centrale: { metal: 80 },
      mine: { metal: 120 },
      route: { metal: 5 }
    }

    const cost = costs[this.game.buildingType]
    if (!cost || !economy) return false

    return economy.metal >= cost.metal
  }

  _updateGhostVisual(isValid, qualityScore = 100) {
    if (!this.game.ghostBuilding) return

    if (this.placementValidator) {
      const color = this.placementValidator.getValidationColor(isValid, qualityScore)
      this.game.ghostBuilding.material.color.setHex(color)
    } else {
      this.game.ghostBuilding.material.color.setHex(isValid ? 0x00ff00 : 0xff0000)
    }

    this.game.ghostBuilding.material.opacity = 0.6
  }

  /**
   * Retourne la hauteur du bâtiment pour le calcul de l'offset
   */
  _getBuildingHeight(type) {
    const heights = {
      base: 4,
      habitation: 2,
      ferme: 1,
      usine: 2,
      entrepot: 1.5,
      centrale: 3,
      mine: 2.5,
      route: 0.2
    }
    return heights[type] || 2
  }

  /**
   * Tentative de placement - envoie la requête au serveur
   */
  tryPlaceBuilding() {
    if (!this.game.isBuildingMode || !this.game.ghostBuilding) return

    const pos = this.game.ghostBuilding.position
    const type = this.game.buildingType
    const mode = this._detectConstructionMode()

    // Vérification rapide côté client
    if (!this._checkCanAfford()) {
      console.log('Placement impossible : ressources insuffisantes')
      return false
    }

    // Envoyer la requête au serveur avec la rotation
    if (this.game.networkManager && this.game.networkManager.socket) {
      console.log(`Requesting building placement: ${type} at (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`)

      // Capturer la rotation du ghost building pour l'orientation sur la planète
      const rot = this.game.ghostBuilding.rotation

      this.game.networkManager.socket.emit('requestPlacement', {
        type,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotX: rot.x,
        rotY: rot.y,
        rotZ: rot.z,
        mode,
        playerId: this.game.playerEntity
      })

      // Désactiver le mode construction après la requête
      this.game.isBuildingMode = false
      if (this.game.ghostBuilding && this.game.ghostBuilding.parent) {
        this.game.ghostBuilding.parent.remove(this.game.ghostBuilding)
      }
      this.game.ghostBuilding = null
      this.game.buildingType = null
    } else {
      console.warn('NetworkManager non disponible, impossible de placer le bâtiment')
    }
  }
}
