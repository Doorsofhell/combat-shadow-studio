# Inventaire des techniques

Généré par `INVENTORY_UPDATE=1 npx vitest run src/domain/__tests__/biomech.test.ts`. Ne pas modifier à la main.

- **Statut de la fiche** : avancement de la fiche biomécanique structurée (`src/domain/biomech/sheets/`). « À documenter » veut dire qu’il n’y a pas encore de fiche structurée, même si des notes de recherche existent.
- **Notes de recherche** : rapport(s) de `recherche/` qui traitent la technique.
- **Animation** : registre des contrôles automatiques ([ANIMATIONS.md](../ANIMATIONS.md)). « Contrôlée automatiquement » ne veut pas dire validée par un expert.

Bilan : 91 techniques solo, 10 fiches avec partenaire. Fiches : 98 à documenter, 0 documentée, 0 animation en cours, 0 à corriger, 3 validation technique nécessaire, 0 validée.

## Techniques solo

| Technique | Disciplines | Catégorie | Statut de la fiche | Notes de recherche | Animation |
|---|---|---|---|---|---|
| Position de garde (`garde`) | boxe, kickboxing, mma, muaythai | garde | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Pas avant (`pas-avant`) | boxe, kickboxing, mma, muaythai | deplacement | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Pas arrière (`pas-arriere`) | boxe, kickboxing, mma, muaythai | deplacement | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Pas latéral gauche (`pas-gauche`) | boxe, kickboxing, mma, muaythai | deplacement | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Pas latéral droit (`pas-droite`) | boxe, kickboxing, mma, muaythai | deplacement | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Pivot (`pivot-droite`) | boxe, kickboxing, mma, muaythai | deplacement | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Pivot extérieur (`pivot-gauche`) | boxe, kickboxing, mma, muaythai | deplacement | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Sortie d’angle (`sortie-angle`) | boxe, kickboxing, mma, muaythai | deplacement | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Jab (`jab`) | boxe, kickboxing, mma, muaythai | poing | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Direct arrière (`direct`) | boxe, kickboxing, mma, muaythai | poing | Validation technique nécessaire | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Jab au corps (`jab-corps`) | boxe, kickboxing, mma, muaythai | poing | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Direct au corps (`direct-corps`) | boxe, kickboxing, mma, muaythai | poing | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Crochet gauche (`crochet-avant`) | boxe, kickboxing, mma, muaythai | poing | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Crochet droit (`crochet-arriere`) | boxe, kickboxing, mma, muaythai | poing | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Crochet gauche au corps (`crochet-avant-corps`) | boxe, kickboxing, mma, muaythai | poing | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Crochet droit au corps (`crochet-arriere-corps`) | boxe, kickboxing, mma, muaythai | poing | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Uppercut gauche (`uppercut-avant`) | boxe, kickboxing, mma, muaythai | poing | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Uppercut droit (`uppercut-arriere`) | boxe, kickboxing, mma, muaythai | poing | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Overhand (`overhand`) | mma, kickboxing | poing | À documenter | aucune | Contrôlée automatiquement |
| Check hook (crochet pivot) (`check-hook`) | boxe, mma | poing | À documenter | aucune | Contrôlée automatiquement |
| Esquive extérieure (`esquive-droite`) | boxe, kickboxing, mma, muaythai | defense | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Esquive intérieure (`esquive-gauche`) | boxe, kickboxing, mma, muaythai | defense | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Rotation sous le crochet (roll) (`roll-droite`) | boxe, kickboxing, mma, muaythai | defense | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Roll de l’autre côté (`roll-gauche`) | boxe, kickboxing, mma, muaythai | defense | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Blocage haut (`blocage-haut`) | boxe, kickboxing, mma, muaythai | defense | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Blocage au corps (`blocage-corps-avant`) | boxe, kickboxing, mma, muaythai | defense | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Parade (`parade`) | boxe, kickboxing, mma, muaythai | defense | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Retrait de buste (`retrait`) | boxe, kickboxing, mma, muaythai | defense | À documenter | [boxe](recherche/boxe.md), [kickboxing-muaythai](recherche/kickboxing-muaythai.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Shoulder roll (rouler l’épaule) (`shoulder-roll`) | boxe | defense | À documenter | aucune | Contrôlée automatiquement |
| Check (blocage tibia) (`check-avant`) | kickboxing, mma, muaythai | defense | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Check jambe arrière (`check-arriere`) | kickboxing, mma, muaythai | defense | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Garde longue (`garde-longue`) | muaythai | defense | À documenter | aucune | Contrôlée automatiquement |
| Rattrapage du middle kick (`rattrapage-middle`) | muaythai | defense | À documenter | aucune | Contrôlée automatiquement |
| Front kick avant (`front-kick-avant`) | kickboxing, mma | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Front kick arrière (`front-kick-arriere`) | kickboxing, mma | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Teep (`teep-avant`) | muaythai, mma | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Teep arrière (`teep-arriere`) | muaythai | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Low kick droit (`low-kick-arriere`) | kickboxing, mma, muaythai | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Low kick gauche (`low-kick-avant`) | kickboxing, mma, muaythai | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Middle kick droit (`middle-kick-arriere`) | kickboxing, mma, muaythai | pied | Validation technique nécessaire | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Middle kick gauche (`middle-kick-avant`) | kickboxing, mma, muaythai | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| High kick droit (`high-kick-arriere`) | kickboxing, mma, muaythai | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| High kick gauche (`high-kick-avant`) | kickboxing, mma, muaythai | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Roundhouse kick (`roundhouse-arriere`) | kickboxing, mma | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Roundhouse jambe avant (`roundhouse-avant`) | kickboxing | pied | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Switch kick (`switch-kick`) | muaythai, kickboxing | pied | À documenter | aucune | Contrôlée automatiquement |
| Genou direct (`genou-direct-arriere`) | muaythai, mma, kickboxing | genou | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Genou direct avant (`genou-direct-avant`) | muaythai, kickboxing | genou | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Genou circulaire (`genou-circulaire-arriere`) | muaythai, kickboxing | genou | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Genou circulaire avant (`genou-circulaire-avant`) | muaythai, kickboxing | genou | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Coude horizontal gauche (`coude-horizontal-avant`) | muaythai | coude | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Coude horizontal droit (`coude-horizontal-arriere`) | muaythai | coude | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Coude diagonal descendant (`coude-diagonal-arriere`) | muaythai | coude | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Coude diagonal avant (`coude-diagonal-avant`) | muaythai | coude | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Coude remontant (`coude-montant-arriere`) | muaythai | coude | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Coude remontant avant (`coude-montant-avant`) | muaythai | coude | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Clinch simulé (tirage) (`clinch-tirage`) | muaythai | clinch | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Genou dans le clinch (`genou-clinch`) | muaythai | clinch | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Genou circulaire dans le clinch (`genou-circulaire-clinch`) | muaythai | clinch | À documenter | [kickboxing-muaythai](recherche/kickboxing-muaythai.md) | Contrôlée automatiquement |
| Feinte de jab (`feinte-jab`) | boxe, kickboxing, mma, muaythai | feinte | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Feinte d’épaule (`feinte-epaule`) | boxe, kickboxing, mma, muaythai | feinte | À documenter | [boxe](recherche/boxe.md) | Contrôlée automatiquement |
| Feinte de lutte (`feinte-lutte`) | mma | feinte | À documenter | [mma](recherche/mma.md) | Contrôlée automatiquement |
| Changement de niveau (`changement-niveau`) | mma, bjj | lutte | À documenter | [mma](recherche/mma.md) | Contrôlée automatiquement |
| Entrée en double-leg (solo) (`entree-lutte`) | mma, bjj | lutte | À documenter | [mma](recherche/mma.md) | Contrôlée automatiquement |
| Entrée en single-leg (solo) (`single-leg`) | mma, bjj | lutte | À documenter | aucune | Contrôlée automatiquement |
| Sprawl (`sprawl`) | mma | lutte | Validation technique nécessaire | [mma](recherche/mma.md) | Contrôlée automatiquement |
| Défense d’entrée en lutte (`defense-lutte`) | mma | lutte | À documenter | [mma](recherche/mma.md) | Contrôlée automatiquement |
| Descente contrôlée au sol (`descente-sol`) | mma, bjj | sol | À documenter | [judo-bjj](recherche/judo-bjj.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Sortie de hanche (shrimp) (`sortie-hanche`) | mma, bjj | sol | À documenter | [judo-bjj](recherche/judo-bjj.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Relevé technique (`releve-technique`) | mma, bjj | sol | À documenter | [judo-bjj](recherche/judo-bjj.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Posture debout de grappling (`garde-bjj`) | bjj | garde | À documenter | [judo-bjj](recherche/judo-bjj.md) | Contrôlée automatiquement |
| Pont (upa) (`pont`) | bjj, mma | sol | À documenter | [judo-bjj](recherche/judo-bjj.md), [mma](recherche/mma.md) | Contrôlée automatiquement |
| Rétention de garde (solo) (`retention-garde`) | bjj | sol | À documenter | [judo-bjj](recherche/judo-bjj.md) | Contrôlée automatiquement |
| Changement de base (`changement-base`) | bjj | sol | À documenter | [judo-bjj](recherche/judo-bjj.md) | Contrôlée automatiquement |
| Sit-out (`sit-out`) | bjj, mma | sol | À documenter | aucune | Contrôlée automatiquement |
| Relevé depuis les genoux (`releve-genoux`) | bjj | sol | À documenter | aucune | Contrôlée automatiquement |
| Ushiro-ukemi (chute arrière, version basse) (`ukemi-ushiro`) | judo, bjj | chute | À documenter | aucune | Contrôlée automatiquement |
| Shizen-tai (posture naturelle) (`shizen-tai`) | judo | garde | À documenter | [judo-bjj](recherche/judo-bjj.md) | Contrôlée automatiquement |
| Tsugi-ashi avant (`tsugi-ashi-avant`) | judo | deplacement | À documenter | aucune | Contrôlée automatiquement |
| Tsugi-ashi arrière (`tsugi-ashi-arriere`) | judo | deplacement | À documenter | [judo-bjj](recherche/judo-bjj.md) | Contrôlée automatiquement |
| Tsugi-ashi latéral (`tsugi-ashi-lateral`) | judo | deplacement | À documenter | [judo-bjj](recherche/judo-bjj.md) | Contrôlée automatiquement |
| Tai-sabaki (rotation du corps) (`tai-sabaki`) | judo | deplacement | À documenter | [judo-bjj](recherche/judo-bjj.md) | Contrôlée automatiquement |
| Kuzushi (déséquilibre, solo) (`kuzushi`) | judo | projection | À documenter | [judo-bjj](recherche/judo-bjj.md) | Contrôlée automatiquement |
| Uchikomi de seoi-nage (solo) (`uchikomi-seoi`) | judo | projection | À documenter | [judo-bjj](recherche/judo-bjj.md) | Contrôlée automatiquement |
| Ayumi-ashi (pas marchés) (`ayumi-ashi`) | judo | deplacement | À documenter | aucune | Contrôlée automatiquement |
| Kumi-kata (prise de garde, solo) (`kumikata`) | judo | garde | À documenter | aucune | Contrôlée automatiquement |
| Uchikomi d’o-goshi (solo) (`uchikomi-o-goshi`) | judo | projection | À documenter | aucune | Contrôlée automatiquement |
| Uchikomi d’o-soto-gari (solo) (`uchikomi-o-soto-gari`) | judo | projection | À documenter | aucune | Contrôlée automatiquement |
| Uchikomi d’o-uchi-gari (solo) (`uchikomi-o-uchi-gari`) | judo | projection | À documenter | aucune | Contrôlée automatiquement |
| Uchikomi de ko-uchi-gari (solo) (`uchikomi-ko-uchi-gari`) | judo | projection | À documenter | aucune | Contrôlée automatiquement |
| Yoko-ukemi (chute latérale, version basse) (`ukemi-yoko`) | judo | chute | À documenter | aucune | Contrôlée automatiquement |

## Fiches avec partenaire (judo, BJJ)

| Technique | Discipline | Catégorie | Niveau | Statut de la fiche | Notes de recherche | Animation |
|---|---|---|---|---|---|---|
| Ukemi (brise-chutes) (`ukemi`) | judo | chute | debutant | À documenter | [judo-bjj](recherche/judo-bjj.md) | Non implémentée (pas de système à deux corps) |
| O-soto-gari (grand fauchage extérieur) (`o-soto-gari`) | judo | projection | debutant | À documenter | [judo-bjj](recherche/judo-bjj.md) | Non implémentée (pas de système à deux corps) |
| O-goshi (grande hanche) (`o-goshi`) | judo | projection | debutant | À documenter | [judo-bjj](recherche/judo-bjj.md) | Non implémentée (pas de système à deux corps) |
| Ippon-seoi-nage (projection d’épaule) (`seoi-nage`) | judo | projection | intermediaire | À documenter | [judo-bjj](recherche/judo-bjj.md) | Non implémentée (pas de système à deux corps) |
| Kesa-gatame (immobilisation en écharpe) (`kesa-gatame`) | judo | immobilisation | debutant | À documenter | [judo-bjj](recherche/judo-bjj.md) | Non implémentée (pas de système à deux corps) |
| Garde fermée : contrôle de la posture (`garde-fermee`) | bjj | controle | debutant | À documenter | [judo-bjj](recherche/judo-bjj.md) | Non implémentée (pas de système à deux corps) |
| Passage de garde toreando (`passage-toreando`) | bjj | passage | intermediaire | À documenter | [judo-bjj](recherche/judo-bjj.md) | Non implémentée (pas de système à deux corps) |
| Contrôle latéral (side control) (`controle-lateral`) | bjj | immobilisation | debutant | À documenter | [judo-bjj](recherche/judo-bjj.md) | Non implémentée (pas de système à deux corps) |
| Montée (mount) (`montee`) | bjj | immobilisation | intermediaire | À documenter | [judo-bjj](recherche/judo-bjj.md) | Non implémentée (pas de système à deux corps) |
| Clé de bras depuis la garde : principes (`cle-de-bras-garde`) | bjj | soumission | avance | À documenter | [judo-bjj](recherche/judo-bjj.md) | Non implémentée (pas de système à deux corps) |
