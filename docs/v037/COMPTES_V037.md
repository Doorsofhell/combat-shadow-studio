# v0.37.0 · Comptes, photo de profil et sauvegarde en ligne (0 €)

Demandes de Youssef du 22 octobre 2026 : « Comptes utilisateurs » (18:59), « Correctif authentification gratuite à 0 € » (19:13), qui remplace les points contraires, et « Configuration Firebase terminée » (20:01).

## État des lieux avant

Le système de comptes était déjà codé depuis la v0.4, mais inactif faute de projet Firebase :

- invité ;
- e-mail et mot de passe ;
- Google sur le web ;
- liaison des méthodes ;
- suppression ;
- synchronisation Firestore hors ligne d'abord, avec fusion par élément ;
- règles ;
- export.

Il manquait :

- la configuration du projet ;
- la photo de profil ;
- la modification de l'adresse e-mail et du mot de passe ;
- un indicateur de robustesse du mot de passe ;
- des états de synchronisation conformes à la demande ;
- la préparation Premium dans les règles.

Détail dans `docs/COMPTES.md`.

## Vérifications sur le vrai projet Firebase (22/10, depuis l'environnement de travail)

- E-mail et mot de passe : **activé**. Un compte de test `css-verif-…@example.com` a été créé, puis supprimé aussitôt par l'API.
- Google : **activé** (l'API renvoie l'URL de connexion Google du projet).
- Domaines autorisés : `localhost`, `combat-shadow-studio.firebaseapp.com`, `combat-shadow-studio.web.app`, `doorsofhell.github.io`.
- Firestore : la lecture est **refusée** (règles actuelles `if false`). La sauvegarde en ligne ne marchera qu'après publication de `firestore.rules` dans la console. Avant cela, l'application affiche « Erreur de synchronisation : le serveur a refusé l'accès » et garde tout sur l'appareil.

## Ce qui change

- **Page de test GitHub Pages** : la configuration web publique (pas un secret) est passée au build par `preview.yml`. Les tests automatiques et la version Claude restent en mode invité.
- **Connexion** : e-mail, mot de passe, Se connecter, Mot de passe oublié, Continuer avec Google, Créer un compte, Continuer sans compte. Aucun bouton Facebook, Instagram, Apple ou SMS. Le mot de passe affiche un indicateur de robustesse.
- **Profil** :
  - photo (appareil photo, galerie, zoom et position, aperçu, suppression) ;
  - photo Google au choix ;
  - modifier l'adresse e-mail : un lien est envoyé à la nouvelle adresse, et l'adresse change seulement à l'ouverture du lien ;
  - modifier le mot de passe, avec confirmation du mot de passe actuel.
- **Photo personnelle** :
  - recadrée en carré de 320 px, ré-encodée (WebP ou JPEG), donc sans métadonnées ni localisation ;
  - rangée dans l'espace de l'utilisateur sur l'appareil (`css-photo`) ;
  - **non synchronisée** : Cloud Storage demande le forfait payant, et une image dans Firestore est exclue. Elle n'apparaît donc pas sur un autre appareil. La photo choisie par l'utilisateur garde toujours la priorité sur celle de Google.
- **Synchronisation** :
  - états affichés : Synchronisé (avec la date), Synchronisation en cours, En attente de connexion, Erreur de synchronisation, avec « Réessayer » ;
  - en cas de refus d'accès ou de quota gratuit atteint, l'erreur le dit en clair.
- **Règles Firestore** :
  - seulement les six collections connues ;
  - le nom du document doit correspondre à son contenu ;
  - Premium (`users/{uid}/entitlements/*`) peut être lu par l'application, jamais écrit par elle.
- `firebase.json` permet de lancer les émulateurs pour les tests.

## Tests

- **Émulateurs Firebase** (Auth + Firestore avec `firestore.rules`) : `firebase.emulator.test.ts` RÉUSSI. Il couvre :
  - inscription, e-mail de vérification, refus avant vérification ;
  - synchronisation après vérification, refus vers un autre utilisateur, un document mal formé ou une collection inconnue ;
  - écriture Premium refusée ;
  - changement de mot de passe, demande de changement d'adresse (l'adresse ne change pas avant le lien) ;
  - mauvais mot de passe, réinitialisation neutre ;
  - dernière méthode non retirable, suppression des données et du compte.
- **Vitest** : changement de mot de passe et d'adresse dans la session, cadrage de la photo, robustesse du mot de passe, messages d'erreur de synchronisation.
- **Playwright** : `profile-photo.spec.ts` (ajout, refus d'un fichier non image, cadrage, conservation après rechargement, suppression ; en mode invité, aucun bouton inactif).
- **Connexion Google réelle et e-mails réels** : NON EXÉCUTÉ par moi (il faut une vraie boîte mail et un vrai compte Google). C'est à tester sur la page publique.
- **Android réel** : NON EXÉCUTÉ. Google reste masqué dans l'application Android (module natif à ajouter, plan dans `docs/COMPTES.md`).

## Captures

Dans `captures/` : connexion, inscription (avec l'indicateur), profil et feuille photo, en thème sombre et clair (393 × 851, version avec Firebase activé).
