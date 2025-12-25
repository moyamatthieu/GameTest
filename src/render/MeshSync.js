import * as THREE from 'three'

/**
 * MeshSync - Système de rendu pur
 *
 * Responsabilités :
 * - Synchroniser les positions ECS avec les meshes Three.js
 * - Créer/détruire les meshes selon les entités
 * - Gérer les animations visuelles (pas la logique)
 *
 * ⚠️ Ce système NE DOIT PAS modifier les composants ECS
 * Il lit uniquement Position, Renderable, Rotation
 */
export class MeshSync {
  constructor(sceneManager, assetManager) {
    this.sceneManager = sceneManager
    this.assetManager = assetManager
    this.entityMeshes = new Map() // entityId → THREE.Mesh
    this.lastScene = null
  }

  /**
   * Appelé chaque frame pour synchroniser le rendu
   */
  update(world) {
    const currentScene = this.sceneManager.currentScene
    if (!currentScene) return

    // Si on a changé de scène, on vide les meshes pour les recréer dans la nouvelle scène
    if (this.lastScene !== currentScene) {
      this.clearAll()
      this.lastScene = currentScene
    }

    // Synchroniser toutes les entités avec Renderable + Position
    const entities = world.getEntitiesWith('Position', 'Renderable')

    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position')
      const renderable = world.getComponent(entity, 'Renderable')

      // Créer le mesh si nécessaire
      if (!this.entityMeshes.has(entity)) {
        this.createMesh(entity, renderable, currentScene)
      }

      // Synchroniser la position
      const mesh = this.entityMeshes.get(entity)
      if (mesh) {
        // S'assurer que le mesh est dans la scène actuelle (au cas où elle aurait été clear)
        if (!mesh.parent) {
          currentScene.scene.add(mesh)
        }

        mesh.position.set(pos.x, pos.y, pos.z)

        // Synchroniser la rotation si présente
        const rotation = world.getComponent(entity, 'Rotation')
        if (rotation) {
          mesh.rotation.set(rotation.x, rotation.y, rotation.z)
        }
      }
    }

    // Nettoyer les meshes des entités détruites
    this.cleanupDestroyedEntities(world)
  }

  createMesh(entityId, renderable, scene) {
    let geometry, material, mesh

    // Déterminer le type de mesh à créer
    switch (renderable.type) {
      case 'building':
        geometry = this.getBuildingGeometry(renderable.buildingType)
        material = new THREE.MeshStandardMaterial({ color: renderable.color || 0x808080 })
        mesh = new THREE.Mesh(geometry, material)
        break

      case 'ship':
        geometry = new THREE.ConeGeometry(0.5, 2, 4)
        material = new THREE.MeshStandardMaterial({ color: renderable.color || 0x4488ff })
        mesh = new THREE.Mesh(geometry, material)
        mesh.rotation.x = Math.PI / 2
        break

      case 'cargo_ship':
        geometry = new THREE.BoxGeometry(1, 1, 2)
        material = new THREE.MeshStandardMaterial({ color: 0xffaa00 })
        mesh = new THREE.Mesh(geometry, material)
        break

      case 'planet':
        const radius = renderable.radius || 100
        geometry = new THREE.SphereGeometry(radius, 64, 64)
        material = new THREE.MeshPhongMaterial({
          color: renderable.color || 0x2e7d32,
          shininess: 10,
          flatShading: false
        })
        mesh = new THREE.Mesh(geometry, material)
        break

      case 'star':
        geometry = new THREE.SphereGeometry(renderable.radius || 20, 32, 32)
        material = new THREE.MeshBasicMaterial({ color: renderable.color || 0xffff00 })
        mesh = new THREE.Mesh(geometry, material)
        break

      default:
        // Mesh par défaut
        geometry = new THREE.BoxGeometry(1, 1, 1)
        material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        mesh = new THREE.Mesh(geometry, material)
    }

    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.entityId = entityId

    scene.scene.add(mesh)
    this.entityMeshes.set(entityId, mesh)

    // Stocker la référence dans le composant pour faciliter l'accès
    renderable.mesh = mesh
  }

  getBuildingGeometry(buildingType) {
    switch (buildingType) {
      case 'base':
        return this.assetManager.getGeometry('geo_base', () => new THREE.BoxGeometry(3, 4, 3))
      case 'habitation':
        return this.assetManager.getGeometry('geo_habitation', () => new THREE.BoxGeometry(2, 2, 2))
      case 'ferme':
        return this.assetManager.getGeometry('geo_ferme', () => new THREE.CylinderGeometry(1.5, 1.5, 1, 32))
      case 'usine':
        return this.assetManager.getGeometry('geo_usine', () => new THREE.BoxGeometry(2.5, 2, 2.5))
      case 'entrepot':
        return this.assetManager.getGeometry('geo_entrepot', () => new THREE.BoxGeometry(2.5, 1.5, 4))
      case 'centrale':
        return this.assetManager.getGeometry('geo_centrale', () => new THREE.CylinderGeometry(1, 1.5, 3, 16))
      case 'mine':
        return this.assetManager.getGeometry('geo_mine', () => new THREE.ConeGeometry(1.5, 2.5, 4))
      case 'route':
        return this.assetManager.getGeometry('geo_route', () => new THREE.BoxGeometry(2, 0.2, 2))
      default:
        return new THREE.BoxGeometry(2, 2, 2)
    }
  }

  cleanupDestroyedEntities(world) {
    for (const [entityId, mesh] of this.entityMeshes.entries()) {
      const hasRequiredComponents = world.entities.has(entityId) &&
                                   world.hasComponent(entityId, 'Position') &&
                                   world.hasComponent(entityId, 'Renderable');

      if (!hasRequiredComponents) {
        // L'entité n'existe plus ou n'est plus rendu, supprimer le mesh
        if (mesh.parent) {
          mesh.parent.remove(mesh)
        }
        this.entityMeshes.delete(entityId)
      }
    }
  }

  /**
   * Supprimer tous les meshes (utilisé lors du changement de scène)
   * On ne dispose pas les géométries/matériaux ici car ils sont gérés par l'AssetManager
   */
  clearAll() {
    for (const [entityId, mesh] of this.entityMeshes.entries()) {
      if (mesh.parent) {
        mesh.parent.remove(mesh)
      }
    }
    this.entityMeshes.clear()
  }
}
