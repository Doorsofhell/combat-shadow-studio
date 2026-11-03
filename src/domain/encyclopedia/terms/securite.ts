import type { Term } from '../types';

/**
 * Family 7, body and safety. Prudent, general information for learning, never a personal medical advice (§4):
 * every sheet that touches health sends to a professional.
 */
const C = '2026-10-23';
const ALL = ['boxe', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo'] as const;

export const SAFETY_TERMS: Term[] = [
  {
    id: 'ukemi', family: 'securite', sub: 'chutes', name: 'Ukemi', subtitle: 'Savoir chuter',
    intl: 'Breakfall', aliases: ['chute', 'brise-chute', 'breakfall', 'ushiro-ukemi', 'yoko-ukemi', 'mae-ukemi', 'chute arrière', 'chute latérale'], origin: { lang: 'ja' },
    disciplines: ['judo', 'bjj'],
    definition: 'Techniques de chute qui protègent la tête et répartissent le choc : menton rentré, bras qui frappe le tapis à environ 45°, jambes non croisées. On les apprend couché, puis assis, puis accroupi, avant de chuter debout.',
    sections: [{ title: 'Précautions', kind: 'conseil', items: ['Sur un tapis adapté, et en progressant du plus bas au plus haut.', 'Dans l’application, les chutes sont proposées en version basse, sans partenaire.'] }],
    related: ['tatami', 'tap-out'], techniques: ['ukemi-ushiro', 'ukemi-yoko'], partner: ['ukemi'],
    sources: ['jb-S11', 'jb-S5'], checked: C, status: 'sourcee', image: 'secu-ukemi',
  },
  {
    id: 'tap-out', family: 'securite', sub: 'chutes', name: 'Taper pour abandonner', subtitle: 'Le signal d’abandon',
    intl: 'Tap out', aliases: ['tap', 'tap out', 'taper', 'signal d’abandon', 'abandon verbal'], origin: { lang: 'fr' },
    disciplines: ['bjj', 'judo', 'mma'],
    definition: 'Taper plusieurs fois sur l’adversaire ou le tapis, ou dire qu’on abandonne, arrête immédiatement la prise. À l’entraînement, les clés et étranglements se placent lentement pour laisser le temps d’abandonner ; on relâche dès le signal.',
    related: ['abandon', 'cle-de-bras', 'etranglement-arriere'],
    sources: ['enc-W-mma', 'enc-W-armbar', 'enc-W-rnc'], checked: C, status: 'sourcee', image: 'regle-soumission',
  },
  {
    id: 'commotion', family: 'securite', sub: 'prevention', name: 'Commotion cérébrale', subtitle: 'Reconnaître les signes et s’arrêter',
    intl: 'Concussion', aliases: ['concussion', 'commotion', 'traumatisme crânien', 'choc à la tête'], origin: { lang: 'fr' },
    disciplines: [...ALL],
    definition: 'Après un coup, un choc ou une secousse à la tête, certains signes doivent alerter. Avec un signe de danger, on appelle les urgences. Par prudence, l’application conseille d’arrêter la séance dès qu’un choc à la tête inquiète et de demander un avis médical.',
    sections: [
      { title: 'Signes de danger : urgences', kind: 'conseil', items: ['Convulsions.', 'Ne reconnaît plus les personnes ou les lieux.', 'Nausées ou vomissements répétés.', 'Comportement inhabituel, confusion croissante, agitation.', 'Perte de connaissance, somnolence qui augmente, impossible à réveiller.', 'Élocution pâteuse, faiblesse, engourdissement, coordination diminuée.', 'Mal de tête qui empire et ne passe pas.', 'Une pupille plus grande que l’autre, ou vision double.'] },
      { title: 'Autres symptômes possibles', kind: 'definition', items: ['Gêne à la lumière ou au bruit, vertiges, troubles de l’équilibre, fatigue, maux de tête, troubles de la vue.', 'Difficultés de concentration ou de mémoire, sensation d’être ralenti ou dans le brouillard.', 'Irritabilité, anxiété, tristesse ; sommeil modifié.'] },
      { title: 'Important', kind: 'conseil', items: ['Ces informations ne remplacent pas un avis médical.'] },
    ],
    related: ['protege-dents', 'sparring', 'ko'],
    sources: ['enc-CDC'], checked: C, status: 'sourcee', image: 'secu-commotion',
  },
  {
    id: 'protections-usage', family: 'securite', sub: 'prevention', name: 'Porter ses protections', subtitle: 'Ce que les règlements imposent',
    aliases: ['équipement de protection', 'protections obligatoires'], origin: { lang: 'fr' },
    disciplines: ['boxe', 'kickboxing', 'mma', 'muaythai'],
    definition: 'Les règlements amateurs rendent plusieurs protections obligatoires. À l’entraînement avec contact, porter au moins les mêmes est une précaution de bon sens.',
    sections: [{ title: 'Exemples', kind: 'regle', items: ['Muay-thaï IFMA senior : casque, coudières, protège-tibias, protège-dents, coquille, protection de poitrine pour les femmes, gants de 10 oz (art. 10).', 'MMA amateur IMMAF : gants de 6 à 8 oz, protège-tibias, rashguard, protège-dents, coquille pour les hommes (section 15).'] }],
    related: ['protege-dents', 'casque', 'protege-tibias', 'coquille'],
    sources: ['enc-IFMA', 'enc-IMMAF'], checked: C, status: 'sourcee', image: 'eq-protege-tibias',
  },
  {
    id: 'precautions-articulaires', family: 'securite', sub: 'prevention', name: 'Précautions articulaires', subtitle: 'Clés, torsions et règles par niveau',
    aliases: ['clé de cheville', 'heel hook', 'clé de talon', 'clés interdites', 'colonne vertébrale', 'cervicales'], origin: { lang: 'fr' },
    disciplines: ['bjj', 'judo', 'mma'],
    definition: 'Les règlements interdisent les prises les plus risquées pour les articulations et la colonne, et l’entraînement les place lentement.',
    sections: [{ title: 'Selon le règlement', kind: 'regle', items: ['JJB en kimono : clés de talon (heel hooks) interdites ; clés de la colonne et des cervicales interdites (enc-W-bjj).', 'JJB no-gi IBJJF : clés de talon permises, clés de colonne toujours interdites (enc-W-bjj).', 'Judo : seules les clés du coude sont permises (enc-W-judorules).', 'MMA amateur IMMAF : clés de talon, torsions de la colonne et clés de cou interdites (section 10).'] }],
    related: ['cle-de-bras', 'tap-out'],
    sources: ['enc-W-bjj', 'enc-W-judorules', 'enc-IMMAF'], checked: C, status: 'sourcee', image: 'secu-articulations',
  },
  {
    id: 'cibles-interdites', family: 'securite', sub: 'corps', name: 'Zones interdites', subtitle: 'Où l’on ne frappe jamais',
    aliases: ['nuque', 'arrière de la tête', 'aine', 'zones dangereuses', 'reins', 'yeux'], origin: { lang: 'fr' },
    disciplines: ['boxe', 'kickboxing', 'mma', 'muaythai'],
    definition: 'Les règlements protègent les zones du corps où un coup est particulièrement dangereux : l’arrière de la tête et la nuque, l’aine, les yeux, les reins selon les règles.',
    sections: [{ title: 'Selon le règlement', kind: 'regle', items: ['Boxe : sous la ceinture, derrière la tête ou la nuque (enc-W-boxing).', 'MMA (règles unifiées) : aine, yeux, arrière de la tête avec le poing fermé, reins (enc-W-mma).', 'Muay-thaï IFMA : les cibles non valables et interdites sont fixées à l’art. 20.1.'] }],
    related: ['faute'],
    sources: ['enc-W-boxing', 'enc-W-mma', 'enc-IFMA'], checked: C, status: 'sourcee', image: 'secu-zones',
  },
];
