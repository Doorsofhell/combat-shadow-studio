# Combat Shadow Studio — consignes permanentes pour les assistants et contributeurs

> Ces règles sont obligatoires pour toute intervention sur le dépôt. Version stable de référence au moment de leur rédaction : **1.53.0**. La référence effective pour chaque intervention est toujours le dernier déploiement **vérifié** et approuvé.

## Objectif produit et direction artistique

- Viser un rendu de jeu de combat premium, comparable par le soin des volumes, de l'éclairage, des expressions et des animations à **Street Fighter 6**, sans copier ses personnages, assets ou autres éléments protégés.
- Favoriser une anatomie athlétique crédible, des volumes musculaires lisibles, une peau naturelle, des tenues propres et des animations biomécaniquement cohérentes.
- Préserver l'identité des cinq coachs **Kadir, Amara, Naël, Inaya et Victor** et les six disciplines **boxe anglaise, kick-boxing, MMA, muay-thaï, judo et JJB**.
- Être **force de proposition** : diagnostiquer les limites, proposer des améliorations visuelles utiles, prioriser selon l'impact, le risque, la performance et la faisabilité. Éviter les modifications cosmétiques sans gain démontré.

## Règle absolue : ne pas régresser

- Une compilation réussie **ne garantit pas** l'absence de régression visuelle ou fonctionnelle. Ne jamais affirmer « zéro régression » sans preuve ; signaler les limites des contrôles.
- Avant de modifier : inspecter le code réellement publié, les workflows, le rig, les dépendances, les risques, et définir les invariants protégés (visage, morphologie, textures sources, UV, skinning, animations, tenues, ergonomie).
- Modifier le périmètre minimal. Ne jamais réutiliser sans diagnostic un ancien correctif abandonné. **Le chantier cou/nuque 1.52.0 est explicitement abandonné.**
- Réaliser les expériences dans une **branche séparée** créée depuis la dernière version stable vérifiée ; ne pas travailler directement sur la branche de production pour les expériences.
- Contrôler systématiquement les erreurs WebGL, shaders, textures, meshes, animations, collisions, performances Android et cohérence du niveau de qualité quand cela est pertinent.
- Toute anomalie majeure ou régression visuelle bloque la fusion ou la publication ; revenir au rendu de référence.

## Tests et comparaisons obligatoires

1. **Compilation TypeScript/Vite** et tests existants pertinents : `npm run build`, `npm run test -- ...`, plus les tests de contrôle du moteur et des tenues sur les changements qui les affectent.
2. **Tests automatisés d'intégrité** : modèles GLB, matériaux, visages, coutures, tenues par discipline, poses, déplacements des pieds, traversées des membres, qualité haute/basse et compatibilité mobile selon le périmètre.
3. **Captures réellement produites par Three.js/WebGL** (pas des illustrations générées), en **avant/après côte à côte** et avec strictement les mêmes personnage, tenue, animation/pose, angle caméra, focale, cadrage, zoom, résolution et environnement. Seule la variable évaluée change.
4. Priorité aux vues **face, trois quarts, profil**, et **dos** lorsqu'il s'agit des coutures, du cou ou des vêtements. Élargir aux **cinq coachs**, aux **six disciplines** et aux principales postures quand un changement est transversal.
5. **Manifest des résultats** avec version/commit de référence, version candidate, réglages de capture, erreurs, résultats et liens vers les PNG. Les tests doivent échouer si un rendu requis manque, si l'avatar ne charge pas ou si WebGL renvoie une erreur.
6. Vérifier manuellement les écarts : l'absence d'erreur technique ne démontre pas une amélioration esthétique. Ne pas masquer les régressions sous une moyenne globale ; signaler explicitement les compromis.

## Livraison et publication

- Procéder dans l'ordre : **audit → proposition argumentée → implémentation isolée → tests → comparatifs réels → validation → publication → contrôle de déploiement**.
- L'utilisateur doit pouvoir consulter les images **avant/après** et le workflow GitHub, avec des liens directs et vérifiés.
- **Ne pas fusionner ni publier une expérimentation sans validation explicite** de l'utilisateur pour la version concernée ; une demande ultérieure explicite de publication autorise la publication, sous réserve des contrôles.
- Mettre à jour le **numéro de version**, les **Nouveautés** et les notes techniques lors d'une sortie effective. Ne pas présenter une simple PR fusionnée comme « publiée » : attendre la confirmation du workflow GitHub Pages.
- Après chaque publication, fournir l'URL de l'application et le lien exact du workflow de déploiement ; vérifier la version réellement exposée.
- Préserver un chemin simple de **rollback** vers la dernière version approuvée.

## Communication et transparence

- Toujours distinguer **prévu**, **codé**, **testé**, **capturé**, **fusionné** et **déployé**.
- Ne jamais inventer de captures, résultats de tests, gains quantifiés, état GitHub ou confirmation de déploiement.
- Signaler les changements qui ne produisent **aucune différence visuelle mesurable**, les échecs et les compromis, sans les qualifier d'amélioration.
- Prendre l'initiative de chercher la cause et de proposer la prochaine étape lorsque les résultats sont insuffisants, sans multiplier les expérimentations risquées sur la production.

Ces consignes s'appliquent à toute nouvelle version et aux interventions de ChatGPT, Claude, Copilot et autres contributeurs.
