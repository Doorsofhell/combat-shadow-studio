# Audit technique et biomécanique

Audit des 6 disciplines (boxe anglaise, kick-boxing, muay-thaï, MMA, judo, jiu-jitsu brésilien), 18 et 19 octobre 2026, branche `audit/biomecanique`, version v0.17.0.

| # | Livrable demandé | Document | État |
|---|---|---|---|
| 1 | Inventaire complet des techniques | [INVENTAIRE.md](INVENTAIRE.md) (généré par un test) | Fait : 75 techniques solo, 10 fiches partenaire |
| 2 | Bibliographie par discipline | [BIBLIOGRAPHIE.md](BIBLIOGRAPHIE.md) | Fait : 142 lignes de sources, citations à revérifier dans les originaux |
| 3 | Registre des vidéos réellement consultées | [REGISTRE_VIDEOS.md](REGISTRE_VIDEOS.md) | **Aucune vidéo visionnée** : références repérées seulement |
| 4 | Fiches biomécaniques structurées | `src/domain/biomech/` et notes complètes dans [recherche/](recherche/) | Partiel : modèle de fiche et 3 fiches pilotes (direct, middle kick droit, sprawl) ; notes de recherche pour les autres |
| 5 | Audit du moteur d’animation | [AUDIT_MOTEUR.md](AUDIT_MOTEUR.md) et [MESURES_MOTEUR.md](MESURES_MOTEUR.md) (généré) | Fait, sauf collisions et Android (non mesurés) |
| 6 | Liste priorisée des anomalies | [ANOMALIES.md](ANOMALIES.md) | Fait : 31 anomalies P1/P2 |
| 7 | Plan de correction | [PLAN_CORRECTION.md](PLAN_CORRECTION.md) | Fait |
| 8 | Animations pilotes corrigées et testées | équilibre des 20 animations sur un pied (coups de pied, genoux, checks) ; sprawl | Fait, tests automatiques ; **pas de revue d’expert** |
| 9 | Méthode reproductible | [METHODE.md](METHODE.md) | Fait |

## Ce qui n’a pas été fait

- Aucune vidéo n’a été visionnée : les outils lisent du texte seulement.
- Aucune technique n’est « Validée » : il faut la revue d’un entraîneur qualifié.
- Pas de système à deux corps pour le judo et le BJJ ; pas d’outil de comparaison vidéo / animation ; pas d’éditeur du catalogue officiel. Ils sont dans le plan (lots G, H).
- Certaines pages officielles étaient inaccessibles (PDF du Kodokan, règlement IBJJF, page UWW, page FFJDA) : elles sont listées dans la bibliographie.
