import type { DisciplineId } from '../../domain/types';

/**
 * 1.0.0 (refonte ergonomique, maquette v4 validée par Youssef le 2026-10-27): one vivid colour per discipline, the
 * same by day and by night. The CSS tokens --disc-<id> in src/ui/styles.css hold the same values (checked by test).
 */
export const DISCIPLINE_COLOR: Record<DisciplineId, string> = {
  boxe: '#ff3b3b',
  kickboxing: '#ff9f1a',
  mma: '#ffe14d',
  muaythai: '#ff4fd8',
  bjj: '#3d8bff',
  judo: '#3df5e0',
};

/** the text drawn on these colours */
export const ON_DISCIPLINE = '#0b0f14';
