import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from 'three';
import { ROOM_LAYER } from './rooms';

/** how many motes float around the coach: a few hundred points, one draw call (cheap on a phone) */
export const DUST_COUNT = 260;

/**
 * 1.26 salles vivantes (life.ts): fine dust floating in the light around the coach, in every room and seen from every
 * side. Each mote drifts slowly on its own path and catches the light now and then (it turns as it floats); the
 * motes far from the camera are smaller and fainter. Drawn over the room, hidden by the coach where he stands in
 * front of them.
 */
export function RoomDust({ color }: { color: string }) {
  const pts = useMemo(() => {
    const n = DUST_COUNT;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    let r = 12345;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      // a box round the coach, more of them in the light above and beside him
      pos[i * 3] = (rnd() - 0.5) * 5;
      pos[i * 3 + 1] = 0.2 + rnd() * 3.0;
      pos[i * 3 + 2] = (rnd() - 0.5) * 5 - 0.5;
      seed[i] = rnd();
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('seed', new BufferAttribute(seed, 1));
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new Color(color) }, uScale: { value: 1 } },
      vertexShader: `
        attribute float seed;
        uniform float uTime;
        uniform float uScale;
        varying float vA;
        void main() {
          vec3 p = position;
          float t = uTime * (0.6 + seed * 0.5);
          // slow drift: rising and falling a little, wandering sideways, wrapped inside its box
          p.x += sin(t * 0.21 + seed * 40.0) * 0.35 + uTime * 0.02 * (seed - 0.5);
          p.y += sin(t * 0.17 + seed * 17.0) * 0.25 + mod(uTime * 0.012 * (0.5 + seed), 0.6) - 0.3;
          p.z += cos(t * 0.19 + seed * 23.0) * 0.35;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float dist = -mv.z;
          // the mote turns as it floats: it catches the light now and then
          float glint = pow(0.5 + 0.5 * sin(uTime * (1.3 + seed * 2.0) + seed * 60.0), 6.0);
          vA = (0.06 + 0.4 * glint) * smoothstep(0.8, 2.0, dist) * (1.0 - smoothstep(7.0, 10.0, dist));
          gl_PointSize = uScale * (1.6 + 2.0 * seed) * (6.0 / max(dist, 1.0));
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vA;
        void main() {
          vec2 q = gl_PointCoord - 0.5;
          float d = dot(q, q) * 4.0;
          if (d > 1.0) discard;
          gl_FragColor = vec4(uColor * vA * (1.0 - d), 1.0);
        }`,
    });
    const p = new Points(g, m);
    p.name = 'salle-poussiere';
    p.frustumCulled = false;
    p.layers.set(ROOM_LAYER);
    p.raycast = () => {};
    return p;
  }, [color]);
  useEffect(
    () => () => {
      pts.geometry.dispose();
      (pts.material as ShaderMaterial).dispose();
    },
    [pts],
  );
  useFrame(({ gl }, dt) => {
    const m = pts.material as ShaderMaterial;
    m.uniforms.uTime.value += Math.min(dt, 0.1);
    // sizes in device pixels: the same look whatever the screen's density
    m.uniforms.uScale.value = gl.getPixelRatio();
  });
  return <primitive object={pts} />;
}
