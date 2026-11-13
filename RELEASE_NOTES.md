# Notes de version — Combat Shadow Studio

## 1.42.0 — Humanisation faciale (première étape)

### Nouveautés
- Animation procédurale légère des expressions du visage sur les modèles compatibles.
- Clignements à intervalles variables, avec une durée légèrement différente à chaque occurrence.
- Micro-expressions discrètes des sourcils et de la bouche.
- Variations de comportement facial selon le coach.

### Compatibilité et limites
- Les animations utilisent les morph targets faciaux nommés dans les modèles 3D. Sans morph targets compatibles, aucun effet facial n'est visible.
- Les maillages, les poses de repos et les tenues ne sont pas modifiés par ce contrôleur.
- Les expressions liées à l'intensité de l'effort et la validation visuelle de chaque coach restent à effectuer.

### Déploiement
- Workflow GitHub Pages sur la branche main.
- Numéro de version de l'application mis à jour à 1.42.0.
- Notes visibles dans Réglages > Nouveautés — version 1.42.
