# Moteur de mouvement Shadow · journal des versions

Le numéro du moteur (`ENGINE_VERSION`, `src/engine/index.ts`) est indépendant de celui de l'application. Il change à chaque modification du comportement du moteur :

- **correctif** (1.0.x) : une correction qui ne change pas l'interface ;
- **mineure** (1.x.0) : un ajout (une technique, un outil, un réglage) qui ne casse rien ;
- **majeure** (x.0.0) : un changement que l'application doit suivre.

## 1.0.1 · 2026-11-11 (application v1.33.1)

- Crochets et uppercuts : nouvelle phase intermédiaire d’entraînement du bassin. Dans les clés du mouvement, le pelvis avance plus tôt que la poitrine (72–78 % contre 26 % à la phase de propulsion), puis le thorax et le poing rattrapent à l’impact.
- Le repère `chestFrame` reste déterministe et compose le pelvis avec la rotation relative du buste ; aucun changement du solveur IK ni de la pose d’impact.
- Régression à vérifier sur les quatre styles de frappe, droite/gauche, gardes orthodoxe/gauchère et enchaînements.

## 1.0.0 · 2026-10-27 (application v0.49.0)

- Le moteur devient un module à part. L'application l'utilise uniquement par `src/engine/index.ts`, et le moteur ne lit rien de l'application (écrans, réglages, son, scène 3D). Un test le vérifie (`src/engine/__tests__/boundary.test.ts`).
- Ajout du lissage selon la vitesse (`MotionSmoother`), repris du labo CME-3D (PR #25).
- Comportement des 91 mouvements inchangé : aucun mouvement, aucune limite et aucun test du moteur n'a été modifié.
