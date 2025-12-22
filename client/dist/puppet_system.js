import * as THREE from 'three';
/**
 * Classe Puppet : Un personnage modulaire style "Synty Polygon" / Low-poly.
 * Construit avec des segments anatomiques détaillés et un système d'animation par couches.
 */
export class Puppet extends THREE.Group {
    // Segments anatomiques (Articulations)
    hips;
    torso;
    head;
    neck;
    // Membres supérieurs
    leftUpperArm;
    leftLowerArm;
    leftHand;
    rightUpperArm;
    rightLowerArm;
    rightHand;
    // Membres inférieurs
    leftUpperLeg;
    leftLowerLeg;
    leftFoot;
    rightUpperLeg;
    rightLowerLeg;
    rightFoot;
    // Slots d'équipement (Conteneurs de meshes)
    slots = new Map();
    // Sockets d'attachement
    sockets = new Map();
    // Système d'Animation
    mixer;
    actions = new Map();
    // État de l'animation
    state = 'IDLE';
    animationTime = 0;
    currentSpeed = 0;
    // Valeurs cibles pour le lerping des rotations (pour des transitions fluides)
    targetRotations = new Map();
    // Paramètres de configuration
    config = {
        baseHeight: 0.95,
        walkSpeed: 8,
        runSpeed: 14,
        idleSpeed: 2,
        transitionDamping: 0.1,
        secondaryMotionIntensity: 0.05
    };
    constructor() {
        super();
        this.initStructure();
        this.initAnimationSystem();
    }
    createBox(w, h, d, color, opacity = 1) {
        const geometry = new THREE.BoxGeometry(w, h, d);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            flatShading: true,
            roughness: 0.6,
            metalness: 0.2,
            transparent: opacity < 1,
            opacity: opacity
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }
    registerSlot(slot, group) {
        if (!this.slots.has(slot)) {
            this.slots.set(slot, []);
        }
        this.slots.get(slot).push(group);
    }
    /**
     * Initialise la structure hiérarchique complexe du personnage
     */
    initStructure() {
        const colors = {
            skin: 0xffdbac,
            shirt: 0x3498db,
            pants: 0x2c3e50,
            shoes: 0x1a1a1a,
            hair: 0x4e342e,
            eyes: 0x333333,
            accessory: 0xe74c3c
        };
        // 1. Hanches (Point pivot central)
        this.hips = new THREE.Group();
        this.hips.name = "Hips";
        this.hips.position.y = this.config.baseHeight;
        this.add(this.hips);
        const hipsMesh = this.createBox(0.38, 0.18, 0.24, colors.pants);
        this.hips.add(hipsMesh);
        // 2. Torse & Cou
        this.torso = new THREE.Group();
        this.torso.name = "Torso";
        this.torso.position.y = 0.09;
        this.hips.add(this.torso);
        // Slot TORSO
        const torsoSlot = new THREE.Group();
        torsoSlot.name = "Slot_Torso";
        this.torso.add(torsoSlot);
        this.registerSlot('TORSO', torsoSlot);
        const torsoMesh = this.createBox(0.42, 0.48, 0.24, colors.shirt);
        torsoMesh.position.y = 0.24;
        torsoSlot.add(torsoMesh);
        // Slot BACK
        const backSlot = new THREE.Group();
        backSlot.name = "Slot_Back";
        backSlot.position.set(0, 0.3, -0.13);
        this.torso.add(backSlot);
        this.registerSlot('BACK', backSlot);
        // Socket BACK (pour attacher des armes)
        const backSocket = new THREE.Group();
        backSocket.name = "Socket_Back";
        backSocket.position.set(0, 0.3, -0.15);
        this.torso.add(backSocket);
        this.sockets.set('Socket_Back', backSocket);
        this.neck = new THREE.Group();
        this.neck.name = "Neck";
        this.neck.position.y = 0.48;
        this.torso.add(this.neck);
        const neckMesh = this.createBox(0.1, 0.08, 0.1, colors.skin);
        neckMesh.position.y = 0.04;
        this.neck.add(neckMesh);
        // 3. Tête & Accessoires
        this.head = new THREE.Group();
        this.head.name = "Head";
        this.head.position.y = 0.08;
        this.neck.add(this.head);
        // Slot HEAD
        const headSlot = new THREE.Group();
        headSlot.name = "Slot_Head";
        this.head.add(headSlot);
        this.registerSlot('HEAD', headSlot);
        const headMesh = this.createBox(0.24, 0.24, 0.24, colors.skin);
        headMesh.position.y = 0.12;
        headSlot.add(headMesh);
        // Yeux (attachés à la tête, pas au slot)
        const eyeL = this.createBox(0.04, 0.04, 0.02, colors.eyes);
        eyeL.position.set(-0.06, 0.15, 0.12);
        this.head.add(eyeL);
        const eyeR = this.createBox(0.04, 0.04, 0.02, colors.eyes);
        eyeR.position.set(0.06, 0.15, 0.12);
        this.head.add(eyeR);
        // 4. Bras Gauche (Épaule -> Coude -> Main)
        this.leftUpperArm = new THREE.Group();
        this.leftUpperArm.name = "LeftUpperArm";
        this.leftUpperArm.position.set(-0.24, 0.42, 0);
        this.torso.add(this.leftUpperArm);
        // Slot ARMS_UPPER (L)
        const lUArmSlot = new THREE.Group();
        lUArmSlot.name = "Slot_ArmsUpper_L";
        this.leftUpperArm.add(lUArmSlot);
        this.registerSlot('ARMS_UPPER', lUArmSlot);
        const lUArmMesh = this.createBox(0.11, 0.28, 0.11, colors.shirt);
        lUArmMesh.position.y = -0.14;
        lUArmSlot.add(lUArmMesh);
        this.leftLowerArm = new THREE.Group();
        this.leftLowerArm.name = "LeftLowerArm";
        this.leftLowerArm.position.y = -0.28;
        this.leftUpperArm.add(this.leftLowerArm);
        // Slot ARMS_LOWER (L)
        const lLArmSlot = new THREE.Group();
        lLArmSlot.name = "Slot_ArmsLower_L";
        this.leftLowerArm.add(lLArmSlot);
        this.registerSlot('ARMS_LOWER', lLArmSlot);
        const lLArmMesh = this.createBox(0.09, 0.26, 0.09, colors.skin);
        lLArmMesh.position.y = -0.13;
        lLArmSlot.add(lLArmMesh);
        this.leftHand = new THREE.Group();
        this.leftHand.name = "LeftHand";
        this.leftHand.position.y = -0.26;
        this.leftLowerArm.add(this.leftHand);
        this.leftHand.add(this.createBox(0.08, 0.08, 0.08, colors.skin));
        // Socket OffHand
        const offHandSocket = new THREE.Group();
        offHandSocket.name = "Socket_OffHand";
        this.leftHand.add(offHandSocket);
        this.sockets.set('Socket_OffHand', offHandSocket);
        // 5. Bras Droit
        this.rightUpperArm = new THREE.Group();
        this.rightUpperArm.name = "RightUpperArm";
        this.rightUpperArm.position.set(0.24, 0.42, 0);
        this.torso.add(this.rightUpperArm);
        // Slot ARMS_UPPER (R)
        const rUArmSlot = new THREE.Group();
        rUArmSlot.name = "Slot_ArmsUpper_R";
        this.rightUpperArm.add(rUArmSlot);
        this.registerSlot('ARMS_UPPER', rUArmSlot);
        const rUArmMesh = this.createBox(0.11, 0.28, 0.11, colors.shirt);
        rUArmMesh.position.y = -0.14;
        rUArmSlot.add(rUArmMesh);
        this.rightLowerArm = new THREE.Group();
        this.rightLowerArm.name = "RightLowerArm";
        this.rightLowerArm.position.y = -0.28;
        this.rightUpperArm.add(this.rightLowerArm);
        // Slot ARMS_LOWER (R)
        const rLArmSlot = new THREE.Group();
        rLArmSlot.name = "Slot_ArmsLower_R";
        this.rightLowerArm.add(rLArmSlot);
        this.registerSlot('ARMS_LOWER', rLArmSlot);
        const rLArmMesh = this.createBox(0.09, 0.26, 0.09, colors.skin);
        rLArmMesh.position.y = -0.13;
        rLArmSlot.add(rLArmMesh);
        this.rightHand = new THREE.Group();
        this.rightHand.name = "RightHand";
        this.rightHand.position.y = -0.26;
        this.rightLowerArm.add(this.rightHand);
        this.rightHand.add(this.createBox(0.08, 0.08, 0.08, colors.skin));
        // Socket MainHand
        const mainHandSocket = new THREE.Group();
        mainHandSocket.name = "Socket_MainHand";
        this.rightHand.add(mainHandSocket);
        this.sockets.set('Socket_MainHand', mainHandSocket);
        // 6. Jambe Gauche (Hanche -> Genou -> Pied)
        this.leftUpperLeg = new THREE.Group();
        this.leftUpperLeg.name = "LeftUpperLeg";
        this.leftUpperLeg.position.set(-0.12, -0.08, 0);
        this.hips.add(this.leftUpperLeg);
        // Slot LEGS_UPPER (L)
        const lULegSlot = new THREE.Group();
        lULegSlot.name = "Slot_LegsUpper_L";
        this.leftUpperLeg.add(lULegSlot);
        this.registerSlot('LEGS_UPPER', lULegSlot);
        const lULegMesh = this.createBox(0.14, 0.38, 0.14, colors.pants);
        lULegMesh.position.y = -0.19;
        lULegSlot.add(lULegMesh);
        this.leftLowerLeg = new THREE.Group();
        this.leftLowerLeg.name = "LeftLowerLeg";
        this.leftLowerLeg.position.y = -0.38;
        this.leftUpperLeg.add(this.leftLowerLeg);
        // Slot LEGS_LOWER (L)
        const lLLegSlot = new THREE.Group();
        lLLegSlot.name = "Slot_LegsLower_L";
        this.leftLowerLeg.add(lLLegSlot);
        this.registerSlot('LEGS_LOWER', lLLegSlot);
        const lLLegMesh = this.createBox(0.12, 0.36, 0.12, colors.pants);
        lLLegMesh.position.y = -0.18;
        lLLegSlot.add(lLLegMesh);
        this.leftFoot = new THREE.Group();
        this.leftFoot.name = "LeftFoot";
        this.leftFoot.position.y = -0.36;
        this.leftLowerLeg.add(this.leftFoot);
        const lFootMesh = this.createBox(0.14, 0.08, 0.22, colors.shoes);
        lFootMesh.position.set(0, -0.04, 0.04);
        this.leftFoot.add(lFootMesh);
        // 7. Jambe Droite
        this.rightUpperLeg = new THREE.Group();
        this.rightUpperLeg.name = "RightUpperLeg";
        this.rightUpperLeg.position.set(0.12, -0.08, 0);
        this.hips.add(this.rightUpperLeg);
        // Slot LEGS_UPPER (R)
        const rULegSlot = new THREE.Group();
        rULegSlot.name = "Slot_LegsUpper_R";
        this.rightUpperLeg.add(rULegSlot);
        this.registerSlot('LEGS_UPPER', rULegSlot);
        const rULegMesh = this.createBox(0.14, 0.38, 0.14, colors.pants);
        rULegMesh.position.y = -0.19;
        rULegSlot.add(rULegMesh);
        this.rightLowerLeg = new THREE.Group();
        this.rightLowerLeg.name = "RightLowerLeg";
        this.rightLowerLeg.position.y = -0.38;
        this.rightUpperLeg.add(this.rightLowerLeg);
        // Slot LEGS_LOWER (R)
        const rLLegSlot = new THREE.Group();
        rLLegSlot.name = "Slot_LegsLower_R";
        this.rightLowerLeg.add(rLLegSlot);
        this.registerSlot('LEGS_LOWER', rLLegSlot);
        const rLLegMesh = this.createBox(0.12, 0.36, 0.12, colors.pants);
        rLLegMesh.position.y = -0.18;
        rLLegSlot.add(rLLegMesh);
        this.rightFoot = new THREE.Group();
        this.rightFoot.name = "RightFoot";
        this.rightFoot.position.y = -0.36;
        this.rightLowerLeg.add(this.rightFoot);
        const rFootMesh = this.createBox(0.14, 0.08, 0.22, colors.shoes);
        rFootMesh.position.set(0, -0.04, 0.04);
        this.rightFoot.add(rFootMesh);
    }
    /**
     * Initialise le système d'animation par couches
     */
    initAnimationSystem() {
        this.mixer = new THREE.AnimationMixer(this);
        // Note: Dans un vrai projet, ces clips seraient chargés depuis des fichiers .glb
        // Ici, nous créons des clips programmatiques pour démontrer le système de couches.
        // 1. Base Layer: Idle
        const idleClip = this.createIdleClip();
        this.actions.set('IDLE', this.mixer.clipAction(idleClip));
        // 2. Base Layer: Walk
        const walkClip = this.createWalkClip();
        this.actions.set('WALK', this.mixer.clipAction(walkClip));
        // 3. Action Layer: Attack (Exemple)
        const attackClip = this.createAttackClip();
        const attackAction = this.mixer.clipAction(attackClip);
        attackAction.setLoop(THREE.LoopOnce, 1);
        attackAction.clampWhenFinished = true;
        this.actions.set('ATTACK', attackAction);
        // Lancer l'animation par défaut
        const idleAction = this.actions.get('IDLE');
        if (idleAction) {
            idleAction.play();
            idleAction.weight = 1.0;
        }
    }
    /**
     * Change dynamiquement l'équipement d'un slot
     */
    setEquipment(slot, mesh) {
        const slotGroups = this.slots.get(slot);
        if (!slotGroups)
            return;
        slotGroups.forEach(slotGroup => {
            // Nettoyer le slot actuel
            while (slotGroup.children.length > 0) {
                slotGroup.remove(slotGroup.children[0]);
            }
            // Ajouter le nouvel équipement (cloné si plusieurs groupes)
            if (mesh) {
                slotGroup.add(slotGroups.length > 1 ? mesh.clone() : mesh);
            }
        });
    }
    /**
     * Attache un objet à un socket (ex: arme dans la main)
     */
    attachToSocket(socketName, object) {
        const socket = this.sockets.get(socketName);
        if (socket) {
            // Nettoyer le socket avant d'attacher
            this.clearSocket(socketName);
            socket.add(object);
        }
    }
    /**
     * Vide un socket
     */
    clearSocket(socketName) {
        const socket = this.sockets.get(socketName);
        if (socket) {
            while (socket.children.length > 0) {
                socket.remove(socket.children[0]);
            }
        }
    }
    createIdleClip() {
        const times = [0, 1, 2];
        const values = [0, 0.02, 0];
        const track = new THREE.NumberKeyframeTrack('Torso.rotation[x]', times, values);
        return new THREE.AnimationClip('IDLE', 2, [track]);
    }
    createWalkClip() {
        const times = [0, 0.5, 1];
        const lLegValues = [0, 0.5, 0];
        const rLegValues = [0, -0.5, 0];
        const tracks = [
            new THREE.NumberKeyframeTrack('LeftUpperLeg.rotation[x]', times, lLegValues),
            new THREE.NumberKeyframeTrack('RightUpperLeg.rotation[x]', times, rLegValues)
        ];
        return new THREE.AnimationClip('WALK', 1, tracks);
    }
    createAttackClip() {
        const times = [0, 0.2, 0.5];
        const values = [0, -0.8, 0];
        const track = new THREE.NumberKeyframeTrack('RightUpperArm.rotation[x]', times, values);
        return new THREE.AnimationClip('ATTACK', 0.5, [track]);
    }
    update(deltaTime) {
        this.mixer.update(deltaTime);
        // Gestion des transitions de couches (Blending)
        this.updateAnimationWeights(deltaTime);
    }
    updateAnimationWeights(deltaTime) {
        // Logique de transition entre IDLE, WALK, RUN sur la Base Layer
        // Et gestion de l'Action Layer (Attack, etc.)
        const walkAction = this.actions.get('WALK');
        const idleAction = this.actions.get('IDLE');
        if (this.state === 'WALK' || this.state === 'RUN') {
            if (walkAction)
                walkAction.enabled = true;
            if (walkAction)
                walkAction.setEffectiveWeight(THREE.MathUtils.lerp(walkAction.weight, 1.0, 0.1));
            if (idleAction)
                idleAction.setEffectiveWeight(THREE.MathUtils.lerp(idleAction.weight, 0.0, 0.1));
        }
        else {
            if (walkAction)
                walkAction.setEffectiveWeight(THREE.MathUtils.lerp(walkAction.weight, 0.0, 0.1));
            if (idleAction)
                idleAction.setEffectiveWeight(THREE.MathUtils.lerp(idleAction.weight, 1.0, 0.1));
        }
    }
    playAction(actionName) {
        const action = this.actions.get(actionName);
        if (action) {
            action.reset();
            action.setEffectiveWeight(1.0);
            action.play();
            // Si c'est une action de combat, on peut vouloir baisser le poids de la locomotion sur le haut du corps
            // Mais ici on simplifie avec le mixer qui gère le blending.
        }
    }
    setState(newState) {
        this.state = newState;
    }
}
//# sourceMappingURL=puppet_system.js.map