/**
 * Manga rendering: cel shading in three flat tones with hatching in the shadows, flattened skin
 * tones so muscle creases read as ink areas, and an ink outline drawn with an inverted hull.
 */
import { BackSide, Color, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, Object3D, SkinnedMesh, Texture } from 'three';

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

export type InkStyle = 'manga' | 'encre';

export function toonMaterial(name: string, map: Texture | null, color?: Color, style: InkStyle = 'manga', normalMap: Texture | null = null) {
  if (style === 'encre') return inkMaterial(name, map, color, normalMap);
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

export function outlineMaterial(width: number, color = '#141212') {
  const m = new MeshBasicMaterial({ color, side: BackSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = { value: width };
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform float uOutline;\nvoid main() {')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        #ifdef USE_SKINNING
          vec4 nClip = projectionMatrix * modelViewMatrix * vec4(objectNormal, 0.0);
          vec2 dir = nClip.xy + vec2(1e-6);
          gl_Position.xy += normalize(dir) * uOutline * gl_Position.w;
        #endif`,
      );
  };
  m.customProgramCacheKey = () => `manga-outline-${width}-${color}`;
  return m;
}

/** Replaces the materials of a coach with the manga look and adds the ink outlines. */
export function applyManga(root: Object3D, style: InkStyle = 'manga') {
  const ink = style === 'encre';
  const outlines: [Object3D, SkinnedMesh][] = [];
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const old = mesh.material as MeshStandardMaterial;
    const name = (old.name || '').toLowerCase();
    const isEyes = name.startsWith('eye');
    mesh.material = toonMaterial(old.name, old.map ?? null, old.map ? undefined : old.color?.clone(), style, old.normalMap ?? null);
    (old as Material).dispose();
    const sk = mesh as SkinnedMesh;
    if (!isEyes && sk.isSkinnedMesh) {
      const line = new SkinnedMesh(sk.geometry, ink ? outlineMaterial(name.startsWith('hair') ? 0.0042 : 0.0058, '#1b1d22') : outlineMaterial(name.startsWith('hair') ? 0.0035 : 0.0045));
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
