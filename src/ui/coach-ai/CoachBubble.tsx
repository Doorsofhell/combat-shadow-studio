import { useEffect, useState } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import type { CoachAction } from '../../coach/engine';
import { useProfile } from '../../store/profile';
import { AppIcon } from '../icons';
import { CoachAskPanel } from './CoachAskPanel';

/** screens with their own coach button (training), or where a bubble has no place */
const HIDDEN = ['/entrainement', '/bienvenue', '/lab', '/coach-ia', '/coach', '/connexion'];

/**
 * 0.24: the AI coach as a small bubble at the bottom right of every screen (Youssef, 2026-10-20): a tap
 * opens the question panel, another tap (or Échap, or the panel's close button) hides it again. On a
 * technique sheet the coach knows which technique is on screen.
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
  const tech = matchPath('/techniques/:id', loc.pathname)?.params.id;
  const discipline = profile.mainDiscipline;

  const onAction = (a: CoachAction) => {
    setOpen(false);
    if (a.type === 'demo' || a.type === 'repeat' || a.type === 'slow') nav(`/techniques/${encodeURIComponent(a.techniqueId)}`);
    else if (a.type === 'start-exercise') nav(`/entrainement?ex=${encodeURIComponent(a.exerciseId)}&mode=technique`);
    else if (a.type === 'start-combo') nav(`/entrainement?cat=${encodeURIComponent(a.comboId)}&mode=technique`);
  };

  return (
    <>
      {open && (
        <div className="coach-bubble-panel" role="dialog" aria-label="Coach IA" data-testid="coach-bubble-panel">
          <CoachAskPanel
            context={{
              pseudo: profile.coachAi.usePseudo ? profile.pseudo : undefined,
              discipline,
              level: profile.levels[discipline],
              guard: profile.guard,
              techniqueId: tech,
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
