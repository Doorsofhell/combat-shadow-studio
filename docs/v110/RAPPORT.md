# Combat Shadow Studio 1.1.0 · Corrections de la 1.0.0

Branche `feature/refonte-v100`, à la suite de la 1.0.0 (point de restauration `restauration/avant-v110` = `592fe16`).
Demandes de Youssef du 2026-10-27 au soir et du 2026-10-28, chacune montrée d'abord en maquette dynamique « style
Android pur », puis choisie.

## Ce qui change, et la décision qui l'a demandé

| Demande | Choix de Youssef | Ce qui est fait |
| --- | --- | --- |
| Niveau « − barre + » à la place des 4 rectangles | A, puis (00:03) A « trois menus » | Page d'une discipline : niveau, style (kick-boxing) et type d'exercice sur **une seule ligne** de puces Android qui ouvrent un menu ; le but de chaque niveau et les règles de chaque style (avec leur source) sont dans les menus. `MenuChip` (`src/ui/components/MenuChip.tsx`) est une couche d'historique : Retour d'Android ferme le menu d'abord. Le sélecteur « − barre + » reste à l'inscription et dans la bibliothèque. |
| Une seule recherche pour tout l'écran, style Pixel | Loupe A (`AxCyfzDTQjANtMtaFcp1ur`) | « Rechercher » prend la 5e place de la barre ; Profil devient la photo en haut à droite, à côté du ⋮ qui ouvre les options de l'écran dans un menu Android. La recherche cherche d'abord sur l'écran (`useSearchScope` : encyclopédie, techniques, légendes, enchaînements), Entrée filtre la liste de l'écran, et remplace les champs de recherche des écrans (« Rechercher dans équipements », etc.). |
| Coach IA hors de « Plus » | — | Coach IA par « Rechercher » (et Profil › Coach IA). Pendant la séance et le chrono, où la barre est cachée, « Rechercher » est dans « Plus » : rien n'est perdu. |
| Caméra dans Réglages | — | Retiré : il ouvrait la même page qu'« Affichage », où sont les réglages de caméra. |
| Chrono | 3e choix de Séance | Séances / Disciplines / Chrono ; Chrono n'est plus un onglet d'Entraîner. Page du chrono sans défilement ; son bouton « Démarrer » de page est retiré (le gros bouton de la barre le fait). |
| Disciplines sans défilement | — | Les 6 cartes partagent l'écran (grille 2 × 3, emblème 52 px). |
| Grand compte à rebours rouge | Retirer | Retiré ; le temps reste au-dessus du coach. |
| Vitesse dès le départ | — | « ×1 » en haut à droite du coach, choix de ×0,25 à ×1,5 dans une colonne sous le bouton. |
| ADN de la bibliothèque | Retirer « nombre inspiré » et « jouables en 3D » | Retirés. |
| « Que signifient les statuts » | Question de la recherche | Question toute prête de « Rechercher » sur Légendes, fiche légende et combinaison ; bloc retiré de l'écran Légendes. |
| Jours d'entraînement | Grille agenda | 7 jours sur une ligne (L M M J V S D), plusieurs choix, pas de « Aucun ». L'ancien objectif (un nombre) est gardé et dit en clair jusqu'au choix des jours. |

## Défauts trouvés par les tests et corrigés

- La photo du profil et le ⋮ se posaient sur le studio du combattant (contraste et cadrage) : cachés sur les outils plein écran (séance, chrono, studio), qui ont leurs propres boutons en haut à droite.
- La colonne des vitesses s'ouvrait sous l'astuce « touche deux fois le coach » : elle s'ouvre maintenant sous « ×1 », le long du bord droit.
- Échap fermait le menu ⋮ et, en même temps, le panneau ouvert dessous (Premium) : seul le panneau du dessus répond.

## Tests

- TypeScript : RÉUSSI. Vitest : 849 RÉUSSIS, 1 ignoré.
- `tests/e2e/corrections-v110.spec.ts` (nouveau) : RÉUSSI.
- Playwright complet final (246 tests) : 241 RÉUSSIS, 2 ignorés (Firebase), 3 ÉCHOUÉS ; deux sont des mesures du test (51,99998 px pour 52 ; barre remontée un instant), corrigées puis RÉUSSIES à la relance (5/5) ; `training-layout:329` caméra Auto ÉCHOUÉ, déjà en échec avant la 1.0.0.
- Détail des passages dans `docs/JOURNAL_CORRECTIONS.md` (entrée 1.1.0).

## Ce qui n'est pas fait

- Test sur un vrai téléphone Android : NON EXÉCUTÉ.
- Direction « Dark Cyber-Boxing » et pulsation au bip : maquette seulement (`1KtQjVP1N5eDDgCDR3oDLR`), en attente du choix de Youssef.
