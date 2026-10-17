import type { DisciplineId, Technique } from './types';

const ALL: DisciplineId[] = ['boxe', 'kickboxing', 'mma', 'muaythai'];
const KICK: DisciplineId[] = ['kickboxing', 'mma', 'muaythai'];

/**
 * Technique catalogue. Names and cues are what the coach says; key points are what the user
 * should check. Descriptions are written for an orthodox guard; the gaucher guard mirrors them.
 */
export const TECHNIQUES: Technique[] = [
  // ------------------------------------------------------------------ garde & déplacements
  {
    id: 'garde', name: 'Position de garde', call: 'En garde', category: 'garde', disciplines: ALL, motion: 'garde',
    description: "Pieds décalés de la largeur des épaules, poids réparti, genoux souples, mains hautes, menton rentré.",
    cues: ['Menton rentré', 'Coudes serrés', 'Talon arrière décollé'],
    keyPoints: ['Pied avant légèrement tourné vers l’intérieur', 'Main arrière contre la joue', 'Regard vers l’adversaire, épaules relâchées'],
  },
  {
    id: 'pas-avant', name: 'Pas avant', call: 'Avance', category: 'deplacement', disciplines: ALL, motion: 'pas-avant',
    description: 'Le pied avant avance en premier, le pied arrière suit de la même distance. La garde ne bouge pas.',
    cues: ['Pied avant d’abord', 'Garde la distance entre les pieds'],
    keyPoints: ['Ne jamais croiser les pieds', 'Pas courts et rasants', 'Le buste reste au-dessus des appuis'],
  },
  {
    id: 'pas-arriere', name: 'Pas arrière', call: 'Recule', category: 'deplacement', disciplines: ALL, motion: 'pas-arriere',
    description: 'Le pied arrière recule en premier, le pied avant suit. Les mains restent en garde.',
    cues: ['Pied arrière d’abord', 'Reste sur l’avant des pieds'],
    keyPoints: ['Ne pas se redresser en reculant', 'Garder la même largeur de garde'],
  },
  {
    id: 'pas-gauche', name: 'Pas latéral gauche', call: 'Pas à gauche', category: 'deplacement', disciplines: ALL, motion: 'pas-gauche',
    description: 'Le pied gauche part le premier vers la gauche, le pied droit suit.',
    cues: ['Le pied gauche ouvre', 'Le droit suit'], keyPoints: ['Ne pas croiser les pieds', 'Garder le menton rentré'],
  },
  {
    id: 'pas-droite', name: 'Pas latéral droit', call: 'Pas à droite', category: 'deplacement', disciplines: ALL, motion: 'pas-droite',
    description: 'Le pied droit part le premier vers la droite, le pied gauche suit.',
    cues: ['Le pied droit ouvre', 'Le gauche suit'], keyPoints: ['Pas courts', 'Le poids reste centré'],
  },
  {
    id: 'pivot-droite', name: 'Pivot', call: 'Pivote', category: 'deplacement', disciplines: ALL, motion: 'pivot-droite',
    description: 'Rotation sur l’avant du pied avant : le pied arrière décrit un arc pour changer d’angle.',
    cues: ['Tourne sur l’avant du pied', 'La garde suit le corps'], keyPoints: ['Le pied avant ne glisse pas', 'Fin du pivot face à la cible'],
  },
  {
    id: 'pivot-gauche', name: 'Pivot extérieur', call: 'Pivote à gauche', category: 'deplacement', disciplines: ALL, motion: 'pivot-gauche',
    description: 'Rotation sur le pied avant dans l’autre sens pour reprendre l’angle.',
    cues: ['Tourne sur l’avant du pied'], keyPoints: ['Rester en garde pendant la rotation'],
  },
  {
    id: 'sortie-angle', name: 'Sortie d’angle', call: 'Sors en angle', category: 'deplacement', disciplines: ALL, motion: 'sortie-angle',
    description: 'Le pied avant sort en diagonale, le buste se réoriente vers la cible : on quitte la ligne d’attaque.',
    cues: ['Sors de la ligne', 'Retrouve la cible'], keyPoints: ['Les pieds ne se croisent pas', 'Garde haute pendant la sortie'],
  },
  // ------------------------------------------------------------------ poings
  {
    id: 'jab', name: 'Jab', call: 'Jab', category: 'poing', disciplines: ALL, motion: 'jab',
    description: 'Direct du bras avant, rapide, en ligne droite vers le menton, retour par le même chemin.',
    cues: ['Tends et ramène', 'Épaule contre le menton', 'Main arrière à la joue'],
    keyPoints: ['Le poing tourne en fin de trajectoire', 'Léger transfert sur la jambe avant', 'Retour immédiat en garde'],
  },
  {
    id: 'direct', name: 'Direct arrière', call: 'Direct', category: 'poing', disciplines: ALL, motion: 'direct',
    description: 'Direct du bras arrière : pivot du pied arrière, rotation des hanches puis des épaules, bras tendu vers le menton.',
    cues: ['Tourne la hanche', 'Pivote le pied arrière', 'Ramène les mains en garde'],
    keyPoints: ['Talon arrière vers l’extérieur', 'Main avant protège le visage', 'Ne pas se pencher au-delà du genou avant'],
  },
  {
    id: 'jab-corps', name: 'Jab au corps', call: 'Jab au corps', category: 'poing', disciplines: ALL, motion: 'jab-corps',
    description: 'Jab porté au plexus en fléchissant les genoux, pas en baissant la tête.',
    cues: ['Descends avec les jambes', 'Garde la main arrière haute'], keyPoints: ['Le dos reste droit', 'La tête reste hors de la ligne'],
  },
  {
    id: 'direct-corps', name: 'Direct au corps', call: 'Direct au corps', category: 'poing', disciplines: ALL, motion: 'direct-corps',
    description: 'Direct arrière vers le corps avec flexion des jambes et rotation complète des hanches.',
    cues: ['Fléchis les genoux', 'Tourne la hanche'], keyPoints: ['Ne pas plonger la tête en avant', 'Remonter en garde aussitôt'],
  },
  {
    id: 'crochet-avant', name: 'Crochet gauche', call: 'Crochet gauche', category: 'poing', disciplines: ALL, motion: 'crochet-avant',
    description: 'Crochet du bras avant : coude à hauteur du poing, avant-bras horizontal, rotation des hanches et pivot du pied avant.',
    cues: ['Coude haut', 'Pivote le pied avant', 'Tourne tout le corps'],
    keyPoints: ['Angle d’environ 90° au coude', 'Le poing ne part pas en arrière avant de frapper', 'Main droite collée à la joue'],
  },
  {
    id: 'crochet-arriere', name: 'Crochet droit', call: 'Crochet droit', category: 'poing', disciplines: ALL, motion: 'crochet-arriere',
    description: 'Crochet du bras arrière, porté par la rotation des hanches et le pivot du pied arrière.',
    cues: ['Tourne la hanche', 'Coude à hauteur du poing'], keyPoints: ['Ne pas armer en arrière', 'Main gauche protège le menton'],
  },
  {
    id: 'crochet-avant-corps', name: 'Crochet gauche au corps', call: 'Crochet au corps', category: 'poing', disciplines: ALL, motion: 'crochet-avant-corps',
    description: 'Crochet du bras avant vers le foie ou les côtes en fléchissant les jambes et en inclinant le buste.',
    cues: ['Descends sur les jambes', 'Coude près du corps'], keyPoints: ['Le coude protège les côtes', 'Remonter en garde après la frappe'],
  },
  {
    id: 'crochet-arriere-corps', name: 'Crochet droit au corps', call: 'Crochet droit au corps', category: 'poing', disciplines: ALL, motion: 'crochet-arriere-corps',
    description: 'Crochet du bras arrière vers le corps, flexion des genoux et rotation des hanches.',
    cues: ['Fléchis', 'Tourne la hanche'], keyPoints: ['La main avant reste haute'],
  },
  {
    id: 'uppercut-avant', name: 'Uppercut gauche', call: 'Uppercut gauche', category: 'poing', disciplines: ALL, motion: 'uppercut-avant',
    description: 'Coup remontant du bras avant : légère flexion, poussée de la jambe avant, poing paume vers soi.',
    cues: ['Fléchis puis pousse', 'Paume vers toi'], keyPoints: ['Ne pas descendre la main avant d’armer', 'Trajectoire courte et verticale'],
  },
  {
    id: 'uppercut-arriere', name: 'Uppercut droit', call: 'Uppercut droit', category: 'poing', disciplines: ALL, motion: 'uppercut-arriere',
    description: 'Coup remontant du bras arrière avec pivot du pied arrière et poussée des jambes.',
    cues: ['Pousse avec les jambes', 'Pivote le pied arrière'], keyPoints: ['Garde gauche haute', 'Le poing finit à hauteur du menton'],
  },
  {
    id: 'overhand', name: 'Overhand', call: 'Overhand', category: 'poing', disciplines: ['mma', 'kickboxing'], motion: 'overhand',
    description: 'Coup arrière en arc par-dessus la garde adverse, avec changement de niveau et transfert vers l’avant.',
    cues: ['Baisse la tête hors de la ligne', 'Arc par-dessus'], keyPoints: ['Le menton reste derrière l’épaule', 'Ne pas tomber vers l’avant'],
  },
  // ------------------------------------------------------------------ défenses
  {
    id: 'esquive-droite', name: 'Esquive extérieure', call: 'Esquive', category: 'defense', disciplines: ALL, motion: 'esquive-droite',
    description: 'La tête sort de la ligne vers la droite par une flexion du genou et une inclinaison du buste, sans quitter la cible des yeux.',
    cues: ['Fléchis le genou', 'Juste assez pour sortir de la ligne'], keyPoints: ['Ne pas se pencher en avant', 'Mains en garde pendant l’esquive'],
  },
  {
    id: 'esquive-gauche', name: 'Esquive intérieure', call: 'Esquive gauche', category: 'defense', disciplines: ALL, motion: 'esquive-gauche',
    description: 'La tête sort de la ligne vers la gauche en transférant le poids sur la jambe avant.',
    cues: ['Petit mouvement', 'Regard sur la cible'], keyPoints: ['Le dos reste droit'],
  },
  {
    id: 'roll-droite', name: 'Rotation sous le crochet (roll)', call: 'Roll', category: 'defense', disciplines: ALL, motion: 'roll-droite',
    description: 'Passage sous un crochet en U : descente sur les jambes, déplacement latéral, remontée de l’autre côté.',
    cues: ['Descends avec les jambes', 'Dessine un U'], keyPoints: ['Ne pas regarder le sol', 'Garde haute pendant la rotation'],
  },
  {
    id: 'roll-gauche', name: 'Roll de l’autre côté', call: 'Roll gauche', category: 'defense', disciplines: ALL, motion: 'roll-gauche',
    description: 'Même rotation en U dans l’autre sens.', cues: ['Descends, passe, remonte'], keyPoints: ['Les genoux font le travail'],
  },
  {
    id: 'blocage-haut', name: 'Blocage haut', call: 'Bloque', category: 'defense', disciplines: ALL, motion: 'blocage-haut',
    description: 'Couverture : les avant-bras montent contre la tête, coudes serrés, menton rentré.',
    cues: ['Coudes serrés', 'Menton rentré'], keyPoints: ['Ne pas fermer les yeux', 'Garder les appuis'],
  },
  {
    id: 'blocage-corps-avant', name: 'Blocage au corps', call: 'Protège le corps', category: 'defense', disciplines: ALL, motion: 'blocage-corps-avant',
    description: 'Le coude avant descend contre les côtes et le buste se tourne légèrement pour absorber un coup au corps.',
    cues: ['Coude sur les côtes'], keyPoints: ['La main reste devant le visage'],
  },
  {
    id: 'parade', name: 'Parade', call: 'Parade', category: 'defense', disciplines: ALL, motion: 'parade',
    description: 'La main arrière dévie le jab adverse d’un geste court vers l’intérieur.',
    cues: ['Geste court', 'Reviens à la joue'], keyPoints: ['Ne pas chercher la main adverse', 'La main ne dépasse pas l’épaule opposée'],
  },
  {
    id: 'retrait', name: 'Retrait de buste', call: 'Retrait', category: 'defense', disciplines: ALL, motion: 'retrait',
    description: 'Le poids passe sur la jambe arrière et le buste recule juste hors de portée.',
    cues: ['Poids sur la jambe arrière', 'Menton rentré'], keyPoints: ['Ne pas se cambrer', 'Revenir aussitôt en position'],
  },
  {
    id: 'check-avant', name: 'Check (blocage tibia)', call: 'Check', category: 'defense', disciplines: KICK, motion: 'check-avant',
    description: 'La jambe avant monte, genou vers l’extérieur, pour bloquer un low kick avec le tibia.',
    cues: ['Lève le genou vers l’extérieur', 'Garde haute'], keyPoints: ['Le genou et le coude se rapprochent', 'Reposer le pied en garde'],
  },
  {
    id: 'check-arriere', name: 'Check jambe arrière', call: 'Check arrière', category: 'defense', disciplines: KICK, motion: 'check-arriere',
    description: 'Blocage d’un low kick avec le tibia de la jambe arrière.',
    cues: ['Lève le genou'], keyPoints: ['Rester équilibré sur la jambe d’appui'],
  },
  // ------------------------------------------------------------------ pieds
  {
    id: 'front-kick-avant', name: 'Front kick avant', call: 'Front kick', category: 'pied', disciplines: ['kickboxing', 'mma'], motion: 'front-kick-avant',
    description: 'Coup de pied de face : armé du genou, extension avec la plante avant du pied, retrait et reprise d’appui.',
    cues: ['Monte le genou', 'Frappe avec l’avant du pied'], keyPoints: ['Orteils relevés', 'Retour du pied par le même chemin'],
  },
  {
    id: 'front-kick-arriere', name: 'Front kick arrière', call: 'Front kick arrière', category: 'pied', disciplines: ['kickboxing', 'mma'], motion: 'front-kick-arriere',
    description: 'Front kick de la jambe arrière, avec plus de puissance et de distance.',
    cues: ['Genou haut', 'Hanche en avant'], keyPoints: ['Garde haute', 'Reposer en garde'],
  },
  {
    id: 'teep-avant', name: 'Teep', call: 'Teep', category: 'pied', disciplines: ['muaythai', 'mma'], motion: 'teep-avant',
    description: 'Coup de pied repoussant de la jambe avant : genou levé, hanche projetée, poussée avec la plante du pied.',
    cues: ['Lève le genou', 'Pousse avec la hanche'], keyPoints: ['Le buste recule légèrement', 'Le talon d’appui peut se lever'],
  },
  {
    id: 'teep-arriere', name: 'Teep arrière', call: 'Teep arrière', category: 'pied', disciplines: ['muaythai'], motion: 'teep-arriere',
    description: 'Teep de la jambe arrière pour repousser fort.', cues: ['Genou haut', 'Pousse'], keyPoints: ['Reposer le pied en garde'],
  },
  {
    id: 'low-kick-arriere', name: 'Low kick droit', call: 'Low kick droit', category: 'pied', disciplines: KICK, motion: 'low-kick-arriere',
    description: 'Coup de pied circulaire bas avec le tibia vers la cuisse : pivot du pied d’appui, rotation de la hanche.',
    cues: ['Pivote le pied d’appui', 'Tourne la hanche', 'Frappe avec le tibia'],
    keyPoints: ['Le talon d’appui pointe vers la cible', 'Trajectoire légèrement descendante', 'Main du côté qui frappe protège ou équilibre'],
  },
  {
    id: 'low-kick-avant', name: 'Low kick gauche', call: 'Low kick gauche', category: 'pied', disciplines: KICK, motion: 'low-kick-avant',
    description: 'Low kick de la jambe avant, souvent à l’intérieur de la cuisse.', cues: ['Petit pas d’appui', 'Tibia'], keyPoints: ['Garde haute'],
  },
  {
    id: 'middle-kick-arriere', name: 'Middle kick droit', call: 'Middle kick', category: 'pied', disciplines: KICK, motion: 'middle-kick-arriere',
    description: 'Coup de pied circulaire au corps avec le tibia : pivot complet, hanche qui passe, jambe qui traverse la cible.',
    cues: ['Pivote', 'Tourne la hanche', 'Traverse la cible'], keyPoints: ['Pied d’appui sur l’avant', 'Le buste s’incline légèrement en arrière'],
  },
  {
    id: 'middle-kick-avant', name: 'Middle kick gauche', call: 'Middle kick gauche', category: 'pied', disciplines: KICK, motion: 'middle-kick-avant',
    description: 'Middle kick de la jambe avant, rapide, souvent après un changement d’appui.', cues: ['Hanche'], keyPoints: ['Garde droite haute'],
  },
  {
    id: 'high-kick-arriere', name: 'High kick droit', call: 'High kick', category: 'pied', disciplines: KICK, motion: 'high-kick-arriere',
    description: 'Coup de pied circulaire à la tête : pivot maximal, hanche ouverte, buste incliné pour monter la jambe.',
    cues: ['Pivote fort', 'Ouvre la hanche', 'Garde haute'], keyPoints: ['Ne pas monter plus haut que sa souplesse', 'Équilibre sur l’avant du pied'],
  },
  {
    id: 'high-kick-avant', name: 'High kick gauche', call: 'High kick gauche', category: 'pied', disciplines: KICK, motion: 'high-kick-avant',
    description: 'High kick de la jambe avant.', cues: ['Hanche', 'Garde'], keyPoints: ['Retour rapide en garde'],
  },
  {
    id: 'roundhouse-arriere', name: 'Roundhouse kick', call: 'Roundhouse', category: 'pied', disciplines: ['kickboxing', 'mma'], motion: 'roundhouse-arriere',
    description: 'Coup de pied circulaire de kick-boxing : armé du genou, extension avec le cou-de-pied, réarmé avant de reposer.',
    cues: ['Arme le genou', 'Fouette', 'Réarme'], keyPoints: ['Pied d’appui pivoté', 'Le pied revient par le même chemin'],
  },
  {
    id: 'roundhouse-avant', name: 'Roundhouse jambe avant', call: 'Roundhouse avant', category: 'pied', disciplines: ['kickboxing'], motion: 'roundhouse-avant',
    description: 'Roundhouse de la jambe avant, armé court et fouetté.', cues: ['Arme', 'Fouette'], keyPoints: ['Réarmer avant de reposer'],
  },
  // ------------------------------------------------------------------ genoux & coudes
  {
    id: 'genou-direct-arriere', name: 'Genou direct', call: 'Genou', category: 'genou', disciplines: ['muaythai', 'mma'], motion: 'genou-direct-arriere',
    description: 'Le genou arrière monte vers l’avant, la hanche pousse, le pied d’appui est sur la pointe.',
    cues: ['Hanche en avant', 'Sur la pointe du pied'], keyPoints: ['Pointe du pied tendue vers le bas', 'Mains en cadre devant'],
  },
  {
    id: 'genou-direct-avant', name: 'Genou direct avant', call: 'Genou avant', category: 'genou', disciplines: ['muaythai'], motion: 'genou-direct-avant',
    description: 'Genou de la jambe avant, court et rapide.', cues: ['Hanche'], keyPoints: ['Équilibre sur la jambe arrière'],
  },
  {
    id: 'genou-circulaire-arriere', name: 'Genou circulaire', call: 'Genou circulaire', category: 'genou', disciplines: ['muaythai'], motion: 'genou-circulaire-arriere',
    description: 'Le genou arrive par le côté vers les côtes, avec rotation de la hanche.',
    cues: ['Ouvre la hanche', 'Le genou vient de côté'], keyPoints: ['Pivot du pied d’appui'],
  },
  {
    id: 'genou-circulaire-avant', name: 'Genou circulaire avant', call: 'Genou circulaire avant', category: 'genou', disciplines: ['muaythai'], motion: 'genou-circulaire-avant',
    description: 'Genou circulaire de la jambe avant.', cues: ['Hanche'], keyPoints: ['Garde l’équilibre'],
  },
  {
    id: 'coude-horizontal-avant', name: 'Coude horizontal gauche', call: 'Coude', category: 'coude', disciplines: ['muaythai'], motion: 'coude-horizontal-avant',
    description: 'Le coude avant balaie horizontalement à hauteur du menton, avant-bras parallèle au sol, rotation du corps.',
    cues: ['Coude à hauteur d’épaule', 'Tourne le corps'], keyPoints: ['La main reste ouverte ou fermée près de la tête', 'Distance très courte'],
  },
  {
    id: 'coude-horizontal-arriere', name: 'Coude horizontal droit', call: 'Coude droit', category: 'coude', disciplines: ['muaythai'], motion: 'coude-horizontal-arriere',
    description: 'Coude horizontal du bras arrière avec pivot du pied arrière.', cues: ['Pivote', 'Coude à hauteur du menton'], keyPoints: ['Main gauche en protection'],
  },
  {
    id: 'coude-diagonal-arriere', name: 'Coude diagonal descendant', call: 'Coude diagonal', category: 'coude', disciplines: ['muaythai'], motion: 'coude-diagonal-arriere',
    description: 'Le coude part haut et descend en diagonale vers le visage, avec flexion des jambes.',
    cues: ['Monte le coude', 'Coupe vers le bas'], keyPoints: ['Le poids descend avec le coude'],
  },
  {
    id: 'coude-diagonal-avant', name: 'Coude diagonal avant', call: 'Coude diagonal gauche', category: 'coude', disciplines: ['muaythai'], motion: 'coude-diagonal-avant',
    description: 'Coude diagonal descendant du bras avant.', cues: ['Coupe vers le bas'], keyPoints: ['Garde droite haute'],
  },
  {
    id: 'coude-montant-arriere', name: 'Coude remontant', call: 'Coude remontant', category: 'coude', disciplines: ['muaythai'], motion: 'coude-montant-arriere',
    description: 'Le coude remonte verticalement devant le visage, comme un uppercut très court.',
    cues: ['Fléchis puis remonte', 'Le coude passe devant ton nez'], keyPoints: ['Trajectoire verticale', 'Main proche de l’oreille'],
  },
  {
    id: 'coude-montant-avant', name: 'Coude remontant avant', call: 'Coude remontant gauche', category: 'coude', disciplines: ['muaythai'], motion: 'coude-montant-avant',
    description: 'Coude remontant du bras avant.', cues: ['Remonte'], keyPoints: ['Court et vertical'],
  },
  {
    id: 'clinch-tirage', name: 'Clinch simulé (tirage)', call: 'Clinch', category: 'clinch', disciplines: ['muaythai'], motion: 'clinch-tirage',
    description: 'Démonstration solo : les mains se verrouillent derrière une nuque imaginaire, les coudes serrent, puis tirage vers le bas et rotation.',
    cues: ['Mains derrière la nuque', 'Coudes serrés', 'Tire et tourne'], keyPoints: ['Démonstration sans partenaire', 'Hanches proches de l’adversaire imaginaire'],
    soloNote: 'Démonstration solo : aucun partenaire n’est représenté, le travail réel du clinch se fait à deux.',
  },
  {
    id: 'genou-clinch', name: 'Genou dans le clinch', call: 'Genou', category: 'clinch', disciplines: ['muaythai'], motion: 'genou-direct-arriere-clinch',
    description: 'Genou direct pendant que les mains tiennent une nuque imaginaire et tirent vers le bas.',
    cues: ['Tire vers le bas', 'Hanche en avant'], keyPoints: ['Démonstration solo'],
    soloNote: 'Démonstration solo : le contrôle du clinch se travaille avec un partenaire.',
  },
  {
    id: 'genou-circulaire-clinch', name: 'Genou circulaire dans le clinch', call: 'Genou circulaire', category: 'clinch', disciplines: ['muaythai'], motion: 'genou-circulaire-arriere-clinch',
    description: 'Genou circulaire vers les côtes depuis le clinch simulé.', cues: ['Tire', 'Genou de côté'], keyPoints: ['Démonstration solo'],
    soloNote: 'Démonstration solo : le contrôle du clinch se travaille avec un partenaire.',
  },
  // ------------------------------------------------------------------ feintes & MMA
  {
    id: 'feinte-jab', name: 'Feinte de jab', call: 'Feinte', category: 'feinte', disciplines: ALL, motion: 'feinte-jab',
    description: 'Début de jab court et sec, sans engager, pour provoquer une réaction.', cues: ['Court et sec'], keyPoints: ['Ne pas perdre la garde'],
  },
  {
    id: 'feinte-epaule', name: 'Feinte d’épaule', call: 'Feinte d’épaule', category: 'feinte', disciplines: ALL, motion: 'feinte-epaule',
    description: 'L’épaule arrière annonce un direct qui ne part pas.', cues: ['Épaule seulement'], keyPoints: ['Les pieds restent stables'],
  },
  {
    id: 'feinte-lutte', name: 'Feinte de lutte', call: 'Feinte de lutte', category: 'feinte', disciplines: ['mma'], motion: 'feinte-lutte',
    description: 'Changement de niveau rapide qui menace une entrée en lutte, puis retour en garde.', cues: ['Descends vite', 'Remonte en garde'],
    keyPoints: ['La tête reste haute', 'Le dos reste droit'],
  },
  {
    id: 'changement-niveau', name: 'Changement de niveau', call: 'Change de niveau', category: 'lutte', disciplines: ['mma'], motion: 'changement-niveau',
    description: 'Les hanches descendent par la flexion des jambes, dos droit, tête haute, mains devant prêtes à saisir.',
    cues: ['Fléchis les jambes, pas le dos', 'Tête haute'], keyPoints: ['Les genoux restent au-dessus des pieds', 'Les mains ne tombent pas'],
  },
  {
    id: 'entree-lutte', name: 'Entrée en double-leg (solo)', call: 'Entrée', category: 'lutte', disciplines: ['mma'], motion: 'entree-lutte',
    description: 'Changement de niveau puis pas de pénétration profond : le genou arrière descend près du sol, les mains entourent des jambes imaginaires.',
    cues: ['Pas de pénétration', 'Tête haute', 'Pousse avec les jambes'],
    keyPoints: ['Le genou effleure le sol sans choc', 'Le dos reste droit', 'Démonstration sans partenaire'],
    soloNote: 'Adaptation shadow : sans partenaire, l’entrée montre le placement et le pas, pas la projection.',
  },
  {
    id: 'sprawl', name: 'Sprawl', call: 'Sprawl', category: 'lutte', disciplines: ['mma'], motion: 'sprawl',
    description: 'Défense contre l’entrée en lutte : mains au sol, jambes projetées en arrière, hanches lourdes vers le sol, puis retour en garde.',
    cues: ['Jambes en arrière', 'Hanches au sol', 'Remonte en garde'],
    keyPoints: ['Les jambes s’écartent', 'La tête reste haute', 'Retour rapide sur les pieds'],
  },
  {
    id: 'defense-lutte', name: 'Défense d’entrée en lutte', call: 'Défends', category: 'lutte', disciplines: ['mma'], motion: 'defense-lutte',
    description: 'Hanches en arrière, mains qui cadrent vers le bas sur des épaules imaginaires, pied arrière qui recule.',
    cues: ['Hanches en arrière', 'Cadre avec les mains'], keyPoints: ['Ne pas se pencher sans reculer les hanches'],
  },
  {
    id: 'descente-sol', name: 'Descente contrôlée au sol', call: 'Au sol', category: 'sol', disciplines: ['mma'], motion: 'descente-sol',
    description: 'Passage contrôlé de la garde debout à la position assise, main posée derrière, pied planté devant.',
    cues: ['Descends en contrôle', 'Main derrière'], keyPoints: ['Ne pas tomber sur le coccyx', 'La main protège toujours le visage'],
  },
  {
    id: 'sortie-hanche', name: 'Sortie de hanche', call: 'Sortie de hanche', category: 'sol', disciplines: ['mma'], motion: 'sortie-hanche',
    description: 'Au sol, les hanches glissent en arrière en poussant sur le pied et la main pour créer de l’espace.',
    cues: ['Pousse avec le pied', 'Hanches en arrière'], keyPoints: ['Le coude reste près du corps'],
    soloNote: 'Mouvement de mobilité au sol réalisé seul.',
  },
  {
    id: 'releve-technique', name: 'Relevé technique', call: 'Relève-toi', category: 'sol', disciplines: ['mma'], motion: 'releve-technique',
    description: 'Depuis l’assise : main et pied posés, les hanches se lèvent, la jambe passe en arrière, retour en garde à distance.',
    cues: ['Main et pied au sol', 'Lève les hanches', 'Jambe en arrière'], keyPoints: ['La main libre protège le visage', 'Revenir en garde, pas debout droit'],
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
};
