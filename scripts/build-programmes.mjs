#!/usr/bin/env node
/**
 * Génère public/catalog/programmes-v1.json : les combinaisons tirées des programmes officiels des fédérations
 * (Youssef 2026-11-06 : « que des combinaisons d'entraînement vérifiées et validées par les fédérations »).
 *
 * Règle : chaque fiche reprend un enchaînement ÉCRIT dans un document officiel (document, page, exercice,
 * citation exacte). Quand le document laisse un choix (« bras avant et/ou arrière »), le choix fait ici est
 * écrit dans `solo`. Un enchaînement dont un geste n'existe pas dans le moteur n'est pas saisi (liste dans
 * docs/catalogue-valide/SOURCES.md). Aucune vidéo n'a servi de source. Documents lus le 2026-11-06.
 *
 * Usage : node scripts/build-programmes.mjs (résultat identique à chaque exécution).
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/catalog/programmes-v1.json');
const READ = '2026-11-06';

const orgs = [
  { id: 'ffboxe', name: 'FFBoxe', fullName: 'Fédération française de boxe', url: 'https://www.ffboxe.com/', disciplines: ['boxe'] },
  { id: 'ffkmda', name: 'FFKMDA', fullName: 'Fédération française de kickboxing, muaythai et disciplines associées', url: 'https://www.ffkmda.com/', disciplines: ['kickboxing', 'muaythai'] },
];

const DOCS = {
  'gb': { org: 'ffboxe', grade: 'Gant blanc', level: 'debutant', document: 'Livret explicatif du Gant blanc (dispositif des gants de couleur, 31/08/2023)', url: 'https://www.ffboxe.com/wp-content/uploads/2023/09/Livret-explicatif-du-Gant-Blanc-31.08.2023-ok-MT.pdf' },
  'gj': { org: 'ffboxe', grade: 'Gant jaune', level: 'debutant', document: 'Livret explicatif du Gant jaune (dispositif des gants de couleur, mis en ligne en janvier 2025)', url: 'https://www.ffboxe.com/wp-content/uploads/2025/01/Livret-explicatif-du-GANT-JAUNE.pdf' },
  'go': { org: 'ffboxe', grade: 'Gant orange', level: 'intermediaire', document: 'Fiches ateliers du Gant orange (au 01/09/2025)', url: 'https://www.ffboxe.com/wp-content/uploads/2025/09/Fiches-Ateliers-GANT-ORANGE-au-01_09_2025.pdf' },
  'gr': { org: 'ffboxe', grade: 'Gant rouge', level: 'avance', document: 'Fiches ateliers du Gant rouge (au 01/09/2025)', url: 'https://www.ffboxe.com/wp-content/uploads/2025/09/Fiches-ateliers-du-GANT-ROUGE-au-01_09_2025.pdf' },
  'pj': { org: 'ffkmda', grade: 'Prajeet jaune', level: 'debutant', document: 'Référentiel techniques et grades Muaythai (juillet 2026), assauts à thèmes', url: 'https://www.ffkmda.com/wp-content/uploads/2026/07/2026-referentiel-techniques-et-grades-Muaythai-FFKMDA-officiel.pdf' },
  'po': { org: 'ffkmda', grade: 'Prajeet orange', level: 'intermediaire', document: 'Référentiel techniques et grades Muaythai (juillet 2026), assauts à thèmes', url: 'https://www.ffkmda.com/wp-content/uploads/2026/07/2026-referentiel-techniques-et-grades-Muaythai-FFKMDA-officiel.pdf' },
  'pv': { org: 'ffkmda', grade: 'Prajeet vert', level: 'intermediaire', document: 'Référentiel techniques et grades Muaythai (juillet 2026), assauts à thèmes', url: 'https://www.ffkmda.com/wp-content/uploads/2026/07/2026-referentiel-techniques-et-grades-Muaythai-FFKMDA-officiel.pdf' },
};

const SHADOW = 'Seul, sans partenaire ni cible : tu reproduis l’enchaînement dans le vide, en garde.';

/** une fiche : d = document, n = numéro dans le document, puis le contenu pédagogique */
const F = [
  // ------------------------------------------------------------------ FFBoxe, gant blanc (débutant)
  {
    d: 'gb', n: 1, discipline: 'boxe', name: 'Deux directs : avant puis arrière', page: 17, exercise: 'Appareil technique, APT 2',
    quote: 'Doublés de Directs ou enchaînement de 2 Directs Poings avant ou arrière à la face ou au buste',
    solo: `${SHADOW} Le document laisse le choix des poings et des cibles : ici poing avant puis poing arrière, à la face.`,
    sequence: ['jab', 'direct'], distance: 'longue', goal: 'technique', tags: ['offensif'], sec: 1.5,
    objective: 'Enchaîner tes deux premiers coups droits sans perdre ta garde : la base de toute la boxe.',
    keyPoints: ['Le poing avant part seul, le corps suit à peine', 'Le direct arrière part pendant que le jab revient', 'Les deux mains reviennent au visage'],
    errors: ['Baisser la main qui ne frappe pas', 'Pencher la tête en avant au lieu de tourner les hanches'],
    variants: [{ label: 'Les deux directs au buste', sequence: ['jab-corps', 'direct-corps'] }],
  },
  {
    d: 'gb', n: 2, discipline: 'boxe', name: 'Doublé de directs du poing avant', page: 17, exercise: 'Appareil technique, APT 2',
    quote: 'Doublés de Directs ou enchaînement de 2 Directs Poings avant ou arrière à la face ou au buste',
    solo: `${SHADOW} Ici le « doublé » est fait avec le poing avant, à la face.`,
    sequence: ['jab', 'jab'], distance: 'longue', goal: 'deplacement', tags: ['offensif', 'deplacement'], sec: 1.2,
    objective: 'Doubler le jab pour garder l’adversaire à distance et préparer la suite.',
    keyPoints: ['Le second jab part dès que le premier revient', 'Un petit pas en avant sur chaque jab', 'Le poing arrière reste collé au menton'],
    errors: ['Ramener le poing trop bas entre les deux jabs', 'Faire deux grands pas qui te déséquilibrent'],
    variants: [{ label: 'Le second jab au buste', sequence: ['jab', 'jab-corps'] }],
  },
  {
    d: 'gb', n: 3, discipline: 'boxe', name: 'Direct arrière puis jab', page: 10, exercise: 'Échelle de rythme, exercice 2_GB_ECR.8',
    quote: 'Appui Avt / D.Pg Arr Face et Appui Arr / D.Pg Avt Face.',
    solo: `${SHADOW} Sans échelle au sol : garde le même rythme d’appuis, sur place ou en avançant.`,
    sequence: ['direct', 'jab'], distance: 'longue', goal: 'technique', tags: ['offensif'], sec: 1.5,
    objective: 'Commencer par le bras arrière et revenir vite au jab, en suivant le rythme de tes appuis.',
    keyPoints: ['Un coup par appui, comme dans l’échelle', 'Après le direct, les hanches reviennent pour lancer le jab', 'Regard fixe devant toi'],
    errors: ['Rester bloqué sur la jambe avant après le direct', 'Frapper sans suivre le rythme des pieds'],
    variants: [{ label: 'En reculant d’un pas après le jab' }],
  },
  {
    d: 'gb', n: 4, discipline: 'boxe', name: 'Jab au visage, direct au buste', page: 10, exercise: 'Échelle de rythme, exercice 2_GB_ECR.9',
    quote: 'Appui Avt / D.Pg Avt Face et Appui Arr / D.Pg Arr Buste.',
    solo: `${SHADOW} Sans échelle au sol : un coup par appui, sur place ou en avançant.`,
    sequence: ['jab', 'direct-corps'], distance: 'moyenne', goal: 'technique', tags: ['offensif', 'corps'], sec: 1.6,
    objective: 'Changer de hauteur : un jab en haut, puis le direct arrière au buste.',
    keyPoints: ['Pour le buste, plie les genoux au lieu de baisser la tête', 'Le jab attire le regard en haut', 'Remonte en garde après le coup au buste'],
    errors: ['Se pencher en avant pour toucher le buste', 'Baisser la main avant pendant le direct au corps'],
    variants: [{ label: 'Les deux directs au visage', sequence: ['jab', 'direct'] }],
  },
  {
    d: 'gb', n: 5, discipline: 'boxe', name: 'Direct au buste, jab au visage', page: 10, exercise: 'Échelle de rythme, exercice 2_GB_ECR10',
    quote: 'Appui Avt / D.Pg Arr Buste et Appui Arr / D.Pg Avt Face.',
    solo: `${SHADOW} Sans échelle au sol : un coup par appui, sur place ou en reculant.`,
    sequence: ['direct-corps', 'jab'], distance: 'moyenne', goal: 'technique', tags: ['offensif', 'corps'], sec: 1.6,
    objective: 'Ouvrir au buste avec le bras arrière, puis remonter au visage avec le jab.',
    keyPoints: ['Plie les genoux pour le coup au buste', 'Remonte sur les jambes en lançant le jab', 'Garde le menton rentré'],
    errors: ['Rester bas après le coup au buste', 'Lancer le jab avant d’avoir repris ton équilibre'],
    variants: [{ label: 'Le jab en reculant d’un pas' }],
  },
  // ------------------------------------------------------------------ FFBoxe, gant jaune (débutant)
  {
    d: 'gj', n: 1, discipline: 'boxe', name: 'Parade, direct, crochet, direct', page: 16, exercise: 'Appareil technique, APT 1 (enchaînement imposé)',
    quote: 'Parade Avant-Bras + Direct Arr Face + Crochet Av Face + Direct Arr Face',
    solo: `${SHADOW} La parade avec l’avant-bras est jouée ici par le blocage haut de l’app.`,
    sequence: ['blocage-haut', 'direct', 'crochet-avant', 'direct'], distance: 'moyenne', goal: 'defense', tags: ['defense-contre'], sec: 2.4,
    objective: 'Bloquer d’abord, puis répondre tout de suite avec trois coups en alternant les bras.',
    keyPoints: ['Le blocage est court : tu ripostes dès qu’il est fini', 'Le crochet avant part sur la rotation des hanches', 'Le dernier direct est aussi fort que le premier'],
    errors: ['Garder les bras en blocage trop longtemps', 'Ouvrir le coude du crochet trop loin du corps'],
    variants: [{ label: 'Le dernier direct au buste', sequence: ['blocage-haut', 'direct', 'crochet-avant', 'direct-corps'] }],
  },
  {
    d: 'gj', n: 2, discipline: 'boxe', name: 'Jab, crochet avant, direct', page: 16, exercise: 'Appareil technique, APT 1 (enchaînement imposé)',
    quote: 'Direct Av Face + Crochet Av Face + Direct Arr Face',
    solo: `${SHADOW} Le même enchaînement est aussi demandé au gant rouge (oppositions, LCO 2, page 14).`,
    sequence: ['jab', 'crochet-avant', 'direct'], distance: 'moyenne', goal: 'technique', tags: ['offensif'], sec: 2,
    objective: 'Doubler le bras avant (direct puis crochet) avant de finir avec le bras arrière.',
    keyPoints: ['Le crochet suit le jab sans revenir en garde', 'Pivote le pied avant sur le crochet', 'Le direct finit l’enchaînement, poids sur la jambe avant'],
    errors: ['Armer le crochet en reculant le bras', 'Oublier de pivoter le pied avant'],
    variants: [{ label: 'Le crochet au buste', sequence: ['jab', 'crochet-avant-corps', 'direct'] }],
  },
  {
    d: 'gj', n: 3, discipline: 'boxe', name: 'Jab, crochet avant, puis blocage', page: 18, exercise: 'Oppositions, LCO 1 (boxeur A)',
    quote: 'A : Attaque en enchainement + Parade Bloquée (Direct Avant Face + Crochet Avant Face)',
    solo: `${SHADOW} La parade bloquée est jouée ici par le blocage haut de l’app ; en club, le partenaire contre-attaque à ce moment.`,
    sequence: ['jab', 'crochet-avant', 'blocage-haut'], distance: 'moyenne', goal: 'defense', tags: ['offensif', 'defense-contre'], sec: 1.8,
    objective: 'Attaquer à deux coups, puis te protéger tout de suite : on ne reste jamais découvert après une attaque.',
    keyPoints: ['Les mains reviennent dès le crochet fini', 'Coudes serrés et menton rentré pour le blocage', 'Les yeux restent ouverts derrière les gants'],
    errors: ['Admirer son crochet au lieu de remonter la garde', 'Fermer les yeux pendant le blocage'],
    variants: [{ label: 'Avec un pas en arrière après le blocage' }],
  },
  {
    d: 'gj', n: 4, discipline: 'boxe', name: 'Crochet avant, direct, deux parades', page: 11, exercise: 'Carré boxe 1, côté 1',
    quote: 'Crochet Avant Face / Appui Avant — Direct Arrière Face / Appui Arrière — 2 Parades sur place',
    solo: `${SHADOW} Le carré boxe se fait en se déplaçant sur les quatre côtés d’un carré ; seul, fais un côté, puis tourne d’un quart de tour.`,
    sequence: ['crochet-avant', 'direct', 'parade', 'parade'], distance: 'moyenne', goal: 'technique', tags: ['offensif', 'defense-contre'], sec: 2.4,
    objective: 'Ouvrir avec le crochet avant, finir au direct, puis te protéger sur place.',
    keyPoints: ['Le crochet part sur l’appui avant, le direct sur l’appui arrière', 'Les parades sont de petits gestes, sans ouvrir la garde', 'Reste sur place pendant les parades'],
    errors: ['Faire des parades trop grandes qui ouvrent le visage', 'Frapper sans suivre l’appui indiqué'],
    variants: [{ label: 'Le carré complet : enchaîne les quatre côtés' }],
  },
  {
    d: 'gj', n: 5, discipline: 'boxe', name: 'Deux crochets, deux parades', page: 11, exercise: 'Carré boxe 1, côté 2',
    quote: 'Crochet Avant Face / Appui Arrière — Crochet Arrière Face / Appui Avant — 2 Parades sur place',
    solo: `${SHADOW} Seul, fais ce côté du carré en avançant, puis tourne d’un quart de tour.`,
    sequence: ['crochet-avant', 'crochet-arriere', 'parade', 'parade'], distance: 'courte', goal: 'technique', tags: ['offensif', 'defense-contre'], sec: 2.4,
    objective: 'Enchaîner les deux crochets en tournant les hanches d’un côté puis de l’autre, puis parer.',
    keyPoints: ['Les hanches tournent pour chaque crochet', 'Le bras reste plié, coude à hauteur du poing', 'Deux parades courtes pour finir'],
    errors: ['Tendre le bras sur le crochet', 'Oublier de revenir en garde entre les deux crochets'],
    variants: [{ label: 'Le second crochet au buste', sequence: ['crochet-avant', 'crochet-arriere-corps', 'parade', 'parade'] }],
  },
  {
    d: 'gj', n: 6, discipline: 'boxe', name: 'Direct, crochet avant, deux parades', page: 11, exercise: 'Carré boxe 1, côté 3',
    quote: 'Direct Arrière Face / Appui Arrière — Crochet Avant Face / Appui Avant — 2 Parades sur place',
    solo: `${SHADOW} Seul, fais ce côté du carré, puis tourne d’un quart de tour.`,
    sequence: ['direct', 'crochet-avant', 'parade', 'parade'], distance: 'moyenne', goal: 'technique', tags: ['offensif', 'defense-contre'], sec: 2.4,
    objective: 'Le direct arrière charge la jambe avant : le crochet avant repart naturellement de là.',
    keyPoints: ['Le direct fait tourner les hanches, le crochet les ramène', 'Le crochet reste court', 'Parades sur place, sans reculer'],
    errors: ['Rester penché après le direct', 'Lancer le crochet de trop loin'],
    variants: [{ label: 'Le carré complet : enchaîne les quatre côtés' }],
  },
  {
    d: 'gj', n: 7, discipline: 'boxe', name: 'Crochet arrière, crochet avant, deux parades', page: 11, exercise: 'Carré boxe 1, côté 4',
    quote: 'Crochet Arrière Face / Appui Avant — Crochet Avant Face / Appui Arrière — 2 Parades sur place',
    solo: `${SHADOW} Seul, fais ce côté du carré, puis tourne d’un quart de tour.`,
    sequence: ['crochet-arriere', 'crochet-avant', 'parade', 'parade'], distance: 'courte', goal: 'technique', tags: ['offensif', 'defense-contre'], sec: 2.4,
    objective: 'Commencer par le crochet du bras arrière et répondre aussitôt avec le bras avant.',
    keyPoints: ['Le crochet arrière fait pivoter le pied arrière', 'Le crochet avant ramène les hanches', 'Menton rentré du début à la fin'],
    errors: ['Faire un grand geste circulaire avec le bras arrière', 'Se pencher sur le côté au lieu de tourner'],
    variants: [{ label: 'Le carré complet : enchaîne les quatre côtés' }],
  },
  // ------------------------------------------------------------------ FFBoxe, gant orange (intermédiaire)
  {
    d: 'go', n: 1, discipline: 'boxe', name: 'Direct, crochet, uppercut', page: 7, exercise: 'Carré boxe 1 (les quatre côtés)',
    quote: 'Enchainement successif et sans interruption (à la Face) : Direct – Crochet – Uppercut',
    solo: `${SHADOW} Le document ne précise pas les bras : ici bras arrière, bras avant, bras arrière, pour alterner. Le changement de garde demandé sur deux côtés du carré n’est pas joué par le coach.`,
    sequence: ['direct', 'crochet-avant', 'uppercut-arriere'], distance: 'moyenne', goal: 'technique', tags: ['offensif', 'uppercut'], sec: 2,
    objective: 'Les trois familles de coups (droit, circulaire, remontant) dans un seul enchaînement, sans pause.',
    keyPoints: ['Chaque coup part de la rotation du précédent', 'L’uppercut monte par une petite flexion des jambes', 'Pas d’arrêt entre les coups'],
    errors: ['Armer l’uppercut en baissant le bras', 'Faire une pause entre deux coups'],
    variants: [{ label: 'En commençant par le jab', sequence: ['jab', 'crochet-arriere', 'uppercut-avant'] }],
  },
  {
    d: 'go', n: 2, discipline: 'boxe', name: 'Jab, uppercut arrière, crochet avant, blocage', page: 8, exercise: 'Carré boxe 2, côté 1',
    quote: 'Direct Avant Face en contrôle / Uppercut Arrière Face en déplacement Oblique avant / Crochet Avant Face en retour d’appuis / Parade avant-bras en décalage sur les 2 appuis',
    solo: `${SHADOW} La parade avec l’avant-bras est jouée par le blocage haut de l’app ; les déplacements obliques se font sur place ou sur un petit pas.`,
    sequence: ['jab', 'uppercut-arriere', 'crochet-avant', 'blocage-haut'], distance: 'courte', goal: 'technique', tags: ['offensif', 'uppercut', 'angle'], sec: 2.6,
    objective: 'Contrôler avec le jab, entrer en oblique pour l’uppercut, finir au crochet et te protéger.',
    keyPoints: ['Le jab sert à mesurer la distance', 'Petit pas en oblique avant sur l’uppercut', 'Garde fermée dès le crochet fini'],
    errors: ['Entrer tout droit au lieu d’en oblique', 'Baisser la tête sur l’uppercut'],
    variants: [{ label: 'Sans le blocage final', sequence: ['jab', 'uppercut-arriere', 'crochet-avant'] }],
  },
  {
    d: 'go', n: 3, discipline: 'boxe', name: 'Deux uppercuts, crochet arrière, deux parades', page: 8, exercise: 'Carré boxe 2, enchaînements',
    quote: 'Uppercut Arr Face + Uppercut Av Face + Crochet Arr Face + 2 Parades (la 2e sur place)',
    solo: `${SHADOW} La première parade se fait en bougeant, la seconde sur place.`,
    sequence: ['uppercut-arriere', 'uppercut-avant', 'crochet-arriere', 'parade', 'parade'], distance: 'courte', goal: 'technique', tags: ['offensif', 'uppercut', 'defense-contre'], sec: 2.8,
    objective: 'Travailler à courte distance : deux uppercuts, un crochet, puis deux parades.',
    keyPoints: ['Les uppercuts restent près du corps', 'Les jambes donnent la force, pas les épaules', 'Deux parades courtes pour finir'],
    errors: ['Faire de grands uppercuts qui partent du bas', 'Rester immobile pendant la première parade'],
    variants: [{ label: 'Côté inverse', sequence: ['uppercut-avant', 'uppercut-arriere', 'crochet-avant', 'parade', 'parade'] }],
  },
  {
    d: 'go', n: 4, discipline: 'boxe', name: 'Deux uppercuts, crochet avant, deux parades', page: 8, exercise: 'Carré boxe 2, enchaînements',
    quote: 'Uppercut Av Face + Uppercut Arr Face + Crochet Av Face + 2 Parades (la 2e sur place)',
    solo: `${SHADOW} La première parade se fait en bougeant, la seconde sur place.`,
    sequence: ['uppercut-avant', 'uppercut-arriere', 'crochet-avant', 'parade', 'parade'], distance: 'courte', goal: 'technique', tags: ['offensif', 'uppercut', 'defense-contre'], sec: 2.8,
    objective: 'La même série en commençant par le bras avant, pour boxer des deux côtés.',
    keyPoints: ['L’uppercut avant part sur une petite flexion de la jambe avant', 'Le crochet avant ramène les hanches', 'Mains au visage pour les parades'],
    errors: ['Se redresser entre les deux uppercuts', 'Laisser tomber la main arrière'],
    variants: [{ label: 'Le crochet au buste', sequence: ['uppercut-avant', 'uppercut-arriere', 'crochet-avant-corps', 'parade', 'parade'] }],
  },
  {
    d: 'go', n: 5, discipline: 'boxe', name: 'Blocage, deux crochets au buste, crochet au visage', page: 12, exercise: 'Appareil technique, APT 1, enchaînement imposé (contre-attaquant)',
    quote: 'Parade avant-bras / Crochet Av Buste / Crochet Arr buste / Crochet Av Face',
    solo: `${SHADOW} La parade avec l’avant-bras est jouée par le blocage haut de l’app.`,
    sequence: ['blocage-haut', 'crochet-avant-corps', 'crochet-arriere-corps', 'crochet-avant'], distance: 'courte', goal: 'defense', tags: ['defense-contre', 'corps'], sec: 2.6,
    objective: 'Contre-attaquer après un blocage : deux crochets au corps, puis remonter au visage.',
    keyPoints: ['Plie les genoux pour les crochets au buste', 'Remonte sur les jambes pour le dernier crochet', 'Le blocage est court, la riposte immédiate'],
    errors: ['Se pencher en avant pour toucher le corps', 'Rester bas pour le crochet au visage'],
    variants: [{ label: 'Sans le blocage, en attaque', sequence: ['crochet-avant-corps', 'crochet-arriere-corps', 'crochet-avant'] }],
  },
  {
    d: 'go', n: 6, discipline: 'boxe', name: 'Jab, uppercut arrière, crochet avant', page: 5, exercise: 'Échelle de rythme, exercice GO_ECR.3',
    quote: '- Direct en contrôle - Décalage Appui Arrière / Uppercut Arrière Face - Décalage Appui Avant / Crochet Avant Face',
    solo: `${SHADOW} Sans échelle : fais le décalage par un petit pas sur le côté. Le « direct en contrôle » est joué par le jab.`,
    sequence: ['jab', 'uppercut-arriere', 'crochet-avant'], distance: 'courte', goal: 'deplacement', tags: ['offensif', 'uppercut', 'deplacement'], sec: 2,
    objective: 'Associer chaque coup à un décalage des appuis : on frappe en bougeant.',
    keyPoints: ['Un décalage d’appui pour chaque coup', 'Le jab garde l’adversaire à distance', 'Le crochet part sur l’appui avant'],
    errors: ['Frapper les pieds plantés au sol', 'Faire un trop grand pas qui te déséquilibre'],
    variants: [{ label: 'En partant vers l’autre côté (exercice GO_ECR.4)' }],
  },
  {
    d: 'go', n: 7, discipline: 'boxe', name: 'Direct arrière, uppercut avant', page: 5, exercise: 'Échelle de rythme, exercice GO_ECR.5',
    quote: 'Appui Arrière (dans échelle) / Direct arrière Face — Appui Avant (dans échelle) / Uppercut avant Face',
    solo: `${SHADOW} Sans échelle au sol : un coup par appui, en avançant.`,
    sequence: ['direct', 'uppercut-avant'], distance: 'moyenne', goal: 'technique', tags: ['offensif', 'uppercut'], sec: 1.5,
    objective: 'Le direct arrière charge la jambe avant, l’uppercut avant en profite pour monter.',
    keyPoints: ['Après le direct, le poids est sur la jambe avant : l’uppercut part de là', 'Le poing de l’uppercut monte paume vers toi', 'Retour en garde aussitôt'],
    errors: ['Reculer le bras avant pour armer l’uppercut', 'Se redresser trop haut'],
    variants: [{ label: 'Garde inversée (exercice GO_ECR.6)' }],
  },
  // ------------------------------------------------------------------ FFBoxe, gant rouge (avancé)
  {
    d: 'gr', n: 1, discipline: 'boxe', name: 'Crochet avant, uppercut arrière, jab en reculant', page: 5, exercise: 'Échelle de rythme, exercice GR_ECR.3',
    quote: '- Crochet Avant Face + Uppercut Arrière Face REMOBILISATION = Retrait en Direct avant Face',
    solo: `${SHADOW} Le « retrait en direct avant » est joué par le jab : lance-le en reculant d’un pas.`,
    sequence: ['crochet-avant', 'uppercut-arriere', 'jab'], distance: 'courte', goal: 'deplacement', tags: ['offensif', 'uppercut', 'deplacement'], sec: 2,
    objective: 'Frapper à courte distance, puis ressortir en touchant avec le jab.',
    keyPoints: ['Le crochet et l’uppercut partent près du corps', 'Le jab part pendant que tu recules', 'Tu ressors toujours en garde'],
    errors: ['Reculer sans frapper', 'Reculer en ligne droite trop longtemps'],
    variants: [{ label: 'Garde inversée (exercice GJ_ECR.4 de la même page)' }],
  },
  {
    d: 'gr', n: 2, discipline: 'boxe', name: 'Direct arrière, crochet arrière, uppercut avant', page: 5, exercise: 'Échelle de rythme, exercice imprimé « GJ_ECR.5 »',
    quote: '- Appuis Avant / Direct arrière Face - Crochet Arrière Face + Uppercut Avant Face',
    solo: `${SHADOW} Sans échelle au sol : un coup par appui. Le code de l’exercice est imprimé « GJ » sur la fiche du gant rouge.`,
    sequence: ['direct', 'crochet-arriere', 'uppercut-avant'], distance: 'courte', goal: 'technique', tags: ['offensif', 'uppercut'], sec: 2,
    objective: 'Doubler le bras arrière (droit puis circulaire) avant l’uppercut du bras avant.',
    keyPoints: ['Le crochet arrière repart sans revenir complètement en garde', 'Les hanches font le travail', 'L’uppercut avant monte depuis les jambes'],
    errors: ['Perdre l’équilibre vers l’avant après le direct', 'Ouvrir la garde avant pendant le crochet arrière'],
    variants: [{ label: 'Garde inversée (exercice imprimé « GJ_ECR.6 »)' }],
  },
  {
    d: 'gr', n: 3, discipline: 'boxe', name: 'Direct arrière, crochet avant', page: 8, exercise: 'Carré boxe 2, enchaînements',
    quote: 'Direct Arr Face + Crochet Av Face',
    solo: `${SHADOW} Au gant rouge, l’enchaînement se fait en déplacement circulaire autour du partenaire : seul, tourne autour d’un point fixe.`,
    sequence: ['direct', 'crochet-avant'], distance: 'moyenne', goal: 'technique', tags: ['offensif', 'angle'], sec: 1.4,
    objective: 'Le duo classique, en tournant autour de l’adversaire pour changer d’angle.',
    keyPoints: ['Le direct charge la jambe avant, le crochet la décharge', 'Un petit pas de côté après le crochet', 'Garde haute pendant le déplacement'],
    errors: ['Croiser les pieds en tournant', 'Lancer le crochet de trop loin'],
    variants: [{ label: 'Avec un pivot sur l’appui avant après le crochet' }],
  },
  {
    d: 'gr', n: 4, discipline: 'boxe', name: 'Crochet avant, direct arrière', page: 8, exercise: 'Carré boxe 2, enchaînements',
    quote: 'Crochet Av Face + Direct Arr Face',
    solo: `${SHADOW} Seul, tourne autour d’un point fixe en gardant la distance.`,
    sequence: ['crochet-avant', 'direct'], distance: 'moyenne', goal: 'technique', tags: ['offensif'], sec: 1.4,
    objective: 'Le même duo à l’envers : le crochet ouvre, le direct passe au milieu.',
    keyPoints: ['Le crochet tourne les hanches, le direct les ramène', 'Le direct part en ligne droite vers le centre', 'Retour en garde aussitôt'],
    errors: ['Ouvrir le coude du crochet trop loin', 'Rester penché sur le côté après le crochet'],
    variants: [{ label: 'Le direct au buste', sequence: ['crochet-avant', 'direct-corps'] }],
  },
  // ------------------------------------------------------------------ FFKMDA, muay-thaï
  {
    d: 'pj', n: 1, discipline: 'muaythai', name: 'Parade et riposte du poing', page: 15, exercise: 'Assaut à thèmes n° 1 (défense)',
    quote: 'BANG MAT + MAT TRONG — Parade du bras et/avant ou arrière et riposte du bras avant et/ou arrière',
    solo: `${SHADOW} Le document laisse le choix des bras : ici parade, puis riposte du bras arrière. Bang Mat = parade avec la main ; Mat Trong = direct (lexique du référentiel, pages 4 et 10).`,
    sequence: ['parade', 'direct'], distance: 'moyenne', goal: 'defense', tags: ['defense-contre'], sec: 1.3,
    objective: 'Dévier le coup adverse et répondre aussitôt avec un direct.',
    keyPoints: ['La parade est un petit geste de la main', 'Le direct part juste après, sans attendre', 'Garde haute sur la riposte'],
    errors: ['Attraper au lieu de dévier', 'Riposter trop tard'],
    variants: [{ label: 'Riposte du bras avant', sequence: ['parade', 'jab'] }],
  },
  {
    d: 'pj', n: 2, discipline: 'muaythai', name: 'Parade de la jambe et riposte circulaire', page: 15, exercise: 'Assaut à thèmes n° 2 (défense)',
    quote: 'BANG TEI + TEI CHIANG — Parade jambe avant ou arrière et riposte jambe arrière',
    solo: `${SHADOW} Ici la parade se fait avec la jambe avant. Bang Tei = parade avec la jambe ; Tei Chiang = coup de pied circulaire niveau médian (lexique du référentiel, pages 5 et 10).`,
    sequence: ['check-avant', 'middle-kick-arriere'], distance: 'longue', goal: 'defense', tags: ['defense-contre', 'check', 'middle-kick'], sec: 1.8,
    objective: 'Bloquer le coup de pied avec le tibia, puis répondre avec ton circulaire au corps.',
    keyPoints: ['Genou levé vers l’extérieur pour la parade', 'Repose le pied et frappe tout de suite', 'Le circulaire tourne sur le pied d’appui'],
    errors: ['Reposer le pied trop loin, ce qui casse l’équilibre', 'Baisser les mains pendant la parade'],
    variants: [{ label: 'Parade avec la jambe arrière', sequence: ['check-arriere', 'middle-kick-arriere'] }],
  },
  {
    d: 'pj', n: 3, discipline: 'muaythai', name: 'Parade et riposte du genou', page: 15, exercise: 'Assaut à thèmes n° 3 (défense)',
    quote: 'BANG MAT + KHAO TRONG — Parade bras avant ou arrière et riposte jambe arrière',
    solo: `${SHADOW} Khao Trong = coup de genou direct (lexique du référentiel, page 7).`,
    sequence: ['parade', 'genou-direct-arriere'], distance: 'courte', goal: 'defense', tags: ['defense-contre', 'genoux'], sec: 1.5,
    objective: 'Dévier le poing adverse et entrer avec le genou arrière.',
    keyPoints: ['La parade ouvre le chemin du genou', 'Les hanches poussent vers l’avant', 'Monte sur la pointe du pied d’appui'],
    errors: ['Lever le genou sans pousser les hanches', 'Se pencher en arrière'],
    variants: [{ label: 'Parade du bras avant, même riposte' }],
  },
  {
    d: 'pj', n: 4, discipline: 'muaythai', name: 'Parade et riposte au corps', page: 15, exercise: 'Assaut à thèmes n° 4 (défense)',
    quote: 'BANG MAT +TEI CHIANG — Bras avant ou arrière et riposte jambe arrière',
    solo: `${SHADOW} Dans l’assaut, cette défense répond à un coup de pied direct (Tei Trong) ; seul, tu joues seulement la défense et la riposte.`,
    sequence: ['parade', 'middle-kick-arriere'], distance: 'longue', goal: 'defense', tags: ['defense-contre', 'middle-kick'], sec: 1.7,
    objective: 'Dévier avec la main, puis répondre avec le circulaire de la jambe arrière.',
    keyPoints: ['Parade courte, sans tourner le buste', 'Le circulaire part dès la parade finie', 'Le bras du côté de la jambe descend pour l’équilibre'],
    errors: ['Faire une grande parade qui t’ouvre', 'Frapper sans pivoter sur le pied d’appui'],
    variants: [{ label: 'Parade du bras avant, même riposte' }],
  },
  {
    d: 'po', n: 1, discipline: 'muaythai', name: 'Esquive en reculant, circulaire haut', page: 18, exercise: 'Assaut à thèmes n° 1 (défense)',
    quote: 'LOM TCHAK + TEI KANN KRO — Esquives par pas de retrait et riposte jambe avant et/ou arrière',
    solo: `${SHADOW} Ici la riposte se fait avec la jambe arrière. Lom Tchak = esquive avec déplacement des appuis ; Tei Kan Kro = coup de pied circulaire niveau haut (lexique du référentiel, pages 5 et 10).`,
    sequence: ['pas-arriere', 'high-kick-arriere'], distance: 'longue', goal: 'defense', tags: ['defense-contre', 'high-kick', 'deplacement'], sec: 1.8,
    objective: 'Laisser passer le coup adverse en reculant d’un pas, puis répondre en haut.',
    keyPoints: ['Le pied arrière recule en premier', 'Riposte dès que tu es stable', 'Hanche ouverte pour faire monter la jambe'],
    errors: ['Reculer trop loin pour pouvoir toucher', 'Baisser les mains pendant le coup de pied'],
    variants: [{ label: 'Riposte de la jambe avant', sequence: ['pas-arriere', 'high-kick-avant'] }],
  },
  {
    d: 'po', n: 3, discipline: 'muaythai', name: 'Circulaire au corps puis coup de pied frontal', page: 18, exercise: 'Assaut à thèmes n° 3 (attaque)',
    quote: 'TEI CHIANG + TIP TRONG — Jambe arrière et enchaînement jambe avant ou jambe arrière',
    solo: `${SHADOW} Ici le coup de pied frontal se fait avec la jambe avant. Tip Trong = coup de pied frontal (lexique du référentiel, page 5).`,
    sequence: ['middle-kick-arriere', 'teep-avant'], distance: 'longue', goal: 'technique', tags: ['middle-kick', 'teep', 'pieds'], sec: 2,
    objective: 'Doubler les jambes à distance : circulaire au corps, puis repousser avec le pied avant.',
    keyPoints: ['Repose le pied du circulaire en garde', 'Le teep pousse avec la plante du pied', 'Les mains restent hautes sur les deux coups'],
    errors: ['Reposer le pied du circulaire trop en avant', 'Lever le teep sans pousser les hanches'],
    variants: [{ label: 'Coup de pied frontal de la jambe arrière', sequence: ['middle-kick-arriere', 'teep-arriere'] }],
  },
  {
    d: 'pv', n: 1, discipline: 'muaythai', name: 'Deux directs puis coude descendant', page: 21, exercise: 'Assaut à thèmes n° 1 (attaque)',
    quote: 'MAT TRONG + SOK TAT — Bras avant et arrière suivi du coude avant ou arrière',
    solo: `${SHADOW} Ici le coude est celui du bras avant. Sok Tat = coup de coude circulaire descendant ; le coude diagonal descendant de l’app est le geste le plus proche.`,
    sequence: ['jab', 'direct', 'coude-diagonal-avant'], distance: 'courte', goal: 'technique', tags: ['offensif', 'coudes'], sec: 2,
    objective: 'Entrer avec les poings pour arriver à la distance du coude.',
    keyPoints: ['Les deux directs te font avancer', 'Le coude part haut et redescend', 'Les jambes fléchissent sur le coude'],
    errors: ['Lancer le coude de trop loin', 'Ouvrir la garde avant le coude'],
    variants: [{ label: 'Avec le coude arrière', sequence: ['jab', 'direct', 'coude-diagonal-arriere'] }],
  },
];

const combos = F.map((f) => {
  const doc = DOCS[f.d];
  const id = `${f.discipline}-${doc.org}-${f.d}-${String(f.n).padStart(2, '0')}`;
  return {
    id,
    name: f.name,
    discipline: f.discipline,
    champion: doc.org,
    status: 'programme',
    source: {
      kind: 'document',
      note: `Enchaînement écrit dans le programme officiel (${doc.grade}), travaillé seul`,
      reference: `${orgs.find((o) => o.id === doc.org).name}, ${doc.document}, p. ${f.page}, ${f.exercise}`,
      url: doc.url,
    },
    program: { org: doc.org, document: doc.document, url: doc.url, grade: doc.grade, page: f.page, exercise: f.exercise, quote: f.quote, solo: f.solo, consulted: READ },
    guard: 'les-deux',
    level: doc.level,
    distance: f.distance,
    sequence: f.sequence,
    objective: f.objective,
    keyPoints: f.keyPoints,
    errors: f.errors,
    estimatedSec: f.sec,
    variants: f.variants,
    goal: f.goal,
    tags: f.tags,
    addedAt: READ,
  };
});

const file = { schema: 1, version: '1.0.0', updatedAt: READ, champions: [], orgs, combos };
writeFileSync(OUT, JSON.stringify(file, null, 1) + '\n');
console.log(`${combos.length} fiches de programme → ${OUT}`);
