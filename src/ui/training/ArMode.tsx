import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ArBridge } from '../../ar/ArBridge';
import { detectAr, ArSupport } from '../../ar/support';

export function useArView(bridge: ArBridge) {
  return useSyncExternalStore(
    (fn) => bridge.subscribe(fn),
    () => bridge.view,
  );
}

/**
 * Sheet shown before the camera opens: what the camera is used for, safety rules, and the real
 * capability check. The camera is requested only by the "Activer la caméra" button.
 */
export function ArIntroSheet({ bridge, overlayRoot, onClose, onBeforeStart }: { bridge: ArBridge; overlayRoot: () => HTMLElement | null; onClose: () => void; onBeforeStart: () => void }) {
  const [support, setSupport] = useState<ArSupport | null>(null);
  const [clear, setClear] = useState(false);
  const view = useArView(bridge);
  useEffect(() => {
    let alive = true;
    void detectAr().then((s) => alive && setSupport(s));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Réalité augmentée" data-testid="ar-sheet">
        <h2>Coach en réalité augmentée</h2>
        <p className="small">
          Ton coach apparaît dans ta pièce, posé sur le sol, à travers la caméra arrière. Il fait exactement les mêmes mouvements, avec les mêmes compteurs et
          consignes que sur fond blanc.
        </p>
        <div className="card stack" style={{ background: 'var(--bg-soft, #f6f6f6)' }}>
          <b className="small">Caméra et confidentialité</b>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            <li>La caméra ne s’ouvre qu’après ton accord et se ferme dès que tu quittes la réalité augmentée ou l’entraînement.</li>
            <li>Les images sont traitées uniquement sur ton téléphone : aucune vidéo, aucune photo, rien n’est envoyé.</li>
          </ul>
        </div>
        <div className="card stack" style={{ background: 'var(--bg-soft, #f6f6f6)' }}>
          <b className="small">Sécurité</b>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Dégage un espace d’au moins 2 m × 2 m, sans meuble ni obstacle, et place le coach dans une zone libre.</li>
            <li>Pose ton téléphone (sur un meuble, un support) avant les exercices avec de grands mouvements : ne frappe pas le téléphone à la main.</li>
            <li>Ne fixe pas l’écran pendant les frappes rapides : regarde devant toi.</li>
            <li>Le bouton Stop arrête la séance immédiatement.</li>
          </ul>
        </div>
        {support === null && <p className="small muted">Vérification de la compatibilité…</p>}
        {support && !support.ok && (
          <div className="note" data-testid="ar-unsupported">
            {support.message}
          </div>
        )}
        {view.error && <div className="note">{view.error}</div>}
        {support?.ok && (
          <>
            <label className="list-row" style={{ cursor: 'pointer' }}>
              <span style={{ flex: 1 }} className="small">
                J’ai un espace dégagé et mon téléphone sera posé pendant les exercices.
              </span>
              <input type="checkbox" checked={clear} onChange={(e) => setClear(e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--red)' }} />
            </label>
            <button
              className="btn primary block"
              disabled={!clear || view.state === 'starting'}
              data-testid="ar-start"
              onClick={() => {
                onBeforeStart();
                void bridge.start(overlayRoot()).then(() => bridge.view.state !== 'off' && onClose());
              }}
            >
              {view.state === 'starting' ? 'Ouverture de la caméra…' : 'Activer la caméra'}
            </button>
          </>
        )}
        <button className="btn block" onClick={onClose}>
          Rester sur fond blanc
        </button>
      </div>
    </div>
  );
}

/** placement controls shown on top of the camera image */
export function ArControls({ bridge, compact, onToggleCompact, recommendedAz }: { bridge: ArBridge; compact: boolean; onToggleCompact: () => void; recommendedAz: number }) {
  const v = useArView(bridge);
  const ref = useRef<HTMLDivElement>(null);
  // a tap on a button must not also place the coach on the floor
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener('beforexrselect', stop);
    return () => el.removeEventListener('beforexrselect', stop);
  }, []);
  return (
    <div className="ar-controls" ref={ref}>
      {v.state === 'scanning' && (
        <div className="ar-hint">{v.surface ? 'Touche l’écran pour poser le coach sur le cercle.' : 'Balaye lentement le sol avec le téléphone pour le détecter.'}</div>
      )}
      <div className="row nowrap" style={{ gap: 6, justifyContent: 'center' }}>
        {v.state === 'placed' ? (
          <button className="btn sm" onClick={() => bridge.replace()}>
            Replacer
          </button>
        ) : (
          <button className="btn sm" disabled={!v.surface} onClick={() => bridge.requestPlace()}>
            Placer ici
          </button>
        )}
        <button className="btn sm" onClick={() => bridge.recenter()}>
          Recentrer
        </button>
        <button className="btn sm" onClick={onToggleCompact} aria-pressed={compact}>
          {compact ? 'Commandes' : 'Masquer'}
        </button>
        <button className="btn sm dark" onClick={() => void bridge.stop()} data-testid="ar-exit">
          Fond blanc
        </button>
      </div>
      {!compact && v.state === 'placed' && (
        <div className="ar-sliders">
          <label>
            Taille {Math.round(v.scale * 100)} %
            <input type="range" min={0.2} max={1} step={0.05} value={v.scale} onChange={(e) => bridge.set({ scale: Number(e.target.value) })} />
          </label>
          <div style={{ gridColumn: '1 / -1' }} className="row nowrap">
            <span>Orientation de démonstration :</span>
            {[
              ['Conseillée', recommendedAz],
              ['Face', 0],
              ['Profil', 90],
            ].map(([l, az]) => (
              <button key={l as string} className="chip" onClick={() => bridge.set({ yaw: Math.round(-(az as number)) })}>
                {l as string}
              </button>
            ))}
          </div>
          <label>
            Rotation {Math.round(v.yaw)}°
            <input type="range" min={-180} max={180} step={5} value={v.yaw} onChange={(e) => bridge.set({ yaw: Number(e.target.value) })} />
          </label>
        </div>
      )}
    </div>
  );
}
