import type { Catalog, CatalogChampion, CatalogCombo, CatalogFile, CatalogOrg, CatalogStatus } from './types';
import { isValidated } from './types';
import { sequenceKey } from './validate';

/** URL relative : fonctionne en PWA (mise en cache hors ligne par le service worker) comme dans l’APK */
export const CATALOG_URL = './catalog/catalog-v1.json';
/** Catalogue validé (2026-11-06) : combinaisons des programmes officiels des fédérations (fichier séparé, jamais produit par le générateur des fiches inspirées) */
export const PROGRAMS_URL = './catalog/programmes-v1.json';

/** fiches et profils ajoutés par l’utilisateur (import JSON), conservés dans le store */
export interface ImportedData {
  champions: CatalogChampion[];
  combos: CatalogCombo[];
}

export const EMPTY_IMPORT: ImportedData = { champions: [], combos: [] };

let pending: Promise<CatalogFile> | null = null;

/**
 * Charge le catalogue à la demande (jamais inclus dans le bundle principal). La promesse est
 * mémorisée ; en cas d’échec, l’appel suivant réessaie.
 */
export function loadCatalogFile(fetcher: typeof fetch = fetch): Promise<CatalogFile> {
  if (!pending) {
    const json = (url: string) =>
      fetcher(url).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CatalogFile>;
      });
    // les fiches de programme sont un complément : si leur fichier manque, la bibliothèque s’ouvre quand même
    const programs = json(PROGRAMS_URL).catch(() => undefined);
    pending = Promise.all([json(CATALOG_URL), programs])
      .then(([base, prog]) => mergeCatalogFiles(base, prog))
      .catch((e) => {
        pending = null;
        throw e;
      });
  }
  return pending;
}

/**
 * Ajoute les fiches de programme fédéral au catalogue de base : leurs organismes viennent avec elles.
 * Une fiche dont l’identifiant existe déjà dans la base est ignorée (la base ne change jamais).
 */
export function mergeCatalogFiles(base: CatalogFile, prog?: CatalogFile): CatalogFile {
  if (!prog || !Array.isArray(prog.combos)) return base;
  const ids = new Set(base.combos.map((c) => c.id));
  return {
    ...base,
    orgs: [...(base.orgs ?? []), ...(prog.orgs ?? [])],
    combos: [...base.combos, ...prog.combos.filter((c) => !ids.has(c.id))],
  };
}

export const STATUS_RANK: Record<CatalogStatus, number> = { inspiree: 1, adaptee: 2, programme: 3, verifiee: 4 };

/**
 * Catalogue final : base officielle + imports. Une fiche importée dont la séquence existe déjà
 * dans la base remplace la fiche de base seulement si son statut est plus fort (une séquence
 * vérifiée prime sur une fiche inspirée) ; une même séquence n’est jamais créditée deux fois.
 */
export function buildCatalog(base: CatalogFile, imported: ImportedData = EMPTY_IMPORT): Catalog {
  const championById = new Map<string, CatalogChampion>(base.champions.map((c) => [c.id, c]));
  for (const c of imported.champions) if (!championById.has(c.id)) championById.set(c.id, c);
  const baseIds = new Set(base.combos.map((c) => c.id));
  const bySeq = new Map<string, CatalogCombo>(base.combos.map((c) => [sequenceKey(c), c]));
  const removed = new Set<string>();
  const extra: CatalogCombo[] = [];
  for (const c of imported.combos) {
    if (baseIds.has(c.id) || !championById.has(c.champion)) continue;
    const k = sequenceKey(c);
    const prev = bySeq.get(k);
    if (prev) {
      if (STATUS_RANK[c.status] <= STATUS_RANK[prev.status]) continue;
      removed.add(prev.id);
    }
    bySeq.set(k, c);
    extra.push(c);
  }
  // Catalogue validé (Youssef, 2026-11-06 : « garder, validées en premier ») : les fiches appuyées sur une source
  // vérifiable passent en tête de toutes les listes ; l’ordre relatif reste celui des fichiers
  const all = [...base.combos.filter((c) => !removed.has(c.id)), ...extra];
  const combos = [...all.filter((c) => isValidated(c.status)), ...all.filter((c) => !isValidated(c.status))];
  return {
    ...base,
    champions: [...championById.values()],
    combos,
    comboById: new Map(combos.map((c) => [c.id, c])),
    championById,
    orgById: new Map<string, CatalogOrg>((base.orgs ?? []).map((o) => [o.id, o])),
    imported: new Set(extra.map((c) => c.id)),
  };
}
