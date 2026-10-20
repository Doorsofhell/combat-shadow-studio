import { useEffect, useState } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { screenFromPath } from '../../coach/appGuide';
import type { CoachAction } from '../../coach/engine';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { DISCIPLINES, LEVELS, type DisciplineId, type LevelId } from '../../domain/types';
import { useProfile } from '../../store/profile';
import { AppIcon } from '../icons';
import { CoachAskPanel } from './CoachAskPanel';

/** screens with their own coach button (training), or where a bubble has no place */
const HIDDEN = ['/entrainement', '/bienvenue', '/lab', '/coach-ia', '/coach', '/connexion'];

const isDiscipline = (d: string | null | undefined): d is DisciplineId => !!d && DISCIPLINES.some((x) => x.id === d);

/**
 * 0.24: the AI coach as a small bubble at the bottom right of every screen (Youssef, 2026-10-20): a tap
 * opens the question panel, another tap (or Échap, or the panel's close button) hides it again.
 * The coach knows the screen it is opened from (Youssef, 2026-10-20: « répondre en fonction de la
 * situation où il est appelé, quel que soit l'écran ») and what is on it when the route says so: the
 * technique of a sheet, the discipline, the open exercise, the programme or the legend combination.
 */
export function CoachBubble() {
  const loc = useLocation();
  const nav = useNavigate();
  const profile = useProfile((s) => s.profile);
  const [open, setOpen] = useState(false);
  const hidden = HIDDEN.some((p) => loc.pathname === p || loc.pathname.startsWith(`${p}/`) || loc.pathname.startsWith(`${p}?`));

  // a new screen starts with the bubble closed
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (hidden || !profile.completed) return null;
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

  const onAction = (a: CoachAction) => {
    setOpen(false);
    if (a.type === 'demo' || a.type === 'repeat' || a.type === 'slow') nav(`/techniques/${encodeURIComponent(a.techniqueId)}`);
    else if (a.type === 'start-exercise') nav(`/entrainement?ex=${encodeURIComponent(a.exerciseId)}&mode=technique`);
    else if (a.type === 'start-combo') nav(`/entrainement?cat=${encodeURIComponent(a.comboId)}&mode=technique`);
    else if (a.type === 'navigate') nav(a.to);
  };

  return (
    <>
      {open && (
        <div className="coach-bubble-panel" role="dialog" aria-label="Coach IA" data-testid="coach-bubble-panel">
          <CoachAskPanel
            context={{
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
            }}
            onAction={onAction}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
      <button
        type="button"
        className={`coach-bubble ${open ? 'on' : ''}`}
        aria-label={open ? 'Masquer le coach IA' : 'Ouvrir le coach IA'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        data-testid="coach-bubble"
      >
        <AppIcon id={open ? 'close' : 'coach'} size={22} />
      </button>
    </>
  );
}
