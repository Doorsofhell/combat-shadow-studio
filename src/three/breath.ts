import { Matrix4, SkinnedMesh, Vector3, Vector4, type Material, type WebGLProgramParametersWithUniforms } from 'three';

/**
 * 1.10 breathing (Youssef 2026-11-03: « ajoutez une respiration discrète du thorax et de l'abdomen, coordonnée avec
 * les vêtements » ; « les mouvements secondaires doivent rester stables lors des pauses, ralentis, changements de
 * technique et reprises »).
 *
 * The rib cage and the belly swell a few millimetres along the skin's normal, in the vertex shader, around two
 * centres read from the coach's own skeleton (chest: between Spine1 and Spine2; belly: Spine). The garments of the
 * outfit get the same displacement from the same centres (their bind space is the body's), so a bra or a gi moves
 * with the chest and the skin never comes through. No bone moves: the animation, the rig and the joint limits are
 * untouched.
 *
 * Rhythm: about 14 breaths a minute at rest, up to 30 when the coach works (effort of the face, which follows the
 * speed of the strikes); a sharp exhale at each strike's peak, as fighters breathe out on impact. Driven by the real
 * time between images, clamped: a pause, a slow motion or a change of technique never makes it jump.
 */
export interface BreathUniforms {
  /** x: chest amount (-1 exhaled .. 1 inhaled), y: belly amount; shared by every mesh of the coach */
  cssBreath: { value: Vector4 };
  /** centre (mesh space) and radius */
  cssBreathChest: { value: Vector4 };
  cssBreathBelly: { value: Vector4 };
  /** x: chest amplitude, y: belly amplitude, in the mesh's own units */
  cssBreathAmp: { value: Vector4 };
}

export class Breath {
  /** the amounts, shared by the body and every garment */
  readonly amount = { value: new Vector4(0, 0, 0, 0) };
  private phase = Math.random() * Math.PI * 2;
  private rate = 0.23;
  private exhale = 0;
  private lastEffort = 0;

  /**
   * uniforms for one skinned mesh (the body or a garment): centres and amplitudes read from its own bind pose, as
   * the garment files may use other units or another bind space than the body. null without a spine.
   */
  uniformsFor(mesh: SkinnedMesh): BreathUniforms | null {
    const at = (name: string) => {
      const i = mesh.skeleton.bones.findIndex((b) => b.name === name);
      if (i < 0) return null;
      return new Vector3().setFromMatrixPosition(new Matrix4().copy(mesh.skeleton.boneInverses[i]).invert()).applyMatrix4(mesh.bindMatrixInverse);
    };
    const s1 = at('Spine1');
    const s2 = at('Spine2');
    const s0 = at('Spine');
    const nk = at('Neck');
    if (!s1 || !s2 || !s0 || !nk) return null;
    const s = nk.distanceTo(s2);
    const chest = s1.clone().lerp(s2, 0.6);
    return {
      cssBreath: this.amount,
      cssBreathChest: { value: new Vector4(chest.x, chest.y, chest.z, 0.95 * s) },
      cssBreathBelly: { value: new Vector4(s0.x, s0.y, s0.z, 0.75 * s) },
      // about 4 mm at the chest and 3 mm at the belly for a 15 cm Spine2-Neck span
      cssBreathAmp: { value: new Vector4(0.027 * s, 0.02 * s, 0, 0) },
    };
  }

  update(dt: number, effort: number) {
    const d = Math.min(Math.max(dt, 0), 0.05);
    // faster with sustained work, slowly back to rest
    const target = 0.23 + 0.27 * Math.min(1, effort);
    this.rate += (target - this.rate) * Math.min(1, d / (target > this.rate ? 1.5 : 6));
    this.phase = (this.phase + d * this.rate * Math.PI * 2) % (Math.PI * 2);
    // a strike's peak: a short, sharp exhale (rises when the effort jumps)
    if (effort > 0.6 && this.lastEffort <= 0.6) this.exhale = 1;
    this.lastEffort = effort;
    this.exhale = Math.max(0, this.exhale - d / 0.35);
    const sinP = Math.sin(this.phase);
    const v = this.amount.value;
    // the chest leads, the belly follows a quarter of a breath later; the exhale empties both
    v.x = sinP * (1 - this.exhale) - this.exhale;
    v.y = Math.sin(this.phase - 0.9) * (1 - this.exhale) - 0.6 * this.exhale;
  }
}

const VERT_HEAD = /* glsl */ `
uniform vec4 cssBreath;
uniform vec4 cssBreathChest;
uniform vec4 cssBreathBelly;
uniform vec4 cssBreathAmp;
`;
// the point moves along its own normal before skinning (bind space, like the point itself). Not objectNormal: in a
// skinned mesh three.js has already posed it at begin_vertex, and the pose then applied to the point a second time
// threw the cloth of a twisting torso centimetres away (seen on Amara's bra in the jab, 1.10)
const VERT_BODY = /* glsl */ `
{
  vec3 cssDc = (position - cssBreathChest.xyz) / cssBreathChest.w;
  vec3 cssDb = (position - cssBreathBelly.xyz) / cssBreathBelly.w;
  float cssWc = exp(-dot(cssDc, cssDc) * 1.6);
  float cssWb = exp(-dot(cssDb, cssDb) * 2.0);
  transformed += normalize(normal) * (cssBreathAmp.x * cssWc * cssBreath.x + cssBreathAmp.y * cssWb * cssBreath.y);
}
`;

/** adds the breathing to a material of the coach or of its outfit (keeps its own shader changes) */
export function applyBreath(m: Material, u: BreathUniforms | null) {
  if (!u) return;
  const prev = m.onBeforeCompile;
  const prevKey = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, r) => {
    prev.call(m, shader, r);
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${VERT_HEAD}`).replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`);
  };
  m.customProgramCacheKey = () => `${prevKey()}|css-breath`;
}
