import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * v0.31 (Youssef, 2026-10-22: « flou ou halo autour de la silhouette, contours irréguliers et parfois
 * pixelisés »). Measured on an emulated Pixel 7 (scripts/dev/sharpness.mjs, device pixel ratio 2.625): the coach
 * was drawn at 1.5 pixels per CSS pixel in automatic quality (57 % of the screen's resolution, then stretched:
 * soft edges), and at 1 pixel without antialiasing after one graphics incident or when the frame rate dropped
 * (38 %: staircase edges), 0.75 after two (29 %). The internal resolution now follows a pixel budget: the
 * screen's own resolution whenever the stage fits in the budget, lowered just enough otherwise.
 */
export const PIXEL_BUDGET = {
  /** high quality: about a full-screen phone stage at native resolution */
  haute: 2_400_000,
  /** light quality (slow device, after one incident): still above 2 pixels per CSS pixel on a phone stage */
  basse: 1_000_000,
  /** after two incidents: stability first */
  secours: 450_000,
} as const;

/** pixels per CSS pixel for a stage of w × h CSS pixels on a screen of `device` pixel ratio */
export function stageDpr(w: number, h: number, device: number, budget: number): number {
  const area = Math.max(1, w * h);
  const fit = Math.sqrt(budget / area);
  // never above the screen itself (no gain) nor above 3; never below 1 unless the budget says so
  return Math.floor(Math.max(0.5, Math.min(device, 3, fit)) * 100) / 100;
}

export function budgetFor(q: 'haute' | 'basse', level: number): number {
  return level >= 2 ? PIXEL_BUDGET.secours : q === 'haute' ? PIXEL_BUDGET.haute : PIXEL_BUDGET.basse;
}

/** keeps the canvas's internal resolution on budget as the stage is resized or the quality changes */
export function StageResolution({ budget, onChange }: { budget: number; onChange?: (dpr: number, w: number, h: number) => void }) {
  const size = useThree((s) => s.size);
  const setDpr = useThree((s) => s.setDpr);
  useEffect(() => {
    const dpr = stageDpr(size.width, size.height, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, budget);
    setDpr(dpr);
    onChange?.(dpr, size.width, size.height);
  }, [size.width, size.height, budget, setDpr, onChange]);
  return null;
}
