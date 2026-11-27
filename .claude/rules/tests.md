---
paths:
  - "tests/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/__tests__/**"
  - "playwright*.config.ts"
  - "vitest.config.*"
  - ".github/workflows/ci.yml"
---

# Tests

- Commandes : `npx vitest run`, `npx playwright test --trace off` (Chromium : `CHROMIUM_PATH=/opt/pw-browsers/chromium`), `npm run build`. Résultats étiquetés TEST RÉUSSI / ÉCHOUÉ / NON EXÉCUTÉ / NON APPLICABLE.
- Ne jamais affaiblir, ignorer ou supprimer un test sans raison écrite au journal. Ne jamais dire qu'un test passe sans l'avoir lancé.
- La suite Playwright complète dure environ 1,2 à 3 h dans le cloud. Lancer d'abord les specs touchées, puis s'appuyer sur la CI (`ci.yml` : tsc, Vitest, build, Playwright en 4 parties) pour le reste.
- Dans `ci.yml`, le job e2e a `continue-on-error: true` (choix de Youssef du 27/11). Six tests échouent seulement sur GitHub, faute de GPU : panneau-coach:329, stabilite-3d-v1563:35, training-layout:117/:349, chrono-seul:119, consignes-v130:50. Un lot dédié doit les corriger, puis retirer cette ligne.
- Tests instables connus (passent seuls) : boot:98, coachs-v160:77, coaching-hud:60, coach-suggest:99/147, chrono-seul:68/96, seance-mains-libres:117/119, maj-modeles-v236:137, mastery:26.
- Pièges : changer `package.json` pendant Vitest donne 6 faux échecs de version-sync. Les tests réécrivent `docs/v250/MESURES_TORSION.md` et `docs/v1442/MESURES_SHORTS.md` : faire un `git checkout` de ces fichiers avant de commiter.
- Les données e2e utilisent des clés de stockage par utilisateur `u:<scope>:css-*` (invité : `local`). Remplir le profil, puis aller sur `about:blank` avant de naviguer.
- Playwright lit les fichiers de test au démarrage : une modification pendant un passage n'est pas prise en compte.
- Un nouveau coach est ajouté aux listes des tests de `src/three/human/__tests__/`.
