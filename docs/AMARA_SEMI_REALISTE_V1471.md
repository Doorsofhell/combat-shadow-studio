# Amara — pilote semi-réaliste 1.47.1 (validation avant déploiement)

## Base immuable
- Base source: `claude/project-thread-o7lrt8` commit `f94f7677c6c5aec0f99dacc21724fc9bd1f01fe1` (`package.json` 1.47.0).
- Branche de travail: `feature/amara-semi-realiste-v1471`.
- Ne pas fusionner sur `main`, ne pas exécuter le workflow `preview.yml` pour cette branche: celui-ci publie sur l'environnement GitHub Pages de production.
- Ne pas annoncer 1.47.1 comme publiée tant que les vérifications et la validation visuelle ne sont pas terminées.

## Périmètre
- Amara uniquement: variation optique de peau dans `SKIN_LOOK['mma-amara']`.
- Géométrie, morphologie, visage, squelette, animations, masques du corps, modèles GLB et tenues inchangés.
- Les réglages textiles existants d'Amara sont conservés pour éviter une régression; toute amélioration supplémentaire nécessite des captures A/B réelles.

## Contrôles à exécuter
```bash
npm ci
npm run typecheck
npm run test -- src/three/__tests__/amara-semi-realiste-v1471.test.ts src/three/__tests__/amara-skin-v1378.test.ts src/three/__tests__/outfit-amara-finish-v1379.test.ts src/three/__tests__/amara-finish-v1380.test.ts
npm run build
```

## Livrables de validation (pas encore produits)
- Deux séries de captures **réelles** 1.47.0 / 1.47.1, même caméra, même lumière, même animation.
- Face, profil, dos et gros plan du visage; garde, jab, high kick, flexion.
- Sept tenues: boxe, kickboxing, muaythai, MMA, BJJ gi, BJJ no-gi, judo.
- Vérifier absence de sous-vêtement visible, de filet entre les jambes, de trous de peau, de clignotement de tissu.
- Mesurer fluidité et mémoire sur appareil Android; comparer à la 1.47.0.
- Prévisualisation isolée **non publiée sur GitHub Pages de production**.

## Validation
La validation doit être explicite. Ensuite seulement: préparation d'un profil partagé pour les autres coachs, sans écraser leurs carnations, identités, reliefs et vêtements spécifiques.
