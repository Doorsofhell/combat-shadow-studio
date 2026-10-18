# Registre des animations

Généré par `UPDATE_REGISTRY=1 npx vitest run src/engine/__tests__/registry.test.ts` (contrôles sur le squelette réel du coach homme). Ne pas modifier à la main.

- **Validée par un expert** : revue par un entraîneur qualifié. Aucune pour l’instant.
- **Contrôlée automatiquement** : tous les contrôles applicables sont réussis. Cela ne remplace pas une validation par un expert.
- **À corriger** : au moins un contrôle échoue (détail dans la colonne Notes).
- **Non implémentée** : fiche avec partenaire réel, sans animation à deux personnages.

Bilan : 0 validée(s), 75 contrôlée(s), 0 à corriger, 0 manquante(s), 10 non implémentée(s).

Contrôles : 1. Présente dans chaque discipline, dans les deux gardes ; 2. Coudes et genoux dans leur amplitude naturelle ; 3. Pied d’appui fixe (pas de glissement) ; 4. Mouvement continu (pas de saut de pose) ; 5. Le membre arrive en fin de rotation des hanches ; 6. Le coup accélère et touche en vitesse (au moins 25 % de sa vitesse de pointe) ; 7. Vitesse de pointe plausible (poing ≤ 12 m/s, pied ≤ 26 m/s).

| Technique | Disciplines | Statut | C1 | C2 | C3 | C4 | C5 | C6 | C7 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Position de garde (`garde`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Pas avant (`pas-avant`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Pas arrière (`pas-arriere`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Pas latéral gauche (`pas-gauche`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Pas latéral droit (`pas-droite`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Pivot (`pivot-droite`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Pivot extérieur (`pivot-gauche`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Sortie d’angle (`sortie-angle`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Jab (`jab`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | oui | oui |  |
| Direct arrière (`direct`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Jab au corps (`jab-corps`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | oui | oui |  |
| Direct au corps (`direct-corps`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Crochet gauche (`crochet-avant`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Crochet droit (`crochet-arriere`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Crochet gauche au corps (`crochet-avant-corps`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Crochet droit au corps (`crochet-arriere-corps`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Uppercut gauche (`uppercut-avant`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Uppercut droit (`uppercut-arriere`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Overhand (`overhand`) | mma, kickboxing | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Esquive extérieure (`esquive-droite`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Esquive intérieure (`esquive-gauche`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Rotation sous le crochet (roll) (`roll-droite`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Roll de l’autre côté (`roll-gauche`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Blocage haut (`blocage-haut`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Blocage au corps (`blocage-corps-avant`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Parade (`parade`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Retrait de buste (`retrait`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Check (blocage tibia) (`check-avant`) | kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Check jambe arrière (`check-arriere`) | kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Front kick avant (`front-kick-avant`) | kickboxing, mma | Contrôlée automatiquement | oui | oui | oui | oui | – | oui | oui |  |
| Front kick arrière (`front-kick-arriere`) | kickboxing, mma | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Teep (`teep-avant`) | muaythai, mma | Contrôlée automatiquement | oui | oui | oui | oui | – | oui | oui |  |
| Teep arrière (`teep-arriere`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Low kick droit (`low-kick-arriere`) | kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Low kick gauche (`low-kick-avant`) | kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Middle kick droit (`middle-kick-arriere`) | kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Middle kick gauche (`middle-kick-avant`) | kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| High kick droit (`high-kick-arriere`) | kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| High kick gauche (`high-kick-avant`) | kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Roundhouse kick (`roundhouse-arriere`) | kickboxing, mma | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Roundhouse jambe avant (`roundhouse-avant`) | kickboxing | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Genou direct (`genou-direct-arriere`) | muaythai, mma | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Genou direct avant (`genou-direct-avant`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Genou circulaire (`genou-circulaire-arriere`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Genou circulaire avant (`genou-circulaire-avant`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Coude horizontal gauche (`coude-horizontal-avant`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Coude horizontal droit (`coude-horizontal-arriere`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Coude diagonal descendant (`coude-diagonal-arriere`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Coude diagonal avant (`coude-diagonal-avant`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Coude remontant (`coude-montant-arriere`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Coude remontant avant (`coude-montant-avant`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | oui | oui | oui |  |
| Clinch simulé (tirage) (`clinch-tirage`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Genou dans le clinch (`genou-clinch`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Genou circulaire dans le clinch (`genou-circulaire-clinch`) | muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Feinte de jab (`feinte-jab`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Feinte d’épaule (`feinte-epaule`) | boxe, kickboxing, mma, muaythai | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Feinte de lutte (`feinte-lutte`) | mma | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Changement de niveau (`changement-niveau`) | mma | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Entrée en double-leg (solo) (`entree-lutte`) | mma | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Sprawl (`sprawl`) | mma | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Défense d’entrée en lutte (`defense-lutte`) | mma | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Descente contrôlée au sol (`descente-sol`) | mma, bjj | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Sortie de hanche (shrimp) (`sortie-hanche`) | mma, bjj | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Relevé technique (`releve-technique`) | mma, bjj | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Posture debout de grappling (`garde-bjj`) | bjj | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Pont (upa) (`pont`) | bjj, mma | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Rétention de garde (solo) (`retention-garde`) | bjj | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Changement de base (`changement-base`) | bjj | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Shizen-tai (posture naturelle) (`shizen-tai`) | judo | Contrôlée automatiquement | oui | oui | oui | oui | – | – | – |  |
| Tsugi-ashi avant (`tsugi-ashi-avant`) | judo | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Tsugi-ashi arrière (`tsugi-ashi-arriere`) | judo | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Tsugi-ashi latéral (`tsugi-ashi-lateral`) | judo | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Tai-sabaki (rotation du corps) (`tai-sabaki`) | judo | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Kuzushi (déséquilibre, solo) (`kuzushi`) | judo | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Uchikomi de seoi-nage (solo) (`uchikomi-seoi`) | judo | Contrôlée automatiquement | oui | oui | – | oui | – | – | – |  |
| Ukemi (brise-chutes) (`ukemi`) | judo | Non implémentée | – | – | – | – | – | – | – | fiche avec partenaire réel ; démonstration à deux personnages pas encore animée |
| O-soto-gari (grand fauchage extérieur) (`o-soto-gari`) | judo | Non implémentée | – | – | – | – | – | – | – | fiche avec partenaire réel ; démonstration à deux personnages pas encore animée |
| O-goshi (grande hanche) (`o-goshi`) | judo | Non implémentée | – | – | – | – | – | – | – | fiche avec partenaire réel ; démonstration à deux personnages pas encore animée |
| Ippon-seoi-nage (projection d’épaule) (`seoi-nage`) | judo | Non implémentée | – | – | – | – | – | – | – | fiche avec partenaire réel ; démonstration à deux personnages pas encore animée |
| Kesa-gatame (immobilisation en écharpe) (`kesa-gatame`) | judo | Non implémentée | – | – | – | – | – | – | – | fiche avec partenaire réel ; démonstration à deux personnages pas encore animée |
| Garde fermée : contrôle de la posture (`garde-fermee`) | bjj | Non implémentée | – | – | – | – | – | – | – | fiche avec partenaire réel ; démonstration à deux personnages pas encore animée |
| Passage de garde toreando (`passage-toreando`) | bjj | Non implémentée | – | – | – | – | – | – | – | fiche avec partenaire réel ; démonstration à deux personnages pas encore animée |
| Contrôle latéral (side control) (`controle-lateral`) | bjj | Non implémentée | – | – | – | – | – | – | – | fiche avec partenaire réel ; démonstration à deux personnages pas encore animée |
| Montée (mount) (`montee`) | bjj | Non implémentée | – | – | – | – | – | – | – | fiche avec partenaire réel ; démonstration à deux personnages pas encore animée |
| Clé de bras depuis la garde : principes (`cle-de-bras-garde`) | bjj | Non implémentée | – | – | – | – | – | – | – | fiche avec partenaire réel ; démonstration à deux personnages pas encore animée |
