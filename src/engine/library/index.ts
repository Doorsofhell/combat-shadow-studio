import { Author, StanceOffsets, StanceStyle } from '../author';
import { Motion, mirrorMotion } from '../motion';
import type { CoachRig } from '../rig';
import { balanceKeys } from '../balance';
import { boxingMotions } from './boxing';
import { legMotions } from './legs';
import { mmaMotions } from './mma';
import { grapplingMotions } from './grappling';
import { upperMotions } from './upper';
import { illustrationMotions, duoScenes } from './illustrations';

export type MotionLibrary = Map<string, Motion>;

const cache = new WeakMap<CoachRig, Map<string, MotionLibrary>>();

/** All motions of a stance style for one coach (orthodox ids, plus "ids@gaucher" mirrored on demand). */
export function getLibrary(rig: CoachRig, style: StanceStyle, profile?: { id: string; offsets: StanceOffsets }): MotionLibrary {
  let perRig = cache.get(rig);
  if (!perRig) cache.set(rig, (perRig = new Map()));
  const key = profile ? `${style}:${profile.id}` : style;
  let lib = perRig.get(key);
  if (!lib) {
    const a = new Author(rig.metrics, rig.chestFrame.bind(rig), style, profile?.offsets);
    a.solvedShoulder = (p, side) => {
      rig.apply(rig.resolve(p));
      return rig.worldOf(side === 'L' ? 'LeftArm' : 'RightArm')!;
    };
    lib = new Map();
    for (const m of buildAll(a)) {
      // joint safety on every key pose: no elbow folded beyond its natural range
      for (const k of m.keys) a.openElbows(k.pose);
      if (m.balance) balanceKeys(rig, m);
      lib.set(m.id, m);
    }
    perRig.set(key, lib);
  }
  return lib;
}

/**
 * 1.3.2 A pose of the encyclopedia illustrations (illustrations.ts), built on demand for the Lab view: never part of
 * the library of techniques. Same joint safety as the techniques.
 */
export function getIllustration(rig: CoachRig, style: StanceStyle, id: string, profile?: { id: string; offsets: StanceOffsets }): Motion | undefined {
  const a = new Author(rig.metrics, rig.chestFrame.bind(rig), style, profile?.offsets);
  a.solvedShoulder = (p, side) => {
    rig.apply(rig.resolve(p));
    return rig.worldOf(side === 'L' ? 'LeftArm' : 'RightArm')!;
  };
  const m = illustrationMotions(a).find((x) => x.id === id);
  if (m) for (const k of m.keys) a.openElbows(k.pose);
  return m;
}

/**
 * 1.4.1 A scene of the encyclopedia with two coaches (illustrations.ts): A and B each get their own motion and their
 * place in the scene. Built for the Lab view only.
 */
export function getDuo(rigA: CoachRig, rigB: CoachRig, style: StanceStyle, id: string) {
  const author = (rig: CoachRig) => {
    const a = new Author(rig.metrics, rig.chestFrame.bind(rig), style);
    a.solvedShoulder = (p, side) => {
      rig.apply(rig.resolve(p));
      return rig.worldOf(side === 'L' ? 'LeftArm' : 'RightArm')!;
    };
    return a;
  };
  const a = author(rigA);
  const b = author(rigB);
  const d = duoScenes(a, b).find((x) => x.id === id);
  if (!d) return undefined;
  for (const k of d.a.keys) a.openElbows(k.pose);
  for (const k of d.b.keys) b.openElbows(k.pose);
  return d;
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
