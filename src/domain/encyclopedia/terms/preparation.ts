import type { Term } from '../types';

/** Family 6, training notions: how one trains, kept apart from the fighting techniques themselves (§4). */
const C = '2026-10-23';
const STRIKERS = ['boxe', 'kickboxing', 'mma', 'muaythai'] as const;
const ALL = ['boxe', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo'] as const;

export const TRAINING_TERMS: Term[] = [
  {
    id: 'shadow-boxing', family: 'preparation', sub: 'methodes', name: 'Shadow boxing', subtitle: 'Combattre un adversaire imaginaire',
    aliases: ['shadow', 'boxe dans le vide', 'shadowboxing', 'combat contre son ombre'], origin: { lang: 'en' },
    disciplines: [...STRIKERS],
    definition: 'On enchaîne coups et déplacements dans le vide, comme face à un adversaire imaginaire. Il sert surtout à travailler la technique et les déplacements, et souvent à s’échauffer avant le reste de la séance. Un miroir aide à repérer ses erreurs de rythme.',
    sections: [{ title: 'Dans l’application', kind: 'conseil', items: ['C’est le principe de Combat Shadow Studio : le coach 3D montre les coups, tu les reproduis seul.'] }],
    related: ['echauffement', 'travail-sac'],
    sources: ['enc-W-shadow'], checked: C, status: 'sourcee', image: 'prep-shadow',
  },
  {
    id: 'travail-sac', family: 'preparation', sub: 'methodes', name: 'Travail au sac', subtitle: 'Frapper fort sur une cible lourde',
    intl: 'Bag work', aliases: ['bag work', 'sac', 'frappe au sac'], origin: { lang: 'fr' },
    disciplines: [...STRIKERS],
    definition: 'Séries de coups sur un sac de frappe pour développer la puissance et endurcir les surfaces de frappe ; la technique s’apprend plutôt aux pattes d’ours.',
    related: ['sac-de-frappe', 'travail-pattes'],
    sources: ['enc-W-bag'], checked: C, status: 'sourcee', image: 'eq-sac',
  },
  {
    id: 'travail-pattes', family: 'preparation', sub: 'methodes', name: 'Travail aux pattes d’ours', subtitle: 'Enchaînements annoncés par l’entraîneur',
    intl: 'Mitt work', aliases: ['mitt work', 'pads', 'travail aux paos'], origin: { lang: 'fr' },
    disciplines: [...STRIKERS],
    definition: 'L’entraîneur annonce des enchaînements par numéros (« un, deux, trois » : jab, direct, crochet), place les cibles au bon moment et corrige entre deux séries. Il complète le sparring.',
    related: ['pattes-ours', 'paos', 'sparring'],
    sources: ['enc-W-mitt'], checked: C, status: 'sourcee', image: 'eq-pattes-ours',
  },
  {
    id: 'sparring', family: 'preparation', sub: 'methodes', name: 'Sparring', subtitle: 'Combat d’entraînement',
    aliases: ['assaut', 'mise de gants', 'combat d’entraînement'], origin: { lang: 'en' },
    disciplines: [...ALL],
    definition: 'Combat libre d’entraînement, avec assez de règles et d’accords pour limiter les blessures. Son but est d’apprendre, pas de gagner.',
    sections: [{ title: 'Précautions', kind: 'conseil', items: ['Les blessures restent fréquentes, surtout à la tête, au visage et au cou.', 'Un encadrement et des règles claires sont recommandés, surtout entre inconnus.', 'Certains clubs font attendre quelques mois avant le premier sparring.'] }],
    byDiscipline: { judo: 'Les partenaires commencent souvent en se tenant, et l’échange s’arrête quand ils se séparent.', bjj: 'Contact complet mais sans frappe : on cherche la soumission par le grappling.' },
    related: ['protege-dents', 'casque', 'commotion'],
    sources: ['enc-W-sparring'], checked: C, status: 'sourcee', image: 'prep-sparring',
  },
  {
    id: 'uchikomi', family: 'preparation', sub: 'methodes', name: 'Uchikomi', subtitle: 'Répéter l’entrée d’une projection',
    aliases: ['uchi-komi', 'butsukari', 'entrées répétées'], origin: { lang: 'ja' },
    disciplines: ['judo'],
    definition: 'Exercice de judo où l’on répète l’entrée d’une projection (déséquilibre, placement) sans projeter. L’application en propose une version seul, sans partenaire.',
    related: ['kuzushi', 'seoi-nage', 'o-goshi'], techniques: ['uchikomi-seoi', 'uchikomi-o-goshi', 'uchikomi-o-soto-gari', 'uchikomi-o-uchi-gari', 'uchikomi-ko-uchi-gari'],
    sources: ['jb-S5'], checked: C, status: 'sourcee', image: 'tech-seoi-nage',
  },
  {
    id: 'drill', family: 'preparation', sub: 'methodes', name: 'Drill', subtitle: 'Exercice répété d’un geste',
    aliases: ['drills', 'exercice technique', 'éducatif', 'solo drill'], origin: { lang: 'en' },
    disciplines: [...ALL],
    definition: 'Exercice qui répète un même geste ou un petit enchaînement jusqu’à l’automatiser. En JJB, des exercices seul (chutes, relevés, sit-out, sprawl, entrées de lutte, roulades) travaillent les mouvements de base sans partenaire.',
    related: ['uchikomi', 'shadow-boxing'],
    sources: ['jb-S51'], checked: C, status: 'sourcee', image: 'tech-sit-out',
  },
  // ——— séance
  {
    id: 'echauffement', family: 'preparation', sub: 'seance', name: 'Échauffement', subtitle: 'Préparer le corps à l’effort',
    intl: 'Warm-up', aliases: ['warm-up', 'warm up', 'mise en route'], origin: { lang: 'fr' },
    disciplines: [...ALL],
    definition: 'Exercice léger avant l’effort, du général au spécifique : on monte progressivement en intensité, on mobilise les articulations, puis on reprend les gestes du sport. Les étirements dynamiques y ont leur place ; les étirements statiques prolongés sont déconseillés juste avant l’effort.',
    sections: [{ title: 'Ce que disent les études', kind: 'definition', items: ['L’échauffement améliore la performance dans la plupart des études d’une méta-analyse de 2010.', 'Son effet sur la prévention des blessures reste discuté : les résultats sont partagés.'] }],
    related: ['shadow-boxing', 'intervalles'],
    sources: ['enc-W-warmup'], checked: C, status: 'sourcee', image: 'prep-echauffement',
  },
  {
    id: 'intervalles', family: 'preparation', sub: 'seance', name: 'Travail par rounds', subtitle: 'Effort et récupération alternés',
    intl: 'Rounds training', aliases: ['intervalles', 'fractionné', 'reprises d’entraînement'], origin: { lang: 'fr' },
    disciplines: [...STRIKERS],
    definition: 'L’entraînement se découpe en périodes de travail chronométrées séparées par un court repos, souvent 3 à 5 minutes de travail pour 1 à 2 minutes de pause, à l’image des rounds de compétition.',
    related: ['round'],
    sources: ['enc-W-mt'], checked: C, status: 'sourcee', image: 'regle-round',
  },
];
