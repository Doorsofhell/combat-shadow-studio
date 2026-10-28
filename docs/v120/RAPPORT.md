# Version 1.2.0 : Profil et Réglages en listes groupées

Demande de Youssef (28/10/2026) : « lorsqu'on clique sur la tête en haut à droite, 2 onglets glissants : Mes infos & Réglages, avec tout le reste dans Réglages : une page avec toutes les options en liste bien présentées qui se déploient quand on clique dessus », puis « pareil dans Mes infos : une seule liste dont chaque option se déploie au toucher ». Proposition choisie : **B « Groupes Android »** (maquette https://claude.ai/artifact/GFjk4xkB2eZVxKk6sK4dS3).

Contraintes rappelées : aucune perte de contenu, mode jour et mode nuit, Retour Android cohérent.

Point de restauration : `restauration/avant-v120` (dd1f952). Branche : `feature/profil-v120`.

## Ce qui change

- La photo en haut à droite ouvre **deux onglets** : Mes infos et Réglages (avant : Mes infos, Mon coach, Coach IA, Réglages).
- **Mes infos** et **Réglages** sont chacun une seule liste rangée en groupes à petit titre rouge, dans des blocs arrondis, comme les réglages d'un Pixel. Chaque ligne montre son icône, son nom et sa valeur actuelle ; un toucher l'ouvre sur place.
- Une seule ligne ouverte à la fois. La ligne ouverte est une étape de l'historique : **Retour la referme d'abord**, puis quitte la page.
- Les anciennes adresses (`/reglages/voix`, `/reglages/rounds`, `/reglages/affichage`, `/reglages/donnees`) ouvrent la liste sur la bonne ligne. Mes infos accepte `?ouvert=<ligne>`.
- Composant : `src/ui/components/SettingsList.tsx` (`SettingsList`, `SetGroup`, `SetItem`, `SetAction`, `SetLink`) ; styles `.set-*` dans `src/ui/styles.css`.

## Où va chaque contenu

| Avant | Maintenant |
|---|---|
| Mes infos › carte photo et nom | Mes infos, en haut (inchangé) |
| Mes infos › pseudo, prénom, nom, avatar, photo | Mes infos › Moi › Identité |
| Mes infos › date de naissance, âge, taille, poids, IMC | Mes infos › Moi › Âge, taille, poids |
| Mes infos › disciplines, niveaux, discipline principale, années | Mes infos › Ma pratique › Disciplines et niveaux |
| Mes infos › garde | Mes infos › Ma pratique › Garde |
| Mes infos › séances, durée, difficulté | Mes infos › Ma pratique › Rythme |
| Mes infos › objectifs | Mes infos › Ma pratique › Objectifs |
| Mes infos › limitations | Mes infos › Ma pratique › Limitations physiques |
| Mes infos › favoris | Mes infos › Mon parcours › Favoris |
| Mes infos › temps actif, séances | Mes infos › Mon parcours › Mon activité |
| Mes infos › compte, connexion, déconnexion | Mes infos › Mon parcours › Compte (avec un lien vers Mes données) |
| Mes infos › taille du texte, réduire les animations | Réglages › Affichage › Apparence |
| Mes infos › « M'appeler par mon pseudo » | Réglages › Coach et entraînement › Coach IA |
| Mes infos › langue | Réglages › Affichage › Apparence |
| Mes infos › synchronisation, export, suppression, confidentialité | Réglages › Données › Données et confidentialité |
| Onglet Mon coach (Kadir, Amara) | Réglages › Coach et entraînement › Mon coach (avec le rendu des combattants) |
| Onglet Coach IA (réglages) | Réglages › Coach et entraînement › Coach IA ; l'historique garde sa page `/coach-ia` |
| Réglages › tuiles Premium et Nouveautés | Réglages › Abonnement et nouveautés (lignes) |
| Réglages › Ton profil (résumé) | Retiré : tout son contenu est dans Mes infos |
| Réglages › Apparence (thème, rendu) | Thème : Réglages › Apparence ; rendu : Réglages › Mon coach |
| Réglages › Voix et sons | Réglages › Voix et sons |
| Réglages › Rounds par défaut | Réglages › Rounds par défaut |
| Réglages › Affichage 3D (avec journal 3D) | Réglages › Affichage 3D |
| Réglages › Questionnaire et niveaux | Réglages › Questionnaire et niveaux |
| Réglages › Données (exporter, importer, tout effacer) | Réglages › Données et confidentialité |
| Réglages › numéro de version, crédits | Réglages › À propos |

Les pages `/coach` (choix du coach au premier lancement) et `/coach-ia` (historique) restent. La barre du bas de Profil garde « Coach », qui ouvre maintenant Réglages › Mon coach.

## Captures

`docs/v120/captures/` : Mes infos et Réglages, lignes fermées et ouvertes, en mode nuit (`*-dark.png`) et en mode jour (`*-light.png`), 393 × 851.

## Défauts trouvés en vérifiant et corrigés

- Les lignes débordaient à droite de l'écran (le résumé sur une ligne élargissait la grille) : colonne `minmax(0, 1fr)`.
- Le résumé de l'identité disait « Youssef · Mon coach » : il dit maintenant « avatar : mon coach ».
- La pastille de Nouveautés n'avait plus son repère de test `news-dot` : rétabli.

## Tests

- TypeScript : RÉUSSI.
- Vitest : 849 RÉUSSIS, 1 ignoré (dont `refonte.test` mis à jour : 2 onglets dans Profil, « Coach » au-dessus de la barre ouvre Réglages › Mon coach).
- Nouveau `tests/e2e/profil-v120.spec.ts` (deux onglets seulement ; chaque ligne de Mes infos et de Réglages s'ouvre et montre son contenu, une seule à la fois ; Retour referme la ligne puis quitte ; anciennes adresses ; jour et nuit) : 6/6 RÉUSSIS (deux passages).
- 15 fichiers de tests de bout en bout adaptés aux lignes qui s'ouvrent (ouvrir la ligne avant de toucher son contenu), sans retirer aucune vérification ; `contrast.spec` vérifie en plus 4 lignes ouvertes.
- `accueil-recherche:154` : le contraste était lu pendant que la feuille de recherche montait encore (1 passage sur 2) ; le test attend maintenant la fin de l'animation avant de lire les couleurs.
- Playwright complet (254 tests, 37,5 min) : 250 RÉUSSIS, 2 ignorés (Firebase), 2 ÉCHOUÉS :
  - `training-layout:329` caméra Auto : ÉCHOUÉ, déjà en échec avant la 1.0.0 ;
  - `coach-suggest:98` questions suggérées (défilement au doigt) : ÉCHOUÉ, et ÉCHOUÉ aussi 2 fois sur 2 sur la 1.1.1 (dd1f952) : ce n'est pas causé par la 1.2.0, à traiter à part.
- Android réel : NON EXÉCUTÉ.
