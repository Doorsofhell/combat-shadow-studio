/**
 * v0.46 (Youssef, 2026-10-23, « Création de l'Encyclopédie du combat — Version 1.0 »): one typed base of terms for
 * the six disciplines. A term is written once and tagged with every discipline it belongs to (one « Jab », not four);
 * synonyms, spellings and translations are aliases of that one term. Data only: the screens live in
 * src/ui/encyclopedia/, the checks in src/domain/encyclopedia/__tests__/.
 */
import type { DisciplineId } from '../types';

export type FamilyId = 'techniques' | 'positions' | 'equipements' | 'lieux' | 'regles' | 'preparation' | 'securite' | 'culture';

export interface Subfamily {
  id: string;
  label: string;
}

export interface Family {
  id: FamilyId;
  label: string;
  /** one line under the name on the cards */
  short: string;
  subfamilies: Subfamily[];
  /** illustration of the family card (images.ts) */
  image: string;
}

/**
 * Editorial status (§10, §17 « aucun contenu marqué comme validé sans vérification »):
 * - 'sourcee': every statement was checked against the sources listed, on the date given;
 * - 'validee': also reread by a qualified person, named in `reviewedBy`. No term has it yet.
 */
export type EditorialStatus = 'sourcee' | 'validee';

/** what kind of statement a section holds (§13): a rule is never presented as a general truth */
export type ClaimKind = 'definition' | 'regle' | 'convention' | 'variante' | 'conseil' | 'histoire';

export interface TermSection {
  title: string;
  kind: ClaimKind;
  items: string[];
}

export interface Term {
  /** stable id, also the address of the sheet (#/encyclopedie/terme/:id) */
  id: string;
  family: FamilyId;
  /** a subfamily id of that family */
  sub: string;
  /** French name shown everywhere */
  name: string;
  /** one line under the name: « Direct du bras avant » */
  subtitle: string;
  /** international name when it differs (often English, Japanese for judo) */
  intl?: string;
  /** synonyms, other spellings, translations: all lead to this term */
  aliases?: string[];
  /** language of the word when it helps (§8 « préciser l'origine linguistique ») */
  origin?: { lang: 'fr' | 'en' | 'ja' | 'th' | 'pt'; note?: string };
  disciplines: DisciplineId[];
  definition: string;
  sections?: TermSection[];
  /** what changes from one discipline to the other */
  byDiscipline?: Partial<Record<DisciplineId, string>>;
  /** for a rule: which body and which text */
  rule?: { org: string; text: string };
  /** other terms of the encyclopedia */
  related?: string[];
  /** techniques of the app this term explains (src/domain/techniques.ts); their own points are shown, not copied */
  techniques?: string[];
  /** partner-only sheets of the app (src/domain/partner.ts) */
  partner?: string[];
  /** ids of sources (sources.ts, or the biomechanical and programme sources already in the app) */
  sources: string[];
  /** date the content was last checked against its sources, ISO */
  checked: string;
  status: EditorialStatus;
  reviewedBy?: string;
  /** illustration id (images.ts); none = the sheet says the illustration is still to be made */
  image?: string;
}

/**
 * An illustration and where it comes from (§11, §12): every file says how it was made. 'a-produire' is a planned
 * illustration with its brief: the app shows that it is missing, never a stand-in picture.
 */
export type ImageOrigin =
  | { kind: 'rendu-3d'; what: string; tool: string; date: string }
  | { kind: 'a-produire'; brief: string };

export interface TermImage {
  id: string;
  /** under public/encyclopedie/, without extension: <file>.webp and <file>-mini.webp */
  file?: string;
  width: number;
  height: number;
  alt: string;
  origin: ImageOrigin;
  /** frames of a movement (start, middle, end) when the illustration is a sequence */
  frames?: number;
}
