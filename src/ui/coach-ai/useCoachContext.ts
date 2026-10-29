import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { screenFromPath } from '../../coach/appGuide';
import type { CoachAction } from '../../coach/engine';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { DISCIPLINES, LEVELS, type DisciplineId, type LevelId } from '../../domain/types';
import { useProfile } from '../../store/profile';
import type { CoachAskPanelProps } from './CoachAskPanel';
import { useCoachBubble } from './coachHost';

const isDiscipline = (d: string | null | undefined): d is DisciplineId => !!d && DISCIPLINES.some((x) => x.id === d);

/**
 * What the Coach IA knows of the screen it is asked from, and how its actions run there: the technique of a sheet,
 * the discipline, the open exercise, the programme or the legend combination when the route says so; in the training
 * session (registered as host, see coachHost.ts) the session's own context and player. 1.7.0: shared by the Coach IA
 * panel (CoachBubble) and the answer shown at the top of the search (SearchSheet).
 */
export function useCoachContext(hosted: boolean): { context: CoachAskPanelProps['context']; act: (a: CoachAction) => void; inHost: boolean } {
  const loc = useLocation();
  const nav = useNavigate();
  const profile = useProfile((s) => s.profile);
  const host = useCoachBubble((s) => s.host);
  const inHost = hosted ? host : null;

  const q = new URLSearchParams(loc.search);
  const screen = screenFromPath(loc.pathname, loc.search);
  const techParam = matchPath('/techniques/:id', loc.pathname)?.params.id;
  const tech = techParam && TECHNIQUE_BY_ID.has(techParam) ? techParam : undefined;
  const exParam = q.get('ex');
  const exerciseId = exParam && EXERCISE_BY_ID.has(exParam) ? exParam : undefined;
  const programId = matchPath('/programmes/:id', loc.pathname)?.params.id;
  const comboParam = matchPath('/champions/:id', loc.pathname)?.params.id;
  const comboId = comboParam && comboParam !== 'c' ? comboParam : undefined;
  // the discipline on screen (discipline page, ?d= of the library, open exercise), else the main one
  const routeDisc = matchPath('/discipline/:id', loc.pathname)?.params.id ?? q.get('d') ?? (exerciseId ? EXERCISE_BY_ID.get(exerciseId)!.discipline : undefined);
  const discipline = isDiscipline(routeDisc) ? routeDisc : profile.mainDiscipline;
  const niveau = q.get('niveau');
  const level = LEVELS.some((l) => l.id === niveau) ? (niveau as LevelId) : profile.levels[discipline];

  const context: CoachAskPanelProps['context'] = inHost
    ? inHost.context
    : {
        pseudo: profile.coachAi.usePseudo ? profile.pseudo : undefined,
        discipline,
        level,
        guard: profile.guard,
        techniqueId: tech,
        exerciseId,
        programId,
        comboId,
        screen,
        goals: profile.goals,
      };

  const act = (a: CoachAction) => {
    if (inHost) return inHost.onAction(a);
    if (a.type === 'demo' || a.type === 'repeat' || a.type === 'slow') nav(`/techniques/${encodeURIComponent(a.techniqueId)}`);
    else if (a.type === 'start-exercise') nav(`/entrainement?ex=${encodeURIComponent(a.exerciseId)}&mode=technique`);
    else if (a.type === 'start-combo') nav(`/entrainement?cat=${encodeURIComponent(a.comboId)}&mode=technique`);
    else if (a.type === 'navigate') nav(a.to);
  };

  return { context, act, inHost: !!inHost };
}
