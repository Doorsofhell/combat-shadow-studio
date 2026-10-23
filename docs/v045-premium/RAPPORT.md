# v0.45.0 · Page « Premium à vie » · rapport

Demandes de Youssef (2026-10-23 11:08 « REFONTE PAGE PREMIUM À VIE » et 11:11 « REPRODUCTION FIDÈLE DE LA MAQUETTE PREMIUM »). Référence : `maquettes/premium-2026-10-23/maquette-premium-definitive.png` (5 écrans).

## 1. Audit de la page v0.44

| Élément | Constat |
|---|---|
| Conditions | 4 cartes (Achat unique, Accès Premium à vie, Aucun abonnement, Aucun renouvellement automatique) : la même information répétée 4 fois |
| Avantages | liste verticale de 8 lignes, dont 2 « À venir » |
| Prix | « 39,99 € TTC, prix de lancement indicatif » et un bouton désactivé « Paiement bientôt disponible » |
| Défilement | la page défilait sur un téléphone : 1 330 px de haut pour un écran de 851 px (393 × 851, mesuré sur la v0.44) |
| Barre du bas | Retour, Entraîner, Techniques, Progrès, Menu : rien de propre à la page |
| Restauration | aucune entrée ; `PurchaseProvider.restore()` existait comme interface seulement |

## 2. Ce qui change

**Page principale (un seul écran)** : « MENU / PREMIUM », « Premium à vie », diamant doré dans un carré arrondi, « Combat Shadow Studio Premium », « Tous tes entraînements. Sans limites. », une seule mention « Un paiement. À vie. Sans abonnement. », la carte « Inclus dans Premium » en grille 2 × 3 (Enchaînements, Coaching 3D, 6 disciplines, Programmes, Statistiques, Historique), le bandeau « Combattants et réglages avancés : à venir », la carte anthracite « Accès Premium à vie » avec le bouton rouge « Découvrir l'offre → ».

**Barre du bas** : Retour | Avantages | FAQ | Restaurer | Menu. Les trois actions centrales gardent la teinte légère des actions d'écran (v0.44) et passent au rouge soutenu quand leur panneau est ouvert.

**Panneaux** (feuilles du bas qui s'arrêtent au-dessus de la barre ; croix de fermeture ; Retour Android et Échap ferment ; un seul ouvert à la fois ; défilement interne seulement) :

- **Détails des avantages** : les 6 catégories en lignes dépliables, avec les textes de Youssef.
- **Questions fréquentes** : les 4 questions demandées ; les réponses ne disent que ce qui est vrai aujourd'hui.
- **Restaurer un achat** : « Restaurer maintenant » appelle `restorePurchases()` (`src/monetization/purchases.ts`). Aucun système d'achat n'est branché, donc la réponse est « indisponible », dite clairement : « La restauration n'est pas encore disponible… Rien n'a été payé ni modifié. » Aucun faux succès.
- **Offre Premium** : achat unique, sans renouvellement ; le prix de lancement indicatif déjà fixé en v0.40 (39,99 € TTC), marqué « indicatif » ; « Voir les options disponibles » répond qu'aucune option d'achat n'est encore disponible. Aucune transaction, aucun appel de boutique.

**Utilisateur Premium** (statut qu'aucune action de l'application ne peut donner aujourd'hui) : la carte anthracite affiche « Premium à vie activé », sans bouton d'offre.

## 3. Composants modifiés

- `src/ui/premium/PremiumPage.tsx`, `src/ui/premium/premium.css` : page et 4 panneaux.
- `src/ui/nav/config.ts` : barre de la page Premium.
- `src/ui/nav/icons.ts` : 8 icônes ajoutées dans le dessin de la barre (liste cochée, aide, restaurer, gants croisés, horloge, info, étiquette, chevron).
- `src/ui/nav/NavSheets.tsx`, `src/ui/nav/nav.css` : `NavPanel` gagne une croix (`closable`) et un mode au-dessus de la barre (`aboveBar`), sans changer les panneaux existants.
- `src/monetization/entitlements.ts` : les 6 catégories (`PREMIUM_CATEGORIES`) ; la liste des 8 avantages reste la source des droits.
- `src/monetization/purchases.ts` : `restorePurchases()`, `setPurchaseProvider()`, `purchaseAvailable()`.

## 4. Écarts avec la maquette (documentés)

- **Tutoiement** : la maquette mélange « tes entraînements » et « votre accès » ; l'application tutoie partout, donc « Restaurer ton accès Premium ».
- **Prix** : la maquette n'affiche aucun prix. La page n'en affiche pas ; le panneau Offre garde le prix indicatif décidé en v0.40, marqué « indicatif », pour ne pas faire disparaître une information existante.
- **« Les futures mises à jour (selon les conditions) »** (panneau Offre de la maquette) : retiré, ce serait une promesse commerciale non définie. Les trois autres lignes sont gardées.
- **« App Store »** (panneau Restaurer) : remplacé par « Google Play par exemple », la seule boutique envisagée dans le dépôt.
- **Lignes dépliables** : ouvertes à l'ouverture du panneau, comme sur la maquette ; un toucher les replie.
- **Couleur de la barre au repos** : teinte légère des actions d'écran, règle de la v0.44 demandée après cette maquette.

## 5. Captures

`captures/` : les 5 états (page, Avantages, FAQ, Restaurer avec et sans réponse, Offre) en 412 × 915 clair et sombre, et en 360 × 640 ; la page seule en 393 × 740 et 360 × 700.

## 6. Tests

TESTS
