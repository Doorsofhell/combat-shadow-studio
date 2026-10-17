import { DEFAULT_PROFILE, normalizeProfile, useProfile } from '../../store/profile';
import type { Profile } from '../../store/profile';
import { useStats } from '../../store/stats';
import type { SessionRecord } from '../../store/stats';
import { useCustom } from '../../store/custom';
import type { CustomCombo } from '../../store/custom';
import { DEFAULT_GOALS, useGoals } from '../../store/goals';
import { useFighters } from '../../store/fighters';
import type { Fighter } from '../../store/fighters';
import { useCatalogUser } from '../../store/catalog';
import type { CatalogCollection } from '../../store/catalog';
import type { Snapshot } from './model';

/** how one store is seen by the sync engine */
export interface CollectionDef {
  name: string;
  snapshot(): Snapshot;
  apply(s: Snapshot): void;
  subscribe(cb: () => void): () => void;
}

/** profile fields that never leave the device */
export const LOCAL_ONLY_PROFILE_FIELDS: (keyof Profile)[] = ['limitations'];

const byId = <T extends { id: string }>(xs: T[]) => Object.fromEntries(xs.map((x) => [x.id, x]));
/** keeps the current order for items still present, appends the new ones */
function ordered(current: string[], next: string[]) {
  const set = new Set(next);
  return [...current.filter((x) => set.has(x)), ...next.filter((x) => !current.includes(x))];
}
const nullToUndef = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === null ? undefined : v]));

const profileDef: CollectionDef = {
  name: 'profile',
  snapshot: () => {
    const p = { ...useProfile.getState().profile } as Record<string, unknown>;
    for (const k of LOCAL_ONLY_PROFILE_FIELDS) delete p[k];
    // optional fields stay present (null) so clearing one is synchronised too
    for (const k of ['lastName', 'firstName', 'birthDate', 'age', 'heightCm', 'weightKg', 'yearsExperience']) p[k] = p[k] ?? null;
    return { fields: p, items: {} };
  },
  apply: ({ fields }) => {
    const cur = useProfile.getState().profile;
    useProfile.setState({ profile: { ...normalizeProfile({ ...DEFAULT_PROFILE, ...(nullToUndef(fields) as Partial<Profile>) }), limitations: cur.limitations } });
  },
  subscribe: (cb) => useProfile.subscribe((s, p) => s.profile !== p.profile && cb()),
};

const statsDef: CollectionDef = {
  name: 'stats',
  snapshot: () => ({ fields: {}, items: byId(useStats.getState().sessions) }),
  apply: ({ items }) => {
    const sessions = (Object.values(items) as SessionRecord[]).sort((a, b) => a.start.localeCompare(b.start));
    const perExercise: Record<string, number> = {};
    for (const s of sessions) perExercise[s.exerciseId] = (perExercise[s.exerciseId] ?? 0) + s.activeSec;
    useStats.setState({ sessions, perExercise });
  },
  subscribe: (cb) => useStats.subscribe((s, p) => s.sessions !== p.sessions && cb()),
};

const customDef: CollectionDef = {
  name: 'custom',
  snapshot: () => ({ fields: {}, items: byId(useCustom.getState().combos) }),
  apply: ({ items }) => useCustom.setState({ combos: (Object.values(items) as CustomCombo[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }),
  subscribe: (cb) => useCustom.subscribe((s, p) => s.combos !== p.combos && cb()),
};

const goalsDef: CollectionDef = {
  name: 'goals',
  snapshot: () => {
    const g = useGoals.getState();
    const items: Record<string, unknown> = {};
    for (const id of g.favTechniques) items[`t:${id}`] = true;
    for (const id of g.favExercises) items[`e:${id}`] = true;
    return { fields: { ...g.goals }, items };
  },
  apply: ({ fields, items }) => {
    const g = useGoals.getState();
    const ids = Object.keys(items);
    useGoals.setState({
      goals: { ...DEFAULT_GOALS, ...(fields as object) },
      favTechniques: ordered(g.favTechniques, ids.filter((k) => k.startsWith('t:')).map((k) => k.slice(2))),
      favExercises: ordered(g.favExercises, ids.filter((k) => k.startsWith('e:')).map((k) => k.slice(2))),
    });
  },
  subscribe: (cb) => useGoals.subscribe((s, p) => (s.goals !== p.goals || s.favTechniques !== p.favTechniques || s.favExercises !== p.favExercises) && cb()),
};

const fightersDef: CollectionDef = {
  name: 'fighters',
  snapshot: () => {
    const f = useFighters.getState();
    return { fields: { activeId: f.activeId }, items: byId(f.fighters) };
  },
  apply: ({ fields, items }) => {
    const cur = useFighters.getState().fighters.map((f) => f.id);
    const all = items as Record<string, Fighter>;
    const fighters = ordered(cur, Object.keys(all)).map((id) => all[id]);
    const wanted = fields.activeId as string | null;
    useFighters.setState({ fighters, activeId: wanted && all[wanted] ? wanted : (fighters[0]?.id ?? null) });
  },
  subscribe: (cb) => useFighters.subscribe((s, p) => (s.fighters !== p.fighters || s.activeId !== p.activeId) && cb()),
};

const catalogDef: CollectionDef = {
  name: 'catalog',
  snapshot: () => {
    const c = useCatalogUser.getState();
    const items: Record<string, unknown> = {};
    for (const id of c.favorites) items[`fav:${id}`] = true;
    for (const col of c.collections) items[`col:${col.id}`] = col;
    for (const combo of c.imported.combos) items[`imp:${combo.id}`] = combo;
    return { fields: { history: c.history, champions: c.imported.champions }, items };
  },
  apply: ({ fields, items }) => {
    const c = useCatalogUser.getState();
    const ids = Object.keys(items);
    const pick = <T,>(prefix: string) => ids.filter((k) => k.startsWith(prefix)).map((k) => items[k] as T);
    useCatalogUser.setState({
      favorites: ordered(c.favorites, ids.filter((k) => k.startsWith('fav:')).map((k) => k.slice(4))),
      collections: pick<CatalogCollection>('col:').sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      history: Array.isArray(fields.history) ? (fields.history as typeof c.history) : c.history,
      imported: { champions: Array.isArray(fields.champions) ? (fields.champions as typeof c.imported.champions) : c.imported.champions, combos: pick<(typeof c.imported.combos)[number]>('imp:') },
    });
  },
  subscribe: (cb) => useCatalogUser.subscribe((s, p) => (s.favorites !== p.favorites || s.collections !== p.collections || s.history !== p.history || s.imported !== p.imported) && cb()),
};

/** synchronised collections. The settings stay on the device; AI coach data is not synchronised. */
export const COLLECTIONS: CollectionDef[] = [profileDef, statsDef, customDef, goalsDef, fightersDef, catalogDef];
