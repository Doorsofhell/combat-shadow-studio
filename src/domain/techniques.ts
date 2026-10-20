import type { DisciplineId, Technique } from './types';

const ALL: DisciplineId[] = ['boxe', 'kickboxing', 'mma', 'muaythai'];
const KICK: DisciplineId[] = ['kickboxing', 'mma', 'muaythai'];
const GROUND: DisciplineId[] = ['mma', 'bjj'];

/**
 * Technique catalogue. Names and cues are what the coach says; key points are what the user
 * should check. Descriptions are written for an orthodox guard; the gaucher guard mirrors them.
 */
export const TECHNIQUES: Technique[] = [
  // ------------------------------------------------------------------ garde & déplacements
  {
    id: 'garde', name: 'Position de garde', call: 'En garde', category: 'garde', disciplines: ALL, motion: 'garde',
    description: "Ta position de base : pieds décalés à largeur d’épaules, poids sur les deux jambes, genoux souples, mains hautes, menton rentré.",
    cues: ['Menton rentré', 'Coudes serrés', 'Talon arrière décollé'],
    keyPoints: ['Pied avant légèrement tourné vers l’intérieur', 'Main arrière collée à la joue, comme un téléphone', 'Regard sur l’adversaire, épaules relâchées'],
  },
  {
    id: 'pas-avant', name: 'Pas avant', call: 'Avance', category: 'deplacement', disciplines: ALL, motion: 'pas-avant',
    description: 'Le pied avant part en premier, le pied arrière le rattrape de la même distance. Les mains ne bougent pas.',
    cues: ['Pied avant d’abord', 'Garde l’écart des pieds'],
    keyPoints: ['Ne croise jamais les pieds', 'Petits pas qui rasent le sol', 'Le buste reste au-dessus des pieds'],
  },
  {
    id: 'pas-arriere', name: 'Pas arrière', call: 'Recule', category: 'deplacement', disciplines: ALL, motion: 'pas-arriere',
    description: 'Le pied arrière recule en premier, le pied avant suit. Les mains restent en garde.',
    cues: ['Pied arrière d’abord', 'Reste sur l’avant des pieds'],
    keyPoints: ['Ne te redresse pas en reculant', 'Garde le même écart entre les pieds'],
  },
  {
    id: 'pas-gauche', name: 'Pas latéral gauche', call: 'Pas à gauche', category: 'deplacement', disciplines: ALL, motion: 'pas-gauche',
    description: 'Le pied gauche ouvre vers la gauche, le droit suit. Le pied du côté où tu vas part toujours en premier.',
    cues: ['Le pied gauche ouvre', 'Le droit suit'], keyPoints: ['Ne croise pas les pieds', 'Menton rentré'],
  },
  {
    id: 'pas-droite', name: 'Pas latéral droit', call: 'Pas à droite', category: 'deplacement', disciplines: ALL, motion: 'pas-droite',
    description: 'Pareil vers la droite : le pied droit ouvre, le gauche suit.',
    cues: ['Le pied droit ouvre', 'Le gauche suit'], keyPoints: ['Petits pas', 'Le poids reste au centre'],
  },
  {
    id: 'pivot-droite', name: 'Pivot', call: 'Pivote', category: 'deplacement', disciplines: ALL, motion: 'pivot-droite',
    description: 'Tu tournes sur l’avant du pied avant, comme une porte sur sa charnière : le pied arrière fait un arc, tu changes d’angle.',
    cues: ['Tourne sur l’avant du pied', 'La garde suit le corps'], keyPoints: ['Le pied avant ne glisse pas', 'Tu finis face à la cible'],
  },
  {
    id: 'pivot-gauche', name: 'Pivot extérieur', call: 'Pivote à gauche', category: 'deplacement', disciplines: ALL, motion: 'pivot-gauche',
    description: 'La même rotation sur le pied avant, dans l’autre sens, pour reprendre l’angle.',
    cues: ['Tourne sur l’avant du pied'], keyPoints: ['Reste en garde pendant la rotation'],
  },
  {
    id: 'sortie-angle', name: 'Sortie d’angle', call: 'Sors en angle', category: 'deplacement', disciplines: ALL, motion: 'sortie-angle',
    description: 'Le pied avant sort en diagonale et le buste se retourne vers la cible : tu quittes la ligne d’attaque.',
    cues: ['Sors de la ligne', 'Retrouve la cible'], keyPoints: ['Les pieds ne se croisent pas', 'Garde haute pendant la sortie'],
  },
  // ------------------------------------------------------------------ poings
  {
    id: 'jab', name: 'Jab', call: 'Jab', category: 'poing', disciplines: ALL, motion: 'jab',
    description: 'Le coup droit du bras avant : rapide, vers le menton, retour par le même chemin, comme un élastique.',
    cues: ['Tends et ramène', 'Épaule contre le menton', 'Main arrière à la joue'],
    keyPoints: ['Le poing tourne en fin de trajet', 'Poignet droit, tu touches avec les phalanges', 'Petit transfert sur la jambe avant', 'Retour en garde aussitôt'],
  },
  {
    id: 'direct', name: 'Direct arrière', call: 'Direct', category: 'poing', disciplines: ALL, motion: 'direct',
    description: 'Le coup droit du bras arrière. Tout part du sol : la jambe arrière pousse, le pied arrière pivote, les hanches puis les épaules tournent, le poids passe sur la jambe avant, le bras file au menton.',
    cues: ['Tourne la hanche', 'Pivote le pied arrière', 'Ramène les mains en garde'],
    keyPoints: ['Talon arrière vers l’extérieur', 'Poignet droit, tu touches avec les phalanges', 'La main avant protège le visage', 'Ne te penche pas plus loin que le genou avant'],
  },
  {
    id: 'jab-corps', name: 'Jab au corps', call: 'Jab au corps', category: 'poing', disciplines: ALL, motion: 'jab-corps',
    description: 'Un jab au plexus. Pour descendre, tu plies les genoux, tu ne baisses pas la tête.',
    cues: ['Descends avec les jambes', 'Main arrière haute'], keyPoints: ['Le dos reste droit', 'La tête reste hors de la ligne'],
  },
  {
    id: 'direct-corps', name: 'Direct au corps', call: 'Direct au corps', category: 'poing', disciplines: ALL, motion: 'direct-corps',
    description: 'Le direct arrière, mais vers le corps : tu fléchis les jambes pour descendre et les hanches tournent à fond.',
    cues: ['Fléchis les genoux', 'Tourne la hanche'], keyPoints: ['Ne plonge pas la tête en avant', 'Remonte en garde aussitôt'],
  },
  {
    id: 'crochet-avant', name: 'Crochet gauche', call: 'Crochet gauche', category: 'poing', disciplines: ALL, motion: 'crochet-avant',
    description: 'Le coup circulaire du bras avant : coude à hauteur du poing, avant-bras à l’horizontale, lancé par les hanches et le pivot du pied avant.',
    cues: ['Coude haut', 'Pivote le pied avant', 'Tourne tout le corps'],
    keyPoints: ['Coude plié à environ 90°', 'Poignet droit, tu touches avec les phalanges', 'Pas d’élan en arrière avant de frapper', 'Main droite collée à la joue'],
  },
  {
    id: 'crochet-arriere', name: 'Crochet droit', call: 'Crochet droit', category: 'poing', disciplines: ALL, motion: 'crochet-arriere',
    description: 'Le crochet du bras arrière, lancé par la rotation des hanches et le pivot du pied arrière.',
    cues: ['Tourne la hanche', 'Coude à hauteur du poing'], keyPoints: ['Pas d’élan en arrière', 'Poignet droit, tu touches avec les phalanges', 'La main gauche protège le menton'],
  },
  {
    id: 'crochet-avant-corps', name: 'Crochet gauche au corps', call: 'Crochet au corps', category: 'poing', disciplines: ALL, motion: 'crochet-avant-corps',
    description: 'Un crochet du bras avant vers le foie ou les côtes. Tu fléchis les jambes et tu inclines un peu le buste.',
    cues: ['Descends sur les jambes', 'Coude près du corps'], keyPoints: ['Le coude protège les côtes', 'Remonte en garde après la frappe'],
  },
  {
    id: 'crochet-arriere-corps', name: 'Crochet droit au corps', call: 'Crochet droit au corps', category: 'poing', disciplines: ALL, motion: 'crochet-arriere-corps',
    description: 'Le crochet du bras arrière vers le corps : genoux fléchis, hanches qui tournent.',
    cues: ['Fléchis', 'Tourne la hanche'], keyPoints: ['La main avant reste haute'],
  },
  {
    id: 'uppercut-avant', name: 'Uppercut gauche', call: 'Uppercut gauche', category: 'poing', disciplines: ALL, motion: 'uppercut-avant',
    description: 'Le coup qui monte, du bras avant. Petite flexion, la jambe avant pousse, paume tournée vers toi.',
    cues: ['Fléchis puis pousse', 'Paume vers toi'], keyPoints: ['Ne baisse pas la main pour l’élan', 'Trajet court et vertical'],
  },
  {
    id: 'uppercut-arriere', name: 'Uppercut droit', call: 'Uppercut droit', category: 'poing', disciplines: ALL, motion: 'uppercut-arriere',
    description: 'Le coup qui monte, du bras arrière. Le pied arrière pivote et les jambes poussent vers le haut.',
    cues: ['Pousse avec les jambes', 'Pivote le pied arrière'], keyPoints: ['Garde gauche haute', 'Le poing s’arrête à hauteur du menton'],
  },
  {
    id: 'overhand', name: 'Overhand', call: 'Overhand', category: 'poing', disciplines: ['mma', 'kickboxing'], motion: 'overhand',
    description: 'Un coup arrière en arc, par-dessus la garde adverse : tu descends un peu sur les jambes et ton poids part vers l’avant.',
    cues: ['Tête hors de la ligne', 'Arc par-dessus'], keyPoints: ['Menton caché derrière l’épaule', 'Ne tombe pas vers l’avant'],
  },
  // ------------------------------------------------------------------ défenses
  {
    id: 'esquive-droite', name: 'Esquive extérieure', call: 'Esquive', category: 'defense', disciplines: ALL, motion: 'esquive-droite',
    description: 'Ta tête sort de la ligne vers la droite : genou fléchi, buste un peu incliné, yeux sur la cible.',
    cues: ['Fléchis le genou', 'Sors juste de la ligne'], keyPoints: ['Ne te penche pas en avant', 'Mains en garde pendant l’esquive'],
  },
  {
    id: 'esquive-gauche', name: 'Esquive intérieure', call: 'Esquive gauche', category: 'defense', disciplines: ALL, motion: 'esquive-gauche',
    description: 'Ta tête sort de la ligne vers la gauche, le poids passe sur la jambe avant.',
    cues: ['Petit mouvement', 'Regard sur la cible'], keyPoints: ['Le dos reste droit'],
  },
  {
    id: 'roll-droite', name: 'Rotation sous le crochet (roll)', call: 'Roll', category: 'defense', disciplines: ALL, motion: 'roll-droite',
    description: 'Tu passes sous un crochet en dessinant un U avec la tête : tu descends sur les jambes, tu glisses de côté, tu remontes.',
    cues: ['Descends avec les jambes', 'Dessine un U'], keyPoints: ['Ne regarde pas le sol', 'Garde haute pendant la rotation', 'La tête ne descend jamais sous la ceinture de l’adversaire'],
  },
  {
    id: 'roll-gauche', name: 'Roll de l’autre côté', call: 'Roll gauche', category: 'defense', disciplines: ALL, motion: 'roll-gauche',
    description: 'Le même U, dans l’autre sens.', cues: ['Descends, passe, remonte'], keyPoints: ['Ce sont les genoux qui travaillent', 'La tête ne descend jamais sous la ceinture de l’adversaire'],
  },
  {
    id: 'blocage-haut', name: 'Blocage haut', call: 'Bloque', category: 'defense', disciplines: ALL, motion: 'blocage-haut',
    description: 'Tes bras font casque : avant-bras contre la tête, coudes serrés, menton rentré.',
    cues: ['Coudes serrés', 'Menton rentré'], keyPoints: ['Garde les yeux ouverts', 'Reste bien sur tes appuis'],
  },
  {
    id: 'blocage-corps-avant', name: 'Blocage au corps', call: 'Protège le corps', category: 'defense', disciplines: ALL, motion: 'blocage-corps-avant',
    description: 'Le coude avant descend contre les côtes et le buste tourne un peu pour encaisser un coup au corps.',
    cues: ['Coude sur les côtes'], keyPoints: ['La main reste devant le visage'],
  },
  {
    id: 'parade', name: 'Parade', call: 'Parade', category: 'defense', disciplines: ALL, motion: 'parade',
    description: 'La main arrière dévie le jab adverse d’un petit geste vers l’intérieur. Tu le détournes, sans l’attraper.',
    cues: ['Geste court', 'Reviens à la joue'], keyPoints: ['Ne va pas chercher la main adverse', 'La main ne dépasse pas l’épaule opposée'],
  },
  {
    id: 'retrait', name: 'Retrait de buste', call: 'Retrait', category: 'defense', disciplines: ALL, motion: 'retrait',
    description: 'Le poids passe sur la jambe arrière, le buste recule juste hors de portée.',
    cues: ['Poids sur la jambe arrière', 'Menton rentré'], keyPoints: ['Ne te cambre pas', 'Reviens aussitôt en position'],
  },
  {
    id: 'check-avant', name: 'Check (blocage tibia)', call: 'Check', category: 'defense', disciplines: KICK, motion: 'check-avant',
    description: 'La jambe avant monte, genou vers l’extérieur, et ton tibia (l’os du devant de la jambe) bloque le low kick comme un bouclier.',
    cues: ['Genou vers l’extérieur', 'Garde haute'], keyPoints: ['Le genou et le coude se rapprochent', 'Repose le pied en garde'],
  },
  {
    id: 'check-arriere', name: 'Check jambe arrière', call: 'Check arrière', category: 'defense', disciplines: KICK, motion: 'check-arriere',
    description: 'Le même bouclier, avec le tibia de la jambe arrière, pour bloquer un low kick.',
    cues: ['Lève le genou'], keyPoints: ['Reste équilibré sur la jambe d’appui'],
  },
  // ------------------------------------------------------------------ pieds
  {
    id: 'front-kick-avant', name: 'Front kick avant', call: 'Front kick', category: 'pied', disciplines: ['kickboxing', 'mma'], motion: 'front-kick-avant',
    description: 'Le coup de pied de face : genou levé (l’armé), jambe qui se déplie, frappe avec l’avant de la plante, puis la jambe revient et se repose.',
    cues: ['Monte le genou', 'Frappe avec l’avant du pied'], keyPoints: ['Orteils relevés', 'Le pied revient par le même chemin'],
  },
  {
    id: 'front-kick-arriere', name: 'Front kick arrière', call: 'Front kick arrière', category: 'pied', disciplines: ['kickboxing', 'mma'], motion: 'front-kick-arriere',
    description: 'Le front kick de la jambe arrière : plus puissant, il porte plus loin.',
    cues: ['Genou haut', 'Hanche en avant'], keyPoints: ['Garde haute', 'Repose le pied en garde'],
  },
  {
    id: 'teep-avant', name: 'Teep', call: 'Teep', category: 'pied', disciplines: ['muaythai', 'mma'], motion: 'teep-avant',
    description: 'Le coup de pied qui repousse, jambe avant : genou levé, hanche projetée, poussée de la plante, comme pour fermer une porte.',
    cues: ['Lève le genou', 'Pousse avec la hanche'], keyPoints: ['Le buste recule légèrement', 'Le talon d’appui peut se lever'],
  },
  {
    id: 'teep-arriere', name: 'Teep arrière', call: 'Teep arrière', category: 'pied', disciplines: ['muaythai'], motion: 'teep-arriere',
    description: 'Le teep de la jambe arrière, pour repousser fort.', cues: ['Genou haut', 'Pousse'], keyPoints: ['Repose le pied en garde'],
  },
  {
    id: 'low-kick-arriere', name: 'Low kick droit', call: 'Low kick droit', category: 'pied', disciplines: KICK, motion: 'low-kick-arriere',
    description: 'Un coup de pied circulaire bas, avec le tibia, dans la cuisse. Le pied d’appui pivote et la hanche tourne.',
    cues: ['Pivote le pied d’appui', 'Tourne la hanche', 'Frappe avec le tibia'],
    keyPoints: ['Touche avec le milieu du tibia, jamais avec le pied ou la cheville', 'Le talon d’appui pointe vers la cible', 'Trajet légèrement descendant', 'La main opposée protège le visage'],
  },
  {
    id: 'low-kick-avant', name: 'Low kick gauche', call: 'Low kick gauche', category: 'pied', disciplines: KICK, motion: 'low-kick-avant',
    description: 'Le low kick de la jambe avant, souvent à l’intérieur de la cuisse.', cues: ['Petit pas d’appui', 'Tibia'], keyPoints: ['Garde haute'],
  },
  {
    id: 'middle-kick-arriere', name: 'Middle kick droit', call: 'Middle kick', category: 'pied', disciplines: KICK, motion: 'middle-kick-arriere',
    description: 'Le coup de pied circulaire au corps, avec le tibia : pivot complet, la hanche passe, la jambe traverse la cible comme une batte.',
    cues: ['Pivote', 'Tourne la hanche', 'Traverse la cible'], keyPoints: ['Pied d’appui sur l’avant', 'Le buste ne part pas en arrière : la puissance vient de la hanche', 'Genou d’appui légèrement fléchi, jamais verrouillé'],
  },
  {
    id: 'middle-kick-avant', name: 'Middle kick gauche', call: 'Middle kick gauche', category: 'pied', disciplines: KICK, motion: 'middle-kick-avant',
    description: 'Le middle kick de la jambe avant, rapide, souvent après un changement d’appui.', cues: ['Hanche'], keyPoints: ['Garde droite haute'],
  },
  {
    id: 'high-kick-arriere', name: 'High kick droit', call: 'High kick', category: 'pied', disciplines: KICK, motion: 'high-kick-arriere',
    description: 'Le coup de pied circulaire à la tête : pivot maximal, hanche ouverte, buste incliné pour laisser monter la jambe.',
    cues: ['Pivote fort', 'Ouvre la hanche', 'Garde haute'], keyPoints: ['Ne monte pas plus haut que ta souplesse', 'Équilibre sur l’avant du pied', 'Genou d’appui légèrement fléchi, jamais verrouillé'],
  },
  {
    id: 'high-kick-avant', name: 'High kick gauche', call: 'High kick gauche', category: 'pied', disciplines: KICK, motion: 'high-kick-avant',
    description: 'Le high kick de la jambe avant.', cues: ['Hanche', 'Garde'], keyPoints: ['Retour rapide en garde'],
  },
  {
    id: 'roundhouse-arriere', name: 'Roundhouse kick', call: 'Roundhouse', category: 'pied', disciplines: ['kickboxing', 'mma'], motion: 'roundhouse-arriere',
    description: 'Le coup de pied circulaire du kick-boxing : armé du genou, fouetté du cou-de-pied (le dessus du pied), réarmé avant de reposer.',
    cues: ['Arme le genou', 'Fouette', 'Réarme'], keyPoints: ['Pied d’appui pivoté', 'Le pied revient par le même chemin'],
  },
  {
    id: 'roundhouse-avant', name: 'Roundhouse jambe avant', call: 'Roundhouse avant', category: 'pied', disciplines: ['kickboxing'], motion: 'roundhouse-avant',
    description: 'Le roundhouse de la jambe avant : armé court, puis fouetté.', cues: ['Arme', 'Fouette'], keyPoints: ['Réarme avant de reposer'],
  },
  // ------------------------------------------------------------------ genoux & coudes
  {
    id: 'genou-direct-arriere', name: 'Genou direct', call: 'Genou', category: 'genou', disciplines: ['muaythai', 'mma', 'kickboxing'], motion: 'genou-direct-arriere',
    description: 'Le genou arrière monte vers l’avant, la hanche pousse, et tu montes sur la pointe du pied d’appui.',
    cues: ['Hanche en avant', 'Sur la pointe du pied'], keyPoints: ['Pointe du pied tendue vers le bas', 'Mains en cadre devant toi'],
  },
  {
    id: 'genou-direct-avant', name: 'Genou direct avant', call: 'Genou avant', category: 'genou', disciplines: ['muaythai', 'kickboxing'], motion: 'genou-direct-avant',
    description: 'Le genou de la jambe avant, court et rapide.', cues: ['Hanche'], keyPoints: ['Équilibre sur la jambe arrière'],
  },
  {
    id: 'genou-circulaire-arriere', name: 'Genou circulaire', call: 'Genou circulaire', category: 'genou', disciplines: ['muaythai', 'kickboxing'], motion: 'genou-circulaire-arriere',
    description: 'Le genou arrive par le côté vers les côtes, porté par la rotation de la hanche.',
    cues: ['Ouvre la hanche', 'Le genou vient de côté'], keyPoints: ['Le pied d’appui pivote'],
  },
  {
    id: 'genou-circulaire-avant', name: 'Genou circulaire avant', call: 'Genou circulaire avant', category: 'genou', disciplines: ['muaythai', 'kickboxing'], motion: 'genou-circulaire-avant',
    description: 'Le genou circulaire de la jambe avant.', cues: ['Hanche'], keyPoints: ['Garde l’équilibre'],
  },
  {
    id: 'coude-horizontal-avant', name: 'Coude horizontal gauche', call: 'Coude', category: 'coude', disciplines: ['muaythai'], motion: 'coude-horizontal-avant',
    description: 'Le coude avant balaie à l’horizontale à hauteur du menton, avant-bras parallèle au sol, tout le corps tourne avec.',
    cues: ['Coude à hauteur d’épaule', 'Tourne le corps'], keyPoints: ['La main reste près de la tête, ouverte ou fermée', 'Distance très courte : une arme de près'],
  },
  {
    id: 'coude-horizontal-arriere', name: 'Coude horizontal droit', call: 'Coude droit', category: 'coude', disciplines: ['muaythai'], motion: 'coude-horizontal-arriere',
    description: 'Le coude horizontal du bras arrière, avec pivot du pied arrière.', cues: ['Pivote', 'Coude à hauteur du menton'], keyPoints: ['Main gauche en protection'],
  },
  {
    id: 'coude-diagonal-arriere', name: 'Coude diagonal descendant', call: 'Coude diagonal', category: 'coude', disciplines: ['muaythai'], motion: 'coude-diagonal-arriere',
    description: 'Le coude part haut et redescend en diagonale vers le visage, pendant que les jambes fléchissent.',
    cues: ['Monte le coude', 'Coupe vers le bas'], keyPoints: ['Le poids descend avec le coude'],
  },
  {
    id: 'coude-diagonal-avant', name: 'Coude diagonal avant', call: 'Coude diagonal gauche', category: 'coude', disciplines: ['muaythai'], motion: 'coude-diagonal-avant',
    description: 'Le coude diagonal descendant, du bras avant.', cues: ['Coupe vers le bas'], keyPoints: ['Garde droite haute'],
  },
  {
    id: 'coude-montant-arriere', name: 'Coude remontant', call: 'Coude remontant', category: 'coude', disciplines: ['muaythai'], motion: 'coude-montant-arriere',
    description: 'Le coude remonte à la verticale devant le visage, comme un uppercut tout court.',
    cues: ['Fléchis puis remonte', 'Coude devant le nez'], keyPoints: ['Trajet vertical', 'Main près de l’oreille'],
  },
  {
    id: 'coude-montant-avant', name: 'Coude remontant avant', call: 'Coude remontant gauche', category: 'coude', disciplines: ['muaythai'], motion: 'coude-montant-avant',
    description: 'Le coude remontant du bras avant.', cues: ['Remonte'], keyPoints: ['Court et vertical'],
  },
  {
    id: 'clinch-tirage', name: 'Clinch simulé (tirage)', call: 'Clinch', category: 'clinch', disciplines: ['muaythai'], motion: 'clinch-tirage',
    description: 'Démonstration solo du clinch (le corps à corps) : mains verrouillées derrière une nuque imaginaire, coudes serrés, puis tirage vers le bas et rotation.',
    cues: ['Mains derrière la nuque', 'Coudes serrés', 'Tire et tourne'], keyPoints: ['Démonstration sans partenaire', 'Hanches proches de l’adversaire imaginaire'],
    soloNote: 'Démonstration solo, sans partenaire représenté : le vrai clinch se travaille à deux.',
  },
  {
    id: 'genou-clinch', name: 'Genou dans le clinch', call: 'Genou', category: 'clinch', disciplines: ['muaythai'], motion: 'genou-direct-arriere-clinch',
    description: 'Un genou direct pendant que tes mains tiennent une nuque imaginaire et tirent vers le bas.',
    cues: ['Tire vers le bas', 'Hanche en avant'], keyPoints: ['Démonstration solo'],
    soloNote: 'Démonstration solo : le contrôle du clinch se travaille avec un partenaire.',
  },
  {
    id: 'genou-circulaire-clinch', name: 'Genou circulaire dans le clinch', call: 'Genou circulaire', category: 'clinch', disciplines: ['muaythai'], motion: 'genou-circulaire-arriere-clinch',
    description: 'Un genou circulaire vers les côtes, depuis le clinch simulé.', cues: ['Tire', 'Genou de côté'], keyPoints: ['Démonstration solo'],
    soloNote: 'Démonstration solo : le contrôle du clinch se travaille avec un partenaire.',
  },
  // ------------------------------------------------------------------ feintes & MMA
  {
    id: 'feinte-jab', name: 'Feinte de jab', call: 'Feinte', category: 'feinte', disciplines: ALL, motion: 'feinte-jab',
    description: 'Un début de jab court et sec, jamais fini, pour faire réagir l’adversaire.', cues: ['Court et sec'], keyPoints: ['Ne perds pas ta garde'],
  },
  {
    id: 'feinte-epaule', name: 'Feinte d’épaule', call: 'Feinte d’épaule', category: 'feinte', disciplines: ALL, motion: 'feinte-epaule',
    description: 'L’épaule arrière annonce un direct qui ne part pas. Du bluff.', cues: ['Épaule seulement'], keyPoints: ['Les pieds restent stables'],
  },
  {
    id: 'feinte-lutte', name: 'Feinte de lutte', call: 'Feinte de lutte', category: 'feinte', disciplines: ['mma'], motion: 'feinte-lutte',
    description: 'Tu descends vite comme pour entrer en lutte, puis tu remontes en garde. Une menace, pas une entrée.', cues: ['Descends vite', 'Remonte en garde'],
    keyPoints: ['La tête reste haute', 'Le dos reste droit'],
  },
  {
    id: 'changement-niveau', name: 'Changement de niveau', call: 'Change de niveau', category: 'lutte', disciplines: ['mma'], motion: 'changement-niveau',
    description: 'Tu descends les hanches en pliant les jambes, pas le dos : dos droit, tête haute, mains devant prêtes à saisir.',
    cues: ['Fléchis les jambes, pas le dos', 'Tête haute'], keyPoints: ['Les genoux restent au-dessus des pieds', 'Les mains ne tombent pas'],
  },
  {
    id: 'entree-lutte', name: 'Entrée en double-leg (solo)', call: 'Entrée', category: 'lutte', disciplines: ['mma'], motion: 'entree-lutte',
    description: 'Tu changes de niveau, puis pas de pénétration (grand pas profond vers l’adversaire) : le genou arrière descend près du sol, les mains entourent des jambes imaginaires.',
    cues: ['Pas de pénétration', 'Tête haute', 'Pousse avec les jambes'],
    keyPoints: ['Le genou effleure le sol, sans choc', 'Le dos reste droit', 'Démonstration sans partenaire'],
    soloNote: 'Version shadow : sans partenaire, tu travailles le placement et le pas, pas la projection.',
  },
  {
    id: 'sprawl', name: 'Sprawl', call: 'Sprawl', category: 'lutte', disciplines: ['mma'], motion: 'sprawl',
    description: 'La défense contre l’entrée en lutte : hanches et jambes partent droit en arrière, les hanches vont au sol, les mains appuient vers le bas sur la tête et les épaules de l’attaquant. Seul, les mains finissent au sol et amortissent ; les pieds reviennent sous les hanches d’un saut, puis retour en garde.',
    cues: ['Jambes en arrière', 'Hanches au sol', 'Remonte en garde'],
    keyPoints: ['Les jambes partent droit en arrière', 'Mains sur la tête ou les épaules, jamais sur les hanches de l’attaquant', 'Ne lance pas les jambes au point de soulever le bas du corps'],
    soloNote: 'Seul, tu travailles le geste des hanches et des jambes. Contrôler la tête et peser sur l’attaquant demande un partenaire.',
  },
  {
    id: 'defense-lutte', name: 'Défense d’entrée en lutte', call: 'Défends', category: 'lutte', disciplines: ['mma'], motion: 'defense-lutte',
    description: 'Hanches en arrière, pied arrière qui recule, mains qui font barrage vers le bas sur des épaules imaginaires.',
    cues: ['Hanches en arrière', 'Cadre avec les mains'], keyPoints: ['Ne te penche pas sans reculer les hanches'],
  },
  {
    id: 'descente-sol', name: 'Descente contrôlée au sol', call: 'Au sol', category: 'sol', disciplines: GROUND, motion: 'descente-sol',
    description: 'Tu passes de debout à assis, en contrôle : main posée derrière, pied planté devant. Une descente, pas une chute.',
    cues: ['Descends en contrôle', 'Main derrière'], keyPoints: ['Ne tombe pas sur le coccyx', 'Une main protège toujours le visage'],
  },
  {
    id: 'sortie-hanche', name: 'Sortie de hanche (shrimp)', call: 'Sortie de hanche', category: 'sol', disciplines: GROUND, motion: 'sortie-hanche',
    description: 'Au sol, tu passes sur le côté et tes hanches filent en arrière en diagonale, poussées par le pied, pour créer de l’espace, comme une crevette. La force vient des hanches, pas des bras.',
    cues: ['Pousse avec le pied', 'Hanches en arrière'], keyPoints: ['Le coude reste près du corps', 'Passe sur le côté, ne reste pas à plat sur le dos'],
    soloNote: 'Mouvement de mobilité au sol, à faire seul.',
  },
  {
    id: 'releve-technique', name: 'Relevé technique', call: 'Relève-toi', category: 'sol', disciplines: GROUND, motion: 'releve-technique',
    description: 'Depuis l’assise : main et pied posés, hanches levées, la jambe passe derrière, et te voilà en garde, à distance.',
    cues: ['Main et pied au sol', 'Lève les hanches', 'Jambe en arrière'], keyPoints: ['La main libre protège le visage', 'Reviens en garde, pas debout tout droit'],
  },

  // ------------------------------------------------------------------ jiu-jitsu brésilien (travail solo)
  {
    id: 'garde-bjj', name: 'Posture debout de grappling', call: 'En posture', category: 'garde', disciplines: ['bjj'], motion: 'garde',
    description: 'Face au partenaire : appuis larges, genoux fléchis, hanches un peu en arrière, mains ouvertes devant pour cadrer (tenir à distance) et saisir.',
    cues: ['Genoux fléchis', 'Mains devant, ouvertes', 'Hanches en arrière'],
    keyPoints: ['Dos droit, tête haute', 'Les coudes restent près du corps', 'Le poids reste sur l’avant des pieds'],
  },
  {
    id: 'pont', name: 'Pont (upa)', call: 'Pont', category: 'sol', disciplines: ['bjj', 'mma'], motion: 'pont',
    description: 'Sur le dos, pieds à plat près des fesses : les hanches montent fort, basculent vers une épaule, puis redescendent en contrôle. La base pour sortir de la montée (quelqu’un assis sur toi).',
    cues: ['Pieds près des fesses', 'Monte les hanches', 'Bascule sur l’épaule'],
    keyPoints: ['La poussée vient des pieds et des hanches, pas de la nuque', 'Le menton reste rentré', 'Redescends sans laisser tomber les hanches'],
    soloNote: 'Seul, sur un tapis ou une surface souple. Sans partenaire, tu entraînes la mobilité des hanches, pas la sortie.',
  },
  {
    id: 'retention-garde', name: 'Rétention de garde (solo)', call: 'Garde', category: 'sol', disciplines: ['bjj'], motion: 'retention-garde',
    description: 'Sur le dos, jambes levées en cadre : tes hanches pivotent pour rester face à un partenaire imaginaire qui tourne, genoux entre lui et ta poitrine.',
    cues: ['Jambes en cadre', 'Pivote les hanches', 'Genoux devant la poitrine'],
    keyPoints: ['Épaules au sol, ce sont les hanches qui tournent', 'Les mains protègent l’intérieur', 'Respire pendant le mouvement'],
    soloNote: 'Mobilité en solo. La vraie rétention de garde se travaille avec un partenaire, encadré par un professeur.',
  },
  {
    id: 'changement-base', name: 'Changement de base', call: 'Change de base', category: 'sol', disciplines: ['bjj'], motion: 'changement-base',
    description: 'Depuis l’assise, main posée et hanche qui tourne, tu passes à quatre appuis, hanches hautes, puis tu reviens.',
    cues: ['Main posée', 'Tourne la hanche', 'Quatre appuis'],
    keyPoints: ['Les mains restent sous les épaules', 'Le dos reste plat', 'Le regard reste devant'],
  },

  // ------------------------------------------------------------------ judo (travail solo)
  {
    id: 'shizen-tai', name: 'Shizen-tai (posture naturelle)', call: 'Shizen-tai', category: 'garde', disciplines: ['judo'], motion: 'garde',
    description: 'La posture naturelle du judo : pieds à largeur d’épaules, genoux souples, dos droit, mains à hauteur de poitrine comme sur la manche et le revers (le col) du partenaire.',
    cues: ['Dos droit', 'Genoux souples', 'Mains devant'],
    keyPoints: ['Le poids est réparti sur les deux pieds', 'Les épaules restent relâchées', 'Ne te penche pas en avant'],
  },
  {
    id: 'tsugi-ashi-avant', name: 'Tsugi-ashi avant', call: 'Tsugi-ashi', category: 'deplacement', disciplines: ['judo'], motion: 'pas-avant',
    description: 'Un pas chassé : le pied avant glisse, le pied arrière le rejoint sans jamais le dépasser. Les pieds rasent le tapis.',
    cues: ['Glisse les pieds', 'Ne croise jamais'],
    keyPoints: ['Les pieds ne se croisent pas', 'Le buste reste droit au-dessus des appuis'],
  },
  {
    id: 'tsugi-ashi-arriere', name: 'Tsugi-ashi arrière', call: 'Recule', category: 'deplacement', disciplines: ['judo'], motion: 'pas-arriere',
    description: 'Le pied arrière glisse en arrière, le pied avant suit de la même distance, sans sauter.',
    cues: ['Pied arrière d’abord', 'Pieds rasants'],
    keyPoints: ['Garde la même largeur d’appuis', 'Ne te redresse pas en reculant'],
  },
  {
    id: 'tsugi-ashi-lateral', name: 'Tsugi-ashi latéral', call: 'Sur le côté', category: 'deplacement', disciplines: ['judo'], motion: 'pas-gauche',
    description: 'Tu te déplaces de côté : le pied du côté où tu vas part, l’autre le rejoint sans le toucher.',
    cues: ['Glisse sur le côté', 'Pieds parallèles'],
    keyPoints: ['Les pieds ne se touchent pas', 'Les hanches restent face au partenaire'],
  },
  {
    id: 'tai-sabaki', name: 'Tai-sabaki (rotation du corps)', call: 'Tai-sabaki', category: 'deplacement', disciplines: ['judo'], motion: 'tai-sabaki',
    description: 'Ton corps tourne autour du pied avant comme un compas : le pied arrière fait un demi-cercle, tu finis dos à la direction où tu regardais, puis tu reviens.',
    cues: ['Pivote sur le pied avant', 'Le pied arrière fait le tour'],
    keyPoints: ['Reste à la même hauteur pendant la rotation', 'Le pied d’appui ne glisse pas', 'Les mains restent devant'],
  },
  {
    id: 'kuzushi', name: 'Kuzushi (déséquilibre, solo)', call: 'Kuzushi', category: 'projection', disciplines: ['judo'], motion: 'kuzushi',
    description: 'Kuzushi veut dire déséquilibre. Main avant (manche) tirée vers ta hanche, main arrière (revers) qui monte, un pas en arrière : c’est ce qui fait basculer le partenaire vers l’avant.',
    cues: ['Tire vers la hanche', 'Monte le revers', 'Recule le pied'],
    keyPoints: ['Le tirage vient de tout le corps, pas seulement des bras', 'Le dos reste droit'],
    soloNote: 'Geste montré à vide : déséquilibrer un vrai partenaire, ça s’apprend au dojo, avec un professeur.',
  },
  {
    id: 'uchikomi-seoi', name: 'Uchikomi de seoi-nage (solo)', call: 'Entrée', category: 'projection', disciplines: ['judo'], motion: 'uchikomi-seoi',
    description: 'L’uchikomi, c’est répéter une entrée sans projeter. Ici celle de seoi-nage : pas devant, pivot, dos au partenaire imaginaire, genoux fléchis, hanches sous sa ceinture, mains qui tirent vers l’avant.',
    cues: ['Entre et pivote', 'Fléchis les genoux', 'Tire les mains'],
    keyPoints: ['Les pieds finissent à l’intérieur, parallèles', 'Plie les genoux, pas le dos', 'Reviens en shizen-tai entre deux entrées'],
    soloNote: 'Uchikomi à vide : l’entrée et le placement (tsukuri) seulement. La projection (kake) se fait uniquement avec un partenaire, sur tatami, encadré par un professeur.',
  },
];

export const TECHNIQUE_BY_ID = new Map(TECHNIQUES.map((t) => [t.id, t]));

export function techniquesFor(d: DisciplineId) {
  return TECHNIQUES.filter((t) => t.disciplines.includes(d));
}

export const CATEGORY_LABEL: Record<Technique['category'], string> = {
  garde: 'Garde',
  poing: 'Poings',
  pied: 'Pieds',
  genou: 'Genoux',
  coude: 'Coudes',
  defense: 'Défenses',
  deplacement: 'Déplacements',
  lutte: 'Lutte',
  sol: 'Sol',
  feinte: 'Feintes',
  clinch: 'Clinch',
  projection: 'Entrées de projection',
};
