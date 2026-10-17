import { describe, expect, test } from 'vitest';
import { BufferAttribute, Color, Mesh, Object3D, SkinnedMesh, Texture, Vector3 } from 'three';
import { loadCoach } from '../../test/body';
import { Customizer, buildShell, garmentSpecs, gloveGeometry, mapBody, regionWeights, zoneFrame, type GarmentSpec } from '../customize';
import { applyManga, outlineMaterial, toonMaterial } from '../manga';
import { defaultLook, recommendedGear, type FighterLook, type TattooZone } from '../../editor/look';
import type { CoachId } from '../../domain/types';

const coaches: CoachId[] = ['homme', 'femme'];
const setup = (c: CoachId) => {
  const { root, meta } = loadCoach(c);
  const found: { body: SkinnedMesh | null } = { body: null };
  root.traverse((o) => {
    if ((o as SkinnedMesh).isSkinnedMesh && ((o as Mesh).material as { name: string }).name === 'Skin') found.body = o as SkinnedMesh;
  });
  return { root, meta, body: found.body! };
};
const countMeshes = (root: Object3D) => {
  let n = 0;
  root.traverse((o) => {
    if ((o as Mesh).isMesh && o.visible) n++;
  });
  return n;
};

describe('créateur de combattant : corps', () => {
  test.each(coaches)('%s : chaque sommet est rattaché à la bonne partie du corps', (c) => {
    const { body, meta } = setup(c);
    const m = mapBody(body, meta);
    for (const ch of ['torso', 'head', 'armL', 'armR', 'handL', 'handR', 'legL', 'legR', 'footL', 'footR']) {
      expect(m.chain.filter((x) => x === ch).length, ch).toBeGreaterThan(300);
    }
    for (let i = 0; i < m.count; i += 97) {
      if (m.chain[i] === 'armL') expect(m.pos[i * 3]).toBeGreaterThan(0);
      if (m.chain[i] === 'footL') expect(m.pos[i * 3 + 1]).toBeLessThan(0.25);
      if (m.chain[i] === 'head') expect(m.pos[i * 3 + 1]).toBeGreaterThan(meta.neck[1] - 0.06);
    }
  });

  test.each(coaches)('%s : régions musculaires au bon endroit', (c) => {
    const { body, meta } = setup(c);
    const m = mapBody(body, meta);
    const r = regionWeights(m);
    const centroid = (arr: Float32Array, k: number) => {
      const p = new Vector3();
      let w = 0;
      for (let i = 0; i < m.count; i++) {
        const v = arr[i * 4 + k];
        if (v <= 0.5) continue;
        p.x += m.pos[i * 3] * v;
        p.y += m.pos[i * 3 + 1] * v;
        p.z += m.pos[i * 3 + 2] * v;
        w += v;
      }
      return { p: p.multiplyScalar(1 / Math.max(w, 1e-6)), w };
    };
    const chest = centroid(r.A, 2);
    const abs = centroid(r.A, 3);
    const back = centroid(r.B, 0);
    const jaw = centroid(r.C, 2);
    const thighs = centroid(r.B, 1);
    expect(chest.w).toBeGreaterThan(50);
    expect(abs.w).toBeGreaterThan(50);
    expect(jaw.w).toBeGreaterThan(10);
    expect(chest.p.y).toBeGreaterThan(abs.p.y);
    expect(chest.p.z).toBeGreaterThan(back.p.z);
    expect(jaw.p.y).toBeGreaterThan(meta.neck[1]);
    expect(jaw.p.y).toBeLessThan(meta.lipsY);
    expect(thighs.p.y).toBeLessThan(meta.pelvis[1]);
    for (const arr of [r.A, r.B, r.C, r.D]) for (let i = 0; i < arr.length; i += 13) expect(arr[i]).toBeGreaterThanOrEqual(0);
  });
});

describe('créateur de combattant : vêtements et protections', () => {
  test.each(coaches)('%s : chaque tenue couvre sa zone et garde le squelette du corps', (c) => {
    const { body, meta } = setup(c);
    const m = mapBody(body, meta);
    const g = body.geometry;
    const reg = regionWeights(m);
    for (const [k, v] of Object.entries({ aRegA: reg.A, aRegB: reg.B, aRegC: reg.C, aRegD: reg.D })) g.setAttribute(k, new BufferAttribute(v, 4));
    const specs = garmentSpecs(m);
    const zone: Record<string, [number, number]> = {
      'short-boxe': [meta.knee[1] - 0.08, meta.pelvis[1] + 0.2],
      'short-thai': [meta.knee[1] - 0.02, meta.pelvis[1] + 0.2],
      legging: [-0.05, meta.pelvis[1] + 0.2],
      'rashguard-long': [meta.pelvis[1] - 0.1, meta.neck[1] + 0.03],
      brassiere: [meta.nippleY - 0.2, meta.neck[1] + 0.03],
      'tibias-thai': [-0.05, meta.knee[1] + 0.08],
      'casque-ouvert': [meta.lipsY - 0.12, 2.3],
      plastron: [meta.pelvis[1] - 0.05, meta.nippleY + 0.2],
    };
    const groups = [specs.bottom, specs.top, specs.shoes, specs.hands, specs.shins, specs.feet, specs.head, specs.body] as Record<string, GarmentSpec>[];
    for (const group of groups) {
      for (const [id, spec] of Object.entries(group)) {
        const s = buildShell(g, m, spec);
        expect(s, id).not.toBeNull();
        const p = s!.getAttribute('position');
        expect(p.count, id).toBeGreaterThan(100);
        const sw = s!.getAttribute('skinWeight');
        for (let i = 0; i < sw.count; i += 53) expect(sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i), id).toBeCloseTo(1, 2);
        expect(s!.getAttribute('aRegA'), id).toBeDefined();
        const z = zone[id];
        if (!z) continue;
        let lo = Infinity;
        let hi = -Infinity;
        const cov = s!.getAttribute('aCover');
        for (let i = 0; i < p.count; i++) {
          if (cov.getX(i) <= 0) continue;
          lo = Math.min(lo, p.getY(i));
          hi = Math.max(hi, p.getY(i));
        }
        expect(lo, `${id} bas`).toBeGreaterThan(z[0]);
        expect(hi, `${id} haut`).toBeLessThan(z[1]);
      }
    }
  });

  test.each(coaches)('%s : gants autour des mains, zones de tatouage posées sur le corps', (c) => {
    const { body, meta } = setup(c);
    const m = mapBody(body, meta);
    for (const side of ['Left', 'Right'] as const) {
      const g = gloveGeometry(m.bone, side);
      g.computeBoundingBox();
      const center = g.boundingBox!.getCenter(new Vector3());
      expect(center.distanceTo(m.bone[`${side}Hand`])).toBeLessThan(0.2);
      expect(g.boundingBox!.getSize(new Vector3()).length()).toBeGreaterThan(0.15);
    }
    const zones: TattooZone[] = ['bras-gauche', 'avant-bras-droit', 'poitrine', 'dos', 'ventre'];
    for (const zz of zones) {
      const f = zoneFrame(m, zz);
      expect(Number.isFinite(f.origin.x), zz).toBe(true);
      expect(f.origin.y, zz).toBeGreaterThan(0.3);
      if (f.cylinder) {
        expect(f.radius, zz).toBeGreaterThan(0.02);
        expect(f.radius, zz).toBeLessThan(0.1);
      }
      expect(f.u.length()).toBeCloseTo(1, 3);
    }
  });
});

describe('créateur de combattant : application complète', () => {
  const looks = (c: CoachId): FighterLook[] => {
    const base = defaultLook(c);
    const out: FighterLook[] = [base];
    for (const d of ['boxe', 'kickboxing', 'mma', 'muaythai'] as const) {
      const l: FighterLook = structuredClone(base);
      const r = recommendedGear(d);
      l.outfit.bottom = r.bottom;
      l.outfit.shoes = r.shoes;
      l.gear.hands = r.hands;
      l.gear.shins = r.shins;
      l.gear.feet = r.feet;
      out.push(l);
    }
    const full: FighterLook = structuredClone(base);
    full.body = { ...full.body, muscle: 1, mass: 1, height: 1.1, legLength: 1.05 };
    full.tattoos = [
      { id: 't1', design: 'bande-tribale', zone: 'bras-gauche', u: 0, v: 0, size: 0.12, rotation: 0, color: '#111111', intensity: 0.9 },
      { id: 't2', design: 'soleil', zone: 'dos', u: 0.2, v: -0.1, size: 0.18, rotation: 30, color: '#7a1010', intensity: 0.7 },
    ];
    full.gear = { ...full.gear, hands: 'gants-boxe', head: 'casque-barre', mouthguard: true, bodyProtector: true, shins: 'tibias-thai', feet: 'protege-pieds' };
    full.outfit.top = 'rashguard-long';
    full.hair.style = 'queue';
    out.push(full);
    return out;
  };

  test.each(coaches)('%s : tenues et protections ajoutées puis retirées proprement', (c) => {
    const { root, meta } = setup(c);
    applyManga(root);
    const cz = new Customizer(root, meta, new Texture(), { toon: (n, col: Color) => toonMaterial(n, null, col), outline: outlineMaterial });
    cz.apply(defaultLook(c));
    const base = countMeshes(root);
    const all = looks(c);
    for (const l of all) cz.apply(l);
    expect(countMeshes(root)).toBeGreaterThan(base + 6);
    expect(cz.u.uTatN.value).toBe(2);
    expect(root.scale.y).toBeCloseTo(1.1, 2);
    cz.apply(defaultLook(c));
    expect(countMeshes(root)).toBe(base);
    expect(cz.u.uTatN.value).toBe(0);
  });
});
