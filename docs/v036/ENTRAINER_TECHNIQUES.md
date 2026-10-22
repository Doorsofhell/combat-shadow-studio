# v0.36.0 · Entraîner et Techniques : rôles clarifiés

Demande : Youssef, 2026-10-22 18:47 (« Entraîner / Techniques »). Entraîner sert à pratiquer et à personnaliser son entraînement. Techniques sert à apprendre et à explorer.

## Avant

- **Entraîner, Séances** : Reprendre ou « Commence ton premier entraînement » en haut, puis Démarrage rapide, puis Mes enchaînements avec un lien « Créateur » et un grand bouton « Créer un enchaînement » en bas.
- **Techniques** : cinq sections (Techniques, Combinaisons, Créateur, Favoris, Programmes). Les Légendes n'y figuraient plus depuis la v0.27.

## Après

- **Entraîner, Séances**, dans l'ordre :
  1. la carte « Reprendre », seulement quand une séance peut être reprise ;
  2. la carte premium « Crée tes propres enchaînements », avec le texte demandé et un seul bouton « Créer un enchaînement », qui ouvre le Créateur existant (`/createur`) ;
  3. Mes enchaînements : la liste, avec un lien « Gérer » vers le Créateur. Sans enchaînement, l'état vide est compact (une ligne, pas de second bouton).
  4. Démarrage rapide : « Commence ton premier entraînement » (ou la suggestion d'après l'historique), puis les deux exercices conseillés.
- **Techniques** : quatre sections, Techniques, Combinaisons, Légendes et Favoris. La section Légendes ouvre l'écran Légendes : toutes les légendes, celles de la discipline choisie, ou les combinaisons favorites.
- **Anciens liens** :
  - `/techniques?tab=createur` mène à `/createur`, en gardant la discipline (`?d=`) ;
  - `/techniques?tab=programmes` mène à `/programmes`.
- Le Créateur lui-même, sa page et ses données sont inchangés. Son bouton Retour (sans historique) mène maintenant à Entraîner.
- Le Coach IA décrit la nouvelle organisation (écrans Entraîner et Techniques, et l'endroit où trouver le Créateur).
- Sur un écran étroit, la rangée de sections fait apparaître la section choisie (avant, Favoris restait caché à droite).
- La barre du bas, les routes, les données (`css-custom`) et les programmes sont inchangés. Aucun blocage premium, aucun mot « combat ».

## Captures

- `captures/seances-avant-apres.jpg` : Séances avant et après, sombre avec enchaînements et clair sans enchaînement (393 × 851).
- `captures/techniques-avant-apres.jpg` : Techniques à 360 × 640, et les anciens liens Créateur et Programmes avant et après.
- `captures/legendes-360.png` : la section Légendes à 360 × 640.
- Toutes les captures brutes (2 tailles × 2 thèmes, avec et sans enchaînement) : `/mnt/project-files/combat-shadow-studio/captures/v036/raw/`.

## Tests

- **Nouveau** : `tests/e2e/entrainer-techniques.spec.ts` (3 tests).
  - La carte du Créateur passe avant Mes enchaînements, puis vient Démarrage rapide.
  - L'état vide n'a pas de second bouton, et aucune page n'affiche « Créer un combat ».
  - Le bouton ouvre `/createur`.
  - Un enchaînement enregistré se lance, et « Gérer » ouvre le Créateur.
  - Techniques a quatre sections, et les anciens liens sont redirigés (la discipline est gardée).
  - La section Légendes mène aux favoris.
- **Adaptés à la nouvelle demande** (la règle v0.27 « pas de Légendes dans Techniques » est remplacée) :
  - `tests/e2e/coach-bubble.spec.ts` : la section Légendes ;
  - `src/coach/__tests__/appGuide.test.ts` : les quatre sections, et l'aide d'Entraîner parle de créer ses enchaînements ;
  - `tests/e2e/navigation.spec.ts` : la version 0.36.0.

## Résultats

- **Vitest** : 662 réussis, 1 échec déjà présent avant (photo-coach : l’amplitude de hanche d’Amara).
- **Playwright** (suite complète) : 165 réussis, 2 non exécutés (Firebase), 2 échoués déjà connus :
  - `coach-suggest:96` : intermittent ;
  - `training-layout:325` : caméra Auto, déjà en échec avant.
- **Android réel** : NON EXÉCUTÉ.
