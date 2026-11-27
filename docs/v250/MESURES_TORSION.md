# Mesures des os de torsion et des corrections de volume (2.5.0)

Fichier produit par `src/three/__tests__/torsion-v250.test.ts` (ne pas modifier à la main).

Pour chaque coach, chaque mouvement (images à 20 par seconde, vrai moteur) et chaque articulation (gauche et droite) :
l'écart le plus grand entre le volume de l'articulation et son volume au repos (0 % = volume gardé), puis le plus petit
volume atteint (100 % = celui du repos). Avant = poids de peau du modèle chargé ; après = os de torsion et demi-os.

| Articulation | Écart moyen avant | Écart moyen après |
|---|---|---|
| épaule | 44,0 % | 20,1 % |
| coude | 35,2 % | 21,9 % |
| poignet | 5,0 % | 4,3 % |
| hanche | 34,5 % | 13,2 % |
| genou | 22,1 % | 9,0 % |

| Coach | Mouvement | Articulation | Écart avant | Écart après | Volume mini avant | Volume mini après |
|---|---|---|---|---|---|---|
| mma-kadir | garde | épaule | 52,6 % | 25,0 % | 47,4 % | 75,0 % |
| mma-kadir | garde | coude | 37,6 % | 27,5 % | 62,4 % | 72,5 % |
| mma-kadir | garde | poignet | 2,1 % | 2,1 % | 97,9 % | 97,9 % |
| mma-kadir | garde | hanche | 13,8 % | 2,1 % | 86,2 % | 101,7 % |
| mma-kadir | garde | genou | 13,0 % | 1,5 % | 87,0 % | 99,2 % |
| mma-kadir | crochet | épaule | 58,3 % | 32,3 % | 41,7 % | 67,7 % |
| mma-kadir | crochet | coude | 37,6 % | 27,5 % | 62,4 % | 72,5 % |
| mma-kadir | crochet | poignet | 4,9 % | 3,2 % | 95,1 % | 96,8 % |
| mma-kadir | crochet | hanche | 15,3 % | 4,8 % | 84,7 % | 100,7 % |
| mma-kadir | crochet | genou | 15,4 % | 1,5 % | 84,6 % | 98,6 % |
| mma-kadir | coup de pied haut | épaule | 53,8 % | 29,8 % | 46,2 % | 70,2 % |
| mma-kadir | coup de pied haut | coude | 41,5 % | 32,3 % | 58,5 % | 67,7 % |
| mma-kadir | coup de pied haut | poignet | 2,5 % | 2,5 % | 97,5 % | 97,5 % |
| mma-kadir | coup de pied haut | hanche | 46,5 % | 7,9 % | 53,5 % | 93,9 % |
| mma-kadir | coup de pied haut | genou | 35,1 % | 15,7 % | 64,9 % | 84,3 % |
| mma-kadir | sprawl | épaule | 70,1 % | 19,8 % | 29,9 % | 86,4 % |
| mma-kadir | sprawl | coude | 31,9 % | 21,9 % | 68,1 % | 78,1 % |
| mma-kadir | sprawl | poignet | 12,5 % | 12,0 % | 87,5 % | 88,0 % |
| mma-kadir | sprawl | hanche | 64,9 % | 15,9 % | 35,1 % | 84,1 % |
| mma-kadir | sprawl | genou | 44,3 % | 25,0 % | 55,7 % | 75,0 % |
| mma-amara | garde | épaule | 12,9 % | 4,1 % | 87,1 % | 100,4 % |
| mma-amara | garde | coude | 29,6 % | 14,2 % | 70,4 % | 85,8 % |
| mma-amara | garde | poignet | 1,9 % | 1,7 % | 101,7 % | 101,6 % |
| mma-amara | garde | hanche | 12,6 % | 5,7 % | 87,4 % | 94,3 % |
| mma-amara | garde | genou | 3,9 % | 4,1 % | 96,1 % | 103,6 % |
| mma-amara | crochet | épaule | 12,9 % | 4,4 % | 87,1 % | 99,1 % |
| mma-amara | crochet | coude | 29,5 % | 14,1 % | 70,5 % | 85,9 % |
| mma-amara | crochet | poignet | 1,9 % | 1,7 % | 98,2 % | 101,0 % |
| mma-amara | crochet | hanche | 16,5 % | 6,4 % | 83,5 % | 93,6 % |
| mma-amara | crochet | genou | 5,5 % | 4,1 % | 94,5 % | 103,2 % |
| mma-amara | coup de pied haut | épaule | 13,4 % | 8,3 % | 86,6 % | 91,7 % |
| mma-amara | coup de pied haut | coude | 32,2 % | 16,6 % | 67,8 % | 83,4 % |
| mma-amara | coup de pied haut | poignet | 1,9 % | 1,7 % | 101,8 % | 101,6 % |
| mma-amara | coup de pied haut | hanche | 48,2 % | 25,2 % | 51,8 % | 74,8 % |
| mma-amara | coup de pied haut | genou | 25,8 % | 6,8 % | 74,2 % | 93,2 % |
| mma-amara | sprawl | épaule | 32,6 % | 24,8 % | 67,4 % | 99,1 % |
| mma-amara | sprawl | coude | 23,4 % | 9,4 % | 76,6 % | 90,6 % |
| mma-amara | sprawl | poignet | 11,7 % | 8,5 % | 88,3 % | 91,5 % |
| mma-amara | sprawl | hanche | 59,1 % | 36,2 % | 40,9 % | 63,8 % |
| mma-amara | sprawl | genou | 31,0 % | 11,2 % | 69,0 % | 88,8 % |
| nael | garde | épaule | 53,9 % | 30,4 % | 46,1 % | 69,6 % |
| nael | garde | coude | 39,2 % | 29,7 % | 60,8 % | 70,3 % |
| nael | garde | poignet | 2,6 % | 2,6 % | 97,4 % | 97,4 % |
| nael | garde | hanche | 12,9 % | 3,1 % | 87,1 % | 101,8 % |
| nael | garde | genou | 10,7 % | 2,7 % | 89,3 % | 100,9 % |
| nael | crochet | épaule | 59,2 % | 37,6 % | 40,8 % | 62,4 % |
| nael | crochet | coude | 39,2 % | 29,7 % | 60,8 % | 70,3 % |
| nael | crochet | poignet | 5,0 % | 3,3 % | 95,0 % | 96,7 % |
| nael | crochet | hanche | 14,8 % | 5,4 % | 85,2 % | 101,2 % |
| nael | crochet | genou | 12,3 % | 2,7 % | 87,7 % | 100,4 % |
| nael | coup de pied haut | épaule | 54,5 % | 32,9 % | 45,5 % | 67,1 % |
| nael | coup de pied haut | coude | 42,0 % | 33,8 % | 58,0 % | 66,2 % |
| nael | coup de pied haut | poignet | 2,6 % | 2,5 % | 97,4 % | 97,5 % |
| nael | coup de pied haut | hanche | 44,4 % | 9,1 % | 55,6 % | 96,3 % |
| nael | coup de pied haut | genou | 33,1 % | 13,2 % | 66,9 % | 86,8 % |
| nael | sprawl | épaule | 62,9 % | 21,5 % | 37,1 % | 78,5 % |
| nael | sprawl | coude | 35,6 % | 23,7 % | 64,4 % | 76,3 % |
| nael | sprawl | poignet | 12,6 % | 12,1 % | 87,4 % | 87,9 % |
| nael | sprawl | hanche | 61,7 % | 12,8 % | 38,3 % | 87,2 % |
| nael | sprawl | genou | 42,0 % | 21,5 % | 58,0 % | 78,5 % |
| inaya | garde | épaule | 30,6 % | 8,7 % | 69,4 % | 91,3 % |
| inaya | garde | coude | 33,6 % | 18,9 % | 66,4 % | 81,1 % |
| inaya | garde | poignet | 2,0 % | 1,8 % | 101,7 % | 101,7 % |
| inaya | garde | hanche | 14,2 % | 6,4 % | 85,8 % | 93,6 % |
| inaya | garde | genou | 5,1 % | 3,7 % | 94,9 % | 103,2 % |
| inaya | crochet | épaule | 34,2 % | 12,5 % | 65,8 % | 87,5 % |
| inaya | crochet | coude | 33,5 % | 18,8 % | 66,5 % | 81,2 % |
| inaya | crochet | poignet | 2,0 % | 1,8 % | 98,1 % | 100,9 % |
| inaya | crochet | hanche | 18,2 % | 7,1 % | 81,8 % | 92,9 % |
| inaya | crochet | genou | 6,7 % | 3,7 % | 93,3 % | 102,3 % |
| inaya | coup de pied haut | épaule | 35,5 % | 15,4 % | 64,5 % | 84,6 % |
| inaya | coup de pied haut | coude | 36,5 % | 21,8 % | 63,5 % | 78,2 % |
| inaya | coup de pied haut | poignet | 2,0 % | 1,8 % | 101,9 % | 101,7 % |
| inaya | coup de pied haut | hanche | 48,5 % | 26,0 % | 51,5 % | 74,0 % |
| inaya | coup de pied haut | genou | 26,1 % | 7,3 % | 73,9 % | 92,7 % |
| inaya | sprawl | épaule | 46,3 % | 13,2 % | 53,7 % | 94,7 % |
| inaya | sprawl | coude | 26,3 % | 12,9 % | 73,7 % | 87,1 % |
| inaya | sprawl | poignet | 13,0 % | 9,9 % | 87,0 % | 90,1 % |
| inaya | sprawl | hanche | 59,6 % | 37,3 % | 40,4 % | 62,7 % |
| inaya | sprawl | genou | 32,1 % | 12,8 % | 67,9 % | 87,2 % |
| victor | garde | épaule | 52,8 % | 27,8 % | 47,2 % | 72,2 % |
| victor | garde | coude | 42,7 % | 26,6 % | 57,3 % | 73,4 % |
| victor | garde | poignet | 2,0 % | 1,9 % | 98,0 % | 98,1 % |
| victor | garde | hanche | 13,3 % | 2,8 % | 86,7 % | 102,2 % |
| victor | garde | genou | 14,9 % | 1,9 % | 85,1 % | 98,1 % |
| victor | crochet | épaule | 58,1 % | 34,7 % | 41,9 % | 65,3 % |
| victor | crochet | coude | 42,7 % | 26,6 % | 57,3 % | 73,4 % |
| victor | crochet | poignet | 4,3 % | 2,8 % | 95,7 % | 97,2 % |
| victor | crochet | hanche | 15,2 % | 5,6 % | 84,8 % | 101,7 % |
| victor | crochet | genou | 16,8 % | 2,6 % | 83,2 % | 97,4 % |
| victor | coup de pied haut | épaule | 53,3 % | 30,7 % | 46,7 % | 69,3 % |
| victor | coup de pied haut | coude | 45,4 % | 29,7 % | 54,6 % | 70,3 % |
| victor | coup de pied haut | poignet | 1,9 % | 1,9 % | 98,1 % | 98,1 % |
| victor | coup de pied haut | hanche | 45,7 % | 9,3 % | 54,3 % | 95,2 % |
| victor | coup de pied haut | genou | 38,9 % | 18,7 % | 61,1 % | 81,3 % |
| victor | sprawl | épaule | 65,2 % | 20,4 % | 34,8 % | 80,8 % |
| victor | sprawl | coude | 36,8 % | 20,1 % | 63,2 % | 79,9 % |
| victor | sprawl | poignet | 12,4 % | 12,3 % | 87,6 % | 87,7 % |
| victor | sprawl | hanche | 62,8 % | 11,4 % | 37,2 % | 88,6 % |
| victor | sprawl | genou | 48,5 % | 28,8 % | 51,5 % | 71,2 % |
| kanya | garde | épaule | 29,6 % | 7,4 % | 70,4 % | 92,6 % |
| kanya | garde | coude | 33,0 % | 18,3 % | 67,0 % | 81,7 % |
| kanya | garde | poignet | 2,0 % | 1,8 % | 101,7 % | 101,7 % |
| kanya | garde | hanche | 13,8 % | 6,4 % | 86,2 % | 93,6 % |
| kanya | garde | genou | 5,0 % | 3,7 % | 95,0 % | 103,2 % |
| kanya | crochet | épaule | 32,9 % | 10,8 % | 67,1 % | 89,2 % |
| kanya | crochet | coude | 32,8 % | 18,2 % | 67,2 % | 81,8 % |
| kanya | crochet | poignet | 2,0 % | 1,8 % | 98,1 % | 100,9 % |
| kanya | crochet | hanche | 17,8 % | 7,1 % | 82,2 % | 92,9 % |
| kanya | crochet | genou | 6,8 % | 3,7 % | 93,2 % | 102,3 % |
| kanya | coup de pied haut | épaule | 35,3 % | 15,4 % | 64,7 % | 84,6 % |
| kanya | coup de pied haut | coude | 35,9 % | 21,1 % | 64,1 % | 78,9 % |
| kanya | coup de pied haut | poignet | 2,0 % | 1,8 % | 101,9 % | 101,7 % |
| kanya | coup de pied haut | hanche | 48,4 % | 25,9 % | 51,6 % | 74,1 % |
| kanya | coup de pied haut | genou | 25,9 % | 7,2 % | 74,1 % | 92,8 % |
| kanya | sprawl | épaule | 45,5 % | 13,5 % | 54,5 % | 95,0 % |
| kanya | sprawl | coude | 25,5 % | 12,3 % | 74,5 % | 87,7 % |
| kanya | sprawl | poignet | 13,0 % | 10,0 % | 87,0 % | 90,0 % |
| kanya | sprawl | hanche | 60,0 % | 37,7 % | 40,0 % | 62,3 % |
| kanya | sprawl | genou | 32,2 % | 12,9 % | 67,8 % | 87,1 % |

Points dont les poids changent : mma-kadir 18,7 %, mma-amara 12,3 %, nael 18,7 %, inaya 25,3 %, victor 18,7 %, kanya 23,9 %.
Os de la peau (corps) : mma-kadir 80 → 102, mma-amara 81 → 103, nael 80 → 102, inaya 80 → 102, victor 80 → 102, kanya 80 → 102 ; même nombre d’influences par point (4) : le calcul de la peau par la carte graphique ne change pas.
Suivi des 22 os d’aide, par image (Node, cette machine) : mma-kadir 22 µs, mma-amara 15 µs, nael 5 µs, inaya 9 µs, victor 10 µs, kanya 9 µs (une image à 60 i/s dure 16 667 µs).
Redistribution des poids au chargement (corps entier, Node, cette machine) : mma-kadir 29 ms, mma-amara 29 ms, nael 49 ms, inaya 22 ms, victor 9 ms, kanya 13 ms.
Écart au repos entre avant et après (doit être nul) : mma-kadir 0.003 mm, mma-amara 0.000 mm, nael 0.000 mm, inaya 0.000 mm, victor 0.003 mm, kanya 0.000 mm.
