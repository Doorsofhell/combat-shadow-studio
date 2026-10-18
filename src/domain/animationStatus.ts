/**
 * State of each technique's animation, written by the animation registry (src/engine/registry.ts)
 * from automatic checks on the real coach skeleton. "Contrôlée" means the checks pass, not that an
 * expert has reviewed the movement.
 */
import data from './animationStatus.json';

export type AnimationStatus = 'validee' | 'controlee' | 'a-corriger' | 'manquante' | 'non-implementee';

export const STATUS_LABEL: Record<AnimationStatus, string> = {
  validee: 'Validée par un expert',
  controlee: 'Contrôlée automatiquement',
  'a-corriger': 'À corriger',
  manquante: 'Manquante',
  'non-implementee': 'Non implémentée',
};

export const STATUS_HELP: Record<AnimationStatus, string> = {
  validee: 'Mouvement revu par un entraîneur qualifié.',
  controlee: 'Contrôles automatiques réussis (appuis, articulations, continuité, accélération). Pas encore revue par un expert.',
  'a-corriger': 'Un contrôle automatique a relevé un défaut, en cours de correction.',
  manquante: 'Animation absente.',
  'non-implementee': 'Démonstration à deux personnages pas encore animée.',
};

const STATUS = data as Record<string, { status: AnimationStatus; notes: string[] }>;

export const animationStatusOf = (id: string) => STATUS[id];
