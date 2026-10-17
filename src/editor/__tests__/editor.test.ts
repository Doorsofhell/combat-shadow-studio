import { describe, expect, it } from 'vitest';
import { defaultLook, FighterLook } from '../look';
import { BODY_RANGES, FACE_RANGES, MAX_TATTOOS, normalizeLook } from '../normalize';
import { randomLook } from '../random';

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
