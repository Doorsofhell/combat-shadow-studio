# Visuels studio

Demande de Youssef (2026-10-28) : des images façon photo de salle de boxe pour toute l'application, « ambiance par
discipline, génération automatique en une fois (partout, même l'encyclopédie), mais prévoir de régénérer à la demande.
Attention, les positions doivent être humaines et réalistes ». Exemples validés avant le lot :
https://claude.ai/artifact/3MBXcyKTaEeLuL3Qe7NALH

Ce ne sont pas des photos ni des images d'IA générative : ce sont nos coachs 3D (Kadir, Amara), posés par le moteur
de l'application au moment clé de chaque technique, puis placés dans une salle sombre dessinée par le code. Aucune
image externe n'est utilisée, tout est libre de droits (voir `docs/LICENCES.md`).

## Ce qui est produit

| Famille | Fichiers | Nombre | Taille |
| --- | --- | --- | --- |
| Vignettes des techniques (cartes, listes, programmes) | `public/thumbs/{homme,femme}/<technique>.webp` | 2 × 91 | 240 × 300 |
| Illustrations de l'encyclopédie (trois instants, ou un plan rapproché) | `public/encyclopedie/<id>.webp` et `-mini.webp` | 56 | 720 × 400 et 160 × 160 |
| Objets et lieux de l'encyclopédie (gants, kimono, ring, cage…) | `public/encyclopedie/<id>.webp` et `-mini.webp` | 11 | 720 × 400 et 160 × 160 |
| Visuels officiels des disciplines (dont JJB et judo, qui n'en avaient pas) | `public/art/disciplines/<id>-600.webp` et `-240.webp` | 6 | 600 × 760 et 240 × 304 |
| Portraits de « Choisis ton coach » | `public/coaches/mma-{kadir,amara}/portrait.webp` | 2 | 900 × 1200 |

## Ambiance par discipline

Réglées dans `scripts/visuels/ambiances.json` (couleurs de la salle, de la fumée et de la lumière principale).

| Discipline | Ambiance |
| --- | --- |
| Boxe anglaise | Bleu nuit |
| Kick-boxing | Ambre |
| Muay-thaï | Rouge |
| MMA | Acier |
| Judo | Bois chaud |
| JJB | Indigo |

Une technique commune à plusieurs disciplines prend l'ambiance et la tenue de sa première discipline (comme dans
l'application), sauf indication contraire dans `poses.json`.

## Régénérer

```sh
npm run visuels                              # tout (environ 2 h sur un processeur sans carte graphique)
npm run visuels -- --only thumbs,art         # une ou plusieurs familles : thumbs, ency, art, portraits, scenes
npm run visuels -- --id jab,tech-jab,boxe    # quelques images : technique, id d'encyclopédie, discipline…
npm run visuels -- --force                   # refaire les rendus 3D (coachs ou mouvements modifiés)
npm run visuels -- --recompose               # seulement réappliquer les ambiances, sans nouveau rendu (quelques minutes)
```

Les rendus 3D sont gardés dans `.cache/visuels` (hors dépôt) : changer une ambiance ne demande pas de refaire les
rendus. Les objets et lieux sont rendus par Blender (`scripts/encyclopedie/scenes.py`, `pip install bpy`).

## Comment c'est fait

1. **Rendu** (`scripts/visuels/generate.mjs`) : la vue Lab de l'application, sur un serveur Vite lancé par le script,
   avec `mood=1` (lumière de studio sombre : une lumière dure et chaude en haut à droite, deux contre-jours bleutés,
   presque pas de lumière ambiante, pas d'ombre au sol) et `alpha=1` (fond transparent). La pose est l'animation de
   l'application au moment clé de la technique, sous son angle pédagogique.
2. **Composition** (`scripts/visuels/compose.py`) : salle sombre (sacs de frappe et lampes flous, cône de lumière,
   fumée, reflet au sol), ombre de contact, coach adouci comme par un objectif et assombri vers les pieds, halo,
   étalonnage (ombres froides, hautes lumières chaudes), vignettage et grain. Le résultat ne dépend que des rendus et
   de l'identifiant de l'image : régénérer donne le même fichier.
3. **Contrôle des poses** : chaque rendu est regardé sur une planche (`scripts/visuels/planche.py`). Une pose qui ne
   fait pas humaine est corrigée dans `scripts/visuels/poses.json` (instant `at`, angle `az`, discipline `d`), pour
   une technique ou pour un seul coach (`technique@femme`). Le compte rendu est dans `CONTROLE_POSES.md`.
