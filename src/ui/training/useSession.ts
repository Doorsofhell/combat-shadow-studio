import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComboPlayer, PlayerEvents } from '../../engine';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { SessionTimeline, type Phase, type TimelineEvent } from '../../domain/session/timeline';
import { useStats, type SessionRecord } from '../../store/stats';
import { useSettings } from '../../store/settings';
import { say, stopVoice } from '../../audio/voice';
import { beep, bell, impact, restSignal, unlockAudio } from '../../audio/sound';
import { Plan, playerSteps } from './plan';
import { pulse } from './pulse';
import { keepScreenOn, onAppPause } from '../../platform/native';
import { useResume } from '../../store/resume';
import { createMoveStore } from './moveStore';
import { RESUME_VERSION, ResumePhase, ResumeSnapshot, workProgress } from '../../domain/resume';
import { BETWEEN_ITEMS as PROGRAM_BETWEEN_ITEMS, SESSION_COUNTDOWN } from '../../domain/programs';

export type { Phase };

export interface SessionView {
  phase: Phase;
  paused: boolean;
  itemIndex: number;
  round: number;
  /** index of the move being played in the sequence, -1 between repetitions */
  step: number;
  reps: number;
  /** seconds left in the current timed phase (null when free) */
  remaining: number | null;
  /** active training seconds of this session */
  sessionSec: number;
  /** cumulative active seconds on the current exercise, all sessions included */
  exerciseSec: number;
  speed: number;
  /** message shown during transitions (next exercise...) */
  banner: string | null;
  /** v0.47: progress of the current phase (0 → 1), for the HUD bar */
  phaseProgress: number;
  /** seconds of rest and of the whole session (preparation, work, rest; pauses excluded) */
  restSec: number;
  totalSec: number;
  /** timed periods (rounds, cycles) done and planned; planned is null when the session has no end */
  roundsDone: number;
  plannedRounds: number | null;
}

/**
 * 0.33: how the session is saved for the « Reprendre » card. `snapshot` is the session being resumed (already
 * checked against the plan). Without `persist` (tests, labs), nothing is saved.
 */
export interface SessionPersist {
  query: string;
  programId?: string;
  snapshot?: ResumeSnapshot | null;
  coach: 'homme' | 'femme';
  /** the camera mode on screen when saving */
  camera?: () => string | undefined;
}

/** a running session is also saved every 15 s of activity (never at every frame) */
const SAVE_EVERY_MS = 15_000;

/** the preparation: the chosen seconds, plus the time to say « Prépare-toi » before the first number */
const PREP_LEAD = 0.6;
const COUNTDOWN = SESSION_COUNTDOWN;
// the same values give programSessionSeconds the real length of a programme session
const BETWEEN_ITEMS = PROGRAM_BETWEEN_ITEMS;

/**
 * Drives a training session: countdown, work and rest phases, rounds, items of a program,
 * active time (only while working, not paused and visible), voice cues and sounds synced with the
 * animation player events, and saving statistics as the session goes.
 */
export function useSession(plan: Plan, persistOpts?: SessionPersist) {
  const settings = useSettings((s) => s.settings);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const record = useStats((s) => s.record);
  const perExercise = useStats((s) => s.perExercise);

  const player = useRef<ComboPlayer | null>(null);
  const persistRef = useRef(persistOpts);
  persistRef.current = persistOpts;
  const snap = persistOpts?.snapshot ?? null;
  // a resumed session keeps its start: the statistics go on adding to the same session (no double count)
  const startIso = useMemo(() => snap?.startIso ?? new Date().toISOString(), []); // eslint-disable-line react-hooks/exhaustive-deps
  // v0.47: the one clock of the session (preparation, work, rest, rounds, pause), see domain/session/timeline
  const tlRef = useRef<SessionTimeline>(null as unknown as SessionTimeline);
  if (!tlRef.current) {
    tlRef.current = new SessionTimeline(
      plan.items,
      { prep: Math.max(COUNTDOWN, settings.prepSec ?? COUNTDOWN) + PREP_LEAD, warnBefore: settings.roundWarnSec ?? 10, betweenItems: BETWEEN_ITEMS, chain: plan.mode === 'programme' },
      undefined,
      Math.max(0, plan.start),
    );
    if (snap) tlRef.current.seed({ phase: snap.phase, itemIndex: snap.itemIndex, round: snap.round, phaseElapsed: snap.phaseElapsed, phaseLen: snap.phaseLen, workSec: snap.sessionSec, restSec: snap.restSec });
  }
  const tl = tlRef.current;
  const st = useRef({
    step: -1,
    reps: snap?.reps ?? 0,
    speed: snap?.speed ?? plan.items[Math.max(0, plan.start)]?.speed ?? 0.7,
    banner: null as string | null,
    tipIndex: 0,
    /** the session really started (or was resumed): only then is it offered again */
    started: !!snap,
    /** work seconds already written to the statistics */
    flushedWork: snap?.sessionSec ?? 0,
    /** when the chronometer last spoke: the move calls give way to it */
    timerSaidAt: -Infinity,
  });
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => (t + 1) % 1e9), []);

  const item = plan.items[tl.itemIndex];

  const recordOf = useCallback(
    (index: number): Omit<SessionRecord, 'activeSec' | 'reps'> | null => {
      const it = plan.items[index];
      return it ? { id: `${startIso}#${it.key}`, start: startIso, discipline: it.discipline, level: it.level, exerciseId: it.key, exerciseName: it.name, mode: plan.mode } : null;
    },
    [plan, startIso],
  );

  /** writes the work done since the last time to the statistics of an item (the current one by default) */
  const flush = useCallback(
    (index = tl.itemIndex) => {
      const s = st.current;
      const sec = tl.workSec - s.flushedWork;
      const rec = recordOf(index);
      if (sec > 0.5 && rec) {
        record(rec, sec, 0);
        s.flushedWork = tl.workSec;
      }
    },
    [record, recordOf, tl],
  );

  // --------------------------------------------------------------------- resume snapshot
  const saveResume = useCallback(() => {
    const o = persistRef.current;
    const s = st.current;
    const it = plan.items[tl.itemIndex];
    if (!o || !it || !s.started || tl.phase === 'termine') return;
    const phase = tl.phase as ResumePhase;
    const phaseElapsed = tl.phaseElapsed;
    const prog = workProgress(plan, { itemIndex: tl.itemIndex, round: tl.round, phase, phaseElapsed });
    useResume.getState().save({
      v: RESUME_VERSION,
      query: o.query,
      title: plan.title,
      mode: plan.mode,
      programId: o.programId,
      discipline: it.discipline,
      level: it.level,
      itemIndex: tl.itemIndex,
      itemKey: it.key,
      itemName: it.label ?? it.name,
      itemCount: plan.items.length,
      thumb: it.sequence.find((id) => id !== 'garde') ?? it.sequence[0] ?? 'garde',
      round: tl.round,
      rounds: it.rounds,
      reps: s.reps,
      phase,
      phaseElapsed,
      phaseLen: tl.phaseLen,
      sessionSec: tl.workSec,
      restSec: tl.restSec,
      plannedSec: prog.plannedSec,
      doneSec: prog.doneSec,
      speed: s.speed,
      coach: o.coach,
      camera: o.camera?.(),
      startIso,
      savedAt: new Date().toISOString(),
    });
  }, [plan, startIso, tl]);

  /** the session is over: it is not offered again; a programme counts one more session */
  const endResume = useCallback(() => {
    const o = persistRef.current;
    if (!o) return;
    useResume.getState().drop(o.query);
    if (plan.mode === 'programme' && o.programId) useResume.getState().programDone(o.programId, new Date().toISOString());
  }, [plan]);

  // --------------------------------------------------------------------- player wiring
  const applySequence = useCallback(() => {
    const p = player.current;
    const it = plan.items[tl.itemIndex];
    if (!p || !it) return;
    p.speed = st.current.speed;
    // the coach plays only during work; in preparation, rest and at the end it stays in its guard (the player
    // brings it back from the move under way, never a jump to a new pose)
    if (tl.phase === 'travail') p.setSequence(playerSteps(it.sequence), it.rest);
    else p.setSequence([], 0);
    if (tl.paused) p.pause();
    else p.play();
  }, [plan, tl]);

  const onPlayer = useCallback(
    (p: ComboPlayer) => {
      player.current = p;
      applySequence();
    },
    [applySequence],
  );

  // 0.35: the move on screen, straight from the player (see moveStore)
  const move = useMemo(createMoveStore, []);
  const events = useMemo<PlayerEvents>(
    () => ({
      onMove: (m) => move.set(m),
      onStep: (index, techId, _rep, timeToNext) => {
        const s = st.current;
        if (tl.phase !== 'travail') return;
        s.step = index;
        const cfg = settingsRef.current;
        const t = TECHNIQUE_BY_ID.get(techId);
        // the chronometer's calls come first: a move is not called over « Round 2 » or « Dix secondes »
        // 1.4.0: the screen flashes with the move called (with the voice or without it)
        if (t) pulse('move');
        if (t && cfg.voice && cfg.announceMoves && performance.now() - s.timerSaidAt > 1500) {
          // faster speech when the next move follows quickly, so the call stays on the move
          const rate = timeToNext < 0.5 ? 1.45 : timeToNext < 0.9 ? 1.25 : 1.1;
          say(t.call, { interrupt: true, rate });
        }
        rerender();
      },
      onImpact: () => {
        if (settingsRef.current.impactSounds) impact();
      },
      onRep: () => {
        const s = st.current;
        if (tl.phase !== 'travail') return;
        s.reps++;
        s.step = -1;
        const rec = recordOf(tl.itemIndex);
        if (rec) record(rec, 0, 1);
        rerender();
      },
      onRest: () => {
        const s = st.current;
        const cfg = settingsRef.current;
        if (tl.phase !== 'travail' || plan.mode !== 'technique' || !cfg.voice || !cfg.techniqueTips) return;
        const it = plan.items[tl.itemIndex];
        const tips = it?.sequence.flatMap((id) => TECHNIQUE_BY_ID.get(id)?.keyPoints ?? []) ?? [];
        if (tips.length) say(tips[s.tipIndex++ % tips.length], { rate: 1.05 });
      },
    }),
    [plan, record, recordOf, rerender, move, tl],
  );

  // --------------------------------------------------------------------- phases
  const speak = useCallback((text: string, interrupt = true) => {
    const cfg = settingsRef.current;
    if (!cfg.voice) return;
    st.current.timerSaidAt = performance.now();
    say(text, { interrupt });
  }, []);

  /** the session's state changed: the coach, the saved session and the screen follow */
  const changed = useCallback(() => {
    const s = st.current;
    s.step = -1;
    if (tl.phase !== 'pret') s.started = true;
    applySequence();
    if (tl.phase === 'termine') endResume();
    else saveResume();
    rerender();
  }, [applySequence, endResume, rerender, saveResume, tl]);

  /**
   * The chronometer's events become sounds, voice and coach moves, each once (§12). Gongs mark the start and the
   * end of a timed period; the voice says the round, the rest and the time left.
   */
  const handle = useCallback(
    (events: TimelineEvent[]) => {
      if (!events.length) return;
      const cfg = settingsRef.current;
      const s = st.current;
      const cardio = plan.mode === 'cardio';
      let phaseChanged = false;
      for (const e of events) {
        switch (e.type) {
          case 'prep-start':
            speak('Prépare-toi');
            phaseChanged = true;
            break;
          case 'prep-count':
            if (e.n <= COUNTDOWN) {
              beep(false);
              pulse('count');
              speak(String(e.n));
            }
            break;
          case 'work-start': {
            // the start signal, once: the gong (or the bell of the former sessions when gongs are off)
            bell(1);
            pulse('gong');
            const it = plan.items[e.itemIndex];
            speak(e.round === 1 ? 'En garde' : cardio ? `Cycle ${e.round}` : `Round ${e.round}`);
            if (it && e.round === 1) s.banner = null;
            phaseChanged = true;
            break;
          }
          case 'warning':
            pulse('warning');
            if (cfg.voice) speak(e.secondsLeft >= 30 ? 'Trente secondes' : 'Dix secondes', false);
            else beep(true);
            break;
          case 'work-end': {
            flush(e.itemIndex);
            if (cfg.gongs) bell(3);
            pulse('gong');
            const it = plan.items[e.itemIndex];
            if (e.last) speak('Séance terminée. Bravo');
            else if (e.nextItem) {
              const nx = plan.items[e.itemIndex + 1];
              speak(`Exercice terminé. Prochain exercice : ${nx.label ?? nx.name}`);
              s.reps = 0;
              s.speed = nx.speed;
              player.current?.restart();
            } else if (cardio) speak('Récupération');
            else speak(it && it.roundRest > 0 ? 'Fin du round. Repos' : 'Fin du round');
            phaseChanged = true;
            break;
          }
          case 'rest-start':
            // without gongs, the rest still has its own signal (never both at once)
            if (!cfg.gongs && e.len >= 5) restSignal();
            if (e.reason === 'item' && e.nextItem !== null) {
              const nx = plan.items[e.nextItem];
              s.banner = `Prochain : ${nx.label ?? nx.name}`;
            }
            phaseChanged = true;
            break;
          case 'rest-count':
            beep(false);
            pulse('count');
            break;
          case 'done':
            phaseChanged = true;
            break;
        }
      }
      if (phaseChanged) changed();
    },
    [changed, flush, plan, speak],
  );

  const tick = useCallback(() => {
    if (tl.paused) return;
    handle(tl.tick());
    if (tl.phase !== 'pret' && tl.phase !== 'termine') rerender();
  }, [handle, rerender, tl]);

  useEffect(() => {
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [tick]);

  // save every 5 s of practice, and when leaving
  useEffect(() => {
    const id = window.setInterval(() => {
      if (tl.workSec - st.current.flushedWork > 5) flush();
    }, 5000);
    return () => {
      window.clearInterval(id);
      flush();
      stopVoice();
    };
  }, [flush, tl]);

  // a running session is saved now and then, and when the screen is left
  useEffect(() => {
    let last = tl.workSec * 1000;
    const id = window.setInterval(() => {
      const e = tl.workSec * 1000;
      if (e - last >= SAVE_EVERY_MS) {
        last = e;
        saveResume();
      }
    }, 1000);
    return () => {
      window.clearInterval(id);
      saveResume();
    };
  }, [saveResume, tl]);

  // --------------------------------------------------------------------- actions
  /** Pause freezes the time, the coach, the transitions and every sound to come (they come from tick only) */
  const pause = useCallback(() => {
    if (!tl.pause()) return;
    player.current?.pause();
    stopVoice();
    flush();
    saveResume();
    rerender();
  }, [flush, rerender, saveResume, tl]);

  const resume = useCallback(() => {
    if (!tl.resume()) return;
    unlockAudio();
    player.current?.play();
    rerender();
  }, [rerender, tl]);

  const start = useCallback(() => {
    unlockAudio();
    const s = st.current;
    if (tl.phase === 'termine') {
      // the same session again, from its first item
      tl.goto(Math.max(0, plan.start));
      s.reps = 0;
      s.speed = plan.items[tl.itemIndex]?.speed ?? s.speed;
    }
    handle(tl.start());
  }, [handle, plan, tl]);

  /** same exercise from the beginning */
  const restart = useCallback(() => {
    flush();
    st.current.reps = 0;
    player.current?.restart();
    stopVoice();
    unlockAudio();
    handle(tl.restart());
  }, [flush, handle, tl]);

  /** change exercise: the counter stops, the new exercise waits for "Démarrer" */
  const goto = useCallback(
    (i: number) => {
      if (i < 0 || i >= plan.items.length) return;
      const s = st.current;
      flush();
      if (!tl.goto(i)) return;
      s.reps = 0;
      s.speed = plan.items[i].speed;
      s.banner = null;
      player.current?.restart();
      stopVoice();
      changed();
    },
    [changed, flush, plan, tl],
  );

  const setSpeed = useCallback(
    (v: number) => {
      st.current.speed = v;
      if (player.current) player.current.speed = v;
      rerender();
    },
    [rerender],
  );

  // pause when the app goes to the background
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', pause);
    const offNative = onAppPause(pause);
    return () => {
      offNative();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', pause);
    };
  }, [pause]);

  const s = st.current;
  // keep the screen on while a session is running, let it sleep when paused or finished
  const active = !tl.paused && tl.phase !== 'pret' && tl.phase !== 'termine';
  useEffect(() => {
    void keepScreenOn(active);
  }, [active]);
  useEffect(() => () => void keepScreenOn(false), []);

  // v0.47 history (§14): a session left before its end is marked « interrompue », once, on the last exercise played;
  // a free session (Libre, Technique: no end) ends when it is left
  useEffect(
    () => () => {
      const ss = st.current;
      if (!ss.started || tl.phase === 'termine') return;
      flush();
      const rec = recordOf(tl.itemIndex);
      if (rec) useStats.getState().annotate(rec.id, summaryOf(tl, plan, tl.plannedRounds === null ? 'terminee' : 'interrompue'));
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // a session that reached its end: « terminée », with its summary
  const finished = tl.phase === 'termine';
  useEffect(() => {
    if (!finished) return;
    const rec = recordOf(tl.itemIndex);
    if (rec) useStats.getState().annotate(rec.id, summaryOf(tl, plan, 'terminee'));
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const view: SessionView = {
    phase: tl.phase,
    paused: tl.paused,
    itemIndex: tl.itemIndex,
    round: tl.round,
    step: s.step,
    reps: s.reps,
    remaining: tl.remaining,
    sessionSec: tl.workSec,
    exerciseSec: (item ? perExercise[item.key] ?? 0 : 0) + Math.max(0, tl.workSec - s.flushedWork),
    speed: s.speed,
    banner: s.banner,
    phaseProgress: tl.phaseProgress,
    restSec: tl.restSec,
    totalSec: tl.totalSec,
    roundsDone: tl.roundsDone,
    plannedRounds: tl.plannedRounds,
  };

  return { view, item, events, onPlayer, player, move, start, pause, resume, restart, goto, setSpeed };
}

/** what the history keeps of a whole session (§14), written on one record so nothing is counted twice */
function summaryOf(tl: SessionTimeline, plan: Plan, status: 'terminee' | 'interrompue') {
  const it = plan.items[tl.itemIndex];
  return {
    status,
    workSec: Math.round(tl.workSec),
    restSec: Math.round(tl.restSec),
    totalSec: Math.round(tl.totalSec),
    plannedRounds: tl.plannedRounds,
    doneRounds: tl.roundsDone,
    intensity: plan.mode === 'cardio' ? plan.intensity : undefined,
    work: it?.work ?? null,
  };
}
