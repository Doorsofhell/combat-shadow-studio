import { Author, StanceOffsets, StanceStyle } from '../author';
import { Motion, mirrorMotion } from '../motion';
import type { CoachRig } from '../rig';
import { balanceKeys } from '../balance';
import { V230, v230Key } from '../v230';
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
  const key = `${profile ? `${style}:${profile.id}` : style}|${v230Key()}`;
  let lib = perRig.get(key);
  if (!lib) {
    const a = new Author(rig.metrics, rig.chestFrame.bind(rig), style, profile?.offsets);
    a.solvedShoulder = (p, side) => {
      rig.apply(rig.resolve(p));
      return rig.worldOf(side === 'L' ? 'LeftArm' : 'RightArm')!;
    };
    lib = new Map();
    for (const built of buildAll(a)) {
      const m = V230.snap ? snapImpactHold(built) : built;
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

/**
 * 2.3.0 (snap): the impact pose was held 30 to 40 ms after having arrived at full speed (an identical key right after
 * the impact). With the slowing down of the last centimetres the fist or the elbow stood still 60 to 110 ms around the
 * impact (docs/v230/audit/avant.json, « freeze »): a dead stop that reads as a pause. The hold key is removed: the
 * return to guard starts from rest at the impact (its ease starts at zero speed), so the extension is still read, for
 * an instant. Not applied to the knees (tried: the earlier return put the shin into the other leg, intrusions.test), to
 * the teep's push or to the defences' holds, which are part of the technique. Nor to the blows to the body (hooks, jab and direct): the legs
 * and the pelvis lead the arm by 50 ms (motion.ts, chain), so without the hold they were already turning back at the
 * impact and opened the elbow past 95° (hooks-biomeca.test); a blow that sinks keeps its short hold.
 */
const SNAPPED = /^(jab|direct|crochet|uppercut|overhand|coude|front-kick)/;

export function snapImpactHold(m: Motion): Motion {
  if (!SNAPPED.test(m.id) || /-corps$/.test(m.id) || !m.impacts.length) return m;
  const i = m.keys.findIndex((k, j) => j > 0 && k.pose === m.keys[j - 1].pose && k.ease === 'linear' && Math.abs(m.keys[j - 1].t - m.impacts[0]) < 1e-6);
  if (i < 0 || i === m.keys.length - 1) return m;
  const cut = m.keys[i].t - m.keys[i - 1].t;
  const keys = m.keys.filter((_, j) => j !== i).map((k, j) => (j >= i ? { ...k, t: k.t - cut } : k));
  return { ...m, keys, chainAt: m.chainAt !== undefined ? m.chainAt - cut : undefined };
}

function buildAll(a: Author): Motion[] {
  return [...boxingMotions(a), ...legMotions(a), ...upperMotions(a), ...mmaMotions(a), ...grapplingMotions(a)];
}
