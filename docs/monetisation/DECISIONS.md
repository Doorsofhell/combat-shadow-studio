# Monétisation freemium · décisions de Youssef (2026-11-20)

Source : document « Plan de monétisation freemium » (https://claude.ai/artifact/7GXw5hDHfdMzQMaJyQLYFa),
section « Toutes les options, à cocher », cochée par Youssef le 2026-11-20 vers 10 h (Paris).
Rien n'est activé : `MONETIZATION_ENABLED` reste `false` (`src/monetization/rights.ts`). La mise en place commence
après le test de l'APK en situation réelle.

| # | Question | Choix |
| --- | --- | --- |
| 1 | Modèle | Achat unique « Premium à vie » |
| 2 | Prix | 29,99 € TTC (appliqué en 2.3.2, `src/monetization/offer.ts`) |
| 3 | Lancement | 19,99 € pendant 1 mois (appliqué en 2.3.2, indicatif) |
| 4 | Prix d'abonnement | Sans objet |
| 5 | Essai gratuit | Aucun |
| 6 | Disciplines gratuites | Les 6 |
| 7 | Niveaux gratuits | Débutant + intermédiaire |
| 8 | Coachs gratuits | Kadir et Amara ; les autres Premium |
| 9 | Programmes | 1 programme d'initiation gratuit par discipline |
| 10 | Enchaînements personnels | 3 gratuits ; analyse détaillée : non cochée (à confirmer) |
| 11 | Mode Décomposer | Premium strict |
| 12 | Coach vocal | Voix de base gratuite, conseils techniques Premium |
| 13 | Coach IA | Gratuit sans limite |
| 14 | Historique | 30 jours gratuits ; statistiques détaillées : non cochées (à confirmer) |
| 15 | Favoris | 5 gratuits |
| 16 | Légendes | Une sélection gratuite (nombre à fixer) |
| 17 | Chronomètre | Rounds et repos gratuits, réglages avancés Premium |
| 18 | Fiches techniques | Gratuites seulement pour les techniques des niveaux gratuits |
| 19 | Réalité augmentée | Gratuite |
| 20 | Affichage Premium | Diamant et cadenas, contenus visibles |
| 21 | Où vendre | Android via Google Play seulement |
| 22 | Version web | Mêmes limites que la version gratuite Android |
| 23 | Pays | Tous les pays proposés par Google Play |
| 24 | Vérification | Sur le téléphone via Google Play, sans serveur |
| 25 | Hors ligne | Premium reste actif sans limite |
| 26 | Remboursement | Premium retiré à la connexion suivante, données gardées |
| 27 | Partage | Tous les profils locaux du téléphone |
| 28 | Testeurs | Testeurs de licence Google Play (liste d'adresses Gmail dans la Play Console) |
| 29 | Premiers testeurs | Premium offert à vie par code promo |
| 30 | Page Premium avant l'achat réel | Masquée dans la première version Play Store |
| 31 | Statut vendeur | Compte personnel déclaré « commerçant » |
| 32 | Calendrier | Après le test de l'APK en situation réelle |

## 2.8.2 · le petit diamant sur chaque élément Premium (Youssef, 2026-11-24)

Règles appliquées, dans `src/monetization/premiumItems.ts` (rien n'est verrouillé) :

- exercices : niveaux avancé et expert ;
- programmes : tous sauf un programme débutant gratuit par discipline (`boxe-initiation-4-semaines`,
  `kick-fondamentaux-debutant`, `mma-fondamentaux-debutant`, `muay-fondamentaux`, `judo-deplacements-debutant`,
  `bjj-bases-debutant`) : 43 programmes sur 49 portent le diamant, dont les 3 programmes multi-disciplines ;
- fiches techniques : une technique est Premium quand le premier niveau où un exercice la pratique (toutes disciplines
  confondues) est avancé ou expert ; 16 techniques sur 91 : pivot extérieur, direct au corps, crochet droit,
  uppercut gauche, roll de l'autre côté, front kick arrière, low kick gauche, middle kick gauche, high kick gauche,
  roundhouse jambe avant, genou circulaire avant, coude remontant avant, genou circulaire dans le clinch, feinte
  d'épaule, uchikomi d'o-uchi-gari, uchikomi de ko-uchi-gari ; les 6 techniques qu'aucun exercice n'utilise restent
  gratuites ;
- coachs : Naël, Inaya, Victor et Kanya ;
- boutons et options : Décomposer (barre de l'entraînement et des combinaisons, bouton des Légendes), options du
  chronomètre Préparation, Alerte avant la fin et Intensité du cardio.

Non marqués élément par élément (choix encore ouverts) : la sélection gratuite de légendes (nombre à fixer), les
enchaînements, favoris et historique au-delà des quotas (3, 5, 30 jours) ; leur diamant reste sur le titre de l'écran.

## 2.9.0 · Shadow Pro (Youssef, 2026-11-25)

Le diamant et le coin doré de la 2.8.2 sont remplacés par l'identité **SHADOW PRO** : micro-badge « PRO » après le
titre de chaque contenu Premium (même pour un membre), petit cadenas doré seulement quand l'accès est réellement
fermé (jamais en production tant que le paiement n'est pas branché), « x/y PRO » pour un programme mixte, bouclier
doré « PRO » dans le profil d'un membre, aucune marque « FREE ». La répartition gratuit / Premium ci-dessus ne change
pas ; avec elle, aucun programme du catalogue n'est mixte. Abonnement expiré = achat remboursé (Premium à vie n'expire
pas). Utilisateur non connecté = profil invité, traité comme gratuit.
