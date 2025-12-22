import * as THREE from 'three';
import { System } from 'shared';
/**
 * Système gérant l'environnement atmosphérique, le terrain et les structures procédurales.
 */
export class EnvironmentSystem extends System {
    scene;
    terrain = null;
    sunLight = null;
    ambientLight = null;
    megaliths = null;
    rocks = null;
    constructor(scene) {
        super();
        this.scene = scene;
        this.setupAtmosphere();
        this.setupLights();
        this.generateTerrain();
        this.generateMegaliths();
    }
    setupAtmosphere() {
        // Brouillard volumétrique dense et mystérieux (gris-bleu mélancolique)
        const fogColor = 0x2c3e50;
        const fogDensity = 0.015;
        this.scene.fog = new THREE.FogExp2(fogColor, fogDensity);
        this.scene.background = new THREE.Color(fogColor);
    }
    setupLights() {
        // Lumière ambiante faible pour l'ambiance "gritty"
        this.ambientLight = new THREE.AmbientLight(0x404050, 0.5);
        this.scene.add(this.ambientLight);
        // Soleil pâle (DirectionalLight)
        this.sunLight = new THREE.DirectionalLight(0xdfe6e9, 0.8);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        // Configuration des ombres
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);
    }
    generateTerrain() {
        const size = 500;
        const segments = 128;
        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        // Rotation pour mettre le plan à l'horizontale
        geometry.rotateX(-Math.PI / 2);
        // Modification des sommets pour créer des collines (Bruit de Simplex simplifié)
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            // Génération de collines douces avec plusieurs octaves de sinus/cosinus (faute de bibliothèque de bruit)
            // On pourra remplacer par un vrai SimplexNoise si besoin
            let height = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5;
            height += Math.sin(x * 0.05 + z * 0.03) * 2;
            height += Math.random() * 0.2; // Petit grain
            vertices[i + 1] = height;
        }
        geometry.computeVertexNormals();
        const material = new THREE.MeshStandardMaterial({
            color: 0x2d3436, // Terre sombre / Landes
            roughness: 0.8,
            metalness: 0.1,
        });
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
    }
    generateMegaliths() {
        const count = 50;
        const geometry = new THREE.BoxGeometry(2, 6, 1.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0x636e72, // Pierre grise
            roughness: 0.9,
        });
        this.megaliths = new THREE.InstancedMesh(geometry, material, count);
        this.megaliths.castShadow = true;
        this.megaliths.receiveShadow = true;
        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 400;
            const z = (Math.random() - 0.5) * 400;
            const y = this.getTerrainHeight(x, z) + 2.5; // Un peu enfoncé dans le sol
            dummy.position.set(x, y, z);
            dummy.rotation.y = Math.random() * Math.PI;
            dummy.rotation.x = (Math.random() - 0.5) * 0.2; // Légèrement penché
            dummy.scale.setScalar(0.8 + Math.random() * 0.5);
            dummy.updateMatrix();
            this.megaliths.setMatrixAt(i, dummy.matrix);
        }
        this.scene.add(this.megaliths);
        // Ajouter quelques rochers plus petits
        const rockCount = 200;
        const rockGeo = new THREE.DodecahedronGeometry(1, 0);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x4b4b4b });
        this.rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
        this.rocks.castShadow = true;
        this.rocks.receiveShadow = true;
        for (let i = 0; i < rockCount; i++) {
            const x = (Math.random() - 0.5) * 450;
            const z = (Math.random() - 0.5) * 450;
            const y = this.getTerrainHeight(x, z);
            dummy.position.set(x, y, z);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            dummy.scale.setScalar(0.2 + Math.random() * 0.8);
            dummy.updateMatrix();
            this.rocks.setMatrixAt(i, dummy.matrix);
        }
        this.scene.add(this.rocks);
    }
    getTerrainHeight(x, z) {
        // Doit correspondre à la logique de generateTerrain
        let height = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5;
        height += Math.sin(x * 0.05 + z * 0.03) * 2;
        return height;
    }
    update(dt, world) {
        // On pourrait animer le brouillard ou la lumière ici (cycle jour/nuit)
        if (this.sunLight) {
            // Animation très lente du soleil pour simuler le passage du temps
            const time = Date.now() * 0.0001;
            // this.sunLight.position.x = Math.cos(time) * 100;
            // this.sunLight.position.z = Math.sin(time) * 100;
        }
    }
}
//# sourceMappingURL=EnvironmentSystem.js.map