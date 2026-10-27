import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { PageHead, Sheet } from '../components';
import { useSettings } from '../../store/settings';
import { useProfile } from '../../store/profile';
import { useStats } from '../../store/stats';
import { useNavActions } from '../nav/store';
import { SessionTimeline, type TimelineEvent } from '../../domain/session/timeline';
import {
  CHRONO_FORMATS,
  CHRONO_FORMAT_BY_ID,
  CHRONO_LIMITS,
  type ChronoSetup,
  chronoMode,
  chronoTotal,
  clock,
  editSetup,
  mmss,
  stepRounds,
  stepSeconds,
} from '../../domain/chrono';
import { beep, bell, restSignal, unlockAudio } from '../../audio/sound';
import { say, stopVoice } from '../../audio/voice';
import { keepScreenOn, onAppPause } from '../../platform/native';
import { ChronoOptions } from '../training/TimerOptions';
import './chrono.css';

/**
 * v0.48 « Chrono de combat » (Youssef, 2026-10-23: « un chronomètre paramétrable » reached from the bottom bar in place
 * of Techniques; 2026-10-27: maquette B « Plein écran » chosen). A timer on its own, without the coach:
 * - setup: three tiles (round, rest, rounds) with + and −, ready formats per discipline, the shared chronometer
 *   options of v0.47 (preparation, warning, gongs, voice);
 * - session: the whole screen takes the colour of the phase (amber preparation, red combat, teal rest, neutral pause)
 *   with giant figures readable from a distance; a tap anywhere pauses, even with gloves on;
 * - the time comes from the session engine of v0.47 (src/domain/session/timeline.ts), not from a second timer;
 * - the session goes into the existing history (Progrès), finished or interrupted, counted once.
 */

type View = 'setup' | 'run' | 'end';

interface Run {
  tl: SessionTimeline;
  setup: ChronoSetup;
  startIso: string;
  saved: boolean;
  status: 'terminee' | 'interrompue';
}

export function ChronoScreen() {
  const settings = useSettings((s) => s.settings);
  const set = useSettings((s) => s.set);
  const profile = useProfile((s) => s.profile);
  const record = useStats((s) => s.record);
  const annotate = useStats((s) => s.annotate);
  const setup = settings.chrono;
  const prep = Math.max(3, settings.prepSec ?? 3);
  const warnBefore = settings.roundWarnSec ?? 10;

  const [run, setRun] = useState<Run | null>(null);
  const runRef = useRef<Run | null>(null);
  runRef.current = run;
  const cfg = useRef(settings);
  cfg.current = settings;
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [options, setOptions] = useState(false);

  const tl = run?.tl ?? null;
  const view: View = !tl ? 'setup' : tl.phase === 'termine' ? 'end' : 'run';
  const format = CHRONO_FORMAT_BY_ID.get((run?.setup ?? setup).format);
  const intervals = !!format?.intervals;

  const speak = useCallback((text: string, interrupt = true) => {
    if (cfg.current.voice) say(text, { interrupt });
  }, []);

  /** the session into the history, once: the time of combat as active time, the rest and the rounds as its summary */
  const save = useCallback(
    (r: Run, status: 'terminee' | 'interrompue') => {
      if (r.saved) return;
      r.saved = true;
      r.status = status;
      const t = r.tl;
      if (t.workSec < 1) return;
      const f = CHRONO_FORMAT_BY_ID.get(r.setup.format);
      const discipline = f?.discipline ?? profile.mainDiscipline;
      const id = `${r.startIso}#chrono`;
      record(
        { id, start: r.startIso, discipline, level: profile.levels[discipline], exerciseId: `chrono-${r.setup.format}`, exerciseName: `Chrono · ${f?.label ?? 'Réglage perso'}`, mode: chronoMode(r.setup) },
        t.workSec,
        0,
      );
      annotate(id, { status, workSec: Math.round(t.workSec), restSec: Math.round(t.restSec), totalSec: Math.round(t.totalSec), plannedRounds: r.setup.rounds, doneRounds: t.roundsDone, work: r.setup.work });
    },
    [annotate, profile.levels, profile.mainDiscipline, record],
  );

  /** the events of the session engine become gongs, beeps and voice, each once */
  const handle = useCallback(
    (r: Run, events: TimelineEvent[]) => {
      const c = cfg.current;
      const iv = !!CHRONO_FORMAT_BY_ID.get(r.setup.format)?.intervals;
      for (const e of events) {
        switch (e.type) {
          case 'prep-start':
            speak('Prépare-toi');
            break;
          case 'prep-count':
            if (e.n <= 3) {
              beep(false);
              speak(String(e.n));
            }
            break;
          case 'work-start':
            bell(1);
            speak(iv ? `Cycle ${e.round}` : `Round ${e.round}`);
            break;
          case 'warning':
            if (c.voice) speak(e.secondsLeft >= 30 ? 'Trente secondes' : 'Dix secondes', false);
            else beep(true);
            break;
          case 'work-end':
            if (c.gongs) bell(3);
            if (e.last) speak('Terminé. Bravo');
            else if (iv) speak('Récupération');
            else speak(r.setup.rest > 0 ? 'Fin du round. Repos' : 'Fin du round');
            break;
          case 'rest-start':
            // without gongs, the rest still has its own signal (never both at once)
            if (!c.gongs && e.len >= 5) restSignal();
            break;
          case 'rest-count':
            beep(false);
            break;
          case 'done':
            save(r, 'terminee');
            break;
        }
      }
    },
    [save, speak],
  );

  const start = useCallback(() => {
    unlockAudio();
    const s = cfg.current.chrono;
    const t = new SessionTimeline([{ work: s.work, rounds: s.rounds, roundRest: s.rest }], { prep: Math.max(3, cfg.current.prepSec ?? 3), warnBefore: cfg.current.roundWarnSec ?? 10, betweenItems: 0, chain: false });
    const r: Run = { tl: t, setup: s, startIso: new Date().toISOString(), saved: false, status: 'terminee' };
    handle(r, t.start());
    setRun(r);
  }, [handle]);

  const pause = useCallback(() => {
    const r = runRef.current;
    if (r && r.tl.pause()) {
      stopVoice();
      rerender();
    }
  }, []);
  const togglePause = useCallback(() => {
    const r = runRef.current;
    if (!r) return;
    if (r.tl.paused) {
      unlockAudio();
      r.tl.resume();
    } else {
      r.tl.pause();
      stopVoice();
    }
    rerender();
  }, []);
  const stop = useCallback(() => {
    const r = runRef.current;
    if (!r) return;
    save(r, 'interrompue');
    r.tl.finish();
    stopVoice();
    rerender();
  }, [save]);
  const skip = useCallback(() => {
    const r = runRef.current;
    if (!r) return;
    handle(r, r.tl.skip());
    rerender();
  }, [handle]);
  const toSetup = useCallback(() => setRun(null), []);

  // the clock: the engine is read ten times a second while the session runs
  useEffect(() => {
    if (view !== 'run') return;
    const id = window.setInterval(() => {
      const r = runRef.current;
      if (!r || r.tl.paused) return;
      handle(r, r.tl.tick());
      rerender();
    }, 100);
    return () => window.clearInterval(id);
  }, [view, handle]);

  // another app, the screen turned off: the session pauses (nothing runs unseen); the screen stays on meanwhile
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onVis);
    const off = onAppPause(pause);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      off();
    };
  }, [pause]);
  useEffect(() => {
    void keepScreenOn(view === 'run');
  }, [view]);
  // leaving the screen during a session keeps it as interrupted
  useEffect(
    () => () => {
      const r = runRef.current;
      if (r && r.tl.phase !== 'termine' && r.tl.phase !== 'pret') save(r, 'interrompue');
      stopVoice();
      void keepScreenOn(false);
    },
    [save],
  );

  const paused = !!tl?.paused;
  useNavActions({
    back:
      view === 'run'
        ? { run: paused ? stop : pause, ariaLabel: paused ? 'Retour : arrêter la séance' : 'Retour : mettre en pause' }
        : view === 'end'
          ? { run: toSetup, ariaLabel: 'Retour aux réglages' }
          : null,
    toggle: {
      run: view === 'run' ? togglePause : start,
      icon: view === 'run' && !paused ? 'pause' : 'play',
      label: view === 'run' ? (paused ? 'Reprendre' : 'Pause') : view === 'end' ? 'Recommencer' : 'Démarrer',
      testId: 'chrono-toggle',
    },
    setup: { run: view === 'setup' ? () => setOptions(true) : toSetup, disabled: view === 'run', label: 'Réglages', testId: 'chrono-setup' },
    'nav:/chrono': { run: () => undefined, pressed: true, ariaLabel: 'Chrono, écran affiché' },
  });

  const patch = (p: Partial<Omit<ChronoSetup, 'format'>>) => set({ chrono: editSetup(setup, p) });

  if (view === 'setup') {
    const tiles = [
      { id: 'work', label: intervals ? 'Effort' : 'Round', value: mmss(setup.work), lo: setup.work <= CHRONO_LIMITS.work[0], hi: setup.work >= CHRONO_LIMITS.work[1], minus: () => patch({ work: stepSeconds(setup.work, -1, CHRONO_LIMITS.work) }), plus: () => patch({ work: stepSeconds(setup.work, 1, CHRONO_LIMITS.work) }) },
      { id: 'rest', label: intervals ? 'Récup.' : 'Repos', value: mmss(setup.rest), lo: setup.rest <= CHRONO_LIMITS.rest[0], hi: setup.rest >= CHRONO_LIMITS.rest[1], minus: () => patch({ rest: stepSeconds(setup.rest, -1, CHRONO_LIMITS.rest) }), plus: () => patch({ rest: stepSeconds(setup.rest, 1, CHRONO_LIMITS.rest) }) },
      { id: 'rounds', label: intervals ? 'Cycles' : 'Rounds', value: String(setup.rounds), lo: setup.rounds <= CHRONO_LIMITS.rounds[0], hi: setup.rounds >= CHRONO_LIMITS.rounds[1], minus: () => patch({ rounds: stepRounds(setup.rounds, -1) }), plus: () => patch({ rounds: stepRounds(setup.rounds, 1) }) },
    ];
    const warnText = warnBefore ? `alerte ${warnBefore} s` : 'sans alerte';
    return (
      <div className="page chrono-page" data-testid="chrono-setup-screen">
        <PageHead title="Chrono de combat" eyebrow="Outil d’entraînement" />
        <div className="chrono-tiles">
          {tiles.map((t) => (
            <div className="chrono-tile" key={t.id} data-testid={`chrono-tile-${t.id}`}>
              <span className="chrono-tile-label">{t.label}</span>
              <span className="chrono-tile-value" data-testid={`chrono-value-${t.id}`}>
                {t.value}
              </span>
              <div className="chrono-tile-steps">
                <button type="button" className="btn secondary" onClick={t.minus} disabled={t.lo} aria-label={`Moins : ${t.label.toLowerCase()}`} data-testid={`chrono-minus-${t.id}`}>
                  −
                </button>
                <button type="button" className="btn secondary" onClick={t.plus} disabled={t.hi} aria-label={`Plus : ${t.label.toLowerCase()}`} data-testid={`chrono-plus-${t.id}`}>
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <section className="chrono-formats" aria-labelledby="chrono-formats-h">
          <h2 id="chrono-formats-h" className="chrono-h">
            Formats prêts
          </h2>
          <div className="chrono-format-list">
            {CHRONO_FORMATS.map((f) => {
              const on = setup.format === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`chrono-format ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  data-testid={`chrono-format-${f.id}`}
                  onClick={() => set({ chrono: { format: f.id, work: f.work, rest: f.rest, rounds: f.rounds } })}
                >
                  <span className="grow">{f.label}</span>
                  <span className="chrono-format-detail">
                    {f.rounds} × {mmss(f.work)}
                    {f.rest && f.rounds > 1 ? ` · ${f.intervals ? 'récup.' : 'repos'} ${mmss(f.rest)}` : ''}
                  </span>
                  <span className="chrono-format-dot" aria-hidden />
                </button>
              );
            })}
          </div>
          <p className="small muted">Durées habituelles, à adapter avec + et −. {setup.format === 'perso' && <b data-testid="chrono-perso">Réglage perso.</b>}</p>
        </section>

        <div className="chrono-summary">
          <button type="button" className="chrono-options-link" onClick={() => setOptions(true)} data-testid="chrono-options-open">
            Préparation {prep} s · {warnText} · {settings.gongs ? 'gongs' : 'sans gong'} · {settings.voice ? 'voix' : 'sans voix'}
          </button>
          <span className="chrono-total" data-testid="chrono-total" aria-label={`Durée totale ${mmss(chronoTotal(setup, prep))}`}>
            {mmss(chronoTotal(setup, prep))}
          </span>
        </div>
        <button type="button" className="btn primary block lg chrono-start" onClick={start} data-testid="chrono-start">
          Démarrer
        </button>

        {options && (
          <Sheet title="Options du chrono" onClose={() => setOptions(false)}>
            <ChronoOptions />
          </Sheet>
        )}
      </div>
    );
  }

  const r = run!;
  const t = r.tl;
  const s = r.setup;

  if (view === 'end') {
    const done = r.status === 'terminee';
    const stats = [
      { k: intervals ? 'Cycles' : 'Rounds', v: `${t.roundsDone} / ${s.rounds}` },
      { k: intervals ? 'Temps d’effort' : 'Temps de combat', v: clock(t.workSec) },
      { k: intervals ? 'Récupération' : 'Repos', v: clock(t.restSec) },
      { k: 'Durée totale', v: clock(t.totalSec) },
    ];
    return (
      <div className="page chrono-page" data-testid="chrono-end">
        <PageHead title={done ? 'Séance terminée' : 'Séance arrêtée'} eyebrow={format?.label ?? 'Réglage perso'} />
        <dl className="chrono-stats" data-testid="chrono-summary">
          {stats.map((x) => (
            <div key={x.k}>
              <dt>{x.k}</dt>
              <dd>{x.v}</dd>
            </div>
          ))}
        </dl>
        <p className="small muted">{t.workSec >= 1 ? 'La séance est ajoutée à ton historique, dans Progrès.' : 'Moins d’une seconde de combat : rien n’est ajouté à ton historique.'}</p>
        <button type="button" className="btn primary block lg" onClick={start} data-testid="chrono-again">
          Recommencer
        </button>
        <button type="button" className="btn secondary block" onClick={toSetup} data-testid="chrono-edit">
          Modifier les réglages
        </button>
      </div>
    );
  }

  // the session, full screen
  const phase = t.phase;
  const left = t.remaining ?? 0;
  const work = phase === 'travail';
  const phaseLabel = paused ? 'Pause' : phase === 'decompte' ? 'Prépare-toi' : phase === 'repos' ? (intervals ? 'Récupération' : 'Repos') : intervals ? 'Effort' : 'Combat';
  // during the rest the engine already points at the next round
  const unit = intervals ? 'Cycle' : 'Round';
  const roundLabel = phase === 'decompte' || phase === 'repos' ? `Ensuite : ${unit} ${t.round} / ${s.rounds}` : `${unit} ${t.round} / ${s.rounds}`;
  const warnOn = !paused && work && warnBefore > 0 && s.work >= 2 * warnBefore && left <= warnBefore && left > 0;
  const dots = Array.from({ length: s.rounds }, (_, i) => {
    const n = i + 1;
    const state = n < t.round ? 'done' : n === t.round && work ? 'now' : 'todo';
    return <i key={n} className={`chrono-dot ${state}`} />;
  });
  return (
    <div className={`chrono-run ${paused ? 'paused' : phase}`} data-testid="chrono-run" data-phase={paused ? 'pause' : phase}>
      <button type="button" className="chrono-tap" onClick={togglePause} aria-label={paused ? 'Reprendre' : 'Mettre en pause'} data-testid="chrono-tap">
        <span className="chrono-format-name">{format?.label ?? 'Réglage perso'}</span>
        <span className="chrono-phase" data-testid="chrono-phase">
          {phaseLabel}
        </span>
        <span className="chrono-time" role="timer" aria-label={`Temps restant ${clock(left)}`} data-testid="chrono-time">
          {clock(left)}
        </span>
        <span className="chrono-round" data-testid="chrono-round">
          {roundLabel}
        </span>
        {s.rounds <= 20 && <span className="chrono-dots">{dots}</span>}
        {warnOn && (
          <span className="chrono-warn" data-testid="chrono-warn">
            {warnBefore} secondes
          </span>
        )}
        <span className="chrono-hint">{paused ? 'Touche l’écran pour reprendre' : 'Touche l’écran pour mettre en pause'}</span>
      </button>
      {paused && (
        <div className="chrono-paused-actions">
          <button type="button" className="btn secondary" onClick={stop} data-testid="chrono-stop">
            Arrêter
          </button>
          <button type="button" className="btn secondary" onClick={skip} data-testid="chrono-skip">
            Passer la phase
          </button>
        </div>
      )}
    </div>
  );
}
