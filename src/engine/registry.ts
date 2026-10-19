/**
 * Animation registry: the state of each technique's animation, from automatic checks run on the real
 * coach skeleton. A technique is "validée" only when an expert has reviewed it (EXPERT_VALIDATED);
 * passing the checks makes it "contrôlée", which says what was measured and nothing more.
 * The registry is written to docs/ANIMATIONS.md and src/domain/animationStatus.json by
 * `UPDATE_REGISTRY=1 npx vitest run src/engine/__tests__/registry.test.ts`, and a test fails when
 * they are out of date.
 */
import { Vector3 } from 'three';
import { CoachRig, ELBOW_MAX_FLEX, KNEE_MAX_FLEX } from './rig';
import { getLibrary, getMotion } from './library';
import { MotionSampler, duration } from './motion';
import { techniquePhases } from './phases';
import type { StanceStyle } from './author';
import { TECHNIQUES } from '../domain/techniques';
import { PARTNER_TECHNIQUES } from '../domain/partner';
import type { DisciplineId, Technique } from '../domain/types';

import { STATUS_LABEL, type AnimationStatus } from '../domain/animationStatus';

export type { AnimationStatus };
export { STATUS_LABEL };
export type CheckResult = 'reussi' | 'echoue' | 'non-applicable';

export const CHECK_LABEL = {
  disponible: 'Présente dans chaque discipline, dans les deux gardes',
  amplitude: 'Coudes et genoux dans leur amplitude naturelle',
  appui: 'Pied d’appui fixe (pas de glissement)',
  continuite: 'Mouvement continu (pas de saut de pose)',
  chaine: 'Le membre arrive en fin de rotation des hanches',
  impact: 'Le coup accélère et touche en vitesse (au moins 25 % de sa vitesse de pointe)',
  vitesse: 'Vitesse de pointe plausible (poing ≤ 12 m/s, pied ≤ 26 m/s)',
} as const;
export type CheckId = keyof typeof CHECK_LABEL;

/** reviews by a qualified coach: technique id -> who and when. None so far. */
export const EXPERT_VALIDATED: Record<string, { by: string; date: string }> = {};

export interface RegistryRow {
  id: string;
  name: string;
  disciplines: DisciplineId[];
  status: AnimationStatus;
  checks: Partial<Record<CheckId, CheckResult>>;
  /** measured values behind failed checks, in plain words */
  notes: string[];
}

/** categories where a standing foot must stay put; steps, wrestling, ground work and throws move the feet on purpose */
const STANDING = new Set(['garde', 'poing', 'pied', 'genou', 'coude', 'defense', 'feinte', 'clinch']);
const STRIKES = new Set(['poing', 'pied', 'genou', 'coude']);
const bend = (a: Vector3, b: Vector3, c: Vector3) => b.clone().sub(a).angleTo(c.clone().sub(b));

function styleOf(d: DisciplineId): StanceStyle {
  return d === 'boxe' ? 'boxing' : d === 'kickboxing' ? 'kickboxing' : d === 'muaythai' ? 'muaythai' : d === 'mma' ? 'mma' : d === 'bjj' ? 'bjj' : 'judo';
}

export function checkTechnique(rig: CoachRig, t: Technique): RegistryRow {
  const notes: string[] = [];
  const checks: RegistryRow['checks'] = {};
  const motions = t.disciplines.flatMap((d) => [false, true].map((sp) => getMotion(getLibrary(rig, styleOf(d)), t.motion, sp)));
  const base = { id: t.id, name: t.name, disciplines: t.disciplines };
  if (motions.some((m) => !m)) return { ...base, status: 'manquante', checks: { disponible: 'echoue' }, notes: ['animation absente dans au moins une discipline ou une garde'] };
  checks.disponible = 'reussi';
  const m = motions[0]!;
  const s = new MotionSampler(rig, m);
  const dur = duration(m);

  // joint range, both guards
  let worst = 0;
  for (const mm of motions.slice(0, 2)) {
    const ss = new MotionSampler(rig, mm!);
    for (let i = 0; i <= 24; i++) {
      rig.apply(ss.sample((dur * i) / 24));
      for (const side of ['Left', 'Right']) {
        worst = Math.max(worst, bend(rig.worldOf(`${side}Arm`)!, rig.worldOf(`${side}ForeArm`)!, rig.worldOf(`${side}Hand`)!) - ELBOW_MAX_FLEX);
        worst = Math.max(worst, bend(rig.worldOf(`${side}UpLeg`)!, rig.worldOf(`${side}Leg`)!, rig.worldOf(`${side}Foot`)!) - KNEE_MAX_FLEX);
      }
    }
  }
  checks.amplitude = worst <= (0.5 * Math.PI) / 180 ? 'reussi' : 'echoue';
  if (checks.amplitude === 'echoue') notes.push(`articulation au-delà de sa limite de ${((worst * 180) / Math.PI).toFixed(1)}°`);

  // a foot that never leaves the floor must not slide
  if (STANDING.has(t.category)) {
    let slide = 0;
    for (const toe of ['LeftToeBase', 'RightToeBase']) {
      const pts: Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        rig.apply(s.sample((dur * i) / 40));
        pts.push(rig.worldOf(toe)!.clone());
      }
      if (pts.some((p) => p.y > rig.metrics.ballRestY + 0.02)) continue; // this foot lifts: it is the one that works
      slide = Math.max(slide, ...pts.map((p) => Math.hypot(p.x - pts[0].x, p.z - pts[0].z)));
    }
    checks.appui = slide < 0.015 ? 'reussi' : 'echoue';
    if (checks.appui === 'echoue') notes.push(`pied d’appui qui glisse de ${(slide * 100).toFixed(1)} cm`);
  } else checks.appui = 'non-applicable';

  // no jump between two frames at 60 fps (15 m/s)
  let jump = 0;
  let prev = s.sample(0);
  for (let f = 1; f <= Math.ceil(dur * 60); f++) {
    const cur = s.sample(Math.min(dur, f / 60));
    jump = Math.max(jump, cur.hips.distanceTo(prev.hips), cur.handL.pos.distanceTo(prev.handL.pos), cur.handR.pos.distanceTo(prev.handR.pos));
    prev = cur;
  }
  checks.continuite = jump < 0.25 ? 'reussi' : 'echoue';
  if (checks.continuite === 'echoue') notes.push(`saut de ${(jump * 100).toFixed(0)} cm entre deux images`);

  // kinetic chain on strikes: the limb completes its path at or after the end of the hip turn
  if (STRIKES.has(t.category)) {
    const ph = techniquePhases(rig, m, t.category, t.id);
    const limb = ph.find((p) => p.kind === 'membre');
    const hips = ph.find((p) => p.kind === 'hanches');
    if (limb && hips) {
      checks.chaine = limb.t1 >= hips.t1 - 0.02 ? 'reussi' : 'echoue';
      if (checks.chaine === 'echoue') notes.push(`membre arrivé à ${limb.t1.toFixed(2)} s, hanches à ${hips.t1.toFixed(2)} s`);
    } else checks.chaine = 'non-applicable';
  } else checks.chaine = 'non-applicable';

  // speed of the striking limb: it accelerates into the target and stays within human orders of magnitude
  if (STRIKES.has(t.category) && m.impacts.length) {
    const key = techniquePhases(rig, m, t.category, t.id).find((p) => p.kind === 'cle')!.focus[0];
    const at = (x: number) => {
      const p = s.sample(x);
      return key === 'handL' ? p.handL.pos : key === 'handR' ? p.handR.pos : key === 'footL' ? p.footL.ankle : p.footR.ankle;
    };
    const imp = m.impacts[0];
    const dt = 1 / 240;
    let peak = 0;
    for (let x = 0; x + dt <= imp; x += dt) peak = Math.max(peak, at(x + dt).distanceTo(at(x)) / dt);
    const vImp = at(imp).distanceTo(at(imp - dt)) / dt;
    checks.impact = vImp >= 0.25 * peak ? 'reussi' : 'echoue';
    if (checks.impact === 'echoue') notes.push(`touche à ${vImp.toFixed(1)} m/s pour un pic de ${peak.toFixed(1)} m/s`);
    const max = key.startsWith('hand') ? 12 : 26;
    checks.vitesse = peak <= max ? 'reussi' : 'echoue';
    if (checks.vitesse === 'echoue') notes.push(`pic de ${peak.toFixed(1)} m/s`);
  } else {
    checks.impact = 'non-applicable';
    checks.vitesse = 'non-applicable';
  }

  const failed = Object.values(checks).includes('echoue');
  const status: AnimationStatus = failed ? 'a-corriger' : EXPERT_VALIDATED[t.id] ? 'validee' : 'controlee';
  return { ...base, status, checks, notes };
}

export function buildRegistry(rig: CoachRig): RegistryRow[] {
  const rows = TECHNIQUES.filter((t) => t.mode !== 'partenaire').map((t) => checkTechnique(rig, t));
  // partner techniques: a sheet exists, the two-person animation does not yet
  for (const p of PARTNER_TECHNIQUES)
    rows.push({
      id: p.id,
      name: p.name,
      disciplines: [p.discipline],
      status: 'non-implementee',
      checks: {},
      notes: ['fiche avec partenaire réel ; démonstration à deux personnages pas encore animée'],
    });
  return rows;
}

const RESULT_MARK: Record<CheckResult, string> = { reussi: 'oui', echoue: '**NON**', 'non-applicable': '–' };

export function registryMarkdown(rows: RegistryRow[]): string {
  const count = (st: AnimationStatus) => rows.filter((r) => r.status === st).length;
  const ids = Object.keys(CHECK_LABEL) as CheckId[];
  const lines = [
    '# Registre des animations',
    '',
    'Généré par `UPDATE_REGISTRY=1 npx vitest run src/engine/__tests__/registry.test.ts` (contrôles sur le squelette réel du coach homme). Ne pas modifier à la main.',
    '',
    '- **Validée par un expert** : revue par un entraîneur qualifié. Aucune pour l’instant.',
    '- **Contrôlée automatiquement** : tous les contrôles applicables sont réussis. Cela ne remplace pas une validation par un expert.',
    '- **À corriger** : au moins un contrôle échoue (détail dans la colonne Notes).',
    '- **Non implémentée** : fiche avec partenaire réel, sans animation à deux personnages.',
    '',
    `Bilan : ${count('validee')} validée(s), ${count('controlee')} contrôlée(s), ${count('a-corriger')} à corriger, ${count('manquante')} manquante(s), ${count('non-implementee')} non implémentée(s).`,
    '',
    'Contrôles : ' + ids.map((c, i) => `${i + 1}. ${CHECK_LABEL[c]}`).join(' ; ') + '.',
    '',
    `| Technique | Disciplines | Statut | ${ids.map((_, i) => `C${i + 1}`).join(' | ')} | Notes |`,
    `|---|---|---|${ids.map(() => '---').join('|')}|---|`,
    ...rows.map(
      (r) =>
        `| ${r.name} (\`${r.id}\`) | ${r.disciplines.join(', ')} | ${STATUS_LABEL[r.status]} | ${ids.map((c) => (r.checks[c] ? RESULT_MARK[r.checks[c]!] : '–')).join(' | ')} | ${r.notes.join(' ; ')} |`,
    ),
    '',
  ];
  return lines.join('\n');
}
