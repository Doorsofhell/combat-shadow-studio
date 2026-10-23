# v0.44 · Barre du bas : actions de l'écran reconnaissables

Demande de Youssef du 2026-10-23, « AMÉLIORATION DE LA BARRE DE NAVIGATION CONTEXTUELLE ». C'est une amélioration graphique légère, pas une refonte : la barre garde ses cinq places, leur ordre, leurs tailles, leurs actions et leurs animations.

## Ce qui change

- Les actions propres à l'écran (par exemple S'entraîner, Ralenti et Maîtrise sur une fiche) gardent en permanence une légère teinte du rouge de l'app. Cette teinte s'applique à l'icône, au libellé et à un fond très pâle.
- L'action sélectionnée (Ralenti activé, Pause, Filtrer avec des filtres, etc.) prend la même teinte, plus soutenue.
- Retour, Menu et les liens vers les grandes rubriques (Entraîner, Techniques, Progrès, Profil…) restent neutres.
- Changer d'écran met à jour les teintes ; aucune sélection de l'écran précédent ne reste affichée. La couleur passe en douceur, en 0,18 s, avec la transition qui existait déjà.

## Règle (centralisée)

`src/ui/nav/config.ts` → `slotRole(slot)`. Le rôle dépend de l'action, jamais du libellé :

| Action | Rôle | Exemple |
|---|---|---|
| `back`, `menu` | global (neutre) | Retour, Menu |
| `nav:` vers une grande rubrique (`GLOBAL_PLACES`) | global (neutre) | Entraîner, Techniques, Progrès sur l'Accueil |
| `nav:` vers une page propre à l'écran | contextuel (teinté) | Créer (éditeur du créateur), Affichage et Caméra (sections des réglages) |
| action fournie par l'écran | contextuel (teinté) | Rechercher, Filtres, Décomposer, Période |

Un écran qui n'a pas trois actions propres n'est pas coloré artificiellement. Par exemple, sur Programmes, seul « Filtrer » est teinté ; sur l'Accueil, rien ne l'est. Un emplacement peut forcer son rôle avec `role` (non utilisé pour l'instant).

`BottomBar.tsx` ajoute la classe `ctx` et `data-role` à chaque bouton. L'état « actif » reste celui qui existait déjà (`pressed` donné par l'écran, classe `active`).

## Couleurs (tokens du thème, clair et sombre)

Les couleurs sont tirées des variables existantes, sans code couleur imposé (`src/ui/nav/nav.css`) :

| Variable | Valeur | Rôle |
|---|---|---|
| `--nav-ctx` | `color-mix(--red-ink 68 %, --muted)` | icône et libellé d'une action au repos (rouge adouci) |
| `--nav-ctx-bg` | `color-mix(--red 7 %, transparent)` | fond pâle d'une action au repos |
| `--nav-ctx-active` | `color-mix(--red-ink 86 %, --c-text)` | icône et libellé d'une action sélectionnée |
| `--nav-ctx-active-bg` | `color-mix(--red 12 %, transparent)` | fond d'une action sélectionnée |

Il n'y a ni dégradé, ni ombre, ni contour, ni changement de taille. Pour les navigateurs sans `color-mix`, une couleur de repli est déclarée : `#a5404f`.

## Tests

| Test | Résultat |
|---|---|
| `src/ui/nav/__tests__/nav.test.ts` : rôles par écran (Retour et Menu toujours neutres, actions des écrans contextuelles, Accueil et pages sans actions jamais teintées) | RÉUSSI (56/56 dans le dossier) |
| `tests/e2e/nav-contextuelle.spec.ts`, menus clair et sombre : couleurs lues sur la vraie barre au repos, avec une action active et au changement d'écran ; contraste ≥ 4,5:1 sur chaque place ; axe WCAG 2 AA ; largeurs identiques | RÉUSSI (2/2) |
| Vitest complet | 770 RÉUSSIS, 1 ÉCHOUÉ connu (photo-coach Amara), 1 ignoré |
| Playwright complet (compilé) | 180 RÉUSSIS, 2 ignorés, 3 échecs connus d'avant (coach-suggest:96, training-layout:325, coaching-hud:60 instable) + contrast.spec sombre, corrigé côté mesure puis 3/3 RÉUSSIS |
| Android réel | NON EXÉCUTÉ |

## Captures

`captures/avant/` (v0.42) et `captures/apres/`, au format 360 × 740. La planche `captures/comparatif.png` montre une fiche au repos, la même avec Ralenti actif, le passage à Progrès et l'Accueil, en clair puis en sombre.
