import { SOURCES } from './biomech/sources';
import type { Source } from './biomech/types';

/**
 * v0.41 (Youssef, 2026-10-22, « Enrichissement des programmes », §2): the sources of the programmes. Most are the
 * documents already read for the biomechanical sheets (src/domain/biomech/sources.ts); the federation sites asked
 * for were consulted on 2026-10-22. Their home pages point to coach education and rule books but publish no training
 * programme: no official programme is reproduced, and every programme of the app says it is an original one, built
 * on the principles these sources describe.
 */
const C = '2026-10-22';

export const PROGRAM_ONLY_SOURCES: Source[] = [
  { id: 'prog-EB', by: 'England Boxing', title: 'Boxing – A Beginner’s Guide', url: 'https://www.englandboxing.org/get-involved/boxing-a-beginners-guide/', kind: 'pedagogique', disciplines: ['boxe'], read: 'Page entière : apprendre en club « dans un environnement sûr et contrôlé », combats amateurs en trois rounds de trois minutes. Aucun programme d’entraînement publié.', consulted: C, access: 'lue' },
  { id: 'prog-WAKO', by: 'WAKO', title: 'Rules overview', url: 'https://www.wako.sport/rules-overview', kind: 'reglement', disciplines: ['kickboxing'], read: 'Page d’accueil des règlements (liens vers les règles par discipline). Aucun programme d’entraînement publié.', consulted: C, access: 'lue' },
  { id: 'prog-IJF', by: 'IJF Academy', title: 'Classification of Judo and 100 Kodokan Techniques', url: 'https://academy.ijf.org/news/100-kodokan-techniques', kind: 'pedagogique', disciplines: ['judo'], read: 'Page d’annonce seulement ; le contenu est dans une présentation séparée, non lue. Aucun programme d’entraînement publié.', consulted: C, access: 'lue' },
  { id: 'prog-IBJJF', by: 'IBJJF', title: 'Graduation System', url: 'https://ibjjf.com/graduation-system', kind: 'reglement', disciplines: ['bjj'], read: 'Page de présentation des ceintures ; le détail est dans un PDF non lu. Aucun programme d’entraînement publié.', consulted: C, access: 'lue' },
];

const ALL = new Map([...SOURCES, ...PROGRAM_ONLY_SOURCES].map((s) => [s.id, s]));

export const programSource = (id: string): Source | undefined => ALL.get(id);
