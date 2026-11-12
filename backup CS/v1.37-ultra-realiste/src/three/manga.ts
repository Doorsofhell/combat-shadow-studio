/**
 * Manga rendering: cel shading in three flat tones with hatching in the shadows, flattened skin
 * tones so muscle creases read as ink areas, and an ink outline drawn with an inverted hull.
 */
import { BackSide, BufferAttribute, BufferGeometry, Color, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, Object3D, SkinnedMesh, Texture } from 'three';

const TOON_FRAGMENT = /* glsl */ `
  {
    vec3 albedo = diffuseColor.rgb;
    float L = dot(albedo, vec3(0.299, 0.587, 0.114));
    // flatten the painted shading into a few tones (baked creases become clean dark shapes)
    // (very dark colours keep their value: rounding them would turn dark red or navy into pure black)
    float q = L < 0.0715 ? L : floor(L * 7.0 + 0.5) / 7.0;
    albedo *= q / max(L, 1e-3);
    float light = dot(outgoingLight, vec3(0.299, 0.587, 0.114)) / max(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)), 1e-3);
    float band = light > 0.9 ? 1.1 : light > 0.42 ? 0.92 : 0.7;
    vec3 col = albedo * band;
    if (light <= 0.42) {
      // diagonal hatching in the shadow tone, like screentone in a manga panel
      float h = step(0.6, fract((gl_FragCoord.x - gl_FragCoord.y) / 5.0));
      col *= mix(1.0, 0.8, h);
    }
    outgoingLight = col;
  }
  #include <opaque_fragment>
`;

/**
 * Ink rendering ("Encre"): painted colours with a soft light ramp, ink hatching whose density follows
 * the shadow (one direction, then crossed, then a third pass in the deepest shadows), anthracite ink
 * instead of pure black, and a light sheen on the lit planes of the muscles.
 */
const INK_FRAGMENT = /* glsl */ `
  {
    vec3 albedo = diffuseColor.rgb;
    float la = max(dot(albedo, vec3(0.299, 0.587, 0.114)), 1e-3);
    float scene = dot(outgoingLight, vec3(0.299, 0.587, 0.114)) / la;
    // a raking key light from the upper left (view space) carves the muscles, like a drawn study;
    // the scene light still darkens what the stage leaves in shadow
    float key = dot(normalize(normal), normalize(vec3(-0.55, 0.62, 0.56)));
    float light = min(0.2 + 0.95 * smoothstep(-0.25, 0.85, key), scene * 1.1);
    float tone = smoothstep(0.2, 1.0, light);
    vec3 col = albedo * mix(0.5, 1.08, tone);
    // hatching in screen space, about 8 device px apart, slightly tilted like a pen stroke
    vec2 p = gl_FragCoord.xy;
    // a slight wobble, so the strokes read as drawn by hand
    p += vec2(sin(p.y * 0.045), sin(p.x * 0.05)) * 1.6;
    float d1 = abs(fract((p.x * 0.9 + p.y * 0.45) / 8.0) - 0.5) * 2.0;
    float d2 = abs(fract((p.y * 0.95 - p.x * 0.5) / 8.0) - 0.5) * 2.0;
    float d3 = abs(fract((p.x * 0.2 + p.y) / 6.0) - 0.5) * 2.0;
    float w1 = clamp((0.72 - light) * 1.5, 0.0, 0.6);
    float w2 = clamp((0.4 - light) * 1.3, 0.0, 0.4);
    float w3 = clamp((0.28 - light) * 1.5, 0.0, 0.42);
    float a1 = fwidth(d1), a2 = fwidth(d2), a3 = fwidth(d3);
    float ink = max(max(1.0 - smoothstep(w1 - a1, w1 + a1, d1), 1.0 - smoothstep(w2 - a2, w2 + a2, d2)), 1.0 - smoothstep(w3 - a3, w3 + a3, d3));
    if (w1 <= 0.0) ink = 0.0;
    ink *= 0.9;
    // form lines: where the light turns quickly (muscle edges, creases), the pen draws a contour
    float crease = max(smoothstep(0.1, 0.24, fwidth(light)), smoothstep(0.025, 0.07, fwidth(la)) * step(la, 0.6));
    ink = max(ink, crease * 0.75);
    vec3 inkCol = albedo * 0.22 + vec3(0.07, 0.07, 0.085);
    col = mix(col, inkCol, ink * 0.82);
    // sheen on the most lit planes
    col = mix(col, vec3(1.0, 0.98, 0.94), smoothstep(1.02, 1.2, light) * 0.2 * smoothstep(0.12, 0.3, la));
    outgoingLight = col;
  }
  #include <opaque_fragment>
`;

/**
 * Encre, premium render (v0.23): cel shading in three tones with anti-aliased edges, the baked
 * anatomical relief (normal map) carving the tones, cool shadows, a warm rim light and the ink
 * outline. No screen-space hatching: on a phone screen the hatching read as torn, striped skin.
 */
const CEL_FRAGMENT = /* glsl */ `
  {
    vec3 albedo = diffuseColor.rgb;
    float la = max(dot(albedo, vec3(0.299, 0.587, 0.114)), 1e-3);
    float scene = dot(outgoingLight, vec3(0.299, 0.587, 0.114)) / la;
    vec3 n = normalize(normal);
    // studio key light from the upper left (view space); the stage lights still darken its shadows
    float key = dot(n, normalize(vec3(-0.45, 0.6, 0.66)));
    float light = min(0.22 + 0.92 * smoothstep(-0.35, 0.9, key), scene * 1.15);
    // three tones, edges smoothed over about a pixel so they never flicker or alias
    float aa = fwidth(light) * 1.2 + 0.004;
    float lit = smoothstep(0.4 - aa, 0.4 + aa, light);
    float high = smoothstep(0.8 - aa, 0.8 + aa, light);
    float tone = mix(0.6, mix(0.88, 1.06, high), lit);
    // shadows slightly cool, lit planes slightly warm (painted look, never black)
    vec3 tint = mix(vec3(0.9, 0.92, 1.04), vec3(1.02, 1.0, 0.97), lit);
    vec3 col = albedo * tone * tint;
    // rim light on the silhouette, on the lit side of the shading only
    float rim = smoothstep(0.62, 0.92, 1.0 - abs(n.z)) * smoothstep(0.2, 0.6, light);
    col += vec3(1.0, 0.93, 0.85) * rim * 0.14 * smoothstep(0.08, 0.3, la);
    outgoingLight = col;
  }
  #include <opaque_fragment>
`;

/**
 * Anime (0.24, the premium "Encre" look renamed): adult Japanese anime, in the manner of fighting series.
 * The shadow is one clean, hard-edged flat area decided by the shape of the body (geometry normal),
 * only nudged by the muscles, so the baked relief can no longer break the skin into blotches. The
 * muscles are drawn instead: an ink stroke where the relief turns away from the light, on the shadow
 * side of each bulge. Cool shadows, warm lit planes, a rim light, and the ink outline.
 */
const ANIME_FRAGMENT = /* glsl */ `
  {
    vec3 albedo = diffuseColor.rgb;
    float la = max(dot(albedo, vec3(0.299, 0.587, 0.114)), 1e-3);
    vec3 n = normalize(normal);
    #ifdef FLAT_SHADED
      vec3 gN = n;
    #else
      vec3 gN = normalize(vNormal) * faceDirection;
    #endif
    // the large shape of the body (the vertex normals averaged over a few centimetres, see shadeNormals):
    // the vertex normals themselves follow every muscle bump of the mesh, and the hard shadow edge cut
    // them into islands of shadow and light that read as stains on the skin
    #ifdef CSS_SHADE_N
      vec3 sN = normalize(vShadeN) * faceDirection;
    #else
      vec3 sN = gN;
    #endif
    // a side key light: the dramatic half-shadow of fighting anime
    vec3 L = normalize(vec3(-0.72, 0.52, 0.46));
    // the body shape alone decides where the flat shadow falls
    float k = dot(sN, L);
    // the scene's per-pixel shade is not used: it carries the baked relief
    float light = 0.24 + 0.92 * smoothstep(-0.3, 0.9, k);
    float aa = fwidth(light) * 0.8 + 0.002;
    float lit = smoothstep(0.44 - aa, 0.44 + aa, light);
    float high = smoothstep(0.9 - aa, 0.9 + aa, light);
    float tone = mix(0.56, mix(0.95, 1.05, high), lit);
    vec3 tint = mix(vec3(0.8, 0.85, 1.03), vec3(1.03, 1.0, 0.96), lit);
    // the muscles model the planes softly, without a tone edge
    float relief = clamp(dot(n, L) - k, -0.5, 0.5);
    vec3 col = albedo * tone * tint * (1.0 + 0.22 * relief);
    // muscle strokes: only where the relief bends sharply away from the body shape and the light
    float bend = length(n - gN);
    float away = smoothstep(-0.08, -0.25, relief);
    float stroke = smoothstep(0.24, 0.4, bend) * away * smoothstep(0.08, 0.3, la);
    col = mix(col, albedo * 0.35 + vec3(0.035, 0.03, 0.035), stroke * 0.6);
    // rim light on the lit side of the silhouette
    float rim = smoothstep(0.6, 0.92, 1.0 - abs(sN.z)) * smoothstep(0.2, 0.6, light);
    col += vec3(1.0, 0.94, 0.86) * rim * 0.16 * smoothstep(0.08, 0.3, la);
    outgoingLight = col;
  }
  #include <opaque_fragment>
`;

/** the shading normals (aShadeN, see shadeNormals) skinned like the normal, when the geometry has them */
const SHADE_N_VERTEX_HEAD = /* glsl */ `
#include <common>
#ifdef CSS_SHADE_N
attribute vec3 aShadeN;
varying vec3 vShadeN;
#endif
`;

const SHADE_N_VERTEX = /* glsl */ `
#include <defaultnormal_vertex>
#ifdef CSS_SHADE_N
{
  vec3 sn = aShadeN;
  #ifdef USE_SKINNING
    sn = (skinMatrix * vec4(sn, 0.0)).xyz;
  #endif
  vShadeN = normalMatrix * sn;
}
#endif
`;

/**
 * Shading normals of the anime look: the normals of the surface averaged over about 4.5 cm, whatever the
 * density of the mesh (2 mm edges on the face, 1 cm on the torso), then relaxed over the welded surface.
 * The flat shadow then follows the big volumes (chest, limbs, head) as a clean curve; the muscles only
 * nudge the tone (see ANIME_FRAGMENT). The vertex normals follow every muscle bump of the mesh: cut by
 * a hard shadow edge they broke the skin into islands of shadow and light, read as stains.
 * Only normals facing the same way are averaged (the two inner thighs, or the arm and the side of the
 * torso, stay apart). Computed once per geometry, in the rest pose.
 */
export function shadeNormals(g: BufferGeometry, radius = 0.045, passes = 6) {
  if (g.getAttribute('aShadeN')) return;
  const pos = g.getAttribute('position');
  const nrm = g.getAttribute('normal');
  if (!pos || !nrm) return;
  const n = pos.count;
  const P = new Float32Array(n * 3);
  const N = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = nrm.getX(i);
    const y = nrm.getY(i);
    const z = nrm.getZ(i);
    const l = Math.hypot(x, y, z) || 1;
    N[i * 3] = x / l;
    N[i * 3 + 1] = y / l;
    N[i * 3 + 2] = z / l;
    P[i * 3] = pos.getX(i);
    P[i * 3 + 1] = pos.getY(i);
    P[i * 3 + 2] = pos.getZ(i);
  }
  // samples: per cell of the radius' size, one per main direction of the normal (±x, ±y, ±z)
  const cellKey = (x: number, y: number, z: number) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
  const cells = new Map<number, number>();
  const acc: number[] = []; // per sample: sum of positions (3), sum of normals (3), count
  const dirOf = (i: number) => {
    const ax = Math.abs(N[i * 3]);
    const ay = Math.abs(N[i * 3 + 1]);
    const az = Math.abs(N[i * 3 + 2]);
    const k = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2;
    return k * 2 + (N[i * 3 + k] < 0 ? 1 : 0);
  };
  const cellOf = new Int32Array(n);
  const cellXYZ: number[] = [];
  for (let i = 0; i < n; i++) {
    const cx = Math.floor(P[i * 3] / radius);
    const cy = Math.floor(P[i * 3 + 1] / radius);
    const cz = Math.floor(P[i * 3 + 2] / radius);
    const key = cellKey(cx, cy, cz);
    let c = cells.get(key);
    if (c === undefined) {
      c = acc.length / 7 / 6;
      cells.set(key, c);
      cellXYZ.push(cx, cy, cz);
      for (let k = 0; k < 42; k++) acc.push(0);
    }
    cellOf[i] = c;
    const o = (c * 6 + dirOf(i)) * 7;
    for (let k = 0; k < 3; k++) {
      acc[o + k] += P[i * 3 + k];
      acc[o + 3 + k] += N[i * 3 + k];
    }
    acc[o + 6]++;
  }
  const S = new Float32Array(acc.length);
  for (let o = 0; o < acc.length; o += 7) {
    const cnt = acc[o + 6];
    if (!cnt) continue;
    const l = Math.hypot(acc[o + 3], acc[o + 4], acc[o + 5]) || 1;
    for (let k = 0; k < 3; k++) {
      S[o + k] = acc[o + k] / cnt;
      S[o + 3 + k] = acc[o + 3 + k] / l;
    }
    // the weight of a sample grows with the surface it stands for, but slowly (dense face, sparse torso)
    S[o + 6] = Math.sqrt(cnt);
  }
  // the samples of the 27 cells around each cell
  const C = cellXYZ.length / 3;
  const near: number[][] = [];
  for (let c = 0; c < C; c++) {
    const list: number[] = [];
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          const o = cells.get(cellKey(cellXYZ[c * 3] + dx, cellXYZ[c * 3 + 1] + dy, cellXYZ[c * 3 + 2] + dz));
          if (o !== undefined) for (let d = 0; d < 6; d++) if (S[(o * 6 + d) * 7 + 6]) list.push((o * 6 + d) * 7);
        }
    near.push(list);
  }
  // each vertex: those samples, with a compact kernel (no cell beyond can reach it, so the result is
  // continuous), weighted by how much they face the same way
  const cur = new Float32Array(n * 3);
  const R2 = radius * radius;
  for (let i = 0; i < n; i++) {
    const px = P[i * 3];
    const py = P[i * 3 + 1];
    const pz = P[i * 3 + 2];
    const nx = N[i * 3];
    const ny = N[i * 3 + 1];
    const nz = N[i * 3 + 2];
    let sx = nx * 0.05;
    let sy = ny * 0.05;
    let sz = nz * 0.05;
    for (const o of near[cellOf[i]]) {
      const ex = S[o] - px;
      const ey = S[o + 1] - py;
      const ez = S[o + 2] - pz;
      const q = 1 - (ex * ex + ey * ey + ez * ez) / R2;
      if (q <= 0) continue;
      const f = S[o + 3] * nx + S[o + 4] * ny + S[o + 5] * nz;
      if (f <= 0) continue;
      const w = q * q * f * f * S[o + 6];
      sx += S[o + 3] * w;
      sy += S[o + 4] * w;
      sz += S[o + 5] * w;
    }
    const l = Math.hypot(sx, sy, sz) || 1;
    cur[i * 3] = sx / l;
    cur[i * 3 + 1] = sy / l;
    cur[i * 3 + 2] = sz / l;
  }
  // a few relaxation passes over the welded surface (vertices split along the texture seams count as one)
  const ids = new Map<number, number>();
  const weld = new Int32Array(n);
  // a number key (positions within ±2 m at 0.05 mm): faster than a string on a phone
  const q = (v: number) => Math.round(v * 2e4) + 40000;
  for (let i = 0; i < n; i++) {
    const k = (q(P[i * 3]) * 80001 + q(P[i * 3 + 1])) * 80001 + q(P[i * 3 + 2]);
    let w = ids.get(k);
    if (w === undefined) ids.set(k, (w = ids.size));
    weld[i] = w;
  }
  const index = g.getIndex();
  const tri = index ? (index.array as ArrayLike<number>) : Array.from({ length: n }, (_, i) => i);
  const W = ids.size;
  const wsum = new Float32Array(W * 3);
  const next = new Float32Array(W * 3);
  for (let it = 0; it < passes; it++) {
    wsum.fill(0);
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) wsum[weld[i] * 3 + k] = cur[i * 3 + k];
    next.set(wsum);
    for (let t = 0; t + 2 < tri.length; t += 3)
      for (let e = 0; e < 3; e++) {
        const a = weld[tri[t + e]];
        const b = weld[tri[t + ((e + 1) % 3)]];
        if (a === b) continue;
        for (let k = 0; k < 3; k++) {
          next[a * 3 + k] += wsum[b * 3 + k] * 0.5;
          next[b * 3 + k] += wsum[a * 3 + k] * 0.5;
        }
      }
    for (let i = 0; i < n; i++) {
      const w = weld[i];
      const l = Math.hypot(next[w * 3], next[w * 3 + 1], next[w * 3 + 2]) || 1;
      for (let k = 0; k < 3; k++) cur[i * 3 + k] = next[w * 3 + k] / l;
    }
  }
  g.setAttribute('aShadeN', new BufferAttribute(cur, 3));
}

export type InkStyle = 'manga' | 'encre' | 'cel' | 'anime';

export function toonMaterial(name: string, map: Texture | null, color?: Color, style: InkStyle = 'manga', normalMap: Texture | null = null) {
  if (style === 'encre') return inkMaterial(name, map, color, normalMap);
  if (style === 'cel' || style === 'anime') {
    const m = new MeshLambertMaterial({ name, map, normalMap, color: color ?? new Color(1, 1, 1) });
    const frag = style === 'cel' ? CEL_FRAGMENT : ANIME_FRAGMENT;
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', frag);
      if (style === 'anime') {
        shader.vertexShader = shader.vertexShader.replace('#include <common>', SHADE_N_VERTEX_HEAD).replace('#include <defaultnormal_vertex>', SHADE_N_VERTEX);
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n#ifdef CSS_SHADE_N\nvarying vec3 vShadeN;\n#endif');
      }
    };
    m.customProgramCacheKey = () => `${style}-toon`;
    return m;
  }
  const m = new MeshLambertMaterial({ name, map, normalMap, color: color ?? new Color(1, 1, 1) });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', TOON_FRAGMENT);
  };
  m.customProgramCacheKey = () => 'manga-toon';
  return m;
}

function inkMaterial(name: string, map: Texture | null, color?: Color, normalMap: Texture | null = null) {
  const m = new MeshLambertMaterial({ name, map, normalMap, color: color ?? new Color(1, 1, 1) });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', INK_FRAGMENT);
  };
  m.customProgramCacheKey = () => 'ink-toon';
  return m;
}

/** perVertex: the geometry carries an aInk width factor (see inkWidths) */
export function outlineMaterial(width: number, color = '#141212', perVertex = false) {
  const m = new MeshBasicMaterial({ color, side: BackSide });
  if (perVertex) m.defines = { CSS_INK_WIDTH: '' };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = { value: width };
    shader.vertexShader = shader.vertexShader.replace('void main() {', 'uniform float uOutline;\n#ifdef CSS_INK_WIDTH\nattribute float aInk;\n#else\nconst float aInk = 1.0;\n#endif\nvoid main() {').replace(
      '#include <project_vertex>',
      `#include <project_vertex>
        #ifdef USE_SKINNING
          vec4 nClip = projectionMatrix * modelViewMatrix * vec4(objectNormal, 0.0);
          vec2 dir = nClip.xy + vec2(1e-6);
          gl_Position.xy += normalize(dir) * uOutline * aInk * gl_Position.w;
        #endif`,
    );
  };
  m.customProgramCacheKey = () => `manga-outline-${width}-${color}-${perVertex}`;
  return m;
}

/** bones of the toes and fingers: small, close together, concave between them */
const SMALL = /(ToeBase|Toe_End|HandThumb|HandIndex|HandMiddle|HandRing|HandPinky)/;

/**
 * Per-vertex width of the ink outline: thin on the toes and fingers. At full width, the hull of one toe
 * pokes out between its neighbours and reads as a black blot on the foot.
 */
function inkWidths(sk: SkinnedMesh) {
  const g = sk.geometry;
  if (g.getAttribute('aInk')) return;
  const n = g.getAttribute('position').count;
  const ink = new Float32Array(n).fill(1);
  const si = g.getAttribute('skinIndex');
  const sw = g.getAttribute('skinWeight');
  if (si && sw && sk.skeleton) {
    const small = sk.skeleton.bones.map((b) => SMALL.test(b.name));
    for (let i = 0; i < n; i++) {
      let w = 0;
      for (let k = 0; k < 4; k++) if (small[si.getComponent(i, k)]) w += sw.getComponent(i, k);
      ink[i] = 1 - 0.8 * Math.min(1, w);
    }
  }
  g.setAttribute('aInk', new BufferAttribute(ink, 1));
}

/** Replaces the materials of a coach with the manga look and adds the ink outlines. */
export function applyManga(root: Object3D, style: InkStyle = 'manga') {
  const ink = style !== 'manga';
  const outlines: [Object3D, SkinnedMesh][] = [];
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const old = mesh.material as MeshStandardMaterial;
    const name = (old.name || '').toLowerCase();
    const isEyes = name.startsWith('eye');
    const toon = toonMaterial(old.name, old.map ?? null, old.map ? undefined : old.color?.clone(), style, old.normalMap ?? null);
    if (style === 'anime' && !isEyes && (mesh as SkinnedMesh).isSkinnedMesh) {
      shadeNormals(mesh.geometry);
      toon.defines = { ...toon.defines, CSS_SHADE_N: '' };
    }
    mesh.material = toon;
    (old as Material).dispose();
    const sk = mesh as SkinnedMesh;
    if (!isEyes && sk.isSkinnedMesh) {
      inkWidths(sk);
      const line = new SkinnedMesh(sk.geometry, ink ? outlineMaterial(name.startsWith('hair') ? 0.0042 : 0.0058, '#1b1d22', true) : outlineMaterial(name.startsWith('hair') ? 0.0035 : 0.0045, '#141212', true));
      line.bind(sk.skeleton, sk.bindMatrix);
      line.frustumCulled = false;
      line.position.copy(sk.position);
      line.quaternion.copy(sk.quaternion);
      line.scale.copy(sk.scale);
      outlines.push([sk.parent!, line]);
    }
  });
  for (const [parent, line] of outlines) parent.add(line);
}
