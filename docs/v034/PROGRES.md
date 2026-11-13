# v0.34 — Refonte de l'écran Progrès, Athletic Intelligence

Demande de Youssef du 2026-10-22 (option C « Athletic Intelligence »). Branche `feature/progres-athletic-v034`,
partie de `feature/combat-shadow-v030` au commit 9953f4f (v0.33.0 publiée). Point de restauration :
`restauration/avant-progres-v034`.

## Phase 0 — Entraîner finalisé

Avant de commencer Progrès, Entraîner était terminé, testé, validé et publié :

- refonte d'Entraîner et emblèmes : PR #8 fusionnée dans `feature/combat-shadow-v030` après le « Je valide » de Youssef ;
- v0.33.0 publiée sur GitHub Pages (titre vérifié) et dans l'application principale (version 39) ;
- suite complète passée : les seuls échecs restants existaient déjà avant ce lot (voir `docs/JOURNAL_CORRECTIONS.md`).

## Ce qui change

Seuls l'organisation et le rendu changent. Aucun fichier de calcul n'a été modifié :

- `src/domain/progress.ts` ;
- `src/store/stats.ts` ;
- `src/store/progressView.ts`.

L'écran est découpé en six zones, sans défilement vertical :

| Zone | Contenu |
| --- | --- |
| 1 · En-tête | « Progrès » et le bouton Filtres (niveau, catégorie) |
| 2 · Filtres | Disciplines (Toutes + les six, avec leurs icônes officielles) puis les périodes : 7 jours, 30 jours, 90 jours, 12 mois, Perso |
| 3 · Synthèse | Parcours en grand (%, techniques étudiées / total, nouvelles sur la période, ouvre le détail du parcours), puis une rangée de quatre chiffres : temps actif, séances, répétitions, exercices, chacun avec son évolution |
| 4 · Comparaison | Période actuelle (rouge profond) et précédente (ardoise) avec leurs dates. Ces deux lignes servent aussi de légende au graphique. Elles sont suivies des jours actifs et de la pause max., puis du bouton « Comparer » qui ouvre le tableau complet. |
| 5 · Vue | Le graphique d'activité ou la liste de la vue choisie |
| 6 · Vues | Activité, Niveaux, Catégories, Exercices, Historique, Maîtrise : les onglets sont sous la vue, près du pouce |

Progrès passe juste après Entraîner à deux endroits :

- dans le Menu (Navigation générale) ;
- dans la barre de l'accueil, qui devient Entraîner, Progrès, Techniques, Profil, Menu.

Les autres barres ne changent pas. Celle de Progrès reste Retour, Période, Statistiques, Historique, Menu.

## Correspondance avant / après

| Fonction (avant) | Où elle est maintenant |
| --- | --- |
| Filtres niveau et catégorie (bouton d'en-tête) | inchangé, zone 1 |
| Onglets disciplines | zone 2, plus compacts (icônes officielles 20 px) |
| Périodes, dont Perso et sa feuille de dates | zone 2, inchangées |
| Dates actuelle « vs » précédente, « en cours », filtres actifs | zone 4, sur deux lignes nommées (mêmes dates) |
| Jauge Parcours, ouvre la feuille Parcours | zone 3, grand pourcentage, même feuille |
| Techniques étudiées / total, nouvelles | zone 3 |
| Temps actif, Séances, Répétitions avec évolution | zone 3 |
| Exercices, Jours actifs, Pause max. (avant : en bas de l'onglet Activité seulement) | Exercices en zone 3, les deux autres en zone 4. Ils sont maintenant visibles sur toutes les vues. |
| Lien « Détails » vers le tableau de comparaison | bouton « Comparer », zone 4, même tableau (6 mesures) |
| Graphique colonnes actuelle / précédente, valeur au toucher, tableau pour lecteurs d'écran | zone 5, mêmes séries et mêmes calculs. Couleurs : rouge profond et ardoise au lieu de rouge et bleu. |
| Onglets Activité / Niveaux / Catégories / Exercices / Historique / Maîtrise | zone 6, sous la vue |
| « Voir tout » / plein écran des listes, détail d'une séance | inchangés |
| Barre du bas : Période, Statistiques, Historique ; Menu « Sur cet écran » : Nouvelle séance, Objectifs, Historique complet | inchangés |

Rien n'a été supprimé. Les identifiants de test sont les mêmes. Le chiffre « Exercices » a un nouvel identifiant,
`kpi-exercises` ; `mini-exercises` est conservé sur la même case.

## Non-régression des valeurs

Le même jeu de données est utilisé avant et après la refonte : 90 séances sur 400 jours, six disciplines, trois niveaux. Il est lu
pour trois disciplines (Toutes, Boxe, Judo) et pour chacune des quatre périodes, soit 12 cas.

Pour chaque cas, on relève :

- les dates des périodes ;
- le temps actif, les séances et les répétitions, avec leurs évolutions ;
- les exercices, les jours actifs et la pause max. ;
- le libellé du parcours ;
- le tableau de comparaison complet.

Résultat : 0 écart sur les chiffres. Les relevés sont dans `docs/v034/valeurs-avant.json` et `valeurs-apres.json`. Seul le texte qui entoure les dates change : « 23/09 – 22/10 en cours vs
24/08 – 22/09 » devient deux lignes, « Actuelle 23/09 – 22/10 en cours » et « Précédente 24/08 – 22/09 ». Les dates
sont les mêmes.

## Palette

L'écran garde les tokens de l'application : fond, surfaces, textes et séparateurs. Il ne crée pas de second système
de couleurs. Seules les deux couleurs de série prennent les références du brief :

| Série | Jour | Nuit |
| --- | --- | --- |
| Actuelle (`--c-cur`) | `#B72E42` | `#DB5265` |
| Précédente (`--c-prev`) | `#A7ADB2` | `#777E88` |

Elles remplacent le rouge vif et le bleu. Le gris ardoise est peu contrasté en mode jour (2,2:1 sur blanc).
L'identité de chaque série reste donc portée aussi par du texte :

- les lignes nommées de la zone 4 ;
- la valeur au toucher ;
- le tableau pour lecteurs d'écran.

## Limites

- Sur 360 × 640, le graphique garde environ 100 px de haut. C'est le prix des chiffres ajoutés aux zones 3 et 4,
  qui étaient avant cachés dans l'onglet Activité.
- Rendu Android réel : NON EXÉCUTÉ. Le rendu a été vérifié dans Chromium, sur 360 × 640, 360 × 740, 393 × 851 et 412 × 915.
- Maquettes : il n'y a pas de maquette séparée. Les captures jour et nuit du prototype intégré servent de maquette
  (`docs/v034/captures/`).

## Tests

- Vitest : 645 réussis, 2 échoués :
  - Amara, angle de hanche : déjà en échec avant ce lot ;
  - ordre de la navigation dans `icons.test` : attendait l'ancien ordre, mis à jour pour Progrès après Entraîner, relancé : TEST RÉUSSI.
- Playwright, suite complète : 156 réussis, 3 échoués, 2 non exécutés (Firebase). Les trois échecs ne touchent pas Progrès :
  - `coach-render` (cadrage du studio) : relancé seul, TEST RÉUSSI ;
  - `coach-suggest`, questions suggérées : expire au toucher, échec intermittent déjà connu avant ce lot ;
  - `training-layout`, caméra Auto après pivot : déjà en échec avant ce lot.
- Tests Progrès, illustrations et navigation, relancés après les dernières corrections : 53 sur 53 réussis.
- Le test « sans défilement » (6 tailles, jour et nuit, 5 vues) a d'abord trouvé un débordement horizontal :
  « Nouvelle activité » ne passait pas à la ligne dans les colonnes étroites. C'est corrigé ; le test n'a pas été modifié.
