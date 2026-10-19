import { expect, Page } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';

/** seeds recorded sessions relative to today (local time) and the Progrès view state */
export type Seed = {
  daysAgo: number;
  sec: number;
  reps?: number;
  discipline?: string;
  level?: string;
  ex?: string;
  at?: number;
};

export function sessions(xs: Seed[]) {
  return xs.map((x, i) => {
    const d = new Date();
    d.setDate(d.getDate() - x.daysAgo);
    d.setHours(0, 30 + (x.at ?? i), 0, 0);
    const discipline = x.discipline ?? 'boxe';
    const level = x.level ?? 'debutant';
    const exerciseId = x.ex ?? `${discipline}-${level}-01`;
    return {
      id: `${d.toISOString()}#${exerciseId}`,
      start: d.toISOString(),
      discipline,
      level,
      exerciseId,
      exerciseName: `Exercice ${exerciseId}`,
      mode: 'libre',
      activeSec: x.sec,
      reps: x.reps ?? 0,
    };
  });
}

export async function seed(page: Page, xs: Seed[], extra: Record<string, unknown> = {}) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    async ({ profile, look, sessions, extra }) => {
      const put = (k: string, v: unknown) =>
        new Promise<void>((res, rej) => {
          const r = indexedDB.open('keyval-store');
          r.onupgradeneeded = () => r.result.createObjectStore('keyval');
          r.onsuccess = () => {
            const tx = r.result.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').put(JSON.stringify(v), k);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
          };
        });
      await put('u:local:css-profile', { state: { profile }, version: 0 });
      await put('u:local:css-fighters', {
        state: {
          fighters: [{ id: 'f1', name: 'Test', look, createdAt: '', updatedAt: '' }],
          activeId: 'f1',
        },
        version: 0,
      });
      await put('u:local:css-stats', {
        state: { sessions, perExercise: {} },
        version: 0,
      });
      for (const [k, v] of Object.entries(extra)) await put(k, v);
    },
    {
      profile: {
        ...DEFAULT_PROFILE,
        completed: true,
        coach: 'homme',
        disciplines: ['boxe', 'kickboxing', 'mma', 'muaythai'],
      },
      look: defaultLook('homme'),
      sessions: sessions(xs),
      extra,
    },
  );
}

export const view = (o: Record<string, unknown>) => ({
  'u:local:css-progress-view': {
    state: {
      discipline: 'toutes',
      preset: '7j',
      custom: null,
      level: null,
      kind: null,
      tab: 'activite',
      seen: {},
      ...o,
    },
    version: 0,
  },
});

export async function open(page: Page) {
  await page.goto('about:blank');
  await page.goto('/#/stats');
  await expect(page.getByTestId('progress-dashboard')).toBeVisible();
}
