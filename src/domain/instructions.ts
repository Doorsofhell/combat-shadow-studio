/**
 * Training-screen instructions: one main instruction and 3 to 5 key points per technique, each
 * point tied to a body zone and, when it matters, to the phase of the move where it applies
 * (highlighted while the coach plays that phase). The texts condense the step-by-step sheets of
 * guide.ts and say « avant / arrière » rather than left / right, so they hold in both guards.
 */
export type PointZone = 'pieds' | 'bassin' | 'bras' | 'jambe' | 'tete' | 'garde';
/** same phases as the Décomposer mode (engine/study.ts), without the start and the peak hold */
export type PointPhase = 'preparation' | 'execution' | 'retour';

export interface KeyPoint {
  zone: PointZone;
  text: string;
  phase?: PointPhase;
}

export interface TechniqueInstruction {
  main: string;
  points: KeyPoint[];
}

const P = (zone: PointZone, text: string, phase?: PointPhase): KeyPoint => ({ zone, text, phase });
const RETOUR = P('garde', 'Retour immédiat en garde', 'retour');

export const INSTRUCTIONS: Record<string, TechniqueInstruction> = {
  // ------------------------------------------------------------------ garde & déplacements
  garde: {
    main: 'Pieds décalés à largeur d’épaules, genoux souples, mains hautes et menton rentré.',
    points: [P('pieds', 'Pied avant rentré, talon arrière levé'), P('bassin', 'Poids réparti sur les deux jambes'), P('bras', 'Main arrière contre la joue, coudes serrés'), P('tete', 'Menton rentré, épaules relâchées')],
  },
  'pas-avant': {
    main: 'Le pied avant glisse en premier, le pied arrière suit de la même distance.',
    points: [P('pieds', 'Pied avant d’abord, pas courts et rasants', 'execution'), P('bassin', 'Le buste reste au-dessus des appuis'), P('pieds', 'Même écartement à l’arrivée', 'retour'), P('garde', 'Les mains ne bougent pas')],
  },
  'pas-arriere': {
    main: 'Le pied arrière recule en premier, le pied avant suit de la même distance.',
    points: [P('pieds', 'Pied arrière d’abord, sur l’avant des pieds', 'execution'), P('bassin', 'Ne pas se redresser en reculant'), P('pieds', 'Même écartement à l’arrivée', 'retour'), P('garde', 'Mains hautes, menton rentré')],
  },
  'pas-gauche': {
    main: 'Le pied gauche ouvre vers la gauche, le pied droit suit sans croiser.',
    points: [P('pieds', 'Le pied gauche part en premier', 'execution'), P('pieds', 'Les pieds ne se croisent jamais'), P('bassin', 'Le poids reste centré, épaules fixes'), P('garde', 'Garde intacte à l’arrivée', 'retour')],
  },
  'pas-droite': {
    main: 'Le pied droit ouvre vers la droite, le pied gauche suit sans croiser.',
    points: [P('pieds', 'Le pied droit part en premier', 'execution'), P('pieds', 'Les pieds ne se rapprochent pas'), P('bassin', 'Le poids reste centré, épaules fixes'), P('garde', 'Garde intacte à l’arrivée', 'retour')],
  },
  'pivot-droite': {
    main: 'Tourne sur l’avant du pied avant, le pied arrière décrit un arc.',
    points: [P('pieds', 'Axe sur l’avant du pied avant, sans glisser', 'execution'), P('bassin', 'Les hanches tournent avec le buste', 'execution'), P('garde', 'Mains hautes pendant la rotation'), P('garde', 'Fin du pivot face à la cible', 'retour')],
  },
  'pivot-gauche': {
    main: 'Tourne sur l’avant du pied avant dans l’autre sens pour reprendre l’angle.',
    points: [P('pieds', 'Axe sur l’avant du pied avant, sans glisser', 'execution'), P('bassin', 'Les hanches tournent avec le buste', 'execution'), P('garde', 'Rester en garde pendant la rotation'), P('garde', 'Fin du pivot face à la cible', 'retour')],
  },
  'sortie-angle': {
    main: 'Sors en diagonale avec le pied avant, puis pivote pour retrouver la cible.',
    points: [P('pieds', 'Pas du pied avant en diagonale avant', 'preparation'), P('pieds', 'Les pieds ne se croisent pas'), P('bassin', 'Pivot des hanches vers la cible', 'execution'), P('garde', 'Garde haute pendant la sortie', 'retour')],
  },

  // ------------------------------------------------------------------ poings
  jab: {
    main: 'Tends le bras avant dans l’axe, puis ramène immédiatement le poing en garde.',
    points: [P('garde', 'Garde opposée maintenue contre la joue'), P('bras', 'Épaule avant accompagne, menton caché', 'execution'), P('bras', 'Poignet aligné, poing tourné à l’impact', 'execution'), P('pieds', 'Appuis équilibrés, léger transfert avant', 'execution'), RETOUR],
  },
  direct: {
    main: 'Pivote le pied arrière et tends le bras arrière dans l’axe, puis reviens en garde.',
    points: [P('pieds', 'Talon arrière tourne vers l’extérieur', 'preparation'), P('bassin', 'La hanche arrière pousse vers l’avant', 'execution'), P('bras', 'Poing dans l’axe, poignet aligné', 'execution'), P('garde', 'Main avant devant le visage'), RETOUR],
  },
  'jab-corps': {
    main: 'Baisse ton niveau en pliant les genoux et lance le poing avant vers le plexus.',
    points: [P('pieds', 'Genoux fléchis, la tête descend', 'preparation'), P('bassin', 'Buste droit, sans se pencher'), P('bras', 'Poing en ligne droite vers le plexus', 'execution'), P('garde', 'Main arrière haute contre la joue'), P('garde', 'Remonte en garde en poussant', 'retour')],
  },
  'direct-corps': {
    main: 'Baisse ton niveau, pivote le pied arrière et frappe en ligne droite au plexus.',
    points: [P('pieds', 'Genoux fléchis, talon arrière qui pivote', 'preparation'), P('bassin', 'La hanche arrière tourne vers l’avant', 'execution'), P('bras', 'Poing un peu plus bas que l’épaule', 'execution'), P('garde', 'Main avant devant le visage'), P('garde', 'Remonte en garde après l’impact', 'retour')],
  },
  'crochet-avant': {
    main: 'Bras avant plié à 90°, pivote pied et hanches pour lancer un arc court.',
    points: [P('pieds', 'Pivot sur l’avant du pied avant', 'execution'), P('bassin', 'Hanches et épaules tournent ensemble', 'execution'), P('bras', 'Coude à hauteur du poing, bras à 90°', 'execution'), P('garde', 'Main arrière collée à la joue'), RETOUR],
  },
  'crochet-arriere': {
    main: 'Pivote le pied arrière et lance un arc court du bras arrière plié à 90°.',
    points: [P('pieds', 'Talon arrière tourne vers l’extérieur', 'preparation'), P('bassin', 'La hanche arrière tourne vers l’avant', 'execution'), P('bras', 'Coude levé, bras plié à 90°', 'execution'), P('garde', 'Main avant devant le visage'), RETOUR],
  },
  'crochet-avant-corps': {
    main: 'Genoux fléchis, coude bas, remonte le poing avant en arc vers les côtes.',
    points: [P('pieds', 'Genoux fléchis, pivot du pied avant', 'preparation'), P('bassin', 'Les hanches tournent vers l’intérieur', 'execution'), P('bras', 'Coude bas, avant-bras presque vertical', 'execution'), P('garde', 'Main arrière au visage, coude au flanc'), P('garde', 'Remonte en garde', 'retour')],
  },
  'crochet-arriere-corps': {
    main: 'Genoux fléchis, tête hors de l’axe, arc court du poing arrière vers les côtes.',
    points: [P('pieds', 'Genoux fléchis, talon arrière qui pivote', 'preparation'), P('bassin', 'La hanche arrière tourne vers l’avant', 'execution'), P('bras', 'Coude bas, arc court', 'execution'), P('tete', 'Tête décalée hors de la ligne centrale'), P('garde', 'Remonte en garde', 'retour')],
  },
  'uppercut-avant': {
    main: 'Fléchis le genou avant et fais monter le poing avant verticalement sous le menton.',
    points: [P('pieds', 'Poids sur la jambe avant, genou fléchi', 'preparation'), P('bras', 'Le poing descend à peine, paume vers toi', 'preparation'), P('bassin', 'Poussée de la jambe, hanche qui tourne', 'execution'), P('bras', 'Coude près du corps, bras plié', 'execution'), RETOUR],
  },
  'uppercut-arriere': {
    main: 'Pousse sur la jambe arrière et fais monter le poing arrière vers le menton.',
    points: [P('pieds', 'Genoux fléchis, pied arrière qui pivote', 'preparation'), P('bassin', 'La hanche arrière tourne vers l’avant', 'execution'), P('bras', 'Avant-bras vertical, coude vers le bas', 'execution'), P('garde', 'Main avant contre le visage'), RETOUR],
  },
  overhand: {
    main: 'Change de niveau, tête décalée, et fais passer le poing arrière en arc par-dessus.',
    points: [P('pieds', 'Genoux fléchis, pied arrière qui pivote', 'preparation'), P('bassin', 'Le poids passe sur la jambe avant', 'execution'), P('bras', 'Arc de haut en bas, par-dessus', 'execution'), P('tete', 'Menton derrière l’épaule arrière'), P('garde', 'Retour en garde sans rester penché', 'retour')],
  },

  // ------------------------------------------------------------------ défenses
  'esquive-droite': {
    main: 'Décale la tête d’une largeur vers l’extérieur, puis reviens au centre en garde.',
    points: [P('pieds', 'Les pieds restent en place'), P('bassin', 'Genou fléchi, épaules qui tournent', 'execution'), P('tete', 'Yeux sur l’adversaire', 'execution'), P('garde', 'Mains hautes, retour au centre', 'retour')],
  },
  'esquive-gauche': {
    main: 'Décale la tête d’une largeur vers l’intérieur, puis reviens au centre en garde.',
    points: [P('pieds', 'Les pieds restent en place'), P('bassin', 'Genou fléchi, épaules qui tournent', 'execution'), P('tete', 'Yeux sur l’adversaire', 'execution'), P('garde', 'Mains hautes, retour au centre', 'retour')],
  },
  'roll-droite': {
    main: 'Plie les genoux et trace un U avec la tête pour passer sous le crochet.',
    points: [P('pieds', 'Les genoux plient, les pieds restent', 'preparation'), P('bassin', 'Dos droit pendant le U', 'execution'), P('tete', 'La tête passe sous la trajectoire', 'execution'), P('garde', 'Mains contre le visage'), P('garde', 'Remonte en garde, prêt à contrer', 'retour')],
  },
  'roll-gauche': {
    main: 'Plie les genoux et trace un U avec la tête pour passer sous le crochet.',
    points: [P('pieds', 'Les genoux plient, les pieds restent', 'preparation'), P('bassin', 'Dos droit pendant le U', 'execution'), P('tete', 'La tête passe sous la trajectoire', 'execution'), P('garde', 'Mains contre le visage'), P('garde', 'Remonte en garde, prêt à contrer', 'retour')],
  },
  'blocage-haut': {
    main: 'Monte l’avant-bras contre la tête, coude vers l’avant, puis redescends en garde.',
    points: [P('pieds', 'Appuis stables, genoux souples'), P('bassin', 'Buste légèrement gainé', 'execution'), P('bras', 'Poing au-dessus du front, coude devant', 'execution'), P('tete', 'Menton rentré'), RETOUR],
  },
  'blocage-corps-avant': {
    main: 'Descends le coude contre les côtes en tournant un peu le buste, main au visage.',
    points: [P('pieds', 'Genoux légèrement fléchis'), P('bassin', 'Le buste tourne vers le côté attaqué', 'execution'), P('bras', 'Coude collé aux côtes', 'execution'), P('garde', 'La main reste près du visage'), RETOUR],
  },
  parade: {
    main: 'Dévie le jab de quelques centimètres avec la paume arrière, geste court.',
    points: [P('pieds', 'Appuis fixes, poids centré'), P('bassin', 'Le buste ne tourne pas'), P('bras', 'La main ne dépasse pas l’épaule avant', 'execution'), P('garde', 'Main ramenée aussitôt à la joue', 'retour')],
  },
  retrait: {
    main: 'Recule le buste sur la jambe arrière sans bouger les pieds, puis reviens.',
    points: [P('pieds', 'Les pieds ne bougent pas'), P('bassin', 'Poids sur la jambe arrière', 'execution'), P('tete', 'La tête sort juste de portée', 'execution'), P('garde', 'Mains hautes, retour en avant', 'retour')],
  },
  'check-avant': {
    main: 'Lève le genou avant vers le coude, tibia vertical, puis repose le pied.',
    points: [P('pieds', 'Pied d’appui planté, genou fléchi'), P('bassin', 'Poids sur la jambe arrière', 'preparation'), P('jambe', 'Genou vers le coude, tibia vertical', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Pied reposé à sa place de garde', 'retour')],
  },
  'check-arriere': {
    main: 'Lève le genou arrière vers l’extérieur, tibia vertical, puis repose le pied.',
    points: [P('pieds', 'Pied d’appui planté, genou fléchi'), P('bassin', 'Poids sur la jambe avant', 'preparation'), P('jambe', 'Genou vers l’extérieur, tibia vertical', 'execution'), P('garde', 'Mains hautes, buste droit'), P('garde', 'Pied reposé à sa place de garde', 'retour')],
  },

  // ------------------------------------------------------------------ pieds
  'front-kick-avant': {
    main: 'Monte le genou avant, pousse la hanche et frappe avec la plante du pied.',
    points: [P('pieds', 'Poids sur la jambe arrière', 'preparation'), P('jambe', 'Genou haut, pied fléchi', 'preparation'), P('bassin', 'La hanche pousse vers l’avant', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Réarme le genou, puis repose en garde', 'retour')],
  },
  'front-kick-arriere': {
    main: 'Monte le genou arrière, pousse la hanche et frappe avec la plante du pied.',
    points: [P('pieds', 'Poids sur la jambe avant', 'preparation'), P('jambe', 'Genou haut près de la jambe d’appui', 'preparation'), P('bassin', 'La hanche arrière pousse vers l’avant', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Réarme le genou, puis repose en garde', 'retour')],
  },
  'teep-avant': {
    main: 'Monte le genou avant et repousse avec la plante du pied en poussant la hanche.',
    points: [P('pieds', 'Poids sur la jambe arrière', 'preparation'), P('jambe', 'Genou vers la poitrine, pied fléchi', 'preparation'), P('bassin', 'Hanche vers l’avant, buste un peu en arrière', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Genou ramené, pied reposé devant', 'retour')],
  },
  'teep-arriere': {
    main: 'Monte le genou arrière et repousse avec la plante du pied en poussant la hanche.',
    points: [P('pieds', 'Poids sur la jambe avant', 'preparation'), P('jambe', 'Genou vers la poitrine', 'preparation'), P('bassin', 'La hanche arrière pousse vers l’avant', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Genou ramené, pied reposé derrière', 'retour')],
  },
  'low-kick-arriere': {
    main: 'Pivote sur le pied avant et frappe la cuisse avec le bas du tibia arrière.',
    points: [P('pieds', 'Pivot du pied d’appui, talon vers la cible', 'preparation'), P('bassin', 'Les hanches tournent avec la jambe', 'execution'), P('jambe', 'Frappe avec le tibia, mi-cuisse', 'execution'), P('garde', 'Main avant devant le visage'), P('garde', 'Retour par le même chemin, en garde', 'retour')],
  },
  'low-kick-avant': {
    main: 'Pivote sur le pied arrière et frappe la cuisse avec le tibia avant.',
    points: [P('pieds', 'Pivot sur l’avant du pied arrière', 'preparation'), P('bassin', 'Les hanches tournent avec la jambe', 'execution'), P('jambe', 'Frappe avec le tibia, en arc', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Jambe ramenée en garde', 'retour')],
  },
  'middle-kick-arriere': {
    main: 'Pivote sur le pied avant et monte le tibia arrière en arc jusqu’aux côtes.',
    points: [P('pieds', 'Pivot du pied d’appui, talon vers la cible', 'preparation'), P('bassin', 'Rotation complète des hanches', 'execution'), P('jambe', 'Jambe presque tendue, frappe du tibia', 'execution'), P('garde', 'Main avant protège le visage'), P('garde', 'Jambe reposée en garde', 'retour')],
  },
  'middle-kick-avant': {
    main: 'Pivote sur le pied arrière et monte le tibia avant en arc jusqu’aux côtes.',
    points: [P('pieds', 'Pivot sur l’avant du pied arrière', 'preparation'), P('bassin', 'Les hanches tournent avec la jambe', 'execution'), P('jambe', 'Frappe avec le tibia, hauteur des côtes', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Jambe reposée en garde', 'retour')],
  },
  'high-kick-arriere': {
    main: 'Pivote sur le pied avant, tourne les hanches et monte la jambe arrière vers la tête.',
    points: [P('pieds', 'Pivot du pied d’appui, genou fléchi', 'preparation'), P('bassin', 'Rotation complète des hanches', 'execution'), P('jambe', 'Monte sans dépasser ta souplesse', 'execution'), P('garde', 'Main avant devant le visage'), P('garde', 'Jambe ramenée, retour en garde', 'retour')],
  },
  'high-kick-avant': {
    main: 'Pivote sur le pied arrière, tourne les hanches et monte la jambe avant vers la tête.',
    points: [P('pieds', 'Pivot sur l’avant du pied arrière', 'preparation'), P('bassin', 'Hanches tournées', 'execution'), P('jambe', 'Monte sans dépasser ta souplesse', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Jambe ramenée, retour en garde', 'retour')],
  },
  'roundhouse-arriere': {
    main: 'Arme le genou arrière sur le côté, puis fouette et frappe avec le cou-de-pied.',
    points: [P('pieds', 'Pivot sur l’avant du pied avant', 'preparation'), P('jambe', 'Genou armé sur le côté, pied pointé', 'preparation'), P('bassin', 'La hanche tourne pour fouetter', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Réarme, puis repose derrière en garde', 'retour')],
  },
  'roundhouse-avant': {
    main: 'Arme le genou avant sur le côté, puis fouette et frappe avec le cou-de-pied.',
    points: [P('pieds', 'Pivot sur l’avant du pied arrière', 'preparation'), P('jambe', 'Genou armé sur le côté', 'preparation'), P('bassin', 'La hanche tourne pour fouetter', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Réarme, puis repose devant en garde', 'retour')],
  },

  // ------------------------------------------------------------------ genoux
  'genou-direct-arriere': {
    main: 'Pousse la hanche arrière et monte la pointe du genou vers l’avant et le haut.',
    points: [P('pieds', 'Sur l’avant du pied d’appui', 'preparation'), P('bassin', 'Hanche vers l’avant, buste un peu en arrière', 'execution'), P('jambe', 'Pied pointé vers le sol', 'execution'), P('garde', 'Mains hautes ou en saisie'), P('garde', 'Pied reposé derrière, en garde', 'retour')],
  },
  'genou-direct-avant': {
    main: 'Pousse la hanche avant et monte la pointe du genou vers l’avant et le haut.',
    points: [P('pieds', 'Poids sur la jambe arrière', 'preparation'), P('bassin', 'La hanche avant pousse vers l’avant', 'execution'), P('jambe', 'Frappe avec la pointe du genou', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Pied reposé devant, en garde', 'retour')],
  },
  'genou-circulaire-arriere': {
    main: 'Lève le genou arrière sur le côté et amène-le en arc vers les côtes.',
    points: [P('pieds', 'Pivot du pied d’appui', 'preparation'), P('jambe', 'Cuisse presque horizontale', 'preparation'), P('bassin', 'Les hanches tournent pour l’arc', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Pied reposé en garde', 'retour')],
  },
  'genou-circulaire-avant': {
    main: 'Lève le genou avant sur le côté et amène-le en arc vers les côtes.',
    points: [P('pieds', 'Poids sur la jambe arrière', 'preparation'), P('jambe', 'Genou levé sur le côté', 'preparation'), P('bassin', 'Les hanches tournent pour l’arc', 'execution'), P('garde', 'Mains hautes'), P('garde', 'Pied reposé devant, en garde', 'retour')],
  },

  // ------------------------------------------------------------------ coudes
  'coude-horizontal-avant': {
    main: 'Coude avant à hauteur d’épaule, pivote et fais-le passer à l’horizontale.',
    points: [P('pieds', 'Pivot sur l’avant du pied avant', 'execution'), P('bassin', 'Hanches et épaules tournent ensemble', 'execution'), P('bras', 'Coude à hauteur de la mâchoire', 'execution'), P('garde', 'Main arrière protège le visage'), RETOUR],
  },
  'coude-horizontal-arriere': {
    main: 'Coude arrière à hauteur d’épaule, pivote et fais-le traverser à l’horizontale.',
    points: [P('pieds', 'Pivot du pied arrière', 'preparation'), P('bassin', 'La hanche arrière tourne vers l’avant', 'execution'), P('bras', 'Coude à hauteur de la mâchoire', 'execution'), P('garde', 'Main avant protège le visage'), RETOUR],
  },
  'coude-diagonal-arriere': {
    main: 'Lève le coude arrière plus haut que la tête et descends-le en diagonale.',
    points: [P('pieds', 'Pivot du pied arrière', 'preparation'), P('bras', 'Coude plus haut que la tête', 'preparation'), P('bassin', 'Le poids passe sur la jambe avant', 'execution'), P('garde', 'Main avant devant le visage'), RETOUR],
  },
  'coude-diagonal-avant': {
    main: 'Lève le coude avant au-dessus de la tête et descends-le en diagonale.',
    points: [P('pieds', 'Pivot sur l’avant du pied avant', 'execution'), P('bras', 'Coude au-dessus de la tête', 'preparation'), P('bassin', 'Les hanches tournent avec le coude', 'execution'), P('garde', 'Main arrière protège le visage'), RETOUR],
  },
  'coude-montant-arriere': {
    main: 'Pousse sur la jambe arrière et monte le coude arrière verticalement vers le menton.',
    points: [P('pieds', 'Genoux légèrement fléchis', 'preparation'), P('bassin', 'Poussée de la jambe arrière', 'execution'), P('bras', 'Main près de l’oreille, coude vertical', 'execution'), P('garde', 'Main avant devant le visage'), RETOUR],
  },
  'coude-montant-avant': {
    main: 'Pousse sur les jambes et monte le coude avant verticalement vers le menton.',
    points: [P('pieds', 'Genoux légèrement fléchis', 'preparation'), P('bassin', 'Poussée des jambes vers le haut', 'execution'), P('bras', 'Pointe du coude vers le menton', 'execution'), P('garde', 'Main arrière devant le visage'), RETOUR],
  },

  // ------------------------------------------------------------------ clinch
  'clinch-tirage': {
    main: 'Mains derrière la tête imaginaire, coudes serrés, tire vers le bas et vers toi.',
    points: [P('pieds', 'Appuis larges et stables'), P('bassin', 'Hanches avancées, buste droit', 'execution'), P('bras', 'Coudes serrés devant toi', 'execution'), P('garde', 'Prêt à monter le genou', 'retour')],
  },
  'genou-clinch': {
    main: 'Tire vers le bas avec les mains et monte le genou arrière en poussant la hanche.',
    points: [P('pieds', 'Sur l’avant du pied d’appui', 'preparation'), P('bras', 'Les mains tirent vers le bas', 'preparation'), P('bassin', 'La hanche pousse vers l’avant', 'execution'), P('jambe', 'Frappe avec la pointe du genou', 'execution'), P('garde', 'Pied reposé, saisie gardée', 'retour')],
  },
  'genou-circulaire-clinch': {
    main: 'Tourne le buste pour décaler l’adversaire et monte le genou en arc vers les côtes.',
    points: [P('pieds', 'Pivot du pied d’appui', 'preparation'), P('bras', 'Les mains décalent la tête imaginaire', 'preparation'), P('bassin', 'Les hanches tournent pour l’arc', 'execution'), P('jambe', 'Genou sur le côté', 'execution'), P('garde', 'Pied reposé, saisie gardée', 'retour')],
  },

  // ------------------------------------------------------------------ feintes
  'feinte-jab': {
    main: 'Avance l’épaule et la main avant de quelques centimètres, sans aller au bout.',
    points: [P('pieds', 'Petit appui ou petit pas avant', 'execution'), P('bassin', 'Léger transfert vers l’avant', 'execution'), P('bras', 'Arrêt avant l’extension', 'execution'), P('garde', 'Retour en garde, vrai coup aussitôt', 'retour')],
  },
  'feinte-epaule': {
    main: 'Donne un petit mouvement sec de l’épaule arrière vers l’avant, sans lancer le poing.',
    points: [P('pieds', 'Appuis fixes'), P('bassin', 'Amorce de rotation de la hanche', 'execution'), P('bras', 'Les poings ne partent pas', 'execution'), P('garde', 'Mains hautes, coup prévu aussitôt', 'retour')],
  },
  'feinte-lutte': {
    main: 'Baisse brièvement ton niveau comme pour entrer en lutte, puis remonte et frappe.',
    points: [P('pieds', 'Genoux pliés, pieds en place', 'execution'), P('bassin', 'Dos droit pendant la descente', 'execution'), P('bras', 'Mains hautes, coudes serrés'), P('garde', 'Remonte aussitôt en garde', 'retour')],
  },

  // ------------------------------------------------------------------ lutte & sol (MMA)
  'changement-niveau': {
    main: 'Plie genoux et hanches pour descendre, dos droit et tête haute, puis remonte.',
    points: [P('pieds', 'Pied avant qui avance un peu', 'execution'), P('bassin', 'Les hanches descendent, dos droit', 'execution'), P('bras', 'Mains à la poitrine, coudes serrés'), P('tete', 'Tête haute'), P('garde', 'Remonte en poussant sur les jambes', 'retour')],
  },
  'entree-lutte': {
    main: 'Change de niveau, pas pénétrant du pied avant, bras autour des cuisses imaginaires.',
    points: [P('pieds', 'Grand pas pénétrant du pied avant', 'execution'), P('bassin', 'Genou arrière vers le sol, dos droit', 'execution'), P('bras', 'Les bras entourent les cuisses', 'execution'), P('tete', 'Tête haute, sur le côté'), P('garde', 'En solo, retour en garde', 'retour')],
  },
  sprawl: {
    main: 'Lance les deux jambes en arrière et écrase les hanches vers le sol, tête haute.',
    points: [P('pieds', 'Jambes lancées loin derrière', 'execution'), P('bassin', 'Hanches écrasées vers le sol', 'execution'), P('bras', 'Mains vers le sol devant toi', 'execution'), P('tete', 'Tête haute'), P('garde', 'Pieds ramenés, remonte vite en garde', 'retour')],
  },
  'defense-lutte': {
    main: 'Baisse les hanches, avant-bras en cadre devant toi, recule le pied arrière.',
    points: [P('pieds', 'Le pied arrière recule', 'execution'), P('bassin', 'Hanches un peu plus basses', 'execution'), P('bras', 'Avant-bras devant, coudes vers l’intérieur', 'execution'), P('garde', 'Retour en garde', 'retour')],
  },
  'descente-sol': {
    main: 'Recule le pied arrière, main au sol derrière toi, et descends sur la hanche.',
    points: [P('pieds', 'Le pied arrière recule', 'preparation'), P('bras', 'Main arrière au sol derrière toi', 'execution'), P('bassin', 'Descente contrôlée sur la hanche', 'execution'), P('jambe', 'Jambes entre toi et l’adversaire'), P('garde', 'Main libre devant le visage')],
  },
  'sortie-hanche': {
    main: 'Pousse sur un pied, soulève les hanches et décale-les en arrière sur le côté.',
    points: [P('pieds', 'Pieds posés, genoux pliés', 'preparation'), P('bassin', 'Hanches soulevées puis décalées', 'execution'), P('bras', 'Mains en cadre devant toi', 'execution'), P('garde', 'Retour en position de départ', 'retour')],
  },
  'releve-technique': {
    main: 'Appui main arrière et pied avant, soulève les hanches et passe la jambe derrière.',
    points: [P('pieds', 'Pied avant à plat devant toi', 'preparation'), P('bassin', 'Hanches soulevées sur la main', 'execution'), P('jambe', 'Jambe libre loin derrière', 'execution'), P('garde', 'Main libre devant le visage'), P('garde', 'Garde debout, en reculant si besoin', 'retour')],
  },
};

/** the instruction of a technique; falls back on its description and key points if missing */
export function instructionOf(t: { id: string; description: string; keyPoints: string[] }): TechniqueInstruction {
  return INSTRUCTIONS[t.id] ?? { main: t.description, points: t.keyPoints.map((text) => ({ zone: 'garde' as const, text })) };
}
