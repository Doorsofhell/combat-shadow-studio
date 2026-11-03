import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary } from '../library';
import { measureFluidity } from '../fluidity';
import type { StanceStyle } from '../author';

const DOC = 'docs/audit-biomecanique/MESURES_FLUIDITE.md';
const rig = new CoachRig(loadSkeleton('homme'));
const STYLES: StanceStyle[] = ['boxing', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo'];
const f = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

const perStyle = STYLES.map((style) => {
  const rows = [...getLibrary(rig, style).values()].map((m) => ({ m, before: measureFluidity(rig, m, false), after: measureFluidity(rig, m) }));
  return { style, rows };
});
const all = perStyle.flatMap((p) => p.rows);
const sum = (k: 'before' | 'after') => all.reduce((n, r) => n + r[k].stops, 0);

function markdown() {
  const boxing = perStyle[0].rows;
  return [
    '# Mesures de fluidité des animations',
    '',
    'Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/fluidity.test.ts` sur le squelette du coach homme. Ne pas modifier à la main.',
    '',
    '- **Arrêt parasite** : à une pose clé intérieure, une partie du corps (bassin, mains, chevilles) qui continue dans la même direction (moins de 60° d’écart entre l’arrivée et le départ, plus de 0,3 m/s de part et d’autre) mais dont la vitesse tombe sous le quart de la plus lente des deux : le corps marque un temps d’arrêt de robot.',
    '- **Saut de vitesse** : plus grand changement de vitesse d’une de ces parties de part et d’autre d’une pose clé (1/240 s). Les coups gardent volontairement le leur à l’impact et au départ explosif.',
    '- **Vitesse max** : plus grande vitesse d’une main ou d’un pied sur tout le mouvement.',
    '- **Vitesse à l’impact** : vitesse de la main ou du pied le plus rapide pendant le 1/60 s qui précède chaque impact. Le lissage ne doit pas ralentir les coups.',
    '- « Avant » : interpolation de pose clé en pose clé (version 0.19.0) ; « Après » : vitesses conservées à travers les poses clés (version 0.20.0).',
    '',
    '## Total, 6 styles de garde',
    '',
    `${all.length} animations, ${all.reduce((n, r) => n + r.before.keys, 0)} poses clés intérieures. Arrêts parasites : **${sum('before')} avant, ${sum('after')} après**.`,
    '',
    '| Style | Animations | Arrêts avant | Arrêts après |',
    '|---|---|---|---|',
    ...perStyle.map((p) => `| ${p.style} | ${p.rows.length} | ${p.rows.reduce((n, r) => n + r.before.stops, 0)} | ${p.rows.reduce((n, r) => n + r.after.stops, 0)} |`),
    '',
    '## Détail, garde de boxe',
    '',
    '| Animation | Poses clés intérieures | Arrêts avant | Arrêts après | Saut de vitesse avant (m/s) | après | Vitesse max avant (m/s) | après | Vitesse à l’impact avant (m/s) | après |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...boxing.map(
      (r) =>
        `| \`${r.m.id}\` | ${r.before.keys} | ${r.before.stops} | ${r.after.stops} | ${f(r.before.kinkMax)} | ${f(r.after.kinkMax)} | ${f(r.before.limbPeak)} | ${f(r.after.limbPeak)} | ${r.before.impactSpeeds.map((v) => f(v)).join(' ; ') || '–'} | ${r.after.impactSpeeds.map((v) => f(v)).join(' ; ') || '–'} |`,
    ),
    '',
  ].join('\n');
}

describe('fluidité des animations', () => {
  test('le document de mesures est à jour', () => {
    const md = markdown();
    if (process.env.AUDIT_UPDATE) writeFileSync(DOC, md);
    expect(existsSync(DOC) && readFileSync(DOC, 'utf8')).toBe(md);
  });

  test('au moins 60 % des arrêts parasites aux poses clés ont disparu', () => {
    expect(sum('after')).toBeLessThan(sum('before') * 0.4);
  });

  test('aucune animation n’a plus d’arrêts qu’avant', () => {
    expect(all.filter((r) => r.after.stops > r.before.stops).map((r) => r.m.id)).toEqual([]);
  });

  test('les coups ne sont pas ralentis : vitesse à l’impact conservée à 3 % près', () => {
    const slower = all.flatMap((r) =>
      r.after.impactSpeeds.flatMap((v, i) => (v < r.before.impactSpeeds[i] * 0.97 ? [`${r.m.id} impact ${i + 1} : ${f(r.before.impactSpeeds[i], 2)} → ${f(v, 2)}`] : [])),
    );
    expect(slower).toEqual([]);
  });
});
