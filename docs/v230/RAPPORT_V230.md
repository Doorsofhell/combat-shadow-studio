# 2.3.0 expérimentale : biomécanique et animations de combat (Lot 2)

Demande : Youssef, 19/11/2026 11:27, « LOT 2, BIOMÉCANIQUE ET ANIMATIONS DE COMBAT AAA » (référence artistique :
la lisibilité et le poids des coups des jeux de combat récents, sans copier aucun mouvement).
Branche de travail : `claude/project-thread-8zq3n9`. Point de restauration : `restauration/avant-animations-v230`
(= 2.2.0, `72d9bd5`). **Rien n’est fusionné ni publié** : tout attend la validation de Youssef.

Statuts employés : prévu, codé, testé, capturé. Aucun résultat n’est donné comme validé : seuls Youssef (et un
téléphone réel) peuvent valider le rendu.

## 1. Point de départ vérifié

- Le Lot 1 (2.2.0, PR #141) est bien intégré : `claude/project-thread-o7lrt8` = `72d9bd5`, `package.json` 2.2.0.
  Modèles, visages, textures et tenues : non touchés par ce lot (aucun fichier de `public/coaches/`, `src/three/`
  ou `tools/` modifié).
- Six coachs mesurés sur leur squelette réel (`public/coaches/<id>/photo.glb`) : Kadir, Amara, Naël, Victor,
  Inaya, Kanya, dans leur garde propre (`COACH_STANCES`). Aucun coach exclu.
- Tests de référence de la 2.2.0 : Vitest 1 724 réussis, 5 échecs déjà présents (taille du modèle d’Amara,
  ordre de la chaîne sur l’uppercut arrière, deux mesures de fluidité, chemin des crochets).

## 2. Audit du moteur réel (phase A)

Ce qui existait et fonctionnait (gardé tel quel) : cinématique inverse à deux os pour bras et jambes, limites
d’épaule et de hanche (`rig.ts`), contre-rotation bassin/épaules écrite dans les poses, décalage de 50 ms des
jambes et du bassin sur les bras (`motion.ts`, chaîne), accents de frappe (`punchFeel`), pied d’appui posé et
équilibre sur un pied (`balanceKeys`), garde vivante (dérive lente du poids), respiration, regard et visage
(moteur humain, non touché).

Outil de mesure ajouté : `src/test/animAudit.ts` + `src/engine/__tests__/anim-audit-v230.test.ts`, 1 272 mesures
(6 coachs × toutes les techniques de chaque discipline), 120 images par seconde : instants des pics de rotation des
hanches et des épaules puis de vitesse du poing ou du pied, vitesse à l’impact, temps d’arrêt à l’impact, retour en
garde, glissement et enfoncement des pieds d’appui, sauts d’articulation, sauts de vitesse, rotation parasite des
coudes et genoux, centre de masse hors appui, ainsi que 54 enchaînements et la garde au repos.
État initial complet : `docs/v230/audit/avant.json` ; tableaux lisibles : `docs/v230/AUDIT_MESURES.md`.

Anomalies principales trouvées (mesurées, sur les six coachs) :

| Anomalie | Où | Mesure 2.2.0 |
|---|---|---|
| Hanches et épaules culminent en même temps sur les directs (pas de chaîne cinétique) | jab, direct, crochets, 4 disciplines | 250 coups à ± 5 ms |
| Poing ou coude figé à l’impact (pose maintenue puis repartie de zéro) | jab 67 ms, direct 92 ms, uppercuts 83 ms, coudes 94 ms | 358 coups ≥ 50 ms |
| Coup de pied haut : le pied revient en ligne droite, la jambe se replie entièrement et le genou fouette | high kicks, tous les coachs | saut de vitesse 11 à 12, genou qui tourne de 53 à 58° en 1/60 s |
| Uppercut : le poing culmine avant les épaules (bras parti trop tôt) | uppercut arrière | échec de test déjà présent |
| Overhand : poing armé à côté de l’oreille, le coude bascule d’un coup | overhand, surtout Kadir | rotation du coude 158° en 1/60 s |
| Garde au repos parfaitement périodique (même rebond toutes les 0,9 s) | tous | corrélation 1,000 |
| Dérive de la garde vivante identique en centimètres pour tous (ne suit pas la taille) | Amara, Inaya, Kanya | 1,99 cm pour tous |

## 3. Corrections retenues (phases B, C, E)

Chaque correction a son interrupteur (`src/engine/v230.ts`) : on peut en annuler une seule sans toucher aux autres
(`?v230=-legArc` dans le Lab, `V230=-legArc` pour les tests ; `?v230=0` = moteur 2.2.0).

| Interrupteur | Correction | Fichier |
|---|---|---|
| `chainLead` | Sur les coups de poing, le bassin prend son avance dès le début du coup (avant : l’avance s’installait en 0,15 s, plus long qu’un jab) | `motion.ts` |
| `snap` | La pose d’impact n’est plus tenue : le retour part de l’impact (poings, coudes, front kick). Pas sur les genoux, le teep, les défenses ni les coups au corps (voir § 6) | `library/index.ts` |
| `armLag` | Uppercuts : le bras reste un peu en arrière pendant que hanches et épaules tournent, puis monte en dernier | `author.ts`, `boxing.ts` |
| `legArc` | Pied en l’air : il tourne autour de la hanche au lieu d’aller en ligne droite entre deux poses (seulement si la jambe est tendue à une extrémité) | `motion.ts` |
| `twistCap` | Le solveur ne fait plus faire un demi-tour au coude ou au genou pour corriger 1 ou 2° de rotation d’épaule ou de hanche | `rig.ts` |
| `overhandPath` | Overhand : le poing ne s’arme plus à côté de l’oreille, la trajectoire plonge par-dessus | `boxing.ts` |
| `idleLife` | Garde : rythme et amplitude du rebond varient légèrement, dérive proportionnelle à la taille du coach | `player.ts` |

Essai écarté (interrupteur gardé, coupé) : `poleSlerp` (orientation du coude/genou tournée à vitesse constante)
n’apportait rien sur les chutes de judo et faisait entrer l’avant-bras dans le tronc (5,8 cm sur le changement de
base) et la main dans le tronc (3,7 cm sur le middle kick). Également essayés puis retirés : `armLag` sur les
directs, crochets et coudes (poing plus lent à l’impact), une tenue d’impact de 12 ms (poses clés trop proches),
un recalage de la rotation d’épaule à ± 150° (chute arrière retournée).

## 4. Résultats mesurés (avant → après, six coachs)

| Mesure | 2.2.0 | 2.3.0 |
|---|---|---|
| Coups où hanches et épaules culminent ensemble (± 5 ms) | 250 | 157 |
| Jab / direct : avance du bassin sur les épaules | 0 ms | 17 / 25 ms |
| Arrêt du poing à l’impact : jab / direct / crochet arrière | 67 / 92 / 58 ms | 33 / 50 / 33 ms |
| Coups figés ≥ 50 ms à l’impact | 358 | 293 |
| High kick avant : vitesse du pied à l’impact | 10,4 à 10,9 m/s | 15,3 à 15,8 m/s |
| High kick avant : rotation parasite du genou | 53 à 58° | 38 à 39° |
| High kick avant : plus grand saut de vitesse | 10,7 à 12,1 | 6,8 à 7,2 |
| Sauts de vitesse > 10 (à-coup visible) | 67 | 38 |
| Rotations parasites > 45° en 1/60 s | 66 | 34 |
| Overhand Kadir : rotation parasite du coude | 54° (158° sur une image en garde gauchère) | 31° |
| Uppercut arrière : le poing culmine | avant les épaules | après les épaules (échec de test 2.2.0 corrigé) |
| Garde : ressemblance d’un rebond au suivant | 1,000 | 0,85 |
| Garde : dérive d’Amara / Kanya | 1,99 / 1,99 cm | 1,91 / 1,87 cm |
| Techniques avec un membre dans le corps > 2 cm | 29 | 28 (le teep n’en a plus) |

Détail par famille, par coach et par technique : `docs/v230/AUDIT_MESURES.md`.

## 5. Morphologies (phase D)

Les mêmes règles s’appliquent aux six coachs ; aucun réglage ne dépend du sexe. Les écarts viennent des
proportions lues sur chaque squelette (longueur des bras et des jambes, taille). Gains comparables pour tous :
arrêt moyen à l’impact 68-70 ms → 50-51 ms, vitesse moyenne des frappes à l’impact +0,7 à +0,8 m/s pour chacun.
Les coachs féminins gardent la même puissance relative que les masculins (high kick avant : Amara 15,8 m/s,
Inaya 15,8, Kanya 15,3 ; Kadir 15,4, Naël 15,4, Victor 15,4). Les tissus des tenues bougent un peu moins sur les
coups de pied (ceinture du short d’Amara : étirement maximal 1,98 → 1,86 sur le middle kick ; mesure
`docs/v1380/MESURES_TENUES_AMARA.md`, test réussi).

## 6. Anomalies restantes et limites (non corrigées dans ce lot)

- **Overhand plus lent à l’impact** (−10 à −13 %, Kadir 5,06 → 4,54 m/s) : la trajectoire qui ne passe plus à
  côté de l’oreille est plus courte. Compromis à valider ; réversible seul (`?v230=-overhandPath`).
- **Uppercut avant** : rotation parasite du coude 15° → 23° (sous le seuil de 45°, à surveiller en vidéo).
- **Genoux** : toujours 150 ms d’arrêt à l’impact ; la correction `snap` y faisait entrer le tibia dans l’autre jambe.
- **Low kick, middle kick avant, genoux circulaires** : les épaules culminent avant les hanches (85 coups, inchangé) ;
  c’est la contre-rotation écrite des bras. À reprendre pose par pose avec Youssef.
- **Chutes de judo (ukemi), sprawl, uchikomi o-soto-gari** : bascules du coude ou du genou de 90 à 169° en 1/60 s
  (8 cas) ; la cause est dans les poses écrites (une rotation d’épaule impossible entre deux poses), pas dans le
  solveur. Correction pose par pose proposée.
- **Pieds** : 132 mesures de glissement > 1 cm par image, toutes sur les déplacements de lutte, de judo et le
  switch kick (pas et pivots voulus, que la mesure ne distingue pas encore d’un vrai glissement) ; aucune sur les
  coups de poing et de pied.
- **Coudes en diagonale** : l’armé est presque aussi rapide que la frappe (le coup s’annonce).
- **Coup de pied latéral** : absent de la bibliothèque (proposition : l’ajouter au lot suivant).
- **Épaule** : une rotation externe de 91° pour 90° (genou direct avant de Kadir), dans la tolérance du test.
- Échecs de tests déjà présents en 2.2.0 et toujours là : taille du modèle d’Amara, deux mesures de fluidité du
  crochet avant, chemin des crochets (« pas d’armé »).
- Combats à deux et transitions au sol à deux : le moteur ne fait jouer qu’un coach ; rien à synchroniser.

## 7. Performance et stabilité

- Nouveau test `stabilite-v230.test.ts` : chaque coach enchaîne 10 techniques pendant 3 minutes d’animation (60
  images/s) : aucune valeur invalide, aucune dérive (TEST RÉUSSI pour les six).
- Coût d’une image du moteur (lecteur + squelette), mesuré dans Node sur cette machine, trois passages alternés
  avant/après par coach (`PERF_V230=1`, `docs/v230/PERF.json`) : 0,12 à 0,17 ms par image, moins de 1 % des
  16,7 ms d’une image à 60 i/s. Deux séries complètes : rapports après/avant entre 0,74 et 1,38 selon la série et le
  coach, sans sens constant : l’écart est dans le bruit de mesure, aucun surcoût mesurable.
- Aucune texture, aucun modèle, aucune expression faciale ajoutés : mémoire graphique, triangles et appels de
  dessin inchangés par construction. Les nouveaux calculs à chaque image réutilisent leurs vecteurs et quaternions
  (pas d’allocation de plus que la 2.2.0, résultat identique vérifié sur les 1 272 mesures).
- Téléphone Android réel : NON EXÉCUTÉ (aucun appareil dans cet environnement).

## 8. Captures et vidéos (phase F)

Rendus WebGL réels du Lab (Three.js, build de production local, SwiftShader), même coach, même tenue, même caméra,
même lumière : avant = `?v230=0`, après = moteur 2.3.0. Sept instants équivalents : garde, anticipation, début,
accélération, impact, décélération, retour (instants calculés sur l’impact de chaque version). 0 erreur de rendu.
Aucune image générée par IA.

- Planches (`docs/v230/captures/`, adresses du Lab dans `captures/raw/manifest.json`) : Kadir sur direct, uppercut
  arrière, overhand, high kick avant ; les six coachs sur high kick avant et overhand (14 planches).
- Vidéos côte à côte au ralenti ×0,5, gauche avant, droite après (`docs/v230/videos/`) : Kadir et Amara, high
  kick avant et uppercut arrière.
- Ce qui se voit : au high kick, à la décélération, la jambe de la 2.2.0 se replie sous la cuisse, celle de la 2.3.0
  revient tendue en arc ; à l’overhand, à t = 0,19 s, le poing de la 2.2.0 est armé à côté de l’oreille, celui de la
  2.3.0 reste devant. Les gains de timing (chaîne, arrêt à l’impact) se voient en vidéo, pas sur une image fixe.
- Pour comparer soi-même dans le Lab : `#/lab?champion=mma-kadir&look=realiste&d=kickboxing&tech=high-kick-avant`
  avec et sans `&v230=0`.

## 9. Propositions pour la suite

1. Reprendre pose par pose les chutes de judo, le sprawl et l’o-soto-gari (bascules restantes).
2. Écrire la contre-rotation des bras sur les low kicks et middle kicks pour que les hanches mènent.
3. Ajouter le coup de pied latéral (kick-boxing, MMA).
4. Raccourcir l’arrêt des genoux en reculant d’abord la hanche (pour éviter le contact avec l’autre jambe).
5. Mesurer sur un téléphone Android réel (images par seconde, chauffe) avant toute publication.
