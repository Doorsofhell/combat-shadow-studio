# Déformations de la peau aux articulations (1.10)

Généré par `src/engine/__tests__/deformation-v1100.test.ts` (peau des quatre coachs posée sur le processeur comme dans l'appli, à l'instant clé de chaque pose).
Chaque case : **pli** (accentuation du pli par rapport au repos, 99e centile, degrés) · **écrasement** (plus petit rapport d'aire d'un triangle, 0,2e centile) · **étirement** (rapport de longueur d'une arête, 99,8e centile).

| pose | zone | mma-kadir | mma-amara | axel | kaila |
|---|---|---|---|---|---|
| garde | aisselles, omoplates | 62° · 0.08 · 2.37 | 34° · 0.21 · 2.25 | 66° · 0.12 · 2.66 | 40° · 0.17 · 3.08 |
| garde | coudes | 85° · 0.17 · 1.85 | 72° · 0.05 · 2.10 | 106° · 0.04 · 1.64 | 67° · 0.09 · 1.75 |
| garde | aine, bassin | 12° · 0.35 · 3.69 | 12° · 0.67 · 1.30 | 8° · 0.79 · 1.46 | 15° · 0.55 · 1.78 |
| garde | genoux | 58° · 0.33 · 2.31 | 49° · 0.19 · 1.72 | 16° · 0.50 · 1.36 | 48° · 0.06 · 1.64 |
| jab | aisselles, omoplates | 53° · 0.08 · 2.83 | 39° · 0.20 · 2.34 | 53° · 0.22 · 3.28 | 33° · 0.21 · 3.38 |
| jab | coudes | 53° · 0.19 · 1.80 | 44° · 0.06 · 1.65 | 71° · 0.04 · 1.55 | 30° · 0.19 · 1.54 |
| jab | aine, bassin | 12° · 0.40 · 4.04 | 11° · 0.65 · 1.34 | 9° · 0.75 · 1.44 | 16° · 0.57 · 1.76 |
| jab | genoux | 57° · 0.33 · 2.30 | 49° · 0.19 · 1.72 | 17° · 0.48 · 1.37 | 52° · 0.05 · 1.65 |
| crochet | aisselles, omoplates | 51° · 0.06 · 3.08 | 40° · 0.15 · 2.33 | 55° · 0.19 · 3.07 | 35° · 0.21 · 3.33 |
| crochet | coudes | 59° · 0.15 · 1.85 | 66° · 0.11 · 1.50 | 62° · 0.02 · 1.39 | 35° · 0.23 · 1.51 |
| crochet | aine, bassin | 12° · 0.26 · 3.45 | 20° · 0.42 · 1.24 | 8° · 0.54 · 1.70 | 39° · 0.24 · 1.80 |
| crochet | genoux | 114° · 0.09 · 2.53 | 116° · 0.06 · 1.90 | 34° · 0.31 · 1.46 | 88° · 0.02 · 1.76 |
| high kick | aisselles, omoplates | 70° · 0.08 · 2.62 | 33° · 0.17 · 2.33 | 61° · 0.12 · 3.12 | 38° · 0.18 · 3.02 |
| high kick | coudes | 73° · 0.17 · 1.77 | 70° · 0.04 · 1.88 | 98° · 0.05 · 1.62 | 64° · 0.15 · 1.71 |
| high kick | aine, bassin | 102° · 0.07 · 7.64 | 72° · 0.11 · 1.47 | 38° · 0.04 · 1.99 | 132° · 0.08 · 1.43 |
| high kick | genoux | 58° · 0.26 · 2.38 | 49° · 0.20 · 1.72 | 15° · 0.51 · 1.36 | 42° · 0.07 · 1.64 |
| squat (changement de niveau) | aisselles, omoplates | 60° · 0.07 · 1.83 | 27° · 0.25 · 1.73 | 68° · 0.12 · 1.98 | 31° · 0.08 · 2.00 |
| squat (changement de niveau) | coudes | 69° · 0.16 · 1.75 | 60° · 0.05 · 1.76 | 104° · 0.03 · 1.50 | 73° · 0.15 · 1.61 |
| squat (changement de niveau) | aine, bassin | 129° · 0.02 · 4.99 | 103° · 0.07 · 1.62 | 36° · 0.11 · 2.36 | 122° · 0.06 · 2.65 |
| squat (changement de niveau) | genoux | 131° · 0.11 · 3.13 | 106° · 0.05 · 2.29 | 121° · 0.06 · 1.69 | 115° · 0.06 · 2.01 |
| bras levés (blocage haut) | aisselles, omoplates | 76° · 0.07 · 3.64 | 51° · 0.17 · 2.46 | 93° · 0.12 · 4.87 | 58° · 0.09 · 4.18 |
| bras levés (blocage haut) | coudes | 84° · 0.08 · 1.66 | 83° · 0.05 · 1.83 | 119° · 0.04 · 1.48 | 91° · 0.13 · 1.62 |
| bras levés (blocage haut) | aine, bassin | 14° · 0.26 · 3.80 | 15° · 0.59 · 1.33 | 8° · 0.69 · 1.57 | 19° · 0.47 · 1.87 |
| bras levés (blocage haut) | genoux | 88° · 0.15 · 2.51 | 81° · 0.07 · 1.87 | 27° · 0.36 · 1.45 | 64° · 0.08 · 1.74 |
| sol (rétention de garde) | aisselles, omoplates | 53° · 0.07 · 2.68 | 33° · 0.25 · 2.63 | 56° · 0.18 · 2.81 | 33° · 0.19 · 2.69 |
| sol (rétention de garde) | coudes | 21° · 0.29 · 1.41 | 25° · 0.20 · 1.27 | 76° · 0.06 · 1.51 | 53° · 0.17 · 1.57 |
| sol (rétention de garde) | aine, bassin | 38° · 0.07 · 3.15 | 59° · 0.02 · 1.73 | 55° · 0.13 · 2.55 | 135° · 0.08 · 2.91 |
| sol (rétention de garde) | genoux | 132° · 0.07 · 3.26 | 131° · 0.03 · 2.41 | 147° · 0.03 · 1.85 | 122° · 0.03 · 2.20 |
