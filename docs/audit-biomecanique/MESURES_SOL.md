# Mesures du contact avec le tapis

Généré par `src/engine/__tests__/floor-contact.test.ts` (`AUDIT_UPDATE=1 npx vitest run floor-contact` pour le refaire).

Point le plus bas de la peau de chaque coach, en centimètres par rapport au tapis (négatif : sous le tapis), et la partie du corps
concernée, pour les mouvements qui amènent le corps au sol (une autre partie que les pieds à moins de 2 cm) ou qui l’enfoncent de plus
de 1 cm. Tolérance : 3 cm d’écrasement (chair, tenue). Les autres mouvements restent debout, pieds posés à ±1 cm du tapis.

Avant 1.8.0 : cuisses et tibias jusqu’à −20 cm (sprawl), doigts jusqu’à −14 cm (mains en appui), dos et épaules jusqu’à −13 cm
(chutes, garde), orteils jusqu’à −9 cm (entrées de judo, relevés).

| Mouvement | mma-kadir | mma-amara | nael | inaya |
|---|---|---|---|---|
| bjj changement-base | -0.8 (LeftHandMiddle3) | -1.1 (LeftToeBase) | -0.9 (LeftHandMiddle3) | -1.0 (LeftToeBase) |
| bjj pont | -0.1 (RightShoulder) | -0.8 (Hips) | -0.2 (LeftShoulder) | -0.7 (Hips) |
| bjj releve-genoux | -1.0 (LeftToeBase) | -1.2 (LeftToeBase) | -1.0 (LeftToeBase) | -1.1 (LeftToeBase) |
| bjj retention-garde | -0.9 (RightShoulder) | -0.6 (Hips) | -0.9 (RightShoulder) | -0.7 (Spine2) |
| bjj sit-out | -1.4 (LeftHandMiddle3) | -1.1 (LeftToeBase) | -1.3 (LeftHandMiddle3) | -1.0 (LeftToeBase) |
| judo uchikomi-o-uchi-gari | -1.2 (RightToeBase) | -0.7 (RightToeBase) | -1.2 (RightToeBase) | -0.7 (RightToeBase) |
| judo ukemi-ushiro | -2.8 (LeftArm) | -1.2 (Spine2) | -2.4 (RightForeArm) | -1.3 (LeftArm) |
| judo ukemi-yoko | -0.7 (RightArm) | -1.0 (RightToeBase) | -0.5 (RightToeBase) | -1.0 (RightToeBase) |
| mma descente-sol | -1.1 (LeftHandMiddle3) | -1.3 (LeftHandMiddle3) | -0.2 (RightToeBase) | -1.4 (LeftHandMiddle3) |
| mma entree-lutte | -0.5 (RightToeBase) | -1.0 (RightToeBase) | -0.5 (RightToeBase) | -1.0 (RightToeBase) |
| mma single-leg | -0.5 (RightToeBase) | -1.0 (RightToeBase) | -0.5 (RightToeBase) | -1.0 (RightToeBase) |
| mma sprawl | -2.2 (LeftUpLeg) | -2.2 (LeftLeg) | -2.4 (LeftUpLeg) | -1.8 (RightUpLeg) |
