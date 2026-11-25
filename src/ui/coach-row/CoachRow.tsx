import { ALL_COACHES, type ChampionCoach } from '../../domain/coaches/catalog';
import { AppIcon } from '../icons';
import { PremiumTag, ProLock, useProGate } from '../premium/PremiumMarker';
import { ITEM_RIGHT, canOpenCoach, isPremiumCoach } from '../../monetization/premiumItems';
import './coach-row.css';

/**
 * 2.7 (Youssef, 2026-11-24: « c'est compliqué de choisir le coach et de le visualiser, je veux que ça soit plus
 * simple », option A « Un seul sélecteur, partout »): THE row of coaches of the app, one card per coach with his face
 * and his name, the same in the « Options du coach » panel, Réglages › Mon coach and the first launch. Before, the
 * same choice was shown three ways (names only in the panel, a former picker in Réglages and Bienvenue, a strip
 * without names on the coach screen).
 *
 * `value` is the coach shown as chosen; `mine` the coach the user has (a small mark, when it differs from `value`).
 */
export function CoachRow({
  value,
  onPick,
  testIdOf,
  mine,
  label = 'Choix du coach',
}: {
  value: string | null;
  onPick: (c: ChampionCoach) => void;
  testIdOf: (c: ChampionCoach) => string;
  mine?: string | null;
  label?: string;
}) {
  const gate = useProGate();
  return (
    <div className="crow" role="radiogroup" aria-label={label}>
      {ALL_COACHES.map((c) => {
        const on = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${c.name} « ${c.nickname} »${mine === c.id ? ', ton coach' : ''}`}
            className={`crow-card${on ? ' on' : ''}${mine === c.id ? ' mine' : ''}`}
            onClick={(ev) => {
              // 2.9.0: a locked coach opens Shadow Pro instead of being chosen
              gate(ITEM_RIGHT.coach, !canOpenCoach(c.id))(ev);
              if (!ev.defaultPrevented) onPick(c);
            }}
            data-testid={testIdOf(c)}
            data-locked={!canOpenCoach(c.id) || undefined}
          >
            <CoachFace coach={c} />
            <span className="crow-name">{c.name}</span>
            {/* 2.9.0: on a face this narrow the PRO badge sits at its top left, the name stays whole */}
            {isPremiumCoach(c.id) && <PremiumTag feature="all_fighters" />}
            {!canOpenCoach(c.id) && (
              <span className="crow-lock">
                <ProLock size={12} />
              </span>
            )}
            {on && (
              <span className="crow-tick" aria-hidden>
                <AppIcon id="check" size={12} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** the face of a coach: visage.webp, 200 x 250, cut once from his portrait (tools/generator/visages/visages.py) */
export const faceOf = (coach: ChampionCoach) => coach.portrait.replace(/portrait\.webp$/, 'visage.webp');

export function CoachFace({ coach, className = '' }: { coach: ChampionCoach; className?: string }) {
  return (
    <span className={`crow-face ${className}`} aria-hidden>
      <img src={faceOf(coach)} alt="" loading="eager" decoding="async" draggable={false} width={200} height={250} />
    </span>
  );
}
