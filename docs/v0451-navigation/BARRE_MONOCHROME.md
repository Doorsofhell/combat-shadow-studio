# v0.45.1 · Barre du bas monochrome · rapport

Demande de Youssef (2026-10-23 16:05, « Correctif mineur de navigation ») : plus aucun fond derrière les boutons, une hiérarchie en gris, jour et nuit, sans rouge ni rose pour l'état actif.

## Ce qui change (composant commun `src/ui/nav/nav.css`, aucune page modifiée)

| Place | Avant (v0.44) | Après (v0.45.1) |
|---|---|---|
| Fond de la barre | couleur de surface du thème | inchangé |
| Retour, Menu, liens vers les grandes rubriques | gris neutre `--muted` | inchangé : `--nav-neutral` = `--muted` |
| Action de l'écran au repos | rouge adouci sur fond rosé | gris graphite, sans fond : `--nav-ctx` = 62 % `--c-text` + 38 % `--muted` |
| Action active | rouge plus soutenu sur fond rosé plus marqué | couleur du texte (anthracite le jour, quasi blanc la nuit), libellé en graisse 750, sans fond |
| Rubrique active (lien) | rouge sur fond gris | même règle que l'action active |
| Transition | fond et couleur, 0,18 s | couleur de l'icône et du libellé, 0,18 s |

Couleurs obtenues (Retour et Menu lus sur la barre par le test ; graphite calculé par le mélange `color-mix` en sRGB) :

- **jour** : Retour et Menu `rgb(90, 95, 105)` ; actions graphite ≈ `rgb(45, 47, 52)` ; action active `#111214` ;
- **nuit** : Retour et Menu `rgb(156, 163, 175)` ; actions gris clair ≈ `rgb(211, 213, 218)` ; action active `#f4f4f5`.

Inchangés : les cinq places, icônes, libellés, ordre, tailles et zones tactiles, actions, panneaux, gestion du thème. Le rouge signature reste partout ailleurs (boutons principaux, phases de combat, contour de focus clavier, point rouge des Nouveautés sur Menu).

## Tests

| Test | Résultat |
|---|---|
| `nav-contextuelle.spec` réécrit pour la nouvelle règle : aucun fond par place, couleurs grises (rouge jamais au-dessus du vert et du bleu), actions plus contrastées que Retour et Menu, active plus contrastée et plus grasse, contraste ≥ 4,5:1, axe ; clair et sombre | 2 RÉUSSIS |
| `contrast.spec`, `navigation.spec`, `premium-panels.spec`, `theme.spec` | 41 RÉUSSIS |
| Vitest `src/ui/nav` et `src/domain` | 207 RÉUSSIS |
| Android réel | NON EXÉCUTÉ |

Le test v0.44 qui exigeait une teinte rouge différente du gris neutre est remplacé par la règle inverse demandée (aucun fond, aucun rouge) ; les exigences de contraste et d'accessibilité restent les mêmes.

## Captures

`captures/` : fiche technique au repos et avec Ralenti actif, Progrès, Accueil (clair et sombre, `nav-contextuelle.spec` avec `CAPTURES`), et `planche-ecrans.png` : Premium (Avantages ouvert), Entraîner, Techniques, Progrès en clair puis en sombre (`scripts/dev/shot-bars.mjs`). Avant : `docs/v044-navigation/captures/`.
