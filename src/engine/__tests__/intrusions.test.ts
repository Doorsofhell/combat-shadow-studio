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
  'defense-lutte': 3.9,
  'esquive-droite': 2.3,
  'genou-circulaire-arriere': 5.5,
  'genou-clinch': 2.3,
  'genou-direct-arriere': 5.4,
  'genou-direct-avant': 2.4,
  'middle-kick-arriere': 3.6,
  'pont': 5.4,
  'rattrapage-middle': 2.7,
  'releve-genoux': 2.7,
  'releve-technique': 5.6,
  'retention-garde': 3.4,
  'shoulder-roll': 4.4,
  'single-leg': 4.1,
  'sit-out': 5.1,
  'switch-kick': 3.7,
  'teep-avant': 5.0,
  'uchikomi-ko-uchi-gari': 3.9,
  'uchikomi-o-goshi': 4.8,
  'uchikomi-o-soto-gari': 4.2,
  'uchikomi-seoi': 4.5,
  'ukemi-ushiro': 5.9,
  'ukemi-yoko': 6.8,
  'uppercut-arriere': 7.2,
};
/**
 * 1.43.0 Victor: his body is the one of Kadir, made wider (torso, forearms, calves), with the same techniques. His
 * forearms reach a little deeper into his torso in some techniques already pending above (a few millimetres, as many as
 * the extra width) and in three that the other coaches keep under 2 cm. Measured on his skin in 1.43.0, bounded the same
 * way (they may not get worse) and corrected with the others; the four other coaches keep the bounds above.
 */
const VICTOR_PENDING: Record<string, number> = {
  // 1.45.0 (traversées corrigées): bounds lowered to min(new + 0.2, 1.43.0); défense de lutte now under the common bound.
  'esquive-droite': 2.5,
  'genou-circulaire-clinch': 2.2,
  'high-kick-arriere': 2.5,
  'middle-kick-arriere': 4.1,
  'retention-garde': 4.2,
  'single-leg': 5.0,
  'sit-out': 5.9,
  'uchikomi-ko-uchi-gari': 4.1,
  'ukemi-ushiro': 6.8,
  'ukemi-yoko': 7.6,
  // Victor's wider forearm stays a little deeper than the common bound (8.2 cm in 1.43.0, 7.7 cm in 1.45.0)
  'uppercut-arriere': 7.9,
};
/**
 * 1.46.0 Kadir: his trapezius rise 1.5 to 2 cm on the sides of the neck (Youssef 15/11, « trapèzes de combattant »).
 * In the wrestling defence his right forearm frames in front of his neck, a contact already pending above (3.7 cm in the
 * head in 1.45): the thicker base of the neck makes it 4.7 cm in the trunk. Bounded for Kadir only (may not get worse),
 * corrected with the technique; the other coaches keep the bounds above.
 */
const KADIR_PENDING: Record<string, number> = {
  'defense-lutte': 4.9,
};
const COACHES = ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor'] as const;
const DOC = resolve(__dirname, '../../../docs/audit-biomecanique/MESURES_INTRUSIONS.md');

interface Worst {
  depth: number;
  what: string;
  coach: string;
  style: string;
  t: number;
}
const worst = new Map<string, Worst>();
const worstVictor = new Map<string, Worst>();
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
          const into = id === 'victor' ? worstVictor : worst;
          if ((into.get(t.id)?.depth ?? 0) < d) into.set(t.id, { depth: d, what: `${x.limb} dans ${x.core === 'tête' ? 'la tête' : x.core === 'tronc' ? 'le tronc' : `la ${x.core.replace('tibia', 'jambe (tibia)')}`}`, coach: id, style, t: time });
        }
      }
    }
  }
}
const f = (x: number) => x.toFixed(1).replace('.', ',');
const list = [...worst].sort((a, b) => b[1].depth - a[1].depth);
const listVictor = [...worstVictor].sort((a, b) => b[1].depth - a[1].depth);

describe('membres qui traversent le corps (peau des 5 coachs)', () => {
  test(`aucun membre à plus de ${CONTACT} cm dans le corps, hors techniques en attente de correction`, () => {
    const bad = list.filter(([id, w]) => w.depth > ((w.coach === 'mma-kadir' ? KADIR_PENDING[id] : undefined) ?? PENDING[id] ?? CONTACT)).map(([id, w]) => `${id} : ${w.what} ${f(w.depth)} cm (${w.coach} ${w.style} t=${w.t.toFixed(2)} s)`);
    expect(bad).toEqual([]);
  });

  test(`Victor : aucun membre plus profond qu’en 1.43.0`, () => {
    if (process.env.AUDIT_UPDATE) console.log(listVictor.filter(([id, w]) => w.depth > (PENDING[id] ?? CONTACT)).map(([id, w]) => `  '${id}': ${(Math.ceil(w.depth * 10) / 10 + 0.2).toFixed(1)},`).join('\n'));
    const bad = listVictor.filter(([id, w]) => w.depth > (VICTOR_PENDING[id] ?? PENDING[id] ?? CONTACT)).map(([id, w]) => `${id} : ${w.what} ${f(w.depth)} cm (${w.coach} ${w.style} t=${w.t.toFixed(2)} s)`);
    expect(bad).toEqual([]);
  });

  test('les techniques en attente existent toujours', () => {
    for (const id of [...Object.keys(PENDING), ...Object.keys(VICTOR_PENDING)]) expect(TECHNIQUES.some((t) => t.id === id), id).toBe(true);
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
      '## Victor (1.43.0)',
      '',
      'Même mesure sur la peau de Victor (corps de Kadir élargi : torse, avant-bras, mollets). Bornes propres : une technique ne peut pas être plus profonde qu’ici.',
      '',
      '| Technique | Pire profondeur (cm) | Quoi | Où | Instant |',
      '|---|---|---|---|---|',
      ...listVictor.filter(([, w]) => w.depth > CONTACT).map(([id, w]) => `| \`${id}\` | ${f(w.depth)} | ${w.what} | ${w.coach} ${w.style} | ${w.t.toFixed(2).replace('.', ',')} s |`),
      '',
    ].join('\n');
    if (process.env.AUDIT_UPDATE) writeFileSync(DOC, md);
    expect(existsSync(DOC) && readFileSync(DOC, 'utf8')).toBe(md);
  });
});
