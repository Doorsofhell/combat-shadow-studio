import { useFighters } from '../../store/fighters';
import type { CoachId } from '../../domain/types';
import { defaultLook } from '../../editor/look';

/**
 * Coach (fighter) choice from the onboarding or the coach page, without duplicates:
 * - no fighter yet: create one of that sex;
 * - the active fighter already has that sex: nothing to do;
 * - `replace` (onboarding): the active fighter is turned into the other sex;
 * - otherwise an existing fighter of that sex becomes active, or a new one is created.
 * The profile's coach is kept in line by the fighters store.
 */
export function chooseCoach(sex: CoachId, replace = false): string {
  const st = useFighters.getState();
  const active = st.fighters.find((f) => f.id === st.activeId) ?? null;
  if (active && active.look.sex === sex) return active.id;
  if (active && replace) {
    st.update(active.id, defaultLook(sex));
    st.rename(active.id, sex === 'homme' ? 'Mon combattant' : 'Ma combattante');
    return active.id;
  }
  const other = st.fighters.find((f) => f.look.sex === sex);
  if (other) {
    st.setActive(other.id);
    return other.id;
  }
  return st.create(sex);
}

export const defaultFighterName = (coach: CoachId | null) => (coach === 'femme' ? 'Coach femme' : 'Coach homme');
