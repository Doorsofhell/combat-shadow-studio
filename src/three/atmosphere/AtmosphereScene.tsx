import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  ShaderMaterial,
  SphereGeometry,
  Texture,
  Vector3,
} from 'three';
import type { CoachAtmosphere } from '../../domain/coaches/atmosphere';
import { EMBLEM_ASPECT, drawEmblem, drawSmoke } from './emblem';

/**
 * Scène de présentation de l'écran « Ton coach » (V4) : l'univers tiré des traits du coach autour de lui, en WebGL, pour cet
 * écran seulement (CoachStage ne la monte que si on lui donne une ambiance). Rien ne touche au modèle, à ses matériaux ni à
 * ses animations : un ciel en dégradé, l'emblème dessiné (emblem.ts) derrière lui, un peu de fumée, une lueur au sol, et
 * des lumières dont seules les couleurs et intensités changent d'un coach à l'autre.
 *
 * Coût : 1 sphère (32×16), 1 panneau d'emblème (texture 768×1080, 384×540 en qualité légère), 1 disque de sol, 0 à 5 plans de
 * fumée qui partagent une texture 256×256, 5 lumières sans ombre (l'ombre portée de la lumière principale suit le réglage
 * actuel de la scène). Pas de post-traitement, pas de particules.
 *
 * Transition : l'emblème de l'ancien coach s'efface pendant que le nouveau apparaît (0,7 s ; 0,3 s en qualité légère ou en
 * mouvement réduit), les couleurs du ciel, du sol et des lumières glissent vers les nouvelles ; jamais d'écran noir.
 */

export interface AtmosphereSceneProps {
  atmosphere: CoachAtmosphere;
  /** nom affiché en très grand dans l'emblème */
  name: string;
  quality: 'haute' | 'basse';
  /** l'ombre portée de la lumière principale (même règle que les lumières de studio) */
  shadows: boolean;
}

/** distance de l'emblème derrière le coach et ses dimensions (m) */
const EMBLEM_Z = -3;
const EMBLEM_H = 4.0;
const EMBLEM_BOTTOM = -1.0;

const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** sondes lues par les tests de bout en bout */
function probe(v: object) {
  const w = window as unknown as { __cssAtmo?: object };
  w.__cssAtmo = { ...(w.__cssAtmo ?? {}), ...v };
}

/** textures de l'ambiance encore vivantes (créées moins rendues) : lu par les tests de non-accumulation */
let own = 0;

interface Layer {
  key: string;
  tex: Texture;
  /** 0 → 1 à l'apparition, 1 → 0 à la sortie */
  k: number;
  out: boolean;
}

const fontReady = (() => {
  let p: Promise<unknown> | null = null;
  return () => (p ??= typeof document !== 'undefined' && document.fonts ? Promise.race([document.fonts.load('800 120px Rajdhani'), new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve());
})();

export function AtmosphereScene({ atmosphere: a, name, quality, shadows }: AtmosphereSceneProps) {
  const { camera, gl } = useThree();
  const light = quality === 'basse';
  const fade = light || REDUCED ? 0.3 : 0.7;
  const follow = useRef<Group>(null);

  // ---------------------------------------------------------------- emblèmes (calques en fondu)
  // the layers live in a ref (the frame loop changes their fade every frame); a counter redraws the list when one comes or goes
  const layersRef = useRef<Layer[]>([]);
  const [, redraw] = useState(0);
  const layers = layersRef.current;
  const key = `${a.coachId}:${a.palette.primary}:${a.atmosphere.motif}:${name}:${light ? 'b' : 'h'}`;
  useEffect(() => {
    let live = true;
    void fontReady().then(() => {
      if (!live) return;
      const t0 = performance.now();
      const tex = new CanvasTexture(drawEmblem(a, name, light ? 384 : 768));
      own++;
      tex.addEventListener('dispose', () => {
        own--;
        probe({ ownTextures: own });
      });
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 2;
      probe({ coach: a.coachId, motif: a.atmosphere.motif, drawMs: Math.round(performance.now() - t0), ownTextures: own });
      for (const l of layersRef.current) l.out = true;
      layersRef.current = [...layersRef.current, { key, tex, k: 0, out: false }];
      probe({ layers: layersRef.current.length });
      redraw((n) => n + 1);
    });
    return () => {
      live = false;
    };
    // la clé résume tout ce qui change le dessin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  // les textures sont rendues à la carte graphique quand le calque disparaît ou que l'écran se ferme
  useEffect(
    () => () => {
      for (const l of layersRef.current) l.tex.dispose();
    },
    [],
  );
  const emblemGeo = useMemo(() => new PlaneGeometry(EMBLEM_H * EMBLEM_ASPECT, EMBLEM_H), []);
  const emblemMats = useRef(new Map<string, MeshBasicMaterial>());

  // ---------------------------------------------------------------- ciel, sol, fumée
  const sky = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        toneMapped: false,
        fog: false,
        uniforms: { uTop: { value: new Color(a.palette.sky[0]).multiplyScalar(0.5) }, uBottom: { value: new Color(a.palette.sky[1]) }, uGlow: { value: new Color(a.palette.primary) }, uGlowK: { value: 0.5 } },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `
          uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uGlow; uniform float uGlowK; varying vec3 vDir;
          void main(){
            float h = smoothstep(-0.25, 0.55, vDir.y);
            vec3 c = mix(uBottom, uTop, h);
            // lueur derrière le coach (axe -z du groupe qui suit la caméra)
            float d = distance(vDir, normalize(vec3(0.0, 0.05, -1.0)));
            // the field of view is narrow (30°): a tight glow, centred behind the chest
            c += uGlow * uGlowK * exp(-d * d * 90.0) * 0.22;
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const skyGeo = useMemo(() => new SphereGeometry(24, 32, 16), []);
  const floor = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        uniforms: { uGlow: { value: new Color(a.palette.primary) }, uRing: { value: new Color(a.palette.accent) }, uK: { value: 0.55 }, uMotif: { value: 0 }, uTime: { value: 0 } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `
          uniform vec3 uGlow; uniform vec3 uRing; uniform float uK; uniform float uMotif; uniform float uTime; varying vec2 vP;
          float line(float d, float w){ return 1.0 - smoothstep(0.0, w, abs(d)); }
          void main(){
            float r = length(vP);
            float glow = exp(-r * r * 1.1) * uK;
            float ring = line(r - 1.05, 0.018) * 0.55 * (0.85 + 0.15 * sin(uTime * 1.3));
            float m = 0.0;
            // 1 : ring (carré), 2 : octogone, 3 : tatami (grille)
            if (uMotif > 0.5 && uMotif < 1.5) { vec2 q = abs(vP); m = line(max(q.x, q.y) - 2.0, 0.02); }
            else if (uMotif > 1.5 && uMotif < 2.5) { vec2 q = abs(vP); float o = max(max(q.x, q.y), (q.x + q.y) * 0.70710678); m = line(o - 2.0, 0.02); }
            else if (uMotif > 2.5) { vec2 g = abs(fract(vP / vec2(0.9, 1.8)) - 0.5); m = line(min(g.x, g.y), 0.012) * 0.6; }
            float fadeOut = 1.0 - smoothstep(1.4, 2.4, r);
            vec3 c = uGlow * glow + uRing * ring + uRing * m * 0.16 * fadeOut;
            float al = clamp(glow + ring + m * 0.16 * fadeOut, 0.0, 1.0);
            gl_FragColor = vec4(c, al);
            #include <colorspace_fragment>
          }`,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const floorGeo = useMemo(() => new PlaneGeometry(6, 6), []);
  const smokeTex = useMemo(() => {
    const t = new CanvasTexture(drawSmoke());
    t.colorSpace = SRGBColorSpace;
    own++;
    t.addEventListener('dispose', () => {
      own--;
      probe({ ownTextures: own });
    });
    return t;
  }, []);
  const smokeN = light ? 0 : a.atmosphere.smoke === 'dense' ? 5 : a.atmosphere.smoke === 'subtle' ? 3 : 0;
  const smokeMat = useMemo(() => new MeshBasicMaterial({ map: smokeTex, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false, opacity: 0, color: new Color(a.palette.accent).lerp(new Color('#ffffff'), 0.3) }), [smokeTex, a.palette.accent]);
  const smokeGeo = useMemo(() => new PlaneGeometry(3.2, 1.6), []);
  const smokes = useRef<Mesh[]>([]);

  useEffect(
    () => () => {
      for (const o of [sky, skyGeo, floor, floorGeo, smokeTex, smokeGeo, emblemGeo]) o.dispose();
      for (const m of emblemMats.current.values()) m.dispose();
    },
    [sky, skyGeo, floor, floorGeo, smokeTex, smokeGeo, emblemGeo],
  );
  useEffect(() => () => smokeMat.dispose(), [smokeMat]);

  // ---------------------------------------------------------------- lumières
  const hemi = useRef<HemisphereLight>(null);
  const key2 = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);
  const rim2 = useRef<DirectionalLight>(null);
  const target = useMemo(
    () => ({
      key: new Color(a.lighting.key.color),
      fill: new Color(a.lighting.fill.color),
      rim: new Color(a.lighting.rim.color),
      rim2: new Color(a.palette.accent),
      hemiSky: new Color(a.palette.sky[0]).lerp(new Color('#ffffff'), 0.55),
      top: new Color(a.palette.sky[0]).multiplyScalar(0.5),
      bottom: new Color(a.palette.sky[1]),
      glow: new Color(a.palette.primary),
      ring: new Color(a.palette.accent),
    }),
    [a],
  );
  const floorMotif = a.atmosphere.floor === 'ring' ? 1 : a.atmosphere.floor === 'octogone' ? 2 : a.atmosphere.floor === 'tatami' ? 3 : 0;
  const keyPos = useMemo(() => new Vector3(2.4 * a.lighting.key.side, 4.4, 3.0), [a.lighting.key.side]);
  const tmp = useMemo(() => new Vector3(), []);
  const time = useRef(0);
  const probeTick = useRef(0);

  useFrame((_s, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    time.current += dt * a.atmosphere.pace;
    const k = 1 - Math.exp(-dt * (3 / fade));
    // le décor reste derrière le coach quand le doigt fait tourner la caméra (seulement autour de la verticale)
    const g = follow.current;
    if (g) {
      tmp.copy(camera.position);
      g.rotation.y = Math.atan2(tmp.x, tmp.z);
    }
    // couleurs qui glissent vers celles du nouveau coach
    (sky.uniforms.uTop.value as Color).lerp(target.top, k);
    (sky.uniforms.uBottom.value as Color).lerp(target.bottom, k);
    (sky.uniforms.uGlow.value as Color).lerp(target.glow, k);
    sky.uniforms.uGlowK.value += ((a.lighting.intensity === 'intense' ? 0.7 : a.lighting.intensity === 'soft' ? 0.4 : 0.55) - sky.uniforms.uGlowK.value) * k;
    (floor.uniforms.uGlow.value as Color).lerp(target.glow, k);
    (floor.uniforms.uRing.value as Color).lerp(target.ring, k);
    floor.uniforms.uK.value += ((a.atmosphere.floorReflection === 'medium' ? 0.6 : 0.45) - floor.uniforms.uK.value) * k;
    floor.uniforms.uMotif.value = floorMotif;
    floor.uniforms.uTime.value = time.current;
    const breathe = 1 + 0.04 * Math.sin(time.current * 1.1);
    if (key2.current) {
      key2.current.color.lerp(target.key, k);
      key2.current.intensity += (a.lighting.key.intensity * (light ? 1.25 : 1) - key2.current.intensity) * k;
      key2.current.position.lerp(keyPos, k);
    }
    if (fill.current) {
      fill.current.color.lerp(target.fill, k);
      fill.current.intensity += (a.lighting.fill.intensity * (light ? 1.8 : 1) - fill.current.intensity) * k;
    }
    if (rim.current) {
      rim.current.color.lerp(target.rim, k);
      rim.current.intensity += (a.lighting.rim.intensity * breathe - rim.current.intensity) * k;
    }
    if (rim2.current) {
      rim2.current.color.lerp(target.rim2, k);
      rim2.current.intensity += (a.lighting.rim.intensity * 0.45 - rim2.current.intensity) * k;
    }
    if (hemi.current) hemi.current.color.lerp(target.hemiSky, k);
    // fumée : lente dérive latérale, chaque nappe à son rythme
    smokeMat.opacity += ((smokeN ? (a.atmosphere.smoke === 'dense' ? 0.11 : 0.07) : 0) - smokeMat.opacity) * k;
    smokes.current.slice(0, smokeN).forEach((m, i) => {
      if (!m) return;
      const t = time.current * 0.05 + i * 1.7;
      m.position.x = Math.sin(t) * 1.4;
      m.position.y = 0.3 + (i % 3) * 0.45 + Math.sin(t * 1.3) * 0.08;
    });
    // sonde des tests : la mémoire graphique de la scène, une fois par seconde
    const now = performance.now();
    if (now - probeTick.current > 1000 && (probeTick.current = now)) probe({ textures: gl.info.memory.textures, geometries: gl.info.memory.geometries, ownTextures: own });
    // fondu des emblèmes
    let changed = false;
    const ls = layersRef.current;
    for (const l of ls) {
      l.k = l.out ? Math.max(0, l.k - dt / fade) : Math.min(1, l.k + dt / fade);
      const mat = emblemMats.current.get(l.key);
      if (mat) mat.opacity = l.k * l.k * (3 - 2 * l.k);
      // a layer sent out before it ever showed (fast taps) goes too
      if (l.out && l.k === 0) changed = true;
    }
    if (changed) {
      const gone = ls.filter((l) => l.out && l.k === 0);
      for (const l of gone) {
        l.tex.dispose();
        emblemMats.current.get(l.key)?.dispose();
        emblemMats.current.delete(l.key);
      }
      layersRef.current = ls.filter((l) => !(l.out && l.k === 0));
      redraw((n) => n + 1);
      probe({ layers: ls.length - gone.length, ownTextures: own, textures: gl.info.memory.textures, geometries: gl.info.memory.geometries });
    }
  });

  return (
    <>
      {/* qualité légère : sans les reflets du studio (StudioEnvironment, qualité haute seulement), un peu plus de lumière
          d'ambiance pour que le coach garde la même lecture (constaté sur le passage auto → légère) */}
      <hemisphereLight ref={hemi} args={['#ffffff', '#0b0b0d', light ? 0.8 : 0.35]} />
      <directionalLight
        ref={key2}
        position={keyPos}
        intensity={a.lighting.key.intensity}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={4}
        shadow-camera-left={-1.6}
        shadow-camera-right={1.6}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
      />
      <directionalLight ref={fill} position={[-3 * a.lighting.key.side, 2.2, 2]} intensity={a.lighting.fill.intensity} />
      <directionalLight ref={rim} position={[-2.2, 3.2, -3.4]} intensity={a.lighting.rim.intensity} />
      <directionalLight ref={rim2} position={[2.6, 2.0, -3.0]} intensity={a.lighting.rim.intensity * 0.45} />
      <group ref={follow} name="ambiance-coach">
        <mesh geometry={skyGeo} material={sky} renderOrder={-10} frustumCulled={false} raycast={() => null} />
        {layers.map((l) => (
          <mesh key={l.key} geometry={emblemGeo} position={[0, EMBLEM_BOTTOM + EMBLEM_H / 2, EMBLEM_Z]} renderOrder={-9} raycast={() => null}>
            <meshBasicMaterial
              ref={(m: MeshBasicMaterial | null) => {
                if (m) emblemMats.current.set(l.key, m);
              }}
              map={l.tex}
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
              fog={false}
            />
          </mesh>
        ))}
        {Array.from({ length: smokeN }, (_, i) => (
          <mesh
            key={i}
            ref={(m: Mesh | null) => {
              if (m) smokes.current[i] = m;
            }}
            geometry={smokeGeo}
            material={smokeMat}
            position={[0, 0.4, -1.4 - (i % 3) * 0.5]}
            renderOrder={-8}
            raycast={() => null}
          />
        ))}
      </group>
      <mesh geometry={floorGeo} material={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0005, 0]} renderOrder={-7} raycast={() => null} />
    </>
  );
}
