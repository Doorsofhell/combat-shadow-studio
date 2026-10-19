# Refonte des coachs : plan d'implémentation, migration et retour arrière

Branche de travail : `feature/coachs-champions`. Chaque lot a sa branche `restauration/lot-N` et sa version. Rien
n'est fusionné dans `feature/combat-shadow-v2` ni publié comme version principale sans l'accord de Youssef.

## Phases

| Phase | Contenu | Livré | Condition pour passer à la suite |
|---|---|---|---|
| 1 | Audit, plan, catalogue des 36 fiches, noms proposés | ce dossier | noms et principes juridiques validés par Youssef |
| 2 | Prototypes MMA : Kadir (réf. Khabib Nurmagomedov) et Amara (réf. Amanda Nunes) : recette de génération, GLB, coiffure, tenue, profil de garde, Encre et Ultra-réaliste, vues face, profil, dos, 3/4, planches | aperçu séparé | **accord explicite de Youssef sur la qualité** |
| 3 | Catalogue dans l'app, store `css-coaches`, galerie, fiche du coach (3D, vues, 360°, garde, démonstration), favoris par discipline, choix avant exercice ; ancien système encore présent | aperçu séparé | tests verts |
| 4 | Retrait de l'onglet Coach et du créateur de l'interface, nouveau premier lancement, « Mes coachs » dans les Réglages, liens vers l'historique du coach IA ; données anciennes conservées | aperçu séparé | tests verts, validation de Youssef |
| 5 | 34 autres coachs, par discipline (6 par lot), kimono avant judo et BJJ | un lot par discipline | validation de chaque discipline |
| 6 | Compression des modèles, mesures de mémoire et de chargement, tests complets, essai Android | rapport de non-régression | validation finale, puis fusion |

## Architecture

| Module | Fichier prévu | Contenu |
|---|---|---|
| CoachCatalog | `src/domain/coaches/catalog.ts` | 36 entrées : id stable (`mma-kadir`…), discipline, sexe, nom, surnom, style, spécialités, biographie fictive, garde naturelle. **Sans** le nom du champion de référence. |
| CoachAssets | `public/coaches/<id>/` | `model.glb` (compressé), `meta.json`, `portrait.webp` (rendu de notre modèle), `card.webp` |
| CoachLook | `src/domain/coaches/looks.ts` | tenue fixe de chaque coach, décrite avec le format `FighterLook` existant : l'habillage de v0.23.0 (drapé, ourlets, couches) est réutilisé |
| CoachMotionProfile | `src/domain/coaches/motion.ts` | écarts bornés sur la garde de la discipline (hauteur des mains, flexion, écartement, rotation du bassin, talons), rythme du rebond, techniques favorites pour les suggestions. Bornes vérifiées par les tests de chevilles, d'équilibre et de chaîne cinétique. |
| CoachSelectionStore | `src/store/coaches.ts` (clé `css-coaches`, par compte) | `favorites: Partial<Record<DisciplineId, CoachId>>`, `version`, sélection ponctuelle de la séance en mémoire seulement |
| LegacyFighterAdapter | `src/domain/coaches/legacy.ts` | lit `css-fighters` et `profile.coach` ; fournit un coach de secours tant qu'aucun favori n'existe |

Les 36 modèles partagent le squelette Mixamo actuel : `rig.ts`, `motion.ts` et les techniques restent les mêmes.
Un seul modèle est chargé à la fois, libéré quand on change de coach.

## Migration des données

- Nouvelle clé `css-coaches` avec `version: 1`. La clé `css-fighters` n'est jamais modifiée ni effacée.
- Au premier lancement de la nouvelle version :
  - un utilisateur existant garde son compte, ses préférences, son historique, sa progression, ses statistiques et
    ses programmes ; aucun nouveau profil n'est demandé ;
  - il choisit un coach la première fois qu'il ouvre une discipline sans favori. Proposition par défaut : un coach
    du même sexe que son ancien combattant, présélectionné, à confirmer d'un geste ;
- migration idempotente : la relancer ne change rien ; testée sur des sauvegardes de v0.4 à v0.23.
- Export des données : contient toujours les anciens combattants, plus les favoris.
- « Tout effacer » efface aussi les favoris.

## Retour arrière

1. Dans l'application : l'ancien affichage reste dans le code jusqu'à la validation finale (réglage caché de
   secours). Les anciens combattants sont toujours dans `css-fighters`.
2. Dans le code : `git checkout restauration/avant-champions` (v0.23.0) ou la branche `restauration/lot-N` du lot
   voulu ; republier l'application depuis cette branche.
3. Données : comme `css-fighters` n'est jamais touché, une version précédente relit les combattants telle quelle ;
   la clé `css-coaches` est simplement ignorée par les anciennes versions.

## Tests prévus

- Unitaires : catalogue (36 entrées, 6 par discipline, 3 hommes et 3 femmes, ids uniques, noms distincts, aucun nom
  de champion réel dans les données de l'app), migration (anciennes sauvegardes, idempotence, données conservées),
  profils de garde (chevilles, équilibre, chaîne cinétique pour chaque coach), chargement de chaque modèle (os,
  proportions, matériaux).
- Bout en bout : premier lancement, galerie, favoris par discipline, changement avant exercice sans changer le
  favori, « Définir comme favori », Réglages > Mes coachs, historique du coach IA accessible, navigation sans onglet
  Coach, contraste des nouveaux écrans, séance complète avec chaque rendu.
- Visuel : planches face, profil, dos, 3/4 et gros plans pour chaque coach, Encre et Ultra-réaliste.
- Performances : poids de chaque modèle, mémoire après 10 changements de coach, temps de chargement.
