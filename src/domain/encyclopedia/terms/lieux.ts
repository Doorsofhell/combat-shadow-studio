import type { Term } from '../types';

/** Family 4, venues and surfaces. Dimensions are given only with the rule or source that sets them. */
const C = '2026-10-23';

export const VENUE_TERMS: Term[] = [
  {
    id: 'ring', family: 'lieux', sub: 'aires', name: 'Ring', subtitle: 'Plateforme carrée entourée de cordes',
    intl: 'Boxing ring', aliases: ['ring de boxe', 'boxing ring', 'ring de kick-boxing'], origin: { lang: 'en' },
    disciplines: ['boxe', 'kickboxing', 'muaythai'],
    definition: 'Plateforme carrée surélevée, avec un poteau à chaque coin et des cordes tendues entre eux. Le sol est rembourré et recouvert d’une toile tendue.',
    sections: [
      { title: 'Dimensions', kind: 'definition', items: ['En général 4,9 à 7,3 m de côté entre les cordes, avec environ 60 cm de plancher à l’extérieur (enc-W-ring, sans fédération citée).', 'Quatre cordes d’environ 2,5 cm de diamètre.'] },
      { title: 'Variante', kind: 'variante', items: ['Certaines organisations utilisent un ring circulaire.'] },
    ],
    related: ['ring-muaythai', 'coins', 'cage'],
    sources: ['enc-W-ring'], checked: C, status: 'sourcee', image: 'lieu-ring',
  },
  {
    id: 'ring-muaythai', family: 'lieux', sub: 'aires', name: 'Ring de muay-thaï', subtitle: 'Selon les règles IFMA',
    aliases: ['ring thaï', 'muay thai ring'], origin: { lang: 'fr' },
    disciplines: ['muaythai'],
    definition: 'Ring carré dont l’IFMA fixe les dimensions : il ressemble à un ring de boxe, avec ses propres hauteurs de cordes.',
    rule: { org: 'IFMA', text: 'Rules & Regulations V2.01, 30 août 2020, art. 9.1' },
    sections: [{ title: 'Règle IFMA', kind: 'regle', items: ['4,9 m minimum à 6,1 m maximum à l’intérieur des cordes ; plancher à 0,90 à 1,20 m du sol (art. 9.1.1).', 'Quatre cordes à 40, 70, 100 et 130 cm, d’au moins 3 cm d’épaisseur (art. 9.1.4).'] }],
    related: ['ring', 'wai-kru'],
    sources: ['enc-IFMA'], checked: C, status: 'sourcee', image: 'lieu-ring',
  },
  {
    id: 'cage', family: 'lieux', sub: 'aires', name: 'Cage', subtitle: 'Aire grillagée du MMA',
    intl: 'Cage', aliases: ['cage de mma', 'cage octogonale', 'hexagone', 'aire grillagée'], origin: { lang: 'fr' },
    disciplines: ['mma'],
    definition: 'Aire de combat entourée d’un grillage qui empêche les combattants de tomber ou de passer au travers. Elle peut être ronde ou polygonale. Un combat de MMA peut aussi avoir lieu sur un ring.',
    sections: [
      { title: 'Règle IMMAF (amateur)', kind: 'regle', items: ['Ronde ou polygonale à côtés égaux (hexagone, octogone…), de 20 × 20 à 32 × 32 pieds (environ 6 à 9,75 m).', 'Sol en mousse haute densité d’au moins 40 mm, recouvert de vinyle (section 16).'] },
      { title: 'Le mot « Octagon »', kind: 'convention', items: ['« The Octagon » est une marque déposée de l’UFC : ce n’est pas un nom générique. La forme à huit côtés, elle, n’est pas protégée ; on parle de cage octogonale.'] },
    ],
    related: ['ring', 'zone-securite'],
    sources: ['enc-IMMAF', 'enc-W-mma'], checked: C, status: 'sourcee', image: 'lieu-cage',
  },
  {
    id: 'aire-judo', family: 'lieux', sub: 'aires', name: 'Aire de combat de judo', subtitle: 'Tapis, zone de combat et zone de sécurité',
    intl: 'Competition area', aliases: ['surface de combat', 'shiai-jo', 'aire de compétition', 'tapis de judo'], origin: { lang: 'fr' },
    disciplines: ['judo'],
    definition: 'Surface de tatamis composée d’une zone de combat entourée d’une zone de sécurité. Le combat s’arrête quand un judoka sort de la zone prévue.',
    sections: [{ title: 'Dimensions', kind: 'regle', items: ['Au moins 14 × 14 m en tout, dont une zone de combat de 8 × 8 à 10 × 10 m ; au moins 3 m entre deux aires voisines (enc-W-judorules, d’après les règles IJF).'] }],
    related: ['tatami', 'zone-securite', 'dojo'],
    sources: ['enc-W-judorules', 'enc-W-judo'], checked: C, status: 'sourcee', image: 'lieu-tatami',
  },
  {
    id: 'tatami', family: 'lieux', sub: 'elements', name: 'Tatami', subtitle: 'Le tapis du dojo',
    aliases: ['tatamis', 'tapis', 'mat'], origin: { lang: 'ja' },
    disciplines: ['judo', 'bjj'],
    definition: 'Natte japonaise, deux fois plus longue que large (environ 0,9 × 1,8 m traditionnellement), utilisée pour l’entraînement au dojo et en compétition. Le mot désigne aujourd’hui aussi les tapis de sol des salles de grappling.',
    related: ['dojo', 'aire-judo', 'ukemi'],
    sources: ['enc-W-tatami'], checked: C, status: 'sourcee', image: 'lieu-tatami',
  },
  {
    id: 'dojo', family: 'lieux', sub: 'salles', name: 'Dojo', subtitle: 'Lieu où l’on étudie la voie',
    aliases: ['dōjō', 'club de judo', 'salle de judo'], origin: { lang: 'ja' },
    disciplines: ['judo', 'bjj'],
    definition: 'Salle d’entraînement des arts martiaux japonais. Le Kodokan, fondé en 1882 par Kanō Jigorō dans un temple de Tokyo, est le dojo d’origine du judo.',
    related: ['tatami', 'kodokan'],
    sources: ['enc-W-judo', 'enc-W-tatami'], checked: C, status: 'sourcee', image: 'lieu-dojo',
  },
  {
    id: 'coins', family: 'lieux', sub: 'elements', name: 'Coins rouge et bleu', subtitle: 'Les deux coins des combattants',
    intl: 'Red and blue corners', aliases: ['coin rouge', 'coin bleu', 'corner'], origin: { lang: 'fr' },
    disciplines: ['boxe', 'kickboxing', 'muaythai', 'mma'],
    definition: 'Chaque combattant a son coin, où il revient entre les rounds avec son équipe. Par tradition, le coin rouge revient au mieux classé ou au favori, le bleu à l’autre (enc-W-ring) ; gants et tenues sont souvent de la couleur du coin.',
    sections: [{ title: 'Règles', kind: 'regle', items: ['Muay-thaï IFMA : gants rouges ou bleus (art. 10.1.2).', 'MMA amateur IMMAF : gants rouges ou bleus (section 15).'] }],
    related: ['ring', 'cage'],
    sources: ['enc-W-ring', 'enc-IFMA', 'enc-IMMAF'], checked: C, status: 'sourcee', image: 'lieu-ring',
  },
  {
    id: 'zone-securite', family: 'lieux', sub: 'elements', name: 'Zone de sécurité', subtitle: 'Marge autour de l’aire de combat',
    intl: 'Safety area', aliases: ['safety area', 'zone de protection'], origin: { lang: 'fr' },
    disciplines: ['judo', 'bjj', 'mma'],
    definition: 'Bande de tapis qui entoure la zone de combat ; en judo, au moins 3 m séparent aussi deux aires voisines. En MMA, c’est le grillage de la cage qui empêche les combattants de tomber hors de l’aire.',
    related: ['aire-judo', 'cage'],
    sources: ['enc-W-judorules', 'enc-IMMAF'], checked: C, status: 'sourcee', image: 'lieu-tatami',
  },
];
