# Anomalies techniques, par priorité

Sources des constats : rapports de [recherche/](recherche/) (section D de chacun) et mesures du moteur ([AUDIT_MOTEUR.md](AUDIT_MOTEUR.md)). « Corrigé v0.17.0 » veut dire corrigé et passé dans les tests automatiques, **pas validé par un entraîneur**.

Priorité : **P1** = contredit une source ou risque de sécurité non signalé ; **P2** = élément important manquant ou animation défectueuse ; **P3** = affirmation non documentée, précision.

## P1

| # | Technique | Anomalie | Sources | État |
|---|---|---|---|---|
| 1 | Coups de pied, genoux, checks (20 animations) | Centre de masse hors du pied d’appui pendant presque tout le temps sur un pied | mesure ; poids sur la jambe d’appui (kbmt-S30, S31) | Corrigé v0.17.0 (équilibrage), écart restant au retour du pied |
| 2 | `sprawl` | Mains au sol comme geste principal ; sources : mains sur la tête et les épaules de l’attaquant | mma-S13, S14, S15 | Corrigé v0.17.0 (animation et texte) |
| 3 | `sprawl` | Genou sous le sol, pieds qui glissent de 21,6 cm par image | mesure | Corrigé v0.17.0 |
| 4 | `middle-kick-arriere` | « Le buste s’incline légèrement en arrière » contredit | kbmt-S40, S31, S43 | Corrigé v0.17.0 (texte ; l’animation ne penche pas en arrière) |
| 5 | Kicks jambe arrière | Aucune consigne de sécurité pour le genou d’appui pendant le pivot | kbmt-S4, S5 | Corrigé v0.17.0 (point clé ajouté sur middle et high kick, à valider par un entraîneur) |
| 6 | `low-kick-arriere` | Surface de contact non précisée (milieu du tibia) | kbmt-S25, S37, S4 | Corrigé v0.17.0 (texte) |
| 7 | 10 coups de poing | Ni poignet aligné ni surface de contact | boxe-S1, S2, S4, S5 | Corrigé v0.17.0 sur jab, direct, crochets ; reste jab au corps, direct au corps, crochet au corps, uppercuts |
| 8 | `roll-droite`, `roll-gauche` | Aucune limite de hauteur de tête | boxe-S1, S2, S4, S5 | Corrigé v0.17.0 (texte) |
| 9 | `roll-*` | Le sens initial (partir vers le crochet) n’est pas dit | boxe-S1, S2 | À faire : vérifier d’abord le sens de l’animation |
| 10 | `sortie-hanche` | « En poussant sur le pied et la main » : la force vient des hanches | mma-S21, S22 | Texte corrigé v0.17.0 ; **animation à vérifier** (passage sur le côté) |
| 11 | `entree-lutte` | Risques en MMA (guillotine, genou) et tête collée à l’adversaire absents | mma-S11, S12, S16 | À faire |
| 12 | Rolls et esquives basses en MMA | Déconseillés par une source (exposition au genou) | mma-S17 | À faire : mention par discipline |
| 13 | `garde` | Pied avant « tourné vers l’intérieur » absent des sources de muay-thaï ; une seule garde pour toutes les disciplines | kbmt-S23, S28, S38, S39, S41 | À faire : variante de garde muay-thaï |
| 14 | `cle-de-bras-garde` | « Ses épaules restent au sol » mélange garde fermée et juji-gatame | jb-S1, S5, S48 | Corrigé v0.17.0 (texte) |
| 15 | `o-soto-gari` | Risque crânien non signalé ; niveau « débutant » discutable | jb-S17, S18 | Avertissement ajouté v0.17.0 ; **niveau à décider avec un enseignant** |
| 16 | `seoi-nage` | Risque pour le cou non signalé | jb-S18, S21 | Corrigé v0.17.0 (texte) |
| 17 | Toutes les fiches partenaire | Abandon : manquent « deux fois ou plus » et l’abandon verbal | jb-S7, S26, S27 | Corrigé v0.17.0 |

## P2

| # | Technique | Anomalie | Sources | État |
|---|---|---|---|---|
| 18 | `direct` | Poussée de la jambe arrière et transfert vers l’avant absents du texte | boxe-S1, S2, S7, S10, S14 | Corrigé v0.17.0 |
| 19 | Crochets, uppercuts | Transfert du poids absent | boxe-S1, S2, S7 | À faire |
| 20 | `garde` | « Épaules relâchées » contredit une source (ceinture scapulaire légèrement relevée) | boxe-S3 | À faire |
| 21 | Pont, relevé technique, changement de base | Orteils 1,4 cm sous le sol ; pied qui glisse de 11 à 14 cm par image | mesure | À faire (lot suivant) |
| 22 | `sprawl` | Mains encore rapides (18 cm par image) | mesure | À faire |
| 23 | `seoi-nage` | Identifiant, nom et saisies mélangent Seoi-nage et Ippon-seoi-nage | jb-S1, S4 | À faire |
| 24 | `tai-sabaki` | Le geste montré est un mae-mawari-sabaki | jb-S12 | À faire |
| 25 | `kuzushi` | Une seule direction présentée comme « le » kuzushi | jb-S12 | À faire |
| 26 | `montee` | « Assis sur le ventre » s’écarte d’une source (poids sur le haut de la poitrine) | jb-S47 | À vérifier (source de self-défense) |
| 27 | Roundhouse en kick-boxing | Seul le cou-de-pied est cité ; le tibia est autorisé selon le style | kbmt-S15, S19 | À faire |
| 28 | Genoux | Absents du kick-boxing alors qu’autorisés en K1 | kbmt-S15, S16 | À faire |
| 29 | Coudes | Aucune mention de sécurité ni d’âge | kbmt-S10, S15, S16 | À faire |
| 30 | `releve-technique` | Main et pied opposés, se relever en s’éloignant, base large | mma-S19, S20 | À faire |
| 31 | `pivot-*`, `sortie-angle` | Aucune source consultée ne les décrit | — | À documenter |

## P3

Les affirmations non documentées (par exemple « on expire au contact » pour l’ukemi, « les pieds restent stables » pour la feinte d’épaule) sont listées dans la section D de chaque rapport de recherche. Elles ne sont pas fausses : elles n’ont simplement pas de source. Elles restent affichées et sont à faire confirmer par un entraîneur.
