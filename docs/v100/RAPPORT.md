# Combat Shadow Studio 1.0.0 · Refonte ergonomique

Branche `feature/refonte-v100`, partie de la v0.49.0 (`feature/combat-shadow-v030`). Plan validé par Youssef le
2026-10-27 (« Aucune perte de contenu. Réorganisation, logique et intelligente », « n'oublie pas le mode jour/nuit »),
puis maquette v4 validée. Cinq lots, chacun publié en aperçu privé avant la version finale.

## Ce qui change

| Lot | Contenu | Commits |
| --- | --- | --- |
| 1 | Barre fixe à 5 places (Accueil, Entraîner, Apprendre, Progrès, Profil), gros bouton d'action à la couleur de la discipline principale, Retour en haut, « Plus » pour les commandes de l'écran, thème Nuit par défaut pour une nouvelle installation, Menu redistribué | `2b041d5`, `9d8379b`, `8ea4dd0` |
| 2 | Onglets en haut des espaces : Entraîner (Séance, Programmes, Enchaînements, Favoris, Chrono), Apprendre (Techniques, Légendes, Encyclopédie), Progrès (Tableau, Historique, Objectifs), Profil (Mes infos, Mon coach, Coach IA, Réglages) ; écran Favoris ; doublons retirés | `dcd7a8b` |
| 3 | Accueil « Reprendre » avec 3 raccourcis et l'objectif de la semaine ; « Rechercher ou demander au coach » ; lumière Vive par défaut (choix enregistrés gardés) | `c5011a4`, `291ab29` |
| 4 | Séance mains libres (Retour et Pause seulement, toucher = pause, outils à la pause), vibrations, glisser entre onglets ; mots entiers dans le gros bouton, « Pause » lisible | `e2e694b`, `ee39adb` |
| 5 | Test « aucune perte » sur les 28 lignes du plan, notes de version 1.0.0, numéro 1.0.0 | `2769072` |

## Aucune perte : le tableau du plan, vérifié

Le test `tests/e2e/aucune-perte-v100.spec.ts` parcourt l'application **au doigt depuis la barre du bas** (jamais en
tapant une adresse) et vérifie que chaque ligne du tableau « Où va chaque contenu » est à sa nouvelle place et montre
son contenu.

| Aujourd'hui (v0.47–0.49) | Nouvelle place vérifiée |
| --- | --- |
| Accueil : Reprendre | Accueil, carte « Reprendre » et gros bouton |
| Séance rapide, Technique du jour, Programme recommandé | Accueil, tuiles et ligne « Programme » |
| Objectif de la semaine | Accueil, lien vers Progrès › Objectifs |
| Ta progression | Progrès › Tableau (séances, temps cumulé) |
| Pour toi aujourd'hui | Accueil, sous les raccourcis |
| Favoris, Combinaisons favorites | Entraîner › Favoris |
| Légendes, Programmes (accueil) | Apprendre › Légendes, Entraîner › Programmes |
| Démarrage rapide | Entraîner › Séance |
| Fiche discipline (modes, exercices, niveau) | Entraîner › Séance › Disciplines |
| Programmes et fiche programme | Entraîner › Programmes |
| Mes enchaînements (liste, éditeur) | Entraîner › Enchaînements |
| Chrono seul | Entraîner › Chrono, tuile de l'Accueil |
| Séance (Démarrer, Pause, Décomposer, Caméra, Ralenti) | Séance : Pause dans la barre, le reste à la pause (Ralenti dans « Plus ») |
| Techniques (recherche, filtres, à revoir, maîtrise) | Apprendre › Techniques |
| Fiche technique, fiche partenaire | Apprendre › Techniques › fiche |
| Légendes, fiche champion, fiche combo | Apprendre › Légendes |
| Encyclopédie (accueil, liste, terme, A–Z, favoris) | Apprendre › Encyclopédie |
| Progrès (activité, techniques, disciplines, enchaînements) | Progrès › Tableau et ses détails |
| Historique, Objectifs | Progrès › Historique, Objectifs |
| Profil (photo, IMC), Connexion | Profil › Mes infos (Connexion : comme en v0.49, le lien n'apparaît que si les comptes en ligne sont activés ; sinon « Mode invité ») |
| Choix du coach | Profil › Mon coach |
| Coach IA (bulle et historique) | « Rechercher ou demander au coach » et Profil › Coach IA |
| Réglages (voix, rounds, affichage 3D, données) | Profil › Réglages, mêmes sections |
| Confidentialité | Profil › Mes infos, « Politique de confidentialité » |
| Premium à vie (avantages, FAQ, restaurer) | Profil › Réglages › Premium |
| Nouveautés | Profil › Réglages › Nouveautés, point rouge sur Profil |
| Bienvenue | Inchangé, une seule fois |

Atelier du combattant (`/combattant`) : il n'avait déjà plus de lien dans la v0.49 (éditeur physique retiré par la
mission « 36 coachs champions ») ; la refonte n'y touche pas.

## Écarts avec la maquette, choisis et dits

- La 5ᵉ place s'appelle **Profil** comme dans la maquette v4 (le plan écrivait « Moi »).
- **Glisser le doigt** : il change d'onglet partout où il y a des onglets, et de technique sur une fiche (existant).
  Sur Entraîner et Progrès, la maquette prévoyait aussi de changer de discipline ou de période en glissant : le même
  geste change déjà d'onglet sur ces écrans, je n'ai pas superposé deux sens au même geste.
- Pendant la séance, Retour et Pause restent visibles (sécurité, accès au clavier) ; tout le reste revient à la
  pause.

## Données des utilisateurs

Aucune clé IndexedDB ou Zustand supprimée ni renommée. Choix conservés : thème, lumière du coach, espace d'entraînement
enregistré, favoris, maîtrise, historique, objectifs. Nouveaux réglages remplis par défaut à la lecture (`merge`).

## Tests

Voir la fin de `docs/JOURNAL_CORRECTIONS.md` (entrée « 1.0.0 (lot 5 sur 5) ») pour les chiffres de la suite complète.
Android réel : NON EXÉCUTÉ.
