/**
 * 0.27 (Youssef, 2026-10-20 21:45: « intègre aussi un calcul imc auto avec recommandation et jauge dans le
 * profil »). Body mass index of an adult, from the height and weight the user typed in the profile (they stay
 * on the device). IMC = poids (kg) / taille (m)², rounded to one decimal; the category is the adult scale of
 * the World Health Organization, read on the rounded value so the number shown and the category always agree.
 * The texts are a training guide, never a diagnosis: the IMC does not tell muscle from fat and does not apply
 * before 18 or during pregnancy.
 */

/** plausible measures: outside, the value would be a typing mistake rather than a body */
export const BMI_HEIGHT_CM = { min: 100, max: 250 } as const;
export const BMI_WEIGHT_KG = { min: 25, max: 300 } as const;
/** the adult scale applies from this age */
export const BMI_ADULT_AGE = 18;
/** ends of the gauge */
export const BMI_GAUGE = { min: 15, max: 40 } as const;

export type BmiCategoryId = 'insuffisance' | 'normale' | 'surpoids' | 'obesite-1' | 'obesite-2' | 'obesite-3';

export interface BmiCategory {
  id: BmiCategoryId;
  label: string;
  /** lower bound, included (WHO adult scale) */
  from: number;
  /** upper bound, excluded */
  to: number;
  /** short, kind advice about training */
  advice: string;
}

const SEE_PRO = 'Si tu as un doute, parles-en à un médecin ou à un professionnel de santé.';

export const BMI_CATEGORIES: readonly BmiCategory[] = [
  {
    id: 'insuffisance',
    label: 'Insuffisance pondérale',
    from: 0,
    to: 18.5,
    advice: `Ton IMC est sous la zone de référence. Avance à ton rythme : séances courtes au début, pauses suffisantes, et pense à bien boire et à manger assez autour de tes entraînements. ${SEE_PRO}`,
  },
  {
    id: 'normale',
    label: 'Corpulence normale',
    from: 18.5,
    to: 25,
    advice: 'Ton IMC est dans la zone de référence. Continue pas à pas : échauffe-toi bien, bois régulièrement pendant la séance et augmente la durée ou l’intensité petit à petit.',
  },
  {
    id: 'surpoids',
    label: 'Surpoids',
    from: 25,
    to: 30,
    advice:
      'Ton IMC est un peu au-dessus de la zone de référence. Ce n’est qu’un repère : chez les sportifs de combat, le muscle pèse souvent lourd. Augmente la charge progressivement, privilégie la technique et des rounds courts, et bois régulièrement.',
  },
  {
    id: 'obesite-1',
    label: 'Obésité (classe I)',
    from: 30,
    to: 35,
    advice: `Ton IMC est au-dessus de la zone de référence. Commence en douceur : rounds courts, pauses plus longues, gestes contrôlés, et bois régulièrement. Avant d’augmenter l’intensité, un avis médical est conseillé. ${SEE_PRO}`,
  },
  {
    id: 'obesite-2',
    label: 'Obésité (classe II)',
    from: 35,
    to: 40,
    advice: `Ton IMC est nettement au-dessus de la zone de référence. Démarre doucement, avec des rounds courts, des pauses longues et des gestes contrôlés, et bois régulièrement. Demande l’avis d’un médecin avant d’augmenter l’intensité. ${SEE_PRO}`,
  },
  {
    id: 'obesite-3',
    label: 'Obésité (classe III)',
    from: 40,
    to: Infinity,
    advice:
      'Ton IMC est très au-dessus de la zone de référence. Avant de reprendre ou d’intensifier l’entraînement, demande l’avis d’un médecin ou d’un professionnel de santé ; ensuite, avance en douceur, avec des gestes contrôlés et des pauses longues.',
  },
];

/** what every IMC card says, whatever the value */
export const BMI_LIMITS =
  'L’IMC est un repère statistique pour les adultes : il ne fait pas la différence entre le muscle et la graisse (beaucoup de combattants musclés sont classés « surpoids »), et il ne s’applique ni avant 18 ans ni pendant une grossesse. Il ne dit rien de ta santé ni de ton niveau.';

export const BMI_MINOR_NOTE =
  'Tu as moins de 18 ans : l’échelle adulte de l’IMC ne s’applique pas. Chez les jeunes, l’IMC se lit sur des courbes selon l’âge et le sexe, avec un médecin.';

export type BmiResult =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'minor'; value: number }
  | { status: 'ok'; value: number; category: BmiCategory };

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** IMC rounded to one decimal, or undefined when a measure is missing or implausible */
export function bmiValue(heightCm: number | undefined, weightKg: number | undefined): number | undefined {
  if (!isNum(heightCm) || !isNum(weightKg)) return undefined;
  if (heightCm < BMI_HEIGHT_CM.min || heightCm > BMI_HEIGHT_CM.max || weightKg < BMI_WEIGHT_KG.min || weightKg > BMI_WEIGHT_KG.max) return undefined;
  const m = heightCm / 100;
  // the small epsilon keeps 24.95 (stored as 24.9499…) on the side a person would round it to
  return Math.round((weightKg / (m * m)) * 10 + 1e-9) / 10;
}

/** the adult category of a (rounded) IMC */
export function bmiCategory(value: number): BmiCategory {
  return BMI_CATEGORIES.find((c) => value >= c.from && value < c.to) ?? BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}

/**
 * Everything the profile card needs: nothing when a measure is missing, a hint when a value is out of the
 * plausible range, the value without category for a minor, else the value and its adult category.
 */
export function computeBmi(heightCm: number | undefined, weightKg: number | undefined, age?: number): BmiResult {
  if (!isNum(heightCm) || !isNum(weightKg)) return { status: 'missing' };
  const value = bmiValue(heightCm, weightKg);
  if (value === undefined) return { status: 'invalid' };
  if (isNum(age) && age < BMI_ADULT_AGE) return { status: 'minor', value };
  return { status: 'ok', value, category: bmiCategory(value) };
}

/** « 23,1 » */
export const formatBmi = (v: number) => v.toFixed(1).replace('.', ',');

/** where a value sits on the gauge, from 0 to 1 (clamped at its ends) */
export const bmiGaugePosition = (v: number) => Math.min(1, Math.max(0, (v - BMI_GAUGE.min) / (BMI_GAUGE.max - BMI_GAUGE.min)));
