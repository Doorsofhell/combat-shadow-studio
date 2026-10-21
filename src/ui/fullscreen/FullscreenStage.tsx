import { ReactNode, useRef } from 'react';
import { useSettings } from '../../store/settings';
import { AppIcon } from '../icons';
import { useStageFullscreen } from './useStageFullscreen';

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
  if (seen) return null;
  return (
    <div className="fs-hint" role="note" data-testid="fs-hint" data-no-double-tap>
      <span>Astuce : touche deux fois le coach pour le plein écran</span>
      <button type="button" className="fs-hint-close" onClick={() => set({ stageFsHintSeen: true })} aria-label="Fermer l’astuce">
        <AppIcon id="close" size={16} />
      </button>
    </div>
  );
}

/**
 * A 3D coach view that a double tap shows on the whole screen (see useStageFullscreen): the home hero, the
 * technique sheet, the fighter studio preview. The training screen uses the hook directly, merged with its own
 * immersive mode.
 */
export function FullscreenStage({ className, children, testId, hint = true }: { className: string; children: ReactNode; testId?: string; hint?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const fs = useStageFullscreen(ref);
  return (
    <div ref={ref} className={`${className}${fs.active ? ' stage-fs' : ''}${fs.idle ? ' fs-idle' : ''}`} data-testid={testId} data-fullscreen={fs.active}>
      {children}
      {fs.active && <FsExit onExit={fs.exit} />}
      {hint && !fs.active && <FsHint />}
    </div>
  );
}
