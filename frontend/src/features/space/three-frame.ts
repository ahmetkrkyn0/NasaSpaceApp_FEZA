import * as THREE from 'three';
import type { Rotation } from './frame';

/** three.js quaternion of an Earth-fixed to scene rotation (row-major 3 x 3). */
export function rotationQuaternion(r: Rotation): THREE.Quaternion {
  const m = new THREE.Matrix4().set(r[0], r[1], r[2], 0, r[3], r[4], r[5], 0, r[6], r[7], r[8], 0, 0, 0, 0, 1);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}
