---
name: Combat Shadow Studio
description: Entraînement solo de shadow boxing guidé par un coach 3D, menus sombres premium et studio blanc pour la séance.
colors:
  accent-red: "#e11d2f"
  accent-red-ink: "#ff6b77"
  gold: "#d4af37"
  bg: "#0b0f14"
  surface: "#1f2937"
  surface-2: "#283445"
  sheet: "#141b25"
  text: "#f4f4f5"
  text-2: "#9ca3af"
  ink-2: "#d1d5db"
  studio: "#ffffff"
  ok: "#4cc38a"
  warn: "#f0b45a"
  info: "#4f8ff7"
  light-bg: "#f4f5f7"
  light-surface: "#ffffff"
  light-text: "#111214"
  light-text-2: "#5a5f69"
  light-accent-red-ink: "#c41f35"
  light-gold: "#7d5f22"
typography:
  display:
    fontFamily: "Rajdhani, 'Barlow Condensed', 'Arial Narrow', 'Roboto Condensed', system-ui, sans-serif"
    fontWeight: 700
  title:
    fontFamily: "Rajdhani, 'Barlow Condensed', 'Arial Narrow', 'Roboto Condensed', system-ui, sans-serif"
    fontWeight: 600
  body:
    fontFamily: "'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontWeight: 400
  label:
    fontFamily: "'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontWeight: 600
rounded:
  s: "10px"
  md: "14px"
  l: "20px"
  button: "12px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  tap: "48px"
  gutter: "16px"
components:
  button-primary:
    backgroundColor: "{colors.accent-red}"
    textColor: "{colors.text}"
    rounded: "{rounded.button}"
    height: "48px"
    padding: "0 18px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.button}"
    height: "48px"
    padding: "0 18px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
  sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.text}"
    rounded: "{rounded.l}"
---

# Design System: Combat Shadow Studio

> Fichier de référence lu par Impeccable (`/impeccable`) et par tout assistant avant une intervention UI/UX.
> Les valeurs ci-dessus sont relevées dans le code au 27 novembre 2026 (version 2.11.1) :
> `src/ui/styles.css` (`:root` et `:root[data-theme='light']`), `src/ui/training/training.css`.
> **Le code reste la source de vérité** : si une valeur change dans le CSS, mettre ce fichier à jour dans le même lot.
> Détail historique et tableau des composants : `docs/DESIGN.md`.
> Les phrases marquées **[À CONFIRMER]** sont des formulations proposées, pas encore validées par Youssef.

## Overview

**Étoile polaire [À CONFIRMER] : « Le vestiaire de nuit ».** Des menus sombres, sobres et premium, comme un club de
combat le soir, où le combattant 3D est toujours la pièce maîtresse ; puis, pour la séance, un studio blanc et
lumineux où l'on ne voit que le coach et le mouvement en cours.

- Deux mondes : **menus sombres** (thème sombre par défaut, thème clair disponible ou automatique) et
  **écran d'entraînement blanc** (studio), qui redéfinit les alias en clair dans `.training, .light-scope`.
- Rendu visé : jeu de combat premium (volumes, lumière, expressions soignés), sans copier aucun jeu existant.
- Images : rendus de nos propres coachs 3D, jamais de photo de banque d'images ni d'illustration tierce.

## Colors

### Primary

- **Rouge combat** `#e11d2f` (`--c-accent`, alias `--red`) : action principale, sélection active, marque. Rien d'autre.
  Texte blanc dessus 4,8:1. En texte, utiliser **Rouge encre** `#ff6b77` (`--c-accent-ink`, `--red-ink`), 5,4:1 sur surface.

### Secondary

- **Or distinction** `#d4af37` (`--c-gold`) : maîtrise atteinte, légendes, favoris, premium uniquement.
  En thème clair, `#7d5f22`.

### Neutral

- Fond `#0b0f14` (`--c-bg`), surface `#1f2937` (`--c-surface`), surface 2 `#283445`, feuille `#141b25`.
- Texte `#f4f4f5`, texte secondaire `#9ca3af` (5,8:1 sur surface), gris clair `#d1d5db`.
- Lignes `rgba(255,255,255,.09)` et `.18`. Verre des feuilles d'options `rgba(20,25,33,.8)`.
- Thème clair : fond `#f4f5f7`, surface `#ffffff`, texte `#111214`, secondaire `#5a5f69`.
- États : succès `#4cc38a`, alerte `#f0b45a`, info `#4f8ff7` (variantes plus foncées en clair).
- Studio d'entraînement : `#ffffff`.

### Named Rules

- **Une seule couleur d'action.** Le rouge sert à agir et à montrer la sélection ; l'or ne sert qu'à récompenser.
- **Jamais la couleur seule.** La sélection est aussi marquée par une coche, un soulignement, une pastille ou des points.
- **Pas de couleur en dur dans les écrans** : uniquement les variables (`--bg`, `--ink`, `--muted`, `--line`, `--soft`, `--red`…).

## Typography

- **Rajdhani** 500/600/700 (`--font-display`, paquet npm Fontsource « rajdhani », intégré hors ligne) : titres, noms de
  disciplines, grands chiffres du chrono, libellés des boutons principaux (gras, majuscules, ≥ 18 px).
- **Inter variable** (`--font-text`, paquet npm Fontsource « inter » variable) : tout le texte courant.

### Hierarchy

- Display / grands chiffres : Rajdhani 700.
- Titres de page et de carte : Rajdhani 600.
- Corps : Inter 400, phrases courtes, ton pédagogique pour débutants, en français.
- Libellés, puces, onglets : Inter 600.

### Named Rules

- Le choix d'Inter est **assumé** (lisibilité, poids variable hors ligne). Le détecteur Impeccable le signale comme
  police « trop répandue » : avertissement connu, à ne changer que sur décision de Youssef.

## Layout

- Mobile d'abord (téléphone posé à 1,5–3 m pendant la séance), puis tablette et ordinateur.
- Marge latérale `--gutter` 16 px, marges `env(safe-area-inset-*)`, barre basse `--nav-h` 80 px.
- Espacements 4-8-12-16-24-32 (`--space-1` à `--space-6`).
- Écrans sans défilement quand c'est possible ; pendant la séance, le coach occupe l'essentiel de l'écran.
- Navigation : une barre basse contextuelle à 5 places (`src/ui/nav/config.ts`), souvent Retour … Menu, masquée
  pendant la séance et le questionnaire de bienvenue.

## Elevation & Depth

Plutôt plat et tonal : surfaces superposées (`--raised`, `--tile` en dégradé léger, verre `--glass-*` pour les
feuilles d'options). Une seule ombre nommée pour la pilule d'actions (`--pill-shadow: 0 8px 24px rgba(0,0,0,.5)`).
Pas de bordures ni d'ombres décoratives.

## Shapes

Rayons 10 / 14 / 20 px (`--radius-s`, `--radius`, `--radius-l`), boutons 12 px. Cibles tactiles ≥ 48 px (`--tap`) ;
les puces de 40 px ont une zone tactile étendue à 48 px.

## Components

Composants partagés dans `src/ui/components/` (index `index.ts`) ; les écrans importent de là.

### Buttons

`Button`, `LinkButton`, `IconButton` (primaire, secondaire, ghost, danger), hauteur mini 48 px, rayon 12 px,
retour au toucher par léger changement de fond et d'échelle (140 ms).

### Chips

`Chip`, `FilterChips`, `Segmented`, `MenuChip`, `QueryChip` ; sélection = coche + couleur.

### Cards / Containers

`DisciplineCard`, `TechniqueCard`, `ChampionCard`, `EntryCard`, `EmptyState`, `SectionHead` (`Cards.tsx`),
`Panel`, `PanelRow`, `LinkRow`, `Toggle`, `SliderRow` (`SettingsPanel.tsx`), `Sheet` + `ConfirmDialog`
(feuille ou modale, piège du focus, Échap).

### Navigation

`src/ui/nav/` : `BottomBar`, `NavSheets`, `NavPanel`, `SearchSheet`, `SectionTabs`.

Onglets à l'intérieur d'un écran (2.13.0, Compte : Moi / Ma pratique / Mon compte) : `Tabs variant="section"`, mêmes
pastilles que `SectionTabs` (rayon 999 px, onglet ouvert en encre pleine), largeur partagée ; collés en haut au
défilement en laissant 58 px à la loupe ; glissement latéral par `useSwipeSteps` (`src/ui/nav/swipe.ts`, même règle que
les onglets d'espace) ; contenu qui entre du côté d'où il vient (`--t-med`, `--ease`), coupé si `prefers-reduced-motion`.
Point rouge `.me-dot` sur un onglet ou une ligne = quelque chose à compléter.

### Coach 3D (composant signature)

`src/three/CoachStage.tsx` et `PhotoCoach.tsx`. Règles obligatoires dans `docs/HUMAN_CHARACTER_STANDARDS.md` :
**Impeccable ne doit jamais modifier les coachs, leurs visages, tenues, animations ni le moteur 3D.**

## Do's and Don'ts

### Do:

- Garder le coach grand et dégagé ; montrer seulement le mouvement en cours pendant la séance.
- Textes courts, simples, en français, pour débutants.
- Respecter `prefers-reduced-motion` ; transitions courtes (140–220 ms, `--ease: cubic-bezier(.2,.7,.2,1)`).
- Contraste WCAG AA dans les deux thèmes ; tester clair, sombre et automatique.
- Ressources libres seulement (CC0 ou MIT).

### Don't:

- Pas de faux boutons de connexion, de statistiques ou de témoignages inventés.
- Pas de nouvelle couleur d'accent, pas de dégradé violet, pas de texte en dégradé.
- Pas d'images tierces ni d'assets achetés ou CC-BY.
- Ne pas toucher à la technique, au rig ni aux visages des coachs à l'occasion d'un travail d'interface.
