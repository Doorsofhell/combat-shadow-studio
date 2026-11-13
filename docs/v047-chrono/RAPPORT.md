# v0.47.0 · Chronomètre intégré au coach 3D

Demande : « Chronomètre intégré au coach 3D » (Youssef, 2026-10-23, 18 sections). Branche `feature/chrono-v047`, partie de `feature/combat-shadow-v030` (cda7d46, v0.46.0).

## 1. Audit de départ (§15)

| Élément | Avant (v0.46.0) | Problème |
| --- | --- | --- |
| Temps de séance | `useSession` décomptait avec un `setInterval` de 100 ms et un objet `ActiveTimer` par phase | un minuteur en retard (téléphone lent, onglet ralenti) perdait du temps ; la préparation, le travail et le repos avaient chacun leur logique |
| Préparation | grand décompte 3-2-1 au-dessus du coach, réglé à 3 s | pas réglable, pas de couleur propre |
| Rounds | travail, repos, puis repos après le dernier round | un repos inutile avant « Terminé » ; pas d'alerte avant la fin, pas de gong de fin distinct |
| Cardio | même chose que Rounds avec des valeurs fixes | pas de choix effort, récupération, cycles ni intensité |
| Libre, Technique | aucun temps affiché | l'utilisateur ne voyait pas depuis combien de temps il travaillait |
| Exercice en Rounds ou Cardio | enchaînait sur les 11 autres exercices du niveau | le dernier round de l'exercice était suivi d'un repos puis d'un autre exercice |
| Historique | une ligne par exercice avec le temps actif | pas de statut terminé ou interrompu, pas de rounds faits sur prévus |

## 2. Architecture

- **`src/domain/session/timeline.ts`** (nouveau) : le moteur temporel unique, classe `SessionTimeline`.
  - Une horloge monotone (`performance.now`, injectable pour les tests). Le temps n'est jamais compté en retirant une seconde à chaque tic : il est relu sur l'horloge, donc un tic en retard rattrape chaque transition à son heure exacte.
  - Phases : `pret` → `decompte` (préparation) → `travail` ⇄ `repos` → `termine`.
  - Chaque transition produit un événement, une seule fois : `prep-start`, `prep-count` (3, 2, 1), `work-start`, `warning`, `work-end`, `rest-start`, `rest-count` (3, 2, 1), `done`.
  - Pause exacte : le temps de pause n'est compté nulle part.
  - Aucun repos après le dernier round. Hors programme, la séance s'arrête après les rounds ou cycles de l'exercice choisi ; un programme passe à l'exercice suivant après un repos.
  - Il ne touche jamais aux articulations du coach (§9).
- **`src/ui/training/useSession.ts`** : réécrit sur ce moteur. Il transforme les événements en sons, voix, séquences du coach et statistiques. Le coach reçoit sa séquence au début du travail et s'arrête au repos ; il n'est jamais déplacé d'un coup.
- **`src/ui/training/plan.ts`** et **`src/domain/catalog/plan.ts`** : options Cardio (`CardioOptions`), `cardioCadence` (l'intensité change les pauses entre les mouvements, jamais la vitesse de lecture des mouvements ; cadence plus large pour le sol, les projections, les chutes et la lutte, donc pour le BJJ et le judo) et `cardioTiming`.
- **`src/ui/training/TimerOptions.tsx`** (nouveau) : choix Cardio (effort 20/30/40/60 s, récupération 10/20/30/60 s, cycles 5/8/10/12, intensité Modérée/Soutenue/Intense) et options du chrono (préparation 3/5/10/15 s, alerte 10 s/30 s/aucune, gongs, annonces vocales). Les choix sont gardés dans les réglages et passés dans l'adresse de la séance.
- **`src/ui/screens/Training.tsx`** et **`training.css`** : bandeau du haut « Prépare-toi », « Combat · Round 2/5 », « Effort · Cycle 3/8 », « Récupération », « Repos », « Pause », « Terminé » ; temps restant pendant une phase minutée, temps écoulé en Libre et Technique ; barre de progression de la phase en cours ; bilan de fin.
- **`src/store/stats.ts`** : `annotate()` complète la ligne de séance déjà enregistrée (statut `terminee` ou `interrompue`, travail, repos, total, rounds faits et prévus, intensité). Aucune ligne n'est créée en double.

## 3. Couleurs et accessibilité (§11)

| Phase | Couleur | Texte toujours affiché |
| --- | --- | --- |
| Préparation | ambre (`--phase-prep`) | « Prépare-toi » |
| Travail | rouge de l'app | « Combat · Round n/N », « Effort · Cycle n/N », nom du mode |
| Repos | bleu-vert (`--phase-rest`) | « Repos », « Récupération » |
| Pause | neutre | « Pause » |

La couleur n'est jamais seule : le libellé dit toujours la phase.

## 4. Sons et voix (§12)

- Préparation : « Prépare-toi », puis bip et voix sur 3, 2, 1.
- Début du travail : un gong et « En garde », « Round n » ou « Cycle n ».
- Alerte avant la fin : « Dix secondes » ou « Trente secondes » si la voix est active, sinon un bip aigu. Seulement si le round dure au moins deux fois l'alerte.
- Fin d'un round : trois gongs (si les gongs sont actifs).
- Repos : bips sur les 3 dernières secondes.
- Pas de doublon : la consigne de mouvement du coach se tait pendant 1,5 s après une annonce du chrono.

## 5. Ce qui est conservé

- L'écran Rounds et ses options (durée, repos, nombre de rounds) : inchangés.
- La barre Retour | Pause | Décomposer | Caméra | Menu : inchangée.
- Décomposer : fonctionne comme avant ; il met la séance en pause pendant l'étude.
- La reprise d'une séance (« Reprendre ») : même instant, en pause ; le temps de repos est maintenant gardé aussi (`restSec`).
- Les programmes : toujours enchaînés, avec le repos entre exercices.
- Les préférences existantes : les nouveaux réglages ont des valeurs par défaut et rien n'est effacé.
- Les corrections de stabilité WebGL : non touchées.

## 6. Tests

| Suite | Résultat |
| --- | --- |
| TypeScript (`tsc -b`) | RÉUSSI |
| `timeline.test.ts` (11 tests, horloge simulée : préparation, Rounds sans repos final, alerte, repos 3-2-1, pause exacte, tic en retard, Libre, programme, hors programme, changement d'exercice, reprise) | RÉUSSI |
| Vitest complet | 803 RÉUSSIS, 1 ignoré, 0 ÉCHOUÉ |
| `chrono.spec.ts` (6 tests e2e : préparation ambre et décompte unique, Rounds + bilan + historique « terminée », Cardio depuis la fiche + bilan, pause figée, sortie anticipée « interrompue » sans double comptage, Libre et Technique en temps écoulé) | 6 RÉUSSIS |
| Playwright complet (version compilée, 211 tests) | 205 RÉUSSIS, 2 ignorés (Firebase), 4 ÉCHOUÉS au premier passage. Relancés seuls : `coach-suggest:242` et `coaching-hud:60` RÉUSSIS ; `coach-suggest:96` et `training-layout:325` ÉCHOUÉS, déjà en échec sur la v0.46.0 (voir `docs/v046-encyclopedie/RAPPORT.md` §6). |
| Android réel | NON EXÉCUTÉ |

## 6 bis. Captures

`docs/v047-chrono/captures/` : préparation, round, repos, bilan, options Cardio et options du chrono, en clair et en sombre, sur un écran de 360 × 640 (`planche-clair.png`, `planche-sombre.png`). Script : `scripts/dev/shot-chrono.mjs`.

## 7. Limites connues

- Pendant le repos, le coach reste en garde au repos ; il n'a pas d'animation de récupération propre.
- Quand l'écran est masqué (autre application, écran éteint), la séance se met en pause. Les annonces en arrière-plan ne sont donc pas jouées, ce qui évite un chrono qui tourne sans l'utilisateur.
- Changement de comportement : un exercice lancé seul en Rounds ou Cardio s'arrête après ses propres rounds ou cycles, au lieu d'enchaîner sur les autres exercices du niveau. « Exercice suivant » reste disponible. Les programmes enchaînent toujours.
- Les valeurs Cardio sont des exemples, pas une prescription ; l'écran le dit.
- Aucun test sur un téléphone Android réel.
