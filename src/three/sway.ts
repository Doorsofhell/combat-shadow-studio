import { BufferAttribute, Matrix3, Matrix4, Vector3, Vector4, type Material, type SkinnedMesh, type WebGLProgramParametersWithUniforms } from 'three';

/**
 * 1.10 secondary motion of the loose ends (Youssef 2026-11-03: « animez légèrement les pans et les extrémités de
 * ceinture ; le nœud doit conserver sa tenue »). The skirt of the gi jacket and the two tails of the belt lag behind
 * the hips a little and swing back, like cloth with weight: a damped spring per garment, driven by the speed of a
 * point at the bottom of the garment (it follows the hips' turns too), applied in the vertex shader before skinning
 * and growing from nothing at the belt line to full at the free end, so the knot and the belt itself stay put.
 * Heavier gi (judo) swing less and settle sooner than the BJJ one. Driven by the real time between images, clamped:
 * a pause lets the cloth come to rest, a slow motion slows it, a cut to another technique never throws it.
 */
interface Entry {
  mesh: SkinnedMesh;
  hips: number;
  bottom: Vector3;
  prev: Vector3 | null;
  off: Vector3;
  vel: Vector3;
  u: { cssSway: { value: Vector4 } };
  gain: number;
  stiff: number;
}

const tmpM = new Matrix4();
const tmpN = new Matrix3();
const tmpV = new Vector3();

/** the garments that swing: names given by tools/generator/rocketbox/outfits.py */
export function swingKind(name: string): 'jupe' | 'pan' | null {
  const n = name.replace(/^tenue:/, '');
  if (n.startsWith('jupe-veste')) return 'jupe';
  if (/^pan-/.test(n)) return 'pan';
  return null;
}

/**
 * Proposition 1.46 (aperçu, Youssef 15/11 : « tissu qui bouge au mouvement ») : les shorts amples (boxe, thaï) suivent
 * la cuisse avec un léger retard, chaque jambe du short son propre ressort, mené par la vitesse d'un point de son
 * ourlet ; rien au-dessus de l'aine (la ceinture reste en place), tout à l'ourlet. Activé seulement par
 * globalThis.__cssShortSway (Lab : ?sway=1) tant qu'il n'est pas validé.
 */
interface LegEntry {
  mesh: SkinnedMesh;
  legs: { bone: number; point: Vector3; prev: Vector3 | null; off: Vector3; vel: Vector3; u: { value: Vector4 } }[];
}
export const shortSwayOn = () => !!(globalThis as { __cssShortSway?: boolean }).__cssShortSway;
const SHORT_RE = /^short-(?:boxe|thai)(?:\.\d+)?$/;

export class Sway {
  private list: Entry[] = [];
  private shorts: LegEntry[] = [];

  /** a loose short: one spring per leg (proposition, see LegEntry) */
  addShort(mesh: SkinnedMesh) {
    const name = mesh.name.replace(/^tenue:/, '');
    if (!SHORT_RE.test(name) || !shortSwayOn()) return false;
    const bones = mesh.skeleton.bones.map((b) => b.name.replace(/^mixamorig:?/, ''));
    const hips = bones.indexOf('Hips');
    const legsIdx = [bones.indexOf('LeftUpLeg'), bones.indexOf('RightUpLeg')];
    if (hips < 0 || legsIdx.some((i) => i < 0)) return false;
    const g = mesh.geometry;
    const pos = g.getAttribute('position');
    let top = -Infinity, low = Infinity;
    for (let i = 0; i < pos.count; i++) {
      top = Math.max(top, pos.getY(i));
      low = Math.min(low, pos.getY(i));
    }
    // the crotch line: 45 % of the way down from the waist; nothing moves above it
    const crotch = top - (top - low) * 0.45;
    const w = new Float32Array(pos.count);
    const side = new Float32Array(pos.count);
    const pts = [new Vector3(), new Vector3()];
    const n = [0, 0];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = Math.min(1, Math.max(0, (crotch - y) / Math.max(1e-6, crotch - low)));
      w[i] = t * t * (3 - 2 * t);
      side[i] = pos.getX(i) > 0 ? 0 : 1;
      if (y < low + (top - low) * 0.1) {
        pts[side[i]].add(tmpV.fromBufferAttribute(pos, i));
        n[side[i]]++;
      }
    }
    g.setAttribute('cssSwayW', new BufferAttribute(w, 1));
    g.setAttribute('cssSwaySide', new BufferAttribute(side, 1));
    const legs = [0, 1].map((k) => ({ bone: legsIdx[k], point: pts[k].divideScalar(Math.max(1, n[k])), prev: null, off: new Vector3(), vel: new Vector3(), u: { value: new Vector4() } }));
    applyShortSway(mesh.material as Material, { cssSwayL: legs[0].u, cssSwayR: legs[1].u });
    this.shorts.push({ mesh, legs });
    return true;
  }

  /** prepares a garment if it swings; heavy = judo gi (thicker, heavier cotton) */
  add(mesh: SkinnedMesh, heavy: boolean) {
    const kind = swingKind(mesh.name);
    if (!kind) return false;
    const hips = mesh.skeleton.bones.findIndex((b) => b.name === 'Hips');
    if (hips < 0) return false;
    const g = mesh.geometry;
    const pos = g.getAttribute('position');
    let top = -Infinity;
    let low = Infinity;
    for (let i = 0; i < pos.count; i++) {
      top = Math.max(top, pos.getY(i));
      low = Math.min(low, pos.getY(i));
    }
    const span = Math.max(1e-6, top - low);
    if (!g.getAttribute('cssSwayW')) {
      const w = new Float32Array(pos.count);
      // the top of a tail is in the knot, the top of the skirt under the belt: nothing moves there
      for (let i = 0; i < pos.count; i++) w[i] = Math.pow(Math.min(1, Math.max(0, (top - pos.getY(i)) / span)), 1.4);
      g.setAttribute('cssSwayW', new BufferAttribute(w, 1));
    }
    const bottom = new Vector3();
    let n = 0;
    for (let i = 0; i < pos.count; i++)
      if (pos.getY(i) < low + span * 0.15) {
        bottom.add(tmpV.fromBufferAttribute(pos, i));
        n++;
      }
    bottom.divideScalar(Math.max(1, n));
    const u = { cssSway: { value: new Vector4() } };
    applySway(mesh.material as Material, u);
    // metres in the world: the swing never exceeds a few centimetres; the tails are lighter than the skirt
    const gain = (kind === 'pan' ? 0.075 : 0.05) * (heavy ? 0.7 : 1);
    const stiff = (kind === 'pan' ? 70 : 90) * (heavy ? 1.3 : 1);
    this.list.push({ mesh, hips, bottom, prev: null, off: new Vector3(), vel: new Vector3(), u, gain, stiff });
    return true;
  }

  /** dt = 0 (still images): the cloth hangs at rest */
  update(dt: number) {
    this.updateShorts(dt);
    // garments taken off (outfit or quality change) leave the list
    if (this.list.some((e) => !e.mesh.parent)) this.list = this.list.filter((e) => e.mesh.parent);
    for (const e of this.list) {
      if (dt <= 0) {
        e.off.set(0, 0, 0);
        e.vel.set(0, 0, 0);
        e.prev = null;
        e.u.cssSway.value.set(0, 0, 0, 0);
        continue;
      }
      // a long gap (tab in the background, a stalled image): the cloth starts again from where the body is
      if (dt > 0.2) e.prev = null;
      const d = Math.min(dt, 1 / 20);
      // garment point -> world: bone matrix x inverse bind x bind matrix (three's skinning), then the mesh's parent
      const bone = e.mesh.skeleton.bones[e.hips];
      tmpM.multiplyMatrices(bone.matrixWorld, e.mesh.skeleton.boneInverses[e.hips]).multiply(e.mesh.bindMatrix);
      const p = e.bottom.clone().applyMatrix4(tmpM);
      const v = e.prev ? p.clone().sub(e.prev).divideScalar(d) : new Vector3();
      e.prev = p;
      // target: the cloth trails behind the motion (60 ms of it), at most 8 cm
      const target = v.multiplyScalar(-0.06).clampLength(0, 0.08).multiplyScalar(e.gain / 0.06);
      const k = e.stiff;
      const c = 2 * Math.sqrt(k) * 0.55;
      for (let s = 0; s < 2; s++) {
        const h = d / 2;
        const acc = target.clone().sub(e.off).multiplyScalar(k).addScaledVector(e.vel, -c);
        e.vel.addScaledVector(acc, h);
        e.off.addScaledVector(e.vel, h);
      }
      e.off.clampLength(0, 0.08);
      // world offset -> the garment's own space before skinning (inverse of the linear part of the same matrix)
      tmpN.setFromMatrix4(tmpM).invert();
      const o = e.off.clone().applyMatrix3(tmpN);
      e.u.cssSway.value.set(o.x, o.y, o.z, 1);
    }
  }
}

const SHORT_GAIN = 0.03; // m: the hem trails the thigh by 3 cm at most
const SHORT_STIFF = 140;
Sway.prototype.updateShorts = function (this: Sway, dt: number) {
  const self = this as unknown as { shorts: LegEntry[] };
  if (self.shorts.some((e) => !e.mesh.parent)) self.shorts = self.shorts.filter((e) => e.mesh.parent);
  const dd = (globalThis as { __cssSwayDt?: number }).__cssSwayDt;
  for (const e of self.shorts)
    for (const L of e.legs) {
      if (dt <= 0) {
        L.off.set(0, 0, 0);
        L.vel.set(0, 0, 0);
        L.prev = null;
        L.u.value.set(0, 0, 0, 0);
        continue;
      }
      if (dt > 0.2) L.prev = null;
      const d = dd ?? Math.min(dt, 1 / 20);
      const bone = e.mesh.skeleton.bones[L.bone];
      tmpM.multiplyMatrices(bone.matrixWorld, e.mesh.skeleton.boneInverses[L.bone]).multiply(e.mesh.bindMatrix);
      const p = L.point.clone().applyMatrix4(tmpM);
      const v = L.prev ? p.clone().sub(L.prev).divideScalar(d) : new Vector3();
      L.prev = p;
      const target = v.multiplyScalar(-0.05).clampLength(0, SHORT_GAIN);
      const c = 2 * Math.sqrt(SHORT_STIFF) * 0.5;
      for (let k = 0; k < 2; k++) {
        const h = d / 2;
        const acc = target.clone().sub(L.off).multiplyScalar(SHORT_STIFF).addScaledVector(L.vel, -c);
        L.vel.addScaledVector(acc, h);
        L.off.addScaledVector(L.vel, h);
      }
      L.off.clampLength(0, SHORT_GAIN * 1.3);
      tmpN.setFromMatrix4(tmpM).invert();
      const o = L.off.clone().applyMatrix3(tmpN);
      L.u.value.set(o.x, o.y, o.z, 1);
    }
};
declare module './sway' {
  interface Sway {
    updateShorts(dt: number): void;
  }
}

function applyShortSway(m: Material, u: { cssSwayL: { value: Vector4 }; cssSwayR: { value: Vector4 } }) {
  const prev = m.onBeforeCompile;
  const prevKey = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, r) => {
    prev.call(m, shader, r);
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec4 cssSwayL;\nuniform vec4 cssSwayR;\nattribute float cssSwayW;\nattribute float cssSwaySide;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += mix(cssSwayL.xyz, cssSwayR.xyz, cssSwaySide) * cssSwayW;');
  };
  m.customProgramCacheKey = () => `${prevKey()}|css-sway-short`;
}

function applySway(m: Material, u: { cssSway: { value: Vector4 } }) {
  const prev = m.onBeforeCompile;
  const prevKey = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, r) => {
    prev.call(m, shader, r);
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec4 cssSway;\nattribute float cssSwayW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += cssSway.xyz * cssSwayW;');
  };
  m.customProgramCacheKey = () => `${prevKey()}|css-sway`;
}
