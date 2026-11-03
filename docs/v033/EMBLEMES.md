# v0.33 — Emblèmes des six disciplines

Chaque discipline est représentée par un seul objet sportif, décliné en trois variantes. Toutes sont des créations
originales du projet. Aucune image, aucun modèle 3D et aucune icône extérieurs n'ont été utilisés.

| Discipline | Objet |
| --- | --- |
| Boxe anglaise | paire de gants rouges, poignets noirs à bandes blanches |
| Kick-boxing | paire de protège-tibias graphite à bande rouge |
| MMA | gant à doigts ouverts noir, sangle rouge |
| Muay-thaï | mongkhon tressé or, liens rouges |
| Jiu-jitsu brésilien | ceinture noire nouée, barrette rouge |
| Judo | judogi blanc plié, col croisé, ceinture noire nouée |

Planche de comparaison (3 variantes × 4 tailles, en clair et en sombre) : https://claude.ai/artifact/8kxM3tUJsHyjRYzoMXpUfm

## Les trois variantes

| Variante | Source | Fichiers | Tailles | Usage |
| --- | --- | --- | --- | --- |
| **A · Détaillé 3D** | `tools/generator/emblems/render.py` (Blender) puis `export.py` | `public/emblems/<id>-{64,128,256}.webp`, transparents | 64 à 128 px | cartes Disciplines d'Entraîner (72 px) |
| **B · Semi-plat** | `src/ui/icons/disciplines.tsx` (SVG, dégradés, lumière en haut à gauche) | dans le code | 32 à 128 px | programmes, listes, accueil, techniques, légendes |
| **C · Contour** | `src/ui/emblems/outline.tsx` (SVG 24 × 24, trait 1,75, `currentColor`) | dans le code | 24 et 32 px | puces de filtre, petites listes |

Le registre central est `src/ui/emblems/registry.ts` (`EMBLEMS`). Il donne pour chaque discipline :

- l'identifiant stable ;
- le nom ;
- la description pour les lecteurs d'écran ;
- les fichiers du rendu détaillé.

Le composant `DisciplineEmblem` affiche une variante. Il la choisit d'après la taille si on ne la précise pas :
détaillé à partir de 64 px, semi-plat à partir de 32 px, contour en dessous. Si le fichier WebP ne charge pas, le
composant affiche la variante semi-plate, jamais une image cassée.

## Charte

- **Palette** (celle de l'application) :
  - rouge `#B30C25`, rouge profond `#8E0C1F` ;
  - noir `#16181C`, graphite `#2A2E35` ;
  - blanc coton `#F2F2EF` ;
  - or `#A8741A` (métal 0,7).
  - Les variantes vectorielles reprennent les tokens `#E11D2F`, `#0B0F14`, `#D4AF37` et `#F4F4F5`.
- **Matières** (shaders procéduraux, sans texture importée) :
  - cuir : vernis 0,45, grain léger ;
  - tissu : tissage, avec l'éclat propre au tissu ;
  - ceinture : piqûres longitudinales ;
  - tresse : trois brins enroulés.
- **Éclairage** : le même studio pour les six emblèmes.
  - clé chaude en haut à droite, contre-jour froid, débouchage doux, lumière zénithale ;
  - rendu AgX contraste de base, exposition −0,35 ;
  - fond transparent avec ombre de contact seulement.
- **Cadrage** : caméra 70 mm, vue de trois quarts légèrement plongeante. L'objet est mis à l'échelle sur 2,3 unités et posé au sol.
- **Nommage** : `<id>-<taille>.webp`, l'identifiant étant celui de la discipline (`boxe`, `kickboxing`, `mma`, `muaythai`, `bjj`, `judo`).

## Export

```
python3 tools/generator/emblems/render.py OUT --size 512 --samples 96   # ≈ 3 min pour les six, CPU
python3 tools/generator/emblems/export.py OUT                            # recadre, centre, WebP 256/128/64
```

`export.py` procède en trois étapes :

1. il recadre chaque objet en gardant son ombre ;
2. il le centre sur un carré, avec une marge de 6 % ;
3. il exporte en WebP qualité 88 avec transparence.

Budget par fichier, vérifié par test : 4 Ko (64 px), 8 Ko (128 px), 20 Ko (256 px). Les 18 fichiers pèsent 114 Ko
en tout. Ils entrent dans le cache hors ligne de l'application (motif `**/*.webp` du service worker).

## Ajouter une discipline

1. Ajouter la discipline dans `src/domain/types.ts`.
2. Écrire son objet `build_<id>` dans `render.py`, l'ajouter à `BUILD` et à `IDS` de `render.py` et `export.py`.
3. Lancer le rendu puis l'export.
4. Dessiner sa variante semi-plate dans `src/ui/icons/disciplines.tsx` (`full` et `compact`) et sa description dans `DISCIPLINE_ICON_ALT`.
5. Dessiner son contour dans `src/ui/emblems/outline.tsx`.
6. Lancer `npx vitest run src/ui/emblems` : le test échoue tant qu'une variante, un fichier ou une taille manque.

## Tests

- `src/ui/emblems/__tests__/emblems.test.tsx` :
  - une entrée par discipline ;
  - WebP carrés, transparents, aux bonnes dimensions et dans le budget ;
  - contours sans couleur fixe ;
  - 3 variantes × 4 tailles ;
  - choix automatique de la variante ;
  - accessibilité.
- `tests/e2e/emblems.spec.ts` :
  - thèmes clair et sombre : 6 emblèmes chargés, 72 px, carrés, dans leur carte ;
  - contours de la même couleur que le texte de leur puce ;
  - affichage hors ligne après installation.
- `tests/e2e/discipline-art.spec.ts` : accepte maintenant l'emblème détaillé comme image officielle. Il vérifie que l'image vient du registre, qu'elle est chargée et qu'elle est carrée.

## Niveau de réalisme

Les rendus sont des objets 3D stylisés et propres, construits à partir de formes et de matières procédurales. Ce ne
sont pas des photos. Le grain du cuir, les coutures et les plis restent simplifiés. Le judogi est montré plié, pour
rester lisible petit. Les variantes vectorielles de la branche `design/premium-discipline-emblems` étaient des
« propositions simplifiées ». Elles ne sont pas reprises telles quelles : les variantes B et C ci-dessus suivent les
mêmes objets que les rendus 3D.
