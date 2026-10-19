import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { auditTechnique, auditTransitions, centreOfMass, type TechniqueAudit } from '../audit';
import { TECHNIQUES } from '../../domain/techniques';
import { EXERCISES } from '../../domain/exercises';

const DOC = 'docs/audit-biomecanique/MESURES_MOTEUR.md';
const rig = new CoachRig(loadSkeleton('homme'));
const f = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

function build() {
  const rows = TECHNIQUES.filter((t) => t.mode !== 'partenaire').map((t) => auditTechnique(rig, t)!);
  const iso = new Map(rows.map((r) => [r.id, r.slideMax]));
  const tr = EXERCISES.map((e) => auditTransitions(rig, e)).map((t) => ({ ...t, added: t.slideMax - Math.max(0, ...t.sequence.map((s) => iso.get(s) ?? 0)) }));
  const row = (r: TechniqueAudit) =>
    `| ${r.name} (\`${r.id}\`) | ${r.category} | ${f(r.comOutMax)} | ${f(r.comOutShare * 100, 0)} % | ${f(r.singleSupport, 2)} | ${f(r.floorMin)} (${r.floorBone}) | ${f(r.twistMax, 0)}° | ${f(r.slideMax, 2)} |`;
  const lines = [
    '# Mesures du moteur d’animation',
    '',
    'Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/audit.test.ts` sur le squelette du coach homme. Ne pas modifier à la main.',
    'Ce sont des **mesures**, pas des verdicts : leur lecture est dans [AUDIT_MOTEUR.md](AUDIT_MOTEUR.md).',
    '',
    '- **CdM hors appuis** : distance horizontale maximale entre le centre de masse (segments de de Leva, 1996) et la surface couverte par les parties du corps au sol, puis la part de la durée du mouvement où il en sort de plus de 0,5 cm.',
    '- **Sur un pied** : durée pendant laquelle un seul pied touche le sol et rien d’autre.',
    '- **Point le plus bas** : hauteur du centre articulaire le plus bas. Un centre articulaire est à quelques centimètres sous la peau : en dessous d’environ 1,5 cm, la peau traverse le sol.',
    '- **Torsion** : rotation maximale du buste par rapport au bassin, autour de l’axe vertical du bassin.',
    '- **Glissement** : déplacement horizontal maximal, en 1/60 s, d’un pied dont l’avant reste au sol.',
    '',
    '## Par technique',
    '',
    '| Technique | Catégorie | CdM hors appuis (cm) | Part du temps | Sur un pied (s) | Point le plus bas (cm) | Torsion | Glissement (cm / image) |',
    '|---|---|---|---|---|---|---|---|',
    ...[...rows].sort((a, b) => b.comOutMax - a.comOutMax).map(row),
    '',
    '## Transitions dans les exercices',
    '',
    `${tr.length} exercices joués deux fois avec le lecteur d’enchaînements de l’application, à 60 images/s. « Ajouté par la transition » : glissement maximal dans l’enchaînement moins le plus grand glissement des techniques jouées seules.`,
    '',
    '| Exercice | Enchaînement | Saut max entre deux images (cm) | Glissement max (cm / image) | Ajouté par la transition (cm / image) |',
    '|---|---|---|---|---|',
    ...[...tr]
      .sort((a, b) => b.added - a.added || b.jumpMax - a.jumpMax)
      .filter((t) => t.added > 0.5 || t.jumpMax > 15)
      .map((t) => `| \`${t.exercise}\` | ${t.sequence.join(' → ')} | ${f(t.jumpMax)} | ${f(t.slideMax, 2)} | ${f(Math.max(0, t.added), 2)} |`),
    '',
    `Exercices sans glissement ajouté de plus de 0,5 cm par image ni saut de plus de 15 cm : ${tr.filter((t) => !(t.added > 0.5 || t.jumpMax > 15)).length} sur ${tr.length}.`,
    '',
  ];
  return { md: lines.join('\n'), rows, tr };
}

describe('audit du moteur', () => {
  const { md, rows } = build();
  test('le document de mesures est à jour', { timeout: 120000 }, () => {
    if (process.env.AUDIT_UPDATE) writeFileSync(DOC, md);
    expect(existsSync(DOC) && readFileSync(DOC, 'utf8')).toBe(md);
  });
  test('en garde, le centre de masse est entre les pieds', () => {
    expect(rows.find((r) => r.id === 'garde')!.comOutMax).toBeLessThan(0.5);
    rig.reset();
    const c = centreOfMass(rig);
    expect(c.y).toBeGreaterThan(0.8);
    expect(c.y).toBeLessThan(1.2);
  });
});
