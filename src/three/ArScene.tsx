/// <reference types="webxr" />
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, Group, Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry, Quaternion, RingGeometry, Vector3 } from 'three';
import type { ArBridge } from '../ar/ArBridge';

const tmpM = new Matrix4();
const tmpP = new Vector3();
const tmpQ = new Quaternion();
const tmpS = new Vector3();

/** soft round shadow texture, drawn once */
function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

/**
 * Augmented reality layer: lights, the floor reticle from the hit test, and the placement of the
 * coach group (anchored when the device supports anchors). The coach itself and its animation
 * player are the same objects as in the classic view; only where they stand changes.
 */
export function ArScene({ bridge, active, coachGroup, follow }: { bridge: ArBridge; active: boolean; coachGroup: { current: Group | null }; follow: { current: Vector3 } }) {
  const { gl } = useThree();
  const reticle = useRef<Mesh>(null);
  const shadow = useRef<Mesh>(null);
  const base = useRef({ pos: new Vector3(), yaw: 0, has: false });
  const lastFloor = useRef<number | null>(null);
  const ring = useMemo(() => new RingGeometry(0.16, 0.2, 40).rotateX(-Math.PI / 2), []);
  const blob = useMemo(blobTexture, []);

  useEffect(() => {
    bridge.gl = gl;
    return () => {
      void bridge.stop();
      bridge.gl = null;
    };
  }, [bridge, gl]);

  useFrame((_s, _dt, frame?: XRFrame) => {
    const group = coachGroup.current;
    const ref = bridge.refSpace;
    const v = bridge.view;
    if (!group || !frame || !ref || !bridge.session) return;

    // floor under the centre of the screen
    const hits = bridge.hitSource ? frame.getHitTestResults(bridge.hitSource) : [];
    const hit = hits[0];
    const hitPose = hit?.getPose(ref);
    const viewer = frame.getViewerPose(ref);
    if (reticle.current) {
      reticle.current.visible = !!hitPose && v.state === 'scanning';
      if (hitPose) {
        tmpM.fromArray(hitPose.transform.matrix).decompose(tmpP, tmpQ, tmpS);
        reticle.current.position.copy(tmpP);
        lastFloor.current = tmpP.y;
      }
    }
    if (!!hitPose !== v.surface) bridge.set({ surface: !!hitPose });

    const facing = (p: Vector3) => {
      const c = viewer?.transform.position;
      return c ? Math.atan2(c.x - p.x, c.z - p.z) : 0;
    };

    if (bridge.placeRequested && hitPose && v.state === 'scanning') {
      bridge.placeRequested = false;
      base.current.pos.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z);
      base.current.yaw = facing(base.current.pos);
      base.current.has = true;
      bridge.dropAnchor();
      const create = (hit as XRHitTestResult & { createAnchor?: () => Promise<XRAnchor> }).createAnchor;
      if (create) {
        create
          .call(hit)
          .then((a) => {
            if (bridge.session && bridge.view.state === 'placed') {
              bridge.anchor = a;
              bridge.set({ anchored: true });
            } else a.delete();
          })
          .catch(() => undefined);
      }
      bridge.set({ state: 'placed' });
    }

    if (bridge.recenterRequested && viewer) {
      bridge.recenterRequested = false;
      const t = viewer.transform;
      tmpQ.set(t.orientation.x, t.orientation.y, t.orientation.z, t.orientation.w);
      const fwd = new Vector3(0, 0, -1).applyQuaternion(tmpQ);
      fwd.y = 0;
      if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1);
      fwd.normalize().multiplyScalar(2.2 * Math.max(0.5, v.scale));
      const floor = lastFloor.current ?? (base.current.has ? base.current.pos.y : t.position.y - 1.4);
      base.current.pos.set(t.position.x + fwd.x, floor, t.position.z + fwd.z);
      base.current.yaw = facing(base.current.pos);
      base.current.has = true;
      bridge.dropAnchor();
      bridge.set({ state: 'placed' });
    }

    // the anchor follows the real floor as tracking improves
    if (bridge.anchor) {
      const ap = frame.getPose(bridge.anchor.anchorSpace, ref);
      if (ap) base.current.pos.set(ap.transform.position.x, ap.transform.position.y, ap.transform.position.z);
    }

    const placed = v.state === 'placed' && base.current.has;
    group.visible = placed;
    group.position.copy(base.current.pos);
    group.rotation.set(0, base.current.yaw + (v.yaw * Math.PI) / 180, 0);
    group.scale.setScalar(v.scale);
    if (shadow.current) {
      shadow.current.visible = placed;
      shadow.current.position.set(follow.current.x, 0.003, follow.current.z);
    }
  });

  return (
    <>
      {active && (
        <>
          <hemisphereLight args={['#ffffff', '#b8b2aa', 1.0]} />
          <directionalLight position={[2.2, 4.2, 3.2]} intensity={2.0} />
          <directionalLight position={[-3, 2.5, 1.5]} intensity={0.7} color="#f3f6ff" />
        </>
      )}
      <mesh ref={reticle} geometry={ring} visible={false}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      {/* shadow lives in the coach group so it follows placement, size and rotation */}
      <ShadowPortal group={coachGroup} shadow={shadow} texture={blob} />
    </>
  );
}

function ShadowPortal({ group, shadow, texture }: { group: { current: Group | null }; shadow: { current: Mesh | null }; texture: CanvasTexture }) {
  const mesh = useMemo(() => {
    const m = new Mesh(new PlaneGeometry(0.9, 0.9).rotateX(-Math.PI / 2), new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    m.renderOrder = -1;
    m.visible = false;
    return m;
  }, [texture]);
  useEffect(() => {
    const g = group.current;
    if (!g) return;
    g.add(mesh);
    shadow.current = mesh;
    return () => {
      g.remove(mesh);
      shadow.current = null;
    };
  }, [group, mesh, shadow]);
  return null;
}
