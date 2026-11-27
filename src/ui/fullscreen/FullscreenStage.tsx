import { useEffect } from 'react';
import { useSettings } from '../../store/settings';
import { AppIcon } from '../icons';

/** the discreet way out, top right of the view in fullscreen (it fades with the other controls) */
export function FsExit({ onExit }: { onExit: () => void }) {
  return (
    <button type="button" className="fs-exit fs-ui" onClick={onExit} aria-label="Quitter le plein écran" data-testid="fs-exit">
      <AppIcon id="exitFullscreen" size={22} />
    </button>
  );
}

/** the one-time tip; it goes away for good when closed or once the double tap has been used */
export function FsHint() {
  const seen = useSettings((s) => s.settings.stageFsHintSeen);
  const set = useSettings((s) => s.set);
  // 2.10.8 (Youssef, 2026-11-27, « Parcours des écrans », conseil 6): shown ONCE, on the Accueil or in the session, never
  // both. It leaves by itself after 8 s, and leaving the screen after it was read (1.5 s) counts as seen too.
  useEffect(() => {
    if (seen) return;
    const t0 = Date.now();
    const timer = window.setTimeout(() => useSettings.getState().set({ stageFsHintSeen: true }), 8000);
    return () => {
      window.clearTimeout(timer);
      if (Date.now() - t0 >= 1500 && !useSettings.getState().settings.stageFsHintSeen) useSettings.getState().set({ stageFsHintSeen: true });
    };
  }, [seen]);
  if (seen) return null;
  return (
    <div className="fs-hint" role="note" data-testid="fs-hint" data-no-double-tap>
      <span>Astuce : touche le coach pour ses options, deux fois pour le plein écran</span>
      <button type="button" className="fs-hint-close" onClick={() => set({ stageFsHintSeen: true })} aria-label="Fermer l’astuce">
        <AppIcon id="close" size={16} />
      </button>
    </div>
  );
}

// 1.4.0: the views that a double tap shows on the whole screen are the coach screen of the app (CoachScreen.tsx)
