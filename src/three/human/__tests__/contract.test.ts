import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { ALL_COACHES } from '../../../domain/coaches/catalog';
import { faceCapabilities, glbNames } from '../capabilities';
import { DEFAULT_PROFILE, HUMAN_PROFILES, LEGACY_DEGRADED, humanProfileFor } from '../profiles';

/**
 * 1.34 contract of the characters (docs/HUMAN_CHARACTER_STANDARDS.md, Youssef 11/11: « Ajouter des tests vérifiant
 * que tout nouveau coach est enregistré dans le moteur commun et respecte le contrat de compatibilité »).
 *
 * BLOCKING for every new coach: it must be in the registry (src/three/human/profiles.ts) with contract 'complet',
 * and its model (public/coaches/<id>/photo.glb) must carry the 25 expressions, both eyes, the head and the neck.
 * Only the older models of LEGACY_DEGRADED may run the degraded face, and that list may not grow.
 */
const PUBLIC = resolve(__dirname, '../../../../public');
const caps = (id: string) => {
  const { bones, morphs } = glbNames(readFileSync(resolve(PUBLIC, `coaches/${id}/photo.glb`)));
  return faceCapabilities(bones, morphs);
};

describe('contrat des personnages 3D', () => {
  test('tous les coachs de l’app sont enregistrés dans le moteur commun', () => {
    for (const c of ALL_COACHES) expect(HUMAN_PROFILES[c.id], `${c.id} absent de src/three/human/profiles.ts`).toBeDefined();
  });

  test('tout dossier de coach avec un modèle photo est un coach enregistré (aucun personnage hors moteur)', () => {
    const dirs = readdirSync(resolve(PUBLIC, 'coaches'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(resolve(PUBLIC, 'coaches', d.name, 'photo.glb')))
      .map((d) => d.name);
    for (const d of dirs) expect(HUMAN_PROFILES[d], `${d} : modèle sans profil humain`).toBeDefined();
  });

  // 1.37: Axel and Kaila (MakeHuman, bones only) are removed: no coach may run the degraded face any more
  test('plus aucun modèle autorisé en mode dégradé : tous les coachs ont le contrat complet', () => {
    expect([...LEGACY_DEGRADED]).toEqual([]);
    for (const p of Object.values(HUMAN_PROFILES)) expect(p.contract, p.id).toBe('complet');
    for (const p of Object.values(HUMAN_PROFILES))
      if (p.contract !== 'complet') {
        expect(LEGACY_DEGRADED as readonly string[], `${p.id} : un nouveau coach doit respecter le contrat complet`).toContain(p.id);
        expect(p.degradedReason, `${p.id} : mode dégradé non documenté`).toBeTruthy();
      }
  });

  test.each(Object.values(HUMAN_PROFILES).map((p) => [p.id, p] as const))('%s : le modèle a les capacités de son contrat', (id, p) => {
    const c = caps(id);
    if (p.contract === 'complet') {
      expect(c.level, `${id} : manque ${c.missingExpressions.join(', ')}`).toBe('complet');
    } else {
      expect(['complet', 'os']).toContain(c.level);
    }
    // in every case: eyes that can aim, a head and a neck for the head's own life, a jaw or the expressions for the mouth
    expect(c.eyes && c.head && c.neck).toBe(true);
    expect(c.jaw || c.expressions.includes('JawOpen')).toBe(true);
    expect(c.lids || (c.expressions.includes('EyeBlinkLeft') && c.expressions.includes('EyeBlinkRight'))).toBe(true);
  });

  test('profils : réglages bornés, sans moteur à part', () => {
    for (const p of Object.values(HUMAN_PROFILES)) {
      expect(p.blinkRate).toBeGreaterThan(0.6);
      expect(p.blinkRate).toBeLessThan(1.5);
      for (const v of Object.values(p.traits)) {
        expect(v).toBeGreaterThan(0.5);
        expect(v).toBeLessThan(1.6);
      }
    }
  });

  test('un modèle inconnu reçoit automatiquement le profil standard', () => {
    expect(humanProfileFor('./coaches/nouveau/photo.glb')).toBe(DEFAULT_PROFILE);
    expect(humanProfileFor('./coaches/mma-kadir/photo.glb').id).toBe('mma-kadir');
    expect(humanProfileFor('nael').id).toBe('nael');
  });

  // 1.37: the generated models are no longer in the app; their skeletons, kept for the tests, still read as « aucun »
  test('un modèle sans visage (squelettes générés gardés pour les tests) est reconnu « aucun »', () => {
    for (const id of ['mma-kadir', 'mma-amara']) {
      const f = resolve(__dirname, '../../../../tests/fixtures/modeles-generes', `coaches/${id}/model.glb`);
      expect(existsSync(f), f).toBe(true);
      const { bones, morphs } = glbNames(readFileSync(f));
      expect(['aucun', 'minimal']).toContain(faceCapabilities(bones, morphs).level);
    }
  });
});
