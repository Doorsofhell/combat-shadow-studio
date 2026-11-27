---
paths:
  - "src/domain/**"
  - "src/coach/**"
  - "scripts/build-catalog.mjs"
  - "scripts/build-programmes.mjs"
  - "scripts/catalog-legends.mjs"
---

# Contenu : techniques, exercices, catalogue

- Six disciplines : boxe anglaise, kick-boxing, MMA, muay-thaï, judo, JJB.
- Une technique commune à plusieurs disciplines reste **une seule définition** partagée. Les différences par discipline sont des ajouts, jamais des doublons.
- Le kick-boxing garde ses trois styles (K1, low kick, full contact) : `src/domain/kickboxingStyles.ts`, réglage `kickboxingStyle`.
- Les enchaînements et le contenu ajoutés viennent seulement de sources fédérales ou de coachs (FFBoxe, FFKMDA, IJF/Kodokan, IMMAF…), citées.
- Identifiants d'exercices figés : écrits en dur dans `src/domain/exercises.ts`, liste gelée par `exercise-ids-v2107.test.ts`. Un nouvel exercice prend le prochain numéro libre de son niveau. Un exercice retiré va dans `RETIRED_EXERCISE_IDS`. Changer une séquence = nouvel identifiant.
- Chaque version a son entrée en tête de `src/domain/releases.ts`, égale à `package.json` (sinon le build échoue).
- Les textes sont pour débutant : légers et pédagogiques.
