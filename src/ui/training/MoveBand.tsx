import { memo } from 'react';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { PointPhase, instructionOf } from '../../domain/instructions';
import { AppIcon } from '../icons';
import { MoveStore, useMove } from './moveStore';

/**
 * 0.35 (Youssef, coaching 3D): the one place where the name of a move is shown, right under the 3D stage. It shows the
 * move the coach is playing, as the animation player reports it (moveStore): the name appears when its motion starts
 * and goes when it ends; in guard, at rest or between two repetitions nothing stays. The band keeps its height, so the
 * stage never resizes. The point of the phase being played is its short subtitle; the full content of the technique
 * (description, every key point, safety) opens from the « i » button, the same sheet as « Comment faire ? ».
 */
export const MoveBand = memo(function MoveBand({
  store,
  active,
  studied,
  phase,
  total,
  idle,
  onInfo,
}: {
  store: MoveStore;
  /** the session is in work: outside it (ready, countdown, rest, end) no move is shown */
  active: boolean;
  /** Décomposer: the technique studied, shown for as long as it is studied */
  studied: string | null;
  /** the phase of the move being played, when the player knows it */
  phase: { techniqueId: string; phase: PointPhase } | null;
  /** length of the sequence, for « 2/3 » */
  total: number;
  /** discreet text of the empty band (rest, end), never a move name */
  idle: string;
  onInfo: (techniqueId: string) => void;
}) {
  const live = useMove(store);
  const move = studied ? { index: -1, techniqueId: studied } : active ? live : null;
  const t = move ? TECHNIQUE_BY_ID.get(move.techniqueId) : undefined;
  const point = t && !studied && phase?.techniqueId === t.id ? instructionOf(t)?.points.find((p) => p.phase === phase.phase)?.text : undefined;
  return (
    <section className={`tr-band ${t ? 'on' : ''}`} aria-label="Mouvement en cours" data-testid="move-band" data-move={t?.id ?? ''}>
      {t ? (
        // a new key for each new move (and each repetition): the short fade-in starts again, the old name is gone at once
        <div className="band-move" key={studied ? `s:${t.id}` : live!.serial}>
          <span className="band-name" data-testid="current-move">
            {t.name}
          </span>
          {point && (
            <span className="band-point" data-testid="move-point">
              {point}
            </span>
          )}
        </div>
      ) : (
        <div className="band-move idle">
          {/* the move's place stays in the page, empty: nothing is shown in guard */}
          <span className="band-name" data-testid="current-move" />
          {idle && (
            <span className="band-idle" data-testid="band-idle">
              {idle}
            </span>
          )}
        </div>
      )}
      {t && move!.index >= 0 && total > 1 && (
        <span className="band-step" aria-label={`Mouvement ${move!.index + 1} sur ${total}`}>
          {move!.index + 1}/{total}
        </span>
      )}
      {t && (
        <button className="btn icon sm band-info" onClick={() => onInfo(t.id)} aria-label={`Comment faire : ${t.name}`} data-testid="band-info">
          <AppIcon id="info" size={18} />
        </button>
      )}
    </section>
  );
});

/** the same move, name only, for the augmented reality overlay (shown instead of the screen, never with it) */
export function MoveName({ store, active, fallback }: { store: MoveStore; active: boolean; fallback: string }) {
  const live = useMove(store);
  const t = active && live ? TECHNIQUE_BY_ID.get(live.techniqueId) : undefined;
  return <b>{t?.name ?? fallback}</b>;
}
