import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CoachContext } from '../../coach/engine';
import { suggestedQuestions, type SuggestOptions } from '../../coach/suggest';
import { useCoachAi } from '../../store/coachAi';
import { useGoals } from '../../store/goals';
import { useSettings } from '../../store/settings';
import { useStats } from '../../store/stats';

/** opens of the panel since the app started: with the day, the seed of each display */
let opens = 0;

const DAY = 86_400_000;
/** a list of questions counts as seen once it stayed this long on screen */
const SEEN_AFTER_MS = 1500;
const dayIndex = (d: Date) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / DAY);

/**
 * 0.27 (Youssef, 2026-10-20 22:00 : « Les questions pré-programmées IA doivent être diverses et
 * variées ») : what the suggested questions of the coach panel depend on beyond the screen — the
 * questions shown recently (kept per user in the coach store), a seed per day and per opening, the
 * kick-boxing style, the techniques marked « à revoir », the last session and the time of day — and
 * the memory of what this panel shows.
 *
 * `pick` replaces suggestedQuestions in the panel; `key` changes when the saved data is read back.
 */
export function useSuggestionMemory() {
  // the questions seen before this opening: read once (when the saved settings are loaded), so that
  // noting what is shown now does not reshuffle the panel under the finger
  const [seen, setSeen] = useState<readonly string[] | null>(() => (useCoachAi.persist?.hasHydrated() ?? true ? useCoachAi.getState().recentSuggestions : null));
  useEffect(() => {
    if (seen) return;
    const p = useCoachAi.persist;
    const stop = p.onFinishHydration(() => setSeen(useCoachAi.getState().recentSuggestions));
    if (p.hasHydrated()) setSeen(useCoachAi.getState().recentSuggestions);
    return stop;
  }, [seen]);
  const [seed] = useState(() => dayIndex(new Date()) * 7919 + ++opens);
  const kbStyle = useSettings((s) => s.settings.kickboxingStyle);
  const mastery = useGoals((s) => s.mastery);
  const sessions = useStats((s) => s.sessions);

  const opts = useMemo<SuggestOptions>(() => {
    const now = new Date();
    const last = sessions.reduce<string | undefined>((m, s) => (!m || s.start > m ? s.start : m), undefined);
    return {
      seen: seen ?? [],
      seed,
      kbStyle,
      toReview: Object.keys(mastery).filter((id) => mastery[id] === 'a-revoir'),
      lastSessionDaysAgo: last ? Math.max(0, dayIndex(now) - dayIndex(new Date(last))) : undefined,
      hour: now.getHours(),
    };
  }, [seen, seed, kbStyle, mastery, sessions]);

  // shown in this opening: a new technique on screen moves on to other questions too, while the same
  // one, recomputed when saved data is read back, keeps what is already on screen. Only a list that
  // stayed on screen a moment counts as seen (not one drawn while the screen changes or the panel closes).
  const stable = useRef<string[]>([]);
  const before = useRef<{ key: string; shown: string[] }>({ key: '', shown: [] });
  const timer = useRef<number | undefined>(undefined);
  const ready = !!seen;
  const pick = useCallback(
    (ctx: Omit<CoachContext, 'lastTechniqueId' | 'seed'>, max: number) => {
      const key = `${ctx.screen}|${ctx.techniqueId}|${ctx.discipline}`;
      if (key !== before.current.key) before.current = { key, shown: stable.current };
      const qs = suggestedQuestions(ctx, max, { ...opts, seen: [...before.current.shown, ...(opts.seen ?? [])] });
      // remembered for the next openings once the list has stayed on screen (a newer list cancels it)
      window.clearTimeout(timer.current);
      if (ready && qs.length)
        timer.current = window.setTimeout(() => {
          stable.current = [...qs, ...stable.current.filter((q) => !qs.includes(q))];
          useCoachAi.getState().noteSuggestions(stable.current.slice(0, 16));
        }, SEEN_AFTER_MS);
      return qs;
    },
    [opts, ready],
  );
  // closing the panel (or leaving the screen) before that: nothing is counted
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { pick, key: opts };
}
