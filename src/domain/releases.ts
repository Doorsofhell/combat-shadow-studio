/**
 * v0.32 (Youssef, PROMPT MAÎTRE navigation, section 7): « Nouveautés », the versions of the app and what each one
 * brought. Only real, delivered changes (docs/JOURNAL_CORRECTIONS.md is the source); the mockup's sample notes are
 * not used. Bundled with the app, so the centre works offline. Newest first.
 *
 * To announce a new version: add an entry at the top (its `version` is the package version without the
 * « -protoN » suffix); the red dots of Menu and Nouveautés come back for everyone until it is opened.
 */
export type ReleaseCategory = 'fonctionnalites' | 'techniques' | 'disciplines' | 'coachs' | 'ameliorations' | 'corrections';

export const RELEASE_CATEGORY_LABEL: Record<ReleaseCategory, string> = {
  fonctionnalites: 'Nouvelles fonctionnalités',
  techniques: 'Nouvelles techniques',
  disciplines: 'Nouvelles disciplines',
  coachs: 'Nouveaux coachs',
  ameliorations: 'Améliorations',
  corrections: 'Corrections',
};

export interface ReleaseChange {
  category: ReleaseCategory;
  text: string;
}

export interface ReleaseLink {
  label: string;
  /** a page of the app (hash route) */
  to: string;
}

export interface Release {
  version: string;
  /** publication date, YYYY-MM-DD */
  releaseDate: string;
  title: string;
  /** the categories present, in display order (derived from `changes`, kept for readers of the data) */
  categories: ReleaseCategory[];
  changes: ReleaseChange[];
  links: ReleaseLink[];
  /** a major update (may be presented discreetly at start-up later; nothing intrusive today) */
  isMajor: boolean;
}

type Draft = Omit<Release, 'categories'>;

const ORDER: ReleaseCategory[] = ['fonctionnalites', 'techniques', 'disciplines', 'coachs', 'ameliorations', 'corrections'];
const withCategories = (r: Draft): Release => ({ ...r, categories: ORDER.filter((c) => r.changes.some((x) => x.category === c)) });

export const RELEASES: readonly Release[] = (
  [
    {
      version: '0.32.0',
      releaseDate: '2026-10-22',
      title: 'Nouvelle navigation et tenues premium',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Une seule barre en bas de l’écran : ses cinq boutons changent selon l’écran, Menu ouvre la navigation générale.' },
        { category: 'fonctionnalites', text: 'Nouveautés : l’historique des versions, avec un point rouge quand une version n’a pas été consultée.' },
        { category: 'fonctionnalites', text: 'Recherche de techniques et de légendes par leur nom.' },
        { category: 'ameliorations', text: 'Uppercut, coude horizontal, middle et high kick et genou direct : les hanches lancent le coup, sans chute à l’arrivée.' },
        { category: 'ameliorations', text: 'Judogis et gis de jiu-jitsu refaits : tissage fin, col renforcé, ceinture plate nouée.' },
        { category: 'ameliorations', text: 'Shorts mats, gants moins ronds, protège-tibias à bords droits.' },
        { category: 'ameliorations', text: '« Choisis ton coach » montre les vrais coachs 3D.' },
        { category: 'corrections', text: 'Le coach n’apparaît plus quelques instants sans sa tenue.' },
      ],
      links: [
        { label: 'Voir les techniques', to: '/techniques' },
        { label: 'Choisir mon coach', to: '/coach' },
      ],
    },
    {
      version: '0.31.0',
      releaseDate: '2026-10-22',
      title: 'Moteur 3D plus net et tenues par discipline',
      isMajor: true,
      changes: [
        { category: 'fonctionnalites', text: 'Chaque coach porte la tenue de la discipline (7 tenues), avec le choix kimono ou sans kimono en jiu-jitsu.' },
        { category: 'ameliorations', text: 'Image plus nette sur téléphone et contours sans escaliers.' },
        { category: 'ameliorations', text: 'Musculature plus naturelle ; jab, direct et low kick refaits.' },
      ],
      links: [{ label: 'Réglages d’affichage', to: '/reglages/affichage' }],
    },
    {
      version: '0.30.0',
      releaseDate: '2026-10-22',
      title: 'Coachs photo-réalistes',
      isMajor: true,
      changes: [
        { category: 'coachs', text: 'Kadir et Amara en rendu Ultra-réaliste (modèles photo-réalistes).' },
        { category: 'ameliorations', text: 'Mouvements en chaîne : les hanches partent avant les bras ; garde vivante.' },
        { category: 'corrections', text: 'Le coach 3D ne disparaît plus sur certains téléphones Android.' },
      ],
      links: [],
    },
    {
      version: '0.28.0',
      releaseDate: '2026-10-21',
      title: 'Disciplines enrichies et Coach IA',
      isMajor: false,
      changes: [
        { category: 'techniques', text: '16 nouvelles techniques en judo et en jiu-jitsu brésilien, dont les chutes.' },
        { category: 'fonctionnalites', text: 'Fenêtre du Coach IA réduite, normale ou agrandie ; questions plus variées.' },
        { category: 'fonctionnalites', text: 'Carte IMC dans le profil ; plein écran du coach par un double appui.' },
        { category: 'ameliorations', text: '107 légendes et 1 496 combinaisons, avec leur « fleur de style ».' },
      ],
      links: [{ label: 'Voir les légendes', to: '/champions' }],
    },
    {
      version: '0.26.0',
      releaseDate: '2026-10-20',
      title: 'Actions rapides',
      isMajor: false,
      changes: [{ category: 'fonctionnalites', text: 'Les actions les plus courantes de chaque écran à portée de pouce.' }],
      links: [],
    },
    {
      version: '0.25.0',
      releaseDate: '2026-10-20',
      title: 'Coach IA sur tous les écrans',
      isMajor: false,
      changes: [
        { category: 'fonctionnalites', text: 'Le Coach IA répond selon l’écran ouvert.' },
        { category: 'fonctionnalites', text: 'Technique précédente et suivante sur chaque fiche.' },
      ],
      links: [],
    },
    {
      version: '0.24.0',
      releaseDate: '2026-10-20',
      title: 'Kadir et Amara, vos coachs',
      isMajor: true,
      changes: [
        { category: 'coachs', text: 'Kadir et Amara deviennent les coachs de l’application.' },
        { category: 'fonctionnalites', text: 'Marque de maîtrise sur chaque technique et filtre « À revoir ».' },
        { category: 'ameliorations', text: 'Écrans épurés, textes pensés pour les débutants.' },
      ],
      links: [],
    },
  ] satisfies Draft[]
).map(withCategories);

export const LATEST_RELEASE = RELEASES[0];

/** a version the user has not opened yet: the red dots of Menu and Nouveautés */
export const hasUnseenRelease = (seen: string | null | undefined) => seen !== LATEST_RELEASE.version;

/** 2026-10-22 → « 22 octobre 2026 » */
export function releaseDateLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${d} ${months[m - 1]} ${y}`;
}
