import { Component, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  BufferAttribute,
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
} from 'three';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';
import { ROOM_EYE, ROOM_RADIUS, decodeDepth, roomDir, roomMesh, swingAngle, type RoomData, type RoomSpec } from './rooms';

/**
 * The room of a discipline around the coach (see rooms.ts): the photo-like panorama on a ground-projected dome, its
 * reflections on the coach, the lamps that breathe and the bags that swing. Only what is visible is drawn: one
 * picture, one small mask, a few cut-out bags; no extra light reaches the room itself.
 */
export function RoomScene({ spec, sharp }: { spec: RoomSpec; sharp: boolean }) {
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

  const time = useRef({ value: 0 });
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
            diffuseColor.rgb *= 1.0 + lm * uFlicker * (0.07 * br - dip * step(0.6, h));
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
    mat.onBeforeCompile = skyMat.onBeforeCompile;
    const mesh = new Mesh(g, mat);
    mesh.renderOrder = -2;
    mesh.frustumCulled = false;
    mesh.name = 'salle-relief';
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
  useFrame(({ camera }, dt) => {
    time.current.value += Math.min(dt, 0.1);
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
  if (m) m.raycast = () => {};
}

/** the coach's lights in a room: key, fill and rims of the room's own colours (see rooms.ts) */
export function RoomLights({ spec, shadows }: { spec: RoomSpec; shadows: boolean }) {
  return (
    <>
      <ambientLight intensity={spec.ambient} />
      <hemisphereLight args={spec.hemi} />
      <directionalLight
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
      <directionalLight position={spec.fill.pos} intensity={spec.fill.intensity} color={spec.fill.color} />
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
