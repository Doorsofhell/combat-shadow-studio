# v0.41.0 : programmes enrichis

Demande : Youssef, 2026-10-22, « Enrichissement des programmes » (fil principal). Publication en autonomie pour la soirée (20:39).

## Ce qui change

| Avant (v0.40) | Après (v0.41) |
|---|---|
| 10 programmes, une seule séance répétée | 49 programmes : les 10 existants (identifiants inchangés) et 39 nouveaux, chacun sur 4 semaines avec une séance propre à chaque semaine |
| Durées tapées à la main (« 20 minutes ») | Durées calculées à partir des blocs, des rounds, des repos et des transitions (`programSessionSeconds`) |
| Bouton « Filtres » dans le contenu, filtres cachés sous le bouton | « Filtrer » dans la barre inférieure, à la place de « Programmes » quand l'espace Programmes est ouvert, et sur `/programmes`. Le panneau propose la discipline, le niveau, la durée, l'objectif et le matériel, affiche « Voir les résultats (n) » et permet de réinitialiser |
| Filtres perdus en quittant l'écran | Filtres gardés pendant la navigation, jusqu'à la fermeture de l'application |
| Fiche courte (blocs, fréquence, objectifs) | Fiche complète : présentation, niveau, objectifs, durée, prérequis, matériel, échauffement et retour au calme, planning semaine par semaine, exercices utilisés, sécurité, origine et sources, progression |
| Pas de suivi | Séances faites et restantes, semaine en cours, prochaine séance lancée directement (carte « Continuer mon programme » comprise) |

Captures : `docs/v041/captures/` (après) et `docs/v041/captures/avant/`.

## Règles respectées

- **Huit programmes au plus par discipline, jamais inventés pour atteindre le quota.** Boxe anglaise, kick-boxing, MMA et muay-thaï en ont 8. Judo et jiu-jitsu brésilien en ont 7 : le travail solo vérifié (déplacements, chutes basses, entrées sans projection, mouvements au sol) ne permet pas un huitième programme qui ne répète pas les autres. La raison est écrite dans `CATALOGUE_GAPS` (`src/domain/programCatalog.ts`), et un test exige cette raison pour toute discipline sous 8.
- **Officiel, adapté ou original.** England Boxing, WAKO, IJF Academy et IBJJF ont été consultés le 2026-10-22. Leurs pages présentent la formation des entraîneurs, les règlements et les grades, mais aucune ne publie de programme d'entraînement. Il n'y a donc ni programme officiel ni programme adapté : les 49 sont des programmes originaux, et chaque fiche le dit. Ce qui a été réellement lu est noté source par source (`src/domain/programSources.ts`, `MATRICE_SOURCES.md`). Une page dont seul le titre ou l'annonce a été lu est décrite comme telle.
- **Rien d'exécuté qui demande un partenaire.** Les programmes n'utilisent que les exercices solo animés de l'application. Les techniques à deux restent consultables, mais aucun programme ne les fait exécuter : voir `NON_EXECUTABLES.md`.
- **Aucune donnée perdue.** Les 10 programmes existants gardent leur identifiant et leur séance. Le suivi utilise le compteur déjà enregistré (`programs` dans le magasin de reprise). Trois noms contenaient une durée devenue fausse une fois calculée : « Cardio combat - 20 minutes » (19 min), « Coordination - 15 minutes » (14 min) et « Technique avancée - 30 minutes » (24 min). Ils s'appellent maintenant « Cardio combat express », « Coordination express » et « Technique avancée multi-disciplines ». Leurs identifiants ne changent pas.

## Construction des nouveaux programmes

Chaque programme est une recette (`PROGRAM_RECIPES`) : discipline, niveau, objectif, échauffement, retour au calme, exercices principaux, enchaînements et finisseur. `buildSessions` en tire 4 semaines :

- la semaine 1 installe les bases ;
- les semaines 2 et 3 ajoutent un deuxième enchaînement, un finisseur, des rounds en plus et des repos plus courts ;
- la semaine 4 consolide le tout.

Les exercices principaux tournent de semaine en semaine, et un test vérifie que les séances ne sont pas quatre copies de la même. La charge suit le niveau (`LEVEL_LOAD`). Les prérequis, le matériel et les consignes de sécurité viennent de la discipline et du niveau (`disciplineDefaults`, `levelPrerequisites`).

## Fichiers

- `src/domain/programCatalog.ts` (nouveau) : recettes, construction des séances, lacunes du catalogue.
- `src/domain/programSources.ts` (nouveau) : sources des fédérations et accès aux sources biomécaniques.
- `src/domain/programs.ts` : calcul des durées, séances, progression (`programProgress`), lien de lancement (`programQuery`).
- `src/domain/programMeta.ts` : objectifs Défense, Déplacements et Enchaînements, filtre matériel.
- `src/domain/types.ts` : champs optionnels du programme (niveau, description, semaines, séances, origine, sources…).
- `src/ui/screens/Train.tsx` : espace Programmes (filtres dans la barre, progression sur les tuiles), carte de reprise.
- `src/ui/screens/Programs.tsx` : catalogue et fiche complète.
- `src/ui/training/plan.ts`, `useSession.ts`, `Training.tsx` : la séance de la semaine demandée (`?prog=…&s=N`), avec le même décompte et les mêmes transitions que le calcul des durées.
- `src/ui/nav/config.ts` : « Filtrer » dans la barre de `/programmes`.

## Tests

- `src/domain/__tests__/programs-v041.test.ts` (7 tests) : identifiants uniques et stables, 8 au plus par discipline (avec raison sous 8), chaque bloc renvoie à un exercice existant, durées calculées, fiches complètes et origine, filtre matériel et niveaux, progression, séance de la semaine lancée.
- `src/domain/__tests__/programMeta.test.ts` : les 10 programmes existants sont toujours là, en tête et avec le même identifiant ; filtres combinés.
- `src/domain/__tests__/programs-inventory.test.ts` : les trois documents de `docs/v041/` correspondent aux données.
- `tests/e2e/train-resume.spec.ts` : filtres dans la barre (panneau, nombre de résultats, réinitialisation, filtres gardés en naviguant) et fiche complète jusqu'au lancement de la semaine 1.

Résultats complets : voir le journal (`docs/JOURNAL_CORRECTIONS.md`, entrée v0.41.0).
