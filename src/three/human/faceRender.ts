import { Vector3, Vector4, type Camera, type Material, type Object3D, type Quaternion } from 'three';

/**
 * 1.44 Human Behavior & Facial Expression Engine — the rendering of a living face (Youssef 14/11 15:01: « léger et
 * naturel », points 1, 2, 4 and 5 of the proposal of 13/11 21:07; 13/11 22:36: « humaniser ne veut pas dire rajouter
 * des traits visibles »). Nothing is drawn on the skin: only soft changes of light, gloss and tint, with wide smooth
 * masks (no line, no edge), the same for every coach:
 * - eyes: the upper lid shades the top of the eyeball a little (an eye sits in the face instead of on it); the rim of
 *   the lower lid is a touch glossier (the tear film), seen only as the light catches it;
 * - skin: light passes through the thin parts (ears, nostrils, lips): a warm glow at the edge of the shadow and when
 *   the light comes from behind;
 * - effort: over the session the cheeks, ears and nose flush slightly, then the forehead and nose take a light sheen
 *   of sweat; both fade during recovery.
 * The masks are placed on the head texture of the Rocketbox heads (m021 and f021 share their layout: eyes, nose,
 * lips, cheeks and ears at the same place), so they follow the skin as it moves. Only the head's skin material.
 */
export const FACE_RENDER = {
  /** light through the thin parts (0..1) */
  thin: 1,
  /** gloss of the lower lid rims (0..1) */
  wet: 1,
  /** shade of the upper lid on the eyeball (darkening at its strongest) */
  lidShade: 0.28,
  /** most redness of the flush (share of the tint) and most gloss of the sweat (roughness taken off) */
  flush: 0.5,
  sheen: 0.14,
} as const;

/** the uniforms shared by the head skin and the eyes of one coach */
export interface FaceRenderUniforms {
  /** x flush 0..1, y sheen 0..1, z light through 0..1, w wet rims 0..1 */
  cssFace: { value: Vector4 };
  /** direction of the head's up in view space, and the strength of the lid's shade */
  cssEyeUp: { value: Vector3 };
  cssLidShade: { value: number };
}

export const newFaceRenderUniforms = (): FaceRenderUniforms => ({
  cssFace: { value: new Vector4(0, 0, FACE_RENDER.thin, FACE_RENDER.wet) },
  cssEyeUp: { value: new Vector3(0, 1, 0) },
  cssLidShade: { value: FACE_RENDER.lidShade },
});

/**
 * how hard the session has been (0 fresh .. 1 long effort): it rises with the strikes (about 3 minutes of a round at
 * a steady pace to reach its top) and falls at rest (about 2 minutes). Flush first, then sweat.
 */
export class Exertion {
  level = 0;
  update(dt: number, effort: number) {
    const e = Math.max(0, Math.min(1, effort));
    this.level = Math.max(0, Math.min(1, this.level + dt * (0.025 * e - 0.008 * (1 - e))));
  }
  get flush() {
    const x = Math.min(1, this.level / 0.6);
    return x * x * (3 - 2 * x);
  }
  get sheen() {
    const x = Math.max(0, Math.min(1, (this.level - 0.4) / 0.6));
    return x * x * (3 - 2 * x);
  }
}

/** the face's rendering state of this frame into the uniforms. off: the face as before 1.44 (Lab rendu=avant) */
export function updateFaceRender(u: FaceRenderUniforms, ex: Exertion, headQ: Quaternion, upInHead: Vector3, camera: Camera, off = false) {
  u.cssFace.value.set(off ? 0 : FACE_RENDER.flush * ex.flush, off ? 0 : ex.sheen, off ? 0 : FACE_RENDER.thin, off ? 0 : FACE_RENDER.wet);
  u.cssEyeUp.value.copy(upInHead).applyQuaternion(headQ).transformDirection(camera.matrixWorldInverse);
  u.cssLidShade.value = off ? 0 : FACE_RENDER.lidShade;
}

/** the head's skin material (its name ends with _head in the Rocketbox models) */
export const isHeadSkin = (m: Pick<Material, 'name'>) => /_head$/i.test(m.name ?? '');

/** gives the uniforms to the head's skin and the eyes of a coach (set by their shaders at compile time) */
export function shareFaceRender(root: Object3D, u: FaceRenderUniforms) {
  root.traverse((o) => {
    const mat = (o as { material?: Material }).material;
    if (mat && (mat.userData.cssFaceSkin || mat.userData.cssCatchlight)) mat.userData.cssFaceRender = u;
  });
}
