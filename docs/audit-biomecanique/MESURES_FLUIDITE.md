# Mesures de fluidité des animations

Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/fluidity.test.ts` sur le squelette du coach homme. Ne pas modifier à la main.

- **Arrêt parasite** : à une pose clé intérieure, une partie du corps (bassin, mains, chevilles) qui continue dans la même direction (moins de 60° d’écart entre l’arrivée et le départ, plus de 0,3 m/s de part et d’autre) mais dont la vitesse tombe sous le quart de la plus lente des deux : le corps marque un temps d’arrêt de robot.
- **Saut de vitesse** : plus grand changement de vitesse d’une de ces parties de part et d’autre d’une pose clé (1/240 s). Les coups gardent volontairement le leur à l’impact et au départ explosif.
- **Vitesse max** : plus grande vitesse d’une main ou d’un pied sur tout le mouvement.
- **Vitesse à l’impact** : vitesse de la main ou du pied le plus rapide pendant le 1/60 s qui précède chaque impact. Le lissage ne doit pas ralentir les coups.
- « Avant » : interpolation de pose clé en pose clé (version 0.19.0) ; « Après » : vitesses conservées à travers les poses clés (version 0.20.0).

## Total, 6 styles de garde

432 animations, 1266 poses clés intérieures. Arrêts parasites : **939 avant, 318 après**.

| Style | Animations | Arrêts avant | Arrêts après |
|---|---|---|---|
| boxing | 72 | 148 | 49 |
| kickboxing | 72 | 149 | 48 |
| mma | 72 | 151 | 47 |
| muaythai | 72 | 153 | 56 |
| bjj | 72 | 164 | 53 |
| judo | 72 | 174 | 65 |

## Détail, garde de boxe

| Animation | Poses clés intérieures | Arrêts avant | Arrêts après | Saut de vitesse avant (m/s) | après | Vitesse max avant (m/s) | après | Vitesse à l’impact avant (m/s) | après |
|---|---|---|---|---|---|---|---|---|---|
| `garde` | 1 | 0 | 0 | 0,0 | 0,0 | 0,2 | 0,2 | – | – |
| `neutre` | 1 | 0 | 0 | 0,0 | 0,0 | 0,0 | 0,0 | – | – |
| `jab` | 2 | 0 | 0 | 3,2 | 3,2 | 8,1 | 8,1 | 3,5 | 3,5 |
| `direct` | 2 | 0 | 0 | 2,4 | 2,4 | 6,8 | 6,8 | 2,4 | 2,4 |
| `jab-corps` | 2 | 0 | 0 | 3,6 | 3,6 | 10,7 | 10,7 | 3,9 | 3,9 |
| `direct-corps` | 2 | 0 | 0 | 2,5 | 2,5 | 9,1 | 9,1 | 2,6 | 2,6 |
| `crochet-avant` | 3 | 1 | 0 | 1,8 | 1,8 | 4,7 | 4,5 | 2,0 | 2,0 |
| `crochet-arriere` | 3 | 1 | 0 | 3,8 | 3,8 | 7,0 | 7,0 | 4,1 | 4,1 |
| `crochet-avant-corps` | 3 | 2 | 0 | 1,8 | 1,8 | 6,1 | 6,1 | 2,0 | 2,0 |
| `crochet-arriere-corps` | 3 | 2 | 0 | 3,8 | 3,8 | 6,6 | 6,6 | 4,1 | 4,1 |
| `uppercut-avant` | 3 | 0 | 0 | 2,3 | 2,3 | 4,7 | 4,7 | 2,5 | 2,5 |
| `uppercut-arriere` | 3 | 0 | 0 | 3,9 | 3,9 | 5,8 | 5,8 | 4,2 | 4,2 |
| `overhand` | 3 | 0 | 0 | 5,0 | 5,0 | 6,7 | 6,7 | 5,3 | 5,3 |
| `esquive-gauche` | 2 | 0 | 0 | 0,0 | 0,0 | 1,6 | 1,6 | – | – |
| `esquive-droite` | 2 | 0 | 0 | 0,0 | 0,0 | 4,8 | 4,8 | – | – |
| `roll-gauche` | 3 | 0 | 0 | 3,0 | 3,0 | 3,4 | 3,4 | – | – |
| `roll-droite` | 3 | 0 | 0 | 3,0 | 3,0 | 2,3 | 2,3 | – | – |
| `blocage-haut` | 2 | 0 | 0 | 0,0 | 0,0 | 6,5 | 6,5 | 0,0 | 0,0 |
| `blocage-corps-avant` | 2 | 0 | 0 | 0,0 | 0,0 | 2,9 | 2,9 | 0,0 | 0,0 |
| `blocage-corps-arriere` | 2 | 0 | 0 | 0,0 | 0,0 | 2,6 | 2,6 | 0,0 | 0,0 |
| `parade` | 1 | 0 | 0 | 0,0 | 0,0 | 5,2 | 5,2 | 0,0 | 0,0 |
| `retrait` | 2 | 0 | 0 | 0,0 | 0,0 | 4,1 | 4,1 | – | – |
| `pas-avant` | 2 | 7 | 1 | 0,0 | 0,0 | 3,3 | 3,3 | – | – |
| `pas-arriere` | 2 | 7 | 1 | 0,0 | 0,0 | 3,1 | 3,1 | – | – |
| `pas-gauche` | 2 | 7 | 1 | 0,0 | 0,0 | 3,2 | 3,2 | – | – |
| `pas-droite` | 2 | 7 | 1 | 0,0 | 0,0 | 3,5 | 3,5 | – | – |
| `pivot-droite` | 1 | 5 | 2 | 0,0 | 0,0 | 5,2 | 5,2 | – | – |
| `pivot-gauche` | 1 | 5 | 2 | 0,0 | 0,0 | 5,2 | 5,2 | – | – |
| `sortie-angle` | 2 | 3 | 2 | 0,0 | 0,0 | 6,5 | 6,5 | – | – |
| `low-kick-arriere` | 4 | 6 | 3 | 5,8 | 5,8 | 10,6 | 10,6 | 6,2 | 6,2 |
| `low-kick-avant` | 4 | 6 | 1 | 5,3 | 5,3 | 9,5 | 9,5 | 5,7 | 5,7 |
| `middle-kick-arriere` | 4 | 6 | 3 | 7,5 | 7,5 | 13,5 | 13,5 | 8,0 | 8,0 |
| `middle-kick-avant` | 4 | 6 | 1 | 7,1 | 7,1 | 12,9 | 12,9 | 7,6 | 7,6 |
| `high-kick-arriere` | 4 | 4 | 3 | 8,1 | 8,1 | 14,8 | 14,8 | 8,7 | 8,7 |
| `high-kick-avant` | 4 | 10 | 3 | 9,6 | 9,6 | 20,1 | 20,1 | 10,4 | 10,4 |
| `roundhouse-arriere` | 4 | 6 | 3 | 8,7 | 8,7 | 18,3 | 18,3 | 9,4 | 9,4 |
| `roundhouse-avant` | 4 | 8 | 1 | 8,3 | 8,3 | 17,2 | 17,2 | 8,9 | 8,9 |
| `teep-avant` | 4 | 4 | 0 | 6,3 | 6,3 | 17,6 | 17,6 | 6,8 | 6,8 |
| `teep-arriere` | 4 | 2 | 2 | 6,3 | 6,3 | 17,7 | 17,7 | 6,8 | 6,8 |
| `front-kick-avant` | 4 | 4 | 0 | 6,0 | 6,0 | 12,9 | 12,9 | 6,4 | 6,4 |
| `front-kick-arriere` | 4 | 2 | 2 | 6,0 | 6,0 | 13,0 | 13,0 | 6,4 | 6,4 |
| `genou-direct-arriere` | 4 | 1 | 0 | 5,0 | 5,0 | 13,3 | 13,3 | 5,3 | 5,3 |
| `genou-direct-avant` | 4 | 2 | 1 | 4,0 | 4,0 | 11,3 | 11,3 | 4,3 | 4,3 |
| `genou-circulaire-arriere` | 4 | 1 | 0 | 5,5 | 5,5 | 14,5 | 14,5 | 5,8 | 5,8 |
| `genou-circulaire-avant` | 4 | 3 | 2 | 4,2 | 4,2 | 15,1 | 15,1 | 4,4 | 4,4 |
| `genou-direct-arriere-clinch` | 4 | 1 | 0 | 5,0 | 5,0 | 13,3 | 13,3 | 5,3 | 5,3 |
| `genou-circulaire-arriere-clinch` | 4 | 1 | 0 | 5,5 | 5,5 | 14,5 | 14,5 | 5,8 | 5,8 |
| `check-avant` | 2 | 0 | 0 | 0,0 | 0,0 | 9,0 | 9,0 | 0,0 | 0,0 |
| `check-arriere` | 2 | 0 | 0 | 0,0 | 0,0 | 17,9 | 17,9 | 0,0 | 0,0 |
| `coude-horizontal-avant` | 3 | 0 | 0 | 2,2 | 2,2 | 2,8 | 2,8 | 2,3 | 2,3 |
| `coude-horizontal-arriere` | 3 | 0 | 0 | 4,1 | 4,1 | 5,8 | 5,8 | 4,4 | 4,4 |
| `coude-diagonal-arriere` | 3 | 0 | 0 | 4,7 | 4,7 | 6,9 | 6,9 | 5,1 | 5,1 |
| `coude-diagonal-avant` | 3 | 0 | 0 | 2,8 | 2,8 | 4,0 | 4,0 | 3,0 | 3,0 |
| `coude-montant-arriere` | 3 | 0 | 0 | 4,0 | 4,0 | 6,6 | 6,6 | 4,3 | 4,3 |
| `coude-montant-avant` | 3 | 0 | 0 | 2,8 | 2,8 | 4,7 | 4,7 | 3,0 | 3,0 |
| `clinch-tirage` | 3 | 0 | 0 | 0,0 | 0,0 | 2,5 | 2,5 | 0,0 | 0,0 |
| `feinte-jab` | 1 | 0 | 0 | 0,0 | 0,0 | 4,9 | 4,9 | – | – |
| `feinte-epaule` | 1 | 0 | 0 | 0,0 | 0,0 | 3,7 | 3,7 | – | – |
| `feinte-lutte` | 1 | 0 | 0 | 0,0 | 0,0 | 11,0 | 11,0 | – | – |
| `changement-niveau` | 2 | 0 | 0 | 0,0 | 0,0 | 11,5 | 11,5 | – | – |
| `entree-lutte` | 4 | 1 | 1 | 13,9 | 13,9 | 13,7 | 13,7 | 0,0 | 0,0 |
| `sprawl` | 6 | 6 | 3 | 7,3 | 7,3 | 8,8 | 8,8 | 0,0 | 0,0 |
| `defense-lutte` | 2 | 0 | 0 | 0,0 | 0,0 | 15,4 | 15,4 | 0,0 | 0,0 |
| `descente-sol` | 2 | 2 | 1 | 0,0 | 0,0 | 12,1 | 12,3 | – | – |
| `sortie-hanche` | 3 | 1 | 1 | 4,2 | 4,2 | 4,2 | 4,2 | 0,0 | 0,1 |
| `releve-technique` | 3 | 7 | 2 | 0,0 | 0,0 | 10,9 | 10,8 | – | – |
| `pont` | 6 | 4 | 4 | 4,5 | 4,5 | 4,5 | 4,5 | 0,0 | 0,0 |
| `retention-garde` | 7 | 0 | 0 | 0,0 | 0,0 | 4,1 | 3,9 | – | – |
| `changement-base` | 4 | 2 | 0 | 0,0 | 0,0 | 9,3 | 9,3 | – | – |
| `tai-sabaki` | 4 | 4 | 2 | 0,0 | 0,0 | 5,2 | 5,2 | 0,0 | 0,1 |
| `kuzushi` | 2 | 0 | 0 | 0,0 | 0,0 | 7,2 | 7,2 | 0,0 | 0,0 |
| `uchikomi-seoi` | 4 | 1 | 0 | 13,5 | 13,5 | 13,5 | 13,5 | 0,0 | 0,0 |
