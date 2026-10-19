# Plan de correction

Par petits lots, chacun sur sa branche `restauration/lot-N`, avec tsc, tests unitaires, Playwright complet, contrôle visuel et publication. Les numéros renvoient à [ANOMALIES.md](ANOMALIES.md).

| Lot | Contenu | Anomalies | Prérequis |
|---|---|---|---|
| **v0.17.0 (fait)** | Équilibre sur un pied ; sprawl ; 17 corrections de texte ; fiches pilotes ; mesures et inventaire générés par des tests | 1 à 8, 10 (texte), 14 à 18 | — |
| A | Techniques au sol : orteils sous le sol, pieds qui glissent (pont, relevé technique, changement de base) ; vérifier le passage sur le côté de la sortie de hanche ; contact au sol des genoux et des mains | 10, 21 | — |
| B | Boxe : poignet et surface sur les coups restants ; transfert du poids crochets et uppercuts ; sens du roll (vérifier l’animation puis le texte) ; épaules en garde | 7, 9, 19, 20 | — |
| C | Gardes par discipline : variante muay-thaï (hanches de face, pied avant vers l’extérieur, poids), adaptations MMA | 13 | décision : une garde par discipline ou un sélecteur |
| D | MMA : entrée en lutte (risques, tête collée), mention des rolls, relevé technique, sprawl plus lent | 11, 12, 22, 30 | — |
| E | Kick-boxing : tibia selon le style, genoux en K1, sécurité des coudes | 27, 28, 29 | décision : quel style de kick-boxing l’application vise (K1, low kick, full) |
| F | Judo/BJJ textes : seoi-nage / ippon-seoi-nage, tai-sabaki, kuzushi, montée ; niveau d’o-soto-gari | 15, 23 à 26 | avis d’un enseignant pour le niveau |
| G | Système à deux corps (judo, BJJ) : deux squelettes, contacts (saisies), trajectoire du centre de masse d’uke, réception ; exigences dans la section E de [recherche/judo-bjj.md](recherche/judo-bjj.md) | — | conception à valider avant code ; gros chantier |
| H | Outil de comparaison vidéo / animation (vue côte à côte, pas à pas) pour l’éditeur seulement | — | vidéos dont on a le droit, fournies par l’éditeur |
| I | Fiches structurées des 82 techniques restantes, à partir des rapports de recherche | — | revérifier les citations dans les originaux |

À chaque lot : regénérer [MESURES_MOTEUR.md](MESURES_MOTEUR.md), [INVENTAIRE.md](INVENTAIRE.md) et [ANIMATIONS.md](../ANIMATIONS.md), et tenir à jour l’historique de chaque fiche.

Aucun lot ne fait passer une technique à « Validée » : il faut la revue d’un entraîneur qualifié, enregistrée dans la fiche (qui, qualification, date, critères).
