# Mesures du moteur d’animation

Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/audit.test.ts` sur le squelette du coach homme. Ne pas modifier à la main.
Ce sont des **mesures**, pas des verdicts : leur lecture est dans [AUDIT_MOTEUR.md](AUDIT_MOTEUR.md).

- **CdM hors appuis** : distance horizontale maximale entre le centre de masse (segments de de Leva, 1996) et la surface couverte par les parties du corps au sol, puis la part de la durée du mouvement où il en sort de plus de 0,5 cm.
- **Sur un pied** : durée pendant laquelle un seul pied touche le sol et rien d’autre.
- **Point le plus bas** : hauteur du centre articulaire le plus bas. Un centre articulaire est à quelques centimètres sous la peau : en dessous d’environ 1,5 cm, la peau traverse le sol.
- **Torsion** : rotation maximale du buste par rapport au bassin, autour de l’axe vertical du bassin.
- **Glissement** : déplacement horizontal maximal, en 1/60 s, d’un pied dont l’avant reste au sol.

## Par technique

| Technique | Catégorie | CdM hors appuis (cm) | Part du temps | Sur un pied (s) | Point le plus bas (cm) | Torsion | Glissement (cm / image) |
|---|---|---|---|---|---|---|---|
| Sprawl (`sprawl`) | lutte | 50,3 | 52 % | 0,08 | -15,3 (LeftLeg) | 4° | 3,48 |
| Sortie d’angle (`sortie-angle`) | deplacement | 35,9 | 79 % | 0,29 | 3,0 (LeftToeBase) | 6° | 2,31 |
| Pas avant (`pas-avant`) | deplacement | 35,3 | 61 % | 0,25 | 3,0 (LeftToeBase) | 6° | 1,10 |
| Pont (upa) (`pont`) | sol | 33,8 | 46 % | 0,00 | 1,1 (LeftToeBase) | 11° | 4,47 |
| Pas latéral gauche (`pas-gauche`) | deplacement | 31,9 | 61 % | 0,25 | 3,0 (LeftToeBase) | 6° | 1,00 |
| Pas arrière (`pas-arriere`) | deplacement | 31,1 | 61 % | 0,25 | 3,0 (LeftToeBase) | 6° | 1,10 |
| Pas latéral droit (`pas-droite`) | deplacement | 29,8 | 61 % | 0,25 | 3,0 (LeftToeBase) | 6° | 1,00 |
| Relevé technique (`releve-technique`) | sol | 27,6 | 10 % | 0,00 | -0,9 (LeftToeBase) | 23° | 11,10 |
| Tsugi-ashi latéral (`tsugi-ashi-lateral`) | deplacement | 23,5 | 61 % | 0,25 | 3,0 (LeftToeBase) | 2° | 1,00 |
| Roundhouse jambe avant (`roundhouse-avant`) | pied | 23,3 | 20 % | 0,55 | 3,0 (LeftToeBase) | 11° | 0,20 |
| High kick gauche (`high-kick-avant`) | pied | 23,2 | 16 % | 0,55 | 3,0 (LeftToeBase) | 11° | 0,22 |
| Front kick avant (`front-kick-avant`) | pied | 22,9 | 26 % | 0,68 | 3,0 (LeftToeBase) | 6° | 0,03 |
| Middle kick gauche (`middle-kick-avant`) | pied | 22,8 | 16 % | 0,66 | 3,0 (LeftToeBase) | 11° | 0,22 |
| Check (blocage tibia) (`check-avant`) | defense | 22,1 | 26 % | 0,47 | 3,0 (LeftToeBase) | 6° | 0,07 |
| Changement de base (`changement-base`) | sol | 21,9 | 39 % | 0,00 | -0,1 (LeftToeBase) | 11° | 14,34 |
| Tsugi-ashi avant (`tsugi-ashi-avant`) | deplacement | 21,1 | 61 % | 0,25 | 3,0 (LeftToeBase) | 2° | 1,10 |
| Low kick gauche (`low-kick-avant`) | pied | 20,7 | 15 % | 0,63 | 3,0 (LeftToeBase) | 10° | 0,58 |
| Pivot (`pivot-droite`) | deplacement | 20,6 | 48 % | 0,17 | 3,0 (LeftToeBase) | 6° | 2,09 |
| Pivot extérieur (`pivot-gauche`) | deplacement | 20,3 | 48 % | 0,17 | 3,0 (LeftToeBase) | 6° | 2,09 |
| Tsugi-ashi arrière (`tsugi-ashi-arriere`) | deplacement | 17,6 | 61 % | 0,25 | 3,0 (LeftToeBase) | 2° | 1,10 |
| Genou circulaire avant (`genou-circulaire-avant`) | genou | 17,0 | 28 % | 0,45 | 3,0 (LeftToeBase) | 21° | 0,39 |
| Genou direct avant (`genou-direct-avant`) | genou | 16,8 | 26 % | 0,45 | 3,0 (LeftToeBase) | 4° | 0,25 |
| Teep (`teep-avant`) | pied | 16,5 | 23 % | 0,68 | 3,0 (LeftToeBase) | 4° | 0,03 |
| Front kick arrière (`front-kick-arriere`) | pied | 16,5 | 23 % | 0,68 | 3,0 (LeftToeBase) | 6° | 0,09 |
| Check jambe arrière (`check-arriere`) | defense | 15,2 | 21 % | 0,46 | 3,0 (LeftToeBase) | 6° | 0,86 |
| Roundhouse kick (`roundhouse-arriere`) | pied | 14,8 | 8 % | 0,55 | 3,0 (LeftToeBase) | 23° | 0,41 |
| Middle kick droit (`middle-kick-arriere`) | pied | 13,9 | 7 % | 0,66 | 3,0 (LeftToeBase) | 23° | 0,72 |
| High kick droit (`high-kick-arriere`) | pied | 13,8 | 7 % | 0,66 | 3,0 (LeftToeBase) | 23° | 0,72 |
| Descente contrôlée au sol (`descente-sol`) | sol | 12,5 | 7 % | 0,00 | -2,3 (RightToeBase) | 11° | 7,69 |
| Genou dans le clinch (`genou-clinch`) | clinch | 12,1 | 20 % | 0,45 | 3,0 (LeftToeBase) | 12° | 0,51 |
| Genou direct (`genou-direct-arriere`) | genou | 12,1 | 20 % | 0,45 | 3,0 (LeftToeBase) | 12° | 0,51 |
| Teep arrière (`teep-arriere`) | pied | 12,1 | 20 % | 0,68 | 3,0 (LeftToeBase) | 4° | 0,09 |
| Low kick droit (`low-kick-arriere`) | pied | 11,9 | 7 % | 0,63 | 3,0 (LeftToeBase) | 22° | 1,13 |
| Genou circulaire dans le clinch (`genou-circulaire-clinch`) | clinch | 11,6 | 13 % | 0,45 | 3,0 (LeftToeBase) | 29° | 0,64 |
| Genou circulaire (`genou-circulaire-arriere`) | genou | 11,6 | 13 % | 0,45 | 3,0 (LeftToeBase) | 29° | 0,64 |
| Changement de niveau (`changement-niveau`) | lutte | 7,3 | 87 % | 0,00 | 3,0 (LeftToeBase) | 4° | 0,00 |
| Défense d’entrée en lutte (`defense-lutte`) | lutte | 7,0 | 89 % | 0,00 | 3,0 (LeftToeBase) | 4° | 5,40 |
| Entrée en double-leg (solo) (`entree-lutte`) | lutte | 6,8 | 44 % | 0,00 | 3,0 (LeftToeBase) | 4° | 7,20 |
| Uchikomi de seoi-nage (solo) (`uchikomi-seoi`) | projection | 6,4 | 41 % | 0,00 | 3,0 (LeftToeBase) | 2° | 7,75 |
| Feinte de lutte (`feinte-lutte`) | feinte | 6,3 | 84 % | 0,00 | 3,0 (LeftToeBase) | 4° | 0,00 |
| Esquive extérieure (`esquive-droite`) | defense | 5,1 | 75 % | 0,00 | 3,0 (LeftToeBase) | 12° | 0,00 |
| Rotation sous le crochet (roll) (`roll-droite`) | defense | 4,1 | 54 % | 0,00 | 3,0 (LeftToeBase) | 8° | 0,00 |
| Roll de l’autre côté (`roll-gauche`) | defense | 4,1 | 48 % | 0,00 | 3,0 (LeftToeBase) | 7° | 0,00 |
| Jab au corps (`jab-corps`) | poing | 3,5 | 54 % | 0,00 | 3,0 (LeftToeBase) | 17° | 0,00 |
| Rétention de garde (solo) (`retention-garde`) | sol | 2,7 | 13 % | 0,00 | 1,1 (LeftToeBase) | 11° | 4,34 |
| Overhand (`overhand`) | poing | 1,3 | 25 % | 0,00 | 3,0 (LeftToeBase) | 13° | 0,00 |
| Posture debout de grappling (`garde-bjj`) | garde | 1,3 | 100 % | 0,00 | 3,0 (LeftToeBase) | 2° | 0,00 |
| Crochet gauche au corps (`crochet-avant-corps`) | poing | 1,0 | 30 % | 0,00 | 3,0 (RightToeBase) | 19° | 0,00 |
| Jab (`jab`) | poing | 0,8 | 28 % | 0,00 | 3,0 (LeftToeBase) | 18° | 0,00 |
| Blocage haut (`blocage-haut`) | defense | 0,7 | 64 % | 0,00 | 3,0 (LeftToeBase) | 6° | 0,00 |
| Uppercut droit (`uppercut-arriere`) | poing | 0,3 | 0 % | 0,00 | 3,0 (LeftToeBase) | 13° | 0,00 |
| Position de garde (`garde`) | garde | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 6° | 0,00 |
| Direct arrière (`direct`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 8° | 0,00 |
| Direct au corps (`direct-corps`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 9° | 0,00 |
| Crochet gauche (`crochet-avant`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 20° | 0,00 |
| Crochet droit (`crochet-arriere`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 12° | 0,00 |
| Crochet droit au corps (`crochet-arriere-corps`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 11° | 0,00 |
| Uppercut gauche (`uppercut-avant`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 14° | 0,00 |
| Esquive intérieure (`esquive-gauche`) | defense | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 6° | 0,00 |
| Blocage au corps (`blocage-corps-avant`) | defense | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 11° | 0,00 |
| Parade (`parade`) | defense | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 6° | 0,00 |
| Retrait de buste (`retrait`) | defense | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 12° | 0,00 |
| Coude horizontal gauche (`coude-horizontal-avant`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 18° | 0,00 |
| Coude horizontal droit (`coude-horizontal-arriere`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 10° | 0,00 |
| Coude diagonal descendant (`coude-diagonal-arriere`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 11° | 0,00 |
| Coude diagonal avant (`coude-diagonal-avant`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 19° | 0,00 |
| Coude remontant (`coude-montant-arriere`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 10° | 0,00 |
| Coude remontant avant (`coude-montant-avant`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 18° | 0,00 |
| Clinch simulé (tirage) (`clinch-tirage`) | clinch | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 15° | 0,00 |
| Feinte de jab (`feinte-jab`) | feinte | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 14° | 0,00 |
| Feinte d’épaule (`feinte-epaule`) | feinte | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 6° | 0,00 |
| Sortie de hanche (shrimp) (`sortie-hanche`) | sol | 0,0 | 0 % | 0,00 | -9,0 (RightLeg) | 28° | 4,32 |
| Shizen-tai (posture naturelle) (`shizen-tai`) | garde | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 2° | 0,00 |
| Tai-sabaki (rotation du corps) (`tai-sabaki`) | deplacement | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 2° | 6,59 |
| Kuzushi (déséquilibre, solo) (`kuzushi`) | projection | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 2° | 3,16 |

## Transitions dans les exercices

218 exercices joués deux fois avec le lecteur d’enchaînements de l’application, à 60 images/s. « Ajouté par la transition » : glissement maximal dans l’enchaînement moins le plus grand glissement des techniques jouées seules.

| Exercice | Enchaînement | Saut max entre deux images (cm) | Glissement max (cm / image) | Ajouté par la transition (cm / image) |
|---|---|---|---|---|
| `mma-avance-11` | jab → direct → sprawl → jab → direct → changement-niveau | 16,6 | 8,14 | 4,66 |
| `mma-expert-08` | jab → direct → sprawl → jab → low-kick-arriere → crochet-avant → changement-niveau → direct | 16,6 | 8,14 | 4,66 |
| `mma-debutant-06` | sprawl | 15,7 | 8,14 | 4,66 |
| `mma-debutant-09` | jab → direct → sprawl | 15,7 | 8,14 | 4,66 |
| `mma-intermediaire-06` | sprawl → jab → direct | 15,7 | 8,14 | 4,66 |
| `mma-avance-05` | jab → sprawl → direct → sprawl → crochet-avant | 15,7 | 8,14 | 4,66 |
| `mma-expert-09` | jab → direct → sprawl → jab → direct → sprawl → crochet-avant → direct | 15,7 | 8,14 | 4,66 |
| `mma-avance-01` | jab → direct → crochet-avant → sprawl → jab → direct | 15,7 | 8,14 | 4,66 |
| `mma-expert-02` | jab → direct → low-kick-arriere → sprawl → jab → direct → crochet-avant → overhand | 15,0 | 8,14 | 4,66 |
| `mma-intermediaire-11` | jab → middle-kick-arriere → sortie-angle | 13,1 | 5,32 | 3,01 |
| `mma-intermediaire-04` | feinte-jab → jab → direct → sortie-angle | 12,1 | 5,32 | 3,01 |
| `mma-expert-04` | defense-lutte → sprawl → direct → crochet-avant → uppercut-arriere → crochet-avant | 15,6 | 8,14 | 2,73 |
| `mma-avance-09` | jab → sortie-angle → direct → pivot-droite → crochet-avant → low-kick-arriere | 12,7 | 4,20 | 1,89 |
| `mma-avance-04` | low-kick-arriere → direct → crochet-avant → sortie-angle → jab | 12,7 | 4,18 | 1,87 |
| `mma-expert-05` | feinte-jab → jab → direct → sortie-angle → crochet-avant → direct → high-kick-arriere | 12,6 | 4,18 | 1,87 |
| `boxe-avance-03` | jab → direct → sortie-angle → crochet-avant → direct | 12,2 | 3,97 | 1,66 |
| `kickboxing-expert-10` | jab → sortie-angle → direct → low-kick-arriere → pivot-droite → crochet-avant → middle-kick-arriere | 12,0 | 3,93 | 1,62 |
| `kickboxing-avance-07` | jab → direct → sortie-angle → crochet-avant → low-kick-arriere | 12,0 | 3,91 | 1,60 |
| `bjj-debutant-05` | descente-sol → changement-base → releve-technique | 17,3 | 15,51 | 1,17 |
| `bjj-intermediaire-03` | descente-sol → sortie-hanche → changement-base → releve-technique | 17,3 | 15,51 | 1,17 |
| `bjj-avance-02` | descente-sol → pont → sortie-hanche → changement-base → releve-technique | 17,3 | 15,51 | 1,17 |
| `bjj-expert-01` | descente-sol → pont → sortie-hanche → retention-garde → changement-base → releve-technique | 17,3 | 15,51 | 1,17 |
| `bjj-expert-02` | descente-sol → pont → sortie-hanche → sortie-hanche → changement-base → pont → releve-technique | 17,3 | 15,51 | 1,17 |
| `mma-debutant-04` | low-kick-arriere | 12,7 | 1,95 | 0,82 |
| `mma-debutant-08` | jab → direct → low-kick-arriere | 12,7 | 1,95 | 0,82 |
| `mma-intermediaire-03` | low-kick-arriere → direct → crochet-avant | 12,7 | 1,94 | 0,81 |
| `mma-debutant-10` | descente-sol → releve-technique | 19,5 | 11,74 | 0,65 |
| `mma-intermediaire-08` | descente-sol → sortie-hanche → releve-technique | 19,5 | 11,74 | 0,65 |
| `mma-avance-06` | descente-sol → sortie-hanche → sortie-hanche → releve-technique → jab → direct | 19,5 | 11,74 | 0,65 |
| `mma-expert-03` | jab → direct → descente-sol → sortie-hanche → releve-technique → jab → direct → crochet-avant | 19,5 | 11,74 | 0,65 |
| `judo-avance-04` | tai-sabaki → tsugi-ashi-avant → uchikomi-seoi | 20,3 | 8,08 | 0,33 |
| `judo-expert-01` | tsugi-ashi-avant → kuzushi → uchikomi-seoi → tsugi-ashi-arriere → kuzushi → uchikomi-seoi | 20,3 | 8,08 | 0,33 |
| `judo-expert-02` | tsugi-ashi-lateral → tai-sabaki → kuzushi → uchikomi-seoi → tsugi-ashi-arriere → uchikomi-seoi | 20,3 | 8,08 | 0,33 |
| `judo-intermediaire-02` | uchikomi-seoi | 20,3 | 8,08 | 0,33 |
| `judo-avance-01` | kuzushi → uchikomi-seoi | 20,3 | 8,08 | 0,33 |
| `judo-avance-03` | uchikomi-seoi → uchikomi-seoi → uchikomi-seoi | 20,3 | 8,08 | 0,33 |
| `judo-expert-03` | uchikomi-seoi → uchikomi-seoi → uchikomi-seoi → uchikomi-seoi → uchikomi-seoi | 20,3 | 8,08 | 0,33 |
| `judo-avance-02` | tsugi-ashi-arriere → kuzushi → uchikomi-seoi | 20,3 | 8,08 | 0,33 |
| `mma-expert-01` | jab → direct → crochet-avant → changement-niveau → entree-lutte → direct | 16,6 | 7,46 | 0,26 |
| `mma-avance-03` | jab → overhand → changement-niveau → entree-lutte | 16,6 | 7,46 | 0,26 |
| `mma-expert-06` | pas-avant → jab → direct → pas-avant → crochet-avant → changement-niveau → entree-lutte | 16,6 | 7,46 | 0,26 |
| `mma-intermediaire-02` | direct → crochet-avant → changement-niveau | 16,6 | 0,03 | 0,03 |
| `boxe-intermediaire-11` | jab-corps → jab → direct | 15,9 | 0,02 | 0,02 |
| `boxe-avance-04` | jab-corps → direct-corps → crochet-avant → uppercut-arriere | 15,9 | 0,02 | 0,02 |
| `boxe-expert-07` | jab-corps → direct → crochet-avant-corps → crochet-avant → direct-corps → uppercut-arriere → crochet-avant | 15,9 | 0,02 | 0,02 |
| `mma-intermediaire-07` | front-kick-avant → jab → changement-niveau | 16,7 | 0,05 | 0,02 |
| `mma-debutant-05` | changement-niveau | 16,6 | 0,00 | 0,00 |
| `bjj-debutant-02` | descente-sol → releve-technique | 17,3 | 11,09 | 0,00 |
| `bjj-debutant-03` | descente-sol → pont → releve-technique | 17,3 | 11,09 | 0,00 |
| `bjj-debutant-04` | descente-sol → sortie-hanche → releve-technique | 17,3 | 11,09 | 0,00 |
| `bjj-intermediaire-01` | descente-sol → pont → sortie-hanche → releve-technique | 17,3 | 11,09 | 0,00 |
| `bjj-intermediaire-02` | descente-sol → retention-garde → releve-technique | 17,3 | 11,09 | 0,00 |
| `bjj-intermediaire-04` | descente-sol → sortie-hanche → sortie-hanche → releve-technique | 17,3 | 11,09 | 0,00 |
| `bjj-avance-01` | descente-sol → pont → sortie-hanche → retention-garde → releve-technique | 17,3 | 11,09 | 0,00 |
| `bjj-avance-03` | descente-sol → retention-garde → sortie-hanche → releve-technique | 17,3 | 11,09 | 0,00 |
| `bjj-avance-04` | descente-sol → pont → pont → sortie-hanche → sortie-hanche → releve-technique | 17,3 | 11,09 | 0,00 |
| `bjj-expert-03` | descente-sol → retention-garde → pont → sortie-hanche → retention-garde → releve-technique | 17,3 | 11,09 | 0,00 |
| `muaythai-expert-02` | teep-avant → jab → direct → crochet-avant → coude-horizontal-arriere → genou-direct-arriere → coude-montant-avant → middle-kick-arriere | 19,9 | 0,67 | 0,00 |
| `muaythai-avance-11` | jab → direct → middle-kick-arriere → jab → direct → genou-direct-arriere | 19,9 | 0,67 | 0,00 |
| `muaythai-expert-09` | direct → crochet-avant → middle-kick-arriere → direct → genou-direct-arriere → coude-horizontal-arriere → high-kick-arriere | 19,9 | 0,67 | 0,00 |
| `muaythai-expert-11` | jab → direct → crochet-avant → uppercut-arriere → coude-horizontal-avant → genou-direct-arriere → high-kick-arriere | 19,9 | 0,67 | 0,00 |
| `kickboxing-avance-09` | jab-corps → direct → crochet-avant-corps → middle-kick-arriere | 15,8 | 0,66 | 0,00 |
| `kickboxing-avance-12` | jab → direct → middle-kick-arriere → genou-direct-arriere | 16,5 | 0,65 | 0,00 |
| `muaythai-expert-07` | pas-avant → jab → direct → pas-avant → genou-direct-arriere → coude-horizontal-avant → pas-arriere → teep-avant | 19,9 | 1,03 | 0,00 |
| `muaythai-intermediaire-09` | clinch-tirage → genou-clinch → genou-clinch | 19,9 | 0,22 | 0,00 |
| `muaythai-expert-10` | coude-horizontal-avant → coude-horizontal-arriere → genou-direct-arriere → genou-circulaire-avant → coude-diagonal-arriere → coude-montant-arriere | 19,9 | 0,22 | 0,00 |
| `muaythai-intermediaire-04` | direct → genou-direct-arriere → coude-horizontal-avant | 19,9 | 0,22 | 0,00 |
| `muaythai-debutant-07` | genou-direct-arriere | 19,9 | 0,22 | 0,00 |
| `muaythai-debutant-11` | jab → direct → genou-direct-arriere | 19,9 | 0,22 | 0,00 |
| `muaythai-avance-01` | jab → direct → crochet-avant → genou-direct-arriere | 19,9 | 0,22 | 0,00 |
| `muaythai-expert-03` | check-avant → blocage-haut → esquive-droite → direct → coude-horizontal-avant → genou-direct-arriere | 19,9 | 0,22 | 0,00 |
| `kickboxing-debutant-12` | genou-direct-arriere | 16,5 | 0,22 | 0,00 |
| `kickboxing-debutant-13` | jab → direct → genou-direct-arriere | 16,5 | 0,22 | 0,00 |
| `kickboxing-intermediaire-13` | jab → crochet-avant → genou-direct-arriere | 16,5 | 0,22 | 0,00 |
| `mma-avance-07` | jab → direct → genou-direct-arriere | 15,2 | 0,21 | 0,00 |
| `mma-expert-10` | jab → direct → genou-direct-arriere → crochet-avant → uppercut-arriere | 15,2 | 0,21 | 0,00 |
| `kickboxing-intermediaire-12` | genou-circulaire-arriere | 15,2 | 0,28 | 0,00 |
| `muaythai-intermediaire-08` | genou-circulaire-arriere | 18,4 | 0,28 | 0,00 |
| `muaythai-avance-04` | clinch-tirage → genou-clinch → genou-circulaire-clinch → genou-clinch | 19,9 | 0,28 | 0,00 |
| `muaythai-expert-04` | clinch-tirage → genou-clinch → genou-circulaire-clinch → genou-clinch → coude-diagonal-arriere → coude-montant-arriere | 19,9 | 0,28 | 0,00 |
| `muaythai-expert-08` | teep-avant → jab → direct → low-kick-arriere → check-avant → middle-kick-arriere → genou-direct-arriere | 19,9 | 0,65 | 0,00 |
| `muaythai-expert-01` | jab → direct → crochet-avant → coude-horizontal-arriere → genou-direct-arriere → low-kick-arriere | 19,9 | 0,64 | 0,00 |
| `muaythai-expert-05` | jab → direct → crochet-avant → direct → low-kick-arriere → teep-avant → jab → direct → genou-direct-arriere → coude-horizontal-avant | 19,9 | 0,64 | 0,00 |
| `kickboxing-expert-12` | jab → direct → genou-direct-arriere → crochet-avant → low-kick-arriere | 16,5 | 0,63 | 0,00 |

Exercices sans glissement ajouté de plus de 0,5 cm par image ni saut de plus de 15 cm : 134 sur 218.
