import { Component, createContext, type ErrorInfo, type ReactNode } from 'react';
import { log3d } from '../../three/diag3d';
import { isGraphicsError, probeWebgl } from '../../three/webglProbe';
import { stepDown } from '../../three/safe3d';

/**
 * v0.29 (Youssef, 2026-10-21: « le coach disparaît… ferme puis rouvre ne règle rien »): one guard around every
 * 3D stage (accueil, fiche technique, entraînement, aperçu).
 *
 * - The stage is only created when the page may draw in 3D (probeWebgl). After graphics resets Chrome refuses
 *   for about two minutes: the guard waits and asks again every few seconds, then shows the coach again by
 *   itself. Before, a stage was created anyway, threw, and the error message stayed until a reload.
 * - The stage reports a lost graphics context that does not come back (StageGuardContext): same waiting.
 * - A React or model error is retried once by itself, then a message with a button that works.
 * - Bounded: at most MAX_REMOUNTS new stages within REMOUNT_WINDOW, then the button only (no endless loop).
 * Everything goes to the 3D journal (Réglages › Affichage 3D › Diagnostic).
 */
export interface StageGuardApi {
  /** the graphics context was lost and did not come back */
  lost: (why: string) => void;
}
export const StageGuardContext = createContext<StageGuardApi | null>(null);

type Mode = 'ok' | 'attente' | 'echec';
interface State {
  mode: Mode;
  /** a new key creates a new stage */
  key: number;
  /** why the coach is not shown (journal) */
  why: string;
}

const PROBE_MS = 4000;
/** how long the guard keeps asking by itself (Chrome lifts its block after about two minutes) */
const MAX_WAIT_MS = 5 * 60_000;
const MAX_REMOUNTS = 4;
const REMOUNT_WINDOW = 2 * 60_000;

export class StageGuard extends Component<{ children: ReactNode; place: string }, State> {
  state: State = { mode: 'ok', key: 0, why: '' };
  private timer: ReturnType<typeof setInterval> | undefined;
  private waitStart = 0;
  private remounts: number[] = [];
  private lastError = 0;
  private api: StageGuardApi = { lost: (why) => this.wait(`contexte graphique non rétabli (${why})`) };

  static getDerivedStateFromError(): Partial<State> {
    return { mode: 'echec' };
  }

  componentDidMount() {
    const p = probeWebgl();
    if (!p.ok) this.wait(`3D refusée par le navigateur : ${p.reason}`);
  }

  componentWillUnmount() {
    this.stopProbe();
    document.removeEventListener('visibilitychange', this.onVisible);
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const graphics = isGraphicsError(error);
    const kind = graphics ? 'WebGL' : /load|fetch|gltf|glb|json|404/i.test(error.message) ? 'modèle' : 'React';
    log3d('echec', `${this.props.place} · erreur ${kind} : ${error.message}${info.componentStack ? ` @${info.componentStack.split('\n').find((l) => l.trim())?.trim()}` : ''}`);
    if (graphics) {
      stepDown();
      this.wait(`erreur WebGL : ${error.message}`);
      return;
    }
    // a model or React error: one new try by itself, then the button
    const now = Date.now();
    const again = now - this.lastError < 30_000;
    this.lastError = now;
    if (!again) setTimeout(() => this.remount('nouvel essai après une erreur'), 800);
    else this.setState({ mode: 'echec', why: `erreur ${kind} : ${error.message}` });
  }

  private wait(why: string) {
    log3d('echec', `${this.props.place} · ${why} · attente`);
    this.waitStart = Date.now();
    this.setState({ mode: 'attente', why });
    this.stopProbe();
    this.timer = setInterval(this.tick, PROBE_MS);
    document.addEventListener('visibilitychange', this.onVisible);
  }

  private onVisible = () => {
    if (document.visibilityState === 'visible' && this.state.mode === 'attente') this.tick();
  };

  private tick = () => {
    if (document.visibilityState === 'hidden') return;
    const p = probeWebgl();
    if (p.ok) {
      this.stopProbe();
      this.remount(`3D de nouveau disponible après ${Math.round((Date.now() - this.waitStart) / 1000)} s`);
    } else if (Date.now() - this.waitStart > MAX_WAIT_MS) {
      this.stopProbe();
      log3d('echec', `${this.props.place} · toujours refusée après ${MAX_WAIT_MS / 60_000} min : ${p.reason}`);
      this.setState({ mode: 'echec', why: `3D refusée par le navigateur : ${p.reason}` });
    }
  };

  private stopProbe() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private remount(why: string) {
    const now = Date.now();
    this.remounts = this.remounts.filter((t) => now - t < REMOUNT_WINDOW);
    if (this.remounts.length >= MAX_REMOUNTS) {
      log3d('echec', `${this.props.place} · ${MAX_REMOUNTS} reprises en ${REMOUNT_WINDOW / 60_000} min : arrêt des reprises automatiques`);
      this.setState({ mode: 'echec', why: 'incidents graphiques répétés' });
      return;
    }
    this.remounts.push(now);
    log3d('recuperation', `${this.props.place} · ${why}`);
    this.setState((s) => ({ mode: 'ok', key: s.key + 1, why: '' }));
  }

  /** the button: the user asks, so the bound starts again */
  private retryNow = () => {
    this.remounts = [];
    this.lastError = 0;
    const p = probeWebgl();
    if (p.ok) this.remount('nouvel essai demandé');
    else this.wait(`3D refusée par le navigateur : ${p.reason}`);
  };

  render() {
    const { mode, key } = this.state;
    if (mode === 'attente')
      return (
        <div className="hero-loading small stage-guard" role="status" data-testid="stage-wait">
          <div className="stage-guard-box">
            <div className="stage-skeleton" />
            <p>Le coach revient dans un instant : l’appareil a mis la 3D en pause après un incident graphique.</p>
            <button type="button" className="btn secondary" onClick={this.retryNow}>
              Réessayer maintenant
            </button>
          </div>
        </div>
      );
    if (mode === 'echec')
      return (
        <div className="hero-loading small stage-guard" role="alert" data-testid="stage-failed">
          <div className="stage-guard-box">
            <p>Le coach 3D n’a pas pu être affiché.</p>
            <button type="button" className="btn secondary" onClick={this.retryNow}>
              Réessayer
            </button>
            <p className="muted">Si ça continue, ferme complètement le navigateur puis rouvre l’application. Le détail est dans Réglages › Affichage 3D.</p>
          </div>
        </div>
      );
    return (
      <StageGuardContext.Provider value={this.api}>
        <div key={key} className="stage-guard-slot">
          {this.props.children}
        </div>
      </StageGuardContext.Provider>
    );
  }
}
