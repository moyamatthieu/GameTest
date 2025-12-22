import * as THREE from 'three';
/**
 * Types d'états d'animation pour le Puppet
 */
export type PuppetState = 'IDLE' | 'WALK' | 'RUN' | 'ATTACK' | 'BLOCK' | 'CAST' | 'HIT';
/**
 * Slots modulaires pour l'équipement
 */
export type PuppetSlot = 'HEAD' | 'TORSO' | 'ARMS_UPPER' | 'ARMS_LOWER' | 'LEGS_UPPER' | 'LEGS_LOWER' | 'BACK';
/**
 * Sockets d'attachement pour les items
 */
export type PuppetSocket = 'Socket_MainHand' | 'Socket_OffHand' | 'Socket_Back';
/**
 * Classe Puppet : Un personnage modulaire style "Synty Polygon" / Low-poly.
 * Construit avec des segments anatomiques détaillés et un système d'animation par couches.
 */
export declare class Puppet extends THREE.Group {
    private hips;
    private torso;
    private head;
    private neck;
    private leftUpperArm;
    private leftLowerArm;
    private leftHand;
    private rightUpperArm;
    private rightLowerArm;
    private rightHand;
    private leftUpperLeg;
    private leftLowerLeg;
    private leftFoot;
    private rightUpperLeg;
    private rightLowerLeg;
    private rightFoot;
    private slots;
    private sockets;
    private mixer;
    private actions;
    state: PuppetState;
    private animationTime;
    private currentSpeed;
    private targetRotations;
    private config;
    constructor();
    private createBox;
    private registerSlot;
    /**
     * Initialise la structure hiérarchique complexe du personnage
     */
    private initStructure;
    /**
     * Initialise le système d'animation par couches
     */
    private initAnimationSystem;
    /**
     * Change dynamiquement l'équipement d'un slot
     */
    setEquipment(slot: PuppetSlot, mesh: THREE.Mesh | THREE.Group | null): void;
    /**
     * Attache un objet à un socket (ex: arme dans la main)
     */
    attachToSocket(socketName: PuppetSocket, object: THREE.Object3D): void;
    /**
     * Vide un socket
     */
    clearSocket(socketName: PuppetSocket): void;
    private createIdleClip;
    private createWalkClip;
    private createAttackClip;
    update(deltaTime: number): void;
    private updateAnimationWeights;
    playAction(actionName: PuppetState): void;
    setState(newState: PuppetState): void;
}
