// Writes docs/icones/INVENTAIRE.md: every icon of the register and every place it is used in the
// interface (file:line), read from the code. Run after any icon change: node scripts/icon-inventory.mjs
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const reg = readFileSync('src/ui/icons/registry.ts', 'utf8');
const entries = [...reg.matchAll(/^\s+(\w+): \{ family: '(\w+)', name: '([^']+)' \}/gm)].map((m) => ({ id: m[1], family: m[2], name: m[3] }));
const files = (function walk(d) {
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    if (statSync(p).isDirectory()) return p.includes('__tests__') || p.endsWith('/icons') ? [] : walk(p);
    return p.endsWith('.tsx') ? [p] : [];
  });
})('src/ui');
const uses = new Map(entries.map((e) => [e.id, []]));
const disc = [];
for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/<(?:AppIcon|NavigationIcon|ActionIcon|TrainingControlIcon|StatusIcon) id=(?:"(\w+)"|\{([^}]*)\})/g)) {
      const ids = m[1] ? [m[1]] : [...m[2].matchAll(/'(\w+)'/g)].map((x) => x[1]);
      for (const id of ids) uses.get(id)?.push(`${f.replace('src/ui/', '')}:${i + 1}`);
    }
    // ids given as data: icon="x" (Panel), icon: 'x' (tab lists), maps of ids (STATUS_ICON)
    for (const m of l.matchAll(/\bicon(?:=|: )["'](\w+)["']/g)) uses.get(m[1])?.push(`${f.replace('src/ui/', '')}:${i + 1}`);
    if (/_ICON\b.*=/.test(l)) for (const m of l.matchAll(/: '(\w+)'/g)) uses.get(m[1])?.push(`${f.replace('src/ui/', '')}:${i + 1}`);
    if (/<DisciplineIcon /.test(l)) disc.push(`${f.replace('src/ui/', '')}:${i + 1}`);
  });
}
const FAM = { navigation: 'Navigation', acces: 'Accès rapides et menus secondaires', compte: 'Compte et réglages', entrainement: 'Commandes d’entraînement', action: 'Actions', statut: 'Statuts et niveaux' };
let md = '# Inventaire des icônes\n\nGénéré par `node scripts/icon-inventory.mjs` à partir du code : chaque icône du registre (`src/ui/icons/registry.ts`) et chaque endroit où elle est affichée. « Aucun » veut dire que l’icône est dessinée et prête, mais qu’aucun écran ne l’utilise encore (fonction absente de l’application, ou réservée).\n\n';
md += `## Disciplines (\`DisciplineIcon\`, 6 icônes)\n\nBoxe anglaise : gant de boxe · Kick-boxing : protège-tibia · MMA : gant à doigts ouverts · Muay-thaï : mongkol · Jiu-jitsu brésilien : ceinture noire à barrette rouge · Judo : judogi et ceinture noire.\n\nEmplacements (${disc.length}) : ${disc.join(', ')}\n\n`;
for (const [fam, title] of Object.entries(FAM)) {
  const rows = entries.filter((e) => e.family === fam);
  md += `## ${title} (${rows.length})\n\n| Identifiant | Nom | Emplacements |\n|---|---|---|\n`;
  for (const e of rows) md += `| \`${e.id}\` | ${e.name} | ${uses.get(e.id).length ? uses.get(e.id).join(', ') : 'Aucun'} |\n`;
  md += '\n';
}
const used = entries.filter((e) => uses.get(e.id).length).length;
md += `**Total** : ${entries.length} icônes d’interface dont ${used} affichées, et 6 icônes de discipline affichées à ${disc.length} endroits.\n`;
mkdirSync('docs/icones', { recursive: true });
writeFileSync('docs/icones/INVENTAIRE.md', md);
console.log(`${entries.length} icônes, ${used} utilisées, ${disc.length} emplacements de discipline`);
