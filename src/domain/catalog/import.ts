import { STATUS_RANK } from './loader';
import type { ImportedData } from './loader';
import { CATALOG_SCHEMA } from './types';
import type { CatalogChampion, CatalogCombo, CatalogFile } from './types';
import { sequenceKey, validateChampion, validateCombo } from './validate';

export const MAX_IMPORT = 5000;

export interface ImportResult {
  /** données importées à conserver (remplace l’état précédent) */
  next: ImportedData;
  added: string[];
  updated: string[];
  championsAdded: string[];
  /** fiches de base remplacées par une fiche importée au statut plus fort */
  superseded: string[];
  rejected: { id: string; reasons: string[] }[];
  /** erreur bloquante (fichier illisible, mauvais schéma) : rien n’est importé */
  error?: string;
}

/**
 * Fusionne un fichier JSON au format du catalogue (schéma 1) dans les données importées :
 * chaque fiche est validée (techniques connues et autorisées, statut honnête, champs complets),
 * les identifiants du catalogue officiel sont protégés et une séquence déjà présente n’est pas
 * ajoutée une deuxième fois. Réimporter une fiche avec le même identifiant la met à jour.
 */
export function importCatalog(base: CatalogFile, current: ImportedData, data: unknown): ImportResult {
  const res: ImportResult = { next: current, added: [], updated: [], championsAdded: [], superseded: [], rejected: [] };
  const f = data as Partial<CatalogFile>;
  if (!f || typeof f !== 'object') return { ...res, error: 'Le fichier n’est pas un JSON valide.' };
  if (f.schema !== CATALOG_SCHEMA) return { ...res, error: `Schéma ${String(f.schema)} non pris en charge : le fichier doit indiquer "schema": ${CATALOG_SCHEMA}.` };
  const inChamps = Array.isArray(f.champions) ? f.champions : [];
  const inCombos = Array.isArray(f.combos) ? f.combos : [];
  if (!inCombos.length && !inChamps.length) return { ...res, error: 'Aucune fiche ni aucun champion dans le fichier.' };
  if (inCombos.length > MAX_IMPORT) return { ...res, error: `Trop de fiches dans un seul fichier (maximum ${MAX_IMPORT}).` };

  const baseChampIds = new Set(base.champions.map((c) => c.id));
  const champs = new Map<string, CatalogChampion>(base.champions.map((c) => [c.id, c]));
  const keptChamps = new Map<string, CatalogChampion>(current.champions.map((c) => [c.id, c]));
  for (const c of current.champions) if (!champs.has(c.id)) champs.set(c.id, c);
  for (const ch of inChamps) {
    const p = validateChampion(ch);
    const id = (ch as CatalogChampion)?.id ?? '?';
    if (p.length) res.rejected.push({ id: `champion ${id}`, reasons: p });
    else if (baseChampIds.has(ch.id)) continue; // profil officiel conservé, les fiches peuvent s’y rattacher
    else {
      if (!keptChamps.has(ch.id)) res.championsAdded.push(ch.id);
      keptChamps.set(ch.id, ch);
      champs.set(ch.id, ch);
    }
  }

  const baseIds = new Set(base.combos.map((c) => c.id));
  const kept = new Map<string, CatalogCombo>(current.combos.map((c) => [c.id, c]));
  const owner = new Map<string, { id: string; status: CatalogCombo['status']; base: boolean }>();
  for (const c of base.combos) owner.set(sequenceKey(c), { id: c.id, status: c.status, base: true });
  for (const c of current.combos) owner.set(sequenceKey(c), { id: c.id, status: c.status, base: false });

  for (const raw of inCombos) {
    const c = raw as CatalogCombo;
    const id = typeof c?.id === 'string' ? c.id : '?';
    const reasons = validateCombo(c, champs);
    if (!reasons.length && baseIds.has(c.id)) reasons.push('identifiant déjà utilisé par le catalogue officiel');
    if (!reasons.length) {
      const k = sequenceKey(c);
      const o = owner.get(k);
      if (o && o.id !== c.id) {
        if (o.base && STATUS_RANK[c.status] > STATUS_RANK[o.status]) res.superseded.push(o.id);
        else reasons.push(`séquence déjà présente dans la fiche ${o.id}`);
      }
    }
    if (reasons.length) {
      res.rejected.push({ id, reasons });
      continue;
    }
    const old = kept.get(c.id);
    if (old) owner.delete(sequenceKey(old));
    owner.set(sequenceKey(c), { id: c.id, status: c.status, base: false });
    (old ? res.updated : res.added).push(c.id);
    kept.set(c.id, c);
  }
  res.next = { champions: [...keptChamps.values()], combos: [...kept.values()] };
  return res;
}
