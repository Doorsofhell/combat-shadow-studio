import { Author, StanceStyle } from '../author';
import { Motion, mirrorMotion } from '../motion';
import type { CoachRig } from '../rig';
import { boxingMotions } from './boxing';
import { legMotions } from './legs';
import { mmaMotions } from './mma';
import { grapplingMotions } from './grappling';
import { upperMotions } from './upper';

export type MotionLibrary = Map<string, Motion>;

const cache = new WeakMap<CoachRig, Map<StanceStyle, MotionLibrary>>();

/** All motions of a stance style for one coach (orthodox ids, plus "ids@gaucher" mirrored on demand). */
export function getLibrary(rig: CoachRig, style: StanceStyle): MotionLibrary {
  let perRig = cache.get(rig);
  if (!perRig) cache.set(rig, (perRig = new Map()));
  let lib = perRig.get(style);
  if (!lib) {
    const a = new Author(rig.metrics, rig.chestFrame.bind(rig), style);
    lib = new Map();
    for (const m of buildAll(a)) {
      // joint safety on every key pose: no elbow folded beyond its natural range
      for (const k of m.keys) a.openElbows(k.pose);
      lib.set(m.id, m);
    }
    perRig.set(style, lib);
  }
  return lib;
}

export function getMotion(lib: MotionLibrary, id: string, southpaw: boolean): Motion | undefined {
  if (!southpaw) return lib.get(id);
  const key = `${id}@gaucher`;
  let m = lib.get(key);
  if (!m) {
    const base = lib.get(id);
    if (!base) return undefined;
    m = { ...mirrorMotion(base), id: key };
    lib.set(key, m);
  }
  return m;
}

function buildAll(a: Author): Motion[] {
  return [...boxingMotions(a), ...legMotions(a), ...upperMotions(a), ...mmaMotions(a), ...grapplingMotions(a)];
}
