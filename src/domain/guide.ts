/**
 * Step-by-step execution sheet for every technique, written for an orthodox guard
 * (left foot forward). In gaucher guard, swap left and right.
 */
export interface TechniqueGuide {
  /** what to do, in order, from the guard back to the guard */
  steps: string[];
  /** frequent mistakes to avoid */
  errors: string[];
  /** when to breathe out */
  breath?: string;
}

const EXPIRE_IMPACT = 'Souffle court par le nez ou la bouche au moment de l’impact, un petit « tss ».';

export const GUIDES: Record<string, TechniqueGuide> = {
  // ------------------------------------------------------------------ garde & déplacements
  garde: {
    steps: [
      'Pied gauche devant, pied droit derrière, écartés de la largeur des épaules, comme sur deux rails parallèles.',
      'Pied avant un peu tourné vers l’intérieur (environ 30°), pied arrière à 45°, talon arrière légèrement décollé.',
      'Genoux un peu pliés, poids à 50/50 sur l’avant des deux pieds.',
      'Main droite contre la joue droite, poing fermé sans serrer, coude collé aux côtes.',
      'Main gauche devant, à hauteur du menton, à 15 ou 20 cm du visage.',
      'Rentre le menton, monte un peu l’épaule gauche et regarde devant toi entre tes gants.',
      'Relâche les épaules et respire : tu dois tenir cette garde plusieurs minutes.',
    ],
    errors: ['Pieds sur une même ligne (une petite poussée de côté et tu vacilles)', 'Menton levé', 'Coudes écartés qui ouvrent le corps', 'Jambes tendues'],
    breath: 'Respiration lente et régulière par le nez.',
  },
  'pas-avant': {
    steps: [
      'Pars de la garde.',
      'Pousse du pied arrière et glisse le pied avant de 15 à 20 cm.',
      'Ramène aussitôt le pied arrière de la même distance : tu retrouves ton écart de départ.',
      'Pieds rasants, mains immobiles. Tu glisses, tu ne marches pas.',
    ],
    errors: ['Avancer le pied arrière en premier', 'Croiser ou rapprocher les pieds', 'Sauter au lieu de glisser', 'Baisser la garde en avançant'],
  },
  'pas-arriere': {
    steps: [
      'Pars de la garde.',
      'Pousse du pied avant et recule le pied arrière de 15 à 20 cm.',
      'Ramène le pied avant de la même distance.',
      'Le buste reste un peu penché vers l’avant, menton rentré.',
    ],
    errors: ['Reculer le pied avant en premier', 'Se redresser ou partir en arrière avec le buste', 'Reculer sur les talons'],
  },
  'pas-gauche': {
    steps: [
      'Pars de la garde.',
      'Pousse du pied droit et déplace le pied gauche d’environ 15 cm à gauche.',
      'Le pied droit suit, même distance.',
      'À l’arrivée, même écart et même orientation qu’au départ.',
    ],
    errors: ['Faire partir le pied droit en premier (les pieds se croisent)', 'Faire de grands pas qui déséquilibrent', 'Tourner les épaules'],
  },
  'pas-droite': {
    steps: [
      'Pars de la garde.',
      'Pousse du pied gauche et déplace le pied droit d’environ 15 cm à droite.',
      'Le pied gauche suit, même distance.',
      'Ta garde arrive intacte, mains hautes.',
    ],
    errors: ['Faire partir le pied gauche en premier', 'Ramener les pieds l’un contre l’autre', 'Baisser la main droite'],
  },
  'pivot-droite': {
    steps: [
      'Pars de la garde, le poids un peu sur la jambe avant.',
      'Reste sur l’avant du pied gauche : c’est ton axe, comme la pointe d’un compas.',
      'Le pied droit tourne en arc vers la droite, environ un quart de tour.',
      'Le buste suit les hanches : nouvel angle, toujours en garde.',
    ],
    errors: ['Pivoter sur le talon avant', 'Lever le pied avant', 'Ouvrir la garde pendant la rotation'],
  },
  'pivot-gauche': {
    steps: [
      'Pars de la garde.',
      'Appuie-toi sur l’avant du pied gauche.',
      'Fais tourner le pied droit en arc vers la gauche pour pivoter vers l’extérieur.',
      'Tu finis face au nouvel angle, mains hautes.',
    ],
    errors: ['Pivoter sur le talon', 'Croiser les jambes', 'Regarder le sol'],
  },
  'sortie-angle': {
    steps: [
      'Pars de la garde.',
      'Fais un pas du pied gauche en diagonale, vers l’avant gauche.',
      'Pivote aussitôt sur l’avant du pied gauche en ramenant le pied droit.',
      'Te voilà sur le côté de l’adversaire imaginaire, prêt à frapper. Lui regarde encore où tu étais.',
    ],
    errors: ['Sortir en ligne droite vers l’arrière', 'Rester face à la ligne d’attaque', 'Faire un pas trop long qui écarte les pieds'],
  },

  // ------------------------------------------------------------------ poings
  jab: {
    steps: [
      'Pars de la garde, menton rentré.',
      'Lance le poing gauche tout droit vers le menton imaginaire, sans reculer la main pour prendre de l’élan.',
      'En chemin, le poing tourne pour finir paume vers le sol. Tu frappes avec les deux premières phalanges.',
      'L’épaule gauche monte protéger le menton, la main droite reste collée à la joue.',
      'Petit transfert du poids sur la jambe avant, le pied avant peut avancer de quelques centimètres.',
      'Ramène le poing par le même chemin, aussi vite qu’à l’aller. Un élastique.',
    ],
    errors: ['Baisser la main avant de frapper (l’adversaire voit le coup venir)', 'Bras complètement verrouillé', 'Lever le menton', 'Laisser tomber la main droite', 'Revenir en arc de cercle'],
    breath: EXPIRE_IMPACT,
  },
  direct: {
    steps: [
      'Pars de la garde.',
      'Pousse sur l’avant du pied droit et fais pivoter le talon droit vers l’extérieur, comme si tu écrasais un mégot.',
      'Tourne la hanche droite puis l’épaule droite vers l’avant : la rotation part du sol.',
      'Lance le poing droit tout droit vers le menton, paume vers le sol à l’impact.',
      'Le poids passe sur la jambe avant, menton caché derrière l’épaule droite, main gauche devant le visage.',
      'Ramène le poing droit contre la joue et replace le talon arrière.',
    ],
    errors: ['Frapper seulement avec le bras, sans tourner la hanche', 'Pied arrière à plat qui bloque la rotation', 'Pencher la tête au-delà du genou avant', 'Baisser la main gauche'],
    breath: EXPIRE_IMPACT,
  },
  'jab-corps': {
    steps: [
      'Plie les genoux pour descendre : la tête baisse, le buste reste droit. L’ascenseur, pas la révérence.',
      'Lance le poing gauche tout droit vers le plexus ou l’estomac.',
      'La main droite reste haute contre la joue, le menton derrière l’épaule gauche.',
      'Ramène le poing et remonte en garde en poussant sur les jambes.',
    ],
    errors: ['Se pencher en avant au lieu de plier les genoux', 'Baisser les yeux vers la cible', 'Laisser tomber la main droite'],
    breath: EXPIRE_IMPACT,
  },
  'direct-corps': {
    steps: [
      'Descends en pliant les genoux.',
      'Pivote le pied et la hanche droite, comme pour le direct.',
      'Frappe tout droit vers le plexus, le poing un peu plus bas que l’épaule.',
      'La main gauche reste devant le visage. Après l’impact, remonte en garde.',
    ],
    errors: ['Plonger la tête vers l’avant', 'Oublier la rotation de la hanche', 'Rester bas après le coup'],
    breath: EXPIRE_IMPACT,
  },
  'crochet-avant': {
    steps: [
      'Pars de la garde, le poids un peu sur la jambe avant.',
      'Lève le coude gauche à hauteur du poing : avant-bras à l’horizontale, bras plié à environ 90°.',
      'Pivote sur l’avant du pied gauche, talon vers l’extérieur, et tourne hanches et épaules vers la droite.',
      'Le poing trace un arc court vers la mâchoire, paume vers le sol ou vers toi.',
      'La main droite reste collée à la joue droite, menton rentré.',
      'Reviens en garde par le même arc, en replaçant le pied avant.',
    ],
    errors: ['Armer le bras en arrière', 'Coude trop bas (le coup remonte)', 'Bras trop tendu, crochet trop large', 'Tourner sans pivoter le pied avant'],
    breath: EXPIRE_IMPACT,
  },
  'crochet-arriere': {
    steps: [
      'Pars de la garde.',
      'Pivote sur l’avant du pied droit, talon vers l’extérieur, hanche droite vers l’avant.',
      'Lève le coude droit à hauteur du poing, bras plié à 90°.',
      'Le poing droit trace un arc court vers la mâchoire, le poids passe sur la jambe avant.',
      'La main gauche reste devant le visage.',
      'Reviens en garde, main droite contre la joue.',
    ],
    errors: ['Arc trop large qui ouvre la garde', 'Rester sur le talon arrière', 'Laisser tomber la main gauche'],
    breath: EXPIRE_IMPACT,
  },
  'crochet-avant-corps': {
    steps: [
      'Plie les genoux et décale un peu le buste vers la gauche.',
      'Coude gauche bas, bras plié, avant-bras presque vertical.',
      'Pivote le pied avant et les hanches vers la droite : le poing remonte vers le foie ou les côtes.',
      'La main droite protège le visage, le coude droit protège le flanc. Puis remonte en garde.',
    ],
    errors: ['Se pencher sans plier les genoux', 'Frapper avec le bras seul', 'Laisser la tête au centre, exposée'],
    breath: EXPIRE_IMPACT,
  },
  'crochet-arriere-corps': {
    steps: [
      'Plie les genoux et décale la tête vers la gauche, hors de la ligne du milieu.',
      'Pivote le pied droit et la hanche droite vers l’avant.',
      'Frappe en arc court vers les côtes avec le poing droit, coude bas.',
      'La main gauche protège le visage, puis remonte en garde.',
    ],
    errors: ['Coude trop écarté', 'Tête au centre', 'Rester bas après le coup'],
    breath: EXPIRE_IMPACT,
  },
  'uppercut-avant': {
    steps: [
      'Pars de la garde, un peu de poids sur la jambe avant, genou gauche plié.',
      'Laisse le poing gauche descendre de quelques centimètres seulement, paume vers toi.',
      'Pousse sur la jambe gauche et tourne un peu la hanche gauche vers la droite.',
      'Le poing monte à la verticale sous le menton imaginaire, coude près du corps, bras plié.',
      'Reviens tout de suite en garde.',
    ],
    errors: ['Baisser trop la main (le coup se voit venir)', 'Bras tendu, coup qui part loin devant', 'Sauter au lieu de pousser sur les jambes'],
    breath: EXPIRE_IMPACT,
  },
  'uppercut-arriere': {
    steps: [
      'Plie un peu les genoux, le poids légèrement sur la jambe droite.',
      'Laisse le poing droit descendre à hauteur de poitrine, paume vers toi.',
      'Pousse sur la jambe droite et pivote le pied droit : la hanche droite tourne vers l’avant.',
      'Le poing remonte à la verticale jusqu’au menton, coude vers le bas, avant-bras vertical.',
      'La main gauche reste contre le visage. Ramène le poing droit contre la joue.',
    ],
    errors: ['Armer en baissant l’épaule', 'Coude qui s’écarte', 'Lever la tête en frappant'],
    breath: EXPIRE_IMPACT,
  },
  overhand: {
    steps: [
      'Plie les genoux et décale la tête vers la gauche : c’est un petit changement de niveau.',
      'Pivote le pied droit et la hanche droite.',
      'Le poing droit passe en arc de haut en bas, comme pour enjamber une garde.',
      'Le poids passe franchement sur la jambe avant, menton derrière l’épaule droite.',
      'Reviens en garde sans rester penché vers l’avant.',
    ],
    errors: ['Arc trop large qui part derrière la tête', 'Tomber vers l’avant', 'Garder la tête dans l’axe'],
    breath: EXPIRE_IMPACT,
  },

  // ------------------------------------------------------------------ défenses
  'esquive-droite': {
    steps: [
      'Pars de la garde.',
      'Tourne un peu les épaules vers la gauche et plie légèrement le genou droit.',
      'Ta tête se décale d’environ une largeur de tête vers la droite, à l’extérieur du jab imaginaire, qui frôle ton oreille.',
      'Tes yeux restent sur l’adversaire, tes mains restent hautes.',
      'Reviens au centre en garde, prêt à contrer.',
    ],
    errors: ['Se pencher à partir de la taille', 'Baisser les mains', 'Esquive trop grande qui fait perdre l’équilibre'],
  },
  'esquive-gauche': {
    steps: [
      'Pars de la garde.',
      'Tourne un peu les épaules vers la droite et plie légèrement le genou gauche.',
      'Ta tête se décale vers la gauche, à l’intérieur, hors de la ligne du direct.',
      'Mains hautes, yeux devant, puis reviens au centre.',
    ],
    errors: ['Regarder le sol', 'Pencher le buste vers l’avant', 'Rester décalé trop longtemps'],
  },
  'roll-droite': {
    steps: [
      'Pars de la garde.',
      'Plie les genoux pour passer sous un crochet gauche imaginaire.',
      'Dessine un U avec la tête : tu descends, tu passes de gauche à droite sous le coup, tu remontes à droite.',
      'Le dos reste droit, les mains restent hautes contre le visage.',
      'Remonte en garde, prêt à contrer avec la main gauche.',
    ],
    errors: ['Se pencher en avant au lieu de plier les genoux', 'Baisser les mains', 'Mouvement trop lent ou trop ample'],
  },
  'roll-gauche': {
    steps: [
      'Plie les genoux pour passer sous un crochet droit imaginaire.',
      'Dessine un U avec la tête, de droite à gauche.',
      'Dos droit, mains hautes.',
      'Remonte en garde, prêt à contrer avec la main droite.',
    ],
    errors: ['Courber le dos', 'Regarder le sol', 'Remonter trop tard'],
  },
  'blocage-haut': {
    steps: [
      'Pars de la garde.',
      'Monte l’avant-bras du côté attaqué contre la tête, coude vers l’avant, poing au-dessus du front.',
      'Rentre le menton et contracte un peu le buste pour encaisser.',
      'L’autre main reste en garde. Redescends en garde aussitôt.',
    ],
    errors: ['Fermer les yeux', 'Ouvrir le coude sur le côté', 'Rester coincé en défense sans riposter'],
  },
  'blocage-corps-avant': {
    steps: [
      'Pars de la garde.',
      'Descends le coude contre les côtes du côté attaqué, buste un peu tourné vers ce côté.',
      'Plie légèrement les genoux pour que le coude couvre le foie ou l’estomac.',
      'La main reste près du visage, puis reviens en garde.',
    ],
    errors: ['Baisser la main jusqu’à la ceinture', 'Écarter le coude du corps', 'Se pencher en avant'],
  },
  parade: {
    steps: [
      'Pars de la garde.',
      'Avec la paume droite, dévie le jab imaginaire de quelques centimètres vers l’intérieur. Une tape, pas une gifle.',
      'Le geste reste court : la main ne dépasse pas l’épaule gauche.',
      'Ramène tout de suite la main contre la joue.',
    ],
    errors: ['Geste trop large qui ouvre le visage', 'Aller chercher le coup loin devant', 'Oublier de revenir en garde'],
  },
  retrait: {
    steps: [
      'Pars de la garde.',
      'Poids sur la jambe arrière, buste un peu reculé, pieds immobiles.',
      'Ta tête recule juste hors de portée, mains hautes.',
      'Reviens en poussant sur la jambe arrière, souvent avec un contre.',
    ],
    errors: ['Pencher la tête en arrière en levant le menton', 'Reculer le buste au-delà du pied arrière', 'Baisser les mains'],
  },
  'check-avant': {
    steps: [
      'Pars de la garde, le poids un peu sur la jambe arrière.',
      'Lève le genou gauche vers l’extérieur et vers le haut, tibia vertical, pied fléchi.',
      'Le genou rejoint le coude gauche pour fermer l’espace, mains hautes.',
      'Le pied d’appui reste bien planté, genou un peu fléchi.',
      'Repose le pied à sa place de garde.',
    ],
    errors: ['Lever la jambe droit devant au lieu de vers l’extérieur', 'Pied tendu (c’est la cheville qui encaisse)', 'Baisser les mains', 'Se pencher en arrière'],
  },
  'check-arriere': {
    steps: [
      'Pars de la garde, le poids sur la jambe avant.',
      'Lève le genou droit vers l’extérieur et vers le haut, tibia vertical.',
      'Mains hautes, buste droit.',
      'Repose le pied droit à sa place.',
    ],
    errors: ['Perdre l’équilibre vers l’arrière', 'Tibia incliné', 'Garde ouverte'],
  },

  // ------------------------------------------------------------------ pieds
  'front-kick-avant': {
    steps: [
      'Pars de la garde et mets le poids sur la jambe arrière.',
      'Monte le genou gauche bien haut devant toi, pied fléchi : c’est l’armé.',
      'Pousse la hanche et déplie la jambe : frappe de la plante, orteils relevés.',
      'Le pied d’appui reste à plat ou sur l’avant du pied, mains hautes.',
      'Ramène le genou (le réarmé), puis repose le pied en garde.',
    ],
    errors: ['Lancer la jambe sans monter le genou', 'Frapper avec les orteils', 'Pencher le buste loin en arrière', 'Reposer le pied trop loin'],
    breath: EXPIRE_IMPACT,
  },
  'front-kick-arriere': {
    steps: [
      'Mets le poids sur la jambe avant.',
      'Monte le genou droit bien haut devant toi, en le faisant passer près de la jambe d’appui.',
      'Pousse la hanche droite et déplie la jambe : frappe de la plante du pied.',
      'Ramène le genou et repose le pied derrière, en garde.',
    ],
    errors: ['Armé trop bas', 'Buste qui part en arrière', 'Mains qui descendent'],
    breath: EXPIRE_IMPACT,
  },
  'teep-avant': {
    steps: [
      'Pars de la garde, le poids sur la jambe arrière.',
      'Monte le genou gauche vers la poitrine, pied fléchi.',
      'Pousse la hanche vers l’avant en dépliant la jambe : la plante du pied repousse l’estomac imaginaire.',
      'Le buste part très légèrement en arrière pour l’équilibre, mains hautes.',
      'Ramène le genou et repose le pied devant, en garde.',
    ],
    errors: ['Coup de pied qui monte au lieu de pousser', 'Oublier de pousser la hanche', 'Garde baissée', 'Reposer le pied à plat sans contrôle'],
    breath: EXPIRE_IMPACT,
  },
  'teep-arriere': {
    steps: [
      'Mets le poids sur la jambe avant.',
      'Monte le genou droit vers la poitrine.',
      'Pousse la hanche droite vers l’avant en dépliant la jambe, et frappe avec la plante du pied.',
      'Ramène le genou et repose le pied derrière.',
    ],
    errors: ['Jambe qui part sans armé', 'Pied d’appui qui ne pivote pas un peu', 'Se pencher trop en arrière'],
    breath: EXPIRE_IMPACT,
  },
  'low-kick-arriere': {
    steps: [
      'Pars de la garde. Option : petit pas du pied gauche vers l’extérieur pour ouvrir l’angle.',
      'Pivote sur l’avant du pied gauche, talon vers la cible, de 70 à 90° environ.',
      'Tourne les hanches et laisse la jambe droite partir en arc, genou légèrement fléchi.',
      'Frappe la cuisse imaginaire avec le milieu du tibia, à mi-hauteur de cuisse.',
      'Bras droit le long du corps pour l’équilibre, main gauche devant le visage.',
      'Ramène la jambe par le même chemin et repose-la en garde.',
    ],
    errors: ['Frapper avec le pied au lieu du tibia', 'Pied d’appui qui ne pivote pas (le genou se tord)', 'Garde qui tombe', 'Coup qui monte au lieu de traverser'],
    breath: EXPIRE_IMPACT,
  },
  'low-kick-avant': {
    steps: [
      'Pars de la garde. Si besoin, petit pas de recul du pied gauche ou changement de garde rapide.',
      'Pivote sur l’avant du pied droit.',
      'La jambe gauche part en arc et frappe avec le tibia, à l’intérieur ou à l’extérieur de la cuisse.',
      'Mains hautes, puis ramène la jambe en garde.',
    ],
    errors: ['Oublier de pivoter le pied arrière', 'Frapper avec le pied', 'Rester déséquilibré après le coup'],
    breath: EXPIRE_IMPACT,
  },
  'middle-kick-arriere': {
    steps: [
      'Pars de la garde. Option : petit pas du pied gauche vers l’extérieur.',
      'Pivote sur l’avant du pied gauche jusqu’à ce que le talon pointe vers la cible.',
      'Hanches à fond : la jambe droite monte en arc, presque tendue, à hauteur des côtes.',
      'Frappe avec le tibia sur les côtes ou le bras de l’adversaire imaginaire.',
      'Bras droit qui balance en arrière pour l’équilibre, main gauche devant le visage.',
      'En muay-thaï, la jambe traverse puis revient ; en kick-boxing, elle se replie. Puis repose-la en garde.',
    ],
    errors: ['Hanches qui ne tournent pas (coup sans puissance)', 'Talon d’appui qui reste face à la cible', 'Frapper avec le pied', 'Se pencher très loin en arrière'],
    breath: EXPIRE_IMPACT,
  },
  'middle-kick-avant': {
    steps: [
      'Petit changement de garde ou pas de recul du pied gauche pour l’élan.',
      'Pivote sur l’avant du pied droit.',
      'La jambe gauche monte en arc à hauteur des côtes et frappe avec le tibia.',
      'Mains hautes, puis repose la jambe en garde.',
    ],
    errors: ['Pas d’élan, coup trop léger', 'Pied d’appui à plat', 'Garde ouverte'],
    breath: EXPIRE_IMPACT,
  },
  'high-kick-arriere': {
    steps: [
      'Pars de la garde et ouvre d’un petit pas du pied gauche vers l’extérieur.',
      'Pivote sur l’avant du pied gauche, talon vers la cible, genou d’appui légèrement fléchi.',
      'Tourne complètement les hanches : la jambe droite monte en arc jusqu’à la tête.',
      'Frappe avec le bas du tibia ou le cou-de-pied sur le côté de la tête.',
      'La main gauche reste devant le visage. Ramène la jambe et reviens en garde.',
    ],
    errors: ['Monter la jambe sans tourner les hanches', 'Jambe d’appui tendue et bloquée', 'Pencher trop le buste sur le côté', 'Viser trop haut sans la souplesse (travaille d’abord le middle)'],
    breath: EXPIRE_IMPACT,
  },
  'high-kick-avant': {
    steps: [
      'Fais un changement de garde rapide ou un pas de recul du pied gauche.',
      'Pivote sur l’avant du pied droit.',
      'La jambe gauche monte en arc vers la tête, hanches tournées.',
      'Frappe avec le tibia ou le cou-de-pied, puis reviens en garde.',
    ],
    errors: ['Oublier le pivot', 'Garde basse', 'Hanches pas assez échauffées'],
    breath: EXPIRE_IMPACT,
  },
  'roundhouse-arriere': {
    steps: [
      'Pars de la garde.',
      'Pivote sur l’avant du pied gauche.',
      'Monte le genou droit sur le côté, pied pointé : c’est l’armé.',
      'Déplie la jambe d’un coup de fouet et frappe avec le cou-de-pied.',
      'Replie la jambe (le réarmé) et repose-la derrière, en garde.',
    ],
    errors: ['Oublier l’armé du genou', 'Ne pas replier la jambe après l’impact', 'Pivot insuffisant'],
    breath: EXPIRE_IMPACT,
  },
  'roundhouse-avant': {
    steps: [
      'Mets le poids sur la jambe arrière.',
      'Monte le genou gauche sur le côté en pivotant sur l’avant du pied droit.',
      'Fouette avec la jambe gauche et frappe avec le cou-de-pied.',
      'Replie la jambe et repose-la devant.',
    ],
    errors: ['Coup sans armé', 'Garde qui tombe', 'Reposer le pied trop loin'],
    breath: EXPIRE_IMPACT,
  },

  // ------------------------------------------------------------------ genoux
  'genou-direct-arriere': {
    steps: [
      'Pars de la garde. En muay-thaï, les mains peuvent avancer comme pour saisir la nuque.',
      'Monte sur l’avant du pied gauche, ton pied d’appui.',
      'Pousse la hanche droite vers l’avant et monte le genou droit, pied pointé vers le sol.',
      'Frappe vers l’avant et vers le haut avec la pointe du genou, buste un peu en arrière.',
      'Repose le pied derrière, en garde.',
    ],
    errors: ['Monter le genou sans pousser la hanche', 'Se pencher vers l’avant', 'Pied fléchi vers le haut'],
    breath: EXPIRE_IMPACT,
  },
  'genou-direct-avant': {
    steps: [
      'Fais un petit changement de pieds ou un pas pour prendre de l’élan.',
      'Monte le genou gauche en poussant la hanche gauche vers l’avant.',
      'Frappe avec la pointe du genou, mains hautes.',
      'Repose le pied devant, en garde.',
    ],
    errors: ['Oublier de pousser la hanche', 'Garde ouverte', 'Perte d’équilibre'],
    breath: EXPIRE_IMPACT,
  },
  'genou-circulaire-arriere': {
    steps: [
      'Pars de la garde et monte sur l’avant du pied gauche.',
      'Lève le genou droit sur le côté, cuisse presque à l’horizontale.',
      'Tourne les hanches : le genou arrive en arc sur les côtes imaginaires.',
      'Repose le pied en garde.',
    ],
    errors: ['Pied d’appui qui ne pivote pas', 'Mouvement lancé par le pied au lieu de la hanche', 'Mains basses'],
    breath: EXPIRE_IMPACT,
  },
  'genou-circulaire-avant': {
    steps: [
      'Mets le poids sur la jambe arrière.',
      'Lève le genou gauche sur le côté.',
      'Tourne les hanches pour l’amener en arc vers les côtes.',
      'Repose le pied devant.',
    ],
    errors: ['Hanches bloquées', 'Buste penché', 'Garde basse'],
    breath: EXPIRE_IMPACT,
  },

  // ------------------------------------------------------------------ coudes
  'coude-horizontal-avant': {
    steps: [
      'Pars de la garde, tout près de la cible.',
      'Lève le coude gauche à hauteur d’épaule, main près de l’oreille ou de la poitrine.',
      'Pivote sur l’avant du pied gauche et tourne hanches et épaules vers la droite.',
      'Le coude passe à l’horizontale à hauteur de la mâchoire : frappe avec la pointe ou l’avant-bras près du coude.',
      'La main droite protège le visage, puis reviens en garde.',
    ],
    errors: ['Coude qui part en arc trop large', 'Frapper avec le bras sans tourner le corps', 'Main droite qui descend'],
    breath: EXPIRE_IMPACT,
  },
  'coude-horizontal-arriere': {
    steps: [
      'Pars de la garde, tout près de la cible.',
      'Lève le coude droit à hauteur d’épaule.',
      'Pivote le pied droit et tourne la hanche droite vers l’avant.',
      'Le coude traverse à l’horizontale à hauteur de la mâchoire, main gauche en protection.',
      'Reviens en garde.',
    ],
    errors: ['Armer en reculant le coude', 'Talon arrière qui ne tourne pas', 'Tête qui avance trop'],
    breath: EXPIRE_IMPACT,
  },
  'coude-diagonal-arriere': {
    steps: [
      'Lève le coude droit plus haut que la tête.',
      'Pivote le pied droit et redescends le coude en diagonale vers le sourcil ou la pommette imaginaire, comme une hache.',
      'Le poids passe sur la jambe avant, la main gauche reste devant le visage.',
      'Reviens en garde.',
    ],
    errors: ['Frapper en tombant vers l’avant', 'Garde gauche qui descend', 'Coude trop loin du corps'],
    breath: EXPIRE_IMPACT,
  },
  'coude-diagonal-avant': {
    steps: [
      'Lève le coude gauche au-dessus de la tête.',
      'Pivote sur l’avant du pied gauche et redescends le coude en diagonale.',
      'La main droite protège le visage, puis reviens en garde.',
    ],
    errors: ['Oublier de tourner le corps', 'Main droite basse', 'Perte d’équilibre'],
    breath: EXPIRE_IMPACT,
  },
  'coude-montant-arriere': {
    steps: [
      'Plie un peu les genoux.',
      'Pousse sur la jambe droite et monte le coude droit à la verticale devant ton visage, comme un uppercut tout court.',
      'La pointe du coude vise le menton imaginaire, la main droite passe près de l’oreille.',
      'Redescends en garde.',
    ],
    errors: ['Coude qui part sur le côté', 'Lever la tête', 'Main gauche qui descend'],
    breath: EXPIRE_IMPACT,
  },
  'coude-montant-avant': {
    steps: [
      'Plie un peu les genoux.',
      'Monte le coude gauche à la verticale devant toi en poussant sur les jambes.',
      'Pointe du coude vers le menton imaginaire, puis reviens en garde.',
    ],
    errors: ['Bouger le bras sans les jambes', 'Garde droite qui tombe'],
    breath: EXPIRE_IMPACT,
  },

  // ------------------------------------------------------------------ clinch
  'clinch-tirage': {
    steps: [
      'Avance les mains comme pour saisir l’arrière de sa tête, une main sur l’autre.',
      'Serre les coudes l’un contre l’autre devant toi, avant-bras contre la clavicule imaginaire.',
      'Tire vers le bas et vers toi en reculant un peu les hanches.',
      'Reste droit, hanches avancées, prêt à monter le genou.',
    ],
    errors: ['Croiser les doigts', 'Coudes écartés', 'Dos rond'],
  },
  'genou-clinch': {
    steps: [
      'Pars du clinch simulé, mains derrière la tête imaginaire.',
      'Tire vers le bas avec les mains.',
      'Monte le genou droit tout droit devant, en poussant la hanche.',
      'Repose le pied, sans lâcher la saisie.',
    ],
    errors: ['Lâcher la saisie', 'Monter le genou sans tirer', 'Se pencher vers l’avant'],
    breath: EXPIRE_IMPACT,
  },
  'genou-circulaire-clinch': {
    steps: [
      'Pars du clinch simulé.',
      'Tourne un peu le buste pour décaler l’adversaire imaginaire.',
      'Monte le genou sur le côté, en arc, vers les côtes.',
      'Repose le pied, sans lâcher la saisie.',
    ],
    errors: ['Perdre l’équilibre', 'Genou sans rotation de hanche'],
    breath: EXPIRE_IMPACT,
  },

  // ------------------------------------------------------------------ feintes
  'feinte-jab': {
    steps: [
      'Pars de la garde.',
      'Avance un instant l’épaule et la main gauche de quelques centimètres, avec un petit pas ou un appui avant.',
      'Arrête-toi avant de tendre le bras : c’est une menace, pas un coup. Du bluff.',
      'Reviens en garde et enchaîne aussitôt le vrai coup.',
    ],
    errors: ['Feinte trop longue', 'Baisser la main droite', 'Rester immobile après la feinte'],
  },
  'feinte-epaule': {
    steps: [
      'Pars de la garde.',
      'Donne un petit coup sec de l’épaule droite vers l’avant, comme si le direct partait.',
      'Les poings restent où ils sont, mains hautes.',
      'Enchaîne tout de suite le coup prévu.',
    ],
    errors: ['Mouvement trop grand', 'Ouvrir la garde'],
  },
  'feinte-lutte': {
    steps: [
      'Pars de la garde.',
      'Descends brièvement en pliant les genoux, comme pour entrer en lutte.',
      'Mains hautes, dos droit.',
      'Remonte aussitôt et frappe.',
    ],
    errors: ['Se pencher au lieu de plier les genoux', 'Baisser les mains'],
  },

  // ------------------------------------------------------------------ lutte & sol (MMA)
  'changement-niveau': {
    steps: [
      'Pars de la garde.',
      'Plie les genoux et les hanches pour descendre, dos droit, tête haute.',
      'Les mains descendent à hauteur de poitrine, coudes serrés.',
      'Le pied avant peut avancer un peu. Remonte en garde en poussant sur les jambes.',
    ],
    errors: ['Descendre en courbant le dos', 'Regarder le sol', 'Mains qui pendent'],
  },
  'entree-lutte': {
    steps: [
      'Change de niveau : genoux pliés, dos droit, tête haute.',
      'Fais un grand pas de pénétration du pied gauche, entre les jambes imaginaires de l’adversaire.',
      'Le genou droit descend vers le sol, les bras s’ouvrent pour entourer les cuisses imaginaires.',
      'Colle la tête sur le côté, contre la hanche imaginaire, et pousse vers l’avant.',
      'Seul, reviens en garde au lieu de projeter.',
    ],
    errors: ['Tête qui passe devant (risque d’étranglement en guillotine)', 'Dos rond', 'Pas trop court qui n’amène pas les hanches', 'Genou qui tape le sol'],
  },
  sprawl: {
    steps: [
      'Pars de la garde.',
      'Lance les deux jambes en arrière d’un coup, sur l’avant des pieds.',
      'Écrase les hanches vers le sol, poitrine vers le bas, mains vers le sol ou sur le dos imaginaire.',
      'Garde la tête haute.',
      'Ramène les pieds sous toi et remonte en garde le plus vite possible.',
    ],
    errors: ['Hanches hautes', 'Genoux qui touchent le sol', 'Remonter trop lentement'],
  },
  'defense-lutte': {
    steps: [
      'Pars de la garde.',
      'Baisse un peu les hanches et avance les deux avant-bras devant toi, coudes vers l’intérieur.',
      'Recule le pied arrière pour garder la distance : tes bras font un cadre, une barrière.',
      'Reviens en garde.',
    ],
    errors: ['Se redresser', 'Bras tendus et rigides', 'Pieds sur une ligne'],
  },
  'descente-sol': {
    steps: [
      'Pars de la garde.',
      'Recule le pied droit et pose la main droite au sol derrière toi.',
      'Descends sur la hanche droite en douceur et en contrôle, jambe gauche pliée devant toi.',
      'Main gauche devant le visage, jambes entre toi et l’adversaire.',
    ],
    errors: ['Se laisser tomber', 'Poser le coude au sol', 'Lâcher la garde haute'],
  },
  'sortie-hanche': {
    steps: [
      'Au sol, sur le dos ou sur le côté, pieds posés, genoux pliés.',
      'Pousse sur un pied et soulève les hanches.',
      'Décale les hanches sur le côté et en arrière en pivotant sur l’épaule. Comme une crevette qui recule.',
      'Les mains poussent devant toi comme pour faire un cadre, puis reviens en position de départ.',
    ],
    errors: ['Rester à plat sur le dos', 'Bras tendus vers le haut', 'Bouger sans pousser sur le pied'],
  },
  'releve-technique': {
    steps: [
      'Assis au sol, pose la main droite derrière toi et le pied gauche à plat devant.',
      'La main gauche protège le visage.',
      'Soulève les hanches en appui sur la main droite et le pied gauche.',
      'Passe la jambe droite en arrière, sous toi, loin derrière.',
      'Reprends ta garde debout, en reculant si besoin.',
    ],
    errors: ['Se relever droit devant (tu restes exposé)', 'Lâcher la garde', 'Ramener la jambe trop près'],
  },

  // ------------------------------------------------------------------ jiu-jitsu brésilien (solo)
  'garde-bjj': {
    steps: [
      'Écarte les pieds un peu plus que la largeur des épaules, pied gauche légèrement devant.',
      'Plie les genoux et recule un peu les hanches, dos droit, tête haute.',
      'Avance les mains ouvertes devant toi, coudes près du corps, prêtes à cadrer (tenir à distance) ou à saisir.',
      'Reste sur l’avant des pieds, prêt à avancer, reculer ou descendre au sol.',
    ],
    errors: ['Jambes tendues', 'Dos arrondi, tête baissée', 'Bras tendus loin devant (faciles à attraper)'],
    breath: 'Respiration calme par le nez.',
  },
  pont: {
    steps: [
      'Sur le dos, sur un tapis : genoux pliés, pieds à plat près des fesses, écartés de la largeur des hanches.',
      'Rentre le menton, coudes près du corps, mains devant la poitrine.',
      'Pousse fort sur les pieds pour monter les hanches le plus haut possible.',
      'En haut, bascule les hanches vers une épaule en regardant de ce côté.',
      'Redescends en contrôle, sans laisser tomber les hanches, puis recommence de l’autre côté.',
    ],
    errors: ['Pousser avec la nuque ou la tête', 'Pieds trop loin des fesses', 'Hanches qui retombent d’un coup', 'Bras écartés au sol'],
    breath: 'Souffle en montant les hanches, inspire en redescendant.',
  },
  'retention-garde': {
    steps: [
      'Sur le dos, monte les jambes fléchies devant toi, plantes de pieds vers l’avant, comme deux cadres.',
      'Épaules au sol, menton rentré, mains devant la poitrine.',
      'Imagine un partenaire qui tourne autour de toi : pivote les hanches pour rester face à lui, comme une aiguille de boussole.',
      'Tes genoux restent toujours entre lui et ta poitrine. Pousse sur les épaules pour tourner.',
      'Pivote d’un côté, puis de l’autre, puis reviens au centre.',
    ],
    errors: ['Laisser les jambes retomber au sol', 'Tourner la tête et les épaules au lieu des hanches', 'Genoux qui s’écartent et ouvrent la poitrine'],
    breath: 'Respiration régulière, sans la bloquer pendant les rotations.',
  },
  'changement-base': {
    steps: [
      'Assis au sol, main gauche posée derrière toi, pied droit à plat devant.',
      'Pose la main droite au sol de l’autre côté et tourne les hanches vers le sol.',
      'Passe à quatre appuis : mains sous les épaules, genoux et pointes de pieds au sol, hanches hautes.',
      'Regard devant, dos plat, le temps d’un instant.',
      'Reviens à l’assise par le même chemin, main posée en premier.',
    ],
    errors: ['Mains trop loin devant les épaules', 'Dos rond', 'Tête baissée vers le sol'],
  },

  // ------------------------------------------------------------------ judo (solo)
  'shizen-tai': {
    steps: [
      'Tiens-toi droit, pieds écartés de la largeur des épaules, pointes un peu ouvertes.',
      'Plie à peine les genoux, poids réparti sur les deux pieds.',
      'Dos droit, épaules relâchées, regard devant.',
      'Mains à hauteur de poitrine : l’avant comme sur la manche du partenaire, l’arrière comme sur son revers (le col de sa veste).',
    ],
    errors: ['Se pencher en avant (posture défensive et figée)', 'Jambes tendues', 'Épaules crispées', 'Pieds trop serrés'],
    breath: 'Respiration calme par le nez.',
  },
  'tsugi-ashi-avant': {
    steps: [
      'Pars de shizen-tai.',
      'Fais glisser le pied avant d’environ 20 cm, en rasant le tapis.',
      'Ramène le pied arrière de la même distance, sans jamais dépasser le pied avant. Il suit, il ne double pas.',
      'Buste droit et même hauteur du début à la fin.',
    ],
    errors: ['Le pied arrière dépasse le pied avant', 'Sautiller au lieu de glisser', 'Se pencher en avant'],
  },
  'tsugi-ashi-arriere': {
    steps: [
      'Pars de shizen-tai.',
      'Fais glisser le pied arrière d’environ 20 cm vers l’arrière.',
      'Ramène le pied avant de la même distance.',
      'Même largeur d’appuis, buste droit.',
    ],
    errors: ['Reculer le pied avant en premier', 'Se redresser ou partir en arrière avec le buste', 'Croiser les pieds'],
  },
  'tsugi-ashi-lateral': {
    steps: [
      'Pars de shizen-tai.',
      'Fais glisser d’environ 20 cm le pied du côté où tu vas.',
      'Ramène l’autre pied de la même distance, sans que les pieds se touchent.',
      'Tes hanches restent face au partenaire imaginaire.',
    ],
    errors: ['Faire partir le mauvais pied (les pieds se croisent)', 'Pieds qui se touchent', 'Tourner les épaules'],
  },
  'tai-sabaki': {
    steps: [
      'Pars de shizen-tai.',
      'Laisse le pied avant en place et pivote sur la plante de ce pied.',
      'Le pied arrière fait un demi-cercle derrière toi, jusqu’à ce que tu sois dos à ta direction de départ.',
      'Reste à la même hauteur, genoux souples, mains devant.',
      'Reviens par le même chemin en shizen-tai.',
    ],
    errors: ['Le pied d’appui glisse ou se soulève', 'Se redresser pendant la rotation', 'Bras qui partent sur les côtés'],
  },
  kuzushi: {
    steps: [
      'Pars de shizen-tai, mains comme sur la manche (main avant) et sur le revers (main arrière).',
      'Recule le pied arrière d’un petit pas.',
      'En même temps, tire la main avant vers ta hanche, coude vers le bas, comme pour vider une manche.',
      'Monte la main arrière vers l’avant et le haut, comme pour soulever le revers.',
      'Reviens en shizen-tai et recommence, en restant gainé.',
    ],
    errors: ['Tirer seulement avec les bras', 'Se pencher en arrière', 'Mains qui s’écartent du corps'],
    breath: 'Souffle pendant le tirage.',
  },
  'uchikomi-seoi': {
    steps: [
      'Pars de shizen-tai, mains comme sur la manche et le revers d’un partenaire imaginaire.',
      'Avance le pied droit devant toi, à l’intérieur, en commençant à tourner.',
      'Pivote sur ce pied et ramène le pied gauche à côté : te voilà dos au partenaire, pieds parallèles.',
      'Plie les genoux pour placer tes hanches sous sa ceinture, dos droit.',
      'Tire les mains vers l’avant et vers le bas, coude droit sous l’aisselle imaginaire.',
      'Reviens en shizen-tai et recommence. Ne finis jamais par une projection sans partenaire ni tatami.',
    ],
    errors: ['Se pencher en avant au lieu de plier les genoux', 'Pieds qui finissent à l’extérieur', 'Bras qui tirent sans rotation du corps'],
    breath: 'Souffle à chaque entrée.',
  },
};
