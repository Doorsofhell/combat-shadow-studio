/**
 * Teaching phases of a technique, measured on its animation (not timed by hand): the motion is
 * sampled from the start to its key position and each body segment that really moves (pivot of a
 * foot, hips, shoulders, change of level, step, the striking limb) becomes a phase, placed where
 * that segment does the bulk of its work. The phases are then ordered by time, so the lesson
 * follows the actual chain of the movement (e.g. rear foot, hips, shoulders, arm for a cross).
 */
import { Quaternion, Vector3 } from 'three';
import { MotionSampler, duration, type Motion } from './motion';
import type { ResolvedPose } from './pose';
import type { CoachRig } from './rig';
import { analyseMotion, type Effector, type StudyAnalysis } from './study';
import type { TechniqueCategory } from '../domain/types';

/** body parts a phase draws attention to (highlighted on the coach) */
export type BodyFocus = 'footL' | 'footR' | 'hips' | 'shoulders' | 'handL' | 'handR';

export type PhaseKind = 'depart' | 'arme' | 'appui' | 'niveau' | 'pas' | 'hanches' | 'epaules' | 'membre' | 'cle' | 'retour';

export interface TechniquePhase {
  kind: PhaseKind;
  label: string;
  /** short explanation shown and spoken during the phase */
  text: string;
  /** motion times (speed 1): the phase plays from t0 to t1 and stops on t1 */
  t0: number;
  t1: number;
  focus: BodyFocus[];
}

const SAMPLES = 48;
/** proximal to distal: order of segments whose work overlaps in time */
const CHAIN: PhaseKind[] = ['arme', 'pas', 'niveau', 'appui', 'hanches', 'epaules', 'membre'];
/** categories whose striking or defending limb gets its own phase */
const LIMB_CATEGORIES: TechniqueCategory[] = ['poing', 'pied', 'genou', 'coude', 'defense', 'feinte'];
const MAX_PHASES = 4;
const yawOf = (q: Quaternion) => {
  const f = new Vector3(0, 0, 1).applyQuaternion(q);
  return Math.atan2(f.x, f.z);
};
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const DEG = Math.PI / 180;

interface Signal {
  kind: PhaseKind;
  focus: BodyFocus[];
  /** amount of change from the start at each sample */
  values: number[];
  /** smallest change worth a phase */
  min: number;
  label: string;
  text: string;
}

/** window where a signal does its work: from 10 % to 90 % of its change before the key position */
function windowOf(values: number[], times: number[]) {
  const max = Math.max(...values);
  const at = (f: number) => times[values.findIndex((v) => v >= max * f)];
  return { max, t0: at(0.1), mid: at(0.5), t1: at(0.9) };
}

const limbName = (e: Effector, leadSide: 'L' | 'R') => {
  const lead = e.endsWith(leadSide);
  return e.startsWith('hand') ? (lead ? 'bras avant' : 'bras arrière') : lead ? 'jambe avant' : 'jambe arrière';
};

function limbPhase(category: TechniqueCategory, e: Effector, leadSide: 'L' | 'R', techniqueId: string): { label: string; text: string } {
  const limb = limbName(e, leadSide);
  const arc = /crochet|uppercut|overhand/.test(techniqueId);
  switch (category) {
    case 'poing':
      return arc
        ? { label: `Trajectoire du ${limb}`, text: `Le ${limb} suit sa courbe sans s'ouvrir : le coude reste à hauteur du poing.` }
        : { label: `Extension du ${limb}`, text: `Le ${limb} se tend en ligne droite, l'épaule vient protéger le menton.` };
    case 'pied':
      return { label: `Frappe de la ${limb}`, text: `La ${limb} monte puis frappe ; les bras restent en garde.` };
    case 'genou':
      return { label: 'Montée du genou', text: 'Le genou monte en poussant la hanche vers l’avant.' };
    case 'coude':
      return { label: 'Trajectoire du coude', text: 'Le coude passe près du corps, la main reste proche de la tête.' };
    case 'defense':
      return { label: 'Geste de défense', text: 'Le geste reste court : la garde se referme aussitôt.' };
    default:
      return { label: 'Mouvement principal', text: 'Observe la trajectoire du segment qui travaille.' };
  }
}

/**
 * Limb that does the work: named by the technique when it says so ("-avant", "-arriere", jab, direct),
 * otherwise the limb that moves the most. The displacement alone can be misleading: on a rear
 * uppercut the lead hand stays at the face and travels with the turning torso.
 */
function workingLimb(category: TechniqueCategory, id: string, leadSide: 'L' | 'R', fallback: Effector): Effector {
  const rear = leadSide === 'L' ? 'R' : 'L';
  const side = /-avant\b|^jab/.test(id) ? leadSide : /-arriere\b|^direct|^overhand/.test(id) ? rear : null;
  if (!side) return fallback;
  if (category === 'poing' || category === 'coude') return `hand${side}`;
  if (category === 'pied' || category === 'genou') return `foot${side}`;
  return fallback;
}

export function techniquePhases(rig: CoachRig, m: Motion, category: TechniqueCategory, techniqueId = '', analysis?: StudyAnalysis): TechniquePhase[] {
  const a = analysis ?? analyseMotion(rig, m);
  const s = new MotionSampler(rig, m);
  const dur = duration(m);
  const peak = Math.max(a.peak, 1e-3);
  const times = Array.from({ length: SAMPLES + 1 }, (_, i) => (peak * i) / SAMPLES);
  const poses: ResolvedPose[] = times.map((t) => s.sample(t));
  const p0 = poses[0];
  // the coach faces +Z: the lead foot is the one further forward
  const leadSide: 'L' | 'R' = p0.footL.ankle.z >= p0.footR.ankle.z ? 'L' : 'R';
  const rearSide = leadSide === 'L' ? 'R' : 'L';
  const shoulders = (p: ResolvedPose) => p.pelvis.clone().multiply(p.chest);

  const signals: Signal[] = [];
  for (const side of ['L', 'R'] as const) {
    const f0 = side === 'L' ? p0.footL : p0.footR;
    if (f0.ankle.y > 0.2) continue;
    const values = poses.map((p) => {
      const f = side === 'L' ? p.footL : p.footR;
      if (f.ankle.y > 0.2) return 0; // a lifted foot is the striking limb, not a pivot
      return Math.abs(wrap(yawOf(f.rot) - yawOf(f0.rot))) + Math.abs(f.heel - f0.heel);
    });
    const rear = side === rearSide;
    signals.push({
      kind: 'appui',
      focus: [side === 'L' ? 'footL' : 'footR'],
      values,
      min: 8 * DEG,
      label: rear ? 'Impulsion du pied arrière' : 'Pivot du pied avant',
      text: rear ? 'Le talon arrière se lève et tourne vers l’extérieur : la rotation part du sol.' : 'Le pied avant pivote sur la plante pour libérer la hanche.',
    });
  }
  signals.push({
    kind: 'niveau',
    focus: ['hips'],
    values: poses.map((p) => Math.max(0, p0.hips.y - p.hips.y)),
    min: 0.06,
    label: 'Changement de niveau',
    text: 'Les jambes fléchissent, le dos reste droit : on descend avec les genoux, pas avec la tête.',
  });
  signals.push({
    kind: 'pas',
    focus: ['footL', 'footR'],
    values: poses.map((p) => Math.hypot(p.hips.x - p0.hips.x, p.hips.z - p0.hips.z)),
    min: 0.12,
    label: 'Déplacement',
    text: 'Le poids passe d’un appui à l’autre sans croiser les pieds.',
  });
  // rotations count toward their final direction: turning the other way first is the loading ("armé")
  const hipTurn = poses.map((p) => wrap(yawOf(p.pelvis) - yawOf(p0.pelvis)));
  const hipDir = Math.sign(hipTurn[SAMPLES]) || 1;
  const load = Math.min(...hipTurn.map((v) => v * hipDir));
  signals.push({
    kind: 'hanches',
    focus: ['hips'],
    values: hipTurn.map((v) => Math.max(0, v * hipDir)),
    min: 10 * DEG,
    label: 'Rotation des hanches',
    text: 'Les hanches tournent et transmettent la force du sol vers le haut du corps.',
  });
  const sh0 = yawOf(shoulders(p0));
  signals.push({
    kind: 'epaules',
    focus: ['shoulders'],
    values: (() => {
      const turn = poses.map((p) => wrap(yawOf(shoulders(p)) - sh0));
      const dir = Math.sign(turn[SAMPLES]) || 1;
      return turn.map((v) => Math.max(0, v * dir));
    })(),
    min: 12 * DEG,
    label: 'Rotation des épaules',
    text: 'Les épaules suivent les hanches et amènent le bras.',
  });
  const effector = workingLimb(category, techniqueId, leadSide, a.effector);
  const eff = (p: ResolvedPose) => (effector === 'handL' ? p.handL.pos : effector === 'handR' ? p.handR.pos : effector === 'footL' ? p.footL.ankle : p.footR.ankle);
  const e0 = eff(p0).clone();
  if (LIMB_CATEGORIES.includes(category)) {
    // progress toward the key position, so that a wind-up (fist drawn back or to the side) is not counted as the strike
    const eKey = eff(poses[SAMPLES]).clone();
    const d0 = e0.distanceTo(eKey);
    signals.push({ kind: 'membre', focus: [effector], values: poses.map((p) => Math.max(0, d0 - eff(p).distanceTo(eKey))), min: 0.08, ...limbPhase(category, effector, leadSide, techniqueId) });
  }

  // loading: the hips first turn the other way by more than 5°
  const loading =
    load < -5 * DEG
      ? (() => {
          const v = hipTurn.map((x) => Math.max(0, -x * hipDir));
          const max = Math.max(...v);
          const t0 = times[v.findIndex((x) => x >= max * 0.1)];
          const t1 = times[v.indexOf(max)];
          return {
            kind: 'arme' as const,
            label: 'Armé',
            text: 'Le corps se charge en tournant un peu dans l’autre sens : c’est l’élan du coup.',
            t0,
            t1: Math.max(t0, t1),
            focus: ['hips', effector] as BodyFocus[],
          };
        })()
      : null;

  let moving = signals.map((sg) => ({ sg, w: windowOf(sg.values, times) })).filter(({ sg, w }) => w.max >= sg.min);
  // hips and shoulders turning together are one phase
  const hips = moving.find((x) => x.sg.kind === 'hanches');
  const sh = moving.find((x) => x.sg.kind === 'epaules');
  if (hips && sh && Math.abs(hips.w.mid - sh.w.mid) < 0.2 * peak) {
    hips.sg = { ...hips.sg, focus: ['hips', 'shoulders'], label: 'Rotation des hanches et des épaules', text: 'Hanches et épaules tournent ensemble et transmettent la force du sol vers le bras.' };
    hips.w = { ...hips.w, t0: Math.min(hips.w.t0, sh.w.t0), t1: Math.max(hips.w.t1, sh.w.t1) };
    moving = moving.filter((x) => x !== sh);
  }
  // keep the segments that change the most (relative to their threshold), the working limb always
  const limbEntry = moving.find((x) => x.sg.kind === 'membre');
  const others = moving.filter((x) => x !== limbEntry).sort((x, y) => y.w.max / y.sg.min - x.w.max / x.sg.min);
  moving = [...others.slice(0, MAX_PHASES - (limbEntry ? 1 : 0) - (loading ? 1 : 0)), ...(limbEntry ? [limbEntry] : [])];
  // in time order; segments working at the same moment (within 10 % of the motion) from the ground up
  const tie = 0.1 * peak;
  moving.sort((x, y) => (Math.abs(x.w.mid - y.w.mid) < tie ? CHAIN.indexOf(x.sg.kind) - CHAIN.indexOf(y.sg.kind) : x.w.mid - y.w.mid));

  const keyLabel = m.impacts.length && ['poing', 'pied', 'genou', 'coude'].includes(category) ? 'Impact' : 'Position clé';
  const phases: TechniquePhase[] = [
    { kind: 'depart', label: 'Position de départ', text: 'Observe la garde : écart des pieds, mains, menton.', t0: 0, t1: 0, focus: [] },
    ...(loading ? [loading] : []),
    ...moving.map(({ sg, w }) => ({ kind: sg.kind, label: sg.label, text: sg.text, t0: w.t0, t1: Math.max(w.t1, w.t0), focus: sg.focus })),
    { kind: 'cle', label: keyLabel, text: '', t0: peak, t1: peak, focus: [effector] },
  ];
  if (dur - peak > 0.05) phases.push({ kind: 'retour', label: 'Retour et rééquilibrage', text: 'Le segment revient par le même chemin et la garde se referme.', t0: peak, t1: dur, focus: [] });
  return phases;
}
