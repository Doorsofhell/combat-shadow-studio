# Audit du moteur d’animation

Date : 19 octobre 2026. Branche : `audit/biomecanique`. Les chiffres viennent de [MESURES_MOTEUR.md](MESURES_MOTEUR.md) (généré par un test) et du registre [ANIMATIONS.md](../ANIMATIONS.md). Ce qui n’a pas été mesuré est écrit comme tel.

## Ce que fait le moteur

| Élément | Fonctionnement actuel | Fichier |
|---|---|---|
| Poses clés | Chaque technique est une suite de poses clés écrites à partir des mesures du squelette (hanches, bassin, buste, tête, mains, pieds). | `src/engine/author.ts`, `src/engine/library/*.ts` |
| Interpolation | Entre deux poses clés, interpolation avec une courbe par clé (`in`, `out`, `inOut`, `linear`, courbes de frappe et de charge). | `src/engine/motion.ts` |
| Bras et jambes | Cinématique inverse analytique à deux segments, avec vecteur de pôle pour orienter coude et genou. | `src/engine/rig.ts` |
| Limites articulaires | Coude plié au plus à 150°, genou à 155°. La portée est bornée juste sous la longueur du membre : pas d’hyperextension. Une passe ouvre les coudes trop fermés sur chaque pose clé. | `src/engine/rig.ts`, `src/engine/library/index.ts` |
| Appuis | Un pied « au sol » est fixé par l’avant du pied ; le talon peut se lever. Un pied « en l’air » suit sa cible. | `src/engine/pose.ts` |
| Buste | La rotation du buste est répartie sur les trois vertèbres du squelette. | `src/engine/rig.ts` |
| Enchaînements | Le lecteur mélange linéairement la fin d’une technique et le début de la suivante (fondu adouci). | `src/engine/player.ts` |
| Équilibre sur un pied | **Nouveau (v0.17.0)** : sur les coups de pied, genoux et checks, les hanches se placent pour mettre le centre de masse au-dessus du pied d’appui ; la jambe en l’air et les mains placées dans l’espace suivent le corps. | `src/engine/balance.ts` |
| Mesures | Centre de masse (fractions de masse de de Leva, 1996), surface d’appui, torsion, glissements, transitions. | `src/engine/audit.ts` |

## Ce que le moteur ne fait pas

- **Pas de physique** : ni gravité, ni forces, ni inertie. L’équilibre est corrigé sur les poses clés, pas simulé.
- **Pas de collisions** : rien n’empêche une main de traverser le corps ou une cuisse de traverser l’autre. Non mesuré pendant cet audit.
- **Pas de système à deux corps** : aucune technique de judo ou de BJJ avec partenaire n’est animée. Les fiches partenaire restent des textes (statut « Non implémentée »). Animer une projection en faisant seulement tourner ou tomber un personnage est exclu.
- **Pas de contact au sol pour les autres parties du corps** : genoux, mains, dos et hanches ne sont pas fixés au sol comme les pieds ; ils peuvent glisser ou traverser.
- **Android** : aucune mesure sur appareil réel pendant cet audit (protocole écrit dans [COMPARATIF_THREE_BABYLON.md](../COMPARATIF_THREE_BABYLON.md), NON EXÉCUTÉ).

## Constats mesurés

| # | Constat | Avant | Après v0.17.0 | Lecture |
|---|---|---|---|---|
| 1 | Coups de pied, genoux, checks : centre de masse hors du pied d’appui | 15 à 27 cm, pendant 72 à 90 % du mouvement (jambe avant) | 14 à 23 cm, pendant 7 à 28 % du mouvement ; il ne reste que la pose de la jambe au retour | Avant : poids non transféré, le corps serait tombé. Après : écart limité à l’instant où le pied revient au sol, comparable à un pas. |
| 2 | Sprawl : genou sous le sol | −1,9 cm (la peau traverse) | +2,0 cm | Corrigé. |
| 3 | Sprawl : pieds qui glissent au retour | 21,6 cm par image | 3,3 cm par image | Les pieds quittent le sol pour revenir sous les hanches. |
| 4 | Sprawl : vitesse des mains | 23 cm par image | 18 cm par image | Encore rapide : à revoir. |
| 5 | Techniques au sol (pont, relevé technique, changement de base) : orteils sous le sol | −1,4 cm | inchangé | À corriger (lot suivant). |
| 6 | Relevé technique et changement de base : pied qui glisse | 11 et 14 cm par image | inchangé | À corriger (lot suivant). |
| 7 | Pas et pivots : centre de masse hors appuis 20 à 35 cm pendant 0,25 s | — | inchangé | Un pas est un mouvement dynamique : c’est normal en marche. Aucune source ne fixe de seuil ; à faire confirmer. |
| 8 | Transitions entre techniques | glissement ajouté ≤ 3 cm par image, surtout autour de la sortie d’angle | inchangé | 13 exercices sur 208 dépassent 1 cm par image. Faible. |
| 9 | Direct : appui avant à l’impact | 67 % du poids vers le pied avant | inchangé | Cohérent avec la mesure publiée de 60,6 % chez des boxeurs élites (boxe-S7). |
| 10 | Torsion buste/bassin | 29° au plus | inchangé | Plausible ; aucune source consultée ne donne de valeur maximale. |
| 11 | Middle kick : inclinaison du buste à l’impact | 24° vers l’avant et le côté opposé | inchangé | Pas d’inclinaison en arrière, conforme aux sources. |

## Limites de ces mesures

- Le centre de chaque segment est pris au milieu de ses deux articulations (simplification ; de Leva donne le ratio exact par segment).
- Un centre articulaire est sous la peau : on considère qu’en dessous d’environ 1,5 cm, la peau traverse le sol. Ce seuil est une estimation.
- Les mesures sont faites sur le coach homme ; le test de longueur de jambes vérifie que les appuis et les angles restent bons aux deux extrémités du curseur.
- Les seuils « bon / mauvais » ne viennent d’aucune norme : les chiffres disent où regarder, la décision revient à un entraîneur.
