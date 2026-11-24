# 2.5.0 : os de torsion et corrections de volume aux articulations

Demande : Youssef, 20/11/2026 15:53 (heure de Paris), « oui je veux l'appliquer tout de suite aux coachs », en réponse à
la proposition du fil « Reproduire les six coachs de référence ». Base : v2.4.0 (`1684b73`), la dernière en ligne.
Restauration : `restauration/avant-torsion-v240`. Branche : `claude/project-thread-dmfpzi`. **Rien n'est fusionné ni
publié** avant le « je valide » de Youssef.

## 1. Constat vérifié

- Le squelette des six coachs (Rocketbox, os renommés Mixamo, 80 os, 81 pour Amara) n'a **aucun os de torsion ni
  aucune correction de volume** : vérifié dans les six `public/coaches/<id>/photo.glb`.
- Le moteur tourne l'avant-bras d'un bloc (55 % de la pronation, dès le coude) et la main du reste
  (`src/engine/rig.ts`, `twistFore` / `twistHand`) : la peau se tord d'un coup au coude et au poignet.
- La peau est calculée en « mélange linéaire » : dans un pli, un point partagé entre deux os prend la moyenne des
  deux positions et se rapproche de l'articulation. Mesuré sur les six coachs avec le vrai moteur
  (`docs/v250/MESURES_TORSION.md`) : en moyenne sur crochet, coup de pied haut, sprawl et garde, l'épaule perd
  44 % de son volume, le coude 35 %, la hanche 34 %, le genou 22 % (pire cas : épaule de Kadir dans le sprawl, 70 %).

## 2. Correction

Tout est dans `src/three/twist.ts`, appliqué au chargement de chaque coach (`src/three/PhotoCoach.tsx`) :

| Os d'aide (par côté) | Accroché à | Ce qu'il fait |
|---|---|---|
| `ArmTwist0`, `ArmTwist1` | bras | reprennent 60 % puis 30 % de la rotation du bras près de l'épaule et au milieu : le deltoïde ne tourne plus avec le bras entier |
| `ForeArmTwist0`, `1`, `2` | avant-bras | la torsion va de 0 au coude à toute la rotation de la main au poignet, en trois paliers |
| `UpLegTwist0`, `UpLegTwist1` | cuisse | même principe que le bras, près de l'aine et au milieu de la cuisse |
| `ShoulderHalf`, `ElbowHalf`, `HipHalf`, `KneeHalf` | parent de l'articulation | suit la moitié de la flexion : les points du pli tournent autour de l'articulation au lieu de s'y enfoncer, avec un léger gonflement (+7,9 % à 90°, comme un muscle qui se contracte) |

- Les **poids de peau** sont redistribués sur une copie de la géométrie, sur le corps et sur chaque tenue (même règle),
  4 influences par point comme avant. Les points de la tête, du tronc, des mains et des pieds gardent leurs poids.
- Les 22 os d'aide sont suivis **après chaque image**, à partir des os principaux seulement (`TwistRig.update`).
- **Inchangé** : les os principaux, leurs noms, leurs rotations ; le moteur d'animation, les limites articulaires, le
  moteur humain (visage, regard, respiration) ; les fichiers GLB, les textures, les positions et normales.
- Les mesures du moteur (`CoachRig.readOutline`) lisent toujours les poids d'origine (`REST_SKIN`) : le piège signalé
  (os au poids dominant) est évité.
- Interrupteur de comparaison : `?torsion=0` dans l'adresse (Lab) remet la peau comme en 2.4.0.

## 3. Coordination

Le fil « Reproduire les six coachs » sculpte le corps d'Amara et de Victor sur sa propre branche. Comme la correction
se fait au chargement, à partir des poids et des os du modèle, **elle s'appliquera telle quelle à leurs nouveaux
GLB** : aucun fichier modèle n'est modifié ici, rien à refaire de leur côté. Les tenues régénérées seront traitées de
la même façon.

## 4. Résultats

Mesures (`src/three/__tests__/torsion-v250.test.ts`, rapport `docs/v250/MESURES_TORSION.md`) : écart moyen au volume
de repos, avant → après : épaule 44,4 → 20,6 %, coude 35,4 → 22,2 %, poignet 5,1 → 4,3 %, hanche 34,4 → 13,2 %,
genou 22,1 → 9,0 %. Aucune articulation d'aucun coach ne perd plus de volume qu'avant (tolérance 2 points). Au repos,
la peau est identique à 0,003 mm près.

Captures WebGL réelles (Three.js, Lab, build local, Chromium SwiftShader), avant (`?torsion=0`) et après, mêmes coach,
tenue, mouvement, instant, caméra et lumière : `docs/v250/captures/raw/` (manifest `manifest.json`), planches
`docs/v250/captures/`.

## 5. Performances

- Suivi des 22 os d'aide : 3 à 20 µs selon les passages par image (Node, cette machine), pour 16 667 µs par image à 60 i/s.
- Redistribution des poids au chargement : 4 à 35 ms pour un corps entier (Node).
- Carte graphique : même nombre d'influences par point (4), donc même calcul de peau ; 22 matrices d'os en plus
  (80 → 102) dans la texture des os.
- Téléphone Android réel : **NON EXÉCUTÉ** (pas de téléphone ici). À vérifier par Youssef sur la page de test.

## 6. Limites

- Le poignet change peu dans la mesure de volume (la torsion se voit surtout dans la forme, pas dans le volume).
- Le gonflement reste volontairement léger : plus fort, l'articulation dépasse son volume de repos.
- Ce n'est pas une sculpture corrective faite à la main (formes par pose) : celles-ci demanderaient Blender et un
  travail par coach ; la correction ici est automatique et commune aux six coachs.
