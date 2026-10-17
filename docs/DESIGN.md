# Design system — DARK COMBAT PREMIUM

Menus sombres et sobres, combattants 3D au premier plan, écran d’entraînement blanc (studio).

## Tokens (`src/ui/styles.css`, `:root`)

| Rôle | Variable | Valeur | Usage |
| --- | --- | --- | --- |
| Fond | `--c-bg` / `--bg` | `#101116` | fond de toutes les pages (sauf entraînement) |
| Surface | `--c-surface` / `--soft` | `#20232C` | cartes, panneaux, onglets |
| Accent | `--c-accent` / `--red` | `#E5484D` | action principale, sélection, attention — rien d’autre |
| Texte | `--c-text` / `--ink` | `#F5F5F5` | texte principal |
| Texte secondaire | `--c-text-2` / `--muted` | `#A6A8B3` | légendes, aides |
| Or | `--c-gold` / `--gold` | `#C8A96B` | distinctions, maîtrise (objectif atteint), légendes, favoris |
| Blanc studio | `--c-studio` | `#FFFFFF` | écran d’entraînement uniquement |

Les composants partagés n’utilisent que les alias courts (`--bg`, `--ink`, `--muted`, `--line`, `--soft`, `--red`…).
L’écran d’entraînement (`src/ui/training/training.css`) redéfinit ces alias en clair dans `.training, .light-scope` :
les mêmes boutons et puces y deviennent clairs sans code en plus.

Contrastes (WCAG) : texte `#F5F5F5` sur fond 17:1, texte secondaire 8:1, rouge sur fond 5:1, or sur fond 8,5:1.
Le libellé blanc des boutons principaux (3,9:1) est en grand texte gras (Rajdhani 700, ≥ 18 px, majuscules).
La sélection n’est jamais indiquée par la couleur seule : coche (puces, choix, options), soulignement (onglets),
pastille (navigation), points de rang (niveaux).

## Typographie (intégrée, hors ligne)

- Rajdhani 500/600/700 (`@fontsource/rajdhani`, sous-ensemble latin) : titres, noms de disciplines, grands chiffres
  (`--font-display`, repli `Barlow Condensed`, `Arial Narrow`, `Roboto Condensed`, sans-serif).
- Inter variable (`@fontsource-variable/inter`) : texte (`--font-text`, repli `system-ui`, Roboto, Segoe UI…).

## Forme, espace, mouvement

Rayons 10 / 14 / 20 px ; espacements 4-8-12-16-24-32 ; cibles tactiles ≥ 48 px (les puces de 40 px ont une zone
tactile étendue à 48 px). Transitions courtes (140–220 ms) : apparition d’écran en fondu (opacité seule), feuille qui
monte, changement de sélection. Tout est coupé avec `prefers-reduced-motion`. Pas de bordures ni d’ombres décoratives.

## Composants (`src/ui/components/`)

| Composant | Fichier |
| --- | --- |
| `Button`, `LinkButton`, `IconButton` (primaire, secondaire, ghost, danger) | `Button.tsx` |
| `DisciplineCard`, `TechniqueCard`, `ChampionCard`, `EntryCard`, `EmptyState`, `SectionHead` | `Cards.tsx` |
| `Chip`, `FilterChips`, `Segmented` | `Chips.tsx` |
| `LevelSelector` | `LevelSelector.tsx` |
| `OptionGrid` (sélecteur générique : équipement, coupe, couleurs) | `OptionGrid.tsx` |
| `PageHead` | `PageHead.tsx` |
| `PlaybackControls`, `CameraControls` | `Playback.tsx` |
| `ProgressBar`, `GoalRing`, `BarChart`, `HBarList`, `StatTile` | `Progress.tsx` |
| `Panel`, `PanelRow`, `LinkRow`, `Toggle`, `SliderRow` | `SettingsPanel.tsx` |
| `Sheet` (feuille ou modale, portail, Échap, piège du focus), `ConfirmDialog` | `Sheet.tsx` |
| `Tabs` (pilule ou soulignés, flèches clavier) | `Tabs.tsx` |
| `TimerDisplay`, `clock` | `Timer.tsx` |
| `toast`, `Toaster` (message discret, région live polie) | `Toast.tsx` |

Les écrans importent depuis `src/ui/components` ; ils n’ajoutent pas de couleurs en dur.

## Navigation

Barre basse à 5 destinations (Accueil `/`, Entraîner `/entrainer`, Techniques `/techniques`, Coach `/combattant`,
Progrès `/stats`), icône + libellé, pastille rouge translucide sur l’onglet actif. Masquée sur `/entrainement` et
`/bienvenue`. Réglages depuis l’icône engrenage de l’accueil. Marges `env(safe-area-inset-*)` sur l’en-tête et la barre.

## Images

`public/disciplines/*.jpg` : rendus de nos propres coachs 3D (vue Lab, fond transparent) composés sur un fond sombre.
Aucune photo de banque d’images ni illustration tierce. Sur les écrans où le combattant est affiché en direct, c’est
le modèle 3D qui est montré (chargé à la demande, hors du paquet principal).
