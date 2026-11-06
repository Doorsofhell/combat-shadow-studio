# Combinaisons des programmes fédéraux : registre des sources

Ce registre liste chaque combinaison « Programme fédéral » de l’application, avec l’endroit exact du document officiel d’où elle vient. Il liste aussi les enchaînements lus mais **pas** ajoutés, avec la raison.

Demande : Youssef, 6 novembre 2026 : « que des combinaisons d’entraînement vérifiées et validées par les fédérations ou des entraîneurs », « bien les classer », « je ne veux pas quelque chose de brouillon ». Décision du même jour : les 1 496 fiches inspirées restent, les fiches validées passent en tête.

## Règles

1. Une fiche n’entre que si son enchaînement est **écrit** dans un document officiel lisible : organisme, document, lien, page, exercice et citation exacte sont obligatoires (`src/domain/catalog/validate.ts`, `programProblems`).
2. Quand le document écrit les bras (« Direct Arr Face + Crochet Av Face »), la séquence de l’app doit être exactement celle-là : un test relit chaque citation FFBoxe et la compare à la séquence (`src/domain/__tests__/programmes.test.ts`).
3. Quand le document laisse un choix (« bras avant et/ou arrière »), le choix fait est écrit sur la fiche, dans « Travail seul ».
4. Un enchaînement dont un geste n’existe pas dans le moteur 3D n’est pas ajouté, et il n’est pas remplacé par un geste voisin sans le dire.
5. Aucune vidéo n’a servi de source. Les documents ont été lus sous forme de texte extrait des PDF le 6 novembre 2026 ; les illustrations des PDF n’ont pas pu être lues.
6. Dans les citations, les lignes successives du document sont séparées par « — » ou « / ».

## Documents lus

| Organisme | Document | Lien |
| --- | --- | --- |
| FFBoxe | Livret explicatif du Gant blanc (31/08/2023) | https://www.ffboxe.com/wp-content/uploads/2023/09/Livret-explicatif-du-Gant-Blanc-31.08.2023-ok-MT.pdf |
| FFBoxe | Livret explicatif du Gant jaune (mis en ligne en janvier 2025) | https://www.ffboxe.com/wp-content/uploads/2025/01/Livret-explicatif-du-GANT-JAUNE.pdf |
| FFBoxe | Fiches ateliers du Gant orange (au 01/09/2025) | https://www.ffboxe.com/wp-content/uploads/2025/09/Fiches-Ateliers-GANT-ORANGE-au-01_09_2025.pdf |
| FFBoxe | Fiches ateliers du Gant rouge (au 01/09/2025) | https://www.ffboxe.com/wp-content/uploads/2025/09/Fiches-ateliers-du-GANT-ROUGE-au-01_09_2025.pdf |
| FFKMDA | Référentiel techniques et grades Muaythai (juillet 2026), pages 1 à 30 lues | https://www.ffkmda.com/wp-content/uploads/2026/07/2026-referentiel-techniques-et-grades-Muaythai-FFKMDA-officiel.pdf |

Niveaux : gants blanc et jaune, prajeet jaune = Débutant ; gant orange, prajeets orange et vert = Intermédiaire ; gant rouge = Avancé.

## Fiches ajoutées (30)

### FFBoxe · Gant blanc

| Fiche | Page | Exercice | Tel qu’il est écrit | Séquence dans l’app |
| --- | ---: | --- | --- | --- |
| `boxe-ffboxe-gb-01` Deux directs : avant puis arrière | 17 | Appareil technique, APT 2 | « Doublés de Directs ou enchaînement de 2 Directs Poings avant ou arrière à la face ou au buste » | Jab → Direct arrière |
| `boxe-ffboxe-gb-02` Doublé de directs du poing avant | 17 | Appareil technique, APT 2 | « Doublés de Directs ou enchaînement de 2 Directs Poings avant ou arrière à la face ou au buste » | Jab → Jab |
| `boxe-ffboxe-gb-03` Direct arrière puis jab | 10 | Échelle de rythme, exercice 2_GB_ECR.8 | « Appui Avt / D.Pg Arr Face et Appui Arr / D.Pg Avt Face. » | Direct arrière → Jab |
| `boxe-ffboxe-gb-04` Jab au visage, direct au buste | 10 | Échelle de rythme, exercice 2_GB_ECR.9 | « Appui Avt / D.Pg Avt Face et Appui Arr / D.Pg Arr Buste. » | Jab → Direct au corps |
| `boxe-ffboxe-gb-05` Direct au buste, jab au visage | 10 | Échelle de rythme, exercice 2_GB_ECR10 | « Appui Avt / D.Pg Arr Buste et Appui Arr / D.Pg Avt Face. » | Direct au corps → Jab |

### FFBoxe · Gant jaune

| Fiche | Page | Exercice | Tel qu’il est écrit | Séquence dans l’app |
| --- | ---: | --- | --- | --- |
| `boxe-ffboxe-gj-01` Parade, direct, crochet, direct | 16 | Appareil technique, APT 1 (enchaînement imposé) | « Parade Avant-Bras + Direct Arr Face + Crochet Av Face + Direct Arr Face » | Blocage haut → Direct arrière → Crochet gauche → Direct arrière |
| `boxe-ffboxe-gj-02` Jab, crochet avant, direct | 16 | Appareil technique, APT 1 (enchaînement imposé) | « Direct Av Face + Crochet Av Face + Direct Arr Face » | Jab → Crochet gauche → Direct arrière |
| `boxe-ffboxe-gj-03` Jab, crochet avant, puis blocage | 18 | Oppositions, LCO 1 (boxeur A) | « A : Attaque en enchainement + Parade Bloquée (Direct Avant Face + Crochet Avant Face) » | Jab → Crochet gauche → Blocage haut |
| `boxe-ffboxe-gj-04` Crochet avant, direct, deux parades | 11 | Carré boxe 1, côté 1 | « Crochet Avant Face / Appui Avant — Direct Arrière Face / Appui Arrière — 2 Parades sur place » | Crochet gauche → Direct arrière → Parade → Parade |
| `boxe-ffboxe-gj-05` Deux crochets, deux parades | 11 | Carré boxe 1, côté 2 | « Crochet Avant Face / Appui Arrière — Crochet Arrière Face / Appui Avant — 2 Parades sur place » | Crochet gauche → Crochet droit → Parade → Parade |
| `boxe-ffboxe-gj-06` Direct, crochet avant, deux parades | 11 | Carré boxe 1, côté 3 | « Direct Arrière Face / Appui Arrière — Crochet Avant Face / Appui Avant — 2 Parades sur place » | Direct arrière → Crochet gauche → Parade → Parade |
| `boxe-ffboxe-gj-07` Crochet arrière, crochet avant, deux parades | 11 | Carré boxe 1, côté 4 | « Crochet Arrière Face / Appui Avant — Crochet Avant Face / Appui Arrière — 2 Parades sur place » | Crochet droit → Crochet gauche → Parade → Parade |

### FFBoxe · Gant orange

| Fiche | Page | Exercice | Tel qu’il est écrit | Séquence dans l’app |
| --- | ---: | --- | --- | --- |
| `boxe-ffboxe-go-01` Direct, crochet, uppercut | 7 | Carré boxe 1 (les quatre côtés) | « Enchainement successif et sans interruption (à la Face) : Direct – Crochet – Uppercut » | Direct arrière → Crochet gauche → Uppercut droit |
| `boxe-ffboxe-go-02` Jab, uppercut arrière, crochet avant, blocage | 8 | Carré boxe 2, côté 1 | « Direct Avant Face en contrôle / Uppercut Arrière Face en déplacement Oblique avant / Crochet Avant Face en retour d’appuis / Parade avant-bras en décalage sur les 2 appuis » | Jab → Uppercut droit → Crochet gauche → Blocage haut |
| `boxe-ffboxe-go-03` Deux uppercuts, crochet arrière, deux parades | 8 | Carré boxe 2, enchaînements | « Uppercut Arr Face + Uppercut Av Face + Crochet Arr Face + 2 Parades (la 2e sur place) » | Uppercut droit → Uppercut gauche → Crochet droit → Parade → Parade |
| `boxe-ffboxe-go-04` Deux uppercuts, crochet avant, deux parades | 8 | Carré boxe 2, enchaînements | « Uppercut Av Face + Uppercut Arr Face + Crochet Av Face + 2 Parades (la 2e sur place) » | Uppercut gauche → Uppercut droit → Crochet gauche → Parade → Parade |
| `boxe-ffboxe-go-05` Blocage, deux crochets au buste, crochet au visage | 12 | Appareil technique, APT 1, enchaînement imposé (contre-attaquant) | « Parade avant-bras / Crochet Av Buste / Crochet Arr buste / Crochet Av Face » | Blocage haut → Crochet gauche au corps → Crochet droit au corps → Crochet gauche |
| `boxe-ffboxe-go-06` Jab, uppercut arrière, crochet avant | 5 | Échelle de rythme, exercice GO_ECR.3 | « - Direct en contrôle - Décalage Appui Arrière / Uppercut Arrière Face - Décalage Appui Avant / Crochet Avant Face » | Jab → Uppercut droit → Crochet gauche |
| `boxe-ffboxe-go-07` Direct arrière, uppercut avant | 5 | Échelle de rythme, exercice GO_ECR.5 | « Appui Arrière (dans échelle) / Direct arrière Face — Appui Avant (dans échelle) / Uppercut avant Face » | Direct arrière → Uppercut gauche |

### FFBoxe · Gant rouge

| Fiche | Page | Exercice | Tel qu’il est écrit | Séquence dans l’app |
| --- | ---: | --- | --- | --- |
| `boxe-ffboxe-gr-01` Crochet avant, uppercut arrière, jab en reculant | 5 | Échelle de rythme, exercice GR_ECR.3 | « - Crochet Avant Face + Uppercut Arrière Face REMOBILISATION = Retrait en Direct avant Face » | Crochet gauche → Uppercut droit → Jab |
| `boxe-ffboxe-gr-02` Direct arrière, crochet arrière, uppercut avant | 5 | Échelle de rythme, exercice imprimé « GJ_ECR.5 » | « - Appuis Avant / Direct arrière Face - Crochet Arrière Face + Uppercut Avant Face » | Direct arrière → Crochet droit → Uppercut gauche |
| `boxe-ffboxe-gr-03` Direct arrière, crochet avant | 8 | Carré boxe 2, enchaînements | « Direct Arr Face + Crochet Av Face » | Direct arrière → Crochet gauche |
| `boxe-ffboxe-gr-04` Crochet avant, direct arrière | 8 | Carré boxe 2, enchaînements | « Crochet Av Face + Direct Arr Face » | Crochet gauche → Direct arrière |

### FFKMDA · Prajeet jaune

| Fiche | Page | Exercice | Tel qu’il est écrit | Séquence dans l’app |
| --- | ---: | --- | --- | --- |
| `muaythai-ffkmda-pj-01` Parade et riposte du poing | 15 | Assaut à thèmes n° 1 (défense) | « BANG MAT + MAT TRONG — Parade du bras et/avant ou arrière et riposte du bras avant et/ou arrière » | Parade → Direct arrière |
| `muaythai-ffkmda-pj-02` Parade de la jambe et riposte circulaire | 15 | Assaut à thèmes n° 2 (défense) | « BANG TEI + TEI CHIANG — Parade jambe avant ou arrière et riposte jambe arrière » | Check (blocage tibia) → Middle kick droit |
| `muaythai-ffkmda-pj-03` Parade et riposte du genou | 15 | Assaut à thèmes n° 3 (défense) | « BANG MAT + KHAO TRONG — Parade bras avant ou arrière et riposte jambe arrière » | Parade → Genou direct |
| `muaythai-ffkmda-pj-04` Parade et riposte au corps | 15 | Assaut à thèmes n° 4 (défense) | « BANG MAT +TEI CHIANG — Bras avant ou arrière et riposte jambe arrière » | Parade → Middle kick droit |

### FFKMDA · Prajeet orange

| Fiche | Page | Exercice | Tel qu’il est écrit | Séquence dans l’app |
| --- | ---: | --- | --- | --- |
| `muaythai-ffkmda-po-01` Esquive en reculant, circulaire haut | 18 | Assaut à thèmes n° 1 (défense) | « LOM TCHAK + TEI KANN KRO — Esquives par pas de retrait et riposte jambe avant et/ou arrière » | Pas arrière → High kick droit |
| `muaythai-ffkmda-po-03` Circulaire au corps puis coup de pied frontal | 18 | Assaut à thèmes n° 3 (attaque) | « TEI CHIANG + TIP TRONG — Jambe arrière et enchaînement jambe avant ou jambe arrière » | Middle kick droit → Teep |

### FFKMDA · Prajeet vert

| Fiche | Page | Exercice | Tel qu’il est écrit | Séquence dans l’app |
| --- | ---: | --- | --- | --- |
| `muaythai-ffkmda-pv-01` Deux directs puis coude descendant | 21 | Assaut à thèmes n° 1 (attaque) | « MAT TRONG + SOK TAT — Bras avant et arrière suivi du coude avant ou arrière » | Jab → Direct arrière → Coude diagonal avant |

## Enchaînements lus mais pas ajoutés

| Document | Page | Enchaînement | Raison |
| --- | ---: | --- | --- |
| FFBoxe gant orange | 12 | APT 1, enchaînement 1 : « Parade avant-bras, Uppercut Arr Buste, Crochet Av Face, Crochet Arr Face » | L’uppercut au buste n’existe pas encore dans le moteur |
| FFBoxe gant orange | 14 | LCO 1 : « Crochet Avant Face + Uppercut Arrière Buste » ; LCO 3 : « Direct avant Face en préparation + 2 Uppercuts Buste » et l’inverse | Uppercut au buste absent |
| FFBoxe gant rouge | 7, 8, 12, 14 | Carré boxe 1 (« … + Uppercut arrière Buste »), carré boxe 2 (« Parades X 2 puis Uppercut Avant Buste »), APT 1 enchaînement 1, LCO 1 A, LCO 2 B | Uppercut au buste absent |
| FFBoxe gant rouge | 8, 12 | « Parade avant + Uppercut Arr + Uppercut Avant » ; APT 1 enchaînement 2 « Parade avant + Direct arr Face + Crochet Av Face » | La parade du bras avant n’existe pas dans le moteur (la parade de l’app se fait avec la main arrière) |
| FFBoxe gant jaune | 12 | Carré boxe 2, côtés 1 à 4 (« … Retour en Esquive rotative », « Parade Avant sur place ») | Côté de l’esquive rotative non précisé ; parade du bras avant absente |
| FFBoxe gant orange | 8 | Carré boxe 2, côté 3 (« … Esquive rotative en décalage ») | Côté de l’esquive non précisé |
| FFBoxe gant rouge | 14 | LCO 2 A « Direct Av Face + Crochet Av Face + Direct Arr Face » | Déjà présent : c’est la fiche `boxe-ffboxe-gj-02` du gant jaune (la fiche le signale) |
| FFBoxe gants blanc à rouge | — | Exercices « libres » (« Enchaînements libres », « Attaque sur 2 ou 3 coups ») | Aucun enchaînement écrit |
| FFBoxe gants orange et rouge | 5 | Échelles GO_ECR.1-2, GR_ECR.1-2 : « Enchainement => » vide dans le texte | Le contenu est dans une illustration non lisible |
| FFKMDA prajeet orange | 18 | « BANG MAT + MAT WIYENG YAO + MAT SOY » | Le swing (Mat Wiyeng Yao) n’existe pas dans le moteur |
| FFKMDA prajeet orange | 18 | « LOM TCHAK + TEI KANN KRO + TEI CHIANG » (riposte doublée) | Jambe des deux coups non précisée ; deux coups de pied de la même jambe enchaînés ne sont pas jouables |
| FFKMDA prajeet orange | 18 | « TCHAP KHO » / « LAT EO + KHAO KONG » | Saisies : travail avec partenaire |
| FFKMDA prajeet vert | 21 | « TEI CHIANG + TEI KOT », « TIP THOP + TEI CHIANG », « MAT TRONG + MAT KLAP LANG », « MUAY BANG + KHAO CHIANG », thème 4 | Coup de pied vertical, revers, coup retourné, genoux au corps à corps : gestes absents ou partenaire |
| FFKMDA prajeets bleu, marron, 1er khan | 24, 27, 30 | « MUAY TEI + MUAY MAT + MUAY KHAO », etc. | Le document donne des familles (pied + poings + genoux), le candidat choisit les gestes : à ajouter plus tard comme fiches « Adaptées », pas « Programme fédéral » |

## Disciplines sans fiche de programme pour l’instant

- **Kick-boxing** (FFKMDA, référentiel des grades 2026 ; contenus low kick/kick light, K1, full contact) : le nombre de coups par gant est écrit (2 au blanc, 3 au jaune, 4 au vert, 5 au bleu, 6 au noir), mais pas les coups eux-mêmes. Des fiches « Adaptées » respectant ces schémas, style par style, sont le prochain lot possible.
- **Judo** (FFJDA, progression française) : des consignes (« enchaîner une attaque à droite et à gauche »), pas d’enchaînement nommé.
- **BJJ** : une seule séquence solo d’entraîneur trouvée (Stephan Kesting, Grapplearts, relevé technique) ; le PDF de gradation IBJJF n’a pas pu être lu.
- **MMA** : le programme IMMAF n’est lisible que dans son application.
