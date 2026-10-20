import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { screenFromPath } from '../../coach/appGuide';
import type { CoachAction } from '../../coach/engine';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { DISCIPLINES, LEVELS, type DisciplineId, type LevelId } from '../../domain/types';
import { useProfile } from '../../store/profile';
import { AppIcon } from '../icons';
import { CoachAskPanel } from './CoachAskPanel';
import { useCoachBubble } from './coachHost';

/**
 * Screens without the bubble: onboarding (the profile is not made yet, and its buttons sit at the
 * bottom of the screen), the full coach page (the coach is already open there) and the dev lab.
 */
const HIDDEN = ['/bienvenue', '/lab', '/coach-ia'];
/** screens whose bubble lives in the screen itself (registered as host), never fixed over its controls */
const HOSTED = ['/entrainement'];

const under = (pathname: string, p: string) => pathname === p || pathname.startsWith(`${p}/`);
const isDiscipline = (d: string | null | undefined): d is DisciplineId => !!d && DISCIPLINES.some((x) => x.id === d);

/**
 * The AI coach as one floating bubble at the bottom right of every screen (0.24, Youssef 2026-10-20;
 * 0.25 « identique sur tous les écrans », training included): a tap opens the question panel, another
 * tap (or Échap, or the panel's close button) hides it again.
 * The coach knows the screen it is opened from and what is on it when the route says so: the technique
 * of a sheet, the discipline, the open exercise, the programme or the legend combination. On the
 * training screen, the session registers as host (see coachHost.ts): the bubble sits in the lower right
 * corner of the coach's stage, opening it pauses the session, and demo / slow motion / repeat act on
 * the player.
 */
export function CoachBubble() {
  const loc = useLocation();
  const nav = useNavigate();
  const profile = useProfile((s) => s.profile);
  const open = useCoachBubble((s) => s.open);
  const setOpen = useCoachBubble((s) => s.setOpen);
  const host = useCoachBubble((s) => s.host);
  const hidden = HIDDEN.some((p) => under(loc.pathname, p));
  const hosted = HOSTED.some((p) => under(loc.pathname, p));

  // a new screen starts with the bubble closed
  useEffect(() => setOpen(false), [loc.pathname, setOpen]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (hidden || !profile.completed) return null;
  // the training screen shows it once the session is ready (its stage is the bubble's place)
  if (hosted && !host) return null;
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

  const context = inHost
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

  const onAction = (a: CoachAction) => {
    if (inHost) return inHost.onAction(a);
    setOpen(false);
    if (a.type === 'demo' || a.type === 'repeat' || a.type === 'slow') nav(`/techniques/${encodeURIComponent(a.techniqueId)}`);
    else if (a.type === 'start-exercise') nav(`/entrainement?ex=${encodeURIComponent(a.exerciseId)}&mode=technique`);
    else if (a.type === 'start-combo') nav(`/entrainement?cat=${encodeURIComponent(a.comboId)}&mode=technique`);
    else if (a.type === 'navigate') nav(a.to);
  };

  const panel = open && (
    <div className={inHost ? 'tr-ask' : 'coach-bubble-panel'} role="dialog" aria-label="Coach IA" data-testid="coach-bubble-panel">
      <CoachAskPanel context={context} onAction={onAction} onClose={() => setOpen(false)} />
    </div>
  );
  const bubble = (
    <button
      type="button"
      className={`coach-bubble ${open ? 'on' : ''} ${inHost ? 'in-host' : ''}`}
      aria-label={open ? 'Masquer le coach IA' : 'Ouvrir le coach IA'}
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      data-testid="coach-bubble"
    >
      <AppIcon id={open ? 'close' : 'coach'} size={22} />
    </button>
  );

  // in the training stage the open panel takes the lower part of the stage, where the bubble is: it
  // closes with the panel's own close button (or Échap), and the bubble comes back at the same place
  if (inHost) return createPortal(open ? panel : bubble, inHost.slot);
  return (
    <>
      {panel}
      {bubble}
    </>
  );
}
