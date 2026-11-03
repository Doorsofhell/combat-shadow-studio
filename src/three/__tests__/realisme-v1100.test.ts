import { describe, expect, test } from 'vitest';
import { existsSync } from 'node:fs';
import { DoubleSide, FrontSide, MeshPhysicalMaterial, MeshStandardMaterial, ShaderLib, Texture } from 'three';
import { readGlb } from '../../test/glbRead';
import { photoMaterial, photoPart, physicalFrom, SKIN_LOOK, type PhotoPart } from '../photoMaterials';
import { DEFAULT_SKIN, SKIN_SHADER_OK } from '../skinShader';

/**
 * 1.10 realism pass (Youssef, 2026-11-03, « améliorer concrètement le réalisme des personnages, vêtements et
 * accessoires »), checked on the shipped files of the four coaches. Spatial checks: which bone moves which part
 * of a garment, measured where the part is (a list of bone names alone did not see the inverted glove weights).
 */
const COACHES = ['mma-kadir', 'mma-amara', 'axel', 'kaila'];
const file = (c: string, o: string) => `public/coaches/${c}/tenues/${o}.glb`;

describe('gants de boxe et de thaï : poids répartis selon la position', () => {
  for (const c of COACHES)
    for (const o of ['boxe', 'kickboxing', 'muaythai'])
      test(`${c} ${o}`, () => {
        expect(existsSync(file(c, o))).toBe(true);
        const { parts, bind } = readGlb(file(c, o));
        for (const s of ['Left', 'Right']) {
          const g = parts.find((p) => p.name.startsWith(`gant-${s}`));
          expect(g, `gant-${s}`).toBeTruthy();
          const wr = bind.get(`${s}Hand`)!;
          const fa = bind.get(`${s}ForeArm`)!;
          const ax = wr.clone().sub(fa).normalize();
          let fist = 0;
          let cuffEnd = 0;
          const rows: [number, number][] = [];
          g!.positions.forEach((p, i) => {
            const d = p.clone().sub(wr).dot(ax);
            const hand = g!.weightOf(i, `${s}Hand`);
            const arm = g!.weightOf(i, `${s}ForeArm`);
            // the padded fist (in front of the wrist) moves with the hand only
            if (d > 0.02) {
              fist++;
              expect(hand, `${c} ${o} ${s} fist point ${i} d=${d.toFixed(3)}`).toBeGreaterThan(0.97);
            }
            // the open end of the cuff, on the forearm
            if (d < -0.09) {
              cuffEnd++;
              expect(arm, `${c} ${o} ${s} cuff point ${i} d=${d.toFixed(3)}`).toBeGreaterThan(0.95);
            }
            if (d < 0) rows.push([d, arm]);
          });
          expect(fist).toBeGreaterThan(500);
          expect(cuffEnd).toBeGreaterThan(50);
          // from the wrist back to the end of the cuff the forearm takes over gradually (no step: no tear in a turn)
          rows.sort((a, b) => b[0] - a[0]);
          const bins = [0, 0.02, 0.04, 0.06, 0.08, 0.1].map((lo) => {
            const r = rows.filter(([d]) => -d >= lo && -d < lo + 0.02);
            return r.length ? r.reduce((s, [, w]) => s + w, 0) / r.length : NaN;
          });
          const known = bins.filter((x) => !Number.isNaN(x));
          for (let k = 1; k < known.length; k++) expect(known[k]).toBeGreaterThanOrEqual(known[k - 1] - 0.02);
          for (let k = 1; k < known.length; k++) expect(known[k] - known[k - 1]).toBeLessThan(0.6);
        }
      });
});

describe('gants de thaï : coupe différente des gants de boxe', () => {
  for (const c of COACHES)
    test(c, () => {
      const cut = (o: string) => {
        const { parts, bind } = readGlb(file(c, o));
        const g = parts.find((p) => p.name.startsWith('gant-Left'))!;
        const wr = bind.get('LeftHand')!;
        const ax = wr.clone().sub(bind.get('LeftForeArm')!).normalize();
        const d = g.positions.map((p) => p.clone().sub(wr).dot(ax));
        return { cuff: -Math.min(...d), points: g.positions.length };
      };
      const boxe = cut('boxe');
      const thai = cut('muaythai');
      // the Thai cuff is shorter (wrist free for the clinch): at least 1.2 cm
      expect(boxe.cuff - thai.cuff).toBeGreaterThan(0.012);
    });
});

describe('matériaux des coachs photo : parties séparées, propriétés conservées', () => {
  const expected: Record<string, PhotoPart> = {
    m021_body: 'peau', m021_head: 'peau', f021_body: 'peau', f021_head: 'peau', Skin: 'peau',
    Eyes_opacity: 'yeux', Eyebrows_opacity: 'sourcils', Eyelashes_opacity: 'cils', Hair_opacity: 'cheveux',
  };
  for (const c of COACHES)
    test(`${c} : chaque matériau livré a sa partie`, () => {
      const { json } = readGlb(`public/coaches/${c}/photo.glb`);
      for (const m of json.materials ?? []) {
        expect(expected[m.name ?? ''], `matériau inconnu ${m.name}`).toBeTruthy();
        expect(photoPart(new MeshStandardMaterial({ name: m.name }))).toBe(expected[m.name ?? '']);
      }
    });
  test('les métadonnées css_kind priment sur le nom', () => {
    const m = new MeshStandardMaterial({ name: 'Eyes_opacity' });
    m.userData.css_kind = 'cils';
    expect(photoPart(m)).toBe('cils');
  });
  const src = () => {
    const tex = new Texture();
    const m = new MeshStandardMaterial({ name: 'x', map: tex, normalMap: tex, roughnessMap: tex, aoMap: tex, color: '#aa8866', vertexColors: true, side: DoubleSide });
    m.normalScale.set(0.6, -0.6);
    return m;
  };
  for (const q of ['haute', 'basse'] as const)
    for (const part of ['peau', 'yeux', 'cheveux', 'sourcils', 'cils'] as const)
      test(`${part} ${q} : cartes, couleur et couleurs de sommets conservées`, () => {
        const s = src();
        const m = photoMaterial(s, part, q, { ...DEFAULT_SKIN, relief: 1.5 });
        expect(m.map).toBe(s.map);
        expect(m.normalMap).toBe(s.normalMap);
        expect(m.roughnessMap).toBe(s.roughnessMap);
        expect(m.aoMap).toBe(s.aoMap);
        expect(m.vertexColors).toBe(true);
        expect(m.color.getHexString()).toBe('aa8866');
        // the loader's green flip is kept (orientation); only the skin is drawn deeper
        expect(Math.sign(m.normalScale.y)).toBe(-1);
        expect(m.normalScale.x).toBeCloseTo(part === 'peau' ? 0.9 : 0.6);
        if (part === 'cheveux' || part === 'cils' || part === 'sourcils') {
          expect(m.side).toBe(DoubleSide);
          expect(m.alphaToCoverage).toBe(true);
          expect(m.alphaTest).toBeGreaterThan(0);
        }
        // brows and lashes: a lower cut than the hair (0.4), so their fine hairs stay
        if (part === 'cils' || part === 'sourcils') expect(m.alphaTest).toBeLessThan(0.4);
        if (part === 'yeux') {
          // opaque source: no cut; blended source (MakeHuman cornea shell): cut out
          expect(m.alphaTest).toBe(0);
          expect(m.transparent).toBe(false);
          expect(m.roughness).toBeLessThan(0.2);
          if (q === 'haute') expect((m as MeshPhysicalMaterial).clearcoat).toBeGreaterThan(0.5);
        }
        if (part === 'peau') expect(m.side).toBe(FrontSide);
      });
  test('yeux MakeHuman (source transparente) : la coque de cornée reste découpée', () => {
    const s = src();
    s.transparent = true;
    const m = photoMaterial(s, 'yeux', 'haute', { ...DEFAULT_SKIN, relief: 1.5 });
    expect(m.transparent).toBe(false);
    expect(m.alphaTest).toBeGreaterThanOrEqual(0.4);
  });
  test('physicalFrom (tenues) garde faces doubles, transparence et cartes', () => {
    const s = src();
    s.alphaTest = 0.3;
    const m = physicalFrom(s, { sheen: 0.5 });
    expect(m.side).toBe(DoubleSide);
    expect(m.alphaTest).toBe(0.3);
    expect(m.roughnessMap).toBe(s.roughnessMap);
    expect(m.aoMap).toBe(s.aoMap);
    expect(m.vertexColors).toBe(true);
    expect(m.sheen).toBe(0.5);
  });
});

describe('peau : diffusion, ombres adoucies, pores, relief calibré par coach', () => {
  test('les morceaux de shader remplacés existent dans cette version de three.js', () => expect(SKIN_SHADER_OK).toBe(true));
  test('relief calibré par coach, jamais l’ancienne amplification uniforme de 1,5 pour tous', () => {
    const r = COACHES.map((c) => SKIN_LOOK[c].relief);
    expect(new Set(r).size).toBeGreaterThan(2);
    expect(SKIN_LOOK['mma-kadir'].relief).toBeLessThan(1.5);
    expect(SKIN_LOOK['mma-amara'].relief).toBeLessThan(1.5);
  });
  for (const q of ['haute', 'basse'] as const)
    test(`peau ${q} : shader ajouté, pores en haute qualité seulement`, () => {
      const m = photoMaterial(new MeshStandardMaterial({ name: 'Skin', map: new Texture() }), 'peau', q, SKIN_LOOK.kaila);
      const shader = { uniforms: {}, fragmentShader: (m.type === 'MeshPhysicalMaterial' ? ShaderLib.physical : ShaderLib.standard).fragmentShader, vertexShader: '' };
      m.onBeforeCompile(shader as never, undefined as never);
      expect(shader.fragmentShader).toContain('cssWrapIrr( geometryNormal');
      expect(shader.fragmentShader).toContain('cssShadowLift(');
      expect((shader.uniforms as Record<string, { value: number }>).cssPores.value).toBe(q === 'haute' ? SKIN_LOOK.kaila.pores : 0);
      expect(m.customProgramCacheKey()).toContain('css-skin');
    });
});

// 1.10: the racer-back bra once reached the forearms (Rocketbox rest pose: forearms at chest height), a sheet of
// cloth thrown round the arms in motion (Amara, mma). Every point of every bra stays between the shoulder joints.
describe('brassières : aucune partie sur les bras', () => {
  for (const c of ['mma-amara', 'kaila'])
    for (const o of ['boxe', 'kickboxing', 'muaythai', 'mma'])
      test(`${c} ${o}`, () => {
        const { parts, bind } = readGlb(file(c, o));
        const bra = parts.filter((p) => p.name.startsWith('haut-brassiere'));
        expect(bra.length).toBeGreaterThan(0);
        const sx = Math.max(Math.abs(bind.get('LeftArm')!.x), Math.abs(bind.get('RightArm')!.x));
        let worst = 0;
        for (const p of bra) for (const q of p.positions) worst = Math.max(worst, Math.abs(q.x));
        expect(worst, `${c} ${o} |x| max ${worst.toFixed(3)} / épaule ${sx.toFixed(3)}`).toBeLessThan(sx + 0.03);
      });
});
