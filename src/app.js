import * as THREE from 'three';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Récupérer ou créer un ID persistant
let playerId = localStorage.getItem('playerId');
if (!playerId) {
  playerId = 'player_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('playerId', playerId);
}

// Récupérer le pseudo sauvegardé
let playerName = localStorage.getItem('playerName') || 'Anonyme';

// Configuration Y.js (CRDT P2P)
const ROOM_NAME = location.hash.slice(1) || 'threejs-world-default';
const ydoc = new Y.Doc();
const yPlayers = ydoc.getMap('players');
const yWorld = ydoc.getMap('world');

// Provider WebRTC pour synchronisation P2P
const provider = new WebrtcProvider(ROOM_NAME, ydoc, {
  signaling: [
    'wss://signaling.yjs.dev',
    'wss://y-webrtc-signaling-eu.herokuapp.com',
    'wss://y-webrtc-signaling-us.herokuapp.com'
  ]
});

// Persistance locale (IndexedDB)
const indexeddbProvider = new IndexeddbPersistence(ROOM_NAME, ydoc);

// Stockage des autres joueurs
const otherPlayers = {};
let connectedPeers = 0;

console.log('🌍 Salle:', ROOM_NAME);
console.log('👤 ID persistant:', playerId);
console.log('📝 Pseudo:', playerName);

// Configuration caméra
const CAMERA_CONFIG = {
  fov: 75,
  near: 0.1,
  far: 1000,
  height: 1.8,    // Hauteur de la caméra au-dessus du joueur
  distance: 5     // Distance derrière le joueur
};

// Configuration contrôles
const CONTROLS_CONFIG = {
  moveSpeed: 0.12,
  rotSpeed: 0.002,
  pitchLimit: 1.5  // Limite pour regarder haut/bas
};

// =============================================================================
// INITIALISATION SCENE
// =============================================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

// Caméra
const camera = new THREE.PerspectiveCamera(
  CAMERA_CONFIG.fov,
  window.innerWidth / window.innerHeight,
  CAMERA_CONFIG.near,
  CAMERA_CONFIG.far
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// =============================================================================
// LUMIÈRES
// =============================================================================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// =============================================================================
// ENVIRONNEMENT
// =============================================================================

// Sol
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Grille
const gridHelper = new THREE.GridHelper(100, 50, 0x00ff88, 0x444444);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// Obstacles aléatoires
for (let i = 0; i < 10; i++) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
  );
  box.position.set(
    Math.random() * 40 - 20,
    1,
    Math.random() * 40 - 20
  );
  scene.add(box);
}

// =============================================================================
// JOUEURS
// =============================================================================

function createPlayerMesh(color = 0xff6b6b) {
  const group = new THREE.Group();
  
  // Corps (capsule)
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.3, 1, 8, 16),
    new THREE.MeshStandardMaterial({ color })
  );
  body.position.y = 1;
  group.add(body);
  
  // Indicateur de direction
  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  arrow.position.set(0, 1.5, 0.4);
  arrow.rotation.x = Math.PI / 2;
  group.add(arrow);
  
  return group;
}

// Joueur local
const localPlayer = createPlayerMesh(0xff6b6b);
localPlayer.position.set(0, 0, 0);
scene.add(localPlayer);

// =============================================================================
// CONTRÔLES
// =============================================================================

const keys = {};
let cameraYaw = 0;
let cameraPitch = 0;

// Événements clavier
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Événements souris
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement) {
    cameraYaw -= e.movementX * CONTROLS_CONFIG.rotSpeed;
    cameraPitch -= e.movementY * CONTROLS_CONFIG.rotSpeed;
    cameraPitch = Math.max(
      -CONTROLS_CONFIG.pitchLimit,
      Math.min(CONTROLS_CONFIG.pitchLimit, cameraPitch)
    );
  }
});

// Verrouillage pointeur au clic
renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

// Helpers pour mapping AZERTY/QWERTY
const isForward = () => keys['z'] || keys['w'];
const isBack = () => keys['s'];
const isLeft = () => keys['q'] || keys['a'];
const isRight = () => keys['d'];

// =============================================================================
// SYNCHRONISATION MULTIJOUEUR (Y.JS)
// =============================================================================

// Mise à jour UI avec infos
const $nameInput = document.getElementById('nameInput');
const $roomInfo = document.getElementById('roomInfo');

if ($nameInput) {
  $nameInput.value = playerName;
  $nameInput.addEventListener('input', (e) => {
    playerName = e.target.value || 'Anonyme';
    localStorage.setItem('playerName', playerName);
    console.log('📝 Nouveau pseudo:', playerName);
  });
  // Empêcher le pointer lock quand on tape dans l'input
  $nameInput.addEventListener('focus', () => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  });
}

if ($roomInfo) $roomInfo.textContent = 'Salle: ' + ROOM_NAME;

// Observer les changements de peers connectés
provider.on('peers', ({ added, removed, webrtcPeers }) => {
  connectedPeers = webrtcPeers.length;
  updatePlayerCount();
  console.log('👥 Pairs connectés:', connectedPeers);
});

// Observer les changements de joueurs
yPlayers.observe((event) => {
  event.changes.keys.forEach((change, key) => {
    if (key === playerId) return; // Ignorer notre propre joueur
    
    if (change.action === 'add' || change.action === 'update') {
      const data = yPlayers.get(key);
      if (!data) return;
      
      // Créer nouveau joueur si nécessaire
      if (!otherPlayers[key]) {
        otherPlayers[key] = createPlayerMesh(0x00ff88);
        scene.add(otherPlayers[key]);
        updatePlayerCount();
      }
      
      // Mettre à jour position
      if (otherPlayers[key]) {
        otherPlayers[key].position.set(data.x, data.y, data.z);
        otherPlayers[key].rotation.y = data.rotation;
      }
    } else if (change.action === 'delete') {
      // Supprimer joueur déconnecté
      if (otherPlayers[key]) {
        scene.remove(otherPlayers[key]);
        delete otherPlayers[key];
        updatePlayerCount();
      }
    }
  });
});

// Nettoyer les joueurs inactifs (timeout 10s)
setInterval(() => {
  const now = Date.now();
  yPname: playerName,
    layers.forEach((data, key) => {
    if (key === playerId) return;
    if (!data.lastUpdate || now - data.lastUpdate > 10000) {
      yPlayers.delete(key);
    }
  });
}, 5000);

// Publier position locale toutes les 100ms
setInterval(() => {
  yPlayers.set(playerId, {
    x: localPlayer.position.x,
    y: localPlayer.position.y,
    z: localPlayer.position.z,
    rotation: localPlayer.rotation.y,
    lastUpdate: Date.now()
  });
}, 100);

// Nettoyer à la fermeture
window.addEventListener('beforeunload', () => {
  yPlayers.delete(playerId);
  provider.destroy();
  indexeddbProvider.destroy();
});

// Mettre à jour compteur de joueurs
function updatePlayerCount() {
  const $count = document.getElementById('playerCount');
  const totalPlayers = Object.keys(otherPlayers).length + 1;
  if ($count) $count.textContent = `Joueurs connectés: ${totalPlayers} (${connectedPeers} pairs)`;
}

// =============================================================================
// GESTION FENÊTRE
// =============================================================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// =============================================================================
// BOUCLE DE JEU
// =============================================================================

function animate() {
  requestAnimationFrame(animate);

  // Calcul des directions de déplacement (relatives à la caméra)
  const forward = new THREE.Vector3(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
  const right = new THREE.Vector3(-Math.cos(cameraYaw), 0, Math.sin(cameraYaw));

  // Déplacement du joueur
  if (isForward()) localPlayer.position.add(forward.clone().multiplyScalar(CONTROLS_CONFIG.moveSpeed));
  if (isBack()) localPlayer.position.sub(forward.clone().multiplyScalar(CONTROLS_CONFIG.moveSpeed));
  if (isLeft()) localPlayer.position.sub(right.clone().multiplyScalar(CONTROLS_CONFIG.moveSpeed));
  if (isRight()) localPlayer.position.add(right.clone().multiplyScalar(CONTROLS_CONFIG.moveSpeed));

  // Orienter le joueur dans la direction de la caméra
  localPlayer.rotation.y = cameraYaw;

  // Calcul position caméra (derrière le joueur avec pitch)
  const camDistance = CAMERA_CONFIG.distance;
  const camX = localPlayer.position.x - Math.sin(cameraYaw) * camDistance * Math.cos(cameraPitch);
  const camY = localPlayer.position.y + CAMERA_CONFIG.height + camDistance * Math.sin(cameraPitch);
  const camZ = localPlayer.position.z - Math.cos(cameraYaw) * camDistance * Math.cos(cameraPitch);
  
  camera.position.set(camX, camY, camZ);
  
  // Point de visée (légèrement au-dessus du joueur)
  const lookTarget = localPlayer.position.clone().add(new THREE.Vector3(0, CAMERA_CONFIG.height - 0.5, 0));
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
}

// Démarrer la boucle
animate();
