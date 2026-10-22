# v0.39.0 — Refonte premium de l'espace Progrès

Demande : Youssef, 2026-10-22, « Refonte premium de l'espace Progrès » (fil principal). Références :
`docs/design/progres/README.md`, `docs/design/progres/Combat_Shadow_Studio_Plaquette_Progres.pdf`,
`docs/design/progres/maquettes-progres-10-ecrans.png` (ajoutés au dépôt dans cette version).

## Ce qui change

| Avant (v0.38) | Après (v0.39) |
|---|---|
| Un seul écran Progrès : sélecteurs, tableau de bord, comparaison, graphiques et onglets empilés | Vue d'ensemble : un grand anneau, trois chiffres, la reprise d'entraînement quand elle existe, puis six tuiles de détail |
| Les détails dans des onglets du même écran | Un écran par détail : Activité, Techniques, Disciplines, Enchaînements ; Objectifs et Historique restent leurs écrans existants |

Captures : `docs/v039/captures/` (après, sombre et clair, téléphone 393 × 851) et `docs/v039/captures/avant/` (v0.38).

### Vue d'ensemble (`/stats`, maquette 1)
- **L'anneau principal** suit l'objectif de la semaine si l'utilisateur en a défini un (jours, sinon minutes : « 1 / 4 jours d'entraînement »).
  Sinon, il montre le parcours de techniques (« 4 / 85 techniques étudiées »). Le total est toujours écrit dans l'anneau, jamais un pourcentage seul.
  Un toucher ouvre Objectifs ou Techniques.
- **Trois chiffres** : temps actif et séances sur la période choisie, et la série en cours (jours consécutifs avec une séance enregistrée).
- **« Reprendre l'entraînement » / « Continuer mon programme »** n'apparaît que si une séance peut réellement être reprise. Ce sont les mêmes règles que dans Entraîner (`pickCard`).
- **Six tuiles** mènent aux détails, chacune avec son chiffre principal.
- Discipline et période (7 j / 30 j / 90 j / 12 mois / Perso) restent en haut. Elles sont mémorisées (`css-progress-view`) et s'appliquent à tous les écrans de Progrès.

### Écrans de détail
- **Activité** (`/stats/activite`) : c'est l'ancien tableau de bord v0.34, gardé tel quel (comparaison à la période précédente, graphique, onglets, détail d'une séance). Aucune fonction n'a disparu.
- **Techniques** (`/stats/techniques?d=`, maquette 4) :
  - anneau « assimilées / total » (le mot de l’application ; la maquette dit « maîtrisées ») de la discipline et légende Assimilées / À revoir / Non évaluées ;
  - anneau du parcours ;
  - panneau de maîtrise existant et lien vers les fiches.
  Les marques n'ont pas de date, donc cet écran ne dépend pas de la période (c'est écrit à l'écran).
- **Disciplines** (`/stats/disciplines`, maquette 5) : les six disciplines, chacune avec un mini-anneau du parcours (n / total écrit), son temps sur la période, et un toucher vers Techniques.
- **Enchaînements** (`/stats/enchainements`, maquette 6) :
  - anneau « utilisés sur la période / créés » ;
  - nombre créé, séances concernées, temps actif ;
  - les plus pratiqués.
  Si aucun enchaînement n'a été créé, l'écran affiche un état vide qui renvoie vers le créateur.
- La barre du bas des détails propose Retour, Période, Vue d'ensemble, Historique et Menu. La barre de la vue d'ensemble propose Retour, Période, Statistiques (vers Activité), Historique et Menu.

### Volontairement absent
- **Maquette 7 « Condition physique »** : non réalisée. L'application ne mesure ni calories, ni fréquence cardiaque, ni intensité, ni forme physique, et le cahier dit « afficher uniquement des mesures réelles ou omettre cet écran ».
- **Pas de conversion des répétitions en « coups »**, et pas d'estimation présentée comme une mesure. Un test vérifie que ces mots n'apparaissent pas dans la vue d'ensemble.
- **Pas d'onglets imbriqués** : chaque détail est un écran.

## L'anneau
Le cahier demande de reprendre l'anneau du chronomètre. L'application n'a pas de chronomètre en anneau : le chrono de l'entraînement est un texte mm:ss dans le bandeau, et le seul anneau existant est la jauge des objectifs (`GoalRing`).

Un composant `src/ui/screens/progress/Ring.tsx` a donc été créé d'après les maquettes :
- trait épais à bouts arrondis, dégradé rouge → orange (or une fois plein), sur une piste sombre ;
- l'arc se remplit à l'apparition, sans mouvement si le système demande moins d'animations ;
- `role="img"` et un `aria-label` qui écrit la valeur et son total.

## Données
Tout vient des séances enregistrées sur l'appareil (`src/store/stats.ts`), via les calculs existants de `src/domain/progress.ts` (périodes, totaux, parcours), qui ne changent pas. Le module `src/ui/screens/progress/data.ts` les regroupe pour les écrans.

La série en cours (`streak`) compte les jours consécutifs avec au moins une séance, en finissant aujourd'hui (ou hier : la journée n'est pas finie). Aucun historique n'est modifié et aucune clé de stockage n'est supprimée.

## Tests
- Unitaires : `src/ui/screens/progress/__tests__/overview.test.ts` (choix de l'anneau, série).
- Navigation : `src/ui/nav/__tests__/nav.test.ts` (barres des nouveaux écrans).
- Parcours : `tests/e2e/progres-v2.spec.ts`, 4 scénarios :
  - figures et changement de période ;
  - anneau d'objectif ;
  - état vide ;
  - barre des détails et absence de défilement horizontal en 360 × 640.
- Tests existants adaptés au nouveau chemin :
  - `progress-dashboard` et `progress-seed` ouvrent `/stats/activite` ;
  - `mastery` passe par la tuile Techniques ;
  - `navigation` vérifie la nouvelle barre.

Les résultats des suites complètes sont dans `docs/JOURNAL_CORRECTIONS.md` (entrée v0.39.0).
