/**
 * 2.3.3 (Youssef 2026-11-20, P0 « Version et documentation désynchronisées ») : the figures of the README and of
 * docs/ETAT.md are no longer typed by hand. They are counted here from the real catalogues of the app, and written
 * into the documents by `npm run docs:sync` (scripts/docs-sync.mjs). src/domain/version-sync.test.ts fails as soon as
 * a document no longer matches (a technique added, a new version without its Nouveautés entry…).
 *
 * Not used by the app itself (the combination catalogues are read from public/catalog by the caller, so the 1.8 MB
 * JSON never enters the bundle).
 */
import { ALL_COACHES } from './coaches/catalog';
import { EXERCISES } from './exercises';
import { PROGRAMS } from './programs';
import { RELEASES } from './releases';
import { techniquesFor, TECHNIQUES } from './techniques';
import { DISCIPLINES, LEVELS, type DisciplineId } from './types';

export const PUBLIC_URL = 'https://doorsofhell.github.io/combat-shadow-studio/';

/** the part of public/catalog/*.json the documents need */
export interface ComboCatalogFile {
  version: string;
  updatedAt: string;
  champions: readonly unknown[];
  combos: readonly { discipline: string; status: string }[];
}

export interface FactsInput {
  /** package.json version, the only source */
  version: string;
  /** from scripts/android-version.mjs (same formula as the Play Store build) */
  versionCode: number;
  legends: ComboCatalogFile;
  programmes: ComboCatalogFile;
}

export interface DisciplineFacts {
  id: DisciplineId;
  name: string;
  techniques: number;
  exercises: number;
  combos: number;
}

export interface ProjectFacts {
  version: string;
  versionCode: number;
  releaseDate: string;
  releaseTitle: string;
  releases: number;
  disciplines: DisciplineFacts[];
  levels: string[];
  techniques: number;
  exercises: number;
  programs: number;
  coaches: { name: string; nickname: string }[];
  legends: { version: string; updatedAt: string; champions: number; combos: number; statuses: Record<string, number> };
  programmeCombos: number;
}

export function projectFacts(input: FactsInput): ProjectFacts {
  const top = RELEASES[0];
  const statuses: Record<string, number> = {};
  for (const c of input.legends.combos) statuses[c.status] = (statuses[c.status] ?? 0) + 1;
  return {
    version: input.version,
    versionCode: input.versionCode,
    releaseDate: top?.releaseDate ?? '',
    releaseTitle: top?.title ?? '',
    releases: RELEASES.length,
    disciplines: DISCIPLINES.map((d) => ({
      id: d.id,
      name: d.name,
      techniques: techniquesFor(d.id).length,
      exercises: EXERCISES.filter((e) => e.discipline === d.id).length,
      combos: input.legends.combos.filter((c) => c.discipline === d.id).length,
    })),
    levels: LEVELS.map((l) => l.name),
    techniques: TECHNIQUES.length,
    exercises: EXERCISES.length,
    programs: PROGRAMS.length,
    coaches: ALL_COACHES.map((c) => ({ name: c.name, nickname: c.nickname })),
    legends: { version: input.legends.version, updatedAt: input.legends.updatedAt, champions: input.legends.champions.length, combos: input.legends.combos.length, statuses },
    programmeCombos: input.programmes.combos.length,
  };
}

const nf = (n: number) => n.toLocaleString('fr-FR').replace(/ | /g, ' ');
const NUMBER_WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];
const inWords = (n: number) => NUMBER_WORDS[n] ?? nf(n);
const lowerList = (names: string[]) => {
  const l = names.map((n) => (n === 'MMA' ? n : n.charAt(0).toLowerCase() + n.slice(1)));
  return l.length > 1 ? `${l.slice(0, -1).join(', ')} et ${l[l.length - 1]}` : (l[0] ?? '');
};
const frDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return y && m && d ? `${d} ${months[m - 1]} ${y}` : iso;
};

/** markers around a generated block; what lies between them is rewritten by `npm run docs:sync` */
export const begin = (id: string) => `<!-- GÉNÉRÉ:${id} — ne pas modifier à la main, lancer « npm run docs:sync » -->`;
export const end = (id: string) => `<!-- FIN GÉNÉRÉ:${id} -->`;

const STATUS_LABEL: Record<string, string> = { inspiree: 'inspirées', verifiee: 'vérifiées', 'a-verifier': 'à vérifier' };

/** the README introduction and its table of figures */
export function readmeBlock(f: ProjectFacts): string {
  const rows = f.disciplines.map((d) => `| ${d.name} | ${d.techniques} | ${d.exercises} | ${nf(d.combos)} |`);
  return [
    `Version **${f.version}** (${frDate(f.releaseDate)}) : ${f.releaseTitle}. Version testable en ligne : ${PUBLIC_URL}`,
    '',
    `Application d’entraînement solo en shadow boxing, guidée par un coach 3D, pour ${inWords(f.disciplines.length)} disciplines :`,
    `${lowerList(f.disciplines.map((d) => d.name))}, sur ${inWords(f.levels.length)} niveaux (${f.levels.join(', ').toLowerCase()}).`,
    'Interface entièrement en français, données stockées uniquement sur l’appareil. Web app (PWA) et application Android.',
    '',
    `| Discipline | Techniques | Exercices | Combinaisons des légendes |`,
    '| --- | ---: | ---: | ---: |',
    ...rows,
    `| **Total** | **${f.techniques}** | **${f.exercises}** | **${nf(f.legends.combos)}** |`,
    '',
    `Une technique commune à plusieurs disciplines (le direct, par exemple) est une seule définition comptée une fois dans le total.`,
    `Programmes : ${f.programs}. Coachs 3D : ${f.coaches.length} (${f.coaches.map((c) => c.name).join(', ')}). Légendes : ${f.legends.champions} champions.`,
  ].join('\n');
}

/** the generated head of docs/ETAT.md */
export function etatBlock(f: ProjectFacts): string {
  const statuses = Object.entries(f.legends.statuses)
    .map(([s, n]) => `${nf(n)} ${STATUS_LABEL[s] ?? s}`)
    .join(', ');
  return [
    `# État du projet — version ${f.version}`,
    '',
    `Dernière version annoncée dans Nouveautés : **${f.version}** du ${frDate(f.releaseDate)}, « ${f.releaseTitle} » (${f.releases} versions au total).`,
    '',
    '## Version et publication',
    '',
    '| Élément | Valeur | Origine |',
    '| --- | --- | --- |',
    `| Version de l’application | ${f.version} | \`package.json\` (source unique) |`,
    `| Titre de la page, Réglages › À propos, écran de démarrage | v${f.version} | injectée au build (\`vite.config.ts\`) |`,
    `| Android versionName / versionCode | ${f.version} / ${f.versionCode} | \`scripts/android-version.mjs\` (x × 10000 + y × 100 + z) |`,
    `| Nouveautés | ${f.version} | première entrée de \`src/domain/releases.ts\` |`,
    `| Informations de publication | \`version.json\` | écrit à chaque build (\`tools/build/releaseInfo.ts\`) |`,
    '',
    `Version testable en ligne (GitHub Pages) : ${PUBLIC_URL} ; version réellement déployée : ${PUBLIC_URL}version.json`,
    '',
    '## Contenu réel de l’application',
    '',
    '| Discipline | Techniques | Exercices | Combinaisons des légendes |',
    '| --- | ---: | ---: | ---: |',
    ...f.disciplines.map((d) => `| ${d.name} | ${d.techniques} | ${d.exercises} | ${nf(d.combos)} |`),
    `| **Total** | **${f.techniques}** | **${f.exercises}** | **${nf(f.legends.combos)}** |`,
    '',
    `- ${inWords(f.disciplines.length).replace(/^./, (c) => c.toUpperCase())} disciplines, ${inWords(f.levels.length)} niveaux : ${f.levels.join(', ')}.`,
    `- ${f.techniques} techniques (une technique commune à plusieurs disciplines compte une fois dans le total).`,
    `- ${f.exercises} exercices et ${f.programs} programmes.`,
    `- ${f.coaches.length} coachs 3D : ${f.coaches.map((c) => `${c.name} « ${c.nickname} »`).join(', ')}.`,
    `- Catalogue des légendes ${f.legends.version} (${f.legends.updatedAt}) : ${f.legends.champions} champions, ${nf(f.legends.combos)} combinaisons (${statuses}).`,
    `- Catalogue des programmes : ${f.programmeCombos} enchaînements.`,
  ].join('\n');
}

/** replaces the generated block `id` inside `doc` (the markers must be present once) */
export function replaceBlock(doc: string, id: string, body: string): string {
  const a = doc.indexOf(begin(id));
  const b = doc.indexOf(end(id));
  if (a < 0 || b < a) throw new Error(`bloc généré « ${id} » introuvable`);
  return `${doc.slice(0, a)}${begin(id)}\n${body}\n${doc.slice(b)}`;
}
