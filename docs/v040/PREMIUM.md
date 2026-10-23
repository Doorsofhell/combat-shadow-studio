# v0.40.0 — Préparation Freemium et Premium à vie

Demande : Youssef, 2026-10-22 20:52, « Préparation Freemium et Premium à vie ».

> **Aucun paiement réel, aucun blocage.** Toutes les fonctions restent accessibles. Les diamants dorés sont
> seulement des informations. `MONETIZATION_ENABLED = false`.

## Ce qui est livré

| Élément | Fichier |
|---|---|
| Catalogue typé des droits | `src/monetization/entitlements.ts` |
| Couche des droits (affichage, vérification, source) | `src/monetization/rights.ts` |
| Offre et prix centralisés (39,99 € TTC, indicatif) | `src/monetization/offer.ts` |
| Interface du futur paiement (non implémentée) | `src/monetization/purchases.ts` |
| Marqueur (diamant doré) | `src/ui/premium/PremiumMarker.tsx`, glyphe `diamond` |
| Page `/premium` | `src/ui/premium/PremiumPage.tsx` |
| Entrée Menu « Premium à vie » (neuvième case, après les huit de la maquette) | `src/ui/nav/config.ts` |
| Réponse du Coach IA sur Premium | `src/coach/appGuide.ts` |

Captures : `docs/v040/captures/` (après, sombre et clair, téléphone 393 × 851) et `docs/v040/captures/avant/` (v0.39).

Correction faite en passant : une ligne de réglage (`Toggle`) qui contient un diamant est maintenant liée à son interrupteur par un identifiant. Sans ce lien, toucher le texte de la ligne activait le premier bouton de la ligne, c'est-à-dire le diamant, au lieu de l'interrupteur. Le test `premium.spec.ts` l'a révélé.

## Audit : fonctions existantes et droits futurs

Pour chaque droit, le tableau indique si la fonction existe dans l'application et si un diamant est affiché.

| Identifiant | Fonction | Où | Existe ? | Diamant | Limite gratuite envisagée |
|---|---|---|---|---|---|
| `unlimited_combos` | Enchaînements personnels illimités | Titre « Mes enchaînements » (`/createur`) | oui | oui | nombre limité (à fixer) |
| `advanced_combo_builder` | Analyse des enchaînements | Titre « Analyse de l'enchaînement » (fiche) | oui | oui | création et exécution de base gratuites |
| `advanced_techniques` | Niveaux avancé et expert | Description du niveau choisi, seulement en Avancé ou Expert (`/discipline/:id`) | oui | oui | débutant et intermédiaire gratuits |
| `all_programs` | Tous les programmes | Titre « Programmes » | oui | oui | un programme d'initiation par discipline (à fixer) |
| `advanced_voice` | Coaching vocal avancé | Réglage « Conseils techniques » (`/reglages/voix`) | oui | oui | voix du coach gratuite |
| `advanced_breakdown` | Décomposition des mouvements | Panneau Décomposer, pendant la séance | oui | oui | à fixer |
| `advanced_statistics` | Statistiques et comparaisons avancées | Titre « Activité » (`/stats/activite`) | oui | oui | vue d'ensemble de Progrès gratuite |
| `full_history` | Historique complet | Titre « Historique » | oui | oui | séances récentes (durée à fixer) |
| `unlimited_favorites` | Favoris illimités | Une ligne en tête de l'onglet Favoris | oui | oui | nombre limité (à fixer) |
| `legends_collection` | Collection complète des légendes | Titre « Champions » | oui | oui | une sélection (à fixer) |
| `all_disciplines` | Six disciplines complètes | — | oui | **non** : choix commercial à confirmer | à décider |
| `anime_rendering` | Rendu Anime | — | oui | **non** : « si ce choix commercial est confirmé » | rendu Ultra-réaliste gratuit |
| `all_fighters` | Galerie complète des combattants | — | **non** (seuls Kadir et Amara existent) | non | — |
| `advanced_timer` | Réglages avancés du chronomètre | — | **non** (seuls rounds et repos existent) | non | — |

Règles suivies :
- **Bouton « Créer un enchaînement »** : aucun diamant, la création de base restera gratuite.
- **Un seul diamant par fonction** : sur le titre d'un écran ou d'une section, jamais sur chaque ligne.
- **Rien de nouveau** : aucune fonction sportive n'a été ajoutée, et les calculs, séances, modèles et animations n'ont pas changé.

## Comportement

- **Utilisateur Free (tout le monde aujourd'hui)** :
  - les diamants sont visibles et toucher un diamant ouvre `/premium` ;
  - le diamant ne déclenche pas la carte, le bouton ou l'interrupteur autour de lui ;
  - chaque diamant porte un libellé lisible par les lecteurs d'écran : « Premium : nom. Voir l'offre Premium à vie ».
- **Utilisateur Premium** : les diamants ne sont pas affichés et ne laissent aucun espace vide. La page affiche
  « Premium à vie activé », sans prix ni bouton. Aujourd'hui, rien ne peut donner ce statut : la seule source est
  `NO_PURCHASE_SOURCE` (« free »). Les tests unitaires injectent un statut Premium par `setRightsSource`.
  Aucune route, aucun réglage et aucune variable globale ne l'exposent.
- **Page `/premium`** :
  - titre, sous-titre et les quatre engagements (achat unique, à vie, sans abonnement, sans renouvellement) ;
  - les huit avantages dans l'ordre demandé : « Tous les combattants et rendus » et « Réglages avancés
    d'entraînement » sont marqués « À venir », car leurs fonctions n'existent pas encore ;
  - prix « 39,99 € TTC », écrit comme « Prix de lancement indicatif » ;
  - bouton désactivé « Paiement bientôt disponible », avec la phrase demandée en dessous.
  Il n'y a ni simulation, ni coordonnées bancaires, ni prestataire de paiement, ni SDK installé.

## Intégration future du paiement (non réalisée)

`src/monetization/purchases.ts` décrit l'interface `PurchaseProvider`. À l'activation :

1. **Produit** : créer dans Google Play Console un produit unique non consommable `premium_lifetime`
   (`PREMIUM_OFFER.productId`). Le prix localisé du store remplace alors le prix indicatif
   (`PREMIUM_OFFER.indicative = false`).
2. **Achat** : un fournisseur Google Play Billing (plugin Capacitor) implémente `purchase()`. La page Premium
   remplace son bouton désactivé par l'appel à `purchase()`.
3. **Vérification** : le jeton d'achat est vérifié côté serveur (Google Play Developer API), par exemple dans une
   Cloud Function. Firestore garde le droit dans `users/{uid}/entitlements`, déjà en lecture seule pour le client
   (`firestore.rules`, v0.37). Le droit n'est jamais déduit d'un réglage local.
4. **Source des droits** : `setRightsSource()` reçoit une source qui lit ce droit vérifié. Elle le garde en cache
   pour le hors-ligne, uniquement s'il a déjà été validé.
5. **Restauration** : `restore()` couvre la réinstallation et le changement de téléphone (même compte Google Play).
6. **Remboursement** : `onRevoked()` (notifications Play en temps réel côté serveur) retire le droit, et la source
   prévient les écrans.
7. **Activation** :
   - passer `MONETIZATION_ENABLED` à `true` ;
   - `canAccessFeature()` devient alors la seule question posée par les écrans avant d'ouvrir une fonction Premium ;
   - les quotas « à fixer » du catalogue doivent être décidés avant.

## Tests

- **Unitaires** : `src/monetization/__tests__/rights.test.tsx`
  - catalogue ;
  - statut Free : tout est accessible, le diamant ouvre la page sans déclencher la carte ;
  - page en Free ;
  - statut Premium injecté : plus de diamant ni d'espace, tout est accessible, « Premium à vie activé ».
- **Navigation** :
  - `nav.test.ts` : Menu à neuf entrées et écran `premium` ;
  - `appGuide.test.ts` : réponse Premium.
- **Parcours** : `tests/e2e/premium.spec.ts`
  - Menu → page, prix, bouton désactivé, aucun appel de paiement, Retour ;
  - diamants sur les écrans, fonctions toujours ouvertes, interrupteur non déclenché par le diamant.

Les résultats des suites complètes sont dans `docs/JOURNAL_CORRECTIONS.md` (entrée v0.40.0).
