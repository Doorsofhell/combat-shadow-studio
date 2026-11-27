---
name: publier-version
description: Publier une nouvelle version de Combat Shadow Studio (version, Nouveautés, journal, PR, fusion après « je valide », déploiement GitHub Pages vérifié, synchronisation de main). À utiliser pour toute livraison.
---

# Publier une version

Branche de production : `claude/project-thread-o7lrt8` (elle déploie GitHub Pages via `preview.yml`). `main` reçoit la même arborescence après chaque version validée et sert de base aux nouveaux fils.
Lien public de test : https://doorsofhell.github.io/combat-shadow-studio/

## 1. Avant de coder
1. `git fetch origin claude/project-thread-o7lrt8` et partir de son dernier commit (Youssef développe aussi avec ChatGPT). Vérifier sur cette version que le correctif est encore nécessaire. Lire `AGENTS.md`.
2. Créer un point de restauration : branche `restauration/avant-<sujet>-v<X.Y.Z>`, poussée.
3. Pour un défaut signalé, donner d'abord le constat vérifié (ce qui est observé, la cause), puis la méthode de correction.

## 2. Préparer la version
1. Prendre le prochain numéro libre **juste avant la fusion** (plusieurs fils publient en parallèle : regarder les PR ouvertes et `src/domain/releases.ts` sur o7lrt8).
2. `npm version X.Y.Z --no-git-tag-version` (met aussi à jour le lock), ajouter l'entrée en tête de `src/domain/releases.ts`, puis lancer `npm run docs:sync` (README.md et docs/ETAT.md).
3. Ajouter une entrée à la fin de `docs/JOURNAL_CORRECTIONS.md` : date, version, constat vérifié, correction, fichiers, tests étiquetés, restauration.
4. Lancer les tests : `npx vitest run`, `npm run build`, les specs Playwright touchées. La CI exécute le reste.
5. Pour un changement visuel, faire les captures réelles avant/après (skill `captures-avant-apres`).

## 3. PR et validation
1. Pousser la branche du fil et ouvrir la PR vers `claude/project-thread-o7lrt8`, sous le titre « Version X.Y.Z — … ».
2. **Ne jamais fusionner sans le « je valide » écrit de Youssef pour cette version.**
3. Après son accord : fusion squash. Si la base a avancé, fusionner (merge) plutôt que rebaser : le force-push est refusé.

## 4. Vérifier le déploiement
1. Suivre l'exécution de `preview.yml` sur o7lrt8 (elle réessaie seule après 2 puis 5 min).
2. Si l'erreur « No artifacts named github-pages » persiste, relancer avec un **nouveau** `workflow_dispatch` sur o7lrt8, jamais avec « re-run failed jobs ».
3. Vérifier la version en ligne : `https://doorsofhell.github.io/combat-shadow-studio/version.json?nocache=<n>` (WebFetch garde l'URL simple en cache ; curl vers github.io est bloqué).
4. Ne dire « publiée » qu'après cette vérification.

## 5. Synchroniser main
Mettre l'arborescence de `main` à l'identique de o7lrt8 par un push normal (jamais forcé). Si le classifieur bloque le push, demander l'accord explicite de Youssef pour cette version.

## 6. Message de livraison
Donner la version, le lien public de test, le lien exact de l'exécution du workflow, les tests étiquetés, et la branche de restauration. Distinguer prévu, codé, testé, capturé, fusionné et déployé.
