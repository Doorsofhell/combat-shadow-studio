import { normalize } from '../coach/text';
import { TERMS } from './encyclopedia';
import { PROGRAMS } from './programs';
import { TECHNIQUES } from './techniques';
import { DISCIPLINES } from './types';

/**
 * 1.0.0 (refonte ergonomique, lot 3): « Rechercher ou demander au coach ». One field finds anything in the app:
 * techniques, encyclopedia terms, programmes, settings and places of the app. Local, without network; what is not
 * found can be asked to the Coach IA.
 */
export type SearchGroup = 'Techniques' | 'Encyclopédie' | 'Programmes' | 'Dans l’app';

export interface SearchHit {
  group: SearchGroup;
  label: string;
  hint?: string;
  to: string;
}

interface Entry extends SearchHit {
  /** normalized words the query is matched against (label first) */
  keys: string[];
}

const discShort = (ids: readonly string[]) => ids.map((d) => DISCIPLINES.find((x) => x.id === d)?.short ?? d).join(', ');

/** places of the app and settings, with the words people use for them */
const PLACES: { label: string; to: string; hint?: string; words?: string[] }[] = [
  { label: 'Chrono de combat', to: '/chrono', hint: 'Entraîner', words: ['chronometre', 'minuteur', 'timer', 'rounds'] },
  { label: 'Programmes', to: '/programmes', hint: 'Entraîner', words: ['programme', 'plan'] },
  { label: 'Mes enchaînements', to: '/createur', hint: 'Entraîner', words: ['createur', 'combinaison', 'creer'] },
  { label: 'Favoris', to: '/favoris', hint: 'Entraîner', words: ['favori', 'etoile'] },
  { label: 'Légendes', to: '/champions', hint: 'Apprendre', words: ['champion', 'legende', 'combo'] },
  { label: 'Encyclopédie', to: '/encyclopedie', hint: 'Apprendre', words: ['lexique', 'glossaire', 'mot'] },
  { label: 'Historique', to: '/historique', hint: 'Progrès', words: ['seances passees'] },
  { label: 'Objectifs', to: '/objectifs', hint: 'Progrès', words: ['objectif', 'but'] },
  { label: 'Mon coach', to: '/reglages/coach', hint: 'Réglages', words: ['kadir', 'amara', 'changer de coach'] },
  { label: 'Coach IA', to: '/reglages/coach-ia', hint: 'Réglages', words: ['historique du coach', 'questions'] },
  { label: 'Consignes pendant la séance', to: '/reglages/consignes', hint: 'Réglages', words: ['consignes', 'points clés', 'temps par consigne', 'enchaînées'] },
  { label: 'Pulsation pendant la séance', to: '/reglages/pulsation', hint: 'Réglages', words: ['pulsation', 'clignotement', 'clignoter', 'flash', 'éclair', 'bip'] },
  { label: 'Mes infos', to: '/profil', hint: 'Profil', words: ['profil', 'pseudo', 'taille', 'poids', 'imc', 'photo'] },
  { label: 'Thème Nuit, Jour, Auto', to: '/reglages', hint: 'Réglages', words: ['theme', 'sombre', 'clair', 'mode nuit', 'mode jour'] },
  { label: 'Voix et sons', to: '/reglages/voix', hint: 'Réglages', words: ['voix', 'son', 'volume', 'gong', 'audio'] },
  { label: 'Rounds par défaut', to: '/reglages/rounds', hint: 'Réglages', words: ['duree', 'repos', 'round'] },
  { label: 'Affichage 3D', to: '/reglages/affichage', hint: 'Réglages', words: ['qualite', 'tenue', 'rendu', 'lumiere', 'anime'] },
  { label: 'Caméra', to: '/reglages/affichage?focus=camera', hint: 'Réglages', words: ['camera', 'vue', 'angle'] },
  { label: 'Exporter, importer, effacer', to: '/reglages/donnees', hint: 'Réglages', words: ['donnees', 'sauvegarde', 'export'] },
  { label: 'Confidentialité', to: '/confidentialite', hint: 'Réglages', words: ['vie privee', 'donnees personnelles'] },
  { label: 'Premium', to: '/premium', hint: 'Réglages', words: ['achat', 'abonnement', 'restaurer'] },
];

let index: Entry[] | null = null;
function entries(): Entry[] {
  if (index) return index;
  index = [
    ...TECHNIQUES.map((t) => ({ group: 'Techniques' as const, label: t.name, hint: discShort(t.disciplines), to: `/techniques/${t.id}`, keys: [normalize(t.name), normalize(t.id.replace(/-/g, ' '))] })),
    ...TERMS.map((t) => ({
      group: 'Encyclopédie' as const,
      label: t.name,
      hint: t.subtitle,
      to: `/encyclopedie/terme/${t.id}`,
      keys: [normalize(t.name), ...(t.intl ? [normalize(t.intl)] : []), ...(t.aliases ?? []).map(normalize)],
    })),
    ...PROGRAMS.map((p) => ({ group: 'Programmes' as const, label: p.name, hint: p.discipline === 'mixte' ? 'Multi-disciplines' : discShort([p.discipline]), to: `/programmes/${p.id}`, keys: [normalize(p.name)] })),
    ...PLACES.map((p) => ({ group: 'Dans l’app' as const, label: p.label, hint: p.hint, to: p.to, keys: [normalize(p.label), ...(p.words ?? []).map(normalize)] })),
  ];
  return index;
}

/** 2: a key starts with the query, 1: every word of the query begins a word of a key, 0: no match */
function score(keys: string[], q: string, words: string[]): number {
  if (keys.some((k) => k.startsWith(q))) return 2;
  const ok = keys.some((k) => {
    const kw = k.split(' ');
    return words.every((w) => kw.some((x) => x.startsWith(w)));
  });
  return ok ? 1 : 0;
}

export const SEARCH_GROUPS: readonly SearchGroup[] = ['Techniques', 'Encyclopédie', 'Programmes', 'Dans l’app'];

/** the hits for a query, best first in each group, at most `perGroup` per group, groups in SEARCH_GROUPS order */
export function searchApp(query: string, perGroup = 4): SearchHit[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const words = q.split(' ');
  const scored = entries()
    .map((e) => ({ e, s: score(e.keys, q, words) }))
    .filter((x) => x.s > 0);
  const out: SearchHit[] = [];
  for (const g of SEARCH_GROUPS) {
    const seen = new Set<string>();
    scored
      .filter((x) => x.e.group === g)
      .sort((a, b) => b.s - a.s || a.e.label.length - b.e.label.length || a.e.label.localeCompare(b.e.label, 'fr'))
      .filter((x) => !seen.has(x.e.to) && (seen.add(x.e.to), true))
      .slice(0, perGroup)
      .forEach(({ e }) => out.push({ group: e.group, label: e.label, hint: e.hint, to: e.to }));
  }
  return out;
}
