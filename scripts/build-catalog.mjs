#!/usr/bin/env node
/**
 * Génère public/catalog/catalog-v1.json : la bibliothèque des combinaisons de champions.
 *
 *   node scripts/build-catalog.mjs
 *
 * Déterministe (PRNG à graine fixe, aucun accès réseau) : relancer le script produit exactement le
 * même fichier. Chaque fiche générée a le statut « inspiree » : c’est une combinaison ORIGINALE qui
 * reprend des traits généraux et largement connus du style d’un champion. Aucune n’est présentée
 * comme une séquence réellement exécutée en combat (voir docs/CATALOGUE.md).
 *
 * Les techniques (catégories, disciplines autorisées) sont lues directement dans
 * src/domain/techniques.ts : une technique inconnue ou interdite dans la discipline ne peut pas
 * entrer dans le catalogue.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TECHNIQUES } from '../src/domain/techniques.ts';
import { GUIDES } from '../src/domain/guide.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/catalog/catalog-v1.json');
const VERSION = '1.0.0';
const ADDED_AT = '2026-10-17';
const TARGET = { boxe: 300, kickboxing: 250, mma: 300, muaythai: 250 };
const DISCS = ['boxe', 'kickboxing', 'mma', 'muaythai'];

// ------------------------------------------------------------------ PRNG déterministe
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rngFrom(seed) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ techniques
const T = new Map(TECHNIQUES.map((t) => [t.id, t]));
const cat = (id) => T.get(id)?.category;
const allowed = (id, d) => !!T.get(id)?.disciplines.includes(d);

/** noms courts neutres (avant / arrière) : valables en garde orthodoxe comme en gaucher */
const SN = {
  'pas-avant': 'pas avant', 'pas-arriere': 'pas arrière', 'pas-gauche': 'pas latéral gauche', 'pas-droite': 'pas latéral droit',
  'pivot-droite': 'pivot', 'pivot-gauche': 'pivot extérieur', 'sortie-angle': 'sortie d’angle',
  jab: 'jab', direct: 'direct', 'jab-corps': 'jab au corps', 'direct-corps': 'direct au corps',
  'crochet-avant': 'crochet avant', 'crochet-arriere': 'crochet arrière', 'crochet-avant-corps': 'crochet avant au corps', 'crochet-arriere-corps': 'crochet arrière au corps',
  'uppercut-avant': 'uppercut avant', 'uppercut-arriere': 'uppercut arrière', overhand: 'overhand',
  'esquive-droite': 'esquive extérieure', 'esquive-gauche': 'esquive intérieure', 'roll-droite': 'roll', 'roll-gauche': 'roll inversé',
  'blocage-haut': 'blocage haut', 'blocage-corps-avant': 'blocage au corps', parade: 'parade', retrait: 'retrait de buste',
  'check-avant': 'check avant', 'check-arriere': 'check arrière',
  'front-kick-avant': 'front kick avant', 'front-kick-arriere': 'front kick arrière', 'teep-avant': 'teep', 'teep-arriere': 'teep arrière',
  'low-kick-arriere': 'low kick arrière', 'low-kick-avant': 'low kick avant', 'middle-kick-arriere': 'middle kick arrière', 'middle-kick-avant': 'middle kick avant',
  'high-kick-arriere': 'high kick arrière', 'high-kick-avant': 'high kick avant', 'roundhouse-arriere': 'roundhouse arrière', 'roundhouse-avant': 'roundhouse avant',
  'genou-direct-arriere': 'genou direct', 'genou-direct-avant': 'genou direct avant', 'genou-circulaire-arriere': 'genou circulaire', 'genou-circulaire-avant': 'genou circulaire avant',
  'coude-horizontal-avant': 'coude horizontal avant', 'coude-horizontal-arriere': 'coude horizontal arrière', 'coude-diagonal-arriere': 'coude diagonal arrière',
  'coude-diagonal-avant': 'coude diagonal avant', 'coude-montant-arriere': 'coude remontant arrière', 'coude-montant-avant': 'coude remontant avant',
  'clinch-tirage': 'clinch', 'genou-clinch': 'genou dans le clinch', 'genou-circulaire-clinch': 'genou circulaire dans le clinch',
  'feinte-jab': 'feinte de jab', 'feinte-epaule': 'feinte d’épaule', 'feinte-lutte': 'feinte de lutte',
  'changement-niveau': 'changement de niveau', 'entree-lutte': 'entrée en double-leg', sprawl: 'sprawl', 'defense-lutte': 'défense de lutte',
  'descente-sol': 'descente au sol', 'sortie-hanche': 'sortie de hanche', 'releve-technique': 'relevé technique',
};
for (const t of TECHNIQUES) if (t.id !== 'garde' && !SN[t.id]) throw new Error(`nom court manquant : ${t.id}`);

const STRIKE = new Set(['poing', 'pied', 'genou', 'coude']);
const isStrike = (id) => STRIKE.has(cat(id)) || id === 'genou-clinch' || id === 'genou-circulaire-clinch';
function side(id) {
  if (['jab', 'jab-corps', 'feinte-jab'].includes(id)) return 'L';
  if (['direct', 'direct-corps', 'overhand', 'feinte-epaule', 'genou-clinch', 'genou-circulaire-clinch'].includes(id)) return 'R';
  if (id.endsWith('-avant')) return 'L';
  if (id.endsWith('-arriere')) return 'R';
  return null;
}
const isBody = (id) => /-corps$/.test(id) && cat(id) === 'poing' || id.startsWith('middle-kick') || id.startsWith('genou-circulaire') || id.startsWith('teep') || id.startsWith('front-kick');
const isHead = (id) => ['jab', 'direct', 'crochet-avant', 'crochet-arriere', 'uppercut-avant', 'uppercut-arriere', 'overhand'].includes(id) || id.startsWith('high-kick') || cat(id) === 'coude';
/** distance d’une technique, identique à rangeOf() de src/domain/transitions.ts */
function rangeOf(id) {
  const c = cat(id);
  if (['coude', 'genou', 'clinch'].includes(c)) return 'courte';
  if (id.startsWith('uppercut')) return 'courte';
  if (c === 'pied') return 'long';
  if (id === 'jab' || id === 'direct' || id === 'entree-lutte') return 'long';
  if (c === 'poing') return 'moyenne';
  return 'neutre';
}
const STATES = { 'descente-sol': ['stand', 'ground'], 'sortie-hanche': ['ground', 'ground'], 'releve-technique': ['ground', 'stand'] };

const LEAD_HEAD = ['jab', 'crochet-avant', 'uppercut-avant'];
const REAR_HEAD = ['direct', 'crochet-arriere', 'uppercut-arriere', 'overhand'];
const LEAD_BODY = ['jab-corps', 'crochet-avant-corps'];
const REAR_BODY = ['direct-corps', 'crochet-arriere-corps'];
const KICK_L = ['low-kick-avant', 'middle-kick-avant', 'high-kick-avant', 'front-kick-avant', 'teep-avant', 'roundhouse-avant'];
const KICK_R = ['low-kick-arriere', 'middle-kick-arriere', 'high-kick-arriere', 'front-kick-arriere', 'teep-arriere', 'roundhouse-arriere'];
const KNEES = ['genou-direct-arriere', 'genou-direct-avant', 'genou-circulaire-arriere', 'genou-circulaire-avant'];
const ELBOWS_L = ['coude-horizontal-avant', 'coude-diagonal-avant', 'coude-montant-avant'];
const ELBOWS_R = ['coude-horizontal-arriere', 'coude-diagonal-arriere', 'coude-montant-arriere'];
const DEFENCES = ['esquive-droite', 'esquive-gauche', 'roll-droite', 'roll-gauche', 'blocage-haut', 'blocage-corps-avant', 'parade', 'retrait', 'check-avant', 'check-arriere'];
const ANGLES = ['pivot-droite', 'pivot-gauche', 'sortie-angle', 'pas-gauche', 'pas-droite'];
const ENTRIES = ['pas-avant', 'pas-gauche', 'pas-droite'];
const EXITS = ['pas-arriere', 'sortie-angle', 'pivot-droite', 'pivot-gauche', 'pas-gauche', 'pas-droite'];
/** première riposte cohérente après chaque défense */
const COUNTER = {
  'esquive-droite': ['direct', 'direct-corps', 'crochet-avant', 'uppercut-arriere'],
  'esquive-gauche': ['crochet-avant', 'crochet-avant-corps', 'direct', 'uppercut-avant'],
  'roll-droite': ['crochet-avant', 'uppercut-arriere', 'crochet-avant-corps'],
  'roll-gauche': ['crochet-arriere', 'direct', 'uppercut-avant', 'crochet-arriere-corps'],
  'blocage-haut': ['crochet-avant', 'crochet-arriere', 'uppercut-arriere', 'jab'],
  'blocage-corps-avant': ['crochet-avant', 'direct', 'uppercut-arriere', 'crochet-arriere'],
  parade: ['direct', 'jab', 'direct-corps'],
  retrait: ['direct', 'jab', 'direct-corps'],
  'check-avant': ['direct', 'jab', 'crochet-avant', 'low-kick-arriere', 'middle-kick-arriere', 'teep-avant'],
  'check-arriere': ['crochet-avant', 'jab', 'middle-kick-avant', 'teep-avant'],
  sprawl: ['jab', 'direct', 'crochet-avant', 'genou-direct-arriere', 'uppercut-arriere'],
  'defense-lutte': ['uppercut-arriere', 'genou-direct-arriere', 'crochet-avant', 'direct'],
};
const DOUBLE_OK = new Set(['jab', 'jab-corps', 'crochet-avant', 'sortie-hanche', 'genou-clinch', 'pas-avant', 'pas-arriere']);

// ------------------------------------------------------------------ règles de qualité biomécanique
/** renvoie null si la séquence est correcte, sinon la règle violée */
function quality(seq, d) {
  if (seq.length < 2 || seq.length > 10) return 'longueur';
  if (new Set(seq).size < 2) return 'monotone';
  let state = 'stand';
  let clinch = false;
  let sameRun = 1;
  let sideRun = 0;
  let lastSide = null;
  let kickRun = 0;
  let defRun = 0;
  let footRun = 0;
  let hips = 0;
  let strikes = 0;
  for (let i = 0; i < seq.length; i++) {
    const id = seq[i];
    const c = cat(id);
    const prev = i > 0 ? seq[i - 1] : null;
    const pc = prev ? cat(prev) : null;
    if (!c || id === 'garde') return 'inconnue';
    if (!allowed(id, d)) return 'discipline';
    if (prev === id) {
      if (!DOUBLE_OK.has(id) || ++sameRun > 2) return 'repetition';
    } else sameRun = 1;
    const [from, to] = STATES[id] ?? ['stand', 'stand'];
    if (from !== state) return 'etat-sol';
    state = to;
    if (id === 'sortie-hanche' && ++hips > 2) return 'sol-long';
    if (c === 'clinch') {
      if (id === 'clinch-tirage' ? clinch : !clinch) return 'clinch';
      clinch = true;
    } else clinch = false;
    if (isStrike(id)) {
      strikes++;
      const s = side(id);
      sideRun = s === lastSide ? sideRun + 1 : 1;
      lastSide = s;
      if (sideRun > 3) return 'cote';
    } else if (c === 'deplacement' || c === 'defense' || c === 'lutte' || c === 'sol') {
      sideRun = 0;
      lastSide = null;
    }
    if (c === 'pied') {
      if (pc === 'pied') {
        if (side(prev) === side(id)) return 'meme-jambe';
        if (++kickRun > 2) return 'trois-pieds';
      } else kickRun = 1;
    }
    defRun = c === 'defense' ? defRun + 1 : 0;
    if (defRun > 2) return 'defenses';
    footRun = c === 'deplacement' ? footRun + 1 : 0;
    if (footRun > 2) return 'deplacements';
    if (prev && state === 'stand' && from === 'stand') {
      // mêmes avertissements que validateSequence() : on ne garde que les séquences sans avertissement
      if (pc === 'pied' && rangeOf(id) === 'courte') return 'distance-pied-court';
      if (rangeOf(prev) === 'courte' && c === 'pied' && !id.startsWith('teep')) return 'distance-court-pied';
    }
    if (c === 'feinte' && (i === seq.length - 1 || pc === 'feinte')) return 'feinte';
    if (prev === 'changement-niveau' && !['entree-lutte', 'overhand', 'direct-corps', 'jab-corps', 'crochet-avant-corps'].includes(id)) return 'niveau';
    if (prev === 'feinte-lutte' && !isStrike(id)) return 'feinte-lutte';
    if ((id === 'sprawl' || id === 'defense-lutte') && (prev === 'entree-lutte' || prev === 'changement-niveau')) return 'lutte';
    if (prev === 'entree-lutte' && c !== 'poing' && c !== 'deplacement') return 'apres-entree';
    if (id === 'descente-sol' && pc === 'pied') return 'sol-apres-pied';
  }
  const last = seq[seq.length - 1];
  if (state !== 'stand') return 'fin-au-sol';
  if (last === 'changement-niveau' || last === 'clinch-tirage') return 'fin';
  if (strikes === 0) return 'sans-frappe';
  return null;
}

// ------------------------------------------------------------------ champions (profils de style généraux)
const SOURCE_NOTE = 'Profil de style général, construit à partir de caractéristiques largement connues et commentées publiquement. Ce n’est pas une analyse image par image de combats.';

/**
 * a : multiplicateurs de poids des archétypes ; f : techniques favorites (poids) ; stance n’est
 * renseigné que lorsque la garde habituelle est largement connue.
 */
const CHAMPIONS = [
  // ---------------------------------------------------------------- boxe
  { id: 'tyson', name: 'Mike Tyson', d: ['boxe'], stance: 'orthodoxe', style: 'Style peek-a-boo : garde haute et serrée, mouvements de tête constants, entrées explosives et enchaînements de crochets et d’uppercuts au corps comme à la tête.', traits: ['peek-a-boo', 'mouvements de tête', 'crochets et uppercuts', 'travail au corps'], a: { defense: 2.2, corps: 2, echange: 1.4, deplacement: 0.6 }, f: { 'roll-droite': 3, 'roll-gauche': 3, 'esquive-droite': 2, 'esquive-gauche': 2, 'crochet-avant': 2, 'uppercut-arriere': 2.5, 'crochet-avant-corps': 2, 'crochet-arriere-corps': 1.5, 'blocage-haut': 1.5 } },
  { id: 'ali', name: 'Muhammad Ali', d: ['boxe'], stance: 'orthodoxe', style: 'Mobilité permanente sur l’avant des pieds, jab rapide et répété, retraits de buste pour esquiver et grande vitesse de mains.', traits: ['mobilité', 'jab rapide', 'retrait de buste', 'vitesse de mains'], a: { deplacement: 2.2, angle: 1.5, offensif: 1.2, corps: 0.5 }, f: { jab: 3, retrait: 3, 'pas-arriere': 2, 'pas-gauche': 2, 'pas-droite': 2, direct: 1.5, 'crochet-avant': 1.2 } },
  { id: 'mayweather', name: 'Floyd Mayweather', d: ['boxe'], stance: 'orthodoxe', style: 'Défense « shoulder roll » épaule haute, contres en retrait (pull counter), crochet en pivot (check hook) et jab au corps pour régler la distance.', traits: ['shoulder roll', 'pull counter', 'check hook', 'jab au corps'], a: { defense: 2.5, angle: 1.6, echange: 1.4 }, f: { retrait: 3, parade: 2, 'blocage-haut': 2, 'blocage-corps-avant': 2, 'jab-corps': 2.5, direct: 2, 'crochet-avant': 2, 'pivot-gauche': 2, 'pivot-droite': 1.5 } },
  { id: 'canelo', name: 'Canelo Álvarez', d: ['boxe'], stance: 'orthodoxe', style: 'Garde compacte, esquives et rolls à courte distance, contres puissants et travail au corps appuyé.', traits: ['esquives et rolls', 'contres', 'travail au corps', 'puissance'], power: true, a: { defense: 2, corps: 2, echange: 1.3 }, f: { 'roll-droite': 2, 'roll-gauche': 2, 'esquive-droite': 2, 'crochet-avant-corps': 2.5, 'uppercut-arriere': 2, 'direct-corps': 2, 'crochet-avant': 1.5 } },
  { id: 'lomachenko', name: 'Vasyl Lomachenko', d: ['boxe'], stance: 'gaucher', style: 'Jeu de jambes très travaillé, changements d’angle permanents (pivots, sorties latérales), feintes et volume de coups.', traits: ['changements d’angle', 'pivots', 'feintes', 'volume'], a: { angle: 2.6, deplacement: 1.8, feinte: 1.8, cardio: 1.2 }, f: { 'pivot-droite': 2.5, 'pivot-gauche': 2.5, 'sortie-angle': 3, 'pas-gauche': 1.5, 'pas-droite': 1.5, 'feinte-jab': 2, jab: 1.5, direct: 1.5 } },
  { id: 'pacquiao', name: 'Manny Pacquiao', d: ['boxe'], stance: 'gaucher', style: 'Garde gaucher, entrées et sorties très rapides, angles et combinaisons à haut volume.', traits: ['vitesse', 'entrées-sorties', 'angles', 'volume'], a: { deplacement: 2, angle: 1.8, cardio: 1.6, offensif: 1.3 }, f: { 'pas-avant': 2, 'pas-droite': 1.5, 'sortie-angle': 2, direct: 2, 'crochet-avant': 2, jab: 1.5 } },
  { id: 'leonard', name: 'Sugar Ray Leonard', d: ['boxe'], stance: 'orthodoxe', style: 'Vitesse de mains, combinaisons fluides, mobilité et capacité à passer de la boxe à distance aux échanges.', traits: ['vitesse de mains', 'combinaisons fluides', 'mobilité'], a: { offensif: 1.8, deplacement: 1.4, feinte: 1.3, cardio: 1.2 }, f: { jab: 2, direct: 1.5, 'crochet-avant': 2, 'uppercut-arriere': 1.5, 'feinte-jab': 1.5 } },
  { id: 'duran', name: 'Roberto Durán', d: ['boxe'], stance: 'orthodoxe', style: 'Pression constante, travail à mi-distance et à courte distance, défense par mouvements de buste et contres.', traits: ['pression', 'courte distance', 'mouvements de buste', 'contres'], a: { echange: 1.8, defense: 1.8, corps: 1.5, deplacement: 0.6 }, f: { 'crochet-avant': 2, 'uppercut-arriere': 2, 'uppercut-avant': 1.5, 'esquive-gauche': 2, 'roll-droite': 1.5, 'direct-corps': 1.5 } },
  { id: 'hagler', name: 'Marvin Hagler', d: ['boxe'], stance: 'alterne', style: 'Pression méthodique, changements de garde, jab solide et puissance des deux mains.', traits: ['pression', 'changements de garde', 'jab', 'puissance'], power: true, a: { offensif: 1.8, deplacement: 1.2, corps: 1.3 }, f: { jab: 2.5, direct: 2, 'crochet-avant': 1.5, 'pas-avant': 2, 'uppercut-arriere': 1.3 } },
  { id: 'hearns', name: 'Thomas Hearns', d: ['boxe'], stance: 'orthodoxe', style: 'Grande allonge, jab long, direct et crochet arrière puissants, boxe à distance.', traits: ['allonge', 'jab long', 'direct puissant', 'distance'], power: true, a: { offensif: 2, deplacement: 1.5, corps: 0.6 }, f: { jab: 3, direct: 2.5, 'crochet-arriere': 2, 'pas-arriere': 2 } },
  { id: 'rjj', name: 'Roy Jones Jr.', d: ['boxe'], stance: 'orthodoxe', style: 'Vitesse et réflexes, attaques imprévisibles, crochet avant très rapide et contres.', traits: ['vitesse', 'réflexes', 'crochet avant', 'contres'], a: { feinte: 2, defense: 1.5, offensif: 1.3 }, f: { 'crochet-avant': 3, 'feinte-jab': 2, 'feinte-epaule': 2, 'esquive-droite': 1.5, retrait: 1.5, jab: 1.2 } },
  { id: 'crawford', name: 'Terence Crawford', d: ['boxe'], stance: 'alterne', style: 'Changements de garde, lecture de l’adversaire, contres précis et finitions en combinaison.', traits: ['changements de garde', 'contres précis', 'finitions'], a: { defense: 2, echange: 1.8, angle: 1.3 }, f: { direct: 2, 'crochet-avant': 2, 'uppercut-arriere': 1.5, 'pivot-droite': 1.5, retrait: 1.5, parade: 1.5 } },
  { id: 'usyk', name: 'Oleksandr Usyk', d: ['boxe'], stance: 'gaucher', style: 'Garde gaucher, jeu de jambes latéral constant, volume de jab et changements d’angle.', traits: ['jeu de jambes', 'jab', 'angles', 'volume'], a: { deplacement: 2.4, angle: 2, cardio: 1.3 }, f: { 'pas-gauche': 2.5, 'pas-droite': 2.5, jab: 2.5, 'pivot-gauche': 1.5, direct: 1.5, 'sortie-angle': 1.5 } },
  { id: 'inoue', name: 'Naoya Inoue', d: ['boxe'], stance: 'orthodoxe', style: 'Puissance des deux mains, travail au corps (notamment le crochet avant au foie), timing et vitesse.', traits: ['puissance', 'travail au corps', 'timing'], power: true, a: { corps: 2.6, offensif: 1.4, echange: 1.2 }, f: { 'crochet-avant-corps': 3, 'jab-corps': 2, direct: 1.5, 'crochet-avant': 1.5, 'direct-corps': 1.5 } },
  { id: 'davis', name: 'Gervonta Davis', d: ['boxe'], stance: 'gaucher', style: 'Garde gaucher, patience et contres explosifs, uppercuts et crochets puissants.', traits: ['patience', 'contres explosifs', 'uppercuts'], power: true, a: { defense: 2.2, echange: 1.5 }, f: { 'uppercut-arriere': 2.5, 'uppercut-avant': 2, 'crochet-avant': 1.5, retrait: 2, 'esquive-droite': 1.5 } },
  { id: 'beterbiev', name: 'Artur Beterbiev', d: ['boxe'], stance: 'orthodoxe', style: 'Pression constante, puissance, combinaisons appuyées des deux mains et travail au corps.', traits: ['pression', 'puissance', 'travail au corps'], power: true, a: { offensif: 1.8, corps: 1.6, cardio: 1.2, deplacement: 0.8 }, f: { direct: 2, 'crochet-arriere': 2, 'crochet-avant': 1.5, 'direct-corps': 2, 'pas-avant': 2 } },
  { id: 'bivol', name: 'Dmitry Bivol', d: ['boxe'], stance: 'orthodoxe', style: 'Jab et contrôle de la distance, déplacements, combinaisons rapides et défense disciplinée.', traits: ['jab', 'contrôle de distance', 'combinaisons rapides'], a: { deplacement: 2, offensif: 1.4, defense: 1.3 }, f: { jab: 3, 'pas-arriere': 2, direct: 1.5, 'blocage-haut': 1.5, parade: 1.5 } },
  { id: 'frazier', name: 'Joe Frazier', d: ['boxe'], stance: 'orthodoxe', style: 'Pression en « bob and weave », crochet avant puissant et travail au corps.', traits: ['bob and weave', 'crochet avant', 'pression'], power: true, a: { defense: 2, corps: 1.8, echange: 1.4 }, f: { 'roll-droite': 3, 'roll-gauche': 3, 'crochet-avant': 3, 'crochet-avant-corps': 2 } },
  { id: 'foreman', name: 'George Foreman', d: ['boxe'], stance: 'orthodoxe', style: 'Puissance et pression, jab lourd, coups appuyés, garde haute pour couper le ring.', traits: ['puissance', 'jab lourd', 'pression', 'garde haute'], power: true, a: { offensif: 2, deplacement: 1, corps: 1.2 }, f: { jab: 2, direct: 2, 'crochet-arriere': 2, 'uppercut-arriere': 2, 'blocage-haut': 2, 'pas-avant': 2 } },
  { id: 'chavez', name: 'Julio César Chávez', d: ['boxe'], stance: 'orthodoxe', style: 'Pression, travail au corps intensif (crochet avant au foie), défense par la garde et les mouvements de buste.', traits: ['pression', 'travail au corps', 'garde'], a: { corps: 2.6, echange: 1.5, defense: 1.4 }, f: { 'crochet-avant-corps': 3, 'direct-corps': 2, 'blocage-corps-avant': 2, 'blocage-haut': 1.5, 'uppercut-arriere': 1.5 } },
  // ---------------------------------------------------------------- kick-boxing
  { id: 'petrosyan', name: 'Giorgio Petrosyan', d: ['kickboxing'], stance: 'gaucher', style: 'Garde gaucher, précision, contres et timing, maîtrise de la distance et défense.', traits: ['précision', 'contres', 'distance', 'défense'], a: { defense: 2.4, echange: 1.6, angle: 1.3 }, f: { 'check-avant': 2, parade: 2, retrait: 2, direct: 2, 'middle-kick-arriere': 1.5, 'pas-arriere': 1.5 } },
  { id: 'hoost', name: 'Ernesto Hoost', d: ['kickboxing'], stance: 'orthodoxe', style: 'Technique complète « à la hollandaise » : combinaisons de poings conclues par un low kick, précision et timing.', traits: ['style hollandais', 'poings puis low kick', 'précision'], a: { poingsPieds: 2.6, offensif: 1.2 }, f: { 'low-kick-arriere': 3, 'low-kick-avant': 1.5, jab: 1.5, 'crochet-avant': 2, direct: 1.5 } },
  { id: 'verhoeven', name: 'Rico Verhoeven', d: ['kickboxing'], stance: 'orthodoxe', style: 'Poids lourd mobile : pression, poings appuyés, low kicks et gros volume de travail.', traits: ['pression', 'poings', 'low kicks', 'cardio'], a: { cardio: 2, poingsPieds: 1.6, offensif: 1.3 }, f: { 'low-kick-arriere': 2, jab: 2, direct: 2, 'crochet-avant': 1.5, 'pas-avant': 1.5 } },
  { id: 'aerts', name: 'Peter Aerts', d: ['kickboxing'], stance: 'orthodoxe', style: 'Coups de pied hauts puissants, pression et combinaisons poings-pieds.', traits: ['high kick', 'pression', 'poings-pieds'], power: true, a: { poingsPieds: 2, pieds: 2 }, f: { 'high-kick-arriere': 3, 'high-kick-avant': 2, 'low-kick-arriere': 1.5, 'roundhouse-arriere': 1.5 } },
  { id: 'bonjasky', name: 'Remy Bonjasky', d: ['kickboxing'], stance: 'orthodoxe', style: 'Coups de pied variés et spectaculaires, gestion de la distance avec les jambes.', traits: ['coups de pied variés', 'distance'], a: { pieds: 2.4, piedsPoings: 1.8, deplacement: 1.2 }, f: { 'high-kick-arriere': 2.5, 'front-kick-avant': 2, 'roundhouse-arriere': 2, 'middle-kick-arriere': 1.5 } },
  { id: 'hari', name: 'Badr Hari', d: ['kickboxing'], stance: 'orthodoxe', style: 'Agressivité et puissance, combinaisons de poings appuyées et coups de pied hauts.', traits: ['agressivité', 'puissance', 'combinaisons de poings'], power: true, a: { offensif: 2, poingsPieds: 1.6 }, f: { direct: 2, 'crochet-avant': 2, 'uppercut-arriere': 1.5, 'high-kick-arriere': 2 } },
  { id: 'souwer', name: 'Andy Souwer', d: ['kickboxing'], stance: 'orthodoxe', style: 'Pression, volume, combinaisons de poings conclues par des low kicks, endurance.', traits: ['pression', 'volume', 'low kicks', 'endurance'], a: { cardio: 2, poingsPieds: 2 }, f: { 'low-kick-arriere': 2.5, 'low-kick-avant': 1.5, 'crochet-avant': 1.5, 'pas-avant': 1.5 } },
  { id: 'tenshin', name: 'Tenshin Nasukawa', d: ['kickboxing'], stance: 'gaucher', style: 'Vitesse, garde gaucher, contres et grande variété de coups de pied.', traits: ['vitesse', 'contres', 'coups de pied variés'], a: { defense: 1.8, pieds: 1.8, feinte: 1.4 }, f: { 'middle-kick-avant': 2, 'high-kick-avant': 1.5, direct: 2, retrait: 1.5, 'feinte-jab': 1.5 } },
  { id: 'takeru', name: 'Takeru Segawa', d: ['kickboxing'], stance: 'orthodoxe', style: 'Rythme élevé, pression vers l’avant, volume de poings et de coups de pied.', traits: ['rythme', 'pression', 'volume'], a: { cardio: 2.2, offensif: 1.4, poingsPieds: 1.4 }, f: { jab: 1.5, direct: 1.5, 'crochet-avant': 1.5, 'pas-avant': 2, 'low-kick-arriere': 1.5 } },
  { id: 'allazov', name: 'Chingiz Allazov', d: ['kickboxing'], stance: 'orthodoxe', style: 'Timing, contres et combinaisons rapides poings-pieds.', traits: ['timing', 'contres', 'combinaisons rapides'], a: { defense: 2, echange: 1.6, poingsPieds: 1.3 }, f: { 'crochet-avant': 2, retrait: 1.5, 'esquive-droite': 1.5, 'high-kick-arriere': 1.5 } },
  { id: 'superbon', name: 'Superbon', d: ['kickboxing', 'muaythai'], stance: 'orthodoxe', style: 'Middle et high kicks puissants, timing et contrôle de la distance.', traits: ['middle kick', 'high kick', 'distance', 'timing'], power: true, a: { pieds: 2.4, piedsPoings: 1.6, defense: 1.2 }, f: { 'middle-kick-arriere': 3, 'high-kick-arriere': 2.5, 'teep-avant': 1.5, 'check-avant': 1.5 } },
  { id: 'buakaw', name: 'Buakaw Banchamek', d: ['kickboxing', 'muaythai'], stance: 'orthodoxe', style: 'Middle kicks répétés, régularité et endurance ; en muay-thaï, travail de genoux et de clinch.', traits: ['middle kicks', 'endurance', 'genoux et clinch'], a: { pieds: 2, cardio: 1.8, genoux: 1.8, clinch: 1.5 }, f: { 'middle-kick-arriere': 3, 'genou-direct-arriere': 2, 'genou-clinch': 1.5, 'teep-avant': 1.5 } },
  { id: 'holzken', name: 'Nieky Holzken', d: ['kickboxing'], stance: 'orthodoxe', style: 'Boxe anglaise très développée, combinaisons de poings et low kicks.', traits: ['boxe anglaise', 'combinaisons de poings', 'low kicks'], a: { offensif: 2.2, poingsPieds: 1.6, corps: 1.3 }, f: { 'crochet-avant': 2, 'uppercut-arriere': 2, 'crochet-avant-corps': 1.5, 'low-kick-arriere': 2 } },
  { id: 'sitthichai', name: 'Sitthichai Sitsongpeenong', d: ['kickboxing', 'muaythai'], stance: 'gaucher', style: 'Garde gaucher, middle kick de la jambe arrière, teeps et contrôle de la distance.', traits: ['middle kick', 'teeps', 'distance'], a: { pieds: 2, piedsPoings: 1.8, defense: 1.3 }, f: { 'middle-kick-arriere': 3, 'teep-avant': 2, 'front-kick-avant': 1.5, 'check-avant': 1.5 } },
  { id: 'grigorian', name: 'Marat Grigorian', d: ['kickboxing'], stance: 'orthodoxe', style: 'Pression et puissance, combinaisons de poings et low kicks.', traits: ['pression', 'puissance', 'low kicks'], power: true, a: { poingsPieds: 2, offensif: 1.6, cardio: 1.2 }, f: { 'low-kick-arriere': 2.5, 'crochet-avant': 2, direct: 1.5, 'pas-avant': 1.5 } },
  { id: 'vanroosmalen', name: 'Robin van Roosmalen', d: ['kickboxing'], stance: 'orthodoxe', style: 'Pression intense, crochets et uppercuts, low kicks et volume.', traits: ['pression', 'crochets et uppercuts', 'low kicks'], a: { offensif: 1.8, cardio: 1.6, corps: 1.4, poingsPieds: 1.4 }, f: { 'crochet-avant': 2, 'uppercut-arriere': 2, 'uppercut-avant': 1.5, 'low-kick-arriere': 2 } },
  { id: 'pereira', name: 'Alex Pereira', d: ['kickboxing', 'mma'], stance: 'orthodoxe', style: 'Crochet avant puissant, contres, low kicks et frappes précises.', traits: ['crochet avant', 'contres', 'low kicks'], power: true, a: { defense: 1.8, poingsPieds: 1.6, echange: 1.4 }, f: { 'crochet-avant': 3, 'low-kick-arriere': 2, 'low-kick-avant': 1.5, retrait: 1.5, 'pas-arriere': 1.5 } },
  { id: 'doumbe', name: 'Cédric Doumbé', d: ['kickboxing'], stance: 'orthodoxe', style: 'Mobilité, feintes et contres rapides, vitesse d’exécution.', traits: ['mobilité', 'feintes', 'contres rapides'], a: { feinte: 2.2, deplacement: 1.8, defense: 1.5 }, f: { 'feinte-jab': 2, 'feinte-epaule': 2, 'pas-arriere': 1.5, 'sortie-angle': 1.5, direct: 1.5 } },
  { id: 'lebanner', name: 'Jérôme Le Banner', d: ['kickboxing'], style: 'Puissance et pression, combinaisons de poings lourdes et low kicks.', traits: ['puissance', 'pression', 'poings lourds'], power: true, a: { offensif: 2, poingsPieds: 1.6 }, f: { direct: 2, 'crochet-arriere': 2, 'crochet-avant': 1.5, 'low-kick-arriere': 1.5, 'pas-avant': 1.5 } },
  { id: 'masato', name: 'Masato Kobayashi', d: ['kickboxing'], style: 'Boxe anglaise solide, low kicks, combinaisons poings-pieds et vitesse.', traits: ['boxe anglaise', 'low kicks', 'vitesse'], a: { poingsPieds: 2, offensif: 1.5, corps: 1.3 }, f: { 'low-kick-arriere': 2, 'crochet-avant-corps': 1.5, jab: 1.5, 'crochet-avant': 1.5 } },
  // ---------------------------------------------------------------- MMA
  { id: 'silva', name: 'Anderson Silva', d: ['mma'], stance: 'alterne', style: 'Striking précis, contres, mouvements de tête, coups de pied et genoux variés.', traits: ['précision', 'contres', 'mouvements de tête', 'coups de pied variés'], a: { defense: 2.2, echange: 1.6, piedsPoings: 1.3 }, f: { retrait: 2, 'esquive-droite': 2, 'esquive-gauche': 1.5, 'front-kick-avant': 2, 'genou-direct-arriere': 1.5, 'crochet-avant': 1.5 } },
  { id: 'adesanya', name: 'Israel Adesanya', d: ['mma'], stance: 'alterne', style: 'Striking à distance, feintes, changements de garde, contres et coups de pied variés.', traits: ['distance', 'feintes', 'contres', 'coups de pied'], a: { feinte: 2.2, defense: 1.8, pieds: 1.4, deplacement: 1.3 }, f: { 'feinte-jab': 2, 'feinte-epaule': 2, 'low-kick-avant': 2, 'teep-avant': 1.5, retrait: 2, 'pas-arriere': 1.5 } },
  { id: 'jones', name: 'Jon Jones', d: ['mma'], stance: 'alterne', style: 'Créativité, grande allonge, coups de pied variés, lutte et contrôle.', traits: ['allonge', 'créativité', 'coups de pied', 'lutte'], a: { piedsPoings: 1.8, niveau: 1.6, pieds: 1.4 }, f: { 'front-kick-avant': 2, 'teep-avant': 1.5, 'roundhouse-arriere': 1.5, 'genou-direct-arriere': 1.5, 'entree-lutte': 1.5 } },
  { id: 'gsp', name: 'Georges St-Pierre', d: ['mma'], stance: 'orthodoxe', style: 'Jab, mélange striking-lutte, entrées en double-leg après les poings, contrôle.', traits: ['jab', 'striking-lutte', 'double-leg'], a: { niveau: 2.6, offensif: 1.4 }, f: { jab: 3, 'entree-lutte': 2.5, 'changement-niveau': 2, 'feinte-jab': 1.5 } },
  { id: 'khabib', name: 'Khabib Nurmagomedov', d: ['mma'], stance: 'orthodoxe', style: 'Pression, changements de niveau et entrées en lutte, contrôle et cardio.', traits: ['pression', 'changements de niveau', 'lutte', 'cardio'], a: { niveau: 2.8, cardio: 1.4, deplacement: 1.2 }, f: { 'changement-niveau': 3, 'entree-lutte': 3, 'pas-avant': 2, overhand: 1.5 } },
  { id: 'makhachev', name: 'Islam Makhachev', d: ['mma'], stance: 'gaucher', style: 'Garde gaucher, lutte et contrôle, striking précis, entrées en lutte.', traits: ['lutte', 'contrôle', 'striking précis'], a: { niveau: 2.4, defLutte: 1.3, offensif: 1.2 }, f: { 'entree-lutte': 2.5, 'changement-niveau': 2, direct: 2, 'middle-kick-arriere': 1.5 } },
  { id: 'mcgregor', name: 'Conor McGregor', d: ['mma'], stance: 'gaucher', style: 'Garde gaucher, précision du direct arrière, contrôle de la distance, coups de pied variés.', traits: ['direct arrière', 'distance', 'coups de pied variés'], power: true, a: { echange: 1.6, defense: 1.6, pieds: 1.3, deplacement: 1.3 }, f: { direct: 3, 'pas-arriere': 2, retrait: 2, 'front-kick-avant': 1.5, 'roundhouse-arriere': 1.5 } },
  { id: 'holloway', name: 'Max Holloway', d: ['mma'], stance: 'orthodoxe', style: 'Volume de frappe très élevé, boxe à mi-distance, cardio et rythme.', traits: ['volume', 'boxe', 'cardio'], a: { cardio: 2.6, offensif: 1.8, corps: 1.3 }, f: { jab: 2, direct: 1.5, 'crochet-avant': 2, 'crochet-avant-corps': 1.5 } },
  { id: 'volkanovski', name: 'Alexander Volkanovski', d: ['mma'], stance: 'orthodoxe', style: 'Jeu de jambes, feintes, changements de rythme et mélange striking-lutte.', traits: ['jeu de jambes', 'feintes', 'rythme', 'striking-lutte'], a: { deplacement: 2, feinte: 1.8, niveau: 1.4, angle: 1.4 }, f: { 'pas-gauche': 1.5, 'pas-droite': 1.5, 'feinte-jab': 2, 'feinte-lutte': 2, 'low-kick-arriere': 1.5 } },
  { id: 'poirier', name: 'Dustin Poirier', d: ['mma'], stance: 'gaucher', style: 'Garde gaucher, boxe puissante, combinaisons de poings et contres.', traits: ['boxe', 'combinaisons', 'contres'], power: true, a: { offensif: 2, echange: 1.6, corps: 1.3 }, f: { direct: 2, 'crochet-avant': 2, 'uppercut-arriere': 1.5, 'crochet-avant-corps': 1.5 } },
  { id: 'gaethje', name: 'Justin Gaethje', d: ['mma'], stance: 'orthodoxe', style: 'Pression, low kicks, puissance et échanges à courte distance.', traits: ['pression', 'low kicks', 'puissance'], power: true, a: { poingsPieds: 2.2, echange: 1.6, defLutte: 1.2 }, f: { 'low-kick-arriere': 3, 'low-kick-avant': 2, 'crochet-avant': 2, 'uppercut-arriere': 1.5 } },
  { id: 'oliveira', name: 'Charles Oliveira', d: ['mma'], stance: 'orthodoxe', style: 'Pression en striking avec genoux et coups de pied, passages au sol et transitions.', traits: ['pression', 'genoux', 'transitions au sol'], a: { sol: 2.6, genoux: 1.6, niveau: 1.3 }, f: { 'genou-direct-arriere': 2.5, 'descente-sol': 2, 'teep-avant': 1.5, 'middle-kick-arriere': 1.5 } },
  { id: 'aldo', name: 'José Aldo', d: ['mma'], stance: 'orthodoxe', style: 'Low kicks puissants, boxe précise et défense de lutte (sprawl).', traits: ['low kicks', 'boxe précise', 'défense de lutte'], a: { poingsPieds: 2.2, defLutte: 2, corps: 1.2 }, f: { 'low-kick-arriere': 3, 'low-kick-avant': 2, sprawl: 2.5, 'crochet-avant-corps': 1.5 } },
  { id: 'dj', name: 'Demetrious Johnson', d: ['mma'], stance: 'orthodoxe', style: 'Vitesse, mélange fluide striking-lutte, transitions et cardio.', traits: ['vitesse', 'striking-lutte', 'transitions', 'cardio'], a: { niveau: 1.8, sol: 1.6, cardio: 1.6, genoux: 1.2 }, f: { 'genou-direct-arriere': 2, 'entree-lutte': 2, 'changement-niveau': 1.5, 'pas-gauche': 1.5 } },
  { id: 'shevchenko', name: 'Valentina Shevchenko', d: ['mma'], stance: 'gaucher', style: 'Garde gaucher, contres, coups de pied puissants et timing.', traits: ['contres', 'coups de pied', 'timing'], a: { defense: 2, pieds: 1.8, piedsPoings: 1.4 }, f: { 'middle-kick-arriere': 2, 'high-kick-arriere': 1.5, retrait: 2, 'esquive-droite': 1.5, direct: 1.5 } },
  { id: 'jedrzejczyk', name: 'Joanna Jędrzejczyk', d: ['mma'], stance: 'orthodoxe', style: 'Volume de coups, jab, low kicks, déplacements et défense de lutte.', traits: ['volume', 'jab', 'low kicks', 'défense de lutte'], a: { cardio: 2, defLutte: 1.8, deplacement: 1.4, poingsPieds: 1.4 }, f: { jab: 2.5, 'low-kick-arriere': 2, 'low-kick-avant': 1.5, sprawl: 2, 'pas-arriere': 1.5 } },
  { id: 'nunes', name: 'Amanda Nunes', d: ['mma'], stance: 'orthodoxe', style: 'Puissance des poings, pression et lutte.', traits: ['puissance', 'pression', 'lutte'], power: true, a: { offensif: 2, niveau: 1.6 }, f: { direct: 2, 'crochet-avant': 2, overhand: 1.5, 'entree-lutte': 1.5 } },
  { id: 'edwards', name: 'Leon Edwards', d: ['mma'], stance: 'gaucher', style: 'Garde gaucher, coups de pied, contrôle de la distance et lutte.', traits: ['coups de pied', 'distance', 'lutte'], a: { pieds: 2, piedsPoings: 1.6, niveau: 1.3 }, f: { 'high-kick-arriere': 2, 'middle-kick-arriere': 2, 'teep-avant': 1.5, jab: 1.5 } },
  { id: 'thompson', name: 'Stephen Thompson', d: ['mma'], stance: 'alterne', style: 'Style karaté : garde de profil, déplacements, coups de pied variés et contres.', traits: ['karaté', 'déplacements', 'coups de pied variés', 'contres'], a: { deplacement: 2.2, pieds: 2, defense: 1.4 }, f: { 'pas-arriere': 2, 'pas-gauche': 1.5, 'roundhouse-arriere': 2, 'front-kick-avant': 2, 'teep-avant': 1.5 } },
  { id: 'topuria', name: 'Ilia Topuria', d: ['mma'], stance: 'orthodoxe', style: 'Boxe compacte et puissante, travail au corps et lutte.', traits: ['boxe compacte', 'travail au corps', 'lutte'], power: true, a: { corps: 2.2, offensif: 1.6, niveau: 1.2 }, f: { 'crochet-avant-corps': 2.5, 'crochet-avant': 2, 'uppercut-arriere': 1.5, 'direct-corps': 1.5 } },
  { id: 'aspinall', name: 'Tom Aspinall', d: ['mma'], stance: 'orthodoxe', style: 'Vitesse de mains, combinaisons et transitions striking-lutte.', traits: ['vitesse de mains', 'combinaisons', 'striking-lutte'], a: { offensif: 2, niveau: 1.5, cardio: 1.2 }, f: { jab: 2, direct: 2, 'crochet-avant': 1.5, 'changement-niveau': 1.5 } },
  { id: 'fedor', name: 'Fedor Emelianenko', d: ['mma'], stance: 'orthodoxe', style: 'Frappes puissantes dont l’overhand, transitions vers le sol, polyvalence.', traits: ['overhand', 'puissance', 'transitions', 'polyvalence'], power: true, a: { offensif: 1.6, sol: 1.8, niveau: 1.3 }, f: { overhand: 3, 'crochet-avant': 1.5, 'descente-sol': 1.5, 'releve-technique': 1.2 } },
  { id: 'machida', name: 'Lyoto Machida', d: ['mma'], stance: 'gaucher', style: 'Style karaté, entrées et sorties, contres, gestion de la distance et timing.', traits: ['karaté', 'entrées-sorties', 'contres', 'distance'], a: { deplacement: 2.2, defense: 1.8, piedsPoings: 1.3 }, f: { 'pas-arriere': 2, 'pas-avant': 1.5, direct: 2, 'front-kick-avant': 2, 'genou-direct-arriere': 1.5, retrait: 1.5 } },
  // ---------------------------------------------------------------- muay-thaï
  { id: 'saenchai', name: 'Saenchai', d: ['muaythai'], style: 'Teeps, coups de pied changés, déséquilibres et grande créativité technique.', traits: ['teeps', 'coups de pied changés', 'créativité'], a: { piedsPoings: 2, feinte: 1.8, deplacement: 1.4, pieds: 1.4 }, f: { 'teep-avant': 3, 'middle-kick-avant': 2, 'feinte-jab': 1.5, 'pas-gauche': 1.5, 'pas-droite': 1.5 } },
  { id: 'rodtang', name: 'Rodtang Jitmuangnon', d: ['muaythai'], stance: 'orthodoxe', style: 'Pression constante, crochets puissants, coudes et coups de pied appuyés.', traits: ['pression', 'crochets', 'coudes'], power: true, a: { coudes: 2.2, offensif: 1.6, cardio: 1.5 }, f: { 'crochet-avant': 2.5, 'crochet-arriere': 2, 'coude-horizontal-arriere': 2, 'pas-avant': 2, 'blocage-haut': 1.5 } },
  { id: 'nongo', name: 'Nong-O Hama', d: ['muaythai'], style: 'Technique complète, teeps, middle kicks, timing et défense.', traits: ['technique complète', 'teeps', 'timing'], a: { defense: 1.8, pieds: 1.6, piedsPoings: 1.4 }, f: { 'teep-avant': 2, 'middle-kick-arriere': 2, 'check-avant': 2, retrait: 1.5 } },
  { id: 'samart', name: 'Samart Payakaroon', d: ['muaythai'], style: 'Élégance technique, teeps, poings précis et défense par la distance.', traits: ['élégance', 'teeps', 'poings précis', 'distance'], a: { offensif: 1.6, deplacement: 1.6, defense: 1.6 }, f: { jab: 2, direct: 1.5, 'teep-avant': 2, retrait: 2, 'pas-arriere': 1.5 } },
  { id: 'dieselnoi', name: 'Dieselnoi Chor Thanasukarn', d: ['muaythai'], style: 'Grand gabarit, genoux et travail en clinch, pression.', traits: ['genoux', 'clinch', 'pression'], a: { genoux: 2.6, clinch: 2.6, cardio: 1.2 }, f: { 'genou-direct-arriere': 3, 'genou-clinch': 3, 'genou-circulaire-clinch': 2, 'clinch-tirage': 2 } },
  { id: 'superlek', name: 'Superlek Kiatmuu9', d: ['muaythai'], style: 'Coups de pied puissants, middle kicks, coudes et contres.', traits: ['coups de pied', 'coudes', 'contres'], power: true, a: { pieds: 2, coudes: 1.6, defense: 1.4 }, f: { 'middle-kick-arriere': 2.5, 'low-kick-arriere': 1.5, 'coude-horizontal-avant': 1.5, 'check-avant': 1.5 } },
  { id: 'tawanchai', name: 'Tawanchai P.K. Saenchai', d: ['muaythai'], style: 'Middle kicks, teeps, précision et contrôle de la distance.', traits: ['middle kicks', 'teeps', 'précision'], a: { pieds: 2.2, piedsPoings: 1.6 }, f: { 'middle-kick-arriere': 3, 'teep-avant': 2, jab: 1.5 } },
  { id: 'yodsanklai', name: 'Yodsanklai Fairtex', d: ['muaythai'], stance: 'gaucher', style: 'Garde gaucher, middle kick arrière très puissant et pression.', traits: ['middle kick', 'pression', 'puissance'], power: true, a: { poingsPieds: 2, pieds: 2 }, f: { 'middle-kick-arriere': 3.5, 'low-kick-arriere': 1.5, direct: 1.5, 'pas-avant': 1.5 } },
  { id: 'petchboonchu', name: 'Petchboonchu FA Group', d: ['muaythai'], style: 'Genoux et clinch, pression et endurance.', traits: ['genoux', 'clinch', 'endurance'], a: { genoux: 2.4, clinch: 2.2, cardio: 1.6 }, f: { 'genou-direct-arriere': 2.5, 'genou-clinch': 2.5, 'genou-circulaire-arriere': 2 } },
  { id: 'lerdsila', name: 'Lerdsila', d: ['muaythai'], style: 'Vitesse, feintes, mobilité et contres, techniques variées.', traits: ['vitesse', 'feintes', 'mobilité'], a: { feinte: 2.2, deplacement: 1.8, defense: 1.4 }, f: { 'feinte-jab': 2, 'feinte-epaule': 2, 'pas-gauche': 1.5, 'sortie-angle': 1.5, 'teep-avant': 1.5 } },
  { id: 'panpayak', name: 'Panpayak Jitmuangnon', d: ['muaythai'], style: 'Technique complète, middle kicks et coudes.', traits: ['technique complète', 'middle kicks', 'coudes'], a: { pieds: 1.6, coudes: 1.6, poingsPieds: 1.4 }, f: { 'middle-kick-arriere': 2, 'coude-diagonal-arriere': 1.5, 'coude-horizontal-avant': 1.5 } },
  { id: 'seksan', name: 'Seksan Or Kwanmuang', d: ['muaythai'], style: 'Pression, échanges de poings, coudes et combativité.', traits: ['pression', 'échanges de poings', 'coudes'], a: { echange: 2, offensif: 1.8, coudes: 1.6, cardio: 1.3 }, f: { 'crochet-avant': 2, 'crochet-arriere': 2, 'uppercut-arriere': 1.5, 'coude-horizontal-arriere': 1.5, 'blocage-haut': 1.5 } },
  { id: 'petchmorakot', name: 'Petchmorakot Petchyindee', d: ['muaythai'], style: 'Genoux, clinch et middle kicks.', traits: ['genoux', 'clinch', 'middle kicks'], a: { genoux: 2, clinch: 1.8, pieds: 1.4 }, f: { 'genou-direct-arriere': 2, 'genou-clinch': 2, 'middle-kick-arriere': 2 } },
  { id: 'anuwat', name: 'Anuwat Kaewsamrit', d: ['muaythai'], style: 'Puissance des poings, crochets appuyés et pression.', traits: ['poings puissants', 'crochets', 'pression'], power: true, a: { offensif: 2.4, corps: 1.6, echange: 1.4 }, f: { 'crochet-avant': 3, 'crochet-arriere': 2, 'crochet-avant-corps': 2, 'uppercut-arriere': 1.5 } },
  { id: 'karuhat', name: 'Karuhat Sor Supawan', d: ['muaythai'], style: 'Technique, contres, timing et mobilité.', traits: ['technique', 'contres', 'timing', 'mobilité'], a: { defense: 2, deplacement: 1.6, echange: 1.4 }, f: { 'check-avant': 1.5, retrait: 2, 'teep-avant': 1.5, 'pivot-droite': 1.5 } },
  { id: 'somrak', name: 'Somrak Khamsing', d: ['muaythai'], style: 'Vitesse, mobilité, technique de poings très aboutie et créativité.', traits: ['vitesse', 'mobilité', 'technique de poings'], a: { offensif: 1.8, deplacement: 1.8, feinte: 1.4, angle: 1.4 }, f: { jab: 2, 'crochet-avant': 1.5, 'pas-gauche': 1.5, 'sortie-angle': 1.5, 'feinte-jab': 1.5 } },
  { id: 'namsaknoi', name: 'Namsaknoi Yudthagarngamtorn', d: ['muaythai'], style: 'Technique complète, genoux, clinch et endurance.', traits: ['technique complète', 'genoux', 'clinch', 'endurance'], a: { genoux: 1.8, clinch: 1.6, pieds: 1.4, cardio: 1.3 }, f: { 'genou-direct-arriere': 2, 'genou-clinch': 1.5, 'middle-kick-arriere': 1.5, 'teep-avant': 1.5 } },
];

// ------------------------------------------------------------------ archétypes
const BASE_WEIGHTS = {
  boxe: { offensif: 3, defense: 3, echange: 2, angle: 2, deplacement: 2, corps: 2, feinte: 1.5, cardio: 1 },
  kickboxing: { offensif: 1.5, defense: 2, echange: 1.5, angle: 1.3, deplacement: 1.3, corps: 1.3, feinte: 1, poingsPieds: 3, piedsPoings: 2, pieds: 2, cardio: 1 },
  muaythai: { offensif: 1, defense: 2, echange: 1, angle: 1, deplacement: 1, corps: 1, feinte: 1, poingsPieds: 2.5, piedsPoings: 2, pieds: 2, coudes: 2, genoux: 2, clinch: 1.5, cardio: 1 },
  mma: { offensif: 1.5, defense: 2, echange: 1, angle: 1, deplacement: 1, corps: 1, feinte: 1, poingsPieds: 2, piedsPoings: 1, pieds: 1, genoux: 0.7, niveau: 2.5, defLutte: 2, sol: 1.2, cardio: 1 },
};
const MIN_LEN = { offensif: 2, defense: 2, echange: 3, angle: 3, deplacement: 3, corps: 2, feinte: 2, poingsPieds: 2, piedsPoings: 2, pieds: 3, coudes: 2, genoux: 2, clinch: 3, niveau: 2, defLutte: 2, sol: 3, cardio: 6 };
const LEN_W = [0, 0, 8, 14, 16, 16, 14, 11, 9, 7, 6]; // index = longueur

/** fréquence de base des techniques (le jab et le direct restent les coups les plus courants) */
const BASE_W = { jab: 2.2, direct: 2, 'crochet-avant': 1.6, 'crochet-arriere': 1, 'uppercut-avant': 0.6, 'uppercut-arriere': 0.9, overhand: 0.5, 'high-kick-avant': 0.6, 'high-kick-arriere': 0.8, 'front-kick-arriere': 0.6, 'teep-arriere': 0.6, 'roundhouse-avant': 0.6 };

function makeCtx(rng, champ, d) {
  const w = (id) => (BASE_W[id] ?? 1) * (champ.f[id] ?? 1);
  const pick = (list) => {
    const ok = list.filter((id) => allowed(id, d));
    if (!ok.length) return null;
    let tot = 0;
    for (const id of ok) tot += w(id);
    let r = rng() * tot;
    for (const id of ok) if ((r -= w(id)) <= 0) return id;
    return ok[ok.length - 1];
  };
  const chance = (p) => rng() < p;
  const int = (a, b) => a + Math.floor(rng() * (b - a + 1));
  return { rng, d, w, pick, chance, int };
}

/** chaîne de n coups de poing en alternant le plus souvent main avant / main arrière */
function punches(c, n, o = {}) {
  const out = [];
  let s = o.start ?? (c.chance(0.72) ? 'L' : 'R');
  const bodyBias = o.body ?? 0.18;
  for (let i = 0; i < n; i++) {
    if (i > 0) s = c.chance(0.78) ? (s === 'L' ? 'R' : 'L') : s;
    let body = c.chance(bodyBias);
    if (o.headLast && i === n - 1) body = false;
    if (o.bodyFirst && i === 0) body = true;
    let pool = s === 'L' ? (body ? LEAD_BODY : LEAD_HEAD) : body ? REAR_BODY : REAR_HEAD;
    if (i === 0 && !body && !o.free) pool = s === 'L' ? ['jab', 'jab', 'crochet-avant'] : ['direct', 'direct', 'overhand', 'crochet-arriere'];
    out.push(c.pick(pool));
  }
  return out;
}
const kick = (c, s) => c.pick(s === 'L' ? KICK_L : s === 'R' ? KICK_R : [...KICK_L, ...KICK_R]);
const opposite = (id) => (side(id) === 'L' ? 'R' : 'L');
const lastSide = (seq) => side([...seq].reverse().find((x) => side(x)) ?? 'jab');

const BUILD = {
  offensif: (c, L) => punches(c, L, { body: 0.15 }),
  corps: (c, L) => {
    const finishBody = c.chance(0.35);
    const seq = punches(c, L, { body: 0.45, bodyFirst: !finishBody && c.chance(0.5), headLast: !finishBody });
    if (finishBody) seq[L - 1] = c.pick(side(seq[L - 1]) === 'L' ? LEAD_BODY : REAR_BODY);
    return seq;
  },
  defense: (c, L) => {
    const def = c.pick(DEFENCES);
    const first = c.pick(COUNTER[def]);
    const seq = [def, first];
    if (L >= 6 && c.chance(0.4)) {
      const a = c.int(1, L - 4);
      seq.push(...punches(c, a, { start: opposite(first), free: true }));
      const def2 = c.pick(DEFENCES.filter((x) => x !== def));
      seq.push(def2, c.pick(COUNTER[def2]));
    }
    const rest = L - seq.length;
    if (rest > 0) {
      const exit = rest >= 2 && c.chance(0.3);
      seq.push(...punches(c, rest - (exit ? 1 : 0), { start: opposite(seq[seq.length - 1]), free: true }));
      if (exit) seq.push(c.pick(EXITS));
    }
    return seq;
  },
  echange: (c, L) => {
    const a = c.int(1, Math.max(1, L - 2));
    const seq = punches(c, a);
    const def = c.pick(DEFENCES.filter((x) => !x.startsWith('check')));
    seq.push(def, c.pick(COUNTER[def]));
    if (seq.length < L) seq.push(...punches(c, L - seq.length, { start: opposite(seq[seq.length - 1]), free: true }));
    return seq;
  },
  angle: (c, L) => {
    const a = c.int(1, L - 2);
    const seq = punches(c, a);
    seq.push(c.pick(ANGLES));
    seq.push(...punches(c, L - seq.length, { free: true, start: c.chance(0.6) ? 'R' : 'L' }));
    return seq;
  },
  deplacement: (c, L) => {
    const entry = c.pick(ENTRIES);
    const exit = c.pick(EXITS);
    const midLen = L - 2;
    const mid = c.d !== 'boxe' && midLen >= 2 && c.chance(0.35) ? [...punches(c, midLen - 1), null] : punches(c, midLen);
    if (mid[mid.length - 1] === null) mid[mid.length - 1] = kick(c, opposite(mid[mid.length - 2]));
    return [entry, ...mid, exit];
  },
  feinte: (c, L) => {
    const feints = c.d === 'mma' ? ['feinte-jab', 'feinte-epaule', 'feinte-lutte'] : ['feinte-jab', 'feinte-epaule'];
    if (L >= 4 && c.chance(0.35)) {
      const a = c.int(1, L - 3);
      const seq = punches(c, a);
      seq.push(c.pick(feints));
      seq.push(...punches(c, L - seq.length, { free: true }));
      return seq;
    }
    const f = c.pick(feints);
    const start = f === 'feinte-jab' ? 'R' : f === 'feinte-epaule' ? 'L' : c.chance(0.5) ? 'R' : 'L';
    const rest = L - 1;
    const seq = [f, ...punches(c, rest, { start, free: true })];
    if (c.d !== 'boxe' && rest >= 2 && c.chance(0.35)) seq[L - 1] = kick(c, opposite(seq[L - 2]));
    return seq;
  },
  poingsPieds: (c, L) => {
    if (L >= 5 && c.chance(0.35)) {
      const a = c.int(2, L - 3);
      const seq = punches(c, a);
      seq.push(kick(c, opposite(seq[seq.length - 1])));
      seq.push(...punches(c, L - seq.length - 1, { start: c.chance(0.5) ? 'L' : 'R' }));
      seq.push(kick(c, opposite(seq[seq.length - 1])));
      return seq;
    }
    const seq = punches(c, L - 1, { body: 0.2 });
    seq.push(kick(c, opposite(seq[seq.length - 1])));
    return seq;
  },
  piedsPoings: (c, L) => {
    const k = kick(c, c.chance(0.55) ? 'L' : 'R');
    return [k, ...punches(c, L - 1, { start: opposite(k), free: true })];
  },
  pieds: (c, L) => {
    const seq = [];
    let s = c.chance(0.5) ? 'L' : 'R';
    seq.push(kick(c, s));
    while (seq.length < L) {
      const room = L - seq.length;
      if (room >= 2 && c.chance(0.55)) {
        const p = punches(c, Math.min(room - 1, c.int(1, 2)), { start: c.chance(0.5) ? 'L' : 'R' });
        seq.push(...p);
        seq.push(kick(c, opposite(p[p.length - 1])));
      } else if (cat(seq[seq.length - 1]) === 'pied' && c.chance(0.5)) {
        s = side(seq[seq.length - 1]) === 'L' ? 'R' : 'L';
        seq.push(kick(c, s));
      } else seq.push(...punches(c, 1, { free: true }));
    }
    return seq.slice(0, L);
  },
  coudes: (c, L) => {
    const n = Math.min(L - 1, c.int(1, L >= 6 ? 3 : 2));
    const seq = punches(c, L - n, { body: 0.15 });
    let s = opposite(seq[seq.length - 1]);
    for (let i = 0; i < n; i++) {
      seq.push(c.pick(s === 'L' ? ELBOWS_L : ELBOWS_R));
      s = s === 'L' ? 'R' : 'L';
    }
    return seq;
  },
  genoux: (c, L) => {
    if (c.d === 'muaythai' && L >= 4 && c.chance(0.45)) {
      const a = c.int(1, L - 3);
      const seq = punches(c, a);
      seq.push('clinch-tirage');
      while (seq.length < L) seq.push(c.pick(['genou-clinch', 'genou-circulaire-clinch']));
      if (L - a >= 4 && c.chance(0.5)) seq[L - 1] = c.pick([...ELBOWS_L, ...ELBOWS_R]);
      return seq;
    }
    const seq = punches(c, L - 1, { body: 0.2 });
    seq.push(c.pick(KNEES));
    if (L >= 4 && c.chance(0.35)) seq[L - 2] = c.pick(KNEES.filter((k) => side(k) !== side(seq[L - 1])));
    return seq;
  },
  clinch: (c, L) => {
    const seq = [];
    if (L >= 5 && c.chance(0.6)) seq.push(...punches(c, c.int(1, L - 4)));
    seq.push('clinch-tirage');
    const knees = Math.max(1, L - seq.length - (L - seq.length >= 3 && c.chance(0.55) ? 2 : 0));
    for (let i = 0; i < knees; i++) seq.push(c.pick(['genou-clinch', 'genou-circulaire-clinch']));
    if (seq.length < L) {
      if (c.chance(0.5)) seq.push(c.pick([...ELBOWS_L, ...ELBOWS_R]));
      else seq.push('pas-arriere');
      if (seq.length < L) seq.push(seq[seq.length - 1] === 'pas-arriere' ? c.pick(['teep-avant', 'middle-kick-arriere', 'jab']) : c.pick([...ELBOWS_L, ...ELBOWS_R]));
    }
    return seq.slice(0, L);
  },
  niveau: (c, L) => {
    const r = c.rng();
    if (r < 0.45) {
      const pre = L - 2;
      return [...punches(c, pre), 'changement-niveau', 'entree-lutte'].slice(-L);
    }
    if (r < 0.75) {
      const a = c.int(0, L - 2);
      const seq = punches(c, a);
      seq.push('feinte-lutte');
      seq.push(...punches(c, L - seq.length, { start: 'R', free: true }));
      if (L - a >= 3 && c.chance(0.4)) seq[L - 1] = kick(c, opposite(seq[L - 2]));
      return seq;
    }
    const a = c.int(1, L - 1);
    const seq = punches(c, a);
    seq.push('entree-lutte');
    if (seq.length < L) seq.push(...punches(c, L - seq.length, { start: c.chance(0.5) ? 'L' : 'R', free: true }));
    return seq;
  },
  defLutte: (c, L) => {
    const a = c.int(0, Math.max(0, L - 3));
    const seq = punches(c, a);
    const d = c.pick(['sprawl', 'sprawl', 'defense-lutte']);
    seq.push(d, c.pick(COUNTER[d]));
    if (seq.length < L) seq.push(...punches(c, L - seq.length, { start: opposite(seq[seq.length - 1]), free: true }));
    return seq;
  },
  sol: (c, L) => {
    const hips = Math.min(2, Math.max(0, L - 3 - (c.chance(0.5) ? 1 : 0)), c.int(0, 2));
    const after = Math.max(1, c.int(1, L - 2 - hips));
    const before = L - 2 - hips - after;
    if (before < 0) return null;
    return [...punches(c, before), 'descente-sol', ...Array(hips).fill('sortie-hanche'), 'releve-technique', ...punches(c, after, { free: true })];
  },
  cardio: (c, L) => {
    const unitLen = c.int(2, 3);
    const unit = punches(c, unitLen);
    if (c.d !== 'boxe' && c.chance(0.6)) unit.push(kick(c, opposite(unit[unit.length - 1])));
    const seq = [];
    while (seq.length < L) {
      if (c.d === 'mma' && seq.length > 0 && c.chance(0.3)) seq.push('sprawl');
      for (const x of unit) if (seq.length < L) seq.push(x);
    }
    seq.length = L;
    return seq;
  },
};

// ------------------------------------------------------------------ analyse pédagogique
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
function joinFr(list) {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} puis ${list[list.length - 1]}`;
}
/**
 * Mouvements « signature » d’une séquence : la première frappe, les mouvements qui définissent
 * l’exercice (défense, déplacement, feinte, pied, genou, coude, clinch, lutte, sol) et le dernier.
 */
function signature(seq) {
  const DEFINING = new Set(['defense', 'deplacement', 'feinte', 'pied', 'genou', 'coude', 'clinch', 'lutte', 'sol']);
  const idx = new Set([0, seq.length - 1]);
  seq.forEach((id, i) => DEFINING.has(cat(id)) && idx.add(i));
  let keep = [...idx].sort((a, b) => a - b).map((i) => seq[i]);
  keep = keep.filter((id, i) => keep.indexOf(id) === i);
  if (keep.length > 5) keep = [...keep.slice(0, 3), ...keep.slice(-2)];
  if (keep.length < 3) for (const id of seq) if (keep.length < 3 && !keep.includes(id)) keep.splice(keep.length - 1, 0, id);
  return keep;
}
const keyList = (seq) => signature(seq).map((id) => SN[id]);

function analyse(seq) {
  const f = new Set();
  const cats = seq.map(cat);
  const strikes = seq.filter(isStrike);
  let bodyIdx = seq.findIndex((id) => isBody(id) && cat(id) === 'poing');
  if (bodyIdx >= 0 && seq.slice(bodyIdx + 1).some(isHead)) f.add('corps-tete');
  if (isBody(seq[seq.length - 1]) && seq.slice(0, -1).some(isHead)) f.add('tete-corps');
  if (seq.some((id) => isBody(id))) f.add('corps');
  for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1] && isStrike(seq[i])) f.add('double');
  if (cats[0] === 'defense' || seq.some((id, i) => cat(id) === 'defense' && i < seq.length - 1 && isStrike(seq[i + 1]))) f.add('contre');
  if (cats.includes('defense')) f.add('defense');
  if (cats[cats.length - 1] === 'deplacement') f.add('sortie');
  if (cats[0] === 'deplacement') f.add('entree');
  if (seq.some((id) => ANGLES.includes(id) || id === 'sortie-angle')) f.add('angle');
  if (cats.includes('feinte')) f.add('feinte');
  if (seq.some((id, i) => i > 0 && cat(id) === 'pied' && cat(seq[i - 1]) === 'poing')) f.add('poing-pied');
  if (seq.some((id, i) => i > 0 && cat(id) === 'poing' && cat(seq[i - 1]) === 'pied')) f.add('pied-poing');
  if (cats.includes('pied')) f.add('pied');
  if (seq.some((id) => id.startsWith('low-kick'))) f.add('low-kick');
  if (seq.some((id) => id.startsWith('middle-kick'))) f.add('middle-kick');
  if (seq.some((id) => id.startsWith('high-kick'))) f.add('high-kick');
  if (seq.some((id) => id.startsWith('teep') || id.startsWith('front-kick'))) f.add('teep');
  if (seq.some((id) => id.startsWith('uppercut'))) f.add('uppercut');
  if (seq.some((id) => id.startsWith('genou'))) f.add('genou');
  if (cats.includes('coude')) f.add('coude');
  if (cats.includes('clinch')) f.add('clinch');
  if (seq.includes('changement-niveau') || seq.includes('entree-lutte') || seq.includes('feinte-lutte')) f.add('niveau');
  if (seq.includes('sprawl') || seq.includes('defense-lutte')) f.add('defense-lutte');
  if (cats.includes('sol')) f.add('sol');
  if (seq.some((id) => id.startsWith('check'))) f.add('check');
  if (seq.length >= 8) f.add('long');
  if (strikes.length && strikes.every((id, i) => i === 0 || side(id) !== side(strikes[i - 1]))) f.add('alternance');
  return f;
}

/** propos de chaque trait, utilisés pour l’objectif, les points clés et les erreurs */
const FEAT = {
  'corps-tete': { why: 'le coup au corps fait baisser la garde avant de remonter à la tête', kp: 'Descendre sur les jambes pour le corps, remonter en garde pour la tête', err: 'Baisser la tête au lieu de fléchir les genoux pour frapper au corps' },
  'tete-corps': { why: 'les coups à la tête font monter la garde, la frappe finale cible le corps découvert', kp: 'La frappe au corps part des jambes, le dos reste droit', err: 'Rester à la même hauteur pour le coup au corps' },
  double: { why: 'doubler un coup casse le rythme attendu par l’adversaire', kp: 'Le deuxième coup du même bras part sans réarmer en arrière', err: 'Réarmer le bras entre les deux coups doublés' },
  contre: { why: 'la riposte part dans le temps qui suit la défense, avant que l’adversaire ne se replace', kp: 'Défense courte : juste assez pour sortir de la ligne', err: 'Marquer un temps d’arrêt entre la défense et la riposte' },
  sortie: { why: 'on sort de la ligne aussitôt l’attaque terminée pour ne pas subir la riposte', kp: 'Sortir en garde, menton rentré, sans croiser les pieds', err: 'Rester face à l’adversaire après le dernier coup' },
  entree: { why: 'le déplacement d’entrée amène à la bonne distance avant de frapper', kp: 'Le premier coup part au moment où le pied se pose', err: 'Frapper avant d’être à distance, en se penchant' },
  angle: { why: 'le changement d’angle permet de frapper hors de la ligne de riposte adverse', kp: 'Après le changement d’angle, retrouver la cible avant de frapper', err: 'Croiser les pieds pendant le changement d’angle' },
  feinte: { why: 'la feinte provoque une réaction qui ouvre la cible suivante', kp: 'La feinte est courte et crédible, la garde ne descend pas', err: 'Feinte trop ample qui déséquilibre' },
  'poing-pied': { why: 'le dernier coup de poing charge la hanche opposée et masque le coup de pied', kp: 'Le coup de pied part du côté opposé au dernier coup de poing', err: 'Marquer une pause entre les poings et le coup de pied' },
  'pied-poing': { why: 'le coup de pied ouvre la distance, les poings enchaînent pendant que l’adversaire se replace', kp: 'Reposer le pied en garde, en avant, avant d’enchaîner les poings', err: 'Reposer le pied trop loin derrière et frapper hors de distance' },
  uppercut: { why: 'l’uppercut passe au centre quand la garde se resserre', kp: 'L’uppercut part des jambes, trajectoire courte et verticale', err: 'Descendre la main avant l’uppercut' },
  genou: { why: 'le genou frappe à courte distance quand l’adversaire avance', kp: 'Hanche en avant et pointe du pied d’appui', err: 'Pencher le buste en arrière au lieu de pousser la hanche' },
  coude: { why: 'le coude conclut à très courte distance, là où les poings manquent de place', kp: 'Le coude reste à hauteur d’épaule et tourne avec le corps', err: 'Armer le coude trop large' },
  clinch: { why: 'contrôler la nuque imaginaire pour placer les genoux', kp: 'Coudes serrés, mains derrière la nuque imaginaire', err: 'Écarter les coudes dans le clinch' },
  niveau: { why: 'le changement de niveau menace la lutte et oblige l’adversaire à baisser les mains', kp: 'Fléchir les jambes, pas le dos : tête haute', err: 'Plonger la tête vers le sol' },
  'defense-lutte': { why: 'défendre l’entrée en lutte puis reprendre l’initiative en striking', kp: 'Hanches en arrière et retour rapide en garde', err: 'Rester au sol ou à genoux après le sprawl' },
  sol: { why: 'passer au sol en contrôle et revenir en garde sans s’exposer', kp: 'Une main protège toujours le visage pendant le relevé', err: 'Se relever face à l’adversaire en se redressant droit' },
  check: { why: 'bloquer le low kick puis répondre aussitôt', kp: 'Genou vers l’extérieur, reposer le pied en garde', err: 'Reposer le pied loin derrière après le check' },
  'low-kick': { why: 'le low kick use les appuis adverses', kp: 'Pivot du pied d’appui, frappe avec le tibia', err: 'Frapper avec le pied au lieu du tibia' },
  'middle-kick': { why: 'le middle kick traverse la cible au niveau des côtes', kp: 'La hanche passe complètement, le pied d’appui pivote', err: 'Arrêter la jambe au contact au lieu de traverser' },
  'high-kick': { why: 'le high kick arrive quand l’attention est portée en bas ou au corps', kp: 'Ne pas monter plus haut que sa souplesse ne le permet', err: 'Baisser la garde du côté qui frappe' },
  teep: { why: 'le coup de pied de face contrôle la distance', kp: 'Pousser avec la hanche, plante du pied', err: 'Frapper du bout des orteils' },
  alternance: { why: 'l’alternance avant-arrière garde l’équilibre et la vitesse', kp: 'Chaque coup prépare le suivant par la rotation des hanches', err: 'Frapper deux fois du même côté en perdant l’équilibre' },
  long: { why: 'tenir la vitesse et la garde sur une séquence longue', kp: 'Garder la même qualité de garde jusqu’au dernier mouvement', err: 'Laisser tomber les mains en fin de séquence' },
};

const ARCH = {
  offensif: { title: 'Attaque', verb: 'Enchaîner', tag: 'offensif', goal: 'technique', kp: 'Chaque coup revient en garde avant le suivant', err: 'Pousser les coups au lieu de les claquer' },
  corps: { title: 'Corps et tête', verb: 'Varier les hauteurs avec', tag: 'corps', goal: 'technique', kp: 'Changer de niveau avec les jambes, pas avec le dos', err: 'Annoncer le coup au corps en baissant les yeux' },
  defense: { title: 'Défense et riposte', verb: 'Défendre puis riposter avec', tag: 'defense-contre', goal: 'defense', kp: 'Garder les yeux sur l’adversaire pendant la défense', err: 'Défendre trop large et riposter trop tard' },
  echange: { title: 'Échange', verb: 'Attaquer, défendre la riposte et reprendre avec', tag: 'defense-contre', goal: 'defense', kp: 'Après l’attaque, anticiper la riposte adverse', err: 'Rester immobile après sa propre attaque' },
  angle: { title: 'Changement d’angle', verb: 'Frapper, changer d’angle et reprendre avec', tag: 'angle', goal: 'deplacement', kp: 'Le pied avant reste planté pendant le pivot', err: 'Se retrouver hors de distance après le changement d’angle' },
  deplacement: { title: 'Entrée et sortie', verb: 'Entrer, frapper et sortir avec', tag: 'deplacement', goal: 'deplacement', kp: 'Pas courts et rasants, la garde ne bouge pas', err: 'Sauter au lieu de glisser les pieds' },
  feinte: { title: 'Feinte', verb: 'Feinter puis frapper avec', tag: 'feinte', goal: 'technique', kp: 'Observer la réaction provoquée par la feinte', err: 'Enchaîner la feinte et le coup au même rythme, sans rupture' },
  poingsPieds: { title: 'Poings puis pied', verb: 'Conclure les poings par un coup de pied avec', tag: 'poings-pieds', goal: 'technique', kp: 'Les poings amènent la distance du coup de pied', err: 'Lancer le coup de pied trop près, sans reculer d’abord' },
  piedsPoings: { title: 'Pied puis poings', verb: 'Ouvrir au pied et enchaîner avec', tag: 'poings-pieds', goal: 'technique', kp: 'Le coup de pied ouvre, les poings referment la distance', err: 'Perdre la garde pendant le coup de pied' },
  pieds: { title: 'Travail de jambes', verb: 'Alterner coups de pied et poings avec', tag: 'pieds', goal: 'technique', kp: 'Ne jamais enchaîner deux coups de pied de la même jambe sans reposer', err: 'Enchaîner les coups de pied sans reprendre l’équilibre' },
  coudes: { title: 'Coudes', verb: 'Entrer à courte distance et conclure au coude avec', tag: 'coudes', goal: 'puissance', kp: 'Les poings ferment la distance, le coude finit', err: 'Lancer le coude hors de distance' },
  genoux: { title: 'Genoux', verb: 'Préparer puis placer les genoux avec', tag: 'genoux', goal: 'puissance', kp: 'Le genou monte en poussant la hanche vers l’avant', err: 'Lever le genou sans engager la hanche' },
  clinch: { title: 'Clinch', verb: 'Saisir, contrôler et frapper dans le clinch avec', tag: 'clinch', goal: 'puissance', kp: 'Démonstration solo : le contrôle réel se travaille avec un partenaire', err: 'Écarter les coudes dans le clinch' },
  niveau: { title: 'Changement de niveau', verb: 'Mêler striking et menace de lutte avec', tag: 'changement-niveau', goal: 'technique', kp: 'Les poings font monter la garde, l’entrée part en dessous', err: 'Annoncer l’entrée en baissant les mains' },
  defLutte: { title: 'Défense de lutte', verb: 'Défendre l’entrée en lutte et riposter avec', tag: 'defense-lutte', goal: 'defense', kp: 'Réagir dès que les épaules adverses descendent', err: 'Se pencher sans reculer les hanches' },
  sol: { title: 'Transition sol', verb: 'Passer au sol, revenir debout et frapper avec', tag: 'sol', goal: 'technique', kp: 'Descente contrôlée, main derrière', err: 'Tomber sur le coccyx' },
  cardio: { title: 'Cardio', verb: 'Répéter à haut rythme', tag: 'cardio', goal: 'cardio', kp: 'Expirer à chaque frappe pour tenir le rythme', err: 'Sacrifier la garde à la vitesse' },
};

const FEAT_ORDER = ['contre', 'defense-lutte', 'niveau', 'sol', 'clinch', 'coude', 'genou', 'poing-pied', 'pied-poing', 'check', 'feinte', 'angle', 'sortie', 'entree', 'corps-tete', 'tete-corps', 'uppercut', 'double', 'high-kick', 'middle-kick', 'low-kick', 'teep', 'long', 'alternance'];

const DUR = { garde: 0.5, poing: 0.45, feinte: 0.4, defense: 0.6, deplacement: 0.6, pied: 0.95, genou: 0.8, coude: 0.55, clinch: 1.1, lutte: 1.2, sol: 1.8 };
const estimate = (seq) => Math.round((seq.reduce((s, id) => s + DUR[cat(id)], 0) + 1) * 2) / 2;

function levelOf(seq, f) {
  let s = seq.length;
  if (f.has('poing-pied') || f.has('pied-poing')) s += 0.5;
  if (f.has('high-kick')) s += 0.7;
  if (f.has('sol')) s += 1;
  if (f.has('clinch')) s += 0.7;
  if (f.has('feinte')) s += 0.5;
  if (f.has('angle')) s += 0.5;
  s += seq.filter((id) => cat(id) === 'defense').length * 0.5;
  if (s <= 3.5) return 'debutant';
  if (s <= 5.4) return 'intermediaire';
  if (s <= 7.6) return 'avance';
  return 'expert';
}
function distanceOf(seq) {
  const cats = seq.map(cat);
  if (cats.includes('sol')) return 'sol';
  if (cats.includes('clinch') || cats.includes('lutte')) return 'corps-a-corps';
  const r = { long: 0, moyenne: 0, courte: 0 };
  for (const id of seq) {
    const x = rangeOf(id);
    if (x !== 'neutre') r[x]++;
  }
  if (r.courte >= r.long && r.courte >= r.moyenne && r.courte > 0) return 'courte';
  if (r.long >= r.moyenne) return 'longue';
  return 'moyenne';
}

const SWAP = { jab: 'jab-corps', 'jab-corps': 'jab', direct: 'direct-corps', 'direct-corps': 'direct', 'crochet-avant': 'crochet-avant-corps', 'crochet-avant-corps': 'crochet-avant', 'crochet-arriere': 'crochet-arriere-corps', 'crochet-arriere-corps': 'crochet-arriere', 'middle-kick-arriere': 'high-kick-arriere', 'high-kick-arriere': 'middle-kick-arriere', 'low-kick-arriere': 'middle-kick-arriere', 'middle-kick-avant': 'high-kick-avant', 'high-kick-avant': 'middle-kick-avant' };

const ARCH_TIP = {
  defense: 'À deux : un partenaire envoie l’attaque au gant, lentement, pour travailler le timing de la défense.',
  echange: 'Sur sac : enchaîne l’attaque, fais la défense dans le vide puis termine sur le sac.',
  angle: 'Au sol, trace une ligne : après le changement d’angle, tes pieds doivent être hors de cette ligne.',
  deplacement: 'Travaille d’abord les pas seuls, puis ajoute les coups sans changer le rythme des pieds.',
  feinte: 'Alterne une répétition avec la feinte et une sans, pour sentir la différence de réaction.',
  cardio: 'Version cardio : 6 × 30 s au rythme maximal, 15 s de repos.',
  sol: 'Ralentis la descente et le relevé : la qualité du mouvement compte plus que la vitesse.',
  clinch: 'Démonstration solo : le travail réel du clinch se fait avec un partenaire et un encadrement.',
};

// ------------------------------------------------------------------ génération
const usedKeys = new Set();
const usedObjectives = new Set();
const usedNames = new Set();
const combos = [];
const stats = { rejected: {}, perDisc: {} };

function weightedPick(rng, weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  let tot = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * tot;
  for (const [k, w] of entries) if ((r -= w) <= 0) return k;
  return entries[entries.length - 1][0];
}

function makeEntry(champ, d, arch, seq, rng, n) {
  const f = analyse(seq);
  const A = ARCH[arch];
  const feats = FEAT_ORDER.filter((k) => f.has(k));
  const kl = keyList(seq);
  const clauses = feats.slice(0, 2).map((k) => FEAT[k].why);
  let objective = `${A.verb} ${joinFr(kl)}${clauses.length ? ` : ${clauses.join(' ; ')}` : ''}.`;
  if (usedObjectives.has(objective) && feats.length > 2) objective = objective.slice(0, -1) + ` ; ${FEAT[feats[2]].why}.`;
  if (usedObjectives.has(objective)) return { reject: 'objectif-doublon' };

  const sig = signature(seq).map((id) => SN[id]);
  const base = `${A.title} : ${sig.slice(0, 4).join(' – ')}`;
  let name = base;
  if (usedNames.has(name)) name = `${base} (${seq.length} temps)`;
  if (usedNames.has(name)) return { reject: 'nom-doublon' };

  // points clés : archétype, traits, technique principale
  const focus = [...seq].sort((a, b) => (PRIO[cat(b)] ?? 0) - (PRIO[cat(a)] ?? 0))[0];
  const kp = [A.kp];
  for (const k of feats) if (kp.length < 3 && !kp.includes(FEAT[k].kp)) kp.push(FEAT[k].kp);
  const tkp = T.get(focus)?.keyPoints?.[0];
  if (tkp && kp.length < 4 && !kp.includes(tkp)) kp.push(`${T.get(focus).name} : ${lc(tkp)}`);
  const errors = [A.err];
  for (const k of feats) if (errors.length < 2 && !errors.includes(FEAT[k].err)) errors.push(FEAT[k].err);
  const gErr = GUIDES[focus]?.errors?.[0];
  if (gErr && errors.length < 3 && !errors.includes(gErr)) errors.push(`${T.get(focus).name} : ${lc(gErr)}`);

  // variantes : séquences alternatives vérifiées + conseil
  const variants = [];
  for (let i = seq.length - 1; i >= 0; i--) {
    const alt = SWAP[seq[i]];
    if (!alt || !allowed(alt, d)) continue;
    const v = [...seq];
    v[i] = alt;
    if (!quality(v, d)) {
      variants.push({ label: `Changer de hauteur : ${SN[alt]} à la place de ${SN[seq[i]]}`, sequence: v });
      break;
    }
  }
  if (seq.length < 10 && cat(seq[seq.length - 1]) !== 'deplacement') {
    const exit = rng() < 0.5 ? 'pas-arriere' : 'sortie-angle';
    const v = [...seq, exit];
    if (!quality(v, d)) variants.push({ label: `Ajouter une sortie : terminer par ${SN[exit]}`, sequence: v });
  }
  variants.push({ label: ARCH_TIP[arch] ?? (seq.length >= 6 ? 'Découpe la séquence en deux moitiés, travaille chacune lentement puis assemble-les.' : 'Version vitesse : 5 répétitions rapides, puis 5 lentes en contrôlant chaque position.') });

  const tags = new Set([A.tag]);
  for (const k of ['corps', 'contre', 'angle', 'feinte', 'genou', 'coude', 'clinch', 'niveau', 'defense-lutte', 'sol', 'low-kick', 'middle-kick', 'high-kick', 'teep', 'uppercut', 'check']) if (f.has(k)) tags.add(k === 'genou' ? 'genoux' : k === 'coude' ? 'coudes' : k === 'niveau' ? 'changement-niveau' : k === 'contre' ? 'defense-contre' : k);
  if (f.has('sortie') || f.has('entree')) tags.add('deplacement');
  if (f.has('poing-pied') || f.has('pied-poing')) tags.add('poings-pieds');
  if (arch === 'cardio' || seq.length >= 8) tags.add('cardio');
  let goal = A.goal;
  if (goal === 'technique' && champ.power && rng() < 0.4) goal = 'puissance';

  let guard = 'les-deux';
  if (champ.stance === 'gaucher') guard = rng() < 0.6 ? 'gaucher' : 'les-deux';
  else if (champ.stance === 'orthodoxe') guard = rng() < 0.45 ? 'orthodoxe' : 'les-deux';

  return {
    entry: {
      id: `${d}-${champ.id}-${String(n).padStart(4, '0')}`,
      name,
      discipline: d,
      champion: champ.id,
      status: 'inspiree',
      source: {
        kind: 'profil-style',
        note: `Inspirée du profil de style de ${champ.name} (${champ.traits.slice(0, 2).join(', ')}) ; séquence originale, non relevée en combat.`,
      },
      guard,
      level: levelOf(seq, f),
      distance: distanceOf(seq),
      sequence: seq,
      objective,
      keyPoints: kp.slice(0, 4),
      errors: errors.slice(0, 3),
      estimatedSec: estimate(seq),
      variants: variants.slice(0, 3),
      goal,
      tags: [...tags],
      addedAt: ADDED_AT,
    },
    objective,
    name,
  };
}
const PRIO = { sol: 9, lutte: 8, clinch: 7, pied: 6, genou: 6, coude: 5, defense: 4, feinte: 3, poing: 2, deplacement: 1, garde: 0 };

for (const d of DISCS) {
  const champs = CHAMPIONS.filter((c) => c.d.includes(d));
  const state = new Map(champs.map((c) => [c.id, { rng: rngFrom(`${d}:${c.id}`), n: 0, used: {}, dead: false }]));
  let count = 0;
  let stalled = 0;
  while (count < TARGET[d] && stalled < champs.length) {
    stalled = 0;
    for (const champ of champs) {
      if (count >= TARGET[d]) break;
      const st = state.get(champ.id);
      if (st.dead) {
        stalled++;
        continue;
      }
      const ctx = makeCtx(st.rng, champ, d);
      let ok = false;
      for (let attempt = 0; attempt < 600 && !ok; attempt++) {
        const weights = {};
        for (const [k, w] of Object.entries(BASE_WEIGHTS[d])) weights[k] = (w * (champ.a[k] ?? 1)) / (1 + 0.6 * (st.used[k] ?? 0));
        const arch = weightedPick(st.rng, weights);
        let L = Number(weightedPick(st.rng, Object.fromEntries(LEN_W.map((w, i) => [i, w]))));
        if (arch === 'cardio') L = Math.max(L, 6 + Math.floor(st.rng() * 5));
        L = Math.min(10, Math.max(L, MIN_LEN[arch]));
        const seq = BUILD[arch](ctx, L);
        if (!seq || seq.length !== L || seq.some((x) => !x)) {
          stats.rejected['construction'] = (stats.rejected['construction'] ?? 0) + 1;
          continue;
        }
        const bad = quality(seq, d);
        if (bad) {
          stats.rejected[bad] = (stats.rejected[bad] ?? 0) + 1;
          continue;
        }
        const key = `${d}|${seq.join(',')}`;
        if (usedKeys.has(key)) {
          stats.rejected['doublon'] = (stats.rejected['doublon'] ?? 0) + 1;
          continue;
        }
        const r = makeEntry(champ, d, arch, seq, st.rng, st.n + 1);
        if (r.reject) {
          stats.rejected[r.reject] = (stats.rejected[r.reject] ?? 0) + 1;
          continue;
        }
        usedKeys.add(key);
        usedObjectives.add(r.objective);
        usedNames.add(r.name);
        st.n++;
        st.used[arch] = (st.used[arch] ?? 0) + 1;
        combos.push(r.entry);
        count++;
        ok = true;
      }
      if (!ok) {
        st.dead = true;
        stalled++;
      }
    }
  }
  stats.perDisc[d] = count;
}

const champions = CHAMPIONS.map((c) => ({
  id: c.id,
  name: c.name,
  disciplines: c.d,
  ...(c.stance ? { stance: c.stance } : {}),
  style: c.style,
  traits: c.traits,
  source: SOURCE_NOTE,
}));

const catalog = { schema: 1, version: VERSION, updatedAt: ADDED_AT, champions, combos };
mkdirSync(dirname(OUT), { recursive: true });
// une fiche par ligne : diff lisibles lors des mises à jour
const body = [
  '{',
  `"schema":1,"version":${JSON.stringify(VERSION)},"updatedAt":${JSON.stringify(ADDED_AT)},`,
  `"champions":[\n${champions.map((c) => JSON.stringify(c)).join(',\n')}\n],`,
  `"combos":[\n${combos.map((c) => JSON.stringify(c)).join(',\n')}\n]`,
  '}',
  '',
].join('\n');
JSON.parse(body);
writeFileSync(OUT, body);
const byLen = {};
for (const c of combos) byLen[c.sequence.length] = (byLen[c.sequence.length] ?? 0) + 1;
console.log(`catalogue : ${combos.length} fiches, ${champions.length} champions → ${OUT} (${(body.length / 1024).toFixed(0)} Ko)`);
console.log('par discipline', stats.perDisc);
console.log('par longueur', byLen);
console.log('rejets (filtres qualité / doublons)', stats.rejected);
