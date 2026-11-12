# État du projet (17 octobre 2026)

Version web publiée pour test. L’APK et l’AAB définitifs ne sont pas produits (en attente de validation de la Web App).

## Vérifié automatiquement

- **137 tests unitaires (Vitest)**, 136 exécutés et réussis, 1 ignoré (test sur émulateur Firebase, lancé à part) :
  - animations : chaque technique dans chaque discipline, gardes orthodoxe et gaucher, appuis fixes, pas de téléportation ;
  - caméra pédagogique : cadrage de chaque technique en portrait et paysage, angle stable des combinaisons, décomposition ;
  - réparation des anciennes sauvegardes de combattant (le créateur est retiré en 1.37.0) ;
  - réalité augmentée : démarrage, refus de caméra, fin de session, placement (navigateur simulé) ;
  - bibliothèque de 1 100 combinaisons : validation, recherche, statuts ;
  - coach IA : intentions, exemples du cahier des charges, adaptation au niveau, honnêteté (« je ne te vois pas »), demandes dangereuses ;
  - comptes : migration des données, séparation par utilisateur, chiffrement des limitations, fusion des synchronisations.
- **18 parcours Playwright** (navigateur Chromium, rendu logiciel), 16 réussis et 2 ignorés (émulateur Firebase) :
  - premier lancement, entraînement avec pause, créateur d’enchaînements, programme, réglages ;
  - écran d’entraînement sans défilement : 5 tailles d’écran en portrait et en paysage, texte agrandi à 115 % et 130 %, mode Décomposer ;
  - « Demander au coach » : pause automatique, réponse, ralenti, sans masquer les consignes ;
  - mode invité, profil, export et suppression des données.
- Comptes e-mail et synchronisation testés sur les **émulateurs** Firebase (pas sur un vrai projet).

## Non vérifié à ce jour

- Tout ce qui demande un vrai téléphone Android : fluidité du coach 3D, voix française, réalité augmentée, APK.
- Connexion Google, vérification d’e-mail réelle, synchronisation réelle : aucun projet Firebase configuré.
- Questions vocales hors ligne : pas de moteur de reconnaissance vocale hors ligne intégré (étude dans `COACH_IA.md`).
- IA embarquée (modèle de langage sur l’appareil) : étudiée, non intégrée ; le coach répond aujourd’hui avec la base pédagogique locale.

## Limites connues

- Les 1 100 combinaisons sont toutes « inspirées » du style des champions : aucune n’est encore « vérifiée » sur une vidéo de combat.
- (1.37.0) Un seul rendu, Ultra-réaliste : quatre coachs photo Microsoft Rocketbox. Les coachs générés et le créateur de combattant sont retirés (`backup CS/`).
- Animations par poses clés, pas de capture de mouvement.
- Le bouton retour du système ne déclenche pas la confirmation « modifications non enregistrées » du créateur d’enchaînements.
