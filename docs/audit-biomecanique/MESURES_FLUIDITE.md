# Mesures de fluidité des animations

Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/fluidity.test.ts` sur le squelette du coach homme. Ne pas modifier à la main.

- **Arrêt parasite** : à une pose clé intérieure, une partie du corps (bassin, mains, chevilles) qui continue dans la même direction (moins de 60° d’écart entre l’arrivée et le départ, plus de 0,3 m/s de part et d’autre) mais dont la vitesse tombe sous le quart de la plus lente des deux : le corps marque un temps d’arrêt de robot.
- **Saut de vitesse** : plus grand changement de vitesse d’une de ces parties de part et d’autre d’une pose clé (1/240 s). Les coups gardent volontairement le leur à l’impact et au départ explosif.
- **Vitesse max** : plus grande vitesse d’une main ou d’un pied sur tout le mouvement.
- **Vitesse à l’impact** : vitesse de la main ou du pied le plus rapide pendant le 1/60 s qui précède chaque impact. Le lissage ne doit pas ralentir les coups.
- « Avant » : interpolation de pose clé en pose clé (version 0.19.0) ; « Après » : vitesses conservées à travers les poses clés (version 0.20.0).

## Total, 6 styles de garde

528 animations, 2136 poses clés intérieures. Arrêts parasites : **2171 avant, 607 après**.

| Style | Animations | Arrêts avant | Arrêts après |
|---|---|---|---|
| boxing | 88 | 356 | 96 |
| kickboxing | 88 | 356 | 99 |
| mma | 88 | 360 | 101 |
| muaythai | 88 | 365 | 99 |
| bjj | 88 | 364 | 104 |
| judo | 88 | 370 | 108 |

## Détail, garde de boxe

| Animation | Poses clés intérieures | Arrêts avant | Arrêts après | Saut de vitesse avant (m/s) | après | Vitesse max avant (m/s) | après | Vitesse à l’impact avant (m/s) | après |
|---|---|---|---|---|---|---|---|---|---|
| `garde` | 1 | 0 | 0 | 0,0 | 0,0 | 0,2 | 0,2 | – | – |
| `neutre` | 1 | 0 | 0 | 0,0 | 0,0 | 0,0 | 0,0 | – | – |
| `jab` | 2 | 0 | 0 | 6,4 | 6,4 | 8,0 | 8,0 | 7,1 | 7,1 |
| `direct` | 2 | 1 | 0 | 4,7 | 4,7 | 6,6 | 6,6 | 5,0 | 5,1 |
| `jab-corps` | 3 | 0 | 0 | 7,1 | 7,1 | 10,4 | 10,4 | 8,1 | 8,1 |
| `direct-corps` | 3 | 2 | 0 | 5,0 | 5,0 | 8,8 | 8,8 | 5,5 | 5,5 |
| `crochet-avant` | 3 | 2 | 2 | 4,4 | 4,4 | 5,3 | 5,3 | 4,8 | 4,8 |
| `crochet-arriere` | 3 | 1 | 0 | 4,7 | 4,7 | 6,9 | 6,9 | 5,1 | 5,1 |
| `crochet-avant-corps` | 4 | 4 | 3 | 5,0 | 5,0 | 7,0 | 7,0 | 5,6 | 5,5 |
| `crochet-arriere-corps` | 4 | 2 | 1 | 5,0 | 5,0 | 6,4 | 6,4 | 5,5 | 5,4 |
| `uppercut-avant` | 3 | 2 | 0 | 4,2 | 4,2 | 6,9 | 6,6 | 4,9 | 4,9 |
| `uppercut-arriere` | 3 | 2 | 0 | 4,3 | 4,3 | 6,8 | 6,4 | 5,0 | 4,9 |
| `overhand` | 2 | 0 | 0 | 4,5 | 4,5 | 6,6 | 6,6 | 4,8 | 4,8 |
| `esquive-gauche` | 2 | 0 | 0 | 0,0 | 0,0 | 1,6 | 1,6 | – | – |
| `esquive-droite` | 2 | 0 | 0 | 0,0 | 0,0 | 4,8 | 4,8 | – | – |
| `roll-gauche` | 3 | 0 | 0 | 3,0 | 3,0 | 3,4 | 3,4 | – | – |
| `roll-droite` | 3 | 0 | 0 | 3,0 | 3,0 | 2,3 | 2,3 | – | – |
| `blocage-haut` | 2 | 0 | 0 | 0,0 | 0,0 | 6,5 | 6,5 | 0,0 | 0,0 |
| `blocage-corps-avant` | 2 | 0 | 0 | 0,0 | 0,0 | 2,9 | 2,9 | 0,0 | 0,0 |
| `blocage-corps-arriere` | 2 | 0 | 0 | 0,0 | 0,0 | 2,6 | 2,6 | 0,0 | 0,0 |
| `parade` | 1 | 0 | 0 | 0,0 | 0,0 | 5,2 | 5,2 | 0,0 | 0,0 |
| `retrait` | 2 | 0 | 0 | 0,0 | 0,0 | 3,2 | 3,2 | – | – |
| `pas-avant` | 2 | 6 | 0 | 0,5 | 0,6 | 4,6 | 4,3 | – | – |
| `pas-arriere` | 2 | 6 | 0 | 0,6 | 0,6 | 4,0 | 3,8 | – | – |
| `pas-gauche` | 2 | 6 | 0 | 0,5 | 0,5 | 4,0 | 3,8 | – | – |
| `pas-droite` | 2 | 6 | 0 | 0,5 | 0,5 | 4,0 | 3,8 | – | – |
| `pivot-droite` | 1 | 3 | 0 | 0,3 | 0,2 | 7,6 | 7,1 | – | – |
| `pivot-gauche` | 1 | 3 | 0 | 0,3 | 0,2 | 7,7 | 7,2 | – | – |
| `sortie-angle` | 2 | 1 | 0 | 0,6 | 0,6 | 7,3 | 6,8 | – | – |
| `check-hook` | 4 | 3 | 0 | 2,8 | 2,8 | 9,6 | 8,6 | 2,8 | 2,8 |
| `shoulder-roll` | 2 | 0 | 0 | 0,0 | 0,0 | 8,9 | 8,9 | – | – |
| `low-kick-arriere` | 7 | 17 | 4 | 7,1 | 7,1 | 12,2 | 12,2 | 7,5 | 7,5 |
| `low-kick-avant` | 7 | 15 | 3 | 6,5 | 6,5 | 10,4 | 10,3 | 6,9 | 6,8 |
| `middle-kick-arriere` | 7 | 16 | 3 | 11,1 | 11,1 | 17,1 | 17,1 | 11,7 | 11,6 |
| `middle-kick-avant` | 7 | 15 | 4 | 10,9 | 10,9 | 15,7 | 15,6 | 11,4 | 11,4 |
| `high-kick-arriere` | 7 | 14 | 3 | 14,1 | 14,1 | 21,2 | 20,9 | 14,8 | 14,8 |
| `high-kick-avant` | 7 | 15 | 4 | 16,9 | 16,9 | 28,2 | 28,0 | 17,8 | 17,7 |
| `roundhouse-arriere` | 7 | 14 | 2 | 12,9 | 12,8 | 23,7 | 23,7 | 13,6 | 13,5 |
| `roundhouse-avant` | 7 | 14 | 2 | 12,6 | 12,6 | 21,0 | 20,9 | 13,2 | 13,1 |
| `teep-avant` | 4 | 2 | 0 | 8,7 | 8,7 | 19,5 | 19,5 | 9,2 | 9,2 |
| `teep-arriere` | 4 | 2 | 2 | 8,7 | 8,7 | 19,5 | 19,5 | 9,1 | 9,1 |
| `front-kick-avant` | 3 | 4 | 0 | 8,5 | 8,5 | 14,5 | 14,5 | 8,9 | 8,9 |
| `front-kick-arriere` | 3 | 2 | 2 | 8,5 | 8,5 | 14,5 | 14,5 | 8,9 | 8,9 |
| `genou-direct-arriere` | 8 | 12 | 4 | 7,4 | 7,4 | 14,8 | 14,8 | 8,0 | 8,0 |
| `genou-direct-avant` | 8 | 13 | 4 | 5,3 | 5,3 | 20,1 | 20,1 | 5,8 | 5,8 |
| `genou-circulaire-arriere` | 8 | 10 | 2 | 8,6 | 8,6 | 17,5 | 17,5 | 9,4 | 9,4 |
| `genou-circulaire-avant` | 8 | 13 | 2 | 6,3 | 6,3 | 19,2 | 19,2 | 6,8 | 6,8 |
| `genou-direct-arriere-clinch` | 8 | 12 | 5 | 7,4 | 7,4 | 14,8 | 14,8 | 8,1 | 8,1 |
| `genou-circulaire-arriere-clinch` | 8 | 10 | 4 | 8,6 | 8,6 | 17,5 | 17,5 | 9,4 | 9,4 |
| `check-avant` | 2 | 0 | 0 | 0,0 | 0,0 | 9,1 | 9,1 | 0,0 | 0,0 |
| `check-arriere` | 2 | 0 | 0 | 0,0 | 0,0 | 18,2 | 18,2 | 0,0 | 0,0 |
| `switch-kick` | 10 | 16 | 3 | 11,1 | 11,1 | 17,1 | 17,1 | 11,7 | 11,6 |
| `garde-longue` | 2 | 0 | 0 | 0,0 | 0,0 | 4,3 | 4,3 | – | – |
| `rattrapage-middle` | 6 | 1 | 1 | 0,1 | 0,1 | 7,2 | 7,2 | 0,0 | 0,2 |
| `coude-horizontal-avant` | 3 | 1 | 1 | 2,1 | 2,1 | 2,7 | 2,7 | 2,3 | 2,3 |
| `coude-horizontal-arriere` | 3 | 2 | 2 | 6,2 | 6,2 | 7,8 | 7,8 | 6,9 | 6,9 |
| `coude-diagonal-arriere` | 3 | 3 | 3 | 7,5 | 7,5 | 9,5 | 9,5 | 8,4 | 8,4 |
| `coude-diagonal-avant` | 3 | 2 | 2 | 4,4 | 4,4 | 5,6 | 5,6 | 5,0 | 5,0 |
| `coude-montant-arriere` | 3 | 2 | 2 | 4,1 | 4,1 | 7,6 | 7,6 | 4,5 | 4,5 |
| `coude-montant-avant` | 3 | 3 | 3 | 4,4 | 4,4 | 5,6 | 5,6 | 5,0 | 5,0 |
| `clinch-tirage` | 3 | 0 | 0 | 0,0 | 0,0 | 2,5 | 2,5 | 0,0 | 0,0 |
| `feinte-jab` | 1 | 0 | 0 | 0,0 | 0,0 | 4,9 | 4,9 | – | – |
| `feinte-epaule` | 1 | 0 | 0 | 0,0 | 0,0 | 3,7 | 3,7 | – | – |
| `feinte-lutte` | 1 | 0 | 0 | 0,0 | 0,0 | 11,0 | 11,0 | – | – |
| `changement-niveau` | 2 | 0 | 0 | 0,0 | 0,0 | 11,5 | 11,5 | – | – |
| `entree-lutte` | 4 | 2 | 2 | 14,4 | 14,4 | 14,1 | 14,1 | 0,0 | 0,0 |
| `sprawl` | 6 | 6 | 3 | 8,7 | 8,7 | 9,7 | 9,3 | 0,0 | 0,0 |
| `defense-lutte` | 2 | 0 | 0 | 0,0 | 0,0 | 17,5 | 17,5 | 0,0 | 0,0 |
| `descente-sol` | 2 | 2 | 1 | 0,0 | 0,0 | 12,1 | 12,3 | – | – |
| `sortie-hanche` | 3 | 1 | 1 | 4,2 | 4,2 | 4,2 | 4,2 | 0,0 | 0,1 |
| `releve-technique` | 3 | 7 | 2 | 0,0 | 0,0 | 11,2 | 11,2 | – | – |
| `single-leg` | 4 | 3 | 2 | 13,0 | 13,0 | 12,7 | 12,7 | 0,0 | 0,0 |
| `pont` | 6 | 4 | 4 | 4,5 | 4,5 | 4,5 | 4,5 | 0,0 | 0,0 |
| `retention-garde` | 7 | 0 | 0 | 0,0 | 0,0 | 4,1 | 3,9 | – | – |
| `changement-base` | 4 | 2 | 0 | 0,0 | 0,0 | 9,3 | 9,3 | – | – |
| `tai-sabaki` | 4 | 2 | 0 | 0,1 | 0,1 | 5,6 | 5,6 | 0,0 | 0,1 |
| `kuzushi` | 2 | 0 | 0 | 0,0 | 0,0 | 7,2 | 7,2 | 0,0 | 0,0 |
| `uchikomi-seoi` | 4 | 2 | 0 | 13,5 | 13,5 | 13,5 | 13,5 | 0,0 | 0,0 |
| `ayumi-ashi` | 3 | 0 | 0 | 0,5 | 0,5 | 5,5 | 5,5 | – | – |
| `kumikata` | 4 | 0 | 0 | 2,2 | 2,2 | 2,5 | 2,5 | 0,0 | 0,0 |
| `uchikomi-o-goshi` | 4 | 1 | 0 | 11,9 | 11,9 | 11,9 | 11,9 | 0,0 | 0,0 |
| `uchikomi-o-soto-gari` | 6 | 3 | 1 | 11,1 | 11,1 | 10,7 | 10,7 | 0,0 | 0,0 |
| `uchikomi-o-uchi-gari` | 8 | 5 | 3 | 4,4 | 4,4 | 4,2 | 4,2 | 0,0 | 0,0 |
| `uchikomi-ko-uchi-gari` | 6 | 2 | 1 | 3,7 | 3,7 | 5,4 | 5,4 | 0,0 | 0,0 |
| `ukemi-ushiro` | 9 | 12 | 0 | 3,4 | 3,4 | 5,8 | 5,5 | 3,6 | 3,6 |
| `ukemi-yoko` | 11 | 9 | 0 | 11,3 | 11,3 | 11,3 | 11,3 | 0,0 ; 0,0 | 0,0 ; 0,0 |
| `sit-out` | 8 | 6 | 2 | 7,1 | 7,1 | 9,3 | 9,3 | 0,0 | 0,0 |
| `releve-genoux` | 9 | 7 | 1 | 0,1 | 0,1 | 5,7 | 5,5 | 0,0 | 0,0 |
