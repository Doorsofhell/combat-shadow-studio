import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import SIZES from '../assetSizes.json';
import { DISCIPLINES, bootMessage, bootPlan, runBoot, type BootProgress } from '../preload';
import { ALL_COACHES } from '../../domain/coaches/catalog';

const sizes = SIZES as Record<string, number>;
const IDS = ALL_COACHES.map((c) => c.id);
const base = { coachId: 'axel', coaches: [] as string[], outfits: true, bjjOutfit: 'gi' as const, rooms: true, sharpRooms: false };

describe('chargement au démarrage (1.25) : ce qui est téléchargé', () => {
  it('la liste des tailles suit les fichiers de public/ (sinon : node scripts/boot-sizes.mjs)', () => {
    for (const [rel, n] of Object.entries(sizes)) expect(statSync(join('public', rel)).size, rel).toBe(n);
    for (const r of readdirSync('public/salles')) for (const f of readdirSync(join('public/salles', r))) expect(sizes[`salles/${r}/${f}`], `salles/${r}/${f}`).toBeDefined();
    for (const c of ALL_COACHES) expect(sizes[`coaches/${c.id}/photo.glb`], c.id).toBeGreaterThan(0);
  });

  it('le coach choisi d’abord, avec ses tenues et les 6 salles, puis tous les autres coachs et leurs tenues', () => {
    const own = bootPlan(base);
    expect(own[0]).toMatchObject({ url: './coaches/axel/photo.glb', step: 'coach' });
    expect(own.filter((x) => x.step === 'tenue').map((x) => x.url).sort()).toEqual([...DISCIPLINES, 'bjj-nogi'].map((o) => `./coaches/axel/tenues/${o}.glb`).sort());
    for (const d of DISCIPLINES) {
      expect(own.some((x) => x.url === `./salles/${d}/fond-2k.webp`)).toBe(true);
      expect(own.some((x) => x.url === `./salles/${d}/salle.json`)).toBe(true);
      expect(own.some((x) => x.url === `./salles/${d}/fond.webp`)).toBe(false);
    }
    expect(own.some((x) => x.url.includes('arbitre'))).toBe(false);
    const all = bootPlan({ ...base, coaches: IDS });
    expect(all.slice(0, own.length)).toEqual(own);
    for (const c of IDS) {
      expect(all.filter((x) => x.url === `./coaches/${c}/photo.glb`), c).toHaveLength(1);
      for (const o of [...DISCIPLINES, 'bjj-nogi']) expect(all.some((x) => x.url === `./coaches/${c}/tenues/${o}.glb`), `${c} ${o}`).toBe(true);
    }
    expect(new Set(all.map((x) => x.url)).size).toBe(all.length);
    expect(all.reduce((a, x) => a + x.bytes, 0) / 1e6).toBeLessThan(110);
  });

  it('suit les réglages : sans kimono, qualité Haute, salles ou tenues coupées, pas encore de coach', () => {
    expect(bootPlan({ ...base, bjjOutfit: 'nogi' }).some((x) => x.url.endsWith('tenues/bjj-nogi.glb'))).toBe(true);
    expect(bootPlan({ ...base, sharpRooms: true }).filter((x) => x.url.endsWith('/fond.webp'))).toHaveLength(6);
    expect(bootPlan({ ...base, rooms: false }).some((x) => x.step === 'salle')).toBe(false);
    expect(bootPlan({ ...base, outfits: false }).some((x) => x.step === 'tenue')).toBe(false);
    const none = bootPlan({ ...base, coachId: null });
    expect(none.length).toBeGreaterThan(0);
    expect(none.every((x) => x.step === 'salle')).toBe(true);
    // before the coach is chosen (first launch), every coach is downloaded so the choice is instant
    expect(bootPlan({ ...base, coachId: null, coaches: IDS }).filter((x) => x.step === 'coach')).toHaveLength(IDS.length);
  });

  it('les disciplines du profil d’abord ; modèles en JSON pour la page claude.ai', () => {
    const plan = bootPlan({ ...base, preferred: ['judo'] });
    expect(plan.find((x) => x.discipline)?.discipline).toBe('judo');
    const json = bootPlan({ ...base, json: true });
    expect(json[0].url).toBe('./coaches/axel/photo.json');
    expect(json[0].bytes).toBeGreaterThan(sizes['coaches/axel/photo.glb']);
    expect(json.some((x) => x.url.endsWith('.webp'))).toBe(true);
  });

  it('messages de salle de combat liés à chaque étape', () => {
    expect(bootMessage('salle', 'boxe', 0)).toBe('Ouverture des salles…');
    expect(bootMessage('salle', 'judo')).toBe('Mise en place des tatamis…');
    expect(bootMessage('coach')).toMatch(/échauffent/);
    expect(bootMessage('tenue', 'boxe')).toMatch(/gants/);
    expect(bootMessage('tenue', 'mma')).toMatch(/mains/);
    expect(bootMessage('pret')).toMatch(/t’attend/);
  });
});

describe('chargement au démarrage (1.25) : avancement', () => {
  const body = (n: number, chunk = 1000) =>
    new ReadableStream<Uint8Array>({
      start(c) {
        for (let o = 0; o < n; o += chunk) c.enqueue(new Uint8Array(Math.min(chunk, n - o)));
        c.close();
      },
    });

  it('la barre suit les octets reçus, monte sans jamais redescendre et finit à 100 %', async () => {
    const plan = [
      { url: 'a', bytes: 4000, step: 'coach' as const },
      { url: 'b', bytes: 2000, step: 'salle' as const, discipline: 'boxe' as const },
      { url: 'c', bytes: 6000, step: 'tenue' as const, discipline: 'judo' as const },
    ];
    const seen: BootProgress[] = [];
    const r = await runBoot(plan, (p) => seen.push(p), { fetch: async (u) => new Response(body(plan.find((x) => x.url === u)!.bytes)), concurrency: 2 });
    expect(r.failed).toEqual([]);
    const ratios = seen.map((s) => s.ratio);
    for (let i = 1; i < ratios.length; i++) expect(ratios[i]).toBeGreaterThanOrEqual(ratios[i - 1]);
    expect(ratios.some((x) => x > 0 && x < 1)).toBe(true);
    expect(seen.at(-1)).toMatchObject({ ratio: 1, done: 3, total: 3 });
    expect(new Set(seen.map((s) => s.message)).size).toBeGreaterThan(1);
  });

  it('chaque fichier reçu est gardé (cache de l’app) avec son contenu entier', async () => {
    const plan = [
      { url: 'a', bytes: 3000, step: 'coach' as const },
      { url: 'b', bytes: 500, step: 'salle' as const },
    ];
    const kept: Record<string, number> = {};
    await runBoot(plan, () => undefined, {
      fetch: async (u) => new Response(body(plan.find((x) => x.url === u)!.bytes)),
      store: async (u, r) => (kept[u] = (await r.arrayBuffer()).byteLength),
    });
    expect(kept).toEqual({ a: 3000, b: 500 });
  });

  it('ce qui est déjà sur le téléphone n’est pas retéléchargé (ouvertures suivantes)', async () => {
    const plan = [
      { url: 'garde', bytes: 5000, step: 'coach' as const },
      { url: 'neuf', bytes: 1000, step: 'tenue' as const },
    ];
    const asked: string[] = [];
    let last: BootProgress | null = null;
    await runBoot(plan, (p) => (last = p), {
      fetch: async (u) => (asked.push(u), new Response(body(1000))),
      cached: async (x) => x.url === 'garde',
    });
    expect(asked).toEqual(['neuf']);
    expect(last).toMatchObject({ ratio: 1, done: 2 });
  });

  it('hors ligne ou fichier absent : les autres continuent, rien ne bloque', async () => {
    const plan = [
      { url: 'ok', bytes: 100, step: 'salle' as const },
      { url: 'ko', bytes: 100, step: 'tenue' as const },
      { url: '404', bytes: 100, step: 'tenue' as const },
    ];
    let last: BootProgress | null = null;
    const r = await runBoot(plan, (p) => (last = p), {
      fetch: async (u) => {
        if (u === 'ko') throw new TypeError('offline');
        return new Response(body(100), { status: u === '404' ? 404 : 200 });
      },
    });
    expect(r.failed.sort()).toEqual(['404', 'ko']);
    expect(last).toMatchObject({ ratio: 1, done: 3 });
  });
});
