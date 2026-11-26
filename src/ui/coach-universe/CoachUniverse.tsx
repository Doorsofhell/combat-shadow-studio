import { lazy, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { ALL_COACHES, type ChampionCoach } from '../../domain/coaches/catalog';
import { resolveAll, resolveCoachAtmosphere, type CoachAtmosphere } from '../../domain/coaches/atmosphere';
import type { CoachStageProps } from '../../three/CoachStage';

/**
 * 2.10.5 (Youssef, 2026-11-26 : « reprendre dans la fenêtre mon coach de la page d'accueil l'ambiance du choix de coach plein
 * écran… il faudrait réutiliser le même composant ») : l'univers du coach (V4, 2.1.0) en un seul composant, utilisé par
 * l'écran « Ton coach » (/coach) ET la carte « Ton coach » de l'Accueil. Il monte la même scène 3D (CoachStage + AtmosphereScene :
 * ciel, emblème avec le grand nom, traits de lumière, anneau au sol) avec la même ambiance calculée une fois pour tous les
 * coachs ; chaque écran garde son cadrage et ses commandes. Rien n'est copié : changer l'univers ici le change partout.
 */

/** les ambiances de tous les coachs, calculées une fois (déterministes, chacune unique : voir resolveAll) */
const ATMOSPHERES = resolveAll(ALL_COACHES);

/** l'ambiance d'un coach (celle du catalogue ; un coach inconnu reçoit la sienne, sans départage) */
export function atmosphereOf(c: ChampionCoach): CoachAtmosphere {
  return ATMOSPHERES.get(c.id) ?? resolveCoachAtmosphere(c);
}

/** les couleurs de l'univers en variables CSS, pour ce qui entoure la scène (fond, bordure, textes) */
export function universeVars(a: CoachAtmosphere): CSSProperties {
  return { '--atmo-primary': a.palette.primary, '--atmo-accent': a.palette.accent, '--atmo-deep': a.palette.sky[1] } as CSSProperties;
}

const CoachStage = lazy(() => import('../../three/CoachStage').then((m) => ({ default: m.CoachStage })));

export type CoachUniverseStageProps = Omit<CoachStageProps, 'atmosphere' | 'backdrop' | 'champion' | 'coach'> & {
  /** le coach montré dans son univers */
  champion: ChampionCoach;
};

/**
 * La scène 3D du coach dans son univers. Chargée à la demande (Three.js reste hors du premier écran) : l'appelant l'entoure
 * d'un Suspense avec son image d'attente.
 */
export function CoachUniverseStage({ champion, ...stage }: CoachUniverseStageProps) {
  const a = atmosphereOf(champion);
  const atmosphere = useMemo(() => ({ value: a, name: champion.name }), [a, champion.name]);
  return <CoachStage {...stage} backdrop="dark" coach={champion.coach} champion={champion.id} atmosphere={atmosphere} />;
}
