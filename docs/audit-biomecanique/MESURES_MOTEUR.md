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
| Sortie d’angle (`sortie-angle`) | deplacement | 34,8 | 85 % | 0,27 | 3,0 (LeftToeBase) | 8° | 1,23 |
| Pas avant (`pas-avant`) | deplacement | 34,5 | 51 % | 0,21 | 3,0 (LeftToeBase) | 6° | 0,64 |
| Pont (upa) (`pont`) | sol | 33,4 | 46 % | 0,00 | 1,1 (LeftToeBase) | 11° | 4,47 |
| Pas arrière (`pas-arriere`) | deplacement | 33,0 | 51 % | 0,21 | 3,0 (LeftToeBase) | 6° | 0,64 |
| Pas latéral gauche (`pas-gauche`) | deplacement | 31,4 | 51 % | 0,21 | 3,0 (LeftToeBase) | 6° | 0,58 |
| Pas latéral droit (`pas-droite`) | deplacement | 30,3 | 51 % | 0,21 | 3,0 (LeftToeBase) | 6° | 0,58 |
| Relevé depuis les genoux (`releve-genoux`) | sol | 28,7 | 54 % | 1,01 | -0,1 (LeftToeBase) | 4° | 5,70 |
| Sit-out (`sit-out`) | sol | 28,0 | 44 % | 0,00 | -0,5 (LeftToeBase) | 12° | 14,51 |
| Relevé technique (`releve-technique`) | sol | 27,2 | 10 % | 0,00 | 0,1 (LeftToeBase) | 23° | 11,10 |
| Check hook (crochet pivot) (`check-hook`) | poing | 23,6 | 57 % | 0,26 | 3,0 (LeftToeBase) | 20° | 1,93 |
| Front kick avant (`front-kick-avant`) | pied | 22,8 | 26 % | 0,68 | 3,0 (LeftToeBase) | 6° | 0,03 |
| Tsugi-ashi latéral (`tsugi-ashi-lateral`) | deplacement | 22,8 | 51 % | 0,21 | 3,0 (LeftToeBase) | 2° | 0,58 |
| Check (blocage tibia) (`check-avant`) | defense | 22,1 | 26 % | 0,47 | 3,0 (LeftToeBase) | 6° | 0,09 |
| Changement de base (`changement-base`) | sol | 21,9 | 43 % | 0,00 | -0,5 (LeftToeBase) | 11° | 14,38 |
| Pivot (`pivot-droite`) | deplacement | 21,6 | 59 % | 0,17 | 3,0 (LeftToeBase) | 6° | 2,13 |
| Uchikomi d’o-soto-gari (solo) (`uchikomi-o-soto-gari`) | projection | 21,4 | 28 % | 1,36 | 3,0 (LeftToeBase) | 2° | 3,19 |
| Tsugi-ashi avant (`tsugi-ashi-avant`) | deplacement | 20,5 | 51 % | 0,21 | 3,0 (LeftToeBase) | 2° | 0,64 |
| Tsugi-ashi arrière (`tsugi-ashi-arriere`) | deplacement | 19,1 | 51 % | 0,21 | 3,0 (LeftToeBase) | 2° | 0,64 |
| Pivot extérieur (`pivot-gauche`) | deplacement | 19,0 | 48 % | 0,17 | 3,0 (LeftToeBase) | 17° | 2,40 |
| Rattrapage du middle kick (`rattrapage-middle`) | defense | 18,2 | 28 % | 0,37 | 3,0 (LeftToeBase) | 14° | 0,16 |
| Switch kick (`switch-kick`) | pied | 16,8 | 10 % | 0,74 | 3,0 (RightToeBase) | 20° | 15,79 |
| Front kick arrière (`front-kick-arriere`) | pied | 16,5 | 23 % | 0,68 | 3,0 (LeftToeBase) | 6° | 0,09 |
| Teep (`teep-avant`) | pied | 16,5 | 23 % | 0,68 | 3,0 (LeftToeBase) | 4° | 0,03 |
| Uchikomi de ko-uchi-gari (solo) (`uchikomi-ko-uchi-gari`) | projection | 15,7 | 26 % | 0,43 | -2,0 (RightToeBase) | 2° | 8,63 |
| Yoko-ukemi (chute latérale, version basse) (`ukemi-yoko`) | chute | 15,6 | 62 % | 0,00 | -3,9 (RightToeBase) | 4° | 1,09 |
| Check jambe arrière (`check-arriere`) | defense | 15,2 | 21 % | 0,46 | 3,0 (LeftToeBase) | 6° | 0,86 |
| Uchikomi d’o-uchi-gari (solo) (`uchikomi-o-uchi-gari`) | projection | 15,0 | 31 % | 0,67 | -4,4 (RightToeBase) | 2° | 5,69 |
| Ushiro-ukemi (chute arrière, version basse) (`ukemi-ushiro`) | chute | 14,9 | 43 % | 0,00 | -3,9 (RightToeBase) | 4° | 1,07 |
| Ayumi-ashi (pas marchés) (`ayumi-ashi`) | deplacement | 13,8 | 43 % | 0,37 | 3,0 (LeftToeBase) | 4° | 1,31 |
| Descente contrôlée au sol (`descente-sol`) | sol | 13,7 | 7 % | 0,00 | -2,4 (RightToeBase) | 11° | 8,31 |
| Teep arrière (`teep-arriere`) | pied | 12,1 | 21 % | 0,68 | 3,0 (LeftToeBase) | 4° | 0,09 |
| Entrée en double-leg (solo) (`entree-lutte`) | lutte | 8,2 | 44 % | 0,00 | 3,0 (LeftToeBase) | 9° | 6,94 |
| Uchikomi de seoi-nage (solo) (`uchikomi-seoi`) | projection | 8,2 | 43 % | 0,00 | 3,0 (LeftToeBase) | 15° | 7,76 |
| Entrée en single-leg (solo) (`single-leg`) | lutte | 8,0 | 44 % | 0,00 | 3,0 (LeftToeBase) | 9° | 6,48 |
| Roundhouse jambe avant (`roundhouse-avant`) | pied | 7,6 | 21 % | 0,58 | 3,0 (LeftToeBase) | 11° | 0,05 |
| High kick gauche (`high-kick-avant`) | pied | 7,5 | 21 % | 0,58 | 3,0 (LeftToeBase) | 11° | 0,05 |
| Changement de niveau (`changement-niveau`) | lutte | 7,3 | 87 % | 0,00 | 3,0 (LeftToeBase) | 5° | 0,00 |
| Low kick gauche (`low-kick-avant`) | pied | 6,8 | 18 % | 0,69 | 3,0 (LeftToeBase) | 10° | 0,00 |
| Middle kick gauche (`middle-kick-avant`) | pied | 6,8 | 18 % | 0,69 | 3,0 (LeftToeBase) | 11° | 0,00 |
| Défense d’entrée en lutte (`defense-lutte`) | lutte | 6,7 | 82 % | 0,00 | 3,0 (LeftToeBase) | 4° | 5,79 |
| Feinte de lutte (`feinte-lutte`) | feinte | 6,3 | 82 % | 0,00 | 3,0 (LeftToeBase) | 4° | 0,00 |
| Uchikomi d’o-goshi (solo) (`uchikomi-o-goshi`) | projection | 6,0 | 43 % | 0,00 | 3,0 (RightToeBase) | 16° | 6,93 |
| High kick droit (`high-kick-arriere`) | pied | 5,1 | 3 % | 0,64 | 3,0 (LeftToeBase) | 23° | 0,20 |
| Esquive extérieure (`esquive-droite`) | defense | 5,1 | 75 % | 0,00 | 3,0 (LeftToeBase) | 16° | 0,00 |
| Middle kick droit (`middle-kick-arriere`) | pied | 5,0 | 2 % | 0,64 | 3,0 (LeftToeBase) | 23° | 0,20 |
| Low kick droit (`low-kick-arriere`) | pied | 4,8 | 2 % | 0,64 | 3,0 (LeftToeBase) | 22° | 0,21 |
| Roundhouse kick (`roundhouse-arriere`) | pied | 4,4 | 2 % | 0,52 | 3,0 (LeftToeBase) | 23° | 0,03 |
| Genou circulaire avant (`genou-circulaire-avant`) | genou | 4,2 | 16 % | 0,53 | 3,0 (LeftToeBase) | 21° | 0,02 |
| Roll de l’autre côté (`roll-gauche`) | defense | 4,1 | 46 % | 0,00 | 3,0 (LeftToeBase) | 7° | 0,00 |
| Genou direct avant (`genou-direct-avant`) | genou | 4,0 | 15 % | 0,53 | 3,0 (LeftToeBase) | 4° | 0,02 |
| Rotation sous le crochet (roll) (`roll-droite`) | defense | 3,9 | 54 % | 0,00 | 3,0 (LeftToeBase) | 7° | 0,00 |
| Jab au corps (`jab-corps`) | poing | 3,5 | 54 % | 0,00 | 3,0 (LeftToeBase) | 19° | 0,00 |
| Rétention de garde (solo) (`retention-garde`) | sol | 3,0 | 15 % | 0,00 | 1,1 (LeftToeBase) | 11° | 4,34 |
| Crochet gauche au corps (`crochet-avant-corps`) | poing | 2,0 | 39 % | 0,00 | 3,0 (LeftToeBase) | 24° | 0,00 |
| Posture debout de grappling (`garde-bjj`) | garde | 1,3 | 100 % | 0,00 | 3,0 (LeftToeBase) | 2° | 0,00 |
| Overhand (`overhand`) | poing | 1,2 | 25 % | 0,00 | 3,0 (LeftToeBase) | 21° | 0,00 |
| Genou circulaire dans le clinch (`genou-circulaire-clinch`) | clinch | 1,0 | 2 % | 0,50 | 3,0 (LeftToeBase) | 29° | 0,01 |
| Genou circulaire (`genou-circulaire-arriere`) | genou | 1,0 | 2 % | 0,50 | 3,0 (LeftToeBase) | 29° | 0,01 |
| Genou dans le clinch (`genou-clinch`) | clinch | 0,9 | 2 % | 0,50 | 3,0 (LeftToeBase) | 12° | 0,01 |
| Genou direct (`genou-direct-arriere`) | genou | 0,7 | 2 % | 0,50 | 3,0 (LeftToeBase) | 12° | 0,01 |
| Jab (`jab`) | poing | 0,7 | 25 % | 0,00 | 3,0 (LeftToeBase) | 20° | 0,00 |
| Blocage haut (`blocage-haut`) | defense | 0,7 | 64 % | 0,00 | 3,0 (LeftToeBase) | 6° | 0,00 |
| Tai-sabaki (rotation du corps) (`tai-sabaki`) | deplacement | 0,1 | 0 % | 0,00 | 3,0 (LeftToeBase) | 14° | 7,21 |
| Position de garde (`garde`) | garde | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 6° | 0,00 |
| Direct arrière (`direct`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 17° | 0,00 |
| Direct au corps (`direct-corps`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 18° | 0,00 |
| Crochet gauche (`crochet-avant`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 25° | 0,00 |
| Crochet droit (`crochet-arriere`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 20° | 0,00 |
| Crochet droit au corps (`crochet-arriere-corps`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 19° | 0,00 |
| Uppercut gauche (`uppercut-avant`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 24° | 0,00 |
| Uppercut droit (`uppercut-arriere`) | poing | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 23° | 0,00 |
| Esquive intérieure (`esquive-gauche`) | defense | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 6° | 0,00 |
| Blocage au corps (`blocage-corps-avant`) | defense | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 11° | 0,00 |
| Parade (`parade`) | defense | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 6° | 0,00 |
| Retrait de buste (`retrait`) | defense | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 12° | 0,00 |
| Shoulder roll (rouler l’épaule) (`shoulder-roll`) | defense | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 26° | 0,00 |
| Garde longue (`garde-longue`) | defense | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 13° | 0,00 |
| Coude horizontal gauche (`coude-horizontal-avant`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 27° | 0,00 |
| Coude horizontal droit (`coude-horizontal-arriere`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 19° | 0,00 |
| Coude diagonal descendant (`coude-diagonal-arriere`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 20° | 0,00 |
| Coude diagonal avant (`coude-diagonal-avant`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 28° | 0,00 |
| Coude remontant (`coude-montant-arriere`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 19° | 0,00 |
| Coude remontant avant (`coude-montant-avant`) | coude | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 27° | 0,00 |
| Clinch simulé (tirage) (`clinch-tirage`) | clinch | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 20° | 0,00 |
| Feinte de jab (`feinte-jab`) | feinte | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 14° | 0,00 |
| Feinte d’épaule (`feinte-epaule`) | feinte | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 6° | 0,00 |
| Sortie de hanche (shrimp) (`sortie-hanche`) | sol | 0,0 | 0 % | 0,00 | 3,0 (RightToeBase) | 28° | 4,32 |
| Shizen-tai (posture naturelle) (`shizen-tai`) | garde | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 2° | 0,00 |
| Kuzushi (déséquilibre, solo) (`kuzushi`) | projection | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 7° | 3,46 |
| Kumi-kata (prise de garde, solo) (`kumikata`) | garde | 0,0 | 0 % | 0,00 | 3,0 (LeftToeBase) | 8° | 0,00 |

## Transitions dans les exercices

254 exercices joués deux fois avec le lecteur d’enchaînements de l’application, à 60 images/s. « Ajouté par la transition » : glissement maximal dans l’enchaînement moins le plus grand glissement des techniques jouées seules.

| Exercice | Enchaînement | Saut max entre deux images (cm) | Glissement max (cm / image) | Ajouté par la transition (cm / image) |
|---|---|---|---|---|
| `mma-expert-08` | jab → direct → sprawl → jab → low-kick-arriere → crochet-avant → changement-niveau → direct | 16,6 | 8,14 | 4,66 |
| `mma-avance-11` | jab → direct → sprawl → jab → direct → changement-niveau | 16,6 | 8,14 | 4,66 |
| `mma-debutant-09` | jab → direct → sprawl | 15,7 | 8,14 | 4,66 |
| `mma-avance-05` | jab → sprawl → direct → sprawl → crochet-avant | 15,7 | 8,14 | 4,66 |
| `mma-expert-09` | jab → direct → sprawl → jab → direct → sprawl → crochet-avant → direct | 15,7 | 8,14 | 4,66 |
| `mma-avance-01` | jab → direct → crochet-avant → sprawl → jab → direct | 15,7 | 8,14 | 4,66 |
| `mma-intermediaire-06` | sprawl → jab → direct | 15,7 | 8,14 | 4,66 |
| `mma-debutant-06` | sprawl | 15,7 | 8,14 | 4,66 |
| `mma-expert-02` | jab → direct → low-kick-arriere → sprawl → jab → direct → crochet-avant → overhand | 13,1 | 8,14 | 4,66 |
| `mma-intermediaire-11` | jab → middle-kick-arriere → sortie-angle | 15,5 | 5,88 | 4,65 |
| `mma-intermediaire-04` | feinte-jab → jab → direct → sortie-angle | 12,1 | 5,88 | 4,65 |
| `kickboxing-avance-14` | jab → direct → switch-kick | 13,9 | 19,05 | 3,26 |
| `kickboxing-intermediaire-14` | switch-kick | 13,9 | 19,05 | 3,26 |
| `mma-avance-04` | low-kick-arriere → direct → crochet-avant → sortie-angle → jab | 13,1 | 4,18 | 2,95 |
| `mma-expert-05` | feinte-jab → jab → direct → sortie-angle → crochet-avant → direct → high-kick-arriere | 16,1 | 4,18 | 2,94 |
| `boxe-avance-03` | jab → direct → sortie-angle → crochet-avant → direct | 13,1 | 3,97 | 2,74 |
| `kickboxing-avance-07` | jab → direct → sortie-angle → crochet-avant → low-kick-arriere | 12,6 | 3,91 | 2,68 |
| `bjj-debutant-07` | ukemi-ushiro | 9,0 | 3,44 | 2,37 |
| `mma-expert-04` | defense-lutte → sprawl → direct → crochet-avant → uppercut-arriere → crochet-avant | 15,6 | 8,14 | 2,35 |
| `mma-avance-09` | jab → sortie-angle → direct → pivot-droite → crochet-avant → low-kick-arriere | 13,1 | 4,34 | 2,21 |
| `kickboxing-expert-10` | jab → sortie-angle → direct → low-kick-arriere → pivot-droite → crochet-avant → middle-kick-arriere | 13,7 | 4,06 | 1,93 |
| `judo-avance-05` | uchikomi-o-uchi-gari | 5,3 | 7,33 | 1,64 |
| `muaythai-avance-10` | pas-avant → teep-avant → pas-avant → jab → direct → low-kick-arriere | 14,8 | 1,92 | 1,28 |
| `kickboxing-expert-06` | pas-avant → jab → direct → pas-avant → crochet-avant → direct → low-kick-arriere | 12,6 | 1,92 | 1,28 |
| `kickboxing-expert-08` | jab → direct → low-kick-arriere → check-avant → direct → crochet-avant → middle-kick-arriere → pas-arriere | 13,7 | 1,92 | 1,28 |
| `muaythai-avance-12` | switch-kick | 13,6 | 17,02 | 1,23 |
| `muaythai-avance-13` | jab → switch-kick | 13,6 | 17,02 | 1,23 |
| `bjj-debutant-08` | releve-genoux | 6,1 | 6,74 | 1,05 |
| `bjj-debutant-05` | descente-sol → changement-base → releve-technique | 17,3 | 15,33 | 0,95 |
| `bjj-intermediaire-03` | descente-sol → sortie-hanche → changement-base → releve-technique | 17,3 | 15,33 | 0,95 |
| `bjj-avance-02` | descente-sol → pont → sortie-hanche → changement-base → releve-technique | 17,3 | 15,33 | 0,95 |
| `bjj-expert-01` | descente-sol → pont → sortie-hanche → retention-garde → changement-base → releve-technique | 17,3 | 15,33 | 0,95 |
| `bjj-expert-02` | descente-sol → pont → sortie-hanche → sortie-hanche → changement-base → pont → releve-technique | 17,3 | 15,33 | 0,95 |
| `judo-debutant-07` | ukemi-ushiro | 9,0 | 1,90 | 0,83 |
| `mma-intermediaire-13` | descente-sol → sit-out → releve-technique | 19,5 | 15,33 | 0,82 |
| `bjj-debutant-06` | descente-sol → sit-out → releve-technique | 17,3 | 15,33 | 0,82 |
| `bjj-intermediaire-07` | descente-sol → changement-base → sit-out → releve-technique | 17,3 | 15,33 | 0,82 |
| `bjj-avance-06` | releve-genoux → descente-sol → sit-out → releve-technique | 17,3 | 15,33 | 0,82 |
| `bjj-expert-04` | changement-niveau → entree-lutte → single-leg → descente-sol → sit-out → sortie-hanche → releve-technique | 17,3 | 15,33 | 0,82 |
| `judo-intermediaire-07` | ukemi-yoko | 17,5 | 1,90 | 0,81 |
| `judo-expert-05` | ukemi-ushiro → ukemi-yoko → ukemi-ushiro | 17,5 | 1,90 | 0,81 |
| `judo-intermediaire-01` | kuzushi | 9,9 | 4,14 | 0,69 |
| `judo-intermediaire-03` | tsugi-ashi-avant → kuzushi | 9,9 | 4,14 | 0,69 |
| `mma-debutant-10` | descente-sol → releve-technique | 19,5 | 11,74 | 0,65 |
| `mma-intermediaire-08` | descente-sol → sortie-hanche → releve-technique | 19,5 | 11,74 | 0,65 |
| `mma-avance-06` | descente-sol → sortie-hanche → sortie-hanche → releve-technique → jab → direct | 19,5 | 11,74 | 0,65 |
| `mma-expert-03` | jab → direct → descente-sol → sortie-hanche → releve-technique → jab → direct → crochet-avant | 19,5 | 11,74 | 0,65 |
| `bjj-avance-05` | changement-niveau → single-leg → entree-lutte | 12,6 | 7,46 | 0,52 |
| `bjj-intermediaire-06` | entree-lutte | 11,6 | 7,46 | 0,52 |
| `mma-expert-01` | jab → direct → crochet-avant → changement-niveau → entree-lutte → direct | 16,6 | 7,46 | 0,52 |
| `mma-avance-03` | jab → overhand → changement-niveau → entree-lutte | 16,6 | 7,46 | 0,52 |
| `mma-avance-02` | jab → feinte-lutte → direct → crochet-avant → entree-lutte | 14,6 | 7,46 | 0,52 |
| `mma-expert-07` | jab → direct → crochet-avant → low-kick-arriere → jab → overhand → crochet-avant → feinte-lutte → entree-lutte → direct | 14,6 | 7,46 | 0,52 |
| `mma-intermediaire-05` | jab → direct → entree-lutte | 14,0 | 7,46 | 0,52 |
| `mma-expert-06` | pas-avant → jab → direct → pas-avant → crochet-avant → changement-niveau → entree-lutte | 16,6 | 7,46 | 0,52 |
| `judo-intermediaire-05` | uchikomi-o-goshi | 18,0 | 7,31 | 0,37 |
| `judo-intermediaire-08` | kumikata → uchikomi-o-goshi | 18,0 | 7,31 | 0,37 |
| `muaythai-expert-04` | clinch-tirage → genou-clinch → genou-circulaire-clinch → genou-clinch → coude-diagonal-arriere → coude-montant-arriere | 19,9 | 0,36 | 0,35 |
| `muaythai-expert-10` | coude-horizontal-avant → coude-horizontal-arriere → genou-direct-arriere → genou-circulaire-avant → coude-diagonal-arriere → coude-montant-arriere | 17,5 | 0,36 | 0,34 |
| `judo-intermediaire-02` | uchikomi-seoi | 20,3 | 8,10 | 0,34 |
| `judo-avance-01` | kuzushi → uchikomi-seoi | 20,3 | 8,10 | 0,34 |
| `judo-avance-02` | tsugi-ashi-arriere → kuzushi → uchikomi-seoi | 20,3 | 8,10 | 0,34 |
| `judo-avance-03` | uchikomi-seoi → uchikomi-seoi → uchikomi-seoi | 20,3 | 8,10 | 0,34 |
| `judo-expert-01` | tsugi-ashi-avant → kuzushi → uchikomi-seoi → tsugi-ashi-arriere → kuzushi → uchikomi-seoi | 20,3 | 8,10 | 0,34 |
| `judo-expert-02` | tsugi-ashi-lateral → tai-sabaki → kuzushi → uchikomi-seoi → tsugi-ashi-arriere → uchikomi-seoi | 20,3 | 8,10 | 0,34 |
| `judo-expert-03` | uchikomi-seoi → uchikomi-seoi → uchikomi-seoi → uchikomi-seoi → uchikomi-seoi | 20,3 | 8,10 | 0,34 |
| `judo-avance-04` | tai-sabaki → tsugi-ashi-avant → uchikomi-seoi | 20,3 | 8,10 | 0,34 |
| `muaythai-debutant-11` | jab → direct → genou-direct-arriere | 17,5 | 0,27 | 0,25 |
| `muaythai-avance-01` | jab → direct → crochet-avant → genou-direct-arriere | 17,5 | 0,27 | 0,25 |
| `muaythai-intermediaire-04` | direct → genou-direct-arriere → coude-horizontal-avant | 17,5 | 0,27 | 0,25 |
| `mma-intermediaire-02` | direct → crochet-avant → changement-niveau | 16,6 | 0,20 | 0,20 |
| `muaythai-expert-03` | check-avant → blocage-haut → esquive-droite → direct → coude-horizontal-avant → genou-direct-arriere | 17,5 | 0,27 | 0,18 |
| `mma-intermediaire-10` | teep-avant → jab → direct | 15,7 | 0,20 | 0,17 |
| `kickboxing-debutant-13` | jab → direct → genou-direct-arriere | 15,8 | 0,18 | 0,17 |
| `muaythai-expert-09` | direct → crochet-avant → middle-kick-arriere → direct → genou-direct-arriere → coude-horizontal-arriere → high-kick-arriere | 17,5 | 0,36 | 0,16 |
| `boxe-intermediaire-11` | jab-corps → jab → direct | 15,9 | 0,16 | 0,16 |
| `boxe-expert-07` | jab-corps → direct → crochet-avant-corps → crochet-avant → direct-corps → uppercut-arriere → crochet-avant | 15,9 | 0,16 | 0,16 |
| `boxe-avance-04` | jab-corps → direct-corps → crochet-avant → uppercut-arriere | 15,9 | 0,16 | 0,16 |
| `kickboxing-expert-12` | jab → direct → genou-direct-arriere → crochet-avant → low-kick-arriere | 15,8 | 0,35 | 0,15 |
| `muaythai-avance-04` | clinch-tirage → genou-clinch → genou-circulaire-clinch → genou-clinch | 19,9 | 0,11 | 0,09 |
| `muaythai-intermediaire-09` | clinch-tirage → genou-clinch → genou-clinch | 19,9 | 0,11 | 0,09 |
| `judo-expert-04` | kumikata → uchikomi-o-goshi → uchikomi-o-soto-gari → uchikomi-o-uchi-gari → uchikomi-ko-uchi-gari | 18,0 | 8,71 | 0,08 |
| `muaythai-expert-11` | jab → direct → crochet-avant → uppercut-arriere → coude-horizontal-avant → genou-direct-arriere → high-kick-arriere | 17,5 | 0,27 | 0,06 |
| `muaythai-avance-11` | jab → direct → middle-kick-arriere → jab → direct → genou-direct-arriere | 17,5 | 0,27 | 0,06 |
| `muaythai-expert-02` | teep-avant → jab → direct → crochet-avant → coude-horizontal-arriere → genou-direct-arriere → coude-montant-avant → middle-kick-arriere | 17,5 | 0,27 | 0,06 |
| `muaythai-expert-01` | jab → direct → crochet-avant → coude-horizontal-arriere → genou-direct-arriere → low-kick-arriere | 17,5 | 0,27 | 0,06 |
| `muaythai-expert-05` | jab → direct → crochet-avant → direct → low-kick-arriere → teep-avant → jab → direct → genou-direct-arriere → coude-horizontal-avant | 17,5 | 0,27 | 0,06 |
| `muaythai-expert-08` | teep-avant → jab → direct → low-kick-arriere → check-avant → middle-kick-arriere → genou-direct-arriere | 17,5 | 0,27 | 0,06 |
| `kickboxing-debutant-12` | genou-direct-arriere | 15,8 | 0,04 | 0,03 |
| `kickboxing-intermediaire-13` | jab → crochet-avant → genou-direct-arriere | 15,8 | 0,04 | 0,03 |
| `kickboxing-intermediaire-12` | genou-circulaire-arriere | 15,2 | 0,04 | 0,03 |
| `muaythai-intermediaire-08` | genou-circulaire-arriere | 18,4 | 0,04 | 0,03 |
| `muaythai-debutant-07` | genou-direct-arriere | 17,5 | 0,04 | 0,03 |
| `mma-intermediaire-07` | front-kick-avant → jab → changement-niveau | 16,7 | 0,05 | 0,02 |
| `mma-debutant-05` | changement-niveau | 16,7 | 0,00 | 0,00 |
| `mma-expert-11` | overhand → crochet-avant → uppercut-arriere → crochet-avant → direct → high-kick-arriere | 16,1 | 0,20 | 0,00 |
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
| `kickboxing-avance-09` | jab-corps → direct → crochet-avant-corps → middle-kick-arriere | 15,9 | 0,18 | 0,00 |
| `kickboxing-avance-12` | jab → direct → middle-kick-arriere → genou-direct-arriere | 15,8 | 0,18 | 0,00 |
| `muaythai-expert-07` | pas-avant → jab → direct → pas-avant → genou-direct-arriere → coude-horizontal-avant → pas-arriere → teep-avant | 17,5 | 0,32 | 0,00 |
| `mma-avance-08` | defense-lutte → direct → high-kick-arriere | 16,1 | 4,94 | 0,00 |

Exercices sans glissement ajouté de plus de 0,5 cm par image ni saut de plus de 15 cm : 144 sur 254.
