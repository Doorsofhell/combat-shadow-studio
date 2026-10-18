import { TECHNIQUE_BY_ID } from './techniques';
import type { DisciplineId, TechniqueCategory } from './types';
import { STANCES } from '../engine/author';

/**
 * Teaching camera. Angles are expressed from the coach's point of view in orthodox guard:
 * azimuth 0 = facing the coach, positive = towards the coach's LEAD side (left in orthodox),
 * 90 = profile seen from the lead side, 180 = from behind. Elevation is in degrees above the
 * hips. In southpaw guard the lead side is the right one, so the azimuth is mirrored.
 */
export interface CameraView {
  az: number;
  el: number;
  /** 1 = whole body with a margin; below 1 frames wider (kicks), above 1 closer (elbows) */
  zoom: number;
  /** height of the point looked at, as a fraction of the coach's height */
  focus: number;
  /** why this angle, shown to the user */
  why: string;
  /** optional temporary close-up on the area that matters */
  closeUp?: { zoom: number; focus: number; label: string };
  /**
   * 'torse': the azimuth is measured from the direction the trunk faces in the guard of the
   * discipline, not from the line of the opponent. A bladed boxing guard turns the trunk about 45°:
   * a "three quarters" taken from the opponent line would then show the coach almost in profile.
   */
  ref?: 'torse';
}

export type CameraMode = 'auto' | 'face' | 'profil-gauche' | 'profil-droit' | 'trois-quarts-gauche' | 'trois-quarts-droit' | 'arriere' | 'dessus' | 'libre';

export const CAMERA_MODES: { id: CameraMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'face', label: 'Face' },
  { id: 'trois-quarts-gauche', label: '3/4 gauche' },
  { id: 'trois-quarts-droit', label: '3/4 droit' },
  { id: 'profil-gauche', label: 'Profil gauche' },
  { id: 'profil-droit', label: 'Profil droit' },
  { id: 'arriere', label: 'Arrière' },
  { id: 'dessus', label: 'Surélevée' },
  { id: 'libre', label: 'Libre 360°' },
];

const FULL = { zoom: 1, focus: 0.52 };

/** default angle for each family of techniques */
const BY_CATEGORY: Record<TechniqueCategory, CameraView> = {
  garde: { az: 55, el: 6, ...FULL, ref: 'torse', why: 'Trois quarts côté avant : on voit l’écart des pieds, la hauteur des mains et le menton rentré.' },
  poing: {
    az: 60,
    el: 7,
    ...FULL,
    ref: 'torse',
    why: 'Trois quarts côté avant : on voit la garde, l’extension du bras et la rotation du poing, les épaules, le bassin, les appuis et le retour en garde.',
  },
  pied: { az: 70, el: 8, zoom: 1, focus: 0.5, why: 'Presque de profil, côté avant : on voit la trajectoire de la jambe, la rotation des hanches et le pivot du pied d’appui.' },
  genou: { az: 80, el: 6, ...FULL, why: 'De profil : on voit la montée du genou, la poussée des hanches vers l’avant et le buste qui reste droit.' },
  coude: {
    az: 55,
    el: 10,
    ...FULL,
    ref: 'torse',
    why: 'Trois quarts : on voit l’arc du coude, la rotation des épaules et le pied qui pivote.',
    closeUp: { zoom: 1.9, focus: 0.78, label: 'Zoom sur le coude et les épaules' },
  },
  defense: { az: 0, el: 8, ...FULL, why: 'De face : on voit exactement où va la tête et comment le buste se déplace par rapport à l’attaque.' },
  deplacement: { az: 30, el: 38, zoom: 1, focus: 0.45, why: 'Vue surélevée : on distingue le placement et l’orientation des deux pieds à chaque pas.' },
  lutte: { az: 90, el: 10, zoom: 1, focus: 0.42, why: 'De profil, cadrage large : on voit la flexion des jambes, le dos droit et la projection des hanches.' },
  sol: { az: 90, el: 18, zoom: 1, focus: 0.3, why: 'De profil et légèrement au-dessus : tout le corps reste visible pendant la descente au sol et le relevé.' },
  feinte: { az: 50, el: 6, ...FULL, ref: 'torse', why: 'Trois quarts léger : on voit l’amorce du geste et le retour immédiat en garde.' },
  clinch: { az: 60, el: 10, ...FULL, why: 'Trois quarts large : on voit la position des mains sur la nuque imaginaire et le genou qui monte.' },
  projection: { az: 70, el: 12, zoom: 1, focus: 0.45, why: 'Trois quarts presque de profil : on voit le pas d’entrée, le pivot, la flexion des genoux et le tirage des mains.' },
};

/** techniques whose best angle differs from their family */
const BY_TECHNIQUE: Record<string, Partial<CameraView>> = {
  'garde-bjj': { az: 60, el: 8, why: 'Trois quarts : on voit la largeur des appuis, la flexion des genoux et les mains ouvertes devant.' },
  'shizen-tai': { az: 35, el: 8, why: 'Trois quarts léger : on voit la posture droite, les pieds à largeur d’épaules et les mains devant.' },
  'tai-sabaki': { az: 20, el: 40, why: 'Vue surélevée : on suit le pied arrière qui tourne autour du pied avant.' },
  pont: { az: 85, el: 22, why: 'De profil, légèrement au-dessus : on voit les pieds près des fesses et les hanches qui montent.' },
  'retention-garde': { az: 60, el: 30, why: 'Trois quarts au-dessus : on voit les jambes en cadre et la rotation des hanches.' },
  'crochet-avant': { az: 55, el: 28, why: 'Trois quarts surélevé : on voit l’arc horizontal du poing, le coude à hauteur d’épaule et le pivot du pied avant.' },
  'crochet-arriere': { az: 55, el: 28, why: 'Trois quarts surélevé : on voit l’arc horizontal du poing, la rotation du buste et le pivot du pied arrière.' },
  'crochet-avant-corps': { az: 58, el: 20, why: 'Trois quarts surélevé : on voit la flexion des jambes et l’arc du poing vers le corps.' },
  'crochet-arriere-corps': { az: 58, el: 20, why: 'Trois quarts surélevé : on voit la flexion des jambes et l’arc du poing vers le corps.' },
  'uppercut-avant': { az: 70, el: 4, why: 'Trois quarts : on voit les jambes qui poussent, le bassin qui tourne et le poing qui monte paume vers soi.' },
  'uppercut-arriere': { az: 70, el: 4, why: 'Trois quarts : on voit les jambes qui poussent, le bassin qui tourne et le poing qui monte paume vers soi.' },
  overhand: { az: 65, el: 14, why: 'Trois quarts légèrement au-dessus : on voit l’arc plongeant du poing et la flexion du buste.' },
  'front-kick-avant': { az: 90, el: 6, why: 'De profil : on voit la montée du genou, l’extension de la jambe et la poussée des hanches.' },
  'front-kick-arriere': { az: 90, el: 6, why: 'De profil : on voit la montée du genou, l’extension de la jambe et la poussée des hanches.' },
  'teep-avant': { az: 90, el: 6, why: 'De profil : on voit le genou qui monte, la plante du pied qui pousse et le buste en arrière.' },
  'teep-arriere': { az: 90, el: 6, why: 'De profil : on voit le genou qui monte, la plante du pied qui pousse et le buste en arrière.' },
  'low-kick-arriere': { az: 60, el: 10, zoom: 1, focus: 0.45, why: 'Trois quarts côté avant : on voit le pivot du pied d’appui, la rotation des hanches et le tibia qui frappe la cuisse.' },
  'low-kick-avant': { az: 60, el: 10, zoom: 1, focus: 0.45, why: 'Trois quarts côté avant : on voit le petit pas d’armé, le pivot et le tibia qui frappe.' },
  'high-kick-arriere': { az: 65, el: 4, zoom: 1, focus: 0.55, why: 'Cadrage entier élargi : l’amplitude complète de la jambe reste visible, du pivot du pied d’appui jusqu’à la tête.' },
  'high-kick-avant': { az: 65, el: 4, zoom: 1, focus: 0.55, why: 'Cadrage entier élargi : l’amplitude complète de la jambe reste visible, du pivot du pied d’appui jusqu’à la tête.' },
  'roundhouse-arriere': { az: 65, el: 6, zoom: 1, why: 'Trois quarts large : on voit la rotation complète des hanches et le pivot du pied d’appui.' },
  'roundhouse-avant': { az: 65, el: 6, zoom: 1, why: 'Trois quarts large : on voit le changement d’appui, la rotation des hanches et la trajectoire de la jambe.' },
  'genou-circulaire-arriere': { az: 45, el: 12, why: 'Trois quarts : on voit le genou qui arrive en arc et la rotation des hanches.' },
  'genou-circulaire-avant': { az: 45, el: 12, why: 'Trois quarts : on voit le genou qui arrive en arc et la rotation des hanches.' },
  'genou-circulaire-clinch': { az: 45, el: 12 },
  'blocage-haut': { az: 20, el: 6, why: 'Presque de face : on voit le gant collé à la tempe et le coude qui protège.' },
  'blocage-corps-avant': { az: 20, el: 6, why: 'Presque de face : on voit le coude qui descend sur les côtes et le buste qui tourne.' },
  parade: { az: 20, el: 6, why: 'Presque de face : on voit la main qui dévie l’attaque sans partir loin du visage.' },
  retrait: { az: 90, el: 6, why: 'De profil : on voit le poids qui passe sur la jambe arrière et la tête qui recule sans perdre la garde.' },
  'check-avant': { az: 60, el: 8, why: 'Trois quarts : on voit le genou qui monte, le tibia vers l’extérieur et le pied d’appui stable.' },
  'check-arriere': { az: 60, el: 8, why: 'Trois quarts : on voit le genou qui monte, le tibia vers l’extérieur et le pied d’appui stable.' },
  'pivot-droite': { az: 20, el: 45, zoom: 1, focus: 0.4, why: 'Vue surélevée : on voit le pied avant qui reste planté et le pied arrière qui tourne autour.' },
  'pivot-gauche': { az: 20, el: 45, zoom: 1, focus: 0.4, why: 'Vue surélevée : on voit le pied avant qui reste planté et le pied arrière qui tourne autour.' },
  'sortie-angle': { az: 20, el: 42, zoom: 1, focus: 0.4 },
  sprawl: { az: 90, el: 12, zoom: 1, focus: 0.3, why: 'De profil, cadrage large : on voit les jambes qui partent en arrière et les hanches plaquées au sol.' },
  'feinte-lutte': { az: 70, el: 8, zoom: 1, focus: 0.45 },
  'changement-niveau': { az: 80, el: 8, zoom: 1, focus: 0.45 },
};

const MANUAL: Record<Exclude<CameraMode, 'auto' | 'libre'>, Omit<CameraView, 'why'>> = {
  face: { az: 0, el: 6, ...FULL },
  'trois-quarts-gauche': { az: 40, el: 8, ...FULL },
  'trois-quarts-droit': { az: -40, el: 8, ...FULL },
  'profil-gauche': { az: 90, el: 6, ...FULL },
  'profil-droit': { az: -90, el: 6, ...FULL },
  arriere: { az: 180, el: 10, ...FULL },
  dessus: { az: 25, el: 40, zoom: 1, focus: 0.45 },
};

/** best angle for one technique (orthodox guard; use oriented() for the real azimuth) */
export function techniqueView(id: string): CameraView {
  const t = TECHNIQUE_BY_ID.get(id);
  const base = BY_CATEGORY[t?.category ?? 'garde'];
  return { ...base, ...(BY_TECHNIQUE[id] ?? {}) };
}

/** priority when one angle must serve a whole combination: the move that needs the widest view wins */
const PRIORITY: Record<TechniqueCategory, number> = { sol: 9, lutte: 8, projection: 8, pied: 7, deplacement: 6, genou: 5, clinch: 4, coude: 3, poing: 2, defense: 2, feinte: 1, garde: 0 };

/**
 * One stable angle for a whole sequence: a single technique keeps its own angle; a combination
 * uses the angle of its most demanding move, so the camera never jumps between fast strikes.
 */
export function sequenceView(ids: string[]): CameraView {
  const uniq = [...new Set(ids)];
  if (uniq.length === 1) return techniqueView(uniq[0]);
  let best = uniq[0];
  for (const id of uniq) {
    const a = TECHNIQUE_BY_ID.get(id)?.category ?? 'garde';
    const b = TECHNIQUE_BY_ID.get(best)?.category ?? 'garde';
    if (PRIORITY[a] > PRIORITY[b]) best = id;
  }
  const v = techniqueView(best);
  const onlyPunches = uniq.every((id) => ['poing', 'defense', 'feinte', 'garde'].includes(TECHNIQUE_BY_ID.get(id)?.category ?? ''));
  if (onlyPunches) return { ...BY_CATEGORY.poing, why: 'Combinaison de poings : trois quarts côté avant, un angle fixe pour suivre tout l’enchaînement.' };
  // combinations keep the whole body framed: no close-up, never closer than full body
  return { ...v, zoom: Math.min(1, v.zoom), closeUp: undefined, why: `Combinaison : angle fixe choisi pour le mouvement le plus ample. ${v.why}` };
}

/** footwork seen from above, but not so high that the strikes around it are lost (combinations) */
const STEP_MAX_EL = 24;

/**
 * Automatic camera, step by step: each technique of the sequence is filmed from its own teaching
 * angle. Two neighbours whose angles are close share one (no shaking between quick strikes), a
 * combination of punches keeps one three-quarter view, and footwork inside a combination is seen
 * from a moderate height so the punches around it stay readable.
 */
export function stepViews(ids: readonly string[], d: DisciplineId): CameraView[] {
  const uniq = [...new Set(ids)];
  if (uniq.length <= 1) return ids.map(() => techniqueView(ids[0] ?? 'garde'));
  const onlyPunches = uniq.every((id) => ['poing', 'defense', 'feinte', 'garde'].includes(TECHNIQUE_BY_ID.get(id)?.category ?? ''));
  if (onlyPunches) {
    const v: CameraView = { ...BY_CATEGORY.poing, why: 'Combinaison de poings : trois quarts côté avant, un angle fixe pour suivre tout l’enchaînement.' };
    return ids.map(() => v);
  }
  const eff = (v: CameraView) => (v.ref === 'torse' ? v.az + torsoYaw(d) : v.az);
  // footwork only: nothing to lose by looking from above
  const strikes = uniq.some((id) => !['deplacement', 'garde'].includes(TECHNIQUE_BY_ID.get(id)?.category ?? 'garde'));
  const out: CameraView[] = [];
  for (const id of ids) {
    const t = techniqueView(id);
    let v: CameraView = { ...t, zoom: Math.min(1, t.zoom), closeUp: undefined };
    if (strikes && v.el > STEP_MAX_EL) v = { ...v, el: STEP_MAX_EL, focus: Math.max(v.focus, 0.45), why: `${v.why} Hauteur modérée dans une combinaison, pour garder les coups lisibles.` };
    const prev = out[out.length - 1];
    if (prev && Math.abs(eff(prev) - eff(v)) <= 20 && Math.abs(prev.el - v.el) <= 12) v = prev;
    out.push(v);
  }
  return out;
}

/** short name of a view, for the camera button (Auto · 3/4 avant…) */
export function viewName(v: Pick<CameraView, 'az' | 'el'>): string {
  const a = Math.abs(((v.az + 540) % 360) - 180);
  const side = v.az >= 0 ? 'avant' : 'arrière';
  const base = a < 15 ? 'Face' : a < 75 ? `3/4 ${side}` : a < 110 ? `Profil ${side}` : a < 150 ? `3/4 dos` : 'Dos';
  return v.el >= 20 ? `${base}, en hauteur` : base;
}

export function manualView(mode: CameraMode): Omit<CameraView, 'why'> | null {
  return mode === 'auto' || mode === 'libre' ? null : MANUAL[mode];
}

/** azimuth in the scene: the lead side is the left in orthodox guard, the right in southpaw */
export function oriented(view: Pick<CameraView, 'az'>, southpaw: boolean) {
  return southpaw ? -view.az : view.az;
}

const STYLE: Record<DisciplineId, keyof typeof STANCES> = { boxe: 'boxing', kickboxing: 'kickboxing', mma: 'mma', muaythai: 'muaythai', bjj: 'bjj', judo: 'judo' };

/** how far the trunk is turned in the guard of a discipline, degrees (negative: lead shoulder forward) */
export function torsoYaw(d: DisciplineId) {
  const s = STANCES[STYLE[d]];
  return ((s.pelvisYaw + s.chestYaw) * 180) / Math.PI;
}

/** azimuth of a teaching view in the scene, for a discipline and a guard */
export function stageAzimuth(view: Pick<CameraView, 'az' | 'ref'>, d: DisciplineId, southpaw: boolean) {
  return oriented({ az: view.ref === 'torse' ? view.az + torsoYaw(d) : view.az }, southpaw);
}
