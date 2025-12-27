import { Component } from '../World';
import * as THREE from 'three';

export class Renderable implements Component {
  constructor(public mesh: THREE.Object3D) {}
}
