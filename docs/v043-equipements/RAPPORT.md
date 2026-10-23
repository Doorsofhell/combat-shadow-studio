# v0.43.0 · Équipements 3D réalistes · rapport

Demande de Youssef (2026-10-23, « REFONTE RÉALISTE DES ÉQUIPEMENTS 3D »), audit préalable : [AUDIT.md](AUDIT.md).

## 1. Périmètre réel

- **2 coachs 3D** (Kadir et Amara), pas 36 : la galerie des champions s'appuie sur ces deux corps. Toutes les mesures et captures portent sur ces deux coachs, dans leurs 7 tenues, en Ultra-réaliste, plus la boxe en Anime.
- Aucune protection n'a été ajoutée d'office (casque, coquille, protège-dents, protège-pieds) : seuls les équipements déjà présents ont été refaits.
- Aucun logo, aucune marque, aucun service payant : tout est généré par nos scripts (Blender 5.2.2 en ligne de commande, numpy).

## 2. Ce qui change

| Lot | Équipement | Avant (v0.42) | Après (v0.43) |
|---|---|---|---|
| 1 | Gant de boxe (boxe, kick-boxing, muay-thaï) | deux œufs (moufle + pouce), manchette en tube, anneau de sangle flottant, 4 pièces par main | un gant sculpté d'un seul tenant : poing roulé, face de frappe, pouce soudé par un pli, manchette ouverte avec doublure ; zones colorées par sommet (cuir, sangle, passepoil, doublure) avec des lignes de coupe droites ; grain de cuir ; 1 pièce par main |
| 1 | Gant Anime | deux sphères et un tour | la même forme sculptée, partagée (`src/three/gloveShape.ts`, 2 400 triangles) |
| 2 | Chaussures de boxe | bande blanche en dents de scie, pas de semelle, forme du pied nu | chaussure mesurée sur le pied du coach : semelle épaisse, tige montante, col rembourré, doublure visible à l'ouverture, bandes droites, 1 pièce par pied |
| 3 | Prajioud (muay-thaï) | anneau jaune rigide qui flotte | cordon tressé posé sur le contour mesuré du bras, nœud et deux pans |
| 4 | Protège-tibias (kick-boxing) | manchon sans fermeture | matelassage, deux sangles derrière le mollet, bords droits |
| 5 | Gants MMA | coque collée sur la main | manchette arrêtée à 5 cm du poignet, sangle de poignet dans la couleur d'accent, bords nets |
| 6 | Toutes les tenues | lissage qui ondulait les ourlets | les sommets posés sur une ligne de coupe ne bougent plus au lissage : ourlets et bandes droits |

BJJ, sans kimono et judo : fichiers régénérés avec la même géométrie (mêmes triangles, mêmes appels de dessin) ; seuls les ourlets lissés diffèrent.

## 3. Performance (fichiers 3D des tenues)

Mesuré sur les fichiers du dépôt, v0.42.0 (`c1bc93c`) → v0.43.0. Un appel de dessin = un objet envoyé à la carte graphique : c'est le coût qui compte le plus sur Android.

| Coach | Tenue | Taille (Ko) | Triangles | Appels de dessin |
|---|---|---|---|---|
| Kadir | boxe | 818 → 956 | 15 680 → 15 550 | 12 → 6 |
| Kadir | kickboxing | 669 → 871 | 12 112 → 13 566 | 11 → 6 |
| Kadir | muaythai | 584 → 793 | 10 672 → 12 906 | 12 → 6 |
| Kadir | mma | 413 → 472 | 7 752 → 8 412 | 3 → 4 |
| Kadir | bjj | 1000 → 1000 | 19 486 → 19 486 | 10 → 10 |
| Kadir | bjj-nogi | 955 → 956 | 18 542 → 18 542 | 5 → 5 |
| Kadir | judo | 1033 → 1033 | 19 460 → 19 460 | 10 → 10 |
| Amara | boxe | 1366 → 1415 | 20 862 → 20 646 | 14 → 8 |
| Amara | kickboxing | 1150 → 1379 | 17 038 → 18 628 | 13 → 8 |
| Amara | muaythai | 1041 → 1253 | 15 782 → 18 016 | 14 → 8 |
| Amara | mma | 909 → 980 | 12 530 → 13 218 | 5 → 6 |
| Amara | bjj | 2194 → 2199 | 34 896 → 34 896 | 11 → 11 |
| Amara | bjj-nogi | 1244 → 1237 | 19 570 → 19 570 | 2 → 2 |
| Amara | judo | 2186 → 2190 | 34 784 → 34 784 | 11 → 11 |

- Les gants passent de 8 appels de dessin à 2 ; la tenue de boxe complète de 12 à 6 (Kadir) et de 14 à 8 (Amara).
- Chaque gant pèse au plus 3 100 triangles, comme les 4 pièces de la v0.42 (2 916). Une première version à 4 100 triangles par main ralentissait la séance d'environ 10 % dans le navigateur des tests (9,2 au lieu de 10,2 images par seconde, rendu logiciel) : elle a été allégée avant publication. Mesure finale sur la séance de kick-boxing : 10,0 et 10,1 images par seconde contre 10,5 et 10,6 en v0.42.
- Les fichiers grossissent de 50 à 230 Ko par tenue à gants (couleurs par sommet). Ils restent chargés à la demande, une tenue à la fois.
- MMA : un appel de dessin de plus (la sangle a sa propre matière).

## 4. Captures avant / après

`captures/` : une planche par tenue et par coach, avant en haut, après en bas. Vues : face, profil, trois quarts, gros plan des mains, des pieds, jab et high kick.

## 5. Tests

| Suite | Résultat |
|---|---|
| `outfit-v043` (gants d'une pièce et pas plus lourds qu'avant, chaussures, appels de dessin, prajioud, sangle MMA, gant Anime) | 15 RÉUSSIS |
| `outfit-v032` (finitions des tenues, inchangé) | 14 RÉUSSIS |
| Vitest complet | 767 réussis, 1 ÉCHOUÉ connu (Amara, extension de hanche, déjà en échec en v0.42), 1 ignoré |
| Playwright complet (version compilée) | 180 réussis, 2 ÉCHOUÉS connus (`coach-suggest:96`, `training-layout:325`, déjà en échec en v0.42), 2 ignorés (Firebase) |
| `coaching-hud:60` rejoué seul | instable dans le navigateur des tests : 2 réussis sur 3 en v0.43, 2 sur 4 en v0.42 |
| Android réel | NON EXÉCUTÉ |

## 6. Limites connues

- Seuls 2 coachs existent en 3D ; aucun autre personnage n'est déclaré testé.
- En Anime, BJJ et judo restent en short : le kimono n'existe pas dans ce rendu (inchangé).
- Le gant, pouce compris, mesure jusqu'à 17 cm de large : proche d'un gant d'entraînement de 14 à 16 oz.
- Les sangles des protège-tibias se voient de profil quand la jambe est tendue.
- Android réel : NON EXÉCUTÉ (rendu vérifié dans Chromium, rendu logiciel).
