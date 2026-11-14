# Intégrité des animations (contrôles repris de CME-3D)

Généré par `UPDATE_INTEGRITY=1 npx vitest run src/engine/__tests__/integrity.test.ts`. Ne pas modifier à la main.

Contrôlé : 4 coachs (Kadir, Amara, Naël, Inaya), 6 styles, garde de la discipline et garde du coach, droitier et gaucher, soit 96 bibliothèques et 8448 animations.

## Erreurs (bloquantes)

Ordre et origine des images clés, valeurs non finies (hanches, rotations, mains, pieds), fermeture du poing entre 0 et 1, pied d’appui à plus de 5 mm sous le tapis, impacts dans la durée du mouvement.

Résultat : 0 erreur.

## Signalements à revoir

Lus sur les images clés seulement (pas sur le mouvement joué) : hanches à plus de 4 m/s entre deux clés (`HIP_SPEED`), changement brusque de vitesse des hanches au-delà de 45 m/s² (`HIP_ACCELERATION`), deux clés à moins de 25 ms (`KEY_INTERVAL`). Ce sont des endroits à regarder, pas des défauts : un coup de pied est un geste explosif.

| Technique (animation) | Coach | Contrôle | Pire valeur | Styles |
|---|---|---|---|---|
| `high-kick-arriere` | mma-kadir | HIP_ACCELERATION | abrupt change of hip speed (47 m/s²) | bjj |
| `high-kick-avant` | inaya | HIP_ACCELERATION | abrupt change of hip speed (52 m/s²) | mma, bjj |
| `high-kick-avant` | mma-amara | HIP_ACCELERATION | abrupt change of hip speed (52 m/s²) | mma, bjj |
| `high-kick-avant` | mma-kadir | HIP_ACCELERATION | abrupt change of hip speed (62 m/s²) | boxing, kickboxing, mma, muaythai, bjj, judo |
| `high-kick-avant` | nael | HIP_ACCELERATION | abrupt change of hip speed (58 m/s²) | mma, bjj |
| `roundhouse-arriere` | inaya | HIP_ACCELERATION | abrupt change of hip speed (46 m/s²) | bjj |
| `roundhouse-arriere` | mma-amara | HIP_ACCELERATION | abrupt change of hip speed (46 m/s²) | bjj |
| `roundhouse-arriere` | mma-kadir | HIP_ACCELERATION | abrupt change of hip speed (61 m/s²) | boxing, mma, bjj |
| `roundhouse-arriere` | nael | HIP_ACCELERATION | abrupt change of hip speed (56 m/s²) | mma, bjj |
| `roundhouse-avant` | mma-kadir | HIP_ACCELERATION | abrupt change of hip speed (47 m/s²) | bjj |

## Contrôle non retenu

`PLANTED_FOOT_MOVE` (pied d’appui qui change de place entre deux clés) : 10144 signalements, presque tous des pas et des pivots voulus. Le glissement que le coach montre vraiment est mesuré sur le squelette posé, image par image (MESURES_GLISSEMENT.md).
