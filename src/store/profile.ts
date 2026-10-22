import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { captureScope, idbStorage, rawGet, rawSet, scopeReady, scopedKey, writesPaused } from './storage';
import { cryptoAvailable, isSealed, openText, sealText } from '../account/crypto';
import type { SealedText } from '../account/crypto';
import type { CoachId, DisciplineId, Guard, LevelId } from '../domain/types';

/** the eight training goals offered in the questionnaire and the profile */
export const SPORT_GOALS: { id: string; label: string }[] = [
  { id: 'apprentissage-technique', label: 'Apprentissage technique' },
  { id: 'coordination', label: 'Amélioration de la coordination' },
  { id: 'deplacements', label: 'Travail des déplacements' },
  { id: 'vitesse', label: 'Amélioration de la vitesse' },
  { id: 'endurance', label: 'Endurance cardiovasculaire' },
  { id: 'mobilite', label: 'Mobilité' },
  { id: 'enchainements', label: 'Perfectionnement des enchaînements' },
  { id: 'decouverte', label: 'Découverte d’une nouvelle discipline' },
];

/** goal ids of earlier versions mapped to the current list */
const OLD_GOALS: Record<string, string> = { technique: 'apprentissage-technique', cardio: 'endurance', forme: 'endurance', competition: 'enchainements', defense: 'coordination' };

export function normalizeGoals(goals: unknown): string[] {
  if (!Array.isArray(goals)) return [];
  const known = new Set(SPORT_GOALS.map((g) => g.id));
  return [...new Set(goals.map((g) => (typeof g === 'string' ? (OLD_GOALS[g] ?? g) : '')).filter((g) => known.has(g)))];
}

export type Difficulty = 'douce' | 'progressive' | 'exigeante';

export interface DisplayPrefs {
  textSize: 'normal' | 'grand';
  reduceMotion: boolean;
}

export interface CoachAiPrefs {
  /** the AI coach addresses the user by their pseudo */
  usePseudo: boolean;
}

export interface Profile {
  // ---- identity (all optional except the pseudo, which may stay empty)
  lastName?: string;
  firstName?: string;
  /** how the coach (and the AI coach) addresses the user */
  pseudo: string;
  /** v0.37: 'photo' = the personal photo kept on this device, 'google' = the photo of the Google account */
  avatar: 'fighter' | 'initiales' | 'photo' | 'google';
  /** yyyy-mm-dd; when set, `age` is derived from it */
  birthDate?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  language: 'fr';
  display: DisplayPrefs;
  // ---- sport profile
  experience: 'aucune' | 'occasionnelle' | 'reguliere' | 'competition';
  /** disciplines practised (the main one is always included) */
  disciplines: DisciplineId[];
  levels: Record<DisciplineId, LevelId>;
  yearsExperience?: number;
  goals: string[];
  daysPerWeek: number;
  sessionMinutes: number;
  difficulty: Difficulty;
  guard: Guard;
  /** physical limitations: encrypted at rest, never synchronised, never used to judge aptitude */
  limitations: string;
  mainDiscipline: DisciplineId;
  coach: CoachId | null;
  coachAi: CoachAiPrefs;
  /** the questionnaire answers stay on this device unless the user exports them or turns on sync */
  completed: boolean;
}

export const DEFAULT_PROFILE: Profile = {
  pseudo: '',
  avatar: 'fighter',
  language: 'fr',
  display: { textSize: 'normal', reduceMotion: false },
  experience: 'aucune',
  disciplines: [],
  levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant', bjj: 'debutant', judo: 'debutant' },
  goals: [],
  daysPerWeek: 3,
  sessionMinutes: 30,
  difficulty: 'progressive',
  guard: 'orthodoxe',
  limitations: '',
  mainDiscipline: 'boxe',
  coach: null,
  coachAi: { usePseudo: true },
  completed: false,
};

/** age in whole years from a yyyy-mm-dd birth date (undefined when invalid or in the future) */
export function ageFrom(birthDate: string | undefined, today = new Date()): number | undefined {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return undefined;
  const [y, m, d] = birthDate.split('-').map(Number);
  let a = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) a--;
  return a >= 0 && a < 130 ? a : undefined;
}

/** fills the fields added by newer versions with their default value */
export function normalizeProfile(saved: Partial<Profile> | undefined): Profile {
  const s = saved ?? {};
  const p: Profile = {
    ...DEFAULT_PROFILE,
    ...s,
    display: { ...DEFAULT_PROFILE.display, ...(s.display ?? {}) },
    coachAi: { ...DEFAULT_PROFILE.coachAi, ...(s.coachAi ?? {}) },
    levels: { ...DEFAULT_PROFILE.levels, ...(s.levels ?? {}) },
    goals: normalizeGoals(s.goals),
    disciplines: Array.isArray(s.disciplines) ? s.disciplines : [],
    pseudo: typeof s.pseudo === 'string' ? s.pseudo : '',
    limitations: typeof s.limitations === 'string' ? s.limitations : '',
  };
  const age = ageFrom(p.birthDate);
  if (age !== undefined) p.age = age;
  return p;
}

export const displayName = (p: Pick<Profile, 'pseudo' | 'firstName'>) => p.pseudo.trim() || p.firstName?.trim() || '';

export function initials(p: Pick<Profile, 'pseudo' | 'firstName' | 'lastName'>) {
  const a = p.firstName?.trim()?.[0] ?? '';
  const b = p.lastName?.trim()?.[0] ?? '';
  return (a + b || p.pseudo.trim().slice(0, 2) || '?').toUpperCase();
}

interface ProfileState {
  profile: Profile;
  hydrated: boolean;
  /** false when WebCrypto is missing: limitations are then kept in memory only, never written in clear */
  canStoreLimitations: boolean;
  update: (p: Partial<Profile>) => void;
  setCoach: (c: CoachId) => void;
  reset: () => void;
}

type Persisted = { profile: Partial<Profile> & { limitationsSealed?: SealedText } };

/**
 * Profile storage: same IndexedDB scope as the other stores, with `limitations` sealed (AES-GCM)
 * before it is written and opened after it is read. Writes are serialised so an older encryption
 * can never finish after a newer one.
 */
let chain: Promise<void> = Promise.resolve();
const profileStorage: PersistStorage<Pick<ProfileState, 'profile'>> = {
  getItem: async (name) => {
    const raw = await idbStorage.getItem(name);
    if (typeof raw !== 'string') return null;
    const parsed = JSON.parse(raw) as StorageValue<Persisted>;
    const p = { ...parsed.state.profile };
    const sealed = p.limitationsSealed;
    delete p.limitationsSealed;
    if (isSealed(sealed)) p.limitations = (await openText(sealed, captureScope() ?? 'local')) ?? '';
    return { ...parsed, state: { profile: normalizeProfile(p) } };
  },
  setItem: (name, value) => {
    if (writesPaused()) return;
    const fixed = captureScope();
    chain = chain.then(async () => {
      await scopeReady();
      const scope = fixed ?? captureScope()!;
      const { limitations, ...rest } = value.state.profile;
      const out: Persisted['profile'] = { ...rest, limitations: '' };
      if (limitations.trim()) {
        if (!cryptoAvailable()) return; // never written in clear
        out.limitationsSealed = await sealText(limitations, scope);
      }
      await rawSet(scopedKey(name, scope), JSON.stringify({ ...value, state: { profile: out } }));
    }).catch(() => undefined);
  },
  removeItem: (name) => idbStorage.removeItem(name),
};

/** test helper: waits for pending encrypted writes */
export const profileWrites = () => chain;
/** test helper: raw stored value of the current scope */
export const rawProfile = async (scope: string) => rawGet<string>(scopedKey('css-profile', scope));

export const useProfile = create<ProfileState>()(
  persist(
    (setState) => ({
      profile: DEFAULT_PROFILE,
      hydrated: false,
      canStoreLimitations: cryptoAvailable(),
      update: (p) =>
        setState((s) => {
          const next = { ...s.profile, ...p };
          if ('birthDate' in p) next.age = ageFrom(next.birthDate) ?? next.age;
          return { profile: next };
        }),
      setCoach: (coach) => setState((s) => ({ profile: { ...s.profile, coach } })),
      reset: () => setState({ profile: DEFAULT_PROFILE }),
    }),
    {
      name: 'css-profile',
      storage: profileStorage,
      partialize: (s) => ({ profile: s.profile }),
      merge: (saved, current) => ({ ...current, profile: normalizeProfile((saved as Persisted | undefined)?.profile) }),
      onRehydrateStorage: () => () => useProfile.setState({ hydrated: true }),
    },
  ),
);
