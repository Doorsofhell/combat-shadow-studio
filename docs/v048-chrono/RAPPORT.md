# v0.48.0 · Chrono de combat

Demande (Youssef, 2026-10-23 20:43) : « Je voudrais accéder au chronomètre depuis la barre bas de page à la place de l'icône technique. […] Je veux un chronomètre paramétrable. » Puis : « Montre-moi des propositions de maquette dynamique afin que je valide une des options avant développement ». Trois maquettes cliquables ont été proposées (A Cadran, B Plein écran, C Frise). Youssef a choisi **B · Plein écran** le 2026-10-27.

Branche `feature/chrono-seul-v048`, partie de `feature/combat-shadow-v030` (b4499fd, v0.47.0).

## 1. Constat de départ

- Le chronomètre de la v0.47 n'existait que dans l'écran d'entraînement, avec le coach 3D. Aucun écran de chrono seul.
- La barre du bas affichait « Techniques » en 4e place sur Accueil, Entraîner, Programmes et les écrans de premier niveau.
- Le « cahier des charges du chronomètre » et les images d'entraînement évoqués par Youssef n'ont pas été retrouvés dans le projet (messages, fichiers, mémoire). Le travail suit sa demande du 2026-10-23 et la maquette B.

## 2. Ce qui change

- **Barre du bas** (`src/ui/nav/config.ts`, `icons.ts`) : « Chrono » (icône chronomètre) remplace « Techniques » partout où Techniques était une place principale. Les actions « Techniques » propres à un écran (discipline, fiche de légende, partenaire) restent. Techniques reste dans le Menu.
- **Écran Chrono** (`src/ui/chrono/`, route `/chrono`) :
  - Réglages : trois tuiles Round, Repos, Rounds avec − et + (10 s sous une minute, 30 s au-dessus ; boutons grisés aux bornes 10 s–10 min, 0–5 min, 1–20 rounds).
  - Formats prêts (`src/domain/chrono.ts`) : boxe 3 × 3:00 repos 1:00, kick-boxing 3 × 2:00 repos 1:00, MMA 3 × 5:00 repos 1:00, muay-thaï 5 × 3:00 repos 2:00, JJB 1 × 6:00, judo 1 × 4:00, intervalles 8 × 0:20 récupération 0:10. Ce sont des durées habituelles à adapter, pas des règlements officiels.
  - Toute modification devient « Réglage perso ». Les réglages sont gardés dans `settings.chrono` (valeurs abîmées ramenées au défaut, rien d'effacé).
  - Durée totale affichée avant de démarrer. « Réglages » ouvre les options de chrono de la v0.47 (préparation, alerte, gongs, voix), partagées avec l'entraînement.
  - Séance plein écran : tout l'écran prend la couleur de la phase, toujours avec le mot (ambre « Prépare-toi », rouge « Combat », bleu-vert « Repos », gris « Pause »). Temps géant, round en cours, points de progression, alerte avant la fin.
  - Toucher l'écran n'importe où met en pause ou reprend. En pause : « Arrêter » ou « Passer la phase ». Retour met d'abord en pause, un second Retour arrête.
  - Pendant le repos, le texte annonce le round suivant (« Ensuite : Round 2 / 3 »).
  - Bilan de fin : rounds faits sur prévus, temps de combat, repos, durée totale, « Recommencer » ou « Modifier les réglages ».
- **Moteur de temps** (`src/domain/session/timeline.ts`) : même moteur que la v0.47, aucun second minuteur. Nouvelle méthode `skip()` : passe la phase en cours sans compter le temps sauté, et un round passé n'est pas compté comme fait.
- **Historique** : la séance va dans les statistiques existantes (`exerciseId` `chrono-<format>`, temps actif = temps de combat), « terminée » ou « interrompue », enregistrée une seule fois. Elle compte dans le temps d'entraînement, pas dans les techniques.
- **Écran éteint ou autre application** : la séance se met en pause ; l'écran reste allumé pendant la séance.
- **Coach IA** : nouvelle réponse « Le chrono de combat » sur l'écran Chrono et depuis l'accueil.

## 3. Choix faits sans demande explicite

- Retour en séance met en pause au lieu de quitter, pour ne pas perdre une séance sur un geste involontaire.
- La préparation et l'alerte reprennent les réglages de la v0.47 (une seule source de réglages).
- Pas de nouvelle entrée « Chrono » dans le Menu : il est déjà dans la barre.

## 4. Fichiers

`src/domain/chrono.ts`, `src/domain/session/timeline.ts` (+ tests), `src/ui/chrono/{ChronoScreen.tsx,chrono.css}`, `src/ui/App.tsx`, `src/ui/nav/{config.ts,icons.ts}` (+ tests), `src/store/settings.ts`, `src/coach/{appGuide.ts,questionBank.ts}` (+ tests), `src/ui/icons/__tests__/icons.test.tsx`, `tests/e2e/{chrono-seul,navigation}.spec.ts`, `scripts/dev/shot-chrono-seul.mjs`, `src/domain/releases.ts`, `package.json`.

## 5. Tests

| Test | Résultat |
| --- | --- |
| TypeScript (`tsc --noEmit`) | RÉUSSI |
| Vitest complet | 806 RÉUSSIS, 1 ignoré, 0 ÉCHOUÉ |
| dont moteur de temps `skip()` (2 nouveaux), barre « Chrono » (nav.test), Coach IA « chrono », icônes | RÉUSSIS |
| `tests/e2e/chrono-seul.spec.ts` (5 tests : barre, réglages et bornes, couleurs des phases + pause + passer, fin sans repos final + historique « terminée », arrêt + « interrompue ») | 5 RÉUSSIS, deux passages de suite |
| `tests/e2e/navigation.spec.ts` (barre de l'accueil et du Chrono, Nouveautés 0.48.0) | 26 RÉUSSIS |
| Playwright complet | 213 RÉUSSIS, 2 ignorés (Firebase), 2 ÉCHOUÉS déjà en échec sur les v0.46.0 et v0.47.0 : `coach-suggest:96`, `training-layout:325` |
| Téléphone Android réel | NON EXÉCUTÉ |

Tests modifiés (sans les affaiblir) : l'accueil attend « Chrono » au lieu de « Techniques » (`nav.test.ts`, `icons.test.tsx`, `navigation.spec.ts`), avec la décision de Youssef en commentaire ; les autres vérifications de ces tests sont inchangées, et un test vérifie que Techniques reste dans le Menu.

## 6. Captures

`docs/v048-chrono/captures/` et les planches `planche-clair.png`, `planche-sombre.png` (360 × 640) : barre de l'accueil, réglages, préparation, combat, pause, repos, bilan.

## 7. Limites

- Aucun test sur un vrai téléphone Android : NON EXÉCUTÉ.
- Les sons sont ceux de la v0.47 (gongs synthétisés), pas des enregistrements.
