# v0.42.0 · Correction biomécanique des crochets

Demande : Youssef, 2026-10-23, « Correction biomécanique des crochets 3D ». C'est une correction ciblée, pas une refonte. Branche `fix/crochets-biomeca-v042`, partie de la v0.41.0 (`407ff26`). PR sans fusion.

## 1. Diagnostic

Tous les défauts ont été mesurés sur le squelette réellement posé, à 120 images par seconde, sur les six corps de l'application :

- Kadir et Amara, en rendu Ultra-réaliste et en rendu Anime ;
- les deux coachs génériques.

Les mesures sont dans `src/test/hooks.ts`. Les captures du rendu réel sont dans `captures/`.

| Défaut signalé | Constat en v0.41 | Confirmé ? |
|---|---|---|
| Coude qui part trop loin derrière l'épaule | Crochet avant : coude **24 à 28 cm derrière** la ligne des épaules. Crochet avant au corps : 19 à 23 cm | **Oui** |
| Bras tordu, rotation anormale | Crochet avant : rotation externe de l'épaule **bloquée à 90°**, la limite du moteur. Le solveur faisait alors pivoter le coude autour de la ligne épaule-poing pour rester dans l'amplitude, et c'est ce pivot qui donne l'aspect tordu | **Oui** |
| Bras qui s'ouvre exagérément vers l'extérieur | Poing écarté de **17 à 33 cm sur le côté** avant de frapper : un vrai armé, visible de face. Le trajet du poing faisait 1,6 à 2,8 fois la ligne droite | **Oui** |
| Trajectoire artificielle du poing | Le poing allait le plus vite **pendant l'armé** (vers 0,06 s), pas juste avant l'impact | **Oui** |
| Plan de flexion du coude qui se retourne | Jusqu'à **98° en 1/120 s** sur un corps : un retournement net | **Oui**, sur certains corps |
| Torsion du poignet | Poignet aligné (0°) dans toutes les mesures | Non |
| Pieds qui glissent | Aucun glissement de l'avant du pied (0 mm) | Non |
| Gaucher | Le test du miroir échouait aussi en v0.41, conséquence des défauts ci-dessus | Oui |

### Origine des torsions

Dans la pose d'impact, le poing était placé vers la cible et la direction du coude était fixée **dans la pièce** (vers le côté gauche du coach). Pendant ce temps, le buste tournait de 45 à 50° pour donner de la puissance.

Résultat : le coude visait un point fixe pendant que les épaules tournaient. Il se retrouvait derrière elles, l'épaule butait en rotation externe et le solveur tordait le bras pour rester dans l'amplitude.

L'armé venait d'une pose de préparation qui écartait le poing de 22 cm sur le côté.

### PR brouillon #17

La PR #17 part de l'ancienne `main` (v0.14), et non de la version publiée (v0.41) : elle ne peut pas s'appliquer telle quelle. Je l'ai mesurée sur sa propre version, avec la même sonde de positions :

- **Ce qui est mieux** : l'armé est réduit. Le poing ne s'écarte plus que de 1 cm au crochet avant, contre 9 à 14 cm sur `main`.
- **Ce qui ne change pas** : la pose d'impact est la même. Le coude reste **24 à 26 cm derrière l'épaule**, et la cause des torsions reste en place.
- **Ce qui est moins bien** :
  - le plan du coude tourne plus vite (37° en 1/120 s au lieu de 26°) ;
  - le crochet arrière recule le poing de 6 à 12 cm avant de partir ;
  - le poing est plus lent (8 m/s au lieu de 15,5 m/s au crochet arrière).

Je ne l'ai donc pas reprise. J'ai gardé son idée juste, une préparation discrète, et j'ai corrigé la cause.

## 2. Correction

Elle ne touche que `src/engine/library/boxing.ts`, la fonction `hook`, plus une aide facultative dans `src/engine/author.ts` et `src/engine/library/index.ts`.

1. **Bras d'impact construit dans le repère du buste.**
   - Le coude pointe sur le côté du buste, un peu en avant de la ligne des épaules, jamais nettement derrière.
   - Il est à hauteur d'épaule pour la tête et plus bas pour le corps.
   - Il est rangé dans le repère du buste, donc le bras tourne avec le tronc. La courbe du poing vient de la rotation du corps, plus d'un balancement du bras.
2. **Angle du coude adapté à chaque corps.** L'angle du coude et l'avancée du coude sont choisis dans leurs plages pour que le poing s'arrête sur l'axe du coach, sans traverser loin au-delà. Les plages sont :
   - flexion entre 55° et 95° (« près de 90° » selon USA Boxing ; 117° ± 23° entre bras et avant-bras chez les boxeurs élites, Dinu & Louis 2020) ;
   - coude entre 8° derrière et 40° devant la ligne des épaules.

   Le calcul utilise la position réelle de l'épaule que donne le squelette du coach, `Author.solvedShoulder`. Les limites de rotation du tronc et la clavicule la déplacent de 3 à 6 cm, ce qui changeait jusqu'à 20° de flexion.
3. **Préparation discrète, sans armé.**
   - Le poing reste à la garde et s'écarte de 4 cm pendant que le coude commence à monter sur le côté.
   - Les hanches chargent de 6° dans l'autre sens.
   - La préparation dure 0,07 s au lieu de 0,1 s.
   - Le poing part de l'arrêt et accélère jusqu'à l'impact : la pose de préparation est marquée `hold` pour que le lissage ne dépense pas sa vitesse trop tôt.
4. **Rotation du crochet avant ramenée de 48° à 34°** (bassin 24° et buste 10°, au lieu de 34° et 14°). Avec 48°, le poing ne pouvait pas toucher devant le coach sans que le coude passe derrière les épaules. Le crochet arrière garde sa rotation.

Rien d'autre ne change :

- les autres frappes, les défenses, les déplacements et les jambes ;
- le grappling, les coachs et l'interface ;
- les données des utilisateurs ;
- le pivot des pieds et les durées d'impact (0,20 s et 0,23 s).

## 3. Résultats mesurés

Les valeurs vont du minimum au maximum sur les 6 corps, en garde orthodoxe et en garde gauchère. Le détail par corps est dans `MESURES_CROCHETS.md`.

| Crochet | Coude derrière les épaules (max) | Rotation externe de l'épaule (max) | Flexion du coude à l'impact | Chemin du poing / ligne droite | Instant le plus rapide (impact) |
|---|---|---|---|---|---|
| Avant, tête | 24–28 cm → **3–5 cm** | 90° → **50–56°** | 87–94° → 64–68° | 2,0–2,6 → **1,04–1,20** | 0,06 s → **0,16 s** (0,20 s) |
| Arrière, tête | jamais derrière (inchangé) | 16–43° → −7–17° | 82–87° → 82–87° | 2,5–2,8 → **1,25–1,30** | 0,07–0,18 s → **0,21 s** (0,23 s) |
| Avant, corps | 19–23 cm → **jamais derrière** | 78–90° → **40–47°** | 93–110° → 74–77° | 1,6–1,9 → **1,02–1,04** | 0,05 s → **0,17 s** (0,20 s) |
| Arrière, corps | jamais derrière (inchangé) | ≤ 0° → 7–17° | 49–111° → 91–95° | 1,9–2,5 → **1,25–1,32** | 0,06 s → **0,21 s** (0,23 s) |

Les éléments suivants sont inchangés et sans défaut :

- le poignet est aligné (0°) ;
- l'avant du pied ne glisse pas (0 mm) ;
- les hanches tournent avant le buste.

## 4. Tests

Ces tests sont nouveaux. Aucun test existant n'a été affaibli.

- `src/engine/__tests__/hooks-biomeca.test.ts` fait 14 contrôles sur 48 exécutions (6 corps × 4 crochets × 2 gardes). Il exige :
  - un coude jamais plus de 6 cm derrière les épaules ;
  - une rotation externe de l'épaule de 60° au plus ;
  - une flexion de 55 à 95° à l'impact ;
  - le coude à hauteur d'épaule pour la tête et plus bas pour le corps ;
  - le coude sur le côté ;
  - le poignet aligné ;
  - un chemin du poing de 1,4 fois la ligne droite au plus ;
  - le pic de vitesse dans les 40 % qui précèdent l'impact ;
  - un plan du coude stable (15° au plus en 1/120 s) ;
  - un avant-bras qui tourne sans à-coup ;
  - les hanches avant le buste ;
  - des pieds sans glissement ;
  - la garde gauchère en miroir ;
  - un document de mesures à jour.

  **Sur la v0.41, 10 contrôles sur 14 échouent. Après la correction, les 14 réussissent.**
- `src/engine/__tests__/hooks-chains.test.ts` joue les 8 enchaînements demandés comme l'écran d'entraînement, avec `ComboPlayer` et ses fondus. Il les joue à 3 vitesses (×0,5, ×1, ×1,5), sur Kadir et Amara, en garde orthodoxe et gauchère. Pendant les crochets et les fondus d'entrée et de sortie, il vérifie :
  - aucune épaule au-delà de 80° de rotation externe ;
  - aucun coude à plus de 6 cm derrière les épaules ;
  - aucun retournement du plan du coude ;
  - aucun saut de la main.

  **Sur la v0.41, 14 enchaînements sur 16 échouent. Après la correction, les 16 réussissent.**

  Ce test montre aussi un point **hors du périmètre**, que je n'ai pas modifié : pendant le *direct* d'Amara, le bras avant (en garde au menton) atteint 85° de rotation externe. C'était déjà le cas en v0.41. Ce point est à traiter dans une correction du direct si tu le souhaites.

Les résultats de toute la suite sont dans le journal (`docs/JOURNAL_CORRECTIONS.md`, entrée v0.42.0).

## 5. Références consultées

| Référence | Ce qui a été lu | Ce qui a été retenu |
|---|---|---|
| USA Boxing, *Best Practices Training Manual* v01.1, 2014, p. 37 et 44–47 (`boxe-S2`) | Les fiches des 4 crochets et les erreurs générales | Coude « fléchi près de 90° », rotation du corps, poids vers l'avant, main opposée au menton, phalanges vers l'adversaire, retour « par le chemin le plus court ». Erreurs : frapper sans rotation, retour bas ou de côté |
| Dinu D. & Louis J., *Frontiers in Sports and Active Living* 2:598861, 2020 (`boxe-S7`) | Texte intégral, partie crochet | 117° ± 23° entre le bras et l'avant-bras à l'impact chez les élites ; poing à 11,2 ± 2,0 m/s chez les élites ; contribution du bassin plus grande chez les élites |
| FightCamp, *How to throw a boxing lead hook & rear hook* | Article entier | Coude « derrière le poing », bras à niveau, pivot du pied avant (crochet avant) et du pied arrière (crochet arrière), ne pas baisser la main en cours de route |
| Evolve MMA, *How To Master The Lead Hook In Boxing* | Article entier | Ne pas ouvrir le coude, tourner le buste dans le coup, éviter le coup lourd et télégraphié |
| Swiss Boxing (`S3`, déjà cité depuis la v0.29) | Déjà lu | Poing, coude et épaule à la même hauteur au crochet à la tête |

Aucune vidéo n'a été visionnée : je n'ai lu que des textes. Les sources se contredisent sur un point : FightCamp conseille d'« ouvrir un peu le bras » au départ, alors qu'Evolve et USA Boxing mettent en garde contre l'armé. J'ai suivi USA Boxing et gardé seulement 4 cm d'ouverture.

## 6. Validation visuelle et limites

- **Captures du rendu réel**, faites dans le navigateur (moteur WebGL logiciel), avant et après :
  - 4 crochets de Kadir et 2 crochets d'Amara ;
  - le crochet avant de Kadir en garde gauchère ;
  - 3 angles (face, trois quarts, profil) et 7 instants : garde, préparation, accélération, juste avant l'impact, impact, décélération, retour.

  Elles sont dans `captures/`, et la page de comparaison est publiée.
- **Les enchaînements ne sont pas capturés en image.** La vue de laboratoire ne joue qu'une technique à la fois. Ils sont vérifiés par le test `hooks-chains` (mesures), pas à l'œil.
- **Aucune validation sportive n'est déclarée.** Le registre des mouvements garde ces crochets au statut « contrôlé techniquement ». Seul un entraîneur qui regarde le rendu peut les valider.
- **Aucun test sur un téléphone Android.** La correction ne change que des poses, pas le rendu.
