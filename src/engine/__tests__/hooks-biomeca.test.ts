import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig, type Side } from '../rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { getLibrary, getMotion } from '../library';
import { hookSummary, sampleHook } from '../../test/hooks';

/**
 * v0.42 (Youssef, 2026-10-23, « Correction biomécanique des crochets 3D »): the four hooks (lead and rear, head and
 * body), orthodox and southpaw, on every coach body of the app (Kadir and Amara in both renders, and the two
 * generic coaches), read on the posed skeleton at 120 images per second (src/test/hooks.ts).
 *
 * References: USA Boxing, Best Practices Training Manual 2014, p. 44–47 [boxe-S2] (elbow « bent in close to 90
 * degrees », no wind-up, retract « along the shortest path »); Dinu & Louis 2020 [boxe-S7] (elite boxers: 117° ± 23°
 * between arm and forearm at impact); Swiss Boxing [S3] (fist, elbow and shoulder level at the head).
 *
 * Measured on v0.41.0 before this correction (docs/v042-crochets/MESURES_CROCHETS.md): elbow up to 28 cm behind the
 * line of the shoulders, shoulder external rotation held at its 90° limit, fist opening 17–33 cm to the side before
 * striking (path 1.9 to 2.8 times the straight line), fastest moment of the fist during the wind-up.
 */
const DOC = resolve(__dirname, '../../../docs/v042-crochets/MESURES_CROCHETS.md');

const BODIES = [
  { id: 'Kadir (Ultra-réaliste)', sex: 'homme', file: 'coaches/mma-kadir/photo.glb', profile: 'mma-kadir' },
  { id: 'Amara (Ultra-réaliste)', sex: 'femme', file: 'coaches/mma-amara/photo.glb', profile: 'mma-amara' },
  { id: 'Kadir (Anime)', sex: 'homme', file: 'coaches/mma-kadir/model.glb', profile: 'mma-kadir' },
  { id: 'Amara (Anime)', sex: 'femme', file: 'coaches/mma-amara/model.glb', profile: 'mma-amara' },
  { id: 'Coach homme générique', sex: 'homme', file: undefined, profile: undefined },
  { id: 'Coach femme générique', sex: 'femme', file: undefined, profile: undefined },
] as const;
const HOOKS = ['crochet-avant', 'crochet-arriere', 'crochet-avant-corps', 'crochet-arriere-corps'];

const runs = BODIES.flatMap((b) => {
  const rig = new CoachRig(loadSkeleton(b.sex, b.file));
  const lib = getLibrary(rig, 'boxing', b.profile ? { id: b.profile, offsets: COACH_STANCES[b.profile] } : undefined);
  return HOOKS.flatMap((id) =>
    [false, true].map((southpaw) => {
      const m = getMotion(lib, id, southpaw)!;
      const lead = id.startsWith('crochet-avant');
      const side: Side = lead !== southpaw ? 'L' : 'R';
      const f = sampleHook(rig, m, side);
      return { body: b.id, id, southpaw, impact: m.impacts[0], s: hookSummary(f, m.impacts[0]), f };
    }),
  );
});
if (process.env.HOOKS_DUMP) writeFileSync(process.env.HOOKS_DUMP, JSON.stringify(runs.map(({ f: _f, ...r }) => r), null, 1));

const name = (r: (typeof runs)[number]) => `${r.body} ${r.id}${r.southpaw ? ' gaucher' : ''}`;
const fails = (pred: (r: (typeof runs)[number]) => string | false) => runs.flatMap((r) => (pred(r) ? [`${name(r)} : ${pred(r)}`] : []));
const f1 = (x: number) => x.toFixed(1);

describe('crochets : bras, poignet, trajectoire et corps', () => {
  test('le coude ne passe jamais nettement derrière la ligne des épaules', () => {
    expect(fails((r) => r.s.elbowBehindMax > 0.06 && `${f1(r.s.elbowBehindMax * 100)} cm derrière`)).toEqual([]);
  });

  test('l’épaule ne bute pas en rotation externe (le bras ne se tord pas)', () => {
    expect(fails((r) => r.s.shoulderExtMax > 60 && `rotation externe ${f1(r.s.shoulderExtMax)}°`)).toEqual([]);
  });

  test('à l’impact, le coude est fléchi « près de 90° » (entre 55° et 95° de flexion)', () => {
    expect(fails((r) => (r.s.impact.elbowFlex < 55 || r.s.impact.elbowFlex > 95) && `flexion ${f1(r.s.impact.elbowFlex)}°`)).toEqual([]);
  });

  test('à la tête, coude à hauteur d’épaule ; au corps, coude plus bas que l’épaule', () => {
    expect(
      fails((r) => {
        const up = r.s.impact.elbowUp;
        return r.id.endsWith('corps') ? up > 0 && `coude ${f1(up * 100)} cm au-dessus de l’épaule` : Math.abs(up) > 0.1 && `coude à ${f1(up * 100)} cm de la hauteur de l’épaule`;
      }),
    ).toEqual([]);
  });

  test('le coude pointe sur le côté à l’impact (bras ni collé au buste ni ouvert vers l’arrière)', () => {
    expect(fails((r) => r.s.impact.elbowOut < 0.12 && `coude à ${f1(r.s.impact.elbowOut * 100)} cm sur le côté`)).toEqual([]);
  });

  test('poignet aligné avec l’avant-bras', () => {
    expect(fails((r) => r.s.wristMax > 5 && `poignet ${f1(r.s.wristMax)}°`)).toEqual([]);
  });

  test('pas d’armé : le poing va de la garde à l’impact par un chemin court', () => {
    expect(fails((r) => r.s.path.arcOverChord > 1.4 && `chemin ${r.s.path.arcOverChord.toFixed(2)} fois la ligne droite`)).toEqual([]);
  });

  test('le poing est le plus rapide juste avant l’impact, pas pendant la préparation', () => {
    expect(fails((r) => r.s.path.peakAt < r.impact * 0.6 && `vitesse maximale à ${r.s.path.peakAt.toFixed(2)} s pour un impact à ${r.impact.toFixed(2)} s`)).toEqual([]);
  });

  test('le plan de flexion du coude tourne sans à-coup (pas de retournement)', () => {
    expect(fails((r) => r.s.planeJump > 15 && `${f1(r.s.planeJump)}° en 1/120 s`)).toEqual([]);
  });

  test('l’avant-bras tourne sans à-coup', () => {
    expect(fails((r) => r.s.pronJump > 10 && `${f1(r.s.pronJump)}° en 1/120 s`)).toEqual([]);
  });

  test('les hanches tournent avant le buste (chaîne cinétique)', () => {
    expect(fails((r) => r.s.timing.pelvis > r.s.timing.chest + 1e-6 && `bassin ${r.s.timing.pelvis.toFixed(2)} s, buste ${r.s.timing.chest.toFixed(2)} s`)).toEqual([]);
  });

  test('les pieds pivotent sans glisser au sol', () => {
    expect(fails((r) => Math.max(r.s.drift.L, r.s.drift.R) > 0.01 && `glissement ${f1(Math.max(r.s.drift.L, r.s.drift.R) * 100)} cm`)).toEqual([]);
  });

  test('gaucher : même crochet, en miroir', () => {
    const pairs = runs.filter((r) => !r.southpaw).map((r) => [r, runs.find((x) => x.body === r.body && x.id === r.id && x.southpaw)!] as const);
    expect(pairs.flatMap(([a, b]) => (Math.abs(a.s.impact.elbowFlex - b.s.impact.elbowFlex) > 2 || Math.abs(a.s.elbowBehindMax - b.s.elbowBehindMax) > 0.02 ? [name(a)] : []))).toEqual([]);
  });

  test('le document de mesures est à jour', () => {
    const md = markdown();
    if (process.env.AUDIT_UPDATE) writeFileSync(DOC, md);
    expect(existsSync(DOC) && readFileSync(DOC, 'utf8')).toBe(md);
  });
});

function markdown() {
  const rows = runs
    .filter((r) => !r.southpaw)
    .map((r) => {
      const s = r.s;
      return `| ${r.body} | ${r.id} | ${f1(s.impact.elbowFlex)}° | ${f1(s.impact.elbowUp * 100)} | ${f1(s.impact.elbowOut * 100)} | ${f1(s.impact.elbowFwd * 100)} | ${f1(s.elbowBehindMax * 100)} | ${f1(s.shoulderExtMax)}° | ${s.path.arcOverChord.toFixed(2)} | ${s.path.peakAt.toFixed(3)} / ${r.impact.toFixed(3)} | ${f1(s.planeJump)}° | ${f1(s.impact.trunk)}° |`;
    });
  return [
    '# Mesures des crochets (v0.42)',
    '',
    'Généré par `src/engine/__tests__/hooks-biomeca.test.ts` (`AUDIT_UPDATE=1` pour le mettre à jour). Mesures lues sur le squelette posé, 120 images par seconde, garde orthodoxe (la garde gauchère est vérifiée en miroir par le test).',
    '',
    '- **Flexion** : flexion du coude à l’impact (0° bras tendu ; « près de 90° » selon USA Boxing).',
    '- **Coude / épaule** : position du coude par rapport à l’épaule dans le repère du buste, en cm : au-dessus (+), sur le côté (+), devant (+).',
    '- **Derrière max** : la plus grande distance du coude derrière la ligne des épaules pendant le mouvement (négatif : jamais derrière).',
    '- **Rot. ext. max** : rotation externe de l’épaule la plus grande (limite du moteur : 90°).',
    '- **Chemin** : longueur du trajet du poing de la garde à l’impact, divisée par la ligne droite.',
    '- **Vitesse max** : instant où le poing est le plus rapide, et instant de l’impact (s).',
    '- **Plan du coude** : plus grande rotation du plan de flexion du coude en 1/120 s.',
    '- **Tronc** : rotation du buste par rapport au bassin à l’impact.',
    '',
    '| Corps | Crochet | Flexion | Coude haut | Coude côté | Coude devant | Derrière max | Rot. ext. max | Chemin | Vitesse max / impact | Plan du coude | Tronc |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
}
