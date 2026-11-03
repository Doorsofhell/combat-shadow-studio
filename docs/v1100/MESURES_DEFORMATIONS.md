# Déformations de la peau aux articulations (1.10)

Généré par `src/engine/__tests__/deformation-v1100.test.ts` (peau des quatre coachs posée sur le processeur comme dans l'appli, à l'instant clé de chaque pose).
Chaque case : **pli** (accentuation du pli par rapport au repos, 99e centile, degrés) · **écrasement** (plus petit rapport d'aire d'un triangle, 0,2e centile) · **étirement** (plus grand rapport de longueur d'une arête).

| pose | zone | mma-kadir | mma-amara | axel | kaila |
|---|---|---|---|---|---|
| garde | aisselles, omoplates | 74° · 0.10 · 4.64 | 34° · 0.21 · 2.79 | 66° · 0.12 · 3.95 | 53° · 0.17 · 7.21 |
| garde | coudes | 85° · 0.17 · 1.93 | 72° · 0.05 · 2.33 | 106° · 0.04 · 1.71 | 67° · 0.09 · 1.81 |
| garde | aine, bassin | 12° · 0.35 · 5.34 | 12° · 0.67 · 1.33 | 8° · 0.79 · 1.54 | 15° · 0.55 · 1.92 |
| garde | genoux | 58° · 0.33 · 2.31 | 49° · 0.19 · 1.75 | 16° · 0.50 · 1.38 | 48° · 0.06 · 1.83 |
| jab | aisselles, omoplates | 71° · 0.12 · 6.16 | 39° · 0.20 · 3.25 | 53° · 0.22 · 5.10 | 46° · 0.18 · 7.56 |
| jab | coudes | 53° · 0.19 · 1.87 | 44° · 0.06 · 1.87 | 71° · 0.04 · 1.60 | 30° · 0.19 · 1.56 |
| jab | aine, bassin | 12° · 0.40 · 6.07 | 11° · 0.65 · 1.35 | 9° · 0.75 · 1.55 | 16° · 0.57 · 1.90 |
| jab | genoux | 57° · 0.33 · 2.30 | 49° · 0.19 · 1.75 | 17° · 0.48 · 1.38 | 52° · 0.05 · 1.84 |
| crochet | aisselles, omoplates | 77° · 0.09 · 6.23 | 40° · 0.15 · 3.21 | 55° · 0.19 · 4.91 | 50° · 0.15 · 7.24 |
| crochet | coudes | 59° · 0.15 · 1.86 | 66° · 0.11 · 1.64 | 62° · 0.02 · 1.40 | 35° · 0.23 · 1.56 |
| crochet | aine, bassin | 12° · 0.26 · 4.70 | 20° · 0.42 · 1.30 | 8° · 0.54 · 1.75 | 39° · 0.24 · 2.02 |
| crochet | genoux | 114° · 0.09 · 2.53 | 116° · 0.06 · 1.94 | 34° · 0.31 · 1.59 | 88° · 0.02 · 2.00 |
| high kick | aisselles, omoplates | 81° · 0.11 · 4.57 | 33° · 0.17 · 2.78 | 61° · 0.12 · 3.89 | 50° · 0.16 · 8.11 |
| high kick | coudes | 73° · 0.17 · 1.84 | 70° · 0.04 · 2.03 | 98° · 0.05 · 1.68 | 64° · 0.15 · 1.76 |
| high kick | aine, bassin | 102° · 0.07 · 17.41 | 72° · 0.11 · 1.50 | 38° · 0.04 · 2.17 | 132° · 0.08 · 1.70 |
| high kick | genoux | 58° · 0.26 · 2.38 | 49° · 0.20 · 1.75 | 15° · 0.51 · 1.36 | 42° · 0.07 · 1.82 |
| squat (changement de niveau) | aisselles, omoplates | 76° · 0.08 · 2.78 | 27° · 0.25 · 2.20 | 68° · 0.12 · 2.15 | 53° · 0.07 · 4.22 |
| squat (changement de niveau) | coudes | 69° · 0.16 · 1.77 | 60° · 0.05 · 1.79 | 104° · 0.03 · 1.52 | 73° · 0.15 · 1.65 |
| squat (changement de niveau) | aine, bassin | 129° · 0.02 · 7.76 | 103° · 0.07 · 1.67 | 36° · 0.11 · 2.38 | 122° · 0.06 · 2.96 |
| squat (changement de niveau) | genoux | 131° · 0.11 · 3.13 | 106° · 0.05 · 2.30 | 121° · 0.06 · 1.90 | 115° · 0.06 · 2.38 |
| bras levés (blocage haut) | aisselles, omoplates | 124° · 0.06 · 5.90 | 51° · 0.17 · 2.91 | 93° · 0.12 · 5.22 | 73° · 0.11 · 9.97 |
| bras levés (blocage haut) | coudes | 84° · 0.08 · 1.69 | 83° · 0.05 · 1.87 | 119° · 0.04 · 1.50 | 91° · 0.13 · 1.65 |
| bras levés (blocage haut) | aine, bassin | 14° · 0.26 · 5.74 | 15° · 0.59 · 1.36 | 8° · 0.69 · 1.66 | 19° · 0.47 · 2.03 |
| bras levés (blocage haut) | genoux | 88° · 0.15 · 2.51 | 81° · 0.07 · 1.89 | 27° · 0.36 · 1.47 | 64° · 0.08 · 1.96 |
| sol (rétention de garde) | aisselles, omoplates | 72° · 0.09 · 4.10 | 33° · 0.25 · 3.38 | 56° · 0.18 · 3.74 | 55° · 0.16 · 4.23 |
| sol (rétention de garde) | coudes | 21° · 0.29 · 1.48 | 25° · 0.20 · 1.28 | 76° · 0.06 · 1.54 | 53° · 0.17 · 1.60 |
| sol (rétention de garde) | aine, bassin | 38° · 0.07 · 7.02 | 59° · 0.02 · 1.82 | 55° · 0.13 · 2.62 | 135° · 0.08 · 3.17 |
| sol (rétention de garde) | genoux | 132° · 0.07 · 3.26 | 131° · 0.03 · 2.47 | 147° · 0.03 · 2.09 | 122° · 0.03 · 2.48 |
