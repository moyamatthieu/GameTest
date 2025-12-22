import * as THREE from 'three';
import { 
  World, Position, Velocity, Renderable, RenderType, 
  Stats, Identity, Equipment, EquipmentSlot, NPC, NPCType
} from 'shared';
import { RenderSystem } from './engine/RenderSystem';
import { EnvironmentSystem } from './engine/EnvironmentSystem';
import { EquipmentVisualSystem } from './engine/EquipmentVisualSystem';
import { Puppet } from './puppet_system';

// Setup Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Setup ECS
const world = new World();
const equipmentVisualSystem = new EquipmentVisualSystem();
const renderSystem = new RenderSystem(scene, camera, equipmentVisualSystem);
const environmentSystem = new EnvironmentSystem(scene);

world.addSystem(renderSystem);
world.addSystem(environmentSystem);
world.addSystem(equipmentVisualSystem);

// --- CONFIGURATION DE LA SCÈNE ---

// 1. Ambiance "Gritty" Arthurienne
// Le brouillard est géré par EnvironmentSystem, mais on peut ajuster les paramètres
// On va forcer un brouillard épais et sombre
scene.fog = new THREE.FogExp2(0x1a1a1a, 0.05);
renderer.setClearColor(0x1a1a1a);

// Lumière directionnelle faible (Lune)
const moonLight = new THREE.DirectionalLight(0x444466, 0.5);
moonLight.position.set(10, 20, 10);
moonLight.castShadow = true;
scene.add(moonLight);

// Lumière ambiante très faible
const ambientLight = new THREE.AmbientLight(0x111122, 0.2);
scene.add(ambientLight);

// Sol (Lande brumeuse)
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 2. Création du Personnage Principal (Arthur)
const player = world.createEntity();
world.addComponent(player, new Position(0, 0, 0));
world.addComponent(player, new Renderable(RenderType.PLAYER, 0xffffff));
world.addComponent(player, new Identity('Arthur', 'Pendragon'));
world.addComponent(player, new Stats(100, 100));

const playerEquipment = new Equipment();
playerEquipment.slots[EquipmentSlot.MAIN_HAND] = 'claymore_t5';
world.addComponent(player, playerEquipment);

renderSystem.setLocalPlayer(player);

// 3. Création des NPCs (Spriggans)
const sprigganCount = 5;
for (let i = 0; i < sprigganCount; i++) {
    const spriggan = world.createEntity();
    const angle = (i / sprigganCount) * Math.PI * 2;
    const radius = 5 + Math.random() * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    world.addComponent(spriggan, new Position(x, 0, z));
    world.addComponent(spriggan, new Renderable(RenderType.PLAYER, 0x228B22)); // Vert forêt
    world.addComponent(spriggan, new NPC(`Spriggan ${i + 1}`, NPCType.ENEMY));
    world.addComponent(spriggan, new Stats(80, 80));
    
    // Les Spriggans ont souvent des bâtons ou des griffes
    const sprigganEq = new Equipment();
    sprigganEq.slots[EquipmentSlot.MAIN_HAND] = 'staff_t1';
    world.addComponent(spriggan, sprigganEq);
}

// Game loop
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  // Update ECS
  world.update(dt);

  // Animation légère du joueur pour montrer qu'il est vivant
  const playerMesh = renderSystem.meshes.get(player);
  if (playerMesh instanceof Puppet) {
      // On peut forcer un état ou laisser l'IDLE par défaut
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log("Demo Puppet System chargée : Arthur avec Claymore T5 vs Spriggans");
