import { describe, expect, test } from 'vitest';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { SHEETS } from '../biomech/sheets';
import { SOURCE_BY_ID } from '../biomech/sources';
import { TECHNIQUE_BY_ID, TECHNIQUES } from '../techniques';
import { PARTNER_TECHNIQUES } from '../partner';
import { animationStatusOf, STATUS_LABEL } from '../animationStatus';
import { SHEET_BY_ID } from '../biomech/sheets';
import type { SheetStatus } from '../biomech/types';
import type { Claim } from '../biomech/types';

/** every claim of a sheet, with where it sits */
function claims(s: (typeof SHEETS)[number]): [string, Claim][] {
  const out: [string, Claim][] = [];
  for (const [k, v] of Object.entries(s)) if (Array.isArray(v) && v.length && typeof v[0] === 'object' && 'text' in v[0] && 'sources' in v[0]) for (const c of v as Claim[]) out.push([k, c]);
  for (const p of s.phases) for (const c of p.claims) out.push([`phase ${p.name}`, c]);
  return out;
}

describe('fiches biomécaniques', () => {
  test.each(SHEETS.map((s) => [s.id, s] as const))('%s : technique existante, sources connues et citées', (_, s) => {
    expect(TECHNIQUE_BY_ID.has(s.id), 'technique du catalogue').toBe(true);
    for (const id of s.sources) expect(SOURCE_BY_ID.has(id), `source ${id}`).toBe(true);
    for (const [where, c] of claims(s)) for (const id of c.sources) {
      expect(SOURCE_BY_ID.has(id), `${where} : source ${id} inconnue`).toBe(true);
      expect(s.sources, `${where} : ${id} absente de la liste des sources de la fiche`).toContain(id);
    }
    for (const f of s.findings) for (const id of f.sources) expect(s.sources).toContain(id);
  });

  test.each(SHEETS.map((s) => [s.id, s] as const))('%s : « Validée » seulement après une revue d’expert documentée', (_, s) => {
    if (s.status === 'validee') {
      expect(s.review, 'revue d’expert').toBeDefined();
      expect(s.review!.criteria.length).toBeGreaterThan(0);
    }
    // a sheet is "documentée" or beyond only when it has sources
    if (s.status !== 'a-documenter') expect(s.sources.length).toBeGreaterThan(0);
  });
});

const INVENTORY = 'docs/audit-biomecanique/INVENTAIRE.md';
const RESEARCH = 'docs/audit-biomecanique/recherche';
const SHEET_LABEL: Record<SheetStatus, string> = {
  'a-documenter': 'À documenter',
  documentee: 'Documentée',
  'animation-en-cours': 'Animation en cours',
  'a-corriger': 'À corriger',
  'validation-necessaire': 'Validation technique nécessaire',
  validee: 'Validée',
};

/** inventory of every technique of the catalogue with its audit state, generated */
function inventory() {
  const reports = readdirSync(RESEARCH).filter((f) => f.endsWith('.md')).map((f) => [f, readFileSync(`${RESEARCH}/${f}`, 'utf8')] as const);
  const notes = (id: string) => reports.filter(([, txt]) => txt.includes(`\`${id}\``)).map(([f]) => `[${f.replace('.md', '')}](recherche/${f})`).join(', ') || 'aucune';
  const state = (id: string) => SHEET_LABEL[SHEET_BY_ID.get(id)?.status ?? 'a-documenter'];
  const solo = TECHNIQUES.filter((t) => t.mode !== 'partenaire');
  const count = (st: string) => [...solo.map((t) => t.id), ...PARTNER_TECHNIQUES.map((t) => t.id)].filter((id) => state(id) === st).length;
  return [
    '# Inventaire des techniques',
    '',
    'Généré par `INVENTORY_UPDATE=1 npx vitest run src/domain/__tests__/biomech.test.ts`. Ne pas modifier à la main.',
    '',
    '- **Statut de la fiche** : avancement de la fiche biomécanique structurée (`src/domain/biomech/sheets/`). « À documenter » veut dire qu’il n’y a pas encore de fiche structurée, même si des notes de recherche existent.',
    '- **Notes de recherche** : rapport(s) de `recherche/` qui traitent la technique.',
    '- **Animation** : registre des contrôles automatiques ([ANIMATIONS.md](../ANIMATIONS.md)). « Contrôlée automatiquement » ne veut pas dire validée par un expert.',
    '',
    `Bilan : ${solo.length} techniques solo, ${PARTNER_TECHNIQUES.length} fiches avec partenaire. Fiches : ${Object.values(SHEET_LABEL).map((l) => `${count(l)} ${l.toLowerCase()}`).join(', ')}.`,
    '',
    '## Techniques solo',
    '',
    '| Technique | Disciplines | Catégorie | Statut de la fiche | Notes de recherche | Animation |',
    '|---|---|---|---|---|---|',
    ...solo.map((t) => `| ${t.name} (\`${t.id}\`) | ${t.disciplines.join(', ')} | ${t.category} | ${state(t.id)} | ${notes(t.id)} | ${STATUS_LABEL[animationStatusOf(t.id)?.status ?? 'manquante']} |`),
    '',
    '## Fiches avec partenaire (judo, BJJ)',
    '',
    '| Technique | Discipline | Catégorie | Niveau | Statut de la fiche | Notes de recherche | Animation |',
    '|---|---|---|---|---|---|---|',
    ...PARTNER_TECHNIQUES.map((t) => `| ${t.name} (\`${t.id}\`) | ${t.discipline} | ${t.category} | ${t.level} | ${state(t.id)} | ${notes(t.id)} | Non implémentée (pas de système à deux corps) |`),
    '',
  ].join('\n');
}

test('l’inventaire est à jour', () => {
  const md = inventory();
  if (process.env.INVENTORY_UPDATE) writeFileSync(INVENTORY, md);
  expect(existsSync(INVENTORY) ? readFileSync(INVENTORY, 'utf8') : '').toBe(md);
});
