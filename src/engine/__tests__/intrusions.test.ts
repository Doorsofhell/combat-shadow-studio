import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSkinnedBody } from '../../test/skin';
import { CORE_MARGIN, CORE_PERCENTILE, intrusions, measureCores } from '../../test/collisions';
import { CoachRig } from '../rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { TECHNIQUES } from '../../domain/techniques';
import { getLibrary, getMotion } from '../library';
import { MotionSampler, duration } from '../motion';
import { styleOf } from '../audit';

/**
 * 1.41.0 (lot 3, Youssef 2026-11-14 : « membres qui traversent le corps »): no hand, forearm or leg goes into the
 * body. Read on the skin of the four coaches (src/test/collisions.ts), every technique in every stance style of its
 * disciplines, with the coach's own guard, 15 images per second.
 *
 * Up to CONTACT cm under the core's surface is a contact (flesh pressed, a glove against the ribs). The techniques
 * that went further in 1.41.0 are listed in docs/audit-biomecanique/MESURES_INTRUSIONS.md and bounded by their
 * value (they may not get worse) until each is corrected with Youssef's agreement: their correction changes the
 * path of a limb, so the technique shown.
 */
const CONTACT = 2;
/** worst depth (cm), technique by technique, before correction (1.41.0; lowered in 1.41.1 to what is left) */
const PENDING: Record<string, number> = {
  'blocage-corps-avant': 2.9,
  'changement-base': 5.2,
  'check-hook': 2.7,
  'coude-montant-arriere': 5.1,
  'crochet-avant': 3.5,
  'defense-lutte': 4.1,
  'entree-lutte': 8.1,
  'esquive-droite': 2.3,
  'genou-circulaire-arriere': 5.5,
  'genou-clinch': 2.3,
  'genou-direct-arriere': 9.8,
  'genou-direct-avant': 2.4,
  'middle-kick-arriere': 2.8,
  'pont': 3.4,
  'rattrapage-middle': 6.9,
  'releve-genoux': 2.7,
  'releve-technique': 6.6,
  'retention-garde': 3.4,
  'retrait': 8.0,
  'shoulder-roll': 4.4,
  'sit-out': 5.1,
  'sprawl': 3.6,
  'switch-kick': 3.4,
  'teep-avant': 5.0,
  'uchikomi-ko-uchi-gari': 3.9,
  'uchikomi-o-goshi': 7.4,
  'uchikomi-o-soto-gari': 7.8,
  'uchikomi-seoi': 7.3,
  'ukemi-ushiro': 5.9,
  'ukemi-yoko': 6.8,
  'uppercut-arriere': 7.2,
};
const COACHES = ['mma-kadir', 'mma-amara', 'nael', 'inaya'] as const;
const DOC = resolve(__dirname, '../../../docs/audit-biomecanique/MESURES_INTRUSIONS.md');

interface Worst {
  depth: number;
  what: string;
  coach: string;
  style: string;
  t: number;
}
const worst = new Map<string, Worst>();
const garde: string[] = [];
for (const id of COACHES) {
  const body = loadSkinnedBody(`coaches/${id}/photo.glb`, 3, (n) => !/eye|lash|brow|high-poly/i.test(n));
  const cores = measureCores(body);
  const rig = new CoachRig(body.root);
  const prof = { id, offsets: COACH_STANCES[id] };
  for (const t of TECHNIQUES) {
    if (t.mode === 'partenaire') continue;
    for (const style of new Set(t.disciplines.map(styleOf))) {
      const m = getMotion(getLibrary(rig, style, prof), t.motion, false);
      if (!m) continue;
      const dur = duration(m);
      const n = Math.max(2, Math.round(dur * 15));
      const s = new MotionSampler(rig, m);
      for (let i = 0; i <= n; i++) {
        const time = (dur * i) / n;
        rig.apply(s.sample(time));
        for (const x of intrusions(body, cores, 0.005)) {
          const d = x.depth * 100;
          if ((worst.get(t.id)?.depth ?? 0) < d) worst.set(t.id, { depth: d, what: `${x.limb} dans ${x.core === 'tête' ? 'la tête' : x.core === 'tronc' ? 'le tronc' : `la ${x.core.replace('tibia', 'jambe (tibia)')}`}`, coach: id, style, t: time });
        }
      }
    }
  }
}
const f = (x: number) => x.toFixed(1).replace('.', ',');
const list = [...worst].sort((a, b) => b[1].depth - a[1].depth);

describe('membres qui traversent le corps (peau des 4 coachs)', () => {
  test(`aucun membre à plus de ${CONTACT} cm dans le corps, hors techniques en attente de correction`, () => {
    const bad = list.filter(([id, w]) => w.depth > (PENDING[id] ?? CONTACT)).map(([id, w]) => `${id} : ${w.what} ${f(w.depth)} cm (${w.coach} ${w.style} t=${w.t.toFixed(2)} s)`);
    expect(bad).toEqual([]);
  });

  test('les techniques en attente existent toujours', () => {
    for (const id of Object.keys(PENDING)) expect(TECHNIQUES.some((t) => t.id === id), id).toBe(true);
  });

  test('le document de mesures est à jour', () => {
    const md = [
      '# Membres qui traversent le corps',
      '',
      'Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/intrusions.test.ts`. Ne pas modifier à la main.',
      '',
      `Mesure (1.41.0) : sur la peau de Kadir, Amara, Naël et Inaya (garde du coach, droitier), toutes les techniques dans chaque style de leurs disciplines, 15 images par seconde. Chaque volume du corps (tronc, tête, cuisses, tibias) a un « cœur » le long de ses os, tranche par tranche et secteur par secteur (un torse est plus large que profond) : ${Math.round(CORE_PERCENTILE * 100)} % de sa propre peau au repos est plus près des os, et le cœur est encore ${CORE_MARGIN * 100} cm plus profond. Une main, un avant-bras ou une jambe qui entre dans un cœur est dans le corps ; on donne la profondeur. Jusqu’à ${CONTACT} cm, c’est un contact (chair qui s’écrase, gant contre les côtes).`,
      '',
      `Résultat : ${list.filter(([, w]) => w.depth > CONTACT).length} techniques dépassent ${CONTACT} cm. Elles sont bornées à leur valeur par le test (elles ne peuvent pas empirer) et seront corrigées une par une, avec l’accord de Youssef, car la correction change le trajet d’un membre.`,
      '',
      '| Technique | Pire profondeur (cm) | Quoi | Où | Instant |',
      '|---|---|---|---|---|',
      ...list.filter(([, w]) => w.depth > CONTACT).map(([id, w]) => `| \`${id}\` | ${f(w.depth)} | ${w.what} | ${w.coach} ${w.style} | ${w.t.toFixed(2).replace('.', ',')} s |`),
      '',
    ].join('\n');
    if (process.env.AUDIT_UPDATE) writeFileSync(DOC, md);
    expect(existsSync(DOC) && readFileSync(DOC, 'utf8')).toBe(md);
  });
});
