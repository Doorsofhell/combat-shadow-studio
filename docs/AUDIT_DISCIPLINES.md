# Audit : disciplines, illustrations, BJJ et judo (2026-10-18)

Audit fait avant toute modification. Point de restauration : branche `restauration/lot-4g` (commit 08c08dc).

## 1. Illustrations des disciplines aujourd'hui

| Ressource | Contenu | Provenance et licence |
|---|---|---|
| `public/disciplines/{boxe,kickboxing,mma,muaythai}.jpg` | 600x760, rendus de nos propres coachs 3D sur fond sombre | Créés pour l'application, aucune ressource tierce |

Où ces illustrations apparaissent :

| Écran | Discipline affichée | Image ? |
|---|---|---|
| Entraîner (`Train.tsx`) | 4 grandes cartes | Oui (`DisciplineCard`) |
| Bienvenue (`Onboarding.tsx`) | Choix de la discipline principale | Oui (`DisciplineCard`) |
| Page discipline (`Discipline.tsx`) | Bandeau | Oui, chemin repris directement (`DISCIPLINE_IMG`) |
| Accueil (`Home.tsx`) | Discipline principale, dernière séance, favoris | Non, texte seul |
| Techniques (`Library.tsx`) | Onglets Boxe / Kick / MMA / Muay | Non, texte seul |
| Créateur d'enchaînements (`Builder.tsx`) | Onglets | Non, texte seul |
| Légendes (`Champions.tsx`) | Filtre par discipline, pas de premier niveau par discipline | Non |
| Programmes (`Programs.tsx`) | Nom de la discipline | Non |
| Progrès et historique (`Stats.tsx`) | « Par discipline », lignes d'historique | Non |
| Profil (`Profile.tsx`), personnage (`coach/panels.tsx`) | Listes de niveaux | Non |

Constats :
- il n'existe qu'une seule image par discipline, mais elle n'est utilisée que sur 3 écrans ; les autres affichent du texte ;
- le chemin des images est déclaré dans `Cards.tsx` et réutilisé directement dans `Discipline.tsx` : il n'y a pas
  encore de référentiel central ni de composant dédié ;
- qualité : les rendus actuels ne correspondent pas à la direction demandée (pas de gants, pose du kick-boxing
  peu lisible, le MMA ressemble à une garde de boxe, aucun partenaire pour le grappling).

## 2. Ce que l'environnement permet pour les illustrations

- Ici, il n'y a pas d'outil de génération d'images ni d'illustrateur. Je peux produire des **rendus de nos propres
  coachs 3D** : poses dynamiques, deux personnages, éclairage travaillé, fond anthracite avec des touches de rouge et
  d'or, haute définition, WebP. Ces rendus sont originaux et sans risque de droits, mais leur style reste celui de
  nos modèles 3D : ce n'est pas le niveau d'une illustration dessinée par un artiste.
- Les banques d'images libres (CC0) n'offrent pas de série homogène de 6 illustrations de combat dans un même style
  anime premium. Je n'en intégrerai aucune sans licence commerciale vérifiée et documentée.
- Une vraie collection premium demande un illustrateur (commande avec cession des droits) ou un outil de génération
  dont les conditions autorisent l'usage commercial, utilisé par l'éditeur. Le référentiel central permettra de
  remplacer les images sans toucher aux écrans.

## 3. BJJ et judo : ce qui existe et ce qui manque

- Le type `DisciplineId` ne compte que 4 disciplines, et 9 fichiers en dépendent (exercices, profil, caméra,
  transitions, catalogue, coach IA, scène 3D).
- Le moteur d'animation (`src/engine`) anime **un seul personnage** par cinématique inverse. Il gère déjà
  le travail au sol en solo pour le MMA (sprawl, relevé technique, sortie de hanche, descente au sol).
- **Réalisable en solo avec le moteur actuel** :
  - BJJ : postures au sol, shrimp, bridge, relevé technique, changements de base, rétention de garde en solo ;
  - judo : shizen-tai, déplacements (ayumi-ashi, tsugi-ashi), tai-sabaki, uchikomi en solo sans partenaire
    (entrée et placement uniquement).
- **À construire** : un moteur à deux personnages synchronisés avec contacts, pour les projections, passages de garde
  et contrôles. C'est un chantier à part entière. Aucune projection ne sera simulée par une simple rotation.
- **Chutes (ukemi)** : uniquement expliquées, jamais proposées comme exercice à la maison sur un sol non adapté.
- **Soumissions** : principes et sécurité seulement, sans entraînement solo de soumission.
- **Légendes BJJ et judo** : chaque fiche demande des sources vérifiées (palmarès). Aucun portrait sans droits
  vérifiés, et aucune ressemblance 3D.

## 4. Plan par lots (publication de la v0.13.0 en dernier)

1. Référentiel central `disciplineArt` et composant `DisciplineArtwork`, utilisés sur tous les écrans de la liste,
   avec un test qui interdit tout chemin d'image de discipline en dehors du référentiel.
2. Nouveaux rendus 3D (poses dynamiques, gants, deux personnages pour le grappling, palette demandée), soumis à
   validation avant de remplacer les images actuelles.
3. Modèle de données étendu à 6 disciplines, et BJJ et judo dans les menus, avec un mode par technique
   (Solo, Démonstration à deux, Partenaire réel requis).
4. Parcours pédagogiques BJJ et judo sur 4 niveaux, avec uniquement des exercices solo réellement réalisables et
   animés.
5. Plus tard, en lots séparés : moteur à deux personnages et démonstrations avec partenaire, séquences de grappling,
   légendes BJJ et judo sourcées.
