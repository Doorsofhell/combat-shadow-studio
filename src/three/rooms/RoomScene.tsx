import { Component, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  AmbientLight,
  BufferAttribute,
  DirectionalLight,
  BufferGeometry,
  DoubleSide,
  EquirectangularReflectionMapping,
  FileLoader,
  Group,
  ImageBitmapLoader,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PMREMGenerator,
  PlaneGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';
import { ROOM_EYE, ROOM_LAYER, ROOM_RADIUS, decodeDepth, roomDir, roomMesh, swingAngle, type RoomData, type RoomSpec } from './rooms';
import { LIFE, stutterAt, sweepAt, swayOf } from './life';
import { RoomDust } from './RoomDust';

/**
 * The room of a discipline around the coach (see rooms.ts): the photo-like panorama on a ground-projected dome, its
 * reflections on the coach, the lamps that breathe and the bags that swing. Only what is visible is drawn: one
 * picture, one small mask, a few cut-out bags; no extra light reaches the room itself.
 */
export function RoomScene({ spec, sharp, onShown }: { spec: RoomSpec; sharp: boolean; onShown?: (id: string) => void }) {
  const dir = roomDir(spec.id);
  const data = JSON.parse(useLoader(FileLoader, `${dir}salle.json`) as string) as RoomData;
  // a 512 copy of the picture lights the coach (prefiltered on the device: the light is soft anyway, and a bigger
  // copy costs much more to prefilter on a phone); the 4096 picture is only drawn when « Haute » is chosen
  const [pano, mask, env2k] = useLoader(TextureLoader, [`${dir}${sharp ? 'fond.webp' : 'fond-2k.webp'}`, `${dir}lumieres.webp`, `${dir}lumiere-coach.webp`]) as Texture[];
  const sprites = useLoader(TextureLoader, data.sprites.map((s) => `${dir}sprite-${s}.webp`)) as Texture[];
  // 1.25: the distances of what the picture shows, read exactly (no colour conversion)
  const depthPic = useLoader(ImageBitmapLoader, `${dir}profondeur.png`, (l) => (l as ImageBitmapLoader).setOptions({ imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' })) as ImageBitmap;
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  // 1.26 (Youssef, 2026-11-06: « on dirait que le coach flotte dans le vide »): the room is on its own layer, seen by
  // the camera but not by the floor shadow under the coach (ContactShadows renders layer 0 from below: the room's
  // walls, ring and cage filled it and the coach lost his shadow on the floor)
  useEffect(() => {
    camera.layers.enable(ROOM_LAYER);
    return () => camera.layers.disable(ROOM_LAYER);
  }, [camera]);

  const time = useRef({ value: 0 });
  const life = LIFE[spec.id];
  const lifeU = useRef({
    uStutterPos: { value: new Vector3(0, -99, 0) },
    uStutterDim: { value: 0 },
    uPoolN: { value: 0 },
    uPoolC: { value: Array.from({ length: 6 }, () => new Vector2()) },
    uPoolOff: { value: Array.from({ length: 6 }, () => new Vector2()) },
    uWinN: { value: 0 },
    uWinMin: { value: Array.from({ length: 4 }, () => new Vector3()) },
    uWinMax: { value: Array.from({ length: 4 }, () => new Vector3()) },
    uSweep: { value: new Vector3(0, 0, 0) },
    uSweepZ: { value: 0 },
    uCeil: { value: 99 },
  });
  useMemo(() => {
    const u = lifeU.current;
    const pools = life.pools ?? [];
    u.uPoolN.value = Math.min(6, pools.length);
    pools.slice(0, 6).forEach((p, i) => u.uPoolC.value[i].set(p.at[0], p.at[2]));
    const win = life.windows ?? [];
    u.uWinN.value = Math.min(4, win.length);
    win.slice(0, 4).forEach((w, i) => {
      u.uWinMin.value[i].set(...w.min);
      u.uWinMax.value[i].set(...w.max);
    });
    u.uCeil.value = life.sweep?.ceiling ?? 99;
    u.uSweepZ.value = life.sweep?.windowZ ?? 0;
  }, [life]);
  const sky = useMemo(() => {
    pano.colorSpace = SRGBColorSpace;
    pano.mapping = EquirectangularReflectionMapping;
    pano.anisotropy = 4;
    mask.minFilter = LinearFilter;
    const s = new GroundedSkybox(pano, ROOM_EYE, ROOM_RADIUS, 96);
    s.position.y = ROOM_EYE;
    // the panorama looks along +Y in Blender (-z in three.js), its centre is +x on the dome
    s.rotation.y = Math.PI / 2;
    s.renderOrder = -2;
    s.name = 'salle';
    const m = s.material as MeshBasicMaterial;
    m.fog = false;
    m.toneMapped = false;
    // the lamps breathe: the mask of what glows brightens and dims a little, each lamp at its own pace
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uMask = { value: mask };
      sh.uniforms.uTime = time.current;
      sh.uniforms.uFlicker = { value: spec.flicker };
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D uMask;\nuniform float uTime;\nuniform float uFlicker;')
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          {
            float lm = texture2D(uMask, vMapUv).r;
            vec2 cell = floor(vMapUv * vec2(48.0, 24.0));
            float h = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
            float br = sin(uTime * (0.7 + h * 0.9) + h * 40.0) * 0.5 + sin(uTime * (2.3 + h * 3.0) + h * 13.0) * 0.18;
            // now and then a short dip, like an old tube
            float dip = step(0.985, fract(sin(floor(uTime * 6.0 + h * 97.0) * 3.7 + h) * 9631.7)) * 0.35;
            diffuseColor.rgb *= 1.0 + lm * uFlicker * (0.1 * br - dip * step(0.6, h));
          }`,
        );
    };
    return s;
  }, [pano, mask, spec.flicker]);

  // 1.25: the dome only fills what the relief leaves (small gaps along edges): drawn after it at the far end of the
  // depth range, so the graphics chip skips it wherever the relief is already drawn (a phone draws the room once)
  const backdrop = useMemo(() => {
    const m = sky.material as MeshBasicMaterial;
    const base = m.onBeforeCompile;
    const far = m.clone();
    far.depthTest = true;
    far.depthWrite = false;
    far.onBeforeCompile = (sh, r) => {
      base.call(m, sh, r);
      sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  gl_Position.z = gl_Position.w;');
    };
    far.customProgramCacheKey = () => 'salle-fond-loin';
    const b = new Mesh(sky.geometry, far);
    b.position.copy(sky.position);
    b.rotation.copy(sky.rotation);
    b.renderOrder = -1;
    b.frustumCulled = false;
    b.name = 'salle-fond';
    b.layers.set(ROOM_LAYER);
    b.raycast = () => {};
    return b;
  }, [sky]);

  // 1.25: the room at its real size: the picture on a mesh pushed out to the distances (rooms.ts roomMesh); the dome
  // (backdrop) fills the small gaps along the edges
  const room = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = depthPic.width;
    c.height = depthPic.height;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(depthPic, 0, 0);
    const dp = decodeDepth(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
    const m = roomMesh(dp);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(m.pos, 3));
    g.setAttribute('uv', new BufferAttribute(m.uv, 2));
    g.setIndex(m.index);
    g.computeBoundingSphere();
    // its own material: it writes depth (the room hides itself where it should), same picture and breathing lamps
    const skyMat = sky.material as MeshBasicMaterial;
    const mat = new MeshBasicMaterial({ map: skyMat.map, side: DoubleSide, toneMapped: false, fog: false });
    // 1.26 salles vivantes (life.ts): what moves where it is in the room (the relief knows each point's place)
    const base = skyMat.onBeforeCompile;
    const u = lifeU.current;
    mat.onBeforeCompile = (sh, r) => {
      base.call(skyMat, sh, r);
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRoom;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vRoom = position;');
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', `${LIFE_GLSL}\nvoid main() {`).replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb = roomLife(diffuseColor.rgb, vRoom, texture2D(uMask, vMapUv).r);');
    };
    mat.customProgramCacheKey = () => 'salle-relief-vie';
    const mesh = new Mesh(g, mat);
    mesh.renderOrder = -2;
    mesh.frustumCulled = false;
    mesh.name = 'salle-relief';
    mesh.layers.set(ROOM_LAYER);
    mesh.raycast = () => {};
    return mesh;
  }, [depthPic, sky]);
  // the room is drawn first; then the depth is cleared so the coach is always drawn over it (a part of the room that
  // stands between the camera and the coach never hides him)
  const clear = useMemo(() => {
    const m = new Mesh(new PlaneGeometry(0.001, 0.001), new MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
    m.renderOrder = -0.5;
    m.frustumCulled = false;
    m.onBeforeRender = (r) => r.clearDepth();
    m.layers.set(ROOM_LAYER);
    m.raycast = () => {};
    return m;
  }, []);
  useEffect(
    () => () => {
      room.geometry.dispose();
      (backdrop.material as MeshBasicMaterial).dispose();
      (room.material as MeshBasicMaterial).dispose();
      clear.geometry.dispose();
      (clear.material as MeshBasicMaterial).dispose();
    },
    [room, clear, backdrop],
  );

  // the picture lights and reflects on the coach
  useEffect(() => {
    env2k.colorSpace = SRGBColorSpace;
    env2k.mapping = EquirectangularReflectionMapping;
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromEquirectangular(env2k);
    const prev = { env: scene.environment, k: scene.environmentIntensity };
    scene.environment = env.texture;
    scene.environmentIntensity = spec.env;
    return () => {
      scene.environment = prev.env;
      scene.environmentIntensity = prev.k;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, env2k, spec.env]);

  useEffect(
    () => () => {
      sky.geometry.dispose();
      (sky.material as MeshBasicMaterial).dispose();
    },
    [sky],
  );

  // probe for the end-to-end tests: which room is drawn, and how many bags swing
  useEffect(() => {
    const w = window as unknown as { __cssRoom?: object };
    w.__cssRoom = { id: spec.id, props: data.props.length, sharp, relief: (room.geometry.index?.count ?? 0) / 3 };
    return () => {
      if ((w.__cssRoom as { id?: string } | undefined)?.id === spec.id) w.__cssRoom = undefined;
    };
  }, [spec.id, data.props.length, sharp, room]);

  const bags = useRef<Group>(null);
  // 1.25.1 the coach is shown once the room has drawn its first image (CoachStage)
  const shown = useRef(false);
  const onShownRef = useRef(onShown);
  onShownRef.current = onShown;
  useFrame(({ camera }, dt) => {
    if (!shown.current) {
      shown.current = true;
      onShownRef.current?.(spec.id);
    }
    time.current.value += Math.min(dt, 0.1);
    {
      const t = time.current.value;
      const u = lifeU.current;
      const st = stutterAt(t, life.lamps.length, spec.id.length);
      if (st.lamp >= 0) u.uStutterPos.value.set(...life.lamps[st.lamp]);
      u.uStutterDim.value = st.dim;
      // the coach's lights dip with a lamp that stutters near him (within 6 m)
      const near = st.lamp >= 0 ? Math.hypot(life.lamps[st.lamp][0], life.lamps[st.lamp][2]) : 99;
      roomDip.value = st.dim * Math.max(0, 1 - near / 6) * 0.35;
      (life.pools ?? []).slice(0, 6).forEach((p, i) => {
        const [dx, dz] = swayOf(t, p.cable, i);
        // the shade swings with the bulb: the pool on the floor moves more than the lamp
        const k = 1 + p.at[1] / p.cable;
        u.uPoolOff.value[i].set(dx * k, dz * k);
      });
      if (life.sweep) {
        const sw = sweepAt(t);
        u.uSweep.value.set(sw.pos, sw.k, 0);
      }
    }
    const g = bags.current;
    if (!g) return;
    const t = time.current.value;
    for (let i = 0; i < g.children.length; i++) {
      const pivot = g.children[i];
      // turned towards the camera around the vertical (the bags are round), swinging in the picture's plane
      pivot.rotation.y = Math.atan2(camera.position.x - pivot.position.x, camera.position.z - pivot.position.z);
      const bag = pivot.children[0];
      bag.rotation.z = swingAngle(t, (pivot.userData.len as number) ?? 1.5, i + 1);
    }
  });

  const props = useMemo(
    () =>
      data.props.map((p, i) => {
        const tex = sprites[data.sprites.indexOf(p.sprite)];
        tex.colorSpace = SRGBColorSpace;
        return { key: `${p.sprite}-${i}`, p, tex };
      }),
    [data, sprites],
  );
  const plane = useMemo(() => new PlaneGeometry(1, 1), []);
  useEffect(() => () => plane.dispose(), [plane]);

  return (
    <>
      <primitive object={backdrop} />
      <primitive object={room} />
      <primitive object={clear} />
      <RoomDust color={life.dust} />
      <group ref={bags} name="salle-sacs">
        {props.map(({ key, p, tex }) => (
          // the pivot is the top of the picture (the chain's hold); the bag hangs below it
          <group key={key} position={[p.at[0], p.at[1] + p.h / 2, p.at[2]]} userData={{ len: p.h * 0.75 }}>
            <group>
              <mesh geometry={plane} position={[0, -p.h / 2, 0]} scale={[p.w, p.h, 1]} renderOrder={0} ref={noRaycast}>
                <meshBasicMaterial map={tex} transparent alphaTest={0.35} side={DoubleSide} toneMapped={false} fog={false} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </>
  );
}

/** the room's props never catch a tap (the camera drag goes through them) */
function noRaycast(m: Mesh | null) {
  if (!m) return;
  m.raycast = () => {};
  m.layers.set(ROOM_LAYER);
}

/** the coach's lights in a room: key, fill and rims of the room's own colours (see rooms.ts) */
export function RoomLights({ spec, shadows }: { spec: RoomSpec; shadows: boolean }) {
  // 1.26 a lamp that stutters close to the coach dims his lights a little with it (roomDip, set by RoomScene)
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const amb = useRef<AmbientLight>(null);
  useFrame(() => {
    const k = 1 - roomDip.value;
    if (key.current) key.current.intensity = spec.key.intensity * k;
    if (fill.current) fill.current.intensity = spec.fill.intensity * k;
    if (amb.current) amb.current.intensity = spec.ambient * k;
  });
  return (
    <>
      <ambientLight ref={amb} intensity={spec.ambient} />
      <hemisphereLight args={spec.hemi} />
      <directionalLight
        ref={key}
        position={spec.key.pos}
        intensity={spec.key.intensity}
        color={spec.key.color}
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
      <directionalLight ref={fill} position={spec.fill.pos} intensity={spec.fill.intensity} color={spec.fill.color} />
      <directionalLight position={spec.rim.pos} intensity={spec.rim.intensity} color={spec.rim.color} />
      {spec.rim2 && <directionalLight position={spec.rim2.pos} intensity={spec.rim2.intensity} color={spec.rim2.color} />}
    </>
  );
}

/**
 * A room that cannot load (first visit offline, a missing file) is left out: the coach stays on the plain stage and
 * the session goes on. The failure is written in the 3D journal once.
 */
export class RoomBoundary extends Component<{ children: ReactNode; onError?: (e: Error) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: Error) {
    this.props.onError?.(e);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** 1.26 how much the coach's lights dip with a lamp that stutters close to him (read by RoomLights) */
export const roomDip = { value: 0 };

/** 1.26 salles vivantes, in the relief's shader (life.ts): stutter, swaying pools, shadows on windows, headlights */
const LIFE_GLSL = `
varying vec3 vRoom;
uniform vec3 uStutterPos;
uniform float uStutterDim;
uniform int uPoolN;
uniform vec2 uPoolC[6];
uniform vec2 uPoolOff[6];
uniform int uWinN;
uniform vec3 uWinMin[4];
uniform vec3 uWinMax[4];
uniform vec3 uSweep;
uniform float uSweepZ;
uniform float uCeil;
float lhash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lhash(i), lhash(i + vec2(1.0, 0.0)), f.x), mix(lhash(i + vec2(0.0, 1.0)), lhash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float lfbm(vec2 p) { return lnoise(p) * 0.55 + lnoise(p * 2.03 + 7.1) * 0.3 + lnoise(p * 4.1 + 3.3) * 0.15; }
vec3 roomLife(vec3 col, vec3 p, float lm) {
  // a lamp that stutters: its glow dips (only the glowing pixels close to it)
  float nearLamp = 1.0 - smoothstep(0.6, 1.4, distance(p, uStutterPos));
  col *= 1.0 - lm * nearLamp * uStutterDim;
  // pools of light under hanging lamps sway with them (floor only)
  float floorK = 1.0 - smoothstep(0.03, 0.25, p.y);
  if (floorK > 0.0) {
    float d = 0.0;
    for (int i = 0; i < 6; i++) {
      if (i >= uPoolN) break;
      vec2 q = p.xz - uPoolC[i];
      d += exp(-dot(q - uPoolOff[i], q - uPoolOff[i]) / 1.6) - exp(-dot(q, q) / 1.6);
    }
    col *= 1.0 + floorK * 0.9 * d;
  }
  // shadows of branches swaying and clouds passing, on the windows and the paper screens
  for (int i = 0; i < 4; i++) {
    if (i >= uWinN) break;
    vec3 a = smoothstep(uWinMin[i], uWinMin[i] + 0.15, p) * (1.0 - smoothstep(uWinMax[i] - 0.15, uWinMax[i], p));
    float inside = a.x * a.y * a.z;
    if (inside > 0.0) {
      vec2 w = vec2(p.x + p.z, p.y);
      float sway = sin(uTime * 0.8 + w.x * 0.15) * 0.18 + sin(uTime * 1.9 + w.y) * 0.05;
      float leaves = smoothstep(0.52, 0.72, lfbm(w * 1.7 + vec2(sway, 0.0) + vec2(uTime * 0.015, 0.0)));
      float cloud = smoothstep(0.35, 0.8, lnoise(w * 0.12 + vec2(uTime * 0.05, 0.0)));
      col *= 1.0 - inside * (leaves * 0.42 + cloud * 0.25);
    }
  }
  // headlights of a passing car: through the windows, then across the ceiling
  if (uSweep.y > 0.0) {
    float zc = uSweepZ + uSweep.x * 24.0;
    float ceil = smoothstep(uCeil - 0.9, uCeil - 0.2, p.y);
    col += vec3(1.0, 0.9, 0.75) * exp(-pow((p.z - zc) / 1.4, 2.0)) * ceil * uSweep.y * 0.22;
    float win = step(p.z, uSweepZ + 0.1);
    col += vec3(1.0, 0.88, 0.7) * exp(-pow((p.x - (-8.0 + 16.0 * uSweep.x)) / 0.9, 2.0)) * win * uSweep.y * 0.35 * smoothstep(1.0, 1.6, p.y);
  }
  return col;
}
`;
