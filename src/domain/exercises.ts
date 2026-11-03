import { TECHNIQUE_BY_ID } from './techniques';
import type { DisciplineId, Exercise, ExerciseKind, LevelId } from './types';

const LEVEL_DEFAULTS: Record<LevelId, { speed: number; rest: number }> = {
  debutant: { speed: 0.55, rest: 1.6 },
  intermediaire: { speed: 0.75, rest: 1.0 },
  avance: { speed: 0.9, rest: 0.6 },
  expert: { speed: 1.0, rest: 0.4 },
};

type Row = [name: string | null, kind: ExerciseKind, seq: string, extra?: Partial<Exercise>];

const nameOf = (seq: string[]) => seq.map((id) => TECHNIQUE_BY_ID.get(id)?.name ?? id).join(' → ');

function build(discipline: DisciplineId, level: LevelId, rows: Row[]): Exercise[] {
  return rows.map(([name, kind, seq, extra], i) => {
    const sequence = seq.split(/\s+/).filter(Boolean);
    for (const id of sequence) if (!TECHNIQUE_BY_ID.has(id)) throw new Error(`Technique inconnue ${id}`);
    const firstSolo = sequence.map((id) => TECHNIQUE_BY_ID.get(id)?.soloNote).find(Boolean);
    const d = LEVEL_DEFAULTS[level];
    const label = name ?? nameOf(sequence);
    const cues = sequence.flatMap((id) => TECHNIQUE_BY_ID.get(id)?.cues.slice(0, 1) ?? []);
    return {
      id: `${discipline}-${level}-${String(i + 1).padStart(2, '0')}`,
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
    ['Garde orthodoxe et respiration', 'technique', 'garde', { description: 'Tiens ta garde, souple sur les jambes, mains hautes, menton rentré. Et respire.' }],
    [null, 'technique', 'jab'],
    [null, 'technique', 'direct'],
    [null, 'technique', 'crochet-avant'],
    [null, 'technique', 'uppercut-arriere'],
    ['Pas avant et pas arrière', 'deplacement', 'pas-avant pas-arriere'],
    ['Pas latéraux', 'deplacement', 'pas-gauche pas-droite'],
    [null, 'combinaison', 'jab direct'],
    [null, 'combinaison', 'jab jab direct'],
    ['Esquive extérieure en garde', 'defense', 'esquive-droite'],
    ['Blocage haut', 'defense', 'blocage-haut'],
    ['Jab en avançant', 'combinaison', 'pas-avant jab'],
  ],
  intermediaire: [
    [null, 'combinaison', 'jab direct crochet-avant'],
    [null, 'combinaison', 'jab direct crochet-avant direct'],
    [null, 'combinaison', 'jab esquive-droite direct'],
    [null, 'combinaison', 'direct crochet-avant direct'],
    [null, 'combinaison', 'uppercut-arriere crochet-avant direct'],
    ['Crochets au corps', 'combinaison', 'crochet-avant-corps crochet-arriere-corps crochet-avant'],
    ['Parade et contre', 'defense', 'parade direct crochet-avant'],
    ['Roll sous le crochet', 'defense', 'roll-droite crochet-avant'],
    ['Pivot après le jab', 'deplacement', 'jab pivot-droite jab'],
    ['Retrait et contre', 'defense', 'retrait direct'],
    ['Jab au corps, jab à la tête', 'combinaison', 'jab-corps jab direct'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Shoulder roll (rouler l’épaule)', 'defense', 'shoulder-roll'],
    ['Check hook (crochet pivot)', 'technique', 'check-hook'],
  ],
  avance: [
    [null, 'combinaison', 'jab direct roll-droite crochet-avant'],
    [null, 'combinaison', 'jab direct crochet-avant uppercut-arriere crochet-avant'],
    ['Sortie d’angle et crochet', 'combinaison', 'jab direct sortie-angle crochet-avant direct'],
    ['Corps puis tête', 'combinaison', 'jab-corps direct-corps crochet-avant uppercut-arriere'],
    ['Esquive, roll, contre', 'defense', 'esquive-droite roll-gauche crochet-arriere crochet-avant direct'],
    ['Double crochet et direct', 'combinaison', 'crochet-avant crochet-avant direct crochet-avant'],
    ['Feinte et attaque', 'combinaison', 'feinte-jab direct crochet-avant direct'],
    ['Blocage puis riposte', 'defense', 'blocage-haut crochet-avant direct crochet-avant'],
    ['Pivots et angles', 'deplacement', 'jab pivot-droite direct pivot-gauche jab direct'],
    ['Uppercuts en série', 'combinaison', 'uppercut-avant uppercut-arriere crochet-avant direct'],
    ['Cardio boxe', 'cardio', 'jab direct jab direct crochet-avant direct'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Shoulder roll et riposte', 'defense', 'shoulder-roll direct'],
    ['Jab, direct, check hook', 'combinaison', 'jab direct check-hook'],
  ],
  expert: [
    ['Série de 6 frappes', 'combinaison', 'jab direct crochet-avant direct uppercut-avant direct'],
    ['Série de 8 frappes', 'combinaison', 'jab jab direct crochet-avant uppercut-arriere crochet-avant direct crochet-avant'],
    ['Série de 10 frappes', 'combinaison', 'jab direct crochet-avant direct crochet-avant-corps crochet-avant uppercut-arriere crochet-avant direct crochet-avant'],
    ['Défense et contre complet', 'defense', 'parade esquive-droite roll-gauche crochet-avant direct crochet-avant uppercut-arriere'],
    ['Changements de rythme', 'combinaison', 'jab feinte-epaule jab direct retrait direct crochet-avant'],
    ['Déplacements multiples', 'deplacement', 'pas-avant jab direct pas-arriere pas-gauche jab pivot-droite direct crochet-avant'],
    ['Corps-tête-corps', 'combinaison', 'jab-corps direct crochet-avant-corps crochet-avant direct-corps uppercut-arriere crochet-avant'],
    ['Round technique 3 minutes', 'round', 'jab direct esquive-droite direct crochet-avant roll-droite crochet-avant direct pas-arriere jab'],
    ['Round puissance', 'round', 'direct crochet-avant direct uppercut-arriere crochet-avant crochet-avant-corps crochet-avant direct'],
    ['Contre sur roll', 'defense', 'roll-droite crochet-avant direct roll-gauche crochet-arriere crochet-avant uppercut-arriere direct'],
    ['Cardio expert', 'cardio', 'jab direct jab direct crochet-avant direct uppercut-arriere crochet-avant direct jab'],
  ],
};

// ---------------------------------------------------------------------------------- KICK
const KICK: Record<LevelId, Row[]> = {
  debutant: [
    ['Garde de kick-boxing', 'technique', 'garde'],
    [null, 'technique', 'jab'],
    [null, 'technique', 'direct'],
    [null, 'technique', 'front-kick-avant'],
    [null, 'technique', 'low-kick-arriere'],
    [null, 'technique', 'middle-kick-arriere'],
    [null, 'technique', 'roundhouse-arriere'],
    ['Check du low kick', 'defense', 'check-avant'],
    [null, 'combinaison', 'jab middle-kick-arriere'],
    [null, 'combinaison', 'jab direct low-kick-arriere'],
    ['Pas avant et pas arrière', 'deplacement', 'pas-avant pas-arriere'],
    // added in v0.21.0 (K1: knees allowed); appended so the ids of the exercises above do not change
    ['Genou direct (K1)', 'technique', 'genou-direct-arriere'],
    [null, 'combinaison', 'jab direct genou-direct-arriere'],
  ],
  intermediaire: [
    [null, 'combinaison', 'direct crochet-avant low-kick-arriere'],
    [null, 'combinaison', 'jab direct high-kick-arriere'],
    [null, 'combinaison', 'low-kick-arriere direct crochet-avant'],
    [null, 'combinaison', 'jab jab direct middle-kick-arriere'],
    ['Check et contre', 'defense', 'check-avant direct low-kick-arriere'],
    ['Front kick et poings', 'combinaison', 'front-kick-avant jab direct'],
    ['Blocage et retour', 'defense', 'blocage-haut direct middle-kick-arriere'],
    ['Retrait de buste et contre', 'defense', 'retrait direct crochet-avant'],
    ['Changement de distance', 'deplacement', 'pas-avant jab direct pas-arriere front-kick-avant'],
    ['Crochet et low kick', 'combinaison', 'jab crochet-avant low-kick-arriere'],
    [null, 'combinaison', 'uppercut-arriere crochet-avant high-kick-arriere'],
    ['Genou circulaire (K1)', 'technique', 'genou-circulaire-arriere'],
    ['Poings et genou', 'combinaison', 'jab crochet-avant genou-direct-arriere'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Switch kick', 'technique', 'switch-kick'],
  ],
  avance: [
    ['Poings-pieds en 5', 'combinaison', 'jab direct crochet-avant direct low-kick-arriere'],
    ['Pied avant d’entrée', 'combinaison', 'roundhouse-avant direct crochet-avant middle-kick-arriere'],
    ['Low kick des deux côtés', 'combinaison', 'jab low-kick-avant direct low-kick-arriere'],
    ['High kick après les poings', 'combinaison', 'jab direct crochet-avant high-kick-arriere'],
    ['Esquive et pied', 'defense', 'esquive-droite crochet-avant direct middle-kick-arriere'],
    ['Front kick, poings, middle', 'combinaison', 'front-kick-arriere jab direct middle-kick-arriere'],
    ['Changement d’angle', 'deplacement', 'jab direct sortie-angle crochet-avant low-kick-arriere'],
    ['Check, contre complet', 'defense', 'check-avant jab direct crochet-avant low-kick-arriere'],
    ['Corps et jambes', 'combinaison', 'jab-corps direct crochet-avant-corps middle-kick-arriere'],
    ['Feinte et pied', 'combinaison', 'feinte-jab direct high-kick-arriere'],
    ['Cardio poings-pieds', 'cardio', 'jab direct low-kick-arriere jab direct middle-kick-arriere'],
    ['Genou après le middle', 'combinaison', 'jab direct middle-kick-arriere genou-direct-arriere'],
    ['Au-dessus de la ceinture', 'combinaison', 'jab direct crochet-avant-corps high-kick-avant'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Jab, direct, switch kick', 'combinaison', 'jab direct switch-kick'],
  ],
  expert: [
    ['Enchaînement de 6', 'combinaison', 'jab direct crochet-avant uppercut-arriere crochet-avant low-kick-arriere'],
    ['Enchaînement de 7', 'combinaison', 'jab jab direct crochet-avant direct low-kick-arriere high-kick-avant'],
    ['Enchaînement de 8', 'combinaison', 'front-kick-avant jab direct crochet-avant direct roundhouse-arriere check-avant direct'],
    ['Défense-contre poings-pieds', 'defense', 'check-avant blocage-haut esquive-droite crochet-avant direct low-kick-arriere'],
    ['Rythme cassé', 'combinaison', 'jab feinte-epaule direct crochet-avant retrait direct high-kick-arriere'],
    ['Pression vers l’avant', 'deplacement', 'pas-avant jab direct pas-avant crochet-avant direct low-kick-arriere'],
    ['Combinaison 10 mouvements', 'combinaison', 'jab direct crochet-avant direct low-kick-arriere jab direct crochet-avant uppercut-arriere high-kick-arriere'],
    ['Round technique', 'round', 'jab direct low-kick-arriere check-avant direct crochet-avant middle-kick-arriere pas-arriere'],
    ['Round cardio', 'round', 'jab direct middle-kick-arriere jab direct low-kick-arriere front-kick-avant direct'],
    ['Angles et pieds', 'deplacement', 'jab sortie-angle direct low-kick-arriere pivot-droite crochet-avant middle-kick-arriere'],
    ['Finition', 'combinaison', 'uppercut-arriere crochet-avant direct high-kick-arriere direct crochet-avant'],
    ['K1 complet', 'combinaison', 'jab direct genou-direct-arriere crochet-avant low-kick-arriere'],
    ['Poings et pieds hauts', 'combinaison', 'jab direct crochet-avant uppercut-arriere crochet-avant middle-kick-arriere'],
    ['Round au-dessus de la ceinture', 'round', 'jab direct roundhouse-arriere blocage-haut direct crochet-avant high-kick-arriere front-kick-avant'],
    ['Défense et pieds hauts', 'defense', 'blocage-haut esquive-droite crochet-avant direct high-kick-arriere direct'],
  ],
};

// ---------------------------------------------------------------------------------- MMA
const MMA: Record<LevelId, Row[]> = {
  debutant: [
    ['Garde de MMA', 'technique', 'garde'],
    [null, 'technique', 'jab'],
    [null, 'technique', 'direct'],
    [null, 'technique', 'low-kick-arriere'],
    [null, 'technique', 'changement-niveau'],
    [null, 'technique', 'sprawl'],
    ['Défense debout contre l’entrée', 'defense', 'defense-lutte'],
    [null, 'combinaison', 'jab direct low-kick-arriere'],
    [null, 'combinaison', 'jab direct sprawl'],
    ['Descente au sol et relevé', 'technique', 'descente-sol releve-technique'],
    ['Déplacements de base', 'deplacement', 'pas-avant pas-arriere pas-gauche pas-droite'],
  ],
  intermediaire: [
    [null, 'combinaison', 'jab feinte-lutte direct'],
    [null, 'combinaison', 'direct crochet-avant changement-niveau'],
    [null, 'combinaison', 'low-kick-arriere direct crochet-avant'],
    [null, 'combinaison', 'feinte-jab jab direct sortie-angle'],
    ['Entrée en lutte après les poings', 'combinaison', 'jab direct entree-lutte'],
    ['Défense et contre', 'defense', 'sprawl jab direct'],
    ['Front kick et changement de niveau', 'combinaison', 'front-kick-avant jab changement-niveau'],
    ['Mobilité au sol', 'technique', 'descente-sol sortie-hanche releve-technique'],
    ['Overhand', 'technique', 'overhand'],
    ['Teep et poings', 'combinaison', 'teep-avant jab direct'],
    ['Middle kick et sortie', 'combinaison', 'jab middle-kick-arriere sortie-angle'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Entrée en single-leg (solo)', 'technique', 'single-leg'],
    ['Sit-out', 'technique', 'descente-sol sit-out releve-technique'],
  ],
  avance: [
    ['Striking + défense de lutte', 'combinaison', 'jab direct crochet-avant sprawl jab direct'],
    ['Feinte, entrée', 'combinaison', 'jab feinte-lutte direct crochet-avant entree-lutte'],
    ['Overhand et lutte', 'combinaison', 'jab overhand changement-niveau entree-lutte'],
    ['Low kick, poings, sortie', 'combinaison', 'low-kick-arriere direct crochet-avant sortie-angle jab'],
    ['Double sprawl', 'defense', 'jab sprawl direct sprawl crochet-avant'],
    ['Sol vers debout', 'technique', 'descente-sol sortie-hanche sortie-hanche releve-technique jab direct'],
    ['Genou d’entrée', 'combinaison', 'jab direct genou-direct-arriere'],
    ['Défense de lutte et pied', 'defense', 'defense-lutte direct high-kick-arriere'],
    ['Angles MMA', 'deplacement', 'jab sortie-angle direct pivot-droite crochet-avant low-kick-arriere'],
    ['Feintes enchaînées', 'combinaison', 'feinte-jab feinte-lutte overhand crochet-avant'],
    ['Cardio MMA', 'cardio', 'jab direct sprawl jab direct changement-niveau'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Check hook (crochet pivot)', 'technique', 'check-hook'],
    ['Frappe puis single-leg', 'combinaison', 'jab direct single-leg'],
  ],
  expert: [
    ['Séquence striking-lutte 6', 'combinaison', 'jab direct crochet-avant changement-niveau entree-lutte direct'],
    ['Séquence 8 avec sprawl', 'combinaison', 'jab direct low-kick-arriere sprawl jab direct crochet-avant overhand'],
    ['Transitions debout-sol', 'technique', 'jab direct descente-sol sortie-hanche releve-technique jab direct crochet-avant'],
    ['Défense et contre complet', 'defense', 'defense-lutte sprawl direct crochet-avant uppercut-arriere crochet-avant'],
    ['Feinte, angle, finition', 'combinaison', 'feinte-jab jab direct sortie-angle crochet-avant direct high-kick-arriere'],
    ['Pression et lutte', 'deplacement', 'pas-avant jab direct pas-avant crochet-avant changement-niveau entree-lutte'],
    ['Combinaison 10 mouvements', 'combinaison', 'jab direct crochet-avant low-kick-arriere jab overhand crochet-avant feinte-lutte entree-lutte direct'],
    ['Round MMA technique', 'round', 'jab direct sprawl jab low-kick-arriere crochet-avant changement-niveau direct'],
    ['Round MMA cardio', 'round', 'jab direct sprawl jab direct sprawl crochet-avant direct'],
    ['Genou et clinch de cage (solo)', 'combinaison', 'jab direct genou-direct-arriere crochet-avant uppercut-arriere'],
    ['Finition expert', 'combinaison', 'overhand crochet-avant uppercut-arriere crochet-avant direct high-kick-arriere'],
  ],
};

// ---------------------------------------------------------------------------------- MUAY-THAÏ
const MUAY: Record<LevelId, Row[]> = {
  debutant: [
    ['Garde de muay-thaï', 'technique', 'garde'],
    [null, 'technique', 'jab'],
    [null, 'technique', 'direct'],
    [null, 'technique', 'teep-avant'],
    [null, 'technique', 'low-kick-arriere'],
    [null, 'technique', 'middle-kick-arriere'],
    [null, 'technique', 'genou-direct-arriere'],
    [null, 'technique', 'coude-horizontal-avant'],
    ['Check', 'defense', 'check-avant'],
    [null, 'combinaison', 'jab direct low-kick-arriere'],
    [null, 'combinaison', 'jab direct genou-direct-arriere'],
  ],
  intermediaire: [
    [null, 'combinaison', 'direct crochet-avant middle-kick-arriere'],
    [null, 'combinaison', 'teep-avant direct low-kick-arriere'],
    [null, 'combinaison', 'crochet-avant coude-horizontal-arriere'],
    [null, 'combinaison', 'direct genou-direct-arriere coude-horizontal-avant'],
    [null, 'combinaison', 'check-avant direct low-kick-arriere'],
    ['Coude diagonal', 'technique', 'coude-diagonal-arriere'],
    ['Coude remontant', 'technique', 'coude-montant-arriere'],
    ['Genou circulaire', 'technique', 'genou-circulaire-arriere'],
    ['Clinch simulé et genoux', 'combinaison', 'clinch-tirage genou-clinch genou-clinch'],
    ['Teep et middle', 'combinaison', 'teep-avant middle-kick-arriere'],
    ['High kick', 'technique', 'high-kick-arriere'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Garde longue', 'defense', 'garde-longue'],
    ['Rattrapage du middle kick', 'defense', 'rattrapage-middle'],
  ],
  avance: [
    ['Poings-pieds-genoux', 'combinaison', 'jab direct crochet-avant genou-direct-arriere'],
    ['Coudes en série', 'combinaison', 'coude-horizontal-avant coude-horizontal-arriere coude-montant-arriere'],
    ['Check, contre au middle', 'defense', 'check-avant direct crochet-avant middle-kick-arriere'],
    ['Clinch : tirage et genoux', 'combinaison', 'clinch-tirage genou-clinch genou-circulaire-clinch genou-clinch'],
    ['Teep, poings, coude', 'combinaison', 'teep-avant jab direct coude-horizontal-avant'],
    ['Middle des deux côtés', 'combinaison', 'jab middle-kick-avant direct middle-kick-arriere'],
    ['Esquive et coude', 'defense', 'esquive-droite crochet-avant coude-horizontal-arriere'],
    ['High kick après les poings', 'combinaison', 'jab direct crochet-avant high-kick-arriere'],
    ['Genou circulaire et coude', 'combinaison', 'genou-circulaire-avant coude-diagonal-arriere crochet-avant'],
    ['Pression muay-thaï', 'deplacement', 'pas-avant teep-avant pas-avant jab direct low-kick-arriere'],
    ['Cardio thaï', 'cardio', 'jab direct middle-kick-arriere jab direct genou-direct-arriere'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Switch kick', 'technique', 'switch-kick'],
    ['Jab puis switch kick', 'combinaison', 'jab switch-kick'],
  ],
  expert: [
    ['Combinaison complète 6', 'combinaison', 'jab direct crochet-avant coude-horizontal-arriere genou-direct-arriere low-kick-arriere'],
    ['Combinaison 8 armes', 'combinaison', 'teep-avant jab direct crochet-avant coude-horizontal-arriere genou-direct-arriere coude-montant-avant middle-kick-arriere'],
    ['Défense thaï complète', 'defense', 'check-avant blocage-haut esquive-droite direct coude-horizontal-avant genou-direct-arriere'],
    ['Clinch long (solo)', 'combinaison', 'clinch-tirage genou-clinch genou-circulaire-clinch genou-clinch coude-diagonal-arriere coude-montant-arriere'],
    ['Combinaison 10 mouvements', 'combinaison', 'jab direct crochet-avant direct low-kick-arriere teep-avant jab direct genou-direct-arriere coude-horizontal-avant'],
    ['Rythme thaï', 'combinaison', 'jab feinte-epaule direct middle-kick-arriere check-avant direct high-kick-arriere'],
    ['Avancer en frappant', 'deplacement', 'pas-avant jab direct pas-avant genou-direct-arriere coude-horizontal-avant pas-arriere teep-avant'],
    ['Round technique', 'round', 'teep-avant jab direct low-kick-arriere check-avant middle-kick-arriere genou-direct-arriere'],
    ['Round puissance', 'round', 'direct crochet-avant middle-kick-arriere direct genou-direct-arriere coude-horizontal-arriere high-kick-arriere'],
    ['Coudes et genoux', 'combinaison', 'coude-horizontal-avant coude-horizontal-arriere genou-direct-arriere genou-circulaire-avant coude-diagonal-arriere coude-montant-arriere'],
    ['Finition expert', 'combinaison', 'jab direct crochet-avant uppercut-arriere coude-horizontal-avant genou-direct-arriere high-kick-arriere'],
  ],
};

// ---------------------------------------------------------------------------------- BJJ (solo only)
// Every row is really done alone, on a mat. Passes, controls, sweeps and submissions need a partner:
// they are fiches (src/domain/partner.ts), never exercises.
const BJJ: Record<LevelId, Row[]> = {
  debutant: [
    ['Posture debout de grappling', 'technique', 'garde-bjj'],
    ['Descente au sol et relevé technique', 'technique', 'descente-sol releve-technique'],
    ['Pont (upa)', 'technique', 'descente-sol pont releve-technique'],
    ['Sortie de hanche (shrimp)', 'technique', 'descente-sol sortie-hanche releve-technique'],
    ['Changement de base', 'technique', 'descente-sol changement-base releve-technique'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Sit-out', 'technique', 'descente-sol sit-out releve-technique'],
    ['Chute arrière basse (ushiro-ukemi)', 'technique', 'ukemi-ushiro', { description: 'Chute arrière basse, sur un tapis épais : accroupi, assis, tu roules sur le dos arrondi et les bras frappent. Jamais depuis debout à la maison.' }],
    ['Relevé depuis les genoux', 'technique', 'releve-genoux'],
  ],
  intermediaire: [
    ['Pont puis sortie de hanche', 'combinaison', 'descente-sol pont sortie-hanche releve-technique'],
    ['Rétention de garde (solo)', 'technique', 'descente-sol retention-garde releve-technique'],
    ['Shrimp et changement de base', 'combinaison', 'descente-sol sortie-hanche changement-base releve-technique'],
    ['Deux shrimps et relevé', 'deplacement', 'descente-sol sortie-hanche sortie-hanche releve-technique'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Changement de niveau', 'technique', 'changement-niveau'],
    ['Entrée en double-leg (solo)', 'technique', 'entree-lutte'],
    ['Changement de base et sit-out', 'combinaison', 'descente-sol changement-base sit-out releve-technique'],
  ],
  avance: [
    ['Sorties enchaînées', 'combinaison', 'descente-sol pont sortie-hanche retention-garde releve-technique'],
    ['Mobilité complète', 'combinaison', 'descente-sol pont sortie-hanche changement-base releve-technique'],
    ['Garde et relevé', 'combinaison', 'descente-sol retention-garde sortie-hanche releve-technique'],
    ['Circuit de mobilité', 'cardio', 'descente-sol pont pont sortie-hanche sortie-hanche releve-technique'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Single-leg et double-leg', 'combinaison', 'changement-niveau single-leg entree-lutte'],
    ['Genoux, sol, sit-out', 'combinaison', 'releve-genoux descente-sol sit-out releve-technique'],
  ],
  expert: [
    ['Round de mobilité au sol', 'round', 'descente-sol pont sortie-hanche retention-garde changement-base releve-technique'],
    ['Round cardio au sol', 'cardio', 'descente-sol pont sortie-hanche sortie-hanche changement-base pont releve-technique'],
    ['Enchaînement long', 'combinaison', 'descente-sol retention-garde pont sortie-hanche retention-garde releve-technique'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Round lutte et sol', 'round', 'changement-niveau entree-lutte single-leg descente-sol sit-out sortie-hanche releve-technique'],
  ],
};

// ---------------------------------------------------------------------------------- judo (solo only)
// Postures, displacements, grips, kuzushi and uchikomi entries without a partner. No throw is
// proposed at home, and falls (ukemi) only in their low stage (from a squat or seated, on a thick mat,
// Judo Québec progression, jb-S11): falls from standing are learned on a tatami with a teacher.
const JUDO: Record<LevelId, Row[]> = {
  debutant: [
    ['Shizen-tai', 'technique', 'shizen-tai'],
    ['Tsugi-ashi avant et arrière', 'deplacement', 'tsugi-ashi-avant tsugi-ashi-arriere'],
    ['Tsugi-ashi latéral', 'deplacement', 'tsugi-ashi-lateral'],
    ['Tai-sabaki', 'technique', 'tai-sabaki'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Ayumi-ashi (pas marchés)', 'deplacement', 'ayumi-ashi'],
    ['Kumi-kata (prise de garde)', 'technique', 'kumikata'],
    ['Ushiro-ukemi, version basse', 'technique', 'ukemi-ushiro', { description: 'Chute arrière basse, sur un tapis épais : accroupi, assis, tu roules sur le dos arrondi et les bras frappent. Jamais depuis debout à la maison.' }],
  ],
  intermediaire: [
    ['Kuzushi (déséquilibre, solo)', 'technique', 'kuzushi'],
    ['Uchikomi de seoi-nage (solo)', 'technique', 'uchikomi-seoi'],
    ['Avancer puis déséquilibrer', 'combinaison', 'tsugi-ashi-avant kuzushi'],
    ['Déplacements et rotation', 'deplacement', 'tsugi-ashi-avant tsugi-ashi-arriere tai-sabaki'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Uchikomi d’o-goshi (solo)', 'technique', 'uchikomi-o-goshi'],
    ['Uchikomi d’o-soto-gari (solo)', 'technique', 'uchikomi-o-soto-gari'],
    ['Yoko-ukemi, version basse', 'technique', 'ukemi-yoko', { description: 'Chute sur le côté, version basse, sur un tapis épais : depuis l’assise, un côté puis l’autre. Jamais depuis debout à la maison.' }],
    ['Prise de garde puis entrée', 'combinaison', 'kumikata uchikomi-o-goshi'],
  ],
  avance: [
    ['Kuzushi puis entrée', 'combinaison', 'kuzushi uchikomi-seoi'],
    ['Reculer, déséquilibrer, entrer', 'combinaison', 'tsugi-ashi-arriere kuzushi uchikomi-seoi'],
    ['Série d’uchikomi', 'cardio', 'uchikomi-seoi uchikomi-seoi uchikomi-seoi'],
    ['Rotation et entrée', 'combinaison', 'tai-sabaki tsugi-ashi-avant uchikomi-seoi'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Uchikomi d’o-uchi-gari (solo)', 'technique', 'uchikomi-o-uchi-gari'],
    ['Uchikomi de ko-uchi-gari (solo)', 'technique', 'uchikomi-ko-uchi-gari'],
    ['Deux fauchages intérieurs', 'combinaison', 'uchikomi-ko-uchi-gari uchikomi-o-uchi-gari'],
    ['Marcher, saisir, entrer', 'combinaison', 'ayumi-ashi kumikata uchikomi-o-soto-gari'],
  ],
  expert: [
    ['Round d’uchikomi', 'round', 'tsugi-ashi-avant kuzushi uchikomi-seoi tsugi-ashi-arriere kuzushi uchikomi-seoi'],
    ['Déplacements et entrées', 'combinaison', 'tsugi-ashi-lateral tai-sabaki kuzushi uchikomi-seoi tsugi-ashi-arriere uchikomi-seoi'],
    ['Série longue d’uchikomi', 'cardio', 'uchikomi-seoi uchikomi-seoi uchikomi-seoi uchikomi-seoi uchikomi-seoi'],
    // added in v0.28.0 (enrichissement des disciplines); appended so the ids above do not change
    ['Round des quatre entrées', 'round', 'kumikata uchikomi-o-goshi uchikomi-o-soto-gari uchikomi-o-uchi-gari uchikomi-ko-uchi-gari'],
    ['Chutes basses enchaînées', 'technique', 'ukemi-ushiro ukemi-yoko ukemi-ushiro', { description: 'Chutes arrière et de côté en version basse, sur un tapis épais. Jamais depuis debout à la maison.' }],
  ],
};

const TABLE: Record<DisciplineId, Record<LevelId, Row[]>> = { boxe: BOXE, kickboxing: KICK, mma: MMA, muaythai: MUAY, bjj: BJJ, judo: JUDO };

export const EXERCISES: Exercise[] = (Object.keys(TABLE) as DisciplineId[]).flatMap((d) =>
  (Object.keys(TABLE[d]) as LevelId[]).flatMap((l) => build(d, l, TABLE[d][l])),
);

export const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function exercisesFor(d: DisciplineId, l: LevelId) {
  return EXERCISES.filter((e) => e.discipline === d && e.level === l);
}
