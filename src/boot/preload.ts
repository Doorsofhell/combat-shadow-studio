import type { DisciplineId } from '../domain/types';
import { outfitFor, type OutfitId } from '../three/outfit';
import SIZES from './assetSizes.json';

/**
 * 1.25 chargement au démarrage (Youssef, 2026-11-06: « un loader à l'ouverture de l'application… tout charger au
 * démarrage pour ne pas le subir au chargement des coachs… le logo de l'application avec des messages du genre
 * ouverture des salles, nettoyage du ring »).
 *
 * What a session shows is downloaded before the app opens: the user's coach (photo avatar), the coach's outfit for
 * each discipline and the six rooms first, then every other coach with their outfits (about 100 Mo in all the first
 * time), so choosing a coach never waits. The files go through the service worker's cache (vite.config.ts, css-modeles), so the next launches answer
 * from the phone (or with a short « not modified » from the server).
 *
 * The bar follows the bytes really received; each file has the message of what it is for.
 */

export const DISCIPLINES: DisciplineId[] = ['boxe', 'kickboxing', 'muaythai', 'mma', 'judo', 'bjj'];

export type BootStep = 'salle' | 'coach' | 'tenue' | 'pesee' | 'pret';

export interface BootItem {
  url: string;
  /** expected size in bytes (scripts/boot-sizes.mjs), used before the server says it */
  bytes: number;
  step: BootStep;
  discipline?: DisciplineId;
}

export interface BootPlanInput {
  /** the coach's folder (catalog id: mma-kadir, axel…), null when no coach is chosen yet: downloaded first */
  coachId: string | null;
  /** every coach of the choice screen (Youssef, 2026-11-06: « tout charger… aucune latence lors du choix des
   * coachs »): downloaded after the chosen one; empty when the photo coaches are not drawn */
  coaches: string[];
  outfits: boolean;
  bjjOutfit: 'gi' | 'nogi';
  rooms: boolean;
  /** quality « Haute »: the rooms' 4K picture as well */
  sharpRooms: boolean;
  /** the claude.ai page serves the models wrapped in JSON (VITE_COACH_FORMAT=json) */
  json?: boolean;
  /** the user's disciplines (profile) come first, the others follow */
  preferred?: DisciplineId[];
}

const sizes = SIZES as Record<string, number>;

function item(rel: string, step: BootStep, json: boolean, discipline?: DisciplineId): BootItem | null {
  const known = sizes[rel];
  if (known === undefined) return null;
  const model = rel.endsWith('.glb');
  // a GLB wrapped in JSON is base64: 4 bytes for 3
  return { url: `./${json && model ? rel.replace(/\.glb$/, '.json') : rel}`, bytes: model && json ? Math.ceil((known * 4) / 3) : known, step, discipline };
}

/** the files of the start screen, in the order they are downloaded */
export function bootPlan(p: BootPlanInput): BootItem[] {
  const json = !!p.json;
  const out: BootItem[] = [];
  const push = (x: BootItem | null) => x && out.push(x);
  if (p.coachId) push(item(`coaches/${p.coachId}/photo.glb`, 'coach', json));
  const pref = (p.preferred ?? []).filter((d) => DISCIPLINES.includes(d));
  const order = [...pref, ...DISCIPLINES.filter((d) => !pref.includes(d))];
  for (const d of order) {
    if (p.rooms) {
      const files = Object.keys(sizes).filter((k) => k.startsWith(`salles/${d}/`));
      const want = (k: string) => {
        const f = k.slice(k.lastIndexOf('/') + 1);
        if (f === 'fond.webp') return p.sharpRooms;
        return true;
      };
      // the room's description first, then its pictures, the large background last
      files.filter(want).sort((a, b) => sizes[a] - sizes[b]).forEach((k) => push(item(k, 'salle', json, d)));
    }
    if (p.coachId) for (const o of outfitsOf(d, p)) push(item(`coaches/${p.coachId}/tenues/${o}.glb`, 'tenue', json, d));
  }
  for (const c of p.coaches) {
    if (c === p.coachId) continue;
    push(item(`coaches/${c}/photo.glb`, 'coach', json));
    for (const d of order) for (const o of outfitsOf(d, p)) push(item(`coaches/${c}/tenues/${o}.glb`, 'tenue', json, d));
  }
  return out;
}

/** the outfits of a discipline: the one chosen first, and for jiu-jitsu the other one too (switching is instant) */
function outfitsOf(d: DisciplineId, p: BootPlanInput): OutfitId[] {
  const o = outfitFor(d, p.outfits, p.bjjOutfit);
  if (!o) return [];
  if (d !== 'bjj') return [o];
  return [o, o === 'bjj' ? 'bjj-nogi' : 'bjj'];
}

const GLOVES: DisciplineId[] = ['boxe', 'kickboxing', 'muaythai'];
const MATS: DisciplineId[] = ['judo', 'bjj'];

/** the words of the start screen for the file being downloaded (and for the last steps) */
export function bootMessage(step: BootStep, discipline?: DisciplineId, n = 0): string {
  switch (step) {
    case 'salle':
      if (discipline && MATS.includes(discipline)) return 'Mise en place des tatamis…';
      return ['Ouverture des salles…', 'Allumage des projecteurs…', 'Nettoyage du ring…'][n % 3];
    case 'coach':
      return 'Les coachs s’échauffent…';
    case 'tenue':
      if (discipline && GLOVES.includes(discipline)) return 'Laçage des gants…';
      if (discipline === 'mma') return 'Bandage des mains…';
      return 'Ceinture bien nouée…';
    case 'pesee':
      return 'Pesée officielle…';
    case 'pret':
      return 'Le coach t’attend !';
  }
}

export interface BootProgress {
  /** 0 to 1, from the bytes received */
  ratio: number;
  done: number;
  total: number;
  message: string;
  failed: string[];
}

type Fetch = (url: string) => Promise<Response>;

/**
 * Downloads the plan, three files at a time. A file that cannot be downloaded (offline, server error) does not stop
 * the others: it is counted as done and listed, the screen it belongs to loads it again later as before.
 */
export async function runBoot(plan: BootItem[], onProgress: (p: BootProgress) => void, opts: { fetch?: Fetch; concurrency?: number; signal?: AbortSignal } = {}) {
  const doFetch: Fetch = opts.fetch ?? ((u) => fetch(u, { signal: opts.signal }));
  const total = plan.reduce((a, x) => a + x.bytes, 0);
  const got = new Array(plan.length).fill(0) as number[];
  const failed: string[] = [];
  let finished = 0;
  let current = plan[0];
  let counter = 0;
  let message = current ? bootMessage(current.step, current.discipline) : bootMessage('pesee');
  const report = () => {
    const recv = got.reduce((a, b) => a + b, 0);
    onProgress({ ratio: total ? Math.min(1, recv / total) : 1, done: finished, total: plan.length, message, failed: [...failed] });
  };
  const start = (x: BootItem) => {
    if (x.step !== current?.step || x.discipline !== current?.discipline) {
      current = x;
      counter++;
      message = bootMessage(x.step, x.discipline, counter);
    }
  };
  let next = 0;
  report();
  const worker = async () => {
    while (next < plan.length) {
      if (opts.signal?.aborted) return;
      const i = next++;
      const x = plan[i];
      start(x);
      report();
      try {
        const r = await doFetch(x.url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const reader = r.body?.getReader();
        if (reader) {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            got[i] = Math.min(x.bytes, got[i] + (value?.byteLength ?? 0));
            report();
          }
        } else await r.arrayBuffer();
      } catch {
        if (opts.signal?.aborted) return;
        failed.push(x.url);
      }
      got[i] = x.bytes;
      finished++;
      report();
    }
  };
  await Promise.all(Array.from({ length: Math.min(opts.concurrency ?? 3, Math.max(1, plan.length)) }, worker));
  return { failed };
}
