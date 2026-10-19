# Refonte des coachs : audit du dépôt (36 champions)

Date : 2026-10-19. Branche : `feature/coachs-champions`, créée depuis `feature/combat-shadow-v2` (v0.23.0, commit
49daa71). Point de restauration : `restauration/avant-champions`.

Ce rapport décrit le code tel qu'il est aujourd'hui. Rien n'a encore été modifié dans l'application.

## 1. Écrans et routes concernés

| Élément | Fichier | Rôle actuel | Devenir |
|---|---|---|---|
| Onglet « Coach » de la barre du bas | `src/ui/App.tsx` (`NAV`) | ouvre `/combattant`, actif aussi sur `/coach` et `/coach-ia` | supprimé |
| `/combattant` (studio du coach) | `src/ui/screens/CoachStudio.tsx`, `src/ui/screens/coach/*` | créateur : corps, visage, cheveux, peau, tenue, équipements, tatouages, génération aléatoire, duplication, plusieurs combattants, vues Face/Profil/Dos/3/4/Visage, 360°, aperçu des animations, choix du rendu | retiré de l'interface ; l'aperçu 3D (vues, 360°, zooms, animation) est réutilisé dans la fiche du coach |
| `/coach` (choix homme / femme) | `src/ui/screens/CoachSelect.tsx` | choix au premier lancement, accès depuis les Réglages | remplacé par la galerie |
| Garde-fou du premier lancement | `src/ui/App.tsx` l. 139-141 | sans coach choisi, renvoie vers `/coach?first=1` | renvoie vers le choix du coach de la discipline |
| Parcours d'accueil | `src/ui/screens/Onboarding.tsx` | 8 étapes : Bienvenue, Coach, **Apparence** (nom + retouches du combattant), Garde, Discipline, Niveau, Objectifs, C'est parti | Apparence remplacée par la galerie de la discipline choisie |
| Réglages | `src/ui/screens/Settings.tsx` l. 92-93 | liens « Personnaliser ton combattant » et « Coach » | rubrique « Mes coachs » |
| Profil | `src/ui/screens/account/Profile.tsx` l. 272 | lien « Personnaliser mon combattant » | lien « Mes coachs » |
| Accueil | `src/ui/screens/Home.tsx` l. 92 et 132 | bouton profil et puce « Personnaliser » vers `/combattant` ; nom du combattant | coach favori de la discipline affichée, lien vers « Mes coachs » |
| Entraînement | `src/ui/screens/Training.tsx` l. 653-656 | options : Coach homme / Coach femme | « Changer de coach » (6 coachs de la discipline), « Définir comme favori » |
| Historique du coach IA | `/coach-ia`, `src/ui/screens/CoachHistory.tsx` | rattaché à l'onglet Coach | **doit rester accessible** : lien depuis l'Accueil et les Réglages |
| Vignettes des techniques | `src/ui/components/TechThumb.tsx`, `public/thumbs/{homme,femme}` | image selon le sexe du coach | inchangé au début (homme / femme), vignettes par coach plus tard si validé |
| Bibliothèque | `src/ui/screens/Library.tsx` l. 233-280 | coach de l'aperçu selon le combattant | coach favori de la discipline |
| Scène 3D | `src/three/CoachStage.tsx` | lit le combattant actif (`useActiveFighter`) | lit le coach de la séance |
| Laboratoire de captures | `src/ui/Lab.tsx` | paramètres `coach`, `look`, `top`, `bottom`… | ajout d'un paramètre `champion` |

## 2. Stockage

- `src/store/fighters.ts` : clé `css-fighters` (par compte, `u:<scope>:css-fighters`), liste de combattants
  `{ id, name, look, createdAt, updatedAt }` et `activeId`. Lecture tolérante (`normalizeLook`) des anciennes versions.
- Utilisé aussi par : `src/account/scope.ts` (changement de compte), `src/account/sync/collections.ts`
  (synchronisation, désactivée par défaut), `src/account/export.ts` (export des données), « Tout effacer » des Réglages.
- `src/store/profile.ts` : `profile.coach` = `'homme' | 'femme' | null`, utilisé par les anciens écrans et les vignettes.
- `src/store/settings.ts` : seul store avec une migration versionnée (`version: 1`).
- Conséquence : les combattants personnalisés existants doivent rester lisibles, exportables et restaurables. Le
  nouveau choix des coachs va dans un **nouveau store** (`css-coaches`) ; `css-fighters` n'est ni modifié ni effacé.

## 3. Modèles 3D et générateur

- 4 GLB dans `public/models` (homme, femme ; variantes `_manga` utilisées par le rendu actuel), 4,2 à 4,6 Mo
  chacun, non compressés (le module `bpy` de pip n'a pas Draco).
- Générateur `tools/generator/build.py` : Blender 5.2 (module Python) + MPFB2. Disponibles dans ce conteneur :
  Blender 5.2.2 et MPFB2 avec **1 258 cibles morphologiques** (CC0) : macros (sexe, âge, muscle, poids, taille,
  proportions, origine), torse, bras, jambes, mains, pieds, cou, tête, **nez, menton, joues, front, bouche, oreilles,
  yeux, sourcils, expressions**. Chaque coach peut donc avoir un corps et un visage réellement différents.
- Pas disponibles : packs de cheveux, de vêtements et de peaux MakeHuman (serveurs bloqués par le réseau). Cheveux
  et vêtements doivent être produits par nos scripts (géométrie procédurale) ou par le système d'habillage de
  l'application (`src/three/customize.ts` : shorts, hauts, protections, drapé et ourlets de v0.23.0).
- Squelette : Mixamo de MPFB, 52 os, identique pour tous. Les animations mesurent les os au chargement : un corps
  plus grand ou plus trapu garde les mêmes animations, recalées sur ses proportions.
- Rendu : Encre (cel-shading) et Ultra-réaliste (PBR) sur le même modèle depuis v0.23.0, ancien rendu en secours.

## 4. Animations

- Poses clés biomécaniques résolues par notre IK (`src/engine/rig.ts`, `motion.ts`), pas de clips.
- La garde de chaque discipline est un jeu de 19 paramètres (`STANCES` dans `src/engine/author.ts` : flexion des
  genoux, rotation du bassin, hauteur des mains, écartement et orientation des pieds, talons). Un profil par coach
  peut donc ajuster la garde, sans écrire de nouvelles techniques.
- Contrôles déjà en place : chevilles (`ankle-range.test`), équilibre (`balance.ts`), fluidité (`fluidity.ts`),
  chaîne cinétique et phases (`audit.ts`, `phases.ts`). Défauts connus : six techniques au sol hors amplitude de
  cheville (lot A), aucune validation sur vrai téléphone.
- Garde inversée (gaucher) : réglage de l'utilisateur, appliqué au coach en miroir. Un coach gaucher dans la
  réalité ne force pas la garde de l'utilisateur ; sa garde naturelle est affichée sur sa fiche.

## 5. Tests existants touchés

| Test | Ce qu'il vérifie | Devenir |
|---|---|---|
| `tests/e2e/coach-studio.spec.ts` | curseurs, couleurs, enregistrement du créateur, ancien enregistrement | les parties « créateur » sont retirées avec la fonction (décision de Youssef du 2026-10-19), remplacées par des tests de migration ; le test « ancien enregistrement s'ouvre sans erreur » est conservé |
| `tests/e2e/coach-render.spec.ts` | choix du rendu dans 3 écrans, cadrage du studio | le studio devient la fiche du coach : mêmes vérifications sur la fiche |
| `tests/e2e/app.spec.ts`, `contrast.spec.ts` | navigation (5 onglets), contraste sur 17 écrans | navigation à 4 onglets, nouveaux écrans ajoutés au contraste |
| `coach-suggest.spec.ts`, `training-layout.spec.ts` | coach IA, options d'entraînement | choix du coach avant exercice ajouté |
| tests unitaires `src/editor/__tests__`, `customize.test` | normalisation des looks, génération aléatoire | conservés : les anciens combattants doivent rester lisibles |

## 6. Risques

| Risque | Gravité | Mesure |
|---|---|---|
| Perte des combattants personnalisés | bloquant | `css-fighters` jamais effacé ; migration idempotente testée ; export inchangé |
| Historique du coach IA introuvable après suppression de l'onglet | bloquant | liens Accueil et Réglages, test de navigation |
| 36 modèles trop lourds pour Android (≈ 160 Mo non compressés) | élevé | un seul modèle chargé, compression meshopt + textures WebP/KTX2 à mesurer, libération à la sortie |
| Qualité visuelle sous l'attente « premium » | élevé | prototypes MMA d'abord, validation avant les 34 autres |
| Droit à l'image, au nom et à la personnalité | élevé (juridique) | voir section 7 |
| Kimono judo et BJJ inexistant | moyen | à modéliser (veste, pantalon, ceinture) avant les coachs de ces disciplines |
| Cheveux (pas de bibliothèque) | moyen | coiffures modélisées par script, une par coach |
| Profils de garde qui dégradent une technique | moyen | les tests de chevilles, d'équilibre et de chaîne cinétique passent pour chaque profil |

## 7. Point juridique

Un personnage clairement reconnaissable, avec un nom et un surnom proches de ceux d'un champion, peut relever du droit
à l'image, au nom ou à la personnalité, même avec un visage modifié, surtout dans une application commerciale.
Recommandations, à valider par un juriste avant toute diffusion commerciale :

- le nom du champion de référence reste dans les documents de conception et **n'apparaît pas dans l'application** ;
- noms et surnoms fictifs volontairement éloignés de l'original (pas une lettre changée) ;
- aucun tatouage, cicatrice, logo, sponsor ou couleur de tenue distinctive reproduits ;
- visage original : seules la catégorie morphologique et l'expression sont évoquées.

## 8. Ce qui est faisable dans cet environnement, et la limite

- Faisable : catalogue, galerie, favoris, sélection avant exercice, migration, suppression du menu Coach, profils de
  garde par coach, et 36 modèles 3D distincts produits par le générateur (corps, visage, coiffure, tenue).
- Limite : le générateur part d'une base MakeHuman. Les visages et les muscles sont modelés par des cibles et une
  carte de relief, pas sculptés à la main. Le résultat sera net, varié et crédible, mais pas au niveau d'un jeu AAA
  ou d'un modèle sculpté par un artiste. Pour atteindre ce niveau, le pipeline réaliste est : sculpture (Blender ou
  ZBrush) par un artiste 3D, retopologie, export sur notre squelette Mixamo, puis le même import GLB. Cela a un coût
  et demande ton accord avant toute dépense.
