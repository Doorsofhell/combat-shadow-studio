import { useActiveFighter } from '../../store/fighters';
import { useProfile } from '../../store/profile';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import type { CoachId, Program } from '../../domain/types';
import { EXERCISE_BY_ID } from '../../domain/exercises';

/** coach shown on the pictures: the active fighter's sex, else the profile's coach */
export function useThumbCoach(): CoachId {
  const sex = useActiveFighter()?.look.sex;
  const coach = useProfile((s) => s.profile.coach);
  return sex ?? coach ?? 'homme';
}

/** the move that best represents a sequence on a card: the first one that is not the guard or a step */
export function keyTechnique(ids: readonly string[]): string {
  return ids.find((id) => !['garde', 'deplacement'].includes(TECHNIQUE_BY_ID.get(id)?.category ?? 'garde')) ?? ids[0] ?? 'garde';
}

/**
 * Card picture of a technique: our own 3D coach rendered at the key moment of the move, from its
 * teaching angle, in the dark gym of its discipline (scripts/visuels). It names the move at a glance; the animation
 * itself is always played live in 3D.
 */
export function TechThumb({ id, size = 'md', children }: { id: string; size?: 'sm' | 'md' | 'lg'; children?: React.ReactNode }) {
  const coach = useThumbCoach();
  const known = TECHNIQUE_BY_ID.has(id) ? id : 'garde';
  return (
    <span className={`tech-thumb ${size}`} aria-hidden data-thumb={known}>
      <img src={`./thumbs/${coach}/${known}.webp`} alt="" loading="lazy" decoding="async" draggable={false} />
      {children}
    </span>
  );
}

const SHOW_RANK: Partial<Record<string, number>> = { pied: 6, sol: 5, lutte: 5, genou: 4, coude: 3, poing: 2, clinch: 2, defense: 1, feinte: 1 };

/** the most telling move of a set of sequences (a programme): a kick says more than a jab */
export function showcaseTechnique(seqs: readonly (readonly string[])[]): string {
  let best = 'garde';
  let rank = -1;
  for (const s of seqs)
    for (const id of s) {
      const r = SHOW_RANK[TECHNIQUE_BY_ID.get(id)?.category ?? ''] ?? 0;
      if (r > rank) (best = id), (rank = r);
    }
  return best;
}

/** picture of a programme: the most telling move of all its blocks */
export function programTechnique(p: Program): string {
  return showcaseTechnique(p.blocks.map((b) => EXERCISE_BY_ID.get(b.exercise)?.sequence ?? []));
}
