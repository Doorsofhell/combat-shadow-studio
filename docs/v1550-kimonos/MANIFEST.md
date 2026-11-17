# 1.55.0 — kimonos plus fins : manifeste des captures

- **Référence** : 1.53.0, commit `920d6aa` (branche publiée `claude/project-thread-o7lrt8`), restauration `restauration/avant-kimonos-v1540`.
- **Candidate** : 1.55.0, branche `claude/project-thread-98s98b`.
- **Variable évaluée** : uniquement `public/coaches/<coach>/tenues/{judo,bjj}.glb` (5 coachs). Corps, visages, textures de peau, animations, éclairage et autres tenues identiques.
- **Captures** : rendu réel Three.js/WebGL du Lab (`#/lab?look=realiste&frame=1&champion=…&d=…&tenue=…`), Chromium SwiftShader, 420 × 620 px, facteur 1, même scène pour avant et après. Script : `scripts/dev/shot-kimonos-v1550.mjs`. Chaque capture attend `__labReady` et `__labOutfit = portee` (tenue chargée) : les 80 captures l'ont atteint, aucune erreur WebGL.
- **Vues** (par coach) : judo face (az 0), trois quarts (45), profil (90), dos (180) ; JJB trois quarts et dos ; judo o-soto-gari (`tech=o-soto-gari&at=1`) ; JJB sprawl (`tech=sprawl&at=1`), toutes en garde sauf les deux techniques.
- **Fichiers** : `captures/avant-1.53.0/<coach>-<vue>.png` et `captures/apres-1.55.0/<coach>-<vue>.png` (même nom des deux côtés).

## Mesures (distance médiane de la surface à la peau, Kadir, judo)

| pièce | 1.53.0 | 1.55.0 |
|---|---|---|
| épaisseur du tissu de la veste | 4 mm | 2 mm (JJB 1,6 mm) |
| épaisseur du pantalon et du bas de veste | 3 à 4 mm | 1,8 à 2 mm |
| col et revers | 12 mm (JJB 10) | 6 mm (JJB 5) |
| ourlets de la veste | 10 mm | 4 mm |
| ceinture | 5 mm, posée à 2 cm de la veste | 3 mm, posée à 1,1 cm de la peau |

## Constat visuel

- Dos, manches et pantalon ne moulent plus les muscles ; le bas de la veste tombe droit depuis les hanches au lieu d'épouser les fesses.
- Amara : quelques points sombres du rashguard noir traversaient déjà les manches en 1.53.0 ; la marge des manches des coachs femmes est augmentée de 4 mm, la grande tache vue sur le premier essai a disparu, quelques points isolés restent visibles de dos comme en 1.53.0.
- Limite : le bas de la veste reste un peu rigide en mouvement (pas de simulation de tissu).
