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
| mma-amara | boxe | short-boxe | 8016 | 0 | 0 | 36 | 0 | 4.6 % |
| mma-amara | kickboxing | short-kick | 7788 | 0 | 0 | 8 | 0 | 3.5 % |
| mma-amara | muaythai | short-thai | 7944 | 0 | 0 | 40 | 0 | 5.4 % |
| mma-amara | mma | short-vale-tudo | 8716 | 0 | 0 | 10 | 0 | 2.5 % |
| mma-amara | mma | short-vale-tudo | 294 | 0 | 0 | 0 | 0 | 0.0 % |
| mma-amara | mma | short-vale-tudo | 122 | 0 | 0 | 0 | 0 | 0.0 % |
| nael | boxe | short-boxe | 5484 | 0 | 4 | 15 | 0 | 1.6 % |
| nael | boxe | short-boxe | 3300 | 0 | 0 | 1 | 0 | 0.0 % |
| nael | kickboxing | short-kick | 5838 | 0 | 4 | 7 | 0 | 1.8 % |
| nael | kickboxing | short-kick | 2942 | 0 | 0 | 2 | 0 | 0.0 % |
| nael | muaythai | short-thai | 5074 | 0 | 4 | 31 | 0 | 1.8 % |
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
| victor | boxe | short-thai | 4844 | 0 | 0 | 30 | 0 | 0.0 % |
| victor | boxe | short-thai | 4030 | 0 | 0 | 1 | 0 | 0.0 % |
| victor | boxe | short-thai | 634 | 0 | 0 | 0 | 0 | 0.0 % |
| victor | boxe | short-thai | 2244 | 0 | 0 | 2 | 0 | 0.0 % |
| victor | kickboxing | short-thai.001 | 4844 | 0 | 0 | 30 | 0 | 0.0 % |
| victor | kickboxing | short-thai.001 | 4030 | 0 | 0 | 1 | 0 | 0.0 % |
| victor | kickboxing | short-thai.001 | 634 | 0 | 0 | 0 | 0 | 0.0 % |
| victor | kickboxing | short-thai.001 | 2244 | 0 | 0 | 2 | 0 | 0.0 % |
| victor | muaythai | short-thai.002 | 4844 | 0 | 0 | 30 | 0 | 0.0 % |
| victor | muaythai | short-thai.002 | 4030 | 0 | 0 | 1 | 0 | 0.0 % |
| victor | muaythai | short-thai.002 | 634 | 0 | 0 | 0 | 0 | 0.0 % |
| victor | muaythai | short-thai.002 | 2244 | 0 | 0 | 2 | 0 | 0.0 % |
| victor | mma | short-vale-tudo | 5624 | 0 | 0 | 22 | 0 | 0.0 % |
| victor | mma | short-vale-tudo | 2780 | 0 | 0 | 0 | 0 | 92.5 % |
| kanya | boxe | short-thai | 3752 | 0 | 0 | 30 | 0 | 0.0 % |
| kanya | boxe | short-thai | 3464 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | boxe | short-thai | 648 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | boxe | short-thai | 2216 | 0 | 0 | 2 | 0 | 0.0 % |
| kanya | kickboxing | short-thai.001 | 3682 | 0 | 0 | 18 | 0 | 0.0 % |
| kanya | kickboxing | short-thai.001 | 3490 | 0 | 0 | 2 | 0 | 0.0 % |
| kanya | kickboxing | short-thai.001 | 692 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | kickboxing | short-thai.001 | 2304 | 0 | 0 | 2 | 0 | 0.0 % |
| kanya | muaythai | short-vale-tudo | 6962 | 0 | 0 | 21 | 0 | 0.0 % |
| kanya | muaythai | short-vale-tudo | 2948 | 0 | 0 | 0 | 0 | 89.2 % |
| kanya | muaythai | short-vale-tudo | 1158 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | muaythai | short-vale-tudo | 308 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | mma | short-thai.002 | 3662 | 0 | 0 | 24 | 0 | 0.0 % |
| kanya | mma | short-thai.002 | 3508 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | mma | short-thai.002 | 688 | 0 | 0 | 0 | 0 | 0.0 % |
| kanya | mma | short-thai.002 | 2290 | 0 | 0 | 3 | 0 | 0.0 % |

## En mouvement (50, 100 et 125 % de l'instant clé)

- **étirement** : rapport posé / repos des arêtes du short (99,5e centile) ;
- **arête la plus longue de l'entrejambe** : en millimètres (une membrane entre les cuisses dépasse 10 cm) ;
- **dans la jambe** : part des points du tissu passés à plus de 5 mm sous la peau qu'ils couvrent.

| coach | tenue | mouvement | étirement | arête la plus longue (mm) | dans la jambe |
|---|---|---|---|---|---|
| mma-kadir | boxe | garde | 2.03 | 64.0 | 0.4 % |
| mma-kadir | boxe | high kick | 3.35 | 106.0 | 0.5 % |
| mma-kadir | boxe | genou | 2.76 | 88.1 | 0.4 % |
| mma-kadir | boxe | changement de niveau | 2.47 | 87.5 | 0.3 % |
| mma-kadir | boxe | low kick | 2.36 | 77.8 | 0.5 % |
| mma-kadir | kickboxing | garde | 2.00 | 63.0 | 0.2 % |
| mma-kadir | kickboxing | high kick | 3.39 | 104.8 | 0.2 % |
| mma-kadir | kickboxing | genou | 2.71 | 90.1 | 0.3 % |
| mma-kadir | kickboxing | changement de niveau | 2.45 | 86.3 | 0.1 % |
| mma-kadir | kickboxing | low kick | 2.27 | 77.9 | 0.2 % |
| mma-kadir | muaythai | garde | 1.86 | 64.3 | 0.6 % |
| mma-kadir | muaythai | high kick | 3.59 | 105.8 | 1.3 % |
| mma-kadir | muaythai | genou | 2.94 | 93.8 | 1.6 % |
| mma-kadir | muaythai | changement de niveau | 2.34 | 86.6 | 0.4 % |
| mma-kadir | muaythai | low kick | 2.23 | 78.2 | 1.2 % |
| mma-kadir | mma | garde | 2.16 | 70.4 | 0.9 % |
| mma-kadir | mma | high kick | 3.52 | 102.7 | 1.1 % |
| mma-kadir | mma | genou | 2.58 | 87.3 | 1.0 % |
| mma-kadir | mma | changement de niveau | 2.63 | 91.3 | 0.9 % |
| mma-kadir | mma | low kick | 2.47 | 82.3 | 1.0 % |
| mma-amara | boxe | garde | 1.91 | 65.3 | 0.3 % |
| mma-amara | boxe | high kick | 4.97 | 128.3 | 0.6 % |
| mma-amara | boxe | genou | 2.63 | 96.8 | 0.9 % |
| mma-amara | boxe | changement de niveau | 2.71 | 78.4 | 0.3 % |
| mma-amara | boxe | low kick | 2.62 | 81.9 | 0.7 % |
| mma-amara | kickboxing | garde | 1.92 | 65.2 | 0.0 % |
| mma-amara | kickboxing | high kick | 5.11 | 127.0 | 0.1 % |
| mma-amara | kickboxing | genou | 2.77 | 93.5 | 0.1 % |
| mma-amara | kickboxing | changement de niveau | 2.76 | 77.4 | 0.0 % |
| mma-amara | kickboxing | low kick | 2.46 | 79.1 | 0.2 % |
| mma-amara | muaythai | garde | 1.70 | 67.4 | 0.3 % |
| mma-amara | muaythai | high kick | 4.97 | 123.1 | 1.2 % |
| mma-amara | muaythai | genou | 2.76 | 94.5 | 1.6 % |
| mma-amara | muaythai | changement de niveau | 2.42 | 75.8 | 0.3 % |
| mma-amara | muaythai | low kick | 2.28 | 81.2 | 1.0 % |
| mma-amara | mma | garde | 2.53 | 56.6 | 0.3 % |
| mma-amara | mma | high kick | 5.62 | 101.1 | 0.6 % |
| mma-amara | mma | genou | 3.11 | 80.0 | 0.8 % |
| mma-amara | mma | changement de niveau | 3.48 | 71.7 | 0.4 % |
| mma-amara | mma | low kick | 2.90 | 72.9 | 0.6 % |
| nael | boxe | garde | 2.11 | 62.2 | 0.6 % |
| nael | boxe | high kick | 3.75 | 102.9 | 1.1 % |
| nael | boxe | genou | 3.24 | 85.9 | 1.0 % |
| nael | boxe | changement de niveau | 2.70 | 82.9 | 0.8 % |
| nael | boxe | low kick | 2.43 | 73.2 | 1.1 % |
| nael | kickboxing | garde | 2.11 | 58.5 | 0.5 % |
| nael | kickboxing | high kick | 3.86 | 101.8 | 0.6 % |
| nael | kickboxing | genou | 3.05 | 87.6 | 0.5 % |
| nael | kickboxing | changement de niveau | 2.66 | 81.8 | 0.6 % |
| nael | kickboxing | low kick | 2.33 | 73.8 | 0.5 % |
| nael | muaythai | garde | 1.93 | 64.8 | 0.9 % |
| nael | muaythai | high kick | 3.96 | 102.6 | 1.7 % |
| nael | muaythai | genou | 3.20 | 89.7 | 2.2 % |
| nael | muaythai | changement de niveau | 2.53 | 82.4 | 1.2 % |
| nael | muaythai | low kick | 2.35 | 74.1 | 1.3 % |
| nael | mma | garde | 2.28 | 67.2 | 0.6 % |
| nael | mma | high kick | 4.16 | 101.5 | 0.8 % |
| nael | mma | genou | 3.09 | 86.9 | 0.7 % |
| nael | mma | changement de niveau | 3.00 | 88.5 | 0.7 % |
| nael | mma | low kick | 2.60 | 79.1 | 0.7 % |
| inaya | boxe | garde | 1.86 | 66.1 | 0.3 % |
| inaya | boxe | high kick | 4.47 | 130.6 | 0.5 % |
| inaya | boxe | genou | 2.36 | 97.2 | 0.5 % |
| inaya | boxe | changement de niveau | 2.60 | 78.8 | 0.5 % |
| inaya | boxe | low kick | 2.47 | 82.1 | 0.6 % |
| inaya | kickboxing | garde | 1.86 | 65.9 | 0.1 % |
| inaya | kickboxing | high kick | 4.68 | 129.2 | 0.1 % |
| inaya | kickboxing | genou | 2.50 | 93.8 | 0.1 % |
| inaya | kickboxing | changement de niveau | 2.53 | 77.6 | 0.1 % |
| inaya | kickboxing | low kick | 2.38 | 79.2 | 0.1 % |
| inaya | muaythai | garde | 1.70 | 66.9 | 0.6 % |
| inaya | muaythai | high kick | 4.61 | 125.4 | 1.4 % |
| inaya | muaythai | genou | 2.55 | 92.8 | 1.2 % |
| inaya | muaythai | changement de niveau | 2.33 | 75.8 | 0.8 % |
| inaya | muaythai | low kick | 2.17 | 80.8 | 1.3 % |
| inaya | mma | garde | 2.05 | 63.0 | 0.6 % |
| inaya | mma | high kick | 4.02 | 125.1 | 0.9 % |
| inaya | mma | genou | 2.67 | 97.2 | 1.4 % |
| inaya | mma | changement de niveau | 2.63 | 81.0 | 0.6 % |
| inaya | mma | low kick | 2.52 | 85.9 | 1.2 % |
| victor | boxe | garde | 2.38 | 65.8 | 1.7 % |
| victor | boxe | high kick | 4.66 | 98.8 | 2.8 % |
| victor | boxe | genou | 3.56 | 79.6 | 2.8 % |
| victor | boxe | changement de niveau | 3.09 | 78.2 | 2.2 % |
| victor | boxe | low kick | 2.74 | 67.3 | 2.9 % |
| victor | kickboxing | garde | 2.37 | 65.7 | 1.9 % |
| victor | kickboxing | high kick | 4.67 | 98.7 | 2.8 % |
| victor | kickboxing | genou | 3.60 | 81.9 | 2.8 % |
| victor | kickboxing | changement de niveau | 3.06 | 77.7 | 2.3 % |
| victor | kickboxing | low kick | 2.65 | 68.4 | 2.8 % |
| victor | muaythai | garde | 2.09 | 64.4 | 1.8 % |
| victor | muaythai | high kick | 4.62 | 97.4 | 2.4 % |
| victor | muaythai | genou | 3.66 | 84.2 | 2.8 % |
| victor | muaythai | changement de niveau | 2.87 | 77.3 | 2.2 % |
| victor | muaythai | low kick | 2.55 | 68.5 | 2.5 % |
| victor | mma | garde | 2.33 | 68.5 | 1.0 % |
| victor | mma | high kick | 4.13 | 102.4 | 1.5 % |
| victor | mma | genou | 2.97 | 86.9 | 1.4 % |
| victor | mma | changement de niveau | 3.03 | 89.8 | 1.2 % |
| victor | mma | low kick | 2.67 | 80.1 | 1.3 % |
| kanya | boxe | garde | 2.43 | 56.0 | 1.2 % |
| kanya | boxe | high kick | 6.20 | 114.2 | 2.0 % |
| kanya | kickboxing | garde | 2.20 | 52.2 | 1.1 % |
| kanya | kickboxing | high kick | 5.35 | 105.2 | 1.6 % |
| kanya | kickboxing | genou | 2.93 | 75.3 | 1.8 % |
| kanya | kickboxing | changement de niveau | 3.19 | 65.3 | 1.5 % |
| kanya | kickboxing | low kick | 2.70 | 64.7 | 1.4 % |
| kanya | muaythai | garde | 1.81 | 61.5 | 0.2 % |
| kanya | muaythai | high kick | 4.81 | 117.1 | 0.5 % |
| kanya | muaythai | genou | 2.87 | 83.2 | 0.6 % |
| kanya | muaythai | changement de niveau | 2.66 | 70.9 | 0.3 % |
| kanya | muaythai | low kick | 2.45 | 74.4 | 0.5 % |
| kanya | mma | garde | 2.69 | 55.0 | 1.2 % |
| kanya | mma | high kick | 5.24 | 103.9 | 1.6 % |
| kanya | mma | genou | 2.99 | 79.1 | 1.8 % |
| kanya | mma | changement de niveau | 3.65 | 69.1 | 1.6 % |
| kanya | mma | low kick | 3.04 | 71.5 | 1.5 % |
