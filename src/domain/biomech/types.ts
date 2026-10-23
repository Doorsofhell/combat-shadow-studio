/**
 * Biomechanical sheets of the official catalogue: one per technique, maintained by the publisher only
 * (never edited by users). Every statement carries the sources it comes from; what no consulted source
 * says is written as such, never filled in. Sheets live in src/domain/biomech/sheets/ and are checked
 * by src/domain/__tests__/biomech.test.ts.
 */
import type { DisciplineId } from '../types';

/** where a statement comes from; a regulation alone never defines how a move looks */
export type SourceKind = 'reglement' | 'pedagogique' | 'biomecanique' | 'variante' | 'competition' | 'reference' | 'sante';

export interface Source {
  id: string;
  /** organisation or authors */
  by: string;
  title: string;
  url: string;
  kind: SourceKind;
  disciplines: DisciplineId[];
  /** what was actually read, in plain words */
  read: string;
  /** date it was consulted, ISO */
  consulted: string;
  access: 'lue' | 'inaccessible';
}

/**
 * A video reference. 'reperee' means only the title or the page was seen: the video itself was not
 * watched. 'visionnee' is allowed only when someone really watched it, with who and when.
 */
export interface VideoRef {
  id: string;
  title: string;
  url: string;
  by: string;
  techniques: string[];
  state: 'reperee' | 'visionnee';
  watched?: { by: string; date: string; notes: string };
}

/** a statement and its sources; empty sources = not documented by the sources consulted */
export interface Claim {
  text: string;
  sources: string[];
  /** our own reasoning from the sources, not a statement of a source */
  inference?: boolean;
}

/** production status of a technique, from its sheet and its animation checks */
export type SheetStatus = 'a-documenter' | 'documentee' | 'animation-en-cours' | 'a-corriger' | 'validation-necessaire' | 'validee';

export interface ExpertReview {
  by: string;
  qualification: string;
  date: string;
  criteria: string[];
  notes: string;
}

export interface SheetChange {
  date: string;
  what: string;
}

export interface BiomechSheet {
  /** same id as the technique in the catalogue */
  id: string;
  disciplines: DisciplineId[];
  nameFr: string;
  /** international or traditional name, e.g. "Jab", "O-soto-gari" */
  nameIntl: string;
  family: string;
  level: string;
  startPosition: Claim[];
  guard: Claim[];
  stance: Claim[];
  footwork: Claim[];
  weightTransfer: Claim[];
  pelvisRotation: Claim[];
  trunkRotation: Claim[];
  shoulders: Claim[];
  limbPath: Claim[];
  joints: Claim[];
  /** phases in order */
  phases: { name: string; claims: Claim[] }[];
  contact: Claim[];
  endPosition: Claim[];
  recovery: Claim[];
  sides: Claim[];
  commonErrors: Claim[];
  safety: Claim[];
  sources: string[];
  videos: string[];
  /** differences found between the app (text or animation) and the sources */
  findings: { severity: 'elevee' | 'moyenne' | 'faible'; text: string; sources: string[]; fixed?: string }[];
  status: SheetStatus;
  review?: ExpertReview;
  history: SheetChange[];
}
