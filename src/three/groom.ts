import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Material,
  Mesh,
  MeshLambertMaterial,
  SkinnedMesh,
  Skeleton,
  Texture,
  Vector3,
} from 'three';

/**
 * Realistic hair (v0.29): hair cards instead of hair painted on the skin.
 *
 * Every card is a narrow strip textured with real strands (public/groom/hair_atlas.png, drawn by
 * tools/generator/groom/atlas.py). Cards are rooted on the skin where the painted masks say hair grows,
 * follow a growth direction (crown whorl on the scalp, downward on the beard, outward on the brows) and
 * bend along the head so they never stand out as spikes. The shader cuts the strands out of the card with
 * an anti-aliased alpha test (alpha to coverage when the canvas has MSAA) and lights them as hair: two
 * highlights along the strand (Kajiya-Kay), darker roots, a colour that varies from strand to strand.
 */

export interface AtlasRects {
  size: number;
  rects: Record<'scalp' | 'short' | 'beard' | 'brow' | 'lash', [number, number, number, number][]>;
}

/** what the cards are rooted on: the body in its bind pose and readers of the painted masks */
export interface GroomSource {
  body: SkinnedMesh;
  /** hair cover of the scalp, 0..1, by skin uv */
  scalp: (u: number, v: number) => number;
  /** beard area, 0..1, by skin uv */
  beard: ((u: number, v: number) => number) | null;
  /** eyebrows, 0..1, by skin uv (face paint) */
  brow: ((u: number, v: number) => number) | null;
  headLow: Vector3;
  headTop: Vector3;
  eyeL: Vector3;
  eyeR: Vector3;
  lipsY: number;
  faceZ: number;
}

export interface GroomStyle {
  /** cards on the scalp (0 = no hair) */
  scalpCards: number;
  /** hair length on top, sides and back (metres) */
  top: number;
  sides: number;
  back: number;
  /** thickness of the hair volume above the scalp (metres) */
  volume: number;
  /** comb: 0 back from the forehead, 1 forward from the crown */
  forward: number;
  beardCards: number;
  beardLength: number;
  browCards: number;
  seed: number;
}

export const GROOM_STYLES: Record<string, GroomStyle> = {
  // short textured cut, full short beard (Kadir)
  'court-barbe': { scalpCards: 7000, top: 0.028, sides: 0.014, back: 0.016, volume: 0.007, forward: 0.2, beardCards: 14000, beardLength: 0.0065, browCards: 700, seed: 11 },
  // fade: very short sides, longer top swept back (Amara)
  degrade: { scalpCards: 4200, top: 0.07, sides: 0.012, back: 0.028, volume: 0.014, forward: 0.1, beardCards: 0, beardLength: 0, browCards: 600, seed: 23 },
};

type Rect = [number, number, number, number];

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** area-weighted random points on the triangles of the body that pass `keep` (a region test on the centroid) */
function sampler(geo: BufferGeometry, keep: (c: Vector3) => boolean) {
  const P = geo.getAttribute('position');
  const idx = geo.getIndex();
  const tri = (i: number, k: number) => (idx ? idx.getX(i * 3 + k) : i * 3 + k);
  const n = (idx ? idx.count : P.count) / 3;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const ids: number[] = [];
  const cdf: number[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    a.fromBufferAttribute(P, tri(i, 0));
    b.fromBufferAttribute(P, tri(i, 1));
    c.fromBufferAttribute(P, tri(i, 2));
    const centre = a.clone().add(b).add(c).multiplyScalar(1 / 3);
    if (!keep(centre)) continue;
    const area = b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
    total += area;
    ids.push(i);
    cdf.push(total);
  }
  return { ids, cdf, total, tri };
}

interface Root {
  p: Vector3;
  n: Vector3;
  uv: [number, number];
}

function samplePoints(src: GroomSource, keep: (c: Vector3) => boolean, count: number, density: (r: Root) => number, rnd: () => number): Root[] {
  const geo = src.body.geometry;
  const P = geo.getAttribute('position');
  const N = geo.getAttribute('normal');
  const UV = geo.getAttribute('uv');
  const s = sampler(geo, keep);
  const out: Root[] = [];
  if (!s.ids.length) return out;
  const pa = new Vector3();
  const pb = new Vector3();
  const pc = new Vector3();
  let tries = 0;
  while (out.length < count && tries < count * 12) {
    tries++;
    const x = rnd() * s.total;
    let lo = 0;
    let hi = s.cdf.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (s.cdf[m] < x) lo = m + 1;
      else hi = m;
    }
    const t = s.ids[lo];
    let r1 = rnd();
    let r2 = rnd();
    if (r1 + r2 > 1) {
      r1 = 1 - r1;
      r2 = 1 - r2;
    }
    const w = [1 - r1 - r2, r1, r2];
    const vi = [s.tri(t, 0), s.tri(t, 1), s.tri(t, 2)];
    pa.set(0, 0, 0);
    pb.set(0, 0, 0);
    let u = 0;
    let v = 0;
    for (let k = 0; k < 3; k++) {
      pa.addScaledVector(pc.fromBufferAttribute(P, vi[k]), w[k]);
      pb.addScaledVector(pc.fromBufferAttribute(N, vi[k]), w[k]);
      u += UV.getX(vi[k]) * w[k];
      v += UV.getY(vi[k]) * w[k];
    }
    const root = { p: pa.clone(), n: pb.clone().normalize(), uv: [u, v] as [number, number] };
    if (rnd() > density(root)) continue;
    out.push(root);
  }
  return out;
}

/** growing geometry: interleaved arrays of every card */
class Cards {
  pos: number[] = [];
  nrm: number[] = [];
  tan: number[] = [];
  uv: number[] = [];
  /** x: 0 root .. 1 tip, y: layer (0 inner .. 1 outer) */
  info: number[] = [];
  index: number[] = [];

  /**
   * one card along a centre line: `line` points from the root to the tip, `side` the width direction at
   * every point, `nrm` the shading normal
   */
  add(line: Vector3[], side: Vector3[], nrm: Vector3[], width: number[], rect: Rect, layer: number, flip: boolean) {
    const base = this.pos.length / 3;
    const S = line.length - 1;
    for (let i = 0; i <= S; i++) {
      const t = i / S;
      const tg = (i < S ? line[i + 1].clone().sub(line[i]) : line[i].clone().sub(line[i - 1])).normalize();
      for (const e of [-0.5, 0.5]) {
        const p = line[i].clone().addScaledVector(side[i], e * width[i]);
        this.pos.push(p.x, p.y, p.z);
        this.nrm.push(nrm[i].x, nrm[i].y, nrm[i].z);
        this.tan.push(tg.x, tg.y, tg.z);
        const uu = rect[0] + rect[2] * (flip ? 0.5 - e : e + 0.5);
        this.uv.push(uu, rect[1] + rect[3] * t);
        this.info.push(t, layer);
      }
    }
    for (let i = 0; i < S; i++) {
      const a = base + i * 2;
      this.index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  geometry() {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(this.pos), 3));
    g.setAttribute('normal', new BufferAttribute(new Float32Array(this.nrm), 3));
    g.setAttribute('aHairT', new BufferAttribute(new Float32Array(this.tan), 3));
    g.setAttribute('uv', new BufferAttribute(new Float32Array(this.uv), 2));
    g.setAttribute('aHairInfo', new BufferAttribute(new Float32Array(this.info), 2));
    g.setIndex(this.index);
    g.computeBoundingSphere();
    return g;
  }
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** scalp cards: follow the skull (arc around the head centre) at a height that rises with the layer */
export function scalpCards(src: GroomSource, st: GroomStyle, atlas: AtlasRects): BufferGeometry | null {
  if (!st.scalpCards) return null;
  const rnd = rng(st.seed);
  const top = src.headTop;
  const low = src.headLow;
  const c = low.clone().lerp(top, 0.42);
  c.z -= 0.012;
  const headH = top.y - low.y;
  const roots = samplePoints(
    src,
    (p) => p.y > low.y - 0.02 && p.distanceTo(c) < headH * 0.95,
    st.scalpCards,
    (r) => {
      const m = src.scalp(r.uv[0], r.uv[1]);
      return smooth(0.08, 0.6, m);
    },
    rnd,
  );
  // whorl at the back of the crown: hair grows away from it
  const crown = c.clone().add(new Vector3(0.012, headH * 0.55, -headH * 0.32));
  const back = c.clone().add(new Vector3(0, -headH * 0.15, -headH * 1.6));
  const cards = new Cards();
  const tmp = new Vector3();
  for (const r of roots) {
    const h = r.p.clone().sub(c);
    const fr = smooth(-0.02, 0.06, h.z); // front of the head
    const sideW = smooth(0.045, 0.075, Math.abs(h.x));
    const backW = smooth(0.0, 0.06, -h.z) * smooth(0.03, -0.03, h.y);
    const topW = smooth(0.0, 0.06, h.y);
    let L = st.top * topW + st.sides * sideW * (1 - topW) + st.back * backW * (1 - topW);
    L = Math.max(L, Math.min(st.sides, st.back));
    // at the hairline (mask fading) the hair is shorter and finer
    const edge = smooth(0.15, 0.85, src.scalp(r.uv[0], r.uv[1]));
    L *= (0.7 + 0.6 * rnd()) * (0.35 + 0.65 * edge);
    // growth direction: away from the crown, combed forward on top by `forward`, down on the sides
    // growth: away from the crown whorl (natural flow), then combed: back over the top and down the
    // sides when `forward` is low, forward from the crown when it is high
    const away = r.p.clone().sub(crown);
    away.addScaledVector(r.n, -away.dot(r.n)).normalize();
    // combed back: towards a point behind the head (up the forehead, back over the top, back and
    // down on the sides)
    const comb = back.clone().sub(r.p);
    comb.addScaledVector(r.n, -comb.dot(r.n)).normalize();
    const k = (1 - st.forward) * (0.35 + 0.65 * Math.max(topW, fr));
    const dir = away.multiplyScalar(1 - k).addScaledVector(comb, k);
    dir.addScaledVector(new Vector3(0, -1, 0), 0.25 * (1 - topW));
    dir.addScaledVector(r.n, -dir.dot(r.n)).normalize();
    // a little disorder
    tmp.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.5);
    dir.add(tmp.addScaledVector(r.n, -tmp.dot(r.n))).normalize();
    const layer = rnd();
    const lift = 0.0012 + st.volume * (0.15 + 0.85 * layer) * (0.4 + 0.6 * topW);
    const width = (0.005 + 0.004 * rnd() + L * 0.12) * (0.6 + 0.4 * edge);
    const rect = (L > 0.03 ? atlas.rects.scalp : atlas.rects.short)[Math.floor(rnd() * 8)];
    // centre line: arc around the head centre, starting on the skin and rising to its layer height
    const S = 5;
    const u0 = r.p.clone().sub(c);
    const R0 = u0.length();
    u0.normalize();
    const ax = u0.clone().cross(dir).normalize();
    const line: Vector3[] = [];
    const sides: Vector3[] = [];
    const nrms: Vector3[] = [];
    const ws: number[] = [];
    for (let i = 0; i <= S; i++) {
      const t = i / S;
      const ang = (L * t) / R0;
      const radial = u0.clone().applyAxisAngle(ax, ang);
      // rise from the root to the layer height, a slight droop at the tip
      const hgt = lift * Math.min(1, t * 3) * (1 - 0.45 * t * t * Math.min(1, L / 0.04)) + 0.0006;
      line.push(c.clone().addScaledVector(radial, R0 + hgt));
      const tg = radial.clone().cross(ax).negate().normalize();
      sides.push(radial.clone().cross(tg).normalize());
      // shading normal: the head's own sphere, so the cards light as one mass of hair
      nrms.push(radial.clone());
      ws.push(width * (1 - 0.35 * t));
    }
    cards.add(line, sides, nrms, ws, rect, layer, rnd() < 0.5);
  }
  return cards.geometry();
}

/**
 * where the beard grows, 0..1, from the rest position: below a cheek line running from the sideburn to
 * the corner of the mouth, above a neck line under the jaw, in front of the ears. The skin shader draws
 * the shaving shadow with the same shape (GROOM_BEARD_GLSL).
 */
export function beardShape(p: Vector3, g: { eyeY: number; lipsY: number; earZ: number }) {
  const ax = Math.abs(p.x);
  const cheekTop = g.lipsY + 0.026 + (g.eyeY - 0.032 - (g.lipsY + 0.026)) * smooth(0.018, 0.062, ax);
  const chinY = g.lipsY - 0.05;
  const neckY = chinY - 0.004 + (g.lipsY - 0.002 - (chinY - 0.004)) * smooth(0.02, 0.07, ax);
  return smooth(cheekTop + 0.005, cheekTop - 0.007, p.y) * smooth(neckY - 0.012, neckY + 0.006, p.y) * smooth(g.earZ - 0.004, g.earZ + 0.01, p.z);
}

export const GROOM_BEARD_GLSL = /* glsl */ `
uniform vec3 uGroomFace; // eye height, lips height, front of the ears (z)
float cssSmooth(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float groomBeard(vec3 p) {
  float ax = abs(p.x);
  float cheekTop = uGroomFace.y + 0.026 + (uGroomFace.x - 0.032 - (uGroomFace.y + 0.026)) * cssSmooth(0.018, 0.062, ax);
  float chinY = uGroomFace.y - 0.05;
  float neckY = chinY - 0.004 + (uGroomFace.y - 0.002 - (chinY - 0.004)) * cssSmooth(0.02, 0.07, ax);
  return cssSmooth(cheekTop + 0.005, cheekTop - 0.007, p.y) * cssSmooth(neckY - 0.012, neckY + 0.006, p.y) * cssSmooth(uGroomFace.z - 0.004, uGroomFace.z + 0.01, p.z);
}
`;

/** beard cards: short curled hair growing down the jaw, outward on the moustache */
export const groomFace = (src: { eyeL: Vector3; lipsY: number }) => ({ eyeY: src.eyeL.y, lipsY: src.lipsY, earZ: src.eyeL.z - 0.082 });

export function beardCards(src: GroomSource, st: GroomStyle, atlas: AtlasRects): BufferGeometry | null {
  if (!st.beardCards) return null;
  const rnd = rng(st.seed + 7);
  const face = groomFace(src);
  const roots = samplePoints(
    src,
    (p) => p.y < src.eyeL.y - 0.02 && p.y > src.lipsY - 0.1 && p.z > src.eyeL.z - 0.12,
    st.beardCards,
    // the beard's own shape, irregular at its edges (the random test thins it out where it fades)
    (r) => beardShape(r.p, face) ** 1.5,
    rnd,
  );
  const cards = new Cards();
  const mouth = new Vector3(0, src.lipsY, src.faceZ);
  for (const r of roots) {
    const aboveLip = r.p.y > src.lipsY + 0.004 && Math.abs(r.p.x) < 0.03;
    const dir = new Vector3(0, -1, 0);
    if (aboveLip) dir.set(Math.sign(r.p.x || 1) * 0.6, -1, 0.15);
    else dir.addScaledVector(new Vector3(Math.sign(r.p.x || 1), 0, 0), 0.15).addScaledVector(r.n, 0.25);
    dir.addScaledVector(r.n, -dir.dot(r.n)).normalize();
    const L = st.beardLength * (aboveLip ? 0.8 : 1) * (0.55 + 0.9 * rnd());
    const layer = rnd();
    const lift = 0.0005 + 0.0016 * layer;
    const width = 0.0018 + 0.0014 * rnd();
    // fine straight-ish hair (the curly beard cards read as tufts at this size), a few curly ones
    const rect = rnd() < 0.85 ? atlas.rects.short[Math.floor(rnd() * atlas.rects.short.length)] : atlas.rects.beard[Math.floor(rnd() * atlas.rects.beard.length)];
    const S = 2;
    const side = r.n.clone().cross(dir).normalize();
    const line: Vector3[] = [];
    const sides: Vector3[] = [];
    const nrms: Vector3[] = [];
    const ws: number[] = [];
    // keep the lips clear
    if (r.p.distanceTo(mouth) < 0.018 && Math.abs(r.p.y - src.lipsY) < 0.012) continue;
    for (let i = 0; i <= S; i++) {
      const t = i / S;
      line.push(r.p.clone().addScaledVector(dir, L * t).addScaledVector(r.n, lift * Math.min(1, t * 2.5) + 0.0003));
      sides.push(side);
      nrms.push(r.n);
      ws.push(width * (1 - 0.3 * t));
    }
    cards.add(line, sides, nrms, ws, rect, layer, rnd() < 0.5);
  }
  return cards.geometry();
}

/** eyebrow cards: fine hairs, upward near the nose, outward towards the temple */
export function browCards(src: GroomSource, st: GroomStyle, atlas: AtlasRects): BufferGeometry | null {
  if (!st.browCards || !src.brow) return null;
  const rnd = rng(st.seed + 13);
  const brow = src.brow;
  const cards = new Cards();
  const roots = samplePoints(
    src,
    (p) => p.y > src.eyeL.y && p.y < src.eyeL.y + 0.035 && p.z > src.eyeL.z - 0.02,
    st.browCards,
    (r) => smooth(0.25, 0.75, brow(r.uv[0], r.uv[1])),
    rnd,
  );
  for (const r of roots) {
    const sx = Math.sign(r.p.x || 1);
    const eye = sx > 0 ? src.eyeL : src.eyeR;
    // 0 at the inner end, 1 at the outer end
    const k = smooth(-0.02, 0.025, (r.p.x - eye.x) * sx);
    const dir = new Vector3(sx * (0.35 + 0.65 * k), 1 - 1.15 * k, 0);
    dir.addScaledVector(r.n, -dir.dot(r.n)).normalize();
    const L = 0.0045 + 0.003 * rnd();
    const side = r.n.clone().cross(dir).normalize();
    const rect = atlas.rects.short[Math.floor(rnd() * atlas.rects.short.length)];
    const line: Vector3[] = [];
    const sides: Vector3[] = [];
    const nrms: Vector3[] = [];
    const ws: number[] = [];
    for (let i = 0; i <= 2; i++) {
      const t = i / 2;
      line.push(r.p.clone().addScaledVector(dir, L * t).addScaledVector(r.n, 0.0003 + 0.0004 * t));
      sides.push(side);
      nrms.push(r.n);
      ws.push(0.0016 * (1 - 0.3 * t));
    }
    cards.add(line, sides, nrms, ws, rect, rnd(), rnd() < 0.5);
  }
  return cards.geometry();
}

/** hair material: strands cut out of the card, lit along their direction */
export function hairMaterial(name: string, atlas: Texture, color: Color, rootShade = 0.45, coverage = 1) {
  // Lambert: no Fresnel reflection (a standard material turned dark hair grey at grazing angles); the
  // hair's own highlights are added below
  const m = new MeshLambertMaterial({ name, color, side: DoubleSide });
  m.alphaToCoverage = true;
  const uniforms = { uAtlas: { value: atlas }, uRootShade: { value: rootShade }, uCoverage: { value: coverage }, uHairSpec: { value: Number(new URLSearchParams(globalThis.location?.search ?? '').get('hairspec') ?? 0.06) } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aHairT;\nattribute vec2 aHairInfo;\nvarying vec3 vHairT;\nvarying vec2 vHairInfo;\nvarying vec2 vHairUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvHairUv = uv;\nvHairInfo = aHairInfo;\nvHairT = normalize(normalMatrix * aHairT);');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform sampler2D uAtlas;
uniform float uRootShade;
uniform float uHairSpec;
uniform float uCoverage;
varying vec3 vHairT;
varying vec2 vHairInfo;
varying vec2 vHairUv;
float cssHairSpec(vec3 T, vec3 V, vec3 L, float shift, float e) {
  vec3 H = normalize(L + V);
  float th = dot(T, H) + shift;
  return pow(max(0.0, sqrt(max(0.0, 1.0 - th * th))), e);
}`,
      )
      .replace(
        '#include <map_fragment>',
        `vec4 hairTex = texture2D(uAtlas, vHairUv);
// anti-aliased alpha test; the coverage of thin strands shrinks in the mip levels: scale it back up
vec2 hdx = dFdx(vHairUv * 2048.0);
vec2 hdy = dFdy(vHairUv * 2048.0);
float hmip = max(0.0, 0.5 * log2(max(dot(hdx, hdx), dot(hdy, hdy))));
float hcov = hairTex.a * (1.0 + 0.3 * hmip) * uCoverage;
float halpha = (hcov - 0.45) / max(fwidth(hcov), 1e-4) + 0.5;
#ifdef ALPHA_TO_COVERAGE
diffuseColor.a = clamp(halpha, 0.0, 1.0);
if (diffuseColor.a < 0.02) discard;
#else
if (halpha < 0.5) discard;
diffuseColor.a = 1.0;
#endif
// darker inner strands and roots, colour varying from strand to strand
float hdepth = mix(hairTex.b, vHairInfo.y, 0.6);
float hshade = mix(uRootShade, 1.0, smoothstep(0.0, 0.7, max(hairTex.r, vHairInfo.x * 0.8))) * mix(0.62, 1.0, hdepth);
diffuseColor.rgb *= hshade * (0.82 + 0.36 * hairTex.g);`,
      )
      .replace(
        '#include <opaque_fragment>',
        `{
  vec3 T = normalize(vHairT);
  vec3 V = normalize(vViewPosition);
  vec3 hs = vec3(0.0);
  #if NUM_DIR_LIGHTS > 0
  for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
    vec3 L = directionalLights[i].direction;
    float wrap = clamp(dot(normal, L) * 0.5 + 0.5, 0.0, 1.0);
    // primary: white, shifted to the tip; secondary: tinted by the hair colour, towards the root
    hs += directionalLights[i].color * wrap * (uHairSpec * (0.5 * cssHairSpec(T, V, L, 0.08, 220.0) * mix(vec3(1.0), diffuseColor.rgb * 8.0, 0.5) + 2.0 * diffuseColor.rgb * cssHairSpec(T, V, L, -0.1, 24.0)));
  }
  #endif
  outgoingLight += hs * mix(0.5, 1.0, hdepth);
}
#include <opaque_fragment>`,
      );
  };
  m.customProgramCacheKey = () => 'css-hair-cards';
  return m;
}

/** a groom mesh built in the body's bind space, carried by the head bone */
export function attachToHead(body: SkinnedMesh, geo: BufferGeometry, mat: Material) {
  const i = body.skeleton.bones.findIndex((b) => b.name.replace(/^mixamorig[:]?/i, '') === 'Head');
  if (i < 0) return null;
  const bone = body.skeleton.bones[i];
  const mesh = new Mesh(geo, mat);
  mesh.name = `css-groom-${mat.name}`;
  mesh.matrixAutoUpdate = false;
  mesh.matrix.copy(body.skeleton.boneInverses[i]).multiply(body.bindMatrix);
  mesh.frustumCulled = false;
  bone.add(mesh);
  return mesh;
}

/** what the body hair needs from the body map (customize.ts) */
export interface BodyHairSource {
  pos: Float32Array;
  nrm: Float32Array;
  chain: string[];
  armT: Float32Array;
  legT: Float32Array;
  bone: Record<string, Vector3>;
}

/**
 * Body hair: sparse fine hairs lying along the limb (forearms towards the wrist, shins towards the foot)
 * and down the centre of the chest where the masks paint it. Skinned like the body (each card takes the
 * skin weights of the vertex it grows from), so it follows every movement. `amount` 0..1.
 */
export function bodyHairCards(body: SkinnedMesh, b: BodyHairSource, chest: ((u: number, v: number) => number) | null, amount: number, atlas: AtlasRects, seed = 5) {
  if (amount <= 0) return null;
  const rnd = rng(seed);
  const geo = body.geometry;
  const UV = geo.getAttribute('uv');
  const SI = geo.getAttribute('skinIndex');
  const SW = geo.getAttribute('skinWeight');
  const cards = new Cards();
  const skinI: number[] = [];
  const skinW: number[] = [];
  const p = new Vector3();
  const n = new Vector3();
  const count = b.pos.length / 3;
  for (let i = 0; i < count; i++) {
    const ch = b.chain[i];
    p.set(b.pos[i * 3], b.pos[i * 3 + 1], b.pos[i * 3 + 2]);
    n.set(b.nrm[i * 3], b.nrm[i * 3 + 1], b.nrm[i * 3 + 2]);
    const L = p.x >= 0 ? 'Left' : 'Right';
    let dens = 0;
    let dir: Vector3 | null = null;
    if (ch === 'armL' || ch === 'armR') {
      const t = b.armT[i];
      // forearm, more on the outer (back of the arm) side
      dens = smooth(0.5, 0.62, t) * smooth(0.98, 0.9, t) * 0.9;
      dir = b.bone[`${L}Hand`].clone().sub(b.bone[`${L}ForeArm`]);
    } else if (ch === 'legL' || ch === 'legR') {
      const t = b.legT[i];
      dens = smooth(0.55, 0.65, t) * smooth(0.93, 0.85, t) * smooth(-0.6, 0.2, n.z) * 0.8;
      dir = b.bone[`${L}Foot`].clone().sub(b.bone[`${L}Leg`]);
    } else if (ch === 'torso' && chest) {
      dens = chest(UV.getX(i), UV.getY(i));
      dir = new Vector3(0, -1, 0);
    }
    if (!dir || dens <= 0.01) continue;
    dir.addScaledVector(n, -dir.dot(n)).normalize();
    const side0 = n.clone().cross(dir).normalize();
    // a few fine hairs around each vertex (the vertices are about a centimetre apart)
    for (let h = 0; h < 4; h++) {
      if (rnd() > dens * amount * 0.8) continue;
      const q = p.clone().addScaledVector(dir, (rnd() - 0.5) * 0.01).addScaledVector(side0, (rnd() - 0.5) * 0.01);
      const d = dir.clone();
      const tw = new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.7);
      d.add(tw.addScaledVector(n, -tw.dot(n))).normalize();
      const side = n.clone().cross(d).normalize();
      const len = 0.007 + 0.007 * rnd();
      const rect = atlas.rects.short[Math.floor(rnd() * atlas.rects.short.length)];
      const line = [q.clone().addScaledVector(n, 0.0004), q.clone().addScaledVector(d, len * 0.5).addScaledVector(n, 0.0007), q.clone().addScaledVector(d, len).addScaledVector(n, 0.0008)];
      cards.add(line, [side, side, side], [n.clone(), n.clone(), n.clone()], [0.0012, 0.0011, 0.0009], rect, rnd(), rnd() < 0.5);
      for (let k = 0; k < 6; k++) {
        skinI.push(SI.getX(i), SI.getY(i), SI.getZ(i), SI.getW(i));
        skinW.push(SW.getX(i), SW.getY(i), SW.getZ(i), SW.getW(i));
      }
    }
  }
  if (!skinI.length) return null;
  const g = cards.geometry();
  g.setAttribute('skinIndex', new BufferAttribute(new Uint16Array(skinI), 4));
  g.setAttribute('skinWeight', new BufferAttribute(new Float32Array(skinW), 4));
  return g;
}

/** a skinned groom mesh (body hair) on the body's own skeleton */
export function skinnedGroom(body: SkinnedMesh, geo: BufferGeometry, mat: Material, skeleton: Skeleton = body.skeleton) {
  const m = new SkinnedMesh(geo, mat);
  m.name = `css-groom-${mat.name}`;
  m.frustumCulled = false;
  m.bind(skeleton, body.bindMatrix);
  body.parent?.add(m);
  m.position.copy(body.position);
  m.quaternion.copy(body.quaternion);
  m.scale.copy(body.scale);
  return m;
}
