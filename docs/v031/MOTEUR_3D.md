# v0.31 · Correction majeure du moteur 3D

Demande de Youssef du 2026-10-22 à 06:24, « CORRECTION MAJEURE DU MOTEUR 3D ». Complément à 06:26 :
« TENUES ET ACCESSOIRES 3D PREMIUM PAR DISCIPLINE ».

- Branche : `feature/moteur-3d-v031`, créée depuis `feature/combat-shadow-v030` (`16a41f2`).
- Rien n'est fusionné ni déployé sans son accord.
- Statuts utilisés : RÉUSSI, ÉCHOUÉ, NON EXÉCUTÉ, NON APPLICABLE.

## 1. Audit (constats vérifiés)

| Sujet | Constat | Mesure |
|---|---|---|
| Flou et halo | La résolution du canvas était plafonnée à 1,5 pixel par point, quelle que soit la taille de l'écran. Au niveau 1 de secours : 1 px/pt sans anticrénelage (MSAA). Au niveau 2 : 0,75 px/pt. | Pixel 7 émulé (densité 2,625) : 57 % de la résolution native en mode auto |
| Textures | Pas de filtrage anisotrope sur la peau. Les bords des cheveux en alpha scintillaient. | Vérifié à l'œil sur les captures zoomées |
| Morphologie | Le dos des bras, les ischios, les obliques et l'avant-bras étaient trop plats. Le reste était déjà correct depuis la v0.29-proto4. | Captures face, profil et dos (`captures/morphologie.jpg`) |
| Jab | Le coude se verrouillait à 2° de flexion à l'impact. | Test `prototypes-v031` |
| Direct | Le poing atteignait sa vitesse maximale avant la rotation du bassin (chaîne inversée). | Pic du poing à 73 ms, impact à 170 ms |
| Low kick | Le pied frôlait le sol sur 38 à 42 cm au départ et à l'arrivée. | Trajectoire de l'orteil mesurée |
| Crochet avant, teep | Déjà corrigés dans la v0.29-proto4 (lot 1 de biomécanique). | Tests `muaythai-biomeca` |
| Tenues | Une seule tenue générique (short) pour toutes les disciplines. | Inventaire des GLB |

**Vidéos de référence (style BetterMe)** : les 4 vidéos YouTube n'ont **pas** été visionnées. YouTube est bloqué
depuis l'environnement de travail. Aucune donnée de ces vidéos n'a été utilisée. Les animations reposent sur les
sources écrites du lot 1 (`docs/v029/BIOMECA_LOT1.md`) et sur les mesures du moteur. Des captures d'écran
(4 à 6 par mouvement) ont été demandées à Youssef.

## 2. Netteté (commit `9aa2cc6`)

- La résolution suit maintenant un **budget de pixels** et non plus un plafond fixe :
  - haute : 2,4 Mpx ;
  - basse : 1,0 Mpx ;
  - secours : 0,45 Mpx.
- La valeur est plafonnée à la densité de l'écran (et à 3).
- L'anticrénelage MSAA reste actif à tous les niveaux.
- Les corrections de stabilité WebGL (reprise après perte du contexte GPU) ne sont pas modifiées.
- Il n'y a pas de filtre d'accentuation global.
- Code : `src/three/resolution.ts`. Tests : `src/three/__tests__/resolution.test.ts`.

| Cas (Pixel 7 émulé) | Avant | Après |
|---|---|---|
| Auto, scène d'accueil | 1,5 px/pt | 2,62 (natif) |
| Niveau 1 (secours) | 1 px/pt, sans MSAA | 2,19 à 2,45, MSAA |
| Niveau 2 | 0,75 | 1,47 |
| Fiche technique, auto | | 995×1143 px, 2,618, MSAA 4 échantillons |

- Filtrage anisotrope ×4 sur les textures de peau.
- Alpha-to-coverage sur les mèches de cheveux.
- Comparaison contrôlée, même cadrage et même pose : `captures/nettete.jpg`.
  - Colonnes : avant, après en qualité basse, après en qualité haute.
  - En bas : zoom ×4 sur l'épaule.

## 3. Morphologie athlétique (commit `a90c8ab`)

- Les volumes sont ajoutés **par région anatomique**, le long des normales du corps, avec des profils suivant l'axe
  des os. Ce n'est pas une mise à l'échelle.
- Muscles retouchés :
  - triceps, pic du biceps, extenseurs de l'avant-bras ;
  - partie basse des ischios, vaste interne, côtés du mollet ;
  - obliques, dentelé, grand droit, trapèze inférieur.
- Le squelette, les poids de peau, les visages, les cheveux et les poils ne changent pas.
- Décalage maximal :
  - Kadir : 33 mm (environ 28 avant) ;
  - Amara : 21 mm (18 avant).
- Le niveau reste celui d'un athlète, pas d'un culturiste.
- Captures : `captures/morphologie.jpg`. Lignes 1 et 3 : avant. Lignes 2 et 4 : après.

## 4. Animations prototypes (commit `8dc8d33`)

Méthode choisie par Youssef (06:33) : « Moteur amélioré ». Les animations sont refaites dans le moteur
procédural, sans capture de mouvement externe.

| Technique | Avant | Après |
|---|---|---|
| Jab | coude verrouillé à 2° | Kadir 29°, Amara 22° (bras tendu sans verrouiller) |
| Direct | pic du poing à 73 ms, avant le bassin | bassin, puis épaules, puis poing ; pic à 150 ms pour un impact à 170 ms ; vitesse de la main 3,27 → 6,46 m/s |
| Crochet avant | corrigé en v0.29-proto4 | inchangé, couvert par les tests |
| Low kick | orteil à moins de 6 cm du sol sur 38 à 42 cm | environ 14 cm ; glissement au sol d'environ 2 cm ; pied d'appui immobile (< 1 cm) |
| Teep | corrigé en v0.29-proto4 | inchangé, couvert par les tests |

Détails du moteur :

- Une pose intermédiaire « drive » met le bassin, puis le buste, en rotation avant le bras (direct et jab).
- Le pied du low kick quitte le sol en se levant au-dessus de la cheville (pied « épinglé »), puis se repose.
- Une clé « settling » amortit le transfert du poids à l'atterrissage. Elle supprime un saut de hanche de 23 cm
  observé sur une image.
- La règle de fluidité traite un pied épinglé comme un pied au sol. La vitesse à l'impact est donc conservée.

Tests : `src/engine/__tests__/prototypes-v031.test.ts`, 18 tests sur les 2 coachs.

- Ils couvrent l'ordre de la chaîne cinétique, la flexion du coude, la trajectoire du pied et le glissement des
  appuis.
- 8 de ces 18 tests échouent sur l'ancien code.

Vidéos avant/après, en grille 2×3 (avant v0.30 / après v0.31 × face, trois-quarts, profil), en vitesse normale
(60 i/s) et au ralenti ×4 (15 i/s) :

- jab ;
- direct ;
- crochet avant ;
- low kick arrière ;
- teep avant.

Elles sont publiées sur la page de validation (voir la fin de ce document).

Non refait dans ce lot (étape d'extension, après validation) :

- uppercut ;
- middle et high kick ;
- genou direct et coude horizontal (déjà retouchés dans la v0.29-proto4) ;
- analyse séparée du judo et du BJJ.

## 5. Tenues par discipline (commit `5cd7615`)

Générateur : `tools/generator/rocketbox/outfits.py` (Blender). Il travaille sur le corps livré de chaque coach :

- les vêtements sont copiés depuis la peau du corps, avec ses poids de peau, puis découpés, épaissis et ourlés ;
- les textures de tissu sont générées (tissage, maille, satin, grain du cuir) ;
- il n'y a aucun logo.

| Discipline | Kadir (homme) | Amara (femme) |
|---|---|---|
| Boxe anglaise | short satin rouge et or, torse nu, gants, chaussures montantes | short noir et or, brassière, gants, chaussures montantes |
| Kick-boxing | short ajusté noir et rouge, gants, protège-tibias | short ajusté rouge, brassière, gants, protège-tibias |
| Muay-thaï | short thaï large rouge et blanc, gants thaï, prajioud, pieds nus | short thaï bleu marine et or, brassière, gants, prajioud, pieds nus |
| MMA | short de combat fendu, gants ouverts, pieds nus | short, brassière, gants ouverts, pieds nus |
| BJJ (gi) | kimono bleu nuit épais, ceinture nouée | kimono blanc, rashguard court dessous |
| BJJ (no-gi) | rashguard manches longues et leggings | rashguard et leggings |
| Judo | judogi blanc épais, ceinture nouée | judogi blanc, ceinture |

À l'exécution (`src/three/outfit.ts`) :

- la tenue est attachée au squelette du coach et suit toutes les animations ;
- la peau couverte par la tenue n'est pas dessinée, donc elle ne peut pas traverser le tissu ;
- en qualité haute, le satin et la maille ont un reflet de tissu (sheen) et le cuir une fine couche vernie.

Réglages, section Affichage :

- « Tenue de la discipline », activée par défaut ;
- « Kimono (gi) / Sans kimono (no-gi) » pour le BJJ ;
- les préférences existantes sont conservées et aucune clé n'est supprimée.

En cas d'échec de chargement, l'application ne retombe pas silencieusement sur une tenue générique :

- un message nomme la tenue manquante ;
- le coach reste affiché dans sa tenue de base ;
- l'événement est inscrit au journal 3D.

Écart avec la demande : il n'y a pas encore de second modèle de secours propre à chaque discipline.

Galerie : 14 configurations (6 disciplines plus le no-gi, × 2 coachs). Chaque configuration est montrée de face,
de trois-quarts, de dos et en mouvement : `captures/tenues-kadir.jpg` et `captures/tenues-amara.jpg`.

Poids des fichiers :

- Kadir : 0,44 à 0,98 Mo par tenue ;
- Amara : 0,95 à 2,2 Mo par tenue (kimonos).

Une seule tenue est chargée à la fois.

Défauts connus, visibles sur la galerie :

- quelques petites taches de peau sur le pantalon du kimono d'Amara, près du genou ;
- les bords de la fente du short MMA sont un peu irréguliers ;
- le kimono suit le corps (pas de simulation de tissu) : il ne flotte pas pendant les coups de pied.

## 6. Vérifications des tenues (10 contrôles demandés)

| # | Contrôle | Résultat |
|---|---|---|
| 1 | Chaque discipline a sa tenue, pour l'homme et la femme | RÉUSSI (`outfit.test`, 14 fichiers) |
| 2 | La tenue utilise uniquement les os du coach (suit les animations) | RÉUSSI (`outfit.test`) |
| 3 | La peau masquée correspond au vrai corps (plus de 98 % des points) | RÉUSSI (`outfit.test`) |
| 4 | Seuls les triangles entièrement couverts disparaissent | RÉUSSI (`outfit.test`) |
| 5 | Choix de la tenue selon la discipline, le réglage et le gi/no-gi | RÉUSSI (`outfit.test`) |
| 6 | Pas de pénétration visible en garde et en mouvement, 3 angles | RÉUSSI à l'œil sur la galerie, avec les défauts listés ci-dessus |
| 7 | Pas de logo ni de marque | RÉUSSI (textures générées) |
| 8 | Désactivation dans les réglages | RÉUSSI (code et réglage) ; test e2e dédié NON EXÉCUTÉ |
| 9 | Message clair si une tenue ne charge pas | RÉUSSI (code) ; test e2e dédié NON EXÉCUTÉ |
| 10 | Performance sur un vrai téléphone Android | NON EXÉCUTÉ |

## 7. Liste de non-régression

- Stabilité WebGL de la PR #1 : code non modifié. Les tests e2e `training-layout` et `coach-stage` font partie de
  la suite complète.
- Mode Anime et coachs précédents (repli) : non touchés. Les tenues ne concernent que l'Ultra-réaliste.
- Préférences existantes : les nouveaux réglages arrivent par fusion des valeurs par défaut, sans migration et sans
  suppression de clé.
- Mesures du moteur régénérées :
  - `MESURES_FLUIDITE` : 310 → 339 arrêts sur 2046 clés internes. Le taux reste d'environ 22 %, sous le seuil de
    40 %.
  - Aucune vitesse à l'impact n'est réduite.
- Échec déjà connu depuis la v0.29-proto1, inchangé : `photo-coach.test`, Amara au sol (`pont`,
  `retention-garde`), hanche à 53,6–53,9° pour une limite de 45°.

## 8. Critères d'acceptation

1. Image nette sur téléphone, à résolution native ou au budget du niveau, avec MSAA : RÉUSSI (mesuré en émulation).
   Sur appareil réel : NON EXÉCUTÉ.
2. Musculature athlétique visible sur les deux coachs, sans culturisme et sans mise à l'échelle : à valider par
   Youssef sur les captures.
3. Les 5 animations prototypes respectent la chaîne cinétique et n'ont ni pied flottant ni pied glissant :
   RÉUSSI (18 tests). Validation par un entraîneur qualifié : NON EXÉCUTÉ.
4. Une tenue par discipline, de série, désactivable : RÉUSSI (14 configurations). Validation visuelle par Youssef
   en attente.
5. Aucune régression : Playwright 142 réussis, 2 ignorés, 2 échecs (`training-layout:323`, `coach-suggest:94`).
   Ces 2 tests échouent aussi sur la v0.30 : ils ne sont pas causés par ce lot et restent à corriger.
6. Fréquence d'images sur Android : non annoncée, car non mesurée.
