import { describe, expect, it } from 'vitest';
import { defaultLook, FighterLook } from '../look';
import { BODY_RANGES, FACE_RANGES, MAX_TATTOOS, normalizeLook } from '../normalize';
import { ARCHETYPES, MAX_SHAPE_OFFSET, randomLook, validateLook } from '../random';
import { shapeVectors } from '../../three/customize';

/** well-mixed deterministic generator (mulberry32): consecutive seeds give unrelated sequences */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** deterministic generator for the random look */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('normalizeLook', () => {
  it('keeps a valid look unchanged (and does not share objects)', () => {
    for (const sex of ['homme', 'femme'] as const) {
      const d = defaultLook(sex);
      const n = normalizeLook(d);
      expect(n).toEqual(d);
      expect(n.body).not.toBe(d.body);
      expect(n.outfit.bottomPaint).not.toBe(d.outfit.bottomPaint);
    }
  });

  it('fills an empty or broken save with the defaults of the fallback sex', () => {
    expect(normalizeLook(undefined, 'femme')).toEqual(defaultLook('femme'));
    expect(normalizeLook('nope')).toEqual(defaultLook('homme'));
    expect(normalizeLook({ sex: 'femme' }, 'homme')).toEqual(defaultLook('femme'));
  });

  it('deep-merges a partial save', () => {
    const n = normalizeLook({
      sex: 'homme',
      body: { mass: 0.4 },
      hair: { color: '#AABBCC' },
      outfit: { top: 'tshirt' },
      gear: { mouthguard: true },
    });
    const d = defaultLook('homme');
    expect(n.body).toEqual({ ...d.body, mass: 0.4 });
    expect(n.hair).toEqual({ ...d.hair, color: '#aabbcc' });
    expect(n.outfit.top).toBe('tshirt');
    expect(n.outfit.topPaint).toEqual(d.outfit.topPaint);
    expect(n.gear.mouthguard).toBe(true);
    expect(n.gear.headPaint).toEqual(d.gear.headPaint);
  });

  it('drops unknown enum values, bad colours, non-numbers and clamps ranges', () => {
    const n = normalizeLook({
      sex: 'robot',
      body: { height: 3, mass: -9, muscle: Number.NaN, legLength: '1.02' },
      face: { jaw: 5 },
      skin: 'red',
      hair: { style: 'iroquois', length: 2 },
      beard: { style: 'bouc' },
      outfit: {
        bottom: 'kilt',
        bottomPaint: { color: '#123456', pattern: 'pois' },
      },
      gear: {
        hands: 'gants-boxe',
        head: 'casque-integral',
        bodyProtector: 'oui',
      },
    });
    const d = defaultLook('homme');
    expect(n.sex).toBe('homme');
    expect(n.body.height).toBe(BODY_RANGES.height[1]);
    expect(n.body.mass).toBe(-1);
    expect(n.body.muscle).toBe(d.body.muscle);
    expect(n.body.legLength).toBe(1);
    expect(n.face.jaw).toBe(FACE_RANGES.jaw[1]);
    expect(n.skin).toBe(d.skin);
    expect(n.hair.style).toBe(d.hair.style);
    expect(n.hair.length).toBe(1);
    expect(n.beard.style).toBe('bouc');
    expect(n.outfit.bottom).toBe(d.outfit.bottom);
    expect(n.outfit.bottomPaint).toEqual({
      ...d.outfit.bottomPaint,
      color: '#123456',
    });
    expect(n.gear.hands).toBe('gants-boxe');
    expect(n.gear.head).toBe('aucun');
    expect(n.gear.bodyProtector).toBe(false);
  });

  it('validates tattoos: zone, design, ranges, max 8, unique ids', () => {
    const good = {
      id: 'a',
      design: 'soleil',
      zone: 'dos',
      u: 2,
      v: -0.5,
      size: 1,
      rotation: 400,
      color: '#ff0000',
      intensity: 0.5,
    };
    const list = [good, { ...good, zone: 'nez' }, { ...good, design: 'disparu' }, null, ...Array.from({ length: 10 }, () => ({ ...good }))];
    const n = normalizeLook({ tattoos: list }, 'homme', ['soleil', 'vague']);
    expect(n.tattoos).toHaveLength(MAX_TATTOOS);
    expect(n.tattoos[0]).toMatchObject({
      design: 'soleil',
      zone: 'dos',
      u: 1,
      v: -0.5,
      size: 0.3,
      rotation: 180,
      intensity: 0.5,
    });
    expect(new Set(n.tattoos.map((t) => t.id)).size).toBe(MAX_TATTOOS);
    // without a design list, any named design is kept
    expect(normalizeLook({ tattoos: [{ ...good, design: 'disparu' }] }).tattoos).toHaveLength(1);
  });
});

describe('randomLook', () => {
  const designs = ['soleil', 'vague', 'flamme'];
  it('produces looks that normalizeLook leaves untouched', () => {
    for (let i = 0; i < 40; i++) {
      const sex = i % 2 ? 'femme' : 'homme';
      const l = randomLook(sex, seeded(i + 1), designs);
      expect(normalizeLook(l, sex, designs)).toEqual(l);
    }
  });

  it('suits the sex and is deterministic for a given generator', () => {
    for (let i = 0; i < 30; i++) {
      const f: FighterLook = randomLook('femme', seeded(100 + i), designs);
      expect(f.sex).toBe('femme');
      expect(f.beard.style).toBe('aucune');
      expect(f.outfit.top).not.toBe('aucun');
      expect(randomLook('homme', seeded(i), designs).outfit.top).not.toBe('brassiere');
    }
    expect(randomLook('homme', seeded(7), designs)).toEqual(randomLook('homme', seeded(7), designs));
    expect(randomLook('homme', seeded(7), designs)).not.toEqual(randomLook('homme', seeded(8), designs));
  });

  it('never adds tattoos without designs and never more than 3', () => {
    for (let i = 0; i < 30; i++) {
      expect(randomLook('homme', seeded(i)).tattoos).toHaveLength(0);
      expect(randomLook('homme', seeded(i), designs).tattoos.length).toBeLessThanOrEqual(3);
    }
  });
});

describe('génération aléatoire : 100 combattants par sexe', () => {
  const designs = ['soleil', 'vague', 'flamme'];
  const shape = (l: FighterLook) => Object.values(shapeVectors(l));
  for (const sex of ['homme', 'femme'] as const) {
    it(`${sex} : apparence seulement, dans un archétype crédible, sans déformation`, () => {
      const seen = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const l = randomLook(sex, mulberry(1000 + i), designs, shape);
        const at = `${sex} graine ${1000 + i}`;
        expect(validateLook(l, shape), at).toEqual([]);
        // the skeleton is never changed: reference leg length, uniform height only
        expect(l.body.legLength, at).toBe(1);
        expect(l.body.height, at).toBeGreaterThanOrEqual(0.94);
        expect(l.body.height, at).toBeLessThanOrEqual(1.06);
        // inside one archetype: mass, muscle and definition consistent
        const arch = ARCHETYPES[sex].find((a) => l.body.mass >= a.mass[0] && l.body.mass <= a.mass[1] && l.body.muscle >= a.muscle[0] && l.body.muscle <= a.muscle[1] && l.body.defAbs >= a.definition[0] && l.body.defAbs <= a.definition[1]);
        expect(arch, at).toBeDefined();
        seen.add(arch!.id);
        // no gear: skin offsets only, never a joint
        for (const v of shape(l).flat()) expect(Math.abs(v), at).toBeLessThanOrEqual(MAX_SHAPE_OFFSET);
        expect(normalizeLook(l, sex, designs), at).toEqual(l);
        expect(l.gear.hands).toBe('aucun');
      }
      expect(seen.size).toBe(ARCHETYPES[sex].length);
    });
  }

  it('une configuration invalide est remplacée par la configuration sûre par défaut', () => {
    const neverValid = () => [[1]];
    expect(randomLook('homme', seeded(3), designs, neverValid)).toEqual(defaultLook('homme'));
  });
});

describe('curseurs du corps et du visage aux limites', () => {
  const shape = (l: FighterLook) => Object.values(shapeVectors(l));
  // sliders that move the skin; height scales the whole body, legLength moves the knees and ankles
  // (pose.test), the definition sliders change the shading only
  const SHAPE_BODY = ['mass', 'muscle', 'shoulders', 'chest', 'arms', 'legs', 'waist', 'neck'] as const;
  for (const sex of ['homme', 'femme'] as const) {
    it(`${sex} : chaque curseur a un effet réel et reste dans des limites crédibles au minimum et au maximum`, () => {
      const base = shape(defaultLook(sex)).flat();
      for (const k of SHAPE_BODY) {
        for (const v of BODY_RANGES[k]) {
          const l = defaultLook(sex);
          l.body[k] = v;
          expect(validateLook(l, shape), `${k}=${v}`).toEqual([]);
          expect(shape(l).flat(), `${k}=${v} sans effet`).not.toEqual(base);
        }
      }
      for (const k of ['jaw', 'cheeks', 'brow', 'nose'] as const) {
        for (const v of FACE_RANGES[k]) {
          const l = defaultLook(sex);
          l.face[k] = v;
          expect(validateLook(l, shape), `${k}=${v}`).toEqual([]);
          expect(shape(l).flat(), `${k}=${v} sans effet`).not.toEqual(base);
        }
      }
      // every shape slider at its maximum at once: still a human silhouette
      const all = defaultLook(sex);
      for (const k of SHAPE_BODY) all.body[k] = BODY_RANGES[k][1];
      all.body.defAbs = 0.5;
      for (const v of shape(all).flat()) expect(Math.abs(v)).toBeLessThanOrEqual(MAX_SHAPE_OFFSET);
    });
  }
});
