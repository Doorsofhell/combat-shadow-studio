import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { setRestrictionsSimulated, setRightsSource, type PremiumStatus } from './rights';
import { PROGRAMS, PROGRAM_BY_ID } from '../domain/programs';
import { addPreviewFreeProgram } from './premiumItems';
import type { Program } from '../domain/types';

/**
 * 2.9.0 (Youssef, 2026-11-25, « Identification visuelle Freemium / Premium », §9-10): the PREVIEW-ONLY simulation of
 * the user's status, to see the badges and padlocks as a free user, a Premium user and a user whose purchase was
 * refunded (« abonnement expiré »: Premium à vie has no expiry, a refund withdraws it).
 *
 * Bundled ONLY when the build sets VITE_PREMIUM_SIMULATION=1 (main.tsx): the production build (GitHub Pages, Android)
 * contains neither this file nor any way to reach it, so nothing stored on a phone can grant Premium.
 */
export type SimMode = 'reel' | 'gratuit' | 'premium' | 'expire';
const KEY = 'css-sim-rights';
const LABEL: Record<SimMode, string> = { reel: 'Réel', gratuit: 'Gratuit', premium: 'Premium', expire: 'Expiré' };

export function applySimulation(mode: SimMode) {
  const status: PremiumStatus = mode === 'premium' ? 'premium_lifetime' : 'free';
  setRightsSource({ id: `simulation-${mode}`, status: () => status });
  setRestrictionsSimulated(mode !== 'reel');
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* private window: the choice lasts until the page is closed */
  }
}

function readMode(): SimMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'reel' || v === 'premium' || v === 'expire' || v === 'gratuit' ? v : 'gratuit';
  } catch {
    return 'gratuit';
  }
}

function Switch() {
  const [mode, setMode] = useState<SimMode>(readMode);
  const [open, setOpen] = useState(false);
  const pick = (m: SimMode) => (applySimulation(m), setMode(m), setOpen(false));
  return (
    <div className="sim-rights" data-testid="sim-rights" data-mode={mode}>
      {open && (
        <div className="sim-rights-menu" role="menu">
          {(Object.keys(LABEL) as SimMode[]).map((m) => (
            <button key={m} type="button" role="menuitemradio" aria-checked={m === mode} onClick={() => pick(m)} data-testid={`sim-${m}`}>
              {LABEL[m]}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="sim-rights-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Simulation du statut : ${LABEL[mode]}`}>
        Aperçu · {LABEL[mode]}
      </button>
    </div>
  );
}

/**
 * the example of a mixed programme asked by Youssef (« 3/6 PRO »): no programme of the catalogue is mixed with his
 * rules, so the preview adds one, named as an example, made of three free weeks (boxe, débutant) and three PRO weeks
 * (boxe, avancé). It exists only in the preview build.
 */
function addMixedExample() {
  const free = PROGRAM_BY_ID.get('boxe-defense-deplacements-debutant');
  const pro = PROGRAM_BY_ID.get('boxe-angles-avance');
  if (!free?.sessions || !pro?.sessions || PROGRAM_BY_ID.has('apercu-programme-mixte')) return;
  const sessions = [...free.sessions.slice(0, 3), ...pro.sessions.slice(0, 3)].map((x, i) => ({ ...x, week: i + 1 }));
  const p: Program = {
    ...free,
    id: 'apercu-programme-mixte',
    name: 'Exemple de programme mixte (aperçu)',
    description: 'Exemple de l’aperçu seulement : trois semaines gratuites puis trois semaines Shadow Pro.',
    weeks: 6,
    sessions,
    blocks: sessions[0].blocks,
  };
  PROGRAMS.push(p);
  PROGRAM_BY_ID.set(p.id, p);
  addPreviewFreeProgram(p.id);
}

export function installSimulation() {
  addMixedExample();
  applySimulation(readMode());
  (window as unknown as { __cssSimRights?: (m: SimMode) => void }).__cssSimRights = applySimulation;
  const host = document.createElement('div');
  document.body.appendChild(host);
  const style = document.createElement('style');
  style.textContent = `.sim-rights{position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 4px);display:flex;flex-direction:column-reverse;align-items:center;z-index:99999;font:600 11px/1.2 Inter,system-ui,sans-serif}
.sim-rights-btn{border:1px dashed #d4af37;background:rgba(11,15,20,.82);color:#f5d88b;border-radius:999px;padding:4px 9px}
.sim-rights-menu{display:grid;gap:2px;margin-top:4px;background:rgba(11,15,20,.92);border:1px solid #99702e;border-radius:10px;padding:4px}
.sim-rights-menu button{border:0;background:none;color:#f4f4f5;text-align:left;padding:6px 10px;border-radius:6px}
.sim-rights-menu button[aria-checked=true]{background:rgba(212,175,55,.18);color:#f5d88b}
.sim-capture .sim-rights{display:none}`;
  document.head.appendChild(style);
  createRoot(host).render(<Switch />);
}
