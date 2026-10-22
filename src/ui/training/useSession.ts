import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComboPlayer, PlayerEvents } from '../../engine/player';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { ActiveTimer } from '../../store/timer';
import { useStats } from '../../store/stats';
import { useSettings } from '../../store/settings';
import { say, stopVoice } from '../../audio/voice';
import { beep, bell, impact, restSignal, unlockAudio } from '../../audio/sound';
import { Plan, playerSteps } from './plan';
import { keepScreenOn, onAppPause } from '../../platform/native';
import { useResume } from '../../store/resume';
import { RESUME_VERSION, ResumePhase, ResumeSnapshot, workProgress } from '../../domain/resume';

export type Phase = 'pret' | 'decompte' | 'travail' | 'repos' | 'termine';

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

const COUNTDOWN = 3;
const BETWEEN_ITEMS = 15;

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
  const phaseT = useRef<ActiveTimer>(null as unknown as ActiveTimer);
  const sessionT = useRef<ActiveTimer>(null as unknown as ActiveTimer);
  const statsT = useRef(new ActiveTimer());
  if (!phaseT.current) {
    phaseT.current = new ActiveTimer();
    sessionT.current = new ActiveTimer();
    if (snap) {
      phaseT.current.seed(snap.phaseElapsed * 1000);
      sessionT.current.seed(snap.sessionSec * 1000);
    }
  }
  const st = useRef({
    phase: (snap?.phase ?? 'pret') as Phase,
    // a resumed session waits, paused, on the exact moment it was left: « Reprendre » goes on from there
    paused: !!snap && snap.phase !== 'pret',
    itemIndex: snap ? snap.itemIndex : Math.max(0, plan.start),
    round: snap?.round ?? 1,
    step: -1,
    reps: snap?.reps ?? 0,
    phaseLen: snap?.phaseLen ?? 0,
    speed: snap?.speed ?? plan.items[Math.max(0, plan.start)]?.speed ?? 0.7,
    banner: null as string | null,
    lastWhole: -1,
    tipIndex: 0,
    /** the session really started (or was resumed): only then is it offered again */
    started: !!snap,
  });
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => (t + 1) % 1e9), []);

  const item = plan.items[st.current.itemIndex];

  const flush = useCallback(() => {
    const s = st.current;
    const it = plan.items[s.itemIndex];
    if (!it) return;
    const sec = statsT.current.drain() / 1000;
    if (sec > 0.5) {
      record(
        { id: `${startIso}#${it.key}`, start: startIso, discipline: it.discipline, level: it.level, exerciseId: it.key, exerciseName: it.name, mode: plan.mode },
        sec,
        0,
      );
    }
  }, [plan, record, startIso]);

  // --------------------------------------------------------------------- resume snapshot
  const saveResume = useCallback(() => {
    const o = persistRef.current;
    const s = st.current;
    const it = plan.items[s.itemIndex];
    if (!o || !it || !s.started || s.phase === 'termine') return;
    const phase = s.phase as ResumePhase;
    const phaseElapsed = phaseT.current.elapsed / 1000;
    const prog = workProgress(plan, { itemIndex: s.itemIndex, round: s.round, phase, phaseElapsed });
    useResume.getState().save({
      v: RESUME_VERSION,
      query: o.query,
      title: plan.title,
      mode: plan.mode,
      programId: o.programId,
      discipline: it.discipline,
      level: it.level,
      itemIndex: s.itemIndex,
      itemKey: it.key,
      itemName: it.label ?? it.name,
      itemCount: plan.items.length,
      thumb: it.sequence.find((id) => id !== 'garde') ?? it.sequence[0] ?? 'garde',
      round: s.round,
      rounds: it.rounds,
      reps: s.reps,
      phase,
      phaseElapsed,
      phaseLen: s.phaseLen,
      sessionSec: sessionT.current.elapsed / 1000,
      plannedSec: prog.plannedSec,
      doneSec: prog.doneSec,
      speed: s.speed,
      coach: o.coach,
      camera: o.camera?.(),
      startIso,
      savedAt: new Date().toISOString(),
    });
  }, [plan, startIso]);

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
    const s = st.current;
    const it = plan.items[s.itemIndex];
    if (!p || !it) return;
    p.speed = s.speed;
    if (s.phase === 'travail') p.setSequence(playerSteps(it.sequence), it.rest);
    else p.setSequence([], 0);
    if (s.paused) p.pause();
    else p.play();
  }, [plan]);

  const onPlayer = useCallback(
    (p: ComboPlayer) => {
      player.current = p;
      applySequence();
    },
    [applySequence],
  );

  const events = useMemo<PlayerEvents>(
    () => ({
      onStep: (index, techId, _rep, timeToNext) => {
        const s = st.current;
        if (s.phase !== 'travail') return;
        s.step = index;
        const cfg = settingsRef.current;
        const t = TECHNIQUE_BY_ID.get(techId);
        if (t && cfg.voice && cfg.announceMoves) {
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
        if (s.phase !== 'travail') return;
        s.reps++;
        s.step = -1;
        const it = plan.items[s.itemIndex];
        if (it) {
          record(
            { id: `${startIso}#${it.key}`, start: startIso, discipline: it.discipline, level: it.level, exerciseId: it.key, exerciseName: it.name, mode: plan.mode },
            0,
            1,
          );
        }
        rerender();
      },
      onRest: () => {
        const s = st.current;
        const cfg = settingsRef.current;
        if (s.phase !== 'travail' || plan.mode !== 'technique' || !cfg.voice || !cfg.techniqueTips) return;
        const it = plan.items[s.itemIndex];
        const tips = it?.sequence.flatMap((id) => TECHNIQUE_BY_ID.get(id)?.keyPoints ?? []) ?? [];
        if (tips.length) say(tips[s.tipIndex++ % tips.length], { rate: 1.05 });
      },
    }),
    [plan, record, rerender, startIso],
  );

  // --------------------------------------------------------------------- phases
  const enter = useCallback(
    (phase: Phase, len: number, banner: string | null = null) => {
      const s = st.current;
      s.phase = phase;
      s.phaseLen = len;
      s.banner = banner;
      s.lastWhole = -1;
      s.step = -1;
      phaseT.current.reset();
      if (!s.paused) phaseT.current.start();
      if (phase !== 'pret') s.started = true;
      if (phase === 'travail') {
        if (!s.paused) {
          sessionT.current.start();
          statsT.current.start();
        }
      } else {
        sessionT.current.pause();
        statsT.current.pause();
        flush();
      }
      applySequence();
      // phase, round or exercise changed: an important moment to save
      if (phase === 'termine') endResume();
      else saveResume();
      rerender();
    },
    [applySequence, endResume, flush, rerender, saveResume],
  );

  const speak = (text: string, interrupt = true) => {
    const cfg = settingsRef.current;
    if (cfg.voice) say(text, { interrupt });
  };

  const startWork = useCallback(() => {
    const it = plan.items[st.current.itemIndex];
    bell(1);
    speak(st.current.round === 1 && it ? 'En garde' : `Round ${st.current.round}`);
    enter('travail', it?.work ?? 0);
  }, [enter, plan]);

  const tick = useCallback(() => {
    const s = st.current;
    if (s.paused) return;
    const it = plan.items[s.itemIndex];
    const el = phaseT.current.elapsed / 1000;
    const left = s.phaseLen - el;
    const whole = Math.ceil(left);
    const newWhole = whole !== s.lastWhole;
    s.lastWhole = whole;

    if (s.phase === 'decompte') {
      if (newWhole && whole > 0 && whole <= COUNTDOWN) {
        beep(false);
        speak(String(whole));
      }
      if (left <= 0) startWork();
    } else if (s.phase === 'travail' && it && it.work) {
      if (newWhole && whole === 10 && it.work > 20) speak('Dix secondes', false);
      if (left <= 0) {
        flush();
        if (s.round < it.rounds) {
          bell(3);
          speak(it.roundRest > 0 ? 'Fin du round. Repos' : 'Fin du round');
          s.round++;
          if (it.roundRest > 0) enter('repos', it.roundRest);
          else startWork();
        } else if (s.itemIndex < plan.items.length - 1) {
          bell(3);
          const nx = plan.items[s.itemIndex + 1];
          speak(`Exercice terminé. Prochain exercice : ${nx.label ?? nx.name}`);
          s.itemIndex++;
          s.round = 1;
          s.reps = 0;
          s.speed = nx.speed;
          player.current?.restart();
          enter('repos', Math.max(BETWEEN_ITEMS, it.roundRest ? Math.min(it.roundRest, 30) : 0), `Prochain : ${nx.label ?? nx.name}`);
        } else {
          bell(3);
          speak('Séance terminée. Bravo');
          enter('termine', 0);
        }
      }
    } else if (s.phase === 'repos') {
      if (newWhole && whole === Math.floor(s.phaseLen) && s.phaseLen >= 5) restSignal();
      if (newWhole && whole > 0 && whole <= 3) beep(false);
      if (left <= 0) startWork();
    }
    rerender();
  }, [enter, flush, plan, rerender, startWork]);

  useEffect(() => {
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [tick]);

  // save every 5 s of practice, and when leaving
  useEffect(() => {
    const id = window.setInterval(() => {
      if (statsT.current.elapsed > 5000) flush();
    }, 5000);
    return () => {
      window.clearInterval(id);
      flush();
      stopVoice();
    };
  }, [flush]);

  // a running session is saved now and then, and when the screen is left
  useEffect(() => {
    let last = sessionT.current.elapsed;
    const id = window.setInterval(() => {
      const e = sessionT.current.elapsed;
      if (e - last >= SAVE_EVERY_MS) {
        last = e;
        saveResume();
      }
    }, 1000);
    return () => {
      window.clearInterval(id);
      saveResume();
    };
  }, [saveResume]);

  // --------------------------------------------------------------------- actions
  const pause = useCallback(() => {
    const s = st.current;
    if (s.paused || s.phase === 'pret' || s.phase === 'termine') return;
    s.paused = true;
    phaseT.current.pause();
    sessionT.current.pause();
    statsT.current.pause();
    player.current?.pause();
    stopVoice();
    flush();
    saveResume();
    rerender();
  }, [flush, rerender, saveResume]);

  const resume = useCallback(() => {
    const s = st.current;
    if (!s.paused) return;
    unlockAudio();
    s.paused = false;
    phaseT.current.start();
    if (s.phase === 'travail') {
      sessionT.current.start();
      statsT.current.start();
    }
    player.current?.play();
    rerender();
  }, [rerender]);

  const start = useCallback(() => {
    unlockAudio();
    const s = st.current;
    s.paused = false;
    if (s.phase === 'termine') {
      s.itemIndex = Math.max(0, plan.start);
      s.round = 1;
      s.reps = 0;
    }
    speak('Prépare-toi');
    enter('decompte', COUNTDOWN + 0.6);
  }, [enter, plan]);

  /** same exercise from the beginning */
  const restart = useCallback(() => {
    const s = st.current;
    flush();
    s.round = 1;
    s.reps = 0;
    s.paused = false;
    player.current?.restart();
    stopVoice();
    unlockAudio();
    enter('decompte', COUNTDOWN + 0.6);
  }, [enter, flush]);

  /** change exercise: the counter stops, the new exercise waits for "Démarrer" */
  const goto = useCallback(
    (i: number) => {
      if (i < 0 || i >= plan.items.length) return;
      const s = st.current;
      flush();
      s.itemIndex = i;
      s.round = 1;
      s.reps = 0;
      s.paused = false;
      s.speed = plan.items[i].speed;
      player.current?.restart();
      stopVoice();
      enter('pret', 0);
    },
    [enter, flush, plan],
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
  const active = !s.paused && s.phase !== 'pret' && s.phase !== 'termine';
  useEffect(() => {
    void keepScreenOn(active);
  }, [active]);
  useEffect(() => () => void keepScreenOn(false), []);

  const timed = s.phase === 'decompte' || s.phase === 'repos' || (s.phase === 'travail' && !!item?.work);
  const view: SessionView = {
    phase: s.phase,
    paused: s.paused,
    itemIndex: s.itemIndex,
    round: s.round,
    step: s.step,
    reps: s.reps,
    remaining: timed ? Math.max(0, s.phaseLen - phaseT.current.elapsed / 1000) : null,
    sessionSec: sessionT.current.elapsed / 1000,
    exerciseSec: (item ? perExercise[item.key] ?? 0 : 0) + statsT.current.elapsed / 1000,
    speed: s.speed,
    banner: s.banner,
  };

  return { view, item, events, onPlayer, player, start, pause, resume, restart, goto, setSpeed };
}
