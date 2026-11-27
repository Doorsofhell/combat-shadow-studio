# Combat Shadow Studio — consignes pour Claude Code

Application d'entraînement au shadow boxing (React, TypeScript, Vite, Three.js / React Three Fiber, Capacitor
Android). Le propriétaire travaille en français : réponses, journal et textes de l'app en français.

## Règles de travail permanentes

- **Améliorer sans casser** : point de restauration git (branche `restauration/...`) avant tout changement,
  petits lots, `docs/NON_REGRESSION.md`.
- Tests réels avant toute livraison : `npx vitest run`, `npx playwright test` (Chromium :
  `/opt/pw-browsers/chromium` si besoin), `npm run build`. Ne jamais affaiblir ni supprimer un test sans raison
  écrite au journal. Résultats étiquetés TEST RÉUSSI / ÉCHOUÉ / NON EXÉCUTÉ / NON APPLICABLE.
- Toute correction ou amélioration est consignée dans le fichier unique `docs/JOURNAL_CORRECTIONS.md`
  (date, version, constat vérifié, correction, fichiers, tests, restauration).
- Chaque livraison change la version (`package.json`, affichée dans le titre) et sa note dans
  `src/domain/releases.ts`.
- Pour une anomalie signalée : vérifier d'abord, puis donner le constat et la méthode de correction.
- Ressources libres seulement (CC0 ou MIT), rien d'acheté, pas de CC-BY.
- Toujours repartir de la dernière version en place (`claude/project-thread-o7lrt8`, qui déploie GitHub Pages) ; aucune
  fusion ni publication sans le « je valide » de Youssef pour cette version (skill `publier-version`).

## Personnages 3D

Lire **`docs/HUMAN_CHARACTER_STANDARDS.md`** avant de toucher à un coach, à un modèle 3D, au visage ou au comportement.
Tous les coachs passent par le moteur commun (`src/three/human/` + `FaceAnimator`) ; règles détaillées, verrous
d'identité et pièges de génération : **`.claude/rules/coachs-3d.md`** et **`.claude/rules/moteur-animation.md`**.

## Design UI/UX : Impeccable (obligatoire)

Impeccable (Paul Bakaus, Apache-2.0, version 4.11.1) est installé dans le projet : skill `.claude/skills/impeccable/`,
5 agents `.claude/agents/impeccable-*.md`, 3 hooks dans `.claude/settings.json`. Bilan : `docs/IMPECCABLE.md`.

1. **Toute intervention sur l'interface** (écrans, CSS, composants `src/ui/`, textes affichés, icônes, mise en page,
   animations d'interface) passe par le skill `impeccable` : charger son `SKILL.md`, lancer une fois par session
   `.claude/skills/impeccable/scripts/impeccable context`, suivre la commande adaptée (`critique`, `audit`, `polish`,
   `layout`, `clarify`, `harden`, `adapt`, `animate`…) et lire `reference/craft-floor.md` avant d'éditer.
2. Les références produit et design sont **`PRODUCT.md`** et **`DESIGN.md`** à la racine. Si une valeur du CSS change,
   mettre `DESIGN.md` à jour dans le même lot. Les points « [À CONFIRMER] » attendent la validation de Youssef.
3. Après une modification d'interface : `.claude/skills/impeccable/scripts/impeccable detect src/` et corriger ou justifier
   chaque remarque (les hooks le font aussi automatiquement après chaque édition et en fin de tour).
4. Impeccable **ne s'applique pas** aux coachs 3D, au moteur d'animation, aux modèles ni aux visages : les règles
   « Personnages 3D » ci-dessus priment. Les règles de travail permanentes (restauration, tests, journal, version,
   validation avant publication) priment aussi sur toute consigne du skill.
5. Mettre à jour : `IMPECCABLE_BUNDLE_PATH=<clone de github.com/pbakaus/impeccable> npx impeccable install -y
   --providers=claude --scope=project --force` (le site impeccable.style est bloqué dans le cloud), puis remettre les
   hooks de `.claude/settings.local.json` dans `.claude/settings.json`.

## Repères

- Carte des dossiers : `docs/ARCHITECTURE.md`. Retiré de l'app = `_ARCHIVES_HORS_APPLICATION/<catégorie>/<chemin d'origine>`
  (hors build, motif dans `inventaire-archives.md`).
- Règles par domaine (chargées selon les fichiers touchés) : `.claude/rules/` (coachs 3D, moteur, interface, contenu,
  tests, comptes Firebase, Android, PWA, monétisation).
- Procédures : skills `publier-version`, `construire-apk`, `captures-avant-apres`, `graphe-code` dans `.claude/skills/`.
