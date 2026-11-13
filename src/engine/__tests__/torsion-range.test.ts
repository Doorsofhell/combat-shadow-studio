import { describe, expect, test } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { measureLibrary, summarize, BONES, TORSION_LIMITS, ROTATION_MAX_ELEVATION, type MeasureKey, type TorsionSummary } from '../../test/torsions';

/**
 * Torsions of the joints of the two champions (Kadir, Amara), for every non-partner technique, in
 * every stance style of its disciplines, orthodox and southpaw, with the discipline guard and the
 * coach's own guard, sampled at 60 images per second (src/test/torsions.ts).
 *
 * Each measure stays within the human range of motion (TORSION_LIMITS) up to TOLERANCE degrees: the
 * rig's limiters stop softly near the bound, and the anatomical neutral read from the rest pose of the
 * model (hanging arm, thumb forward) is itself uncertain by a few degrees.
 */
const TOLERANCE = 3;
const DOC = resolve(__dirname, '../../../docs/audit-biomecanique/MESURES_TORSIONS.md');
const BEFORE = resolve(__dirname, '../../../docs/audit-biomecanique/torsions-avant.json');

const champions = [
  { id: 'mma-kadir', rig: new CoachRig(loadSkeleton('homme', 'coaches/mma-kadir/model.glb')), offsets: COACH_STANCES['mma-kadir'] },
  { id: 'mma-amara', rig: new CoachRig(loadSkeleton('femme', 'coaches/mma-amara/model.glb')), offsets: COACH_STANCES['mma-amara'] },
];

const LABELS: [MeasureKey, string, string][] = [
  ['trunk', 'Rotation du tronc (bassin → haut du thorax)', 'AAOS : 45°'],
  ['lumbar', 'Rotation lombaire (os Spine seul)', 'White & Panjabi : ≈ 2° par étage, ≈ 10°'],
  ['cervical', 'Rotation du cou (thorax → tête)', 'AAOS : 80°'],
  ['shoulderInt', 'Épaule : rotation interne', 'AAOS : 70°'],
  ['shoulderExt', 'Épaule : rotation externe', 'AAOS : 90°'],
  ['pronation', 'Avant-bras : pronation', 'AAOS : 80°, Norkin & White : jusqu’à 85–90°'],
  ['supination', 'Avant-bras : supination', 'AAOS : 80°, Norkin & White : jusqu’à 85–90°'],
  ['wristFlex', 'Poignet : flexion', 'AAOS : 80°'],
  ['wristExt', 'Poignet : extension', 'AAOS : 70°'],
  ['wristRadial', 'Poignet : inclinaison radiale', 'AAOS : 20°'],
  ['wristUlnar', 'Poignet : inclinaison cubitale', 'AAOS : 30°'],
  ['elbowHyper', 'Coude : hyperextension (pli à l’envers)', '5–10° chez l’adulte sain'],
  ['kneeHyper', 'Genou : hyperextension (pli à l’envers)', '≈ 5°'],
  ['hipInt', 'Hanche : rotation interne', 'AAOS : 45° (Kapandji : 30–40°)'],
  ['hipExt', 'Hanche : rotation externe', 'AAOS : 45° (Kapandji : 60°)'],
  ['kneeRot', 'Genou : rotation axiale', 'Kapandji : ≈ 0 jambe tendue, 30° à 90° de flexion'],
  ['handTwist', 'Torsion portée par l’os de la main seul (peau du poignet)', 'pas de limite (indicatif)'],
  ['hipElev', 'Hanche : élévation de la cuisse (flexion / abduction)', 'pas de limite ici (indicatif)'],
];

const report = measureLibrary(champions, 60);
const after = summarize(report);
if (process.env.TORSIONS_DUMP) writeFileSync(process.env.TORSIONS_DUMP, JSON.stringify(after, null, 1) + '\n');

describe('torsions des articulations (Kadir, Amara)', () => {
  test('chaque articulation reste dans l’amplitude humaine', () => {
    const bad = report.over
      .filter((o) => o.value - o.limit > TOLERANCE)
      .map((o) => `${o.run.coach} ${o.run.style} ${o.run.technique}${o.run.southpaw ? ' gaucher' : ''}${o.run.profile ? ' garde coach' : ''} t=${o.t.toFixed(2)} ${o.key} ${o.side ?? ''} ${o.value.toFixed(1)}° (limite ${o.limit.toFixed(0)}°)`);
    expect(bad.slice(0, 40), `${bad.length} dépassements\n${bad.slice(0, 40).join('\n')}`).toEqual([]);
  });

  test('toutes les techniques sont mesurées', () => {
    expect(report.runs).toBeGreaterThan(400);
    expect(report.frames).toBeGreaterThan(50000);
  });

  test('le document de mesures est à jour', () => {
    const before = JSON.parse(readFileSync(BEFORE, 'utf8')) as TorsionSummary;
    const deg = (x: number | null) => (x === null ? '—' : `${x.toFixed(0)}°`);
    const ex = (x: number) => (x > 0 ? `**+${x.toFixed(0)}°**` : 'non');
    const techs = (m: TorsionSummary['measures'][MeasureKey]) =>
      m.techniques.length ? m.techniques.slice(0, 8).map((t) => `${t.technique} +${t.excess.toFixed(0)}°`).join(', ') + (m.techniques.length > 8 ? `, … (${m.techniques.length})` : '') : '—';
    const md = [
      '# Mesures des torsions articulaires',
      '',
      'Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/torsion-range.test.ts`. Ne pas modifier à la main.',
      '',
      '## Ce qui est mesuré',
      '',
      `Les deux champions (Kadir, \`coaches/mma-kadir/model.glb\` ; Amara, \`coaches/mma-amara/model.glb\`), toutes les`,
      `techniques hors partenaire, dans chaque style de leurs disciplines, en garde orthodoxe et en fausse garde, avec la garde`,
      `de la discipline et la garde propre du coach : ${after.runs} animations, ${after.frames} images à 60 images par seconde.`,
      '',
      '- **Os par os** : rotation locale de chaque os depuis la pose de repos, décomposée en torsion autour de l’axe propre',
      '  de l’os (direction de repos vers son enfant) et en inclinaison (« swing-twist »).',
      '- **Tronc** : torsion du haut du thorax (Spine2) par rapport au bassin, autour de l’axe de la colonne ; **lombaires** :',
      '  torsion de l’os Spine seul ; **cou** : tête par rapport au thorax.',
      '- **Épaule et hanche** : rotation axiale du bras (de la cuisse) depuis la position anatomique (bras pendant, pli du',
      '  coude vers l’avant ; cuisse verticale), mesurée par décomposition swing-twist autour de la verticale, l’équivalent',
      '  de la somme des deux rotations axiales de la convention ISB (Wu et al. 2005 ; Baerlocher & Boulic 2004). Cette',
      `  rotation n’est pas définie quand le membre pointe presque à la verticale vers le haut : elle n’est jugée que pour`,
      `  une élévation ≤ ${ROTATION_MAX_ELEVATION}°.`,
      '- **Pronation / supination** : orientation de la paume par rapport à l’axe du coude, autour de l’avant-bras (avant-bras',
      '  + main) ; neutre = pouce vers le haut.',
      '- **Poignet** : flexion / extension et inclinaison radiale / cubitale de la main dans le repère de l’avant-bras.',
      '- **Coude, genou** : pli à l’envers (hyperextension) ou pli de côté ; rotation axiale du genou selon sa flexion.',
      '',
      '## Amplitudes de référence',
      '',
      'Valeurs cliniques usuelles d’un adulte sain, **citées de mémoire** (non revérifiées dans les ouvrages) :',
      'AAOS (*Joint Motion: Method of Measuring and Recording*, 1965) repris par Norkin & White (*Measurement of Joint Motion*),',
      'White & Panjabi (*Clinical Biomechanics of the Spine*), Kapandji (*Physiologie articulaire*). Les sportifs de combat',
      'peuvent dépasser un peu ces valeurs (épaule, hanche) ; elles servent de garde-fou, pas de cible.',
      '',
      `Tolérance du test : ${TOLERANCE}° (butée douce des limiteurs, incertitude de la position neutre lue sur la pose de repos).`,
      '',
      '| Mesure | Référence | Source |',
      '|---|---|---|',
      ...LABELS.map(([k, label, src]) => {
        const lim = (TORSION_LIMITS as unknown as Record<string, number>)[k];
        return `| ${label} | ${k === 'kneeRot' ? `${TORSION_LIMITS.kneeRotStraight}° → ${TORSION_LIMITS.kneeRotAt90}°` : lim === undefined ? '—' : `${lim}°`} | ${src} |`;
      }),
      '',
      '## Pires valeurs, avant / après',
      '',
      '« Avant » : le moteur avant ce correctif (`torsions-avant.json`, même mesure). Le dépassement est la pire valeur',
      'au-delà de la référence (pour le genou, de la référence à sa flexion du moment).',
      '',
      '| Mesure | Référence | Avant : pire | Avant : dépasse | Après : pire | Après : dépasse | Où (après) |',
      '|---|---|---|---|---|---|---|',
      ...LABELS.map(([k, label]) => {
        const b = before.measures[k];
        const a = after.measures[k];
        return `| ${label} | ${deg(a.limit)} | ${deg(b.worst)} | ${ex(b.excess)} | ${deg(a.worst)} | ${ex(a.excess)} | ${a.where} |`;
      }),
      '',
      '## Techniques hors amplitude',
      '',
      '| Mesure | Avant | Après |',
      '|---|---|---|',
      ...LABELS.filter(([k]) => before.measures[k].techniques.length || after.measures[k].techniques.length).map(
        ([k, label]) => `| ${label} | ${techs(before.measures[k])} | ${techs(after.measures[k])} |`,
      ),
      '',
      '## Torsion os par os (après)',
      '',
      'Plus grande torsion autour de l’axe propre de l’os et plus grande inclinaison, depuis la pose de repos. La torsion',
      'd’un os n’est pas une amplitude articulaire à elle seule (le bras tourne à l’épaule, l’avant-bras porte la',
      'pronation) : ce tableau sert à repérer une torsion concentrée sur un seul os.',
      '',
      '| Os | Torsion avant | Torsion après | Inclinaison après | Où (après) |',
      '|---|---|---|---|---|',
      ...BONES.map(([b]) => b)
        .filter((b) => after.bones[b])
        .map((b) => `| ${b} | ${deg(before.bones[b]?.twist ?? null)} | ${deg(after.bones[b].twist)} | ${deg(after.bones[b].swing)} | ${after.bones[b].twistWhere} |`),
      '',
      '## Observations',
      '',
      `- Élévation maximale de la cuisse : ${deg(after.measures.hipElev.worst)} (${after.measures.hipElev.where}). Au-delà`,
      '  de ≈ 120–125° de flexion de hanche, la cuisse ne monte plus chez la plupart des adultes sans basculer le bassin ;',
      '  ce n’est pas une torsion, mais à revoir avec le travail au sol.',
      `- Torsion portée par la main seule (au-dessus de la part de l’avant-bras) : jusqu’à ${deg(after.measures.handTwist.worst)}.`,
      '',
    ].join('\n');
    if (process.env.AUDIT_UPDATE) writeFileSync(DOC, md);
    expect(readFileSync(DOC, 'utf8')).toBe(md);
  });
});
