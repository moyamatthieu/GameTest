// RTS Main Entry Point
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NetworkManager } from './core/network/NetworkManager';
import { World } from './ecs/World';
import { Position } from './ecs/components/Position';
import { Renderable } from './ecs/components/Renderable';
import { Movable } from './ecs/components/Movable';
import { Selectable } from './ecs/components/Selectable';
import { Owner } from './ecs/components/Owner';
import { ResourceNode, ResourceType } from './ecs/components/ResourceNode';
import { Building, BuildingType } from './ecs/components/Building';
import { Harvester, HarvesterState } from './ecs/components/Harvester';
import { Inventory } from './ecs/components/Inventory';
import { Stockpile } from './ecs/components/Stockpile';
import { MovementSystem } from './ecs/systems/MovementSystem';
import { RenderSystem } from './ecs/systems/RenderSystem';
import { SelectionSystem } from './ecs/systems/SelectionSystem';
import { HarvestSystem } from './ecs/systems/HarvestSystem';

function init() {
    // --- 1. Setup Scene & Camera ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    // Grid
    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // RTS Camera Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below ground

    // RTS Mouse Mapping:
    // Left: Selection (Handled by us)
    // Right: Orbit (Rotate) + Commands (Handled by us)
    // Middle: Pan (Standard RTS)
    controls.mouseButtons = {
        LEFT: null as any,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.ROTATE
    };

    // --- 2. Setup ECS World ---
    const world = new World();
    const movementSystem = new MovementSystem();
    const renderSystem = new RenderSystem(scene);
    const selectionSystem = new SelectionSystem(scene, camera);
    const harvestSystem = new HarvestSystem();

    // --- 3. Setup Network ---
    const network = new NetworkManager();
    const peerIdEl = document.getElementById('peer-id');
    const statusEl = document.getElementById('status');

    let myPlayerId = '';
    const remoteUnits: Map<string, THREE.Mesh> = new Map(); // key: "peerId-unitIndex"

    // --- 4. Game Logic ---

    // Create Resource Nodes
    function createResourceNodes() {
        for (let i = 0; i < 10; i++) {
            const entity = world.createEntity();
            const isIron = Math.random() > 0.5;
            const type = isIron ? ResourceType.IRON : ResourceType.WATER;
            const color = isIron ? 0x888888 : 0x0000ff;

            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;

            world.addComponent(entity, new Position(x, 0.5, z));
            world.addComponent(entity, new ResourceNode(type, 1000));
            world.addComponent(entity, new Selectable()); // So we can click it

            const geometry = new THREE.IcosahedronGeometry(0.7);
            const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.8 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, 0.5, z);
            mesh.userData.entityId = entity;

            world.addComponent(entity, new Renderable(mesh));
            scene.add(mesh);
        }
    }
    createResourceNodes();

    function createLocalUnits(playerId: string) {
        const color = Math.random() * 0xffffff;

        // Create Base
        const baseEntity = world.createEntity();
        const baseX = (Math.random() - 0.5) * 20;
        const baseZ = (Math.random() - 0.5) * 20;

        world.addComponent(baseEntity, new Position(baseX, 1, baseZ));
        world.addComponent(baseEntity, new Building(BuildingType.BASE));
        world.addComponent(baseEntity, new Owner(playerId));
        world.addComponent(baseEntity, new Stockpile());
        world.addComponent(baseEntity, new Selectable());

        const baseGeo = new THREE.BoxGeometry(2, 2, 2);
        const baseMat = new THREE.MeshStandardMaterial({ color: color });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(baseX, 1, baseZ);
        baseMesh.userData.entityId = baseEntity;
        scene.add(baseMesh);
        world.addComponent(baseEntity, new Renderable(baseMesh));

        // Create Units
        for (let i = 0; i < 3; i++) {
            const entity = world.createEntity();

            // Position (near base)
            const startX = baseX + (Math.random() - 0.5) * 5;
            const startZ = baseZ + (Math.random() - 0.5) * 5;
            world.addComponent(entity, new Position(startX, 0.5, startZ));

            // Components
            world.addComponent(entity, new Movable(0.1));
            world.addComponent(entity, new Selectable());
            world.addComponent(entity, new Owner(playerId));
            world.addComponent(entity, new Inventory(10));
            world.addComponent(entity, new Harvester(10)); // Harvest 10 per cycle (fills inventory)

            // Renderable
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ color: color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            scene.add(mesh);

            // Store entity ID on mesh for raycasting
            mesh.userData.entityId = entity;
            mesh.userData.unitIndex = i; // Store index for networking

            world.addComponent(entity, new Renderable(mesh));
        }
    }

    function updateRemoteUnit(ownerId: string, unitIndex: number, x: number, z: number, color: number) {
        const key = `${ownerId}-${unitIndex}`;
        let mesh = remoteUnits.get(key);

        if (!mesh) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ color: color });
            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            remoteUnits.set(key, mesh);
        }

        mesh.position.set(x, 0.5, z);
    }

    network.onPeerId = (id) => {
        myPlayerId = id;
        if (peerIdEl) peerIdEl.innerText = id;
        if (statusEl) statusEl.innerText = `Connected as ${id}`;

        // Create Local Units once we have an ID
        createLocalUnits(id);
    };

    network.onConnection = (conn) => {
        console.log(`Connected to ${conn.peer}`);
        // Send our units' positions to the new peer
        const myUnits = world.getEntitiesWith(Owner, Position, Renderable);
        myUnits.forEach(entity => {
            const owner = world.getComponent(entity, Owner)!;
            if (owner.playerId === myPlayerId) {
                const pos = world.getComponent(entity, Position)!;
                const renderable = world.getComponent(entity, Renderable)!;

                // Only send units, not buildings for now (simple)
                if (renderable.mesh.userData.unitIndex !== undefined) {
                    conn.send({
                        type: 'unit-update',
                        ownerId: myPlayerId,
                        unitIndex: renderable.mesh.userData.unitIndex,
                        x: pos.x,
                        z: pos.z,
                        color: (renderable.mesh.material as THREE.MeshStandardMaterial).color.getHex()
                    });
                }
            }
        });
    };

    network.onData = (data: any, conn) => {
        if (data.type === 'unit-update') {
            updateRemoteUnit(data.ownerId, data.unitIndex, data.x, data.z, data.color);
        }
        if (data.type === 'peer-list') {
            data.peers.forEach((peerId: string) => {
                if (peerId !== network.getPeerId()) {
                    network.connect(peerId);
                }
            });
        }
    };

    // --- 5. Input Handling ---

    // Camera Movement (WASD / Arrows)
    const keys: { [key: string]: boolean } = {};
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        keys[e.key] = true; // Keep key for arrows and special keys

        // Switch Middle Mouse to Rotate when Shift is held
        if (e.shiftKey) {
            controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
        }

        // Stop Command (H key)
        if (e.code === 'KeyH') {
            const selectedEntities = world.getEntitiesWith(Selectable, Movable, Owner, Harvester);
            selectedEntities.forEach(entity => {
                const sel = world.getComponent(entity, Selectable)!;
                const owner = world.getComponent(entity, Owner)!;
                if (sel.selected && owner.playerId === myPlayerId) {
                    const movable = world.getComponent(entity, Movable)!;
                    const harvester = world.getComponent(entity, Harvester)!;

                    movable.target = null;
                    movable.isMoving = false;
                    harvester.state = HarvesterState.IDLE;
                    harvester.targetResourceEntity = null;
                }
            });
        }
    });
    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        keys[e.key] = false;
        // Switch Middle Mouse back to Pan when Shift is released
        if (e.key === 'Shift') {
            controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
        }
    });

    // Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let isMouseInCanvas = false;
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Selection Box UI
    const selectionBoxEl = document.createElement('div');
    selectionBoxEl.style.position = 'absolute';
    selectionBoxEl.style.border = '1px solid #00ff00';
    selectionBoxEl.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
    selectionBoxEl.style.pointerEvents = 'none';
    selectionBoxEl.style.display = 'none';
    document.body.appendChild(selectionBoxEl);

    let isLeftMouseDown = false;
    let leftClickStartPos = { x: 0, y: 0 };

    let rightClickStartTime = 0;
    let rightClickStartPos = { x: 0, y: 0 };

    function handleRightClickCommand(event: MouseEvent) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (placementMode) {
            cancelPlacement();
            return;
        }

        raycaster.setFromCamera(mouse, camera);

        // Check for Resource Nodes first
        const resourceEntities = world.getEntitiesWith(ResourceNode, Renderable);
        const resourceMeshes = resourceEntities.map(e => world.getComponent(e, Renderable)!.mesh);
        const intersects = raycaster.intersectObjects(resourceMeshes);

        if (intersects.length > 0) {
            // Clicked on a resource!
            const targetMesh = intersects[0].object;
            const targetEntity = targetMesh.userData.entityId;

            const selectedEntities = world.getEntitiesWith(Selectable, Harvester, Owner);
            selectedEntities.forEach(entity => {
                const sel = world.getComponent(entity, Selectable)!;
                const owner = world.getComponent(entity, Owner)!;

                if (sel.selected && owner.playerId === myPlayerId) {
                    const harvester = world.getComponent(entity, Harvester)!;
                    harvester.state = HarvesterState.MOVING_TO_RESOURCE;
                    harvester.targetResourceEntity = targetEntity;
                }
            });
            return;
        }

        // If not resource, Raycast to ground for movement
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlane, target);

        if (target) {
            // Command selected units to move
            const selectedEntities = world.getEntitiesWith(Selectable, Movable, Owner, Harvester);
            selectedEntities.forEach(entity => {
                const sel = world.getComponent(entity, Selectable)!;
                const owner = world.getComponent(entity, Owner)!;

                // Only move my own units
                if (sel.selected && owner.playerId === myPlayerId) {
                    const movable = world.getComponent(entity, Movable)!;
                    const harvester = world.getComponent(entity, Harvester)!;

                    // Override harvesting
                    harvester.state = HarvesterState.IDLE;
                    harvester.targetResourceEntity = null;

                    movable.target = target.clone();
                    movable.isMoving = true;
                }
            });
        }
    }

    renderer.domElement.addEventListener('mousedown', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (event.button === 0) { // Left Click: Select or Place Building
            isLeftMouseDown = true;
            leftClickStartPos = { x: event.clientX, y: event.clientY };

            if (placementMode && ghostMesh && placementBuildingType) {
                // Try to place building
                // Check resources
                const myBase = world.getEntitiesWith(Building, Owner, Stockpile).find(e => {
                    const owner = world.getComponent(e, Owner)!;
                    return owner.playerId === myPlayerId && world.getComponent(e, Building)!.type === BuildingType.BASE;
                });

                if (myBase) {
                    const stockpile = world.getComponent(myBase, Stockpile)!;
                    let canAfford = true;
                    for (const [res, amount] of Object.entries(placementCost)) {
                        if (stockpile.get(res as ResourceType) < (amount as number)) {
                            canAfford = false;
                            break;
                        }
                    }

                    if (canAfford) {
                        // Deduct resources
                        for (const [res, amount] of Object.entries(placementCost)) {
                            stockpile.add(res as ResourceType, -(amount as number));
                        }

                        // Create Building Entity
                        const entity = world.createEntity();
                        world.addComponent(entity, new Position(ghostMesh.position.x, ghostMesh.position.y, ghostMesh.position.z));
                        world.addComponent(entity, new Building(placementBuildingType));
                        world.addComponent(entity, new Owner(myPlayerId));
                        world.addComponent(entity, new Selectable());

                        // Add Stockpile to Factory/Farm if needed? For now just visual.

                        const geometry = new THREE.BoxGeometry(2, 2, 2);
                        const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa }); // Grey for buildings
                        const mesh = new THREE.Mesh(geometry, material);
                        mesh.position.copy(ghostMesh.position);
                        mesh.userData.entityId = entity;
                        scene.add(mesh);
                        world.addComponent(entity, new Renderable(mesh));

                        cancelPlacement();
                    } else {
                        console.log("Not enough resources!");
                    }
                }
            } else if (!event.shiftKey) {
                // Deselect all if not holding shift
                const selectableEntities = world.getEntitiesWith(Selectable);
                selectableEntities.forEach(e => {
                    world.getComponent(e, Selectable)!.selected = false;
                });
            }
        } else if (event.button === 2) { // Right Click: Start tracking for Orbit vs Command
            rightClickStartTime = Date.now();
            rightClickStartPos = { x: event.clientX, y: event.clientY };
        }
    });

    window.addEventListener('mouseup', (event) => {
        if (event.button === 0) { // Left Click
            if (isLeftMouseDown) {
                const dist = Math.sqrt(
                    Math.pow(event.clientX - leftClickStartPos.x, 2) +
                    Math.pow(event.clientY - leftClickStartPos.y, 2)
                );

                if (dist > 5 && !placementMode) {
                    // Box Selection (can end outside)
                    selectionSystem.selectBox(leftClickStartPos, { x: event.clientX, y: event.clientY }, world, myPlayerId);
                } else if (!placementMode && event.target === renderer.domElement) {
                    // Single Selection (must end on canvas)
                    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                    selectionSystem.selectAt({ x: mouse.x, y: mouse.y }, world, event.shiftKey);
                }
            }
            isLeftMouseDown = false;
            selectionBoxEl.style.display = 'none';
        } else if (event.button === 2) {
            if (rightClickStartTime > 0) {
                const duration = Date.now() - rightClickStartTime;
                const dist = Math.sqrt(
                    Math.pow(event.clientX - rightClickStartPos.x, 2) +
                    Math.pow(event.clientY - rightClickStartPos.y, 2)
                );

                // If held for less than 250ms and moved less than 5 pixels, it's a click
                // AND it must end on the canvas to give an order
                if (duration < 250 && dist < 5 && event.target === renderer.domElement) {
                    handleRightClickCommand(event);
                }
            }
            rightClickStartTime = 0;
        }
    });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', e => e.preventDefault());

    // --- 6. UI Update ---
    const resourcesEl = document.createElement('div');
    resourcesEl.style.position = 'absolute';
    resourcesEl.style.top = '10px';
    resourcesEl.style.right = '10px';
    resourcesEl.style.color = 'white';
    resourcesEl.style.fontFamily = 'monospace';
    resourcesEl.style.backgroundColor = 'rgba(0,0,0,0.5)';
    resourcesEl.style.padding = '10px';
    document.body.appendChild(resourcesEl);

    // Build Menu
    const buildMenuEl = document.createElement('div');
    buildMenuEl.style.position = 'absolute';
    buildMenuEl.style.bottom = '10px';
    buildMenuEl.style.left = '50%';
    buildMenuEl.style.transform = 'translateX(-50%)';
    buildMenuEl.style.backgroundColor = 'rgba(0,0,0,0.7)';
    buildMenuEl.style.padding = '10px';
    buildMenuEl.style.display = 'flex';
    buildMenuEl.style.gap = '10px';
    document.body.appendChild(buildMenuEl);

    const buildings = [
        { type: BuildingType.FACTORY, label: 'Factory (200 Fe)', cost: { [ResourceType.IRON]: 200 } },
        { type: BuildingType.FARM, label: 'Farm (100 Fe, 50 H2O)', cost: { [ResourceType.IRON]: 100, [ResourceType.WATER]: 50 } },
        { type: BuildingType.HABITATION, label: 'Habitation (50 Fe)', cost: { [ResourceType.IRON]: 50 } }
    ];

    buildings.forEach(b => {
        const btn = document.createElement('button');
        btn.innerText = b.label;
        btn.onclick = () => startBuildingPlacement(b.type, b.cost);
        buildMenuEl.appendChild(btn);
    });

    let placementMode = false;
    let placementBuildingType: BuildingType | null = null;
    let placementCost: any = null;
    let ghostMesh: THREE.Mesh | null = null;

    function startBuildingPlacement(type: BuildingType, cost: any) {
        placementMode = true;
        placementBuildingType = type;
        placementCost = cost;

        // Create ghost
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
        ghostMesh = new THREE.Mesh(geometry, material);
        scene.add(ghostMesh);
    }

    function cancelPlacement() {
        placementMode = false;
        placementBuildingType = null;
        if (ghostMesh) {
            scene.remove(ghostMesh);
            ghostMesh = null;
        }
    }

    window.addEventListener('mousemove', (event) => {
        mousePos.x = event.clientX;
        mousePos.y = event.clientY;

        if (isLeftMouseDown && !placementMode) {
            const currentX = event.clientX;
            const currentY = event.clientY;

            const minX = Math.min(leftClickStartPos.x, currentX);
            const maxX = Math.max(leftClickStartPos.x, currentX);
            const minY = Math.min(leftClickStartPos.y, currentY);
            const maxY = Math.max(leftClickStartPos.y, currentY);

            const width = maxX - minX;
            const height = maxY - minY;

            // Only show box if dragged more than a few pixels
            if (width > 5 || height > 5) {
                selectionBoxEl.style.display = 'block';
                selectionBoxEl.style.left = minX + 'px';
                selectionBoxEl.style.top = minY + 'px';
                selectionBoxEl.style.width = width + 'px';
                selectionBoxEl.style.height = height + 'px';
            }
        }

        if (placementMode && ghostMesh) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const target = new THREE.Vector3();
            raycaster.ray.intersectPlane(groundPlane, target);

            if (target) {
                // Snap to grid (assuming grid size 2)
                ghostMesh.position.set(Math.round(target.x / 2) * 2, 1, Math.round(target.z / 2) * 2);
            }
        }
    });

    // Track if mouse is over the 3D view
    renderer.domElement.addEventListener('mouseenter', () => {
        isMouseInCanvas = true;
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        isMouseInCanvas = false;
        // Reset to center to stop panning
        mousePos.x = window.innerWidth / 2;
        mousePos.y = window.innerHeight / 2;
    });

    // --- 7. Game Loop ---

    function animate() {
        requestAnimationFrame(animate);

        // Camera Control (WASD Pan)
        const camSpeed = 0.5;
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();

        // Get camera forward/right vectors projected on XZ plane
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        right.crossVectors(forward, camera.up).normalize();

        let moveX = 0;
        let moveZ = 0;

        if (keys['KeyW'] || keys['ArrowUp']) {
            moveX += forward.x * camSpeed;
            moveZ += forward.z * camSpeed;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            moveX -= forward.x * camSpeed;
            moveZ -= forward.z * camSpeed;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
            moveX -= right.x * camSpeed;
            moveZ -= right.z * camSpeed;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            moveX += right.x * camSpeed;
            moveZ += right.z * camSpeed;
        }

        if (moveX !== 0 || moveZ !== 0) {
            camera.position.x += moveX;
            camera.position.z += moveZ;
            controls.target.x += moveX;
            controls.target.z += moveZ;
        }

        // Edge Panning (only if mouse is over the game canvas)
        if (isMouseInCanvas) {
            const edgeSize = 20;
            const edgeSpeed = 0.3;
            if (mousePos.x < edgeSize) {
                camera.position.x -= right.x * edgeSpeed;
                camera.position.z -= right.z * edgeSpeed;
                controls.target.x -= right.x * edgeSpeed;
                controls.target.z -= right.z * edgeSpeed;
            }
            if (mousePos.x > window.innerWidth - edgeSize) {
                camera.position.x += right.x * edgeSpeed;
                camera.position.z += right.z * edgeSpeed;
                controls.target.x += right.x * edgeSpeed;
                controls.target.z += right.z * edgeSpeed;
            }
            if (mousePos.y < edgeSize) {
                camera.position.x += forward.x * edgeSpeed;
                camera.position.z += forward.z * edgeSpeed;
                controls.target.x += forward.x * edgeSpeed;
                controls.target.z += forward.z * edgeSpeed;
            }
            if (mousePos.y > window.innerHeight - edgeSize) {
                camera.position.x -= forward.x * edgeSpeed;
                camera.position.z -= forward.z * edgeSpeed;
                controls.target.x -= forward.x * edgeSpeed;
                controls.target.z -= forward.z * edgeSpeed;
            }
        }

        controls.update();

        // ECS Updates
        const delta = 0.016; // Approx 60fps
        movementSystem.update(world, delta);
        harvestSystem.update(world, delta);
        renderSystem.update(world, delta);
        selectionSystem.update(world, delta);

        // UI Update
        if (myPlayerId) {
            // Find my base
            const buildings = world.getEntitiesWith(Building, Owner, Stockpile);
            let iron = 0;
            let water = 0;

            for (const entity of buildings) {
                const owner = world.getComponent(entity, Owner)!;
                if (owner.playerId === myPlayerId) {
                    const stockpile = world.getComponent(entity, Stockpile)!;
                    iron += stockpile.get(ResourceType.IRON);
                    water += stockpile.get(ResourceType.WATER);
                }
            }
            resourcesEl.innerHTML = `IRON: ${Math.floor(iron)}<br>WATER: ${Math.floor(water)}`;
        }

        // Network Broadcast (Simple: broadcast all my units every frame if moving)
        if (myPlayerId) {
            const myUnits = world.getEntitiesWith(Owner, Position, Movable, Renderable);
            myUnits.forEach(entity => {
                const owner = world.getComponent(entity, Owner)!;
                if (owner.playerId === myPlayerId) {
                    const movable = world.getComponent(entity, Movable)!;
                    const pos = world.getComponent(entity, Position)!;
                    const renderable = world.getComponent(entity, Renderable)!;

                    if (movable.isMoving) {
                        network.broadcast({
                            type: 'unit-update',
                            ownerId: myPlayerId,
                            unitIndex: renderable.mesh.userData.unitIndex,
                            x: pos.x,
                            z: pos.z,
                            color: (renderable.mesh.material as THREE.MeshStandardMaterial).color.getHex()
                        });
                    }
                }
            });
        }

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

init();
