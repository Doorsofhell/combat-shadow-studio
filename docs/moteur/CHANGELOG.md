# Moteur de mouvement Shadow · journal des versions

Le numéro du moteur (`ENGINE_VERSION`, `src/engine/index.ts`) est indépendant de celui de l'application. Il change à chaque modification du comportement du moteur :

- **correctif** (1.0.x) : une correction qui ne change pas l'interface ;
- **mineure** (1.x.0) : un ajout (une technique, un outil, un réglage) qui ne casse rien ;
- **majeure** (x.0.0) : un changement que l'application doit suivre.

## 1.2.2 · 2026-11-17 (application v1.51.0)

- Entrées de judo corrigées (`grappling.ts`) : pas d'entrée de seoi-nage et d'o-goshi moins croisé, retour par un pas en arrière du pied gauche (`stepBack`), bras d'o-goshi par l'extérieur, main de manche d'o-soto-gari tenue dans le repère du buste.

## 1.2.1 · 2026-11-15 (application v1.46.0)

- Trajets corrigés geste par geste, sans changement du solveur : entrée de lutte et relevé technique (`mma.ts`), retrait (`boxing.ts`), rattrapage du middle (`legs.ts`).

## 1.2.0 · 2026-11-14 (application v1.45.0)

- Main dans le tronc : `handOutOfTrunk` (`rig.ts`) ramène une main cible qui tomberait dans le tronc à sa surface (ellipses du tronc mesurées sur la peau de chaque coach, `trunkCore`). Aucune rotation automatique du coude : essayée puis retirée, elle donnait des poses non humaines.
- Épaules en pointe : la clavicule suit le bras (0,3 rad au plus) quand le bras monte au-delà de 70° et que le buste se penche en avant ; buste droit (garde) inchangé.
- Trajets corrigés geste par geste : défense de lutte, sprawl, genou circulaire et genou direct (`mma.ts`, `legs.ts`), o-soto-gari (`grappling.ts`).

## 1.1.0 · 2026-11-14 (application v1.41.0)

- Contrôles d'intégrité repris de CME-3D (`integrity.ts`) : erreurs d'écriture bloquantes (ordre des clés, valeurs non finies, poing entre 0 et 1, pied sous le tapis, impacts), utilisées par le registre et par `integrity.test.ts`.
- `withOffsets` borne la fermeture du poing à 1 (la garde d'Amara, Naël et Inaya donnait 1,15 à 1,25).
- Pieds traînés sur le tapis : `glideLift` (pied écrit au sol à deux endroits) et `lowLift` (décollage ou pose à ras du tapis) font passer le pied sur un petit arc (4,5 cm au plus) au-delà d'un pas glissé lent (0,35 à 0,75 m/s). Pieds immobiles, pivots lents et coups de pied qui montent franchement : inchangés.
- Registre : contrôlé sur les quatre coachs de l'application et leur garde (`buildRegistry(coaches)`), contrôle « Animation bien écrite ».

## 1.0.2 · 2026-11-12 (application v1.33.2)

- Anticipation procédurale des coups de poing uniquement (jabs, directs, crochets, uppercuts, overhand). Le bassin tourne jusqu’à 2,5° supplémentaires avec un pic 2,5 images à 60 FPS avant l’impact, puis revient exactement à la pose prévue au contact ; le buste conserve sa cible par contre-rotation.
- Report d’appui de 6 mm au maximum avant impact, puis petit recul de 8 mm et retour du bassin de 2° au maximum après la frappe. Le recul est ramené à zéro avant le point de fondu de l’enchaînement ; pieds et solveur inchangés.
- Enveloppes continues (pente nulle aux limites), indépendantes du taux de rafraîchissement ; mêmes poses de clés, cible et timing des coups.

## 1.0.1 · 2026-11-11 (application v1.33.1)

- Crochets et uppercuts : nouvelle phase intermédiaire d’entraînement du bassin. Dans les clés du mouvement, le pelvis avance plus tôt que la poitrine (72–78 % contre 26 % à la phase de propulsion), puis le thorax et le poing rattrapent à l’impact.
- Le repère `chestFrame` reste déterministe et compose le pelvis avec la rotation relative du buste ; aucun changement du solveur IK ni de la pose d’impact.
- Régression à vérifier sur les quatre styles de frappe, droite/gauche, gardes orthodoxe/gauchère et enchaînements.

## 1.0.0 · 2026-10-27 (application v0.49.0)

- Le moteur devient un module à part. L'application l'utilise uniquement par `src/engine/index.ts`, et le moteur ne lit rien de l'application (écrans, réglages, son, scène 3D). Un test le vérifie (`src/engine/__tests__/boundary.test.ts`).
- Ajout du lissage selon la vitesse (`MotionSmoother`), repris du labo CME-3D (PR #25).
- Comportement des 91 mouvements inchangé : aucun mouvement, aucune limite et aucun test du moteur n'a été modifié.
