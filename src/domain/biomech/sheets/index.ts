import type { BiomechSheet } from '../types';
import { PILOT_SHEETS } from './pilotes';

/** all biomechanical sheets of the official catalogue (editor only, never changed by users) */
export const SHEETS: BiomechSheet[] = [...PILOT_SHEETS];
export const SHEET_BY_ID = new Map(SHEETS.map((s) => [s.id, s]));
