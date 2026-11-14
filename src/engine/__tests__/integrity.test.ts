import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import type { StanceStyle } from '../author';
import type { Motion } from '../motion';
import { checkLibrary, checkMotion, type IntegrityFinding } from '../integrity';
import { COACH_STANCES } from '../../domain/coaches/motion';

/**
 * 1.41.0: static checks ported from CME-3D (src/engine/integrity.ts), on every authored motion of the four coaches
 * of the app (their own skeletons), in the six stance styles, with the discipline guard and the coach's own guard,
 * orthodox and southpaw. Errors block; warnings are listed in docs/audit-biomecanique/MESURES_INTEGRITE.md.
 */
const STYLES: StanceStyle[] = ['boxing', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo'];
const COACHES = [
  ['mma-kadir', 'homme'],
  ['mma-amara', 'femme'],
  ['nael', 'homme'],
  ['inaya', 'femme'],
] as const;
const DOC = resolve(__dirname, '../../../docs/audit-biomecanique/MESURES_INTEGRITE.md');

interface Run {
  coach: string;
  style: StanceStyle;
  guard: 'discipline' | 'coach';
  southpaw: boolean;
  findings: IntegrityFinding[];
  motions: number;
}

const runs: Run[] = [];
for (const [id, sex] of COACHES) {
  const rig = new CoachRig(loadSkeleton(sex, `coaches/${id}/photo.glb`));
  for (const style of STYLES)
    for (const guard of ['discipline', 'coach'] as const) {
      const lib = getLibrary(rig, style, guard === 'coach' ? { id, offsets: COACH_STANCES[id] } : undefined);
      const ids = [...lib.keys()].filter((k) => !k.includes('@'));
      for (const southpaw of [false, true]) {
        const motions = ids.map((k) => getMotion(lib, k, southpaw)!);
        runs.push({ coach: id, style, guard, southpaw, findings: checkLibrary(motions), motions: motions.length });
      }
    }
}

const label = (r: Run) => `${r.coach} ${r.style} garde ${r.guard === 'coach' ? 'du coach' : 'de discipline'}${r.southpaw ? ' gaucher' : ''}`;

describe('intégrité des animations (contrôles repris de CME-3D)', () => {
  test('aucune erreur d’écriture : 4 coachs, 6 styles, 2 gardes, droitier et gaucher', () => {
    const errors = runs.flatMap((r) => r.findings.filter((f) => f.level === 'error').map((f) => `${label(r)} : ${f.motionId}#${f.keyIndex} ${f.code} ${f.detail}`));
    expect(runs.length).toBe(4 * 6 * 2 * 2);
    expect(runs.every((r) => r.motions > 80)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('les contrôles trouvent bien les erreurs qu’ils annoncent', () => {
    const rig = new CoachRig(loadSkeleton('homme', 'coaches/mma-kadir/photo.glb'));
    const good = getMotion(getLibrary(rig, 'boxing'), 'jab', false)!;
    expect(checkMotion(good).filter((f) => f.level === 'error')).toEqual([]);
    const broken = (edit: (m: Motion) => void) => {
      const m: Motion = structuredClone(good);
      edit(m);
      return new Set(checkMotion(m).map((f) => f.code));
    };
    expect(broken((m) => (m.keys[2].t = m.keys[1].t))).toContain('TIME_ORDER');
    expect(broken((m) => (m.keys[0].t = 0.05))).toContain('TIME_ORIGIN');
    expect(broken((m) => (m.keys[1].pose.hips.y = NaN))).toContain('HIPS_NONFINITE');
    expect(broken((m) => (m.keys[1].pose.chest.yaw = Infinity))).toContain('ROT_NONFINITE');
    expect(broken((m) => (m.keys[1].pose.handR.fist = 1.4))).toContain('FIST_RANGE');
    expect(
      broken((m) => {
        const f = m.keys[1].pose.footL;
        if (f.mode === 'ground') f.ball = { ...f.ball, y: -0.03 };
      }),
    ).toContain('GROUND_PENETRATION');
    expect(broken((m) => (m.impacts = [99]))).toContain('IMPACT_TIME');
  });

  test('signalements à revoir, à jour dans MESURES_INTEGRITE.md', () => {
    // one line per (coach, motion, code): the worst value over the styles, guards and sides
    const rows = new Map<string, { coach: string; motion: string; code: string; detail: string; where: Set<string>; value: number }>();
    for (const r of runs)
      for (const f of r.findings) {
        if (f.level !== 'warning' || f.code === 'PLANTED_FOOT_MOVE') continue;
        const motion = f.motionId.replace('@gaucher', '');
        const key = `${r.coach}|${motion}|${f.code}`;
        const value = Number(/([\d.]+) ?m\/s²/.exec(f.detail)?.[1] ?? 0);
        const row = rows.get(key) ?? { coach: r.coach, motion, code: f.code, detail: f.detail, where: new Set<string>(), value: -1 };
        row.where.add(r.style);
        if (value > row.value) Object.assign(row, { value, detail: f.detail });
        rows.set(key, row);
      }
    const planted = runs.reduce((n, r) => n + r.findings.filter((f) => f.code === 'PLANTED_FOOT_MOVE').length, 0);
    const list = [...rows.values()].sort((a, b) => a.motion.localeCompare(b.motion) || a.coach.localeCompare(b.coach) || a.code.localeCompare(b.code));
    const md = [
      '# Intégrité des animations (contrôles repris de CME-3D)',
      '',
      'Généré par `UPDATE_INTEGRITY=1 npx vitest run src/engine/__tests__/integrity.test.ts`. Ne pas modifier à la main.',
      '',
      `Contrôlé : 4 coachs (Kadir, Amara, Naël, Inaya), 6 styles, garde de la discipline et garde du coach, droitier et gaucher, soit ${runs.length} bibliothèques et ${runs.reduce((n, r) => n + r.motions, 0)} animations.`,
      '',
      '## Erreurs (bloquantes)',
      '',
      'Ordre et origine des images clés, valeurs non finies (hanches, rotations, mains, pieds), fermeture du poing entre 0 et 1, pied d’appui à plus de 5 mm sous le tapis, impacts dans la durée du mouvement.',
      '',
      `Résultat : ${runs.reduce((n, r) => n + r.findings.filter((f) => f.level === 'error').length, 0)} erreur.`,
      '',
      '## Signalements à revoir',
      '',
      'Lus sur les images clés seulement (pas sur le mouvement joué) : hanches à plus de 4 m/s entre deux clés (`HIP_SPEED`), changement brusque de vitesse des hanches au-delà de 45 m/s² (`HIP_ACCELERATION`), deux clés à moins de 25 ms (`KEY_INTERVAL`). Ce sont des endroits à regarder, pas des défauts : un coup de pied est un geste explosif.',
      '',
      list.length ? '| Technique (animation) | Coach | Contrôle | Pire valeur | Styles |' : 'Aucun.',
      ...(list.length ? ['|---|---|---|---|---|', ...list.map((r) => `| \`${r.motion}\` | ${r.coach} | ${r.code} | ${r.detail} | ${[...r.where].join(', ')} |`)] : []),
      '',
      '## Contrôle non retenu',
      '',
      `\`PLANTED_FOOT_MOVE\` (pied d’appui qui change de place entre deux clés) : ${planted} signalements, presque tous des pas et des pivots voulus. Le glissement que le coach montre vraiment est mesuré sur le squelette posé, image par image (MESURES_GLISSEMENT.md).`,
      '',
    ].join('\n');
    if (process.env.UPDATE_INTEGRITY) writeFileSync(DOC, md);
    expect(existsSync(DOC) && readFileSync(DOC, 'utf8')).toBe(md);
  });
});
