import { beforeEach, describe, expect, test } from 'vitest';
import { CALM_MS, _reloadStability, resetStability, stabilityLevel, stepDown, stepUp } from '../safe3d';
import { clearDiag, diagText, log3d, readDiag } from '../diag3d';
import { isGraphicsError } from '../webglProbe';

/**
 * v0.29 (coach that vanished on Youssef's phone): the quality goes down one step per graphics incident and
 * back up after a calm period, instead of the light quality kept for good; the journal keeps what happened.
 */
beforeEach(() => {
  localStorage.clear();
  _reloadStability();
});

describe('niveau de stabilité 3D', () => {
  test('un incident = une marche, deux au plus', () => {
    expect(stabilityLevel()).toBe(0);
    expect(stepDown()).toBe(1);
    expect(stepDown()).toBe(2);
    expect(stepDown()).toBe(2);
    _reloadStability();
    expect(stabilityLevel()).toBe(2); // kept across launches
  });

  test('remonte d’une marche après une période calme, pas avant', () => {
    stepDown();
    stepDown();
    const t = Date.now();
    expect(stepUp(t + CALM_MS / 2)).toBe(2);
    expect(stepUp(t + CALM_MS + 1)).toBe(1);
    // the calm period starts again for the next step
    expect(stepUp(t + CALM_MS + 2)).toBe(1);
    expect(stepUp(t + 2 * CALM_MS + 2)).toBe(0);
  });

  test('« Rétablir la qualité choisie » remet à zéro', () => {
    stepDown();
    resetStability();
    _reloadStability();
    expect(stabilityLevel()).toBe(0);
  });

  test('l’ancien indicateur définitif (proto2) devient un niveau qui remonte', () => {
    localStorage.setItem('css-3d-safe', '1');
    expect(stabilityLevel()).toBe(1);
    expect(localStorage.getItem('css-3d-safe')).toBeNull();
    expect(stepUp(Date.now() + CALM_MS + 1)).toBe(0);
  });
});

describe('journal 3D', () => {
  test('garde les 80 derniers évènements, lisibles en texte', () => {
    clearDiag();
    for (let i = 0; i < 100; i++) log3d('mesure', `n${i}`);
    log3d('contexte-perdu', 'qualité abaissée au niveau 1');
    const all = readDiag();
    expect(all.length).toBe(80);
    expect(all.at(-1)?.kind).toBe('contexte-perdu');
    expect(diagText()).toMatch(/contexte-perdu : qualité abaissée au niveau 1/);
  });

  test('distingue une erreur graphique d’une erreur de modèle ou de React', () => {
    expect(isGraphicsError(new Error('THREE.WebGLRenderer: Error creating WebGL context.'))).toBe(true);
    expect(isGraphicsError(new TypeError("Cannot read properties of null (reading 'precision')"))).toBe(true);
    expect(isGraphicsError(new Error('Could not load /coaches/mma-kadir/photo.glb: 404'))).toBe(false);
    expect(isGraphicsError(new TypeError("Cannot read properties of undefined (reading 'look')"))).toBe(false);
  });
});
