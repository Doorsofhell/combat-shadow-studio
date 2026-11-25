# Shorts des coachs : contrôles automatiques (1.44.2)

Généré par `src/three/__tests__/shorts-v1442.test.ts`.

## Fichiers

- **deux jambes** : triangles tenus à la fois par la jambe gauche et la jambe droite (la membrane) ;
- **arêtes ouvertes** : arêtes d'un seul triangle (trous) ;
- **inversées** : faces dont l'ordre des sommets contredit les normales ;
- **UV** : triangles sans coordonnées de texture valides ;
- **peau dessinée** : part des points de peau à moins de 6 mm du tissu qui restent dessinés (le sous-vêtement peint du corps d'origine).

| coach | tenue | pièce | triangles | deux jambes | arêtes ouvertes | inversées | UV | peau dessinée |
|---|---|---|---|---|---|---|---|---|
| mma-kadir | boxe | short-boxe | 4008 | 0 | 2 | 5 | 0 | 1.2 % |
| mma-kadir | boxe | short-boxe | 2080 | 0 | 0 | 0 | 0 | 0.0 % |
| mma-kadir | kickboxing | short-kick | 4204 | 0 | 2 | 4 | 0 | 1.0 % |
| mma-kadir | kickboxing | short-kick | 1920 | 0 | 0 | 0 | 0 | 0.0 % |
| mma-kadir | muaythai | short-thai | 3792 | 0 | 2 | 7 | 0 | 1.5 % |
| mma-kadir | muaythai | short-thai | 2216 | 0 | 0 | 5 | 0 | 0.0 % |
| mma-kadir | mma | short-vale-tudo | 4012 | 0 | 2 | 7 | 0 | 1.1 % |
| mma-kadir | mma | short-vale-tudo | 1864 | 0 | 0 | 0 | 0 | 67.2 % |
| mma-amara | boxe | short-boxe | 7952 | 0 | 0 | 40 | 0 | 0.0 % |
| mma-amara | kickboxing | short-kick | 7700 | 0 | 0 | 24 | 0 | 0.0 % |
| mma-amara | muaythai | short-thai | 7900 | 0 | 0 | 40 | 0 | 0.0 % |
| mma-amara | mma | short-vale-tudo | 8594 | 0 | 0 | 23 | 0 | 0.0 % |
| mma-amara | mma | short-vale-tudo | 280 | 0 | 0 | 0 | 0 | 0.0 % |
| mma-amara | mma | short-vale-tudo | 130 | 0 | 0 | 0 | 0 | 0.0 % |
| nael | boxe | short-boxe | 5484 | 0 | 4 | 22 | 0 | 1.6 % |
| nael | boxe | short-boxe | 3300 | 0 | 0 | 1 | 0 | 0.0 % |
| nael | kickboxing | short-kick | 5838 | 0 | 4 | 12 | 0 | 1.8 % |
| nael | kickboxing | short-kick | 2942 | 0 | 0 | 2 | 0 | 0.0 % |
| nael | muaythai | short-thai | 5074 | 0 | 4 | 34 | 0 | 1.8 % |
| nael | muaythai | short-thai | 3402 | 0 | 0 | 3 | 0 | 0.0 % |
| nael | mma | short-vale-tudo | 5592 | 0 | 4 | 8 | 0 | 1.6 % |
| nael | mma | short-vale-tudo | 2960 | 0 | 0 | 0 | 0 | 72.6 % |
| inaya | boxe | short-boxe | 5238 | 0 | 0 | 23 | 0 | 0.0 % |
| inaya | boxe | short-boxe | 2902 | 0 | 0 | 0 | 0 | 0.0 % |
| inaya | kickboxing | short-kick | 5298 | 0 | 0 | 4 | 0 | 0.0 % |
| inaya | kickboxing | short-kick | 2442 | 0 | 0 | 2 | 0 | 0.0 % |
| inaya | muaythai | short-thai | 5140 | 0 | 0 | 39 | 0 | 0.0 % |
| inaya | muaythai | short-thai | 2988 | 0 | 0 | 0 | 0 | 0.0 % |
| inaya | mma | short-surshort | 5032 | 0 | 0 | 31 | 0 | 0.0 % |
| inaya | mma | short-surshort | 2592 | 0 | 0 | 0 | 0 | 0.0 % |
| inaya | mma | short-vale-tudo | 3364 | 0 | 0 | 3 | 0 | 0.0 % |
| victor | boxe | short-thai | 4804 | 0 | 0 | 24 | 0 | 0.0 % |
| victor | boxe | short-thai | 4098 | 0 | 0 | 4 | 0 | 0.0 % |
| victor | boxe | short-thai | 628 | 0 | 0 | 0 | 0 | 0.0 % |
| victor | boxe | short-thai | 2302 | 0 | 0 | 4 | 0 | 0.0 % |
| victor | kickboxing | short-thai.001 | 4804 | 0 | 0 | 24 | 0 | 0.0 % |
| victor | kickboxing | short-thai.001 | 4098 | 0 | 0 | 4 | 0 | 0.0 % |
| victor | kickboxing | short-thai.001 | 628 | 0 | 0 | 0 | 0 | 0.0 % |
| victor | kickboxing | short-thai.001 | 2302 | 0 | 0 | 4 | 0 | 0.0 % |
| victor | muaythai | short-thai.002 | 4804 | 0 | 0 | 24 | 0 | 0.0 % |
| victor | muaythai | short-thai.002 | 4098 | 0 | 0 | 4 | 0 | 0.0 % |
| victor | muaythai | short-thai.002 | 628 | 0 | 0 | 0 | 0 | 0.0 % |
| victor | muaythai | short-thai.002 | 2302 | 0 | 0 | 4 | 0 | 0.0 % |
| victor | mma | short-vale-tudo | 5394 | 0 | 0 | 20 | 0 | 0.0 % |
| victor | mma | short-vale-tudo | 2982 | 0 | 0 | 0 | 0 | 93.0 % |
| kanya | boxe | short-thai.001 | 3662 | 0 | 0 | 24 | 0 | 0.0 % |
| kanya | boxe | short-thai.001 | 3508 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | boxe | short-thai.001 | 688 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | boxe | short-thai.001 | 2290 | 0 | 0 | 13 | 0 | 0.0 % |
| kanya | kickboxing | short-thai.002 | 3682 | 0 | 0 | 18 | 0 | 0.0 % |
| kanya | kickboxing | short-thai.002 | 3490 | 0 | 0 | 2 | 0 | 0.0 % |
| kanya | kickboxing | short-thai.002 | 692 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | kickboxing | short-thai.002 | 2304 | 0 | 0 | 12 | 0 | 0.0 % |
| kanya | muaythai | short-vale-tudo | 6962 | 0 | 0 | 26 | 0 | 0.0 % |
| kanya | muaythai | short-vale-tudo | 2948 | 0 | 0 | 0 | 0 | 89.2 % |
| kanya | muaythai | short-vale-tudo | 1158 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | muaythai | short-vale-tudo | 308 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | mma | short-thai | 3662 | 0 | 0 | 24 | 0 | 0.0 % |
| kanya | mma | short-thai | 3508 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | mma | short-thai | 688 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | mma | short-thai | 2290 | 0 | 0 | 13 | 0 | 0.0 % |

## En mouvement (50, 100 et 125 % de l'instant clé)

- **étirement** : rapport posé / repos des arêtes du short (99,5e centile) ;
- **arête la plus longue de l'entrejambe** : en millimètres (une membrane entre les cuisses dépasse 10 cm) ;
- **dans la jambe** : part des points du tissu passés à plus de 5 mm sous la peau qu'ils couvrent.

| coach | tenue | mouvement | étirement | arête la plus longue (mm) | dans la jambe |
|---|---|---|---|---|---|
| mma-kadir | boxe | garde | 2.03 | 64.0 | 0.4 % |
| mma-kadir | boxe | high kick | 3.35 | 90.2 | 0.5 % |
| mma-kadir | boxe | genou | 2.76 | 88.1 | 0.5 % |
| mma-kadir | boxe | changement de niveau | 2.47 | 87.5 | 0.3 % |
| mma-kadir | boxe | low kick | 2.36 | 75.5 | 0.5 % |
| mma-kadir | kickboxing | garde | 2.00 | 63.0 | 0.2 % |
| mma-kadir | kickboxing | high kick | 3.39 | 89.3 | 0.3 % |
| mma-kadir | kickboxing | genou | 2.71 | 90.1 | 0.3 % |
| mma-kadir | kickboxing | changement de niveau | 2.45 | 86.3 | 0.1 % |
| mma-kadir | kickboxing | low kick | 2.27 | 75.5 | 0.2 % |
| mma-kadir | muaythai | garde | 1.86 | 64.3 | 0.6 % |
| mma-kadir | muaythai | high kick | 3.42 | 90.5 | 1.3 % |
| mma-kadir | muaythai | genou | 2.94 | 93.8 | 1.6 % |
| mma-kadir | muaythai | changement de niveau | 2.34 | 86.6 | 0.4 % |
| mma-kadir | muaythai | low kick | 2.12 | 74.6 | 1.2 % |
| mma-kadir | mma | garde | 2.16 | 70.4 | 0.9 % |
| mma-kadir | mma | high kick | 3.52 | 87.1 | 1.0 % |
| mma-kadir | mma | genou | 2.58 | 87.3 | 1.0 % |
| mma-kadir | mma | changement de niveau | 2.63 | 91.3 | 0.9 % |
| mma-kadir | mma | low kick | 2.47 | 80.2 | 1.0 % |
| mma-amara | boxe | garde | 1.71 | 64.4 | 0.2 % |
| mma-amara | boxe | high kick | 4.00 | 87.9 | 0.9 % |
| mma-amara | boxe | genou | 2.31 | 71.5 | 1.2 % |
| mma-amara | boxe | changement de niveau | 2.38 | 71.8 | 0.9 % |
| mma-amara | boxe | low kick | 2.17 | 68.4 | 0.7 % |
| mma-amara | kickboxing | garde | 1.67 | 63.9 | 0.0 % |
| mma-amara | kickboxing | high kick | 4.07 | 87.3 | 0.4 % |
| mma-amara | kickboxing | genou | 2.46 | 72.2 | 0.5 % |
| mma-amara | kickboxing | changement de niveau | 2.37 | 71.2 | 0.3 % |
| mma-amara | kickboxing | low kick | 2.12 | 67.9 | 0.2 % |
| mma-amara | muaythai | garde | 1.56 | 66.4 | 0.3 % |
| mma-amara | muaythai | high kick | 3.81 | 84.1 | 1.3 % |
| mma-amara | muaythai | genou | 2.36 | 72.2 | 2.1 % |
| mma-amara | muaythai | changement de niveau | 2.05 | 71.5 | 0.5 % |
| mma-amara | muaythai | low kick | 1.84 | 71.2 | 1.0 % |
| mma-amara | mma | garde | 2.21 | 53.0 | 0.4 % |
| mma-amara | mma | high kick | 5.08 | 61.8 | 1.0 % |
| mma-amara | mma | genou | 2.76 | 57.3 | 1.5 % |
| mma-amara | mma | changement de niveau | 2.86 | 50.8 | 0.8 % |
| mma-amara | mma | low kick | 2.55 | 58.6 | 1.1 % |
| nael | boxe | garde | 1.75 | 59.8 | 0.6 % |
| nael | boxe | high kick | 3.19 | 65.3 | 1.7 % |
| nael | boxe | genou | 2.39 | 65.4 | 1.7 % |
| nael | boxe | changement de niveau | 2.28 | 63.9 | 1.2 % |
| nael | boxe | low kick | 2.12 | 61.4 | 1.1 % |
| nael | kickboxing | garde | 1.70 | 56.8 | 0.5 % |
| nael | kickboxing | high kick | 3.31 | 64.6 | 1.1 % |
| nael | kickboxing | genou | 2.40 | 65.5 | 1.1 % |
| nael | kickboxing | changement de niveau | 2.32 | 63.3 | 0.9 % |
| nael | kickboxing | low kick | 2.07 | 60.1 | 0.8 % |
| nael | muaythai | garde | 1.56 | 64.4 | 0.7 % |
| nael | muaythai | high kick | 3.01 | 65.2 | 2.0 % |
| nael | muaythai | genou | 2.45 | 66.7 | 3.0 % |
| nael | muaythai | changement de niveau | 2.10 | 64.2 | 1.6 % |
| nael | muaythai | low kick | 1.81 | 65.5 | 1.3 % |
| nael | mma | garde | 2.28 | 67.2 | 0.6 % |
| nael | mma | high kick | 4.16 | 86.4 | 0.8 % |
| nael | mma | genou | 3.09 | 86.9 | 0.7 % |
| nael | mma | changement de niveau | 3.00 | 88.5 | 0.7 % |
| nael | mma | low kick | 2.60 | 76.9 | 0.7 % |
| inaya | boxe | garde | 1.86 | 66.1 | 0.3 % |
| inaya | boxe | high kick | 4.47 | 118.6 | 0.5 % |
| inaya | boxe | genou | 2.36 | 97.2 | 0.5 % |
| inaya | boxe | changement de niveau | 2.60 | 78.8 | 0.5 % |
| inaya | boxe | low kick | 2.47 | 76.5 | 0.6 % |
| inaya | kickboxing | garde | 1.86 | 65.9 | 0.1 % |
| inaya | kickboxing | high kick | 4.68 | 116.0 | 0.1 % |
| inaya | kickboxing | genou | 2.50 | 93.8 | 0.1 % |
| inaya | kickboxing | changement de niveau | 2.53 | 77.6 | 0.1 % |
| inaya | kickboxing | low kick | 2.38 | 75.0 | 0.1 % |
| inaya | muaythai | garde | 1.70 | 66.9 | 0.6 % |
| inaya | muaythai | high kick | 4.61 | 115.9 | 1.4 % |
| inaya | muaythai | genou | 2.55 | 92.8 | 1.2 % |
| inaya | muaythai | changement de niveau | 2.33 | 75.8 | 0.8 % |
| inaya | muaythai | low kick | 1.92 | 79.1 | 1.3 % |
| inaya | mma | garde | 2.05 | 63.0 | 0.6 % |
| inaya | mma | high kick | 4.02 | 109.9 | 0.9 % |
| inaya | mma | genou | 2.67 | 97.2 | 1.4 % |
| inaya | mma | changement de niveau | 2.63 | 81.0 | 0.6 % |
| inaya | mma | low kick | 2.36 | 79.4 | 1.0 % |
| victor | boxe | garde | 2.16 | 64.3 | 1.6 % |
| victor | boxe | high kick | 4.01 | 66.1 | 2.7 % |
| victor | boxe | genou | 2.79 | 64.9 | 3.0 % |
| victor | boxe | changement de niveau | 2.97 | 61.8 | 2.4 % |
| victor | boxe | low kick | 2.54 | 66.1 | 2.9 % |
| victor | kickboxing | garde | 2.10 | 64.6 | 1.7 % |
| victor | kickboxing | high kick | 3.96 | 65.9 | 2.6 % |
| victor | kickboxing | genou | 2.80 | 64.5 | 3.0 % |
| victor | kickboxing | changement de niveau | 2.87 | 62.1 | 2.5 % |
| victor | kickboxing | low kick | 2.39 | 66.4 | 2.8 % |
| victor | muaythai | garde | 1.84 | 65.3 | 1.9 % |
| victor | muaythai | high kick | 3.83 | 65.7 | 2.6 % |
| victor | muaythai | genou | 2.87 | 66.1 | 3.1 % |
| victor | muaythai | changement de niveau | 2.67 | 62.7 | 2.6 % |
| victor | muaythai | low kick | 2.08 | 66.9 | 2.5 % |
| victor | mma | garde | 2.46 | 71.2 | 0.9 % |
| victor | mma | high kick | 4.26 | 90.4 | 1.3 % |
| victor | mma | genou | 3.15 | 90.3 | 1.1 % |
| victor | mma | changement de niveau | 3.39 | 93.3 | 1.0 % |
| victor | mma | low kick | 2.90 | 80.9 | 1.1 % |
| kanya | boxe | garde | 2.00 | 49.2 | 1.0 % |
| kanya | boxe | high kick | 4.95 | 58.4 | 1.7 % |
| kanya | boxe | genou | 2.75 | 53.6 | 2.1 % |
| kanya | boxe | changement de niveau | 2.96 | 48.3 | 1.5 % |
| kanya | boxe | low kick | 2.72 | 58.0 | 1.5 % |
| kanya | kickboxing | garde | 1.89 | 51.2 | 1.1 % |
| kanya | kickboxing | high kick | 4.91 | 59.3 | 1.7 % |
| kanya | kickboxing | genou | 2.73 | 55.4 | 1.9 % |
| kanya | kickboxing | changement de niveau | 2.68 | 47.0 | 1.5 % |
| kanya | kickboxing | low kick | 2.38 | 59.0 | 1.4 % |
| kanya | muaythai | garde | 1.62 | 61.7 | 0.2 % |
| kanya | muaythai | high kick | 3.83 | 75.6 | 0.8 % |
| kanya | muaythai | genou | 2.57 | 66.1 | 0.9 % |
| kanya | muaythai | changement de niveau | 2.25 | 59.4 | 0.3 % |
| kanya | muaythai | low kick | 1.94 | 67.7 | 0.5 % |
| kanya | mma | garde | 2.25 | 47.1 | 1.2 % |
| kanya | mma | high kick | 5.01 | 55.1 | 1.7 % |
| kanya | mma | genou | 2.73 | 50.9 | 2.0 % |
| kanya | mma | changement de niveau | 3.15 | 48.7 | 1.9 % |
| kanya | mma | low kick | 2.77 | 54.1 | 1.5 % |
