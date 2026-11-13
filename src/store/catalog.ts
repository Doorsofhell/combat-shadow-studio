import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from './storage';
import { EMPTY_IMPORT, buildCatalog, loadCatalogFile } from '../domain/catalog/loader';
import type { ImportedData } from '../domain/catalog/loader';
import { importCatalog } from '../domain/catalog/import';
import type { ImportResult } from '../domain/catalog/import';
import type { Catalog, CatalogFile } from '../domain/catalog/types';

export interface CatalogHistoryItem {
  id: string;
  /** ouvert : fiche consultée ; entraine : séance lancée */
  kind: 'ouvert' | 'entraine';
  at: string;
}

export interface CatalogCollection {
  id: string;
  name: string;
  ids: string[];
  createdAt: string;
}

export interface CatalogUserData {
  favorites: string[];
  /** v0.32 (navigation, fiche d'une légende: « Favoris — Ajouter/retirer des favoris »): the legends kept as favourites */
  favoriteChampions: string[];
  history: CatalogHistoryItem[];
  collections: CatalogCollection[];
  imported: ImportedData;
}

export const DEFAULT_CATALOG_USER: CatalogUserData = { favorites: [], favoriteChampions: [], history: [], collections: [], imported: EMPTY_IMPORT };
export const HISTORY_MAX = 60;

interface CatalogUserState extends CatalogUserData {
  toggleFavorite: (id: string) => void;
  toggleFavoriteChampion: (id: string) => void;
  pushHistory: (id: string, kind: CatalogHistoryItem['kind']) => void;
  clearHistory: () => void;
  createCollection: (name: string, ids?: string[]) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  addToCollection: (collectionId: string, comboId: string) => void;
  removeFromCollection: (collectionId: string, comboId: string) => void;
  /** valide puis fusionne un fichier JSON (schéma 1) ; rien n’est modifié en cas d’erreur bloquante */
  importFile: (base: CatalogFile, data: unknown) => ImportResult;
  removeImported: (comboId: string) => void;
  clearImported: () => void;
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const useCatalogUser = create<CatalogUserState>()(
  persist(
    (setState, getState) => ({
      ...DEFAULT_CATALOG_USER,
      toggleFavorite: (id) => setState((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [id, ...s.favorites] })),
      toggleFavoriteChampion: (id) => setState((s) => ({ favoriteChampions: s.favoriteChampions.includes(id) ? s.favoriteChampions.filter((x) => x !== id) : [id, ...s.favoriteChampions] })),
      pushHistory: (id, kind) =>
        setState((s) => ({
          history: [{ id, kind, at: new Date().toISOString() }, ...s.history.filter((h) => !(h.id === id && h.kind === kind))].slice(0, HISTORY_MAX),
        })),
      clearHistory: () => setState({ history: [] }),
      createCollection: (name, ids = []) => {
        const id = newId();
        setState((s) => ({ collections: [...s.collections, { id, name: name.trim() || 'Ma collection', ids: [...new Set(ids)], createdAt: new Date().toISOString() }] }));
        return id;
      },
      renameCollection: (id, name) => setState((s) => ({ collections: s.collections.map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c)) })),
      deleteCollection: (id) => setState((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),
      addToCollection: (cid, comboId) =>
        setState((s) => ({ collections: s.collections.map((c) => (c.id === cid && !c.ids.includes(comboId) ? { ...c, ids: [...c.ids, comboId] } : c)) })),
      removeFromCollection: (cid, comboId) => setState((s) => ({ collections: s.collections.map((c) => (c.id === cid ? { ...c, ids: c.ids.filter((x) => x !== comboId) } : c)) })),
      importFile: (base, data) => {
        const r = importCatalog(base, getState().imported, data);
        if (!r.error) setState({ imported: r.next });
        return r;
      },
      removeImported: (comboId) => setState((s) => ({ imported: { ...s.imported, combos: s.imported.combos.filter((c) => c.id !== comboId) } })),
      clearImported: () => setState({ imported: EMPTY_IMPORT }),
    }),
    {
      name: 'css-catalog',
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ favorites: s.favorites, favoriteChampions: s.favoriteChampions, history: s.history, collections: s.collections, imported: s.imported }),
      // données d’une ancienne version : les champs manquants prennent leur valeur par défaut
      merge: (saved, current) => {
        const p = (saved ?? {}) as Partial<CatalogUserData>;
        return {
          ...current,
          favorites: Array.isArray(p.favorites) ? p.favorites : [],
          favoriteChampions: Array.isArray(p.favoriteChampions) ? p.favoriteChampions : [],
          history: Array.isArray(p.history) ? p.history : [],
          collections: Array.isArray(p.collections) ? p.collections : [],
          imported: { champions: p.imported?.champions ?? [], combos: p.imported?.combos ?? [] },
        };
      },
    },
  ),
);

/** catalogue officiel chargé à la demande (non persisté : le service worker le garde hors ligne) */
interface CatalogDataState {
  file: CatalogFile | null;
  error: string | null;
  loading: boolean;
  load: () => Promise<void>;
}

export const useCatalogData = create<CatalogDataState>()((setState, getState) => ({
  file: null,
  error: null,
  loading: false,
  load: async () => {
    if (getState().file || getState().loading) return;
    setState({ loading: true, error: null });
    try {
      setState({ file: await loadCatalogFile(), loading: false });
    } catch (e) {
      setState({ error: `Impossible de charger la bibliothèque (${(e as Error).message}).`, loading: false });
    }
  },
}));

/**
 * Catalogue complet (base + imports) ; déclenche le chargement au premier usage (si `enabled`).
 * catalog vaut null tant que le fichier n’est pas chargé.
 */
export function useCatalog(enabled = true): { catalog: Catalog | null; error: string | null; retry: () => void } {
  const file = useCatalogData((s) => s.file);
  const error = useCatalogData((s) => s.error);
  const load = useCatalogData((s) => s.load);
  const imported = useCatalogUser((s) => s.imported);
  useEffect(() => {
    if (enabled) void load();
  }, [load, enabled]);
  const catalog = useMemo(() => (file ? buildCatalog(file, imported) : null), [file, imported]);
  return { catalog, error, retry: () => void load() };
}
