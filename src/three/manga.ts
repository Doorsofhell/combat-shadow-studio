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

export function toonMaterial(name: string, map: Texture | null, color?: Color) {
  const m = new MeshLambertMaterial({ name, map, color: color ?? new Color(1, 1, 1) });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', TOON_FRAGMENT);
  };
  m.customProgramCacheKey = () => 'manga-toon';
  return m;
}

export function outlineMaterial(width: number) {
  const m = new MeshBasicMaterial({ color: '#141212', side: BackSide });
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
  m.customProgramCacheKey = () => `manga-outline-${width}`;
  return m;
}

/** Replaces the materials of a coach with the manga look and adds the ink outlines. */
export function applyManga(root: Object3D) {
  const outlines: [Object3D, SkinnedMesh][] = [];
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const old = mesh.material as MeshStandardMaterial;
    const name = (old.name || '').toLowerCase();
    const isEyes = name.startsWith('eye');
    mesh.material = toonMaterial(old.name, old.map ?? null, old.map ? undefined : old.color?.clone());
    (old as Material).dispose();
    const sk = mesh as SkinnedMesh;
    if (!isEyes && sk.isSkinnedMesh) {
      const line = new SkinnedMesh(sk.geometry, outlineMaterial(name.startsWith('hair') ? 0.0035 : 0.0045));
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
