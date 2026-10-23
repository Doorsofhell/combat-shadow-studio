# Inventaire des programmes (v0.41.0)

Généré depuis `src/domain/programs.ts` par `src/domain/__tests__/programs-inventory.test.ts` (`UPDATE_DOCS=1`).

## Avant / après par discipline

| Discipline | Avant (v0.40) | Après (v0.41) | Remarque |
|---|---|---|---|
| Boxe anglaise | 1 | 8 |  |
| Kick-boxing | 1 | 8 |  |
| MMA | 1 | 8 |  |
| Muay-thaï | 2 | 8 |  |
| Judo | 1 | 7 | Sept programmes : le travail solo vérifié (déplacements, chutes basses, entrées sans projection) ne permet pas un huitième programme qui ne répète pas les autres. |
| Jiu-jitsu brésilien | 1 | 7 | Sept programmes : même raison, le travail solo au sol et debout est couvert par les sept. |
| Multi-disciplines | 3 | 3 |  |
| **Total** | **10** | **49** | |

## Écart « 10 contre 8 »

La branche `main` du dépôt (v0.14, jamais mise à jour depuis) contient 8 programmes. La version déployée (branche `feature/combat-shadow-v030`) en contenait 10 : `judo-bases-solo` et `bjj-mobilite-solo` ont été ajoutés en v0.13.0 avec le judo et le jiu-jitsu brésilien. Aucun programme n'a disparu.

## Liste complète

Durée : minutes d'une séance, calculées à partir des blocs, des repos et des transitions (une valeur par semaine quand chaque semaine a sa propre séance).

| Statut | Identifiant | Nom | Discipline | Niveau | Objectif | Matériel | Durée (min) | Semaines × séances |
|---|---|---|---|---|---|---|---|---|
| existant | `boxe-initiation-4-semaines` | Boxe anglaise - Initiation 4 semaines | Boxe anglaise | debutant | Fondamentaux | Sans matériel | 25 | 4 × 3 |
| existant | `kick-poings-pieds` | Kick-boxing - Techniques poings-pieds | Kick-boxing | intermediaire | Technique | Sans matériel | 28 | – |
| existant | `mma-striking-mobilite` | MMA - Shadow striking et mobilité | MMA | intermediaire | Mobilité | Avec un tapis | 24 | – |
| existant | `muay-fondamentaux` | Muay-thaï - Techniques fondamentales | Muay-thaï | debutant | Fondamentaux | Sans matériel | 24 | – |
| existant | `cardio-combat-20` | Cardio combat express | Multi-disciplines | avance | Endurance | Sans matériel | 19 | – |
| existant | `coordination-15` | Coordination express | Multi-disciplines | intermediaire | Coordination | Sans matériel | 14 | – |
| existant | `technique-avancee-30` | Technique avancée multi-disciplines | Multi-disciplines | expert | Technique | Sans matériel | 24 | – |
| existant | `muay-armes-completes` | Muay-thaï - Huit armes | Muay-thaï | expert | Technique | Sans matériel | 26 | – |
| existant | `judo-bases-solo` | Judo - Bases en solo | Judo | intermediaire | Fondamentaux | Avec un tapis | 20 | – |
| existant | `bjj-mobilite-solo` | Jiu-jitsu brésilien - Mobilité et relevés en solo | Jiu-jitsu brésilien | intermediaire | Mobilité | Avec un tapis | 22 | – |
| nouveau | `boxe-defense-deplacements-debutant` | Boxe anglaise - Bouger et se protéger | Boxe anglaise | debutant | Défense | Sans matériel | 13 / 24 / 30 / 31 | 4 × 2 |
| nouveau | `boxe-enchainements-intermediaire` | Boxe anglaise - Combinaisons de trois et quatre coups | Boxe anglaise | intermediaire | Enchaînements | Sans matériel | 16 / 30 / 37 / 38 | 4 × 3 |
| nouveau | `boxe-defense-contre-intermediaire` | Boxe anglaise - Défendre et contrer | Boxe anglaise | intermediaire | Défense | Sans matériel | 16 / 30 / 37 / 38 | 4 × 2 |
| nouveau | `boxe-angles-avance` | Boxe anglaise - Angles et pivots | Boxe anglaise | avance | Déplacements | Sans matériel | 20 / 36 / 44 / 46 | 4 × 2 |
| nouveau | `boxe-combinaisons-avance` | Boxe anglaise - Combinaisons avancées | Boxe anglaise | avance | Enchaînements | Sans matériel | 20 / 36 / 44 / 46 | 4 × 3 |
| nouveau | `boxe-endurance-avance` | Boxe anglaise - Endurance du boxeur | Boxe anglaise | avance | Endurance | Sans matériel | 20 / 40 / 48 / 53 | 4 × 2 |
| nouveau | `boxe-rounds-expert` | Boxe anglaise - Rounds d’expert | Boxe anglaise | expert | Enchaînements | Sans matériel | 24 / 47 / 57 / 61 | 4 × 2 |
| nouveau | `kick-fondamentaux-debutant` | Kick-boxing - Fondamentaux | Kick-boxing | debutant | Fondamentaux | Sans matériel | 13 / 24 / 30 / 31 | 4 × 3 |
| nouveau | `kick-defense-intermediaire` | Kick-boxing - Défenses et contres | Kick-boxing | intermediaire | Défense | Sans matériel | 16 / 30 / 37 / 38 | 4 × 2 |
| nouveau | `kick-distance-intermediaire` | Kick-boxing - Gestion de la distance | Kick-boxing | intermediaire | Déplacements | Sans matériel | 16 / 30 / 37 / 38 | 4 × 2 |
| nouveau | `kick-genoux-k1-intermediaire` | Kick-boxing - Genoux et switch kick (K1) | Kick-boxing | intermediaire | Technique | Sans matériel | 16 / 30 / 37 / 38 | 4 × 2 |
| nouveau | `kick-enchainements-avance` | Kick-boxing - Enchaînements poings-pieds | Kick-boxing | avance | Enchaînements | Sans matériel | 20 / 36 / 44 / 46 | 4 × 3 |
| nouveau | `kick-endurance-avance` | Kick-boxing - Endurance poings-pieds | Kick-boxing | avance | Endurance | Sans matériel | 20 / 40 / 48 / 53 | 4 × 2 |
| nouveau | `kick-rounds-expert` | Kick-boxing - Rounds d’expert | Kick-boxing | expert | Enchaînements | Sans matériel | 24 / 47 / 57 / 61 | 4 × 2 |
| nouveau | `mma-fondamentaux-debutant` | MMA - Fondamentaux debout | MMA | debutant | Fondamentaux | Avec un tapis | 13 / 17 / 22 / 24 | 4 × 3 |
| nouveau | `mma-defense-lutte-debutant` | MMA - Défendre l’entrée en lutte | MMA | debutant | Défense | Avec un tapis | 13 / 17 / 22 / 24 | 4 × 2 |
| nouveau | `mma-enchainements-intermediaire` | MMA - Frappes et feintes de lutte | MMA | intermediaire | Enchaînements | Avec un tapis | 16 / 30 / 37 / 38 | 4 × 3 |
| nouveau | `mma-entrees-sol-intermediaire` | MMA - Entrées et mobilité au sol | MMA | intermediaire | Mobilité | Avec un tapis | 16 / 22 / 28 / 29 | 4 × 2 |
| nouveau | `mma-defense-lutte-avance` | MMA - Défense de lutte et contre | MMA | avance | Défense | Avec un tapis | 20 / 36 / 44 / 46 | 4 × 2 |
| nouveau | `mma-endurance-avance` | MMA - Endurance | MMA | avance | Endurance | Avec un tapis | 20 / 40 / 48 / 53 | 4 × 2 |
| nouveau | `mma-rounds-expert` | MMA - Rounds d’expert | MMA | expert | Enchaînements | Avec un tapis | 24 / 47 / 57 / 61 | 4 × 2 |
| nouveau | `muay-defense-intermediaire` | Muay-thaï - Défenses thaï | Muay-thaï | intermediaire | Défense | Sans matériel | 16 / 22 / 28 / 29 | 4 × 2 |
| nouveau | `muay-coudes-genoux-intermediaire` | Muay-thaï - Coudes et genoux | Muay-thaï | intermediaire | Technique | Sans matériel | 16 / 30 / 37 / 38 | 4 × 2 |
| nouveau | `muay-enchainements-intermediaire` | Muay-thaï - Combinaisons poings-pieds | Muay-thaï | intermediaire | Enchaînements | Sans matériel | 16 / 30 / 37 / 38 | 4 × 3 |
| nouveau | `muay-enchainements-avance` | Muay-thaï - Combinaisons avancées | Muay-thaï | avance | Enchaînements | Sans matériel | 20 / 36 / 44 / 46 | 4 × 3 |
| nouveau | `muay-endurance-avance` | Muay-thaï - Endurance | Muay-thaï | avance | Endurance | Sans matériel | 20 / 40 / 48 / 53 | 4 × 2 |
| nouveau | `muay-rounds-expert` | Muay-thaï - Rounds d’expert | Muay-thaï | expert | Enchaînements | Sans matériel | 24 / 47 / 57 / 61 | 4 × 2 |
| nouveau | `judo-deplacements-debutant` | Judo - Déplacements (ashi-sabaki) | Judo | debutant | Déplacements | Avec un tapis | 8 / 10 / 15 / 16 | 4 × 3 |
| nouveau | `judo-ukemi-intermediaire` | Judo - Chutes basses | Judo | intermediaire | Fondamentaux | Avec un tapis | 11 / 13 / 19 / 20 | 4 × 2 |
| nouveau | `judo-uchikomi-intermediaire` | Judo - Uchikomi en solo | Judo | intermediaire | Technique | Avec un tapis | 16 / 30 / 37 / 38 | 4 × 2 |
| nouveau | `judo-kuzushi-avance` | Judo - Déséquilibres et entrées | Judo | avance | Enchaînements | Avec un tapis | 20 / 36 / 44 / 46 | 4 × 2 |
| nouveau | `judo-endurance-avance` | Judo - Endurance d’uchikomi | Judo | avance | Endurance | Avec un tapis | 20 / 40 / 48 / 53 | 4 × 2 |
| nouveau | `judo-rounds-expert` | Judo - Rounds d’expert en solo | Judo | expert | Enchaînements | Avec un tapis | 24 / 34 / 44 / 49 | 4 × 2 |
| nouveau | `bjj-bases-debutant` | Jiu-jitsu brésilien - Mouvements de base | Jiu-jitsu brésilien | debutant | Fondamentaux | Avec un tapis | 8 / 10 / 15 / 16 | 4 × 3 |
| nouveau | `bjj-garde-sorties-intermediaire` | Jiu-jitsu brésilien - Garde et sorties | Jiu-jitsu brésilien | intermediaire | Technique | Avec un tapis | 16 / 30 / 37 / 38 | 4 × 2 |
| nouveau | `bjj-lutte-debout-intermediaire` | Jiu-jitsu brésilien - Lutte debout en solo | Jiu-jitsu brésilien | intermediaire | Technique | Avec un tapis | 16 / 22 / 28 / 29 | 4 × 2 |
| nouveau | `bjj-enchainements-avance` | Jiu-jitsu brésilien - Enchaînements au sol | Jiu-jitsu brésilien | avance | Enchaînements | Avec un tapis | 20 / 36 / 44 / 46 | 4 × 2 |
| nouveau | `bjj-endurance-avance` | Jiu-jitsu brésilien - Endurance au sol | Jiu-jitsu brésilien | avance | Endurance | Avec un tapis | 20 / 40 / 48 / 53 | 4 × 2 |
| nouveau | `bjj-rounds-expert` | Jiu-jitsu brésilien - Rounds d’expert en solo | Jiu-jitsu brésilien | expert | Enchaînements | Avec un tapis | 24 / 34 / 44 / 49 | 4 × 2 |
