import * as THREE from 'three';
import type { Anim } from '../../../shared/types';
const M = (c: number) => new THREE.MeshLambertMaterial({ color: c });
/** Procedural cartoon character (big head, big eyes + mouth, gloves, sneakers). Replace with a GLB via AssetManager later. */
export function makeCharacter(color: number): THREE.Group { const g = new THREE.Group(), u = g.userData as { arms: THREE.Mesh[]; feet: THREE.Group[]; head: THREE.Group };
  const S = (p: THREE.Object3D, r: number, c: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), M(c)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); p.add(m); return m; };
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.4, .4, 4, 12), M(color)); body.position.y = .85; g.add(body);
  const hd = new THREE.Group(); hd.position.y = 1.75; g.add(hd); S(hd, .72, 0xffe0bd, 0, 0, 0);
  [-1, 1].forEach(q => { S(hd, .2, 0xffffff, q * .27, .12, .56, 1, 1.2, .5); S(hd, .09, 0x111111, q * .27, .12, .67, 1, 1.2, .5); S(hd, .1, 0xff9aa2, q * .46, -.15, .5, 1, .7, .4); });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(.26, .05, 8, 16, Math.PI), M(0x7a1c1c)); mouth.position.set(0, -.18, .66); mouth.rotation.z = Math.PI; hd.add(mouth);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.75, 18, 10, 0, 6.28, 0, 1.15), M(color)); cap.position.y = .05; hd.add(cap);
  u.arms = [-1, 1].map(q => S(g, .3, 0xffffff, q * .62, .95, 0)); u.feet = [-1, 1].map(q => { const f = new THREE.Group(); S(f, .32, 0xffffff, 0, 0, 0, 1, .55, 1.5); S(f, .22, color, 0, .14, -.1, 1, .6, 1.1); f.position.set(q * .24, .16, .08); g.add(f); return f; });
  u.head = hd; return g; }
export function animateCharacter(g: THREE.Group, a: Anim, t: number) { const u = g.userData as { arms: THREE.Mesh[]; feet: THREE.Group[]; head: THREE.Group }, sp = a === 'run' ? 14 : 8, amp = a === 'idle' || a === 'jump' ? 0 : a === 'run' ? .5 : .3, s = Math.sin(t * sp) * amp;
  u.feet[0].position.z = .08 + s; u.feet[1].position.z = .08 - s; u.arms[0].position.z = -s * .8; u.arms[1].position.z = s * .8; u.arms.forEach(m => m.position.y = a === 'jump' ? 1.4 : .95); u.head.position.y = 1.75 + (a === 'idle' ? Math.sin(t * 2) * .02 : Math.abs(s) * .15); }
