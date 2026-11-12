import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_COACHES, championFor } from '../domain/coaches/catalog';
import { useProfile } from '../store/profile';
import { useSettings } from '../store/settings';
import { bootMessage, bootPlan, isKept, keepInCache, noteKept, runBoot, type BootItem, type BootProgress } from './preload';
import './boot.css';

/**
 * 1.25 chargement au démarrage, option A « le chrono du round » (Youssef, 2026-11-06): the CS logo inside a round
 * chrono that fills with the bytes received, the words of the step under it, the bell (« DING ! ») when all is
 * there. Shown once per launch; every coach is downloaded then, so choosing one later never waits. If a setting
 * asks for more files (quality « Haute », the rooms turned back on), the chrono shows again over the screen for
 * those files only.
 */

/** files downloaded in this launch (a coach changed later only needs its own) */
const loaded = new Set<string>();
/** how long « DING ! » stays before the app shows */
const BELL_MS = 700;
/** a person on a very slow line can go in before the end (the screens then load what is missing, as before) */
const SKIP_AFTER_MS = 12_000;
/** when everything is already on the phone the check takes a fraction of a second: no chrono shown for that */
const SHOW_AFTER_MS = 350;

const JSON_MODELS = import.meta.env.VITE_COACH_FORMAT === 'json';
const PHOTO = import.meta.env.VITE_PHOTO_COACH !== '0';

function useHydrated() {
  const profile = useProfile((s) => s.hydrated);
  const [settings, setSettings] = useState(() => useSettings.persist.hasHydrated());
  useEffect(() => {
    if (settings) return;
    const off = useSettings.persist.onFinishHydration(() => setSettings(true));
    if (useSettings.persist.hasHydrated()) setSettings(true);
    return off;
  }, [settings]);
  return profile && settings;
}

/** what the start screen downloads for this profile and these settings, without what this launch already has */
function usePlan(ready: boolean): BootItem[] | null {
  const coach = useProfile((s) => s.profile.coach);
  const chosen = useProfile((s) => s.profile.champion);
  const preferred = useProfile((s) => s.profile.disciplines);
  const st = useSettings((s) => s.settings);
  const photo = PHOTO && st.coachRender === 'premium';
  const coachId = photo && coach ? championFor(coach, chosen).id : null;
  return useMemo(() => {
    if (!ready) return null;
    const plan = bootPlan({ coachId, coaches: photo ? ALL_COACHES.map((c) => c.id) : [], outfits: st.coachOutfit, bjjOutfit: st.bjjOutfit, rooms: st.salleImmersive, sharpRooms: st.quality === 'haute', json: JSON_MODELS, preferred });
    return plan.filter((x) => !loaded.has(x.url));
    // the profile's disciplines only order the list: a change there does not start a new download
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, photo, coachId, st.coachOutfit, st.bjjOutfit, st.salleImmersive, st.quality]);
}

export function BootGate({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const ready = useHydrated();
  const plan = usePlan(ready);
  const [first, setFirst] = useState(true);
  // the list of files the screen was shown for (finished, or « Entrer sans attendre »)
  const [doneKey, setDoneKey] = useState<string | null>(null);
  const key = plan?.map((x) => x.url).join('|') ?? '';
  const show = !!plan && plan.length > 0 && key !== doneKey;
  useEffect(() => {
    if (ready && plan && !show) setFirst(false);
  }, [ready, plan, show]);
  if (!ready || !plan) return <>{fallback}</>;
  const coachId = plan.find((x) => x.step === 'coach')?.url.match(/coaches\/([^/]+)\//)?.[1] ?? null;
  const done = () => {
    setDoneKey(key);
    setFirst(false);
  };
  // first launch: nothing else loads meanwhile (the screens would download the same files at the same time);
  // a coach chosen later: the chrono shows over the screen
  if (first && show) return <BootScreen key={key} plan={plan} coachId={coachId} onDone={done} />;
  if (first) return <>{fallback}</>;
  return (
    <>
      {children}
      {show && <BootScreen key={key} plan={plan} coachId={coachId} overlay onDone={done} />}
    </>
  );
}

function BootScreen({ plan, coachId, overlay = false, onDone }: { plan: BootItem[]; coachId: string | null; overlay?: boolean; onDone?: () => void }) {
  const [p, setP] = useState<BootProgress>({ ratio: 0, done: 0, total: plan.length, message: bootMessage(plan[0]?.step ?? 'pesee', plan[0]?.discipline), failed: [] });
  const [bell, setBell] = useState(false);
  const [skip, setSkip] = useState(false);
  const [gone, setGone] = useState(false);
  const [shown, setShown] = useState(false);
  const finished = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const ctl = new AbortController();
    let bellTimer = 0;
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      setBell(true);
      bellTimer = window.setTimeout(() => {
        setGone(true);
        doneRef.current?.();
      }, BELL_MS);
    };
    const skipTimer = window.setTimeout(() => setSkip(true), SKIP_AFTER_MS);
    const showTimer = window.setTimeout(() => setShown(true), SHOW_AFTER_MS);
    let fetched = 0;
    const cached = async (x: BootItem) => {
      const kept = await isKept(x, JSON_MODELS);
      if (!kept) fetched++;
      return kept;
    };
    void runBoot(plan, setP, { signal: ctl.signal, store: navigator.serviceWorker?.controller ? undefined : keepInCache, cached, received: noteKept }).then(async ({ failed }) => {
      if (ctl.signal.aborted) return;
      for (const x of plan) if (!failed.includes(x.url)) loaded.add(x.url);
      // « Pesée officielle »: the 3D code and the coach read once, so the first 3D screen opens at once
      setP((q) => ({ ...q, message: bootMessage('pesee') }));
      try {
        const m = await import('../three/CoachModel');
        if (coachId) m.preloadPhotoCoach(coachId);
      } catch {
        /* the 3D screens load it themselves */
      }
      if (ctl.signal.aborted) return;
      // nothing had to be downloaded (the next launches): the app opens straight away, no bell
      if (!fetched) {
        finished.current = true;
        setGone(true);
        doneRef.current?.();
        return;
      }
      setP((q) => ({ ...q, ratio: 1, message: bootMessage('pret') }));
      finish();
    });
    return () => {
      ctl.abort();
      window.clearTimeout(skipTimer);
      window.clearTimeout(showTimer);
      window.clearTimeout(bellTimer);
    };
  }, [plan, coachId]);

  if (gone) return null;
  // the first instants: the same plain ground as the first paint, the chrono only if it lasts
  if (!shown && !bell) return <div className={`boot-screen${overlay ? ' is-overlay' : ''}`} aria-hidden="true" />;
  const pct = Math.round(p.ratio * 100);
  const C = 2 * Math.PI * 45;
  return (
    <div className={`boot-screen${overlay ? ' is-overlay' : ''}${bell ? ' is-bell' : ''}`} role="progressbar" aria-label="Chargement de l’application" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${pct} %, ${p.message}`} data-testid="boot-screen" data-ratio={p.ratio.toFixed(3)}>
      <div className="boot-stage">
        <div className="boot-ring">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="45" className="boot-track" />
            <circle cx="50" cy="50" r="45" className="boot-arc" strokeDasharray={C} strokeDashoffset={C * (1 - p.ratio)} />
          </svg>
          <img src="./icons/logo-transparent.svg" alt="" className="boot-logo" />
        </div>
        <div className="boot-round" data-testid="boot-round">{bell ? 'DING !' : 'ROUND 1'}</div>
        <div className="boot-msg" aria-live="polite" data-testid="boot-message">
          {p.message}
        </div>
        <div className="boot-pct">{bell ? 'PRÊT' : `${pct} %`}</div>
      </div>
      {skip && !bell && !overlay && (
        <button type="button" className="boot-skip" onClick={() => doneRef.current?.()}>
          Entrer sans attendre
        </button>
      )}
      <div className="boot-ver">v{import.meta.env.VITE_APP_VERSION}</div>
    </div>
  );
}
