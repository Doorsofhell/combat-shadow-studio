# 2.3.0 : mesures du moteur avant / après (généré)

Généré par `node scripts/v230/summary.mjs` à partir de `docs/v230/audit/avant.json` (moteur 2.3.0 avec toutes les
corrections coupées, identique au moteur 2.2.0) et `apres.json` (corrections actives). Mesures faites sur les squelettes
réels des 6 coachs, 1272 couples coach × discipline × technique, 120 images par seconde.

Lecture : **pic hanches / épaules / poing** = instant (ms depuis le début) où la ligne des hanches, celle des épaules
et l’extrémité qui frappe tournent ou vont le plus vite ; une chaîne cinétique saine a hanches < épaules < poing.
**Arrêt** = durée où l’extrémité reste immobile (à 1 % de la taille près) autour de l’impact. **Vitesse** = vitesse
de l’extrémité juste avant l’impact (m/s). **Saut de vitesse** (dv) = plus grand changement de vitesse d’une
articulation entre deux images (tailles par seconde) : au-delà de 10, l’œil voit un à-coup. **Rotation parasite** =
plus grand tour d’un coude ou d’un genou autour de son membre en 1/60 s (degrés).

## 1. Par famille de techniques (moyenne des 6 coachs)

| Famille | n | Saut de vitesse moyen avant → après | Rotation parasite moy. | Arrêt à l’impact (ms) | Vitesse à l’impact (m/s) |
|---|---|---|---|---|---|
| deplacement | 210 | 0,90 → 0,90 | 4,4° → 4,4° | – | – |
| autre | 270 | 4,88 → 4,83 | 21,5° → 21,5° | – | – |
| direct | 108 | 3,37 → 3,15 | 20,6° → 18,1° | 79 → 59 | 3,90 → 3,84 |
| crochet | 96 | 1,81 → 1,84 | 14,2° → 14,1° | 65 → 52 | 3,12 → 3,12 |
| uppercut | 48 | 1,84 → 1,92 | 12,3° → 16,1° | 82 → 52 | 3,98 → 4,07 |
| defense | 252 | 1,10 → 1,10 | 10,0° → 10,0° | – | – |
| pied-droit | 42 | 2,96 → 3,94 | 26,0° → 25,0° | 3 → 0 | 6,00 → 8,12 |
| pied-circulaire | 138 | 6,65 → 6,02 | 39,6° → 35,9° | 25 → 21 | 6,83 → 9,21 |
| genou | 72 | 5,85 → 5,98 | 32,1° → 32,4° | 160 → 160 | 7,45 → 7,45 |
| coude | 36 | 2,76 → 2,76 | 25,2° → 25,2° | 94 → 54 | 5,71 → 5,71 |

## 2. Anomalies comptées sur les 1272 mesures

| Anomalie | Avant | Après |
|---|---|---|
| Saut de vitesse > 10 tailles/s (à-coup visible) | 67 | 38 |
| Rotation parasite d’un coude ou genou > 90° en 1/60 s | 9 | 8 |
| Rotation parasite > 45° | 66 | 34 |
| Pied d’appui qui glisse > 1 cm par image | 132 | 132 |
| Pied sous le sol > 1 cm | 2 | 2 |
| Coup dont les épaules tournent avant les hanches | 85 | 85 |
| Coup dont hanches et épaules culminent ensemble (± 5 ms) | 250 | 157 |
| Poing, coude ou pied immobile ≥ 50 ms à l’impact | 358 | 293 |

## 3. Par coach (contrôle morphologique, phase D)

Mêmes techniques et mêmes règles pour les six coachs ; aucun réglage ne dépend du sexe. Les écarts restants viennent
des proportions (bras, jambes, taille), que le moteur lit sur chaque squelette.

| Coach | Saut de vitesse moy. | Rotation parasite moy. | Arrêt à l’impact moy. (ms) | Vitesse à l’impact moy. (m/s) | Garde : rebond périodique (1 = identique) |
|---|---|---|---|---|---|
| Kadir | 3,29 → 3,19 | 19,2° → 18,4° | 69 → 56 | 5,39 → 6,10 | 1,00 → 0,85 |
| Amara | 3,14 → 3,10 | 17,8° → 17,4° | 70 → 56 | 5,19 → 6,02 | 1,00 → 0,85 |
| Naël | 3,06 → 3,01 | 18,2° → 17,7° | 68 → 56 | 5,53 → 6,26 | 1,00 → 0,85 |
| Victor | 3,06 → 3,00 | 18,7° → 18,2° | 68 → 56 | 5,41 → 6,13 | 1,00 → 0,85 |
| Inaya | 3,10 → 3,07 | 17,8° → 17,5° | 69 → 56 | 5,16 → 5,99 | 1,00 → 0,85 |
| Kanya | 3,08 → 3,05 | 17,7° → 17,3° | 69 → 57 | 4,98 → 5,77 | 1,00 → 0,85 |

## 4. Techniques principales, chaque coach (discipline de référence)

| Technique | Coach | Pics hanches / épaules / extrémité (ms) avant | après | Arrêt (ms) | Vitesse (m/s) | Saut de vitesse | Rotation parasite |
|---|---|---|---|---|---|---|---|
| jab (boxing) | Kadir | 42 / 42 / 117 | 25 / 42 / 117 | 67 → 33 | 3,27 → 3,28 | 4,4 → 4,4 | 18,9° → 18,9° |
| jab (boxing) | Amara | 42 / 42 / 108 | 25 / 42 / 108 | 67 → 33 | 2,74 → 2,74 | 4,1 → 4,1 | 17,7° → 17,6° |
| jab (boxing) | Naël | 42 / 42 / 117 | 25 / 42 / 117 | 67 → 33 | 3,27 → 3,27 | 4,6 → 4,6 | 18,6° → 18,6° |
| jab (boxing) | Victor | 42 / 42 / 117 | 25 / 42 / 117 | 67 → 33 | 2,96 → 2,96 | 4,2 → 4,2 | 19,4° → 19,4° |
| jab (boxing) | Inaya | 42 / 42 / 108 | 25 / 42 / 108 | 67 → 33 | 2,91 → 2,91 | 4,3 → 4,3 | 17,5° → 17,5° |
| jab (boxing) | Kanya | 42 / 42 / 108 | 25 / 42 / 108 | 67 → 33 | 2,55 → 2,55 | 3,9 → 3,9 | 17,4° → 17,4° |
| direct (boxing) | Kadir | 50 / 50 / 150 | 25 / 50 / 150 | 92 → 50 | 5,18 → 5,18 | 1,8 → 1,8 | 16,1° → 16,1° |
| direct (boxing) | Amara | 50 / 50 / 150 | 25 / 50 / 150 | 92 → 50 | 4,67 → 4,67 | 1,7 → 1,7 | 17,2° → 17,2° |
| direct (boxing) | Naël | 50 / 50 / 150 | 25 / 50 / 150 | 92 → 50 | 5,09 → 5,09 | 1,8 → 1,8 | 16,5° → 16,6° |
| direct (boxing) | Victor | 50 / 50 / 150 | 25 / 50 / 150 | 92 → 50 | 5,06 → 5,06 | 1,8 → 1,8 | 15,5° → 15,5° |
| direct (boxing) | Inaya | 50 / 50 / 150 | 25 / 50 / 150 | 92 → 50 | 4,62 → 4,62 | 1,7 → 1,7 | 16,0° → 16,0° |
| direct (boxing) | Kanya | 50 / 50 / 150 | 25 / 50 / 150 | 92 → 50 | 4,54 → 4,54 | 1,7 → 1,7 | 15,2° → 15,2° |
| crochet-avant (boxing) | Kadir | 83 / 117 / 183 | 50 / 117 / 183 | 67 → 42 | 3,92 → 3,92 | 2,2 → 2,2 | 15,8° → 15,7° |
| crochet-avant (boxing) | Amara | 83 / 108 / 183 | 50 / 108 / 183 | 67 → 42 | 3,78 → 3,78 | 2,2 → 2,2 | 14,6° → 14,8° |
| crochet-avant (boxing) | Naël | 83 / 108 / 183 | 50 / 108 / 183 | 67 → 42 | 4,71 → 4,71 | 2,6 → 2,6 | 16,3° → 16,3° |
| crochet-avant (boxing) | Victor | 83 / 108 / 183 | 50 / 108 / 183 | 67 → 42 | 4,13 → 4,13 | 2,3 → 2,3 | 15,0° → 14,9° |
| crochet-avant (boxing) | Inaya | 83 / 108 / 183 | 50 / 108 / 183 | 67 → 42 | 3,66 → 3,66 | 2,1 → 2,1 | 14,5° → 14,7° |
| crochet-avant (boxing) | Kanya | 83 / 108 / 183 | 50 / 108 / 183 | 67 → 42 | 3,40 → 3,40 | 2,0 → 2,0 | 14,5° → 14,7° |
| crochet-arriere (boxing) | Kadir | 108 / 117 / 208 | 100 / 117 / 208 | 58 → 33 | 2,82 → 2,82 | 1,6 → 1,7 | 16,0° → 16,8° |
| crochet-arriere (boxing) | Amara | 108 / 117 / 208 | 100 / 117 / 208 | 58 → 33 | 2,28 → 2,28 | 1,4 → 1,6 | 18,6° → 18,8° |
| crochet-arriere (boxing) | Naël | 108 / 117 / 208 | 100 / 117 / 208 | 58 → 33 | 2,76 → 2,76 | 2,3 → 2,3 | 15,9° → 15,9° |
| crochet-arriere (boxing) | Victor | 108 / 117 / 208 | 100 / 117 / 208 | 58 → 33 | 2,73 → 2,73 | 2,2 → 2,2 | 15,4° → 15,6° |
| crochet-arriere (boxing) | Inaya | 108 / 117 / 208 | 100 / 117 / 208 | 58 → 33 | 2,26 → 2,26 | 1,3 → 1,7 | 20,3° → 20,6° |
| crochet-arriere (boxing) | Kanya | 108 / 117 / 208 | 100 / 117 / 208 | 58 → 33 | 2,20 → 2,20 | 1,3 → 1,7 | 19,4° → 19,4° |
| uppercut-avant (boxing) | Kadir | 142 / 158 / 225 | 150 / 158 / 225 | 83 → 50 | 4,17 → 4,58 | 1,9 → 2,2 | 15,4° → 21,6° |
| uppercut-avant (boxing) | Amara | 142 / 158 / 233 | 142 / 158 / 233 | 75 → 50 | 3,44 → 4,10 | 1,6 → 2,0 | 15,5° → 23,8° |
| uppercut-avant (boxing) | Naël | 142 / 158 / 233 | 142 / 158 / 233 | 83 → 50 | 4,70 → 5,09 | 2,1 → 2,3 | 18,2° → 25,4° |
| uppercut-avant (boxing) | Victor | 142 / 158 / 225 | 142 / 158 / 225 | 75 → 50 | 3,84 → 4,30 | 1,7 → 2,0 | 13,9° → 22,2° |
| uppercut-avant (boxing) | Inaya | 142 / 158 / 233 | 142 / 158 / 233 | 75 → 50 | 3,33 → 3,97 | 1,6 → 1,9 | 15,0° → 23,0° |
| uppercut-avant (boxing) | Kanya | 142 / 158 / 233 | 142 / 158 / 233 | 75 → 50 | 3,27 → 3,88 | 1,6 → 1,9 | 14,6° → 22,6° |
| uppercut-arriere (boxing) | Kadir | 150 / 158 / 242 | 150 / 158 / 233 | 83 → 58 | 5,01 → 5,03 | 2,3 → 2,3 | 18,0° → 17,7° |
| uppercut-arriere (boxing) | Amara | 150 / 158 / 250 | 150 / 158 / 233 | 83 → 50 | 4,34 → 4,16 | 2,0 → 2,0 | 15,1° → 12,1° |
| uppercut-arriere (boxing) | Naël | 150 / 158 / 242 | 150 / 158 / 233 | 83 → 58 | 4,96 → 4,90 | 2,2 → 2,2 | 17,2° → 15,4° |
| uppercut-arriere (boxing) | Victor | 150 / 158 / 242 | 150 / 158 / 225 | 83 → 58 | 4,85 → 4,74 | 2,2 → 2,2 | 16,9° → 15,8° |
| uppercut-arriere (boxing) | Inaya | 150 / 158 / 250 | 150 / 158 / 233 | 83 → 50 | 4,30 → 4,10 | 2,0 → 1,9 | 17,5° → 13,7° |
| uppercut-arriere (boxing) | Kanya | 150 / 158 / 250 | 150 / 158 / 233 | 83 → 50 | 4,19 → 4,00 | 2,0 → 1,9 | 15,0° → 12,0° |
| overhand (kickboxing) | Kadir | 258 / 267 / 267 | 258 / 267 / 267 | 83 → 50 | 5,06 → 4,54 | 2,7 → 2,0 | 53,7° → 31,4° |
| overhand (kickboxing) | Amara | 258 / 283 / 267 | 258 / 267 / 267 | 92 → 58 | 4,52 → 3,92 | 1,9 → 1,7 | 27,9° → 23,6° |
| overhand (kickboxing) | Naël | 258 / 283 / 267 | 258 / 275 / 267 | 92 → 50 | 5,22 → 4,67 | 2,1 → 2,0 | 43,6° → 34,5° |
| overhand (kickboxing) | Victor | 258 / 292 / 267 | 258 / 275 / 267 | 83 → 50 | 5,20 → 4,65 | 2,1 → 2,0 | 48,7° → 35,4° |
| overhand (kickboxing) | Inaya | 258 / 283 / 267 | 258 / 267 / 267 | 92 → 58 | 4,53 → 3,92 | 1,9 → 1,7 | 27,4° → 23,9° |
| overhand (kickboxing) | Kanya | 258 / 283 / 267 | 258 / 267 / 267 | 92 → 58 | 4,39 → 3,80 | 1,9 → 1,7 | 27,6° → 23,5° |
| teep-avant (muaythai) | Kadir | 92 / 92 / 275 | 92 / 92 / 292 | 0 → 0 | 5,86 → 7,68 | 2,9 → 3,6 | 31,4° → 31,4° |
| teep-avant (muaythai) | Amara | 92 / 92 / 275 | 92 / 92 / 292 | 108 → 0 | 5,38 → 7,15 | 2,8 → 3,7 | 31,4° → 31,4° |
| teep-avant (muaythai) | Naël | 92 / 92 / 275 | 92 / 92 / 292 | 0 → 0 | 5,85 → 7,68 | 2,7 → 3,6 | 29,5° → 29,5° |
| teep-avant (muaythai) | Victor | 92 / 92 / 275 | 92 / 92 / 292 | 0 → 0 | 5,85 → 7,68 | 3,3 → 3,6 | 34,2° → 34,2° |
| teep-avant (muaythai) | Inaya | 92 / 92 / 275 | 92 / 92 / 292 | 0 → 0 | 5,68 → 7,61 | 2,7 → 3,9 | 30,9° → 30,9° |
| teep-avant (muaythai) | Kanya | 92 / 92 / 275 | 92 / 92 / 292 | 0 → 0 | 5,46 → 7,29 | 2,7 → 3,8 | 30,8° → 30,8° |
| front-kick-avant (kickboxing) | Kadir | 92 / 92 / 275 | 92 / 92 / 292 | 0 → 0 | 6,09 → 8,32 | 2,8 → 3,9 | 21,0° → 18,9° |
| front-kick-avant (kickboxing) | Amara | 92 / 92 / 275 | 92 / 92 / 300 | 0 → 0 | 6,15 → 8,54 | 2,9 → 4,1 | 19,8° → 18,3° |
| front-kick-avant (kickboxing) | Naël | 92 / 92 / 275 | 92 / 92 / 292 | 0 → 0 | 6,15 → 8,43 | 2,8 → 3,9 | 21,4° → 19,2° |
| front-kick-avant (kickboxing) | Victor | 92 / 92 / 275 | 92 / 92 / 292 | 0 → 0 | 6,13 → 8,39 | 2,8 → 3,9 | 21,2° → 19,1° |
| front-kick-avant (kickboxing) | Inaya | 92 / 92 / 275 | 92 / 92 / 300 | 0 → 0 | 6,15 → 8,53 | 2,9 → 4,1 | 19,9° → 18,4° |
| front-kick-avant (kickboxing) | Kanya | 92 / 92 / 275 | 92 / 92 / 300 | 0 → 0 | 5,94 → 8,22 | 2,9 → 4,1 | 19,7° → 18,2° |
| middle-kick-arriere (muaythai) | Kadir | 275 / 275 / 267 | 275 / 275 / 267 | 33 → 25 | 6,21 → 8,30 | 4,7 → 6,2 | 38,3° → 38,3° |
| middle-kick-arriere (muaythai) | Amara | 275 / 275 / 267 | 275 / 275 / 267 | 33 → 25 | 5,66 → 7,77 | 5,2 → 6,3 | 33,3° → 33,3° |
| middle-kick-arriere (muaythai) | Naël | 275 / 275 / 267 | 275 / 275 / 267 | 33 → 25 | 6,18 → 8,32 | 4,7 → 6,2 | 35,6° → 35,6° |
| middle-kick-arriere (muaythai) | Victor | 275 / 275 / 267 | 275 / 275 / 267 | 33 → 25 | 6,19 → 8,30 | 4,8 → 6,2 | 36,9° → 36,9° |
| middle-kick-arriere (muaythai) | Inaya | 275 / 275 / 267 | 275 / 275 / 267 | 33 → 25 | 5,82 → 8,03 | 5,1 → 6,4 | 34,8° → 34,8° |
| middle-kick-arriere (muaythai) | Kanya | 275 / 275 / 267 | 275 / 275 / 267 | 33 → 25 | 5,63 → 7,75 | 5,1 → 6,4 | 34,9° → 34,9° |
| high-kick-avant (muaythai) | Kadir | 233 / 233 / 333 | 233 / 233 / 350 | 0 → 0 | 10,89 → 15,38 | 11,1 → 6,8 | 55,8° → 37,8° |
| high-kick-avant (muaythai) | Amara | 233 / 233 / 333 | 233 / 233 / 350 | 0 → 0 | 10,69 → 15,81 | 11,1 → 7,2 | 53,6° → 38,3° |
| high-kick-avant (muaythai) | Naël | 233 / 233 / 333 | 233 / 233 / 350 | 0 → 0 | 10,80 → 15,40 | 12,1 → 6,8 | 58,0° → 39,1° |
| high-kick-avant (muaythai) | Victor | 233 / 233 / 333 | 233 / 233 / 350 | 0 → 0 | 10,83 → 15,38 | 12,0 → 6,8 | 58,0° → 39,1° |
| high-kick-avant (muaythai) | Inaya | 233 / 233 / 333 | 233 / 233 / 350 | 0 → 0 | 10,69 → 15,80 | 11,0 → 7,1 | 53,4° → 38,3° |
| high-kick-avant (muaythai) | Kanya | 233 / 233 / 333 | 233 / 233 / 350 | 0 → 0 | 10,38 → 15,29 | 10,7 → 7,0 | 53,2° → 38,2° |
| high-kick-arriere (muaythai) | Kadir | 275 / 275 / 267 | 275 / 275 / 267 | 25 → 25 | 7,13 → 9,94 | 8,2 → 7,0 | 45,1° → 32,1° |
| high-kick-arriere (muaythai) | Amara | 275 / 275 / 267 | 275 / 275 / 267 | 25 → 25 | 6,64 → 9,90 | 8,3 → 7,4 | 42,4° → 31,7° |
| high-kick-arriere (muaythai) | Naël | 275 / 275 / 267 | 275 / 275 / 267 | 25 → 25 | 7,11 → 9,97 | 7,6 → 7,0 | 47,7° → 32,5° |
| high-kick-arriere (muaythai) | Victor | 275 / 275 / 267 | 275 / 275 / 267 | 25 → 25 | 7,12 → 9,95 | 7,6 → 7,0 | 47,6° → 32,5° |
| high-kick-arriere (muaythai) | Inaya | 275 / 275 / 267 | 275 / 275 / 267 | 25 → 25 | 6,89 → 10,15 | 8,3 → 7,5 | 42,4° → 31,7° |
| high-kick-arriere (muaythai) | Kanya | 275 / 275 / 267 | 275 / 275 / 267 | 25 → 25 | 6,68 → 9,82 | 8,2 → 7,4 | 42,4° → 31,6° |
| low-kick-arriere (muaythai) | Kadir | 275 / 83 / 267 | 275 / 83 / 267 | 42 → 33 | 3,69 → 4,15 | 4,0 → 3,9 | 30,3° → 30,3° |
| low-kick-arriere (muaythai) | Amara | 275 / 83 / 267 | 275 / 83 / 267 | 33 → 33 | 3,74 → 4,95 | 4,7 → 4,4 | 25,4° → 25,4° |
| low-kick-arriere (muaythai) | Naël | 275 / 83 / 267 | 275 / 83 / 267 | 42 → 33 | 3,65 → 4,30 | 3,9 → 3,8 | 26,8° → 26,8° |
| low-kick-arriere (muaythai) | Victor | 275 / 83 / 267 | 275 / 83 / 267 | 42 → 33 | 3,59 → 4,18 | 3,7 → 3,7 | 27,8° → 27,8° |
| low-kick-arriere (muaythai) | Inaya | 275 / 83 / 267 | 275 / 83 / 267 | 33 → 33 | 3,76 → 4,94 | 4,7 → 4,4 | 25,6° → 25,6° |
| low-kick-arriere (muaythai) | Kanya | 275 / 83 / 267 | 275 / 83 / 267 | 33 → 33 | 3,62 → 4,75 | 4,6 → 4,2 | 25,9° → 25,9° |
| genou-direct-arriere (muaythai) | Kadir | 83 / 83 / 325 | 83 / 83 / 325 | 150 → 150 | 8,66 → 8,66 | 5,5 → 5,5 | 31,5° → 31,5° |
| genou-direct-arriere (muaythai) | Amara | 83 / 83 / 325 | 83 / 83 / 325 | 150 → 150 | 8,59 → 8,59 | 5,3 → 5,3 | 27,0° → 27,0° |
| genou-direct-arriere (muaythai) | Naël | 83 / 83 / 325 | 83 / 83 / 325 | 150 → 150 | 9,01 → 9,01 | 5,6 → 5,6 | 32,5° → 32,5° |
| genou-direct-arriere (muaythai) | Victor | 83 / 83 / 325 | 83 / 83 / 325 | 150 → 150 | 8,79 → 8,79 | 5,6 → 5,6 | 32,2° → 32,2° |
| genou-direct-arriere (muaythai) | Inaya | 83 / 83 / 325 | 83 / 83 / 325 | 150 → 150 | 8,31 → 8,31 | 5,1 → 5,1 | 27,0° → 27,0° |
| genou-direct-arriere (muaythai) | Kanya | 83 / 83 / 325 | 83 / 83 / 325 | 150 → 150 | 8,04 → 8,04 | 5,1 → 5,1 | 27,0° → 27,0° |
| coude-horizontal-arriere (muaythai) | Kadir | 150 / 158 / 242 | 150 / 158 / 242 | 83 → 50 | 7,11 → 7,11 | 3,3 → 3,3 | 24,1° → 24,1° |
| coude-horizontal-arriere (muaythai) | Amara | 150 / 158 / 233 | 150 / 158 / 233 | 92 → 50 | 6,05 → 6,05 | 2,9 → 2,9 | 26,2° → 26,2° |
| coude-horizontal-arriere (muaythai) | Naël | 150 / 158 / 233 | 150 / 158 / 233 | 92 → 50 | 7,12 → 7,12 | 3,3 → 3,3 | 24,3° → 24,3° |
| coude-horizontal-arriere (muaythai) | Victor | 150 / 158 / 242 | 150 / 158 / 242 | 83 → 50 | 7,11 → 7,11 | 3,3 → 3,3 | 23,8° → 23,8° |
| coude-horizontal-arriere (muaythai) | Inaya | 150 / 158 / 233 | 150 / 158 / 233 | 92 → 50 | 6,02 → 6,02 | 2,9 → 2,9 | 26,3° → 26,3° |
| coude-horizontal-arriere (muaythai) | Kanya | 150 / 158 / 233 | 150 / 158 / 233 | 92 → 50 | 5,87 → 5,87 | 2,9 → 2,9 | 26,1° → 26,1° |

## 5. Anomalies restantes les plus fortes (après)

| Technique | Coach | Discipline | Saut de vitesse (articulation, instant) | Rotation parasite (articulation) | Glissement du pied (cm/image) |
|---|---|---|---|---|---|
| sprawl | Kadir | mma | 42,6 (RightForeArm, 0,20 s) | 162,6° (coude D) | 1,4 |
| ukemi-yoko | Naël | judo | 25,9 (RightForeArm, 2,05 s) | 169,5° (coude G) | 2,2 |
| ukemi-yoko | Kadir | judo | 25,8 (RightForeArm, 2,05 s) | 169,5° (coude G) | 2,3 |
| ukemi-yoko | Victor | judo | 25,8 (RightForeArm, 2,05 s) | 169,5° (coude G) | 2,2 |
| uchikomi-o-soto-gari | Inaya | judo | 25,2 (RightLeg, 0,68 s) | 88,8° (genou D) | 0,7 |
| uchikomi-o-soto-gari | Kanya | judo | 25,0 (RightLeg, 0,67 s) | 89,6° (genou D) | 0,6 |
| uchikomi-o-soto-gari | Amara | judo | 25,0 (RightLeg, 0,68 s) | 89,4° (genou D) | 0,7 |
| uchikomi-o-soto-gari | Kadir | judo | 24,9 (RightLeg, 0,63 s) | 82,8° (genou D) | 0,6 |
| ukemi-yoko | Amara | judo | 24,6 (LeftForeArm, 3,21 s) | 166,1° (coude G) | 3,1 |
| ukemi-yoko | Inaya | judo | 24,6 (LeftForeArm, 3,21 s) | 166,1° (coude G) | 3,1 |
| ukemi-yoko | Kanya | judo | 24,4 (LeftForeArm, 3,21 s) | 166,2° (coude G) | 2,1 |
| uchikomi-o-soto-gari | Victor | judo | 24,0 (RightLeg, 0,64 s) | 85,0° (genou D) | 0,6 |
| uchikomi-o-soto-gari | Naël | judo | 23,9 (RightLeg, 0,65 s) | 85,9° (genou D) | 0,6 |
| sprawl | Victor | mma | 20,4 (LeftLeg, 0,32 s) | 112,7° (coude D) | 1,4 |
| sit-out | Amara | bjj | 15,2 (RightLeg, 1,16 s) | 34,6° (genou D) | 13,7 |
| sit-out | Amara | mma | 15,2 (RightLeg, 1,16 s) | 34,6° (genou D) | 13,7 |
| sit-out | Inaya | bjj | 15,2 (RightLeg, 1,16 s) | 34,5° (genou D) | 13,7 |
| sit-out | Inaya | mma | 15,2 (RightLeg, 1,16 s) | 34,5° (genou D) | 13,7 |
| sit-out | Kanya | bjj | 15,1 (RightLeg, 1,17 s) | 34,2° (genou D) | 13,3 |
| sit-out | Kanya | mma | 15,1 (RightLeg, 1,17 s) | 34,2° (genou D) | 13,3 |
| sprawl | Kanya | mma | 14,7 (LeftLeg, 0,32 s) | 28,5° (genou G) | 3,4 |
| sprawl | Inaya | mma | 14,2 (LeftLeg, 0,32 s) | 28,8° (genou G) | 3,5 |
| genou-direct-arriere | Kadir | mma | 13,9 (RightForeArm, 0,16 s) | 43,4° (coude D) | 0,3 |
| sprawl | Amara | mma | 13,3 (LeftLeg, 0,32 s) | 28,9° (genou G) | 3,4 |
| sit-out | Naël | bjj | 13,3 (RightLeg, 1,16 s) | 31,4° (genou D) | 13,2 |

## 6. Enchaînements

| Coach | Discipline | Enchaînement | Saut de vitesse avant → après | Écarts entre impacts (ms) avant | après |
|---|---|---|---|---|---|
| Kadir | boxing | jab + direct + crochet-avant + direct | 4,4 → 4,4 | 283, 358, 308, 283 | 242, 317, 283, 242 |
| Kadir | boxing | jab + uppercut-arriere + crochet-avant | 4,4 → 4,4 | 375, 342, 267 | 333, 317, 242 |
| Kadir | boxing | esquive-gauche + crochet-avant + direct | 2,2 → 2,2 | 308 | 283 |
| Kadir | kickboxing | jab + direct + low-kick-arriere | 4,3 → 4,0 | 283, 592, 500 | 242, 550, 500 |
| Kadir | kickboxing | jab + direct + crochet-avant + middle-kick-arriere | 5,1 → 6,3 | 283, 358, 575, 500 | 242, 317, 550, 500 |
| Kadir | muaythai | teep-avant + direct + middle-kick-arriere | 4,7 → 6,2 | 492, 592 | 492, 550, 692 |
| Kadir | muaythai | jab + direct + genou-direct-arriere | 5,5 → 5,5 | 283, 492, 417 | 242, 450, 417 |
| Kadir | mma | jab + direct + entree-lutte | 4,5 → 4,7 | 283, 675, 917 | 242, 633, 917 |
| Kadir | mma | pas-avant + jab + direct | 4,5 → 4,7 | 283 | 242 |
| Amara | boxing | jab + direct + crochet-avant + direct | 4,1 → 4,1 | 283, 358, 308, 283 | 242, 317, 283, 242 |
| Amara | boxing | jab + uppercut-arriere + crochet-avant | 4,1 → 4,1 | 375, 342, 267 | 333, 317, 242 |
| Amara | boxing | esquive-gauche + crochet-avant + direct | 2,2 → 2,2 | 308 | 283 |
| Amara | kickboxing | jab + direct + low-kick-arriere | 5,0 → 4,5 | 283, 592, 500 | 242, 550, 500 |
| Amara | kickboxing | jab + direct + crochet-avant + middle-kick-arriere | 5,3 → 6,8 | 283, 358, 575, 500 | 242, 317, 550, 500 |
| Amara | muaythai | teep-avant + direct + middle-kick-arriere | 5,2 → 6,3 | 492, 592 | 492, 550, 692 |
| Amara | muaythai | jab + direct + genou-direct-arriere | 5,3 → 5,3 | 283, 492, 417 | 242, 450, 417 |
| Amara | mma | jab + direct + entree-lutte | 4,1 → 4,1 | 283, 675, 917 | 242, 633, 917 |
| Amara | mma | pas-avant + jab + direct | 3,2 → 3,2 | 283 | 242 |
| Naël | boxing | jab + direct + crochet-avant + direct | 4,6 → 4,6 | 283, 358, 308, 283 | 242, 317, 283, 242 |
| Naël | boxing | jab + uppercut-arriere + crochet-avant | 4,6 → 4,6 | 375, 342, 267 | 333, 317, 242 |
| Naël | boxing | esquive-gauche + crochet-avant + direct | 2,6 → 2,6 | 308 | 283 |
| Naël | kickboxing | jab + direct + low-kick-arriere | 4,3 → 4,2 | 283, 592, 500 | 242, 550, 500 |
| Naël | kickboxing | jab + direct + crochet-avant + middle-kick-arriere | 5,0 → 6,3 | 283, 358, 575, 500 | 242, 317, 550, 500 |
| Naël | muaythai | teep-avant + direct + middle-kick-arriere | 4,7 → 6,2 | 492, 592 | 492, 550, 692 |
| Naël | muaythai | jab + direct + genou-direct-arriere | 5,6 → 5,6 | 283, 492, 417 | 242, 450, 417 |
| Naël | mma | jab + direct + entree-lutte | 4,1 → 4,2 | 283, 675, 917 | 242, 633, 917 |
| Naël | mma | pas-avant + jab + direct | 4,1 → 4,2 | 283 | 242 |
| Victor | boxing | jab + direct + crochet-avant + direct | 4,2 → 4,2 | 283, 358, 308, 283 | 242, 317, 283, 242 |
| Victor | boxing | jab + uppercut-arriere + crochet-avant | 4,2 → 4,2 | 375, 342, 267 | 333, 317, 242 |
| Victor | boxing | esquive-gauche + crochet-avant + direct | 2,3 → 2,3 | 308 | 283 |
| Victor | kickboxing | jab + direct + low-kick-arriere | 4,1 → 3,9 | 283, 592, 500 | 242, 550, 500 |
| Victor | kickboxing | jab + direct + crochet-avant + middle-kick-arriere | 5,2 → 6,3 | 283, 358, 575, 500 | 242, 317, 550, 500 |
| Victor | muaythai | teep-avant + direct + middle-kick-arriere | 4,8 → 6,2 | 492, 592 | 492, 550, 692 |
| Victor | muaythai | jab + direct + genou-direct-arriere | 5,6 → 5,6 | 283, 492, 417 | 242, 450, 417 |
| Victor | mma | jab + direct + entree-lutte | 3,7 → 3,7 | 283, 675, 917 | 242, 633, 917 |
| Victor | mma | pas-avant + jab + direct | 3,6 → 3,6 | 283 | 242 |
| Inaya | boxing | jab + direct + crochet-avant + direct | 4,3 → 4,3 | 283, 358, 308, 283 | 242, 317, 283, 242 |
| Inaya | boxing | jab + uppercut-arriere + crochet-avant | 4,3 → 4,3 | 375, 342, 267 | 333, 317, 242 |
| Inaya | boxing | esquive-gauche + crochet-avant + direct | 2,1 → 2,1 | 308 | 283 |
| Inaya | kickboxing | jab + direct + low-kick-arriere | 5,0 → 4,5 | 283, 592, 500 | 242, 550, 500 |
| Inaya | kickboxing | jab + direct + crochet-avant + middle-kick-arriere | 5,3 → 6,7 | 283, 358, 575, 500 | 242, 317, 550, 500 |
| Inaya | muaythai | teep-avant + direct + middle-kick-arriere | 5,1 → 6,4 | 492, 592 | 492, 550, 692 |
| Inaya | muaythai | jab + direct + genou-direct-arriere | 5,1 → 5,1 | 283, 492, 417 | 242, 450, 417 |
| Inaya | mma | jab + direct + entree-lutte | 4,2 → 4,2 | 283, 675, 917 | 242, 633, 917 |
| Inaya | mma | pas-avant + jab + direct | 3,1 → 3,1 | 283 | 242 |
| Kanya | boxing | jab + direct + crochet-avant + direct | 3,9 → 3,9 | 283, 358, 308, 283 | 242, 317, 283, 242 |
| Kanya | boxing | jab + uppercut-arriere + crochet-avant | 3,9 → 3,9 | 375, 342, 267 | 333, 317, 242 |
| Kanya | boxing | esquive-gauche + crochet-avant + direct | 2,0 → 2,0 | 308 | 283 |
| Kanya | kickboxing | jab + direct + low-kick-arriere | 4,9 → 4,4 | 283, 592, 500 | 242, 550, 500 |
| Kanya | kickboxing | jab + direct + crochet-avant + middle-kick-arriere | 5,3 → 6,7 | 283, 358, 575, 500 | 242, 317, 550, 500 |
| Kanya | muaythai | teep-avant + direct + middle-kick-arriere | 5,1 → 6,4 | 492, 592 | 492, 550, 692 |
| Kanya | muaythai | jab + direct + genou-direct-arriere | 5,1 → 5,1 | 283, 492, 417 | 242, 450, 417 |
| Kanya | mma | jab + direct + entree-lutte | 4,1 → 4,1 | 283, 675, 917 | 242, 633, 917 |
| Kanya | mma | pas-avant + jab + direct | 2,9 → 2,9 | 283 | 242 |
