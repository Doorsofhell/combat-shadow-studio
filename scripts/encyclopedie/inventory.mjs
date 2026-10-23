// v0.46 Encyclopédie: writes the inventory, the family × discipline matrix and the list of illustrations with their
// provenance, from the data itself (never typed by hand). Usage: node scripts/encyclopedie/inventory.mjs <out dir>
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const [OUT = 'docs/v046-encyclopedie'] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const E = await vite.ssrLoadModule('/src/domain/encyclopedia/index.ts');
const { DISCIPLINES } = await vite.ssrLoadModule('/src/domain/types.ts');
await vite.close();

const { TERMS, FAMILIES, IMAGES, imageOf, encyclopediaSource, coverage } = E;
const c = coverage();
const D = DISCIPLINES.map((d) => d.id);
const dn = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.name]));
const file = (img) => img?.file && existsSync(`public/encyclopedie/${img.file}.webp`);

let md = `# Encyclopédie v1.0 · inventaire\n\nGénéré par \`node scripts/encyclopedie/inventory.mjs\` à partir des données (\`src/domain/encyclopedia/\`).\n\n`;
md += `**${c.total} fiches**, toutes au statut « vérifiée sur ses sources » ; **${c.reviewed}** relue par un expert de la discipline (relecture à venir). Cette base n'est pas exhaustive.\n\n`;
md += `## Matrice familles × disciplines\n\nNombre de fiches qui concernent chaque discipline (une fiche peut concerner plusieurs disciplines).\n\n`;
md += `| Famille | Fiches | ${D.map((d) => dn[d]).join(' | ')} |\n|---|---|${D.map(() => '---').join('|')}|\n`;
for (const f of FAMILIES) {
  const ts = TERMS.filter((t) => t.family === f.id);
  md += `| ${f.label} | ${ts.length} | ${D.map((d) => ts.filter((t) => t.disciplines.includes(d)).length).join(' | ')} |\n`;
}
md += `| **Total** | **${c.total}** | ${D.map((d) => `**${c.byDiscipline.find((x) => x.d === d).count}**`).join(' | ')} |\n\n`;

md += `## Fiches\n\n| Famille | Sous-famille | Fiche | Disciplines | Sources | Illustration |\n|---|---|---|---|---|---|\n`;
for (const f of FAMILIES)
  for (const t of TERMS.filter((x) => x.family === f.id)) {
    const img = imageOf(t.image);
    const st = img?.origin.kind === 'rendu-3d' ? (file(img) ? 'rendu' : 'rendu manquant') : 'à produire';
    const sub = f.subfamilies.find((s) => s.id === t.sub)?.label ?? t.sub;
    md += `| ${f.label} | ${sub} | ${t.name} | ${t.disciplines.map((d) => dn[d]).join(', ')} | ${t.sources.length} | ${st} |\n`;
  }
writeFileSync(`${OUT}/INVENTAIRE.md`, md);

// illustrations
const all = [...new Set([...TERMS.map((t) => t.image), ...FAMILIES.map((f) => f.image)])].map((id) => IMAGES.get(id)).filter(Boolean);
const made = all.filter((i) => i.origin.kind === 'rendu-3d');
const todo = all.filter((i) => i.origin.kind === 'a-produire');
let il = `# Encyclopédie v1.0 · illustrations\n\nGénéré par \`node scripts/encyclopedie/inventory.mjs\`. Aucune image téléchargée : toutes sont des rendus des coachs et des tenues de l'application (navigateur, vue Lab) ou des scènes Blender du dépôt. Les illustrations qui manquent sont annoncées dans l'application (« Illustration à produire »), jamais remplacées par un pictogramme.\n\n`;
il += `**${made.length} illustrations produites**, **${todo.length} à produire**.\n\n## Produites\n\n| Image | Fichier | Ce qu'elle montre | Outil | Date |\n|---|---|---|---|---|\n`;
for (const i of made) il += `| ${i.alt} | \`public/encyclopedie/${i.file}.webp\`${file(i) ? '' : ' (MANQUANT)'} | ${i.origin.what} | ${i.origin.tool} | ${i.origin.date} |\n`;
il += `\n## À produire (brief)\n\n| Image | Brief |\n|---|---|\n`;
for (const i of todo) il += `| ${i.alt} | ${i.origin.brief} |\n`;
writeFileSync(`${OUT}/ILLUSTRATIONS.md`, il);

// sources
const used = [...new Set(TERMS.flatMap((t) => t.sources))].map((id) => [id, encyclopediaSource(id)]);
let sm = `# Encyclopédie v1.0 · sources\n\nGénéré par \`node scripts/encyclopedie/inventory.mjs\`. Chaque source a été consultée à la date indiquée ; aucune vidéo n'a été visionnée.\n\n| Id | Auteur | Titre | Consultée | Fiches |\n|---|---|---|---|---|\n`;
for (const [id, s] of used) sm += `| ${id} | ${s.by} | [${s.title}](${s.url}) | ${s.consulted} | ${TERMS.filter((t) => t.sources.includes(id)).length} |\n`;
writeFileSync(`${OUT}/SOURCES.md`, sm);
console.log('fiches', c.total, 'illustrations', made.length, 'à produire', todo.length, 'sources', used.length);
