import { TECHNIQUE_BY_ID } from './techniques';
import type { DisciplineId, Exercise, ExerciseKind, LevelId } from './types';

const LEVEL_DEFAULTS: Record<LevelId, { speed: number; rest: number }> = {
  debutant: { speed: 0.55, rest: 1.6 },
  intermediaire: { speed: 0.75, rest: 1.0 },
  avance: { speed: 0.9, rest: 0.6 },
  expert: { speed: 1.0, rest: 0.4 },
};

/**
 * 2.10.7 identifiants figés : chaque ligne porte son identifiant écrit en dur. Avant, il était calculé d'après la
 * position de la ligne dans sa liste (`boxe-debutant-03` = 3e ligne), si bien qu'insérer ou retirer un exercice au
 * milieu décalait tous les suivants, et avec eux l'historique, les statistiques et la maîtrise des utilisateurs
 * (clés `exerciseId`). Les 254 identifiants existants sont gardés tels quels (liste gelée dans
 * `src/domain/__tests__/exercise-ids-v2107.test.ts`). Un nouvel exercice, où qu'il soit placé, prend le prochain
 * numéro libre de son niveau ; un identifiant n'est jamais réutilisé ni renommé, et un exercice retiré va dans
 * `RETIRED_EXERCISE_IDS`.
 */
type Row = [id: string, name: string | null, kind: ExerciseKind, seq: string, extra?: Partial<Exercise>];

/** Identifiants d'exercices retirés du catalogue : réservés à jamais (jamais réattribués). Aucun à ce jour. */
export const RETIRED_EXERCISE_IDS: readonly string[] = [];


const nameOf = (seq: string[]) => seq.map((id) => TECHNIQUE_BY_ID.get(id)?.name ?? id).join(' → ');

function build(discipline: DisciplineId, level: LevelId, rows: Row[]): Exercise[] {
  return rows.map(([id, name, kind, seq, extra]) => {
    if (!/^[a-z]+-[a-z]+-\d{2,}$/.test(id) || !id.startsWith(`${discipline}-${level}-`))
      throw new Error(`Identifiant d'exercice ${id} hors de ${discipline}/${level}`);
    const sequence = seq.split(/\s+/).filter(Boolean);
    for (const id of sequence) if (!TECHNIQUE_BY_ID.has(id)) throw new Error(`Technique inconnue ${id}`);
    const firstSolo = sequence.map((id) => TECHNIQUE_BY_ID.get(id)?.soloNote).find(Boolean);
    const d = LEVEL_DEFAULTS[level];
    const label = name ?? nameOf(sequence);
    const cues = sequence.flatMap((id) => TECHNIQUE_BY_ID.get(id)?.cues.slice(0, 1) ?? []);
    return {
      id,
      discipline,
      level,
      name: label,
      kind,
      description: extra?.description ?? describe(kind, sequence.length),
      sequence,
      speed: d.speed,
      rest: d.rest,
      instructions: extra?.instructions ?? [...new Set(cues)].slice(0, 4),
      soloNote: firstSolo,
      ...extra,
    } satisfies Exercise;
  });
}

function describe(kind: ExerciseKind, n: number) {
  switch (kind) {
    case 'technique':
      return 'Une technique, lentement puis plus vite, avec retour en garde à chaque fois.';
    case 'combinaison':
      return `${n} mouvements à enchaîner, sans t’arrêter en pose neutre entre les coups.`;
    case 'defense':
      return 'Défense : tu esquives, tu bloques ou tu sors de la ligne, puis tu réponds.';
    case 'deplacement':
      return 'Jeu de jambes : petits pas, garde stable, et des pieds qui ne se croisent jamais.';
    case 'cardio':
      return 'Un enchaînement rythmé à répéter sans pause. Le cardio va chauffer.';
    case 'round':
      return 'Une longue séquence à répéter pendant tout un round.';
  }
}

// ---------------------------------------------------------------------------------- BOXE
const BOXE: Record<LevelId, Row[]> = {
  debutant: [
    ['boxe-debutant-01', 'Garde orthodoxe et respiration', 'technique', 'garde', { description: 'Tiens ta garde, souple sur les jambes, mains hautes, menton rentré. Et respire.' }],
    ['boxe-debutant-02', null, 'technique', 'jab'],
    ['boxe-debutant-03', null, 'technique', 'direct'],
    ['boxe-debutant-04', null, 'technique', 'crochet-avant'],
    ['boxe-debutant-05', null, 'technique', 'uppercut-arriere'],
    ['boxe-debutant-06', 'Pas avant et pas arrière', 'deplacement', 'pas-avant pas-arriere'],
    ['boxe-debutant-07', 'Pas latéraux', 'deplacement', 'pas-gauche pas-droite'],
    ['boxe-debutant-08', null, 'combinaison', 'jab direct'],
    ['boxe-debutant-09', null, 'combinaison', 'jab jab direct'],
    ['boxe-debutant-10', 'Esquive extérieure en garde', 'defense', 'esquive-droite'],
    ['boxe-debutant-11', 'Blocage haut', 'defense', 'blocage-haut'],
    ['boxe-debutant-12', 'Jab en avançant', 'combinaison', 'pas-avant jab'],
  ],
  intermediaire: [
    ['boxe-intermediaire-01', null, 'combinaison', 'jab direct crochet-avant'],
    ['boxe-intermediaire-02', null, 'combinaison', 'jab direct crochet-avant direct'],
    ['boxe-intermediaire-03', null, 'combinaison', 'jab esquive-droite direct'],
    ['boxe-intermediaire-04', null, 'combinaison', 'direct crochet-avant direct'],
    ['boxe-intermediaire-05', null, 'combinaison', 'uppercut-arriere crochet-avant direct'],
    ['boxe-intermediaire-06', 'Crochets au corps', 'combinaison', 'crochet-avant-corps crochet-arriere-corps crochet-avant'],
    ['boxe-intermediaire-07', 'Parade et contre', 'defense', 'parade direct crochet-avant'],
    ['boxe-intermediaire-08', 'Roll sous le crochet', 'defense', 'roll-droite crochet-avant'],
    ['boxe-intermediaire-09', 'Pivot après le jab', 'deplacement', 'jab pivot-droite jab'],
    ['boxe-intermediaire-10', 'Retrait et contre', 'defense', 'retrait direct'],
    ['boxe-intermediaire-11', 'Jab au corps, jab à la tête', 'combinaison', 'jab-corps jab direct'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['boxe-intermediaire-12', 'Shoulder roll (rouler l’épaule)', 'defense', 'shoulder-roll'],
    ['boxe-intermediaire-13', 'Check hook (crochet pivot)', 'technique', 'check-hook'],
  ],
  avance: [
    ['boxe-avance-01', null, 'combinaison', 'jab direct roll-droite crochet-avant'],
    ['boxe-avance-02', null, 'combinaison', 'jab direct crochet-avant uppercut-arriere crochet-avant'],
    ['boxe-avance-03', 'Sortie d’angle et crochet', 'combinaison', 'jab direct sortie-angle crochet-avant direct'],
    ['boxe-avance-04', 'Corps puis tête', 'combinaison', 'jab-corps direct-corps crochet-avant uppercut-arriere'],
    ['boxe-avance-05', 'Esquive, roll, contre', 'defense', 'esquive-droite roll-gauche crochet-arriere crochet-avant direct'],
    ['boxe-avance-06', 'Double crochet et direct', 'combinaison', 'crochet-avant crochet-avant direct crochet-avant'],
    ['boxe-avance-07', 'Feinte et attaque', 'combinaison', 'feinte-jab direct crochet-avant direct'],
    ['boxe-avance-08', 'Blocage puis riposte', 'defense', 'blocage-haut crochet-avant direct crochet-avant'],
    ['boxe-avance-09', 'Pivots et angles', 'deplacement', 'jab pivot-droite direct pivot-gauche jab direct'],
    ['boxe-avance-10', 'Uppercuts en série', 'combinaison', 'uppercut-avant uppercut-arriere crochet-avant direct'],
    ['boxe-avance-11', 'Cardio boxe', 'cardio', 'jab direct jab direct crochet-avant direct'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['boxe-avance-12', 'Shoulder roll et riposte', 'defense', 'shoulder-roll direct'],
    ['boxe-avance-13', 'Jab, direct, check hook', 'combinaison', 'jab direct check-hook'],
  ],
  expert: [
    ['boxe-expert-01', 'Série de 6 frappes', 'combinaison', 'jab direct crochet-avant direct uppercut-avant direct'],
    ['boxe-expert-02', 'Série de 8 frappes', 'combinaison', 'jab jab direct crochet-avant uppercut-arriere crochet-avant direct crochet-avant'],
    ['boxe-expert-03', 'Série de 10 frappes', 'combinaison', 'jab direct crochet-avant direct crochet-avant-corps crochet-avant uppercut-arriere crochet-avant direct crochet-avant'],
    ['boxe-expert-04', 'Défense et contre complet', 'defense', 'parade esquive-droite roll-gauche crochet-avant direct crochet-avant uppercut-arriere'],
    ['boxe-expert-05', 'Changements de rythme', 'combinaison', 'jab feinte-epaule jab direct retrait direct crochet-avant'],
    ['boxe-expert-06', 'Déplacements multiples', 'deplacement', 'pas-avant jab direct pas-arriere pas-gauche jab pivot-droite direct crochet-avant'],
    ['boxe-expert-07', 'Corps-tête-corps', 'combinaison', 'jab-corps direct crochet-avant-corps crochet-avant direct-corps uppercut-arriere crochet-avant'],
    ['boxe-expert-08', 'Round technique 3 minutes', 'round', 'jab direct esquive-droite direct crochet-avant roll-droite crochet-avant direct pas-arriere jab'],
    ['boxe-expert-09', 'Round puissance', 'round', 'direct crochet-avant direct uppercut-arriere crochet-avant crochet-avant-corps crochet-avant direct'],
    ['boxe-expert-10', 'Contre sur roll', 'defense', 'roll-droite crochet-avant direct roll-gauche crochet-arriere crochet-avant uppercut-arriere direct'],
    ['boxe-expert-11', 'Cardio expert', 'cardio', 'jab direct jab direct crochet-avant direct uppercut-arriere crochet-avant direct jab'],
  ],
};

// ---------------------------------------------------------------------------------- KICK
const KICK: Record<LevelId, Row[]> = {
  debutant: [
    ['kickboxing-debutant-01', 'Garde de kick-boxing', 'technique', 'garde'],
    ['kickboxing-debutant-02', null, 'technique', 'jab'],
    ['kickboxing-debutant-03', null, 'technique', 'direct'],
    ['kickboxing-debutant-04', null, 'technique', 'front-kick-avant'],
    ['kickboxing-debutant-05', null, 'technique', 'low-kick-arriere'],
    ['kickboxing-debutant-06', null, 'technique', 'middle-kick-arriere'],
    ['kickboxing-debutant-07', null, 'technique', 'roundhouse-arriere'],
    ['kickboxing-debutant-08', 'Check du low kick', 'defense', 'check-avant'],
    ['kickboxing-debutant-09', null, 'combinaison', 'jab middle-kick-arriere'],
    ['kickboxing-debutant-10', null, 'combinaison', 'jab direct low-kick-arriere'],
    ['kickboxing-debutant-11', 'Pas avant et pas arrière', 'deplacement', 'pas-avant pas-arriere'],
    // added in v0.21.0 (K1: knees allowed); appended so the ids of the exercises above do not change
    ['kickboxing-debutant-12', 'Genou direct (K1)', 'technique', 'genou-direct-arriere'],
    ['kickboxing-debutant-13', null, 'combinaison', 'jab direct genou-direct-arriere'],
  ],
  intermediaire: [
    ['kickboxing-intermediaire-01', null, 'combinaison', 'direct crochet-avant low-kick-arriere'],
    ['kickboxing-intermediaire-02', null, 'combinaison', 'jab direct high-kick-arriere'],
    ['kickboxing-intermediaire-03', null, 'combinaison', 'low-kick-arriere direct crochet-avant'],
    ['kickboxing-intermediaire-04', null, 'combinaison', 'jab jab direct middle-kick-arriere'],
    ['kickboxing-intermediaire-05', 'Check et contre', 'defense', 'check-avant direct low-kick-arriere'],
    ['kickboxing-intermediaire-06', 'Front kick et poings', 'combinaison', 'front-kick-avant jab direct'],
    ['kickboxing-intermediaire-07', 'Blocage et retour', 'defense', 'blocage-haut direct middle-kick-arriere'],
    ['kickboxing-intermediaire-08', 'Retrait de buste et contre', 'defense', 'retrait direct crochet-avant'],
    ['kickboxing-intermediaire-09', 'Changement de distance', 'deplacement', 'pas-avant jab direct pas-arriere front-kick-avant'],
    ['kickboxing-intermediaire-10', 'Crochet et low kick', 'combinaison', 'jab crochet-avant low-kick-arriere'],
    ['kickboxing-intermediaire-11', null, 'combinaison', 'uppercut-arriere crochet-avant high-kick-arriere'],
    ['kickboxing-intermediaire-12', 'Genou circulaire (K1)', 'technique', 'genou-circulaire-arriere'],
    ['kickboxing-intermediaire-13', 'Poings et genou', 'combinaison', 'jab crochet-avant genou-direct-arriere'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['kickboxing-intermediaire-14', 'Switch kick', 'technique', 'switch-kick'],
  ],
  avance: [
    ['kickboxing-avance-01', 'Poings-pieds en 5', 'combinaison', 'jab direct crochet-avant direct low-kick-arriere'],
    ['kickboxing-avance-02', 'Pied avant d’entrée', 'combinaison', 'roundhouse-avant direct crochet-avant middle-kick-arriere'],
    ['kickboxing-avance-03', 'Low kick des deux côtés', 'combinaison', 'jab low-kick-avant direct low-kick-arriere'],
    ['kickboxing-avance-04', 'High kick après les poings', 'combinaison', 'jab direct crochet-avant high-kick-arriere'],
    ['kickboxing-avance-05', 'Esquive et pied', 'defense', 'esquive-droite crochet-avant direct middle-kick-arriere'],
    ['kickboxing-avance-06', 'Front kick, poings, middle', 'combinaison', 'front-kick-arriere jab direct middle-kick-arriere'],
    ['kickboxing-avance-07', 'Changement d’angle', 'deplacement', 'jab direct sortie-angle crochet-avant low-kick-arriere'],
    ['kickboxing-avance-08', 'Check, contre complet', 'defense', 'check-avant jab direct crochet-avant low-kick-arriere'],
    ['kickboxing-avance-09', 'Corps et jambes', 'combinaison', 'jab-corps direct crochet-avant-corps middle-kick-arriere'],
    ['kickboxing-avance-10', 'Feinte et pied', 'combinaison', 'feinte-jab direct high-kick-arriere'],
    ['kickboxing-avance-11', 'Cardio poings-pieds', 'cardio', 'jab direct low-kick-arriere jab direct middle-kick-arriere'],
    ['kickboxing-avance-12', 'Genou après le middle', 'combinaison', 'jab direct middle-kick-arriere genou-direct-arriere'],
    ['kickboxing-avance-13', 'Au-dessus de la ceinture', 'combinaison', 'jab direct crochet-avant-corps high-kick-avant'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['kickboxing-avance-14', 'Jab, direct, switch kick', 'combinaison', 'jab direct switch-kick'],
  ],
  expert: [
    ['kickboxing-expert-01', 'Enchaînement de 6', 'combinaison', 'jab direct crochet-avant uppercut-arriere crochet-avant low-kick-arriere'],
    ['kickboxing-expert-02', 'Enchaînement de 7', 'combinaison', 'jab jab direct crochet-avant direct low-kick-arriere high-kick-avant'],
    ['kickboxing-expert-03', 'Enchaînement de 8', 'combinaison', 'front-kick-avant jab direct crochet-avant direct roundhouse-arriere check-avant direct'],
    ['kickboxing-expert-04', 'Défense-contre poings-pieds', 'defense', 'check-avant blocage-haut esquive-droite crochet-avant direct low-kick-arriere'],
    ['kickboxing-expert-05', 'Rythme cassé', 'combinaison', 'jab feinte-epaule direct crochet-avant retrait direct high-kick-arriere'],
    ['kickboxing-expert-06', 'Pression vers l’avant', 'deplacement', 'pas-avant jab direct pas-avant crochet-avant direct low-kick-arriere'],
    ['kickboxing-expert-07', 'Combinaison 10 mouvements', 'combinaison', 'jab direct crochet-avant direct low-kick-arriere jab direct crochet-avant uppercut-arriere high-kick-arriere'],
    ['kickboxing-expert-08', 'Round technique', 'round', 'jab direct low-kick-arriere check-avant direct crochet-avant middle-kick-arriere pas-arriere'],
    ['kickboxing-expert-09', 'Round cardio', 'round', 'jab direct middle-kick-arriere jab direct low-kick-arriere front-kick-avant direct'],
    ['kickboxing-expert-10', 'Angles et pieds', 'deplacement', 'jab sortie-angle direct low-kick-arriere pivot-droite crochet-avant middle-kick-arriere'],
    ['kickboxing-expert-11', 'Finition', 'combinaison', 'uppercut-arriere crochet-avant direct high-kick-arriere direct crochet-avant'],
    ['kickboxing-expert-12', 'K1 complet', 'combinaison', 'jab direct genou-direct-arriere crochet-avant low-kick-arriere'],
    ['kickboxing-expert-13', 'Poings et pieds hauts', 'combinaison', 'jab direct crochet-avant uppercut-arriere crochet-avant middle-kick-arriere'],
    ['kickboxing-expert-14', 'Round au-dessus de la ceinture', 'round', 'jab direct roundhouse-arriere blocage-haut direct crochet-avant high-kick-arriere front-kick-avant'],
    ['kickboxing-expert-15', 'Défense et pieds hauts', 'defense', 'blocage-haut esquive-droite crochet-avant direct high-kick-arriere direct'],
  ],
};

// ---------------------------------------------------------------------------------- MMA
const MMA: Record<LevelId, Row[]> = {
  debutant: [
    ['mma-debutant-01', 'Garde de MMA', 'technique', 'garde'],
    ['mma-debutant-02', null, 'technique', 'jab'],
    ['mma-debutant-03', null, 'technique', 'direct'],
    ['mma-debutant-04', null, 'technique', 'low-kick-arriere'],
    ['mma-debutant-05', null, 'technique', 'changement-niveau'],
    ['mma-debutant-06', null, 'technique', 'sprawl'],
    ['mma-debutant-07', 'Défense debout contre l’entrée', 'defense', 'defense-lutte'],
    ['mma-debutant-08', null, 'combinaison', 'jab direct low-kick-arriere'],
    ['mma-debutant-09', null, 'combinaison', 'jab direct sprawl'],
    ['mma-debutant-10', 'Descente au sol et relevé', 'technique', 'descente-sol releve-technique'],
    ['mma-debutant-11', 'Déplacements de base', 'deplacement', 'pas-avant pas-arriere pas-gauche pas-droite'],
  ],
  intermediaire: [
    ['mma-intermediaire-01', null, 'combinaison', 'jab feinte-lutte direct'],
    ['mma-intermediaire-02', null, 'combinaison', 'direct crochet-avant changement-niveau'],
    ['mma-intermediaire-03', null, 'combinaison', 'low-kick-arriere direct crochet-avant'],
    ['mma-intermediaire-04', null, 'combinaison', 'feinte-jab jab direct sortie-angle'],
    ['mma-intermediaire-05', 'Entrée en lutte après les poings', 'combinaison', 'jab direct entree-lutte'],
    ['mma-intermediaire-06', 'Défense et contre', 'defense', 'sprawl jab direct'],
    ['mma-intermediaire-07', 'Front kick et changement de niveau', 'combinaison', 'front-kick-avant jab changement-niveau'],
    ['mma-intermediaire-08', 'Mobilité au sol', 'technique', 'descente-sol sortie-hanche releve-technique'],
    ['mma-intermediaire-09', 'Overhand', 'technique', 'overhand'],
    ['mma-intermediaire-10', 'Teep et poings', 'combinaison', 'teep-avant jab direct'],
    ['mma-intermediaire-11', 'Middle kick et sortie', 'combinaison', 'jab middle-kick-arriere sortie-angle'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['mma-intermediaire-12', 'Entrée en single-leg (solo)', 'technique', 'single-leg'],
    ['mma-intermediaire-13', 'Sit-out', 'technique', 'descente-sol sit-out releve-technique'],
  ],
  avance: [
    ['mma-avance-01', 'Striking + défense de lutte', 'combinaison', 'jab direct crochet-avant sprawl jab direct'],
    ['mma-avance-02', 'Feinte, entrée', 'combinaison', 'jab feinte-lutte direct crochet-avant entree-lutte'],
    ['mma-avance-03', 'Overhand et lutte', 'combinaison', 'jab overhand changement-niveau entree-lutte'],
    ['mma-avance-04', 'Low kick, poings, sortie', 'combinaison', 'low-kick-arriere direct crochet-avant sortie-angle jab'],
    ['mma-avance-05', 'Double sprawl', 'defense', 'jab sprawl direct sprawl crochet-avant'],
    ['mma-avance-06', 'Sol vers debout', 'technique', 'descente-sol sortie-hanche sortie-hanche releve-technique jab direct'],
    ['mma-avance-07', 'Genou d’entrée', 'combinaison', 'jab direct genou-direct-arriere'],
    ['mma-avance-08', 'Défense de lutte et pied', 'defense', 'defense-lutte direct high-kick-arriere'],
    ['mma-avance-09', 'Angles MMA', 'deplacement', 'jab sortie-angle direct pivot-droite crochet-avant low-kick-arriere'],
    ['mma-avance-10', 'Feintes enchaînées', 'combinaison', 'feinte-jab feinte-lutte overhand crochet-avant'],
    ['mma-avance-11', 'Cardio MMA', 'cardio', 'jab direct sprawl jab direct changement-niveau'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['mma-avance-12', 'Check hook (crochet pivot)', 'technique', 'check-hook'],
    ['mma-avance-13', 'Frappe puis single-leg', 'combinaison', 'jab direct single-leg'],
  ],
  expert: [
    ['mma-expert-01', 'Séquence striking-lutte 6', 'combinaison', 'jab direct crochet-avant changement-niveau entree-lutte direct'],
    ['mma-expert-02', 'Séquence 8 avec sprawl', 'combinaison', 'jab direct low-kick-arriere sprawl jab direct crochet-avant overhand'],
    ['mma-expert-03', 'Transitions debout-sol', 'technique', 'jab direct descente-sol sortie-hanche releve-technique jab direct crochet-avant'],
    ['mma-expert-04', 'Défense et contre complet', 'defense', 'defense-lutte sprawl direct crochet-avant uppercut-arriere crochet-avant'],
    ['mma-expert-05', 'Feinte, angle, finition', 'combinaison', 'feinte-jab jab direct sortie-angle crochet-avant direct high-kick-arriere'],
    ['mma-expert-06', 'Pression et lutte', 'deplacement', 'pas-avant jab direct pas-avant crochet-avant changement-niveau entree-lutte'],
    ['mma-expert-07', 'Combinaison 10 mouvements', 'combinaison', 'jab direct crochet-avant low-kick-arriere jab overhand crochet-avant feinte-lutte entree-lutte direct'],
    ['mma-expert-08', 'Round MMA technique', 'round', 'jab direct sprawl jab low-kick-arriere crochet-avant changement-niveau direct'],
    ['mma-expert-09', 'Round MMA cardio', 'round', 'jab direct sprawl jab direct sprawl crochet-avant direct'],
    ['mma-expert-10', 'Genou et clinch de cage (solo)', 'combinaison', 'jab direct genou-direct-arriere crochet-avant uppercut-arriere'],
    ['mma-expert-11', 'Finition expert', 'combinaison', 'overhand crochet-avant uppercut-arriere crochet-avant direct high-kick-arriere'],
  ],
};

// ---------------------------------------------------------------------------------- MUAY-THAÏ
const MUAY: Record<LevelId, Row[]> = {
  debutant: [
    ['muaythai-debutant-01', 'Garde de muay-thaï', 'technique', 'garde'],
    ['muaythai-debutant-02', null, 'technique', 'jab'],
    ['muaythai-debutant-03', null, 'technique', 'direct'],
    ['muaythai-debutant-04', null, 'technique', 'teep-avant'],
    ['muaythai-debutant-05', null, 'technique', 'low-kick-arriere'],
    ['muaythai-debutant-06', null, 'technique', 'middle-kick-arriere'],
    ['muaythai-debutant-07', null, 'technique', 'genou-direct-arriere'],
    ['muaythai-debutant-08', null, 'technique', 'coude-horizontal-avant'],
    ['muaythai-debutant-09', 'Check', 'defense', 'check-avant'],
    ['muaythai-debutant-10', null, 'combinaison', 'jab direct low-kick-arriere'],
    ['muaythai-debutant-11', null, 'combinaison', 'jab direct genou-direct-arriere'],
  ],
  intermediaire: [
    ['muaythai-intermediaire-01', null, 'combinaison', 'direct crochet-avant middle-kick-arriere'],
    ['muaythai-intermediaire-02', null, 'combinaison', 'teep-avant direct low-kick-arriere'],
    ['muaythai-intermediaire-03', null, 'combinaison', 'crochet-avant coude-horizontal-arriere'],
    ['muaythai-intermediaire-04', null, 'combinaison', 'direct genou-direct-arriere coude-horizontal-avant'],
    ['muaythai-intermediaire-05', null, 'combinaison', 'check-avant direct low-kick-arriere'],
    ['muaythai-intermediaire-06', 'Coude diagonal', 'technique', 'coude-diagonal-arriere'],
    ['muaythai-intermediaire-07', 'Coude remontant', 'technique', 'coude-montant-arriere'],
    ['muaythai-intermediaire-08', 'Genou circulaire', 'technique', 'genou-circulaire-arriere'],
    ['muaythai-intermediaire-09', 'Clinch simulé et genoux', 'combinaison', 'clinch-tirage genou-clinch genou-clinch'],
    ['muaythai-intermediaire-10', 'Teep et middle', 'combinaison', 'teep-avant middle-kick-arriere'],
    ['muaythai-intermediaire-11', 'High kick', 'technique', 'high-kick-arriere'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['muaythai-intermediaire-12', 'Garde longue', 'defense', 'garde-longue'],
    ['muaythai-intermediaire-13', 'Rattrapage du middle kick', 'defense', 'rattrapage-middle'],
  ],
  avance: [
    ['muaythai-avance-01', 'Poings-pieds-genoux', 'combinaison', 'jab direct crochet-avant genou-direct-arriere'],
    ['muaythai-avance-02', 'Coudes en série', 'combinaison', 'coude-horizontal-avant coude-horizontal-arriere coude-montant-arriere'],
    ['muaythai-avance-03', 'Check, contre au middle', 'defense', 'check-avant direct crochet-avant middle-kick-arriere'],
    ['muaythai-avance-04', 'Clinch : tirage et genoux', 'combinaison', 'clinch-tirage genou-clinch genou-circulaire-clinch genou-clinch'],
    ['muaythai-avance-05', 'Teep, poings, coude', 'combinaison', 'teep-avant jab direct coude-horizontal-avant'],
    ['muaythai-avance-06', 'Middle des deux côtés', 'combinaison', 'jab middle-kick-avant direct middle-kick-arriere'],
    ['muaythai-avance-07', 'Esquive et coude', 'defense', 'esquive-droite crochet-avant coude-horizontal-arriere'],
    ['muaythai-avance-08', 'High kick après les poings', 'combinaison', 'jab direct crochet-avant high-kick-arriere'],
    ['muaythai-avance-09', 'Genou circulaire et coude', 'combinaison', 'genou-circulaire-avant coude-diagonal-arriere crochet-avant'],
    ['muaythai-avance-10', 'Pression muay-thaï', 'deplacement', 'pas-avant teep-avant pas-avant jab direct low-kick-arriere'],
    ['muaythai-avance-11', 'Cardio thaï', 'cardio', 'jab direct middle-kick-arriere jab direct genou-direct-arriere'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['muaythai-avance-12', 'Switch kick', 'technique', 'switch-kick'],
    ['muaythai-avance-13', 'Jab puis switch kick', 'combinaison', 'jab switch-kick'],
  ],
  expert: [
    ['muaythai-expert-01', 'Combinaison complète 6', 'combinaison', 'jab direct crochet-avant coude-horizontal-arriere genou-direct-arriere low-kick-arriere'],
    ['muaythai-expert-02', 'Combinaison 8 armes', 'combinaison', 'teep-avant jab direct crochet-avant coude-horizontal-arriere genou-direct-arriere coude-montant-avant middle-kick-arriere'],
    ['muaythai-expert-03', 'Défense thaï complète', 'defense', 'check-avant blocage-haut esquive-droite direct coude-horizontal-avant genou-direct-arriere'],
    ['muaythai-expert-04', 'Clinch long (solo)', 'combinaison', 'clinch-tirage genou-clinch genou-circulaire-clinch genou-clinch coude-diagonal-arriere coude-montant-arriere'],
    ['muaythai-expert-05', 'Combinaison 10 mouvements', 'combinaison', 'jab direct crochet-avant direct low-kick-arriere teep-avant jab direct genou-direct-arriere coude-horizontal-avant'],
    ['muaythai-expert-06', 'Rythme thaï', 'combinaison', 'jab feinte-epaule direct middle-kick-arriere check-avant direct high-kick-arriere'],
    ['muaythai-expert-07', 'Avancer en frappant', 'deplacement', 'pas-avant jab direct pas-avant genou-direct-arriere coude-horizontal-avant pas-arriere teep-avant'],
    ['muaythai-expert-08', 'Round technique', 'round', 'teep-avant jab direct low-kick-arriere check-avant middle-kick-arriere genou-direct-arriere'],
    ['muaythai-expert-09', 'Round puissance', 'round', 'direct crochet-avant middle-kick-arriere direct genou-direct-arriere coude-horizontal-arriere high-kick-arriere'],
    ['muaythai-expert-10', 'Coudes et genoux', 'combinaison', 'coude-horizontal-avant coude-horizontal-arriere genou-direct-arriere genou-circulaire-avant coude-diagonal-arriere coude-montant-arriere'],
    ['muaythai-expert-11', 'Finition expert', 'combinaison', 'jab direct crochet-avant uppercut-arriere coude-horizontal-avant genou-direct-arriere high-kick-arriere'],
  ],
};

// ---------------------------------------------------------------------------------- BJJ (solo only)
// Every row is really done alone, on a mat. Passes, controls, sweeps and submissions need a partner:
// they are fiches (src/domain/partner.ts), never exercises.
const BJJ: Record<LevelId, Row[]> = {
  debutant: [
    ['bjj-debutant-01', 'Posture debout de grappling', 'technique', 'garde-bjj'],
    ['bjj-debutant-02', 'Descente au sol et relevé technique', 'technique', 'descente-sol releve-technique'],
    ['bjj-debutant-03', 'Pont (upa)', 'technique', 'descente-sol pont releve-technique'],
    ['bjj-debutant-04', 'Sortie de hanche (shrimp)', 'technique', 'descente-sol sortie-hanche releve-technique'],
    ['bjj-debutant-05', 'Changement de base', 'technique', 'descente-sol changement-base releve-technique'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['bjj-debutant-06', 'Sit-out', 'technique', 'descente-sol sit-out releve-technique'],
    ['bjj-debutant-07', 'Chute arrière basse (ushiro-ukemi)', 'technique', 'ukemi-ushiro', { description: 'Chute arrière basse, sur un tapis épais : accroupi, assis, tu roules sur le dos arrondi et les bras frappent. Jamais depuis debout à la maison.' }],
    ['bjj-debutant-08', 'Relevé depuis les genoux', 'technique', 'releve-genoux'],
  ],
  intermediaire: [
    ['bjj-intermediaire-01', 'Pont puis sortie de hanche', 'combinaison', 'descente-sol pont sortie-hanche releve-technique'],
    ['bjj-intermediaire-02', 'Rétention de garde (solo)', 'technique', 'descente-sol retention-garde releve-technique'],
    ['bjj-intermediaire-03', 'Shrimp et changement de base', 'combinaison', 'descente-sol sortie-hanche changement-base releve-technique'],
    ['bjj-intermediaire-04', 'Deux shrimps et relevé', 'deplacement', 'descente-sol sortie-hanche sortie-hanche releve-technique'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['bjj-intermediaire-05', 'Changement de niveau', 'technique', 'changement-niveau'],
    ['bjj-intermediaire-06', 'Entrée en double-leg (solo)', 'technique', 'entree-lutte'],
    ['bjj-intermediaire-07', 'Changement de base et sit-out', 'combinaison', 'descente-sol changement-base sit-out releve-technique'],
  ],
  avance: [
    ['bjj-avance-01', 'Sorties enchaînées', 'combinaison', 'descente-sol pont sortie-hanche retention-garde releve-technique'],
    ['bjj-avance-02', 'Mobilité complète', 'combinaison', 'descente-sol pont sortie-hanche changement-base releve-technique'],
    ['bjj-avance-03', 'Garde et relevé', 'combinaison', 'descente-sol retention-garde sortie-hanche releve-technique'],
    ['bjj-avance-04', 'Circuit de mobilité', 'cardio', 'descente-sol pont pont sortie-hanche sortie-hanche releve-technique'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['bjj-avance-05', 'Single-leg et double-leg', 'combinaison', 'changement-niveau single-leg entree-lutte'],
    ['bjj-avance-06', 'Genoux, sol, sit-out', 'combinaison', 'releve-genoux descente-sol sit-out releve-technique'],
  ],
  expert: [
    ['bjj-expert-01', 'Round de mobilité au sol', 'round', 'descente-sol pont sortie-hanche retention-garde changement-base releve-technique'],
    ['bjj-expert-02', 'Round cardio au sol', 'cardio', 'descente-sol pont sortie-hanche sortie-hanche changement-base pont releve-technique'],
    ['bjj-expert-03', 'Enchaînement long', 'combinaison', 'descente-sol retention-garde pont sortie-hanche retention-garde releve-technique'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['bjj-expert-04', 'Round lutte et sol', 'round', 'changement-niveau entree-lutte single-leg descente-sol sit-out sortie-hanche releve-technique'],
  ],
};

// ---------------------------------------------------------------------------------- judo (solo only)
// Postures, displacements, grips, kuzushi and uchikomi entries without a partner. No throw is
// proposed at home, and falls (ukemi) only in their low stage (from a squat or seated, on a thick mat,
// Judo Québec progression, jb-S11): falls from standing are learned on a tatami with a teacher.
const JUDO: Record<LevelId, Row[]> = {
  debutant: [
    ['judo-debutant-01', 'Shizen-tai', 'technique', 'shizen-tai'],
    ['judo-debutant-02', 'Tsugi-ashi avant et arrière', 'deplacement', 'tsugi-ashi-avant tsugi-ashi-arriere'],
    ['judo-debutant-03', 'Tsugi-ashi latéral', 'deplacement', 'tsugi-ashi-lateral'],
    ['judo-debutant-04', 'Tai-sabaki', 'technique', 'tai-sabaki'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['judo-debutant-05', 'Ayumi-ashi (pas marchés)', 'deplacement', 'ayumi-ashi'],
    ['judo-debutant-06', 'Kumi-kata (prise de garde)', 'technique', 'kumikata'],
    ['judo-debutant-07', 'Ushiro-ukemi, version basse', 'technique', 'ukemi-ushiro', { description: 'Chute arrière basse, sur un tapis épais : accroupi, assis, tu roules sur le dos arrondi et les bras frappent. Jamais depuis debout à la maison.' }],
  ],
  intermediaire: [
    ['judo-intermediaire-01', 'Kuzushi (déséquilibre, solo)', 'technique', 'kuzushi'],
    ['judo-intermediaire-02', 'Uchikomi de seoi-nage (solo)', 'technique', 'uchikomi-seoi'],
    ['judo-intermediaire-03', 'Avancer puis déséquilibrer', 'combinaison', 'tsugi-ashi-avant kuzushi'],
    ['judo-intermediaire-04', 'Déplacements et rotation', 'deplacement', 'tsugi-ashi-avant tsugi-ashi-arriere tai-sabaki'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['judo-intermediaire-05', 'Uchikomi d’o-goshi (solo)', 'technique', 'uchikomi-o-goshi'],
    ['judo-intermediaire-06', 'Uchikomi d’o-soto-gari (solo)', 'technique', 'uchikomi-o-soto-gari'],
    ['judo-intermediaire-07', 'Yoko-ukemi, version basse', 'technique', 'ukemi-yoko', { description: 'Chute sur le côté, version basse, sur un tapis épais : depuis l’assise, un côté puis l’autre. Jamais depuis debout à la maison.' }],
    ['judo-intermediaire-08', 'Prise de garde puis entrée', 'combinaison', 'kumikata uchikomi-o-goshi'],
  ],
  avance: [
    ['judo-avance-01', 'Kuzushi puis entrée', 'combinaison', 'kuzushi uchikomi-seoi'],
    ['judo-avance-02', 'Reculer, déséquilibrer, entrer', 'combinaison', 'tsugi-ashi-arriere kuzushi uchikomi-seoi'],
    ['judo-avance-03', 'Série d’uchikomi', 'cardio', 'uchikomi-seoi uchikomi-seoi uchikomi-seoi'],
    ['judo-avance-04', 'Rotation et entrée', 'combinaison', 'tai-sabaki tsugi-ashi-avant uchikomi-seoi'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['judo-avance-05', 'Uchikomi d’o-uchi-gari (solo)', 'technique', 'uchikomi-o-uchi-gari'],
    ['judo-avance-06', 'Uchikomi de ko-uchi-gari (solo)', 'technique', 'uchikomi-ko-uchi-gari'],
    ['judo-avance-07', 'Deux fauchages intérieurs', 'combinaison', 'uchikomi-ko-uchi-gari uchikomi-o-uchi-gari'],
    ['judo-avance-08', 'Marcher, saisir, entrer', 'combinaison', 'ayumi-ashi kumikata uchikomi-o-soto-gari'],
  ],
  expert: [
    ['judo-expert-01', 'Round d’uchikomi', 'round', 'tsugi-ashi-avant kuzushi uchikomi-seoi tsugi-ashi-arriere kuzushi uchikomi-seoi'],
    ['judo-expert-02', 'Déplacements et entrées', 'combinaison', 'tsugi-ashi-lateral tai-sabaki kuzushi uchikomi-seoi tsugi-ashi-arriere uchikomi-seoi'],
    ['judo-expert-03', 'Série longue d’uchikomi', 'cardio', 'uchikomi-seoi uchikomi-seoi uchikomi-seoi uchikomi-seoi uchikomi-seoi'],
    // added in v0.28.0 (enrichissement des disciplines); appended at the end at the time (ids were positional until 2.10.7)
    ['judo-expert-04', 'Round des quatre entrées', 'round', 'kumikata uchikomi-o-goshi uchikomi-o-soto-gari uchikomi-o-uchi-gari uchikomi-ko-uchi-gari'],
    ['judo-expert-05', 'Chutes basses enchaînées', 'technique', 'ukemi-ushiro ukemi-yoko ukemi-ushiro', { description: 'Chutes arrière et de côté en version basse, sur un tapis épais. Jamais depuis debout à la maison.' }],
  ],
};

const TABLE: Record<DisciplineId, Record<LevelId, Row[]>> = { boxe: BOXE, kickboxing: KICK, mma: MMA, muaythai: MUAY, bjj: BJJ, judo: JUDO };

export const EXERCISES: Exercise[] = (Object.keys(TABLE) as DisciplineId[]).flatMap((d) =>
  (Object.keys(TABLE[d]) as LevelId[]).flatMap((l) => build(d, l, TABLE[d][l])),
);

export const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
if (EXERCISE_BY_ID.size !== EXERCISES.length) throw new Error('Identifiant d’exercice en double');
for (const id of RETIRED_EXERCISE_IDS) if (EXERCISE_BY_ID.has(id)) throw new Error(`Identifiant retiré réutilisé : ${id}`);

export function exercisesFor(d: DisciplineId, l: LevelId) {
  return EXERCISES.filter((e) => e.discipline === d && e.level === l);
}
