import { describe, expect, test } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSkinnedBody, lowestByPart } from '../../test/skin';
import { CoachRig } from '../rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { TECHNIQUES } from '../../domain/techniques';
import { getLibrary, getMotion } from '../library';
import { MotionSampler, duration } from '../motion';
import { styleOf } from '../audit';

/**
 * 1.8.0 (audit des mouvements, Youssef 2026-10-28): no part of the coach's body goes through the mat. Measured on
 * the skin itself (the meshes of the four coaches as the app draws them, posed on the CPU, src/test/skin.ts), for
 * every technique, 15 instants per second. A body resting on the mat presses it a little (flesh, clothes): up to
 * 3 cm under the floor line is allowed.
 *
 * Before 1.8.0: thighs and shins up to 20 cm under the mat (sprawl), fingers up to 14 cm (hands posted on the
 * floor), back and shoulders up to 13 cm (breakfalls, guard), toes up to 9 cm (judo entries, getting up).
 */
const DOC = resolve(__dirname, '../../../docs/audit-biomecanique/MESURES_SOL.md');
const PRESS = 0.03;
const COACHES = ['mma-kadir', 'mma-amara', 'axel', 'kaila'] as const;

interface Worst {
  part: string;
  y: number;
  t: number;
}

const results = new Map<string, Record<string, Worst>>();
for (const id of COACHES) {
  const body = loadSkinnedBody(`coaches/${id}/photo.glb`, 3, (n) => !/eye|lash|brow|high-poly/i.test(n));
  const rig = new CoachRig(body.root);
  const prof = COACH_STANCES[id] ? { id, offsets: COACH_STANCES[id] } : undefined;
  const done = new Set<string>();
  for (const t of TECHNIQUES) {
    const style = styleOf(t.disciplines[0]);
    const key = `${style} ${t.motion}`;
    if (done.has(key)) continue;
    done.add(key);
    const m = getMotion(getLibrary(rig, style, prof), t.motion, false);
    if (!m) continue;
    const dur = duration(m);
    const n = Math.max(2, Math.round(dur * 15));
    const s = new MotionSampler(rig, m);
    let worst: Worst = { part: '', y: Infinity, t: 0 };
    for (let i = 0; i <= n; i++) {
      const time = (dur * i) / n;
      rig.apply(s.sample(time));
      for (const [part, y] of lowestByPart(body)) if (y < worst.y) worst = { part, y, t: time };
    }
    const row = results.get(key) ?? {};
    row[id] = worst;
    results.set(key, row);
  }
}

describe('contact avec le tapis (peau des coachs)', () => {
  test('aucune partie du corps ne traverse le tapis', () => {
    const bad: string[] = [];
    for (const [key, row] of results)
      for (const [id, w] of Object.entries(row)) if (w.y < -PRESS) bad.push(`${id} ${key} ${w.part} ${(w.y * 100).toFixed(1)} cm à t=${w.t.toFixed(2)} s`);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  test('le document de mesures est à jour', () => {
    const cm = (w?: Worst) => (w ? `${(w.y * 100).toFixed(1)} (${w.part.replace(/^mixamorig/, '')})` : '–');
    // the moves that bring the body to the mat (a part other than the feet within 2 cm of it), or that press more than 1 cm into it
    const rows = [...results]
      .filter(([, r]) => Object.values(r).some((w) => w.y < -0.01 || (w.y < 0.02 && !/Foot|ToeBase/.test(w.part))))
      .sort(([a], [b]) => a.localeCompare(b));
    const md = [
      '# Mesures du contact avec le tapis',
      '',
      'Généré par `src/engine/__tests__/floor-contact.test.ts` (`AUDIT_UPDATE=1 npx vitest run floor-contact` pour le refaire).',
      '',
      'Point le plus bas de la peau de chaque coach, en centimètres par rapport au tapis (négatif : sous le tapis), et la partie du corps',
      `concernée, pour les mouvements qui amènent le corps au sol (une autre partie que les pieds à moins de 2 cm) ou qui l’enfoncent de plus`,
      `de 1 cm. Tolérance : ${PRESS * 100} cm d’écrasement (chair, tenue). Les autres mouvements restent debout, pieds posés à ±1 cm du tapis.`,
      '',
      'Avant 1.8.0 : cuisses et tibias jusqu’à −20 cm (sprawl), doigts jusqu’à −14 cm (mains en appui), dos et épaules jusqu’à −13 cm',
      '(chutes, garde), orteils jusqu’à −9 cm (entrées de judo, relevés).',
      '',
      `| Mouvement | ${COACHES.join(' | ')} |`,
      `|---|${COACHES.map(() => '---').join('|')}|`,
      ...rows.map(([key, r]) => `| ${key} | ${COACHES.map((c) => cm(r[c])).join(' | ')} |`),
      '',
    ].join('\n');
    if (process.env.AUDIT_UPDATE) writeFileSync(DOC, md);
    expect(readFileSync(DOC, 'utf8')).toBe(md);
  });
});
