import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig, ELBOW_MAX_FLEX, KNEE_MAX_FLEX } from '../rig';
import { getLibrary, getMotion } from '../library';
import { MotionSampler, duration } from '../motion';
import { ComboPlayer } from '../player';
import type { StanceStyle } from '../author';
import { TECHNIQUES } from '../../domain/techniques';
import { STYLE_OF } from '../../three/CoachStage';
import type { CoachId } from '../../domain/types';

const rigs: Record<CoachId, CoachRig> = { homme: new CoachRig(loadSkeleton('homme')), femme: new CoachRig(loadSkeleton('femme')) };
const STYLES: StanceStyle[] = ['boxing', 'kickboxing', 'mma', 'muaythai'];

describe('coachs 3D', () => {
  test.each(['homme', 'femme'] as const)('%s : proportions réalistes', (c) => {
    const m = rigs[c].metrics;
    expect(m.height).toBeGreaterThan(1.6);
    expect(m.height).toBeLessThan(1.95);
    expect(m.thigh / m.height).toBeGreaterThan(0.22);
    expect(m.thigh / m.height).toBeLessThan(0.28);
  });
});

describe('bibliothèque d’animations', () => {
  test('chaque technique a son animation dans chaque discipline, en garde orthodoxe et gaucher', () => {
    const rig = rigs.homme;
    for (const t of TECHNIQUES) {
      for (const d of t.disciplines) {
        const lib = getLibrary(rig, STYLE_OF[d]);
        expect(getMotion(lib, t.motion, false), `${t.id} / ${d}`).toBeDefined();
        expect(getMotion(lib, t.motion, true), `${t.id} / ${d} gaucher`).toBeDefined();
      }
    }
  });

  test('les mains et les chevilles atteignent leurs cibles (cinématique inverse)', () => {
    for (const c of ['homme', 'femme'] as const) {
      const rig = rigs[c];
      const m = rig.metrics;
      for (const style of STYLES) {
        for (const motion of getLibrary(rig, style).values()) {
          const s = new MotionSampler(rig, motion);
          for (let i = 0; i <= 6; i++) {
            const pose = s.sample((duration(motion) * i) / 6);
            rig.apply(pose);
            for (const [bone, target, reach] of [
              ['LeftHand', pose.handL.pos, m.upperArm + m.foreArm],
              ['RightHand', pose.handR.pos, m.upperArm + m.foreArm],
              ['LeftFoot', pose.footL.ankle, m.thigh + m.shin],
              ['RightFoot', pose.footR.ankle, m.thigh + m.shin],
            ] as const) {
              const root = bone.includes('Hand') ? rig.worldOf(bone.startsWith('Left') ? 'LeftArm' : 'RightArm')! : rig.worldOf(bone.startsWith('Left') ? 'LeftUpLeg' : 'RightUpLeg')!;
              // a planted heel lifted by the floor rule (dorsiflexion past its range): the ankle rises about
              // the ball on purpose, the lift is checked against the range in ankle-range.test.ts; a foot authored
              // into the mat is lifted out of it (1.8.0, measured on the skin in floor-contact.test.ts)
              // and a hand posted on the mat is held at the height of the palm or of the knuckles
              const lifted = (bone.includes('Foot') ? rig.footAim : rig.handAim)[bone.startsWith('Left') ? 'L' : 'R'];
              const aim = lifted ?? target;
              if (root.distanceTo(aim) > reach * 0.985) continue; // out of reach: the limb is straightened
              // closer than the joint allows: the elbow / knee limit holds the hand or foot short of
              // its target on purpose (anatomical limit, see the test below)
              const hand = bone.includes('Hand');
              const a = hand ? m.upperArm : m.thigh;
              const b = hand ? m.foreArm : m.shin;
              const flex = hand ? ELBOW_MAX_FLEX : KNEE_MAX_FLEX;
              if (root.distanceTo(aim) < Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(flex)) * 1.05) continue;
              const err = rig.worldOf(bone)!.distanceTo(aim);
              expect(err, `${c} ${style} ${motion.id} t${i} ${bone}`).toBeLessThan(0.02);
            }
          }
        }
      }
    }
  });

  test('pas de glissement : le pied d’appui reste fixe pendant les frappes et les pivots', () => {
    const rig = rigs.homme;
    const cases: [StanceStyle, string, 'LeftToeBase' | 'RightToeBase'][] = [
      ['boxing', 'jab', 'RightToeBase'],
      ['boxing', 'direct', 'LeftToeBase'],
      ['boxing', 'crochet-avant', 'RightToeBase'],
      ['kickboxing', 'middle-kick-arriere', 'LeftToeBase'],
      ['muaythai', 'teep-avant', 'RightToeBase'],
      ['boxing', 'pivot-droite', 'LeftToeBase'],
    ];
    for (const [style, id, toe] of cases) {
      const motion = getLibrary(rig, style).get(id)!;
      const s = new MotionSampler(rig, motion);
      const pts: Vector3[] = [];
      for (let i = 0; i <= 20; i++) {
        rig.apply(s.sample((duration(motion) * i) / 20));
        pts.push(rig.worldOf(toe)!);
      }
      const spread = Math.max(...pts.map((p) => Math.hypot(p.x - pts[0].x, p.z - pts[0].z)));
      expect(spread, `${style} ${id}`).toBeLessThan(0.015);
      for (const p of pts) expect(p.y, `${style} ${id} hauteur`).toBeLessThan(rig.metrics.ballRestY + 0.02);
    }
  });

  test('garde gaucher : le jab part de la main droite', () => {
    const rig = rigs.femme;
    const lib = getLibrary(rig, 'boxing');
    const ortho = new MotionSampler(rig, getMotion(lib, 'jab', false)!);
    const lefty = new MotionSampler(rig, getMotion(lib, 'jab', true)!);
    const imp = ortho.motion.impacts[0];
    const a = ortho.sample(imp);
    const b = lefty.sample(imp);
    expect(a.handL.pos.z).toBeGreaterThan(a.handR.pos.z + 0.2);
    expect(b.handR.pos.z).toBeGreaterThan(b.handL.pos.z + 0.2);
    expect(b.handR.pos.x).toBeCloseTo(-a.handL.pos.x, 3);
  });
});

/** angle between two segments, in degrees (0 = straight) */
const bendDeg = (a: Vector3, b: Vector3, c: Vector3) => (b.clone().sub(a).angleTo(c.clone().sub(b)) * 180) / Math.PI;

describe('biomécanique', () => {
  test.each(['homme', 'femme'] as const)('%s : aucun coude ni genou plié au-delà de son amplitude naturelle, dans aucune animation', (c) => {
    const rig = rigs[c];
    const elbowMax = (ELBOW_MAX_FLEX * 180) / Math.PI + 0.5;
    const kneeMax = (KNEE_MAX_FLEX * 180) / Math.PI + 0.5;
    for (const style of STYLES)
      for (const southpaw of [false, true])
        for (const id of getLibrary(rig, style).keys()) {
          if (id.includes('@')) continue;
          const motion = getMotion(getLibrary(rig, style), id, southpaw)!;
          const s = new MotionSampler(rig, motion);
          for (let i = 0; i <= 24; i++) {
            rig.apply(s.sample((duration(motion) * i) / 24));
            for (const side of ['Left', 'Right']) {
              const at = `${style} ${id}${southpaw ? ' gaucher' : ''} t${i} ${side}`;
              expect(bendDeg(rig.worldOf(`${side}Arm`)!, rig.worldOf(`${side}ForeArm`)!, rig.worldOf(`${side}Hand`)!), `${at} coude`).toBeLessThan(elbowMax);
              expect(bendDeg(rig.worldOf(`${side}UpLeg`)!, rig.worldOf(`${side}Leg`)!, rig.worldOf(`${side}Foot`)!), `${at} genou`).toBeLessThan(kneeMax);
            }
          }
        }
    // the whole library on one skeleton: a time budget, not a threshold (0.28: 91 techniques)
  }, 60_000);
});

describe('lecteur d’enchaînements', () => {
  const rig = rigs.homme;
  const steps = (ids: string[]) => ids.map((id) => ({ techniqueId: id, motionId: id }));

  test('indique la technique jouée et sa phase (préparation, exécution, retour), rien en garde ni en pause', () => {
    const p = new ComboPlayer(rig, getLibrary(rig, 'boxing'), false);
    p.setSequence(steps(['jab']), 0.5);
    expect(p.phaseNow()).toBeNull();
    p.play();
    const seen: string[] = [];
    for (let f = 0; f < 60 * 4; f++) {
      p.update(1 / 60);
      const n = p.phaseNow();
      if (n) {
        expect(n.techniqueId).toBe('jab');
        if (seen[seen.length - 1] !== n.phase) seen.push(n.phase);
      }
    }
    expect(seen.slice(0, 3)).toEqual(['preparation', 'execution', 'retour']);
    p.pause();
    expect(p.phaseNow()).toBeNull();
  });

  test('donne le mouvement joué et son origine pour les repères au sol, rien en garde', () => {
    const p = new ComboPlayer(rig, getLibrary(rig, 'boxing'), false);
    expect(p.activeStep()).toBeNull();
    p.setSequence(steps(['pas-avant', 'jab']), 0.5);
    p.play();
    const seen = new Map<string, number>();
    for (let f = 0; f < 60 * 5; f++) {
      p.update(1 / 60);
      const a = p.activeStep();
      if (a) seen.set(a.techniqueId, a.origin.z);
    }
    expect([...seen.keys()]).toEqual(['pas-avant', 'jab']);
    // the jab after the step forward is drawn from the new stance origin
    expect(seen.get('jab')).not.toBe(seen.get('pas-avant'));
  });

  test('joue les mouvements dans l’ordre, compte les répétitions et enchaîne sans retour à une pose neutre', () => {
    const order: number[] = [];
    let reps = 0;
    let impacts = 0;
    const lib = getLibrary(rig, 'boxing');
    const p = new ComboPlayer(rig, lib, false, {
      onStep: (i) => order.push(i),
      onRep: () => reps++,
      onImpact: () => impacts++,
    });
    p.setSequence(steps(['jab', 'direct', 'crochet-avant']), 0.3);
    p.play();
    let t = 0;
    let firstStep1 = -1;
    while (t < 12) {
      p.update(1 / 60);
      t += 1 / 60;
      if (firstStep1 < 0 && order.includes(1)) firstStep1 = t;
    }
    expect(order.slice(0, 6)).toEqual([0, 1, 2, 0, 1, 2]);
    expect(reps).toBeGreaterThanOrEqual(3);
    expect(impacts).toBeGreaterThanOrEqual(9);
    // the direct starts before the jab is completely finished (overlap)
    const jab = lib.get('jab')!;
    const guardIdleBefore = 0; // the first motion is the guard idle
    expect(firstStep1).toBeGreaterThan(guardIdleBefore);
    expect(jab.chainAt ?? duration(jab)).toBeLessThan(duration(jab));
  });

  test('aucune téléportation : les mains et les hanches bougent de façon continue', () => {
    for (const [style, ids] of [
      ['boxing', ['jab', 'direct', 'crochet-avant', 'uppercut-arriere', 'esquive-gauche', 'pas-avant', 'pivot-droite']],
      ['muaythai', ['teep-avant', 'jab', 'direct', 'middle-kick-arriere', 'genou-direct-arriere', 'coude-horizontal-avant', 'check-avant']],
      ['mma', ['jab', 'direct', 'sprawl', 'descente-sol', 'sortie-hanche', 'releve-technique', 'entree-lutte']],
    ] as [StanceStyle, string[]][]) {
      const p = new ComboPlayer(rig, getLibrary(rig, style), false);
      p.setSequence(steps(ids), 0.2);
      p.speed = 1;
      p.play();
      let prev = p.update(1 / 60);
      for (let f = 0; f < 60 * 25; f++) {
        const cur = p.update(1 / 60);
        const dh = cur.hips.distanceTo(prev.hips);
        const dl = cur.handL.pos.distanceTo(prev.handL.pos);
        const dr = cur.handR.pos.distanceTo(prev.handR.pos);
        // 0.25 m in one 60 fps frame = 15 m/s, far above a real punch at the wrist
        expect(Math.max(dh, dl, dr), `${style} frame ${f}`).toBeLessThan(0.25);
        prev = cur;
      }
    }
  });

  test('le coach revient au centre après les déplacements', () => {
    const p = new ComboPlayer(rig, getLibrary(rig, 'boxing'), false);
    p.setSequence(steps(['pas-avant', 'pas-avant', 'pivot-droite', 'pas-gauche']), 0.2);
    p.play();
    let maxDist = 0;
    for (let f = 0; f < 60 * 40; f++) {
      p.update(1 / 60);
      maxDist = Math.max(maxDist, Math.hypot(p.origin.x, p.origin.z));
    }
    expect(maxDist).toBeLessThan(1.2);
  });

  test('pause : la pose ne bouge plus', () => {
    const p = new ComboPlayer(rig, getLibrary(rig, 'boxing'), false);
    p.setSequence(steps(['jab', 'direct']), 0.3);
    p.play();
    for (let f = 0; f < 50; f++) p.update(1 / 60);
    p.pause();
    const a = p.update(1 / 60);
    const b = p.update(0.5);
    expect(a.handL.pos.distanceTo(b.handL.pos)).toBe(0);
  });
});
