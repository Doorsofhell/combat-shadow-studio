# Déformations de la peau aux articulations (1.10)

Généré par `src/engine/__tests__/deformation-v1100.test.ts` (peau des quatre coachs posée sur le processeur comme dans l'appli, à l'instant clé de chaque pose).
Chaque case : **pli** (accentuation du pli par rapport au repos, 99e centile, degrés) · **écrasement** (plus petit rapport d'aire d'un triangle, 0,2e centile) · **étirement** (rapport de longueur d'une arête, 99,8e centile).

| pose | zone | mma-kadir | mma-amara | nael | inaya |
|---|---|---|---|---|---|
| garde | aisselles, omoplates | 62° · 0.08 · 2.37 | 34° · 0.21 · 2.25 | 75° · 0.06 · 2.21 | 19° · 0.18 · 1.87 |
| garde | coudes | 85° · 0.17 · 1.85 | 72° · 0.05 · 2.10 | 95° · 0.17 · 1.85 | 65° · 0.03 · 1.66 |
| garde | aine, bassin | 12° · 0.35 · 3.69 | 12° · 0.67 · 1.30 | 11° · 0.42 · 1.19 | 13° · 0.63 · 1.33 |
| garde | genoux | 58° · 0.33 · 2.31 | 49° · 0.19 · 1.72 | 53° · 0.41 · 1.98 | 56° · 0.09 · 1.77 |
| jab | aisselles, omoplates | 53° · 0.08 · 2.83 | 39° · 0.22 · 2.34 | 44° · 0.05 · 2.58 | 18° · 0.18 · 1.95 |
| jab | coudes | 53° · 0.19 · 1.80 | 44° · 0.06 · 1.65 | 65° · 0.18 · 1.76 | 45° · 0.06 · 1.55 |
| jab | aine, bassin | 12° · 0.40 · 4.04 | 11° · 0.65 · 1.34 | 10° · 0.46 · 1.19 | 13° · 0.62 · 1.38 |
| jab | genoux | 57° · 0.33 · 2.30 | 49° · 0.19 · 1.72 | 52° · 0.42 · 1.98 | 56° · 0.10 · 1.77 |
| crochet | aisselles, omoplates | 52° · 0.06 · 3.12 | 41° · 0.16 · 2.35 | 41° · 0.06 · 2.78 | 19° · 0.18 · 1.90 |
| crochet | coudes | 60° · 0.15 · 1.85 | 63° · 0.11 · 1.51 | 65° · 0.10 · 1.79 | 65° · 0.09 · 1.35 |
| crochet | aine, bassin | 12° · 0.26 · 3.45 | 20° · 0.42 · 1.24 | 12° · 0.35 · 1.35 | 23° · 0.36 · 1.24 |
| crochet | genoux | 114° · 0.09 · 2.53 | 116° · 0.06 · 1.90 | 96° · 0.22 · 2.16 | 135° · 0.05 · 1.93 |
| high kick | aisselles, omoplates | 70° · 0.08 · 2.62 | 33° · 0.17 · 2.33 | 66° · 0.03 · 2.32 | 20° · 0.19 · 1.91 |
| high kick | coudes | 73° · 0.17 · 1.77 | 70° · 0.04 · 1.88 | 90° · 0.16 · 1.82 | 70° · 0.07 · 1.52 |
| high kick | aine, bassin | 102° · 0.07 · 7.63 | 72° · 0.11 · 1.47 | 107° · 0.11 · 1.47 | 66° · 0.10 · 1.44 |
| high kick | genoux | 58° · 0.26 · 2.38 | 49° · 0.20 · 1.72 | 52° · 0.40 · 2.00 | 50° · 0.11 · 1.75 |
| squat (changement de niveau) | aisselles, omoplates | 60° · 0.07 · 1.83 | 27° · 0.25 · 1.73 | 58° · 0.07 · 1.78 | 13° · 0.36 · 1.55 |
| squat (changement de niveau) | coudes | 69° · 0.16 · 1.75 | 60° · 0.05 · 1.76 | 86° · 0.14 · 1.73 | 54° · 0.08 · 1.43 |
| squat (changement de niveau) | aine, bassin | 129° · 0.02 · 4.99 | 103° · 0.07 · 1.62 | 119° · 0.02 · 1.41 | 116° · 0.02 · 1.61 |
| squat (changement de niveau) | genoux | 131° · 0.11 · 3.13 | 106° · 0.05 · 2.29 | 141° · 0.14 · 2.64 | 118° · 0.03 · 2.29 |
| bras levés (blocage haut) | aisselles, omoplates | 76° · 0.07 · 3.64 | 51° · 0.17 · 2.46 | 64° · 0.06 · 3.13 | 31° · 0.11 · 1.90 |
| bras levés (blocage haut) | coudes | 84° · 0.08 · 1.66 | 83° · 0.05 · 1.83 | 110° · 0.09 · 1.67 | 86° · 0.05 · 1.52 |
| bras levés (blocage haut) | aine, bassin | 14° · 0.26 · 3.80 | 15° · 0.59 · 1.33 | 15° · 0.32 · 1.22 | 15° · 0.56 · 1.36 |
| bras levés (blocage haut) | genoux | 88° · 0.15 · 2.51 | 81° · 0.07 · 1.87 | 76° · 0.24 · 2.15 | 97° · 0.06 · 1.91 |
| sol (rétention de garde) | aisselles, omoplates | 53° · 0.07 · 2.68 | 33° · 0.25 · 2.63 | 52° · 0.06 · 2.78 | 24° · 0.16 · 2.05 |
| sol (rétention de garde) | coudes | 21° · 0.29 · 1.41 | 25° · 0.20 · 1.27 | 31° · 0.35 · 1.40 | 19° · 0.20 · 1.25 |
| sol (rétention de garde) | aine, bassin | 38° · 0.07 · 3.15 | 59° · 0.02 · 1.73 | 35° · 0.06 · 1.48 | 58° · 0.02 · 1.72 |
| sol (rétention de garde) | genoux | 132° · 0.07 · 3.26 | 131° · 0.03 · 2.41 | 121° · 0.08 · 2.75 | 128° · 0.05 · 2.40 |
