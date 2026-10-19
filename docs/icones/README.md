# Bibliothèque d’icônes officielle

Charte graphique du 19 octobre 2026 (planche de référence de l’éditeur, enregistrée hors dépôt dans
`maquettes/planche-icones.png` des fichiers du projet). La planche sert de référence de style : **aucune icône n’en est
découpée**. Toutes les icônes ont été redessinées en SVG original dans ce dépôt.

## Référentiel central

| Élément | Fichier | Rôle |
|---|---|---|
| `AppIcon` | `src/ui/icons/AppIcon.tsx` | composant unique de toutes les icônes d’interface |
| `NavigationIcon`, `ActionIcon`, `TrainingControlIcon`, `StatusIcon` | idem | même composant, limité aux icônes d’une famille, avec la taille par défaut de cet usage |
| `DisciplineIcon` | idem | icône officielle d’une discipline (objet sportif), version détaillée dès 40 px, compacte en dessous |
| `LevelIcon` | idem | niveau en 4 barres montantes, autant de barres pleines que le rang |
| Dessins d’interface | `src/ui/icons/glyphs.tsx` | 98 pochoirs sur une grille de 24 px |
| Dessins des disciplines | `src/ui/icons/disciplines.tsx` | 6 objets sur une grille de 64 px |
| Registre | `src/ui/icons/registry.ts` | identifiant stable → famille et nom français |
| Couleurs et états | `src/ui/icons/icons.css`, jetons de `src/ui/styles.css` | |
| Inventaire des emplacements | [INVENTAIRE.md](INVENTAIRE.md) | généré depuis le code : `node scripts/icon-inventory.mjs` |
| Planche de contrôle | `tools/icon-lab/` | toutes les icônes, toutes les tailles, thème sombre et clair (outil de développement, non livré) |

Les écrans n’ont plus aucun chemin d’image d’icône ni dessin SVG local : ils appellent `AppIcon id="…"` ou
`DisciplineIcon id="…"`. Changer un dessin se fait à un seul endroit.

## Règles de la charte

- Palette : fond `#0B0F14`, surfaces `#1F2937`, accent `#E11D2F` (actions importantes, sélection active, marque),
  accent secondaire `#D4AF37` (distinctions, maîtrise), texte `#F4F4F5`, texte secondaire `#9CA3AF`.
- Icônes inactives neutres (gris), active en rouge (barre de navigation, onglets), or réservé aux distinctions.
- Relief léger identique pour toutes les icônes : lumière en haut, ombre douce en bas, pas d’ombre portée marquée.
- Jamais la couleur seule : chaque icône a un libellé visible ou un `aria-label` ; les niveaux se lisent au nombre
  de barres ; les statuts ont une icône différente et leur nom.
- Tailles : 24 px navigation et actions compactes, 32 accès rapides, 48 menus secondaires (tuiles), 64 cartes,
  76 à 104 cartes de discipline. Le dessin est vectoriel, jamais déformé (boîte carrée).
- États : normal (neutre), actif et sélectionné (rouge), désactivé (opacité du bouton), focus (contour du bouton,
  inchangé). L’état est porté par le composant (bouton, onglet), l’icône suit sa couleur.
- Ni émoji, ni symbole texte (★, ✕) : vérifié par un test.

## Icônes de discipline

| Discipline | Objet |
|---|---|
| Boxe anglaise | gant de boxe |
| Kick-boxing | protège-tibia et pied |
| MMA | gant à doigts ouverts |
| Muay-thaï | mongkol (bandeau cérémoniel tressé) |
| Jiu-jitsu brésilien | ceinture noire nouée, barrette rouge |
| Judo | judogi blanc et ceinture noire |

Elles remplacent les médaillons de combattants dans les onglets, les filtres, les étiquettes et les cartes de
discipline. L’illustration de combattant reste seulement en bannière de la page d’une discipline (4 disciplines sur 6
en ont une).

## Licences

Aucune ressource externe : toutes les icônes sont des créations originales de ce dépôt (même licence que
l’application). Aucune police d’icônes, aucun téléchargement, aucun coût. Les icônes sont dans le code JavaScript :
elles fonctionnent hors ligne et dans l’APK sans fichier supplémentaire.

## Fonctions absentes de l’application

Dessinées et prêtes, mais **affichées nulle part** car la fonction n’existe pas (aucun écran ajouté pour placer une
icône) : Défis, Notifications, Abonnement, Premium, Gratuit, Verrouillé, Téléchargé, Partager. Elles sont marquées
« réservé » dans le registre.
