import { describe, expect, test } from 'vitest';
import { BMI_CATEGORIES, BMI_LIMITS, BMI_MINOR_NOTE, bmiCategory, bmiGaugePosition, bmiValue, computeBmi, formatBmi } from '../bmi';

/** 0.27 (Youssef, 2026-10-20 21:45): IMC du profil, échelle adulte de l’OMS */
describe('IMC : calcul', () => {
  test('poids / taille², arrondi à une décimale', () => {
    expect(bmiValue(180, 75)).toBe(23.1); // 23,148…
    expect(bmiValue(170, 70)).toBe(24.2); // 24,221…
    expect(bmiValue(160, 50)).toBe(19.5); // 19,531…
    expect(bmiValue(200, 100)).toBe(25);
    expect(bmiValue(175, 72.5)).toBe(23.7); // 23,673…
    expect(formatBmi(23.1)).toBe('23,1');
    expect(formatBmi(25)).toBe('25,0');
  });

  test('l’arrondi va au plus proche, demi vers le haut', () => {
    // 2 m and 99,8 kg = 24,95 exactly (24,9499… in floating point): shown 25,0
    expect(bmiValue(200, 99.8)).toBe(25);
    expect(bmiValue(200, 99.78)).toBe(24.9); // 24,945
  });

  test('valeurs manquantes ou hors de la plage plausible : pas de calcul', () => {
    expect(bmiValue(undefined, 70)).toBeUndefined();
    expect(bmiValue(175, undefined)).toBeUndefined();
    expect(bmiValue(Number.NaN, 70)).toBeUndefined();
    expect(bmiValue(99, 70)).toBeUndefined();
    expect(bmiValue(251, 70)).toBeUndefined();
    expect(bmiValue(175, 24.9)).toBeUndefined();
    expect(bmiValue(175, 301)).toBeUndefined();
    expect(bmiValue(100, 25)).toBe(25);
    expect(bmiValue(250, 300)).toBe(48);
    expect(computeBmi(undefined, 70)).toEqual({ status: 'missing' });
    expect(computeBmi(175, undefined)).toEqual({ status: 'missing' });
    expect(computeBmi(17.5, 70)).toEqual({ status: 'invalid' });
  });
});

describe('IMC : catégories adultes (OMS)', () => {
  test('seuils 18,5 / 25 / 30 / 35 / 40', () => {
    expect(bmiCategory(18.4).id).toBe('insuffisance');
    expect(bmiCategory(18.5).id).toBe('normale');
    expect(bmiCategory(24.9).id).toBe('normale');
    expect(bmiCategory(25).id).toBe('surpoids');
    expect(bmiCategory(29.9).id).toBe('surpoids');
    expect(bmiCategory(30).id).toBe('obesite-1');
    expect(bmiCategory(34.9).id).toBe('obesite-1');
    expect(bmiCategory(35).id).toBe('obesite-2');
    expect(bmiCategory(39.9).id).toBe('obesite-2');
    expect(bmiCategory(40).id).toBe('obesite-3');
    expect(bmiCategory(12).id).toBe('insuffisance');
    expect(bmiCategory(60).id).toBe('obesite-3');
  });

  test('la catégorie se lit sur la valeur affichée (arrondie)', () => {
    // 18,46 is shown 18,5: it is « corpulence normale », as the number says
    const r = computeBmi(180, 59.8); // 18,456…
    expect(r).toMatchObject({ status: 'ok', value: 18.5, category: { id: 'normale' } });
    expect(computeBmi(180, 75)).toMatchObject({ status: 'ok', value: 23.1, category: { label: 'Corpulence normale' } });
  });

  test('moins de 18 ans : la valeur sans catégorie adulte', () => {
    expect(computeBmi(165, 55, 15)).toEqual({ status: 'minor', value: 20.2 });
    expect(computeBmi(165, 55, 17)).toMatchObject({ status: 'minor' });
    expect(computeBmi(165, 55, 18)).toMatchObject({ status: 'ok' });
    expect(computeBmi(165, 55, undefined)).toMatchObject({ status: 'ok' });
    expect(BMI_MINOR_NOTE).toMatch(/moins de 18 ans/);
  });

  test('textes : bienveillants, au tutoiement, avec leurs limites, sans chiffre inventé', () => {
    for (const c of BMI_CATEGORIES) {
      expect(c.advice, c.id).toMatch(/\b(tu|ton|ta|tes|te)\b|\bt’/i);
      expect(c.advice, c.id).not.toMatch(/\bvous\b|\d/);
      expect(c.advice, c.id).not.toMatch(/[—–]|\p{Extended_Pictographic}/u);
    }
    for (const id of ['insuffisance', 'obesite-1', 'obesite-2', 'obesite-3']) expect(BMI_CATEGORIES.find((c) => c.id === id)!.advice, id).toMatch(/médecin/);
    expect(BMI_LIMITS).toMatch(/muscle/);
    expect(BMI_LIMITS).toMatch(/18 ans/);
    expect(BMI_LIMITS).toMatch(/grossesse/);
  });

  test('jauge 15 → 40, bornée', () => {
    expect(bmiGaugePosition(15)).toBe(0);
    expect(bmiGaugePosition(40)).toBe(1);
    expect(bmiGaugePosition(27.5)).toBe(0.5);
    expect(bmiGaugePosition(10)).toBe(0);
    expect(bmiGaugePosition(55)).toBe(1);
  });
});
