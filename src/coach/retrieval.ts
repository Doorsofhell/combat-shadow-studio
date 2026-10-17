/**
 * Recherche BM25 sur la base de connaissances locale, avec bonus pour la technique en cours,
 * les techniques citées et la discipline. Index construit une seule fois, en mémoire.
 */
import type { DisciplineId } from '../domain/types';
import { knowledgeBase, type KnowledgeEntry } from './knowledge';
import { terms } from './text';

interface Doc {
  entry: KnowledgeEntry;
  tf: Map<string, number>;
  len: number;
}

interface Index {
  docs: Doc[];
  df: Map<string, number>;
  avgdl: number;
}

let index: Index | null = null;

function docTerms(e: KnowledgeEntry): string[] {
  // le titre et les étiquettes comptent double
  const strong = [e.title, ...e.tags].join(' ');
  const body = [e.text, e.simple ?? '', ...(e.cues ?? []), ...(e.keyPoints ?? []), ...(e.steps ?? []), ...(e.errors ?? [])].join(' ');
  return [...terms(strong), ...terms(strong), ...terms(body)];
}

function build(): Index {
  const docs = knowledgeBase().map((entry) => {
    const ts = docTerms(entry);
    const tf = new Map<string, number>();
    for (const t of ts) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { entry, tf, len: ts.length };
  });
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const avgdl = docs.reduce((s, d) => s + d.len, 0) / docs.length;
  return { docs, df, avgdl };
}

export interface RetrievalHit {
  entry: KnowledgeEntry;
  score: number;
}

export interface RetrievalOptions {
  discipline?: DisciplineId;
  /** technique affichée à l’écran (petit bonus) */
  currentTechnique?: string;
  /** techniques citées dans la question (gros bonus) */
  mentioned?: string[];
  /** limiter aux entrées de FAQ */
  faqOnly?: boolean;
  k?: number;
}

const K1 = 1.4;
const B = 0.6;

export function retrieve(question: string, o: RetrievalOptions = {}): RetrievalHit[] {
  if (!index) index = build();
  const q = [...new Set(terms(question))];
  const N = index.docs.length;
  const hits: RetrievalHit[] = [];
  for (const d of index.docs) {
    if (o.faqOnly && d.entry.source !== 'faq') continue;
    let s = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = index.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      s += (idf * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * d.len) / index.avgdl));
    }
    if (s <= 0) continue;
    const e = d.entry;
    const mentioned = o.mentioned ?? [];
    if (mentioned.includes(e.source)) s *= 2.2;
    else if (mentioned.some((m) => e.related.includes(m))) s *= 1.5;
    else if (o.currentTechnique && !mentioned.length && (e.source === o.currentTechnique || e.related.includes(o.currentTechnique))) s *= 1.12;
    if (o.discipline && !e.disciplines.includes(o.discipline)) s *= 0.7;
    hits.push({ entry: e, score: s });
  }
  hits.sort((a, b) => b.score - a.score || (a.entry.id < b.entry.id ? -1 : 1));
  return hits.slice(0, o.k ?? 5);
}
