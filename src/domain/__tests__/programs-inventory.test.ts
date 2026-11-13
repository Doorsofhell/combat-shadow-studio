import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';
import { PROGRAMS, programSessions, programSessionSeconds } from '../programs';
import { CATALOGUE_GAPS } from '../programCatalog';
import { OBJECTIVE_LABEL, EQUIPMENT_LABEL, programEquipment, programLevel, programObjective } from '../programMeta';
import { PROGRAM_ONLY_SOURCES, programSource } from '../programSources';
import { PARTNER_TECHNIQUES } from '../partner';
import { TECHNIQUES } from '../techniques';
import { EXERCISES } from '../exercises';

/**
 * v0.41 (Youssef, « Enrichissement des programmes », §9): the inventory, the programme × source matrix and the list of
 * what cannot be practised alone are written from the data itself (docs/v041/), and checked against it, so the
 * documents never drift from the app. UPDATE_DOCS=1 rewrites them.
 */
const D = ['boxe', 'kickboxing', 'mma', 'muaythai', 'judo', 'bjj', 'mixte'] as const;
const NAME: Record<string, string> = { boxe: 'Boxe anglaise', kickboxing: 'Kick-boxing', mma: 'MMA', muaythai: 'Muay-thaï', judo: 'Judo', bjj: 'Jiu-jitsu brésilien', mixte: 'Multi-disciplines' };
const FIRST_TEN = 10;

function inventory() {
  const rows = PROGRAMS.map((p, i) => {
    const s = programSessions(p);
    const mins = s.map((x) => Math.round(programSessionSeconds(x.blocks) / 60));
    return `| ${i < FIRST_TEN ? 'existant' : 'nouveau'} | \`${p.id}\` | ${p.name} | ${NAME[p.discipline]} | ${programLevel(p)} | ${OBJECTIVE_LABEL[programObjective(p)]} | ${EQUIPMENT_LABEL[programEquipment(p)]} | ${s.length > 1 ? mins.join(' / ') : mins[0]} | ${p.weeks && p.perWeek ? `${p.weeks} × ${p.perWeek}` : '–'} |`;
  });
  const count = D.map((d) => `| ${NAME[d]} | ${PROGRAMS.slice(0, FIRST_TEN).filter((p) => p.discipline === d).length} | ${PROGRAMS.filter((p) => p.discipline === d).length} | ${d !== 'mixte' && CATALOGUE_GAPS[d] ? CATALOGUE_GAPS[d] : ''} |`);
  return `# Inventaire des programmes (v0.41.0)

Généré depuis \`src/domain/programs.ts\` par \`src/domain/__tests__/programs-inventory.test.ts\` (\`UPDATE_DOCS=1\`).

## Avant / après par discipline

| Discipline | Avant (v0.40) | Après (v0.41) | Remarque |
|---|---|---|---|
${count.join('\n')}
| **Total** | **${FIRST_TEN}** | **${PROGRAMS.length}** | |

## Écart « 10 contre 8 »

La branche \`main\` du dépôt (v0.14, jamais mise à jour depuis) contient 8 programmes. La version déployée (branche \`feature/combat-shadow-v030\`) en contenait 10 : \`judo-bases-solo\` et \`bjj-mobilite-solo\` ont été ajoutés en v0.13.0 avec le judo et le jiu-jitsu brésilien. Aucun programme n'a disparu.

## Liste complète

Durée : minutes d'une séance, calculées à partir des blocs, des repos et des transitions (une valeur par semaine quand chaque semaine a sa propre séance).

| Statut | Identifiant | Nom | Discipline | Niveau | Objectif | Matériel | Durée (min) | Semaines × séances |
|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}
`;
}

function matrix() {
  const used = new Map<string, string[]>();
  for (const p of PROGRAMS) for (const r of p.sources ?? []) used.set(r.id, [...(used.get(r.id) ?? []), p.id]);
  const rows = [...used.keys()].sort().map((id) => {
    const s = programSource(id)!;
    return `| \`${id}\` | ${s.by} – [${s.title}](${s.url}) | ${s.consulted} | ${s.read.replace(/\|/g, '/')} | ${used.get(id)!.length} |`;
  });
  const prog = PROGRAMS.map((p) => `| \`${p.id}\` | ${p.origin === 'adapte' ? 'adapté' : 'original'} | ${(p.sources ?? []).map((r) => `\`${r.id}\` (${r.usage})`).join(' ; ') || 'aucune source écrite'} |`);
  return `# Programmes et sources (v0.41.0)

Généré par \`src/domain/__tests__/programs-inventory.test.ts\`.

## Officiel, adapté ou original

- **Officiel** : aucun. Les sites demandés (England Boxing, WAKO, IJF Academy, IBJJF) ont été consultés le 2026-10-22 ; ils présentent la formation des entraîneurs, les règlements et les grades, mais ne publient aucun programme d'entraînement à reproduire.
- **Adapté** : aucun pour la même raison.
- **Original** : les ${PROGRAMS.length} programmes. Chacun suit les principes des documents cités ci-dessous, et la fiche de chaque programme le dit en clair.

## Sources

| Identifiant | Document | Consulté | Ce qui a été réellement lu | Programmes |
|---|---|---|---|---|
${rows.join('\n')}

Sources propres aux programmes : ${PROGRAM_ONLY_SOURCES.map((s) => `\`${s.id}\``).join(', ')}. Les autres viennent des fiches biomécaniques (\`src/domain/biomech/sources.ts\`).

## Programme par programme

| Programme | Origine | Sources et usage |
|---|---|---|
${prog.join('\n')}
`;
}

function notSolo() {
  const used = new Set(PROGRAMS.flatMap((p) => programSessions(p).flatMap((s) => s.blocks.map((b) => b.exercise))));
  const partner = PARTNER_TECHNIQUES.map((t) => `| \`${t.id}\` | ${t.name} | ${NAME[t.discipline]} | ${t.level} | partenaire et encadrement | ${t.prep ? `préparation solo : \`${t.prep}\`` : '–'} |`);
  const modeP = TECHNIQUES.filter((t) => t.mode === 'partenaire').map((t) => `| \`${t.id}\` | ${t.name} | ${t.disciplines.map((d) => NAME[d]).join(', ')} | | technique marquée « partenaire » | |`);
  const unused = EXERCISES.filter((e) => !used.has(e.id)).length;
  return `# Exercices non exécutables en solo (v0.41.0)

Généré par \`src/domain/__tests__/programs-inventory.test.ts\`.

Ces techniques demandent un partenaire réel et un encadrement qualifié (projections, immobilisations, passages, contrôles, soumissions). Elles restent consultables dans l'application (fiches « partenaire »), mais **aucun programme ne les fait exécuter** : les programmes n'utilisent que des exercices solo animés. Le test \`programs-v041.test.ts\` vérifie que chaque bloc renvoie à un exercice solo existant.

| Identifiant | Technique | Discipline | Niveau | Raison | Équivalent solo |
|---|---|---|---|---|---|
${[...partner, ...modeP].join('\n')}

Exercices solo de l'application : ${EXERCISES.length}, dont ${EXERCISES.length - unused} utilisés par au moins un programme.
`;
}

describe('documents des programmes (docs/v041)', () => {
  const files: [string, () => string][] = [
    ['docs/v041/INVENTAIRE_PROGRAMMES.md', inventory],
    ['docs/v041/MATRICE_SOURCES.md', matrix],
    ['docs/v041/NON_EXECUTABLES.md', notSolo],
  ];
  for (const [path, build] of files)
    it(`${path} correspond aux données`, () => {
      const text = build();
      if (process.env.UPDATE_DOCS) writeFileSync(path, text);
      expect(readFileSync(path, 'utf8')).toBe(text);
    });
});
